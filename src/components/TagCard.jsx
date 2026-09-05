import React from 'react';
import { MapPin, Phone, ChevronRight, User, Map as MapIcon, CheckCircle2, Circle, Volume2, Lock } from 'lucide-react';
import { westernToKhmerDigits } from '../utils/khmerSearch';
import { isTagAttendanceLocked, getRemainingLockSeconds, formatRemainingTimeKhmer } from '../utils/attendanceLock';

export default function TagCard({ tag, onSelectTag, onViewOnMap, onToggleAttendance, currentUser, uncheckingTagId }) {
  const khmerTagNo = tag.tagNumberDisplay || westernToKhmerDigits(tag.tagNumber);
  const isArrived = !!tag.arrived;
  const isPartial = !!tag.isPartialArrived;
  const isGuest = currentUser?.role === 'guest';
  const isAdminOrOwner = currentUser?.role === 'owner' || currentUser?.role === 'admin';
  const isLocked = isTagAttendanceLocked(tag);
  const isUncheckingThis = uncheckingTagId === tag.id;
  const tagCount = tag.count || 1;

  // Determine badge font size based on tag number string length
  const badgeTextSize = khmerTagNo.length > 7
    ? 'text-[10px] sm:text-xs md:text-sm'
    : khmerTagNo.length > 4
    ? 'text-xs sm:text-sm md:text-base'
    : 'text-base sm:text-lg md:text-xl';

  return (
    <div
      onClick={() => onSelectTag(tag)}
      className={`glass-card rounded-xl sm:rounded-2xl p-2.5 sm:p-4 cursor-pointer hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/15 transition-all group flex flex-col justify-between gap-2 sm:gap-3 relative overflow-hidden border ${
        isArrived
          ? 'border-emerald-500/60 bg-emerald-950/20 shadow-md shadow-emerald-500/10'
          : isPartial
          ? 'border-amber-500/60 bg-amber-950/20 shadow-md shadow-amber-500/10'
          : 'border-slate-700/80 bg-slate-900/90'
      }`}
    >
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-amber-500/10 rounded-full blur-2xl sm:blur-3xl group-hover:bg-amber-500/20 transition-all pointer-events-none"></div>

      {/* Header Row: Tag Number & Owner Name & Attendance Check-in Button */}
      <div className="flex items-start sm:items-center gap-1.5 sm:gap-3">
        {/* Tag Badge */}
        <div className="w-12 h-12 sm:w-16 sm:h-14 rounded-xl sm:rounded-2xl badge-gold flex flex-col items-center justify-center shrink-0 text-slate-950 font-extrabold shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform border border-amber-300 px-0.5 sm:px-1 text-center">
          <span className="text-[7.5px] sm:text-[9px] leading-tight font-bold font-sans-en uppercase opacity-80">ស្លាកលេខ</span>
          <span className={`${badgeTextSize} font-black font-kantumruy leading-none mt-0.5 tracking-tight`}>
            {khmerTagNo}
          </span>
        </div>

        {/* Owner Name */}
        <div className="min-w-0 flex-1">
          <div className="text-[9px] sm:text-[11px] text-slate-400 font-medium flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 min-w-0">
              <User className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">ម្ចាស់ស្លាក</span>
            </div>
            {tagCount > 1 && (
              <span className="bg-amber-500/20 text-amber-300 font-black px-1 sm:px-2 py-0.5 rounded sm:rounded-lg text-[8.5px] sm:text-[11px] font-kantumruy border border-amber-500/40 shadow-sm shrink-0">
                {westernToKhmerDigits(tagCount)}
                <span className="hidden sm:inline"> អង្គ</span>
              </span>
            )}
          </div>
          <h3 className="text-slate-100 font-bold text-xs sm:text-base md:text-lg group-hover:text-amber-400 transition-colors truncate font-kantumruy mt-0.5 leading-snug">
            {tag.name ? tag.name : <span className="text-slate-400 font-normal italic text-[10px] sm:text-sm">(គ្មានឈ្មោះ)</span>}
          </h3>
          {tag.isPhoneticMatch && (
            <div className="flex items-center gap-1 text-[8.5px] sm:text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/25 px-1 sm:px-1.5 py-0.5 rounded mt-0.5 sm:mt-1 w-fit">
              <Volume2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 shrink-0" />
              <span className="truncate">សំឡេងស្រដៀង</span>
            </div>
          )}
          {/* 🔒 Auto-Lock Status Badges */}
          {isArrived && isLocked && (
            <div className="flex items-center gap-0.5 sm:gap-1 text-[8.5px] sm:text-[10px] text-amber-300 bg-amber-500/15 border border-amber-500/35 px-1 sm:px-1.5 py-0.5 rounded mt-0.5 sm:mt-1 w-fit font-kantumruy font-semibold">
              <Lock className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-amber-400 shrink-0" />
              <span>Locked</span>
            </div>
          )}
          {isArrived && isUncheckingThis && (
            <div className="flex items-center gap-0.5 text-[8px] sm:text-[10px] text-rose-300 bg-rose-500/20 border border-rose-500/40 px-1 sm:px-1.5 py-0.5 rounded mt-0.5 sm:mt-1 w-fit font-kantumruy font-bold animate-pulse">
              <span>⚠️ ២ Click</span>
            </div>
          )}
        </div>

        {/* 📋 Report / Check-in Attendance Button (Assistant & Admin & Owner only) */}
        {!isGuest && onToggleAttendance && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleAttendance(tag);
            }}
            className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl transition-all active:scale-95 border shrink-0 animate-in zoom-in-50 duration-200 flex items-center justify-center ${
              isArrived
                ? isUncheckingThis
                  ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-500/40 animate-pulse'
                  : isLocked
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/30'
                  : 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/30'
                : isPartial
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                : 'bg-slate-800/90 text-slate-400 hover:text-emerald-300 border-slate-700 hover:border-emerald-500/50'
            }`}
            title={
              isArrived
                ? isUncheckingThis
                  ? '⚠️ សូមចុចម្ដងទៀតដើម្បីដកគ្រីស (ចុច ២ Click ដោះគ្រីស)!'
                  : isLocked
                  ? '🔒 បានមកដល់ (Locked - ចុច ២ ដងដើម្បីដោះគ្រីស)'
                  : 'បានមកដល់ (ចុច ២ ដងដើម្បីដោះគ្រីស)'
                : isPartial
                ? `បានមកដល់ ${westernToKhmerDigits(tag.arrivedCount)}/${westernToKhmerDigits(tagCount)} អង្គ (ចុចដើម្បីគ្រីសទាំងអស់)`
                : 'ចុចគ្រីសដើម្បីរាយការណ៍អ្នកបានមកដល់'
            }
          >
            {isArrived ? (
              isUncheckingThis ? (
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[3]" />
              ) : isLocked ? (
                <div className="relative flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 stroke-[2.5]" />
                  <span className="absolute -bottom-1 -right-1 sm:-bottom-1.5 sm:-right-1.5 bg-slate-950 text-amber-400 p-0.5 rounded-full ring-1 ring-amber-400 shadow-sm">
                    <Lock className="w-2 h-2 sm:w-2.5 sm:h-2.5 stroke-[3]" />
                  </span>
                </div>
              ) : (
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 stroke-[3]" />
              )
            ) : isPartial ? (
              <div className="flex items-center gap-0.5 px-0.5 sm:px-1 font-extrabold text-[8px] sm:text-[10px] text-slate-950">
                <span>{westernToKhmerDigits(tag.arrivedCount)}</span>/<span>{westernToKhmerDigits(tagCount)}</span>
              </div>
            ) : (
              <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
            )}
          </button>
        )}
      </div>

      {/* Prominent & Highlighted Location Banner Box (ទីតាំងស្លាកលេខ) */}
      <div
        onClick={(e) => {
          if (onViewOnMap) {
            e.stopPropagation();
            onViewOnMap(tag);
          }
        }}
        className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-slate-900 border border-amber-500/40 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 flex items-center justify-between gap-1.5 sm:gap-2.5 shadow-sm group-hover:border-amber-400 transition-all hover:scale-[1.01]"
        title="ចុចដើម្បីមើលទីតាំងលើផែនទីវត្ត"
      >
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
          <div className="p-1 sm:p-1.5 bg-amber-500 text-slate-950 rounded-md sm:rounded-lg shrink-0 shadow-md">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[8px] sm:text-[10px] text-amber-400 font-extrabold uppercase tracking-wider block font-kantumruy leading-tight truncate">
              ទីតាំងស្លាកលេខ <span className="hidden sm:inline">(LOCATION)</span>
            </span>
            <span className="text-[10.5px] sm:text-xs md:text-sm font-extrabold text-amber-200 truncate block font-kantumruy leading-tight mt-0.5">
              {(!tag.location || tag.location === 'ទីតាំងមិនទាន់កំណត់' || tag.location === 'មិនទាន់ដៅលើ Map') ? 'មើលទីកន្លែង' : tag.location}
            </span>
          </div>
        </div>

        {onViewOnMap && (
          <div className="flex items-center gap-0.5 sm:gap-1 text-[8.5px] sm:text-[10px] font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg border border-amber-500/30 shrink-0 transition-all font-kantumruy">
            <MapIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden sm:inline">ផែនទី</span>
          </div>
        )}
      </div>

      {/* Footer Row: Phone & Action Arrow */}
      <div className="flex items-center justify-between gap-1 sm:gap-2 pt-1 border-t border-slate-800/80 text-[9.5px] sm:text-xs text-slate-400 font-kantumruy">
        <div className="flex items-center gap-1 sm:gap-1.5 truncate min-w-0">
          {tag.phone ? (
            <span className="flex items-center gap-0.5 sm:gap-1 text-sky-400 font-semibold font-sans-en text-[9.5px] sm:text-xs truncate">
              <Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
              <span className="truncate">{tag.phone}</span>
            </span>
          ) : (
            <span className="text-slate-500 italic text-[9px] sm:text-[11px] truncate">គ្មានលេខ</span>
          )}
        </div>

        <div className="flex items-center gap-0.5 text-amber-400 font-bold text-[9.5px] sm:text-xs group-hover:translate-x-0.5 sm:group-hover:translate-x-1 transition-transform shrink-0">
          <span>មើលលម្អិត</span>
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </div>
      </div>

    </div>
  );
}



