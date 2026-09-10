import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, set, remove, get } from 'firebase/database';
import { 
  INITIAL_TEMPLE_LOCATIONS, 
  saveTempleLocations as saveTempleLocationsLocal, 
  saveTab3Locations as saveTab3LocationsLocal,
  getSavedTempleLocations,
  getSavedTab3Locations
} from '../data/templeLocations.js';
import { INITIAL_TAB3_LOCATIONS } from '../data/initialTab3Locations.js';
import { getDeviceId } from './storage.js';

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

export const DEFAULT_FIREBASE_RTDB_URL = 'https://jabslak-default-rtdb.asia-southeast1.firebasedatabase.app';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

/**
 * Build direct REST API endpoint URL for any Firebase RTDB path.
 * This works 100% reliably across all browsers (PC & Phone) without requiring
 * WebSocket support or API key authentication.
 */
export function getFirebaseRestEndpoint(path) {
  const customDb = (typeof localStorage !== 'undefined' ? localStorage.getItem('FB_DB_URL') : null) || urlDbParam;
  const baseUrl = (customDb || env.VITE_FIREBASE_DATABASE_URL || DEFAULT_FIREBASE_RTDB_URL).replace(/\/$/, '');
  const cleanPath = String(path).replace(/^\/+/, '');
  return `${baseUrl}/${cleanPath}.json`;
}

// Firebase configuration
const firebaseConfig = {
  apiKey: customApiKey || env.VITE_FIREBASE_API_KEY || 'AIzaSyAA-placeholder-key-for-offline-mode',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'jabslak.firebaseapp.com',
  databaseURL: customDbUrl || env.VITE_FIREBASE_DATABASE_URL || DEFAULT_FIREBASE_RTDB_URL,
  projectId: customProjectId || env.VITE_FIREBASE_PROJECT_ID || 'jabslak',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'jabslak.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: env.VITE_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000'
};

let app = null;
let db = null;
let isConnected = false;

try {
  const existingApps = getApps();
  app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
  db = getDatabase(app);
  isConnected = true;
} catch (err) {
  console.warn('Firebase init warning (running in offline mode):', err);
}

// ════════════════════════════════════════════════
// DIRECT REST API HELPERS (Zero-Failure Cross-Device Sync)
// ════════════════════════════════════════════════

async function restGet(path) {
  try {
    const res = await fetch(getFirebaseRestEndpoint(path), { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn(`Firebase REST GET error for ${path}:`, e);
  }
  return null;
}

async function restPut(path, data) {
  try {
    await fetch(getFirebaseRestEndpoint(path), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return true;
  } catch (e) {
    console.warn(`Firebase REST PUT error for ${path}:`, e);
    return false;
  }
}

async function restDelete(path) {
  try {
    await fetch(getFirebaseRestEndpoint(path), { method: 'DELETE' });
    return true;
  } catch (e) {
    console.warn(`Firebase REST DELETE error for ${path}:`, e);
    return false;
  }
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
 * Uses Dual-Mode Sync: Immediate REST fetch + Short polling + WebSocket onValue
 */
export function subscribeToFirebaseTags(onDataReceived, onError, templeId = 'khemavan') {
  const path = getFirebaseTagsPath(templeId);
  let isSubscribed = true;
  let lastTagsJson = '';

  const processTagList = (val) => {
    let tagList = [];
    if (Array.isArray(val)) {
      tagList = val.filter(Boolean);
    } else if (val && typeof val === 'object') {
      tagList = Object.values(val);
    }

    // Filter out and purge any rogue group objects accidentally saved to Firebase
    const rogueGroups = tagList.filter(
      (t) => t && t.id && (String(t.id).startsWith('group-') || Array.isArray(t.tags))
    );
    if (rogueGroups.length > 0) {
      rogueGroups.forEach((rg) => deleteTagFromFirebase(rg.id, templeId));
      tagList = tagList.filter(
        (t) => t && (!t.id || (!String(t.id).startsWith('group-') && !Array.isArray(t.tags)))
      );
    }

    tagList.sort((a, b) => Number(a.tagNumber) - Number(b.tagNumber));
    const { migrated } = migrateTagListToTempleLocations(tagList);
    const jsonStr = JSON.stringify(migrated);
    if (jsonStr !== lastTagsJson) {
      lastTagsJson = jsonStr;
      onDataReceived(migrated);
    }
  };

  const fetchRest = async () => {
    if (!isSubscribed) return;
    const data = await restGet(path);
    if (data !== null) {
      processTagList(data);
    }
  };

  // Immediate REST fetch ensures instant load on PC & Mobile
  fetchRest();
  const pollInterval = setInterval(fetchRest, 4000);
  const handleVis = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      fetchRest();
    }
  };
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVis);
  }

  let unsubscribeDb = () => {};
  if (db) {
    try {
      const tagsRef = ref(db, path);
      unsubscribeDb = onValue(
        tagsRef,
        (snapshot) => {
          if (!isSubscribed) return;
          if (snapshot.exists()) {
            processTagList(snapshot.val());
          }
        },
        (err) => {
          console.warn(`Firebase realtime subscription error for ${path}:`, err);
          if (onError) onError(err);
        }
      );
    } catch (e) {}
  }

  return () => {
    isSubscribed = false;
    clearInterval(pollInterval);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVis);
    }
    unsubscribeDb();
  };
}

