import React, { useState } from 'react';
import { X, Mail, LogIn, Crown, Shield, UserCheck, Eye, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { GUEST_USER } from '../utils/storage';

export default function LoginModal({
  currentUser,
  users,
  onClose,
  onLoginUser
}) {
  const [emailInput, setEmailInput] = useState(currentUser?.email || '');
  const [selectedUser, setSelectedUser] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleEmailLogin = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const trimmedEmail = emailInput.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage('សូមបញ្ចូល Email ឬឈ្មោះគណនីរបស់អ្នក!');
      return;
    }

    // Check if email matches any promoted user in system
    const matchedUser = users.find(
      (u) => (u.email && u.email.toLowerCase() === trimmedEmail) || u.name.toLowerCase().includes(trimmedEmail)
    );

    if (matchedUser) {
      onLoginUser(matchedUser);
      onClose();
    } else {
      // Unpromoted Email -> Log in as Guest
      const guestObj = {
        ...GUEST_USER,
        email: trimmedEmail,
        name: `អ្នកមើល (${trimmedEmail.split('@')[0]})`
      };
      onLoginUser(guestObj);
      onClose();
    }
  };

  const handleProfileSelect = (u) => {
    setSelectedUser(u);
    setEmailInput(u.email || '');
    setPinInput('');
    setErrorMessage('');
  };

  const handleConfirmProfileLogin = (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (selectedUser.pin && pinInput.trim() !== selectedUser.pin) {
      setErrorMessage('លេខកូដសម្ងាត់ (PIN) មិនត្រឹមត្រូវឡើយ!');
      return;
    }

    onLoginUser(selectedUser);
    onClose();
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'owner':
        return <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">👑 Owner</span>;
      case 'admin':
        return <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">🛡️ Admin</span>;
      case 'assistant':
        return <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded-full font-bold">📋 Assistant</span>;
      default:
        return <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-bold">👁️ Guest</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-700/60 font-kantumruy">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-moul text-amber-400">
                ចូលប្រើប្រាស់គណនី (Email Login)
              </h2>
              <p className="text-xs text-slate-400 font-kantumruy">
                បញ្ចូល Email របស់អ្នកដើម្បីចូលប្រើប្រាស់ប្រព័ន្ធ
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

        {/* Form 1: Email Direct Login */}
        <form onSubmit={handleEmailLogin} className="space-y-3 mb-5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            ចូលប្រើតាមរយៈ Email (Firebase / Gmail) ៖
          </label>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="ឧ. user@gmail.com..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none font-sans-en"
              />
            </div>

            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shrink-0 flex items-center gap-1 active:scale-95 shadow-md shadow-amber-500/20"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed italic">
            💡 ប្រសិនបើ Email របស់អ្នកពុំទាន់បាន Promote ដោយ Owner/Admin ទេ ប្រព័ន្ធនឹងចូលជា <strong className="text-amber-400">Guest (អ្នកមើលធម្មតា)</strong> អាចមើល និងស្វែងរកស្លាកលេខបានធម្មតា។
          </p>
        </form>

        {/* Form 2: Quick Select Team Profile */}
        <div className="border-t border-slate-800 pt-4 space-y-3">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            ឬ ជ្រើសរើសគណនីក្រុមការងារ (Team Profiles) ៖
          </label>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
            {users.map((u) => {
              const isSelected = selectedUser?.id === u.id;
              const isCurrentActive = currentUser?.id === u.id;

              return (
                <div
                  key={u.id}
                  onClick={() => handleProfileSelect(u)}
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
                      <span className="text-[11px] text-slate-400 font-sans-en block">
                        {u.email || 'គ្មាន Email'} {isCurrentActive && <strong className="text-amber-400 font-kantumruy">(កំពុងប្រើ)</strong>}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedUser && (
            <form onSubmit={handleConfirmProfileLogin} className="bg-slate-900 border border-amber-500/40 p-3.5 rounded-2xl space-y-2 mt-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>បញ្ចូល PIN ការពារសម្រាប់ {selectedUser.name} ៖</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  maxLength={8}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="1234"
                  className="flex-1 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs text-slate-100 text-center font-sans-en focus:outline-none tracking-widest"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs transition-all"
                >
                  ចូលប្រើ
                </button>
              </div>
            </form>
          )}
        </div>

        {errorMessage && (
          <div className="mt-3 bg-rose-950/50 border border-rose-800 text-rose-300 p-2.5 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

      </div>
    </div>
  );
}
