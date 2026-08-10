import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, remove, get } from 'firebase/database';

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
        onDataReceived(tagList);
      } else {
        onDataReceived(null); // Empty in cloud
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
 * Seed initial 1,000 tag records into Firebase if empty
 */
export async function seedFirebaseData(initialData) {
  if (!db) return false;
  try {
    const tagsRef = ref(db, 'tags');
    const snapshot = await get(tagsRef);
    if (!snapshot.exists()) {
      const dataMap = {};
      initialData.forEach((t) => {
        dataMap[t.id] = t;
      });
      await set(tagsRef, dataMap);
      console.log('Successfully seeded 1,000 tags into Firebase Realtime Database!');
      return true;
    }
  } catch (err) {
    console.error('Error seeding Firebase:', err);
  }
  return false;
}

export { db, isConnected };
