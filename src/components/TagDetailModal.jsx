import React from 'react';
import { X, MapPin, Phone, User, Edit3, Trash2, Share2, Printer, CheckCircle2, Circle, QrCode, Sparkles, Tag, Navigation, Map as MapIcon, Lock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { westernToKhmerDigits } from '../utils/khmerSearch';

export default function TagDetailModal({ tag, onClose, onEdit, onDelete, onViewOnMap, onToggleAttendance, currentUser }) {
  if (!tag) return null;

  const isAssistant = currentUser?.role === 'assistant';
  const isGuest = currentUser?.role === 'guest';
  const isArrived = !!tag.arrived;
  const isPartial = !!tag.isPartialArrived;
  const tagCount = tag.count || (tag.tags?.length || 1);

  const khmerTagNo = tag.tagNumberDisplay || westernToKhmerDigits(tag.tagNumber);
  const tagQrPayload = JSON.stringify({
    id: tag.id,
    tagNumber: tag.tagNumberDisplay || tag.tagNumber,
    name: tag.name,
    location: tag.location
  });

  const handleShare = async () => {
    const text = `🏷️ ស្លាកលេខ: ${khmerTagNo} (${tag.tagNumber})\n👤 ឈ្មោះ: ${tag.name}\n📍 ទីតាំង: ${tag.location}\n📞 ទូរស័ព្ទ: ${tag.phone || 'គ្មាន'}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ស្លាកលេខ ${khmerTagNo} - ${tag.name}`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xl" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-[2rem] relative max-h-[92vh] overflow-y-auto no-scrollbar font-kantumruy"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(165deg, rgba(15,23,42,0.97) 0%, rgba(10,15,30,0.99) 50%, rgba(15,23,42,0.97) 100%)',
          boxShadow: '0 0 80px rgba(245,158,11,0.08), 0 0 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
          border: '1px solid rgba(245,158,11,0.15)',
        }}
      >
        
        {/* ═══════════════ TOP HERO SECTION ═══════════════ */}
        <div
          className="relative px-6 pt-8 pb-6 text-center overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.03) 60%, transparent 100%)',
          }}
        >
          {/* Decorative radial glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)' }} />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Tag Number Badge */}
          <div className="relative inline-flex flex-col items-center justify-center mb-4">
            <div
              className="min-w-28 h-28 px-4 rounded-[1.5rem] flex flex-col items-center justify-center text-slate-950 shadow-2xl relative text-center"
              style={{
                background: 'linear-gradient(145deg, #fbbf24, #f59e0b, #d97706)',
                boxShadow: '0 8px 32px rgba(245,158,11,0.35), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.3)',
              }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 rounded-[1.5rem] overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-t-[1.5rem]" />
              </div>
              <span className="text-[10px] font-bold tracking-widest uppercase opacity-70 relative z-10 font-sans-en">ស្លាកលេខ</span>
              <span className="text-2xl md:text-3xl font-black font-kantumruy relative z-10 leading-none mt-0.5 tracking-tight">
                {khmerTagNo}
              </span>
              {tagCount > 1 && (
                <span className="text-[11px] font-bold bg-slate-950/20 px-2 py-0.5 rounded-md mt-1 font-kantumruy relative z-10">
                  សរុប {westernToKhmerDigits(tagCount)} អង្គ
                </span>
              )}
            </div>
            
            {/* Floating sparkle */}
            <div className="absolute -top-1 -right-1 p-1.5 bg-amber-400 rounded-full shadow-lg shadow-amber-500/40">
              <Sparkles className="w-3 h-3 text-slate-900" />
            </div>
          </div>

          {/* Name */}
          <h2 className="text-2xl md:text-[1.7rem] font-bold font-moul text-transparent bg-clip-text leading-relaxed"
            style={{ backgroundImage: 'linear-gradient(135deg, #fcd34d, #f59e0b, #fbbf24)' }}>
            {tag.name}
          </h2>

          {/* 📋 Attendance Check-in Button Pill (Owner, Admin, Assistant only) */}
          {!isGuest && onToggleAttendance && (
            <div className="mt-3 flex justify-center animate-in zoom-in-50 duration-200">
              <button
                onClick={() => {
                  onToggleAttendance(tag);
                }}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all shadow-lg active:scale-95 border ${
                  isArrived
                    ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-emerald-500/25'
                    : isPartial
                    ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/25'
                    : 'bg-slate-800 text-emerald-300 border-emerald-500/40 hover:bg-slate-700'
                }`}
              >
                {isArrived ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[3]" />
                    <span>បានមកដល់គ្រប់អង្គ (ចុចដើម្បីដក)</span>
                  </>
                ) : isPartial ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[3]" />
                    <span>មកដល់ {westernToKhmerDigits(tag.arrivedCount)}/{westernToKhmerDigits(tagCount)} (ចុចដើម្បីគ្រីសទាំងអស់)</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4 text-emerald-400" />
                    <span>👉 គ្រីសអ្នកបានមកដល់ (Report Check-in)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ═══════════════ DETAIL CARDS ═══════════════ */}
        <div className="px-5 pb-5 space-y-3">

          {/* Location Card */}
          <div
            onClick={() => {
              if (onViewOnMap) {
                onViewOnMap(tag.baseLocation || tag.location);
              }
            }}
            className="rounded-2xl p-4 flex items-start gap-3.5 group transition-all duration-200 hover:scale-[1.01] cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.02) 100%)',
              border: '1px solid rgba(245,158,11,0.15)',
            }}
            title="ចុចដើម្បីមើលទីតាំងលើផែនទីវត្ត"
          >
            <div className="p-3 rounded-xl shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.08))',
                boxShadow: '0 2px 12px rgba(245,158,11,0.1)',
              }}>
              <MapPin className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-amber-400/70 font-semibold tracking-wide uppercase">ទីតាំងស្លាកលេខ</span>
                <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md">
                  <MapIcon className="w-3 h-3" />
                  <span>មើលលើផែនទី</span>
                </span>
              </div>
              <div className="text-[1.05rem] font-bold text-slate-100 font-kantumruy mt-0.5 leading-snug">
                {(!tag.location || tag.location === 'ទីតាំងមិនទាន់កំណត់' || tag.location === 'មិនទាន់ដៅលើ Map') ? 'មើលទីកន្លែង' : tag.location}
              </div>
            </div>
            <div className="p-2 text-amber-400/40 group-hover:text-amber-400 transition-colors shrink-0 self-center">
              <Navigation className="w-4 h-4" />
            </div>
          </div>

          {/* Phone Card */}
          {tag.phone && (
            <div
              className="rounded-2xl p-4 flex items-center justify-between gap-3 transition-all duration-200 hover:scale-[1.01]"
              style={{
                background: 'linear-gradient(135deg, rgba(56,189,248,0.06) 0%, rgba(56,189,248,0.01) 100%)',
                border: '1px solid rgba(56,189,248,0.12)',
              }}
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(56,189,248,0.18), rgba(56,189,248,0.06))',
                    boxShadow: '0 2px 12px rgba(56,189,248,0.08)',
                  }}>
                  <Phone className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <div className="text-[11px] text-sky-400/70 font-semibold tracking-wide uppercase">លេខទូរស័ព្ទ</div>
                  <div className="text-lg font-bold text-slate-100 font-sans-en mt-0.5 tracking-wide">
                    {tag.phone}
                  </div>
                </div>
              </div>

              <a
                href={`tel:${tag.phone.replaceAll(' ', '')}`}
                className="p-3 rounded-xl text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
                }}
                title="ចុចតេ"
              >
                <Phone className="w-5 h-5" />
              </a>
            </div>
          )}

          {/* Sub-tags list card for grouped tags */}
          {tag.tags && tag.tags.length > 1 && (
            <div
              className="rounded-2xl p-4 transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.02) 100%)',
                border: '1px solid rgba(245,158,11,0.18)',
              }}
            >
              <div className="text-[11px] text-amber-400 font-bold tracking-wide uppercase mb-2 flex items-center justify-between font-kantumruy">
                <span>បញ្ជីស្លាកលេខ (សរុប {westernToKhmerDigits(tag.tags.length)} អង្គ)</span>
                <span className="text-emerald-400 font-bold font-sans-en">
                  {westernToKhmerDigits(tag.arrivedCount || 0)} / {westernToKhmerDigits(tag.tags.length)} មកដល់
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 custom-scrollbar">
                {tag.tags.map((subTag) => (
                  <span
                    key={subTag.id}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold font-kantumruy border flex items-center gap-1 ${
                      subTag.arrived
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-900/80 text-slate-300 border-slate-700'
                    }`}
                  >
                    <span>#{westernToKhmerDigits(subTag.tagNumber)}</span>
                    {subTag.arrived ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : null}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes Card */}
          {tag.notes && (
            <div
              className="rounded-2xl p-4 transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,0.06) 0%, rgba(168,85,247,0.01) 100%)',
                border: '1px solid rgba(168,85,247,0.12)',
              }}
            >
              <div className="text-[11px] text-purple-400/70 font-semibold tracking-wide uppercase mb-1.5">កំណត់សម្គាល់</div>
              <div className="text-sm text-slate-300 font-kantumruy leading-relaxed">
                {tag.notes}
              </div>
            </div>
          )}

          {/* QR Code Card */}
          <div
            className="rounded-2xl p-5 flex flex-col items-center justify-center transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="text-[11px] text-slate-400 font-semibold tracking-wide uppercase mb-3 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>QR Code ស្លាកលេខ</span>
            </div>
            <div className="p-3.5 rounded-2xl shadow-xl relative"
              style={{
                background: 'white',
                boxShadow: '0 4px 24px rgba(0,0,0,0.3), 0 0 40px rgba(245,158,11,0.08)',
              }}>
              <QRCodeSVG value={tagQrPayload} size={130} level="H" />
            </div>
            <span className="text-[10px] text-slate-500 mt-2.5 text-center">
              ស្កែនតាមកាមេរ៉ាទូរស័ព្ទដើម្បីមើលទីតាំង
            </span>
          </div>
        </div>

        {/* ═══════════════ ACTION TOOLBAR ═══════════════ */}
        <div className="px-5 pb-5">
          <div className="grid grid-cols-4 gap-2 p-2 rounded-2xl"
            style={{
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}>
            <button
              onClick={handleShare}
              className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all duration-200 group"
            >
              <Share2 className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-semibold">ចែករំលែក</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl text-slate-400 hover:text-sky-300 hover:bg-sky-500/10 transition-all duration-200 group"
            >
              <Printer className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-semibold">បោះពុម្ព</span>
            </button>

            {/* Edit (Hidden for Guest, Locked for Assistant) */}
            {!isGuest && (
              <button
                onClick={() => {
                  if (isAssistant) {
                    alert('សិទ្ធិ Assistant មិនអាចកែប្រែព័ត៌មានបានទេ! (សម្រាប់តែ Admin/Owner)');
                    return;
                  }
                  onEdit(tag);
                }}
                className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl transition-all duration-200 group ${
                  isAssistant
                    ? 'text-slate-600 cursor-not-allowed opacity-50'
                    : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                }`}
                title={isAssistant ? 'សម្រាប់តែ Admin/Owner' : 'កែប្រែព័ត៌មាន'}
              >
                {isAssistant ? <Lock className="w-[18px] h-[18px]" /> : <Edit3 className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />}
                <span className="text-[10px] font-semibold">កែប្រែ</span>
              </button>
            )}

            {/* Delete (Hidden for Guest, Locked for Assistant) */}
            {!isGuest && (
              <button
                onClick={() => {
                  if (isAssistant) {
                    alert('សិទ្ធិ Assistant មិនអាចលុបទិន្នន័យបានទេ! (សម្រាប់តែ Admin/Owner)');
                    return;
                  }
                  onDelete(tag);
                }}
                className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl transition-all duration-200 group ${
                  isAssistant
                    ? 'text-slate-600 cursor-not-allowed opacity-50'
                    : 'text-slate-400 hover:text-rose-300 hover:bg-rose-500/10'
                }`}
                title={isAssistant ? 'សម្រាប់តែ Admin/Owner' : 'លុបទិន្នន័យ'}
              >
                {isAssistant ? <Lock className="w-[18px] h-[18px]" /> : <Trash2 className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />}
                <span className="text-[10px] font-semibold">លុប</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