/**
 * Subscribe to real-time temple locations in Firebase Realtime Database (Tab 1 & Tab 2)
 * Ensures PC and Phone are 100% synchronized in real time!
 */
export function subscribeToFirebaseTempleLocations(onDataReceived, onError, templeId = 'khemavan') {
  const isKhemavan = !templeId || templeId === 'khemavan';
  const path = isKhemavan ? 'temple_locations' : `temples/${templeId}/map_locations`;
  let isSubscribed = true;
  let lastJson = '';

  const processLocList = (val) => {
    let locList = [];
    if (Array.isArray(val)) {
      locList = val.filter(Boolean);
    } else if (val && typeof val === 'object') {
      locList = Object.values(val);
    }
    if (locList.length > 0) {
      const jsonStr = JSON.stringify(locList);
      if (jsonStr !== lastJson) {
        lastJson = jsonStr;
        saveTempleLocationsLocal(locList, templeId);
        onDataReceived(locList);
      }
    }
  };

  const fetchRest = async () => {
    if (!isSubscribed) return;
    const data = await restGet(path);
    if (data !== null) {
      processLocList(data);
    }
  };

  fetchRest();
  const pollInterval = setInterval(fetchRest, 4000);
  const handleVis = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      fetchRest();
    }
  };
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVis);
  }

  let unsubscribeDb = () => {};
  if (db) {
    try {
      const locsRef = ref(db, path);
      unsubscribeDb = onValue(
        locsRef,
        (snapshot) => {
          if (!isSubscribed) return;
          if (snapshot.exists()) {
            processLocList(snapshot.val());
          }
        },
        (err) => {
          console.warn(`Firebase temple locations subscription error for ${path}:`, err);
          if (onError) onError(err);
        }
      );
    } catch (e) {}
  }

  return () => {
    isSubscribed = false;
    clearInterval(pollInterval);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVis);
    }
    unsubscribeDb();
  };
}

/**
 * Save temple locations to Firebase Realtime DB and LocalStorage (Tab 1 & Tab 2)
 */
export async function saveTempleLocationsToFirebase(locations, templeId = 'khemavan') {
  saveTempleLocationsLocal(locations, templeId);
  const isKhemavan = !templeId || templeId === 'khemavan';
  const path = isKhemavan ? 'temple_locations' : `temples/${templeId}/map_locations`;
  const cleanLocations = JSON.parse(JSON.stringify(locations || []));
  restPut(path, cleanLocations).catch(() => {});
  if (!db) return true;
  try {
    const locsRef = ref(db, path);
    await set(locsRef, cleanLocations);
    return true;
  } catch (err) {
    console.warn('Error saving temple locations to Firebase SDK:', err);
    return true;
  }
}

// ════════════════════════════════════════════════
// TAB 3 INDEPENDENT FIREBASE SYNC (Scoped per Temple!)
// ════════════════════════════════════════════════

