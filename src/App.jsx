import React, { useState, useMemo, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Tag, Plus, AlertCircle, RefreshCw, Sparkles, CheckCircle2, Map as MapIcon, ArrowLeft } from 'lucide-react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import TagCard from './components/TagCard';
import TagTableView from './components/TagTableView';
import TagDetailModal from './components/TagDetailModal';
import TagFormModal from './components/TagFormModal';
import QRScannerModal from './components/QRScannerModal';
import ImportExportModal from './components/ImportExportModal';
import LocationStatsModal from './components/LocationStatsModal';
import AttendanceReportModal from './components/AttendanceReportModal';
import AttendanceReportView from './components/AttendanceReportView';
import FirebaseConfigModal from './components/FirebaseConfigModal';
import MobileConnectModal from './components/MobileConnectModal';
import TempleMapModal from './components/TempleMapModal';
import RoleManagementModal from './components/RoleManagementModal';
import LoginModal from './components/LoginModal';
import { searchTags, westernToKhmerDigits } from './utils/khmerSearch';
import { getSavedTags, saveTags, getSavedUsers, saveUsers, getCurrentUser, saveCurrentUser, GUEST_USER } from './utils/storage';
import {
  subscribeToFirebaseTags,
  saveTagToFirebase,
  deleteTagFromFirebase,
  seedFirebaseData,
  isConnected as isFirebaseConnected
} from './utils/firebase';
import { pushTagsToCloud, subscribeToCloudTags } from './utils/cloudSync';

