import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Download,
  Upload,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Edit2,
  Trash2,
  Folder,
  FolderPlus,
  Compass,
  Users,
  Search,
  Filter,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Layers,
  Map as MapIcon,
  Move,
  Tag,
  ArrowLeft
} from 'lucide-react';
import {
  INITIAL_TEMPLE_LOCATIONS,
  TEMPLE_PALI_DIRECTIONS,
  getSavedTempleLocations,
  getSavedTab3Locations,
  resetTempleLocations,
  resetTab3Locations
} from '../data/templeLocations';
import {
  subscribeToFirebaseTempleLocations,
  saveTempleLocationsToFirebase,
  subscribeToFirebaseTab3Locations,
  saveTab3LocationsToFirebase,
  subscribeToGroupSettings,
  saveGroupSettingsToFirebase
} from '../utils/firebase';
import { westernToKhmerDigits, khmerToWesternDigits, groupTagsByName } from '../utils/khmerSearch';

const PIN_COLOR_GRADIENTS = [
  'bg-gradient-to-br from-cyan-300 via-sky-400 to-blue-500 text-slate-950',       // 1: Cyan Sky
  'bg-gradient-to-br from-emerald-300 via-emerald-400 to-teal-500 text-slate-950', // 2: Emerald Green
  'bg-gradient-to-br from-purple-300 via-purple-400 to-indigo-500 text-slate-950', // 3: Purple Violet
  'bg-gradient-to-br from-rose-300 via-rose-400 to-pink-500 text-slate-950',       // 4: Rose Pink
  'bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 text-slate-950',   // 5: Amber Orange
  'bg-gradient-to-br from-fuchsia-300 via-fuchsia-400 to-pink-600 text-slate-950', // 6: Fuchsia Magenta
  'bg-gradient-to-br from-lime-300 via-lime-400 to-emerald-500 text-slate-950',     // 7: Lime Green
  'bg-gradient-to-br from-indigo-300 via-indigo-400 to-blue-600 text-white',     // 8: Indigo Blue
  'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 text-slate-950', // 9: Bright Gold
  'bg-gradient-to-br from-teal-300 via-teal-400 to-cyan-600 text-slate-950',       // 10: Teal Cyan
  'bg-gradient-to-br from-orange-300 via-orange-400 to-rose-500 text-slate-950',  // 11: Bright Orange
  'bg-gradient-to-br from-violet-300 via-violet-400 to-purple-600 text-slate-950',   // 12: Deep Violet
];

const STANDARD_GATES = ['A', 'B', 'C', 'D', 'E', 'a', 'b', 'c', 'd', 'e'];

const KHMER_STANDARD_LOCATIONS = [
  '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩', '១០', '១១', '១២', '១៣', '១៤', '១៥', '១៦'
];

const WESTERN_TAG_COLORS = {
  '1': 'bg-gradient-to-br from-cyan-300 via-sky-400 to-blue-500 text-slate-950',       // 1: Cyan Sky
  '2': 'bg-gradient-to-br from-emerald-300 via-emerald-400 to-teal-500 text-slate-950', // 2: Emerald Green
  '3': 'bg-gradient-to-br from-purple-300 via-purple-400 to-indigo-500 text-slate-950', // 3: Purple Violet
  '4': 'bg-gradient-to-br from-rose-300 via-rose-400 to-pink-500 text-slate-950',       // 4: Rose Pink
  '5': 'bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 text-slate-950',   // 5: Amber Orange
  '6': 'bg-gradient-to-br from-fuchsia-300 via-fuchsia-400 to-pink-600 text-slate-950', // 6: Fuchsia Magenta
  '7': 'bg-gradient-to-br from-lime-300 via-lime-400 to-emerald-500 text-slate-950',     // 7: Lime Green
  '8': 'bg-gradient-to-br from-indigo-300 via-indigo-400 to-blue-600 text-white',     // 8: Indigo Blue
  '9': 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 text-slate-950', // 9: Bright Gold
  '10': 'bg-gradient-to-br from-teal-300 via-teal-400 to-cyan-600 text-slate-950',       // 10: Teal Cyan
  '11': 'bg-gradient-to-br from-orange-300 via-orange-400 to-rose-500 text-slate-950',  // 11: Bright Orange
  '12': 'bg-gradient-to-br from-violet-300 via-violet-400 to-purple-600 text-slate-950',   // 12: Deep Violet
  '13': 'bg-gradient-to-br from-sky-300 via-sky-400 to-indigo-600 text-slate-950',        // 13: Sky Blue
  '14': 'bg-gradient-to-br from-red-400 via-rose-500 to-red-600 text-white',             // 14: Crimson Red
  '15': 'bg-gradient-to-br from-pink-300 via-fuchsia-400 to-purple-600 text-slate-950',   // 15: Bright Pink
  '16': 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-700 text-white'       // 16: Deep Green
};

export const COLOR_SWATCHES = [
  { key: 'orange', label: '🟧 ពណ៌ទឹកក្រូច (Orange)', bg: 'bg-orange-500', gradient: 'bg-gradient-to-br from-amber-300 via-orange-400 to-amber-500 text-slate-950 border-white ring-1 ring-orange-400/60' },
  { key: 'emerald', label: '💚 ពណ៌បៃតង (Emerald)', bg: 'bg-emerald-400', gradient: 'bg-gradient-to-br from-emerald-300 via-emerald-400 to-teal-500 text-slate-950 border-white ring-1 ring-emerald-400/60' },
  { key: 'purple', label: '💜 ពណ៌ស្វាយ (Purple)', bg: 'bg-purple-400', gradient: 'bg-gradient-to-br from-purple-300 via-purple-400 to-indigo-500 text-slate-950 border-white ring-1 ring-purple-400/60' },
  { key: 'rose', label: '🩷 ពណ៌ស៊ីជម្ពូ (Rose)', bg: 'bg-rose-400', gradient: 'bg-gradient-to-br from-rose-300 via-rose-400 to-pink-500 text-slate-950 border-white ring-1 ring-rose-400/60' },
  { key: 'fuchsia', label: '💖 ពណ៌ទង់ដែង (Fuchsia)', bg: 'bg-fuchsia-400', gradient: 'bg-gradient-to-br from-fuchsia-300 via-fuchsia-400 to-pink-600 text-slate-950 border-white ring-1 ring-fuchsia-400/60' },
  { key: 'lime', label: '🍏 ពណ៌បៃតងខ្ចី (Lime)', bg: 'bg-lime-400', gradient: 'bg-gradient-to-br from-lime-300 via-lime-400 to-emerald-500 text-slate-950 border-white ring-1 ring-lime-400/60' },
  { key: 'indigo', label: '💙 ពណ៌ខៀវចាស់ (Indigo)', bg: 'bg-indigo-400', gradient: 'bg-gradient-to-br from-indigo-300 via-indigo-400 to-blue-600 text-white border-white ring-1 ring-indigo-400/60' },
  { key: 'red', label: '🪸 ពណ៌ក្រហម (Crimson)', bg: 'bg-red-500', gradient: 'bg-gradient-to-br from-red-400 via-rose-500 to-red-600 text-white border-white ring-1 ring-rose-400/60' },
  { key: 'teal', label: '🩵 ពណ៌ខៀវស្រស់ (Teal)', bg: 'bg-teal-400', gradient: 'bg-gradient-to-br from-teal-300 via-teal-400 to-cyan-600 text-slate-950 border-white ring-1 ring-teal-400/60' },
  { key: 'violet', label: '🪻 ពណ៌ស្វាយចាស់ (Violet)', bg: 'bg-violet-400', gradient: 'bg-gradient-to-br from-violet-300 via-violet-400 to-purple-600 text-slate-950 border-white ring-1 ring-violet-400/60' },
  { key: 'pink', label: '🌸 ពណ៌ផ្កាឈូក (Pink)', bg: 'bg-pink-400', gradient: 'bg-gradient-to-br from-pink-300 via-fuchsia-400 to-purple-600 text-slate-950 border-white ring-1 ring-pink-400/60' }
];

const COLOR_OPTION_GRADIENTS = COLOR_SWATCHES.reduce((acc, swatch) => {
  acc[swatch.key] = swatch.gradient;
  return acc;
}, {});

export function getPinBadgeColorClass(loc, idx = 0, activeTab = 'interactive') {
  if (!loc) return 'bg-gradient-to-br from-cyan-300 via-sky-400 to-blue-500 text-slate-950 border-white ring-1 ring-sky-400/60';

  const idStr = String(loc.id || '').trim();

  // Gates A-E: Original Gold Yellow (ពណ៌លឿង/មាស សម្រាប់ខ្លោងទ្វារ)
  if (loc.type === 'gate' || STANDARD_GATES.includes(idStr)) {
    return 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-slate-950 border-white ring-1 ring-amber-400/60';
  }

  // Tag pins get an explicit orange/amber gradient so they stand out from cyan base building pins
  if (loc.isTagPin || loc.tagNumber || loc.tagNumberDisplay) {
    return 'bg-gradient-to-br from-amber-300 via-orange-400 to-amber-500 text-slate-950 border-white ring-2 ring-amber-400/90 font-bold shadow-lg';
  }

  // Custom user-selected badge color on Tab 3 (if specifically purple, rose, fuchsia, etc.)
  if (activeTab === 'tagger' && loc.badgeColor && loc.badgeColor !== 'emerald' && COLOR_OPTION_GRADIENTS[loc.badgeColor]) {
    return COLOR_OPTION_GRADIENTS[loc.badgeColor];
  }

  // Default ALL base location pins to 100% BLUE (cyan) across ALL tabs
  return 'bg-gradient-to-br from-cyan-300 via-sky-400 to-blue-500 text-slate-950 border-white ring-1 ring-sky-400/60';
}

export function getPinSizeClasses(size) {
  switch (size) {
    case 'small':
      return 'w-3.5 h-3.5 sm:w-4 sm:h-4 text-[7px] sm:text-[8px] sm:border';
    case 'large':
      return 'w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[10px] sm:text-[11px] md:text-[12px] border-2';
    case 'normal':
    default:
      return 'w-4.5 h-4.5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[8px] sm:text-[9px] md:text-[10px] sm:border-2';
  }
}

export function getLocationAbbreviation(name = '', type = 'building') {
  if (!name) return type === 'gate' ? '⛩️' : '🏢';
  const cleanName = String(name).trim();

  // Explicit Khmer abbreviation mapping for temple locations
  const explicitMap = {
    'ធម្មសាលាសភា': 'ធ',
    'សាលាធម្មសភា': 'ធ',
    'មហាកុដិ': 'ម.ក',
    'កុដិសាឡុម': 'ក.ស',
    'កុដិតូច': 'កុ.ត',
    'កុដិថ្មី': 'ក.ថ្មី',
    'កុដិគ្រូធំ': 'ក.គ',
    'ព្រះវិហារ': 'ព.វ',
    'ដើមពោធិព្រឹក្ស': 'ពោធិ์',
    'បណ្ណាល័យ': 'ប.ណ',
    'ពុទ្ធកបឋមសិក្សាកម្រងហ៊ុនណេង': 'ពុទ្ធក',
    'កុដិយាយតា': 'ក.យ',
    'ប៉ុស្តិ៍វិទ្យុ': 'វិទ្យុ',
    'អាងទឹក': 'អាង',
    'អាងទឹកវិទ្យុ': 'អាង.វ',
    'ព្រះផ្ទំ': 'ព្រះផ្ទំ',
    'ចេតិយនគរភ្នំ ចាយ ស៊ាងអ៊ី': 'ចេតិយ'
  };

  if (explicitMap[cleanName]) return explicitMap[cleanName];

  if (cleanName.includes('ខ្លោងទ្វារ')) {
    const numMatch = cleanName.match(/[១-៩1-9]+/);
    if (numMatch) return `ទ${numMatch[0]}`;
  }

  const words = cleanName.split(/\s+/);
  if (words.length >= 2) {
    const w1 = words[0].charAt(0);
    const w2 = words[1].charAt(0);
    return `${w1}.${w2}`;
  }

  if (cleanName.length <= 4) return cleanName;
  return cleanName.slice(0, 3);
}

export function getPinBadgeText(loc, activeTab = 'tagger') {
  if (!loc) return '';
  if (loc.isTagPin || loc.tagNumber || loc.tagNumberDisplay) {
    if (loc.tagNumberDisplay) return String(loc.tagNumberDisplay);
    if (loc.tagNumber) return westernToKhmerDigits(loc.tagNumber);
    if (loc.id) {
      const cleanId = String(loc.id).replace('tag-', '');
      const western = khmerToWesternDigits(cleanId);
      if (/^\d+$/.test(western)) return westernToKhmerDigits(western);
    }
  }
  return getLocationAbbreviation(loc.name, loc.type);
}

export function getDisplayPinName(loc, allTags = [], activeTab = 'tagger', tab3Locations = []) {
  if (!loc) return '';
  const locIdStr = String(loc.id || '').trim();

  if (loc.isTagPin || loc.tagNumber || loc.tagNumberDisplay) {
    const tagNumDisp = loc.tagNumberDisplay || (loc.tagNumber ? westernToKhmerDigits(loc.tagNumber) : (loc.isTagPin ? westernToKhmerDigits(loc.id.replace('tag-', '')) : null));
    const matchedTag = allTags.find(
      (t) =>
        (loc.tagNumber && String(t.tagNumber) === String(loc.tagNumber)) ||
        (loc.tagNumberDisplay && String(t.tagNumberDisplay) === String(loc.tagNumberDisplay)) ||
        (loc.isTagPin && (String(t.tagNumber) === String(loc.id).replace('tag-', '') || String(t.tagNumberDisplay) === String(loc.id)))
    );
    const tagOwner = loc.tagOwnerName || (matchedTag ? matchedTag.name : '');

    if (tagNumDisp && tagOwner) return `ស្លាក ${tagNumDisp} ៖ ${tagOwner}`;
    if (tagNumDisp) return `ស្លាក ${tagNumDisp}`;
    if (tagOwner) return tagOwner;
  }

  const initialMatch = !loc.isTagPin ? INITIAL_TEMPLE_LOCATIONS.find((init) => String(init.id).trim() === locIdStr) : null;
  return initialMatch ? initialMatch.name : loc.name;
}

