import React, { useState } from 'react';
import { X, Crown, Shield, UserCheck, Check, Key, AlertCircle } from 'lucide-react';

export default function UserSwitchModal({
  currentUser,
  users,
  onClose,
  onSwitchUser
}) {
  const [selectedUser, setSelectedUser] = useState(currentUser);
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSelect = (u) => {
    setSelectedUser(u);
    setPinInput('');
    setErrorMsg('');
  };

  const handleConfirmSwitch = (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    // Check PIN if user set PIN
    if (selectedUser.pin && pinInput.trim() !== selectedUser.pin) {
      setErrorMsg('លេខកូដសម្ងាត់ (PIN) មិនត្រឹមត្រូវឡើយ!');
      return;
    }

    onSwitchUser(selectedUser);
    onClose();
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'owner':
        return (
          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
            👑 Owner
          </span>
        );
      case 'admin':
        return (
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
            🛡️ Admin
          </span>
        );
      default:
        return (
          <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded-full font-bold">
            📋 Assistant
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-700/60">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-moul text-amber-400">
                ផ្លាស់ប្តូរគណនីប្រើប្រាស់ (Switch Role)
              </h2>
              <p className="text-xs text-slate-400 font-kantumruy">
                ជ្រើសរើសគណនីរបស់អ្នកដើម្បីចូលប្រើប្រាស់
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

        <form onSubmit={handleConfirmSwitch} className="space-y-4 font-kantumruy">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              ជ្រើសរើសគណនី (Select Profile) ៖
            </label>

            <div className="space-y-2">
              {users.map((u) => {
                const isSelected = selectedUser?.id === u.id;
                const isCurrentActive = currentUser?.id === u.id;

                return (
                  <div
                    key={u.id}
                    onClick={() => handleSelect(u)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/10 scale-[1.01]'
                        : 'border-slate-800 bg-slate-900/80 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-slate-950 shrink-0 ${
                        u.role === 'owner' ? 'bg-amber-400' : u.role === 'admin' ? 'bg-emerald-400' : 'bg-sky-400'
                      }`}>
                        {u.role === 'owner' ? <Crown className="w-4 h-4" /> : u.role === 'admin' ? <Shield className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-100">{u.name}</span>
                          {getRoleBadge(u.role)}
                        </div>
                        {isCurrentActive && (
                          <span className="text-[10px] text-amber-400 font-semibold">(កំពុងប្រើប្រាស់)</span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {selectedUser && (
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>បញ្ចូល PIN ការពារសម្រាប់ {selectedUser.name} ៖</span>
              </label>
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="ឧ. 1234..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-100 text-center font-sans-en focus:outline-none tracking-widest"
              />
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-950/50 border border-rose-800 text-rose-300 p-2.5 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95"
            >
              ប្តូរគណនីឥឡូវនេះ
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