export default function App() {
  const [tags, setTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table' | 'map' | 'report'
  const [attendanceFilter, setAttendanceFilter] = useState('ALL'); // 'ALL' | 'notArrived' | 'arrived'
  const [reportActiveTab, setReportActiveTab] = useState('arrived'); // 'arrived' | 'notArrived' | 'all'
  const [selectedYear, setSelectedYear] = useState('2026');
  const [isCloudSyncing, setIsCloudSyncing] = useState(true);

  // User & Role State
  const [users, setUsers] = useState(getSavedUsers());
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [isRoleManagementOpen, setIsRoleManagementOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Modals state
  const [selectedTag, setSelectedTag] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isLocationStatsOpen, setIsLocationStatsOpen] = useState(false);
  const [isAttendanceReportOpen, setIsAttendanceReportOpen] = useState(false);
  const [isCloudConfigOpen, setIsCloudConfigOpen] = useState(false);
  const [isMobileConnectOpen, setIsMobileConnectOpen] = useState(false);
  const [isTempleMapOpen, setIsTempleMapOpen] = useState(false);
  const [templeMapTargetLoc, setTempleMapTargetLoc] = useState(null);
  
  // Toast notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleToggleYear = () => {
    const years = ['2026', '2025', '2027', '2024'];
    const currIdx = years.indexOf(selectedYear);
    const nextY = years[(currIdx + 1) % years.length];
    setSelectedYear(nextY);
    showToast(`បានប្តូរទៅ ៖ ឆ្នាំ ${westernToKhmerDigits(nextY)}`);
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
    isLoginModalOpen
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
    setEditingTag(null);
  };

  // Ref to track last back press timestamp for Double-Back-To-Exit feature
  const lastBackPressTimeRef = useRef(0);
  const isHistoryPushedRef = useRef(false);

  // Push initial history guard entry on mount so browser back button is intercepted
  useEffect(() => {
    try {
      window.history.pushState({ appRootGuard: true }, '');
      isHistoryPushedRef.current = true;
    } catch (e) {}
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
      } catch (err) {}
      return false;
    } else {
      // 1st back press -> Prompt user and lock history
      lastBackPressTimeRef.current = now;
      try {
        window.history.pushState({ appRootGuard: true }, '');
      } catch (err) {}
      showToast('ថយម្ដងទៀត');
      return true;
    }
  };

  // Sync browser back button (popstate event) with double-back exit lock
  useEffect(() => {
    const handlePopState = () => {
      if (hasActiveModal) {
        closeAllModals();
        try {
          window.history.pushState({ appRootGuard: true }, '');
        } catch (err) {}
      } else if (viewMode !== 'grid') {
        setViewMode('grid');
        try {
          window.history.pushState({ appRootGuard: true }, '');
        } catch (err) {}
      } else if (searchQuery || selectedLocation !== 'ALL' || attendanceFilter !== 'ALL') {
        setSearchQuery('');
        setSelectedLocation('ALL');
        setAttendanceFilter('ALL');
        try {
          window.history.pushState({ appRootGuard: true }, '');
        } catch (err) {}
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
          } catch (err) {}
          showToast('ថយម្ដងទៀត');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasActiveModal, viewMode, searchQuery, selectedLocation, attendanceFilter]);

  // Touch Swipe Gesture Handler (Swipe Left-to-Right -> Switch to Home / Go Back)
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

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
    const touch = e.changedTouches[0];
    const startX = touchStartRef.current.x;
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    const target = e.target;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.closest('.map-pin-element') ||
      target.closest('.zoom-toolbar')
    ) {
      return;
    }

    // 1. Swipe Left to Right (អូសពីឆ្វេងទៅស្ដាំ ៖ ថយក្រោយ/ត្រឡប់ទៅផ្ទាំងដើម)
    const isEdgeSwipeRight = startX < 80 && deltaX > 40 && Math.abs(deltaY) < 70;
    const isGeneralSwipeRight = deltaX > 75 && Math.abs(deltaY) < 60 && deltaTime < 700;

    if (isEdgeSwipeRight || isGeneralSwipeRight) {
      const handled = handleNavigateBack();
      if (handled && isHistoryPushedRef.current) {
        try {
          window.history.back();
        } catch (err) {}
      }
      return;
    }

    // 2. Swipe Right to Left (អូសពីស្ដាំទៅឆ្វេង ៖ ប្តូរទៅតម្រង 'មិនទាន់មកដល់' / 'បានមកដល់')
    const isSwipeLeft = deltaX < -80 && Math.abs(deltaY) < 60 && deltaTime < 700;
    if (isSwipeLeft && !hasActiveModal && viewMode === 'grid') {
      if (attendanceFilter === 'ALL') {
        setAttendanceFilter('notArrived');
        showToast('▶ ប្តូរទៅតម្រង ៖ មិនទាន់មកដល់');
      } else if (attendanceFilter === 'notArrived') {
        setAttendanceFilter('arrived');
        showToast('▶ ប្តូរទៅតម្រង ៖ បានមកដល់');
      }
    }
  };

  // Load initial tags & subscribe to Cloud & Firebase Realtime updates
  useEffect(() => {
    // 1. Load local fallback
    const localTags = getSavedTags();
    setTags(localTags);

    // 2. Subscribe to Zero-Config Cloud Sync (Auto-Sync PC & Mobile)
    const unsubscribeCloud = subscribeToCloudTags((cloudTags) => {
      if (Array.isArray(cloudTags)) {
        setTags(cloudTags);
        saveTags(cloudTags);
        setIsCloudSyncing(true);
      }
    });

    // 3. Subscribe to Firebase Realtime Database (if configured)
    const unsubscribeFirebase = subscribeToFirebaseTags(
      (fbTags) => {
        if (Array.isArray(fbTags)) {
          setTags(fbTags);
          saveTags(fbTags);
          setIsCloudSyncing(true);
        }
      },
      (err) => {
        console.warn('Using Local Storage fallback:', err);
      }
    );

    return () => {
      unsubscribeCloud();
      unsubscribeFirebase();
    };
  }, []);

  // Filter tags in real-time
  const filteredTags = useMemo(() => {
    return searchTags(tags, searchQuery, selectedLocation, attendanceFilter);
  }, [tags, searchQuery, selectedLocation, attendanceFilter]);

  // Arrived & Not Arrived count calculation
  const arrivedCount = useMemo(() => {
    return tags.filter((t) => !!t.arrived).length;
  }, [tags]);

  const notArrivedCount = useMemo(() => {
    return tags.filter((t) => !t.arrived).length;
  }, [tags]);

  // Compute next available tag number
  const nextAvailableTagNumber = useMemo(() => {
    if (!tags || tags.length === 0) return 1;
    const maxNum = Math.max(...tags.map((t) => Number(t.tagNumber) || 0));
    return maxNum + 1;
  }, [tags]);

  // Handle open map focused on a location
  const handleOpenMapWithLocation = (locName) => {
    setTempleMapTargetLoc(locName);
    setIsTempleMapOpen(true);
  };

  // Attendance Toggle Handler ("គ្រីសអ្នកបានមកដល់")
  const handleToggleAttendance = async (tagToToggle) => {
    if (currentUser?.role === 'guest') {
      alert('សិទ្ធិ Guest អាចមើល និងស្វែងរកប៉ុណ្ណោះ! មិនអាចគ្រីសមកដល់បានទេ (សម្រាប់តែក្រុមការងារ)');
      return;
    }

    const targetItems = tagToToggle.tags && tagToToggle.tags.length > 0 ? tagToToggle.tags : [tagToToggle];
    const targetIds = new Set(targetItems.map((t) => t.id));
    const allArrived = targetItems.every((t) => !!t.arrived);
    const updatedStatus = !allArrived;
    const now = new Date().toISOString();

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
    saveTags(updatedTags);

    // Push to Cloud & Firebase
    pushTagsToCloud(updatedTags);
    for (const t of updatedTags.filter((item) => targetIds.has(item.id))) {
      await saveTagToFirebase(t);
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
      showToast(`បានគ្រីសរាយការណ៍ស្លាកលេខ ${tagDisplay} (${tagToToggle.name}) មកដល់រួចរាល់! ✔️`);
      try {
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
      } catch (e) {}
    } else {
      showToast(`បានដកការគ្រីសវត្តមានស្លាកលេខ ${tagDisplay}!`);
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

    if (currentUser && currentUser.id === userData.id) {
      setCurrentUser(userData);
      saveCurrentUser(userData);
    }
  };

  const handleDeleteUser = (userId) => {
    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    saveUsers(updated);
    showToast('បានលុបគណនីអ្នកប្រើប្រាស់រួចរាល់!');
  };

  const handleLogout = () => {
    setCurrentUser(GUEST_USER);
    saveCurrentUser(GUEST_USER);
    showToast('បានចាកចេញពីគណនី (Logout) ៖ ត្រឡប់ទៅជាអ្នកមើលធម្មតា (Guest)');
  };

  const handleLoginUser = (userObj) => {
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
    let updated;
    if (editingTag) {
      updated = tags.map((t) => (t.id === tagData.id ? tagData : t));
      showToast(`បានកែប្រែព័ត៌មានស្លាកលេខ ${westernToKhmerDigits(tagData.tagNumber)} រួចរាល់!`);
    } else {
      updated = [tagData, ...tags];
      showToast(`បានបន្ថែមស្លាកលេខថ្មី ${westernToKhmerDigits(tagData.tagNumber)} (${tagData.name}) រួចរាល់!`);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } catch (e) {}
    }

    setTags(updated);
    saveTags(updated);
    
    // Push to Zero-Config Cloud Sync & Firebase
    pushTagsToCloud(updated);
    await saveTagToFirebase(tagData);

    setIsFormOpen(false);
    setEditingTag(null);
    if (selectedTag && selectedTag.id === tagData.id) {
      setSelectedTag(tagData);
    }
  };

  const handleDeleteTag = async (tagToDelete) => {
    const targetItems = tagToDelete.tags && tagToDelete.tags.length > 0 ? tagToDelete.tags : [tagToDelete];
    const targetIds = new Set(targetItems.map((t) => t.id));
    const tagDisplay = tagToDelete.tagNumberDisplay || westernToKhmerDigits(tagToDelete.tagNumber);

    if (window.confirm(`តើអ្នកពិតជាចង់លុបស្លាកលេខ ${tagDisplay} (${tagToDelete.name}) មែនទេ?`)) {
      const updated = tags.filter((t) => !targetIds.has(t.id));
      setTags(updated);
      saveTags(updated);
      
      // Push to Zero-Config Cloud Sync & Firebase
      pushTagsToCloud(updated);
      for (const id of targetIds) {
        await deleteTagFromFirebase(id);
      }

      setSelectedTag(null);
      showToast(`បានលុបស្លាកលេខ ${tagDisplay} រួចរាល់!`);
    }
  };

  const handleResetData = async () => {
    if (window.confirm('តើអ្នកពិតជាចង់លុបទិន្នន័យទាំងអស់ (ទាំងចាស់ ទាំងថ្មី) ចោលទាំងស្រុងមែនទេ?')) {
      setTags([]);
      saveTags([]);
      await seedFirebaseData([], true);
      pushTagsToCloud([]);
      showToast('បានលុបទិន្នន័យទាំងអស់ចោលទាំងស្រុងរួចរាល់!');
    }
  };

  const handleImportData = (importedTags, isAppend = false) => {
    let updatedTags;

    if (isAppend && tags.length > 0) {
      // Find highest existing tag number
      const maxExistingNum = Math.max(...tags.map((t) => Number(t.tagNumber) || 0));

      // Re-sequence newly imported tags starting after highest existing number
      const reSequencedImported = importedTags.map((t, idx) => ({
        ...t,
        tagNumber: maxExistingNum + idx + 1
      }));

      updatedTags = [...tags, ...reSequencedImported];
      showToast(`បានបន្ថែមទិន្នន័យថ្មីចំនួន ${westernToKhmerDigits(importedTags.length)} ស្លាកលេខ ចូលក្នុងបញ្ជីដែលមានស្រាប់! (សរុបសរុប ៖ ${westernToKhmerDigits(updatedTags.length)} ស្លាក)`);
    } else {
      updatedTags = importedTags;
      showToast(`បានលុបទិន្នន័យចាស់ និងជំនួសដោយទិន្នន័យថ្មីចំនួន ${westernToKhmerDigits(importedTags.length)} ស្លាកលេខ!`);
    }

    setTags(updatedTags);
    saveTags(updatedTags);
    
    // Push to Zero-Config Cloud Sync (PC to Mobile instant sync) & Firebase
    pushTagsToCloud(updatedTags);
    seedFirebaseData(updatedTags, true);

    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch (e) {}
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-kantumruy"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* Toast Notification Floating */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-6 sm:bottom-6 z-50 bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-2xl shadow-2xl flex items-center justify-center gap-2 border border-amber-300 animate-in slide-in-from-bottom-5 duration-300 pointer-events-none max-w-[90vw] shrink-0">
          <CheckCircle2 className="w-5 h-5 text-slate-950 shrink-0" />
          <span className="text-sm font-kantumruy">{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        totalCount={tags.length}
        filteredCount={filteredTags.length}
        arrivedCount={arrivedCount}
        currentUser={currentUser}
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
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 space-y-4">
        
        {/* Search & Location Filter Section */}
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
          attendanceFilter={attendanceFilter}
          setAttendanceFilter={setAttendanceFilter}
          totalCount={tags.length}
          arrivedCount={arrivedCount}
          notArrivedCount={notArrivedCount}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {/* Main View Mode (Map Inline View vs Report Inline View vs Grid vs Table) */}
        {viewMode === 'map' ? (
          <div className="pb-12">
            <TempleMapModal
              allTags={tags}
              currentUser={currentUser}
              highlightLocationName={templeMapTargetLoc}
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
                if (currentUser?.role === 'assistant' || currentUser?.role === 'guest') {
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
              allTags={tags}
              currentUser={currentUser}
              onToggleAttendance={handleToggleAttendance}
              onCloseView={() => setViewMode('grid')}
              activeTab={reportActiveTab}
              setActiveTab={setReportActiveTab}
            />
          </div>
        ) : filteredTags.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pb-12">
              {filteredTags.map((tag) => (
                <TagCard
                  key={tag.id}
                  tag={tag}
                  currentUser={currentUser}
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
                currentUser={currentUser}
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
              គ្មានទិន្នន័យដែលត្រូវគ្នានឹងពាក្យស្វែងរក "{searchQuery}" ឬតម្រងទីតាំងដែលបានជ្រើសរើសឡើយ។
            </p>
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

      </main>

      {/* Modals */}
      {selectedTag && (
        <TagDetailModal
          tag={selectedTag}
          currentUser={currentUser}
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
          allTags={tags}
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
          allTags={tags}
          onClose={() => setIsImportExportOpen(false)}
          onImportData={handleImportData}
        />
      )}

      {isLocationStatsOpen && (
        <LocationStatsModal
          allTags={tags}
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
          allTags={tags}
          currentUser={currentUser}
          highlightLocationName={templeMapTargetLoc}
          onClose={() => {
            setIsTempleMapOpen(false);
            setTempleMapTargetLoc(null);
          }}
          onFilterByLocation={(locName) => {
            setSelectedLocation(locName);
            showToast(`បានច្រោះបញ្ជីស្លាកលេខតាម៖ ${locName}`);
          }}
          onAddTagForLocation={(locName) => {
            if (currentUser?.role === 'assistant' || currentUser?.role === 'guest') {
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

      {/* 👑 Role & User Management Modal */}
      {isRoleManagementOpen && (
        <RoleManagementModal
          currentUser={currentUser}
          users={users}
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
          onClose={() => setIsLoginModalOpen(false)}
          onLoginUser={handleLoginUser}
        />
      )}

      {/* 📱 Fixed Mobile Bottom Navigation Bar for Phones (1. +បន្ថែម [Recent pos], 2. ផែនទីវត្ត [Home pos], 3. ថយក្រោយ [Back pos]) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-amber-500/30 backdrop-blur-2xl px-3 py-1.5 flex items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.8)] font-kantumruy">
        
        {/* 1. Left Button (ជំនួស Recent) -> +បន្ថែម (Add Tag) */}
        <button
          type="button"
          onClick={() => {
            if (currentUser?.role === 'assistant' || currentUser?.role === 'guest') {
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

        {/* 2. Middle Button (ជំនួស Home) -> ផែនទីវត្ត (Temple Map) */}
        <button
          type="button"
          onClick={() => {
            setTempleMapTargetLoc(null);
            setIsTempleMapOpen(true);
          }}
          className="flex flex-col items-center justify-center gap-0.5 py-1 px-4 text-amber-300 hover:text-amber-200 active:scale-95 transition-all group shrink-0 -mt-3"
          title="មើលផែនទីវត្ត (ផែនទីវត្ត)"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 border-2 border-amber-300 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/40 ring-4 ring-slate-950">
            <MapIcon className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-extrabold text-amber-300 font-moul tracking-tight">ផែនទីវត្ត</span>
        </button>

        {/* 3. Right Button (ជំនួស Back) -> ថយក្រោយ (Go Back / Double Back Exit) */}
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
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 pb-24 text-center text-xs text-slate-500 font-kantumruy">
        <p>ប្រព័ន្ធគ្រប់គ្រងស្លាកលេខ និងទីតាំងស្នាក់នៅ © ២០២៦ | Realtime Cloud Sync សម្រាប់ក្រុមការងារ ២០ នាក់</p>
      </footer>

    </div>
  );
}


