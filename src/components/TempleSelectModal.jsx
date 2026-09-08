import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Plus, 
  Copy, 
  Check, 
  ExternalLink, 
  Trash2, 
  Edit2, 
  Shield, 
  MapPin, 
  Sparkles, 
  AlertCircle, 
  Upload, 
  Image as ImageIcon,
  Link as LinkIcon,
  Globe
} from 'lucide-react';
import { 
  getTempleShareUrl, 
  compressImage, 
  formatTempleSlug, 
  suggestSlugFromTempleName 
} from '../utils/templeStorage';

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
  const [templeSlug, setTempleSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [templeLocation, setTempleLocation] = useState('');
  const [templeDesc, setTempleDesc] = useState('');
  const [templeMapImage, setTempleMapImage] = useState(null);
  const [copiedTempleId, setCopiedTempleId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenAdd = () => {
    setEditingTemple(null);
    setTempleName('');
    setTempleSlug('');
    setSlugTouched(false);
    setTempleLocation('');
    setTempleDesc('');
    setTempleMapImage(null);
    setErrorMsg('');
    setIsAddFormOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTemple(t);
    setTempleName(t.name);
    setTempleSlug(t.id);
    setSlugTouched(true);
    setTempleLocation(t.location || '');
    setTempleDesc(t.description || '');
    const cleanImg = (t.id !== 'khemavan' && t.mapImage === '/temple_map/map_new_latest.jpg') ? null : (t.mapImage || null);
    setTempleMapImage(cleanImg);
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

    const rawSlug = templeSlug.trim() || suggestSlugFromTempleName(trimmedName);
    const cleanSlug = formatTempleSlug(rawSlug);
    if (!cleanSlug) {
      setErrorMsg('សូមបញ្ចូលកូដ Link (Slug) សម្រាប់វត្ត!');
      return;
    }

    // Check duplicate slug among other temples
    const duplicate = temples.find(
      (t) => t.id.toLowerCase() === cleanSlug.toLowerCase() && t.id !== editingTemple?.id
    );
    if (duplicate) {
      setErrorMsg(`កូដ Link «${cleanSlug}» នេះមានវត្ត «${duplicate.name}» ប្រើប្រាស់រួចហើយ! សូមជ្រើសរើសកូដផ្សេង។`);
      return;
    }

    if (editingTemple) {
      if (editingTemple.isDefault && cleanSlug !== editingTemple.id) {
        setErrorMsg('មិនអាចប្តូរ Link របស់វត្តដើម (វត្តខេមវ័ន) បានទេ!');
        return;
      }

      onUpdateTemple({
        ...editingTemple,
        id: cleanSlug,
        name: trimmedName,
        shortName: trimmedName.replace(/^វត្ត\s*/, ''),
        location: templeLocation.trim() || 'ប្រទេសកម្ពុជា',
        description: templeDesc.trim(),
        mapImage: templeMapImage || (editingTemple.id === 'khemavan' ? '/temple_map/map_new_latest.jpg' : null)
      }, editingTemple.id);
      showToast?.(`បានកែប្រែព័ត៌មាន និង Link វត្ត «${trimmedName}» រួចរាល់!`);
    } else {
      const newTemple = {
        id: cleanSlug,
        name: trimmedName,
        shortName: trimmedName.replace(/^វត្ត\s*/, ''),
        location: templeLocation.trim() || 'ប្រទេសកម្ពុជា',
        description: templeDesc.trim(),
        mapImage: templeMapImage || null,
        createdAt: new Date().toISOString().split('T')[0],
        isDefault: false
      };
      onAddTemple(newTemple);
      showToast?.(`បានបន្ថែមវត្តថ្មី «${trimmedName}» ជាមួយ Link ផ្ទាល់ខ្លួនរួចរាល់!`);
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
                  onChange={(e) => {
                    const val = e.target.value;
                    setTempleName(val);
                    if (!slugTouched && !editingTemple) {
                      setTempleSlug(suggestSlugFromTempleName(val));
                    }
                  }}
                  placeholder="ឧ. វត្តបទុមវតី ឬ វត្តឧណ្ណាលោម"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              {/* Custom Link / Slug Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>កូដ Link ផ្ទាល់ខ្លួន (Custom URL Slug) * ៖</span>
                  </label>
                  {(!editingTemple || !editingTemple.isDefault) && (
                    <button
                      type="button"
                      onClick={() => {
                        const auto = suggestSlugFromTempleName(templeName);
                        setTempleSlug(auto);
                        setSlugTouched(true);
                      }}
                      className="text-[10px] text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                      title="បង្កើតកូដ Link ស្វ័យប្រវត្តិតាមឈ្មោះវត្ត"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>⚡ បង្កើតស្វ័យប្រវត្តិ</span>
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    disabled={editingTemple?.isDefault}
                    value={templeSlug}
                    onChange={(e) => {
                      setTempleSlug(formatTempleSlug(e.target.value));
                      setSlugTouched(true);
                    }}
                    placeholder="ឧ. munireangsey ឬ wat-botum"
                    className={`w-full bg-slate-950 border font-mono rounded-xl px-3 py-2 text-xs placeholder:text-slate-600 focus:outline-none transition-all ${
                      editingTemple?.isDefault
                        ? 'text-slate-400 border-slate-800 cursor-not-allowed bg-slate-900/50'
                        : 'text-amber-200 border-slate-700 focus:border-amber-400'
                    }`}
                  />
                </div>

                {/* Live Link Preview */}
                <div className="mt-1.5 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] flex flex-col gap-1 shadow-inner">
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-sky-400" />
                      <span>🌐 Live Link Preview (តំណភ្ជាប់ដែលត្រូវ Copy ផ្ញើ) ៖</span>
                    </span>
                    {templeSlug && !editingTemple?.isDefault && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">✓ ត្រឹមត្រូវ</span>
                    )}
                  </div>
                  <div className="font-mono text-amber-400 break-all select-all font-bold text-xs bg-slate-900/90 p-1.5 rounded-lg border border-slate-800/80">
                    {getTempleShareUrl(templeSlug || 'your-slug')}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {editingTemple?.isDefault 
                      ? 'ℹ️ វត្តខេមវ័ន (វត្តដើម) ប្រើប្រាស់តំណភ្ជាប់មេមិនប្តូរឡើយ'
                      : 'ℹ️ អាចវាយជាអក្សរអង់គ្លេសតូច លេខ និងសញ្ញាដាច់ (ឧ. wat-munireangsey)'}
                  </p>
                </div>
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

              {/* 🗺️ Map Blueprint Upload Field */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  រូបភាពប្លង់វត្ត (Map Blueprint Image) ៖
                </label>
                {templeMapImage ? (
                  <div className="relative rounded-xl border border-amber-500/50 overflow-hidden bg-slate-950 p-1">
                    <img
                      src={templeMapImage}
                      alt="Map Blueprint Preview"
                      className="w-full h-36 object-contain rounded-lg bg-slate-900"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <label className="px-2.5 py-1 bg-amber-500 text-slate-950 hover:bg-amber-400 rounded-lg text-xs font-bold cursor-pointer shadow-md flex items-center gap-1">
                        <Upload className="w-3 h-3 stroke-[2.5]" />
                        <span>ប្តូររូប</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressed = await compressImage(file);
                                setTempleMapImage(compressed);
                              } catch (err) {
                                alert('មិនអាចដំណើរការរូបភាពបានទេ!');
                              }
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setTempleMapImage(null)}
                        className="px-2 py-1 bg-rose-600/90 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md"
                      >
                        លុប
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-950/60 hover:bg-slate-900 transition-all group">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-400 flex items-center justify-center transition-all">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-amber-300 group-hover:text-amber-200">
                      + ជ្រើសរើសរូបភាពប្លង់វត្ត (PNG / JPG)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      (ប្រព័ន្ធនឹង Compress ទំហំស្វ័យប្រវត្តិដើម្បីល្បឿនលឿន)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImage(file);
                            setTempleMapImage(compressed);
                          } catch (err) {
                            alert('មិនអាចដំណើរការរូបភាពបានទេ!');
                          }
                        }
                      }}
                    />
                  </label>
                )}
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

                      {/* Share Link Pill with One-Click Copy */}
                      <div 
                        onClick={(e) => handleCopyLink(t, e)}
                        className="flex items-center gap-1.5 mt-2 text-[11px] font-mono text-amber-300/90 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-amber-500/50 px-2.5 py-1 rounded-xl w-fit max-w-full transition-all group/link"
                        title="ចុចដើម្បី Copy Link វត្តនេះ"
                      >
                        <LinkIcon className="w-3 h-3 text-amber-400 shrink-0 group-hover/link:scale-110 transition-transform" />
                        <span className="truncate select-all">{getTempleShareUrl(t.id)}</span>
                        <span className="text-[10px] text-slate-500 group-hover/link:text-amber-300 ml-1 font-sans shrink-0 font-bold">
                          {isCopied ? '✓ បាន Copy' : '📋 Copy'}
                        </span>
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
                    {isOwner && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(t);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 border border-slate-700 rounded-xl transition-all"
                          title="កែប្រែព័ត៌មាន និង Link វត្ត"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {!t.isDefault && (
                          <button
                            type="button"
                            onClick={(e) => handleDelete(t, e)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 rounded-xl transition-all"
                            title="លុបវត្តនេះ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
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
