// Khmer & Western Digits Mapping
const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
const westernDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Normalizes Khmer text for flawless search and grouping:
 * 1. Strips zero-width characters (ZWSP U+200B, ZWNJ U+200C, ZWJ U+200D, BOM U+FEFF, soft hyphen U+00AD)
 * 2. Normalizes non-breaking spaces (U+00A0) to standard spaces
 * 3. Canonicalizes Khmer Subscript (Coeng) & Shifter (Treisap U+17CA / Muusikatoan U+17C9) order:
 *    Whether typed as [Shifter][Coeng+Consonant] (e.g. ស៊្រាង) or [Coeng+Consonant][Shifter] (e.g. ស្រ៊ាង),
 *    they are canonicalized to the exact same Unicode sequence!
 * 4. Normalizes multiple whitespace to single space
 */
export function normalizeKhmer(str) {
  if (!str) return '';
  return String(str)
    // 1. Remove zero-width & invisible format characters
    .replace(/[\u200B\u200C\u200D\uFEFF\u00AD]/g, '')
    // 2. Normalize non-breaking spaces
    .replace(/\u00A0/g, ' ')
    // 3. Canonicalize Khmer Shifter (Muusikatoan \u17C9, Treisap \u17CA) + Coeng Subscripts (\u17D2 + Consonant):
    // Always reorder to: Coeng Subscript sequence followed by Shifter
    .replace(/([\u17C9\u17CA])((?:\u17D2[\u1780-\u17B3])+)/g, '$2$1')
    // 4. Collapse consecutive spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strips Khmer consonant shifters (Muusikatoan \u17C9, Treisap \u17CA)
 * to allow diacritic-tolerant fuzzy search fallback (e.g. "ស្រាង" matches "ស្រ៊ាង")
 */
export function stripKhmerDiacritics(str) {
  if (!str) return '';
  return normalizeKhmer(str).replace(/[\u17C9\u17CA]/g, '');
}

/**
 * Abbreviates specific Khmer honorifics for compact phone display:
 * 1. ឧបាសិកា -> ឧ.សិ
 * 2. ឧបាសក -> ឧ.ស
 * 3. ឯកឧត្តម -> ឯ.ឧ
 * Keeps all other titles (e.g. លោកជំទាវ, លោកស្រី, etc.) intact as requested.
 */
export function formatKhmerShortTitle(name) {
  if (!name) return '';
  return name
    .replace(/ឧបាសិកា\s*/g, 'ឧ.សិ ')
    .replace(/ឧបាសក\s*/g, 'ឧ.ស ')
    .replace(/ឯកឧត្តម\s*/g, 'ឯ.ឧ ')
    .trim();
}

/**
 * Common Khmer honorifics and titles to strip when extracting core names for matching
 */
export const KHMER_TITLES = [
  'ព្រះតេជព្រះគុណ', 'ព្រះគ្រូ', 'ភិក្ខុ', 'សាមណេរ',
  'ឧបាសិកា', 'ឧបាសក', 'ឯកឧត្តម',
  'ឧ.សិ', 'ឧ.ស', 'ឯ.ឧ',
  'លោកជំទាវ', 'លោកស្រី', 'អ្នកស្រី', 'កញ្ញា', 'លោកយាយ', 'លោកតា',
  'លោក', 'យាយ', 'តា', 'ពូ', 'មីង', 'ម៉ែ', 'ឪ', 'បង', 'ប្អូន'
];

/**
 * Strips Khmer honorific titles from a person's name to extract the core name
 * e.g. "ឧបាសិកា ប៊ិន ម៉ុម" -> "ប៊ិន ម៉ុម"
 * e.g. "លោក ពេជ្រ ផន" -> "ពេជ្រ ផន"
 */
export function stripKhmerTitles(name) {
  if (!name) return '';
  let clean = normalizeKhmer(name);
  for (const title of KHMER_TITLES) {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    clean = clean.replace(new RegExp(`^${escaped}\\s*`, 'g'), '');
    clean = clean.replace(new RegExp(`\\s+${escaped}\\s+`, 'g'), ' ');
  }
  return clean.trim();
}

/**
 * Converts Khmer text into a phonetic representation (sound-alike key)
 * that equates consonants, vowels, and rhymes with identical or near-identical pronunciation:
 * - ប៊ (\u1794\u17CA) <-> ព (\u1796) (e.g. ប៊ិន <-> ពិន, ប៊ុន <-> ពុន)
 * - ម៉ (\u1798\u17C9) <-> ម (\u1798)
 * - ុម (\u17BB\u1798) <-> ុំ (\u17BB\u17C6 or \u17C6) (e.g. ម៉ុម <-> មុំ <-> មុម <-> ម៉ុំ)
 * - ណ (\u178E) <-> ន (\u1793) (e.g. វណ្ណា <-> វ៉ាន់ណា)
 * - ឡ (\u17A1) <-> ល (\u179B) (e.g. ឡេង <-> លេង)
 * - ស៊ <-> ស (e.g. ស៊្រាង <-> ស្រាង)
 * - ហ៊ <-> ហ (e.g. ហ៊ាង <-> ហាង)
 * - ជ្រ <-> ជ (e.g. ពេជ្រ <-> ពេជ)
 * - ិ <-> ី (e.g. ពិន <-> ពីន)
 * - ុ <-> ូ
 * - ែ <-> ៃ
 */
export function toKhmerPhoneticKey(str) {
  if (!str) return '';
  let s = normalizeKhmer(str);

  // 1. Remove silent marker Tandakhat (\u17CD) and the letter bearing it (e.g. ទិត្យ -> ទិត)
  s = s.replace(/[\u1780-\u17B3]\u17CD/g, '');

  // 2. Sound-alike Rhymes: Om / Um sound
  // ម៉ុម, មុំ, មុម, ម៉ុំ -> §M_OM§
  s = s.replace(/\u1798\u17C9?[\u17BB]?\u17C6/g, '§M_OM§'); // មុំ, ម៉ុំ
  s = s.replace(/\u1798\u17C9?\u17BB\u1798/g, '§M_OM§');   // ម៉ុម, មុម

  // General consonant + [ុម|ុំ] -> $1§OM§
  s = s.replace(/([\u1780-\u17B3])\u17C9?[\u17BB]?\u17C6/g, '$1§OM§');
  s = s.replace(/([\u1780-\u17B3])\u17C9?\u17BB\u1798/g, '$1§OM§');

  // 3. Consonants with sound-alike equivalence:
  s = s.replace(/ប៊/g, 'ព'); // ប៊ (Bo) <-> ព (Po)
  s = s.replace(/ប៉/g, 'ប'); // ប៉ <-> ប
  s = s.replace(/ម៉/g, 'ម'); // ម៉ <-> ម
  s = s.replace(/ណ/g, 'ន'); // ណ <-> ន
  s = s.replace(/ឡ/g, 'ល'); // ឡ <-> ល
  s = s.replace(/ស៊/g, 'ស'); // ស៊ <-> ស
  s = s.replace(/ហ៊/g, 'ហ'); // ហ៊ <-> ហ
  s = s.replace(/យ៉/g, 'យ'); // យ៉ <-> យ
  s = s.replace(/វ៉/g, 'វ'); // វ៉ <-> វ
  s = s.replace(/រ៉/g, 'រ'); // រ៉ <-> រ

  // Subscript ្រ on ជ (ជ្រ <-> ជ, e.g. ពេជ្រ <-> ពេជ)
  s = s.replace(/ជ\u17D2រ/g, 'ជ');

  // 4. Vowels with equivalent sounds:
  s = s.replace(/\u17B7/g, '\u17B8'); // ិ <-> ី
  s = s.replace(/\u17BB/g, '\u17BC'); // ុ <-> ូ
  s = s.replace(/\u17C3/g, '\u17C2'); // ៃ <-> ែ

  // Remove remaining diacritics
  s = s.replace(/[\u17C6\u17C7\u17C8\u17C9\u17CA\u17CB\u17CC\u17CD\u17CE\u17CF\u17D0]/g, '');

  // Remove all spaces
  s = s.replace(/\s+/g, '');

  return s;
}

/**
 * Generates sound-alike recommendations for search queries.
 * Returns unique recommended names from existing tags that have phonetic similarity.
 */
export function getKhmerPhoneticSuggestions(tagList, searchQuery, maxSuggestions = 4) {
  if (!searchQuery || !tagList || !Array.isArray(tagList) || tagList.length === 0) return [];

  const rawQuery = searchQuery.trim();
  const qNorm = normalizeKhmer(rawQuery).toLowerCase();
  const qPhonetic = toKhmerPhoneticKey(rawQuery);
  const qPhoneticNoTitles = toKhmerPhoneticKey(stripKhmerTitles(rawQuery));

  if (!qPhonetic && !qPhoneticNoTitles) return [];

  const suggestions = [];
  const seenKeys = new Set();

  for (const item of tagList) {
    const rawName = item.name || '';
    const normName = normalizeKhmer(rawName).toLowerCase();
    const coreName = stripKhmerTitles(rawName);

    // Skip if identical to query text or already added
    const dedupeKey = (coreName || rawName).toLowerCase();
    if (normName === qNorm || seenKeys.has(dedupeKey)) {
      continue;
    }

    const itemPhonetic = toKhmerPhoneticKey(rawName);
    const itemCorePhonetic = toKhmerPhoneticKey(coreName);

    const isMatch =
      itemCorePhonetic === qPhonetic ||
      itemPhonetic === qPhonetic ||
      (qPhoneticNoTitles && itemCorePhonetic === qPhoneticNoTitles) ||
      (qPhonetic.length >= 3 && itemCorePhonetic.includes(qPhonetic)) ||
      (qPhoneticNoTitles && qPhoneticNoTitles.length >= 3 && itemCorePhonetic.includes(qPhoneticNoTitles));

    if (isMatch) {
      seenKeys.add(dedupeKey);
      const tagDisplay = item.tagNumberDisplay || westernToKhmerDigits(item.tagNumber);
      suggestions.push({
        name: rawName,
        coreName: coreName || rawName,
        tagNumber: item.tagNumber,
        tagNumberDisplay: tagDisplay,
        tags: item.tags || [item]
      });

      if (suggestions.length >= maxSuggestions) break;
    }
  }

  return suggestions;
}

/**
 * Converts Khmer digits to Western digits (e.g. "១២៣" -> "123")
 */
export function khmerToWesternDigits(str) {
  if (!str) return '';
  let result = String(str);
  for (let i = 0; i < 10; i++) {
    result = result.replaceAll(khmerDigits[i], westernDigits[i]);
  }
  return result;
}

/**
 * Converts Western digits to Khmer digits (e.g. "123" -> "១២៣")
 */
export function westernToKhmerDigits(num) {
  if (num === null || num === undefined || num === '') return '';
  let result = String(num);
  for (let i = 0; i < 10; i++) {
    result = result.replaceAll(westernDigits[i], khmerDigits[i]);
  }
  return result;
}

/**
 * Formats an array of tag numbers into contiguous ranges in Khmer digits.
 * e.g. [20, 21, 22] -> "២០-២២"
 * e.g. [70, 71, ..., 89] -> "៧០-៨៩"
 * e.g. [5, 6, 7, 10, 11] -> "៥-៧, ១០-១១"
 */
export function formatTagRanges(tagNumbers) {
  if (!tagNumbers || !Array.isArray(tagNumbers) || tagNumbers.length === 0) return '';

  const nums = Array.from(
    new Set(
      tagNumbers
        .map((n) => Number(khmerToWesternDigits(String(n || ''))))
        .filter((n) => !isNaN(n) && n > 0)
    )
  ).sort((a, b) => a - b);

  if (nums.length === 0) return '';

  const ranges = [];
  let start = nums[0];
  let prev = nums[0];

  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === prev + 1) {
      prev = nums[i];
    } else {
      if (start === prev) {
        ranges.push(westernToKhmerDigits(start));
      } else {
        ranges.push(`${westernToKhmerDigits(start)}-${westernToKhmerDigits(prev)}`);
      }
      start = nums[i];
      prev = nums[i];
    }
  }

  if (start === prev) {
    ranges.push(westernToKhmerDigits(start));
  } else {
    ranges.push(`${westernToKhmerDigits(start)}-${westernToKhmerDigits(prev)}`);
  }

  return ranges.join(', ');
}

