import { INITIAL_TAG_DATA } from '../data/sampleData';

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
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading tags from localStorage:', err);
  }

  // Return empty tag array by default
  return [];
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

const USERS_STORAGE_KEY = 'KHMER_TAG_SYSTEM_USERS_V1';
const CURRENT_USER_KEY = 'KHMER_TAG_SYSTEM_CURRENT_USER_V1';

export const GUEST_USER = {
  id: 'u-guest',
  name: 'អ្នកមើលធម្មតា (Guest)',
  role: 'guest',
  email: '',
  phone: '',
  pin: ''
};

export const DEFAULT_USERS = [
  { id: 'u-owner', name: 'លោកប្រធាន (Owner)', email: 'thonvisal12@gmail.com', role: 'owner', phone: '012345678', pin: '123' },
  { id: 'u-admin', name: 'អ្នកគ្រប់គ្រង (Admin)', email: 'admin@gmail.com', role: 'admin', phone: '098765432', pin: '123' },
  { id: 'u-assistant', name: 'អ្នកជំនួយការ (Assistant)', email: 'assistant@gmail.com', role: 'assistant', phone: '011223344', pin: '123' },
  { id: 'u-assistant2', name: 'អ្នកជំនួយការ (Assistion)', email: 'assistion@gmail.com', role: 'assistant', phone: '011223344', pin: '123' }
];

export function getSavedUsers() {
  try {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading users:', err);
  }
  saveUsers(DEFAULT_USERS);
  return DEFAULT_USERS;
}

export function saveUsers(users) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Error saving users:', err);
  }
}

export function getCurrentUser() {
  try {
    const saved = localStorage.getItem(CURRENT_USER_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.id) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading current user:', err);
  }
  saveCurrentUser(GUEST_USER);
  return GUEST_USER;
}

export function saveCurrentUser(user) {
  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Error saving current user:', err);
  }
}



