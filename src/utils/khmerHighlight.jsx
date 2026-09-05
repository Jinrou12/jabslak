import React from 'react';

// Khmer diacritics, signs, and invisible formatting characters
// \u17C6-\u17D1\u17D3 : Khmer signs, accents, shifters (Muusikatoan, Treisap, Bantoc, Robat, Toandakhiat, etc.)
// \u200B-\u200D : Zero-width space, ZWNJ, ZWJ
const KHMER_DIACRITICS_REGEX = '[\\u17C6-\\u17D1\\u17D3\\u200B-\\u200D]*';

// Fallback regex for Khmer grapheme cluster: base consonant (+ coeng subscript)* (+ diacritics/vowels)*
const KHMER_GRAPHEME_REGEX = /[\u1780-\u17B3](?:\u17D2[\u1780-\u17B3])*(?:[\u17B6-\u17D3\u200B-\u200D])*/g;

/**
 * Returns grapheme cluster boundaries so Khmer consonants and dependent vowels
 * are NEVER severed across HTML element boundaries (which prevents the dotted circle ◌ glitch).
 */
function getKhmerGraphemeSegments(text) {
  if (!text) return [];
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    try {
      const segmenter = new Intl.Segmenter('km', { granularity: 'grapheme' });
      return Array.from(segmenter.segment(text));
    } catch {}
  }

  const segments = [];
  let lastIdx = 0;
  let m;
  KHMER_GRAPHEME_REGEX.lastIndex = 0;
  while ((m = KHMER_GRAPHEME_REGEX.exec(text)) !== null) {
    if (m.index > lastIdx) {
      for (let i = lastIdx; i < m.index; i++) {
        segments.push({ segment: text[i], index: i });
      }
    }
    segments.push({ segment: m[0], index: m.index });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) {
    for (let i = lastIdx; i < text.length; i++) {
      segments.push({ segment: text[i], index: i });
    }
  }
  return segments;
}

/**
 * Builds a flexible RegExp for Khmer search queries:
 * - Inserts optional Khmer diacritics / shifters between consonants and vowels
 *   (e.g. searching "ស្រា" matches "ស្រ៊ា" in "ស្រ៊ាង")
 * - Handles sound-alike consonant equivalence:
 *   ប <-> ព, ន <-> ណ, ល <-> ឡ, ហ <-> អ
 * - Handles dual digit matching (Khmer ០-៩ <-> Western 0-9)
 */
export function buildKhmerHighlightRegex(query) {
  if (!query || !query.trim()) return null;
  const rawTerms = query.trim().split(/\s+/).filter(Boolean);
  if (rawTerms.length === 0) return null;

  // Deduplicate terms and sort longest first so longer sequences match before prefixes
  const terms = Array.from(new Set(rawTerms)).sort((a, b) => b.length - a.length);

  const patterns = terms.map((term) => {
    let p = '';
    for (let i = 0; i < term.length; i++) {
      const ch = term[i];
      if (/[\u17C6-\u17D1\u17D3\u200B-\u200D]/.test(ch)) {
        p += KHMER_DIACRITICS_REGEX;
      } else {
        let charClass;
        // Khmer sound-alike
        if (ch === '\u1794' || ch === '\u1796') charClass = '[\\u1794\\u1796]'; // ប <-> ព
        else if (ch === '\u1793' || ch === '\u178E') charClass = '[\\u1793\\u178E]'; // ន <-> ណ
        else if (ch === '\u179B' || ch === '\u17A1') charClass = '[\\u179B\\u17A1]'; // ល <-> ឡ
        else if (ch === '\u17A0' || ch === '\u17A2') charClass = '[\\u17A0\\u17A2]'; // ហ <-> អ
        // Support Khmer <-> Western digits
        else if (/[0-9]/.test(ch)) {
          const khmerDigit = String.fromCharCode(ch.charCodeAt(0) - 48 + 0x17E0);
          charClass = `[${ch}\\u${khmerDigit.charCodeAt(0).toString(16).padStart(4, '0')}]`;
        } else if (/[\u17E0-\u17E9]/.test(ch)) {
          const westernDigit = String.fromCharCode(ch.charCodeAt(0) - 0x17E0 + 48);
          charClass = `[${westernDigit}\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}]`;
        } else {
          charClass = '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0');
        }

        const isKhmer = /[\u1780-\u17D3]/.test(ch);
        p += (p.length > 0 && isKhmer ? KHMER_DIACRITICS_REGEX : '') + charClass;
      }
    }
    if (/[\u1780-\u17D3]/.test(term)) {
      p += KHMER_DIACRITICS_REGEX;
    }
    return p;
  });

  try {
    return new RegExp('(' + patterns.join('|') + ')', 'gi');
  } catch (err) {
    console.warn('Failed to build highlight regex:', query, err);
    return null;
  }
}

/**
 * Highlights matched query characters in Khmer text using a distinct pure color.
 * Crucially snaps match boundaries to whole Khmer grapheme clusters so that consonants
 * and their dependent vowels/shifters always remain together inside the same <span>,
 * completely preventing the ugly dotted circle ◌ (isolated combining mark) glitch!
 */
export function highlightKhmerText(text, query, highlightClassName = 'text-cyan-300 font-black') {
  if (!text) return null;
  if (!query || !query.trim()) return text;

  const regex = buildKhmerHighlightRegex(query);
  if (!regex) return text;

  // Find all raw match ranges
  const matchRanges = [];
  let match;
  regex.lastIndex = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match[0].length === 0) {
      regex.lastIndex++;
      continue;
    }
    matchRanges.push({ start: match.index, end: match.index + match[0].length });
  }

  if (matchRanges.length === 0) return text;

  // Snap to grapheme cluster boundaries so combining vowels & diacritics NEVER get severed
  const segments = getKhmerGraphemeSegments(text);
  const snappedRanges = matchRanges.map((range) => {
    let start = range.start;
    let end = range.end;

    for (const seg of segments) {
      const segStart = seg.index;
      const segEnd = seg.index + seg.segment.length;

      // If match starts inside this segment, snap start to beginning of segment
      if (range.start > segStart && range.start < segEnd) {
        start = segStart;
      }
      // If match ends inside this segment, snap end to end of segment
      if (range.end > segStart && range.end < segEnd) {
        end = segEnd;
      }
    }
    return { start, end };
  });

  // Merge overlapping or adjacent snapped ranges
  const mergedRanges = [];
  snappedRanges.sort((a, b) => a.start - b.start);
  for (const r of snappedRanges) {
    if (mergedRanges.length === 0) {
      mergedRanges.push({ ...r });
    } else {
      const prev = mergedRanges[mergedRanges.length - 1];
      if (r.start <= prev.end) {
        prev.end = Math.max(prev.end, r.end);
      } else {
        mergedRanges.push({ ...r });
      }
    }
  }

  // Slice text into non-matching and matching pieces
  const pieces = [];
  let currentIndex = 0;
  for (const r of mergedRanges) {
    if (r.start > currentIndex) {
      pieces.push({ text: text.slice(currentIndex, r.start), isMatch: false });
    }
    pieces.push({ text: text.slice(r.start, r.end), isMatch: true });
    currentIndex = r.end;
  }
  if (currentIndex < text.length) {
    pieces.push({ text: text.slice(currentIndex), isMatch: false });
  }

  return pieces.map((piece, index) => {
    if (piece.isMatch) {
      return (
        <span key={index} className={highlightClassName}>
          {piece.text}
        </span>
      );
    }
    return <span key={index}>{piece.text}</span>;
  });
}
