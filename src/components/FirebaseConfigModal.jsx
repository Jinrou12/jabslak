import React, { useState } from 'react';
import { X, Cloud, Key, CheckCircle2, Save, ExternalLink } from 'lucide-react';

export default function FirebaseConfigModal({ onClose, onSaveConfig }) {
  const [config, setConfig] = useState({
    apiKey: localStorage.getItem('FB_API_KEY') || '',
    databaseURL: localStorage.getItem('FB_DB_URL') || '',
    projectId: localStorage.getItem('FB_PROJECT_ID') || ''
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('FB_API_KEY', config.apiKey.trim());
    localStorage.setItem('FB_DB_URL', config.databaseURL.trim());
    localStorage.setItem('FB_PROJECT_ID', config.projectId.trim());

    setSavedSuccess(true);
    setTimeout(() => {
      onSaveConfig();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-700/60 font-kantumruy">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-moul text-sky-400">
                កំណត់ Firebase Cloud Sync
              </h2>
              <p className="text-xs text-slate-400">
                ភ្ជាប់ Realtime Database សម្រាប់ទូរស័ព្ទដៃ ២០ នាក់
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

        {savedSuccess && (
          <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-700/50 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>បានរក្សាទុក Firebase Project Credentials ដោយជោគជ័យ!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Database URL (https://your-app-default-rtdb.firebaseio.com)
            </label>
            <input
              type="text"
              value={config.databaseURL}
              onChange={(e) => setConfig({ ...config, databaseURL: e.target.value })}
              placeholder="https://your-project.firebaseio.com"
              className="w-full bg-slate-950 border border-slate-700 focus:border-sky-400 rounded-xl px-3 py-2 text-xs text-slate-100 font-sans-en focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              API Key (Optional)
            </label>
            <input
              type="text"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="AIzaSy..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-sky-400 rounded-xl px-3 py-2 text-xs text-slate-100 font-sans-en focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Project ID (Optional)
            </label>
            <input
              type="text"
              value={config.projectId}
              onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
              placeholder="my-tag-app"
              className="w-full bg-slate-950 border border-slate-700 focus:border-sky-400 rounded-xl px-3 py-2 text-xs text-slate-100 font-sans-en focus:outline-none"
            />
          </div>

          <div className="pt-2 text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="font-bold text-sky-400 block mb-1">របៀបបង្កើត Firebase ឥតគិតថ្លៃ (Free 100%)៖</span>
            ១. ចូលទៅកាន់ firebase.google.com &rarr; Create Project<br/>
            ២. បង្កើត Realtime Database (Test mode)<br/>
            ៣. ចម្លង Database URL មកដាក់ត្រង់នេះជាការស្រេច!
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium"
            >
              បោះបង់
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
            >
              <Save className="w-4 h-4" />
              <span>រក្សាទុក</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