/**
 * Groups list of individual tag objects by person name.
 * Merges phone numbers, locations, and notes if present in any of the tags.
 * Preserves all underlying original tag objects inside item.tags array.
 */
export function groupTagsByName(tagList) {
  if (!tagList || !Array.isArray(tagList)) return [];

  const map = new Map();

  for (const tag of tagList) {
    const cleanName = normalizeKhmer(tag.name || '');

    // Grouping key: normalized name (lowercased)
    // If name is empty, keep single tag so unnamed tags are not grouped together
    const key = cleanName ? cleanName.toLowerCase() : `_single_${tag.id}`;

    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(tag);
  }

  const grouped = [];

  for (const [key, groupItems] of map.entries()) {
    groupItems.sort((a, b) => {
      const na = Number(khmerToWesternDigits(String(a.tagNumber || 0)));
      const nb = Number(khmerToWesternDigits(String(b.tagNumber || 0)));
      return na - nb;
    });

    const firstTag = groupItems[0];
    const tagNumbers = groupItems.map((t) => t.tagNumber);
    const tagNumberDisplay = formatTagRanges(tagNumbers);

    // Pick best phone, location, notes from group if available
    const bestPhone = groupItems.find((t) => (t.phone || '').trim())?.phone || firstTag.phone || '';
    const bestLocation =
      groupItems.find(
        (t) =>
          t.location &&
          t.location !== 'មើលទីកន្លែង' &&
          t.location !== 'ទីតាំងមិនទាន់កំណត់' &&
          t.location !== 'មិនទាន់ដៅលើ Map'
      )?.location || firstTag.location;
    const bestNotes = groupItems.find((t) => (t.notes || '').trim())?.notes || firstTag.notes || '';

    const arrivedCount = groupItems.filter((t) => !!t.arrived).length;
    const isAllArrived = arrivedCount === groupItems.length;
    const isAnyArrived = arrivedCount > 0;

    grouped.push({
      ...firstTag,
      id: groupItems.length > 1 ? `group-${firstTag.id}-${groupItems.length}` : firstTag.id,
      phone: bestPhone,
      location: bestLocation,
      notes: bestNotes,
      tagNumber: firstTag.tagNumber,
      tagNumbers: tagNumbers,
      tagNumberDisplay: tagNumberDisplay,
      count: groupItems.length,
      arrived: isAllArrived,
      arrivedCount: arrivedCount,
      isPartialArrived: isAnyArrived && !isAllArrived,
      tags: groupItems
    });
  }

  grouped.sort((a, b) => {
    const na = Number(khmerToWesternDigits(String(a.tagNumber || 0)));
    const nb = Number(khmerToWesternDigits(String(b.tagNumber || 0)));
    return na - nb;
  });

  return grouped;
}

