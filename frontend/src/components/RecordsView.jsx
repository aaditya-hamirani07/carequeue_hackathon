import React, { useState, useMemo } from 'react';
import { TIER_CONFIG } from '../utils';
import { Search, ClipboardCheck, ChevronRight } from 'lucide-react';

export function RecordsView({ records = [], attendedToday = 0, onSelectRecord, selectedRecordId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return records.filter(r => {
      const att = r.attendance;
      const tier = att?.tier_at_attendance || 'P4_ROUTINE';
      const matchesTier = tierFilter === 'ALL' || tierFilter === tier;

      const query = searchTerm.toLowerCase().trim();
      const matchesSearch = !query ||
        r.name?.toLowerCase().includes(query) ||
        r.mrn?.toLowerCase().includes(query) ||
        r.chief_complaint?.toLowerCase().includes(query) ||
        (r.symptoms || []).some(s => s.toLowerCase().includes(query)) ||
        att?.clinician_name?.toLowerCase().includes(query);

      return matchesTier && matchesSearch;
    });
  }, [records, searchTerm, tierFilter]);

  const formatAttendedTime = (iso) => {
    if (!iso) return '--';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (' +
        d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ')';
    } catch {
      return iso;
    }
  };

  return (
    <main className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto">

      {/* Screen Title & Summary Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-base font-extrabold text-slate-950 tracking-tight font-sans">
            ATTENDED RECORDS
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Historical record of patients attended by healthcare providers.
          </p>
        </div>

        {/* Operational Statistics */}
        <div className="flex items-center gap-2 font-mono">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-center">
            <div className="text-[10px] uppercase text-slate-500 font-semibold">Total Records</div>
            <div className="text-sm font-bold text-slate-900">{records.length}</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-center">
            <div className="text-[10px] uppercase text-emerald-700 font-semibold">Attended Today</div>
            <div className="text-sm font-bold text-emerald-800">{attendedToday}</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, MRN, complaint, clinician..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition"
          />
        </div>

        {/* Priority Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto font-mono text-xs pb-1 md:pb-0">
          {[
            { key: 'ALL', label: 'All Records' },
            { key: 'P1_IMMEDIATE', label: 'P1 IMMEDIATE' },
            { key: 'P2_URGENT', label: 'P2 VERY URGENT' },
            { key: 'P3_DELAYED', label: 'P3 URGENT' },
            { key: 'P4_ROUTINE', label: 'P4 STANDARD' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setTierFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                tierFilter === f.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

      </div>

      {/* Records Table View */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
          <ClipboardCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider font-mono">
            {records.length === 0 ? 'NO ATTENDED RECORDS' : 'NO MATCHING RECORDS'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {records.length === 0
              ? 'Patients marked as attended will appear here permanently.'
              : 'Try clearing your search query or changing the priority filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <div className="min-w-[880px]">
              
              {/* Table Column Headers */}
              <div className="grid grid-cols-[100px_180px_1fr_135px_70px_160px_140px_36px] gap-2 items-center border-b border-slate-200 bg-slate-50/90 px-4 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                <div>MRN</div>
                <div>PATIENT</div>
                <div>CHIEF COMPLAINT</div>
                <div>PRIORITY AT ATTENDANCE</div>
                <div className="text-center">NEWS2</div>
                <div>ATTENDED</div>
                <div>CLINICIAN</div>
                <div></div>
              </div>

              {/* Table Data Rows */}
              <div className="divide-y divide-slate-100">
                {filtered.map((record) => {
                  const att = record.attendance || {};
                  const tier = att.tier_at_attendance || 'P4_ROUTINE';
                  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.P4_ROUTINE;
                  const isSelected = record.id === selectedRecordId;

                  return (
                    <div
                      key={record.id}
                      onClick={() => onSelectRecord(record)}
                      className={`grid grid-cols-[100px_180px_1fr_135px_70px_160px_140px_36px] gap-2 items-center px-4 py-3.5 cursor-pointer text-xs transition group ${
                        isSelected
                          ? 'bg-slate-50 border-l-2 border-l-slate-900'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* MRN */}
                      <div className="font-mono text-slate-500 font-semibold truncate">
                        {record.mrn}
                      </div>

                      {/* Patient Name & Demographics */}
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-slate-950 truncate group-hover:text-black">
                          {record.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {record.age}y &bull; {record.gender}
                        </div>
                      </div>

                      {/* Chief Complaint */}
                      <div className="text-slate-700 truncate pr-3">
                        {record.chief_complaint}
                      </div>

                      {/* Priority At Attendance */}
                      <div>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded border text-[10px] font-mono font-bold ${tierConfig.badgeClass}`}
                        >
                          {tierConfig.label}
                        </span>
                      </div>

                      {/* NEWS2 score */}
                      <div className="text-center font-mono font-bold">
                        <span
                          className={
                            (att.news2_at_attendance ?? 0) >= 5
                              ? 'text-red-700'
                              : (att.news2_at_attendance ?? 0) >= 3
                              ? 'text-amber-700'
                              : 'text-slate-700'
                          }
                        >
                          {att.news2_at_attendance ?? '--'}
                        </span>
                      </div>

                      {/* Attended timestamp */}
                      <div className="font-mono text-slate-600 text-[11px] truncate">
                        {formatAttendedTime(att.attended_at)}
                      </div>

                      {/* Attending Clinician */}
                      <div className="font-semibold text-slate-800 text-[11px] truncate">
                        {att.clinician_name || 'Attending Clinician'}
                      </div>

                      {/* Action Chevron */}
                      <div className="text-right text-slate-400 group-hover:text-slate-900 transition">
                        <ChevronRight className="h-4 w-4" />
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      )}

    </main>
  );
}
export default RecordsView;
