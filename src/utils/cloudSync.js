/**
 * Zero-config Cloud Sync service for Khmer Tag Manager
 * Syncs data in real time between PC and Mobile devices out of the box!
 */

const CLOUD_OBJECT_ID = 'ff8081819ff5b110019ff674d8b201e6';
const CLOUD_API_URL = `https://api.restful-api.dev/objects/${CLOUD_OBJECT_ID}`;

let lastSyncedTimestamp = 0;

/**
 * Push tags array to Cloud Storage
 */
export async function pushTagsToCloud(tags) {
  try {
    const payload = {
      name: 'Khmer Tag System Shared DB',
      data: {
        tags: tags,
        updatedAt: Date.now()
      }
    };

    const res = await fetch(CLOUD_API_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      lastSyncedTimestamp = Date.now();
      return true;
    }
  } catch (err) {
    console.warn('Cloud sync push error:', err);
  }
  return false;
}

/**
 * Fetch latest tags array from Cloud Storage
 */
export async function fetchTagsFromCloud() {
  try {
    const res = await fetch(CLOUD_API_URL, {
      cache: 'no-store'
    });

    if (res.ok) {
      const result = await res.json();
      if (result && result.data && Array.isArray(result.data.tags)) {
        return {
          tags: result.data.tags,
          updatedAt: result.data.updatedAt || 0
        };
      }
    }
  } catch (err) {
    console.warn('Cloud sync fetch error:', err);
  }
  return null;
}

/**
 * Subscribe to Cloud Storage updates (Polling every 4 seconds + on page focus)
 */
export function subscribeToCloudTags(onDataReceived) {
  let isSubscribed = true;
  let localLastUpdated = 0;

  const checkCloud = async () => {
    if (!isSubscribed) return;
    const data = await fetchTagsFromCloud();
    if (data && Array.isArray(data.tags) && data.updatedAt !== localLastUpdated) {
      localLastUpdated = data.updatedAt;
      onDataReceived(data.tags);
    }
  };

  // Immediate check
  checkCloud();

  // Periodic polling every 4 seconds
  const intervalId = setInterval(checkCloud, 4000);

  // Check immediately when user switches back to tab or turns on phone screen
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      checkCloud();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    isSubscribed = false;
    clearInterval(intervalId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