/**
 * Smart Relevance Search Algorithm with Grouped Tag support:
 * - Exact Tag Number match (#200 or #២០០ or range) appears at top
 * - Partial Tag Number matches follow
 * - Name matches follow
 * - Location / Phone matches follow
 */
export function searchTags(tagList, searchQuery, selectedLocation = 'ALL', attendanceFilter = 'ALL') {
  if (!tagList || !Array.isArray(tagList)) return [];

  // 1. Filter raw tags by location & attendance status
  const locationFiltered = tagList.filter((item) => {
    if (selectedLocation !== 'ALL' && item.location !== selectedLocation) {
      return false;
    }
    if (attendanceFilter === 'notArrived' && item.arrived) {
      return false;
    }
    if (attendanceFilter === 'arrived' && !item.arrived) {
      return false;
    }
    return true;
  });

  // 2. Group filtered tags by person name
  const groupedList = groupTagsByName(locationFiltered);

  const rawQuery = (searchQuery || '').trim();
  const normalizedQuery = normalizeKhmer(khmerToWesternDigits(rawQuery)).toLowerCase();
  const queryNoSpaces = normalizedQuery.replace(/\s+/g, '');
  const queryNoDiacritics = stripKhmerDiacritics(normalizedQuery);
  const queryNoDiacriticsNoSpaces = queryNoDiacritics.replace(/\s+/g, '');

  const queryPhonetic = toKhmerPhoneticKey(rawQuery);
  const queryPhoneticNoTitles = toKhmerPhoneticKey(stripKhmerTitles(rawQuery));

  if (!normalizedQuery) {
    return groupedList;
  }

  // 3. Search within grouped tags
  const matchedWithScore = [];

  for (const item of groupedList) {
    const itemTagStr = String(item.tagNumber || '');
    const itemTagWestern = khmerToWesternDigits(itemTagStr);
    const itemDisplayWestern = khmerToWesternDigits(item.tagNumberDisplay || '');
    const itemDisplayLower = (item.tagNumberDisplay || '').toLowerCase();

    // Normalized Khmer fields
    const itemNameNormalized = normalizeKhmer(item.name || '').toLowerCase();
    const itemNameNoSpaces = itemNameNormalized.replace(/\s+/g, '');
    const itemNameNoDiacritics = stripKhmerDiacritics(itemNameNormalized);
    const itemNameNoDiacriticsNoSpaces = itemNameNoDiacritics.replace(/\s+/g, '');

    // Phonetic Khmer fields
    const itemCoreName = stripKhmerTitles(item.name || '');
    const itemPhonetic = toKhmerPhoneticKey(item.name || '');
    const itemCorePhonetic = toKhmerPhoneticKey(itemCoreName);

    const itemLocNormalized = normalizeKhmer(item.location || '').toLowerCase();
    const itemNotesNormalized = normalizeKhmer(item.notes || '').toLowerCase();
    const itemPhoneClean = (item.phone || '').replaceAll('-', '').replaceAll(' ', '');

    // Check if any tag number in group matches
    const hasMatchingTagNumber = item.tagNumbers?.some((tn) => {
      const tnStr = String(tn);
      const tnWestern = khmerToWesternDigits(tnStr);
      return (
        tnStr === normalizedQuery ||
        tnWestern === normalizedQuery ||
        tnStr.startsWith(normalizedQuery) ||
        tnWestern.startsWith(normalizedQuery)
      );
    });

    const isExactTagMatch =
      itemTagStr === normalizedQuery ||
      itemTagWestern === normalizedQuery ||
      itemDisplayWestern === normalizedQuery ||
      itemDisplayLower === rawQuery.toLowerCase();

    const isTagStartsWith =
      hasMatchingTagNumber ||
      itemTagStr.startsWith(normalizedQuery) ||
      itemTagWestern.startsWith(normalizedQuery) ||
      itemDisplayWestern.startsWith(normalizedQuery);

    const isTagIncludes =
      itemTagStr.includes(normalizedQuery) ||
      itemTagWestern.includes(normalizedQuery) ||
      itemDisplayWestern.includes(normalizedQuery);

    const itemShortName = formatKhmerShortTitle(tag.name || '');
    const itemShortNormalized = normalizeKhmer(itemShortName);
    const itemShortNoSpaces = stripSpaces(itemShortNormalized);

    // Name match (Exact / StartsWith / Includes / Space-insensitive / Diacritic-insensitive / Shortened title)
    const isNameExact =
      itemNameNormalized === normalizedQuery ||
      itemShortNormalized === normalizedQuery ||
      (queryNoSpaces && (itemNameNoSpaces === queryNoSpaces || itemShortNoSpaces === queryNoSpaces));

    const isNameStartsWith =
      itemNameNormalized.startsWith(normalizedQuery) ||
      itemShortNormalized.startsWith(normalizedQuery) ||
      (queryNoSpaces && (itemNameNoSpaces.startsWith(queryNoSpaces) || itemShortNoSpaces.startsWith(queryNoSpaces)));

    const isNameIncludes =
      itemNameNormalized.includes(normalizedQuery) ||
      itemShortNormalized.includes(normalizedQuery) ||
      (queryNoSpaces && (itemNameNoSpaces.includes(queryNoSpaces) || itemShortNoSpaces.includes(queryNoSpaces)));

    const isNameDiacriticMatch =
      Boolean(queryNoDiacriticsNoSpaces && (itemNameNoDiacriticsNoSpaces.includes(queryNoDiacriticsNoSpaces) || stripSpaces(removeDiacritics(itemShortNormalized)).includes(queryNoDiacriticsNoSpaces)));

    // Sound-alike / Phonetic match
    const isPhoneticExact = Boolean(
      queryPhonetic && (
        itemCorePhonetic === queryPhonetic ||
        itemPhonetic === queryPhonetic ||
        (queryPhoneticNoTitles && itemCorePhonetic === queryPhoneticNoTitles)
      )
    );

    const isPhoneticIncludes = Boolean(
      queryPhonetic && queryPhonetic.length >= 2 && (
        itemCorePhonetic.includes(queryPhonetic) ||
        itemPhonetic.includes(queryPhonetic) ||
        (queryPhoneticNoTitles && queryPhoneticNoTitles.length >= 2 && itemCorePhonetic.includes(queryPhoneticNoTitles))
      )
    );

    const isLocIncludes = itemLocNormalized.includes(normalizedQuery);
    const isPhoneIncludes = itemPhoneClean.includes(normalizedQuery);
    const isNotesIncludes = itemNotesNormalized.includes(normalizedQuery);

    if (
      isExactTagMatch ||
      isTagStartsWith ||
      isTagIncludes ||
      isNameExact ||
      isNameStartsWith ||
      isNameIncludes ||
      isPhoneticExact ||
      isNameDiacriticMatch ||
      isPhoneticIncludes ||
      isLocIncludes ||
      isPhoneIncludes ||
      isNotesIncludes
    ) {
      let score = 100;

      if (isExactTagMatch) {
        score = 0;
      } else if (isNameExact) {
        score = 1;
      } else if (isTagStartsWith) {
        score = 2;
      } else if (isTagIncludes) {
        score = 3;
      } else if (isNameStartsWith) {
        score = 4;
      } else if (isNameIncludes) {
        score = 5;
      } else if (isPhoneticExact) {
        score = 6;
      } else if (isNameDiacriticMatch) {
        score = 7;
      } else if (isPhoneticIncludes) {
        score = 8;
      } else if (isLocIncludes) {
        score = 9;
      } else if (isPhoneIncludes) {
        score = 10;
      } else {
        score = 11;
      }

      const isPhoneticOnly =
        !isExactTagMatch &&
        !isNameExact &&
        !isNameStartsWith &&
        !isNameIncludes &&
        (isPhoneticExact || isPhoneticIncludes);

      matchedWithScore.push({
        item: {
          ...item,
          isPhoneticMatch: isPhoneticOnly,
          matchedCoreName: itemCoreName
        },
        score
      });
    }
  }

  matchedWithScore.sort((a, b) => {
    if (a.score !== b.score) {
      return a.score - b.score;
    }
    const na = Number(khmerToWesternDigits(String(a.item.tagNumber || 0)));
    const nb = Number(khmerToWesternDigits(String(b.item.tagNumber || 0)));
    return na - nb;
  });

  return matchedWithScore.map((entry) => entry.item);
}

