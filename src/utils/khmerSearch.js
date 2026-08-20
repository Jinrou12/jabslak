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
 * Groups list of individual tag objects by person name (+ phone if available).
 * Preserves all underlying original tag objects inside item.tags array.
 */
export function groupTagsByName(tagList) {
  if (!tagList || !Array.isArray(tagList)) return [];

  const map = new Map();

  for (const tag of tagList) {
    const cleanName = (tag.name || '').trim();
    const cleanPhone = (tag.phone || '').replaceAll('-', '').replaceAll(' ', '').trim();

    // Grouping key: name (lowercased) + phone
    // If name is empty, keep single tag so unnamed tags are not grouped together
    const key = cleanName ? `${cleanName.toLowerCase()}___${cleanPhone}` : `_single_${tag.id}`;

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

    const arrivedCount = groupItems.filter((t) => !!t.arrived).length;
    const isAllArrived = arrivedCount === groupItems.length;
    const isAnyArrived = arrivedCount > 0;

    grouped.push({
      ...firstTag,
      id: groupItems.length > 1 ? `group-${firstTag.id}-${groupItems.length}` : firstTag.id,
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
  const normalizedQuery = khmerToWesternDigits(rawQuery).toLowerCase();

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
    const itemNameLower = (item.name || '').toLowerCase();
    const itemLocLower = (item.location || '').toLowerCase();
    const itemNotesLower = (item.notes || '').toLowerCase();
    const itemPhoneClean = (item.phone || '').replaceAll('-', '').replaceAll(' ', '');

    // Check if any tag number in group matches
    const hasMatchingTagNumber = item.tagNumbers?.some((tn) => {
      const tnStr = String(tn);
      const tnWestern = khmerToWesternDigits(tnStr);
      return tnStr === normalizedQuery || tnWestern === normalizedQuery || tnStr.startsWith(normalizedQuery) || tnWestern.startsWith(normalizedQuery);
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

    const isNameStartsWith = itemNameLower.startsWith(normalizedQuery);
    const isNameIncludes = itemNameLower.includes(normalizedQuery);
    const isLocIncludes = itemLocLower.includes(normalizedQuery);
    const isPhoneIncludes = itemPhoneClean.includes(normalizedQuery);
    const isNotesIncludes = itemNotesLower.includes(normalizedQuery);

    if (isExactTagMatch || isTagStartsWith || isTagIncludes || isNameIncludes || isLocIncludes || isPhoneIncludes || isNotesIncludes) {
      let score = 100;

      if (isExactTagMatch) {
        score = 0;
      } else if (isTagStartsWith) {
        score = 1;
      } else if (isTagIncludes) {
        score = 2;
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