export default function TempleMapModal({
  onClose,
  allTags = [],
  currentUser,
  highlightLocationName = null,
  onFilterByLocation,
  onAddTagForLocation,
  onSelectTag,
  isModal = true
}) {
  const modalMode = isModal && Boolean(onClose);
  // Only admin & owner can customize (add/edit/delete pins, drag, create groups) on Tab 3
  // Assistant and Guest can only VIEW the map
  const userRole = currentUser?.role || 'guest';
  const canCustomizeMap = userRole === 'admin' || userRole === 'owner';

  // Tab 1 & Tab 2 share this state
  const [locations, setLocations] = useState(getSavedTempleLocations());
  // Tab 3 has its own INDEPENDENT state
  const [tab3Locations, setTab3Locations] = useState(getSavedTab3Locations());
  const [activeTab, setActiveTab] = useState('tagger'); // Default directly to Tab 3 (ផ្ទាំងទី៣ ៖ នៅស្លាកលើ Map)

  // Group tags by person name for dropdown selector & pins
  const groupedAllTags = useMemo(() => {
    return groupTagsByName(allTags);
  }, [allTags]);

  // Tab 1 = Read only for all. Tab 2 & Tab 3 = Restricted to Admin & Owner ONLY!
  const canCustomizeTab = (activeTab === 'interactive' || activeTab === 'tagger') && canCustomizeMap;

  // Sync Tab 3 metadata with allTags while preserving Location Names (ឈ្មោះទីតាំង)
  const effectiveTab3Locations = useMemo(() => {
    return tab3Locations.map((loc) => {
      const locIdStr = String(loc.id || '').trim();
      
      // Look up authentic original location name from INITIAL_TEMPLE_LOCATIONS ONLY for base building/gate pins
      const initialMatch = !loc.isTagPin ? INITIAL_TEMPLE_LOCATIONS.find((init) => String(init.id).trim() === locIdStr) : null;
      const locationName = initialMatch ? initialMatch.name : loc.name;

      const matchedTag = allTags.find((t) => {
        const tNoStr = String(t.tagNumber || '').trim();
        const tDispStr = String(t.tagNumberDisplay || '').trim();
        const tBase = String(t.baseLocation || t.location || '').trim();

        // 1. Explicit tag pin match (if pin was created/assigned specifically for a tag number)
        if (loc.isTagPin && (String(loc.tagNumber || '') === tNoStr || String(loc.tagNumberDisplay || '') === tDispStr || locIdStr === tDispStr)) {
          return true;
        }

        // 2. Match by Location Name ONLY if tag's baseLocation explicitly matches locationName or locIdStr
        if (!loc.isTagPin && tBase && tBase !== 'មើលទីកន្លែង' && tBase !== 'មិនទាន់ដៅលើ Map' && tBase !== 'ទីតាំងមិនទាន់កំណត់' && (tBase === locationName || tBase === locIdStr)) {
          return true;
        }

        return false;
      });

      const tagNum = loc.isTagPin ? (matchedTag && matchedTag.tagNumber ? matchedTag.tagNumber : loc.tagNumber) : loc.tagNumber;
      const tagDisp = loc.isTagPin
        ? (matchedTag && matchedTag.tagNumberDisplay
            ? matchedTag.tagNumberDisplay
            : (loc.tagNumberDisplay || (tagNum ? westernToKhmerDigits(tagNum) : westernToKhmerDigits(String(loc.id).replace('tag-', '')))))
        : loc.tagNumberDisplay;

      return {
        ...loc,
        name: locationName, // ALWAYS KEEP LOCATION NAME! (ឈ្មោះទីតាំង)
        tagOwnerName: loc.isTagPin ? (matchedTag && matchedTag.name ? matchedTag.name : loc.tagOwnerName) : loc.tagOwnerName,
        tagNumber: tagNum,
        tagNumberDisplay: tagDisp
      };
    });
  }, [tab3Locations, allTags]);

  // Filter out visitor tag pins from Tab 1 & Tab 2 locations so Tab 1 & Tab 2 NEVER display visitor tag pins
  const baseMapLocations = useMemo(() => {
    return locations.filter((loc) => !loc.isTagPin && !loc.tagNumber && !loc.tagNumberDisplay);
  }, [locations]);

  // Computed: which locations array to use based on active tab
  const currentLocations = effectiveTab3Locations;
  const [zoomScale, setZoomScale] = useState(1.0);
  const [pinSizePx, setPinSizePx] = useState(14); // Default global Pin circle size in px (14px)
  const [selectedSizeGroup, setSelectedSizeGroup] = useState('all'); // 'all' | categoryName
  const [groupPinSizes, setGroupPinSizes] = useState({}); // { [catName]: sizeInPx }
  const [isLabelsVisible, setIsLabelsVisible] = useState(true);
  const [isPinsVisible, setIsPinsVisible] = useState(true);
  const [isCompassVisible, setIsCompassVisible] = useState(true);
  const [isCompassExpanded, setIsCompassExpanded] = useState(false);
  const [isDragEnabled, setIsDragEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openAccordions, setOpenAccordions] = useState({});
  const [hiddenCategories, setHiddenCategories] = useState({});
  const [lockedCategories, setLockedCategories] = useState({});
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [hoveredLocation, setHoveredLocation] = useState(null);

  // Edit / Add Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState(null);
  const [modalForm, setModalForm] = useState({
    id: '',
    name: '',
    badgeColor: 'orange',
    type: 'building',
    pos: 'R',
    category: '🏢 ក្រុមអគារ និង កុដិ'
  });
  const [formError, setFormError] = useState('');

  // Tab 3 Pinning Tag State (Direct manual tagging)
  const [selectedTagForPin, setSelectedTagForPin] = useState('');
  const [pendingPinTag, setPendingPinTag] = useState(null);
  const [taggerSubView, setTaggerSubView] = useState('locations'); // 'locations' | 'tags'

  // Custom Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedLocationIdsForGroup, setSelectedLocationIdsForGroup] = useState([]);
  const [tagNumbersBatchInput, setTagNumbersBatchInput] = useState('');
  const [batchTagWarnings, setBatchTagWarnings] = useState([]);

  // Group Edit Modal State
  const [isGroupEditModalOpen, setIsGroupEditModalOpen] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [pinningGroupMode, setPinningGroupMode] = useState(null);

  // Add/Edit Location Pin Modal mode ('single' | 'group')
  const [pinModalMode, setPinModalMode] = useState('single');
  const [selectedGroupForBatchPin, setSelectedGroupForBatchPin] = useState('');

  // History & Redo stack for Ctrl+Z and Ctrl+U
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [undoToast, setUndoToast] = useState('');

  // Track deleted categories so deleted groups disappear completely
  const [deletedCategories, setDeletedCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('TEMPLE_DELETED_GROUPS_V1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveDeletedCategories = (list) => {
    setDeletedCategories(list);
    try {
      localStorage.setItem('TEMPLE_DELETED_GROUPS_V1', JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to record history before mutation
  const pushHistorySnapshot = (locationsSnapshot) => {
    if (!locationsSnapshot) return;
    setHistory((prev) => [...prev.slice(-20), JSON.parse(JSON.stringify({ locations: locationsSnapshot, deletedCategories }))]);
    setRedoStack([]);
  };

  // Undo function (Ctrl+Z)
  const handleUndo = () => {
    if (history.length === 0) return;
    const { setter, saver } = getTabDataFunctions();
    const currentBaseLocs = activeTab === 'tagger' ? tab3Locations : baseMapLocations;

    const previousSnapshot = history[history.length - 1];
    const newHistory = history.slice(0, history.length - 1);

    const previousLocs = Array.isArray(previousSnapshot) ? previousSnapshot : (previousSnapshot.locations || []);
    const previousDeleted = (!Array.isArray(previousSnapshot) && previousSnapshot.deletedCategories) ? previousSnapshot.deletedCategories : deletedCategories;

    setRedoStack((prev) => [...prev, JSON.parse(JSON.stringify({ locations: currentBaseLocs, deletedCategories }))]);
    setHistory(newHistory);

    setter(previousLocs);
    saver(previousLocs);
    saveDeletedCategories(previousDeleted);

    if (activeTab === 'interactive') {
      setTab3Locations(previousLocs);
      saveTab3LocationsToFirebase(previousLocs);
    }

    setUndoToast('↩️ បានថយក្រោយ (Undo - Ctrl+Z)');
    setTimeout(() => setUndoToast(''), 2200);
  };

  // Redo function (Ctrl+U / Ctrl+Y)
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const { setter, saver } = getTabDataFunctions();
    const currentBaseLocs = activeTab === 'tagger' ? tab3Locations : baseMapLocations;

    const nextSnapshot = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, redoStack.length - 1);

    const nextLocs = Array.isArray(nextSnapshot) ? nextSnapshot : (nextSnapshot.locations || []);
    const nextDeleted = (!Array.isArray(nextSnapshot) && nextSnapshot.deletedCategories) ? nextSnapshot.deletedCategories : deletedCategories;

    setHistory((prev) => [...prev, JSON.parse(JSON.stringify({ locations: currentBaseLocs, deletedCategories }))]);
    setRedoStack(newRedo);

    setter(nextLocs);
    saver(nextLocs);
    saveDeletedCategories(nextDeleted);

    if (activeTab === 'interactive') {
      setTab3Locations(nextLocs);
      saveTab3LocationsToFirebase(nextLocs);
    }

    setUndoToast('↪️ បានទៅមុខ (Redo - Ctrl+U)');
    setTimeout(() => setUndoToast(''), 2200);
  };

  // Keyboard shortcut listener for Ctrl+Z and Ctrl+U
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();

        if (key === 'z' && !e.shiftKey) {
          const activeEl = document.activeElement;
          const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

          if (!isInput && history.length > 0) {
            e.preventDefault();
            handleUndo();
          }
        } else if (key === 'u' || key === 'y' || (key === 'z' && e.shiftKey)) {
          const activeEl = document.activeElement;
          const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

          if (!isInput && redoStack.length > 0) {
            e.preventDefault();
            handleRedo();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, redoStack, activeTab, tab3Locations, locations]);

  // Panning, wheel zoom & dragging ref
  const viewportRef = useRef(null);
  const mapContainerRef = useRef(null);
  const modalBodyRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const hasPannedRef = useRef(false);
  const touchStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const pinchRafRef = useRef(null);
  const liveScaleRef = useRef(1.0); // Tracks real-time scale during pinch (no React re-render)
  const pinchStateRef = useRef({
    active: false,
    initialDist: 0,
    initialScale: 1.0,
    initialScrollLeft: 0,
    initialScrollTop: 0,
    midX: 0,
    midY: 0
  });
  const [draggingPinId, setDraggingPinId] = useState(null);
  const pinMovedFlagRef = useRef(false);

  // Mobile Responsiveness Auto-Tuning: Default zoom & compact view for mobile screens
  useEffect(() => {
    const isMobile = window.innerWidth < 640;
    if (isMobile) {
      setZoomScale(1.35); // Expand map to fill phone screen edge-to-edge
      setPinSizePx(12);   // Compact 12px pin circle for mobile
    }
  }, []);

  // ════════ REAL-TIME CLOUD SYNC FOR PC & PHONE ════════
  // Tab 1 & Tab 2 share this subscription
  useEffect(() => {
    const unsubscribe = subscribeToFirebaseTempleLocations(
      (cloudLocations) => {
        if (Array.isArray(cloudLocations) && cloudLocations.length > 0) {
          setLocations(cloudLocations);
        }
      },
      (err) => {
        console.warn('Temple locations using local cache:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Tab 3 has its own INDEPENDENT subscription
  useEffect(() => {
    const unsubscribe = subscribeToFirebaseTab3Locations(
      (cloudLocations) => {
        if (Array.isArray(cloudLocations) && cloudLocations.length > 0) {
          setTab3Locations(cloudLocations);
        }
      },
      (err) => {
        console.warn('Tab 3 locations using local cache:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Subscribe to Realtime Group Settings (Hidden & Locked categories synced across PC & Phone)
  useEffect(() => {
    const unsubscribe = subscribeToGroupSettings((settings) => {
      if (settings && typeof settings === 'object') {
        const hidden = {};
        const locked = {};
        Object.entries(settings).forEach(([cat, s]) => {
          if (s && s.hidden) hidden[cat] = true;
          if (s && s.locked) locked[cat] = true;
        });
        setHiddenCategories(hidden);
        setLockedCategories(locked);
      }
    });

    return () => unsubscribe();
  }, []);

  const syncGroupSettingsToCloud = (nextHidden, nextLocked) => {
    const allCatNames = new Set([
      ...Object.keys(hiddenCategories),
      ...Object.keys(lockedCategories),
      ...Object.keys(nextHidden),
      ...Object.keys(nextLocked)
    ]);

    const payload = {};
    allCatNames.forEach((cat) => {
      payload[cat] = {
        hidden: !!nextHidden[cat],
        locked: !!nextLocked[cat]
      };
    });

    saveGroupSettingsToFirebase(payload);
  };

  // 🎯 Ultra-Fluid 120fps Native Camera Centering (Zero Jitter, Zero Stutter)
  const centerPinOnMap = (loc) => {
    if (!loc || typeof loc.x !== 'number' || typeof loc.y !== 'number') return;

    const isMobile = window.innerWidth < 640;
    const targetZoom = isMobile ? 1.8 : 2.2;

    // 1. Immediately set zoom scale
    setZoomScale(targetZoom);

    // 2. Perform smooth 120fps lerp camera glide directly to target pin
    const performScrollGlide = () => {
      if (!viewportRef.current || !mapContainerRef.current) return;

      const vp = viewportRef.current;
      const mapBox = mapContainerRef.current;

      const containerWidth = mapBox.offsetWidth;
      const containerHeight = mapBox.offsetHeight;

      if (!containerWidth || !containerHeight) return;

      // Pin coordinates on map
      const pinX = (loc.x / 100) * containerWidth;
      const pinY = (loc.y / 100) * containerHeight;

      // Center of viewport
      const targetLeft = Math.max(0, pinX - vp.clientWidth / 2);
      const targetTop = Math.max(0, pinY - vp.clientHeight / 2);

      const startLeft = vp.scrollLeft;
      const startTop = vp.scrollTop;

      const distance = Math.hypot(targetLeft - startLeft, targetTop - startTop);
      if (distance < 10) {
        vp.scrollLeft = targetLeft;
        vp.scrollTop = targetTop;
        return;
      }

      const startTime = performance.now();
      const duration = 380; // Crisp 380ms camera motion

      const animateStep = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1.0, elapsed / duration);

        // Smooth cubic ease-out curve (Native Apple/Google Maps feel)
        const ease = 1 - Math.pow(1 - progress, 3);

        vp.scrollLeft = startLeft + (targetLeft - startLeft) * ease;
        vp.scrollTop = startTop + (targetTop - startTop) * ease;

        if (progress < 1.0) {
          requestAnimationFrame(animateStep);
        } else {
          vp.scrollLeft = targetLeft;
          vp.scrollTop = targetTop;
        }
      };

      requestAnimationFrame(animateStep);
    };

    // Trigger frame right after DOM scale update
    requestAnimationFrame(() => {
      requestAnimationFrame(performScrollGlide);
    });
  };

  // Focus on highlighted location or tag if passed from parent
  useEffect(() => {
    if (highlightLocationName) {
      setActiveTab('tagger');

      let targetLoc = null;

      if (typeof highlightLocationName === 'object' && highlightLocationName !== null) {
        const tagObj = highlightLocationName;
        const tagNoStr = String(tagObj.tagNumber || '').trim();
        const tagDispStr = String(tagObj.tagNumberDisplay || '').trim();
        const tagLocStr = String(tagObj.baseLocation || tagObj.location || '').trim().toLowerCase();

        // Search by Tag Pin
        targetLoc = effectiveTab3Locations.find((l) => {
          if (!l.isTagPin && !l.tagNumber && !l.tagNumberDisplay) return false;
          const lNumStr = String(l.tagNumber || '').trim();
          const lDispStr = String(l.tagNumberDisplay || '').trim();
          const lIdStr = String(l.id || '').trim();
          return (
            (tagNoStr && lNumStr === tagNoStr) ||
            (tagDispStr && lDispStr === tagDispStr) ||
            (l.isTagPin && (lIdStr === tagNoStr || lIdStr === tagDispStr))
          );
        });

        // Search by Location Name if tag has explicit valid location
        if (!targetLoc && tagLocStr && tagLocStr !== 'មើលទីកន្លែង' && tagLocStr !== 'មិនទាន់ដៅលើ map' && tagLocStr !== 'ទីតាំងមិនទាន់កំណត់') {
          targetLoc = effectiveTab3Locations.find((l) => {
            const lName = String(l.name || '').toLowerCase().trim();
            return lName === tagLocStr || lName.includes(tagLocStr) || tagLocStr.includes(lName);
          }) || locations.find((l) => {
            const lName = String(l.name || '').toLowerCase().trim();
            return lName === tagLocStr || lName.includes(tagLocStr) || tagLocStr.includes(lName);
          });
        }
      } else {
        const searchTarget = String(highlightLocationName).toLowerCase().trim();
        const westernTarget = khmerToWesternDigits(searchTarget);

        if (searchTarget && searchTarget !== 'មើលទីកន្លែង' && searchTarget !== 'មិនទាន់ដៅលើ map' && searchTarget !== 'ទីតាំងមិនទាន់កំណត់') {
          targetLoc = effectiveTab3Locations.find((l) => {
            const pinIdStr = String(l.id || '').trim();
            const pinNameStr = String(l.name || '').toLowerCase().trim();
            const lNumStr = String(l.tagNumber || '').trim();

            return (
              pinNameStr === searchTarget ||
              pinNameStr.includes(searchTarget) ||
              searchTarget.includes(pinNameStr) ||
              (l.isTagPin && (pinIdStr === searchTarget || pinIdStr === westernTarget)) ||
              (lNumStr && lNumStr === searchTarget)
            );
          }) || locations.find((l) => {
            const pinIdStr = String(l.id || '').trim();
            const pinNameStr = String(l.name || '').toLowerCase().trim();
            return pinNameStr.includes(searchTarget) || (l.isTagPin && pinIdStr === searchTarget);
          });
        }
      }

      // DO NOT FALLBACK TO RANDOM FIRST LOCATION!
      setSelectedLocation(targetLoc || null);
    }
  }, [highlightLocationName, effectiveTab3Locations, locations]);

  // Auto scroll modal body UP to Map section & smooth center camera on target location on map
  useEffect(() => {
    if (selectedLocation) {
      const catName = selectedLocation.category || (selectedLocation.type === 'gate' ? '⛩️ ក្រុមក្លោងទ្វារវត្ត' : '🏢 ក្រុមអគារ និង កុដិ');
      setOpenAccordions((prev) => ({
        ...prev,
        [catName]: true
      }));

      // Scroll outer modal body UP to top so Map Canvas is 100% visible!
      if (modalBodyRef.current) {
        modalBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // Smoothly center map camera on target location
      centerPinOnMap(selectedLocation);
    }
  }, [selectedLocation]);


  // Compute tag counts per temple location
  const tagCountsByLocation = useMemo(() => {
    const counts = {};
    currentLocations.forEach((loc) => {
      if (loc.isTagPin || loc.tagNumber || loc.tagNumberDisplay) {
        counts[loc.id] = 1;
      } else {
        let count = 0;
        allTags.forEach((t) => {
          const locStr = String(t.baseLocation || t.location || '').trim();
          if ((locStr && loc.name && locStr.includes(loc.name)) || (t.templeLocationId && String(t.templeLocationId) === String(loc.id))) {
            count++;
          }
        });
        counts[loc.id] = count;
      }
    });
    return counts;
  }, [allTags, currentLocations]);

  // Categories list
  const categoryGroups = useMemo(() => {
    const groups = {};
    currentLocations.forEach((loc) => {
      const cat = loc.category;
      if (!cat || deletedCategories.includes(cat)) return;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(loc);
    });
    return groups;
  }, [currentLocations, deletedCategories]);

  const availableCategories = useMemo(() => {
    const cats = new Set();
    Object.keys(categoryGroups).forEach((c) => {
      if (!deletedCategories.includes(c)) cats.add(c);
    });
    return Array.from(cats);
  }, [categoryGroups, deletedCategories]);

  // Zoom handlers (clamped between 0.4x and 5.0x with center focal preservation)
  const handleZoom = (delta) => {
    const vp = viewportRef.current;
    const mapBox = mapContainerRef.current;
    const currentScale = zoomScale;
    const nextScale = Math.max(0.4, Math.min(5.0, parseFloat((currentScale + delta).toFixed(2))));
    if (nextScale === currentScale) return;

    if (vp && mapBox && currentScale > 0) {
      const ratio = nextScale / currentScale;
      const focalX = vp.clientWidth / 2;
      const focalY = vp.clientHeight / 2;

      const targetScrollLeft = Math.max(0, (vp.scrollLeft + focalX) * ratio - focalX);
      const targetScrollTop = Math.max(0, (vp.scrollTop + focalY) * ratio - focalY);

      mapBox.style.width = `${nextScale * 100}%`;
      vp.scrollLeft = targetScrollLeft;
      vp.scrollTop = targetScrollTop;

      setZoomScale(nextScale);
    } else {
      setZoomScale(nextScale);
    }
  };

  const handleResetZoom = () => {
    const isMobile = window.innerWidth < 640;
    setZoomScale(isMobile ? 1.35 : 1.0);
    if (viewportRef.current) {
      viewportRef.current.scrollLeft = 0;
      viewportRef.current.scrollTop = 0;
    }
  };

  // PC Mouse Scroll Wheel Zoom (zooms directly into exact mouse cursor focal position)
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const handleWheel = (e) => {
      e.preventDefault();

      const delta = e.deltaY < 0 ? 0.15 : -0.15;
      const currentScale = zoomScale;
      const nextScale = Math.max(0.4, Math.min(5.0, parseFloat((currentScale + delta).toFixed(2))));
      if (nextScale === currentScale) return;

      const mapBox = mapContainerRef.current;
      if (vp && mapBox && currentScale > 0) {
        const vpRect = vp.getBoundingClientRect();
        const focalX = e.clientX - vpRect.left;
        const focalY = e.clientY - vpRect.top;
        const ratio = nextScale / currentScale;

        const targetScrollLeft = Math.max(0, (vp.scrollLeft + focalX) * ratio - focalX);
        const targetScrollTop = Math.max(0, (vp.scrollTop + focalY) * ratio - focalY);

        // Pre-expand map width in DOM so scrollWidth expands dynamically without clamping
        mapBox.style.width = `${nextScale * 100}%`;
        vp.scrollLeft = targetScrollLeft;
        vp.scrollTop = targetScrollTop;

        setZoomScale(nextScale);
      }
    };

    vp.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      vp.removeEventListener('wheel', handleWheel);
    };
  }, [zoomScale]);

  // Viewport Mouse Panning (Works in all tabs & zoom scales)
  const handleMouseDown = (e) => {
    if (draggingPinId) return;
    if (e.target.closest('.zoom-toolbar')) return;

    const pinEl = e.target.closest('.map-pin-element');
    if (pinEl && pinEl.getAttribute('data-draggable') === 'true') {
      return; // Only draggable pins block map panning
    }

    setIsPanning(true);
    hasPannedRef.current = false;
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: viewportRef.current ? viewportRef.current.scrollLeft : 0,
      scrollTop: viewportRef.current ? viewportRef.current.scrollTop : 0
    };
  };

  const handleMouseMove = (e) => {
    if (!isPanning || draggingPinId || !viewportRef.current) return;

    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasPannedRef.current = true;
      pinMovedFlagRef.current = true;
    }

    viewportRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
    viewportRef.current.scrollTop = panStartRef.current.scrollTop - dy;
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setTimeout(() => {
      pinMovedFlagRef.current = false;
      hasPannedRef.current = false;
    }, 50);
  };

  // Touch Panning (1 finger) & GPU-Composited 120fps Focal Pinch Zoom (2 fingers)
  // Key insight: during pinch we NEVER call setZoomScale (no React re-render).
  // Instead we directly mutate mapContainerRef.current.style.transform on the GPU thread.
  // On touchend we commit the final value to React state exactly once.
  const handleTouchStart = (e) => {
    if (draggingPinId) return;
    if (e.target.closest('.zoom-toolbar')) return;

    const pinEl = e.target.closest('.map-pin-element');
    if (pinEl && pinEl.getAttribute('data-draggable') === 'true') {
      return;
    }

    if (e.touches.length === 1) {
      // Cancel any pending pinch
      if (pinchStateRef.current.active) {
        pinchStateRef.current.active = false;
      }
      setIsPanning(true);
      hasPannedRef.current = false;
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        scrollLeft: viewportRef.current ? viewportRef.current.scrollLeft : 0,
        scrollTop: viewportRef.current ? viewportRef.current.scrollTop : 0
      };
    } else if (e.touches.length === 2) {
      setIsPanning(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

      const vp = viewportRef.current;
      const vpRect = vp ? vp.getBoundingClientRect() : { left: 0, top: 0 };
      const midX = (t1.clientX + t2.clientX) / 2 - vpRect.left;
      const midY = (t1.clientY + t2.clientY) / 2 - vpRect.top;

      liveScaleRef.current = zoomScale;

      pinchStateRef.current = {
        active: true,
        initialDist: dist,
        initialScale: zoomScale,
        initialScrollLeft: vp ? vp.scrollLeft : 0,
        initialScrollTop: vp ? vp.scrollTop : 0,
        midX,
        midY
      };
    }
  };

  const handleTouchMove = (e) => {
    if (draggingPinId || !viewportRef.current) return;

    if (e.touches.length === 1 && !pinchStateRef.current.active && touchStartRef.current.x) {
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasPannedRef.current = true;
        pinMovedFlagRef.current = true;
      }

      if (liveScaleRef.current > 1.0) {
        viewportRef.current.scrollLeft = touchStartRef.current.scrollLeft - dx;
        viewportRef.current.scrollTop = touchStartRef.current.scrollTop - dy;
      }
    } else if (e.touches.length === 2 && pinchStateRef.current.active) {
      if (e.cancelable) e.preventDefault();

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      if (!pinchStateRef.current.initialDist) return;

      const { initialDist, initialScale, initialScrollLeft, initialScrollTop, midX, midY } = pinchStateRef.current;
      const scaleFactor = dist / initialDist;
      const nextScale = Math.max(0.4, Math.min(5.0, initialScale * scaleFactor));

      liveScaleRef.current = nextScale;

      const mapEl = mapContainerRef.current;
      const vp = viewportRef.current;

      if (mapEl && vp) {
        // Expand map width in real-time so scrollWidth expands dynamically without clamping
        mapEl.style.width = `${nextScale * 100}%`;

        // Calculate exact scroll position to anchor focal point under 2 fingers
        const ratio = nextScale / (initialScale || 1);
        const targetScrollLeft = Math.max(0, (initialScrollLeft + midX) * ratio - midX);
        const targetScrollTop = Math.max(0, (initialScrollTop + midY) * ratio - midY);

        vp.scrollLeft = targetScrollLeft;
        vp.scrollTop = targetScrollTop;
      }
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);

    if (pinchStateRef.current.active) {
      pinchStateRef.current.active = false;

      const finalScale = liveScaleRef.current;
      const vp = viewportRef.current;
      const finalScrollLeft = vp ? vp.scrollLeft : 0;
      const finalScrollTop = vp ? vp.scrollTop : 0;

      // Commit final scale to React state
      setZoomScale(parseFloat(finalScale.toFixed(2)));

      // Lock scroll position seamlessly
      requestAnimationFrame(() => {
        if (viewportRef.current) {
          viewportRef.current.scrollLeft = finalScrollLeft;
          viewportRef.current.scrollTop = finalScrollTop;
        }
      });
    }

    if (pinchRafRef.current) cancelAnimationFrame(pinchRafRef.current);

    setTimeout(() => {
      pinMovedFlagRef.current = false;
      hasPannedRef.current = false;
    }, 50);
  };

  // Helper: calculate next default location ID in Khmer digits (e.g. ១៨, ១៩, ២០...)
  const getNextDefaultLocationId = (locs = []) => {
    let maxNum = 0;
    locs.forEach((l) => {
      const khmerToWestern = String(l.id || '')
        .replace(/០/g, '0').replace(/១/g, '1').replace(/២/g, '2').replace(/៣/g, '3').replace(/៤/g, '4')
        .replace(/៥/g, '5').replace(/៦/g, '6').replace(/៧/g, '7').replace(/៨/g, '8').replace(/៩/g, '9');
      const num = parseInt(khmerToWestern, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    });
    const nextNum = maxNum > 0 ? maxNum + 1 : locs.length + 1;
    return String(nextNum);
  };

  // Helper: get the first unpinned tag in system to recommend as next pin
  const getFirstAvailableTag = () => {
    if (!groupedAllTags || groupedAllTags.length === 0) return null;

    return groupedAllTags.find((t) => {
      const tNum = Number(t.tagNumber);
      const tagNumStr = String(t.tagNumber || '').trim().toLowerCase();
      const tagDispStr = String(t.tagNumberDisplay || '').trim().toLowerCase();
      const tagNumWestern = khmerToWesternDigits(tagDispStr || tagNumStr).trim().toLowerCase();

      const isPinned = currentLocations.some((loc) => {
        if (!loc.isTagPin && !loc.tagNumber && !loc.tagNumberDisplay) return false;

        const locTagNum = loc.tagNumber ? Number(loc.tagNumber) : null;
        if (locTagNum && locTagNum === tNum) return true;

        if (loc.tagNumberDisplay) {
          const locDispWestern = khmerToWesternDigits(String(loc.tagNumberDisplay)).trim().toLowerCase();
          if (locDispWestern === tagNumWestern || String(loc.tagNumberDisplay).trim().toLowerCase() === tagDispStr) return true;
        }

        if (loc.isTagPin) {
          const locIdWestern = khmerToWesternDigits(String(loc.id || '')).trim().toLowerCase();
          if (locIdWestern === tagNumWestern || String(loc.id).trim().toLowerCase() === tagNumStr || String(loc.id).trim().toLowerCase() === tagDispStr) return true;
        }

        return false;
      });

      return !isPinned;
    });
  };

  // Core group-pin placement logic (accepts pctX, pctY in map-percentage coords)
  const handleGroupPinPlacement = (pctX, pctY) => {
    // 1. Gather existing locations for this group
    const groupLocations = currentLocations.filter((loc) => loc.category === pinningGroupMode);

    // 2. Find any tags in allTags belonging to this group that don't have a location pin yet
    const missingGroupTags = allTags.filter((t) => {
      const tBase = String(t.baseLocation || t.location || '').trim();
      if (tBase !== pinningGroupMode) return false;

      const tNoStr = String(t.tagNumber || '').trim();
      const tDispStr = String(t.tagNumberDisplay || westernToKhmerDigits(t.tagNumber) || '').trim();
      const tNoWestern = khmerToWesternDigits(tDispStr || tNoStr).trim();

      const exists = currentLocations.some((loc) => {
        const locTagNum = loc.tagNumber ? String(loc.tagNumber).trim() : '';
        const locDisp = loc.tagNumberDisplay ? String(loc.tagNumberDisplay).trim() : '';
        const locId = String(loc.id || '').trim();

        return (
          locTagNum === tNoStr ||
          locDisp === tDispStr ||
          locId === tDispStr ||
          khmerToWesternDigits(locDisp) === tNoWestern ||
          khmerToWesternDigits(locId) === tNoWestern
        );
      });

      return !exists;
    });

    // Create new unpinned location pins for any missing tags
    const newLocsFromTags = missingGroupTags.map((t) => {
      const tagDispStr = t.tagNumberDisplay || westernToKhmerDigits(t.tagNumber);
      return {
        id: tagDispStr,
        name: t.name || `ស្លាកលេខ ${tagDispStr}`,
        x: 50,
        y: 50,
        type: 'building',
        pos: 'R',
        badgeColor: 'orange',
        category: pinningGroupMode,
        tagNumber: t.tagNumber,
        tagNumberDisplay: tagDispStr,
        tagOwnerName: t.name || '',
        isTagPin: true,
        isUnpinned: true
      };
    });

    const allGroupLocs = [...groupLocations, ...newLocsFromTags];
    const count = allGroupLocs.length;

    if (count === 0) {
      alert(`គ្មាន Pin ឬ ស្លាកលេខនៅក្នុង Group «${pinningGroupMode}» ទេ!`);
      setPinningGroupMode(null);
      return;
    }

    saveStateForUndo();

    const cols = Math.ceil(Math.sqrt(count));
    const spacing = 3.5;

    const groupPosMap = {};
    allGroupLocs.forEach((gLoc, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const offsetX = (col - (cols - 1) / 2) * spacing;
      const offsetY = (row - (Math.ceil(count / cols) - 1) / 2) * spacing;

      groupPosMap[gLoc.id] = {
        x: Math.max(2, Math.min(98, parseFloat((pctX + offsetX).toFixed(2)))),
        y: Math.max(2, Math.min(98, parseFloat((pctY + offsetY).toFixed(2))))
      };
    });

    let updated = currentLocations.map((loc) => {
      if (groupPosMap[loc.id] || loc.category === pinningGroupMode) {
        const pos = groupPosMap[loc.id] || {
          x: Math.max(2, Math.min(98, parseFloat(pctX.toFixed(2)))),
          y: Math.max(2, Math.min(98, parseFloat(pctY.toFixed(2))))
        };
        return { ...loc, x: pos.x, y: pos.y, isUnpinned: false };
      }
      return loc;
    });

    newLocsFromTags.forEach((newLoc) => {
      const pos = groupPosMap[newLoc.id];
      if (pos) updated.push({ ...newLoc, x: pos.x, y: pos.y, isUnpinned: false });
    });

    setTab3Locations(updated);
    saveTab3LocationsToFirebase(updated);
    saveTab3Locations(updated);

    setUndoToast(`✅ បានដៅទីតាំង Group «${pinningGroupMode}» លើ Map រួចរាល់ (${westernToKhmerDigits(count)} Pin)!`);
    setTimeout(() => setUndoToast(''), 3500);
    // Auto-scroll camera to first placed pin so user can see them immediately
    const firstPlacedPin = updated.find((l) => l.category === pinningGroupMode);
    if (firstPlacedPin) {
      setTimeout(() => centerPinOnMap(firstPlacedPin), 200);
    }
    setPinningGroupMode(null);
  };

  // Dedicated handler for group-pin mode click on viewport (bypasses all panning guards)
  const handleViewportClickForGroupPin = (e) => {
    if (!pinningGroupMode) return;
    e.stopPropagation();
    const mapBox = mapContainerRef.current;
    if (!mapBox) return;
    const rect = mapBox.getBoundingClientRect();
    // Check if click is within the actual map image bounds
    const isInsideMap = (
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top  && e.clientY <= rect.bottom
    );
    let pctX, pctY;
    if (isInsideMap) {
      pctX = parseFloat(((e.clientX - rect.left) / rect.width * 100).toFixed(2));
      pctY = parseFloat(((e.clientY - rect.top)  / rect.height * 100).toFixed(2));
    } else {
      // Clicked in white area outside map — default to center of map
      pctX = 50;
      pctY = 50;
    }
    handleGroupPinPlacement(pctX, pctY);
  };

  // Map Click (Add new pin on Tab 2 or Tab 3 or Pin Group)
  const handleMapClick = (e) => {
    if (!canCustomizeTab && !pinningGroupMode) return;
    if (draggingPinId) return;
    if (!pinningGroupMode && pinMovedFlagRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const pctX = parseFloat(((clickX / rect.width) * 100).toFixed(2));
    const pctY = parseFloat(((clickY / rect.height) * 100).toFixed(2));

    // Handle Pinning Entire Group Mode (Pins ALL tags/items in group as separate individual pins)
    if (pinningGroupMode) {
      handleGroupPinPlacement(pctX, pctY);
      return;
    }


    setEditingLoc({
      isNew: true,
      x: pctX,
      y: pctY
    });

    if (pendingPinTag) {
      const tagDisp = pendingPinTag.tagNumberDisplay || String(pendingPinTag.tagNumber);
      const latinId = String(pendingPinTag.tagNumber || khmerToWesternDigits(tagDisp));
      setModalForm({
        id: latinId,
        tagNumber: pendingPinTag.tagNumber,
        tagNumberDisplay: tagDisp,
        isTagPin: true,
        name: pendingPinTag.name || pendingPinTag.location || `ស្លាកលេខ #${latinId}`,
        type: 'building',
        pos: 'R',
        category: (pendingPinTag.baseLocation && pendingPinTag.baseLocation !== 'មើលទីកន្លែង' && pendingPinTag.baseLocation !== 'មិនទាន់ដៅលើ Map') ? pendingPinTag.baseLocation : '🏢 ក្រុមអគារ និង កុដិ'
      });
      setSelectedTagForPin(tagDisp || String(pendingPinTag.tagNumber));
      setPendingPinTag(null);
    } else {
      const firstAvailable = activeTab === 'tagger' ? getFirstAvailableTag() : null;
      if (firstAvailable) {
        const tagDisp = firstAvailable.tagNumberDisplay || String(firstAvailable.tagNumber);
        const latinId = String(firstAvailable.tagNumber || khmerToWesternDigits(tagDisp));
        setModalForm({
          id: latinId,
          tagNumber: firstAvailable.tagNumber,
          tagNumberDisplay: tagDisp,
          isTagPin: true,
          name: firstAvailable.name || firstAvailable.location || `ស្លាកលេខ #${latinId}`,
          badgeColor: 'orange',
          type: 'building',
          pos: 'R',
          category: (firstAvailable.baseLocation && firstAvailable.baseLocation !== 'មើលទីកន្លែង' && firstAvailable.baseLocation !== 'មិនទាន់ដៅលើ Map') ? firstAvailable.baseLocation : '🏢 ក្រុមអគារ និង កុដិ'
        });
        setSelectedTagForPin(tagDisp || String(firstAvailable.tagNumber));
      } else {
        setModalForm({
          id: getNextDefaultLocationId(currentLocations),
          name: '',
          badgeColor: 'orange',
          type: 'building',
          pos: 'R',
          category: '🏢 ក្រុមអគារ និង កុដិ'
        });
        setSelectedTagForPin('');
      }
    }

    setFormError('');
    setIsEditModalOpen(true);
  };

  // Helper: get correct setter + saver for current tab
  const getTabDataFunctions = () => {
    if (activeTab === 'tagger') {
      return { setter: setTab3Locations, saver: saveTab3LocationsToFirebase };
    }
    return {
      setter: setLocations,
      saver: (data) => {
        const cleanData = data.filter((loc) => !loc.isTagPin && !loc.tagNumber && !loc.tagNumberDisplay);
        saveTempleLocationsToFirebase(cleanData);
      }
    };
  };

  // Ultra-Precise Pin Dragging (Synchronizes to Cloud on End)
  const handlePinDragStart = (e, loc) => {
    if (!canCustomizeTab) return; // Only Admin & Owner can drag pins on Tab 2 & Tab 3

    e.stopPropagation();
    pinMovedFlagRef.current = false;
    setDraggingPinId(loc.id);
    const dragTab = activeTab; // capture which tab we started dragging in

    // Push history snapshot before moving pin
    const currentLocs = dragTab === 'tagger' ? tab3Locations : baseMapLocations;
    pushHistorySnapshot(currentLocs);

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    let hasMoved = false;

    const onMove = (moveEvt) => {
      if (moveEvt.cancelable) {
        moveEvt.preventDefault();
      }

      const currentX = moveEvt.touches ? moveEvt.touches[0].clientX : moveEvt.clientX;
      const currentY = moveEvt.touches ? moveEvt.touches[0].clientY : moveEvt.clientY;

      if (Math.abs(currentX - clientX) > 3 || Math.abs(currentY - clientY) > 3) {
        hasMoved = true;
        pinMovedFlagRef.current = true;
      }

      if (hasMoved && mapContainerRef.current) {
        const rect = mapContainerRef.current.getBoundingClientRect();
        let newPctX = parseFloat((((currentX - rect.left) / rect.width) * 100).toFixed(2));
        let newPctY = parseFloat((((currentY - rect.top) / rect.height) * 100).toFixed(2));

        newPctX = Math.max(1.0, Math.min(99.0, newPctX));
        newPctY = Math.max(1.0, Math.min(99.0, newPctY));

        const targetSetter = dragTab === 'tagger' ? setTab3Locations : setLocations;
        targetSetter((prev) =>
          prev.map((l) => (l.id === loc.id ? { ...l, x: newPctX, y: newPctY } : l))
        );
      }
    };

    const onEnd = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      
      setDraggingPinId(null);

      if (hasMoved) {
        if (dragTab === 'tagger') {
          setTab3Locations((prev) => {
            saveTab3LocationsToFirebase(prev);
            return prev;
          });
        } else {
          setLocations((prev) => {
            saveTempleLocationsToFirebase(prev);
            // Tab 2 edits also propagate to Tab 3
            setTab3Locations((prev3) => {
              const updated3 = prev3.map((l3) => {
                const match = prev.find((p) => p.id === l3.id);
                return match ? { ...l3, x: match.x, y: match.y } : l3;
              });
              saveTab3LocationsToFirebase(updated3);
              return updated3;
            });
            return prev;
          });
        }
        setTimeout(() => {
          pinMovedFlagRef.current = false;
        }, 150);
      }
    };

    document.addEventListener('mousemove', onMove, { passive: false });
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  };

  // Open Edit Modal for a specific location
  const handleOpenEditModal = (loc) => {
    setEditingLoc(loc);

    const locIdWestern = khmerToWesternDigits(String(loc.id || '')).trim().toLowerCase();
    const tagDisp = loc.tagNumberDisplay || (loc.tagNumber ? String(loc.tagNumber) : (loc.isTagPin ? String(loc.id) : ''));

    const found =
      (loc.isTagPin || loc.tagNumber || loc.tagNumberDisplay)
        ? (groupedAllTags.find(
            (t) =>
              (loc.tagNumber && String(t.tagNumber) === String(loc.tagNumber)) ||
              (loc.tagNumberDisplay && String(t.tagNumberDisplay) === String(tagDisp)) ||
              (loc.isTagPin && (String(t.tagNumber) === String(loc.id) || String(t.tagNumberDisplay) === String(tagDisp) || khmerToWesternDigits(String(t.tagNumberDisplay || '')).toLowerCase() === locIdWestern))
          ) ||
          allTags.find(
            (t) =>
              (loc.tagNumber && String(t.tagNumber) === String(loc.tagNumber)) ||
              (loc.tagNumberDisplay && String(t.tagNumberDisplay) === String(tagDisp)) ||
              (loc.isTagPin && (String(t.tagNumber) === String(loc.id) || String(t.tagNumberDisplay) === String(tagDisp) || khmerToWesternDigits(String(t.tagNumberDisplay || '')).toLowerCase() === locIdWestern))
          ))
        : null;

    if (found) {
      const matchDisp = found.tagNumberDisplay || String(found.tagNumber);
      setSelectedTagForPin(matchDisp);
    } else {
      setSelectedTagForPin(tagDisp);
    }

    setModalForm({
      id: loc.id,
      name: loc.name,
      badgeColor: loc.badgeColor || (loc.type === 'gate' ? 'emerald' : 'emerald'),
      type: loc.type || 'building',
      pos: loc.pos || 'R',
      category: loc.category || '🏢 ក្រុមអគារ និង កុដិ',
      isTagPin: loc.isTagPin !== undefined ? loc.isTagPin : Boolean(found),
      tagNumber: loc.tagNumber || (found ? found.tagNumber : null),
      tagNumberDisplay: loc.tagNumberDisplay || (found ? (found.tagNumberDisplay || String(found.tagNumber)) : null)
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Open Add New Location Modal
  const handleOpenAddModal = () => {
    setEditingLoc({
      isNew: true,
      x: 50,
      y: 50
    });
    const firstAvailable = activeTab === 'tagger' ? getFirstAvailableTag() : null;
    if (firstAvailable) {
      const tagDisp = firstAvailable.tagNumberDisplay || String(firstAvailable.tagNumber);
      const latinId = String(firstAvailable.tagNumber || khmerToWesternDigits(tagDisp));
      setModalForm({
        id: latinId,
        tagNumber: firstAvailable.tagNumber,
        tagNumberDisplay: tagDisp,
        isTagPin: true,
        name: firstAvailable.name || firstAvailable.location || `ស្លាកលេខ #${latinId}`,
        badgeColor: 'orange',
        type: 'building',
        pos: 'R',
        category: (firstAvailable.baseLocation && firstAvailable.baseLocation !== 'មើលទីកន្លែង' && firstAvailable.baseLocation !== 'មិនទាន់ដៅលើ Map') ? firstAvailable.baseLocation : '🏢 ក្រុមអគារ និង កុដិ'
      });
      setSelectedTagForPin(tagDisp || String(firstAvailable.tagNumber));
    } else {
      setModalForm({
        id: getNextDefaultLocationId(currentLocations),
        name: '',
        badgeColor: 'orange',
        type: 'building',
        pos: 'R',
        category: '🏢 ក្រុមអគារ និង កុដិ'
      });
      setSelectedTagForPin('');
    }
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Save / Edit Location (Syncs to Firebase Cloud Database)
  const handleSaveLocationForm = () => {
    if (pinModalMode === 'group') {
      if (selectedGroupForBatchPin) {
        setIsEditModalOpen(false);
        setPinningGroupMode(selectedGroupForBatchPin);
      } else {
        setFormError('សូមជ្រើសរើស Group');
      }
      return;
    }

    const id = modalForm.id.trim();
    let name = modalForm.name.trim();

    if (!id) {
      setFormError('សូមបញ្ចូលលេខ ឬ អក្សរស្លាក');
      return;
    }

    // Auto-fill location name if user leaves it blank (never use tag owner name as location name)
    if (!name) {
      name = `ទីតាំង ${id}`;
    }

    // Check duplicate ID (use raw base locations, not computed effectiveTab3Locations)
    const rawBaseLocations = activeTab === 'tagger' ? tab3Locations : baseMapLocations;
    const duplicate = rawBaseLocations.find(
      (l) => String(l.id || '').toLowerCase() === String(id || '').toLowerCase() && (!editingLoc || editingLoc.id !== l.id)
    );
    if (duplicate) {
      setFormError(`លេខ/អក្សរ «${id}» នេះមានរួចហើយ! (${duplicate.name})`);
      return;
    }

    // Push history snapshot before saving
    const baseLocations = activeTab === 'tagger' ? tab3Locations : baseMapLocations;
    pushHistorySnapshot(baseLocations);

    const { setter, saver } = getTabDataFunctions();

    // Helper: strip computed-only properties before saving to state/Firebase
    const stripComputed = (loc) => {
      const { tagOwnerName, ...clean } = loc; // eslint-disable-line no-unused-vars
      return clean;
    };

    let updated;
    if (editingLoc && !editingLoc.isNew) {
      updated = baseLocations.map((l) =>
        l.id === editingLoc.id
          ? stripComputed({
              ...l,
              id: id,
              name: name,
              badgeColor: modalForm.badgeColor || 'orange',
              type: modalForm.badgeColor === 'gold' ? 'gate' : 'building',
              pos: modalForm.pos || 'R',
              category: modalForm.category || '🏢 ក្រុមអគារ និង កុដិ',
              isTagPin: modalForm.isTagPin !== undefined ? modalForm.isTagPin : l.isTagPin,
              tagNumber: modalForm.tagNumber !== undefined ? modalForm.tagNumber : l.tagNumber,
              tagNumberDisplay: modalForm.tagNumberDisplay !== undefined ? modalForm.tagNumberDisplay : l.tagNumberDisplay
            })
          : stripComputed(l)
      );
      if (selectedLocation?.id === editingLoc.id) {
        setSelectedLocation({
          ...selectedLocation,
          id: id,
          name: name,
          badgeColor: modalForm.badgeColor || 'orange',
          type: modalForm.badgeColor === 'gold' ? 'gate' : 'building',
          pos: modalForm.pos || 'R',
          category: modalForm.category || '🏢 ក្រុមអគារ និង កុដិ'
        });
      }
    } else {
      const newPoint = {
        id: id,
        name: name,
        x: editingLoc?.x || 50,
        y: editingLoc?.y || 50,
        badgeColor: modalForm.badgeColor || 'orange',
        type: modalForm.badgeColor === 'gold' ? 'gate' : 'building',
        pos: modalForm.pos || 'R',
        category: modalForm.category || '🏢 ក្រុមអគារ និង កុដិ',
        isTagPin: modalForm.isTagPin || false,
        tagNumber: modalForm.tagNumber || null,
        tagNumberDisplay: modalForm.tagNumberDisplay || null
      };
      updated = [...baseLocations.map(stripComputed), newPoint];
      setSelectedLocation(newPoint);

      setIsPinsVisible(true);
      if (newPoint.category) {
        setHiddenCategories((prev) => ({ ...prev, [newPoint.category]: false }));
      }
      centerPinOnMap(newPoint);
    }

    setter(updated);
    saver(updated);

    // Rule 1: Edits/Adds on Tab 2 (interactive) propagate to Tab 1 (locations) AND Tab 3 (tab3Locations)
    if (activeTab === 'interactive') {
      setTab3Locations((prev3) => {
        const merged = updated.map((loc2) => {
          const match3 = prev3.find((l3) => l3.id === loc2.id);
          return match3 ? { ...match3, ...loc2 } : loc2;
        });
        const tagPinsOnly = prev3.filter((l3) => l3.isTagPin && !updated.some((l2) => l2.id === l3.id));
        const finalTab3 = [...merged, ...tagPinsOnly];
        saveTab3LocationsToFirebase(finalTab3);
        return finalTab3;
      });
    }

    setIsEditModalOpen(false);
    setEditingLoc(null);
  };

  // Delete Location (routes to correct tab data)
  const handleDeleteLocation = (id) => {
    if (window.confirm(`តើអ្នកពិតជាចង់លុបទីតាំង #${id} នេះមែនទេ?`)) {
      const baseLocations = activeTab === 'tagger' ? tab3Locations : baseMapLocations;
      pushHistorySnapshot(baseLocations);

      const { setter, saver } = getTabDataFunctions();
      const updated = baseLocations.filter((l) => l.id !== id);
      setter(updated);
      saver(updated);
      // If Tab 2 delete, also propagate to Tab 3
      if (activeTab === 'interactive') {
        setTab3Locations(updated);
        saveTab3LocationsToFirebase(updated);
      }
      setIsEditModalOpen(false);
      if (selectedLocation?.id === id) setSelectedLocation(null);
    }
  };

  // Reset to default (routes to correct tab data)
  const handleResetLocations = () => {
    if (window.confirm('តើអ្នកពិតជាចង់កំណត់ទីតាំងឡើងវិញទៅទិន្នន័យដើមទាំង ២១ ចំណុចមែនទេ?')) {
      const baseLocations = activeTab === 'tagger' ? tab3Locations : baseMapLocations;
      pushHistorySnapshot(baseLocations);

      if (activeTab === 'tagger') {
        const reset = resetTab3Locations();
        setTab3Locations(reset);
        saveTab3LocationsToFirebase(reset);
      } else {
        const reset = resetTempleLocations();
        setLocations(reset);
        saveTempleLocationsToFirebase(reset);
        // Tab 2 reset also propagates to Tab 3
        setTab3Locations(reset);
        saveTab3LocationsToFirebase(reset);
      }
      setSelectedLocation(null);
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentLocations, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', 'temple_locations.json');
    dlAnchorElem.click();
  };

  // Import JSON (routes to correct tab data)
  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        const list = Array.isArray(parsed) ? parsed : parsed.locations || [];
        if (list.length > 0) {
          const { setter, saver } = getTabDataFunctions();
          setter(list);
          saver(list);
          if (activeTab === 'interactive') {
            setTab3Locations(list);
            saveTab3LocationsToFirebase(list);
          }
          alert(`បាននាំចូលទិន្នន័យទីតាំងចំនួន ${list.length} ចំណុចដោយជោគជ័យ!`);
        }
      } catch (err) {
        alert('File មិនត្រឹមត្រូវ! សូមពិនិត្យមើលជា JSON file ឡើងវិញ។');
      }
    };
    reader.readAsText(file);
  };

  // Process batch tag numbers input (protects existing groups from being overwritten)
  const processBatchTagInput = (inputVal, targetGroupName) => {
    const cleanedStr = khmerToWesternDigits(inputVal);
    const numbers = cleanedStr.split(/[\s,،;]+/).map((s) => s.trim()).filter(Boolean);
    if (numbers.length === 0) return { matchedIds: [], warnings: [] };

    const baseLocations = tab3Locations.length > 0 ? tab3Locations : locations;
    let updatedLocations = [...baseLocations];
    let hasChanges = false;
    const matchedIds = [];
    const warnings = [];

    numbers.forEach((numStr) => {
      const numClean = khmerToWesternDigits(numStr);
      const khmerNum = westernToKhmerDigits(numClean);

      // 1. Check if location pin already exists
      const existingLoc = updatedLocations.find(
        (loc) =>
          String(loc.tagNumber) === numClean ||
          khmerToWesternDigits(String(loc.tagNumber || '')) === numClean ||
          String(loc.tagNumberDisplay) === khmerNum ||
          String(loc.tagNumberDisplay) === numClean ||
          khmerToWesternDigits(String(loc.tagNumberDisplay || '')) === numClean ||
          String(loc.id) === numClean ||
          String(loc.id) === khmerNum ||
          khmerToWesternDigits(String(loc.id || '')) === numClean
      );

      if (existingLoc) {
        const existingCat = existingLoc.category || '';
        // If it ALREADY belongs to ANOTHER Group, DO NOT OVERWRITE/MOVE IT!
        if (existingCat && targetGroupName && existingCat !== targetGroupName) {
          const matchedTag = allTags.find(
            (t) =>
              String(t.tagNumber) === numClean ||
              khmerToWesternDigits(String(t.tagNumber || '')) === numClean ||
              String(t.tagNumberDisplay) === khmerNum ||
              khmerToWesternDigits(String(t.tagNumberDisplay || '')) === numClean ||
              String(t.id) === numClean ||
              khmerToWesternDigits(String(t.id || '')) === numClean
          );
          const ownerDisp = existingLoc.tagOwnerName || (matchedTag ? matchedTag.name : '') || existingLoc.name;
          const tagNumDisp = existingLoc.tagNumberDisplay || khmerNum;
          warnings.push({
            id: existingLoc.id,
            tagNumDisp,
            ownerDisp,
            existingGroup: existingCat
          });
        } else {
          // Free or already in this target group -> assign to target group
          matchedIds.push(existingLoc.id);
          if (targetGroupName && existingCat !== targetGroupName) {
            updatedLocations = updatedLocations.map((l) =>
              l.id === existingLoc.id ? { ...l, category: targetGroupName } : l
            );
            hasChanges = true;
          }
        }
      } else {
        // 2. Pin does not exist yet! Search allTags for donor information
        const matchedTag = allTags.find(
          (t) =>
            String(t.tagNumber) === numClean ||
            khmerToWesternDigits(String(t.tagNumber || '')) === numClean ||
            String(t.tagNumberDisplay) === khmerNum ||
            khmerToWesternDigits(String(t.tagNumberDisplay || '')) === numClean ||
            String(t.id) === numClean ||
            khmerToWesternDigits(String(t.id || '')) === numClean
        );

        const newLocId = khmerNum;
        matchedIds.push(newLocId);

        const ownerName = matchedTag ? matchedTag.name : '';
        const baseLocName = (matchedTag && matchedTag.baseLocation && matchedTag.baseLocation !== 'មិនទាន់ដៅលើ Map' && matchedTag.baseLocation !== 'មើលទីកន្លែង')
          ? matchedTag.baseLocation
          : (targetGroupName || `ស្លាកលេខ ${newLocId}`);

        const newUnpinnedLoc = {
          id: newLocId,
          name: baseLocName,
          x: 50,
          y: 50,
          type: 'building',
          pos: 'R',
          badgeColor: 'cyan',
          category: targetGroupName || '',
          tagNumber: parseInt(numClean, 10) || numClean,
          tagNumberDisplay: newLocId,
          tagOwnerName: ownerName,
          isTagPin: true,
          isUnpinned: true
        };

        updatedLocations.push(newUnpinnedLoc);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setTab3Locations(updatedLocations);
      saveTab3LocationsToFirebase(updatedLocations);
      saveTab3Locations(updatedLocations);
      setLocations(updatedLocations);
      saveTempleLocations(updatedLocations);
    }

    return { matchedIds, warnings, updatedLocations, hasChanges };
  };

  // Save Custom Category (routes to correct tab data)
  const handleSaveCustomCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;

    // Process batch tag numbers input to make sure all entered tag numbers exist in updatedLocations with category set
    const { matchedIds, updatedLocations } = processBatchTagInput(tagNumbersBatchInput, name);

    const allGroupIds = Array.from(new Set([...selectedLocationIdsForGroup, ...(matchedIds || [])]));

    if (allGroupIds.length === 0) {
      alert('សូមជ្រើសរើសយ៉ាងហោចណាស់ ១ ទីតាំង ឬបញ្ចូលលេខស្លាក!');
      return;
    }

    // Remove category from deletedCategories if it was deleted previously
    if (deletedCategories.includes(name)) {
      saveDeletedCategories(deletedCategories.filter((c) => c !== name));
    }

    const { setter, saver } = getTabDataFunctions();
    const currentBase = activeTab === 'tagger' ? tab3Locations : baseMapLocations;
    const baseLocations = (updatedLocations && updatedLocations.length >= currentBase.length)
      ? updatedLocations
      : currentBase;

    const stripComputed2 = ({ tagOwnerName, tagNumber, ...clean }) => clean; // eslint-disable-line no-unused-vars
    const updated = baseLocations.map((loc) => {
      if (allGroupIds.includes(loc.id)) {
        return { ...stripComputed2(loc), category: name };
      }
      return stripComputed2(loc);
    });

    setter(updated);
    saver(updated);
    if (activeTab === 'interactive') {
      setTab3Locations(updated);
      saveTab3LocationsToFirebase(updated);
    }
    setIsCategoryModalOpen(false);
    setSelectedGroupForBatchPin(name);
    setPinningGroupMode(name);
    setIsEditModalOpen(false);
    setNewCategoryName('');
    setSelectedLocationIdsForGroup([]);
    setTagNumbersBatchInput('');
    setBatchTagWarnings([]);
  };

  // Group Batch Actions (Batch change direction / color / rename / delete)
  const handleOpenGroupEditModal = (catName) => {
    setEditingGroupName(catName);
    setRenameGroupInput(catName);
    setTagNumbersBatchInput('');
    setBatchTagWarnings([]);
    setIsGroupEditModalOpen(true);
  };

  const handleApplyGroupPos = (newPos) => {
    if (!editingGroupName) return;
    const { setter, saver } = getTabDataFunctions();
    const baseLocations = activeTab === 'tagger' ? tab3Locations : locations;

    const updated = baseLocations.map((loc) => {
      const catMatches = (loc.category || (loc.type === 'gate' ? '⛩️ ក្រុមខ្លោងទ្វារវត្ត' : '🏢 ក្រុមអគារ និង កុដិ')) === editingGroupName;
      if (catMatches) {
        return { ...loc, pos: newPos };
      }
      return loc;
    });

    setter(updated);
    saver(updated);
  };

  const handleApplyGroupColor = (newColor) => {
    if (!editingGroupName) return;
    const { setter, saver } = getTabDataFunctions();
    const baseLocations = activeTab === 'tagger' ? tab3Locations : locations;

    const updated = baseLocations.map((loc) => {
      const catMatches = (loc.category || (loc.type === 'gate' ? '⛩️ ក្រុមខ្លោងទ្វារវត្ត' : '🏢 ក្រុមអគារ និង កុដិ')) === editingGroupName;
      if (catMatches) {
        return { ...loc, badgeColor: newColor };
      }
      return loc;
    });

    setter(updated);
    saver(updated);
  };

  const handleRenameGroupSubmit = () => {
    const trimmedNew = renameGroupInput.trim();
    if (!trimmedNew || trimmedNew === editingGroupName) return;

    if (deletedCategories.includes(trimmedNew)) {
      saveDeletedCategories(deletedCategories.filter((c) => c !== trimmedNew));
    }

    const { setter, saver } = getTabDataFunctions();
    const baseLocations = activeTab === 'tagger' ? tab3Locations : locations;

    const updated = baseLocations.map((loc) => {
      const catMatches = (loc.category || (loc.type === 'gate' ? '⛩️ ក្រុមខ្លោងទ្វារវត្ត' : '🏢 ក្រុមអគារ និង កុដិ')) === editingGroupName;
      if (catMatches) {
        return { ...loc, category: trimmedNew };
      }
      return loc;
    });

    setter(updated);
    saver(updated);
    setEditingGroupName(trimmedNew);
  };

  const handleDeleteGroup = () => {
    if (!editingGroupName) return;

    const isConfirmed = window.confirm(
      `តើអ្នកពិតជាចង់លុប Group «${editingGroupName}» នេះមែនទេ?\n\n` +
      `• Group នេះនឹងត្រូវលុបបាត់ពីប្រព័ន្ធ\n` +
      `• ទីតាំងទាំងអស់ក្នុង Group នេះនឹងត្រូវរក្សាទុកដដែល (មិនត្រូវលុបចោលឡើយ)`
    );

    if (!isConfirmed) return;

    const baseLocations = activeTab === 'tagger' ? tab3Locations : baseMapLocations;
    pushHistorySnapshot(baseLocations);

    // Save editingGroupName into deletedCategories so it disappears permanently
    const nextDeleted = Array.from(new Set([...deletedCategories, editingGroupName]));
    saveDeletedCategories(nextDeleted);

    const { setter, saver } = getTabDataFunctions();

    // Reset category for all locations in this group to unassigned ('')
    const updated = baseLocations.map((loc) => {
      const currentCat = loc.category || (loc.type === 'gate' ? '⛩️ ក្រុមខ្លោងទ្វារវត្ត' : '🏢 ក្រុមអគារ និង កុដិ');
      if (currentCat === editingGroupName || loc.category === editingGroupName) {
        return { ...loc, category: '' };
      }
      return loc;
    });

    setter(updated);
    saver(updated);

    if (activeTab === 'interactive') {
      setTab3Locations((prev3) => {
        const final3 = prev3.map((loc) => {
          const currentCat = loc.category || (loc.type === 'gate' ? '⛩️ ក្រុមខ្លោងទ្វារវត្ត' : '🏢 ក្រុមអគារ និង កុដិ');
          if (currentCat === editingGroupName || loc.category === editingGroupName) {
            return { ...loc, category: '' };
          }
          return loc;
        });
        saveTab3LocationsToFirebase(final3);
        return final3;
      });
    }

    setUndoToast(`🗑️ បានលុប Group «${editingGroupName}» រួចរាល់ (ទីតាំងទាំងអស់ត្រូវបានរក្សាទុក)`);
    setTimeout(() => setUndoToast(''), 3000);
    setIsGroupEditModalOpen(false);
  };

  // Filtered locations for legend list
  const filteredLegendLocations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return currentLocations.filter((loc) => {
      const matchesSearch =
        !q ||
        String(loc.name || '').toLowerCase().includes(q) ||
        String(loc.id || '').toLowerCase().includes(q) ||
        String(loc.category || '').toLowerCase().includes(q);
      const locCat = (loc.category && !deletedCategories.includes(loc.category)) ? loc.category : '';
      const matchesCat =
        selectedCategory === 'all' || locCat === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [currentLocations, searchQuery, selectedCategory]);

  const mainContainer = (
    <div
      className={`w-full max-w-7xl mx-auto bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-kantumruy ${
        modalMode ? 'max-h-[96vh] sm:max-h-[92vh] h-full' : 'min-h-[75vh] my-2'
      }`}
      onClick={(e) => e.stopPropagation()}
      style={{
        boxShadow: '0 0 80px rgba(245,158,11,0.12), 0 25px 50px -12px rgba(0,0,0,0.8)'
      }}
    >
        {/* ═══════════════ MODAL HEADER ═══════════════ */}
        <div className="px-4 sm:px-5 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl badge-gold flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20 shrink-0">
              <MapIcon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm sm:text-base md:text-lg font-bold font-moul text-amber-400 truncate">
                  ផែនទីវត្ត និង ទីតាំង
                </h2>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] sm:text-xs font-bold px-2 py-0.2 rounded-full border border-amber-500/30 shrink-0">
                  {westernToKhmerDigits(currentLocations.length)} ទីតាំង
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate hidden sm:block">
                ប្លង់វត្តអន្តរកម្ម ទិសទាំង ៨ និងការគ្រប់គ្រងទីតាំងស្លាកលេខ
              </p>
            </div>
          </div>

          {/* Quick Header Actions (Close / Back Button) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-amber-500/20"
                title="ថយក្រោយទៅផ្ទាំងដើម"
              >
                <ArrowLeft className="w-4 h-4 stroke-[3]" />
                <span className="whitespace-nowrap font-bold">ថយក្រោយ</span>
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-all ml-0.5"
                title="បិទផែនទី"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>

        {/* ═══════════════ TAB CONTROLS & SUB-NAV ═══════════════ */}
        <div className="px-2 sm:px-5 py-1.5 sm:py-2 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 shrink-0">
          {/* Tab buttons & Toggle buttons (Scrollable on small mobile screens) */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 sm:p-1 rounded-2xl border border-slate-800 w-full sm:w-auto overflow-x-auto no-scrollbar justify-start">
            <button
              onClick={() => setActiveTab('labeled')}
              className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 sm:gap-2 transition-all whitespace-nowrap ${
                activeTab === 'labeled'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="sm:hidden">🖼️ ផ្ទាំងទី១</span>
              <span className="hidden sm:inline">🖼️ ផ្ទាំងទី១ ៖ ប្លង់មានឈ្មោះ</span>
            </button>

            <button
              onClick={() => setActiveTab('interactive')}
              className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 sm:gap-2 transition-all whitespace-nowrap ${
                activeTab === 'interactive'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="sm:hidden">📍 ផ្ទាំងទី២</span>
              <span className="hidden sm:inline">📍 ផ្ទាំងទី២ ៖ កែសម្រួលទីតាំង & បន្ថែមឈ្មោះ</span>
            </button>

            <button
              onClick={() => setActiveTab('tagger')}
              className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 sm:gap-2 transition-all whitespace-nowrap ${
                activeTab === 'tagger'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="sm:hidden">🏷️ ផ្ទាំងទី៣</span>
              <span className="hidden sm:inline">🏷️ ផ្ទាំងទី៣ ៖ ដៅស្លាកលេខលើ Map</span>
            </button>

            <div className="h-4 w-px bg-slate-800 mx-0.5 shrink-0"></div>

            {/* Toggle Compass Button */}
            <button
              onClick={() => setIsCompassVisible(!isCompassVisible)}
              className={`p-1.5 sm:p-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center transition-all ${
                isCompassVisible
                  ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
              title={isCompassVisible ? 'លាក់ត្រីវិស័យ' : 'បង្ហាញត្រីវិស័យ'}
            >
              <Compass className="w-4 h-4 text-amber-400 shrink-0" />
            </button>

            {/* Toggle Pins Button */}
            <button
              onClick={() => setIsPinsVisible(!isPinsVisible)}
              className={`p-1.5 sm:p-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center transition-all ${
                isPinsVisible
                  ? 'bg-sky-500/20 border border-sky-500/50 text-sky-300'
                  : 'bg-rose-500/20 border border-rose-500/50 text-rose-400'
              }`}
              title={isPinsVisible ? 'លាក់ Pin' : 'បង្ហាញ Pin'}
            >
              {isPinsVisible ? (
                <Eye className="w-4 h-4 text-sky-400 shrink-0" />
              ) : (
                <EyeOff className="w-4 h-4 text-rose-400 shrink-0" />
              )}
            </button>

            <div className="h-4 w-px bg-slate-800 mx-0.5 shrink-0"></div>

            {/* Undo Button (Ctrl+Z) */}
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                history.length > 0
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 cursor-pointer'
                  : 'bg-slate-900/60 border border-slate-800/80 text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title="ថយក្រោយ (Ctrl+Z)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ctrl+Z</span>
            </button>

            {/* Redo Button (Ctrl+U) */}
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                redoStack.length > 0
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 cursor-pointer'
                  : 'bg-slate-900/60 border border-slate-800/80 text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title="ទៅមុខ (Ctrl+U)"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ctrl+U</span>
            </button>
          </div>

          {/* Eye & Compass & Customizable Group Size Controls */}
          <div className="flex flex-wrap items-center justify-end w-full sm:w-auto gap-2 text-xs">
            {/* Custom Group Selector & Pin Size Control (ONLY VISIBLE ON TAB 3) */}
            {activeTab === 'tagger' && (
              <div className="flex flex-wrap items-center gap-2 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800 shadow-sm">
                {/* Group Dropdown */}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-amber-400 font-bold whitespace-nowrap">
                    📁 ក្រុម ៖
                  </span>
                  <select
                    value={selectedSizeGroup}
                    onChange={(e) => setSelectedSizeGroup(e.target.value)}
                    className="bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-0.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400 font-kantumruy max-w-[140px] sm:max-w-[180px] truncate cursor-pointer"
                  >
                    <option value="all">🌐 All</option>
                    {Object.keys(categoryGroups).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat} ({categoryGroups[cat].length})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

                {/* Pin Circle Size Control */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-amber-400 font-bold whitespace-nowrap">
                    📏 ទំហំ ៖{' '}
                    <span className="font-sans-en font-black text-amber-300">
                      {selectedSizeGroup === 'all'
                        ? `${pinSizePx}px`
                        : `${groupPinSizes[selectedSizeGroup] || pinSizePx}px`}
                    </span>
                  </span>

                  <input
                    type="range"
                    min="8"
                    max="30"
                    step="1"
                    value={
                      selectedSizeGroup === 'all'
                        ? pinSizePx
                        : groupPinSizes[selectedSizeGroup] || pinSizePx
                    }
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (selectedSizeGroup === 'all') {
                        setPinSizePx(val);
                      } else {
                        setGroupPinSizes((prev) => ({ ...prev, [selectedSizeGroup]: val }));
                      }
                    }}
                    className="w-14 sm:w-20 accent-amber-400 cursor-pointer h-1.5 bg-slate-950 rounded-lg"
                    title="កែប្រែទំហំ Pin"
                  />
                </div>
              </div>
            )}

          </div>
        </div>



        {/* ════════ UNDO / REDO TOAST NOTIFICATION ════════ */}
        {undoToast && (
          <div className="px-4 py-2 bg-amber-500/20 border-b border-amber-500/40 flex items-center justify-center text-amber-300 text-xs font-extrabold animate-bounce shrink-0 shadow-lg">
            <span>{undoToast}</span>
          </div>
        )}

        {/* ════════ PENDING PIN TAG NOTIFICATION ════════ */}
        {pendingPinTag && (
          <div className="px-4 py-2 bg-emerald-500/20 border-b border-emerald-500/40 flex items-center justify-between gap-2 text-emerald-300 text-xs font-bold animate-pulse shrink-0">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                🎯 របៀបដៅស្លាកលេខ ៖ សូមចុចលើទីតាំងណាមួយលើរូបភាព Map ដើម្បីដៅស្លាកលេខ #{westernToKhmerDigits(pendingPinTag.tagNumber)} ({pendingPinTag.name || 'គ្មានឈ្មោះ'})
              </span>
            </div>
            <button
              onClick={() => setPendingPinTag(null)}
              className="px-2.5 py-0.5 bg-slate-900 text-slate-300 hover:text-white rounded-lg border border-slate-700 text-xs shrink-0"
            >
              បោះបង់
            </button>
          </div>
        )}

        {/* ═══════════════ MAIN CONTENT BODY (MAP & LEGEND) ═══════════════ */}
        <div ref={modalBodyRef} className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3">
          
          {/* MAP CANVAS CONTAINER */}
          <div className="relative rounded-2xl border-2 border-slate-700 bg-white overflow-hidden shadow-inner">
            
            {/* Viewport Box */}
            <div
              ref={viewportRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={pinningGroupMode ? handleViewportClickForGroupPin : undefined}
              className={`relative w-full overflow-auto select-none bg-white ${
                pinningGroupMode ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{
                maxHeight: 'min(48vh, 550px)',
                height: zoomScale > 1.0 ? 'min(48vh, 550px)' : 'auto',
                touchAction: zoomScale > 1.0 ? 'none' : 'pan-y'
              }}
            >
              {/* Top Indicator Banner when Pinning Group Mode is Active */}
              {pinningGroupMode && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm px-4 py-2 rounded-2xl shadow-2xl border-2 border-slate-900 flex items-center gap-2.5 animate-bounce font-kantumruy">
                  <MapPin className="w-5 h-5 text-slate-950 shrink-0" />
                  <span>📍 ចុចលើ Map ដែលចង់ដៅ Group «{pinningGroupMode}»</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleGroupPinPlacement(50, 50); }}
                    className="ml-1 px-2.5 py-1 bg-slate-950 text-amber-300 rounded-xl text-xs hover:bg-slate-800 font-kantumruy font-bold whitespace-nowrap"
                  >
                    📌 ដៅ Center
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setPinningGroupMode(null); }}
                    className="px-2 py-1 bg-red-900 text-red-200 rounded-xl text-xs hover:bg-red-800 font-sans-en font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Scalable Map Box */}
              <div
                ref={mapContainerRef}
                onClick={handleMapClick}
                className="relative w-full mx-auto origin-top-left"
                style={{
                  width: `${zoomScale * 100}%`,
                  minWidth: '100%'
                }}
              >
                {/* Crisp Clean Base Temple Map Image */}
                <img
                  src="/temple_map/map_new_latest.jpg"
                  alt="Temple Map"
                  className="w-full h-auto block pointer-events-none"
                />

                {/* ════════ PURE TRANSPARENT PNG KHMER COMPASS ROSE ════════ */}
                <div className="absolute inset-0 pointer-events-none z-10">
                  {isCompassVisible && (
                    <div className="absolute top-3 right-3 pointer-events-auto z-30 transition-all hover:scale-[1.02]">
                      <div className="flex flex-col items-center select-none bg-transparent font-kantumruy">
                        {/* Compact Expand/Collapse Button */}
                        <button
                          onClick={() => setIsCompassExpanded(!isCompassExpanded)}
                          className="self-end mb-1 text-[10px] sm:text-xs bg-slate-900/80 hover:bg-slate-800 text-amber-300 font-bold px-2 py-0.5 rounded-full transition-all border border-amber-500/50 shadow-md backdrop-blur-sm"
                        >
                          {isCompassExpanded ? '➖ បង្រួម' : '🔍 ពង្រីកត្រីវិស័យ'}
                        </button>

                        {/* Pure 100% Transparent PNG Compass Canvas */}
                        <div className={`relative flex items-center justify-center transition-all bg-transparent ${
                          isCompassExpanded ? 'w-48 h-48 sm:w-80 sm:h-80' : 'w-28 h-28 sm:w-52 sm:h-52'
                        }`}>
                          <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-2xl select-none">
                            {/* ════════ 8 COLOR STAR POINTS ════════ */}
                            {/* North Point (Black / Dark Slate - 0°) */}
                            <polygon points="200,200 180,145 200,60" fill="#0f172a" />
                            <polygon points="200,200 220,145 200,60" fill="#334155" />

                            {/* NE Point (Orange - 45°) */}
                            <polygon points="200,200 230,150 299,101" fill="#c2410c" />
                            <polygon points="200,200 250,170 299,101" fill="#f97316" />

                            {/* East Point (Green - 90°) */}
                            <polygon points="200,200 255,180 332,200" fill="#15803d" />
                            <polygon points="200,200 255,220 332,200" fill="#22c55e" />

                            {/* SE Point (Lime Green - 135°) */}
                            <polygon points="200,200 250,230 299,299" fill="#4d7c0f" />
                            <polygon points="200,200 230,250 299,299" fill="#84cc16" />

                            {/* South Point (Yellow - 180°) */}
                            <polygon points="200,200 180,255 200,340" fill="#ca8a04" />
                            <polygon points="200,200 220,255 200,340" fill="#eab308" />

                            {/* SW Point (Cyan - 225°) */}
                            <polygon points="200,200 170,250 101,299" fill="#0e7490" />
                            <polygon points="200,200 150,230 101,299" fill="#06b6d4" />

                            {/* West Point (Red - 270°) */}
                            <polygon points="200,200 145,180 68,200" fill="#b91c1c" />
                            <polygon points="200,200 145,220 68,200" fill="#ef4444" />

                            {/* NW Point (Pink - 315°) */}
                            <polygon points="200,200 150,170 101,101" fill="#be185d" />
                            <polygon points="200,200 170,150 101,101" fill="#ec4899" />

                            {/* Center Golden Ring */}
                            <circle cx="200" cy="200" r="22" fill="#fef08a" stroke="#ca8a04" strokeWidth="4" />
                            <circle cx="200" cy="200" r="8" fill="#0f172a" />

                            {/* ════════ 8 DIRECTION TEXT BADGES TOUCHING STAR TIPS ════════ */}
                            {/* 1. North Badges (Top) */}
                            <g transform="translate(200, 32)">
                              <rect x="-34" y="-22" width="68" height="44" rx="8" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.3))" />
                              <text x="0" y="-5" textAnchor="middle" dominantBaseline="middle" fontFamily="Moul, Kantumruy, sans-serif" fontWeight="bold" fontSize="12" fill="#0f172a">ឧត្តរ</text>
                              <text x="0" y="13" textAnchor="middle" dominantBaseline="middle" fontFamily="Moul, Kantumruy, sans-serif" fontWeight="bold" fontSize="12" fill="#0f172a">ជើង</text>
                            </g>

                            {/* 2. NE Badge (Top-Right) */}
                            <g transform="translate(325, 75)">
                              <rect x="-30" y="-14" width="60" height="28" rx="8" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.3))" />
                              <text x="0" y="2" textAnchor="middle" dominantBaseline="middle" fontFamily="Moul, Kantumruy, sans-serif" fontWeight="bold" fontSize="12" fill="#0f172a">ឦសាន</text>
                            </g>

                            {/* 3. East Badges (Right) */}
                            <g transform="translate(366, 200)">
                              <rect x="-32" y="-22" width="64" height="44" rx="8" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.3))" />
                              <text x="0" y="-5" textAnchor="middle" dominantBaseline="middle" fontFamily="Moul, Kantumruy, sans-serif" fontWeight="bold" fontSize="12" fill="#0f172a">បូព៌</text>
                              <text x="0" y="13" textAnchor="middle" dominantBaseline="middle" fontFamily="Moul, Kantumruy, sans-serif" fontWeight="bold" fontSize="12" fill="#0f172a">កើត</text>
                            </g>

                            {/* 4. SE Badge (Bottom-Right) */}
                            <g transform="translate(325, 325)">
                              <rect x="-34" y="-14" width="68" height="28" rx="8" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.3))" />
                              <text x="0" y="2" textAnchor="middle" dominantBaseline="middle" fontFamily="Moul, Kantumruy, sans-serif" fontWeight="bold" fontSize="12" fill="#0f172a">អាគ្នេយ៍</text>
                            </g>

                            {/* 5. South Badges (Bottom) */}
                            <g transform="translate(200, 368)">
                              <rect x="-34" y="-22" width="68" height="44" rx="8" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.3))" />
                              <text x="0" y="-5" textAnchor="middle" dominantBaseline="middle" fontFamily="Moul, Kantumruy, sans-serif" fontWeight="bold" fontSize="12" fill="#0f172a">ត្បូង</text>
                              <text x="0" y="13" textAnchor="middle" dominantBaseline="middle" fontFamily="Moul, Kantumruy, sans-serif" fontWeight="bold" fontSize="12" fill="#0f172a">ទក្សិណ</text>
                            </g>

                            {/* 6. SW Badge (Bottom-Left) */}
                            <g transform="translate(75, 325)">
                              <rect x="-30" y="-14" width="60" height="28" rx="8" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.3))" />
                              <text x="0" y="2" textAnchor="middle" dominantBaseline="middle" fontFamily="Moul, Kantumruy, sans-serif" fontWeight="bold" fontSize="12" fill="#0f172a">និរតី</text>
                            </g>

                            {/* 7. West Badges (Left) */}
                            <g transform="translate(34, 200)">
                              <rect x="-32" y="-22" width="64" height="44" rx="8" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.3))" />
                              <text x="0" y="-5" textAnchor="middle" dominantBaseline="middle" fontFamily="Moul, Kantumruy, sans-serif" fontWeight="bold" fontSize="12" fill="#0f172a">លិច</text>
                              <text x="0" y="13" textAnchor="middle" dominantBaseline="middle" fontFamily="Moul, Kantumruy, sans-serif" fontWeight="bold" fontSize="12" fill="#0f172a">បស្ចឹម</text>
                            </g>

                            {/* 8. NW Badge (Top-Left) */}
                            <g transform="translate(75, 75)">
                              <rect x="-32" y="-14" width="64" height="28" rx="8" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.3))" />
                              <text x="0" y="2" textAnchor="middle" dominantBaseline="middle" fontFamily="Moul, Kantumruy, sans-serif" fontWeight="bold" fontSize="12" fill="#0f172a">ពាយ័ព្យ</text>
                            </g>
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ════════ MAP PIN MARKERS & MATHEMATICALLY LOCKED BADGES ════════ */}
                {isPinsVisible && (
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    {currentLocations.map((loc, locIdx) => {
                      const locCat = loc.category || (loc.type === 'gate' ? '⛩️ ក្រុមក្លោងទ្វារវត្ត' : '🏢 ក្រុមអគារ និង កុដិ');
                      if (hiddenCategories[locCat]) return null;

                      const currentPinSize = groupPinSizes[locCat] || pinSizePx;
                      const isCategoryLocked = lockedCategories[locCat];
                      const isHighlighted =
                        selectedLocation?.id === loc.id ||
                        hoveredLocation?.id === loc.id ||
                        (highlightLocationName &&
                          String(loc.name || '').toLowerCase().includes(String(highlightLocationName).toLowerCase()));

                      const isGate = loc.type === 'gate';
                      const isCurrentlyDragging = draggingPinId === loc.id;
                      const canDragThisPin = activeTab !== 'labeled' && !isCategoryLocked;
                      
                      const pos = loc.pos || (loc.x > 75 ? 'L' : 'R');

                      return (
                        <div
                          key={loc.id}
                          style={{
                            position: 'absolute',
                            left: `${loc.x}%`,
                            top: `${loc.y}%`
                          }}
                          className="pointer-events-auto"
                        >
                          {/* Central Anchor Wrapper */}
                          <div
                            data-draggable={canDragThisPin ? 'true' : 'false'}
                            onMouseDown={(e) => canDragThisPin && handlePinDragStart(e, loc)}
                            onTouchStart={(e) => canDragThisPin && handlePinDragStart(e, loc)}
                            onClick={(e) => {
                              if (pinMovedFlagRef.current) return;
                              if (pinningGroupMode) {
                                handleMapClick(e);
                                return;
                              }
                              e.stopPropagation();
                              setSelectedLocation(loc);
                            }}
                            onMouseEnter={() => setHoveredLocation(loc)}
                            onMouseLeave={() => setHoveredLocation(null)}
                            className={`map-pin-element relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-transform duration-100 ${
                              canDragThisPin ? 'cursor-grab active:cursor-grabbing hover:scale-125' : 'cursor-pointer hover:scale-115'
                            } ${isHighlighted || isCurrentlyDragging ? 'scale-130 z-50' : 'z-20'}`}
                            style={{ touchAction: canDragThisPin ? 'none' : 'auto' }}
                          >
                            {/* Animated Pulse Beacon Aura Ring for Highlighted/Selected Target Location */}
                            {isHighlighted && (
                              <div className="absolute -inset-3 rounded-full bg-amber-400/50 animate-ping pointer-events-none z-0"></div>
                            )}

                            {/* Pure Vector SVG Pin Badge - 100% Mathematically Centered on PC, iPhone & Android */}
                            {(() => {
                              const badgeText = getPinBadgeText(loc, activeTab);
                              const svgFontSize = badgeText.length > 3 ? 8 : badgeText.length > 2 ? 9.5 : badgeText.length > 1 ? 11.5 : 15.5;

                              return (
                                <div
                                  style={{
                                    width: `${currentPinSize}px`,
                                    height: `${currentPinSize}px`
                                  }}
                                  className={`rounded-full flex items-center justify-center border border-white/90 shrink-0 z-10 overflow-hidden select-none shadow-md ${getPinBadgeColorClass(
                                    loc,
                                    locIdx,
                                    activeTab
                                  )} ${
                                    isHighlighted
                                      ? 'ring-4 ring-amber-400 ring-offset-2 animate-bounce scale-125 z-50 shadow-2xl'
                                      : ''
                                  }`}
                                >
                                  <svg viewBox="0 0 32 32" className="w-full h-full overflow-hidden block">
                                    <text
                                      x="16"
                                      y="16.2"
                                      textAnchor="middle"
                                      dominantBaseline="central"
                                      fontSize={svgFontSize}
                                      fontWeight="700"
                                      fill="currentColor"
                                      style={{
                                        fontFamily: '"Kantumruy Pro", "Battambang", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                                      }}
                                    >
                                      {badgeText}
                                    </text>
                                  </svg>
                                </div>
                              );
                            })()}

                            {/* Floating Name Label: PERMANENTLY RENDERED IN TAB 1 */}
                            {activeTab === 'labeled' && (
                              <div
                                className={`absolute text-[7.5px] sm:text-[9px] md:text-[10.5px] font-bold py-0.5 px-1.5 rounded-lg border shadow-lg whitespace-nowrap pointer-events-none z-0 ${
                                  isGate
                                    ? 'bg-slate-950/92 border-amber-400/90 text-amber-200'
                                    : 'bg-slate-950/92 border-sky-400/90 text-sky-100'
                                } ${isHighlighted ? 'ring-1.5 ring-amber-400 bg-slate-950 z-50' : ''} ${
                                  pos === 'L'
                                    ? 'right-full mr-1 top-1/2 -translate-y-1/2'
                                    : pos === 'T'
                                    ? 'bottom-full mb-1 left-1/2 -translate-x-1/2'
                                    : pos === 'B'
                                    ? 'top-full mt-1 left-1/2 -translate-x-1/2'
                                    : 'left-full ml-1 top-1/2 -translate-y-1/2'
                                }`}
                                style={{
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.6)'
                                }}
                              >
                                <span>{loc.name}</span>
                              </div>
                            )}

                            {/* Floating Tooltip: In Tab 2 and Tab 3 on Hover/Focus */}
                            {activeTab !== 'labeled' && (
                              <div
                                className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-slate-950/95 text-white font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded-lg border shadow-2xl pointer-events-none whitespace-nowrap transition-all duration-150 z-50 ${
                                  isGate ? 'border-amber-400 text-amber-200' : 'border-sky-400 text-sky-100'
                                } ${
                                  isHighlighted || hoveredLocation?.id === loc.id
                                    ? 'opacity-100 scale-100'
                                    : 'opacity-0 scale-90 pointer-events-none'
                                }`}
                              >
                                <span>{getDisplayPinName(loc, allTags, activeTab)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Location Banner Popover */}
            {selectedLocation && (
              <div className="absolute top-3 left-3 max-w-[280px] sm:max-w-sm bg-slate-950/95 border border-amber-500/60 rounded-2xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-md z-40 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-moul font-bold text-[10px] sm:text-[11px] shadow-md shrink-0 ${getPinBadgeColorClass(
                        selectedLocation,
                        0,
                        activeTab
                      )}`}
                    >
                      {getPinBadgeText(selectedLocation, activeTab)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-amber-400 font-bold font-moul truncate">
                        {getDisplayPinName(selectedLocation, allTags, activeTab)}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {selectedLocation.category || '🏢 ក្រុមអគារ និង កុដិ'}
                      </div>
                      {(() => {
                        const mTag = allTags.find(
                          (t) =>
                            String(t.tagNumber) === String(selectedLocation.tagNumber || selectedLocation.id) ||
                            String(t.tagNumberDisplay) === String(selectedLocation.tagNumberDisplay || selectedLocation.id)
                        );
                        const noteText = selectedLocation.notes || (mTag ? mTag.notes : '');
                        if (!noteText) return null;
                        return (
                          <div className="text-[10px] text-amber-300/80 truncate">
                            📝 {noteText}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedLocation(null)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="text-[10px] sm:text-[11px] text-slate-300">
                    ស្លាកលេខ ៖{' '}
                    <span className="text-amber-400 font-bold font-sans-en">
                      {westernToKhmerDigits(tagCountsByLocation[selectedLocation.id] || 0)} នាក់
                    </span>
                  </div>

                  <div className="flex items-center gap-1 ml-auto">
                    {/* Edit button directly in popover */}
                    {canCustomizeTab && (
                      <button
                        onClick={() => handleOpenEditModal(selectedLocation)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-400/50 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all flex items-center gap-1"
                        title="កែប្រែឈ្មោះ ឬព័ត៌មានទីតាំងនេះ"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>កែ</span>
                      </button>
                    )}

                    {onFilterByLocation && (
                      <button
                        onClick={() => {
                          onFilterByLocation(selectedLocation.name);
                          onClose();
                        }}
                        className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm"
                      >
                        <Search className="w-3 h-3" />
                        <span>មើលស្លាក</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ════════ LOCATION LIST / LEGEND ACCORDION SECTION ════════ */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-2.5">
            
            {/* Legend Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                <h3 className="font-moul text-xs sm:text-sm text-amber-400">
                  បញ្ជីឈ្មោះទីតាំងទាំង {westernToKhmerDigits(currentLocations.length)}
                </h3>
              </div>

              {/* Search & Add button in legend */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ស្វែងរកទីតាំង..."
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-kantumruy"
                  />
                </div>

                {canCustomizeTab && (
                  <button
                    onClick={handleOpenAddModal}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl border border-emerald-400/50 shrink-0 transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">បន្ថែម</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sub-view switcher for Tab 3 */}
            {activeTab === 'tagger' && (
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <button
                  onClick={() => setTaggerSubView('locations')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    taggerSubView === 'locations'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>📍 បញ្ជីទីតាំងលើ Map ({currentLocations.length})</span>
                </button>

                <button
                  onClick={() => setTaggerSubView('tags')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    taggerSubView === 'tags'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>🏷️ បញ្ជីស្លាកលេខប្រព័ន្ធ ({allTags.length})</span>
                </button>
              </div>
            )}

            {/* TAG LIST VIEW FOR TAB 3 MANUAL TAGGING */}
            {activeTab === 'tagger' && taggerSubView === 'tags' ? (
              <div className="space-y-2 pt-1 font-kantumruy">
                <div className="text-xs text-amber-300 font-bold mb-2 flex items-center justify-between">
                  <span>បញ្ជីស្លាកលេខក្នុងប្រព័ន្ធ ៖ (ចុច «📍 ដៅលើ Map ដោយដៃ» រួចចុចលើរូបភាពផែនទី)</span>
                  <span className="text-slate-400 font-normal">សរុប {westernToKhmerDigits(allTags.length)} ស្លាក</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                  {allTags
                    .filter((t) => {
                      const isPinned = currentLocations.some(
                        (loc) => String(loc.id || '').trim().toLowerCase() === String(t.tagNumber || '').trim().toLowerCase()
                      );
                      if (isPinned) return false;

                      const q = searchQuery.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        String(t.tagNumber || '').includes(q) ||
                        String(t.name || '').toLowerCase().includes(q) ||
                        String(t.location || '').toLowerCase().includes(q)
                      );
                    })
                    .map((t) => {
                      // Recompute isPinned inside .map() -- it was only in scope in .filter() before (bug)
                      const isPinned = currentLocations.some(
                        (loc) => String(loc.id || '').trim().toLowerCase() === String(t.tagNumber || '').trim().toLowerCase()
                      );
                      return (
                        <div
                          key={t.id || t.tagNumber}
                          className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 flex flex-col justify-between gap-1.5 hover:border-amber-500/40 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-bold font-moul text-[10px] flex items-center justify-center shrink-0">
                                {westernToKhmerDigits(t.tagNumber)}
                              </span>
                              <span className="text-xs font-bold text-slate-200 truncate">
                                {t.name || 'គ្មានឈ្មោះ'}
                              </span>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${isPinned ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                              {isPinned ? '✓ ដៅរួច' : 'មិនទាន់ដៅ'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            📍 ទីតាំង ៖ {t.location || 'មិនទាន់បញ្ជាក់'}
                          </div>
                          {canCustomizeMap && (
                            <button
                              onClick={() => {
                                setPendingPinTag(t);
                                setTaggerSubView('locations');
                                viewportRef.current?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="w-full mt-1 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg shadow-sm transition-all flex items-center justify-center gap-1 active:scale-95"
                            >
                              <MapPin className="w-3 h-3" />
                              <span>📍 ចុចដៅលើ Map ដោយដៃ</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <>
                {/* Category Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 transition-all ${
                      selectedCategory === 'all'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    🌐 ទាំងអស់ ({currentLocations.length})
                  </button>

                  {Object.keys(categoryGroups).map((catName) => (
                    <button
                      key={catName}
                      onClick={() => setSelectedCategory(catName)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 transition-all ${
                        selectedCategory === catName
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {catName} ({categoryGroups[catName].length})
                    </button>
                  ))}

                  {canCustomizeTab && (
                    <button
                      onClick={() => {
                        setNewCategoryName('');
                        setSelectedLocationIdsForGroup([]);
                        setIsCategoryModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 bg-amber-500/10 border border-dashed border-amber-500/50 text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition-all ml-auto"
                    >
                      ➕ Group ថ្មី
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Accordion Group Cards */}
            <div className="space-y-2">
              {Object.entries(categoryGroups).map(([catName, items]) => {
                if (selectedCategory !== 'all' && selectedCategory !== catName) return null;

                const filteredItems = items.filter((loc) =>
                  filteredLegendLocations.some((fl) => fl.id === loc.id)
                );
                if (filteredItems.length === 0) return null;

                const isOpen = openAccordions[catName] !== false;

                return (
                  <div
                    key={catName}
                    className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden"
                  >
                    {/* Accordion Header */}
                    <div
                      onClick={() =>
                        setOpenAccordions((prev) => ({ ...prev, [catName]: !isOpen }))
                      }
                      className="px-3.5 py-2 bg-gradient-to-r from-slate-900 to-slate-950 cursor-pointer flex items-center justify-between gap-2 hover:bg-slate-800/80 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-xs text-amber-400 truncate">{catName}</span>
                        <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.2 rounded-full shrink-0">
                          {filteredItems.length}
                        </span>
                      </div>

                      {/* Eye (Show/Hide), Lock (Lock/Unlock Dragging), & Edit Controls for this Group */}
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextHidden = {
                              ...hiddenCategories,
                              [catName]: !hiddenCategories[catName]
                            };
                            setHiddenCategories(nextHidden);
                            syncGroupSettingsToCloud(nextHidden, lockedCategories);
                          }}
                          className={`p-1.5 rounded-lg border transition-all ${
                            hiddenCategories[catName]
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30'
                              : 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700'
                          }`}
                          title={hiddenCategories[catName] ? `បង្ហាញ Pin ក្រុម «${catName}» ឡើងវិញ` : `លាក់ Pin ក្រុម «${catName}» លើ Map`}
                        >
                          {hiddenCategories[catName] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextLocked = {
                              ...lockedCategories,
                              [catName]: !lockedCategories[catName]
                            };
                            setLockedCategories(nextLocked);
                            syncGroupSettingsToCloud(hiddenCategories, nextLocked);
                          }}
                          className={`p-1.5 rounded-lg border transition-all ${
                            lockedCategories[catName]
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'
                          }`}
                          title={lockedCategories[catName] ? `បើកសោរដើម្បីរំកិល Pin ក្រុម «${catName}»` : `បិទសោរការពាររំកិល Pin ក្រុម «${catName}»`}
                        >
                          {lockedCategories[catName] ? (
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {canCustomizeTab && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingLoc({ isNew: true, x: 50, y: 50 });
                              setModalForm({
                                id: getNextDefaultLocationId(currentLocations),
                                name: '',
                                badgeColor: activeTab === 'interactive' ? 'cyan' : 'cyan',
                                type: 'building',
                                pos: 'R',
                                category: catName
                              });
                              setFormError('');
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border bg-emerald-600/30 text-emerald-300 border-emerald-500/50 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1"
                            title={`បន្ថែម Pin ទីតាំងថ្មីចូលក្នុង Group «${catName}» នេះ`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold hidden sm:inline">+ Pin</span>
                          </button>
                        )}

                        {canCustomizeTab && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPinningGroupMode(catName);
                              viewportRef.current?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="p-1.5 rounded-lg border bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 transition-all font-bold"
                            title={`📍 ដៅទីតាំងរាល់ Pin ក្នុង Group «${catName}» លើ Map`}
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenGroupEditModal(catName);
                          }}
                          className="p-1.5 rounded-lg border bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700 hover:text-amber-300 transition-all"
                          title={`កែប្រែទិសដៅ ឬព័ត៌មានក្រុម «${catName}»`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <ChevronDown
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                            isOpen ? 'rotate-180 text-amber-400' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Accordion Content Grid */}
                    {isOpen && (
                      <div className="p-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                        {filteredItems.map((loc, locIdx) => {
                          const isGate = loc.type === 'gate';
                          const tagCount = tagCountsByLocation[loc.id] || 0;
                          const isSel = selectedLocation?.id === loc.id;

                          return (
                            <div
                              id={`legend-card-${loc.id}`}
                              key={loc.id}
                              onClick={() => {
                                setSelectedLocation(loc);
                                setHoveredLocation(loc);
                                if (onSelectTag && (loc.isTagPin || loc.tagNumber || loc.tagNumberDisplay)) {
                                  const matchedTag = groupedAllTags.find(
                                    (t) =>
                                      (loc.tagNumber && String(t.tagNumber) === String(loc.tagNumber)) ||
                                      (loc.tagNumberDisplay && String(t.tagNumberDisplay) === String(loc.tagNumberDisplay)) ||
                                      (loc.isTagPin && (String(t.tagNumber) === String(loc.id) || String(t.tagNumberDisplay) === String(loc.id)))
                                  ) || allTags.find(
                                    (t) =>
                                      (loc.tagNumber && String(t.tagNumber) === String(loc.tagNumber)) ||
                                      (loc.tagNumberDisplay && String(t.tagNumberDisplay) === String(loc.tagNumberDisplay)) ||
                                      (loc.isTagPin && (String(t.tagNumber) === String(loc.id) || String(t.tagNumberDisplay) === String(loc.id)))
                                  );
                                  if (matchedTag) {
                                    onSelectTag(matchedTag);
                                  }
                                }
                              }}
                              className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                isSel
                                  ? 'bg-amber-500/15 border-amber-500/60 shadow-md shadow-amber-500/10 ring-1 ring-amber-400/40'
                                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/50'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-moul text-[10px] font-bold shrink-0 ${getPinBadgeColorClass(
                                    loc,
                                    locIdx
                                  )}`}
                                >
                                  {getPinBadgeText(loc, activeTab)}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-200 truncate">
                                    {getDisplayPinName(loc, allTags, activeTab)}
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1 shrink-0">
                                {onSelectTag && (loc.isTagPin || loc.tagNumber || loc.tagNumberDisplay) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const matchedTag = groupedAllTags.find(
                                        (t) =>
                                          (loc.tagNumber && String(t.tagNumber) === String(loc.tagNumber)) ||
                                          (loc.tagNumberDisplay && String(t.tagNumberDisplay) === String(loc.tagNumberDisplay)) ||
                                          (loc.isTagPin && (String(t.tagNumber) === String(loc.id) || String(t.tagNumberDisplay) === String(loc.id)))
                                      ) || allTags.find(
                                        (t) =>
                                          (loc.tagNumber && String(t.tagNumber) === String(loc.tagNumber)) ||
                                          (loc.tagNumberDisplay && String(t.tagNumberDisplay) === String(loc.tagNumberDisplay)) ||
                                          (loc.isTagPin && (String(t.tagNumber) === String(loc.id) || String(t.tagNumberDisplay) === String(loc.id)))
                                      );
                                      if (matchedTag) {
                                        onSelectTag(matchedTag);
                                      }
                                    }}
                                    className="px-1.5 py-0.5 text-[10px] font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 rounded-md border border-amber-500/30 transition-colors"
                                    title="មើលលម្អិតស្លាកលេខនេះ"
                                  >
                                    មើល
                                  </button>
                                )}
                                {canCustomizeTab && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEditModal(loc);
                                      }}
                                      className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-md transition-colors"
                                      title="កែប្រែទីតាំងនេះ"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteLocation(loc.id);
                                      }}
                                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
                                      title="លុបទីតាំងនេះ"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══════════════ MODAL: ADD / EDIT LOCATION ═══════════════ */}
        {isEditModalOpen && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
            onClick={() => setIsEditModalOpen(false)}
          >
            <div
              className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-5 shadow-2xl text-slate-100 font-kantumruy"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="font-moul text-amber-400 text-sm">
                  {editingLoc?.isNew ? '📍 បន្ថែមទីតាំងថ្មីលើផែនទី' : '✏️ កែប្រែព័ត៌មានទីតាំង'}
                </h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mb-3 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
                  ⚠️ {formError}
                </div>
              )}

              {/* 2-Section Switcher: Single Tag vs Group Pinning */}
              <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-2xl gap-1 mb-3.5 text-xs font-bold font-kantumruy">
                <button
                  type="button"
                  onClick={() => setPinModalMode('single')}
                  className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    pinModalMode === 'single'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>១. ដៅស្លាកលេខម្ដង១ៗ</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPinModalMode('group');
                    if (!selectedGroupForBatchPin && availableCategories.length > 0) {
                      setSelectedGroupForBatchPin(availableCategories[0]);
                    }
                  }}
                  className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    pinModalMode === 'group'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span>២. ដៅស្លាកលេខជា Group</span>
                </button>
              </div>

              {/* ════════ SECTION 1: SINGLE TAG PINNING ════════ */}
              {pinModalMode === 'single' && (
                <div className="space-y-3">
                  {/* Tag selector dropdown for manual tagging (ONLY VISIBLE ON TAB 3) */}
                  {activeTab === 'tagger' && allTags && allTags.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-2.5 mb-3">
                      <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-amber-400" />
                        <span>🔗 ជ្រើសរើសទីតាំង (ស្លាកលេខនីមួយៗ) ៖</span>
                      </label>
                      <select
                        value={selectedTagForPin || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedTagForPin(val);
                          if (val) {
                            const found =
                              groupedAllTags.find(
                                (t) => String(t.tagNumber) === String(val) || String(t.tagNumberDisplay) === String(val)
                              ) || allTags.find((t) => String(t.tagNumber) === String(val));

                            if (found) {
                              const tagDisp = found.tagNumberDisplay || String(found.tagNumber);
                              const latinId = String(found.tagNumber || khmerToWesternDigits(tagDisp));
                              setModalForm((prev) => ({
                                ...prev,
                                id: latinId,
                                tagNumber: found.tagNumber,
                                tagNumberDisplay: tagDisp,
                                isTagPin: true,
                                name: found.name || found.location || `ស្លាកលេខ #${latinId}`,
                                badgeColor: prev.badgeColor || 'orange',
                                category: (found.baseLocation && found.baseLocation !== 'មើលទីកន្លែង' && found.baseLocation !== 'មិនទាន់ដៅលើ Map') ? found.baseLocation : (prev.category || '🏢 ក្រុមអគារ និង កុដិ')
                              }));
                              setFormError('');
                            }
                          }
                        }}
                        className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-xs text-amber-200 focus:outline-none focus:border-amber-400 font-kantumruy"
                      >
                        <option value="">-- ជ្រើសរើសស្លាកលេខពីប្រព័ន្ធ ឬ បញ្ចូលព័ត៌មានដោយដៃ --</option>
                        {groupedAllTags
                          .filter((t) => {
                            const tNum = Number(t.tagNumber);
                            const tagNumStr = String(t.tagNumber || '').trim().toLowerCase();
                            const tagDispStr = String(t.tagNumberDisplay || '').trim().toLowerCase();
                            const tagNumWestern = khmerToWesternDigits(tagDispStr || tagNumStr).trim().toLowerCase();

                            if (
                              editingLoc &&
                              ((editingLoc.tagNumber && Number(editingLoc.tagNumber) === tNum) ||
                                (editingLoc.isTagPin &&
                                  (khmerToWesternDigits(String(editingLoc.id || '')) === tagNumWestern ||
                                    String(editingLoc.id || '').trim().toLowerCase() === tagNumStr ||
                                    String(editingLoc.id || '').trim().toLowerCase() === tagDispStr)))
                            ) {
                              return true;
                            }

                            // Filter out tag ONLY if it is ALREADY pinned on Tab 3 as a tag pin
                            return !currentLocations.some((loc) => {
                              if (!loc.isTagPin && !loc.tagNumber && !loc.tagNumberDisplay) return false;

                              const locTagNum = loc.tagNumber ? Number(loc.tagNumber) : null;
                              if (locTagNum && locTagNum === tNum) {
                                return true;
                              }

                              if (loc.tagNumberDisplay) {
                                const locDispWestern = khmerToWesternDigits(String(loc.tagNumberDisplay)).trim().toLowerCase();
                                if (locDispWestern === tagNumWestern || String(loc.tagNumberDisplay).trim().toLowerCase() === tagDispStr) {
                                  return true;
                                }
                              }

                              if (loc.isTagPin) {
                                const locIdWestern = khmerToWesternDigits(String(loc.id || '')).trim().toLowerCase();
                                if (locIdWestern === tagNumWestern || String(loc.id).trim().toLowerCase() === tagNumStr || String(loc.id).trim().toLowerCase() === tagDispStr) {
                                  return true;
                                }
                              }

                              return false;
                            });
                          })
                          .map((t) => {
                            const tagDisplay = t.tagNumberDisplay || westernToKhmerDigits(t.tagNumber);
                            const countLabel = t.count > 1 ? ` (${westernToKhmerDigits(t.count)} អង្គ)` : '';
                            return (
                              <option key={t.id || t.tagNumber} value={t.tagNumberDisplay || t.tagNumber}>
                                ស្លាកលេខ {tagDisplay}{countLabel} ៖ {t.name || 'គ្មានឈ្មោះ'}
                              </option>
                            );
                          })}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      លេខ ឬ អក្សរស្លាក ៖
                    </label>
                    <input
                      type="text"
                      value={modalForm.id}
                      onChange={(e) => {
                        const rawVal = e.target.value;
                        const latinVal = khmerToWesternDigits(rawVal);
                        setFormError('');

                        if (latinVal) {
                          const searchVal = latinVal.trim().toLowerCase();
                          const found =
                            groupedAllTags.find((t) => {
                              const tNoStr = String(t.tagNumber || '').trim().toLowerCase();
                              const tDispStr = String(t.tagNumberDisplay || '').trim().toLowerCase();
                              const tDispWestern = khmerToWesternDigits(tDispStr).trim().toLowerCase();
                              return tNoStr === searchVal || tDispStr === searchVal || tDispWestern === searchVal;
                            }) ||
                            allTags.find((t) => {
                              const tNoStr = String(t.tagNumber || '').trim().toLowerCase();
                              const tDispStr = String(t.tagNumberDisplay || '').trim().toLowerCase();
                              const tDispWestern = khmerToWesternDigits(tDispStr).trim().toLowerCase();
                              return tNoStr === searchVal || tDispStr === searchVal || tDispWestern === searchVal;
                            });

                          if (found) {
                            const tagDisp = found.tagNumberDisplay || String(found.tagNumber);
                            const latinId = String(found.tagNumber || khmerToWesternDigits(tagDisp));
                            const autoName = found.name || found.location || `ស្លាកលេខ #${latinId}`;

                            setSelectedTagForPin(tagDisp);
                            setModalForm((prev) => ({
                              ...prev,
                              id: latinVal,
                              tagNumber: found.tagNumber,
                              tagNumberDisplay: tagDisp,
                              isTagPin: true,
                              name: autoName,
                              badgeColor: prev.badgeColor || 'orange',
                              category:
                                found.baseLocation &&
                                found.baseLocation !== 'មើលទីកន្លែង' &&
                                found.baseLocation !== 'មិនទាន់ដៅលើ Map'
                                  ? found.baseLocation
                                  : prev.category || '🏢 ក្រុមអគារ និង កុដិ'
                            }));
                            return;
                          }
                        }

                        setSelectedTagForPin('');
                        setModalForm((prev) => ({ ...prev, id: latinVal }));
                      }}
                      placeholder="ឧ. 17, 18, F, G..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400 font-sans-en"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      ឈ្មោះទីតាំង ៖
                    </label>
                    <input
                      type="text"
                      value={modalForm.name}
                      onChange={(e) => {
                        setModalForm((prev) => ({ ...prev, name: e.target.value }));
                        setFormError('');
                      }}
                      placeholder="ឧ. កុដិថ្មី, អាហារដ្ឋាន..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Group / Category Select Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      📁 ជ្រើសរើស Group ទីតាំង (Category) ៖
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={modalForm.category || '🏢 ក្រុមអគារ និង កុដិ'}
                        onChange={(e) => setModalForm((prev) => ({ ...prev, category: e.target.value }))}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                      >
                        {availableCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="px-3 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-bold rounded-xl transition-all shrink-0"
                        title="បង្កើត Group ថ្មី"
                      >
                        + Group ថ្មី
                      </button>
                    </div>
                  </div>

                  {/* Badge Color options (ONLY VISIBLE ON TAB 3) */}
                  {activeTab === 'tagger' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>🎨 ជ្រើសរើសពណ៌ស្លាកលេខ (Badge Color) ៖</span>
                        <span className="text-[10px] text-amber-400 font-normal">ចុចលើពណ៌ដែលពេញចិត្ត</span>
                      </label>

                      {/* Visual Color Swatch Grid */}
                      <div className="grid grid-cols-6 gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-2xl">
                        {COLOR_SWATCHES.map((swatch) => {
                          const isSelected = (modalForm.badgeColor || 'orange') === swatch.key;
                          return (
                            <button
                              key={swatch.key}
                              type="button"
                              onClick={() =>
                                setModalForm((prev) => ({
                                  ...prev,
                                  badgeColor: swatch.key,
                                  type: swatch.key === 'gold' ? 'gate' : 'building'
                                }))
                              }
                              className={`h-9 rounded-xl flex items-center justify-center transition-all ${swatch.bg} ${
                                isSelected
                                  ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105 shadow-lg'
                                  : 'opacity-70 hover:opacity-100 hover:scale-100'
                              }`}
                              title={swatch.label}
                            >
                              {isSelected && <span className="text-slate-950 font-bold text-xs">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ════════ SECTION 2: GROUP TAG PINNING ════════ */}
              {pinModalMode === 'group' && (
                <div className="space-y-3 bg-slate-950 p-3 rounded-2xl border border-amber-500/30">
                  {/* Select Group Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-amber-300 mb-1">
                      📂 ជ្រើសរើស Group ដែលត្រូវដៅលើ Map ៖
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedGroupForBatchPin || availableCategories[0] || ''}
                        onChange={(e) => setSelectedGroupForBatchPin(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-bold"
                      >
                        {availableCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          setIsEditModalOpen(false);
                          setIsCategoryModalOpen(true);
                        }}
                        className="px-3 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-bold rounded-xl transition-all shrink-0"
                      >
                        + Group ថ្មី
                      </button>
                    </div>
                  </div>

                  {/* Display ONLY the tags contained inside the selected Group! */}
                  {selectedGroupForBatchPin && (() => {
                    const existingInGroup = currentLocations.filter((l) => l.category === selectedGroupForBatchPin);
                    const missingInGroup = allTags.filter((t) => {
                      const tBase = String(t.baseLocation || t.location || '').trim();
                      if (tBase !== selectedGroupForBatchPin) return false;
                      const tNoStr = String(t.tagNumber || '').trim();
                      const tDispStr = String(t.tagNumberDisplay || westernToKhmerDigits(t.tagNumber) || '').trim();
                      const tNoWestern = khmerToWesternDigits(tDispStr || tNoStr).trim();
                      return !existingInGroup.some((l) => {
                        const locTagNum = l.tagNumber ? String(l.tagNumber).trim() : '';
                        const locDisp = l.tagNumberDisplay ? String(l.tagNumberDisplay).trim() : '';
                        const locId = String(l.id || '').trim();
                        return (
                          locTagNum === tNoStr ||
                          locDisp === tDispStr ||
                          locId === tDispStr ||
                          khmerToWesternDigits(locDisp) === tNoWestern ||
                          khmerToWesternDigits(locId) === tNoWestern
                        );
                      });
                    }).map((t) => {
                      const tagDispStr = t.tagNumberDisplay || westernToKhmerDigits(t.tagNumber);
                      return {
                        id: tagDispStr,
                        name: t.name || `ស្លាកលេខ ${tagDispStr}`,
                        tagNumber: t.tagNumber,
                        tagNumberDisplay: tagDispStr,
                        tagOwnerName: t.name || '',
                        isUnpinned: true
                      };
                    });

                    const groupTagsList = [...existingInGroup, ...missingInGroup];

                    return (
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <div className="text-[11px] font-bold text-amber-400 flex items-center justify-between">
                          <span>✨ ស្លាកលេខដែលមានក្នុង Group «{selectedGroupForBatchPin}» ៖</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({westernToKhmerDigits(groupTagsList.length)} ស្លាក)
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-900 rounded-xl border border-slate-800">
                          {groupTagsList.length === 0 ? (
                            <div className="text-xs text-slate-400 p-3 text-center w-full">
                              ⚠️ គ្មានស្លាកលេខនៅក្នុង Group នេះទេ! (អ្នកអាចបន្ថែមស្លាកតាមរយៈប៊ូតុង + Group ថ្មី)
                            </div>
                          ) : (
                            groupTagsList.map((loc) => {
                              const tagOwnerName = loc.tagOwnerName;
                              const matchedTag = allTags.find(
                                (t) =>
                                  String(t.tagNumber) === String(loc.tagNumber || loc.id) ||
                                  String(t.tagNumberDisplay) === String(loc.tagNumberDisplay || loc.id)
                              );
                              const ownerDisp = tagOwnerName || (matchedTag ? matchedTag.name : '');
                              const tagNumDisp = loc.tagNumberDisplay || (loc.tagNumber ? westernToKhmerDigits(loc.tagNumber) : westernToKhmerDigits(loc.id));
                              const isUnpinned = loc.isUnpinned || (loc.x === 50 && loc.y === 50);

                              return (
                                <span
                                  key={loc.id}
                                  className="text-[11px] bg-slate-950 border border-amber-400/40 text-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold"
                                >
                                  <span className="font-sans-en text-amber-400">ស្លាក {tagNumDisp} ៖</span>
                                  <span className="text-white">{ownerDisp || loc.name}</span>
                                  {isUnpinned && (
                                    <span className="text-[9px] text-amber-300 bg-amber-500/20 px-1 rounded font-normal">
                                      📍 មិនទាន់ដៅ
                                    </span>
                                  )}
                                </span>
                              );
                            })
                          )}
                        </div>

                        {/* Large prominent Action Button to Pin this Group on Map */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditModalOpen(false);
                            setPinningGroupMode(selectedGroupForBatchPin);
                          }}
                          className="w-full mt-2 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 font-kantumruy"
                        >
                          <MapPin className="w-4 h-4 text-slate-950 shrink-0" />
                          <span>📍 ចុចទីនេះដើម្បីដៅ Group «{selectedGroupForBatchPin}» លើ Map ទាំងអស់ព្រមគ្នា</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}


              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                {!editingLoc?.isNew ? (
                  <button
                    onClick={() => handleDeleteLocation(editingLoc.id)}
                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold rounded-xl transition-all"
                  >
                    លុបទីតាំង
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
                  >
                    បោះបង់
                  </button>
                  <button
                    onClick={handleSaveLocationForm}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                  >
                    រក្សាទុក
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ MODAL: CREATE CUSTOM GROUP ═══════════════ */}
        {isCategoryModalOpen && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
            onClick={() => setIsCategoryModalOpen(false)}
          >
            <div
              className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-5 shadow-2xl text-slate-100 font-kantumruy"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="font-moul text-amber-400 text-sm">
                  📂 បង្កើត Group ទីតាំងថ្មី
                </h3>
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ឈ្មោះ Group ថ្មី ៖
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="ឧ. ធម្មសភា, សាលាឆាន់, កុដិព្រះសង្ឃ..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Batch Tag Number Input */}
                <div className="space-y-1 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                  <label className="block text-xs font-bold text-amber-300 flex items-center justify-between">
                    <span>🔢 វាយបញ្ចូលលេខស្លាក (ឧ. 4 12 19 26 35) ៖</span>
                    <span className="text-[10px] text-slate-400 font-normal">ដកឃ្លា ឬប្រើ (,)</span>
                  </label>
                  <input
                    type="text"
                    value={tagNumbersBatchInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTagNumbersBatchInput(val);
                      const { matchedIds, warnings } = processBatchTagInput(val, newCategoryName.trim());
                      setSelectedLocationIdsForGroup(matchedIds);
                      setBatchTagWarnings(warnings);
                    }}
                    placeholder="វាយបញ្ចូលលេខស្លាក (ឧ. 4 12 19 26 35)..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-sans-en"
                  />

                  {/* Directly show owner names matching typed numbers */}
                  {tagNumbersBatchInput.trim() && (
                    <div className="pt-1.5 border-t border-slate-800 space-y-1.5">
                      {/* Warning notice pop-up badges for tags already in other groups */}
                      {batchTagWarnings.length > 0 && (
                        <div className="space-y-1 bg-rose-500/10 border border-rose-500/30 p-2 rounded-xl">
                          <div className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                            <span>⚠️ មិនអាចលោតចូល Group នេះទេ ព្រោះស្ថិតក្នុង Group ផ្សេងរួចហើយ ៖</span>
                          </div>
                          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                            {batchTagWarnings.map((w) => (
                              <span key={w.id} className="text-[11px] bg-slate-900 border border-rose-500/40 text-rose-300 px-2 py-0.5 rounded-lg flex items-center gap-1.5 font-bold">
                                <span className="font-sans-en text-amber-400">ស្លាក {w.tagNumDisp} ៖</span>
                                <span className="text-white">{w.ownerDisp}</span>
                                <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded font-normal">
                                  ស្ថិតនៅ Group «{w.existingGroup}» ស្រាប់
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-[10px] font-bold text-amber-400">
                        ✨ ឈ្មោះម្ចាស់ស្លាកដែលបានរកឃើញ ({selectedLocationIdsForGroup.length}) ៖
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {currentLocations
                          .filter((loc) => selectedLocationIdsForGroup.includes(loc.id))
                          .map((loc) => {
                            const tagOwnerName = loc.tagOwnerName;
                            const matchedTag = allTags.find(
                              (t) =>
                                String(t.tagNumber) === String(loc.tagNumber || loc.id) ||
                                String(t.tagNumberDisplay) === String(loc.tagNumberDisplay || loc.id)
                            );
                            const ownerDisp = tagOwnerName || (matchedTag ? matchedTag.name : '');
                            const tagNumDisp = loc.tagNumberDisplay || (loc.tagNumber ? westernToKhmerDigits(loc.tagNumber) : westernToKhmerDigits(loc.id));
                            const isUnpinned = loc.isUnpinned || (loc.x === 50 && loc.y === 50);
                            return (
                              <span key={loc.id} className="text-[11px] bg-slate-900 border border-amber-400/40 text-amber-200 px-2 py-0.5 rounded-lg flex items-center gap-1.5 font-bold">
                                <span className="font-sans-en text-amber-400">ស្លាក {tagNumDisp} ៖</span>
                                <span className="text-white">{ownerDisp || loc.name}</span>
                                {isUnpinned && (
                                  <span className="text-[9px] text-amber-300 bg-amber-500/20 px-1 rounded font-normal">
                                    📍 មិនទាន់ដៅលើ Map
                                  </span>
                                )}
                              </span>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                    <span>📌 ឬជ្រើសរើសស្លាក/ទីតាំងផ្ទាល់ពីបញ្ជី ៖</span>
                    <span className="text-[10px] text-amber-400 font-normal">គ្រីក (✓) ដើម្បីជ្រើសរើស</span>
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-1 bg-slate-950 border border-slate-800 rounded-xl p-2">
                    {currentLocations
                      .filter((loc) => {
                        const cat = loc.category || '';
                        return cat === '' || !cat || selectedLocationIdsForGroup.includes(loc.id);
                      })
                      .map((loc) => {
                      const isChecked = selectedLocationIdsForGroup.includes(loc.id);
                      const tagOwnerName = loc.tagOwnerName;
                      const matchedTag = allTags.find(
                        (t) =>
                          String(t.tagNumber) === String(loc.tagNumber || loc.id) ||
                          String(t.tagNumberDisplay) === String(loc.tagNumberDisplay || loc.id)
                      );
                      const ownerDisp = tagOwnerName || (matchedTag ? matchedTag.name : '');
                      const tagNumDisp = loc.tagNumberDisplay || (loc.tagNumber ? westernToKhmerDigits(loc.tagNumber) : (loc.isTagPin ? westernToKhmerDigits(loc.id) : null));

                      return (
                        <label
                          key={loc.id}
                          className="flex items-center justify-between text-xs text-slate-300 hover:text-white cursor-pointer p-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLocationIdsForGroup((prev) => [...prev, loc.id]);
                                } else {
                                  setSelectedLocationIdsForGroup((prev) =>
                                    prev.filter((id) => id !== loc.id)
                                  );
                                }
                              }}
                              className="rounded border-slate-700 text-amber-500 focus:ring-0 shrink-0"
                            />
                            <div className="truncate min-w-0">
                              {tagNumDisp ? (
                                <span className="font-bold text-amber-400 font-sans-en mr-1">
                                  ស្លាកលេខ {tagNumDisp} ៖
                                </span>
                              ) : (
                                <span className="font-bold text-amber-400 font-moul mr-1">{loc.id}.</span>
                              )}
                              <span className="text-slate-100 font-bold">{ownerDisp || loc.name}</span>
                            </div>
                          </div>
                          {ownerDisp && loc.name && (
                            <span className="text-[10px] text-amber-300/80 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0 ml-1">
                              📍 {loc.name}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
                >
                  បោះបង់
                </button>
                <button
                  onClick={handleSaveCustomCategory}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                >
                  រក្សាទុក Group
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ MODAL: EDIT GROUP SETTINGS ═══════════════ */}
        {isGroupEditModalOpen && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in font-kantumruy"
            onClick={() => setIsGroupEditModalOpen(false)}
          >
            <div
              className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-4 sm:p-5 shadow-2xl text-slate-100 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold shrink-0">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-moul text-xs sm:text-sm text-amber-400 truncate">
                    កែប្រែ Group ៖ «{editingGroupName}»
                  </h3>
                </div>
                <button
                  onClick={() => setIsGroupEditModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Pin Entire Group On Map Button */}
              <button
                onClick={() => {
                  setIsGroupEditModalOpen(false);
                  setPinningGroupMode(editingGroupName);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 font-kantumruy"
              >
                <MapPin className="w-4 h-4 text-slate-950" />
                <span>📍 ដៅទីតាំងរាល់ Pin ក្នុង Group «{editingGroupName}» លើ Map ទាំងអស់តែម្តង</span>
              </button>

              {/* Add Pin Into This Group Button */}
              <button
                onClick={() => {
                  setIsGroupEditModalOpen(false);
                  setEditingLoc({ isNew: true, x: 50, y: 50 });
                  setModalForm({
                    id: getNextDefaultLocationId(currentLocations),
                    name: '',
                    badgeColor: activeTab === 'interactive' ? 'cyan' : 'cyan',
                    type: 'building',
                    pos: 'R',
                    category: editingGroupName
                  });
                  setFormError('');
                  setIsEditModalOpen(true);
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>➕ បន្ថែម Pin ទីតាំងថ្មីចូលក្នុង Group «{editingGroupName}» នេះ</span>
              </button>

              {/* Rename Group */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  ឈ្មោះ Group ៖
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={renameGroupInput}
                    onChange={(e) => setRenameGroupInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={handleRenameGroupSubmit}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all shrink-0"
                  >
                    កែឈ្មោះ
                  </button>
                </div>
              </div>

              {/* Batch Tag Number Input for Editing Group */}
              <div className="space-y-1 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                <label className="block text-xs font-bold text-amber-300 flex items-center justify-between">
                  <span>🔢 វាយបញ្ចូលលេខស្លាក ដើម្បីដាក់ចូល Group នេះ (ឧ. 4 12 19 26 35) ៖</span>
                  <span className="text-[10px] text-slate-400 font-normal">ដកឃ្លា ឬប្រើ (,)</span>
                </label>
                <input
                  type="text"
                  value={tagNumbersBatchInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTagNumbersBatchInput(val);
                    const { warnings } = processBatchTagInput(val, editingGroupName);
                    setBatchTagWarnings(warnings);
                  }}
                  placeholder="វាយបញ្ចូលលេខស្លាក (ឧ. 4 12 19 26 35)..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-sans-en"
                />

                {/* Directly show owner names matching typed numbers */}
                {tagNumbersBatchInput.trim() && (
                  <div className="pt-1.5 border-t border-slate-800 space-y-1.5">
                    {/* Warning notice pop-up badges for tags already in other groups */}
                    {batchTagWarnings.length > 0 && (
                      <div className="space-y-1 bg-rose-500/10 border border-rose-500/30 p-2 rounded-xl">
                        <div className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                          <span>⚠️ មិនអាចលោតចូល Group នេះទេ ព្រោះស្ថិតក្នុង Group ផ្សេងរួចហើយ ៖</span>
                        </div>
                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                          {batchTagWarnings.map((w) => (
                            <span key={w.id} className="text-[11px] bg-slate-900 border border-rose-500/40 text-rose-300 px-2 py-0.5 rounded-lg flex items-center gap-1.5 font-bold">
                              <span className="font-sans-en text-amber-400">ស្លាក {w.tagNumDisp} ៖</span>
                              <span className="text-white">{w.ownerDisp}</span>
                              <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded font-normal">
                                ស្ថិតនៅ Group «{w.existingGroup}» ស្រាប់
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-[10px] font-bold text-amber-400">
                      ✨ ឈ្មោះម្ចាស់ស្លាកក្នុង Group «{editingGroupName}» ៖
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {currentLocations
                        .filter((loc) => loc.category === editingGroupName)
                        .map((loc) => {
                          const tagOwnerName = loc.tagOwnerName;
                          const matchedTag = allTags.find(
                            (t) =>
                              String(t.tagNumber) === String(loc.tagNumber || loc.id) ||
                              String(t.tagNumberDisplay) === String(loc.tagNumberDisplay || loc.id)
                          );
                          const ownerDisp = tagOwnerName || (matchedTag ? matchedTag.name : '');
                          const tagNumDisp = loc.tagNumberDisplay || (loc.tagNumber ? westernToKhmerDigits(loc.tagNumber) : westernToKhmerDigits(loc.id));
                          const isUnpinned = loc.isUnpinned || (loc.x === 50 && loc.y === 50);
                          return (
                            <span key={loc.id} className="text-[11px] bg-slate-900 border border-amber-400/40 text-amber-200 px-2 py-0.5 rounded-lg flex items-center gap-1.5 font-bold">
                              <span className="font-sans-en text-amber-400">ស្លាក {tagNumDisp} ៖</span>
                              <span className="text-white">{ownerDisp || loc.name}</span>
                              {isUnpinned && (
                                <span className="text-[9px] text-amber-300 bg-amber-500/20 px-1 rounded font-normal">
                                  📍 មិនទាន់ដៅលើ Map
                                </span>
                              )}
                            </span>
                          );
                        })}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const { updatedLocations } = processBatchTagInput(tagNumbersBatchInput, editingGroupName);
                        if (updatedLocations) {
                          const { setter, saver } = getTabDataFunctions();
                          setter(updatedLocations);
                          saver(updatedLocations);
                          if (activeTab === 'interactive') {
                            setTab3Locations(updatedLocations);
                            saveTab3LocationsToFirebase(updatedLocations);
                          }
                        }
                        setTagNumbersBatchInput('');
                        setBatchTagWarnings([]);
                      }}
                      className="w-full mt-2 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 font-kantumruy"
                    >
                      <Plus className="w-4 h-4 text-slate-950" />
                      <span>➕ បញ្ចូលលេខស្លាកទាំងនេះទៅក្នុង Group «{editingGroupName}»</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Checkbox List of Pins in / to add to this Group */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>📌 ឬជ្រើសរើស Pin ទីតាំងផ្ទាល់ពីបញ្ជី ៖</span>
                  <span className="text-[10px] text-amber-400 font-normal">គ្រីក (✓) ដើម្បីដាក់ចូល Group</span>
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1 bg-slate-950 border border-slate-800 rounded-2xl p-2">
                  {currentLocations
                    .filter((loc) => {
                      const cat = loc.category || '';
                      return cat === editingGroupName || cat === '' || !cat;
                    })
                    .map((loc) => {
                      const isInGroup = loc.category === editingGroupName;

                      const tagOwnerName = loc.tagOwnerName;
                      const matchedTag = allTags.find(
                        (t) =>
                          String(t.tagNumber) === String(loc.tagNumber || loc.id) ||
                          String(t.tagNumberDisplay) === String(loc.tagNumberDisplay || loc.id)
                      );
                      const ownerDisp = tagOwnerName || (matchedTag ? matchedTag.name : '');
                      const tagNumDisp = loc.tagNumberDisplay || (loc.tagNumber ? westernToKhmerDigits(loc.tagNumber) : (loc.isTagPin ? westernToKhmerDigits(loc.id) : null));

                      return (
                        <label
                          key={loc.id}
                          className={`flex items-center justify-between text-xs p-1.5 rounded-xl cursor-pointer transition-all ${
                            isInGroup
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                              : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isInGroup}
                              onChange={(e) => {
                                const targetCategory = e.target.checked ? editingGroupName : '';
                                const { setter, saver } = getTabDataFunctions();
                                const baseLocations = activeTab === 'tagger' ? tab3Locations : locations;
                                const updated = baseLocations.map((l) =>
                                  l.id === loc.id ? { ...l, category: targetCategory } : l
                                );
                                setter(updated);
                                saver(updated);
                              }}
                              className="rounded border-slate-700 text-amber-500 focus:ring-0 shrink-0"
                            />
                            <div className="truncate min-w-0">
                              {tagNumDisp ? (
                                <span className="font-bold text-amber-400 font-sans-en mr-1">
                                  ស្លាកលេខ {tagNumDisp} ៖
                                </span>
                              ) : (
                                <span className="font-bold text-amber-400 font-moul mr-1">#{loc.id}.</span>
                              )}
                              <span className="text-slate-100 font-bold">{ownerDisp || loc.name}</span>
                            </div>
                          </div>

                          <span className="text-[10px] text-slate-400 shrink-0 font-sans-en ml-1">
                            {isInGroup ? '✓ ក្នុង Group នេះ' : 'មិនទាន់មាន Group'}
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Set Label Position for ALL items in Group */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  ទិសដៅបង្ហាញឈ្មោះស្លាក សម្រាប់គ្រប់ទីតាំងក្នុង Group នេះ ៖
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { key: 'R', label: '👉 ស្តាំ' },
                    { key: 'L', label: '👈 ឆ្វេង' },
                    { key: 'T', label: '👆 លើ' },
                    { key: 'B', label: '👇 ក្រោម' }
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => handleApplyGroupPos(p.key)}
                      className="py-1.5 px-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-950 text-amber-300 hover:bg-amber-500 hover:text-slate-950 hover:border-amber-400 transition-all shadow-sm active:scale-95"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Set Badge Color for ALL items in Group */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  🎨 ជ្រើសរើសពណ៌ សម្រាប់គ្រប់ទីតាំងក្នុង Group នេះ ៖
                </label>
                <div className="grid grid-cols-5 gap-2 p-2 bg-slate-950 border border-slate-800 rounded-2xl">
                  {COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.key}
                      type="button"
                      onClick={() => handleApplyGroupColor(swatch.key)}
                      className={`h-8 rounded-xl flex items-center justify-center transition-all ${swatch.bg} opacity-80 hover:opacity-100 hover:scale-105 shadow-md`}
                      title={`កំណត់ពណ៌ ${swatch.label} សម្រាប់គ្រប់ទីតាំងក្នុង Group នេះ`}
                    >
                    </button>
                  ))}
                </div>
              </div>

              {/* Delete Group button */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={handleDeleteGroup}
                  className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
                  title="លុប Group នេះ (ទីតាំងទាំងអស់នឹងត្រូវរក្សាទុកដដែល)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>លុប Group នេះ</span>
                </button>

                <button
                  onClick={() => setIsGroupEditModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all"
                >
                  រួចរាល់
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );

  if (modalMode) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200"
        onClick={onClose}
      >
        {mainContainer}
      </div>
    );
  }

  return mainContainer;
}
