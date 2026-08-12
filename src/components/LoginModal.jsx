import React, { useState } from 'react';
import { X, Mail, LogIn, Crown, Shield, UserCheck, Eye, Key, AlertCircle } from 'lucide-react';
import { GUEST_USER } from '../utils/storage';

export default function LoginModal({
  currentUser,
  users,
  onClose,
  onLoginUser
}) {
  const [emailInput, setEmailInput] = useState(currentUser?.email || '');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedEmail = emailInput.trim().toLowerCase();
    const trimmedPass = passwordInput.trim();

    if (!trimmedEmail) {
      setErrorMessage('សូមបញ្ចូល Email របស់អ្នក!');
      return;
    }

    // Check if email matches any promoted user in system
    const matchedUser = users.find(
      (u) => (u.email && u.email.toLowerCase() === trimmedEmail)
    );

    if (matchedUser) {
      const requiredPin = matchedUser.pin || '123';
      if (trimmedPass !== requiredPin) {
        setErrorMessage('ពាក្យសម្ងាត់ (Password / PIN) មិនត្រឹមត្រូវឡើយ! (Password ដើម គឺ 123)');
        return;
      }
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

  const handleFillQuick = (email, pass) => {
    setEmailInput(email);
    setPasswordInput(pass);
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 font-kantumruy">
      <div className="glass-modal w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-700/60">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-moul text-amber-400">
                ចូលប្រើប្រាស់គណនី (Login)
              </h2>
              <p className="text-xs text-slate-400">
                បញ្ចូល Email និង ពាក្យសម្ងាត់ (Password) របស់អ្នក
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

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Email គណនី ៖
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="ឧ. thonvisal12@gmail.com..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none font-sans-en"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              ពាក្យសម្ងាត់ (Password / PIN) ៖
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="123"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none font-sans-en tracking-widest"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-amber-500/20"
          >
            <LogIn className="w-4 h-4 stroke-[2.5]" />
            <span>ចូលប្រើប្រាស់ (Login)</span>
          </button>
        </form>

        {errorMessage && (
          <div className="mt-3 bg-rose-950/60 border border-rose-800 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Preset Account Quick Fill Buttons */}
        <div className="mt-5 pt-4 border-t border-slate-800 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            💡 ចុចរើសគណនីសាកល្បង (Quick Test) ៖
          </span>

          <div className="space-y-1.5 text-xs font-sans-en">
            <button
              type="button"
              onClick={() => handleFillQuick('thonvisal12@gmail.com', '123')}
              className="w-full p-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-left flex items-center justify-between text-amber-300 transition-all"
            >
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="font-bold">thonvisal12@gmail.com</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full font-bold">👑 Owner (Pass: 123)</span>
            </button>

            <button
              type="button"
              onClick={() => handleFillQuick('admin@gmail.com', '123')}
              className="w-full p-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-left flex items-center justify-between text-emerald-300 transition-all"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">admin@gmail.com</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold">🛡️ Admin (Pass: 123)</span>
            </button>

            <button
              type="button"
              onClick={() => handleFillQuick('assistant@gmail.com', '123')}
              className="w-full p-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-xl text-left flex items-center justify-between text-sky-300 transition-all"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-sky-400" />
                <span className="font-bold">assistant@gmail.com</span>
              </div>
              <span className="text-[10px] bg-sky-500/20 px-2 py-0.5 rounded-full font-bold">📋 Assistant (Pass: 123)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