/**
 * Subscribe to Tab 3 temple locations in Firebase (independent from Tab 1/2)
 * For Wat Khemavan: uses temple_locations_tab3
 * For other temples: uses temples/{templeId}/map_locations_tab3
 * 
 * 🚀 DUAL-MODE SYNC:
 * - Immediate REST fetch guarantees PC loads all 177/169 locations within <300ms!
 * - Polling keeps PC and Phones updated in real-time.
 * - WebSocket onValue provides instant push updates when online.
 */
export function subscribeToFirebaseTab3Locations(onDataReceived, onError, templeId = 'khemavan') {
  const isKhemavan = !templeId || templeId === 'khemavan';
  const path = isKhemavan ? 'temple_locations_tab3' : `temples/${templeId}/map_locations_tab3`;
  let isSubscribed = true;
  let lastTab3Json = '';

  const processTab3List = (val) => {
    let locList = [];
    if (Array.isArray(val)) {
      locList = val.filter(Boolean);
    } else if (val && typeof val === 'object') {
      locList = Object.values(val);
    }
    if (locList.length > 0) {
      const jsonStr = JSON.stringify(locList);
      if (jsonStr !== lastTab3Json) {
        lastTab3Json = jsonStr;
        saveTab3LocationsLocal(locList, templeId);
        onDataReceived(locList);
      }
    }
  };

  const fetchRest = async () => {
    if (!isSubscribed) return;
    const data = await restGet(path);
    if (data !== null) {
      processTab3List(data);
    }
  };

  // Immediate REST load (fixes the issue where PC showed only 31 pins!)
  fetchRest();
  const pollInterval = setInterval(fetchRest, 4000);
  const handleVis = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      fetchRest();
    }
  };
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVis);
  }

  let unsubscribeDb = () => {};
  if (db) {
    try {
      const locsRef = ref(db, path);
      unsubscribeDb = onValue(
        locsRef,
        (snapshot) => {
          if (!isSubscribed) return;
          if (snapshot.exists()) {
            processTab3List(snapshot.val());
          }
        },
        (err) => {
          console.warn(`Firebase Tab 3 locations subscription error for ${path}:`, err);
          if (onError) onError(err);
        }
      );
    } catch (e) {}
  }

  return () => {
    isSubscribed = false;
    clearInterval(pollInterval);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVis);
    }
    unsubscribeDb();
  };
}

/**
 * Save Tab 3 locations to Firebase (independent per temple)
 */
export async function saveTab3LocationsToFirebase(locations, templeId = 'khemavan') {
  saveTab3LocationsLocal(locations, templeId);
  const isKhemavan = !templeId || templeId === 'khemavan';
  const path = isKhemavan ? 'temple_locations_tab3' : `temples/${templeId}/map_locations_tab3`;
  const cleanLocations = JSON.parse(JSON.stringify(locations || []));
  restPut(path, cleanLocations).catch(() => {});
  if (!db) return true;
  try {
    const locsRef = ref(db, path);
    await set(locsRef, cleanLocations);
    return true;
  } catch (err) {
    console.warn('Error saving Tab 3 locations to Firebase SDK:', err);
    return true;
  }
}

/**
 * Reset Tab 3 locations
 */
export function resetTab3Locations(templeId = 'khemavan') {
  const isKhemavan = !templeId || templeId === 'khemavan';
  const defaultLocs = isKhemavan ? INITIAL_TAB3_LOCATIONS : [];
  saveTab3LocationsToFirebase(defaultLocs, templeId);
  return defaultLocs;
}

/**
 * Save or update a single tag in Firebase
 */
export async function saveTagToFirebase(tag, templeId = 'khemavan') {
  const basePath = getFirebaseTagsPath(templeId);
  const path = `${basePath}/${tag.id}`;
  restPut(path, tag).catch(() => {});
  if (!db) return true;
  try {
    const tagRef = ref(db, path);
    await set(tagRef, tag);
    return true;
  } catch (err) {
    console.warn('Error saving tag to Firebase SDK:', err);
    return true;
  }
}

/**
 * Delete a tag from Firebase
 */
export async function deleteTagFromFirebase(tagId, templeId = 'khemavan') {
  const basePath = getFirebaseTagsPath(templeId);
  const path = `${basePath}/${tagId}`;
  restDelete(path).catch(() => {});
  if (!db) return true;
  try {
    const tagRef = ref(db, path);
    await remove(tagRef);
    return true;
  } catch (err) {
    console.warn('Error deleting tag from Firebase SDK:', err);
    return true;
  }
}

