import React from 'react';
import { Search, X, Filter, LayoutGrid, List, Map as MapIcon } from 'lucide-react';
import { locationsList } from '../data/sampleData';

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  selectedLocation,
  setSelectedLocation,
  viewMode,
  setViewMode
}) {
  return (
    <div className="sticky top-0 sm:top-2 z-30 bg-slate-900/95 border border-slate-800/90 rounded-2xl p-3 md:p-4 shadow-2xl backdrop-blur-xl transition-all">
      
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

      {/* Location Filter Badges / Chips */}
      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <span className="text-xs text-slate-400 font-medium flex items-center gap-1 shrink-0 mr-1">
          <Filter className="w-3.5 h-3.5 text-amber-400" />
          <span>តម្រងទីតាំង:</span>
        </span>

        <button
          onClick={() => setSelectedLocation('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
            selectedLocation === 'ALL'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/50'
          }`}
        >
          ទាំងអស់
        </button>

        {locationsList.map((loc) => {
          const isSelected = selectedLocation === loc;
          return (
            <button
              key={loc}
              onClick={() => setSelectedLocation(loc)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/50'
              }`}
            >
              {loc}
            </button>
          );
        })}
      </div>

    </div>
  );
}
