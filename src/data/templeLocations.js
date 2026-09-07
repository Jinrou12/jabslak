// 21 Authentic Temple Locations with Exact Accurate Coordinates
export const INITIAL_TEMPLE_LOCATIONS = [
  { id: "១",  name: "ធម្មសាលាសភា",                  x: 16.15, y: 44.31, type: "building", pos: "R", category: "ផែន១ ៖ ធម្មសភា" },
  { id: "២",  name: "មហាកុដិ",                       x: 18.84, y: 53.83, type: "building", pos: "R", category: "ផែន៧ ៖ តាមកុដិ" },
  { id: "៣",  name: "កុដិសាឡុម",                     x: 14.70, y: 69.67, type: "building", pos: "R", category: "ផែន៧ ៖ តាមកុដិ" },
  { id: "៤",  name: "កុដិតូច",                       x: 4.45,  y: 35.40, type: "building", pos: "R", category: "ផែន៧ ៖ តាមកុដិ" },
  { id: "៥",  name: "កុដិថ្មី",                      x: 16.25, y: 26.81, type: "building", pos: "L", category: "ផែន៧ ៖ តាមកុដិ" },
  { id: "៦",  name: "កុដិគ្រូធំ",                   x: 24.33, y: 26.81, type: "building", pos: "R", category: "ផែន៧ ៖ តាមកុដិ" },
  { id: "៧",  name: "ព្រះវិហារ",                     x: 37.47, y: 54.24, type: "building", pos: "R", category: "ផែន៤ ៖ ព្រះបរិនិព្វាន" },
  { id: "៨",  name: "ដើមពោធិព្រឹក្ស",               x: 36.02, y: 65.84, type: "building", pos: "R", category: "ផែន៤ ៖ ព្រះបរិនិព្វាន" },
  { id: "៩",  name: "បណ្ណាល័យ",                     x: 58.80, y: 54.14, type: "building", pos: "R", category: "ផែន៥ ៖ បណ្ណាល័យ" },
  { id: "១០", name: "ពុទ្ធកបឋមសិក្សាកម្រងហ៊ុនណេង", x: 58.49, y: 44.51, type: "building", pos: "R", category: "ផែន៨ ៖ សាលារៀន" },
  { id: "១១", name: "កុដិយាយតា",                    x: 43.58, y: 26.71, type: "building", pos: "R", category: "ផែន៧ ៖ តាមកុដិ" },
  { id: "១២", name: "ប៉ុស្តិ៍វិទ្យុ",                 x: 54.14, y: 21.64, type: "building", pos: "L", category: "ផែន៨ ៖ សាលារៀន" },
  { id: "១៣", name: "អាងទឹក",                       x: 66.25, y: 29.30, type: "building", pos: "R", category: "🏢 ក្រុមអគារ និង កុដិ" },
  { id: "១៤", name: "អាងទឹកវិទ្យុ",                x: 62.42, y: 18.94, type: "building", pos: "R", category: "🏢 ក្រុមអគារ និង កុដិ" },
  { id: "១៥", name: "ព្រះផ្ទំ",                      x: 64.91, y: 36.34, type: "building", pos: "R", category: "ផែន៦ ៖ ព្រះផ្ទម" },
  { id: "១៦", name: "ចេតិយនគរភ្នំ ចាយ ស៊ាងអ៊ី",        x: 53.21, y: 78.57, type: "building", pos: "R", category: "🏢 ក្រុមអគារ និង កុដិ" },
  { id: "A",  name: "ខ្លោងទ្វារទី១",               x: 76.60, y: 6.31,  type: "gate",     pos: "L", category: "⛩️ ក្រុមខ្លោងទ្វារវត្ត" },
  { id: "B",  name: "ខ្លោងទ្វារទី២",               x: 28.78, y: 19.25, type: "gate",     pos: "R", category: "⛩️ ក្រុមខ្លោងទ្វារវត្ត" },
  { id: "C",  name: "ខ្លោងទ្វារទី៣",               x: 93.89, y: 55.49, type: "gate",     pos: "L", category: "⛩️ ក្រុមខ្លោងទ្វារវត្ត" },
  { id: "D",  name: "ខ្លោងទ្វារទី៤",               x: 73.08, y: 70.70, type: "gate",     pos: "L", category: "⛩️ ក្រុមខ្លោងទ្វារវត្ត" },
  { id: "E",  name: "ខ្លោងទ្វារទី៥",               x: 4.24,  y: 46.79, type: "gate",     pos: "R", category: "⛩️ ក្រុមខ្លោងទ្វារវត្ត" }
];

