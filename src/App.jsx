import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Tag, Plus, AlertCircle, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import TagCard from './components/TagCard';
import TagTableView from './components/TagTableView';
import TagDetailModal from './components/TagDetailModal';
import TagFormModal from './components/TagFormModal';
import QRScannerModal from './components/QRScannerModal';
import ImportExportModal from './components/ImportExportModal';
import LocationStatsModal from './components/LocationStatsModal';
import FirebaseConfigModal from './components/FirebaseConfigModal';
import MobileConnectModal from './components/MobileConnectModal';
import TempleMapModal from './components/TempleMapModal';
import { searchTags, westernToKhmerDigits } from './utils/khmerSearch';
import { getSavedTags, saveTags, resetToSampleData } from './utils/storage';
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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [isCloudSyncing, setIsCloudSyncing] = useState(true);

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
  
  // Toast notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Load initial tags & subscribe to Cloud & Firebase Realtime updates
  useEffect(() => {
    // 1. Load local fallback
    const localTags = getSavedTags();
    setTags(localTags);

    // 2. Subscribe to Zero-Config Cloud Sync (Auto-Sync PC & Mobile)
    const unsubscribeCloud = subscribeToCloudTags((cloudTags) => {
      if (cloudTags && cloudTags.length > 0) {
        setTags(cloudTags);
        saveTags(cloudTags);
        setIsCloudSyncing(true);
      }
    });

    // 3. Subscribe to Firebase Realtime Database (if configured)
    const unsubscribeFirebase = subscribeToFirebaseTags(
      (fbTags) => {
        if (fbTags && fbTags.length > 0) {
          setTags(fbTags);
          saveTags(fbTags);
          setIsCloudSyncing(true);
        } else {
          seedFirebaseData(localTags);
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
    return searchTags(tags, searchQuery, selectedLocation);
  }, [tags, searchQuery, selectedLocation]);

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
    if (window.confirm(`តើអ្នកពិតជាចង់លុបស្លាកលេខ ${westernToKhmerDigits(tagToDelete.tagNumber)} (${tagToDelete.name}) មែនទេ?`)) {
      const updated = tags.filter((t) => t.id !== tagToDelete.id);
      setTags(updated);
      saveTags(updated);
      
      // Push to Zero-Config Cloud Sync & Firebase
      pushTagsToCloud(updated);
      await deleteTagFromFirebase(tagToDelete.id);

      setSelectedTag(null);
      showToast(`បានលុបស្លាកលេខ ${westernToKhmerDigits(tagToDelete.tagNumber)} រួចរាល់!`);
    }
  };

  const handleResetData = () => {
    if (window.confirm('តើអ្នកពិតជាចង់លុបទិន្នន័យទាំងអស់ (ទាំងចាស់ ទាំងថ្មី) ចោលទាំងស្រុងមែនទេ?')) {
      setTags([]);
      saveTags([]);
      pushTagsToCloud([]);
      seedFirebaseData([], true);
      showToast('បានលុបទិន្នន័យទាំងអស់ចោលទាំងស្រុងរួចរាល់!');
    }
  };

  const handleImportData = (importedTags) => {
    // Replace old tags completely with newly imported tags
    setTags(importedTags);
    saveTags(importedTags);
    
    // Push to Zero-Config Cloud Sync (PC to Mobile instant sync) & Firebase
    pushTagsToCloud(importedTags);
    seedFirebaseData(importedTags, true);

    showToast(`បានលុបទិន្នន័យចាស់ និងជំនួសដោយទិន្នន័យថ្មីចំនួន ${westernToKhmerDigits(importedTags.length)} ស្លាកលេខ!`);
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-kantumruy">
      
      {/* Toast Notification Floating */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-500 text-slate-950 font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-amber-300 animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="w-5 h-5 text-slate-950 shrink-0" />
          <span className="text-sm font-kantumruy">{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        totalCount={tags.length}
        filteredCount={filteredTags.length}
        onOpenAddModal={() => {
          setEditingTag(null);
          setIsFormOpen(true);
        }}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onResetData={handleResetData}
        onOpenLocationStats={() => setIsLocationStatsOpen(true)}
        onOpenCloudConfig={() => setIsCloudConfigOpen(true)}
        onOpenMobileConnect={() => setIsMobileConnectOpen(true)}
        onOpenTempleMap={() => {
          setTempleMapTargetLoc(null);
          setIsTempleMapOpen(true);
        }}
        isCloudSyncing={isCloudSyncing}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 space-y-4">
        
        {/* Search & Location Filter Section */}
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {/* Tag List View (Grid vs Table) */}
        {filteredTags.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pb-12">
              {filteredTags.map((tag) => (
                <TagCard
                  key={tag.id}
                  tag={tag}
                  onSelectTag={(t) => setSelectedTag(t)}
                  onViewOnMap={handleOpenMapWithLocation}
                />
              ))}
            </div>
          ) : (
            <div className="pb-12">
              <TagTableView
                tags={filteredTags}
                onSelectTag={(t) => setSelectedTag(t)}
                onViewOnMap={handleOpenMapWithLocation}
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
            </div>
          </div>
        )}

      </main>

      {/* Modals */}
      {selectedTag && (
        <TagDetailModal
          tag={selectedTag}
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

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <p>ប្រព័ន្ធគ្រប់គ្រងស្លាកលេខ និងទីតាំងស្នាក់នៅ © ២០២៦ | Realtime Cloud Sync សម្រាប់ក្រុមការងារ ២០ នាក់</p>
      </footer>

    </div>
  );
}
