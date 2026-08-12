import React, { useState } from 'react';
import { X, Shield, Crown, UserCheck, Plus, Trash2, Edit2, Key, Phone, User, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

export default function RoleManagementModal({
  currentUser,
  users,
  onClose,
  onSaveUser,
  onDeleteUser
}) {
  const isOwner = currentUser?.role === 'owner';
  const isAdmin = currentUser?.role === 'admin';

  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'assistant',
    phone: '',
    pin: '1234'
  });
  const [errorMessage, setErrorMessage] = useState('');

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'assistant', phone: '', pin: '1234' });
    setErrorMessage('');
    setIsAddFormOpen(true);
  };

  const handleOpenEdit = (u) => {
    if (isAdmin && u.role === 'owner') {
      setErrorMessage('Admin គ្មានសិទ្ធិកែប្រែ ឬដកតំណែង Owner ឡើយ!');
      return;
    }
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email || '',
      role: u.role,
      phone: u.phone || '',
      pin: u.pin || '1234'
    });
    setErrorMessage('');
    setIsAddFormOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage('សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់');
      return;
    }

    if (isAdmin && formData.role === 'owner') {
      setErrorMessage('Admin គ្មានសិទ្ធិតម្លើងនរណាម្នាក់ជា Owner ឡើយ!');
      return;
    }

    const userData = {
      id: editingUser ? editingUser.id : `u-${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      role: formData.role,
      phone: formData.phone.trim(),
      pin: formData.pin.trim() || '1234'
    };

    onSaveUser(userData);
    setIsAddFormOpen(false);
    setEditingUser(null);
  };

  const handleDelete = (u) => {
    if (u.role === 'owner') {
      alert('មិនអាចលុបគណនី Owner បានទេ! (ត្រូវផ្ទេរ Owner ទៅអ្នកផ្សេងជាមុនសិន)');
      return;
    }
    if (isAdmin && u.role === 'owner') {
      alert('Admin គ្មានសិទ្ធិលុប Owner ឡើយ!');
      return;
    }
    if (window.confirm(`តើអ្នកពិតជាចង់លុបគណនី ${u.name} (${u.role}) មែនទេ?`)) {
      onDeleteUser(u.id);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'owner':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full text-xs font-bold font-kantumruy">
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Owner (ម្ចាស់ប្រព័ន្ធ)</span>
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full text-xs font-bold font-kantumruy">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Admin (អ្នកគ្រប់គ្រង)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2.5 py-1 rounded-full text-xs font-bold font-kantumruy">
            <UserCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Assistant (អ្នកជំនួយការ)</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-2xl rounded-3xl p-5 sm:p-6 shadow-2xl relative border border-slate-700/60 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-moul text-amber-400">
                គ្រប់គ្រងឋានានុក្រម និងសិទ្ធិប្រើប្រាស់
              </h2>
              <p className="text-xs text-slate-400 font-kantumruy">
                រៀបចំគណនី Owner, Admin, និង Assistant សម្រាប់ក្រុមការងារ
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

        {errorMessage && (
          <div className="mb-4 bg-rose-950/50 border border-rose-800 text-rose-300 p-3 rounded-2xl text-xs flex items-center gap-2 font-kantumruy shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          
          {/* Active User Card & Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">គណនីរបស់អ្នកបច្ចុប្បន្ន</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold text-slate-100 font-kantumruy">{currentUser?.name}</span>
                {getRoleBadge(currentUser?.role)}
              </div>
            </div>

            {(isOwner || isAdmin) && (
              <button
                onClick={handleOpenAdd}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>បន្ថែមគណនីថ្មី</span>
              </button>
            )}
          </div>

          {/* Add / Edit Form Modal inside */}
          {isAddFormOpen && (
            <form onSubmit={handleSubmit} className="bg-slate-900 border-2 border-amber-500/40 p-4 rounded-2xl space-y-3 animate-in slide-in-from-top-3 duration-200">
              <h3 className="text-sm font-bold text-amber-300 font-moul flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-400" />
                <span>{editingUser ? 'កែប្រែព័ត៌មានគណនី' : 'បន្ថែមគណនីអ្នកប្រើប្រាស់ថ្មី'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">ឈ្មោះអ្នកប្រើប្រាស់ *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ឧ. សុខ ចាន់..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email សម្រាប់ Promote (Login) *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ឧ. user@gmail.com..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-sans-en"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">ឋានានុក្រម / Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="assistant">📋 Assistant (គ្រីសមកដល់ + មើលទីតាំង)</option>
                    <option value="admin">🛡️ Admin (គ្រប់គ្រងទិន្នន័យ + មិនអាចលុប Owner)</option>
                    {isOwner && <option value="owner">👑 Owner (សិទ្ធិពេញលេញលើ Web)</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">លេខទូរស័ព្ទ (Phone)</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="ឧ. 012345678"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-sans-en"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">លេខកូដសម្ងាត់ (PIN)</label>
                  <input
                    type="text"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    placeholder="1234"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-sans-en"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddFormOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-1.5 rounded-xl text-xs font-semibold"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs transition-all"
                >
                  រក្សាទុក
                </button>
              </div>
            </form>
          )}

          {/* User List Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-kantumruy">
              បញ្ជីគណនីក្នុងប្រព័ន្ធ ({users.length} នាក់)
            </h3>

            <div className="space-y-2">
              {users.map((u) => {
                const isTargetOwner = u.role === 'owner';
                const canModifyThisUser = isOwner || (isAdmin && !isTargetOwner);

                return (
                  <div
                    key={u.id}
                    className={`bg-slate-900/90 border rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                      isTargetOwner ? 'border-amber-500/50 bg-amber-950/10' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-slate-950 shrink-0 ${
                        isTargetOwner ? 'bg-amber-500' : u.role === 'admin' ? 'bg-emerald-400' : 'bg-sky-400'
                      }`}>
                        {isTargetOwner ? <Crown className="w-5 h-5" /> : u.role === 'admin' ? <Shield className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-100 font-kantumruy">{u.name}</h4>
                          {getRoleBadge(u.role)}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-sans-en">
                          {u.email && <span className="text-amber-400 font-semibold">✉️ {u.email}</span>}
                          {u.phone && <span>📞 {u.phone}</span>}
                          <span>🔑 PIN: {u.pin || '1234'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      {isAdmin && isTargetOwner && (
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>🔒 ការពារដោយ Owner</span>
                        </span>
                      )}

                      {canModifyThisUser && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs transition-all"
                            title="កែប្រែគណនី"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {!isTargetOwner && (
                            <button
                              onClick={() => handleDelete(u)}
                              className="p-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-400 rounded-xl text-xs transition-all"
                              title="លុបគណនី"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hierarchy Guide Explanation Box */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-2 text-xs text-slate-300">
            <h4 className="font-bold text-amber-400 font-moul">💡 កម្រិតសិទ្ធិនីមួយៗ (Permission Matrix) ៖</h4>
            <ul className="space-y-1.5 list-disc list-inside text-slate-400 leading-relaxed font-kantumruy">
              <li><strong className="text-amber-300 font-semibold">Owner 👑</strong> ៖ មានសិទ្ធិគ្រប់យ៉ាងក្នុង Web អាចផ្ទេរតំណែង Owner ឬតម្លើង/ដក Admin & Assistant បាន។</li>
              <li><strong className="text-emerald-300 font-semibold">Admin 🛡️</strong> ៖ មានសិទ្ធិដូច Owner (បន្ថែម កែប្រែ លុប Excel) ប៉ុន្តែ **គ្មានសិទ្ធិលុប ឬដក Owner ឡើយ**។</li>
              <li><strong className="text-sky-300 font-semibold">Assistant 📋</strong> ៖ មានសិទ្ធិ **មើលព័ត៌មាន និងទីតាំងប៉ុណ្ណោះ** (មិនអាចបន្ថែម កែប្រែ ឬលុបទិន្នន័យឡើយ)។</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}
