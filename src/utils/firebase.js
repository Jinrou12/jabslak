import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, remove, get } from 'firebase/database';
import { INITIAL_TEMPLE_LOCATIONS, saveTempleLocations as saveTempleLocationsLocal, saveTab3Locations as saveTab3LocationsLocal } from '../data/templeLocations';
import { INITIAL_TAG_DATA } from '../data/sampleData';

// Firebase configuration (Can be updated with user's Firebase project keys or default demo keys)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoApiKeyForKhmerTagSystem2026",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "khmer-tag-system.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://khmer-tag-system-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "khmer-tag-system",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "khmer-tag-system.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:demo123456789"
};

let app = null;
let db = null;
let isConnected = false;

try {
  app = initializeApp(firebaseConfig);
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

  const migrated = tagList.map((item, idx) => {
    const locStr = item.baseLocation || item.location || '';
    const isOld =
      locStr.includes('អាគារ A') ||
      locStr.includes('អាគារ B') ||
      locStr.includes('រោងទី') ||
      locStr.includes('សាលាឆាន់ - ជួរ') ||
      locStr.includes('រោងបុណ្យ');

    if (isOld || !item.templeLocationId) {
      hasOld = true;
      const locObj = INITIAL_TEMPLE_LOCATIONS[idx % INITIAL_TEMPLE_LOCATIONS.length];
      const tableMatch = item.location ? item.location.match(/\(តុ [^\)]+\)/) : null;
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
        const { migrated, hasOld } = migrateTagListToTempleLocations(tagList);
        if (hasOld) {
          console.log('Migrating Firebase cloud data to 21 temple locations...');
          seedFirebaseData(migrated, true);
        }

        onDataReceived(migrated);
      } else {
        // Empty in cloud -> seed initial authentic data
        seedFirebaseData(INITIAL_TAG_DATA, true);
        onDataReceived(INITIAL_TAG_DATA);
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

  const locsRef = ref(db, 'temple_locations');
  
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
          // Auto-align if cloud had outdated shifted coordinates for 10 or 16
          const item10 = locList.find((l) => l.id === '១០' || l.id === '10');
          const item16 = locList.find((l) => l.id === '១៦' || l.id === '16');
          if ((item10 && item10.x < 50) || (item16 && item16.x < 45)) {
            console.log('Aligning cloud coordinates for 10 and 16 to authentic temple locations...');
            saveTempleLocationsToFirebase(INITIAL_TEMPLE_LOCATIONS);
            onDataReceived(INITIAL_TEMPLE_LOCATIONS);
            return;
          }

          saveTempleLocationsLocal(locList);
          onDataReceived(locList);
          return;
        }
      }
      // If empty in cloud -> seed INITIAL_TEMPLE_LOCATIONS
      saveTempleLocationsToFirebase(INITIAL_TEMPLE_LOCATIONS);
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
      const dataMap = {};
      initialData.forEach((t) => {
        dataMap[t.id] = t;
      });
      await set(tagsRef, dataMap);
      console.log('Successfully updated 1,000 authentic tags to Firebase Realtime Database!');
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

export { db, isConnected };
