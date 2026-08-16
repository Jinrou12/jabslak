import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Upload,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Edit2,
  Trash2,
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
  Tag
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
import { westernToKhmerDigits, khmerToWesternDigits } from '../utils/khmerSearch';

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

  // Custom user-selected badge color on Tab 3 (if specifically purple, rose, fuchsia, etc.)
  if (activeTab === 'tagger' && loc.badgeColor && loc.badgeColor !== 'emerald' && COLOR_OPTION_GRADIENTS[loc.badgeColor]) {
    return COLOR_OPTION_GRADIENTS[loc.badgeColor];
  }

  // Default ALL location pins (including #18 សាលាសន្និសីទ) to 100% BLUE (cyan) across ALL tabs
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

export function getDisplayPinName(loc, allTags = [], activeTab = 'tagger', tab3Locations = []) {
  if (!loc) return '';
  const locIdStr = String(loc.id || '').trim();
  const initialMatch = INITIAL_TEMPLE_LOCATIONS.find((init) => String(init.id).trim() === locIdStr);
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
  const modalMode = isModal || Boolean(onClose);
  // Only admin & owner can customize (add/edit/delete pins, drag, create groups) on Tab 3
  // Assistant and Guest can only VIEW the map
  const userRole = currentUser?.role || 'guest';
  const canCustomizeMap = userRole === 'admin' || userRole === 'owner';

  // Tab 1 & Tab 2 share this state
  const [locations, setLocations] = useState(getSavedTempleLocations());
  // Tab 3 has its own INDEPENDENT state
  const [tab3Locations, setTab3Locations] = useState(getSavedTab3Locations());
  const [activeTab, setActiveTab] = useState('tagger'); // Default directly to Tab 3 (ផ្ទាំងទី៣ ៖ នៅស្លាកលើ Map)

  // Tab 1 = Read only for all. Tab 2 & Tab 3 = Restricted to Admin & Owner ONLY!
  const canCustomizeTab = (activeTab === 'interactive' || activeTab === 'tagger') && canCustomizeMap;

  // Sync Tab 3 metadata with allTags while preserving Location Names (ឈ្មោះទីតាំង)
  const effectiveTab3Locations = useMemo(() => {
    return tab3Locations.map((loc) => {
      const locIdStr = String(loc.id || '').trim();
      
      // Look up authentic original location name from INITIAL_TEMPLE_LOCATIONS if available
      const initialMatch = INITIAL_TEMPLE_LOCATIONS.find((init) => String(init.id).trim() === locIdStr);
      const locationName = initialMatch ? initialMatch.name : loc.name;

      const matchedTag = allTags.find((t) => {
        const tNoStr = String(t.tagNumber || '').trim();
        const tBase = String(t.baseLocation || t.location || '').trim();

        // 1. Match Western Tag Pin ID (e.g. Pin "2" matches Tag #2)
        if (tNoStr === locIdStr) return true;

        // 2. Match Location Pin by location name ONLY if tag's location explicitly matches locationName
        if (tBase && (tBase === locIdStr || tBase === locationName)) return true;

        return false;
      });

      return {
        ...loc,
        name: locationName, // ALWAYS KEEP LOCATION NAME! (ឈ្មោះទីតាំង)
        tagOwnerName: matchedTag && matchedTag.name ? matchedTag.name : loc.tagOwnerName,
        tagNumber: matchedTag && matchedTag.tagNumber ? matchedTag.tagNumber : loc.tagNumber
      };
    });
  }, [tab3Locations, allTags]);

  // Computed: which locations array to use based on active tab
  const currentLocations = activeTab === 'tagger' ? effectiveTab3Locations : locations;
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

  // Group Edit Modal State
  const [isGroupEditModalOpen, setIsGroupEditModalOpen] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [renameGroupInput, setRenameGroupInput] = useState('');

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
      setIsLabelsVisible(false); // Hide text clutter by default on mobile so map stays super clean
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

  // Focus on highlighted location if passed from parent
  useEffect(() => {
    if (highlightLocationName) {
      setActiveTab('tagger');
      const searchTarget = String(highlightLocationName).toLowerCase().trim();
      const westernTarget = khmerToWesternDigits(searchTarget);

      // Search in effectiveTab3Locations (which has person names)
      const match = effectiveTab3Locations.find((l) => {
        const pinIdStr = String(l.id || '').trim();
        const pinNameStr = String(l.name || '').toLowerCase().trim();

        return (
          pinNameStr === searchTarget ||
          pinNameStr.includes(searchTarget) ||
          searchTarget.includes(pinNameStr) ||
          pinIdStr === searchTarget ||
          pinIdStr === westernTarget
        );
      }) || locations.find((l) => {
        const pinIdStr = String(l.id || '').trim();
        const pinNameStr = String(l.name || '').toLowerCase().trim();
        return pinNameStr.includes(searchTarget) || pinIdStr === searchTarget;
      });

      const targetLoc = match || effectiveTab3Locations[0] || locations[0];
      if (targetLoc) {
        setSelectedLocation(targetLoc);
      }
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
    allTags.forEach((t) => {
      const locStr = t.baseLocation || t.location || '';
      currentLocations.forEach((loc) => {
        if (locStr.includes(loc.name) || (t.templeLocationId && t.templeLocationId === loc.id)) {
          counts[loc.id] = (counts[loc.id] || 0) + 1;
        }
      });
    });
    return counts;
  }, [allTags, currentLocations]);

  // Categories list
  const categoryGroups = useMemo(() => {
    const groups = {};
    currentLocations.forEach((loc) => {
      const cat = loc.category || (loc.type === 'gate' ? '⛩️ ក្រុមខ្លោងទ្វារវត្ត' : '🏢 ក្រុមអគារ និង កុដិ');
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(loc);
    });
    return groups;
  }, [currentLocations]);

  const availableCategories = useMemo(() => {
    const cats = new Set(['🏢 ក្រុមអគារ និង កុដិ', '⛩️ ក្រុមខ្លោងទ្វារវត្ត']);
    Object.keys(categoryGroups).forEach((c) => cats.add(c));
    return Array.from(cats);
  }, [categoryGroups]);

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
    if (isPanning) {
      setIsPanning(false);
      if (hasPannedRef.current) {
        setTimeout(() => {
          pinMovedFlagRef.current = false;
        }, 100);
      }
    }
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

    if (hasPannedRef.current) {
      setTimeout(() => {
        pinMovedFlagRef.current = false;
      }, 100);
    }
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
    return westernToKhmerDigits(nextNum);
  };

  // Map Click (Add new pin on Tab 2 or Tab 3)
  const handleMapClick = (e) => {
    if (!canCustomizeTab) return; // Only Admin & Owner can add pins on Tab 2 & Tab 3
    if (draggingPinId || pinMovedFlagRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const pctX = parseFloat(((clickX / rect.width) * 100).toFixed(2));
    const pctY = parseFloat(((clickY / rect.height) * 100).toFixed(2));

    setEditingLoc({
      isNew: true,
      x: pctX,
      y: pctY
    });

    if (pendingPinTag) {
      setModalForm({
        id: String(pendingPinTag.tagNumber || currentLocations.length + 1),
        name: pendingPinTag.name || pendingPinTag.location || `ស្លាកលេខ #${pendingPinTag.tagNumber}`,
        type: 'building',
        pos: 'R',
        category: pendingPinTag.baseLocation || '🏢 ក្រុមអគារ និង កុដិ'
      });
      setSelectedTagForPin(String(pendingPinTag.tagNumber));
      setPendingPinTag(null);
    } else {
      setModalForm({
        id: getNextDefaultLocationId(currentLocations),
        name: '',
        badgeColor: 'cyan',
        type: 'building',
        pos: 'R',
        category: '🏢 ក្រុមអគារ និង កុដិ'
      });
      setSelectedTagForPin('');
    }

    setFormError('');
    setIsEditModalOpen(true);
  };

  // Helper: get correct setter + saver for current tab
  const getTabDataFunctions = () => {
    if (activeTab === 'tagger') {
      return { setter: setTab3Locations, saver: saveTab3LocationsToFirebase };
    }
    return { setter: setLocations, saver: saveTempleLocationsToFirebase };
  };

  // Ultra-Precise Pin Dragging (Synchronizes to Cloud on End)
  const handlePinDragStart = (e, loc) => {
    if (!canCustomizeTab) return; // Only Admin & Owner can drag pins on Tab 2 & Tab 3

    e.stopPropagation();
    pinMovedFlagRef.current = false;
    setDraggingPinId(loc.id);
    const dragTab = activeTab; // capture which tab we started dragging in

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
    setModalForm({
      id: loc.id,
      name: loc.name,
      badgeColor: loc.badgeColor || (loc.type === 'gate' ? 'emerald' : 'emerald'),
      type: loc.type || 'building',
      pos: loc.pos || 'R',
      category: loc.category || '🏢 ក្រុមអគារ និង កុដិ'
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
    setModalForm({
      id: getNextDefaultLocationId(currentLocations),
      name: '',
      badgeColor: 'cyan',
      type: 'building',
      pos: 'R',
      category: '🏢 ក្រុមអគារ និង កុដិ'
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Save / Edit Location (Syncs to Firebase Cloud Database)
  const handleSaveLocationForm = () => {
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
    const rawBaseLocations = activeTab === 'tagger' ? tab3Locations : locations;
    const duplicate = rawBaseLocations.find(
      (l) => String(l.id || '').toLowerCase() === String(id || '').toLowerCase() && (!editingLoc || editingLoc.id !== l.id)
    );
    if (duplicate) {
      setFormError(`លេខ/អក្សរ «${id}» នេះមានរួចហើយ! (${duplicate.name})`);
      return;
    }

    const { setter, saver } = getTabDataFunctions();

    // IMPORTANT: Always use RAW base locations (not computed effectiveTab3Locations)
    // to avoid baking computed tagOwnerName/tagNumber into saved data.
    const baseLocations = activeTab === 'tagger' ? tab3Locations : locations;

    // Helper: strip computed-only properties before saving to state/Firebase
    const stripComputed = (loc) => {
      const { tagOwnerName, tagNumber, ...clean } = loc; // eslint-disable-line no-unused-vars
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
              badgeColor: modalForm.badgeColor || 'emerald',
              type: modalForm.badgeColor === 'gold' ? 'gate' : 'building',
              pos: modalForm.pos || 'R',
              category: modalForm.category || '🏢 ក្រុមអគារ និង កុដិ'
            })
          : stripComputed(l)
      );
      if (selectedLocation?.id === editingLoc.id) {
        setSelectedLocation({
          ...selectedLocation,
          id: id,
          name: name,
          badgeColor: modalForm.badgeColor || 'emerald',
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
        badgeColor: activeTab === 'interactive' ? 'cyan' : (modalForm.badgeColor || 'cyan'),
        type: modalForm.badgeColor === 'gold' ? 'gate' : 'building',
        pos: modalForm.pos || 'R',
        category: modalForm.category || '🏢 ក្រុមអគារ និង កុដិ'
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

    // Synchronize new pins across both Tab 2 and Tab 3 so pins are 100% visible on all tabs!
    if (activeTab === 'interactive') {
      setTab3Locations(updated);
      saveTab3LocationsToFirebase(updated);
    } else if (activeTab === 'tagger') {
      setLocations(updated);
      saveTempleLocationsToFirebase(updated);
    }

    setIsEditModalOpen(false);
    setEditingLoc(null);
  };

  // Delete Location (routes to correct tab data)
  const handleDeleteLocation = (id) => {
    if (window.confirm(`តើអ្នកពិតជាចង់លុបទីតាំង #${id} នេះមែនទេ?`)) {
      const { setter, saver } = getTabDataFunctions();
      // Use raw base locations (not computed effectiveTab3Locations) to avoid saving computed props
      const baseLocations = activeTab === 'tagger' ? tab3Locations : locations;
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

  // Save Custom Category (routes to correct tab data)
  const handleSaveCustomCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (selectedLocationIdsForGroup.length === 0) {
      alert('សូមជ្រើសរើសយ៉ាងហោចណាស់ ១ ទីតាំង!');
      return;
    }

    const { setter, saver } = getTabDataFunctions();
    // Use raw base locations to avoid saving computed tagOwnerName/tagNumber
    const baseLocations = activeTab === 'tagger' ? tab3Locations : locations;
    const stripComputed2 = ({ tagOwnerName, tagNumber, ...clean }) => clean; // eslint-disable-line no-unused-vars
    const updated = baseLocations.map((loc) => {
      if (selectedLocationIdsForGroup.includes(loc.id)) {
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
    setNewCategoryName('');
    setSelectedLocationIdsForGroup([]);
  };

  // Group Batch Actions (Batch change direction / color / rename / delete)
  const handleOpenGroupEditModal = (catName) => {
    setEditingGroupName(catName);
    setRenameGroupInput(catName);
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
    if (!window.confirm(`តើអ្នកប្រាកដជាចង់លុប Group «${editingGroupName}» នេះមែនទេ?`)) return;

    const { setter, saver } = getTabDataFunctions();
    const baseLocations = activeTab === 'tagger' ? tab3Locations : locations;

    const updated = baseLocations.map((loc) => {
      const catMatches = (loc.category || (loc.type === 'gate' ? '⛩️ ក្រុមខ្លោងទ្វារវត្ត' : '🏢 ក្រុមអគារ និង កុដិ')) === editingGroupName;
      if (catMatches) {
        return { ...loc, category: '🏢 ក្រុមអគារ និង កុដិ' };
      }
      return loc;
    });

    setter(updated);
    saver(updated);
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
      const matchesCat =
        selectedCategory === 'all' || (loc.category || (loc.type === 'gate' ? '⛩️ ក្រុមខ្លោងទ្វារវត្ត' : '🏢 ក្រុមអគារ និង កុដិ')) === selectedCategory;
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

          {/* Quick Header Actions (Close Button) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-all ml-0.5"
              title="បិទផែនទី"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
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
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                isCompassVisible
                  ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
              <span>{isCompassVisible ? 'ត្រីវិស័យ' : 'លាក់ត្រីវិស័យ'}</span>
            </button>

            {/* Toggle Pins Button */}
            <button
              onClick={() => setIsPinsVisible(!isPinsVisible)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                isPinsVisible
                  ? 'bg-sky-500/20 border border-sky-500/50 text-sky-300'
                  : 'bg-rose-500/20 border border-rose-500/50 text-rose-400'
              }`}
            >
              {isPinsVisible ? (
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
              )}
              <span>{isPinsVisible ? 'បង្ហាញ Pin' : 'លាក់ Pin'}</span>
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

            {/* Toggle Name Labels in Tab 1 */}
            {activeTab === 'labeled' && (
              <button
                onClick={() => setIsLabelsVisible(!isLabelsVisible)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                  isLabelsVisible
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
                title={isLabelsVisible ? 'លាក់ឈ្មោះទីតាំង (បង្ហាញតែលេខលើ Pin ដើម្បកុំឲ្យជាន់គ្នា)' : 'បង្ហាញឈ្មោះទីតាំងទាំងអស់'}
              >
                <Tag className="w-4 h-4 text-emerald-400" />
                <span>{isLabelsVisible ? 'ឈ្មោះ' : 'លាក់ឈ្មោះ'}</span>
              </button>
            )}
          </div>
        </div>



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
              className={`relative w-full overflow-auto select-none bg-white ${
                isPanning ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{
                maxHeight: 'min(48vh, 550px)',
                height: zoomScale > 1.0 ? 'min(48vh, 550px)' : 'auto',
                touchAction: zoomScale > 1.0 ? 'none' : 'pan-y'
              }}
            >
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
                              const idStr = String(loc.id || '');
                              const svgFontSize = idStr.length > 2 ? 9.5 : idStr.length > 1 ? 11.5 : 15.5;

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
                                      {loc.id}
                                    </text>
                                  </svg>
                                </div>
                              );
                            })()}

                            {/* Floating Name Label: RENDERED IN TAB 1 when isLabelsVisible is true, OR when highlighted */}
                            {activeTab === 'labeled' && (isLabelsVisible || isHighlighted) && (
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
                      {selectedLocation.id}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-amber-400 font-bold font-moul truncate">
                        {getDisplayPinName(selectedLocation, allTags, activeTab)}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {selectedLocation.category || '🏢 ក្រុមអគារ និង កុដិ'}
                      </div>
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
                                  {loc.id}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-200 truncate">
                                    {getDisplayPinName(loc, allTags, activeTab)}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {tagCount > 0 ? (
                                      <span className="text-amber-400 font-bold font-sans-en">
                                        {westernToKhmerDigits(tagCount)} ស្លាក
                                      </span>
                                    ) : (
                                      'គ្មាន'
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Edit & Delete Action Buttons */}
                              {canCustomizeTab && (
                                <div className="flex items-center gap-1 shrink-0">
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
                                </div>
                              )}
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

              {/* Tag selector dropdown for manual tagging (ONLY VISIBLE ON TAB 3) */}
              {activeTab === 'tagger' && allTags && allTags.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-2.5 mb-3">
                  <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>🔗 ជ្រើសរើសស្លាកលេខដែលមានក្នុងប្រព័ន្ធដើម្បីដៅលើ Map ៖</span>
                  </label>
                  <select
                    value={selectedTagForPin || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedTagForPin(val);
                      if (val) {
                        const found = allTags.find((t) => String(t.tagNumber) === String(val));
                        if (found) {
                          setModalForm((prev) => ({
                            ...prev,
                            id: String(found.tagNumber),
                            name: found.name || found.location || `ស្លាកលេខ #${found.tagNumber}`,
                            category: found.baseLocation || prev.category || '🏢 ក្រុមអគារ និង កុដិ'
                          }));
                          setFormError('');
                        }
                      }
                    }}
                    className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-xs text-amber-200 focus:outline-none focus:border-amber-400 font-kantumruy"
                  >
                    <option value="">-- ជ្រើសរើសស្លាកលេខពីប្រព័ន្ធ ឬ បញ្ចូលព័ត៌មានដោយដៃ --</option>
                    {allTags
                      .filter((t) => {
                        const tagNumStr = String(t.tagNumber || '').trim().toLowerCase();
                        if (editingLoc && String(editingLoc.id || '').trim().toLowerCase() === tagNumStr) {
                          return true;
                        }
                        return !currentLocations.some(
                          (loc) => String(loc.id || '').trim().toLowerCase() === tagNumStr
                        );
                      })
                      .map((t) => (
                        <option key={t.id || t.tagNumber} value={t.tagNumber}>
                          ស្លាកលេខ {westernToKhmerDigits(t.tagNumber)} ៖ {t.name || 'គ្មានឈ្មោះ'}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    លេខ ឬ អក្សរស្លាក ៖
                  </label>
                  <input
                    type="text"
                    value={modalForm.id}
                    onChange={(e) => {
                      setModalForm((prev) => ({ ...prev, id: e.target.value }));
                      setFormError('');
                    }}
                    placeholder="ឧ. ១៧, ១៨, F, G..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
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

                {/* Label Position & Badge Color options (ONLY VISIBLE ON TAB 3) */}
                {activeTab === 'tagger' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        ទិសដៅបង្ហាញឈ្មោះស្លាក (Label Position) ៖
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
                            onClick={() => setModalForm((prev) => ({ ...prev, pos: p.key }))}
                            className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                              (modalForm.pos || 'R') === p.key
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>🎨 ជ្រើសរើសពណ៌ស្លាកលេខ (Badge Color) ៖</span>
                        <span className="text-[10px] text-amber-400 font-normal">ចុចលើពណ៌ដែលពេញចិត្ត</span>
                      </label>

                      {/* Visual Color Swatch Grid */}
                      <div className="grid grid-cols-5 gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-2xl">
                        {COLOR_SWATCHES.map((swatch) => {
                          const isSelected = (modalForm.badgeColor || 'cyan') === swatch.key;
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
                  </>
                )}
              </div>

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
                    placeholder="ឧ. កុដិព្រះសង្ឃ, សាលាឆាន់..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ជ្រើសរើសទីតាំងដាក់ចូលក្នុង Group នេះ ៖
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-1 bg-slate-950 border border-slate-800 rounded-xl p-2">
                    {currentLocations.map((loc) => {
                      const isChecked = selectedLocationIdsForGroup.includes(loc.id);
                      return (
                        <label
                          key={loc.id}
                          className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-900"
                        >
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
                            className="rounded border-slate-700 text-amber-500 focus:ring-0"
                          />
                          <span className="font-bold text-amber-400 font-moul">{loc.id}.</span>
                          <span>{loc.name}</span>
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

              {/* Checkbox List of Pins in / to add to this Group */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>📌 ជ្រើសរើស Pin ទីតាំង ដាក់ចូលក្នុង Group «{editingGroupName}» នេះ ៖</span>
                  <span className="text-[10px] text-amber-400 font-normal">គ្រីក (✓) ដើម្បីដាក់ចូល Group</span>
                </label>
                <div className="max-h-48 overflow-y-auto space-y-1 bg-slate-950 border border-slate-800 rounded-2xl p-2">
                  {currentLocations.map((loc) => {
                    const locCat = loc.category || (loc.type === 'gate' ? '⛩️ ក្រុមក្លោងទ្វារវត្ត' : '🏢 ក្រុមអគារ និង កុដិ');
                    const isInGroup = locCat === editingGroupName;

                    return (
                      <label
                        key={loc.id}
                        className={`flex items-center justify-between text-xs p-1.5 rounded-xl cursor-pointer transition-all ${
                          isInGroup
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                            : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isInGroup}
                            onChange={(e) => {
                              const targetCategory = e.target.checked ? editingGroupName : '🏢 ក្រុមអគារ និង កុដិ';
                              const { setter, saver } = getTabDataFunctions();
                              const baseLocations = activeTab === 'tagger' ? tab3Locations : locations;
                              const updated = baseLocations.map((l) =>
                                l.id === loc.id ? { ...l, category: targetCategory } : l
                              );
                              setter(updated);
                              saver(updated);
                            }}
                            className="rounded border-slate-700 text-amber-500 focus:ring-0"
                          />
                          <span className="font-bold text-amber-400 font-moul shrink-0">#{loc.id}.</span>
                          <span className="truncate">{loc.name}</span>
                        </div>

                        <span className="text-[10px] text-slate-400 shrink-0 font-sans-en">
                          {isInGroup ? '✓ ក្នុង Group នេះ' : locCat}
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
                  className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold rounded-xl transition-all"
                >
                  🗑️ លុប Group នេះ
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
