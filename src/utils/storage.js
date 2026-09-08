
const STORAGE_KEY = 'KHMER_TAG_SYSTEM_DATA_V2';

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


const USERS_STORAGE_KEY = 'KHMER_TAG_SYSTEM_USERS_V1';
const CURRENT_USER_KEY = 'KHMER_TAG_SYSTEM_CURRENT_USER_V1';

export const GUEST_USER = {
  id: 'u-guest',
  name: 'អ្នកមើលធម្មតា (Guest)',
  role: 'guest',
  templeId: 'ALL',
  assignedZone: '',
  email: '',
  phone: '',
  pin: ''
};

export const DEFAULT_USERS = [
  { id: 'u-owner', name: 'លោកប្រធាន (Owner)', email: 'owner@gmail.com', altEmail: 'thonvisal12@gmail.com', role: 'owner', templeId: 'ALL', assignedZone: 'ALL', phone: '012345678', pin: '123' },
  { id: 'u-admin-zone1', name: 'ភិក្ខុអាន់ឃ្លី (Admin ផែន១)', email: 'annkle@gmail.com', role: 'admin', templeId: 'khemavan', assignedZone: 'ផែន១ ៖ ធម្មសភា', phone: '012999888', pin: '123' },
  { id: 'u-admin', name: 'អ្នកគ្រប់គ្រង (Admin - ខេមវ័ន)', email: 'admin@gmail.com', role: 'admin', templeId: 'khemavan', assignedZone: 'ALL', phone: '098765432', pin: '123' },
  { id: 'u-assistant', name: 'អ្នកជំនួយការ (Assistant - ខេមវ័ន)', email: 'assistant@gmail.com', role: 'assistant', templeId: 'khemavan', assignedZone: 'ALL', phone: '011223344', pin: '123' },
  { id: 'u-assistant2', name: 'អ្នកជំនួយការ (Assistion - ខេមវ័ន)', email: 'assistion@gmail.com', role: 'assistant', templeId: 'khemavan', assignedZone: 'ALL', phone: '011223344', pin: '123' }
];

export function getSavedUsers() {
  try {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let changed = false;
        const hasAnnkle = parsed.some((u) => u.email === 'annkle@gmail.com');
        let workingList = [...parsed];
        if (!hasAnnkle) {
          workingList.push({
            id: 'u-admin-zone1',
            name: 'ភិក្ខុអាន់ឃ្លី (Admin ផែន១)',
            email: 'annkle@gmail.com',
            role: 'admin',
            templeId: 'khemavan',
            assignedZone: 'ផែន១ ៖ ធម្មសភា',
            phone: '012999888',
            pin: '123'
          });
          changed = true;
        }

        const migrated = workingList.map((u) => {
          const updated = { ...u };
          if (!updated.assignedZone) {
            updated.assignedZone = updated.role === 'owner' ? 'ALL' : (updated.id === 'u-admin-zone1' || updated.email === 'annkle@gmail.com' ? 'ផែន១ ៖ ធម្មសភា' : 'ALL');
            changed = true;
          }
          if (updated.role === 'owner') {
            if (updated.email !== 'owner@gmail.com' || !updated.altEmail) {
              changed = true;
              updated.email = 'owner@gmail.com';
              updated.altEmail = updated.email && updated.email !== 'owner@gmail.com' ? updated.email : 'thonvisal12@gmail.com';
              updated.pin = updated.pin || '123';
            }
            if (updated.templeId !== 'ALL') {
              changed = true;
              updated.templeId = 'ALL';
            }
          } else {
            if (!updated.templeId) {
              changed = true;
              updated.templeId = 'khemavan';
            }
          }
          return updated;
        });
        if (changed) {
          saveUsers(migrated);
        }
        return migrated;
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

/**
 * Computes user's effective permissions for the current temple.
 * - Owner: always full Owner permissions everywhere ('ALL').
 * - Admin/Assistant: full permissions if templeId matches currentTempleId (or 'ALL');
 *   otherwise downgraded to 'guest' in foreign temples.
 */
export function getEffectiveUser(user, currentTempleId = 'khemavan') {
  if (!user || user.role === 'guest' || user.id === 'u-guest') {
    return { ...GUEST_USER, ...(user || {}) };
  }

  // Owner is global Super Admin
  if (user.role === 'owner' || user.templeId === 'ALL') {
    return {
      ...user,
      effectiveRole: user.role,
      isRestricted: false
    };
  }

  const assignedTempleId = user.templeId || 'khemavan';
  const isMatch = assignedTempleId === currentTempleId;

  if (isMatch) {
    return {
      ...user,
      effectiveRole: user.role,
      isRestricted: false
    };
  }

  // Foreign temple -> Downgrade to Guest (view-only)
  return {
    ...user,
    role: 'guest',
    effectiveRole: 'guest',
    originalRole: user.role,
    assignedTempleId: assignedTempleId,
    isRestricted: true
  };
}
