import React, { useState, useMemo } from 'react';
import { X, CheckCircle2, XCircle, Search, MapPin, Phone, Download, Printer, UserCheck, Clock, Filter, Users, ArrowRightLeft, Lock } from 'lucide-react';
import * as XLSX from 'xlsx';
import { westernToKhmerDigits, khmerToWesternDigits } from '../utils/khmerSearch';
import { isTagAttendanceLocked, getRemainingLockSeconds, formatRemainingTimeKhmer } from '../utils/attendanceLock';

export default function AttendanceReportModal({ onClose, allTags, onToggleAttendance, currentUser }) {
  const [activeTab, setActiveTab] = useState('arrived'); // 'arrived' (ផ្ទាំងទី១) or 'notArrived' (ផ្ទាំងទី២) or 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocFilter, setSelectedLocFilter] = useState('ALL');

  const isAdminOrOwner = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  // Calculate summary counts
  const totalCount = allTags.length;
  const arrivedList = useMemo(() => allTags.filter((t) => !!t.arrived), [allTags]);
  const notArrivedList = useMemo(() => allTags.filter((t) => !t.arrived), [allTags]);

  const arrivedCount = arrivedList.length;
  const notArrivedCount = notArrivedList.length;

  const arrivedPercentage = totalCount > 0 ? Math.round((arrivedCount / totalCount) * 100) : 0;
  const notArrivedPercentage = totalCount > 0 ? 100 - arrivedPercentage : 0;

  // Extract unique locations for filtering
  const uniqueLocations = useMemo(() => {
    const locSet = new Set();
    allTags.forEach((t) => {
      if (t.location) locSet.add(t.location);
    });
    return Array.from(locSet).sort();
  }, [allTags]);

  // Filter tags based on active tab, search query, and location
  const filteredTags = useMemo(() => {
    let list = allTags;

    if (activeTab === 'arrived') {
      list = arrivedList;
    } else if (activeTab === 'notArrived') {
      list = notArrivedList;
    }

    if (selectedLocFilter !== 'ALL') {
      list = list.filter((t) => t.location === selectedLocFilter || (t.location && t.location.includes(selectedLocFilter)));
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;

    const normalizedQ = khmerToWesternDigits(q);

    return list.filter((t) => {
      const tagStr = String(t.tagNumber || '');
      const tagWestern = khmerToWesternDigits(tagStr);
      const nameLower = (t.name || '').toLowerCase();
      const phoneClean = (t.phone || '').replaceAll('-', '').replaceAll(' ', '');
      const locLower = (t.location || '').toLowerCase();

      return (
        tagStr.includes(q) ||
        tagWestern.includes(normalizedQ) ||
        nameLower.includes(q) ||
        phoneClean.includes(normalizedQ) ||
        locLower.includes(q)
      );
    });
  }, [allTags, arrivedList, notArrivedList, activeTab, searchQuery, selectedLocFilter]);

  // Export Arrived List to Excel
  const exportArrivedExcel = () => {
    const data = arrivedList.map((t, idx) => ({
      'ល.រ (No.)': idx + 1,
      'លេខស្លាក (Tag #)': t.tagNumber,
      'ឈ្មោះ (Name)': t.name,
      'ទីតាំង (Location)': t.location,
      'លេខទូរស័ព្ទ (Phone)': t.phone || '',
      'ពេលមកដល់ (Arrived Time)': t.arrivedAt ? new Date(t.arrivedAt).toLocaleTimeString('km-KH') : 'បានមកដល់',
      'កំណត់សម្គាល់ (Notes)': t.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'អ្នកបានមកដល់');
    XLSX.writeFile(workbook, `បញ្ជីអ្នកបានមកដល់_${arrivedCount}នាក់_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Export Not Arrived List to Excel
  const exportNotArrivedExcel = () => {
    const data = notArrivedList.map((t, idx) => ({
      'ល.រ (No.)': idx + 1,
      'លេខស្លាក (Tag #)': t.tagNumber,
      'ឈ្មោះ (Name)': t.name,
      'ទីតាំង (Location)': t.location,
      'លេខទូរស័ព្ទ (Phone)': t.phone || '',
      'កំណត់សម្គាល់ (Notes)': t.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'អ្នកមិនទាន់មកដល់');
    XLSX.writeFile(workbook, `បញ្ជីអ្នកមិនទាន់មកដល់_${notArrivedCount}នាក់_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Print Attendance Report
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-5xl rounded-3xl p-5 sm:p-6 shadow-2xl relative border border-slate-700/80 max-h-[92vh] flex flex-col font-kantumruy overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl ring-1 ring-emerald-500/30">
              <UserCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-moul text-emerald-400 flex items-center gap-2">
                <span>របាយការណ៍វត្តមានអ្នកមកដល់</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 font-sans-en px-2 py-0.5 rounded-full border border-slate-700">
                  PC Dashboard
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ចុចស្វីច (Switch) រវាង បានមកដល់ និង មិនទាន់មកដល់
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintReport}
              className="hidden sm:flex items-center gap-1.5 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700 transition-all"
              title="បោះពុម្ពរបាយការណ៍"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-all shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 🔄 Primary Dual Panel Switch Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4 shrink-0">
          
          {/* Panel 1 Switcher: Arrived List */}
          <button
            type="button"
            onClick={() => setActiveTab('arrived')}
            className={`p-4 rounded-2xl border transition-all text-left relative overflow-hidden group active:scale-[0.99] ${
              activeTab === 'arrived'
                ? 'bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xl shadow-emerald-950/50'
                : 'bg-slate-900/90 border-slate-800 hover:border-emerald-700/60 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl border ${
                  activeTab === 'arrived' ? 'bg-emerald-500 text-slate-950 border-emerald-300' : 'bg-slate-800 text-emerald-400 border-slate-700'
                }`}>
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-xs font-black text-emerald-400 block font-moul">
                    បានមកដល់
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    រាយនាមអ្នកដែលបានគ្រីសវត្តមាន
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-emerald-400 font-sans-en block leading-none">
                  {westernToKhmerDigits(arrivedCount)}
                </span>
                <span className="text-[11px] font-bold text-emerald-500 font-sans-en">
                  ({arrivedPercentage}%)
                </span>
              </div>
            </div>

            {/* Bottom highlight indicator */}
            {activeTab === 'arrived' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-400"></div>
            )}
          </button>

          {/* Panel 2 Switcher: Not Arrived List */}
          <button
            type="button"
            onClick={() => setActiveTab('notArrived')}
            className={`p-4 rounded-2xl border transition-all text-left relative overflow-hidden group active:scale-[0.99] ${
              activeTab === 'notArrived'
                ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 border-rose-500 ring-2 ring-rose-500/30 shadow-xl shadow-rose-950/50'
                : 'bg-slate-900/90 border-slate-800 hover:border-rose-800/60 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl border ${
                  activeTab === 'notArrived' ? 'bg-rose-500 text-slate-950 border-rose-300' : 'bg-slate-800 text-rose-400 border-slate-700'
                }`}>
                  <XCircle className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-xs font-black text-rose-400 block font-moul">
                    មិនទាន់មកដល់
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    រាយនាមអ្នកដែលមិនទាន់បានមកដល់
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-rose-400 font-sans-en block leading-none">
                  {westernToKhmerDigits(notArrivedCount)}
                </span>
                <span className="text-[11px] font-bold text-rose-500 font-sans-en">
                  ({notArrivedPercentage}%)
                </span>
              </div>
            </div>

            {/* Bottom highlight indicator */}
            {activeTab === 'notArrived' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-400"></div>
            )}
          </button>

        </div>

        {/* Panel Header Title Banner & Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 shrink-0 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
          
          {/* Active Panel Title */}
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${
              activeTab === 'arrived' ? 'bg-emerald-400 animate-ping' : activeTab === 'notArrived' ? 'bg-rose-400' : 'bg-amber-400'
            }`}></span>
            <h3 className={`text-sm font-bold font-moul ${
              activeTab === 'arrived' ? 'text-emerald-400' : activeTab === 'notArrived' ? 'text-rose-400' : 'text-amber-400'
            }`}>
              {activeTab === 'arrived' && `🟢 បញ្ជីរាយនាមបានមកដល់ (${westernToKhmerDigits(arrivedCount)} នាក់)`}
              {activeTab === 'notArrived' && `🔴 បញ្ជីរាយនាមមិនទាន់មកដល់ (${westernToKhmerDigits(notArrivedCount)} នាក់)`}
              {activeTab === 'all' && `📋 ទិន្នន័យស្លាកលេខសរុប (${westernToKhmerDigits(totalCount)} នាក់)`}
            </h3>

            {/* All toggle button option */}
            <button
              onClick={() => setActiveTab('all')}
              className={`text-[11px] px-2 py-0.5 rounded-lg border font-sans-en transition-all ${
                activeTab === 'all' ? 'bg-amber-500 text-slate-950 font-bold border-amber-400' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              មើលទាំងអស់ ({westernToKhmerDigits(totalCount)})
            </button>
          </div>

          {/* Quick Search & Filter Actions */}
          <div className="flex flex-wrap items-center gap-2 flex-1 max-w-lg justify-end">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ស្វែងរកឈ្មោះ, លេខស្លាក (#101), ទូរស័ព្ទ..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            {/* Location Select */}
            <select
              value={selectedLocFilter}
              onChange={(e) => setSelectedLocFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none max-w-[130px] truncate"
            >
              <option value="ALL">គ្រប់ទីតាំង</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            {/* Excel Download Button for Active Panel */}
            {activeTab === 'arrived' && (
              <button
                onClick={exportArrivedExcel}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-emerald-950/40 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ទាញយក Excel មកដល់</span>
              </button>
            )}

            {activeTab === 'notArrived' && (
              <button
                onClick={exportNotArrivedExcel}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-rose-950/40 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ទាញយក Excel មិនទាន់មកដល់</span>
              </button>
            )}

          </div>

        </div>

        {/* Detailed Attendance Table View */}
        <div className="flex-1 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950/90 no-scrollbar">
          {filteredTags.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <UserCheck className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">មិនមានទិន្នន័យក្នុងផ្ទាំងនេះឡើយ</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold font-kantumruy">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">លេខស្លាក</th>
                  <th className="py-3 px-4">ឈ្មោះម្ចាស់ស្លាក</th>
                  <th className="py-3 px-4">ទីតាំងស្នាក់នៅ</th>
                  <th className="py-3 px-4">លេខទូរស័ព្ទ</th>
                  <th className="py-3 px-4">ស្ថានភាពវត្តមាន</th>
                  <th className="py-3 px-4 text-center w-28">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-kantumruy">
                {filteredTags.map((tag) => {
                  const isArrived = !!tag.arrived;
                  const isLocked = isTagAttendanceLocked(tag);
                  const remainingSecs = isArrived && !isLocked ? getRemainingLockSeconds(tag) : 0;
                  return (
                    <tr
                      key={tag.id}
                      className={`hover:bg-slate-900/80 transition-colors ${
                        isArrived ? 'bg-emerald-950/15' : 'bg-rose-950/10'
                      }`}
                    >
                      {/* Tag Number Badge */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-extrabold font-sans-en text-xs border border-amber-500/30">
                          #{westernToKhmerDigits(tag.tagNumber)}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4 font-bold text-slate-100 text-sm">
                        {tag.name}
                        {tag.notes && (
                          <span className="block text-[11px] font-normal text-slate-400 mt-0.5 truncate max-w-xs">
                            {tag.notes}
                          </span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-amber-300 font-semibold text-[11px]">
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{tag.location}</span>
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4 font-sans-en text-slate-300">
                        {tag.phone ? (
                          <a
                            href={`tel:${tag.phone}`}
                            className="inline-flex items-center gap-1 hover:text-emerald-400 transition-colors"
                          >
                            <Phone className="w-3 h-3 text-sky-400" />
                            <span>{tag.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Arrival Status Badge */}
                      <td className="py-3 px-4">
                        {isArrived ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-600/80 text-emerald-300 font-bold text-xs flex-wrap">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>បានមកដល់</span>
                            {tag.arrivedAt && (
                              <span className="text-[10px] text-emerald-400/80 font-sans-en font-normal ml-1">
                                ({new Date(tag.arrivedAt).toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' })})
                              </span>
                            )}
                            {isLocked && (
                              <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded text-[10px] font-normal ml-1">
                                <Lock className="w-2.5 h-2.5 text-amber-400" />
                                <span>Lock Auto</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 font-semibold text-xs">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>មិនទាន់មកដល់</span>
                          </div>
                        )}
                      </td>

                      {/* Admin Toggle Action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onToggleAttendance(tag)}
                          disabled={!isAdminOrOwner && currentUser?.role === 'guest'}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm inline-flex items-center gap-1.5 ${
                            isArrived
                              ? isLocked && !isAdminOrOwner
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                                : isLocked && isAdminOrOwner
                                ? 'bg-slate-900 hover:bg-rose-950/80 text-amber-300 hover:text-rose-300 border border-amber-500/40 hover:border-rose-700'
                                : 'bg-slate-900 hover:bg-rose-950/80 text-rose-300 border border-slate-700 hover:border-rose-700'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                          }`}
                          title={
                            isArrived && isLocked && !isAdminOrOwner
                              ? '🔒 បានចាក់សោស្វ័យប្រវត្តិ (Lock Auto លើសពី ៥នាទី) - មិនអាចដកគ្រីសបានទេ សូមទាក់ទង Admin'
                              : isArrived
                              ? 'ចុចដើម្បីដកការគ្រីស'
                              : 'គ្រីសរាយការណ៍មកដល់'
                          }
                        >
                          {isArrived ? (
                            isLocked ? (
                              isAdminOrOwner ? (
                                <>
                                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                                  <span>ដកគ្រីស (Admin)</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Lock Auto</span>
                                </>
                              )
                            ) : (
                              'ដកការគ្រីស'
                            )
                          ) : (
                            '✔️ គ្រីសមកដល់'
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer Summary */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 mt-3 shrink-0 text-xs text-slate-400">
          <div>
            <span>បង្ហាញក្នុងផ្ទាំងនេះ ៖ </span>
            <span className="text-emerald-400 font-bold font-sans-en">{westernToKhmerDigits(filteredTags.length)}</span>
            <span> / {westernToKhmerDigits(totalCount)} នាក់</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold transition-all active:scale-95"
          >
            បិទ (Close)
          </button>
        </div>

      </div>
    </div>
  );
}
