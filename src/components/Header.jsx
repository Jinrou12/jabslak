import React from 'react';
import { Tag, QrCode, Plus, FileSpreadsheet, RotateCcw, Users, MapPin, Cloud, Smartphone } from 'lucide-react';
import { westernToKhmerDigits } from '../utils/khmerSearch';

export default function Header({
  totalCount,
  filteredCount,
  onOpenAddModal,
  onOpenQRScanner,
  onOpenImportExport,
  onResetData,
  onOpenLocationStats,
  onOpenCloudConfig,
  onOpenMobileConnect,
  isCloudSyncing
}) {
  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-slate-800/80 px-4 py-3 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl badge-gold flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20 shrink-0">
            <Tag className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold font-moul text-amber-400 tracking-wide">
                ប្រព័ន្ធគ្រប់គ្រងស្លាកលេខ
              </h1>
              <span className="bg-amber-500/20 text-amber-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-kantumruy flex items-center gap-1.5 mt-0.5">
              <span>គ្រប់គ្រងទីតាំង និងម្ចាស់ស្លាកលេខ</span>
              <span className="inline-block w-1 h-1 rounded-full bg-slate-600"></span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ក្រុមការងារ ២០ នាក់
              </span>
            </p>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          
          {/* Mobile Phone Access QR Button */}
          <button
            onClick={onOpenMobileConnect}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/50 text-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 active:scale-95 shadow-sm"
            title="បង្ហាញ QR Code សម្រាប់ទូរស័ព្ទស្កែនបើក"
          >
            <Smartphone className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>📱 ភ្ជាប់ទូរស័ព្ទ</span>
          </button>

          {/* Cloud Sync Status Badge */}
          <button
            onClick={onOpenCloudConfig}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all shrink-0 active:scale-95 border ${
              isCloudSyncing
                ? 'bg-sky-950/80 border-sky-500/50 text-sky-300 shadow-sm shadow-sky-500/20'
                : 'bg-slate-900/80 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
            title="កំណត់ Realtime Cloud Sync"
          >
            <Cloud className="w-4 h-4 text-sky-400" />
            <span>Cloud Sync</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          </button>

          <button
            onClick={onOpenLocationStats}
            className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-slate-300 transition-all shrink-0 active:scale-95"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>ទីតាំងសរុប</span>
            <span className="bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-lg text-xs">
              ១១ ទីតាំង
            </span>
          </button>

          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-slate-300 shrink-0">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>ទិន្នន័យសរុប</span>
            <span className="bg-sky-500/20 text-sky-300 font-bold px-2 py-0.5 rounded-lg text-xs font-sans-en">
              {westernToKhmerDigits(filteredCount)} / {westernToKhmerDigits(totalCount)}
            </span>
          </div>
        </div>

        {/* Action Buttons Header */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={onOpenQRScanner}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium px-3.5 py-2 rounded-xl text-xs md:text-sm shadow-lg shadow-emerald-900/30 transition-all active:scale-95 shrink-0"
          >
            <QrCode className="w-4 h-4 animate-bounce" />
            <span>ស្កែន QR</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs md:text-sm shadow-lg shadow-amber-500/25 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>បន្ថែមថ្មី</span>
          </button>

          <button
            onClick={onOpenImportExport}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs md:text-sm transition-all active:scale-95 shrink-0"
            title="ទាញចូល/ទាញចេញ Excel, CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Excel/CSV</span>
          </button>

          <button
            onClick={onResetData}
            className="p-2 bg-slate-800/80 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 border border-slate-700/60 rounded-xl text-xs transition-all shrink-0"
            title="កំណត់ឡើងវិញទិន្នន័យគំរូ 1,000"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
