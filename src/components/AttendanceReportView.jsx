import React, { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, Search, MapPin, Phone, Download, Printer, UserCheck, Users, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { westernToKhmerDigits, khmerToWesternDigits } from '../utils/khmerSearch';

export default function AttendanceReportView({ allTags, onToggleAttendance, currentUser, onCloseView }) {
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

  return (
    <div className="w-full space-y-4 font-kantumruy animate-in fade-in duration-200">
      
      {/* 🔄 Primary Dual Switch Cards (ផ្ទាំងស្វីច ទី១ vs ទី២) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        
        {/* Panel 1 Switcher: Arrived List (ផ្ទាំងទី១) */}
        <button
          type="button"
          onClick={() => setActiveTab('arrived')}
          className={`p-4 rounded-2xl border transition-all text-left relative overflow-hidden group active:scale-[0.99] cursor-pointer ${
            activeTab === 'arrived'
              ? 'bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xl shadow-emerald-950/40'
              : 'bg-slate-900/90 border-slate-800 hover:border-emerald-700/60 opacity-85 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${
                activeTab === 'arrived' ? 'bg-emerald-500 text-slate-950 border-emerald-300' : 'bg-slate-800 text-emerald-400 border-slate-700'
              }`}>
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-sm font-black text-emerald-400 block font-moul">
                  ផ្ទាំងទី១ ៖ អ្នកបានមកដល់
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  រាយនាមអ្នកដែលបានគ្រីសវត្តមានរួចរាល់
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center bg-gradient-to-br from-emerald-500/25 via-emerald-950/90 to-slate-950 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl border border-emerald-500/60 shadow-lg shadow-emerald-950/70 shrink-0 min-w-[100px] sm:min-w-[115px]">
              <div className="text-center font-kantumruy w-full">
                <div className="flex items-baseline justify-center gap-1 py-0.5">
                  <span className="text-3xl sm:text-4xl font-extrabold font-kantumruy text-emerald-300 tracking-normal drop-shadow-[0_2px_10px_rgba(16,185,129,0.7)] leading-normal inline-block">
                    {westernToKhmerDigits(arrivedCount)}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 font-kantumruy">នាក់</span>
                </div>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-sans-en">
                  {arrivedPercentage}% នៃសរុប
                </span>
              </div>
            </div>
          </div>

          {activeTab === 'arrived' && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-emerald-400"></div>
          )}
        </button>

        {/* Panel 2 Switcher: Not Arrived List (ផ្ទាំងទី២) */}
        <button
          type="button"
          onClick={() => setActiveTab('notArrived')}
          className={`p-4 rounded-2xl border transition-all text-left relative overflow-hidden group active:scale-[0.99] cursor-pointer ${
            activeTab === 'notArrived'
              ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 border-rose-500 ring-2 ring-rose-500/30 shadow-xl shadow-rose-950/40'
              : 'bg-slate-900/90 border-slate-800 hover:border-rose-800/60 opacity-85 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${
                activeTab === 'notArrived' ? 'bg-rose-500 text-slate-950 border-rose-300' : 'bg-slate-800 text-rose-400 border-slate-700'
              }`}>
                <XCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-sm font-black text-rose-400 block font-moul">
                  ផ្ទាំងទី២ ៖ អ្នកមិនទាន់មកដល់
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  រាយនាមអ្នកដែលមិនទាន់បានមកដល់
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center bg-gradient-to-br from-rose-500/25 via-rose-950/90 to-slate-950 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl border border-rose-500/60 shadow-lg shadow-rose-950/70 shrink-0 min-w-[100px] sm:min-w-[115px]">
              <div className="text-center font-kantumruy w-full">
                <div className="flex items-baseline justify-center gap-1 py-0.5">
                  <span className="text-3xl sm:text-4xl font-extrabold font-kantumruy text-rose-300 tracking-normal drop-shadow-[0_2px_10px_rgba(244,63,94,0.7)] leading-normal inline-block">
                    {westernToKhmerDigits(notArrivedCount)}
                  </span>
                  <span className="text-xs font-bold text-rose-400 font-kantumruy">នាក់</span>
                </div>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/25 text-rose-300 border border-rose-500/40 font-sans-en">
                  {notArrivedPercentage}% នៃសរុប
                </span>
              </div>
            </div>
          </div>

          {activeTab === 'notArrived' && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-rose-400"></div>
          )}
        </button>

      </div>

      {/* Control Bar & Search Filter (Inline on page) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-md">
        
        {/* Panel Header Title */}
        <div className="flex items-center gap-2.5">
          <span className={`w-3.5 h-3.5 rounded-full ${
            activeTab === 'arrived' ? 'bg-emerald-400 animate-ping' : activeTab === 'notArrived' ? 'bg-rose-400' : 'bg-amber-400'
          }`}></span>
          <div>
            <h3 className={`text-sm sm:text-base font-bold font-moul ${
              activeTab === 'arrived' ? 'text-emerald-400' : activeTab === 'notArrived' ? 'text-rose-400' : 'text-amber-400'
            }`}>
              {activeTab === 'arrived' && `🟢 ផ្ទាំងទី១ ៖ បញ្ជីរាយនាមអ្នកបានមកដល់ (${westernToKhmerDigits(arrivedCount)} នាក់)`}
              {activeTab === 'notArrived' && `🔴 ផ្ទាំងទី២ ៖ បញ្ជីរាយនាមអ្នកមិនទាន់មកដល់ (${westernToKhmerDigits(notArrivedCount)} នាក់)`}
              {activeTab === 'all' && `📋 បញ្ជីរាយនាមសរុបទាំងអស់ (${westernToKhmerDigits(totalCount)} នាក់)`}
            </h3>
          </div>
        </div>

        {/* Action Controls & Excel Downloads */}
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl justify-end">
          
          {/* View All Button Option */}
          <button
            onClick={() => setActiveTab(activeTab === 'all' ? 'arrived' : 'all')}
            className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition-all ${
              activeTab === 'all' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {activeTab === 'all' ? 'ត្រឡប់ទៅផ្ទាំងស្វីច' : `មើលទាំងអស់ (${westernToKhmerDigits(totalCount)})`}
          </button>

          {/* Search Box */}
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
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none max-w-[130px] truncate"
          >
            <option value="ALL">គ្រប់ទីតាំង</option>
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {/* Excel Export Button */}
          {activeTab === 'arrived' && (
            <button
              onClick={exportArrivedExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-emerald-950/40 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel មកដល់</span>
            </button>
          )}

          {activeTab === 'notArrived' && (
            <button
              onClick={exportNotArrivedExcel}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-rose-950/40 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel មិនទាន់មកដល់</span>
            </button>
          )}

        </div>

      </div>

      {/* Main Inline Attendance Table */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900/90 overflow-hidden shadow-xl">
        {filteredTags.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-kantumruy">
            <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
            <p className="text-base font-semibold">មិនមានទិន្នន័យក្នុងផ្ទាំងនេះឡើយ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold font-kantumruy">
                <tr>
                  <th className="py-3.5 px-4 w-20 text-center">លេខស្លាក</th>
                  <th className="py-3.5 px-4">ឈ្មោះម្ចាស់ស្លាក</th>
                  <th className="py-3.5 px-4">ទីតាំងស្នាក់នៅ</th>
                  <th className="py-3.5 px-4">លេខទូរស័ព្ទ</th>
                  <th className="py-3.5 px-4">ស្ថានភាពវត្តមាន</th>
                  <th className="py-3.5 px-4 text-center w-32">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-kantumruy">
                {filteredTags.map((tag) => {
                  const isArrived = !!tag.arrived;
                  return (
                    <tr
                      key={tag.id}
                      className={`hover:bg-slate-800/80 transition-colors ${
                        isArrived ? 'bg-emerald-950/20' : 'bg-rose-950/10'
                      }`}
                    >
                      {/* Tag Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 font-black font-sans-en text-xs border border-amber-500/40 shadow-sm">
                          #{westernToKhmerDigits(tag.tagNumber)}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-100 text-sm">
                        {tag.name}
                        {tag.notes && (
                          <span className="block text-[11px] font-normal text-slate-400 mt-0.5 truncate max-w-xs">
                            {tag.notes}
                          </span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-700/80 text-amber-300 font-semibold text-xs">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{tag.location}</span>
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-sans-en text-slate-300">
                        {tag.phone ? (
                          <a
                            href={`tel:${tag.phone}`}
                            className="inline-flex items-center gap-1.5 hover:text-emerald-400 transition-colors font-semibold"
                          >
                            <Phone className="w-3.5 h-3.5 text-sky-400" />
                            <span>{tag.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-600 italic">-</span>
                        )}
                      </td>

                      {/* Arrival Status */}
                      <td className="py-3.5 px-4">
                        {isArrived ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 font-bold text-xs shadow-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>បានមកដល់</span>
                            {tag.arrivedAt && (
                              <span className="text-[10px] text-emerald-400/80 font-sans-en font-normal ml-1">
                                ({new Date(tag.arrivedAt).toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' })})
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 font-semibold text-xs">
                            <XCircle className="w-4 h-4 text-rose-400" />
                            <span>មិនទាន់មកដល់</span>
                          </div>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onToggleAttendance(tag)}
                          disabled={!isAdminOrOwner && currentUser?.role === 'guest'}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm ${
                            isArrived
                              ? 'bg-slate-950 hover:bg-rose-950/90 text-rose-300 border border-slate-700 hover:border-rose-700'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60'
                          }`}
                          title={isArrived ? 'ដកការគ្រីសវត្តមាន' : 'គ្រីសរាយការណ៍មកដល់'}
                        >
                          {isArrived ? 'ដកការគ្រីស' : '✔️ គ្រីសមកដល់'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
