import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, set, remove, get } from 'firebase/database';
import { 
  INITIAL_TEMPLE_LOCATIONS, 
  saveTempleLocations as saveTempleLocationsLocal, 
  saveTab3Locations as saveTab3LocationsLocal,
  getSavedTempleLocations,
  getSavedTab3Locations
} from '../data/templeLocations';

// Dynamically read custom Firebase Database credentials from localStorage or URL parameter
let urlDbParam = '';
try {
  if (typeof window !== 'undefined' && window.location) {
    const params = new URLSearchParams(window.location.search);
    const dbParam = params.get('db');
    if (dbParam) {
      urlDbParam = decodeURIComponent(dbParam);
      localStorage.setItem('FB_DB_URL', urlDbParam);
    }
  }
} catch (e) {}

const customDbUrl = (typeof localStorage !== 'undefined' ? localStorage.getItem('FB_DB_URL') : null) || urlDbParam;
const customApiKey = typeof localStorage !== 'undefined' ? localStorage.getItem('FB_API_KEY') : null;
const customProjectId = typeof localStorage !== 'undefined' ? localStorage.getItem('FB_PROJECT_ID') : null;

// Firebase configuration
// NOTE: Fallback values are intentional placeholders — the app works in offline
// mode without real Firebase credentials (data saved to localStorage instead).
const firebaseConfig = {
  apiKey: customApiKey || import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAA-placeholder-key-for-offline-mode',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'jabslak.firebaseapp.com',
  databaseURL: customDbUrl || import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://jabslak-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: customProjectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || 'jabslak',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'jabslak.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  // appId MUST follow format "1:NUMBERS:web:HEXSTRING" — invalid format throws in SDK v12
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000'
};

let app = null;
let db = null;
let isConnected = false;

try {
  // Prevent duplicate app initialization (React StrictMode mounts effects twice)
  const existingApps = getApps();
  app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
  db = getDatabase(app);
  isConnected = true;
} catch (err) {
  console.warn('Firebase init warning (running in offline mode):', err);
}


/**
 * Migrate any old locations (like អាគារ A) to authentic 21 temple locations
 */
export function migrateTagListToTempleLocations(tagList) {
  if (!Array.isArray(tagList)) return { migrated: tagList, hasOld: false };
  let hasOld = false;

  const migrated = tagList.map((item) => {
    const locStr = item.baseLocation || item.location || '';
    const isOld =
      locStr.includes('អាគារ A') ||
      locStr.includes('អាគារ B') ||
      locStr.includes('អាគារ C') ||
      locStr.includes('អាគារ D') ||
      locStr.includes('អាគារ E') ||
      locStr.includes('កុដិលេខ');

    if (isOld) {
      hasOld = true;
      return {
        ...item,
        baseLocation: '១'
      };
    }
    return item;
  });

  return { migrated, hasOld };
}

/**
 * Helper to get scoped Firebase path per temple
 */
export function getFirebaseTagsPath(templeId = 'khemavan') {
  if (!templeId || templeId === 'khemavan') {
    return 'tags';
  }
  return `temples/${templeId}/tags`;
}

/**
 * Subscribe to real-time changes in Firebase Realtime Database
 */