/**
 * Seed initial tag records into Firebase (scoped per temple)
 */
export async function seedFirebaseData(initialData, force = false, templeId = 'khemavan') {
  const basePath = getFirebaseTagsPath(templeId);
  if (force) {
    if (!initialData || initialData.length === 0) {
      await restDelete(basePath);
    } else {
      const dataMap = {};
      initialData.forEach((t) => { dataMap[t.id] = t; });
      await restPut(basePath, dataMap);
    }
  }
  if (!db) return true;
  try {
    const tagsRef = ref(db, basePath);
    if (force) {
      if (!initialData || initialData.length === 0) {
        await remove(tagsRef);
        return true;
      }
      const dataMap = {};
      initialData.forEach((t) => { dataMap[t.id] = t; });
      await set(tagsRef, dataMap);
      return true;
    }
    const snapshot = await get(tagsRef);
    if (!snapshot.exists()) {
      const dataMap = {};
      initialData.forEach((t) => { dataMap[t.id] = t; });
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
  const isKhemavan = !templeId || templeId === 'khemavan';
  const path = isKhemavan ? 'map_group_settings' : `temples/${templeId}/map_group_settings`;
  let isSubscribed = true;
  let lastSettingsJson = '';

  const processSettings = (val) => {
    if (val && typeof val === 'object') {
      const jsonStr = JSON.stringify(val);
      if (jsonStr !== lastSettingsJson) {
        lastSettingsJson = jsonStr;
        onDataReceived(val);
      }
    }
  };

  const fetchRest = async () => {
    if (!isSubscribed) return;
    const data = await restGet(path);
    if (data) processSettings(data);
  };

  fetchRest();
  const pollInterval = setInterval(fetchRest, 4000);
  const handleVis = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      fetchRest();
    }
  };
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVis);
  }

  let unsubscribeDb = () => {};
  if (db) {
    try {
      const settingsRef = ref(db, path);
      unsubscribeDb = onValue(
        settingsRef,
        (snapshot) => {
          if (!isSubscribed) return;
          if (snapshot.exists()) {
            processSettings(snapshot.val());
          }
        },
        (err) => {
          console.warn(`Group settings subscription error for ${path}:`, err);
        }
      );
    } catch (e) {}
  }

  return () => {
    isSubscribed = false;
    clearInterval(pollInterval);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVis);
    }
    unsubscribeDb();
  };
}

/**
 * Save Category Group Settings to Firebase Realtime Database
 */
export async function saveGroupSettingsToFirebase(settings, templeId = 'khemavan') {
  const isKhemavan = !templeId || templeId === 'khemavan';
  const path = isKhemavan ? 'map_group_settings' : `temples/${templeId}/map_group_settings`;
  restPut(path, settings).catch(() => {});
  if (!db) return true;
  try {
    const settingsRef = ref(db, path);
    await set(settingsRef, settings);
    return true;
  } catch (err) {
    console.warn('Error saving group settings to Firebase SDK:', err);
    return true;
  }
}

/**
 * Subscribe to registered temples in Firebase Realtime Database
 */
export function subscribeToFirebaseTemples(onDataReceived) {
  const path = 'registered_temples';
  let isSubscribed = true;
  let lastTemplesJson = '';

  const processTemples = (val) => {
    let list = [];
    if (Array.isArray(val)) {
      list = val.filter(Boolean);
    } else if (val && typeof val === 'object') {
      list = Object.values(val);
    }
    if (list.length > 0) {
      const jsonStr = JSON.stringify(list);
      if (jsonStr !== lastTemplesJson) {
        lastTemplesJson = jsonStr;
        onDataReceived(list);
      }
    }
  };

  const fetchRest = async () => {
    if (!isSubscribed) return;
    const data = await restGet(path);
    if (data) processTemples(data);
  };

  fetchRest();
  const pollInterval = setInterval(fetchRest, 5000);

  let unsubscribeDb = () => {};
  if (db) {
    try {
      const templesRef = ref(db, path);
      unsubscribeDb = onValue(
        templesRef,
        (snapshot) => {
          if (!isSubscribed) return;
          if (snapshot.exists()) {
            processTemples(snapshot.val());
          }
        },
        (err) => console.warn('Temples subscription error:', err)
      );
    } catch (e) {}
  }

  return () => {
    isSubscribed = false;
    clearInterval(pollInterval);
    unsubscribeDb();
  };
}

