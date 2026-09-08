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
  AlertCircle
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

  // Team members assigned to this active zone
  const zoneTeamMembers = useMemo(() => {
    const targetNorm = normalizeZoneName(effectiveActiveZone);
    const matched = allUsers.filter((u) => {
      if (u.role === 'guest') return false;
      const uZone = normalizeZoneName(u.assignedZone);
      return uZone === targetNorm || uZone.includes(targetNorm) || (u.role === 'owner' && targetNorm === 'ផែន១ ៖ ធម្មសភា');
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
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold font-moul text-amber-400 truncate">
                  កត់ត្រាការយកស្លាកលេខ (រូបទី១)
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.2 rounded-full font-bold shrink-0">
                  📱 Phone
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {currentUser?.name ? `អ្នកទទួលបន្ទុក ៖ ${currentUser.name}` : 'ផ្ទាំងកត់ត្រាអ្នកបានយកស្លាកលេខតាមទីតាំង'}
                {isZoneRestricted && <span className="text-amber-300 font-bold ml-1">({userAssignedZone})</span>}
              </p>
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

        {/* ════════ ZONE SELECTOR / RESTRICTED BADGE ════════ */}
        <div className="px-3.5 py-2.5 bg-slate-950/80 border-b border-slate-800/80 shrink-0">
          {isZoneRestricted ? (
            /* Locked Zone Display for Zone Admin (annkle@gmail.com) */
            <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-amber-500/15 via-amber-500/25 to-amber-500/10 border border-amber-500/40 rounded-2xl p-2.5 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-amber-300/90 block font-kantumruy font-bold">
                    មើលតែទីតាំងដែរខ្លួនទទួលបន្ទុក
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-amber-300 font-moul truncate block">
                    {userAssignedZone}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold font-moul">
                  {westernToKhmerDigits(totalInZone)} ស្លាក
                </span>
                {onOpenTempleMap && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenTempleMap(userAssignedZone);
                    }}
                    className="p-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-xl text-xs font-bold transition-all shrink-0"
                    title="មើលផែនទីវត្ត"
                  >
                    <MapIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Dropdown Selector for Owner / General Admin */
            <>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>📍 ជ្រើសរើសផែន / ទីតាំង ៖</span>
                </label>
                <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-bold">
                  សិទ្ធិមើលគ្រប់ផែន
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="flex-1 bg-slate-900 border border-amber-500/50 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-amber-400 font-kantumruy"
                >
                  {KHEMAVAN_CORE_ZONES.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>

                {onOpenTempleMap && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenTempleMap(selectedZone);
                    }}
                    className="px-3 py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                    title="មើលផែនទីវត្ត"
                  >
                    <MapIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">មើលប្លង់ Map</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* ════════ TEAM LIVE LOCATIONS & SOS ALERT BAR ════════ */}
        <div className="px-3.5 py-2 bg-slate-950/95 border-b border-slate-800 space-y-2 shrink-0 font-kantumruy">
          {/* Active SOS Alert Banner (Displays prominent flashing alarm if someone needs help) */}
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
                        y: activeSosMember.y || 44.31
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

          {/* ════════ PHONE LIVE GPS & MOTION DETECTION BAR ════════ */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-2xl p-2.5 shadow-sm space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center shrink-0 shadow-sm">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
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

            {/* Quick Testing / Simulator Buttons */}
            <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-1 flex-wrap text-[10px]">
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

          {/* Team Members Strip */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-2.5 shadow-sm space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 min-w-0">
                <Users className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-amber-300 font-moul">ក្រុមការងារក្នុងផែន ៖</span>
                <span className="text-[11px] text-slate-400 font-bold">({westernToKhmerDigits(zoneTeamMembers.length)} នាក់)</span>
              </div>

              {/* Set My Location Button + SOS Trigger Button */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSpotPickerOpen(!isSpotPickerOpen)}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-sm"
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
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 shadow-sm cursor-pointer ${
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

            {/* Team Member Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
              {zoneTeamMembers.length === 0 ? (
                <div className="text-[11px] text-slate-500 italic p-1">
                  មិនទាន់មានសមាជិកកំណត់ក្នុងផែននេះនៅឡើយទេ
                </div>
              ) : (
                zoneTeamMembers.map((member) => {
                  const isSelf = member.id === currentUser?.id || (member.email && member.email === currentUser?.email);
                  const isSos = Boolean(member.needHelp);
                  return (
                    <div
                      key={member.id}
                      className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        isSos
                          ? 'bg-rose-950/40 border-rose-500/70 ring-1 ring-rose-500/40'
                          : 'bg-slate-950/80 border-slate-800/90'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
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
                            <span className={`text-[8px] px-1 py-0.2 rounded font-bold ${
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
                            className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/40 flex items-center justify-center transition-all shadow-sm"
                            title={`ខលទៅកាន់ ${member.name} (${member.phone})`}
                          >
                            <PhoneCall className="w-3 h-3" />
                          </a>
                        )}
                        {onOpenTempleMap && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenTempleMap({
                                name: member.locationName || effectiveActiveZone,
                                x: member.x || 16.15,
                                y: member.y || 44.31
                              });
                            }}
                            className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500 hover:text-slate-950 border border-sky-500/40 flex items-center justify-center transition-all cursor-pointer shadow-sm"
                            title="រកទីតាំងសមាជិកលើ Map"
                          >
                            <MapIcon className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ════════ STATS COUNTER BAR ════════ */}
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

        {/* ════════ SEARCH & FILTER CHIPS ════════ */}
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
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                filterStatus === 'all'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              🌐 ទាំងអស់ ({westernToKhmerDigits(totalInZone)})
            </button>

            <button
              onClick={() => setFilterStatus('arrived')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                filterStatus === 'arrived'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                  : 'bg-slate-900 text-emerald-400 border-slate-800 hover:border-emerald-500/40'
              }`}
            >
              ✅ បានយកស្លាក ({westernToKhmerDigits(arrivedInZone)})
            </button>

            <button
              onClick={() => setFilterStatus('notArrived')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                filterStatus === 'notArrived'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-slate-900 text-amber-400 border-slate-800 hover:border-amber-500/40'
              }`}
            >
              ⏳ មិនទាន់យកស្លាក ({westernToKhmerDigits(notArrivedInZone)})
            </button>
          </div>
        </div>

        {/* ════════ TAGS LIST (PHONE-OPTIMIZED CARDS) ════════ */}
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

                  {/* BOTTOM ROW: INDEPENDENT TOUCH BUTTON TO MARK "បានយកស្លាក" (រូបទី១) */}
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

        {/* ════════ FOOTER ════════ */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0 flex items-center justify-between gap-2">
          <div className="text-xs text-slate-400 truncate">
            <span>បានបង្ហាញ {westernToKhmerDigits(displayedTags.length)} លើ {westernToKhmerDigits(totalInZone)} ស្លាក</span>
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
