import React from 'react';
import { X, MapPin, Users, ChevronRight, BarChart3 } from 'lucide-react';
import { westernToKhmerDigits } from '../utils/khmerSearch';

export default function LocationStatsModal({ onClose, allTags, onSelectLocationFilter }) {
  // Count tags per location
  const locationCounts = {};
  allTags.forEach((t) => {
    const locKey = t.baseLocation || t.location.split(' (')[0] || t.location;
    locationCounts[locKey] = (locationCounts[locKey] || 0) + 1;
  });

  const sortedLocations = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-700/60 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-moul text-amber-400">
                ស្ថិតិតាមទីតាំងស្លាកលេខ
              </h2>
              <p className="text-xs text-slate-400 font-kantumruy">
                ចំនួនម្ចាស់ស្លាកដែលស្នាក់នៅតាមទីតាំងនីមួយៗ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Location list */}
        <div className="overflow-y-auto space-y-2 pr-1 flex-1 no-scrollbar">
          {sortedLocations.map(([locName, count]) => {
            const percentage = Math.round((count / (allTags.length || 1)) * 100);
            return (
              <div
                key={locName}
                onClick={() => {
                  onSelectLocationFilter(locName);
                  onClose();
                }}
                className="bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-2xl p-3 cursor-pointer transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl shrink-0 group-hover:scale-105 transition-transform">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-100 font-kantumruy truncate">
                      {locName}
                    </div>
                    <div className="w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="bg-amber-500/20 text-amber-300 font-bold px-2.5 py-1 rounded-xl text-xs font-sans-en">
                    {westernToKhmerDigits(count)} នាក់
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