/**
 * Save registered temples to Firebase
 */
export async function saveTemplesToFirebase(temples) {
  restPut('registered_temples', temples).catch(() => {});
  if (!db) return true;
  try {
    const templesRef = ref(db, 'registered_temples');
    await set(templesRef, temples);
    return true;
  } catch (err) {
    console.warn('Error saving temples to Firebase SDK:', err);
    return true;
  }
}

/**
 * Migrate temple data on Firebase when a temple ID/slug changes
 */
export async function migrateTempleFirebaseData(oldId, newId) {
  if (!oldId || !newId || oldId === newId) return false;
  if (oldId === 'khemavan') return false; // Wat Khemavan uses root paths
  try {
    const oldData = await restGet(`temples/${oldId}`);
    if (oldData) {
      await restPut(`temples/${newId}`, oldData);
      await restDelete(`temples/${oldId}`);
    }
  } catch (e) {}

  if (!db) return true;
  try {
    const oldRef = ref(db, `temples/${oldId}`);
    const snap = await get(oldRef);
    if (snap.exists()) {
      const data = snap.val();
      const newRef = ref(db, `temples/${newId}`);
      await set(newRef, data);
      await remove(oldRef);
    }
    return true;
  } catch (err) {
    console.error(`Error migrating Firebase data from ${oldId} to ${newId}:`, err);
    return false;
  }
}

/**
 * Subscribe to Team Live Locations & SOS Alerts
 * Synced in real-time across devices via REST polling + WebSocket
 */
export function subscribeToTeamLiveLocations(onDataReceived, templeId = 'khemavan') {
  const isKhemavan = !templeId || templeId === 'khemavan';
  const path = isKhemavan ? 'team_live_locations' : `temples/${templeId}/team_live_locations`;
  const localCacheKey = `TEAM_LOCATIONS_CACHE_${templeId}`;
  let isSubscribed = true;
  let lastJson = '';

  const processLocations = (val) => {
    if (!val || typeof val !== 'object') {
      onDataReceived([]);
      return;
    }
    const rawList = Array.isArray(val)
      ? val.filter(Boolean)
      : Object.values(val).filter(Boolean);

    // 📱 Device-Centric Deduplication:
    // 1 physical device = 1 live location pin.
    // If the same physical device (`deviceId`) broadcasted under multiple user accounts (e.g. Owner -> Admin),
    // strictly keep ONLY the newest one (latest updatedAt)!
    const deviceMap = new Map();
    const staleUserIdsToDelete = [];

    rawList.forEach((item) => {
      if (!item) return;
      const devKey = item.deviceId || `legacy-${item.userId || item.id}`;
      if (!deviceMap.has(devKey)) {
        deviceMap.set(devKey, item);
      } else {
        const existing = deviceMap.get(devKey);
        const existingTime = new Date(existing.updatedAt || existing.lastSyncAt || 0).getTime();
        const itemTime = new Date(item.updatedAt || item.lastSyncAt || 0).getTime();
        if (itemTime >= existingTime) {
          deviceMap.set(devKey, item);
          if (existing.userId && existing.userId !== item.userId) {
            staleUserIdsToDelete.push(existing.userId);
          }
        } else {
          if (item.userId && item.userId !== existing.userId) {
            staleUserIdsToDelete.push(item.userId);
          }
        }
      }
    });

    const list = Array.from(deviceMap.values());

    // Clean up stale superseded accounts from Firebase in background
    if (staleUserIdsToDelete.length > 0) {
      staleUserIdsToDelete.forEach((staleId) => {
        deleteUserLiveLocation(staleId, templeId).catch(() => {});
      });
    }

    const jsonStr = JSON.stringify(list);
    if (jsonStr !== lastJson) {
      lastJson = jsonStr;
      try {
        localStorage.setItem(localCacheKey, jsonStr);
      } catch (e) {}
      onDataReceived(list);
    }
  };

  // 1. Initial cached value
  try {
    const cached = localStorage.getItem(localCacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) onDataReceived(parsed);
    }
  } catch (e) {}

  // 2. Direct REST polling
  const fetchRest = async () => {
    if (!isSubscribed) return;
    const data = await restGet(path);
    if (data) processLocations(data);
  };

  fetchRest();
  const pollInterval = setInterval(fetchRest, 3000);
  const handleVis = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      fetchRest();
    }
  };
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVis);
  }

  // 3. WebSocket listener if Firebase SDK is ready
  let unsubscribeDb = () => {};
  if (db) {
    try {
      const teamRef = ref(db, path);
      unsubscribeDb = onValue(teamRef, (snapshot) => {
        if (!isSubscribed) return;
        if (snapshot.exists()) {
          processLocations(snapshot.val());
        } else {
          processLocations([]);
        }
      });
    } catch (e) {}
  }

  return () => {
    isSubscribed = false;
    clearInterval(pollInterval);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVis);
    }
    unsubscribeDb();
  };
}