export const TEMPLE_PALI_DIRECTIONS = [
  { key: 'N',  name: 'ឧត្តរ (ជើង)',   type: 'cardinal', positionClass: 'top-1 left-1/2 -translate-x-1/2' },
  { key: 'S',  name: 'ទក្សិណ (ត្បូង)', type: 'cardinal', positionClass: 'bottom-1 left-1/2 -translate-x-1/2' },
  { key: 'E',  name: 'បូព៌ (កើត)',    type: 'cardinal', positionClass: 'top-1/2 right-1 -translate-y-1/2' },
  { key: 'W',  name: 'បស្ចឹម (លិច)',   type: 'cardinal', positionClass: 'top-1/2 left-1 -translate-y-1/2' },
  { key: 'NE', name: 'ឦសាន',           type: 'intercardinal', positionClass: 'top-1 right-1' },
  { key: 'SE', name: 'អាគ្នេយ៍',       type: 'intercardinal', positionClass: 'bottom-1 right-1' },
  { key: 'SW', name: 'និរតី',          type: 'intercardinal', positionClass: 'bottom-1 left-1' },
  { key: 'NW', name: 'ពាយ័ព្យ',        type: 'intercardinal', positionClass: 'top-1 left-1' },
];

const STORAGE_KEY = 'TEMPLE_MAP_LOCATIONS_PERSIST_V4';
const STORAGE_KEY_TAB3 = 'TEMPLE_MAP_LOCATIONS_TAB3_V1';

/**
 * Load temple locations from LocalStorage or return default points
 * Used by Tab 1 (read-only) and Tab 2 (editable)
 */
export function getSavedTempleLocations(templeId = 'khemavan') {
  if (templeId && templeId !== 'khemavan') {
    const key = `TEMPLE_MAP_LOCATIONS_WAT_${templeId.toUpperCase()}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  }

  // Wat Khemavan
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((loc) => ({
          ...loc,
          category: loc.category || (loc.type === 'gate' ? '⛩️ ក្រុមខ្លោងទ្វារវត្ត' : '🏢 ក្រុមអគារ និង កុដិ')
        }));
      }
    }
  } catch (e) {
    console.error('Failed to parse temple locations from storage:', e);
  }
  return INITIAL_TEMPLE_LOCATIONS;
}

/**
 * Save temple locations to LocalStorage (Tab 1 & Tab 2)
 */
export function saveTempleLocations(locations, templeId = 'khemavan') {
  const key = (!templeId || templeId === 'khemavan')
    ? STORAGE_KEY
    : `TEMPLE_MAP_LOCATIONS_WAT_${templeId.toUpperCase()}`;
  try {
    localStorage.setItem(key, JSON.stringify(locations));
  } catch (e) {
    console.error('Failed to save temple locations to storage:', e);
  }
}

/**
 * Reset temple locations back to initial points
 */
export function resetTempleLocations(templeId = 'khemavan') {
  if (templeId && templeId !== 'khemavan') {
    saveTempleLocations([], templeId);
    return [];
  }
  saveTempleLocations(INITIAL_TEMPLE_LOCATIONS, 'khemavan');
  return INITIAL_TEMPLE_LOCATIONS;
}

// ════════════════════════════════════════════════
// TAB 3 INDEPENDENT STORAGE (does NOT affect Tab 1 & Tab 2)
// ════════════════════════════════════════════════

/**
 * Load Tab 3 locations from LocalStorage
 * For Wat Khemavan: loads original 170 locations
 * For other temples: returns empty array [] so new temples start with clean map!
 */
export function getSavedTab3Locations(templeId = 'khemavan') {
  if (templeId && templeId !== 'khemavan') {
    const key = `TEMPLE_MAP_LOCATIONS_TAB3_WAT_${templeId.toUpperCase()}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    // Newly created temple starts with clean map (0 pins)
    return [];
  }

  // Wat Khemavan
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TAB3);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((loc) => ({
          ...loc,
          category: loc.category || (loc.type === 'gate' ? '⛩️ ក្រុមខ្លោងទ្វារវត្ត' : '🏢 ក្រុមអគារ និង កុដិ')
        }));
      }
    }
  } catch (e) {
    console.error('Failed to parse Tab 3 locations from storage:', e);
  }
  return INITIAL_TEMPLE_LOCATIONS;
}

/**
 * Save Tab 3 locations to LocalStorage (independent per temple)
 */
export function saveTab3Locations(locations, templeId = 'khemavan') {
  const key = (!templeId || templeId === 'khemavan')
    ? STORAGE_KEY_TAB3
    : `TEMPLE_MAP_LOCATIONS_TAB3_WAT_${templeId.toUpperCase()}`;
  try {
    localStorage.setItem(key, JSON.stringify(locations));
  } catch (e) {
    console.error('Failed to save Tab 3 locations to storage:', e);
  }
}

/**
 * Reset Tab 3 locations
 */
export function resetTab3Locations(templeId = 'khemavan') {
  if (templeId && templeId !== 'khemavan') {
    saveTab3Locations([], templeId);
    return [];
  }
  saveTab3Locations(INITIAL_TEMPLE_LOCATIONS, 'khemavan');
  return INITIAL_TEMPLE_LOCATIONS;
}
