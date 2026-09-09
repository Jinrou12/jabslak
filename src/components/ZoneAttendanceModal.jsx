import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  MapPin,
  CheckCircle2,
  Clock,
  Search,
  Phone,
  PhoneCall,
  User,
  Shield,
  Filter,
  Check,
  ExternalLink,
  Map as MapIcon,
  Sparkles,
  ChevronDown,
  Lock,
  Users,
  AlertTriangle,
  Radio,
  Bell,
  AlertCircle,
  Tag
} from 'lucide-react';
import { westernToKhmerDigits, khmerToWesternDigits } from '../utils/khmerSearch';
import { getSavedTab3Locations, INITIAL_TEMPLE_LOCATIONS } from '../data/templeLocations';
import {
  subscribeToFirebaseTab3Locations,
  subscribeToTeamLiveLocations,
  saveUserLiveLocation,
  sendTeamSOSAlert,
  clearTeamSOSAlert
} from '../utils/firebase';
import { getSavedUsers } from '../utils/storage';
import { phoneTracker } from '../utils/phoneTracker';

const KHEMAVAN_CORE_ZONES = [
  'ផែន១ ៖ ធម្មសភា',
  'ផែន២ ៖ សាលាឆាន់ចាស់',
  'ផែន៣ ៖ មុខសាលាឆាន់ចាស់',
  'ផែន៤ ៖ ព្រះបរិនិព្វាន',
  'ផែន៥ ៖ បណ្ណាល័យ',
  'ផែន៦ ៖ ព្រះផ្ទម',
  'ផែន៧ ៖ តាមកុដិ',
  'ផែន៨ ៖ សាលារៀន',
  '⛩️ ក្រុមខ្លោងទ្វារវត្ត',
  '🏢 ក្រុមអគារ និង កុដិ'
];

