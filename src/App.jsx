import React, { useState, useMemo, useEffect, useRef, startTransition, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Plus, AlertCircle, CheckCircle2, Map as MapIcon, ArrowLeft, Volume2, PhoneCall, MapPin } from 'lucide-react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import TagCard from './components/TagCard';
import TagTableView from './components/TagTableView';
import TagDetailModal from './components/TagDetailModal';
import TagFormModal from './components/TagFormModal';
import QRScannerModal from './components/QRScannerModal';
import ImportExportModal from './components/ImportExportModal';
import LocationStatsModal from './components/LocationStatsModal';

import AttendanceReportView from './components/AttendanceReportView';
// Note: AttendanceReportModal was removed — report is shown inline as viewMode='report'
import FirebaseConfigModal from './components/FirebaseConfigModal';
import MobileConnectModal from './components/MobileConnectModal';
import TempleMapModal from './components/TempleMapModal';
import RoleManagementModal from './components/RoleManagementModal';
import LoginModal from './components/LoginModal';
import TempleSelectModal from './components/TempleSelectModal';
import InstallAppModal from './components/InstallAppModal';
import ZoneAttendanceModal from './components/ZoneAttendanceModal';
import SplashScreen from './components/SplashScreen';
import { searchTags, westernToKhmerDigits, khmerToWesternDigits, getKhmerPhoneticSuggestions } from './utils/khmerSearch';
import { getSavedTags, saveTags, getSavedUsers, saveUsers, getCurrentUser, saveCurrentUser, GUEST_USER, getEffectiveUser, DEFAULT_USERS } from './utils/storage';
import {
  DEFAULT_TEMPLES,
  getSavedTemples,
  saveTemples,
  getTempleIdFromUrl,
  setTempleUrl,
  getTempleShareUrl,
  getSavedTagsForTemple,
  saveTagsForTemple,
  migrateTempleData
} from './utils/templeStorage';
import { checkAttendanceTogglePermission } from './utils/attendanceLock';
import {
  subscribeToFirebaseTags,
  saveTagToFirebase,
  deleteTagFromFirebase,
  seedFirebaseData,
  subscribeToFirebaseTemples,
  saveTemplesToFirebase,
  migrateTempleFirebaseData,
  subscribeToFirebaseTab3Locations,
  subscribeToTeamLiveLocations,
  deleteUserLiveLocation,
  clearTeamSOSAlert,
  subscribeToSystemUsers,
  saveSystemUsersToFirebase
} from './utils/firebase';
import { pushTagsToCloud, subscribeToCloudTags } from './utils/cloudSync';
import { phoneTracker } from './utils/phoneTracker';

