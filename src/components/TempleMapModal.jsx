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
import { westernToKhmerDigits } from '../utils/khmerSearch';

const PIN_COLOR_GRADIENTS = [
  'bg-gradient-to-br from-cyan-300 via-sky-400 to-blue-500 text-slate-950 border-white ring-1 ring-sky-400/60',       // 1: Cyan Sky
  'bg-gradient-to-br from-emerald-300 via-emerald-400 to-teal-500 text-slate-950 border-white ring-1 ring-emerald-400/60', // 2: Emerald Green
  'bg-gradient-to-br from-purple-300 via-purple-400 to-indigo-500 text-slate-950 border-white ring-1 ring-purple-400/60', // 3: Purple Violet
  'bg-gradient-to-br from-rose-300 via-rose-400 to-pink-500 text-slate-950 border-white ring-1 ring-rose-400/60',       // 4: Rose Pink
  'bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 text-slate-950 border-white ring-1 ring-amber-400/60',   // 5: Amber Orange
  'bg-gradient-to-br from-fuchsia-300 via-fuchsia-400 to-pink-600 text-slate-950 border-white ring-1 ring-fuchsia-400/60', // 6: Fuchsia Magenta
  'bg-gradient-to-br from-lime-300 via-lime-400 to-emerald-500 text-slate-950 border-white ring-1 ring-lime-400/60',     // 7: Lime Green
  'bg-gradient-to-br from-indigo-300 via-indigo-400 to-blue-600 text-white border-white ring-1 ring-indigo-400/60',     // 8: Indigo Blue
  'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 text-slate-950 border-white ring-1 ring-yellow-400/60', // 9: Bright Gold
  'bg-gradient-to-br from-teal-300 via-teal-400 to-cyan-600 text-slate-950 border-white ring-1 ring-teal-400/60',       // 10: Teal Cyan
  'bg-gradient-to-br from-orange-300 via-orange-400 to-rose-500 text-slate-950 border-white ring-1 ring-orange-400/60',  // 11: Bright Orange
  'bg-gradient-to-br from-violet-300 via-violet-400 to-purple-600 text-slate-950 border-white ring-1 ring-violet-400/60',   // 12: Deep Violet
];

const STANDARD_GATES = ['A', 'B', 'C', 'D', 'E', 'a', 'b', 'c', 'd', 'e'];

const KHMER_STANDARD_LOCATIONS = [
  '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩', '១០', '១១', '១២', '១៣', '១៤', '១៥', '១៦'
];

