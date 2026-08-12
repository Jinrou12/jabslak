import { INITIAL_TAG_DATA, locationsList } from '../data/sampleData';
import { INITIAL_TEMPLE_LOCATIONS } from '../data/templeLocations';

const STORAGE_KEY = 'KHMER_TAG_SYSTEM_DATA_V2';
const OLD_STORAGE_KEY = 'KHMER_TAG_SYSTEM_DATA_V1';

/**
 * Load tags from localStorage or initialize with 1,000 sample tags using authentic temple locations
 */
export function getSavedTags() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Check old storage key and migrate if exists
    const oldSaved = localStorage.getItem(OLD_STORAGE_KEY);
    if (oldSaved) {
      const parsedOld = JSON.parse(oldSaved);
      if (Array.isArray(parsedOld) && parsedOld.length > 0) {
        // Upgrade locations if they contained old building names
        const migrated = parsedOld.map((item, idx) => {
          const locObj = INITIAL_TEMPLE_LOCATIONS[idx % INITIAL_TEMPLE_LOCATIONS.length];
          const hasOldLoc = item.location && (item.location.includes('អាគារ A') || item.location.includes('រោងទី') || item.location.includes('សាលាឆាន់ - ជួរ'));
          if (hasOldLoc) {
            const tableMatch = item.location.match(/\(តុ [^\)]+\)/);
            const tableStr = tableMatch ? ` ${tableMatch[0]}` : ` (តុ ${((idx % 25) + 1 < 10 ? '០' : '') + ((idx % 25) + 1)})`;
            return {
              ...item,
              baseLocation: locObj.name,
              templeLocationId: locObj.id,
              location: `${locObj.name}${tableStr}`
            };
          }
          return item;
        });
        saveTags(migrated);
        return migrated;
      }
    }
  } catch (err) {
    console.error('Error loading tags from localStorage:', err);
  }

  // Save initial 1,000 tags if empty
  saveTags(INITIAL_TAG_DATA);
  return INITIAL_TAG_DATA;
}

/**
 * Save array of tags to localStorage
 */
export function saveTags(tags) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
  } catch (err) {
    console.error('Error saving tags to localStorage:', err);
  }
}

/**
 * Reset data back to initial 1,000 sample tags
 */
export function resetToSampleData() {
  saveTags(INITIAL_TAG_DATA);
  return INITIAL_TAG_DATA;
}

/**
 * Clear all data
 */
export function clearAllTags() {
  saveTags([]);
  return [];
}
