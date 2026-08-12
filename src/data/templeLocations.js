// Initial 21 authentic temple locations from temple_map
export const INITIAL_TEMPLE_LOCATIONS = [
  { id: "១",  name: "ធម្មសាលាសភា",                  x: 17.00, y: 44.00, type: "building", pos: "R", category: "🏢 ក្រុមអគារ និង កុដិ" },
  { id: "២",  name: "មហាកុដិ",                       x: 19.00, y: 54.00, type: "building", pos: "R", category: "🏢 ក្រុមអគារ និង កុដិ" },
  { id: "៣",  name: "កុដិសាឡុម",                     x: 15.00, y: 70.00, type: "building", pos: "R", category: "🏢 ក្រុមអគារ និង កុដិ" },
  { id: "៤",  name: "កុដិតូច",                       x: 5.50,  y: 35.50, type: "building", pos: "R", category: "🏢 ក្រុមអគារ និង កុដិ" },
  { id: "៥",  name: "កុដិថ្មី",                      x: 17.50, y: 26.50, type: "building", pos: "L", category: "🏢 ក្រុមអគារ និង កុដិ" },
  { id: "៦",  name: "កុដិគ្រូធំ",                   x: 25.50, y: 28.50, type: "building", pos: "R", category: "🏢 ក្រុមអគារ និង កុដិ" },
  { id: "៧",  name: "ព្រះវិហារ",                     x: 47.00, y: 54.50, type: "building", pos: "R", category: "🏢 ក្រុមអគារ និង កុដិ" },
  { id: "៨",  name: "ដើមពោធិព្រឹក្ស",               x: 36.00, y: 66.00, type: "building", pos: "R", category: "🏢 ក្រុមអគារ និង កុដិ" },
  { id: "៩",  name: "បណ្ណាល័យ",                     x: 57.00, y: 54.50, type: "building", pos: "R", category: "🏢 ក្រុមអគារ និង កុដិ" },
  { id: "១០", name: "ពុទ្ធកបឋមសិក្សាកម្រងហ៊ុនណេង", x: 46.50, y: 44.50, type: "building", pos: "B", category: "🏢 ក្រុមអគារ និង កុដិ" },
  { id: "១១", name: "កុដិយាយតា",                    x: 42.00, y: 26.50, type: "building", pos: "L", category: "🏢 ក្រុមអគារ និង កុដិ" },
  { id: "១២", name: "ប៉ុស្តិ៍វិទ្យុ",                 x: 52.00, y: 22.00, type: "building", pos: "L", category: "🏢 ក្រុមអគារ និង កុដិ" },
  { id: "១៣", name: "អាងទឹក",                       x: 63.50, y: 29.50, type: "building", pos: "R", category: "🏢 ក្រុមអគារ និង កុដិ" },
  { id: "១៤", name: "អាងទឹកវិទ្យុ",                x: 60.00, y: 19.00, type: "building", pos: "R", category: "🏢 ក្រុមអគារ និង កុដិ" },
  { id: "១៥", name: "ព្រះផ្ទំ",                      x: 62.50, y: 36.50, type: "building", pos: "R", category: "🏢 ក្រុមអគារ និង កុដិ" },
  { id: "១៦", name: "ចេតិយនគរភ្នំ ចាយ ស៊ាងអ៊ី",        x: 39.00, y: 78.50, type: "building", pos: "R", category: "🏢 ក្រុមអគារ និង កុដិ" },
  { id: "A",  name: "ខ្លោងទ្វារទី១",               x: 73.00, y: 6.50,  type: "gate",     pos: "L", category: "⛩️ ក្រុមខ្លោងទ្វារវត្ត" },
  { id: "B",  name: "ខ្លោងទ្វារទី២",               x: 29.00, y: 17.50, type: "gate",     pos: "L", category: "⛩️ ក្រុមខ្លោងទ្វារវត្ត" },
  { id: "C",  name: "ខ្លោងទ្វារទី៣",               x: 83.50, y: 55.50, type: "gate",     pos: "L", category: "⛩️ ក្រុមខ្លោងទ្វារវត្ត" },
  { id: "D",  name: "ខ្លោងទ្វារទី៤",               x: 70.00, y: 71.00, type: "gate",     pos: "L", category: "⛩️ ក្រុមខ្លោងទ្វារវត្ត" },
  { id: "E",  name: "ខ្លោងទ្វារទី៥",               x: 6.50,  y: 47.00, type: "gate",     pos: "R", category: "⛩️ ក្រុមខ្លោងទ្វារវត្ត" }
];

export const TEMPLE_PALI_DIRECTIONS = [
  { key: 'N',  name: 'ឧត្តរ (ជើង)',   type: 'cardinal', positionClass: 'top-[-2.5rem] left-1/2 -translate-x-1/2' },
  { key: 'S',  name: 'ទក្សិណ (ត្បូង)', type: 'cardinal', positionClass: 'bottom-[-2.5rem] left-1/2 -translate-x-1/2' },
  { key: 'E',  name: 'បូព៌ (កើត)',    type: 'cardinal', positionClass: 'top-1/2 right-[-8.5rem] -translate-y-1/2' },
  { key: 'W',  name: 'បស្ចឹម (លិច)',   type: 'cardinal', positionClass: 'top-1/2 left-[-8.5rem] -translate-y-1/2' },
  { key: 'NE', name: 'ឦសាន',           type: 'intercardinal', positionClass: 'top-[-2rem] right-[-2.5rem]' },
  { key: 'SE', name: 'អាគ្នេយ៍',       type: 'intercardinal', positionClass: 'bottom-[-2rem] right-[-2.5rem]' },
  { key: 'SW', name: 'និរតី',          type: 'intercardinal', positionClass: 'bottom-[-2rem] left-[-2.5rem]' },
  { key: 'NW', name: 'ពាយ័ព្យ',        type: 'intercardinal', positionClass: 'top-[-2rem] left-[-2.5rem]' },
];

const STORAGE_KEY = 'TEMPLE_MAP_LOCATIONS_PERSIST_V3';

/**
 * Load temple locations from LocalStorage or return default 21 points
 */
export function getSavedTempleLocations() {
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
 * Save temple locations to LocalStorage
 */
export function saveTempleLocations(locations) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  } catch (e) {
    console.error('Failed to save temple locations to storage:', e);
  }
}

/**
 * Reset temple locations back to initial 21 points
 */
export function resetTempleLocations() {
  saveTempleLocations(INITIAL_TEMPLE_LOCATIONS);
  return INITIAL_TEMPLE_LOCATIONS;
}
