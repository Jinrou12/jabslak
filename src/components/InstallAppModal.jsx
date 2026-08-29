import React from 'react';
import { Smartphone, Download, X, CheckCircle2, Share, PlusSquare } from 'lucide-react';

export default function InstallAppModal({ onClose, onInstall, deferredPrompt }) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl overflow-hidden font-kantumruy">
        
        {/* Ambient Glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/30 border-2 border-amber-300">
            <Smartphone className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-amber-400 font-moul">
              ដំឡើងជា Mobile App 📱
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              ដំឡើងកម្មវិធី ចាប់ស្លាកលេខ ទៅលើទូរស័ព្ទដៃដើម្បីប្រើប្រាស់បានពេញលេញ គ្មានរបារ Browser
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-3 bg-slate-950/60 rounded-2xl p-4 border border-slate-800 text-xs text-slate-300 mb-6">
          {deferredPrompt ? (
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>ទូរស័ព្ទរបស់អ្នកគាំទ្រការដំឡើងផ្ទាល់! ចុចប៊ូតុងខាងក្រោម៖</span>
            </div>
          ) : isIOS ? (
            <div className="space-y-2">
              <p className="font-bold text-amber-300">របៀបដំឡើងលើ iPhone (Safari) ៖</p>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-amber-400 text-[10px]">1</span>
                <span>ចុចប៊ូតុង ចែករំលែក <Share className="w-4 h-4 inline text-sky-400 mx-0.5" /> (Share) ខាងក្រោម Safari</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-amber-400 text-[10px]">2</span>
                <span>រំកិលចុះក្រោម រួចជ្រើសយក <PlusSquare className="w-4 h-4 inline text-amber-400 mx-0.5" /> <strong>"Add to Home Screen"</strong></span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-bold text-amber-300">របៀបដំឡើងលើ Android (Chrome / Opera) ៖</p>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-amber-400 text-[10px]">1</span>
                <span>ចុចសញ្ញាចុច ៣ (⋮) ជ្រុងខាងលើស្ដាំនៃ Browser</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-amber-400 text-[10px]">2</span>
                <span>ជ្រើសយក <strong>"Add to Home Screen"</strong> ឬ <strong>"Install App"</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        {deferredPrompt ? (
          <button
            onClick={onInstall}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-98 transition-all font-kantumruy cursor-pointer"
          >
            <Download className="w-5 h-5 stroke-[2.5]" />
            <span>ដំឡើងកម្មវិធីឥឡូវនេះ (Install App)</span>
          </button>
        ) : (
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all font-kantumruy cursor-pointer"
          >
            <span>យល់ព្រម / បិទ</span>
          </button>
        )}

      </div>
    </div>
  );
}
