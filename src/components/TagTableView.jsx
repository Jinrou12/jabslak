import React from 'react';
import { MapPin, Phone, Eye, User, Hash, Map as MapIcon, CheckCircle2, Circle, Lock } from 'lucide-react';
import { westernToKhmerDigits } from '../utils/khmerSearch';
import { isTagAttendanceLocked, getRemainingLockSeconds, formatRemainingTimeKhmer } from '../utils/attendanceLock';

export default function TagTableView({ tags, onSelectTag, onViewOnMap, onToggleAttendance, currentUser, uncheckingTagId }) {
  const isGuest = currentUser?.role === 'guest';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-200">
          {/* Table Header */}
          <thead className="bg-slate-950/90 text-slate-400 text-xs font-bold uppercase border-b border-slate-800 font-kantumruy">
            <tr>
              <th scope="col" className="px-4 py-3.5 text-center w-24">លេខស្លាក</th>
              <th scope="col" className="px-4 py-3.5">ឈ្មោះម្ចាស់ស្លាក</th>
              <th scope="col" className="px-4 py-3.5">ទីតាំងស្លាកលេខ (Location)</th>
              <th scope="col" className="px-4 py-3.5">លេខទូរស័ព្ទ</th>
              {!isGuest && <th scope="col" className="px-4 py-3.5 text-center">វត្តមាន (Check-in)</th>}
              <th scope="col" className="px-4 py-3.5 text-center">មើលលម្អិត</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800/80 font-kantumruy">
            {tags.map((tag) => {
              const khmerTagNo = tag.tagNumberDisplay || westernToKhmerDigits(tag.tagNumber);
              const isArrived = !!tag.arrived;
              const isPartial = !!tag.isPartialArrived;
              const tagCount = tag.count || 1;
              const isLocked = isTagAttendanceLocked(tag);
              const isAdminOrOwner = currentUser?.role === 'owner' || currentUser?.role === 'admin';
              const isUncheckingThis = uncheckingTagId === tag.id;

              return (
                <tr
                  key={tag.id}
                  onClick={() => onSelectTag(tag)}
                  className={`hover:bg-slate-800/60 cursor-pointer transition-colors group ${
                    isArrived ? 'bg-emerald-950/20' : isPartial ? 'bg-amber-950/20' : ''
                  }`}
                >
                  {/* Tag Number */}
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center bg-amber-500 text-slate-950 font-black px-2.5 py-1 rounded-xl text-xs shadow-md shadow-amber-500/20 font-kantumruy">
                      {khmerTagNo}
                    </span>
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3 font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>{tag.name ? tag.name : <span className="text-slate-400 font-normal italic text-xs">(មិនទាន់មានឈ្មោះ)</span>}</span>
                      {tagCount > 1 && (
                        <span className="bg-amber-500/20 text-amber-300 font-extrabold px-2 py-0.5 rounded-lg text-xs font-kantumruy border border-amber-500/30">
                          {westernToKhmerDigits(tagCount)} អង្គ
                        </span>
                      )}
                      {isArrived && isLocked && (
                        <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-300 border border-amber-500/35 px-1.5 py-0.5 rounded text-[10px] font-normal font-kantumruy">
                          <Lock className="w-2.5 h-2.5 text-amber-400" />
                          <span>Locked</span>
                        </span>
                      )}
                      {isArrived && isUncheckingThis && (
                        <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded text-[10px] font-bold font-kantumruy animate-pulse">
                          <span>⚠️ ចុចម្ដងទៀត (២ Click)</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Location - High visibility */}
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        if (onViewOnMap) {
                          e.stopPropagation();
                          onViewOnMap(tag.name || tag.baseLocation || tag.location);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-xl text-xs font-extrabold transition-all"
                      title="ចុចដើម្បីមើលទីតាំងលើផែនទីវត្ត"
                    >
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{(!tag.location || tag.location === 'ទីតាំងមិនទាន់កំណត់' || tag.location === 'មិនទាន់ដៅលើ Map') ? 'មើលទីកន្លែង' : tag.location}</span>
                      <MapIcon className="w-3 h-3 opacity-60 ml-1" />
                    </button>
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-3 text-xs text-slate-300 font-sans-en">
                    {tag.phone ? (
                      <span className="flex items-center gap-1 text-sky-400 font-medium">
                        <Phone className="w-3 h-3" />
                        {tag.phone}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">-</span>
                    )}
                  </td>

                  {/* 📋 Attendance / Check-in Column (Only for Owner, Admin, Assistant) */}
                  {!isGuest && (
                    <td className="px-4 py-3 text-center animate-in zoom-in-50 duration-200">
                      {onToggleAttendance && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleAttendance(tag);
                          }}
                          className={`p-1.5 rounded-xl transition-all active:scale-95 border inline-flex items-center justify-center ${
                            isArrived
                              ? isUncheckingThis
                                ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-500/40 animate-pulse'
                                : isLocked
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/30'
                                : 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 hover:text-emerald-300 border-slate-700'
                          }`}
                          title={
                            isArrived
                              ? isUncheckingThis
                                ? '⚠️ សូមចុចម្ដងទៀតដើម្បីដកគ្រីស (ចុច ២ Click ដោះគ្រីស)!'
                                : isLocked
                                ? '🔒 បានមកដល់ (Locked - ចុច ២ ដងដើម្បីដោះគ្រីស)'
                                : 'បានមកដល់ (ចុច ២ ដងដើម្បីដកគ្រីស)'
                              : 'ចុចគ្រីសដើម្បីរាយការណ៍អ្នកមកដល់'
                          }
                        >
                          {isArrived ? (
                            isUncheckingThis ? (
                              <CheckCircle2 className="w-4 h-4 text-white stroke-[3]" />
                            ) : isLocked ? (
                              <div className="relative flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                                <span className="absolute -bottom-1 -right-1 bg-slate-950 text-amber-400 p-0.5 rounded-full ring-1 ring-amber-400 shadow-sm">
                                  <Lock className="w-2 h-2 stroke-[3]" />
                                </span>
                              </div>
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[3]" />
                            )
                          ) : (
                            <Circle className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      )}
                    </td>
                  )}

                  {/* Action Button */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTag(tag);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 rounded-xl transition-all inline-flex items-center justify-center"
                      title="មើលព័ត៌មានលម្អិត"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}