export default function App() {
  const [tags, setTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const isSearching = searchQuery.trim().length > 0 || isSearchFocused;
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table' | 'map' | 'report'
  const [attendanceFilter, setAttendanceFilter] = useState('ALL'); // 'ALL' | 'notArrived' | 'arrived'
  const [reportActiveTab, setReportActiveTab] = useState('arrived'); // 'arrived' | 'notArrived' | 'all'
  const [availableYears, setAvailableYears] = useState(['2026', '2027']);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Stable callback — must NOT be an inline arrow or the SplashScreen timer resets on every re-render
  const handleSplashFinish = useCallback(() => setShowSplash(false), []);

  // Multi-Temple State
  const [temples, setTemples] = useState(() => getSavedTemples());
  const [currentTemple, setCurrentTemple] = useState(() => {
    const activeId = getTempleIdFromUrl();
    const all = getSavedTemples();
    const found = all.find((t) => t.id === activeId);
    if (found) return found;
    if (activeId && activeId !== 'khemavan') {
      const newT = {
        id: activeId,
        name: `វត្ត (${activeId})`,
        shortName: activeId,
        location: 'ប្រទេសកម្ពុជា',
        description: 'វត្តអារាមបានចែករំលែកតាមរយៈតំណភ្ជាប់ (Link)',
        mapImage: '/temple_map/map_new_latest.jpg',
        createdAt: new Date().toISOString().split('T')[0],
        isDefault: false
      };
      const merged = [...all, newT];
      saveTemples(merged);
      return newT;
    }
    return all[0];
  });
  const [isTempleSelectOpen, setIsTempleSelectOpen] = useState(false);

  // User & Role State
  const [users, setUsers] = useState(getSavedUsers());
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [isRoleManagementOpen, setIsRoleManagementOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Contextual Effective User & Permissions (Per-Temple Isolation)
  const effectiveUser = useMemo(() => {
    return getEffectiveUser(currentUser, currentTemple?.id);
  }, [currentUser, currentTemple]);

  // Modals state
  const [selectedTag, setSelectedTag] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isLocationStatsOpen, setIsLocationStatsOpen] = useState(false);

  const [isCloudConfigOpen, setIsCloudConfigOpen] = useState(false);
  const [isMobileConnectOpen, setIsMobileConnectOpen] = useState(false);
  const [isTempleMapOpen, setIsTempleMapOpen] = useState(false);
  const [templeMapTargetLoc, setTempleMapTargetLoc] = useState(null);
  const [isZoneAttendanceModalOpen, setIsZoneAttendanceModalOpen] = useState(false);
  const [locationAllowedPopup, setLocationAllowedPopup] = useState(null);
  
  // PWA Install State
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // 👥 Real-time Cloud Synchronization & Multi-tab Sync for System Users
  useEffect(() => {
    const unsub = subscribeToSystemUsers((cloudUsers) => {
      if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
        setUsers((prev) => {
          const map = new Map();
          // 1. Base DEFAULT_USERS
          DEFAULT_USERS.forEach((u) => map.set(u.id, u));
          // 2. Overlay previous state
          (prev || []).forEach((u) => {
            if (u && u.id) map.set(u.id, u);
          });
          // 3. Overlay cloud users (source of truth across all devices)
          cloudUsers.forEach((u) => {
            if (u && u.id) map.set(u.id, u);
          });
          const merged = Array.from(map.values());
          saveUsers(merged);
          return merged;
        });
      } else {
        // If cloud is currently empty, seed it with current local users
        const currentLocal = getSavedUsers();
        if (currentLocal && currentLocal.length > 0) {
          saveSystemUsersToFirebase(currentLocal);
        }
      }
    });

    const handleStorage = (e) => {
      if (e.key === 'KHMER_TAG_SYSTEM_USERS_V1') {
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated) && updated.length > 0) {
            setUsers(updated);
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      unsub();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // 🛰️ Immediate Location Acquired Event -> Show Popup for Admin/Assistant
  useEffect(() => {
    const handleLocAllowed = (e) => {
      const spot = e?.detail?.spot;
      if (spot && effectiveUser && effectiveUser.role !== 'guest') {
        if (!isTempleMapOpen) {
          setLocationAllowedPopup({ spot, user: effectiveUser });
        }
      }
    };

    window.addEventListener('phone-location-allowed', handleLocAllowed);
    return () => window.removeEventListener('phone-location-allowed', handleLocAllowed);
  }, [effectiveUser, isTempleMapOpen]);

  // 🚨 Real-time Global Team SOS Alert Monitor
  const [teamLocations, setTeamLocations] = useState([]);
  useEffect(() => {
    const unsub = subscribeToTeamLiveLocations(setTeamLocations, currentTemple.id);
    return () => unsub();
  }, [currentTemple.id]);

  // 🛰️ Live Phone Location & Motion Tracking for Logged-in Team Members
  useEffect(() => {
    if (effectiveUser && effectiveUser.role !== 'guest') {
      phoneTracker.start({
        user: effectiveUser,
        templeId: currentTemple?.id || 'khemavan'
      });
    } else {
      phoneTracker.stop();
    }
    return () => {
      phoneTracker.stop();
    };
  }, [effectiveUser, currentTemple?.id]);

  const activeGlobalSOS = useMemo(() => {
    return teamLocations.find((m) => Boolean(m.needHelp));
  }, [teamLocations]);

  // ⏱️ Auto-Lock 15s refresh interval to keep lock status and timers live
  const [, setAutoLockTicker] = useState(0);
  const [uncheckingTagId, setUncheckingTagId] = useState(null);
  const lastUncheckClickRef = useRef({ tagId: null, time: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      setAutoLockTicker((t) => t + 1);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('បានដំឡើងជា Mobile App រួចរាល់!');
      }
      setDeferredPrompt(null);
      setIsInstallModalOpen(false);
    }
  };
  
  // Toast notification
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((msg) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const handleToggleYear = () => {
    const currIdx = availableYears.indexOf(selectedYear);
    const nextIdx = (currIdx + 1) % availableYears.length;
    const nextY = availableYears[nextIdx];
    setSelectedYear(nextY);
    showToast(`បានប្តូរទៅ ៖ ឆ្នាំ ${westernToKhmerDigits(nextY)}`);
  };

  const handleAddYear = () => {
    const input = window.prompt('សូមបញ្ចូលឆ្នាំថ្មី (ឧទាហរណ៍ ៖ ២០២៨):', '2028');
    if (!input) return;

    // Use existing utility to convert any Khmer digits to Western digits
    const cleanYear = khmerToWesternDigits(input.trim());
    if (!cleanYear || isNaN(Number(cleanYear)) || cleanYear.length < 4) {
      alert('សូមបញ្ចូលលេខឆ្នាំឱ្យបានត្រឹមត្រូវ! (ឧ. 2028 ឬ ២០២៨)');
      return;
    }

    if (!availableYears.includes(cleanYear)) {
      setAvailableYears(prev => [...prev, cleanYear].sort());
    }
    setSelectedYear(cleanYear);
    showToast(`បានបន្ថែម ៖ ឆ្នាំ ${westernToKhmerDigits(cleanYear)}`);
  };

  // Check if any modal is currently active
  const hasActiveModal = Boolean(
    selectedTag ||
    isFormOpen ||
    isQRScannerOpen ||
    isImportExportOpen ||
    isLocationStatsOpen ||
    isCloudConfigOpen ||
    isMobileConnectOpen ||
    isTempleMapOpen ||
    isRoleManagementOpen ||
    isLoginModalOpen ||
    isTempleSelectOpen
  );

  const closeAllModals = () => {
    setSelectedTag(null);
    setIsFormOpen(false);
    setIsQRScannerOpen(false);
    setIsImportExportOpen(false);
    setIsLocationStatsOpen(false);
    setIsCloudConfigOpen(false);
    setIsMobileConnectOpen(false);
    setIsTempleMapOpen(false);
    setIsRoleManagementOpen(false);
    setIsLoginModalOpen(false);
    setIsTempleSelectOpen(false);
    setEditingTag(null);
  };

  // Ref to track last back press timestamp for Double-Back-To-Exit feature
  const lastBackPressTimeRef = useRef(0);
  const isHistoryPushedRef = useRef(false);
  // Ref to auto-reset cloud sync indicator
  const cloudSyncTimerRef = useRef(null);
  // Ref to always hold the latest handleNavigateBack (avoids stale closure in swipe handler)
  const handleNavigateBackRef = useRef(null);

  // Push initial history guard entry on mount so browser back button is intercepted
  useEffect(() => {
    try {
      window.history.pushState({ appRootGuard: true }, '');
      isHistoryPushedRef.current = true;
    } catch {}
  }, []);

  // Back Navigation Handler with Double-Back Press Exit Guard
  const handleNavigateBack = () => {
    // 1. If any modal is active -> Close all modals
    if (hasActiveModal) {
      closeAllModals();
      showToast('បិទផ្ទាំង');
      return true;
    }

    // 2. If viewMode is not 'grid' -> Return to Home Screen
    if (viewMode !== 'grid') {
      setViewMode('grid');
      showToast('ត្រឡប់ទៅផ្ទាំងដើម');
      return true;
    }

    // 3. If filters are active -> Reset to default list
    if (attendanceFilter !== 'ALL' || selectedLocation !== 'ALL' || searchQuery) {
      setAttendanceFilter('ALL');
      setSelectedLocation('ALL');
      setSearchQuery('');
      showToast('បង្ហាញបញ្ជីដើម');
      return true;
    }

    // 4. Already on Home Screen (Grid View with default filters) -> DOUBLE BACK PRESS GUARD TO EXIT!
    const now = Date.now();
    if (now - lastBackPressTimeRef.current < 2500) {
      // Pressed back 2 times within 2.5s -> Allow exit!
      showToast('ចាកចេញពីកម្មវិធី');
      try {
        window.history.go(-1);
      } catch {}
      return false;
    } else {
      // 1st back press -> Prompt user and lock history
      lastBackPressTimeRef.current = now;
      try {
        window.history.pushState({ appRootGuard: true }, '');
      } catch {}
      showToast('ថយម្ដងទៀត');
      return true;
    }
  };
  // Keep ref always up-to-date so swipe handler never uses a stale closure
  handleNavigateBackRef.current = handleNavigateBack;

  // Sync browser back button (popstate event) with double-back exit lock
  useEffect(() => {
    const handlePopState = () => {
      if (hasActiveModal) {
        closeAllModals();
        try {
          window.history.pushState({ appRootGuard: true }, '');
        } catch {}
      } else if (viewMode !== 'grid') {
        setViewMode('grid');
        try {
          window.history.pushState({ appRootGuard: true }, '');
        } catch {}
      } else if (searchQuery || selectedLocation !== 'ALL' || attendanceFilter !== 'ALL') {
        setSearchQuery('');
        setSelectedLocation('ALL');
        setAttendanceFilter('ALL');
        try {
          window.history.pushState({ appRootGuard: true }, '');
        } catch {}
      } else {
        // User is on Home Screen -> Execute Double Back Guard
        const now = Date.now();
        if (now - lastBackPressTimeRef.current < 2500) {
          // Exit web app (2nd press)
          showToast('ចាកចេញពីកម្មវិធី');
        } else {
          // 1st press -> Lock and prompt
          lastBackPressTimeRef.current = now;
          try {
            window.history.pushState({ appRootGuard: true }, '');
          } catch {}
          showToast('ថយម្ដងទៀត');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasActiveModal, viewMode, searchQuery, selectedLocation, attendanceFilter, showToast]);
  // ===== SWIPE GESTURES + DOUBLE SWIPE-RIGHT EXIT GUARD FOR TELEGRAM =====
  // - Swipe Right→Left: switch filter tab forward (ALL → notArrived → arrived → ALL)
  // - Swipe Left→Right (inside modal/map/report): go back
  // - Swipe Left→Right (home grid with filter active): reset filter
  // - Swipe Left→Right (home grid, no filter = 2x required to exit to Telegram)
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const lastSwipeRightTimeRef = useRef(0);

  // Store latest state values in a ref so they're accessible inside document event listener
  const swipeStateRef = useRef({});
  useEffect(() => {
    swipeStateRef.current = { hasActiveModal, viewMode, attendanceFilter, selectedLocation, searchQuery, isTempleMapOpen, showToast };
  });

  useEffect(() => {
    const handleTouchStart = (e) => {
      if (e.touches && e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now()
        };
      }
    };

    const handleTouchEnd = (e) => {
      if (!e.changedTouches || e.changedTouches.length !== 1) return;

      const { isTempleMapOpen: mapOpen } = swipeStateRef.current;
      if (mapOpen) return; // IGNORE all global swipe gestures when Temple Map Modal is open so panning/zooming never closes the map!

      const target = e.target;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.closest?.('.map-pin-element') ||
        target.closest?.('.zoom-toolbar') ||
        target.closest?.('.temple-map-modal') ||
        target.closest?.('.temple-map-container')
      ) return;

      const touch = e.changedTouches[0];
      const startX = touchStartRef.current.x;
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      const { hasActiveModal: modal, viewMode: vm, attendanceFilter: af, showToast: toastFn } = swipeStateRef.current;
      const notify = (msg) => { if (toastFn) toastFn(msg); };

      // ── Swipe Right→Left (switch filter forward) ──
      if (deltaX < -35 && Math.abs(deltaY) < 120 && deltaTime < 900) {
        if (!modal && vm === 'grid') {
          if (af === 'ALL') {
            notify('▶ ប្តូរទៅតម្រង ៖ មិនទាន់មកដល់');
            startTransition(() => setAttendanceFilter('notArrived'));
          } else if (af === 'notArrived') {
            notify('▶ ប្តូរទៅតម្រង ៖ បានមកដល់');
            startTransition(() => setAttendanceFilter('arrived'));
          } else {
            notify('▶ ប្តូរទៅតម្រង ៖ ទាំងអស់');
            startTransition(() => setAttendanceFilter('ALL'));
          }
        }
        return;
      }

      // ── Swipe Left→Right ──
      if (deltaX > 35 && Math.abs(deltaY) < 120 && deltaTime < 900) {
        // A. Close modal or go back from map/report view
        if (modal || vm !== 'grid') {
          handleNavigateBackRef.current();
          return;
        }

        // B. Reset active filter (go back one filter step)
        if (af !== 'ALL') {
          if (af === 'arrived') {
            notify('◀ ប្តូរទៅតម្រង ៖ មិនទាន់មកដល់');
            startTransition(() => setAttendanceFilter('notArrived'));
          } else {
            notify('◀ ប្តូរទៅតម្រង ៖ ទាំងអស់');
            startTransition(() => setAttendanceFilter('ALL'));
          }
          return;
        }

        // C. Home grid, no filter → Double swipe-right to exit to Telegram
        const now = Date.now();
        if (now - lastSwipeRightTimeRef.current < 2500) {
          lastSwipeRightTimeRef.current = 0;
          notify('ចាកចេញពីកម្មវិធី');
          setTimeout(() => { try { window.history.go(-2); } catch {} }, 300);
        } else {
          lastSwipeRightTimeRef.current = now;
          try { window.history.pushState({ appRootGuard: true }, ''); } catch {}
          notify('អូសម្ដងទៀតដើម្បីចេញ');
        }
        return;
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);
  // ================================================================


  // Subscribe to registered temples in Firebase Realtime Database
  useEffect(() => {
    const unsubscribeTemples = subscribeToFirebaseTemples((fbTemples) => {
      if (Array.isArray(fbTemples) && fbTemples.length > 0) {
        const hasKhemavan = fbTemples.some((t) => t.id === 'khemavan');
        const listToUse = hasKhemavan ? fbTemples : [DEFAULT_TEMPLES[0], ...fbTemples];
        setTemples(listToUse);
        saveTemples(listToUse);

        setCurrentTemple((prev) => {
          const matched = listToUse.find((t) => t.id === prev?.id);
          return matched || prev;
        });
      }
    });

    return () => {
      unsubscribeTemples();
    };
  }, []);

  // Multi-Temple Handlers
  const handleSelectTemple = (temple) => {
    setCurrentTemple(temple);
    setTempleUrl(temple.id);
    showToast(`បានប្តូរទៅកាន់ ៖ ${temple.name}`);
  };

  const handleAddTemple = (newTemple) => {
    const updated = [...temples, newTemple];
    setTemples(updated);
    saveTemples(updated);
    saveTemplesToFirebase(updated);
    setCurrentTemple(newTemple);
    setTempleUrl(newTemple.id);
  };

  const handleUpdateTemple = (updatedTemple, oldId = null) => {
    const targetId = oldId || updatedTemple.id;
    if (oldId && oldId !== updatedTemple.id) {
      migrateTempleData(oldId, updatedTemple.id);
      migrateTempleFirebaseData(oldId, updatedTemple.id);
    }
    const updated = temples.map((t) => (t.id === targetId ? updatedTemple : t));
    setTemples(updated);
    saveTemples(updated);
    saveTemplesToFirebase(updated);
    if (currentTemple?.id === targetId) {
      setCurrentTemple(updatedTemple);
      setTempleUrl(updatedTemple.id);
    }
  };

  const handleDeleteTemple = (templeId) => {
    if (templeId === 'khemavan') return;
    const updated = temples.filter((t) => t.id !== templeId);
    setTemples(updated);
    saveTemples(updated);
    saveTemplesToFirebase(updated);
    if (currentTemple?.id === templeId) {
      const defaultT = updated[0];
      setCurrentTemple(defaultT);
      setTempleUrl(defaultT.id);
    }
  };

  const handleUpdateTempleMap = (templeId, newMapImage) => {
    const updated = temples.map((t) => (t.id === templeId ? { ...t, mapImage: newMapImage } : t));
    setTemples(updated);
    saveTemples(updated);
    saveTemplesToFirebase(updated);
    if (currentTemple?.id === templeId) {
      setCurrentTemple((prev) => ({ ...prev, mapImage: newMapImage }));
    }
  };

  // Load initial tags & subscribe to Cloud & Firebase Realtime updates
  useEffect(() => {
    // Helper: mark cloud as syncing and auto-reset after 5s
    const markSynced = () => {
      setIsCloudSyncing(true);
      clearTimeout(cloudSyncTimerRef.current);
      cloudSyncTimerRef.current = setTimeout(() => setIsCloudSyncing(false), 5000);
    };

    // 1. Load local fallback for current temple
    const localTags = getSavedTagsForTemple(currentTemple.id);
    setTags(localTags);

    // 2. Subscribe to Zero-Config Cloud Sync (ONLY for Wat Khemavan)
    let unsubscribeCloud = () => {};
    if (currentTemple.id === 'khemavan') {
      unsubscribeCloud = subscribeToCloudTags((cloudTags) => {
        if (Array.isArray(cloudTags)) {
          setTags(cloudTags);
          saveTagsForTemple('khemavan', cloudTags);
          markSynced();
        }
      });
    }

    // 3. Subscribe to Firebase Realtime Database (scoped to currentTemple.id)
    const unsubscribeFirebase = subscribeToFirebaseTags(
      (fbTags) => {
        if (Array.isArray(fbTags)) {
          setTags(fbTags);
          saveTagsForTemple(currentTemple.id, fbTags);
          markSynced();
        }
      },
      (err) => {
        console.warn(`Using Local Storage fallback for temple ${currentTemple.id}:`, err);
      },
      currentTemple.id
    );

    // 4. Preload & Prime Tab 3 Map Locations into localStorage cache
    const unsubscribeTab3 = subscribeToFirebaseTab3Locations(
      () => {},
      () => {},
      currentTemple.id
    );

    return () => {
      unsubscribeCloud();
      unsubscribeFirebase();
      unsubscribeTab3();
      clearTimeout(cloudSyncTimerRef.current);
    };
  }, [currentTemple.id]);

  // Filter tags by selected year (default 2026 for unassigned tags)
  const yearTags = useMemo(() => {
    return tags.filter((t) => (t.year || '2026') === selectedYear);
  }, [tags, selectedYear]);

  // Filter tags in real-time for current selected year
  const filteredTags = useMemo(() => {
    return searchTags(yearTags, searchQuery, selectedLocation, attendanceFilter);
  }, [yearTags, searchQuery, selectedLocation, attendanceFilter]);

  // Compute sound-alike / phonetic recommendations for current search query
  const phoneticSuggestions = useMemo(() => {
    return getKhmerPhoneticSuggestions(yearTags, searchQuery, 4);
  }, [yearTags, searchQuery]);

  // Arrived & Not Arrived count calculation for current year
  const arrivedCount = useMemo(() => {
    return yearTags.filter((t) => !!t.arrived).length;
  }, [yearTags]);

  const notArrivedCount = useMemo(() => {
    return yearTags.filter((t) => !t.arrived).length;
  }, [yearTags]);

  // Compute next available tag number for current year
  const nextAvailableTagNumber = useMemo(() => {
    if (!yearTags || yearTags.length === 0) return 1;
    const maxNum = Math.max(...yearTags.map((t) => Number(t.tagNumber) || 0));
    return maxNum + 1;
  }, [yearTags]);

  // Handle open map focused on a location
  const handleOpenMapWithLocation = (locName) => {
    setTempleMapTargetLoc(locName);
    setIsTempleMapOpen(true);
  };

  // Attendance Toggle Handler ("គ្រីសអ្នកបានមកដល់")
  const handleToggleAttendance = async (tagToToggle) => {
    if (effectiveUser?.role === 'guest') {
      alert('សិទ្ធិ Guest អាចមើល និងស្វែងរកប៉ុណ្ណោះ! មិនអាចគ្រីសមកដល់បានទេ (សម្រាប់តែក្រុមការងារ)');
      return;
    }

    const targetItems = tagToToggle.tags && tagToToggle.tags.length > 0 ? tagToToggle.tags : [tagToToggle];
    const targetIds = new Set(targetItems.map((t) => t.id));
    if (String(tagToToggle.id).startsWith('group-')) {
      targetIds.add(tagToToggle.id);
    }
    const allArrived = targetItems.every((t) => !!t.arrived);
    const updatedStatus = !allArrived;
    const now = new Date().toISOString();

    // 🔒 If user is trying to UNCHECK / UNDO arrival (updatedStatus === false):
    let isUnlockingByAdmin = false;
    if (!updatedStatus) {
      const permission = checkAttendanceTogglePermission(tagToToggle, effectiveUser);
      if (!permission.canToggle) {
        alert(permission.reason);
        return;
      }

      if (permission.isLocked && permission.isAdminOrOwner) {
        isUnlockingByAdmin = true;
      }

      // ⚡ 2-Click Uncheck (ចុចតែ ២ Click ដោះគ្រីសតែម្ដង)
      const nowTime = Date.now();
      const isSecondClick =
        lastUncheckClickRef.current.tagId === tagToToggle.id &&
        nowTime - lastUncheckClickRef.current.time < 3000;

      if (!isSecondClick) {
        lastUncheckClickRef.current = { tagId: tagToToggle.id, time: nowTime };
        setUncheckingTagId(tagToToggle.id);
        const tagDisplay = tagToToggle.tagNumberDisplay || westernToKhmerDigits(tagToToggle.tagNumber);
        showToast(`⚠️ សូមចុចម្ដងទៀតលើ #${tagDisplay} ដើម្បីដកគ្រីស (ចុច ២ Click ដោះគ្រីស)!`);
        setTimeout(() => {
          setUncheckingTagId((curr) => (curr === tagToToggle.id ? null : curr));
        }, 3000);
        return;
      }

      // Reset 2-click tracking on successful second click
      lastUncheckClickRef.current = { tagId: null, time: 0 };
      setUncheckingTagId(null);
    }

    const updatedTags = tags.map((t) => {
      if (targetIds.has(t.id)) {
        return {
          ...t,
          arrived: updatedStatus,
          arrivedAt: updatedStatus ? now : null
        };
      }
      return t;
    });

    setTags(updatedTags);
    saveTagsForTemple(currentTemple.id, updatedTags);

    // Push to Cloud (Wat Khemavan only) & Firebase
    if (currentTemple.id === 'khemavan') {
      pushTagsToCloud(updatedTags);
    }
    for (const t of updatedTags.filter((item) => targetIds.has(item.id))) {
      await saveTagToFirebase(t, currentTemple.id);
    }

    if (selectedTag) {
      if (selectedTag.tags && selectedTag.tags.length > 0) {
        const updatedSubTags = selectedTag.tags.map((st) => ({
          ...st,
          arrived: updatedStatus,
          arrivedAt: updatedStatus ? now : null
        }));
        setSelectedTag({
          ...selectedTag,
          arrived: updatedStatus,
          arrivedCount: updatedStatus ? updatedSubTags.length : 0,
          isPartialArrived: false,
          tags: updatedSubTags
        });
      } else if (selectedTag.id === tagToToggle.id) {
        setSelectedTag({
          ...selectedTag,
          arrived: updatedStatus,
          arrivedAt: updatedStatus ? now : null
        });
      }
    }

    const tagDisplay = tagToToggle.tagNumberDisplay || westernToKhmerDigits(tagToToggle.tagNumber);
    if (updatedStatus) {
      // 🚀 Auto-jump to "បានមកដល់" (Arrived Filter) as requested!
      setAttendanceFilter('arrived');
      showToast(`បានគ្រីសរាយការណ៍ស្លាកលេខ ${tagDisplay} (${tagToToggle.name}) មកដល់រួចរាល់! (លោតទៅ ៖ បានមកដល់) ✔️`);
      try {
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
      } catch {}
    } else {
      if (isUnlockingByAdmin) {
        showToast(`🔓 Admin (${effectiveUser?.name || 'Admin'}) បានដោះការគ្រីសស្លាកលេខ #${tagDisplay} រួចរាល់!`);
      } else {
        showToast(`បានដកការគ្រីសវត្តមានស្លាកលេខ ${tagDisplay}!`);
      }
    }
  };

  // 📍 Zone / Station Arrival Toggle (រូបទី១ - SEPARATE from main reception arrival!)
  const handleToggleStationArrival = async (tagToToggle) => {
    if (!tagToToggle) return;
    const now = new Date().toISOString();
    const currentVal = Boolean(tagToToggle.stationArrived);
    const updatedStatus = !currentVal;

    const updatedTags = tags.map((t) => {
      if (t.id === tagToToggle.id || Number(t.tagNumber) === Number(tagToToggle.tagNumber)) {
        return {
          ...t,
          stationArrived: updatedStatus,
          stationArrivedAt: updatedStatus ? now : null
        };
      }
      return t;
    });

    setTags(updatedTags);
    saveTagsForTemple(currentTemple.id, updatedTags);

    if (currentTemple.id === 'khemavan') {
      pushTagsToCloud(updatedTags);
    }
    const updatedTagObj = updatedTags.find((t) => t.id === tagToToggle.id);
    if (updatedTagObj) {
      await saveTagToFirebase(updatedTagObj, currentTemple.id);
    }

    const tagDisplay = tagToToggle.tagNumberDisplay || westernToKhmerDigits(tagToToggle.tagNumber);
    if (updatedStatus) {
      showToast(`🏷️ បានកត់ត្រាស្លាកលេខ #${tagDisplay} បានយកស្លាករួចរាល់! ✔️`);
      try {
        confetti({ particleCount: 25, spread: 45, origin: { y: 0.6 } });
      } catch {}
    } else {
      showToast(`បានដកការកត់ត្រា មិនទាន់យកស្លាកលេខ #${tagDisplay}!`);
    }
  };

  // User & Role Management Handlers
  const handleSaveUser = (userData) => {
    const exists = users.find((u) => u.id === userData.id);
    let updated;
    if (exists) {
      updated = users.map((u) => (u.id === userData.id ? userData : u));
      showToast(`បានធ្វើបច្ចុប្បន្នភាពគណនី ${userData.name} (${userData.role}) រួចរាល់!`);
    } else {
      updated = [...users, userData];
      showToast(`បានបន្ថែមគណនីថ្មី ${userData.name} (${userData.role}) រួចរាល់!`);
    }

    setUsers(updated);
    saveUsers(updated);
    saveSystemUsersToFirebase(updated);

    if (currentUser && currentUser.id === userData.id) {
      setCurrentUser(userData);
      saveCurrentUser(userData);
    }
  };

  const handleDeleteUser = (userId) => {
    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    saveUsers(updated);
    saveSystemUsersToFirebase(updated);
    showToast('បានលុបគណនីអ្នកប្រើប្រាស់រួចរាល់!');
  };

  const handleLogout = () => {
    if (currentUser && currentUser.id && currentUser.role !== 'guest') {
      deleteUserLiveLocation(currentUser.id, currentTemple?.id || 'khemavan');
    }
    phoneTracker.stop();
    setCurrentUser(GUEST_USER);
    saveCurrentUser(GUEST_USER);
    showToast('បានចាកចេញពីគណនី (Logout) ៖ ត្រឡប់ទៅជាអ្នកមើលធម្មតា (Guest)');
  };

  const handleLoginUser = (userObj) => {
    if (currentUser && currentUser.id && currentUser.id !== userObj.id && currentUser.role !== 'guest') {
      deleteUserLiveLocation(currentUser.id, currentTemple?.id || 'khemavan');
    }
    setCurrentUser(userObj);
    saveCurrentUser(userObj);
    if (userObj.role === 'guest') {
      showToast('បានចូលប្រើប្រាស់ជាអ្នកមើលធម្មតា (Guest) ៖ អាចមើល និងស្វែងរកស្លាកលេខ');
    } else {
      showToast(`បានចូលប្រើប្រាស់គណនី ៖ ${userObj.name} (${userObj.role.toUpperCase()})`);
    }
  };

  // CRUD Operations with Firebase & Cloud Sync
  const handleSaveTag = async (tagData) => {
    const tagWithYear = { ...tagData, year: tagData.year || selectedYear };
    let updated;
    if (editingTag) {
      const isGroup = (editingTag.tags && editingTag.tags.length > 0) || String(editingTag.id).startsWith('group-');
      if (isGroup && editingTag.tags && editingTag.tags.length > 0) {
        // Update all constituent sub-tags with new info
        const subIds = new Set(editingTag.tags.map((st) => st.id));
        const updatedConstituents = [];
        updated = tags.map((t) => {
          if (subIds.has(t.id)) {
            const updatedItem = {
              ...t,
              name: tagWithYear.name,
              baseLocation: tagWithYear.baseLocation,
              location: tagWithYear.location,
              phone: tagWithYear.phone,
              notes: tagWithYear.notes,
              year: tagWithYear.year
            };
            updatedConstituents.push(updatedItem);
            return updatedItem;
          }
          return t;
        });
        // Delete rogue group ID from Firebase if it existed
        if (String(editingTag.id).startsWith('group-')) {
          await deleteTagFromFirebase(editingTag.id, currentTemple.id);
        }
        // Save each constituent tag to Firebase
        for (const item of updatedConstituents) {
          await saveTagToFirebase(item, currentTemple.id);
        }
      } else {
        updated = tags.map((t) => (t.id === tagWithYear.id ? tagWithYear : t));
        await saveTagToFirebase(tagWithYear, currentTemple.id);
      }
      showToast(`បានកែប្រែព័ត៌មានស្លាកលេខ ${westernToKhmerDigits(tagWithYear.tagNumber)} រួចរាល់!`);
    } else {
      updated = [tagWithYear, ...tags];
      showToast(`បានបន្ថែមស្លាកលេខថ្មី ${westernToKhmerDigits(tagWithYear.tagNumber)} (${tagWithYear.name}) សម្រាប់ឆ្នាំ ${westernToKhmerDigits(selectedYear)} រួចរាល់!`);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } catch {}
      await saveTagToFirebase(tagWithYear, currentTemple.id);
    }

    setTags(updated);
    saveTagsForTemple(currentTemple.id, updated);
    if (currentTemple.id === 'khemavan') {
      pushTagsToCloud(updated);
    }

    setIsFormOpen(false);
    setEditingTag(null);
    if (selectedTag) {
      setSelectedTag(null);
    }
  };

  const handleDeleteTag = async (tagToDelete) => {
    const targetItems = tagToDelete.tags && tagToDelete.tags.length > 0 ? tagToDelete.tags : [tagToDelete];
    const targetIds = new Set(targetItems.map((t) => t.id));
    if (String(tagToDelete.id).startsWith('group-')) {
      targetIds.add(tagToDelete.id);
    }
    const tagDisplay = tagToDelete.tagNumberDisplay || westernToKhmerDigits(tagToDelete.tagNumber);

    if (window.confirm(`តើអ្នកពិតជាចង់លុបស្លាកលេខ ${tagDisplay} (${tagToDelete.name}) មែនទេ?`)) {
      const updated = tags.filter((t) => !targetIds.has(t.id));
      setTags(updated);
      saveTagsForTemple(currentTemple.id, updated);
      
      // Push to Zero-Config Cloud Sync & Firebase
      if (currentTemple.id === 'khemavan') {
        pushTagsToCloud(updated);
      }
      for (const id of targetIds) {
        await deleteTagFromFirebase(id, currentTemple.id);
      }

      setSelectedTag(null);
      showToast(`បានលុបស្លាកលេខ ${tagDisplay} រួចរាល់!`);
    }
  };

  const handleResetData = async () => {
    if (window.confirm(`តើអ្នកពិតជាចង់លុបទិន្នន័យទាំងអស់នៃ «${currentTemple.name}» ចោលទាំងស្រុងមែនទេ?`)) {
      setTags([]);
      saveTagsForTemple(currentTemple.id, []);
      await seedFirebaseData([], true, currentTemple.id);
      if (currentTemple.id === 'khemavan') {
        pushTagsToCloud([]);
      }
      showToast(`បានលុបទិន្នន័យទាំងអស់នៃ «${currentTemple.name}» ចោលទាំងស្រុងរួចរាល់!`);
    }
  };

  const handleImportData = async (importedTags, importMode = false) => {
    const stampedImported = importedTags.map((t) => ({ ...t, year: selectedYear }));
    let updatedTags;

    if (importMode === 'update') {
      // 🎯 Update Names by Tag Number: Match by tagNumber, fill in names/phone while preserving user-pinned locations!
      const existingMap = new Map();
      const otherYearsTags = tags.filter((t) => (t.year || '2026') !== selectedYear);
      yearTags.forEach((t) => existingMap.set(Number(t.tagNumber), t));

      let matchedCount = 0;
      let newCount = 0;

      stampedImported.forEach((imp) => {
        const num = Number(imp.tagNumber);
        if (existingMap.has(num)) {
          const prev = existingMap.get(num);
          existingMap.set(num, {
            ...prev,
            name: imp.name || prev.name,
            phone: imp.phone || prev.phone,
            notes: imp.notes ? (prev.notes ? `${prev.notes} | ${imp.notes}` : imp.notes) : prev.notes,
            location: (prev.location && prev.location !== 'មើលទីកន្លែង') ? prev.location : (imp.location || prev.location),
            updatedAt: new Date().toISOString()
          });
          matchedCount++;
        } else {
          existingMap.set(num, imp);
          newCount++;
        }
      });

      const mergedYearTags = Array.from(existingMap.values()).sort((a, b) => Number(a.tagNumber) - Number(b.tagNumber));
      updatedTags = [...otherYearsTags, ...mergedYearTags];
      showToast(`🎯 បានបញ្ចូលឈ្មោះតាមលេខស្លាកជោគជ័យ (ផ្គូផ្គង ${westernToKhmerDigits(matchedCount)} និងថ្មី ${westernToKhmerDigits(newCount)})!`);
    } else if (importMode === true && yearTags.length > 0) {
      // Find highest existing tag number for current year
      const maxExistingNum = yearTags.reduce((max, t) => Math.max(max, Number(t.tagNumber) || 0), 0);

      // Re-sequence newly imported tags starting after highest existing number
      const reSequencedImported = stampedImported.map((t, idx) => ({
        ...t,
        tagNumber: maxExistingNum + idx + 1
      }));

      updatedTags = [...tags, ...reSequencedImported];
      showToast(`បានបន្ថែមទិន្នន័យថ្មីចំនួន ${westernToKhmerDigits(importedTags.length)} ស្លាកលេខ ចូលក្នុងឆ្នាំ ${westernToKhmerDigits(selectedYear)}!`);
    } else {
      // Replace or Smart Merge: If existing tags already had locations pinned beforehand, PRESERVE their locations!
      const otherYearsTags = tags.filter((t) => (t.year || '2026') !== selectedYear);
      const existingMap = new Map();
      yearTags.forEach((t) => existingMap.set(Number(t.tagNumber), t));

      const mergedList = stampedImported.map((imp) => {
        const num = Number(imp.tagNumber);
        if (existingMap.has(num)) {
          const prev = existingMap.get(num);
          return {
            ...imp,
            location: (prev.location && prev.location !== 'មើលទីកន្លែង') ? prev.location : (imp.location || prev.location),
            baseLocation: prev.baseLocation || imp.baseLocation,
            pinX: prev.pinX !== undefined ? prev.pinX : imp.pinX,
            pinY: prev.pinY !== undefined ? prev.pinY : imp.pinY,
            mapId: prev.mapId || imp.mapId,
            arrived: prev.arrived !== undefined ? prev.arrived : imp.arrived,
            arrivedAt: prev.arrivedAt || imp.arrivedAt
          };
        }
        return imp;
      });

      updatedTags = [...otherYearsTags, ...mergedList];
      showToast(`បានបញ្ចូលទិន្នន័យថ្មីចំនួន ${westernToKhmerDigits(importedTags.length)} ស្លាកលេខ សម្រាប់ឆ្នាំ ${westernToKhmerDigits(selectedYear)}!`);
    }

    setTags(updatedTags);
    saveTagsForTemple(currentTemple.id, updatedTags);
    
    // Push to Zero-Config Cloud Sync (PC to Mobile instant sync) & Firebase
    if (currentTemple.id === 'khemavan') {
      pushTagsToCloud(updatedTags);
    }
    await seedFirebaseData(updatedTags, true, currentTemple.id);

    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch {}
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-kantumruy relative overflow-x-hidden">
      {/* 🍃 App Splash Screen Launch Intro with Falling Bodhi Leaves Animation */}
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      
      {/* Toast Notification Floating */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-6 sm:bottom-6 z-50 bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-2xl shadow-2xl flex items-center justify-center gap-2 border border-amber-300 animate-in slide-in-from-bottom-5 duration-300 pointer-events-none max-w-[90vw] shrink-0">
          <CheckCircle2 className="w-5 h-5 text-slate-950 shrink-0" />
          <span className="text-sm font-kantumruy">{toastMessage}</span>
        </div>
      )}

      {/* 🚨 Floating Global Team SOS Emergency Alert Banner */}
      {activeGlobalSOS && (
        <div className="fixed top-2 left-2 right-2 sm:left-auto sm:right-4 sm:max-w-md z-50 bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 border-2 border-rose-500 rounded-2xl p-3 shadow-2xl shadow-rose-950/80 animate-in slide-in-from-top-4 duration-300 font-kantumruy">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-rose-500 text-slate-950 flex items-center justify-center font-bold text-lg shrink-0 shadow-lg animate-bounce">
                🚨
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold font-moul text-white truncate">
                    {activeGlobalSOS.userName || activeGlobalSOS.name} ត្រូវការជំនួយបន្ទាន់!
                  </h4>
                  <span className="text-[9px] bg-rose-500 text-slate-950 font-bold px-1.5 py-0.2 rounded font-sans-en">
                    SOS
                  </span>
                </div>
                <p className="text-xs text-rose-200 truncate mt-0.5">
                  📍 ទីតាំង ៖ <span className="text-amber-300 font-bold">{activeGlobalSOS.locationName || activeGlobalSOS.assignedZone || 'ក្នុងបរិវេណវត្ត'}</span>
                </p>
                {activeGlobalSOS.helpMessage && (
                  <p className="text-[11px] text-rose-300 italic truncate mt-0.5">
                    💬 {activeGlobalSOS.helpMessage}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => clearTeamSOSAlert(activeGlobalSOS.userId, activeGlobalSOS, currentTemple.id)}
              className="p-1 text-rose-300 hover:text-white rounded-lg hover:bg-rose-900/50 shrink-0 cursor-pointer"
              title="បិទការជូនដំណឹង"
            >
              ✕
            </button>
          </div>

          <div className="mt-2 pt-2 border-t border-rose-800/80 flex items-center justify-end gap-2">
            {activeGlobalSOS.phone && (
              <a
                href={`tel:${activeGlobalSOS.phone}`}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 shadow-md transition-all cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>ខលទៅផ្ទាល់</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => {
                setTempleMapTargetLoc({
                  name: activeGlobalSOS.locationName || activeGlobalSOS.assignedZone,
                  x: activeGlobalSOS.x || 16.15,
                  y: activeGlobalSOS.y || 44.31
                });
                setIsTempleMapOpen(true);
              }}
              className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 shadow-md transition-all cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>ស្វែងរកលើ Map</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Header (Hidden on mobile phones while searching to maximize screen space) */}
      <div className={isSearching ? 'hidden sm:block' : 'block'}>
        <Header
          totalCount={yearTags.length}
          filteredCount={filteredTags.length}
          arrivedCount={arrivedCount}
          currentUser={effectiveUser}
          currentTemple={currentTemple}
          onOpenZoneAttendance={() => {
            const targetZone = (effectiveUser?.assignedZone && effectiveUser.assignedZone !== 'ALL')
              ? effectiveUser.assignedZone
              : 'ផែន១ ៖ ធម្មសភា';
            setTempleMapTargetLoc({ zone: targetZone, tab: 'tagger', isZoneOnly: true });
            setIsTempleMapOpen(true);
          }}
          onOpenTempleSelectModal={() => {
            if (effectiveUser?.role === 'owner') {
              setIsTempleSelectOpen(true);
            }
          }}
          onOpenAddModal={() => {
            setEditingTag(null);
            setIsFormOpen(true);
          }}
          onOpenQRScanner={() => setIsQRScannerOpen(true)}
          onOpenImportExport={() => setIsImportExportOpen(true)}
          onResetData={handleResetData}
          onOpenLocationStats={() => setIsLocationStatsOpen(true)}
          onOpenAttendanceReport={() => { setReportActiveTab('arrived'); setViewMode('report'); }}
          onOpenCloudConfig={() => setIsCloudConfigOpen(true)}
          onOpenMobileConnect={() => setIsMobileConnectOpen(true)}
          onOpenTempleMap={() => {
            setTempleMapTargetLoc(null);
            setIsTempleMapOpen(true);
          }}
          onOpenRoleManagement={() => setIsRoleManagementOpen(true)}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          isCloudSyncing={isCloudSyncing}
          selectedYear={selectedYear}
          onToggleYear={handleToggleYear}
          onAddYear={handleAddYear}
          onInstallApp={() => setIsInstallModalOpen(true)}
        />
      </div>

      {/* Main Content Body */}
      <main 
        className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 md:p-6 space-y-3 sm:space-y-4"
        style={isSearching ? {
          paddingTop: 'calc(max(8px, env(safe-area-inset-top, 0px)) + 6px)'
        } : undefined}
      >
        
        {/* Search & Location Filter Section */}
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
          attendanceFilter={attendanceFilter}
          setAttendanceFilter={setAttendanceFilter}
          totalCount={yearTags.length}
          arrivedCount={arrivedCount}
          notArrivedCount={notArrivedCount}
          viewMode={viewMode}
          setViewMode={setViewMode}
          phoneticSuggestions={phoneticSuggestions}
          onSelectSuggestion={(sug) => setSearchQuery(sug.coreName || sug.name)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
        />

        {/* Main View Mode (Map Inline View vs Report Inline View vs Grid vs Table) */}
        {viewMode === 'map' ? (
          <div className="pb-12">
            <TempleMapModal
              allTags={yearTags}
              currentUser={effectiveUser}
              currentTemple={currentTemple}
              onUpdateTempleMap={handleUpdateTempleMap}
              highlightLocationName={templeMapTargetLoc}
              onToggleStationArrival={handleToggleStationArrival}
              onSelectTag={(t) => {
                setSelectedTag(t);
                setViewMode('grid');
              }}
              onClose={() => {
                setViewMode('grid');
                setTempleMapTargetLoc(null);
              }}
              onFilterByLocation={(locName) => {
                setSelectedLocation(locName);
                setViewMode('grid');
                showToast(`បានច្រោះបញ្ជីស្លាកលេខតាម៖ ${locName}`);
              }}
              onAddTagForLocation={(locName) => {
                if (effectiveUser?.role === 'assistant' || effectiveUser?.role === 'guest') {
                  alert('សិទ្ធិ Assistant និង Guest មិនអាចបន្ថែមស្លាកលេខថ្មីបានទេ!');
                  return;
                }
                setEditingTag({
                  locationPreset: locName,
                  location: locName,
                  tagNumber: nextAvailableTagNumber
                });
                setIsFormOpen(true);
              }}
              onSelectTag={(t) => setSelectedTag(t)}
              isModal={false}
            />
          </div>
        ) : viewMode === 'report' ? (
          <div className="pb-12">
            <AttendanceReportView
              allTags={yearTags}
              currentUser={effectiveUser}
              uncheckingTagId={uncheckingTagId}
              onToggleAttendance={handleToggleAttendance}
              onCloseView={() => setViewMode('grid')}
              activeTab={reportActiveTab}
              setActiveTab={setReportActiveTab}
            />
          </div>
        ) : (
          <>
            {filteredTags.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 pb-12">
              {filteredTags.map((tag) => (
                <TagCard
                  key={tag.id}
                  tag={tag}
                  searchQuery={searchQuery}
                  currentUser={effectiveUser}
                  uncheckingTagId={uncheckingTagId}
                  onSelectTag={(t) => setSelectedTag(t)}
                  onViewOnMap={handleOpenMapWithLocation}
                  onToggleAttendance={handleToggleAttendance}
                />
              ))}
            </div>
          ) : (
            <div className="pb-12">
              <TagTableView
                tags={filteredTags}
                searchQuery={searchQuery}
                currentUser={effectiveUser}
                uncheckingTagId={uncheckingTagId}
                onSelectTag={(t) => setSelectedTag(t)}
                onViewOnMap={handleOpenMapWithLocation}
                onToggleAttendance={handleToggleAttendance}
              />
            </div>
          )
        ) : (
          /* Empty Search State */
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center my-8">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-300 font-moul">
              រកមិនឃើញព័ត៌មានស្លាកលេខទេ
            </h3>
            <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
              គ្មានទិន្នន័យស្លាកលេខសម្រាប់ឆ្នាំ {westernToKhmerDigits(selectedYear)} នេះនៅឡើយទេ។ {currentUser?.role === 'owner' || currentUser?.role === 'admin' ? 'សូមបញ្ចូលទិន្នន័យ (Excel/CSV) ឬបន្ថែមស្លាកលេខថ្មី!' : ''}
            </p>

            {/* If search query has sound-alike suggestions, offer them directly in the empty state */}
            {phoneticSuggestions && phoneticSuggestions.length > 0 && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl max-w-md w-full">
                <p className="text-xs text-amber-300 font-bold mb-2 flex items-center justify-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>តើអ្នកចង់រកឈ្មោះដែលមានសូរសម្លេងស្រដៀងគ្នាទាំងនេះមែនទេ?</span>
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {phoneticSuggestions.map((sug, idx) => (
                    <button
                      key={`empty-sug-${idx}`}
                      onClick={() => setSearchQuery(sug.coreName || sug.name)}
                      className="bg-slate-900/90 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                    >
                      <span>{sug.name}</span>
                      <span className="text-[10px] text-amber-400">#{sug.tagNumberDisplay}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLocation('ALL');
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                >
                  សម្អាតពាក្យស្វែងរក
                </button>
              )}
              {currentUser?.role !== 'assistant' && currentUser?.role !== 'guest' && (
                <button
                  onClick={() => {
                    setEditingTag(null);
                    setIsFormOpen(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>បន្ថែមស្លាកលេខនេះថ្មី</span>
                </button>
              )}
            </div>
          </div>
        )}
      </>
    )}

      </main>

      {/* Modals */}
      {selectedTag && (
        <TagDetailModal
          tag={selectedTag}
          currentUser={effectiveUser}
          uncheckingTagId={uncheckingTagId}
          onClose={() => setSelectedTag(null)}
          onEdit={(t) => {
            setSelectedTag(null);
            setEditingTag(t);
            setIsFormOpen(true);
          }}
          onDelete={(t) => handleDeleteTag(t)}
          onViewOnMap={(loc) => {
            setSelectedTag(null);
            handleOpenMapWithLocation(loc);
          }}
          onToggleAttendance={handleToggleAttendance}
        />
      )}

      {isFormOpen && (
        <TagFormModal
          initialData={editingTag}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTag(null);
          }}
          onSave={handleSaveTag}
          nextAvailableNumber={nextAvailableTagNumber}
          onOpenTempleMap={() => {
            setIsTempleMapOpen(true);
          }}
          onOpenImportExport={() => {
            setIsFormOpen(false);
            setIsImportExportOpen(true);
          }}
        />
      )}

      {isQRScannerOpen && (
        <QRScannerModal
          allTags={yearTags}
          onClose={() => setIsQRScannerOpen(false)}
          onScanSuccess={(scannedTag) => {
            setIsQRScannerOpen(false);
            setSelectedTag(scannedTag);
            showToast(`បានស្កែនឃើញស្លាកលេខ ${westernToKhmerDigits(scannedTag.tagNumber)}!`);
          }}
        />
      )}

      {isImportExportOpen && (
        <ImportExportModal
          allTags={yearTags}
          onClose={() => setIsImportExportOpen(false)}
          onImportData={handleImportData}
        />
      )}

      {isLocationStatsOpen && (
        <LocationStatsModal
          allTags={yearTags}
          onClose={() => setIsLocationStatsOpen(false)}
          onSelectLocationFilter={(locName) => {
            setSelectedLocation(locName);
          }}
        />
      )}

      {isCloudConfigOpen && (
        <FirebaseConfigModal
          onClose={() => setIsCloudConfigOpen(false)}
          onSaveConfig={() => {
            showToast('បានធ្វើបច្ចុប្បន្នភាព Firebase Realtime Config!');
            window.location.reload();
          }}
        />
      )}

      {isMobileConnectOpen && (
        <MobileConnectModal
          onClose={() => setIsMobileConnectOpen(false)}
        />
      )}

      {/* 🗺️ Interactive Temple Map Modal */}
      {isTempleMapOpen && (
        <TempleMapModal
          allTags={yearTags}
          currentUser={effectiveUser}
          currentTemple={currentTemple}
          onUpdateTempleMap={handleUpdateTempleMap}
          highlightLocationName={templeMapTargetLoc}
          onToggleStationArrival={handleToggleStationArrival}
          onSelectTag={(t) => {
            setSelectedTag(t);
            setIsTempleMapOpen(false);
          }}
          onClose={() => {
            setIsTempleMapOpen(false);
            setTempleMapTargetLoc(null);
          }}
          onFilterByLocation={(locName) => {
            setSelectedLocation(locName);
            showToast(`បានច្រោះបញ្ជីស្លាកលេខតាម៖ ${locName}`);
          }}
          onAddTagForLocation={(locName) => {
            if (effectiveUser?.role === 'assistant' || effectiveUser?.role === 'guest') {
              alert('សិទ្ធិ Assistant និង Guest មិនអាចបន្ថែមស្លាកលេខថ្មីបានទេ!');
              return;
            }
            setEditingTag({
              locationPreset: locName,
              location: locName,
              tagNumber: nextAvailableTagNumber
            });
            setIsTempleMapOpen(false);
            setIsFormOpen(true);
          }}
        />
      )}

      {/* 🏛️ Temple Directory & Switcher Modal (FOR OWNER ONLY) */}
      {isTempleSelectOpen && effectiveUser?.role === 'owner' && (
        <TempleSelectModal
          currentTemple={currentTemple}
          temples={temples}
          currentUser={effectiveUser}
          onClose={() => setIsTempleSelectOpen(false)}
          onSelectTemple={handleSelectTemple}
          onAddTemple={handleAddTemple}
          onUpdateTemple={handleUpdateTemple}
          onDeleteTemple={handleDeleteTemple}
          showToast={showToast}
        />
      )}

      {/* 👑 Role & User Management Modal */}
      {isRoleManagementOpen && (
        <RoleManagementModal
          currentUser={effectiveUser}
          users={users}
          currentTemple={currentTemple}
          temples={temples}
          onClose={() => setIsRoleManagementOpen(false)}
          onSaveUser={handleSaveUser}
          onDeleteUser={handleDeleteUser}
        />
      )}

      {/* 🔑 Email Login Modal */}
      {isLoginModalOpen && (
        <LoginModal
          currentUser={currentUser}
          users={users}
          currentTemple={currentTemple}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginUser={handleLoginUser}
        />
      )}

      {/* 📲 PWA Install Mobile App Modal */}
      {isInstallModalOpen && (
        <InstallAppModal
          onClose={() => setIsInstallModalOpen(false)}
          onInstall={handleInstallApp}
          deferredPrompt={deferredPrompt}
        />
      )}

      {/* 📍 Zone Attendance Modal (Phone & Station Management) */}
      {isZoneAttendanceModalOpen && (
        <ZoneAttendanceModal
          onClose={() => setIsZoneAttendanceModalOpen(false)}
          allTags={yearTags}
          currentUser={effectiveUser}
          currentTemple={currentTemple}
          onToggleStationArrival={handleToggleStationArrival}
          onSelectTag={(t) => {
            setSelectedTag(t);
            setIsZoneAttendanceModalOpen(false);
          }}
          onOpenTempleMap={(locName) => {
            setTempleMapTargetLoc(locName || null);
            setIsZoneAttendanceModalOpen(false);
            setIsTempleMapOpen(true);
          }}
        />
      )}

      {/* 📍 Celebratory Location Granted & Locked Popup */}
      {locationAllowedPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300 font-kantumruy">
          <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-emerald-500/80 rounded-3xl p-5 max-w-sm w-full shadow-[0_0_50px_rgba(16,185,129,0.35)] text-center relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-36 h-36 bg-emerald-500/25 rounded-full blur-2xl pointer-events-none" />

            {/* Animated Pin Avatar */}
            <div className="relative mx-auto w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-3.5 border-2 border-white/80">
              <div className="absolute -inset-2 rounded-3xl bg-emerald-400/30 animate-ping pointer-events-none" />
              <MapPin className="w-8 h-8 text-slate-950 stroke-[2.5]" />
            </div>

            <h3 className="text-base sm:text-lg font-bold font-moul text-white mb-1">
              បានអនុញ្ញាតទីតាំងជោគជ័យ!
            </h3>
            <p className="text-xs text-slate-300 mb-3">
              ប្រព័ន្ធបានដៅទីតាំងជាក់ស្តែងរបស់អ្នកលើប្លង់វត្ត ៖
            </p>

            {/* Location highlight box */}
            <div className="bg-slate-900/90 border border-emerald-500/50 rounded-2xl p-3 mb-4 text-left space-y-1.5 shadow-inner">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">ទីតាំងដៅលើ Map ៖</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                  🛰️ GPS Auto
                </span>
              </div>
              <div className="text-sm font-bold text-amber-300 font-moul flex items-center gap-1.5 truncate">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">{locationAllowedPopup.spot?.name || locationAllowedPopup.spot?.locationName || 'ធម្មសភា'}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                <span>កូអរដោនេ ៖ X {locationAllowedPopup.spot?.x}%, Y {locationAllowedPopup.spot?.y}%</span>
                {locationAllowedPopup.spot?.accuracy && (
                  <span className="text-emerald-400 font-bold">
                    ±{Math.round(locationAllowedPopup.spot.accuracy)}m
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  const target = locationAllowedPopup.spot;
                  setLocationAllowedPopup(null);
                  setTempleMapTargetLoc({
                    name: target?.name || target?.locationName || 'ទីតាំងខ្ញុំ',
                    x: target?.x,
                    y: target?.y,
                    isSelf: true
                  });
                  setIsTempleMapOpen(true);
                }}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-bold text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98 transition-all cursor-pointer font-moul"
              >
                <span>🗺️ មើលលើ Map ភ្លាមៗ</span>
              </button>

              <button
                type="button"
                onClick={() => setLocationAllowedPopup(null)}
                className="w-full py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                យល់ព្រម
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📱 Fixed Mobile Bottom Navigation Bar for Phones ONLY (Hidden while searching or on PC/Desktop) */}
      <div className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/50 backdrop-blur-xl border-t border-amber-500/40 px-3 py-1.5 flex items-center justify-around shadow-[0_-10px_35px_rgba(0,0,0,0.6)] font-kantumruy transition-all ${
        isSearching ? 'hidden pointer-events-none' : 'flex'
      }`}>
        
        {/* 1. Left Button -> +បន្ថែម (Add Tag) */}
        <button
          type="button"
          onClick={() => {
            if (effectiveUser?.role === 'assistant' || effectiveUser?.role === 'guest') {
              alert('សិទ្ធិ Assistant និង Guest មិនអាចបន្ថែមស្លាកលេខថ្មីបានទេ!');
              return;
            }
            setEditingTag(null);
            setIsFormOpen(true);
          }}
          className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 text-amber-400 hover:text-amber-300 active:scale-95 transition-all group shrink-0"
          title="បន្ថែមស្លាកលេខថ្មី (+បន្ថែម)"
        >
          <div className="w-9 h-9 rounded-2xl bg-amber-500/20 group-hover:bg-amber-500/30 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-bold tracking-tight text-amber-300">+បន្ថែម</span>
        </button>

        {/* 2. Middle Button -> ផែនទីវត្ត (Temple Map) */}
        <button
          type="button"
          onClick={() => {
            setTempleMapTargetLoc(null);
            setIsTempleMapOpen(true);
          }}
          className="flex flex-col items-center justify-center gap-0.5 py-1 px-4 text-amber-300 hover:text-amber-200 active:scale-95 transition-all group shrink-0 -mt-3"
          title="មើលផែនទីវត្ត (ផែនទីវត្ត)"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 border-2 border-amber-300 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/40 ring-4 ring-slate-950/80">
            <MapIcon className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-extrabold text-amber-300 font-moul tracking-tight">ផែនទីវត្ត</span>
        </button>

        {/* 3. Right Button -> ថយក្រោយ (Go Back) */}
        <button
          type="button"
          onClick={handleNavigateBack}
          className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 text-sky-400 hover:text-sky-300 active:scale-95 transition-all group shrink-0"
          title="ថយក្រោយ / ត្រឡប់ទៅផ្ទាំងដើម"
        >
          <div className="w-9 h-9 rounded-2xl bg-sky-500/20 group-hover:bg-sky-500/30 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-md shadow-sky-500/10">
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-bold tracking-tight text-sky-300">ថយក្រោយ</span>
        </button>

      </div>

      {/* Footer */}
      <footer className={`border-t border-slate-900 bg-slate-950 py-4 px-4 pb-24 sm:pb-6 text-center text-xs text-slate-500 font-kantumruy ${
        isSearching ? 'hidden sm:block' : 'block'
      }`}>
        <p>ប្រព័ន្ធគ្រប់គ្រងស្លាកលេខ និងទីតាំងស្នាក់នៅ © ២០២៦ | Realtime Cloud Sync សម្រាប់ក្រុមការងារ ២០ នាក់</p>
      </footer>

    </div>
  );
}


