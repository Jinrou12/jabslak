import React from 'react';
import { MapPin, Phone, ChevronRight, User, Map as MapIcon, CheckCircle2, Circle } from 'lucide-react';
import { westernToKhmerDigits } from '../utils/khmerSearch';

export default function TagCard({ tag, onSelectTag, onViewOnMap, onToggleAttendance, currentUser }) {
  const khmerTagNo = tag.tagNumberDisplay || westernToKhmerDigits(tag.tagNumber);
  const isArrived = !!tag.arrived;
  const isPartial = !!tag.isPartialArrived;
  const isGuest = currentUser?.role === 'guest';
  const tagCount = tag.count || 1;

  // Determine badge font size based on tag number string length
  const badgeTextSize = khmerTagNo.length > 7 ? 'text-xs md:text-sm' : khmerTagNo.length > 4 ? 'text-sm md:text-base' : 'text-lg md:text-xl';

  return (
    <div
      onClick={() => onSelectTag(tag)}
      className={`glass-card rounded-2xl p-4 cursor-pointer hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/15 transition-all group flex flex-col justify-between gap-3 relative overflow-hidden border ${
        isArrived
          ? 'border-emerald-500/60 bg-emerald-950/20 shadow-md shadow-emerald-500/10'
          : isPartial
          ? 'border-amber-500/60 bg-amber-950/20 shadow-md shadow-amber-500/10'
          : 'border-slate-700/80 bg-slate-900/90'
      }`}
    >
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all pointer-events-none"></div>

      {/* Header Row: Tag Number & Owner Name & Attendance Check-in Button */}
      <div className="flex items-center gap-3">
        {/* Large Tag Badge */}
        <div className="w-16 h-14 rounded-2xl badge-gold flex flex-col items-center justify-center shrink-0 text-slate-950 font-extrabold shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform border border-amber-300 px-1 text-center">
          <span className="text-[9px] leading-tight font-bold font-sans-en uppercase opacity-80">ស្លាកលេខ</span>
          <span className={`${badgeTextSize} font-black font-kantumruy leading-none mt-0.5 tracking-tight`}>
            {khmerTagNo}
          </span>
        </div>

        {/* Owner Name */}
        <div className="min-w-0 flex-1">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>ម្ចាស់ស្លាកលេខ</span>
            </div>
            {tagCount > 1 && (
              <span className="bg-amber-500/20 text-amber-300 font-black px-2 py-0.5 rounded-lg text-[11px] font-kantumruy border border-amber-500/40 shadow-sm shrink-0">
                {westernToKhmerDigits(tagCount)} អង្គ
              </span>
            )}
          </div>
          <h3 className="text-slate-100 font-bold text-base md:text-lg group-hover:text-amber-400 transition-colors truncate font-kantumruy mt-0.5">
            {tag.name}
          </h3>
        </div>

        {/* 📋 Report / Check-in Attendance Button (Assistant & Admin & Owner only) */}
        {!isGuest && onToggleAttendance && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleAttendance(tag);
            }}
            className={`p-1.5 rounded-xl transition-all active:scale-95 border shrink-0 animate-in zoom-in-50 duration-200 flex items-center justify-center ${
              isArrived
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/30'
                : isPartial
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                : 'bg-slate-800/90 text-slate-400 hover:text-emerald-300 border-slate-700 hover:border-emerald-500/50'
            }`}
            title={
              isArrived
                ? 'បានមកដល់គ្រប់អង្គ (ចុចដើម្បីដក)'
                : isPartial
                ? `បានមកដល់ ${westernToKhmerDigits(tag.arrivedCount)}/${westernToKhmerDigits(tagCount)} អង្គ (ចុចដើម្បីគ្រីសទាំងអស់)`
                : 'ចុចគ្រីសដើម្បីរាយការណ៍អ្នកបានមកដល់'
            }
          >
            {isArrived ? (
              <CheckCircle2 className="w-5 h-5 text-slate-950 stroke-[3]" />
            ) : isPartial ? (
              <div className="flex items-center gap-0.5 px-1 font-extrabold text-[10px] text-slate-950">
                <span>{westernToKhmerDigits(tag.arrivedCount)}</span>/<span>{westernToKhmerDigits(tagCount)}</span>
              </div>
            ) : (
              <Circle className="w-5 h-5 text-slate-400" />
            )}
          </button>
        )}
      </div>

      {/* Prominent & Highlighted Location Banner Box (ទីតាំងស្លាកលេខ) */}
      <div
        onClick={(e) => {
          if (onViewOnMap) {
            e.stopPropagation();
            onViewOnMap(tag.baseLocation || tag.location);
          }
        }}
        className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-slate-900 border border-amber-500/40 rounded-xl p-2.5 flex items-center justify-between gap-2.5 shadow-sm group-hover:border-amber-400 transition-all hover:scale-[1.01]"
        title="ចុចដើម្បីមើលទីតាំងលើផែនទីវត្ត"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-amber-500 text-slate-950 rounded-lg shrink-0 shadow-md">
            <MapPin className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider block font-kantumruy leading-tight">
              ទីតាំងស្លាកលេខ (LOCATION)
            </span>
            <span className="text-xs md:text-sm font-extrabold text-amber-200 truncate block font-kantumruy">
              {(!tag.location || tag.location === 'ទីតាំងមិនទាន់កំណត់' || tag.location === 'មិនទាន់ដៅលើ Map') ? 'មើលទីកន្លែង' : tag.location}
            </span>
          </div>
        </div>

        {onViewOnMap && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 px-2 py-1 rounded-lg border border-amber-500/30 shrink-0 transition-all font-kantumruy">
            <MapIcon className="w-3 h-3" />
            <span>ផែនទី</span>
          </div>
        )}
      </div>

      {/* Footer Row: Phone & Action Arrow */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-xs text-slate-400 font-kantumruy">
        <div className="flex items-center gap-1.5 truncate">
          {tag.phone ? (
            <span className="flex items-center gap-1 text-sky-400 font-semibold font-sans-en">
              <Phone className="w-3 h-3" />
              {tag.phone}
            </span>
          ) : (
            <span className="text-slate-500 italic text-[11px]">គ្មានលេខទូរស័ព្ទ</span>
          )}
        </div>

        <div className="flex items-center gap-1 text-amber-400 font-bold text-xs group-hover:translate-x-1 transition-transform">
          <span>មើលលម្អិត</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

    </div>
  );
}



