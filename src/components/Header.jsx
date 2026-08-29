import React from 'react';
import { Tag, Plus, FileSpreadsheet, Trash2, Users, MapPin, Cloud, Map as MapIcon, Crown, Shield, UserCheck, Lock, UserCog, LogIn, Eye, LogOut, Calendar, ChevronDown } from 'lucide-react';
import { westernToKhmerDigits } from '../utils/khmerSearch';

export default function Header({
  totalCount,
  filteredCount,
  arrivedCount,
  currentUser,
  onOpenAddModal,
  onOpenQRScanner,
  onOpenImportExport,
  onResetData,
  onOpenLocationStats,
  onOpenCloudConfig,
  onOpenMobileConnect,
  onOpenTempleMap,
  onOpenRoleManagement,
  onOpenLoginModal,
  onLogout,
  onOpenAttendanceReport,
  isCloudSyncing,
  selectedYear = '2026',
  onToggleYear,
  onAddYear
}) {
  const isOwner = currentUser?.role === 'owner';
  const isAdmin = currentUser?.role === 'admin';
  const isAssistant = currentUser?.role === 'assistant';
  const isGuest = currentUser?.role === 'guest' || !currentUser?.role;

  const getRoleBadge = () => {
    if (isOwner) return { text: 'ប្រធាន (Owner)', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: Crown };
    if (isAdmin) return { text: 'អ្នកគ្រប់គ្រង (Admin)', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', icon: Shield };
    if (isAssistant) return { text: 'ជំនួយការ (Assistant)', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40', icon: UserCog };
    return { text: 'អ្នកមើល (Guest)', color: 'bg-slate-500/20 text-slate-300 border-slate-500/40', icon: Eye };
  };

  const getUserDisplayName = () => {
    if (currentUser?.name) return currentUser.name;
    return 'Guest (អ្នកមើល)';
  };

  const getDateBannerText = () => {
    if (selectedYear === '2025') {
      return 'ថ្ងៃអាទិត្យ ១៥កើត ខែស្រាពណ៍ ឆ្នាំរោង ឆស័ក ពុទ្ធសករាជ ២៥៦៩ ត្រូវនឹងថ្ងៃទី១០ ខែកញ្ញា ឆ្នាំ២០២៥';
    }
    if (selectedYear === '2027') {
      return 'ថ្ងៃអង្គារ ១០កើត ខែស្រាពណ៍ ឆ្នាំមមែ នព្វស័ក ពុទ្ធសករាជ ២៥៧១ ត្រូវនឹងថ្ងៃទី១៥ ខែកញ្ញា ឆ្នាំ២០២៧';
    }
    if (selectedYear === '2024') {
      return 'ថ្ងៃពុធ ៥កើត ខែស្រាពណ៍ ឆ្នាំម្សាញ់ បញ្ចស័ក ពុទ្ធសករាជ ២៥៦៨ ត្រូវនឹងថ្ងៃទី១ ខែកញ្ញា ឆ្នាំ២០២៤';
    }
    return `ថ្ងៃសៅរ៍ ៨រោច ខែស្រាពណ៍ ឆ្នាំមមី អដ្ឋស័ក ពុទ្ធសករាជ ២៥៧០ ត្រូវនឹងថ្ងៃទី៥ ខែកញ្ញា ឆ្នាំ${westernToKhmerDigits(selectedYear)}`;
  };

  return (
    <header className="relative z-10 glass-panel border-b border-slate-800/80 px-3 sm:px-4 py-2.5 sm:py-3 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
        
        {/* Top Bar: Title & Stats */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/30 shrink-0">
              <Tag className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-base font-black text-amber-400 font-moul tracking-wide truncate">
                  ប្រព័ន្ធគ្រប់គ្រងស្លាកលេខ
                </h1>
                <span className="text-[9px] sm:text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.2 rounded-full font-sans-en font-bold shrink-0">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 font-kantumruy flex items-center gap-1.5 truncate">
                <span className="truncate">គ្រប់គ្រងទីតាំង</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-300 font-bold shrink-0">{westernToKhmerDigits(totalCount)} ស្លាក</span>
              </p>
            </div>
          </div>

          {/* Right Action Controls (Role, Login/Logout, Cloud icons side-by-side on Far Right) */}
          <div className="flex items-center gap-1.5 ml-auto shrink-0 font-kantumruy">
            
            {/* 1. Role Icon Badge */}
            <div
              className={`flex items-center justify-center p-2 rounded-xl border transition-all active:scale-95 ${getRoleBadge().color}`}
              title={`${getUserDisplayName()} (${getRoleBadge().text})`}
            >
              {React.createElement(getRoleBadge().icon, { className: 'w-4 h-4' })}
            </div>

            {/* Role Management (Owner only) */}
            {isOwner && (
              <button
                onClick={onOpenRoleManagement}
                className="p-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 active:scale-95 transition-all"
                title="គ្រប់គ្រងសិទ្ធិ (Role Management)"
              >
                <Users className="w-4 h-4 text-purple-400" />
              </button>
            )}

            {/* 2. Login / Logout Icon */}
            {currentUser?.role && currentUser.role !== 'guest' ? (
              <button
                onClick={onLogout}
                className="p-2 bg-slate-900/90 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-xl transition-all active:scale-95"
                title="ចាកចេញ (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="p-2 bg-slate-900/90 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 border border-slate-800 rounded-xl transition-all active:scale-95"
                title="ចូលប្រើប្រាស់ (Login)"
              >
                <LogIn className="w-4 h-4" />
              </button>
            )}

            {/* 3. Realtime Cloud Sync Status Icon */}
            {isCloudSyncing && (
              <button
                onClick={onOpenCloudConfig}
                className="p-2 bg-sky-950/80 hover:bg-sky-900/80 border border-sky-500/50 text-sky-300 rounded-xl transition-all active:scale-95 relative flex items-center justify-center"
                title="ស្ថានភាព Realtime Cloud Sync"
              >
                <Cloud className="w-4 h-4 text-sky-400" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400"></span>
              </button>
            )}

          </div>
        </div>

        {/* Second Row: Action Buttons Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 w-full font-kantumruy">
          
          {/* 📅 Year Switcher Button (Allows switching between 2026 ↔ 2027) */}
          <button
            type="button"
            onClick={onToggleYear}
            className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500/20 via-amber-500/30 to-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-500/10 active:scale-95 transition-all shrink-0 font-kantumruy cursor-pointer"
            title="ចុចដើម្បីប្តូរឆ្នាំ (Switch Year 2026 ↔ 2027)"
          >
            <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-moul text-amber-300">ឆ្នាំ {westernToKhmerDigits(selectedYear)}</span>
            <ChevronDown className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-0.5" />
          </button>

          {/* ➕ Add Year Button (Visible ONLY for Owner & Admin) */}
          {(isOwner || isAdmin) && (
            <button
              type="button"
              onClick={onAddYear}
              className="px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-sm active:scale-95 transition-all shrink-0 font-kantumruy cursor-pointer"
              title="បន្ថែមឆ្នាំថ្មី (Add New Year)"
            >
              <Plus className="w-4 h-4 text-amber-400 shrink-0 stroke-[3]" />
              <span className="font-bold whitespace-nowrap">ឆ្នាំ</span>
            </button>
          )}

          {/* 📊 Attendance Report Dashboard Button */}
          <button
            onClick={onOpenAttendanceReport}
            className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/60 shadow-lg shadow-emerald-950/60 active:scale-95 transition-all shrink-0 animate-in zoom-in-50 duration-200 font-kantumruy"
            title="មើលតារាងរបាយការណ៍អ្នកបានមកដល់ និងមិនទាន់មកដល់"
          >
            <UserCheck className="w-4 h-4 text-emerald-200 shrink-0" />
            <span className="whitespace-nowrap font-bold">របាយការណ៍</span>
          </button>

          {/* Excel Import / Export (PC/Desktop only - HIDDEN on Mobile phones) */}
          {(isOwner || isAdmin) && (
            <button
              onClick={onOpenImportExport}
              className="hidden sm:flex px-2.5 py-2 rounded-xl text-xs font-bold transition-all items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 active:scale-95 shadow-sm animate-in zoom-in-50 duration-200"
              title="ទាញចូល/ទាញចេញ Excel, CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="whitespace-nowrap">Excel/CSV</span>
            </button>
          )}

          {/* Delete All Data (PC/Desktop only - HIDDEN on Mobile phones) */}
          {(isOwner || isAdmin) && (
            <button
              onClick={onResetData}
              className="hidden sm:flex p-2 bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-800/80 rounded-xl text-xs font-bold transition-all items-center justify-center gap-1 active:scale-95 shadow-sm animate-in zoom-in-50 duration-200"
              title="លុបទិន្នន័យទាំងអស់ (ទាំងចាស់ ទាំងថ្មី)"
            >
              <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
            </button>
          )}

        </div>

        {/* 📅 Event Khmer Date Banner (Seamless Infinite Marquee) */}
        <div className="pt-2 text-center overflow-hidden w-full font-kantumruy">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5 shadow-inner w-full overflow-hidden relative">
            <Calendar className="w-4 h-4 text-amber-400 shrink-0 z-10 bg-slate-900/95 pr-1 rounded-l-lg" />
            <div className="overflow-hidden relative w-full flex items-center">
              <div className="animate-marquee flex items-center gap-8 font-bold text-amber-200 text-xs sm:text-sm font-kantumruy">
                <span>{getDateBannerText()}</span>
                <span className="text-amber-500/60 font-sans-en text-xs">✦</span>
                <span>{getDateBannerText()}</span>
                <span className="text-amber-500/60 font-sans-en text-xs">✦</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}


