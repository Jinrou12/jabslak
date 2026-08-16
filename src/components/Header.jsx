import React from 'react';
import { Tag, Plus, FileSpreadsheet, Trash2, Users, MapPin, Cloud, Map as MapIcon, Crown, Shield, UserCheck, Lock, UserCog, LogIn, Eye, LogOut } from 'lucide-react';
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
  isCloudSyncing
}) {
  const isOwner = currentUser?.role === 'owner';
  const isAdmin = currentUser?.role === 'admin';
  const isAssistant = currentUser?.role === 'assistant';
  const isGuest = currentUser?.role === 'guest' || !currentUser?.role;

  const getRoleIcon = () => {
    if (isOwner) return <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />;
    if (isAdmin) return <Shield className="w-3.5 h-3.5 text-emerald-400" />;
    if (isAssistant) return <UserCheck className="w-3.5 h-3.5 text-sky-400" />;
    return <Eye className="w-3.5 h-3.5 text-slate-400" />;
  };

  const getRoleText = () => {
    if (isOwner) return 'Owner (ម្ចាស់)';
    if (isAdmin) return 'Admin';
    if (isAssistant) return 'Assistant';
    return 'Guest (អ្នកមើល)';
  };

  return (
    <header className="relative z-10 glass-panel border-b border-slate-800/80 px-3 sm:px-4 py-2.5 sm:py-3 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
        
        {/* Top Row: Brand & Active User / Role Badge */}
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

          {/* User Profile Badge & Authentication Controls */}
          <div className="flex items-center gap-1.5 shrink-0 font-kantumruy">
            {/* Current Active User Badge */}
            {isOwner ? (
              <div
                className="flex items-center justify-center rounded-xl px-2.5 py-1.5 bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10 cursor-default"
                title="Owner (ម្ចាស់ប្រព័ន្ធ)"
              >
                <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
              </div>
            ) : !isGuest ? (
              <div
                className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold border ${
                  isAdmin
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                    : 'bg-sky-950/80 border-sky-500/50 text-sky-300'
                }`}
              >
                {getRoleIcon()}
                <span className="font-bold">{getRoleText()}</span>
              </div>
            ) : null}

            {/* 🔑 Email Login Button (Only show when NOT logged in / Guest) */}
            {isGuest && (
              <button
                onClick={onOpenLoginModal}
                className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
                title="ចូលប្រើប្រាស់តាម Email (Login)"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}

            {/* Logout Button (for non-guest users) */}
            {!isGuest && (
              <button
                onClick={onLogout}
                className="p-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-xl text-xs transition-all active:scale-95"
                title="ចាកចេញ (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* Role Management (Owner & Admin Only) */}
            {(isOwner || isAdmin) && (
              <button
                onClick={onOpenRoleManagement}
                className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 rounded-xl px-2 py-1.5 text-xs font-bold font-kantumruy transition-all active:scale-95 animate-in zoom-in-50 duration-200 shadow-sm"
                title="គ្រប់គ្រងសិទ្ធិ និងគណនីក្រុមការងារ (Role Management)"
              >
                <UserCog className="w-4 h-4 text-amber-400" />
                <span className="text-[11px]">សិទ្ធិ</span>
              </button>
            )}

            {/* Cloud Sync Status (Owner & Admin Only) */}
            {(isOwner || isAdmin) && (
              <button
                onClick={onOpenCloudConfig}
                className={`flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-semibold transition-all active:scale-95 border animate-in zoom-in-50 duration-200 ${
                  isCloudSyncing
                    ? 'bg-sky-950/80 border-sky-500/50 text-sky-300'
                    : 'bg-slate-900/80 border-slate-700/60 text-slate-400'
                }`}
                title="ស្ថានភាព Realtime Cloud Sync"
              >
                <Cloud className="w-3.5 h-3.5 text-sky-400" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </button>
            )}
          </div>
        </div>

        {/* Second Row: Action Buttons Bar (Responsive flex layout - Excel & Trash buttons hidden on Mobile) */}
        <div className="flex flex-wrap items-center gap-2 pt-1 w-full font-kantumruy">
          
          {/* 🗺️ Temple Map Button */}
          <button
            onClick={onOpenTempleMap}
            className="px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 active:scale-95 shadow-sm"
            title="មើលផែនទីទីតាំងក្នុងវត្ត"
          >
            <MapIcon className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">ផែនទីវត្ត</span>
            <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-md font-sans-en text-[10px] font-black">
              ២១
            </span>
          </button>

          {/* Add Tag (Pops up for Owner & Admin only) */}
          {(isOwner || isAdmin) && (
            <button
              onClick={onOpenAddModal}
              className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 active:scale-95 transition-all shrink-0 animate-in zoom-in-50 duration-200"
              title="បន្ថែមស្លាកលេខថ្មី"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="whitespace-nowrap font-bold">បន្ថែមថ្មី</span>
            </button>
          )}

          {/* 📊 Attendance Report Dashboard Button */}
          <button
            onClick={onOpenAttendanceReport}
            className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/60 shadow-lg shadow-emerald-950/60 active:scale-95 transition-all shrink-0 animate-in zoom-in-50 duration-200 font-kantumruy"
            title="មើលតារាងរបាយការណ៍អ្នកបានមកដល់ និងមិនទាន់មកដល់"
          >
            <UserCheck className="w-4 h-4 text-emerald-200 shrink-0" />
            <span className="whitespace-nowrap font-bold">របាយការណ៍មកដល់</span>
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
      </div>
    </header>
  );
}


