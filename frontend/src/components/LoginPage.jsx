import React, { useState } from 'react';
import { Activity, ShieldCheck, Lock, User, ArrowRight, ShieldAlert } from 'lucide-react';

export const ROLES = {
  RECEPTIONIST: {
    key: 'RECEPTIONIST',
    label: 'Receptionist',
    defaultName: 'S. Davis (Reception)',
  },
  NURSE: {
    key: 'NURSE',
    label: 'Triage Nurse',
    defaultName: 'Nurse J. Miller, RN',
  },
  DOCTOR: {
    key: 'DOCTOR',
    label: 'Attending Physician',
    defaultName: 'Dr. E. Watson, MD',
  },
  ADMIN: {
    key: 'ADMIN',
    label: 'Clinical Admin',
    defaultName: 'Clinical Admin',
  }
};

export function LoginPage({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState('DOCTOR');
  const [username, setUsername] = useState('Dr. E. Watson, MD');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');

  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    setUsername(ROLES[roleKey]?.defaultName || '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter staff identity and credential.');
      return;
    }

    const roleData = ROLES[selectedRole] || ROLES.DOCTOR;
    setError('');
    onLogin({
      role: selectedRole,
      name: username.trim(),
      roleInfo: roleData
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        
        {/* Masthead Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 mb-2.5">
            <span className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm">
              <Activity className="h-5 w-5 text-emerald-400" />
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
            CareQueue <span className="font-semibold text-slate-500 font-mono text-base">ASSIST</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium flex items-center justify-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
            <span>Provider Decision Support &bull; Strictly Non-Diagnostic</span>
          </p>
        </div>

        {/* Minimalist Swiss Form Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-sm">
          
          {/* Clinical Workstation Role Selector */}
          <div className="mb-5">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 block mb-2">
              Staff Clinical Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(ROLES).map((r) => {
                const isSelected = selectedRole === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => handleRoleSelect(r.key)}
                    className={`py-2 px-3 rounded-lg border text-center font-semibold text-xs transition ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Staff Identity / Name
              </label>
              <div className="relative">
                <User className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter staff name or ID"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Station Passkey
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Demo passkey"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-600 font-medium py-1">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm active:scale-95"
            >
              <span>Access Clinical Workstation</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Audit Logging Active</span>
            <span>Local SQLite Node</span>
          </div>

        </div>

      </div>
    </div>
  );
}
export default LoginPage;
