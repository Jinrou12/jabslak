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
  Hand
} from 'lucide-react';
import {
  INITIAL_TEMPLE_LOCATIONS,
  TEMPLE_PALI_DIRECTIONS,
  getSavedTempleLocations,
  saveTempleLocations,
  resetTempleLocations
} from '../data/templeLocations';
import { westernToKhmerDigits } from '../utils/khmerSearch';

export default function TempleMapModal({
  onClose,
  allTags = [],
  highlightLocationName = null,
  onFilterByLocation,
  onAddTagForLocation
}) {
  const [locations, setLocations] = useState(getSavedTempleLocations());
  const [activeTab, setActiveTab] = useState('labeled'); // 'labeled' | 'interactive' | 'tagger'
  const [isDragModeActive, setIsDragModeActive] = useState(false);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [isPinsVisible, setIsPinsVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openAccordions, setOpenAccordions] = useState({});
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [hoveredLocation, setHoveredLocation] = useState(null);

  // Edit / Add Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState(null);
  const [modalForm, setModalForm] = useState({
    id: '',
    name: '',
    type: 'building',
    category: '🏢 ក្រុមអគារ និង កុដិ'
  });
  const [formError, setFormError] = useState('');

  // Custom Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedLocationIdsForGroup, setSelectedLocationIdsForGroup] = useState([]);

  // Panning & dragging ref
  const viewportRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const [draggingPinId, setDraggingPinId] = useState(null);
  const pinMovedFlagRef = useRef(false);

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

  // Compute tag counts per temple location
  const tagCountsByLocation = useMemo(() => {
    const counts = {};
    allTags.forEach((t) => {
      const locStr = t.baseLocation || t.location || '';
      locations.forEach((loc) => {
        if (locStr.includes(loc.name) || (t.templeLocationId && t.templeLocationId === loc.id)) {
          counts[loc.id] = (counts[loc.id] || 0) + 1;
        }
      });
    });
    return counts;
  }, [allTags, locations]);

  // Categories list
  const categoryGroups = useMemo(() => {
    const groups = {};
    locations.forEach((loc) => {
      const cat = loc.category || (loc.type === 'gate' ? '⛩️ ក្រុមខ្លោងទ្វារវត្ត' : '🏢 ក្រុមអគារ និង កុដិ');
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(loc);
    });
    return groups;
  }, [locations]);

  // Zoom handlers
  const handleZoom = (delta) => {
    setZoomScale((prev) => {
      const next = Math.max(1.0, Math.min(3.0, parseFloat((prev + delta).toFixed(2))));
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

  // Viewport Panning (Mouse & Touch)
  const handleMouseDown = (e) => {
    if (zoomScale <= 1.0 || isDragModeActive || activeTab === 'tagger') return;
    if (e.target.closest('.map-pin-element') || e.target.closest('.zoom-toolbar')) return;
    setIsPanning(true);
    panStartRef.current = {
      x: e.pageX - viewportRef.current.offsetLeft,
      y: e.pageY - viewportRef.current.offsetTop,
      scrollLeft: viewportRef.current.scrollLeft,
      scrollTop: viewportRef.current.scrollTop
    };
  };

  const handleMouseMove = (e) => {
    if (!isPanning || draggingPinId || zoomScale <= 1.0) return;
    e.preventDefault();
    const x = e.pageX - viewportRef.current.offsetLeft;
    const y = e.pageY - viewportRef.current.offsetTop;
    const walkX = (x - panStartRef.current.x) * 1.5;
    const walkY = (y - panStartRef.current.y) * 1.5;
    viewportRef.current.scrollLeft = panStartRef.current.scrollLeft - walkX;
    viewportRef.current.scrollTop = panStartRef.current.scrollTop - walkY;
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Touch Panning
  const touchStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const handleTouchStart = (e) => {
    if (zoomScale <= 1.0 || isDragModeActive || activeTab === 'tagger') return;
    if (e.target.closest('.map-pin-element') || e.target.closest('.zoom-toolbar')) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.pageX,
      y: touch.pageY,
      scrollLeft: viewportRef.current.scrollLeft,
      scrollTop: viewportRef.current.scrollTop
    };
  };

  const handleTouchMove = (e) => {
    if (!touchStartRef.current.x || draggingPinId || zoomScale <= 1.0) return;
    const touch = e.touches[0];
    const dx = touch.pageX - touchStartRef.current.x;
    const dy = touch.pageY - touchStartRef.current.y;
    viewportRef.current.scrollLeft = touchStartRef.current.scrollLeft - dx;
    viewportRef.current.scrollTop = touchStartRef.current.scrollTop - dy;
  };

  // Map Click in Tab 3 (Add new pin)
  const handleMapClick = (e) => {
    if (activeTab !== 'tagger' || draggingPinId || pinMovedFlagRef.current) return;
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
    setModalForm({
      id: String(locations.length + 1),
      name: '',
      type: 'building',
      category: '🏢 ក្រុមអគារ និង កុដិ'
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Ultra-Smooth Pin Dragging (Mouse & Touch on ALL Devices)
  const handlePinDragStart = (e, loc) => {
    const canDrag = activeTab === 'tagger' || isDragModeActive;
    if (!canDrag) return;

    e.stopPropagation();
    pinMovedFlagRef.current = false;
    setDraggingPinId(loc.id);

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

        setLocations((prev) =>
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
        setLocations((prev) => {
          saveTempleLocations(prev);
          return prev;
        });
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

  // Save / Edit Location Modal
  const handleSaveLocationForm = () => {
    const id = modalForm.id.trim();
    const name = modalForm.name.trim();

    if (!id) {
      setFormError('សូមបញ្ចូលលេខ ឬ អក្សរស្លាក');
      return;
    }
    if (!name) {
      setFormError('សូមបញ្ចូលឈ្មោះទីតាំង');
      return;
    }

    // Check duplicate ID
    const duplicate = locations.find(
      (l) => l.id.toLowerCase() === id.toLowerCase() && (!editingLoc || editingLoc.id !== l.id)
    );
    if (duplicate) {
      setFormError(`លេខ/អក្សរ «${id}» នេះមានរួចហើយ! (${duplicate.name})`);
      return;
    }

    let updated;
    if (editingLoc && !editingLoc.isNew) {
      updated = locations.map((l) =>
        l.id === editingLoc.id
          ? {
              ...l,
              id: id,
              name: name,
              type: modalForm.type,
              category: modalForm.category
            }
          : l
      );
    } else {
      const newPoint = {
        id: id,
        name: name,
        x: editingLoc?.x || 50,
        y: editingLoc?.y || 50,
        type: modalForm.type,
        pos: 'R',
        category: modalForm.category
      };
      updated = [...locations, newPoint];
    }

    setLocations(updated);
    saveTempleLocations(updated);
    setIsEditModalOpen(false);
    setEditingLoc(null);
  };

  const handleDeleteLocation = (id) => {
    if (window.confirm(`តើអ្នកពិតជាចង់លុបទីតាំង #${id} នេះមែនទេ?`)) {
      const updated = locations.filter((l) => l.id !== id);
      setLocations(updated);
      saveTempleLocations(updated);
      setIsEditModalOpen(false);
      if (selectedLocation?.id === id) setSelectedLocation(null);
    }
  };

  // Reset to default
  const handleResetLocations = () => {
    if (window.confirm('តើអ្នកពិតជាចង់កំណត់ទីតាំងឡើងវិញទៅទិន្នន័យដើមទាំង ២១ ចំណុចមែនទេ?')) {
      const reset = resetTempleLocations();
      setLocations(reset);
      setSelectedLocation(null);
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(locations, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', 'temple_locations.json');
    dlAnchorElem.click();
  };

  // Import JSON
  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        const list = Array.isArray(parsed) ? parsed : parsed.locations || [];
        if (list.length > 0) {
          setLocations(list);
          saveTempleLocations(list);
          alert(`បាននាំចូលទិន្នន័យទីតាំងចំនួន ${list.length} ចំណុចដោយជោគជ័យ!`);
        }
      } catch (err) {
        alert('File មិនត្រឹមត្រូវ! សូមពិនិត្យមើលជា JSON file ឡើងវិញ។');
      }
    };
    reader.readAsText(file);
  };

  // Save Custom Category
  const handleSaveCustomCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (selectedLocationIdsForGroup.length === 0) {
      alert('សូមជ្រើសរើសយ៉ាងហោចណាស់ ១ ទីតាំង!');
      return;
    }

    const updated = locations.map((loc) => {
      if (selectedLocationIdsForGroup.includes(loc.id)) {
        return { ...loc, category: name };
      }
      return loc;
    });

    setLocations(updated);
    saveTempleLocations(updated);
    setIsCategoryModalOpen(false);
    setNewCategoryName('');
    setSelectedLocationIdsForGroup([]);
  };

  // Filtered locations for legend list
  const filteredLegendLocations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return locations.filter((loc) => {
      const matchesSearch =
        !q ||
        loc.name.toLowerCase().includes(q) ||
        loc.id.toLowerCase().includes(q) ||
        (loc.category && loc.category.toLowerCase().includes(q));
      const matchesCat =
        selectedCategory === 'all' || (loc.category || (loc.type === 'gate' ? '⛩️ ក្រុមខ្លោងទ្វារវត្ត' : '🏢 ក្រុមអគារ និង កុដិ')) === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [locations, searchQuery, selectedCategory]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[96vh] sm:max-h-[92vh] bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-kantumruy"
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
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-base md:text-lg font-bold font-moul text-amber-400 truncate">
                  ផែនទីវត្ត និង ទីតាំង
                </h2>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] sm:text-xs font-bold px-2 py-0.2 rounded-full border border-amber-500/30 shrink-0">
                  {westernToKhmerDigits(locations.length)} ទីតាំង
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate hidden sm:block">
                ប្លង់វត្តអន្តរកម្ម ទិសទាំង ៨ និងការគ្រប់គ្រងទីតាំងស្លាកលេខ
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleResetLocations}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-all active:scale-95 flex items-center gap-1"
              title="កំណត់ទីតាំងដើមឡើងវិញ"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Reset ដើម</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-all active:scale-95 flex items-center gap-1"
              title="ទាញយក File JSON នៃទីតាំង"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline">នាំចេញ</span>
            </button>

            <label className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 cursor-pointer transition-all active:scale-95 flex items-center gap-1">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">នាំចូល</span>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-all ml-0.5"
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
              <span>🖼️ ស្លាកឈ្មោះ</span>
            </button>

            <button
              onClick={() => setActiveTab('interactive')}
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 sm:gap-2 transition-all ${
                activeTab === 'interactive'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>📍 អន្តរកម្ម</span>
            </button>

            <button
              onClick={() => setActiveTab('tagger')}
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 sm:gap-2 transition-all ${
                activeTab === 'tagger'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🏷️ កែប្រែទីតាំង</span>
            </button>
          </div>

          {/* Drag Mode Toggle & Eye Toggle */}
          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 text-xs">
            
            {/* Quick Drag Mode Toggle Button */}
            <button
              onClick={() => setIsDragModeActive(!isDragModeActive)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                isDragModeActive || activeTab === 'tagger'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 animate-pulse'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-amber-400'
              }`}
              title="បើក/បិទ មុខងារចុចអូសផ្លាស់ប្តូរទីតាំងលើផែនទី"
            >
              <Hand className="w-3.5 h-3.5" />
              <span>{isDragModeActive || activeTab === 'tagger' ? '🖐️ កំពុងបើកអូស' : '🖐️ បើកអូស'}</span>
            </button>

            <button
              onClick={() => setIsPinsVisible(!isPinsVisible)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-semibold transition-all ${
                isPinsVisible
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 hover:bg-sky-500/25'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25'
              }`}
            >
              {isPinsVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{isPinsVisible ? 'បង្ហាញ' : 'លាក់'}</span>
            </button>
          </div>
        </div>

        {/* ═══════════════ MAIN CONTENT BODY (MAP & LEGEND) ═══════════════ */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3">
          
          {/* MAP CANVAS CONTAINER - Identical whole map display on Phone & PC */}
          <div className="relative rounded-2xl border-2 border-slate-700 bg-white overflow-hidden shadow-inner">
            
            {/* Viewport Box */}
            <div
              ref={viewportRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              className={`relative w-full select-none ${
                zoomScale > 1.0 ? (isPanning ? 'overflow-auto cursor-grabbing' : 'overflow-auto cursor-grab') : 'overflow-hidden cursor-default'
              }`}
              style={{
                maxHeight: zoomScale > 1.0 ? 'min(65vh, 580px)' : 'none',
                scrollBehavior: 'smooth'
              }}
            >
              {/* Scalable Map Box: Fits 100% at 1x so whole map is seen on Phone exactly like PC */}
              <div
                ref={mapContainerRef}
                onClick={handleMapClick}
                className="relative w-full mx-auto transition-transform duration-150 origin-center"
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

                {/* ════════ MAP PIN MARKERS & BADGES ════════ */}
                {isPinsVisible && (
                  <div className="absolute inset-0 z-20">
                    {locations.map((loc) => {
                      const isHighlighted =
                        selectedLocation?.id === loc.id ||
                        hoveredLocation?.id === loc.id ||
                        (highlightLocationName &&
                          loc.name.toLowerCase().includes(highlightLocationName.toLowerCase()));

                      const isGate = loc.type === 'gate';
                      const tagCount = tagCountsByLocation[loc.id] || 0;
                      const canDragThisPin = activeTab === 'tagger' || isDragModeActive;
                      const isCurrentlyDragging = draggingPinId === loc.id;

                      // TAB 1: DIRECT BADGE + LABEL TAG
                      if (activeTab === 'labeled') {
                        return (
                          <div
                            key={loc.id}
                            onMouseDown={(e) => canDragThisPin && handlePinDragStart(e, loc)}
                            onTouchStart={(e) => canDragThisPin && handlePinDragStart(e, loc)}
                            onClick={(e) => {
                              if (pinMovedFlagRef.current) return;
                              e.stopPropagation();
                              setSelectedLocation(loc);
                            }}
                            onMouseEnter={() => setHoveredLocation(loc)}
                            onMouseLeave={() => setHoveredLocation(null)}
                            className={`map-pin-element absolute flex items-center -translate-y-1/2 transition-transform duration-100 z-20 ${
                              canDragThisPin ? 'cursor-grab active:cursor-grabbing hover:scale-115' : 'cursor-pointer hover:scale-110'
                            } ${isHighlighted || isCurrentlyDragging ? 'scale-120 z-30' : ''}`}
                            style={{
                              left: `${loc.x}%`,
                              top: `${loc.y}%`,
                              transform: 'translate(-10px, -50%)',
                              touchAction: 'none'
                            }}
                          >
                            {/* Round Badge Number */}
                            <div
                              className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center font-moul text-[9px] sm:text-[10px] md:text-[11px] font-black text-slate-950 border border-white sm:border-2 shadow-md shrink-0 z-10 ${
                                isGate
                                  ? 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 ring-1 sm:ring-2 ring-amber-400/50'
                                  : 'bg-gradient-to-br from-cyan-300 via-sky-400 to-blue-500 ring-1 sm:ring-2 ring-sky-400/50'
                              } ${canDragThisPin ? 'ring-2 ring-emerald-400 animate-pulse' : ''}`}
                            >
                              {loc.id}
                            </div>

                            {/* Name Pill Tag */}
                            <div
                              className={`text-[9px] sm:text-[11px] md:text-xs font-bold px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-r-xl border shadow-xl -ml-2 pl-2.5 sm:pl-3.5 flex items-center gap-1 text-white ${
                                isGate
                                  ? 'bg-slate-950/95 border-amber-400 text-amber-200'
                                  : 'bg-slate-950/95 border-sky-400 text-sky-100'
                              } ${isHighlighted ? 'ring-2 ring-amber-400' : ''}`}
                            >
                              <span className="whitespace-nowrap">{loc.name}</span>
                              {tagCount > 0 && (
                                <span className="bg-amber-500 text-slate-950 font-sans-en text-[8px] sm:text-[9px] md:text-[10px] font-black px-1 sm:px-1.5 py-0.1 rounded-full ml-0.5">
                                  {tagCount}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // TAB 2: INTERACTIVE HOVER PIN
                      if (activeTab === 'interactive') {
                        return (
                          <div
                            key={loc.id}
                            onMouseDown={(e) => canDragThisPin && handlePinDragStart(e, loc)}
                            onTouchStart={(e) => canDragThisPin && handlePinDragStart(e, loc)}
                            onClick={(e) => {
                              if (pinMovedFlagRef.current) return;
                              e.stopPropagation();
                              setSelectedLocation(loc);
                            }}
                            onMouseEnter={() => setHoveredLocation(loc)}
                            onMouseLeave={() => setHoveredLocation(null)}
                            className={`map-pin-element absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-150 z-20 group ${
                              canDragThisPin ? 'cursor-grab active:cursor-grabbing hover:scale-130' : 'cursor-pointer hover:scale-125'
                            } ${isHighlighted || isCurrentlyDragging ? 'scale-135 z-30' : ''}`}
                            style={{
                              left: `${loc.x}%`,
                              top: `${loc.y}%`,
                              touchAction: 'none'
                            }}
                          >
                            {/* Pin Badge */}
                            <div
                              className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center font-moul text-[9px] sm:text-[10px] md:text-[11px] font-black text-slate-950 border border-white sm:border-2 shadow-xl ${
                                isGate
                                  ? 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500'
                                  : 'bg-gradient-to-br from-cyan-300 via-sky-400 to-blue-500'
                              } ${
                                isHighlighted
                                  ? 'ring-2 sm:ring-4 ring-amber-400 animate-pulse'
                                  : 'group-hover:ring-2 group-hover:ring-white'
                              } ${canDragThisPin ? 'ring-2 ring-emerald-400' : ''}`}
                            >
                              {loc.id}
                            </div>

                            {/* Floating Tooltip */}
                            <div
                              className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-slate-950/95 text-white font-bold text-[11px] sm:text-xs px-2.5 py-1 rounded-xl border shadow-2xl pointer-events-none whitespace-nowrap transition-all duration-150 z-40 ${
                                isGate ? 'border-amber-400 text-amber-200' : 'border-sky-400 text-sky-100'
                              } ${
                                isHighlighted || hoveredLocation?.id === loc.id
                                  ? 'opacity-100 scale-100'
                                  : 'opacity-0 scale-90 pointer-events-none'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="font-moul text-amber-400">[{loc.id}]</span>
                                <span>{loc.name}</span>
                                {tagCount > 0 && (
                                  <span className="bg-amber-500/30 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-md">
                                    {tagCount} ស្លាក
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // TAB 3: TAGGER / MANAGE PIN
                      if (activeTab === 'tagger') {
                        return (
                          <div
                            key={loc.id}
                            onMouseDown={(e) => handlePinDragStart(e, loc)}
                            onTouchStart={(e) => handlePinDragStart(e, loc)}
                            onClick={(e) => {
                              if (pinMovedFlagRef.current) return;
                              e.stopPropagation();
                              setEditingLoc(loc);
                              setModalForm({
                                id: loc.id,
                                name: loc.name,
                                type: loc.type || 'building',
                                category: loc.category || '🏢 ក្រុមអគារ និង កុដិ'
                              });
                              setFormError('');
                              setIsEditModalOpen(true);
                            }}
                            className={`map-pin-element absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-transform z-20 group ${
                              draggingPinId === loc.id ? 'scale-140 z-40' : 'hover:scale-125'
                            }`}
                            style={{
                              left: `${loc.x}%`,
                              top: `${loc.y}%`,
                              touchAction: 'none'
                            }}
                            title="ចុចដើម្បីកែប្រែ ឬអូសដើម្បីផ្លាស់ប្តូរទីតាំង"
                          >
                            <div
                              className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-moul text-[10px] sm:text-[11px] md:text-xs font-black text-slate-950 border border-white sm:border-2 shadow-xl ${
                                isGate
                                  ? 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500'
                                  : 'bg-gradient-to-br from-cyan-300 via-sky-400 to-blue-500'
                              } ring-2 ring-emerald-400/90 shadow-emerald-500/20`}
                            >
                              {loc.id}
                            </div>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ════════ FLOATING ZOOM CONTROLS ════════ */}
            <div className="zoom-toolbar absolute bottom-3 right-3 flex flex-col gap-1.5 z-30">
              <button
                onClick={() => handleZoom(0.25)}
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl bg-slate-950/90 text-amber-400 border border-amber-500/50 flex items-center justify-center shadow-lg hover:bg-amber-500 hover:text-slate-950 transition-all active:scale-95"
                title="ពង្រីក (Zoom In)"
              >
                <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={() => handleZoom(-0.25)}
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl bg-slate-950/90 text-amber-400 border border-amber-500/50 flex items-center justify-center shadow-lg hover:bg-amber-500 hover:text-slate-950 transition-all active:scale-95"
                title="បង្រួម (Zoom Out)"
              >
                <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={handleResetZoom}
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl bg-slate-950/90 text-amber-400 border border-amber-500/50 flex items-center justify-center shadow-lg hover:bg-amber-500 hover:text-slate-950 transition-all active:scale-95"
                title="កំណត់ដើម (Reset Scale)"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Selected Location Banner Popover */}
            {selectedLocation && (
              <div className="absolute top-3 left-3 max-w-[260px] sm:max-w-sm bg-slate-950/95 border border-amber-500/60 rounded-2xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-md z-30 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-moul font-bold text-slate-950 text-[10px] sm:text-[11px] shadow-md shrink-0 ${
                        selectedLocation.type === 'gate' ? 'badge-gold' : 'bg-sky-400 text-slate-950'
                      }`}
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
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-[10px] sm:text-[11px] text-slate-300">
                    ស្លាកលេខ ៖{' '}
                    <span className="text-amber-400 font-bold font-sans-en">
                      {tagCountsByLocation[selectedLocation.id] || 0} នាក់
                    </span>
                  </div>

                  {onFilterByLocation && (
                    <button
                      onClick={() => {
                        onFilterByLocation(selectedLocation.name);
                        onClose();
                      }}
                      className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm"
                    >
                      <Search className="w-3 h-3" />
                      <span>មើលស្លាកលេខ</span>
                    </button>
                  )}
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
                  បញ្ជីឈ្មោះទីតាំងទាំង {westernToKhmerDigits(locations.length)}
                </h3>
              </div>

              {/* Search input in legend */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ស្វែងរកទីតាំង..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-kantumruy"
                />
              </div>
            </div>

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
                🌐 ទាំងអស់ ({locations.length})
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
            </div>

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
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-amber-400">{catName}</span>
                        <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.2 rounded-full">
                          {filteredItems.length}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                          isOpen ? 'rotate-180 text-amber-400' : ''
                        }`}
                      />
                    </div>

                    {/* Accordion Content Grid */}
                    {isOpen && (
                      <div className="p-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                        {filteredItems.map((loc) => {
                          const isGate = loc.type === 'gate';
                          const tagCount = tagCountsByLocation[loc.id] || 0;
                          const isSel = selectedLocation?.id === loc.id;

                          return (
                            <div
                              key={loc.id}
                              onClick={() => {
                                setSelectedLocation(loc);
                                setHoveredLocation(loc);
                              }}
                              className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                isSel
                                  ? 'bg-amber-500/15 border-amber-500/60 shadow-md shadow-amber-500/10'
                                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/50'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-moul text-[10px] font-bold text-slate-950 shrink-0 ${
                                    isGate ? 'badge-gold' : 'bg-sky-400'
                                  }`}
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

                              {/* Tagger Tab Actions */}
                              {activeTab === 'tagger' && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingLoc(loc);
                                      setModalForm({
                                        id: loc.id,
                                        name: loc.name,
                                        type: loc.type || 'building',
                                        category: loc.category || '🏢 ក្រុមអគារ និង កុដិ'
                                      });
                                      setFormError('');
                                      setIsEditModalOpen(true);
                                    }}
                                    className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-md"
                                    title="កែប្រែ"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteLocation(loc.id);
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md"
                                    title="លុប"
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
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ក្រុមបញ្ជីឈ្មោះ (Category Group) ៖
                  </label>
                  <input
                    type="text"
                    value={modalForm.category}
                    onChange={(e) =>
                      setModalForm((prev) => ({ ...prev, category: e.target.value }))
                    }
                    placeholder="ឧ. 🏢 ក្រុមអគារ និង កុដិ, ⛩️ ក្រុមខ្លោងទ្វារវត្ត..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ប្រភេទពណ៌ស្លាក ៖
                  </label>
                  <select
                    value={modalForm.type}
                    onChange={(e) =>
                      setModalForm((prev) => ({ ...prev, type: e.target.value }))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="building">🏢 អគារ / កុដិ / ទីតាំង (ពណ៌ខៀវ Cyan)</option>
                    <option value="gate">⛩️ ក្លោងទ្វារវត្ត (ពណ៌លឿង Gold)</option>
                  </select>
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
                    {locations.map((loc) => {
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
                          <span className="font-bold text-amber-400 font-moul">[{loc.id}]</span>
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
    </div>
  );
}
