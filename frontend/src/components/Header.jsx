import React from 'react';
import { Activity, RefreshCw, AlertTriangle, Clock, Users, ShieldAlert, Plus, LogOut, UserCheck, List, ClipboardCheck } from 'lucide-react';

export function Header({
  stats,
  currentUser,
  onLogout,
  onResetDemo,
  onOpenAdmit,
  onRefresh,
  isLoading,
  activeTab,
  onSetTab,
  recordsCount = 0
}) {
  const role = currentUser?.role || 'DOCTOR';

  const roleBadgeStyles = {
    RECEPTIONIST: 'bg-blue-50 text-blue-800 border-blue-200',
    NURSE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    DOCTOR: 'bg-purple-50 text-purple-800 border-purple-200',
    ADMIN: 'bg-slate-900 text-white border-slate-900',
  };

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 px-4 sm:px-6 py-2.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">

        {/* Left: Masthead + Primary Navigation */}
        <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
          {/* Logo & Clinical Product Name */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="h-8 w-8 rounded-md bg-slate-900 flex items-center justify-center text-white flex-shrink-0 shadow-xs">
              <Activity className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold tracking-tight text-slate-950 font-sans">
                  CAREQUEUE ASSIST
                </span>
                <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  SQLITE
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-tight">
                Provider decision-support / non-diagnostic
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Primary View Navigation Tabs: QUEUE vs RECORDS */}
          <nav className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 gap-0.5">
            <button
              id="nav-tab-queue"
              onClick={() => onSetTab('queue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                activeTab === 'queue'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>QUEUE</span>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'queue'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {stats?.total_active ?? 0}
              </span>
            </button>

            <button
              id="nav-tab-records"
              onClick={() => onSetTab('records')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                activeTab === 'records'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              <span>RECORDS</span>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'records'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {recordsCount}
              </span>
            </button>
          </nav>
        </div>

        {/* Center: Live Clinical Operations Telemetry Chips */}
        <div className="flex items-center gap-1.5 flex-wrap font-mono text-[11px]">
          <div className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 flex items-center gap-1.5 text-slate-700">
            <Users className="h-3 w-3 text-slate-400" />
            <span className="text-[10px] uppercase text-slate-500">Active</span>
            <strong className="text-slate-900 font-bold">{stats?.total_active ?? '--'}</strong>
          </div>

          <div className="bg-red-50/70 border border-red-200 rounded-md px-2 py-1 flex items-center gap-1.5 text-red-800">
            <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
            <span className="text-[10px] uppercase font-bold text-red-700">P1</span>
            <strong className="font-bold">{stats?.p1_immediate ?? 0}</strong>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-md px-2 py-1 flex items-center gap-1.5 text-amber-900">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-[10px] uppercase font-bold text-amber-800">P2</span>
            <strong className="font-bold">{stats?.p2_urgent ?? 0}</strong>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 flex items-center gap-1.5 text-slate-700">
            <Clock className="h-3 w-3 text-slate-400" />
            <span className="text-[10px] uppercase text-slate-500">Wait</span>
            <strong className="text-slate-900 font-bold">{stats?.avg_wait_minutes ?? '--'}m</strong>
          </div>
        </div>

        {/* Right: Staff Identity & Workstation Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Staff Badge */}
          <div
            className={`px-2.5 py-1 rounded-md border text-xs font-mono flex items-center gap-1.5 ${
              roleBadgeStyles[role] || 'bg-slate-100 text-slate-800'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span className="font-bold truncate max-w-[130px]">{currentUser?.name || role}</span>
            <span className="text-[10px] opacity-75 font-sans">({role})</span>
          </div>

          {/* Admit Patient (Nurse / Reception / Doctor / Admin) */}
          <button
            onClick={onOpenAdmit}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-black text-white font-semibold text-xs transition active:scale-95 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Admit</span>
          </button>

          {/* Refresh queue */}
          <button
            onClick={onRefresh}
            title="Refresh clinical data"
            disabled={isLoading}
            className="p-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-slate-900' : ''}`} />
          </button>

          {/* Reset Demo button for testing */}
          {(role === 'ADMIN' || role === 'DOCTOR') && (
            <button
              onClick={onResetDemo}
              title="Reset queue and records to initial 6-patient demo baseline"
              className="px-2 py-1.5 rounded-md bg-white hover:bg-slate-100 text-[11px] font-mono font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 transition active:scale-95"
            >
              Reset Demo
            </button>
          )}

          {/* Logout button */}
          <button
            onClick={onLogout}
            title="Switch staff account"
            className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition active:scale-95"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
}
export default Header;
