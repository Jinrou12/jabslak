/**
 * Multi-Temple Management Storage & URL Router
 * Ensures complete data isolation between temples while preserving Wat Khemavan 100%.
 */

export const TEMPLES_STORAGE_KEY = 'KHMER_TAG_SYSTEM_TEMPLES_V2';
export const CURRENT_TEMPLE_ID_KEY = 'KHMER_TAG_CURRENT_TEMPLE_ID_V1';

export const DEFAULT_TEMPLES = [
  {
    id: 'khemavan',
    name: 'វត្តខេមវ័ន',
    shortName: 'ខេមវ័ន',
    location: 'ខេត្តកំពង់ចាម',
    description: 'វត្តអារាមគំរូដើម - ប្រព័ន្ធគ្រប់គ្រងស្លាកលេខ និងទីតាំងស្នាក់នៅ',
    mapImage: '/temple_map/map_new_latest.jpg',
    isDefault: true,
    createdAt: '2026-01-01'
  }
];

/**
 * Get all registered temples (always ensures Wat Khemavan is included)
 */
export function getSavedTemples() {
  try {
    const saved = localStorage.getItem(TEMPLES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure default temple exists
        const hasKhemavan = parsed.some((t) => t.id === 'khemavan');
        if (!hasKhemavan) {
          const merged = [DEFAULT_TEMPLES[0], ...parsed];
          saveTemples(merged);
          return merged;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading temples:', err);
  }
  saveTemples(DEFAULT_TEMPLES);
  return DEFAULT_TEMPLES;
}

/**
 * Save temples list to localStorage
 */
export function saveTemples(temples) {
  try {
    localStorage.setItem(TEMPLES_STORAGE_KEY, JSON.stringify(temples));
  } catch (err) {
    console.error('Error saving temples:', err);
  }
}

/**
 * Read ?wat= parameter from URL
 * If none or invalid, defaults to 'khemavan'
 */
export function getTempleIdFromUrl() {
  try {
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      const wat = params.get('wat');
      if (wat && wat.trim()) {
        const cleanId = wat.trim().toLowerCase();
        // Remember as last visited
        localStorage.setItem(CURRENT_TEMPLE_ID_KEY, cleanId);
        return cleanId;
      }
    }
  } catch (e) {}

  // Fallback: check last visited temple or default to khemavan
  try {
    const lastId = localStorage.getItem(CURRENT_TEMPLE_ID_KEY);
    if (lastId) return lastId;
  } catch (e) {}

  return 'khemavan';
}

/**
 * Update the browser URL bar (?wat=xxx) without full page reload
 */
export function setTempleUrl(templeId) {
  try {
    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      if (templeId === 'khemavan') {
        url.searchParams.delete('wat');
      } else {
        url.searchParams.set('wat', templeId);
      }
      window.history.replaceState({}, '', url.toString());
      localStorage.setItem(CURRENT_TEMPLE_ID_KEY, templeId);
    }
  } catch (e) {}
}

/**
 * Generate a clean shareable link to copy and send via Telegram
 */
export function getTempleShareUrl(templeId) {
  try {
    if (typeof window !== 'undefined' && window.location) {
      const origin = window.location.origin;
      if (templeId === 'khemavan') {
        return `${origin}/`;
      }
      return `${origin}/?wat=${encodeURIComponent(templeId)}`;
    }
  } catch (e) {}
  return `https://jabslak.vercel.app/?wat=${encodeURIComponent(templeId)}`;
}

/**
 * Get Storage Key for Tags of a specific temple
 * Wat Khemavan ALWAYS uses original 'KHMER_TAG_SYSTEM_DATA_V2' to preserve 1,022 tags!
 */
export function getTempleTagsStorageKey(templeId) {
  if (!templeId || templeId === 'khemavan') {
    return 'KHMER_TAG_SYSTEM_DATA_V2';
  }
  return `KHMER_TAG_SYSTEM_DATA_WAT_${templeId.toUpperCase()}`;
}

/**
 * Load tags strictly for a specific temple
 */
export function getSavedTagsForTemple(templeId) {
  const key = getTempleTagsStorageKey(templeId);
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error(`Error loading tags for temple ${templeId}:`, err);
  }
  return [];
}

/**
 * Save tags strictly for a specific temple
 */
export function saveTagsForTemple(templeId, tags) {
  const key = getTempleTagsStorageKey(templeId);
  try {
    localStorage.setItem(key, JSON.stringify(tags));
  } catch (err) {
    console.error(`Error saving tags for temple ${templeId}:`, err);
  }
}

/**
 * Get Map Locations Storage Key for a specific temple
 * Wat Khemavan uses 'TEMPLE_MAP_LOCATIONS_PERSIST_V4'
 */
export function getTempleLocationsStorageKey(templeId) {
  if (!templeId || templeId === 'khemavan') {
    return 'TEMPLE_MAP_LOCATIONS_PERSIST_V4';
  }
  return `TEMPLE_MAP_LOCATIONS_WAT_${templeId.toUpperCase()}`;
}

/**
 * Load custom map image for a specific temple
 * Wat Khemavan uses /temple_map/map_new_latest.jpg
 * Other temples only use custom uploaded map or null
 */
export function getTempleCustomMapImage(templeId, defaultImage = null) {
  if (!templeId || templeId === 'khemavan') {
    try {
      const savedImg = localStorage.getItem('TEMPLE_CUSTOM_MAP_khemavan');
      if (savedImg) return savedImg;
    } catch (e) {}
    return defaultImage || '/temple_map/map_new_latest.jpg';
  }

  // Other temples
  try {
    const savedImg = localStorage.getItem(`TEMPLE_CUSTOM_MAP_${templeId}`);
    if (savedImg && savedImg !== '/temple_map/map_new_latest.jpg') {
      return savedImg;
    }
  } catch (e) {}

  if (defaultImage && defaultImage !== '/temple_map/map_new_latest.jpg') {
    return defaultImage;
  }
  return null;
}

/**
 * Save custom map image (base64 or URL) for a specific temple
 */
export function saveTempleCustomMapImage(templeId, imageData) {
  if (!templeId) return;
  try {
    if (imageData) {
      localStorage.setItem(`TEMPLE_CUSTOM_MAP_${templeId}`, imageData);
    } else {
      localStorage.removeItem(`TEMPLE_CUSTOM_MAP_${templeId}`);
    }
    // Also update temple list object
    const allTemples = getSavedTemples();
    const updated = allTemples.map((t) => (t.id === templeId ? { ...t, mapImage: imageData || null } : t));
    saveTemples(updated);
  } catch (e) {
    console.error('Error saving custom map image:', e);
  }
}

/**
 * Client-side high performance image compressor using HTML5 Canvas
 * Resizes images to max 2048px and quality 0.82 JPEG to avoid localStorage QuotaExceededError
 */
export function compressImage(file, maxWidth = 2048, maxHeight = 2048, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