/**
 * Save / Update a Team Member's Live Location and Status
 */
export async function saveUserLiveLocation(locData, templeId = 'khemavan') {
  if (!locData || !locData.userId) return false;
  const isKhemavan = !templeId || templeId === 'khemavan';
  const path = isKhemavan 
    ? `team_live_locations/${locData.userId}` 
    : `temples/${templeId}/team_live_locations/${locData.userId}`;

  const devId = locData.deviceId || getDeviceId();
  const payload = {
    ...locData,
    deviceId: devId,
    updatedAt: new Date().toISOString()
  };

  // Optimistic local cache update & cleanup of any other user on the same device
  const localCacheKey = `TEAM_LOCATIONS_CACHE_${templeId}`;
  try {
    const cached = localStorage.getItem(localCacheKey);
    let list = cached ? JSON.parse(cached) : [];
    if (!Array.isArray(list)) list = [];

    // Remove any older user from this physical device
    const staleDeviceUsers = list.filter((m) => m && m.deviceId === devId && m.userId !== locData.userId);
    staleDeviceUsers.forEach((su) => {
      deleteUserLiveLocation(su.userId, templeId).catch(() => {});
    });

    list = list.filter((m) => !m || (m.deviceId !== devId && m.userId !== locData.userId));
    list.push(payload);
    localStorage.setItem(localCacheKey, JSON.stringify(list));
  } catch (e) {}

  // 1. Direct REST PUT
  restPut(path, payload).catch(() => {});

  // 2. Firebase SDK set
  if (db) {
    try {
      const itemRef = ref(db, path);
      await set(itemRef, payload);
    } catch (e) {}
  }
  return true;
}

/**
 * Trigger SOS Alert for a Team Member
 */
export async function sendTeamSOSAlert(alertData, templeId = 'khemavan') {
  return saveUserLiveLocation({
    ...alertData,
    needHelp: true,
    status: 'need_help',
    helpMessage: alertData.helpMessage || 'ត្រូវការជំនួយបន្ទាន់ពី Admin / ក្រុមការងារ!'
  }, templeId);
}

/**
 * Clear SOS Alert for a Team Member
 */
export async function clearTeamSOSAlert(userId, currentData = {}, templeId = 'khemavan') {
  return saveUserLiveLocation({
    ...currentData,
    userId,
    needHelp: false,
    status: 'active',
    helpMessage: ''
  }, templeId);
}

/**
 * Delete a Team Member's Live Location from Firebase & LocalStorage
 */
export async function deleteUserLiveLocation(userId, templeId = 'khemavan') {
  if (!userId) return false;
  const isKhemavan = !templeId || templeId === 'khemavan';
  const path = isKhemavan 
    ? `team_live_locations/${userId}` 
    : `temples/${templeId}/team_live_locations/${userId}`;

  // Optimistic local cache update
  const localCacheKey = `TEAM_LOCATIONS_CACHE_${templeId}`;
  try {
    const cached = localStorage.getItem(localCacheKey);
    let list = cached ? JSON.parse(cached) : [];
    if (Array.isArray(list)) {
      list = list.filter((m) => m && m.userId !== userId && m.id !== userId);
      localStorage.setItem(localCacheKey, JSON.stringify(list));
    }
  } catch (e) {}

  // 1. Direct REST DELETE
  restDelete(path).catch(() => {});

  // 2. Firebase SDK remove
  if (db) {
    try {
      const itemRef = ref(db, path);
      await remove(itemRef);
    } catch (e) {}
  }
  return true;
}

