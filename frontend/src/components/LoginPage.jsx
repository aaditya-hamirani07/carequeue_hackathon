import React, { useState } from 'react';
import { Activity, ShieldCheck, Lock, User, ArrowRight } from 'lucide-react';

export const ROLES = {
  RECEPTIONIST: {
    key: 'RECEPTIONIST',
    label: 'Receptionist',
    defaultName: 'S. Davis (Reception)',
  },
  NURSE: {
    key: 'NURSE',
    label: 'Nurse',
    defaultName: 'Nurse J. Miller, RN',
  },
  DOCTOR: {
    key: 'DOCTOR',
    label: 'Doctor',
    defaultName: 'Dr. E. Watson, MD',
  },
  ADMIN: {
    key: 'ADMIN',
    label: 'Admin',
    defaultName: 'Clinical Admin',
  }
};

export function LoginPage({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState('DOCTOR');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    // Do NOT auto-fill login ID or password
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password.');
      return;
    }

    const roleData = ROLES[selectedRole] || ROLES.DOCTOR;
    const displayName = username.includes('@') ? roleData.defaultName : username;

    setError('');
    onLogin({
      role: selectedRole,
      name: displayName,
      roleInfo: roleData
    });
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-slate-900 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        
        {/* Masthead Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="h-7 w-7 rounded bg-slate-900 flex items-center justify-center text-white">
              <Activity className="h-4 w-4" />
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 font-sans">
            PPL
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Patient Priority List
          </p>
        </div>

        {/* Minimalist Swiss Form Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
          
          {/* Four Clean Role Options (No description) */}
          <div className="mb-5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 block mb-2">
              Select Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(ROLES).map((r) => {
                const isSelected = selectedRole === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => handleRoleSelect(r.key)}
                    className={`py-2.5 px-3 rounded-lg border text-center font-semibold text-xs transition ${
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

          {error && (
            <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 pt-2 border-t border-slate-100">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Username / Email
              </label>
              <div className="relative">
                <User className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold transition shadow-sm active:scale-98"
            >
              <span>Sign In as {ROLES[selectedRole]?.label}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
              <span>Non-diagnostic tool</span>
            </span>
            <span className="text-[10px]">Demo Access</span>
          </div>

        </div>

      </div>
    </div>
  );
}