export function subscribeToFirebaseTags(onDataReceived, onError, templeId = 'khemavan') {
  if (!db) {
    if (onError) onError(new Error('Firebase DB is not initialized'));
    return () => {};
  }

  const path = getFirebaseTagsPath(templeId);
  const tagsRef = ref(db, path);
  
  const unsubscribe = onValue(
    tagsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        let tagList = [];
        if (Array.isArray(val)) {
          tagList = val.filter(Boolean);
        } else if (typeof val === 'object') {
          tagList = Object.values(val);
        }
        // Filter out and purge any rogue group objects accidentally saved to Firebase
        const rogueGroups = tagList.filter(
          (t) => t && t.id && (String(t.id).startsWith('group-') || Array.isArray(t.tags))
        );
        if (rogueGroups.length > 0) {
          rogueGroups.forEach((rg) => {
            deleteTagFromFirebase(rg.id, templeId);
          });
          tagList = tagList.filter(
            (t) => t && (!t.id || (!String(t.id).startsWith('group-') && !Array.isArray(t.tags)))
          );
        }

        // Sort by tag number ascending
        tagList.sort((a, b) => Number(a.tagNumber) - Number(b.tagNumber));

        // Auto migrate if cloud had old data
        const { migrated } = migrateTagListToTempleLocations(tagList);
        onDataReceived(migrated);
      } else {
        // Cloud is empty or cleared -> return empty tag list
        onDataReceived([]);
      }
    },
    (err) => {
      console.error(`Firebase realtime subscription error for ${path}:`, err);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

/**
 * Subscribe to real-time temple locations in Firebase Realtime Database
 * Ensures PC and Phone are 100% synchronized in real time!
 */
export function subscribeToFirebaseTempleLocations(onDataReceived, onError, templeId = 'khemavan') {
  if (!db) {
    if (onError) onError(new Error('Firebase DB is not initialized'));
    return () => {};
  }

  const isKhemavan = !templeId || templeId === 'khemavan';
  const path = isKhemavan ? 'temple_locations' : `temples/${templeId}/map_locations`;
  let isSeeding = false;
  const locsRef = ref(db, path);
  
  const unsubscribe = onValue(
    locsRef,
    (snapshot) => {
      if (isSeeding) return;

      if (snapshot.exists()) {
        const val = snapshot.val();
        let locList = [];
        if (Array.isArray(val)) {
          locList = val.filter(Boolean);
        } else if (typeof val === 'object') {
          locList = Object.values(val);
        }
        if (locList.length > 0) {
          saveTempleLocations(locList, templeId);
          onDataReceived(locList);
          return;
        }
      }
      
      // If empty in cloud:
      if (isKhemavan) {
        const local = getSavedTempleLocations('khemavan');
        const defaultToUse = (Array.isArray(local) && local.length > 0) ? local : INITIAL_TEMPLE_LOCATIONS;
        isSeeding = true;
        saveTempleLocationsToFirebase(defaultToUse, 'khemavan').finally(() => {
          isSeeding = false;
        });
        onDataReceived(defaultToUse);
      } else {
        onDataReceived([]);
      }
    },
    (err) => {
      console.error(`Firebase temple locations subscription error for ${path}:`, err);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

/**
 * Save temple locations to Firebase Realtime DB and LocalStorage (Tab 1 & Tab 2)
 */
export async function saveTempleLocationsToFirebase(locations, templeId = 'khemavan') {
  saveTempleLocations(locations, templeId);
  if (!db) return false;
  try {
    const isKhemavan = !templeId || templeId === 'khemavan';
    const path = isKhemavan ? 'temple_locations' : `temples/${templeId}/map_locations`;
    const cleanLocations = JSON.parse(JSON.stringify(locations || []));
    const locsRef = ref(db, path);
    await set(locsRef, cleanLocations);
    return true;
  } catch (err) {
    console.error('Error saving temple locations to Firebase:', err);
    return false;
  }
}

// ════════════════════════════════════════════════
// TAB 3 INDEPENDENT FIREBASE SYNC (Scoped per Temple!)
// ════════════════════════════════════════════════

/**
 * Subscribe to Tab 3 temple locations in Firebase (independent from Tab 1/2)
 * For Wat Khemavan: uses temple_locations_tab3
 * For other temples: uses temples/{templeId}/map_locations_tab3 (starts EMPTY with 0 pins!)
 */
export function subscribeToFirebaseTab3Locations(onDataReceived, onError, templeId = 'khemavan') {
  if (!db) {
    if (onError) onError(new Error('Firebase DB is not initialized'));
    return () => {};
  }

  const isKhemavan = !templeId || templeId === 'khemavan';
  const path = isKhemavan ? 'temple_locations_tab3' : `temples/${templeId}/map_locations_tab3`;
  let isSeedingTab3 = false;
  const locsRef = ref(db, path);
  
  const unsubscribe = onValue(
    locsRef,
    (snapshot) => {
      if (isSeedingTab3) return;

      if (snapshot.exists()) {
        const val = snapshot.val();
        let locList = [];
        if (Array.isArray(val)) {
          locList = val.filter(Boolean);
        } else if (typeof val === 'object') {
          locList = Object.values(val);
        }
        if (locList.length > 0) {
          saveTab3Locations(locList, templeId);
          onDataReceived(locList);
          return;
        }
      }
      
      // If empty in cloud:
      if (isKhemavan) {
        const local = getSavedTab3Locations('khemavan');
        const defaultToUse = (Array.isArray(local) && local.length > 0) ? local : INITIAL_TEMPLE_LOCATIONS;
        isSeedingTab3 = true;
        saveTab3LocationsToFirebase(defaultToUse, 'khemavan').finally(() => {
          isSeedingTab3 = false;
        });
        onDataReceived(defaultToUse);
      } else {
        // Other temples start with EMPTY pins list [] (zero pins)
        const local = getSavedTab3Locations(templeId);
        onDataReceived(Array.isArray(local) ? local : []);
      }
    },
    (err) => {
      console.error(`Firebase Tab 3 locations subscription error for ${path}:`, err);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

/**
 * Save Tab 3 locations to Firebase (independent per temple)
 */
export async function saveTab3LocationsToFirebase(locations, templeId = 'khemavan') {
  saveTab3Locations(locations, templeId);
  if (!db) return false;
  try {
    const isKhemavan = !templeId || templeId === 'khemavan';
    const path = isKhemavan ? 'temple_locations_tab3' : `temples/${templeId}/map_locations_tab3`;
    const cleanLocations = JSON.parse(JSON.stringify(locations || []));
    const locsRef = ref(db, path);
    await set(locsRef, cleanLocations);
    return true;
  } catch (err) {
    console.error('Error saving Tab 3 locations to Firebase:', err);
    return false;
  }
}

/**
 * Save or update a single tag in Firebase
 */
export async function saveTagToFirebase(tag, templeId = 'khemavan') {
  if (!db) return false;
  try {
    const basePath = getFirebaseTagsPath(templeId);
    const tagRef = ref(db, `${basePath}/${tag.id}`);
    await set(tagRef, tag);
    return true;
  } catch (err) {
    console.error('Error saving tag to Firebase:', err);
    return false;
  }
}

/**
 * Delete a tag from Firebase
 */
export async function deleteTagFromFirebase(tagId, templeId = 'khemavan') {
  if (!db) return false;
  try {
    const basePath = getFirebaseTagsPath(templeId);
    const tagRef = ref(db, `${basePath}/${tagId}`);
    await remove(tagRef);
    return true;
  } catch (err) {
    console.error('Error deleting tag from Firebase:', err);
    return false;
  }
}

/**
 * Seed initial tag records into Firebase (scoped per temple)
 */
export async function seedFirebaseData(initialData, force = false, templeId = 'khemavan') {
  if (!db) return false;
  try {
    const basePath = getFirebaseTagsPath(templeId);
    const tagsRef = ref(db, basePath);
    if (force) {
      if (!initialData || initialData.length === 0) {
        await remove(tagsRef);
        console.log(`Successfully cleared tags from Firebase for ${basePath}!`);
        return true;
      }
      const dataMap = {};
      initialData.forEach((t) => {
        dataMap[t.id] = t;
      });
      await set(tagsRef, dataMap);
      console.log(`Successfully updated tags in Firebase for ${basePath}!`);
      return true;
    }
    const snapshot = await get(tagsRef);
    if (!snapshot.exists()) {
      const dataMap = {};
      initialData.forEach((t) => {
        dataMap[t.id] = t;
      });
      await set(tagsRef, dataMap);
      return true;
    }
  } catch (err) {
    console.error('Error seeding Firebase:', err);
  }
  return false;
}

/**
 * Subscribe to Category Group Settings (Hidden / Locked states synced across devices)
 */
export function subscribeToGroupSettings(onDataReceived, templeId = 'khemavan') {
  if (!db) return () => {};
  const isKhemavan = !templeId || templeId === 'khemavan';
  const path = isKhemavan ? 'map_group_settings' : `temples/${templeId}/map_group_settings`;
  const settingsRef = ref(db, path);
  const unsubscribe = onValue(
    settingsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onDataReceived(snapshot.val());
      } else {
        onDataReceived({});
      }
    },
    (err) => {
      console.warn(`Group settings subscription error for ${path}:`, err);
    }
  );
  return unsubscribe;
}

/**
 * Save Category Group Settings to Firebase Realtime Database
 */
export async function saveGroupSettingsToFirebase(settings, templeId = 'khemavan') {
  if (!db) return false;
  try {
    const isKhemavan = !templeId || templeId === 'khemavan';
    const path = isKhemavan ? 'map_group_settings' : `temples/${templeId}/map_group_settings`;
    const settingsRef = ref(db, path);
    await set(settingsRef, settings);
    return true;
  } catch (err) {
    console.error('Error saving group settings to Firebase:', err);
    return false;
  }
}

/**
 * Subscribe to registered temples in Firebase Realtime Database
 */
export function subscribeToFirebaseTemples(onDataReceived) {
  if (!db) return () => {};
  const templesRef = ref(db, 'registered_temples');
  const unsubscribe = onValue(
    templesRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        let list = [];
        if (Array.isArray(val)) {
          list = val.filter(Boolean);
        } else if (typeof val === 'object') {
          list = Object.values(val);
        }
        if (list.length > 0) {
          onDataReceived(list);
        }
      }
    },
    (err) => {
      console.warn('Temples subscription error:', err);
    }
  );
  return unsubscribe;
}

/**
 * Save registered temples to Firebase
 */
export async function saveTemplesToFirebase(temples) {
  if (!db) return false;
  try {
    const templesRef = ref(db, 'registered_temples');
    await set(templesRef, temples);
    return true;
  } catch (err) {
    console.error('Error saving temples to Firebase:', err);
    return false;
  }
}

export { db, isConnected };

