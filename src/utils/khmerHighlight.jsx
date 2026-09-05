import React from 'react';

// Khmer diacritics, signs, and invisible formatting characters
// \u17C6-\u17D1\u17D3 : Khmer signs, accents, shifters (Muusikatoan, Treisap, Bantoc, Robat, Toandakhiat, etc.)
// \u200B-\u200D : Zero-width space, ZWNJ, ZWJ
const KHMER_DIACRITICS_REGEX = '[\\u17C6-\\u17D1\\u17D3\\u200B\\u200C\\u200D]*';

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
      if (/[\u17C6-\u17D1\u17D3\u200B\u200C\u200D]/.test(ch)) {
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

  return new RegExp('(' + patterns.join('|') + ')', 'gi');
}

/**
 * Highlights matched query characters in Khmer text using a distinct pure color.
 * Uses index % 2 === 1 to reliably pick matched segments from String.prototype.split.
 */
export function highlightKhmerText(text, query, highlightClassName = 'text-cyan-300 font-black') {
  if (!text) return null;
  if (!query || !query.trim()) return text;

  const regex = buildKhmerHighlightRegex(query);
  if (!regex) return text;

  const parts = text.split(regex);
  if (parts.length <= 1) return text;

  return parts.map((part, index) => {
    if (!part) return null;
    const isMatch = index % 2 === 1;
    if (isMatch) {
      return (
        <span key={index} className={highlightClassName}>
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}