function normalizeZoneName(zoneStr = '') {
  let norm = String(zoneStr || '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim().normalize('NFC');
  if (norm.startsWith('ដែន')) {
    norm = 'ផែន' + norm.slice(3);
  }
  if (norm.includes('ធម្មសភា') || norm.includes('ធម្មសាលា')) return 'ផែន១ ៖ ធម្មសភា';
  if (norm.includes('សាលាឆាន់ចាស់') && norm.includes('មុខ')) return 'ផែន៣ ៖ មុខសាលាឆាន់ចាស់';
  if (norm.includes('សាលាឆាន់')) return 'ផែន២ ៖ សាលាឆាន់ចាស់';
  if (norm.includes('បរិនិព្វាន') || norm.includes('វិហារ') || norm.includes('ពោធិ')) return 'ផែន៤ ៖ ព្រះបរិនិព្វាន';
  if (norm.includes('បណ្ណាល័យ')) return 'ផែន៥ ៖ បណ្ណាល័យ';
  if (norm.includes('ព្រះផ្ទម') || norm.includes('ព្រះផ្ទំ')) return 'ផែន៦ ៖ ព្រះផ្ទម';
  if (norm.includes('កុដិ')) return 'ផែន៧ ៖ តាមកុដិ';
  if (norm.includes('សាលារៀន') || norm.includes('វិទ្យុ')) return 'ផែន៨ ៖ សាលារៀន';
  if (norm.includes('ខ្លោងទ្វារ')) return '⛩️ ក្រុមខ្លោងទ្វារវត្ត';
  return norm;
}

export default function ZoneAttendanceModal({
  onClose,
  allTags = [],
  currentUser,
  currentTemple,
  onToggleStationArrival,
  onSelectTag,
  onOpenTempleMap
}) {
  const isOwner = currentUser?.role === 'owner';
  const templeId = currentTemple?.id || 'khemavan';

  // Check if current user is restricted to a specific zone (e.g. annkle@gmail.com -> ផែន១)
  const userAssignedZone = currentUser?.assignedZone && currentUser.assignedZone !== 'ALL'
    ? normalizeZoneName(currentUser.assignedZone)
    : '';

  // Zone Admin is strictly restricted to their assigned zone!
  const isZoneRestricted = Boolean(userAssignedZone) && !isOwner;

  // Active selected zone (fixed to assigned zone if restricted, else defaults to assigned or Zone 1)
  const [selectedZone, setSelectedZone] = useState(() => {
    if (userAssignedZone) return userAssignedZone;
    return 'ផែន១ ៖ ធម្មសភា';
  });

  // Subscribe to Tab 3 map pins so tags are linked to their actual pinned zone
  const [tab3Pins, setTab3Pins] = useState(() => getSavedTab3Locations(templeId));

  useEffect(() => {
    const unsub = subscribeToFirebaseTab3Locations(
      (pins) => {
        if (Array.isArray(pins) && pins.length > 0) {
          setTab3Pins(pins);
        }
      },
      null,
      templeId
    );
    return () => unsub();
  }, [templeId]);

  // Pre-compute tagNumber -> Pin lookup for O(1) matching
  const pinByTag = useMemo(() => {
    const map = new Map();
    tab3Pins.forEach((p) => {
      if (p.tagNumber) {
        map.set(String(p.tagNumber).trim(), p);
      }
      if (p.tagNumbers && Array.isArray(p.tagNumbers)) {
        p.tagNumbers.forEach((n) => map.set(String(n).trim(), p));
      }
    });
    return map;
  }, [tab3Pins]);

  // Helper to determine exact zone of any tag
  const getTagZone = (tag) => {
    const tagNo = String(tag.tagNumber || '').trim();
    if (tagNo && pinByTag.has(tagNo)) {
      const pin = pinByTag.get(tagNo);
      return normalizeZoneName(pin.category);
    }
    const loc = String(tag.baseLocation || tag.location || '').trim();
    if (loc && loc !== 'មើលទីកន្លែង' && loc !== 'មិនទាន់ដៅលើ Map' && loc !== 'ទីតាំងមិនទាន់កំណត់') {
      return normalizeZoneName(loc);
    }
    return '';
  };

  // Helper to get spot name on map
  const getTagSpotName = (tag) => {
    const tagNo = String(tag.tagNumber || '').trim();
    if (tagNo && pinByTag.has(tagNo)) {
      const pin = pinByTag.get(tagNo);
      return pin.name || pin.displayName || '';
    }
    return tag.location || tag.baseLocation || '';
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'arrived' | 'notArrived'
  const [activeSubView, setActiveSubView] = useState('owners'); // 'owners' | 'pins' | 'track'

  // Active target zone to filter
  const effectiveActiveZone = isZoneRestricted ? userAssignedZone : selectedZone;

  // Filter tags strictly belonging to the currently selected zone
  const zoneTags = useMemo(() => {
    const targetNorm = normalizeZoneName(effectiveActiveZone);
    return allTags.filter((tag) => {
      const tagZone = getTagZone(tag);
      return tagZone === targetNorm || tagZone.includes(targetNorm) || targetNorm.includes(tagZone);
    });
  }, [allTags, effectiveActiveZone, pinByTag]);

  // Compute stats for station waiting (រូបទី១) — SEPARATE from reception arrival (រូបទី២)!
  const totalInZone = zoneTags.length;
  const arrivedInZone = useMemo(() => zoneTags.filter((t) => !!t.stationArrived).length, [zoneTags]);
  const notArrivedInZone = totalInZone - arrivedInZone;
  const arrivedPercentage = totalInZone > 0 ? Math.round((arrivedInZone / totalInZone) * 100) : 0;

  // ════════ TEAM LIVE LOCATIONS & SOS ALERT SYSTEM ════════
  const [teamLiveLocations, setTeamLiveLocations] = useState([]);
  const [isSpotPickerOpen, setIsSpotPickerOpen] = useState(false);
  const [trackerState, setTrackerState] = useState(() => phoneTracker.getState());

  useEffect(() => {
    return phoneTracker.subscribe(setTrackerState);
  }, []);

  useEffect(() => {
    const unsub = subscribeToTeamLiveLocations(setTeamLiveLocations, templeId);
    return () => unsub();
  }, [templeId]);

  const allUsers = useMemo(() => getSavedUsers(), []);

  // Team members assigned to this active zone — STRICTLY only members belonging to this group!
  const zoneTeamMembers = useMemo(() => {
    const targetNorm = normalizeZoneName(effectiveActiveZone);
    const matched = allUsers.filter((u) => {
      if (u.role === 'guest') return false;
      const uZone = normalizeZoneName(u.assignedZone);
      return uZone === targetNorm || (uZone && targetNorm && uZone.includes(targetNorm));
    });

    return matched.map((member) => {
      const live = teamLiveLocations.find(
        (l) => l.userId === member.id || (l.email && l.email === member.email)
      );
      return {
        ...member,
        locationName: live?.locationName || '',
        status: live?.status || 'active',
        needHelp: Boolean(live?.needHelp),
        helpMessage: live?.helpMessage || '',
        updatedAt: live?.updatedAt || null,
        x: live?.x || 16.15,
        y: live?.y || 44.31,
        activity: live?.activity || 'stationary',
        activityText: live?.activityText || 'នៅស្ងៀម',
        speedKmh: live?.speedKmh || 0,
        stationaryMinutes: live?.stationaryMinutes || 0,
        accuracy: live?.accuracy || null
      };
    });
  }, [allUsers, teamLiveLocations, effectiveActiveZone]);

  // Active SOS alert in this zone
  const activeSosMember = useMemo(() => {
    return zoneTeamMembers.find((m) => Boolean(m.needHelp));
  }, [zoneTeamMembers]);

  // Current user's live record
  const myLiveRecord = useMemo(() => {
    return teamLiveLocations.find(
      (l) => l.userId === currentUser?.id || (l.email && l.email === currentUser?.email)
    );
  }, [teamLiveLocations, currentUser]);

  // Available spots in this zone (e.g. ធម្មសភា, តុ១...)
  const zoneAvailableSpots = useMemo(() => {
    const targetNorm = normalizeZoneName(effectiveActiveZone);
    const list = [];
    INITIAL_TEMPLE_LOCATIONS.forEach((b) => {
      if (normalizeZoneName(b.category) === targetNorm) {
        list.push({ name: b.name, x: b.x, y: b.y });
      }
    });
    tab3Pins.forEach((p) => {
      if (normalizeZoneName(p.category) === targetNorm && p.name) {
        if (!list.some((item) => item.name === p.name)) {
          list.push({ name: p.name, x: p.x, y: p.y });
        }
      }
    });
    if (list.length === 0) {
      list.push({ name: effectiveActiveZone, x: 50, y: 50 });
    }
    return list;
  }, [effectiveActiveZone, tab3Pins]);

  // Managed Pion Pins in this zone (from tab3Pins, tag pins, and temple landmarks)
  const zoneManagedPins = useMemo(() => {
    const targetNorm = normalizeZoneName(effectiveActiveZone);
    const pinMap = new Map();

    // 1. From tab3Pins placed on the map
    tab3Pins.forEach((p) => {
      const pZone = normalizeZoneName(p.category || p.zone || p.location || '');
      if (pZone === targetNorm || (pZone && targetNorm && pZone.includes(targetNorm))) {
        const key = p.name || `pin-${p.x}-${p.y}`;
        if (!pinMap.has(key)) {
          pinMap.set(key, {
            id: p.id || key,
            name: p.name || `Pion Pin (${p.tagNumber || ''})`,
            x: p.x,
            y: p.y,
            tagNumber: p.tagNumber || '',
            category: p.category || effectiveActiveZone,
            description: p.note || p.description || 'Pion Pin ដៅជាក់ស្តែងលើប្លង់',
            source: 'map'
          });
        }
      }
    });

    // 2. From pins associated with tags in this zone
    zoneTags.forEach((tag) => {
      const tagNo = String(tag.tagNumber || '').trim();
      if (tagNo && pinByTag.has(tagNo)) {
        const p = pinByTag.get(tagNo);
        const key = p.name || `tag-${tagNo}`;
        if (!pinMap.has(key)) {
          pinMap.set(key, {
            id: p.id || key,
            name: p.name || `ស្លាកលេខ ${tagNo}`,
            x: p.x,
            y: p.y,
            tagNumber: tagNo,
            ownerName: tag.name,
            category: effectiveActiveZone,
            description: `ស្លាកលេខ ${tagNo} • ${tag.name || ''}`,
            source: 'tag'
          });
        }
      }
    });

    // 3. From INITIAL_TEMPLE_LOCATIONS matching the zone
    INITIAL_TEMPLE_LOCATIONS.forEach((b) => {
      const bNorm = normalizeZoneName(b.name);
      const bCatNorm = normalizeZoneName(b.category);
      if (
        bNorm === targetNorm ||
        bCatNorm === targetNorm ||
        (targetNorm.includes('ធម្មសភា') && b.name.includes('ធម្មសាលា')) ||
        (targetNorm.includes('បរិនិព្វាន') && (b.name.includes('វិហារ') || b.name.includes('ពោធិ'))) ||
        (targetNorm.includes('បណ្ណាល័យ') && b.name.includes('បណ្ណាល័យ')) ||
        (targetNorm.includes('ព្រះផ្ទំ') && b.name.includes('ព្រះផ្ទំ'))
      ) {
        const key = b.name;
        if (!pinMap.has(key)) {
          pinMap.set(key, {
            id: b.id || key,
            name: b.name,
            x: b.x,
            y: b.y,
            category: effectiveActiveZone,
            description: 'ទីតាំងគោលក្នុងបរិវេណវត្ត',
            source: 'preset'
          });
        }
      }
    });

    // Fallback if none found
    if (pinMap.size === 0) {
      pinMap.set('default', {
        id: 'default',
        name: effectiveActiveZone,
        x: 29.02,
        y: 44.01,
        category: effectiveActiveZone,
        description: 'ទីតាំងគោលនៃផែន',
        source: 'default'
      });
    }

    return Array.from(pinMap.values());
  }, [effectiveActiveZone, tab3Pins, zoneTags, pinByTag]);

  const handleSetMyLocation = async (spot) => {
    if (!currentUser?.id) return;
    setIsSpotPickerOpen(false);
    phoneTracker.setCurrentSpot(spot);
    await saveUserLiveLocation({
      userId: currentUser.id,
      userName: currentUser.name || 'ក្រុមការងារ',
      email: currentUser.email || '',
      role: currentUser.role || 'assistant',
      assignedZone: effectiveActiveZone,
      phone: currentUser.phone || '',
      locationName: spot.name,
      x: spot.x,
      y: spot.y,
      status: 'active',
      activity: trackerState?.activity || 'stationary',
      activityText: trackerState?.activityText || 'នៅស្ងៀម',
      speedKmh: trackerState?.speedKmh || 0,
      stationaryMinutes: trackerState?.stationaryMinutes || 0,
      accuracy: trackerState?.accuracy || null,
      needHelp: myLiveRecord?.needHelp || false
    }, templeId);
  };

  const handleToggleSOS = async () => {
    if (!currentUser?.id) return;
    const isCurrentlySos = Boolean(myLiveRecord?.needHelp);
    if (!isCurrentlySos) {
      const defaultSpot = zoneAvailableSpots[0] || { name: effectiveActiveZone, x: 50, y: 50 };
      await sendTeamSOSAlert({
        userId: currentUser.id,
        userName: currentUser.name || 'ក្រុមការងារ',
        email: currentUser.email || '',
        role: currentUser.role || 'assistant',
        assignedZone: effectiveActiveZone,
        phone: currentUser.phone || '',
        locationName: myLiveRecord?.locationName || defaultSpot.name,
        x: myLiveRecord?.x || defaultSpot.x,
        y: myLiveRecord?.y || defaultSpot.y,
        helpMessage: `${currentUser.name || 'សមាជិក'} ត្រូវការជំនួយបន្ទាន់ពី Admin / ក្រុមការងារ!`
      }, templeId);
    } else {
      await clearTeamSOSAlert(currentUser.id, myLiveRecord, templeId);
    }
  };

  // Filtered tags for display based on search and status
  const displayedTags = useMemo(() => {
    let list = zoneTags;

    if (filterStatus === 'arrived') {
      list = list.filter((t) => !!t.stationArrived);
    } else if (filterStatus === 'notArrived') {
      list = list.filter((t) => !t.stationArrived);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const qWest = khmerToWesternDigits(q);
      const qKhmer = westernToKhmerDigits(q);
      list = list.filter((t) => {
        const tagNoStr = String(t.tagNumber || '');
        const tagDisp = String(t.tagNumberDisplay || '');
        const nameStr = String(t.name || '').toLowerCase();
        const phoneStr = String(t.phone || '').toLowerCase();
        const spotStr = String(getTagSpotName(t) || '').toLowerCase();
        return (
          tagNoStr.includes(q) ||
          tagNoStr.includes(qWest) ||
          tagDisp.includes(q) ||
          tagDisp.includes(qKhmer) ||
          nameStr.includes(q) ||
          phoneStr.includes(q) ||
          spotStr.includes(q)
        );
      });
    }

    return list;
  }, [zoneTags, filterStatus, searchQuery, pinByTag]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-2xl h-[94vh] sm:h-[88vh] rounded-3xl shadow-2xl relative border border-amber-500/40 flex flex-col overflow-hidden font-kantumruy">
        
        {/* ════════ HEADER ════════ */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 shrink-0 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold font-moul text-amber-400 truncate">
                  {effectiveActiveZone || 'ផែន១ ៖ ធម្មសភា'}
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.2 rounded-full font-bold shrink-0">
                  📱 Phone
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate mt-0.5">
                <span>{currentUser?.name ? `អ្នកទទួលបន្ទុក ៖ ${currentUser.name}` : 'គ្រប់គ្រងស្លាក & ទីតាំង'}</span>
                {!isZoneRestricted && (
                  <select
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    className="ml-1 bg-slate-900/90 border border-amber-500/40 rounded-lg px-2 py-0.5 text-[10px] text-amber-300 font-bold focus:outline-none focus:border-amber-400 font-kantumruy"
                  >
                    {KHEMAVAN_CORE_ZONES.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0 cursor-pointer"
            title="បិទ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ════════ 3 SUB-VIEW BUTTONS UNDER TITLE ════════ */}
        <div className="p-2 sm:p-2.5 bg-slate-950/95 border-b border-slate-800/90 shrink-0 font-kantumruy">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            
            {/* Button 1: ឈ្មោះម្ចាស់ស្លាកក្នុងផែន ១ */}
            <button
              type="button"
              onClick={() => setActiveSubView('owners')}
              className={`py-2 px-1 sm:px-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                activeSubView === 'owners'
                  ? 'bg-gradient-to-b from-amber-500/25 to-amber-500/10 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10 ring-1 ring-amber-400/40'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-1 max-w-full">
                <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-moul text-[10px] sm:text-xs truncate">
                  ឈ្មោះម្ចាស់ស្លាក
                </span>
              </div>
              <span className={`text-[9px] sm:text-[10px] px-2 py-0.2 rounded-full font-bold ${
                activeSubView === 'owners' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'bg-slate-800 text-slate-400'
              }`}>
                {westernToKhmerDigits(totalInZone)} ស្លាក
              </span>
            </button>

            {/* Button 2: បង្ហាញ pion pin ដែលខ្លួនគ្រប់គ្រង */}
            <button
              type="button"
              onClick={() => setActiveSubView('pins')}
              className={`py-2 px-1 sm:px-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                activeSubView === 'pins'
                  ? 'bg-gradient-to-b from-sky-500/25 to-sky-500/10 border-sky-400 text-sky-300 shadow-md shadow-sky-500/10 ring-1 ring-sky-400/40'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-1 max-w-full">
                <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="font-moul text-[10px] sm:text-xs truncate">
                  Pion Pin គ្រប់គ្រង
                </span>
              </div>
              <span className={`text-[9px] sm:text-[10px] px-2 py-0.2 rounded-full font-bold ${
                activeSubView === 'pins' ? 'bg-sky-400/20 text-sky-300 border border-sky-400/40' : 'bg-slate-800 text-slate-400'
              }`}>
                {westernToKhmerDigits(zoneManagedPins.length)} ទីតាំង
              </span>
            </button>

            {/* Button 3: Track Location ក្រុមការងារក្នុងក្រុម */}
            <button
              type="button"
              onClick={() => setActiveSubView('track')}
              className={`py-2 px-1 sm:px-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 relative ${
                activeSubView === 'track'
                  ? 'bg-gradient-to-b from-emerald-500/25 to-emerald-500/10 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-400/40'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              {activeSosMember && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-[9px] text-white font-bold flex items-center justify-center animate-ping">
                  !
                </span>
              )}
              <div className="flex items-center gap-1 max-w-full">
                <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-moul text-[10px] sm:text-xs truncate">
                  Track ក្រុមការងារ
                </span>
              </div>
              <span className={`text-[9px] sm:text-[10px] px-2 py-0.2 rounded-full font-bold ${
                activeSubView === 'track' ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40' : 'bg-slate-800 text-slate-400'
              }`}>
                {westernToKhmerDigits(zoneTeamMembers.length)} នាក់
              </span>
            </button>

          </div>
        </div>

        {/* ════════ SUB-VIEW 1: ឈ្មោះម្ចាស់ស្លាកក្នុងផែន ════════ */}
        {activeSubView === 'owners' && (
          <>
            {/* Stats Counter Bar */}
            <div className="grid grid-cols-3 gap-2 px-3.5 py-2 bg-slate-900/60 border-b border-slate-800 shrink-0 text-center">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
                <div className="text-[10px] text-slate-400 font-bold">សរុបក្នុងផែន</div>
                <div className="text-base sm:text-lg font-black text-slate-100 font-moul">
                  {westernToKhmerDigits(totalInZone)} <span className="text-[10px] font-normal text-slate-400 font-kantumruy">ស្លាក</span>
                </div>
              </div>

              <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-2">
                <div className="text-[10px] text-emerald-400 font-bold">បានយកស្លាក</div>
                <div className="text-base sm:text-lg font-black text-emerald-400 font-moul">
                  {westernToKhmerDigits(arrivedInZone)} <span className="text-[10px] font-normal text-emerald-300 font-kantumruy">({arrivedPercentage}%)</span>
                </div>
              </div>

              <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-2">
                <div className="text-[10px] text-amber-400 font-bold">មិនទាន់យកស្លាក</div>
                <div className="text-base sm:text-lg font-black text-amber-400 font-moul">
                  {westernToKhmerDigits(notArrivedInZone)} <span className="text-[10px] font-normal text-amber-300 font-kantumruy">ស្លាក</span>
                </div>
              </div>
            </div>

            {/* Search & Filter Chips */}
            <div className="p-3 bg-slate-950 border-b border-slate-800/80 shrink-0 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ស្វែងរកតាមលេខស្លាក ឬ ឈ្មោះម្ចាស់ស្លាក..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-kantumruy"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                    filterStatus === 'all'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  🌐 ទាំងអស់ ({westernToKhmerDigits(totalInZone)})
                </button>

                <button
                  onClick={() => setFilterStatus('arrived')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                    filterStatus === 'arrived'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                      : 'bg-slate-900 text-emerald-400 border-slate-800 hover:border-emerald-500/40'
                  }`}
                >
                  ✅ បានយកស្លាក ({westernToKhmerDigits(arrivedInZone)})
                </button>

                <button
                  onClick={() => setFilterStatus('notArrived')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                    filterStatus === 'notArrived'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-900 text-amber-400 border-slate-800 hover:border-amber-500/40'
                  }`}
                >
                  ⏳ មិនទាន់យកស្លាក ({westernToKhmerDigits(notArrivedInZone)})
                </button>
              </div>
            </div>

            {/* Tags List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
              {displayedTags.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
                  <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500 mb-2">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-300 mb-1">
                    មិនមានស្លាកលេខក្នុង «{effectiveActiveZone}» ឡើយ
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    {searchQuery
                      ? 'មិនមានលទ្ធផលផ្គូផ្គងនឹងការស្វែងរករបស់អ្នកទេ។'
                      : 'មិនទាន់មានស្លាកលេខណាដែលកំណត់ក្នុងផែននេះនៅឡើយទេ។'}
                  </p>
                </div>
              ) : (
                displayedTags.map((tag) => {
                  const isStationArrived = Boolean(tag.stationArrived);
                  const isReceptionArrived = Boolean(tag.arrived);
                  const tagDisp = tag.tagNumberDisplay || (tag.tagNumber ? westernToKhmerDigits(tag.tagNumber) : String(tag.id));
                  const cleanOwner = String(tag.name || '').replace(/^ស្លាកលេខ\s*\S+\s*៖\s*/, '').trim() || 'គ្មានឈ្មោះ';
                  const spotName = getTagSpotName(tag);

                  return (
                    <div
                      key={tag.id}
                      className={`rounded-2xl border p-3.5 transition-all shadow-md ${
                        isStationArrived
                          ? 'bg-slate-900/95 border-emerald-500/40 shadow-emerald-500/5 ring-1 ring-emerald-500/20'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Top row: Tag Badge, Name & Actions */}
                      <div className="flex items-start justify-between gap-2.5 mb-2.5">
                        <div className="flex items-start gap-2.5 min-w-0">
                          {/* Tag Number Badge */}
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-moul font-bold text-xs flex items-center justify-center shrink-0 shadow-md ring-2 ring-white/20">
                            {tagDisp}
                          </div>

                          {/* Name & Specific Location */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-sm font-bold text-slate-100 truncate font-kantumruy">
                                {cleanOwner}
                              </h4>
                              {/* Reception arrival status badge */}
                              {isReceptionArrived ? (
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded-full font-bold">
                                  ✓ ដល់វត្ត
                                </span>
                              ) : (
                                <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.2 rounded-full">
                                  មិនទាន់ដល់វត្ត
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-amber-300/90 truncate flex items-center gap-1 mt-0.5 font-sans-en">
                              <MapPin className="w-3 h-3 shrink-0 text-amber-400" />
                              <span>{spotName || effectiveActiveZone}</span>
                            </p>
                          </div>
                        </div>

                        {/* Quick Actions: Phone Call & Details */}
                        <div className="flex items-center gap-1 shrink-0">
                          {tag.phone && (
                            <a
                              href={`tel:${tag.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/40 flex items-center justify-center transition-all shadow-sm"
                              title={`ខលទៅលេខ ៖ ${tag.phone}`}
                            >
                              <PhoneCall className="w-4 h-4" />
                            </a>
                          )}

                          {onSelectTag && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onSelectTag(tag);
                              }}
                              className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-amber-400 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-all"
                              title="មើលព័ត៌មានលម្អិត"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* BOTTOM ROW: INDEPENDENT TOUCH BUTTON TO MARK "បានយកស្លាក" */}
                      <div className="pt-2 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => {
                            if (onToggleStationArrival) {
                              onToggleStationArrival(tag);
                            }
                          }}
                          className={`w-full py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-between gap-2 shadow-sm cursor-pointer ${
                            isStationArrived
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 hover:bg-emerald-500/30'
                              : 'bg-slate-800/90 text-slate-300 border border-slate-700 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/50 active:scale-[0.98]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                                isStationArrived
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm'
                                  : 'border-slate-600 bg-slate-900'
                              }`}
                            >
                              {isStationArrived && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <span className="font-moul text-[11px] sm:text-xs">
                              {isStationArrived ? '✅ បានយកស្លាករួចរាល់' : '⏳ មិនទាន់យកស្លាក (ចុចដើម្បីគ្រីស)'}
                            </span>
                          </div>

                          {tag.stationArrivedAt && isStationArrived && (
                            <span className="text-[10px] text-emerald-400/90 flex items-center gap-1 font-sans-en">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(tag.stationArrivedAt).toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ════════ SUB-VIEW 2: បង្ហាញ PION PIN ដែលខ្លួនគ្រប់គ្រង ════════ */}
        {activeSubView === 'pins' && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 font-kantumruy">
            {/* Top Action Bar for Pins */}
            <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-sky-950/60 via-slate-900 to-sky-950/60 border border-sky-500/40 rounded-2xl p-3 shadow-md">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="font-bold text-xs sm:text-sm text-sky-200 font-moul truncate">
                    Pion Pins ក្នុង{effectiveActiveZone}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  មានសរុប {westernToKhmerDigits(zoneManagedPins.length)} ទីតាំង / ចំណុចដៅលើប្លង់
                </p>
              </div>

              {onOpenTempleMap && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTempleMap({ zone: effectiveActiveZone, tab: 'tagger' });
                  }}
                  className="px-3 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
                  title="មើលលើប្លង់ផែនទីវត្ត"
                >
                  <MapIcon className="w-4 h-4" />
                  <span>មើលប្លង់ Map ធំ</span>
                </button>
              )}
            </div>

            {/* Grid of Managed Pins */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {zoneManagedPins.map((pin, idx) => (
                <div
                  key={pin.id || idx}
                  className="bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-3 transition-all shadow-md space-y-2.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          📍
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-100 truncate font-moul">
                            {pin.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 truncate block">
                            {pin.description || effectiveActiveZone}
                          </span>
                        </div>
                      </div>

                      <span className="text-[9px] bg-slate-800 text-sky-300 border border-slate-700 px-1.5 py-0.5 rounded-lg font-mono shrink-0">
                        {pin.x?.toFixed(1)}%, {pin.y?.toFixed(1)}%
                      </span>
                    </div>

                    {pin.tagNumber && (
                      <div className="mt-1.5 flex items-center gap-1">
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-md font-bold font-moul">
                          ស្លាក #{westernToKhmerDigits(pin.tagNumber)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions for this Pin */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5">
                    {onOpenTempleMap && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenTempleMap({
                            name: pin.name,
                            x: pin.x,
                            y: pin.y,
                            zone: effectiveActiveZone,
                            tab: 'tagger'
                          });
                        }}
                        className="flex-1 py-1.5 px-2.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        title="ស្វែងរកទីតាំងលើប្លង់ Map"
                      >
                        <MapIcon className="w-3.5 h-3.5" />
                        <span>រកលើ Map</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSetMyLocation(pin)}
                      className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        myLiveRecord?.locationName === pin.name
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                      title="កំណត់ថាខ្លួនកំពុងឈរនៅទីនេះ"
                    >
                      <MapPin className="w-3 h-3 text-amber-400" />
                      <span>{myLiveRecord?.locationName === pin.name ? '✓ ខ្ញុំនៅទីនេះ' : 'ខ្ញុំនៅនេះ'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════ SUB-VIEW 3: TRACK LOCATION ក្រុមការងារក្នុងក្រុម ════════ */}
        {activeSubView === 'track' && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 font-kantumruy">
            {/* Active SOS Alert Banner if anyone in this group needs help */}
            {activeSosMember && (
              <div className="bg-gradient-to-r from-rose-950/90 via-rose-900/80 to-rose-950/90 border-2 border-rose-500/90 rounded-2xl p-2.5 shadow-xl shadow-rose-950/60 flex items-center justify-between gap-2 animate-pulse">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-rose-500 text-slate-950 flex items-center justify-center font-bold text-sm shrink-0 shadow-md animate-bounce">
                    🚨
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold font-moul text-rose-200 truncate flex items-center gap-1.5">
                      <span>{activeSosMember.userName || activeSosMember.name} ត្រូវការជំនួយបន្ទាន់!</span>
                      <span className="text-[9px] bg-rose-500 text-slate-950 px-1.5 py-0.2 rounded font-extrabold font-sans-en">SOS</span>
                    </div>
                    <p className="text-[11px] text-rose-300 truncate mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0 text-rose-400" />
                      <span>ទីតាំង ៖ {activeSosMember.locationName || effectiveActiveZone}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {activeSosMember.phone && (
                    <a
                      href={`tel:${activeSosMember.phone}`}
                      className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer"
                      title={`ខលទៅ ${activeSosMember.name}`}
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">ខល</span>
                    </a>
                  )}
                  {onOpenTempleMap && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenTempleMap({
                          name: activeSosMember.locationName || effectiveActiveZone,
                          x: activeSosMember.x || 16.15,
                          y: activeSosMember.y || 44.31,
                          zone: effectiveActiveZone,
                          tab: 'team'
                        });
                      }}
                      className="px-2.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer"
                      title="ស្វែងរកទីតាំងលើ Map"
                    >
                      <MapIcon className="w-3.5 h-3.5" />
                      <span>រកលើ Map</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Phone Live GPS & Motion Detection Bar */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-2xl p-3 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center shrink-0 shadow-sm">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <span>🛰️ ចាប់ទីតាំង & ចលនា Phone (Auto GPS)</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      ដឹងស្វ័យប្រវត្តថាកំពុងដើរ ឬនៅស្ងៀម តាម Sensor ទូរស័ព្ទ
                    </p>
                  </div>
                </div>

                {/* Live Status Chip */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {trackerState?.activity === 'walking' ? (
                    <div className="px-2.5 py-1 rounded-xl bg-emerald-500/25 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-sm animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></span>
                      <span>🚶‍♂️ កំពុងដើរ ({trackerState.speedKmh || 3.2} គ.ម/ម៉)</span>
                    </div>
                  ) : (
                    <div className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      <span>🧍 នៅស្ងៀម {trackerState?.stationaryMinutes > 0 ? `(${westernToKhmerDigits(trackerState.stationaryMinutes)} នាទី)` : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Testing Simulator Buttons */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1 flex-wrap text-[10px]">
                <div className="text-slate-500 flex items-center gap-1">
                  <span>GPS ៖ ±{trackerState?.accuracy ? Math.round(trackerState.accuracy) + 'm' : 'ស្វ័យប្រវត្តិ'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 mr-1 hidden sm:inline">តេស្តសាកល្បង ៖</span>
                  <button
                    type="button"
                    onClick={() => phoneTracker.setManualOverride('walking')}
                    className={`px-2 py-0.5 rounded-lg font-bold border transition-all cursor-pointer ${
                      trackerState?.activity === 'walking' && trackerState?.isManualOverride
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-emerald-300 border-emerald-500/30'
                    }`}
                    title="តេស្តសាកល្បងដើរ"
                  >
                    🚶‍♂️ ដើរ
                  </button>
                  <button
                    type="button"
                    onClick={() => phoneTracker.setManualOverride('stationary')}
                    className={`px-2 py-0.5 rounded-lg font-bold border transition-all cursor-pointer ${
                      trackerState?.activity === 'stationary' && trackerState?.isManualOverride
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-amber-300 border-amber-500/30'
                    }`}
                    title="តេស្តសាកល្បងនៅស្ងៀម"
                  >
                    🧍 ស្ងៀម
                  </button>
                  <button
                    type="button"
                    onClick={() => phoneTracker.resetToAutoGps()}
                    className={`px-2 py-0.5 rounded-lg font-bold border transition-all cursor-pointer ${
                      !trackerState?.isManualOverride
                        ? 'bg-sky-500 text-slate-950 border-sky-400'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-sky-300 border-sky-500/30'
                    }`}
                    title="កំណត់មកប្រើ GPS & Sensor ស្វ័យប្រវត្ត"
                  >
                    🛰️ Auto GPS
                  </button>
                </div>
              </div>
            </div>

            {/* Set My Location + SOS Action Strip */}
            <div className="flex items-center justify-between gap-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200 font-moul truncate">
                  ក្រុមការងារក្នុង{effectiveActiveZone}
                </span>
                <span className="text-[11px] text-emerald-300 font-bold shrink-0">
                  ({westernToKhmerDigits(zoneTeamMembers.length)} នាក់)
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {onOpenTempleMap && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenTempleMap({ zone: effectiveActiveZone, tab: 'team' });
                    }}
                    className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-[11px] flex items-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer"
                    title="មើលទីតាំងក្រុមការងារលើប្លង់ Map"
                  >
                    <MapIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">មើល Map ធំ</span>
                  </button>
                )}

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSpotPickerOpen(!isSpotPickerOpen)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-sm"
                    title="ដៅទីតាំងដែលខ្លួនកំពុងឈរ/ចាំ"
                  >
                    <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate max-w-[110px] sm:max-w-[140px]">
                      {myLiveRecord?.locationName ? `ខ្ញុំនៅ: ${myLiveRecord.locationName}` : '📍 ដាក់ទីតាំងខ្ញុំ'}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>

                  {isSpotPickerOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-56 bg-slate-900 border border-amber-500/50 rounded-2xl shadow-2xl p-1.5 z-50 space-y-1 animate-in zoom-in-95 font-kantumruy max-h-60 overflow-y-auto">
                      <div className="text-[10px] font-bold text-amber-400/90 px-2 py-1 border-b border-slate-800 flex items-center justify-between">
                        <span>ជ្រើសរើសទីតាំងរបស់អ្នក ៖</span>
                        <button
                          type="button"
                          onClick={() => setIsSpotPickerOpen(false)}
                          className="text-slate-400 hover:text-white cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                      {zoneAvailableSpots.map((spot, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSetMyLocation(spot)}
                          className={`w-full text-left px-2.5 py-1.5 text-xs rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                            myLiveRecord?.locationName === spot.name
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'text-slate-200 hover:text-amber-300 hover:bg-slate-800'
                          }`}
                        >
                          <span className="truncate">{spot.name}</span>
                          {myLiveRecord?.locationName === spot.name && (
                            <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3] shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 🚨 SOS Alert Button */}
                <button
                  type="button"
                  onClick={handleToggleSOS}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 shadow-sm cursor-pointer ${
                    myLiveRecord?.needHelp
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/60 hover:bg-emerald-500/35'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30 animate-pulse'
                  }`}
                  title={myLiveRecord?.needHelp ? 'ចុចដើម្បីបិទ SOS' : 'ចុចដើម្បីហៅជំនួយបន្ទាន់ពី Admin / ក្រុមការងារ'}
                >
                  <span>{myLiveRecord?.needHelp ? '✅ ដក SOS' : '🚨 ហៅជំនួយ'}</span>
                </button>
              </div>
            </div>

            {/* Team Member Cards Grid (Strictly Members belonging to this group) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {zoneTeamMembers.length === 0 ? (
                <div className="text-xs text-slate-500 italic p-4 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 col-span-full">
                  មិនទាន់មានសមាជិកកំណត់ក្នុងក្រុមនេះនៅឡើយទេ
                </div>
              ) : (
                zoneTeamMembers.map((member) => {
                  const isSelf = member.id === currentUser?.id || (member.email && member.email === currentUser?.email);
                  const isSos = Boolean(member.needHelp);
                  return (
                    <div
                      key={member.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 transition-all shadow-md ${
                        isSos
                          ? 'bg-rose-950/40 border-rose-500/70 ring-1 ring-rose-500/40'
                          : 'bg-slate-900/90 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
                            isSos
                              ? 'bg-rose-500 text-slate-950 animate-bounce'
                              : member.activity === 'walking'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 animate-pulse'
                              : member.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                          }`}
                        >
                          {isSos ? '🚨' : member.activity === 'walking' ? '🚶‍♂️' : (member.name ? member.name.slice(0, 1) : 'U')}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-xs font-bold text-slate-200 truncate font-kantumruy">
                              {member.name}
                            </span>
                            {isSelf && (
                              <span className="text-[8px] bg-slate-800 text-slate-400 border border-slate-700 px-1 py-0.2 rounded">
                                ខ្ញុំ
                              </span>
                            )}
                            <span className={`text-[8px] px-1.5 py-0.2 rounded font-bold ${
                              member.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'bg-sky-500/20 text-sky-300'
                            }`}>
                              {member.role === 'admin' ? 'Admin' : 'Assistant'}
                            </span>
                          </div>
                          <div className="text-[10px] text-amber-400/90 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                            <span>{member.locationName || 'មិនទាន់កំណត់ទីតាំង'}</span>
                            {isSos && <span className="text-rose-400 font-bold ml-1 animate-pulse">🚨 ត្រូវការជំនួយ!</span>}
                          </div>

                          {/* Motion & Activity Badge */}
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {member.activity === 'walking' ? (
                              <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold flex items-center gap-1 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                <span>🚶‍♂️ កំពុងដើរ {member.speedKmh ? `(${member.speedKmh} គ.ម/ម៉)` : ''}</span>
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px] font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                <span>🧍 នៅស្ងៀម {member.stationaryMinutes > 0 ? `(${westernToKhmerDigits(member.stationaryMinutes)} នាទី)` : ''}</span>
                              </span>
                            )}
                            {member.accuracy && (
                              <span className="text-[8px] text-slate-500">
                                GPS ±{Math.round(member.accuracy)}m
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {member.phone && (
                          <a
                            href={`tel:${member.phone}`}
                            className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/40 flex items-center justify-center transition-all shadow-sm"
                            title={`ខលទៅកាន់ ${member.name} (${member.phone})`}
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {onOpenTempleMap && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenTempleMap({
                                name: member.locationName || effectiveActiveZone,
                                memberName: member.name,
                                memberId: member.id,
                                x: member.x || 16.15,
                                y: member.y || 44.31,
                                zone: effectiveActiveZone,
                                tab: 'team'
                              });
                            }}
                            className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-300 hover:bg-sky-500 hover:text-slate-950 border border-sky-500/40 flex items-center justify-center transition-all cursor-pointer shadow-sm"
                            title="រកទីតាំងសមាជិកលើ Map"
                          >
                            <MapIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ════════ FOOTER ════════ */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0 flex items-center justify-between gap-2">
          <div className="text-xs text-slate-400 truncate">
            {activeSubView === 'owners' && (
              <span>បានបង្ហាញ {westernToKhmerDigits(displayedTags.length)} លើ {westernToKhmerDigits(totalInZone)} ស្លាក</span>
            )}
            {activeSubView === 'pins' && (
              <span>បានបង្ហាញ {westernToKhmerDigits(zoneManagedPins.length)} ទីតាំង Pion Pins ក្នុង{effectiveActiveZone}</span>
            )}
            {activeSubView === 'track' && (
              <span>សមាជិកក្នុងក្រុម ៖ {westernToKhmerDigits(zoneTeamMembers.length)} នាក់</span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            បិទផ្ទាំង
          </button>
        </div>

      </div>
    </div>
  );
}
