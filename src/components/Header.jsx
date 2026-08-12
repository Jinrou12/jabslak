import React from 'react';
import { Tag, Plus, FileSpreadsheet, Trash2, Users, MapPin, Cloud, Map as MapIcon } from 'lucide-react';
import { westernToKhmerDigits } from '../utils/khmerSearch';

export default function Header({
  totalCount,
  filteredCount,
  onOpenAddModal,
  onOpenQRScanner,
  onOpenImportExport,
  onResetData,
  onOpenLocationStats,
  onOpenCloudConfig,
  onOpenMobileConnect,
  onOpenTempleMap,
  isCloudSyncing
}) {
  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-slate-800/80 px-3 sm:px-4 py-2.5 sm:py-3 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
        
        {/* Top Row: Brand & Quick Status */}
        <div className="flex items-center justify-between gap-2">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl badge-gold flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20 shrink-0">
              <Tag className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg md:text-xl font-bold font-moul text-amber-400 tracking-wide truncate">
                  ប្រព័ន្ធគ្រប់គ្រងស្លាកលេខ
                </h1>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] sm:text-xs font-semibold px-2 py-0.2 rounded-full border border-amber-500/30 shrink-0">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-kantumruy flex items-center gap-1.5 mt-0.5 truncate">
                <span className="truncate">គ្រប់គ្រងទីតាំង និងម្ចាស់ស្លាកលេខ</span>
                <span className="inline-block w-1 h-1 rounded-full bg-slate-600 shrink-0"></span>
                <span className="text-emerald-400 flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {westernToKhmerDigits(totalCount)} នាក់
                </span>
              </p>
            </div>
          </div>

          {/* Quick Connect & Cloud Badges */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onOpenCloudConfig}
              className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all active:scale-95 border ${
                isCloudSyncing
                  ? 'bg-sky-950/80 border-sky-500/50 text-sky-300 shadow-sm shadow-sky-500/20'
                  : 'bg-slate-900/80 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
              title="ស្ថានភាព Realtime Cloud Sync"
            >
              <Cloud className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline">Cloud Sync</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </button>
          </div>
        </div>

        {/* Second Row: Main Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-0.5">
          
          {/* Main Function: 🗺️ ផែនទី/ទីតាំង Button */}
          <button
            onClick={onOpenTempleMap}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500/25 via-amber-400/20 to-sky-500/25 border-2 border-amber-400/80 hover:border-amber-300 text-amber-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold transition-all shrink-0 active:scale-95 shadow-lg shadow-amber-500/15"
            title="បើកមើលផែនទីវត្ត និងទីតាំងអន្តរកម្ម"
          >
            <MapIcon className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-moul text-xs text-amber-400 whitespace-nowrap">🗺️ ផែនទីវត្ត</span>
            <span className="bg-amber-500 text-slate-950 font-sans-en text-[10px] font-black px-1.5 py-0.2 rounded-full ml-0.5">
              ២១
            </span>
          </button>

          {/* Add Tag */}
          <button
            onClick={onOpenAddModal}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="whitespace-nowrap">បន្ថែមថ្មី</span>
          </button>

          {/* Import / Export */}
          <button
            onClick={onOpenImportExport}
            className="p-2 sm:px-3 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs sm:text-sm transition-all active:scale-95 shrink-0 flex items-center gap-1"
            title="ទាញចូល/ទាញចេញ Excel, CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">Excel/CSV</span>
          </button>

          {/* Delete All Data */}
          <button
            onClick={onResetData}
            className="p-2 bg-rose-950/60 hover:bg-rose-900/90 text-rose-400 hover:text-rose-200 border border-rose-800/80 rounded-xl text-xs transition-all shrink-0 active:scale-95 shadow-md shadow-rose-950/30"
            title="លុបទិន្នន័យទាំងអស់ (ទាំងចាស់ ទាំងថ្មី)"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
          </button>
        </div>

        {/* Third Row: Stats Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-0.5 text-xs text-slate-400">
          <button
            onClick={onOpenLocationStats}
            className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-xl px-2.5 py-1 text-[11px] text-slate-300 transition-all shrink-0 active:scale-95"
          >
            <MapPin className="w-3 h-3 text-amber-400" />
            <span>ទីតាំង ៖</span>
            <span className="text-amber-400 font-bold">២១ ទីតាំង</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1 text-[11px] text-slate-300 shrink-0">
            <Users className="w-3 h-3 text-sky-400" />
            <span>ទិន្នន័យ ៖</span>
            <span className="text-sky-300 font-bold font-sans-en">
              {westernToKhmerDigits(filteredCount)} / {westernToKhmerDigits(totalCount)}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
}
