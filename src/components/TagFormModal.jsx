import React, { useState, useEffect } from 'react';
import { X, Save, Tag, MapPin, User, Phone, FileText, ChevronDown, Sparkles, Map as MapIcon, FileSpreadsheet } from 'lucide-react';
import { locationsList } from '../data/sampleData';

export default function TagFormModal({ initialData, onClose, onSave, nextAvailableNumber, onOpenTempleMap, onOpenImportExport }) {
  const isEditing = Boolean(initialData && initialData.id);

  const [formData, setFormData] = useState({
    tagNumber: nextAvailableNumber || '',
    name: '',
    locationPreset: locationsList[0] || '',
    locationDetail: '',
    location: locationsList[0] || '',
    phone: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Effect 1: Initialize full form when editing an existing tag (runs once on mount)
  useEffect(() => {
    if (initialData) {
      setFormData({
        tagNumber: initialData.tagNumber || '',
        name: initialData.name || '',
        locationPreset: initialData.baseLocation || locationsList[0] || '',
        locationDetail: initialData.location || '',
        location: initialData.location || locationsList[0] || '',
        phone: initialData.phone || '',
        notes: initialData.notes || ''
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  // Effect 2: Only update tagNumber for NEW tags (not when editing) to avoid overwriting user edits
  useEffect(() => {
    if (!initialData && nextAvailableNumber) {
      setFormData((prev) => ({ ...prev, tagNumber: nextAvailableNumber }));
    }
  }, [nextAvailableNumber, initialData]);

  const handlePresetSelect = (preset) => {
    const detail = formData.locationDetail;
    const finalLocation = detail ? `${preset} (${detail})` : preset;
    setFormData((prev) => ({
      ...prev,
      locationPreset: preset,
      location: finalLocation
    }));
    if (errors.location) setErrors((prev) => ({ ...prev, location: null }));
  };

  const handleDetailChange = (detailVal) => {
    const preset = formData.locationPreset || locationsList[0];
    const finalLocation = detailVal ? `${preset} (${detailVal})` : preset;
    setFormData((prev) => ({
      ...prev,
      locationDetail: detailVal,
      location: finalLocation
    }));
    if (errors.location) setErrors((prev) => ({ ...prev, location: null }));
  };

  const handleCustomLocationChange = (customLoc) => {
    setFormData((prev) => ({
      ...prev,
      location: customLoc
    }));
    if (errors.location) setErrors((prev) => ({ ...prev, location: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.tagNumber) {
      newErrors.tagNumber = 'សូមបញ្ចូលលេខស្លាក';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'សូមបញ្ចូលឈ្មោះម្ចាស់ស្លាក';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'សូមបញ្ចូលទីតាំងស្លាកលេខ';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      ...(initialData || {}),
      id: initialData?.id || `tag-${Date.now()}`,
      tagNumber: Number(formData.tagNumber),
      name: formData.name.trim(),
      baseLocation: formData.locationPreset,
      location: formData.location.trim(),
      phone: formData.phone.trim(),
      notes: formData.notes.trim(),
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-lg rounded-3xl p-5 md:p-6 shadow-2xl relative border border-slate-700/80 max-h-[92vh] overflow-y-auto no-scrollbar">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl badge-gold flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20 shrink-0">
              <Tag className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-moul text-amber-400">
                {isEditing ? 'កែប្រែព័ត៌មានស្លាកលេខ' : 'បន្ថែមស្លាកលេខថ្មី'}
              </h2>
              <p className="text-xs text-slate-400 font-kantumruy mt-0.5">
                {isEditing ? 'ធ្វើបច្ចុប្បន្នភាពទិន្នន័យដែលមានស្រាប់' : 'បញ្ចូលទិន្នន័យម្ចាស់ស្លាក និងទីតាំងស្នាក់នៅ'}
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

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Row 1: Tag Number & Owner Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Tag Number */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-amber-300 mb-1.5 flex items-center gap-1 font-kantumruy">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>លេខស្លាក *</span>
              </label>
              <input
                type="number"
                value={formData.tagNumber}
                onChange={(e) => {
                  setFormData({ ...formData, tagNumber: e.target.value });
                  if (errors.tagNumber) setErrors({ ...errors, tagNumber: null });
                }}
                placeholder="ឧ. 101"
                className="w-full bg-slate-950 border-2 border-amber-500/40 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-slate-100 font-extrabold font-sans-en text-lg text-center focus:outline-none transition-all shadow-inner"
              />
              {errors.tagNumber && (
                <p className="text-[11px] text-rose-400 mt-1 font-kantumruy">{errors.tagNumber}</p>
              )}
            </div>

            {/* Owner Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1 font-kantumruy">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>ឈ្មោះម្ចាស់ស្លាកលេខ *</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: null });
                }}
                placeholder="ឧ. ឧបាសក ហ៊ុយ សុខ, ញោម គង់..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-slate-100 font-semibold font-kantumruy focus:outline-none transition-all"
              />
              {errors.name && (
                <p className="text-[11px] text-rose-400 mt-1 font-kantumruy">{errors.name}</p>
              )}
            </div>
          </div>

          {/* Section 2: Prominent & Beautiful Location Box (ទីតាំងស្លាកលេខ) */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-2xl p-4 shadow-xl relative overflow-hidden">
            
            {/* Header label inside box */}
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5 font-kantumruy">
                <div className="p-1 bg-amber-500/20 text-amber-400 rounded-lg">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-sm font-extrabold text-amber-400">ទីតាំងស្លាកលេខ (Location) *</span>
              </label>
              
              {onOpenTempleMap && (
                <button
                  type="button"
                  onClick={onOpenTempleMap}
                  className="text-[11px] text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500 px-2.5 py-1 rounded-xl border border-amber-500/40 font-bold flex items-center gap-1 transition-all"
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>បើកមើលប្លង់វត្ត</span>
                </button>
              )}
            </div>

            {/* Quick Location Chips */}
            <div className="mb-3">
              <span className="text-[11px] text-slate-400 mb-1.5 block font-medium">ជ្រើសរើសទីតាំងរហ័សទាំង ២១ ៖</span>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto no-scrollbar pr-1">
                {locationsList.map((loc) => {
                  const isSelected = formData.locationPreset === loc;
                  return (
                    <button
                      type="button"
                      key={loc}
                      onClick={() => handlePresetSelect(loc)}
                      className={`text-xs px-2.5 py-1 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/25 scale-105'
                          : 'bg-slate-950/80 text-slate-300 border-slate-700/80 hover:border-slate-500 hover:bg-slate-800'
                      }`}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location Select + Table/Detail Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium">តំបន់ / អគារក្នុងវត្ត៖</label>
                <div className="relative">
                  <select
                    value={formData.locationPreset}
                    onChange={(e) => handlePresetSelect(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold font-kantumruy appearance-none focus:outline-none"
                  >
                    {locationsList.map((loc) => (
                      <option key={loc} value={loc} className="bg-slate-900 text-slate-100">
                        {loc}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium">លេខតុ / ជួរ / បន្ថែម៖</label>
                <input
                  type="text"
                  value={formData.locationDetail}
                  onChange={(e) => handleDetailChange(e.target.value)}
                  placeholder="ឧ. តុ ០៥, ជួរ A..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold font-kantumruy focus:outline-none"
                />
              </div>
            </div>

            {/* Full preview text box */}
            <div className="mt-3 bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">ទីតាំងពេញលេញ៖</span>
              <span className="text-xs font-bold text-amber-300 font-kantumruy truncate max-w-[280px]">
                {formData.location || 'មិនទាន់កំណត់'}
              </span>
            </div>

            {errors.location && (
              <p className="text-[11px] text-rose-400 mt-1 font-kantumruy">{errors.location}</p>
            )}
          </div>

          {/* Row 3: Phone Number & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1 font-kantumruy">
                <Phone className="w-3.5 h-3.5 text-sky-400" />
                <span>លេខទូរស័ព្ទ (Phone)</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="ឧ. 012 345 678"
                className="w-full bg-slate-950 border border-slate-700 focus:border-sky-400 rounded-xl px-3.5 py-2.5 text-slate-100 font-sans-en text-sm focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1 font-kantumruy">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>កំណត់សម្គាល់បន្ថែម</span>
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ឧ. មកជាមួយកូន ២ នាក់..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-slate-100 font-kantumruy text-sm focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-4 border-t border-slate-800">
            {onOpenImportExport && (
              <button
                type="button"
                onClick={onOpenImportExport}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-950/40"
                title="នាំចូលទិន្នន័យជា Bulk ពី File (Excel, CSV, Word, PDF...)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>📂 នាំចូលពី File (Excel/Word/PDF)</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs md:text-sm font-semibold transition-all"
              >
                បោះបង់
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs md:text-sm shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all active:scale-95"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>{isEditing ? 'រក្សាទុកការកែប្រែ' : 'បញ្ចូលស្លាកលេខ'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
