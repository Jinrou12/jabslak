import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, set, remove, get } from 'firebase/database';
import { INITIAL_TEMPLE_LOCATIONS, saveTempleLocations as saveTempleLocationsLocal, saveTab3Locations as saveTab3LocationsLocal } from '../data/templeLocations';

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
      locStr.includes('រោងទី') ||
      locStr.includes('សាលាឆាន់ - ជួរ') ||
      locStr.includes('រោងបុណ្យ');

    if (isOld) {
      hasOld = true;
      return {
        ...item,
        baseLocation: 'មិនទាន់ដៅលើ Map',
        location: 'មិនទាន់ដៅលើ Map'
      };
    }
    return item;
  });

  return { migrated, hasOld };
}

/**
 * Subscribe to real-time changes in Firebase Realtime Database
 */
export function subscribeToFirebaseTags(onDataReceived, onError) {
  if (!db) {
    if (onError) onError(new Error('Firebase DB is not initialized'));
    return () => {};
  }

  const tagsRef = ref(db, 'tags');
  
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
      console.error('Firebase realtime subscription error:', err);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

/**
 * Subscribe to real-time temple locations in Firebase Realtime Database
 * Ensures PC and Phone are 100% synchronized in real time!
 */
export function subscribeToFirebaseTempleLocations(onDataReceived, onError) {
  if (!db) {
    if (onError) onError(new Error('Firebase DB is not initialized'));
    return () => {};
  }

  // Guard flag: prevent infinite re-seeding loop.
  // When we detect stale coordinates and write back to Firebase, onValue fires
  // again — without this guard that triggers another write, ad infinitum.
  let isSeeding = false;

  const locsRef = ref(db, 'temple_locations');
  
  const unsubscribe = onValue(
    locsRef,
    (snapshot) => {
      // Skip callbacks triggered by our own seeding write
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
          // Auto-align if cloud had outdated shifted coordinates for 10 or 16
          const item10 = locList.find((l) => l.id === '១០' || l.id === '10');
          const item16 = locList.find((l) => l.id === '១៦' || l.id === '16');
          if ((item10 && item10.x < 50) || (item16 && item16.x < 45)) {
            console.log('Aligning cloud coordinates for 10 and 16 to authentic temple locations...');
            isSeeding = true;
            saveTempleLocationsToFirebase(INITIAL_TEMPLE_LOCATIONS).finally(() => {
              isSeeding = false;
            });
            onDataReceived(INITIAL_TEMPLE_LOCATIONS);
            return;
          }

          saveTempleLocationsLocal(locList);
          onDataReceived(locList);
          return;
        }
      }
      // If empty in cloud -> seed INITIAL_TEMPLE_LOCATIONS (only once)
      isSeeding = true;
      saveTempleLocationsToFirebase(INITIAL_TEMPLE_LOCATIONS).finally(() => {
        isSeeding = false;
      });
      onDataReceived(INITIAL_TEMPLE_LOCATIONS);
    },
    (err) => {
      console.error('Firebase temple locations subscription error:', err);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

/**
 * Save temple locations to Firebase Realtime DB and LocalStorage (Tab 1 & Tab 2)
 */
export async function saveTempleLocationsToFirebase(locations) {
  saveTempleLocationsLocal(locations);
  if (!db) return false;
  try {
    const locsRef = ref(db, 'temple_locations');
    await set(locsRef, locations);
    return true;
  } catch (err) {
    console.error('Error saving temple locations to Firebase:', err);
    return false;
  }
}

// ════════════════════════════════════════════════
// TAB 3 INDEPENDENT FIREBASE SYNC
// ════════════════════════════════════════════════

/**
 * Subscribe to Tab 3 temple locations in Firebase (independent from Tab 1/2)
 */
export function subscribeToFirebaseTab3Locations(onDataReceived, onError) {
  if (!db) {
    if (onError) onError(new Error('Firebase DB is not initialized'));
    return () => {};
  }

  const locsRef = ref(db, 'temple_locations_tab3');
  
  const unsubscribe = onValue(
    locsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        let locList = [];
        if (Array.isArray(val)) {
          locList = val.filter(Boolean);
        } else if (typeof val === 'object') {
          locList = Object.values(val);
        }
        if (locList.length > 0) {
          saveTab3LocationsLocal(locList);
          onDataReceived(locList);
          return;
        }
      }
      // If empty -> seed with INITIAL
      saveTab3LocationsToFirebase(INITIAL_TEMPLE_LOCATIONS);
      onDataReceived(INITIAL_TEMPLE_LOCATIONS);
    },
    (err) => {
      console.error('Firebase Tab 3 locations subscription error:', err);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

/**
 * Save Tab 3 locations to Firebase (independent, does NOT touch Tab 1/2)
 */
export async function saveTab3LocationsToFirebase(locations) {
  saveTab3LocationsLocal(locations);
  if (!db) return false;
  try {
    const locsRef = ref(db, 'temple_locations_tab3');
    await set(locsRef, locations);
    return true;
  } catch (err) {
    console.error('Error saving Tab 3 locations to Firebase:', err);
    return false;
  }
}

/**
 * Save or update a single tag in Firebase
 */
export async function saveTagToFirebase(tag) {
  if (!db) return false;
  try {
    const tagRef = ref(db, `tags/${tag.id}`);
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
export async function deleteTagFromFirebase(tagId) {
  if (!db) return false;
  try {
    const tagRef = ref(db, `tags/${tagId}`);
    await remove(tagRef);
    return true;
  } catch (err) {
    console.error('Error deleting tag from Firebase:', err);
    return false;
  }
}

/**
 * Seed initial 1,000 tag records into Firebase
 */
export async function seedFirebaseData(initialData, force = false) {
  if (!db) return false;
  try {
    const tagsRef = ref(db, 'tags');
    if (force) {
      if (!initialData || initialData.length === 0) {
        await remove(tagsRef);
        console.log('Successfully cleared all tags from Firebase Realtime Database!');
        return true;
      }
      const dataMap = {};
      initialData.forEach((t) => {
        dataMap[t.id] = t;
      });
      await set(tagsRef, dataMap);
      console.log('Successfully updated tags to Firebase Realtime Database!');
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
export function subscribeToGroupSettings(onDataReceived) {
  if (!db) return () => {};
  const settingsRef = ref(db, 'map_group_settings');
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
      console.warn('Group settings subscription error:', err);
    }
  );
  return unsubscribe;
}

/**
 * Save Category Group Settings to Firebase Realtime Database
 */
export async function saveGroupSettingsToFirebase(settings) {
  if (!db) return false;
  try {
    const settingsRef = ref(db, 'map_group_settings');
    await set(settingsRef, settings);
    return true;
  } catch (err) {
    console.error('Error saving group settings to Firebase:', err);
    return false;
  }
}

export { db, isConnected };
