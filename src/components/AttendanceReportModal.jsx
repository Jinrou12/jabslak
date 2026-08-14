import React, { useState, useMemo } from 'react';
import { X, CheckCircle2, XCircle, Search, MapPin, Phone, Download, Printer, UserCheck, Clock, Filter, Users, ArrowUpRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import { westernToKhmerDigits, khmerToWesternDigits } from '../utils/khmerSearch';

export default function AttendanceReportModal({ onClose, allTags, onToggleAttendance, currentUser }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'arrived', 'notArrived'
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

  // Filter tags based on tab, search query, and location
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
                  PC & Admin Dashboard
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ពិនិត្យបញ្ជីអ្នកបានមកដល់ ({westernToKhmerDigits(arrivedCount)}) និងអ្នកមិនទាន់មកដល់ ({westernToKhmerDigits(notArrivedCount)})
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

        {/* Summary Dashboard Cards (PC / Admin View) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 shrink-0">
          
          {/* Card 1: Total Tags */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">ចំនួនស្លាកសរុប (Total)</span>
              <span className="text-xl font-black text-slate-100 font-sans-en mt-0.5 block">
                {westernToKhmerDigits(totalCount)} <span className="text-xs font-normal text-slate-400">នាក់</span>
              </span>
            </div>
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-2xl border border-sky-500/20">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Arrived Count */}
          <div
            onClick={() => setActiveTab('arrived')}
            className={`border rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all ${
              activeTab === 'arrived'
                ? 'bg-emerald-950/70 border-emerald-500 ring-2 ring-emerald-500/20 scale-[1.01]'
                : 'bg-slate-900/90 border-slate-800 hover:border-emerald-700/60'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-xs text-emerald-300 font-bold">បានមកដល់ (Arrived)</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-400 font-sans-en">
                  {westernToKhmerDigits(arrivedCount)}
                </span>
                <span className="text-xs font-bold text-emerald-500">({arrivedPercentage}%)</span>
              </div>
            </div>
            <div className="p-3 bg-emerald-500/15 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Not Arrived Count */}
          <div
            onClick={() => setActiveTab('notArrived')}
            className={`border rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all ${
              activeTab === 'notArrived'
                ? 'bg-rose-950/70 border-rose-500 ring-2 ring-rose-500/20 scale-[1.01]'
                : 'bg-slate-900/90 border-slate-800 hover:border-rose-800/60'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                <span className="text-xs text-rose-300 font-bold">មិនទាន់មកដល់ (Not Arrived)</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-rose-400 font-sans-en">
                  {westernToKhmerDigits(notArrivedCount)}
                </span>
                <span className="text-xs font-bold text-rose-500">({notArrivedPercentage}%)</span>
              </div>
            </div>
            <div className="p-3 bg-rose-500/15 text-rose-400 rounded-2xl border border-rose-500/30">
              <XCircle className="w-6 h-6" />
            </div>
          </div>

        </div>

        {/* Tab Filter & Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3.5 shrink-0 bg-slate-900/80 p-2 rounded-2xl border border-slate-800">
          
          {/* Main Category Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ទាំងអស់ ({westernToKhmerDigits(totalCount)})
            </button>

            <button
              onClick={() => setActiveTab('arrived')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'arrived'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>បានមកដល់ ({westernToKhmerDigits(arrivedCount)})</span>
            </button>

            <button
              onClick={() => setActiveTab('notArrived')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'notArrived'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>មិនទាន់មកដល់ ({westernToKhmerDigits(notArrivedCount)})</span>
            </button>
          </div>

          {/* Quick Search & Location Filter */}
          <div className="flex items-center gap-2 flex-1 max-w-md min-w-[240px]">
            {/* Search Input */}
            <div className="relative flex-1">
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
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none max-w-[140px] truncate"
            >
              <option value="ALL">គ្រប់ទីតាំង</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Excel Export Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={exportArrivedExcel}
              className="px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
              title="ទាញយកបញ្ជីអ្នកបានមកដល់ជា Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel មកដល់</span>
            </button>

            <button
              onClick={exportNotArrivedExcel}
              className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-700/80 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
              title="ទាញយកបញ្ជីអ្នកមិនទាន់មកដល់ជា Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel មិនទាន់មកដល់</span>
            </button>
          </div>

        </div>

        {/* Detailed Attendance Table View */}
        <div className="flex-1 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950/90 no-scrollbar">
          {filteredTags.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <UserCheck className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">មិនមានទិន្នន័យត្រូវគ្នានឹងការស្វែងរកឡើយ</p>
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
                  return (
                    <tr
                      key={tag.id}
                      className={`hover:bg-slate-900/80 transition-colors ${
                        isArrived ? 'bg-emerald-950/15' : ''
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
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-600/80 text-emerald-300 font-bold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>បានមកដល់</span>
                            {tag.arrivedAt && (
                              <span className="text-[10px] text-emerald-400/80 font-sans-en font-normal ml-1">
                                ({new Date(tag.arrivedAt).toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' })})
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-semibold text-xs">
                            <XCircle className="w-3.5 h-3.5 text-slate-500" />
                            <span>មិនទាន់មកដល់</span>
                          </div>
                        )}
                      </td>

                      {/* Admin Toggle Action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onToggleAttendance(tag)}
                          disabled={!isAdminOrOwner && currentUser?.role === 'guest'}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm ${
                            isArrived
                              ? 'bg-slate-900 hover:bg-rose-950/80 text-rose-300 border border-slate-700 hover:border-rose-700'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
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
          )}
        </div>

        {/* Modal Footer Summary */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 mt-3 shrink-0 text-xs text-slate-400">
          <div>
            <span>បង្ហាញទិន្នន័យ ៖ </span>
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
