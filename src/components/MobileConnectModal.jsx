import React from 'react';
import { X, Smartphone, QrCode, Globe, CheckCircle2, Copy, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { copyToClipboard } from '../utils/clipboard';

export default function MobileConnectModal({ onClose }) {
  const cloudflareUrl = "https://integration-calgary-began-eligible.trycloudflare.com";
  const localIpUrl = "http://192.168.18.13:5173";

  const handleCopyLink = async (url) => {
    const copied = await copyToClipboard(url);
    if (copied) {
      alert(`បានចម្លង Link: ${url} រួចរាល់!`);
    } else {
      alert('មិនអាចចម្លង Link បានទេ');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-700/60 font-kantumruy">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-moul text-emerald-400">
                Web Link ផ្ទាល់ ( គ្មានផ្ទាំង Warning ទេ )
              </h2>
              <p className="text-xs text-slate-400">
                ចុចបើកភ្លាមៗលើទូរស័ព្ទដៃ ប្រើសេវា 4G / 5G / Wi-Fi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big QR Code display for Cloudflare Direct URL */}
        <div className="flex flex-col items-center justify-center bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center">
          <div className="bg-white p-3.5 rounded-2xl shadow-xl border-2 border-emerald-400 mb-3">
            <QRCodeSVG value={cloudflareUrl} size={180} level="H" />
          </div>

          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ស្កែន QR នេះតាមកាមេរ៉ាទូរស័ព្ទដៃ ដើម្បីបើកភ្លាមៗ</span>
          </div>
          <p className="text-[11px] text-slate-400">
            ( បើកផ្ទាល់តែម្តង គ្មានសួរ IP Address ឡើយ )
          </p>
        </div>

        {/* Public Web Link & Copy Box */}
        <div className="mt-4 bg-slate-900 border-2 border-emerald-500/40 p-3 rounded-2xl flex items-center justify-between gap-2 shadow-lg">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-emerald-300 font-bold block">🌐 Direct Web Link ( ផ្ញើចូល Telegram Group )៖</span>
            <span className="text-xs md:text-sm font-extrabold text-emerald-400 font-sans-en truncate block mt-0.5">
              {cloudflareUrl}
            </span>
          </div>

          <button
            onClick={() => handleCopyLink(cloudflareUrl)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 shrink-0 shadow-md"
          >
            <Copy className="w-4 h-4" />
            <span>ចម្លង Link</span>
          </button>
        </div>

        {/* Local Wi-Fi option fallback */}
        <div className="mt-2 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
          <span>ឬ Local Wi-Fi៖ <strong className="text-slate-200 font-sans-en">{localIpUrl}</strong></span>
          <button
            onClick={() => handleCopyLink(localIpUrl)}
            className="text-amber-400 hover:underline font-bold text-[11px]"
          >
            ចម្លង
          </button>
        </div>

        {/* Step by step mobile guide */}
        <div className="mt-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs space-y-1 text-slate-300">
          <div className="font-bold text-emerald-400 mb-1">💡 របៀបបន្ថែមជា App លើអេក្រង់ទូរស័ព្ទ (Add to Home Screen)៖</div>
          <div>• <strong>iPhone (Safari)</strong>: ចុចប៊ូតុង Share 📤 &rarr; ជ្រើសរើស <em>"Add to Home Screen"</em></div>
          <div>• <strong>Android (Chrome)</strong>: ចុចសញ្ញាចុច ៣ 📱 &rarr; ជ្រើសរើស <em>"Add to Home Screen"</em></div>
        </div>

      </div>
    </div>
  );
}
