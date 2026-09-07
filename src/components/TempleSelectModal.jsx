import React, { useState } from 'react';
import { X, Building2, Plus, Copy, Check, ExternalLink, Trash2, Edit2, Shield, MapPin, Sparkles, AlertCircle } from 'lucide-react';
import { getTempleShareUrl } from '../utils/templeStorage';

export default function TempleSelectModal({
  currentTemple,
  temples,
  currentUser,
  onClose,
  onSelectTemple,
  onAddTemple,
  onUpdateTemple,
  onDeleteTemple,
  showToast
}) {
  const isOwner = currentUser?.role === 'owner';
  if (!isOwner) return null;

  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingTemple, setEditingTemple] = useState(null);

  const [templeName, setTempleName] = useState('');
  const [templeLocation, setTempleLocation] = useState('');
  const [templeDesc, setTempleDesc] = useState('');
  const [copiedTempleId, setCopiedTempleId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenAdd = () => {
    setEditingTemple(null);
    setTempleName('');
    setTempleLocation('');
    setTempleDesc('');
    setErrorMsg('');
    setIsAddFormOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTemple(t);
    setTempleName(t.name);
    setTempleLocation(t.location || '');
    setTempleDesc(t.description || '');
    setErrorMsg('');
    setIsAddFormOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedName = templeName.trim();
    if (!trimmedName) {
      setErrorMsg('សូមបញ្ចូលឈ្មោះវត្តអារាម!');
      return;
    }

    if (editingTemple) {
      onUpdateTemple({
        ...editingTemple,
        name: trimmedName,
        location: templeLocation.trim(),
        description: templeDesc.trim()
      });
      showToast?.(`បានកែប្រែព័ត៌មាន «${trimmedName}» រួចរាល់!`);
    } else {
      // Generate clean slug ID from name or timestamp
      const slug = `wat-${Date.now().toString(36)}`;
      const newTemple = {
        id: slug,
        name: trimmedName,
        shortName: trimmedName.replace(/^វត្ត\s*/, ''),
        location: templeLocation.trim() || 'ប្រទេសកម្ពុជា',
        description: templeDesc.trim(),
        mapImage: '/temple_map/map_new_latest.jpg',
        createdAt: new Date().toISOString().split('T')[0],
        isDefault: false
      };
      onAddTemple(newTemple);
      showToast?.(`បានបន្ថែមវត្តថ្មី «${trimmedName}» រួចរាល់!`);
    }

    setIsAddFormOpen(false);
    setEditingTemple(null);
  };

  const handleCopyLink = (t, e) => {
    e.stopPropagation();
    const link = getTempleShareUrl(t.id);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(() => {
        setCopiedTempleId(t.id);
        showToast?.(`បានចម្លង Link វត្ត ${t.name} រួចរាល់!`);
        setTimeout(() => setCopiedTempleId(null), 2500);
      });
    } else {
      // Fallback
      prompt('Copy Link វត្តនេះ ៖', link);
    }
  };

  const handleDelete = (t, e) => {
    e.stopPropagation();
    if (t.isDefault || t.id === 'khemavan') {
      alert('មិនអាចលុបវត្តខេមវ័ន (វត្តដើម) បានឡើយ!');
      return;
    }
    if (window.confirm(`តើអ្នកពិតជាចង់លុប «${t.name}» ចេញពីប្រព័ន្ធមែនទេ?`)) {
      onDeleteTemple(t.id);
      showToast?.(`បានលុបវត្ត ${t.name} រួចរាល់!`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 font-kantumruy">
      <div className="glass-modal w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl p-5 sm:p-6 shadow-2xl relative border border-slate-700/60 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-moul text-amber-400">
                ជ្រើសរើស និងគ្រប់គ្រងវត្តអារាម
              </h2>
              <p className="text-xs text-slate-400">
                ប្តូរឆ្លាស់វត្ត ឬបង្កើត Link សម្រាប់វត្តផ្សេងៗ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto space-y-3 pr-1">
          {/* Owner Actions Bar */}
          {isOwner && !isAddFormOpen && (
            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl mb-3">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>សិទ្ធិ Owner ៖ អាចបង្កើតវត្តថ្មី និង Copy Link ផ្ញើឱ្យវត្តនីមួយៗ</span>
              </div>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ បន្ថែមវត្តថ្មី</span>
              </button>
            </div>
          )}

          {/* Add / Edit Form Modal Inline */}
          {isAddFormOpen && (
            <form onSubmit={handleFormSubmit} className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-4 space-y-3 mb-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-moul text-xs text-amber-300">
                  {editingTemple ? '✏️ កែប្រែព័ត៌មានវត្ត' : '➕ បន្ថែមវត្តថ្មីក្នុងប្រព័ន្ធ'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddFormOpen(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  បោះបង់
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  ឈ្មោះវត្តអារាម * ៖
                </label>
                <input
                  type="text"
                  required
                  value={templeName}
                  onChange={(e) => setTempleName(e.target.value)}
                  placeholder="ឧ. វត្តបទុមវតី ឬ វត្តឧណ្ណាលោម"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  ទីតាំង / ខេត្ត ៖
                </label>
                <input
                  type="text"
                  value={templeLocation}
                  onChange={(e) => setTempleLocation(e.target.value)}
                  placeholder="ឧ. រាជធានីភ្នំពេញ ឬ ខេត្តកំពង់ចាម"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  កំណត់សម្គាល់ (Description) ៖
                </label>
                <input
                  type="text"
                  value={templeDesc}
                  onChange={(e) => setTempleDesc(e.target.value)}
                  placeholder="ឧ. គ្រប់គ្រងស្លាកលេខពិធីបុណ្យ"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              {errorMsg && (
                <div className="bg-rose-950/60 border border-rose-800 text-rose-300 p-2 rounded-xl text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddFormOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
                >
                  {editingTemple ? 'រក្សាទុកការកែប្រែ' : 'បង្កើតវត្តថ្មី'}
                </button>
              </div>
            </form>
          )}

          {/* Temples Cards List */}
          <div className="space-y-2.5">
            {temples.map((t) => {
              const isActive = t.id === currentTemple?.id;
              const isCopied = copiedTempleId === t.id;

              return (
                <div
                  key={t.id}
                  onClick={() => {
                    onSelectTemple(t);
                    onClose();
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative group flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Left Temple Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isActive
                        ? 'bg-gradient-to-br from-amber-500/30 to-amber-600/20 border-amber-400/50 text-amber-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 group-hover:text-amber-300'
                    }`}>
                      <Building2 className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-moul text-sm sm:text-base text-amber-300 tracking-wide truncate">
                          {t.name}
                        </h3>
                        {isActive && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold shrink-0">
                            ✓ កំពុងមើល
                          </span>
                        )}
                        {t.isDefault && (
                          <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded-full font-bold shrink-0">
                            វត្តដើម
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 truncate">
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3 h-3 text-amber-400/70" />
                          <span>{t.location || 'ប្រទេសកម្ពុជា'}</span>
                        </span>
                        {t.description && (
                          <>
                            <span>•</span>
                            <span className="truncate text-slate-500">{t.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {/* Copy Link button */}
                    <button
                      type="button"
                      onClick={(e) => handleCopyLink(t, e)}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                        isCopied
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                      title="Copy Link ផ្ញើតាម Telegram"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>បាន Copy Link</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-amber-400" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    {/* Owner Edit / Delete */}
                    {isOwner && !t.isDefault && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(t);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 border border-slate-700 rounded-xl transition-all"
                          title="កែប្រែព័ត៌មាន"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDelete(t, e)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 rounded-xl transition-all"
                          title="លុបវត្តនេះ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {/* Select / Switch button */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTemple(t);
                        onClose();
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
                        isActive
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700'
                      }`}
                    >
                      {isActive ? 'កំពុងមើល' : 'ចូលមើល'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span>ទិន្នន័យស្លាកលេខ ឈ្មោះ និងប្លង់វត្ត ត្រូវបានបំបែកដាច់ដោយឡែកពីគ្នា ១០០%</span>
          <span className="text-amber-400/80 font-bold">{temples.length} វត្ត</span>
        </div>

      </div>
    </div>
  );
}
