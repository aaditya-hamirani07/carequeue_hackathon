import React from 'react';
import { Activity, RefreshCw, AlertTriangle, Clock, Users, ShieldAlert, Plus, LogOut, UserCheck, List, ClipboardCheck } from 'lucide-react';

export function Header({ stats, currentUser, onLogout, onResetDemo, onOpenAdmit, onRefresh, isLoading, activeTab, onSetTab }) {
  const role = currentUser?.role || 'DOCTOR';

  const roleBadgeStyles = {
    RECEPTIONIST: 'bg-blue-50 text-blue-800 border-blue-200',
    NURSE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    DOCTOR: 'bg-purple-50 text-purple-800 border-purple-200',
    ADMIN: 'bg-slate-900 text-white border-slate-900',
  };

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 px-6 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        {/* Masthead + Nav Tabs */}
        <div className="flex items-center gap-5">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
              <Activity className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 font-sans">
                  CareQueue <span className="font-medium text-slate-500 font-mono text-xs">/ ASSIST</span>
                </h1>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  LOCAL SQLITE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                <ShieldAlert className="h-3 w-3 text-slate-400" />
                <span>Provider Decision Support &bull; Strictly Non-Diagnostic</span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5 gap-0.5">
            <button
              onClick={() => onSetTab('queue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === 'queue'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Queue</span>
              {stats?.total_active != null && (
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === 'queue' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {stats.total_active}
                </span>
              )}
            </button>
            <button
              onClick={() => onSetTab('records')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === 'records'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              <span>Records</span>
              {stats?.attended_today != null && stats.attended_today > 0 && (
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === 'records' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {stats.attended_today}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">

          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2.5">
            <Users className="h-3.5 w-3.5 text-slate-500" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Active Cases</div>
              <div className="text-xs font-mono font-bold text-slate-900">{stats?.total_active ?? '--'}</div>
            </div>
          </div>

          <div className="bg-red-50/60 border border-red-200 rounded-lg px-3 py-1.5 flex items-center gap-2.5">
            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-red-700 font-semibold">P1 Immediate</div>
              <div className="text-xs font-mono font-bold text-red-700">{stats?.p1_immediate ?? 0} High Risk</div>
            </div>
          </div>

          <div className="bg-amber-50/60 border border-amber-200 rounded-lg px-3 py-1.5 flex items-center gap-2.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-800 font-semibold">P2 Urgent</div>
              <div className="text-xs font-mono font-bold text-amber-800">{stats?.p2_urgent ?? 0} Cases</div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2.5">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Avg Wait</div>
              <div className="text-xs font-mono font-bold text-slate-900">{stats?.avg_wait_minutes ?? '--'}m</div>
            </div>
          </div>

        </div>

        {/* User Role Badge & Action Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">

          {/* Active Role Tag */}
          <div className={`px-2.5 py-1 rounded-lg border text-xs font-mono flex items-center gap-1.5 ${roleBadgeStyles[role] || 'bg-slate-100 text-slate-800'}`}>
            <UserCheck className="h-3.5 w-3.5" />
            <span className="font-bold">{currentUser?.name || role}</span>
            <span className="text-[10px] opacity-75 font-sans">({role})</span>
          </div>

          {/* Admit Patient */}
          <button
            onClick={onOpenAdmit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white font-semibold text-xs shadow-sm transition active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Admit Patient</span>
          </button>

          <button
            onClick={onRefresh}
            title="Refresh"
            disabled={isLoading}
            className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-slate-900' : ''}`} />
          </button>

          {(role === 'ADMIN' || role === 'DOCTOR') && (
            <button
              onClick={onResetDemo}
              title="Reset Queue to initial baseline"
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200 transition active:scale-95"
            >
              Reset Demo
            </button>
          )}

          {/* Log Out / Switch User */}
          <button
            onClick={onLogout}
            title="Switch staff account"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition active:scale-95"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
}
