import { INITIAL_TAG_DATA } from '../data/sampleData';

const STORAGE_KEY = 'KHMER_TAG_SYSTEM_DATA_V1';

/**
 * Load tags from localStorage or initialize with 1,000 sample tags
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
