// Khmer & Western Digits Mapping
const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
const westernDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

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
 * Smart Relevance Search Algorithm:
 * - Exact Tag Number match (#200 or #២០០) appears at the VERY TOP (#1)
 * - Partial Tag Number matches follow
 * - Name matches follow
 * - Location / Phone matches follow
 */
export function searchTags(tagList, searchQuery, selectedLocation = 'ALL', attendanceFilter = 'ALL') {
  if (!tagList || !Array.isArray(tagList)) return [];

  const rawQuery = (searchQuery || '').trim();
  const normalizedQuery = khmerToWesternDigits(rawQuery).toLowerCase();

  // 1. Filter by location & attendance status
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

  if (!normalizedQuery) {
    // Default sort by tagNumber ascending
    return [...locationFiltered].sort((a, b) => Number(a.tagNumber) - Number(b.tagNumber));
  }

  // 2. Filter matching items & assign relevance score
  const matchedWithScore = [];

  for (const item of locationFiltered) {
    const itemTagStr = String(item.tagNumber || '');
    const itemTagWestern = khmerToWesternDigits(itemTagStr);
    const itemNameLower = (item.name || '').toLowerCase();
    const itemLocLower = (item.location || '').toLowerCase();
    const itemNotesLower = (item.notes || '').toLowerCase();
    const itemPhoneClean = (item.phone || '').replaceAll('-', '').replaceAll(' ', '');

    const isExactTagMatch = itemTagStr === normalizedQuery || itemTagWestern === normalizedQuery;
    const isTagStartsWith = itemTagStr.startsWith(normalizedQuery) || itemTagWestern.startsWith(normalizedQuery);
    const isTagIncludes = itemTagStr.includes(normalizedQuery) || itemTagWestern.includes(normalizedQuery);

    const isNameStartsWith = itemNameLower.startsWith(normalizedQuery);
    const isNameIncludes = itemNameLower.includes(normalizedQuery);
    const isLocIncludes = itemLocLower.includes(normalizedQuery);
    const isPhoneIncludes = itemPhoneClean.includes(normalizedQuery);
    const isNotesIncludes = itemNotesLower.includes(normalizedQuery);

    if (isExactTagMatch || isTagIncludes || isNameIncludes || isLocIncludes || isPhoneIncludes || isNotesIncludes) {
      let score = 100;

      if (isExactTagMatch) {
        score = 0; // Top #1 Priority! Exact Tag match (e.g. #200)
      } else if (isTagStartsWith) {
        score = 1; // e.g. #2000...
      } else if (isTagIncludes) {
        score = 2; // e.g. #1200...
      } else if (isNameStartsWith) {
        score = 3;
      } else if (isNameIncludes) {
        score = 4;
      } else if (isLocIncludes) {
        score = 5;
      } else {
        score = 6;
      }

      matchedWithScore.push({ item, score });
    }
  }

  // 3. Sort by relevance score ascending (0 = exact match first), then tagNumber ascending
  matchedWithScore.sort((a, b) => {
    if (a.score !== b.score) {
      return a.score - b.score;
    }
    return Number(a.item.tagNumber) - Number(b.item.tagNumber);
  });

  return matchedWithScore.map((entry) => entry.item);
}
