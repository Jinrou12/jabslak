import React from 'react';
import { X, MapPin, Phone, User, Edit3, Trash2, Share2, Printer, CheckCircle2, MessageCircle, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { westernToKhmerDigits } from '../utils/khmerSearch';

export default function TagDetailModal({ tag, onClose, onEdit, onDelete }) {
  if (!tag) return null;

  const khmerTagNo = westernToKhmerDigits(tag.tagNumber);
  const tagQrPayload = JSON.stringify({
    id: tag.id,
    tagNumber: tag.tagNumber,
    name: tag.name,
    location: tag.location
  });

  const handleShare = async () => {
    const text = `🏷️ ស្លាកលេខ: #${khmerTagNo} (${tag.tagNumber})\n👤 ឈ្មោះ: ${tag.name}\n📍 ទីតាំង: ${tag.location}\n📞 ទូរស័ព្ទ: ${tag.phone || 'គ្មាន'}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ស្លាកលេខ #${khmerTagNo} - ${tag.name}`,
          text: text,
        });
      } catch (e) {
        console.log('Share cancelled', e);
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('បានចម្លងព័ត៌មានស្លាកលេខទៅកាន់ Clipboard!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-slate-700/60 max-h-[90vh] overflow-y-auto no-scrollbar">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header Badge */}
        <div className="flex flex-col items-center text-center pt-2 pb-4">
          <div className="w-24 h-24 rounded-3xl badge-gold flex flex-col items-center justify-center text-slate-950 shadow-xl shadow-amber-500/20 mb-3 border-2 border-amber-300">
            <span className="text-xs font-bold tracking-wider font-sans-en">ស្លាកលេខ / TAG</span>
            <span className="text-3xl font-black font-kantumruy mt-0.5">
              #{khmerTagNo}
            </span>
            <span className="text-[11px] font-semibold text-slate-900/80 font-sans-en">
              ({tag.tagNumber})
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold font-moul text-amber-400 mt-1">
            {tag.name}
          </h2>

          <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold mt-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>ព័ត៌មានទីតាំងពិតប្រាកដ</span>
          </div>
        </div>

        {/* Detail Cards */}
        <div className="space-y-3 my-4">
          
          {/* Location Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-start gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">ទីតាំងស្លាកលេខ (Location)</div>
              <div className="text-base md:text-lg font-bold text-slate-100 font-kantumruy mt-0.5">
                {tag.location}
              </div>
            </div>
          </div>

          {/* Phone Box */}
          {tag.phone && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">លេខទូរស័ព្ទ (Contact)</div>
                  <div className="text-base font-bold text-slate-100 font-sans-en mt-0.5">
                    {tag.phone}
                  </div>
                </div>
              </div>

              {/* Call & Telegram action buttons */}
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${tag.phone.replaceAll(' ', '')}`}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-1"
                  title="ចុចតេ"
                >
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline">តេ</span>
                </a>
              </div>
            </div>
          )}

          {/* Notes Box */}
          {tag.notes && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-medium">កំណត់សម្គាល់ (Notes)</div>
              <div className="text-sm text-slate-200 mt-1 font-kantumruy">
                {tag.notes}
              </div>
            </div>
          )}

          {/* QR Code Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center">
            <div className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>QR Code ស្លាកលេខ</span>
            </div>
            <div className="bg-white p-3 rounded-2xl shadow-lg border-2 border-amber-500/30">
              <QRCodeSVG value={tagQrPayload} size={140} level="H" />
            </div>
            <span className="text-[11px] text-slate-500 mt-2">
              អាចស្កែនតាមកាមេរ៉ាទូរស័ព្ទដើម្បីមើលទីតាំង
            </span>
          </div>

        </div>

        {/* Action Toolbar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2.5 px-3 rounded-xl text-xs transition-all"
          >
            <Share2 className="w-4 h-4 text-amber-400" />
            <span>ចែករំលែក</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2.5 px-3 rounded-xl text-xs transition-all"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>បោះពុម្ព</span>
          </button>

          <button
            onClick={() => onEdit(tag)}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium py-2.5 px-3 rounded-xl text-xs transition-all"
          >
            <Edit3 className="w-4 h-4 text-amber-400" />
            <span>កែប្រែ</span>
          </button>

          <button
            onClick={() => onDelete(tag)}
            className="flex items-center justify-center gap-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-medium py-2.5 px-3 rounded-xl text-xs border border-rose-800/40 transition-all"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>លុប</span>
          </button>
        </div>

      </div>
    </div>
  );
}