const WESTERN_TAG_COLORS = {
  '1': 'bg-gradient-to-br from-cyan-300 via-sky-400 to-blue-500 text-slate-950 border-white ring-1 ring-sky-400/60',       // 1: Cyan Sky
  '2': 'bg-gradient-to-br from-emerald-300 via-emerald-400 to-teal-500 text-slate-950 border-white ring-1 ring-emerald-400/60', // 2: Emerald Green
  '3': 'bg-gradient-to-br from-purple-300 via-purple-400 to-indigo-500 text-slate-950 border-white ring-1 ring-purple-400/60', // 3: Purple Violet
  '4': 'bg-gradient-to-br from-rose-300 via-rose-400 to-pink-500 text-slate-950 border-white ring-1 ring-rose-400/60',       // 4: Rose Pink
  '5': 'bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 text-slate-950 border-white ring-1 ring-amber-400/60',   // 5: Amber Orange
  '6': 'bg-gradient-to-br from-fuchsia-300 via-fuchsia-400 to-pink-600 text-slate-950 border-white ring-1 ring-fuchsia-400/60', // 6: Fuchsia Magenta
  '7': 'bg-gradient-to-br from-lime-300 via-lime-400 to-emerald-500 text-slate-950 border-white ring-1 ring-lime-400/60',     // 7: Lime Green
  '8': 'bg-gradient-to-br from-indigo-300 via-indigo-400 to-blue-600 text-white border-white ring-1 ring-indigo-400/60',     // 8: Indigo Blue
  '9': 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 text-slate-950 border-white ring-1 ring-yellow-400/60', // 9: Bright Gold
  '10': 'bg-gradient-to-br from-teal-300 via-teal-400 to-cyan-600 text-slate-950 border-white ring-1 ring-teal-400/60',       // 10: Teal Cyan
  '11': 'bg-gradient-to-br from-orange-300 via-orange-400 to-rose-500 text-slate-950 border-white ring-1 ring-orange-400/60',  // 11: Bright Orange
  '12': 'bg-gradient-to-br from-violet-300 via-violet-400 to-purple-600 text-slate-950 border-white ring-1 ring-violet-400/60',   // 12: Deep Violet
  '13': 'bg-gradient-to-br from-sky-300 via-sky-400 to-indigo-600 text-slate-950 border-white ring-1 ring-sky-400/60',        // 13: Sky Blue
  '14': 'bg-gradient-to-br from-red-400 via-rose-500 to-red-600 text-white border-white ring-1 ring-rose-400/60',             // 14: Crimson Red
  '15': 'bg-gradient-to-br from-pink-300 via-fuchsia-400 to-purple-600 text-slate-950 border-white ring-1 ring-pink-400/60',   // 15: Bright Pink
  '16': 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-700 text-white border-white ring-1 ring-emerald-400/60'       // 16: Deep Green
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

export function getPinBadgeColorClass(loc, idx = 0) {
  if (!loc) return PIN_COLOR_GRADIENTS[0];

  // Custom user-selected badge color from edit modal form
  if (loc.badgeColor && COLOR_OPTION_GRADIENTS[loc.badgeColor]) {
    return COLOR_OPTION_GRADIENTS[loc.badgeColor];
  }
  
  const idStr = String(loc.id || '').trim();

  // Gates A-E: Original Gold Yellow
  if (loc.type === 'gate' || STANDARD_GATES.includes(idStr)) {
    return 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-slate-950 border-white ring-1 ring-amber-400/60';
  }

  // Khmer Temple Location Digits (១ ដល់ ១៦): Original Cyan Sky Blue
  if (KHMER_STANDARD_LOCATIONS.includes(idStr)) {
    return 'bg-gradient-to-br from-cyan-300 via-sky-400 to-blue-500 text-slate-950 border-white ring-1 ring-sky-400/60';
  }

  // Western Tag Digits (1, 2, 3...): Distinct unique color per tag number
  if (WESTERN_TAG_COLORS[idStr]) {
    return WESTERN_TAG_COLORS[idStr];
  }

  // Any other number pin (17, 18...): dynamic distinct color from palette
  let charSum = 0;
  for (let i = 0; i < idStr.length; i++) {
    charSum += idStr.charCodeAt(i);
  }
  const colorIdx = (charSum + idx) % PIN_COLOR_GRADIENTS.length;
  return PIN_COLOR_GRADIENTS[colorIdx];
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
  const canCustomizeMap = true; // Enable pin editing and customizing in Tab 2 and Tab 3 for all users

  // Tab 1 & Tab 2 share this state
  const [locations, setLocations] = useState(getSavedTempleLocations());
  // Tab 3 has its own INDEPENDENT state
  const [tab3Locations, setTab3Locations] = useState(getSavedTab3Locations());
  const [activeTab, setActiveTab] = useState('labeled'); // 'labeled' | 'interactive' | 'tagger'

  // Computed: which locations array to use based on active tab
  const currentLocations = activeTab === 'tagger' ? tab3Locations : locations;
  const [zoomScale, setZoomScale] = useState(1.0);
  const [isPinsVisible, setIsPinsVisible] = useState(true);
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

  // Panning, wheel zoom & dragging ref
  const viewportRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const hasPannedRef = useRef(false);
  const touchStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const initialPinchDistRef = useRef(null);
  const initialPinchScaleRef = useRef(1.0);
  const [draggingPinId, setDraggingPinId] = useState(null);
  const pinMovedFlagRef = useRef(false);

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

  // Focus on highlighted location if passed from parent
  useEffect(() => {
    if (highlightLocationName) {
      const match = locations.find(
        (l) =>
          l.name.toLowerCase() === highlightLocationName.toLowerCase() ||
          highlightLocationName.toLowerCase().includes(l.name.toLowerCase()) ||
          l.name.toLowerCase().includes(highlightLocationName.toLowerCase())
      );
      if (match) {
        setSelectedLocation(match);
        setActiveTab('interactive');
      }
    }
  }, [highlightLocationName, locations]);

  // Auto scroll to legend card when selected location changes
  useEffect(() => {
    if (selectedLocation) {
      const catName = selectedLocation.category || (selectedLocation.type === 'gate' ? '⛩️ ក្រុមក្លោងទ្វារវត្ត' : '🏢 ក្រុមអគារ និង កុដិ');
      setOpenAccordions((prev) => ({
        ...prev,
        [catName]: true
      }));

      setTimeout(() => {
        const el = document.getElementById(`legend-card-${selectedLocation.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 120);
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

  // Zoom handlers (clamped between 0.4x and 5.0x)
  const handleZoom = (delta) => {
    setZoomScale((prev) => {
      const next = Math.max(0.4, Math.min(5.0, parseFloat((prev + delta).toFixed(2))));
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomScale(1.0);
    if (viewportRef.current) {
      viewportRef.current.scrollLeft = 0;
      viewportRef.current.scrollTop = 0;
    }
  };

  // Wheel zoom effect on map viewport box
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const handleWheel = (e) => {
      // If Ctrl key is held or zoomed in > 1.05x, handle map zoom
      if (e.ctrlKey || e.metaKey || zoomScale > 1.05) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        setZoomScale((prev) => {
          const next = Math.max(0.4, Math.min(5.0, parseFloat((prev + delta).toFixed(2))));
          return next;
        });
      }
      // Otherwise allow default page/modal wheel scroll down to location list
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

  // Touch Panning (1 finger) & Pinch Zooming (2 fingers)
  const handleTouchStart = (e) => {
    if (draggingPinId) return;
    if (e.target.closest('.zoom-toolbar')) return;

    const pinEl = e.target.closest('.map-pin-element');
    if (pinEl && pinEl.getAttribute('data-draggable') === 'true') {
      return; // Only draggable pins block map panning
    }

    if (e.touches.length === 1) {
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
      initialPinchDistRef.current = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      initialPinchScaleRef.current = zoomScale;
    }
  };

  const handleTouchMove = (e) => {
    if (draggingPinId || !viewportRef.current) return;

    if (e.touches.length === 1 && touchStartRef.current.x) {
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasPannedRef.current = true;
        pinMovedFlagRef.current = true;
      }

      if (zoomScale > 1.0) {
        viewportRef.current.scrollLeft = touchStartRef.current.scrollLeft - dx;
        viewportRef.current.scrollTop = touchStartRef.current.scrollTop - dy;
      }
    } else if (e.touches.length === 2 && initialPinchDistRef.current) {
      if (e.cancelable) e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const scaleFactor = dist / initialPinchDistRef.current;
      const nextScale = Math.max(0.4, Math.min(5.0, parseFloat((initialPinchScaleRef.current * scaleFactor).toFixed(2))));
      setZoomScale(nextScale);
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    initialPinchDistRef.current = null;
    if (hasPannedRef.current) {
      setTimeout(() => {
        pinMovedFlagRef.current = false;
      }, 100);
    }
  };

  // Map Click (Add new pin on Tab 2 or Tab 3)
  const handleMapClick = (e) => {
    if (activeTab === 'labeled') return; // Read-only on Tab 1
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
        id: String(currentLocations.length + 1),
        name: '',
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
    if (activeTab === 'labeled') return; // Read-only on Tab 1

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
      id: String(currentLocations.length + 1),
      name: '',
      badgeColor: 'emerald',
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

    // Auto-fill location name from tag owner or tag number if user leaves it blank
    if (!name) {
      const matchedTag = allTags.find((t) => String(t.tagNumber).trim() === id);
      if (matchedTag && matchedTag.name) {
        name = matchedTag.name;
      } else {
        name = `ស្លាកលេខ ${westernToKhmerDigits(id)}`;
      }
    }

    // Check duplicate ID
    const duplicate = currentLocations.find(
      (l) => l.id.toLowerCase() === id.toLowerCase() && (!editingLoc || editingLoc.id !== l.id)
    );
    if (duplicate) {
      setFormError(`លេខ/អក្សរ «${id}» នេះមានរួចហើយ! (${duplicate.name})`);
      return;
    }

    const { setter, saver } = getTabDataFunctions();

    let updated;
    if (editingLoc && !editingLoc.isNew) {
      updated = currentLocations.map((l) =>
        l.id === editingLoc.id
          ? {
              ...l,
              id: id,
              name: name,
              badgeColor: modalForm.badgeColor || 'emerald',
              type: modalForm.badgeColor === 'gold' ? 'gate' : 'building',
              pos: modalForm.pos || 'R',
              category: modalForm.category || '🏢 ក្រុមអគារ និង កុដិ'
            }
          : l
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
        badgeColor: modalForm.badgeColor || 'emerald',
        type: modalForm.badgeColor === 'gold' ? 'gate' : 'building',
        pos: modalForm.pos || 'R',
        category: modalForm.category || '🏢 ក្រុមអគារ និង កុដិ'
      };
      updated = [...currentLocations, newPoint];
      setSelectedLocation(newPoint);
    }

    setter(updated);
    saver(updated);

    // If editing in Tab 2, also propagate to Tab 3
    if (activeTab === 'interactive') {
      setTab3Locations(updated);
      saveTab3LocationsToFirebase(updated);
    }

    setIsEditModalOpen(false);
    setEditingLoc(null);
  };

  // Delete Location (routes to correct tab data)
  const handleDeleteLocation = (id) => {
    if (window.confirm(`តើអ្នកពិតជាចង់លុបទីតាំង #${id} នេះមែនទេ?`)) {
      const { setter, saver } = getTabDataFunctions();
      const updated = currentLocations.filter((l) => l.id !== id);
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
    const updated = currentLocations.map((loc) => {
      if (selectedLocationIdsForGroup.includes(loc.id)) {
        return { ...loc, category: name };
      }
      return loc;
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

  // Filtered locations for legend list
  const filteredLegendLocations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return currentLocations.filter((loc) => {
      const matchesSearch =
        !q ||
        loc.name.toLowerCase().includes(q) ||
        loc.id.toLowerCase().includes(q) ||
        (loc.category && loc.category.toLowerCase().includes(q));
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
        <div className="px-3 sm:px-5 py-2 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Tab buttons */}
          <div className="flex items-center bg-slate-900 p-0.5 sm:p-1 rounded-2xl border border-slate-800 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={() => setActiveTab('labeled')}
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 sm:gap-2 transition-all ${
                activeTab === 'labeled'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🖼️ ផ្ទាំងទី១ ៖ ប្លង់មានឈ្មោះ</span>
            </button>

            <button
              onClick={() => setActiveTab('interactive')}
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 sm:gap-2 transition-all ${
                activeTab === 'interactive'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>📍 ផ្ទាំងទី២ ៖ អន្តរកម្ម</span>
            </button>

            <button
              onClick={() => setActiveTab('tagger')}
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 sm:gap-2 transition-all ${
                activeTab === 'tagger'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🏷️ ផ្ទាំងទី៣ ៖ ដៅស្លាកលេខលើ Map</span>
            </button>
          </div>

          {/* Eye Toggle Indicator (Keep ONLY Show/Hide button) */}
          <div className="flex items-center justify-end w-full sm:w-auto gap-2 text-xs">
            <button
              onClick={() => setIsPinsVisible(!isPinsVisible)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                isPinsVisible
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 hover:bg-sky-500/25'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25'
              }`}
            >
              {isPinsVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>{isPinsVisible ? 'បង្ហាញ Pin' : 'លាក់ Pin'}</span>
            </button>
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
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3">
          
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
                maxHeight: 'min(65vh, 600px)',
                height: zoomScale > 1.0 ? 'min(65vh, 600px)' : 'auto',
                touchAction: zoomScale > 1.0 ? 'none' : 'pan-y'
              }}
            >
              {/* Scalable Map Box */}
              <div
                ref={mapContainerRef}
                onClick={handleMapClick}
                className="relative w-full mx-auto origin-top-left transition-[width] duration-150"
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

                {/* ════════ 8 KHMER PALI COMPASS DIRECTIONS ════════ */}
                <div className="absolute inset-0 pointer-events-none z-10">
                  {TEMPLE_PALI_DIRECTIONS.map((dir) => (
                    <div
                      key={dir.key}
                      className={`absolute font-moul font-black text-[9px] sm:text-xs md:text-sm whitespace-nowrap drop-shadow-md ${dir.positionClass} ${
                        dir.type === 'cardinal'
                          ? 'text-sky-800 tracking-wider'
                          : 'text-amber-800'
                      }`}
                      style={{
                        textShadow:
                          '0 1px 0 #fff, 0 -1px 0 #fff, 1px 0 0 #fff, -1px 0 0 #fff, 0 2px 4px rgba(0,0,0,0.3)'
                      }}
                    >
                      {dir.name}
                    </div>
                  ))}
                </div>

                {/* ════════ MAP PIN MARKERS & MATHEMATICALLY LOCKED BADGES ════════ */}
                {isPinsVisible && (
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    {currentLocations.map((loc, locIdx) => {
                      const locCat = loc.category || (loc.type === 'gate' ? '⛩️ ក្រុមក្លោងទ្វារវត្ត' : '🏢 ក្រុមអគារ និង កុដិ');
                      if (hiddenCategories[locCat]) return null;

                      const isCategoryLocked = lockedCategories[locCat];
                      const isHighlighted =
                        selectedLocation?.id === loc.id ||
                        hoveredLocation?.id === loc.id ||
                        (highlightLocationName &&
                          loc.name.toLowerCase().includes(highlightLocationName.toLowerCase()));

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
                          {/* Central Anchor Wrapper: Center is locked exactly at (loc.x, loc.y) */}
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
                            } ${isHighlighted || isCurrentlyDragging ? 'scale-130 z-40' : 'z-20'}`}
                            style={{ touchAction: canDragThisPin ? 'none' : 'auto' }}
                          >
                            {/* Exact Mathematical Pin Badge Center (Rendered in ALL Tabs) */}
                            <div
                              className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center font-moul text-[8px] sm:text-[9px] md:text-[10px] font-black border sm:border-2 shadow-md shrink-0 z-10 ${getPinBadgeColorClass(
                                loc,
                                locIdx
                              )} ${
                                isHighlighted
                                  ? 'ring-2 sm:ring-4 ring-amber-400 ring-offset-1 animate-pulse'
                                  : ''
                              }`}
                            >
                              {loc.id}
                            </div>

                            {/* Floating Name Label: RENDERED ONLY IN TAB 1 (ប្លង់មានឈ្មោះ) */}
                            {activeTab === 'labeled' && (
                              <div
                                className={`absolute text-[7.5px] sm:text-[9px] md:text-[10.5px] font-bold py-0.5 px-1.5 rounded-lg border shadow-lg whitespace-nowrap pointer-events-none z-0 ${
                                  isGate
                                    ? 'bg-slate-950/92 border-amber-400/90 text-amber-200'
                                    : 'bg-slate-950/92 border-sky-400/90 text-sky-100'
                                } ${isHighlighted ? 'ring-1.5 ring-amber-400 bg-slate-950' : ''} ${
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
                                <span>{loc.name}</span>
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

            {/* ════════ FLOATING ZOOM CONTROLS ════════ */}
            <div className="zoom-toolbar absolute bottom-3 right-3 flex flex-col items-center gap-1.5 z-30 font-kantumruy">
              <div className="bg-slate-950/90 text-amber-400 border border-amber-500/50 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold text-center shadow-lg backdrop-blur-md">
                {Math.round(zoomScale * 100)}%
              </div>

              <button
                onClick={() => handleZoom(0.25)}
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl bg-slate-950/90 text-amber-400 border border-amber-500/50 flex items-center justify-center shadow-lg hover:bg-amber-500 hover:text-slate-950 transition-all active:scale-95 backdrop-blur-md"
                title="ពង្រីក (Zoom In +)"
              >
                <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={() => handleZoom(-0.25)}
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl bg-slate-950/90 text-amber-400 border border-amber-500/50 flex items-center justify-center shadow-lg hover:bg-amber-500 hover:text-slate-950 transition-all active:scale-95 backdrop-blur-md"
                title="បង្រួម (Zoom Out -)"
              >
                <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={handleResetZoom}
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl bg-slate-950/90 text-amber-400 border border-amber-500/50 flex items-center justify-center shadow-lg hover:bg-amber-500 hover:text-slate-950 transition-all active:scale-95 backdrop-blur-md"
                title="កំណត់ដើម 100% (Reset)"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Selected Location Banner Popover */}
            {selectedLocation && (
              <div className="absolute top-3 left-3 max-w-[280px] sm:max-w-sm bg-slate-950/95 border border-amber-500/60 rounded-2xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-md z-40 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-moul font-bold text-[10px] sm:text-[11px] shadow-md shrink-0 ${getPinBadgeColorClass(
                        selectedLocation
                      )}`}
                    >
                      {selectedLocation.id}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-amber-400 font-bold font-moul truncate">
                        {selectedLocation.name}
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
                    {activeTab !== 'labeled' && canCustomizeMap && (
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

                {activeTab !== 'labeled' && canCustomizeMap && (
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
                        (loc) => String(loc.id).trim().toLowerCase() === String(t.tagNumber).trim().toLowerCase()
                      );
                      if (isPinned) return false;

                      const q = searchQuery.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        String(t.tagNumber).includes(q) ||
                        (t.name && t.name.toLowerCase().includes(q)) ||
                        (t.location && t.location.toLowerCase().includes(q))
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

                  {canCustomizeMap && (
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

                      {/* Eye (Show/Hide) & Lock (Lock/Unlock Dragging) Controls for this Group */}
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
                                    {loc.name}
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

                              {/* Edit & Delete Action Buttons (Owner & Admin Only on Tab 2 & Tab 3) */}
                              {activeTab !== 'labeled' && canCustomizeMap && (
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

              {/* Tag selector dropdown for manual tagging */}
              {allTags && allTags.length > 0 && (
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
                        const tagNumStr = String(t.tagNumber).trim().toLowerCase();
                        if (editingLoc && String(editingLoc.id).trim().toLowerCase() === tagNumStr) {
                          return true;
                        }
                        return !currentLocations.some(
                          (loc) => String(loc.id).trim().toLowerCase() === tagNumStr
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
