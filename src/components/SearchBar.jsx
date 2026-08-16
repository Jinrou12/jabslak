import React from 'react';
import { Search, X, Filter, LayoutGrid, List, Map as MapIcon, CheckCircle2, XCircle, Users, Calendar } from 'lucide-react';
import { westernToKhmerDigits } from '../utils/khmerSearch';

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  selectedLocation,
  setSelectedLocation,
  attendanceFilter = 'ALL',
  setAttendanceFilter,
  totalCount = 0,
  arrivedCount = 0,
  notArrivedCount = 0,
  viewMode,
  setViewMode
}) {
  return (
    <div className="sticky top-0 sm:top-2 z-30 bg-slate-900/95 border border-slate-800/90 rounded-2xl p-3 md:p-4 shadow-2xl backdrop-blur-xl transition-all space-y-3 font-kantumruy">
      
      {/* Search Input Box & View Switcher */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none">
            <Search className="w-5 h-5" />
          </div>
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="វាយបញ្ចូលឈ្មោះ (ឧ. គុណករុណា...), លេខស្លាក (ឧ. ១, ២, ៣...), ទីតាំង ឬលេខទូរស័ព្ទ..."
            className="w-full bg-slate-950/90 border-2 border-slate-700/80 focus:border-amber-500 rounded-xl pl-11 pr-10 py-3 text-sm md:text-base text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all shadow-inner font-kantumruy"
            autoComplete="off"
          />

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-all"
              title="លុបពាក្យស្វែងរក"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* View Mode Toggle Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              viewMode === 'grid'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="ទម្រង់កាត (Grid)"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">កាត</span>
          </button>

          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              viewMode === 'table'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="ទម្រង់តារាង (Table)"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">តារាង</span>
          </button>

          <button
            onClick={() => setViewMode('map')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              viewMode === 'map'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-amber-400 hover:text-amber-200'
            }`}
            title="ទម្រង់ផែនទីវត្ត (Temple Map)"
          >
            <MapIcon className="w-4 h-4" />
            <span className="hidden sm:inline">ផែនទី</span>
          </button>
        </div>
      </div>

      {/* 🟢 Status & Attendance Filter Tabs ( ទាំងអស់ | មិនទាន់មកដល់ | បានមកដល់ ) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 pt-1">

        {/* Option 1: ALL (ទាំងអស់) */}
        <button
          onClick={() => setAttendanceFilter && setAttendanceFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 transition-all flex items-center gap-1.5 ${
            attendanceFilter === 'ALL'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 ring-2 ring-amber-400/40'
              : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>ទាំងអស់ ({westernToKhmerDigits(totalCount)})</span>
        </button>

        {/* Option 2: Not Arrived (មិនទាន់មកដល់ - Auto Hides Ticked) */}
        <button
          onClick={() => setAttendanceFilter && setAttendanceFilter('notArrived')}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 transition-all flex items-center gap-1.5 ${
            attendanceFilter === 'notArrived'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400/40'
              : 'bg-slate-950/80 text-rose-400 hover:bg-slate-800 border border-rose-500/30'
          }`}
          title="គ្រីសរាយការណ៍មកដល់ហើយ ឈ្មោះនោះនឹងត្រូវលាក់ចេញពីផ្ទាំងនេះដោយស្វ័យប្រវត្តិ"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>មិនទាន់មកដល់ ({westernToKhmerDigits(notArrivedCount)})</span>
        </button>

        {/* Option 3: Arrived Only (បានមកដល់) */}
        <button
          onClick={() => setAttendanceFilter && setAttendanceFilter('arrived')}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 transition-all flex items-center gap-1.5 ${
            attendanceFilter === 'arrived'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/40'
              : 'bg-slate-950/80 text-emerald-400 hover:bg-slate-800 border border-emerald-500/30'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>បានមកដល់ ({westernToKhmerDigits(arrivedCount)})</span>
        </button>
      </div>

    </div>
  );
}
