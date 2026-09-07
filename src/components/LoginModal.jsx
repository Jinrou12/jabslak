import React, { useState } from 'react';
import { X, Mail, LogIn, Key, AlertCircle, Crown, Shield, UserCog, User, ArrowRight } from 'lucide-react';
import { GUEST_USER, DEFAULT_USERS } from '../utils/storage';

export default function LoginModal({
  currentUser,
  users,
  onClose,
  onLoginUser
}) {
  const [emailInput, setEmailInput] = useState('owner@gmail.com');
  const [passwordInput, setPasswordInput] = useState('123');
  const [errorMessage, setErrorMessage] = useState('');

  // Quick direct 1-click login
  const handleDirectLogin = (roleName, email, defaultPin = '123') => {
    const userPool = Array.isArray(users) && users.length > 0 ? [...users, ...DEFAULT_USERS] : DEFAULT_USERS;
    const targetUser = userPool.find((u) => u.role === roleName) || DEFAULT_USERS.find((u) => u.role === roleName);
    if (targetUser) {
      onLoginUser(targetUser);
      onClose();
    }
  };

  // Quick select helper to autofill
  const handleQuickSelect = (accountEmail, defaultPin = '123') => {
    setEmailInput(accountEmail);
    setPasswordInput(defaultPin);
    setErrorMessage('');
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedEmail = emailInput.trim().toLowerCase();
    const trimmedPass = passwordInput.trim();

    if (!trimmedEmail) {
      setErrorMessage('សូមបញ្ចូល Email របស់អ្នក!');
      return;
    }

    const userPool = Array.isArray(users) && users.length > 0 ? [...users, ...DEFAULT_USERS] : DEFAULT_USERS;

    // Check if email matches any promoted user in system (with robust alias matching)
    let matchedUser = userPool.find((u) => {
      const userEmail = (u.email || '').toLowerCase().trim();
      const altEmail = (u.altEmail || '').toLowerCase().trim();

      // Direct email match
      if (userEmail === trimmedEmail || altEmail === trimmedEmail) return true;

      // Owner aliases: owner@gmail.com, thonvisal12@gmail.com, or "owner"
      if (
        u.role === 'owner' &&
        (trimmedEmail === 'owner@gmail.com' || trimmedEmail === 'thonvisal12@gmail.com' || trimmedEmail === 'owner')
      ) {
        return true;
      }

      // Admin aliases: admin@gmail.com or "admin"
      if (
        u.role === 'admin' &&
        (trimmedEmail === 'admin@gmail.com' || trimmedEmail === 'admin')
      ) {
        return true;
      }

      // Assistant aliases: assistant@gmail.com, assistion@gmail.com, or "assistant"
      if (
        u.role === 'assistant' &&
        (trimmedEmail === 'assistant@gmail.com' || trimmedEmail === 'assistion@gmail.com' || trimmedEmail === 'assistant')
      ) {
        return true;
      }

      return false;
    });

    // Guaranteed hard fallback
    if (!matchedUser) {
      if (trimmedEmail === 'owner@gmail.com' || trimmedEmail === 'owner' || trimmedEmail === 'thonvisal12@gmail.com') {
        matchedUser = DEFAULT_USERS.find((u) => u.role === 'owner');
      } else if (trimmedEmail === 'admin@gmail.com' || trimmedEmail === 'admin') {
        matchedUser = DEFAULT_USERS.find((u) => u.role === 'admin');
      } else if (trimmedEmail === 'assistant@gmail.com' || trimmedEmail === 'assistant') {
        matchedUser = DEFAULT_USERS.find((u) => u.role === 'assistant');
      }
    }

    if (matchedUser) {
      const requiredPin = matchedUser.pin || '123';
      const isPinCorrect = !trimmedPass || trimmedPass === requiredPin || trimmedPass === '123' || (trimmedPass === '1234' && !matchedUser.pin);
      
      if (!isPinCorrect) {
        setErrorMessage('ពាក្យសម្ងាត់ (Password / PIN) មិនត្រឹមត្រូវឡើយ! (ពាក្យសម្ងាត់ដើមគឺ 123)');
        return;
      }
      onLoginUser(matchedUser);
      onClose();
    } else {
      if (trimmedPass) {
        setErrorMessage(`រកមិនឃើញគណនី "${trimmedEmail}" ឡើយ! សូមចុចជ្រើសរើស Owner ឬ Admin ខាងលើ។`);
        return;
      }
      // Unpromoted Email without password -> Log in as Guest
      const guestObj = {
        ...GUEST_USER,
        email: trimmedEmail,
        name: `អ្នកមើល (${trimmedEmail.split('@')[0]})`
      };
      onLoginUser(guestObj);
      onClose();
    }
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

        {/* Quick Account Selection Shortcuts */}
        <div className="mb-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-3">
          <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center justify-between">
            <span>ចុចរើសគណនីរហ័ស (Quick Select) ៖</span>
            <span className="text-amber-400/80 text-[10px]">PIN ដើម: 123</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickSelect('owner@gmail.com', '123')}
              className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all active:scale-95 ${
                emailInput === 'owner@gmail.com'
                  ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-md shadow-amber-500/20'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-moul text-[11px]">Owner</span>
              </div>
              <span className="text-[9px] font-sans-en text-slate-400 truncate w-full text-center">owner@gmail.com</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('admin@gmail.com', '123')}
              className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all active:scale-95 ${
                emailInput === 'admin@gmail.com'
                  ? 'bg-purple-500/30 border-purple-400 text-purple-200 shadow-md shadow-purple-500/20'
                  : 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-300'
              }`}
            >
              <div className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-moul text-[11px]">Admin</span>
              </div>
              <span className="text-[9px] font-sans-en text-slate-400 truncate w-full text-center">admin@gmail.com</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('assistant@gmail.com', '123')}
              className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all active:scale-95 ${
                emailInput === 'assistant@gmail.com'
                  ? 'bg-sky-500/30 border-sky-400 text-sky-200 shadow-md shadow-sky-500/20'
                  : 'bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30 text-sky-300'
              }`}
            >
              <div className="flex items-center gap-1">
                <UserCog className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-moul text-[10px]">Assistant</span>
              </div>
              <span className="text-[9px] font-sans-en text-slate-400 truncate w-full text-center">assistant@gmail</span>
            </button>
          </div>
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
                type="text"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="owner@gmail.com"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none font-sans-en"
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
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="123"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none font-sans-en tracking-widest"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-amber-500/20 cursor-pointer"
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

        {/* Guest Mode Entry Option */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={() => {
              onLoginUser(GUEST_USER);
              onClose();
            }}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 px-3 rounded-lg hover:bg-slate-800/60"
          >
            ចូលជាអ្នកមើលធម្មតា (ចូលដោយមិនបាច់ប្រើគណនី / Guest Mode)
          </button>
        </div>

      </div>
    </div>
  );
}
