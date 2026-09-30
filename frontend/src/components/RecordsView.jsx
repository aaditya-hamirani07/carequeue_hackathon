import React, { useState, useMemo } from 'react';
import { TIER_CONFIG } from '../utils';
import { Search, ClipboardCheck, User, Calendar, Clock } from 'lucide-react';

const TIER_LABELS = {
  P1_IMMEDIATE: { label: 'P1', color: 'bg-red-50 text-red-700 border-red-200' },
  P2_URGENT: { label: 'P2', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  P3_DELAYED: { label: 'P3', color: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  P4_ROUTINE: { label: 'P4', color: 'bg-slate-50 text-slate-700 border-slate-200' },
};

function formatAttendedAt(iso) {
  if (!iso) return '--';
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function RecordsView({ records, attendedToday, onSelectRecord, selectedRecordId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return records.filter(r => {
      const att = r.attendance;
      const tier = att?.tier_at_attendance || 'P4_ROUTINE';
      const matchesTier = tierFilter === 'ALL' || tierFilter === tier;

      const query = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        r.name.toLowerCase().includes(query) ||
        r.mrn.toLowerCase().includes(query) ||
        r.chief_complaint.toLowerCase().includes(query) ||
        (r.symptoms || []).some(s => s.toLowerCase().includes(query));

      return matchesTier && matchesSearch;
    });
  }, [records, searchTerm, tierFilter]);

  return (
    <main className="flex-1 p-6 space-y-4 overflow-y-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase font-mono">
            Attended Records
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Patients attended by provider. Historical records preserved permanently.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-center">
            <div className="text-[10px] font-mono uppercase text-emerald-600">Attended Today</div>
            <div className="text-sm font-bold text-emerald-800 font-mono">{attendedToday ?? '--'}</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-center">
            <div className="text-[10px] font-mono uppercase text-slate-500">Total Records</div>
            <div className="text-sm font-bold text-slate-900 font-mono">{records.length}</div>
          </div>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, MRN, complaint, symptom..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto font-mono text-xs">
          {[
            { key: 'ALL', label: 'All' },
            { key: 'P1_IMMEDIATE', label: 'P1 Immediate' },
            { key: 'P2_URGENT', label: 'P2 Urgent' },
            { key: 'P3_DELAYED', label: 'P3 Delayed' },
            { key: 'P4_ROUTINE', label: 'P4 Routine' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setTierFilter(f.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                tierFilter === f.key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Records Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
          <ClipboardCheck className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">
            {records.length === 0 ? 'No attended records yet.' : 'No records match current filters.'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {records.length === 0
              ? 'Attended patients will appear here permanently.'
              : 'Try adjusting your search or filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_2fr_2fr_1fr_1fr_1.5fr] gap-0 border-b border-slate-200 bg-slate-50 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
            <div className="px-4 py-2.5">ID</div>
            <div className="px-3 py-2.5">Patient</div>
            <div className="px-3 py-2.5">Chief Complaint</div>
            <div className="px-3 py-2.5">Priority</div>
            <div className="px-3 py-2.5">NEWS2</div>
            <div className="px-3 py-2.5">Attended</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-100">
            {filtered.map((r) => {
              const att = r.attendance;
              const tier = att?.tier_at_attendance || 'P4_ROUTINE';
              const tierInfo = TIER_LABELS[tier] || TIER_LABELS.P4_ROUTINE;
              const isSelected = r.id === selectedRecordId;

              return (
                <button
                  key={r.id}
                  onClick={() => onSelectRecord(r)}
                  className={`w-full grid grid-cols-[1fr_2fr_2fr_1fr_1fr_1.5fr] gap-0 text-left hover:bg-slate-50 transition group ${
                    isSelected ? 'bg-slate-50 border-l-2 border-l-slate-900' : ''
                  }`}
                >
                  <div className="px-4 py-3 font-mono text-xs text-slate-500 font-semibold">
                    {r.mrn}
                  </div>
                  <div className="px-3 py-3">
                    <div className="text-xs font-semibold text-slate-900 group-hover:text-slate-900">
                      {r.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {r.age} yrs &bull; {r.gender}
                    </div>
                  </div>
                  <div className="px-3 py-3 text-xs text-slate-600 truncate pr-4 self-center">
                    {r.chief_complaint}
                  </div>
                  <div className="px-3 py-3 self-center">
                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold ${tierInfo.color}`}>
                      {tierInfo.label}
                    </span>
                  </div>
                  <div className="px-3 py-3 self-center">
                    <span className={`text-xs font-bold font-mono ${
                      (att?.news2_at_attendance ?? 0) >= 5 ? 'text-red-700'
                        : (att?.news2_at_attendance ?? 0) >= 2 ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}>
                      {att?.news2_at_attendance ?? '--'}
                    </span>
                  </div>
                  <div className="px-3 py-3 self-center">
                    <div className="text-xs font-mono text-slate-700 font-semibold">
                      {formatAttendedAt(att?.attended_at)}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {att?.clinician_name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