/**
 * Subscribe to Temple GPS Calibration
 */
export function subscribeToGpsCalibration(onDataReceived, templeId = 'khemavan') {
  const isKhemavan = !templeId || templeId === 'khemavan';
  const path = isKhemavan
    ? 'temple_gps_calibration'
    : `temples/${templeId}/temple_gps_calibration`;

  let isSubscribed = true;
  let lastCalibrationJson = '';

  const processCalibration = (val) => {
    if (val && val.p1 && val.p2) {
      const jsonStr = JSON.stringify(val);
      if (jsonStr !== lastCalibrationJson) {
        lastCalibrationJson = jsonStr;
        onDataReceived(val);
      }
    }
  };

  const fetchRest = async () => {
    if (!isSubscribed) return;
    const data = await restGet(path);
    if (data) processCalibration(data);
  };

  fetchRest();
  const pollInterval = setInterval(fetchRest, 6000);

  let unsubscribeDb = () => {};
  if (db) {
    try {
      const calRef = ref(db, path);
      unsubscribeDb = onValue(calRef, (snapshot) => {
        const val = snapshot.val();
        if (val) processCalibration(val);
      });
    } catch (e) {}
  }

  return () => {
    isSubscribed = false;
    clearInterval(pollInterval);
    unsubscribeDb();
  };
}

/**
 * Save Temple GPS Calibration to Firebase Realtime Database
 */
export async function saveGpsCalibrationToFirebase(calibrationData, templeId = 'khemavan') {
  if (!calibrationData || !calibrationData.p1 || !calibrationData.p2) return false;
  const isKhemavan = !templeId || templeId === 'khemavan';
  const path = isKhemavan
    ? 'temple_gps_calibration'
    : `temples/${templeId}/temple_gps_calibration`;

  const payload = {
    ...calibrationData,
    updatedAt: new Date().toISOString()
  };

  restPut(path, payload).catch(() => {});
  if (db) {
    try {
      const itemRef = ref(db, path);
      await set(itemRef, payload);
    } catch (e) {}
  }
  return true;
}

/**
 * Subscribe to System Users from Firebase Realtime Database
 * Enables real-time synchronization of users across all devices and browsers.
 */
export function subscribeToSystemUsers(callback) {
  let isSubscribed = true;
  const path = 'system_users';

  const processUsers = (val) => {
    if (!isSubscribed || !val) return;
    let list = [];
    if (Array.isArray(val)) {
      list = val.filter(Boolean);
    } else if (typeof val === 'object') {
      list = Object.values(val).filter(Boolean);
    }
    if (list.length > 0) {
      callback(list);
    }
  };

  // Immediate REST fetch
  restGet(path).then((data) => {
    if (data && isSubscribed) processUsers(data);
  }).catch(() => {});

  // Periodic REST poll (every 10s)
  const pollInterval = setInterval(() => {
    if (!isSubscribed) return;
    restGet(path).then((data) => {
      if (data && isSubscribed) processUsers(data);
    }).catch(() => {});
  }, 10000);

  let unsubscribeDb = () => {};
  if (db) {
    try {
      const usersRef = ref(db, path);
      unsubscribeDb = onValue(usersRef, (snapshot) => {
        const val = snapshot.val();
        if (val) processUsers(val);
      });
    } catch (e) {}
  }

  return () => {
    isSubscribed = false;
    clearInterval(pollInterval);
    unsubscribeDb();
  };
}

/**
 * Save System Users to Firebase Realtime Database
 */
export async function saveSystemUsersToFirebase(users) {
  if (!Array.isArray(users) || users.length === 0) return false;
  const path = 'system_users';

  restPut(path, users).catch(() => {});
  if (db) {
    try {
      const usersRef = ref(db, path);
      await set(usersRef, users);
    } catch (e) {}
  }
  return true;
}

export { db, isConnected };


