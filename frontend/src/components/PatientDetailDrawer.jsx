import React, { useState, useEffect, useRef } from 'react';
import { TIER_CONFIG, getEffectiveTier, formatMinutes } from '../utils';
import {
  X, HeartPulse, Stethoscope, ShieldCheck,
  FileText, Send, AlertCircle, CheckCircle2,
  ClipboardCheck, User, ArrowLeft
} from 'lucide-react';

export function PatientDetailDrawer({
  patient,
  currentUser,
  onClose,
  onOpenVitals,
  onOpenOverride,
  onAddNote,
  onAttend,   // new: (patientId, clinicianName) => void
}) {
  const role = currentUser?.role || 'DOCTOR';
  const canReassess = role === 'NURSE' || role === 'DOCTOR' || role === 'ADMIN';
  const canOverride = role === 'DOCTOR' || role === 'ADMIN';
  const canAttend = role === 'DOCTOR' || role === 'ADMIN';
  const canAddNote = role === 'NURSE' || role === 'DOCTOR' || role === 'ADMIN';

  const [newNote, setNewNote] = useState('');
  const [isCriticalNote, setIsCriticalNote] = useState(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [showAttendConfirm, setShowAttendConfirm] = useState(false);
  const [isAttending, setIsAttending] = useState(false);

  const isAttended = patient?.status === 'ATTENDED';

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showAttendConfirm) {
          setShowAttendConfirm(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showAttendConfirm]);

  if (!patient) return null;

  const effectiveTier = getEffectiveTier(patient);
  const tierStyle = TIER_CONFIG[effectiveTier] || TIER_CONFIG.P4_ROUTINE;
  const score = patient.urgency;
  const v = patient.current_vitals;
  const att = patient.attendance;

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsSubmittingNote(true);
    await onAddNote(patient.id, newNote, isCriticalNote);
    setNewNote('');
    setIsCriticalNote(false);
    setIsSubmittingNote(false);
  };

  const handleConfirmAttend = async () => {
    setIsAttending(true);
    await onAttend(patient.id, currentUser?.name || 'Attending Provider');
    setIsAttending(false);
    setShowAttendConfirm(false);
  };

  // Format attended time nicely
  const formatAttendedAt = (iso) => {
    if (!iso) return '--';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Backdrop overlay (click to close) */}
      <div
        className="fixed inset-0 z-20 bg-slate-900/20 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="w-full lg:w-[480px] xl:w-[520px] flex-shrink-0 bg-white border-l border-slate-200 flex flex-col h-[calc(100vh-61px)] sticky top-[61px] shadow-lg overflow-y-auto z-30">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded border text-xs font-mono font-bold ${
                  isAttended 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : tierStyle.badgeClass
                }`}>
                  {isAttended ? 'ATTENDED' : tierStyle.label}
                </span>
                {patient.manual_override && !isAttended && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                    OVERRIDE
                  </span>
                )}
                <span className="text-xs font-mono text-slate-500">{patient.mrn}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1.5 truncate">{patient.name}</h2>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                {patient.age} yrs &bull; {patient.gender}
                {!isAttended && <> &bull; Waiting: {formatMinutes(score?.wait_time_minutes)}</>}
              </div>
            </div>

            {/* Close button — always visible */}
            <button
              onClick={onClose}
              title="Close (Esc)"
              className="p-2 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-900 transition flex-shrink-0"
              aria-label="Close patient detail"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Attended record badge */}
          {isAttended && att && (
            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-emerald-800">Attended</div>
                <div className="text-slate-500 font-mono">
                  {formatAttendedAt(att.attended_at)} &bull; {att.clinician_name}
                </div>
              </div>
            </div>
          )}

          {/* Action buttons — only for active patients */}
          {!isAttended && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200">
              {canReassess && (
                <button
                  onClick={() => onOpenVitals(patient)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-black text-white font-semibold text-xs transition shadow-sm active:scale-95"
                >
                  <HeartPulse className="h-4 w-4" />
                  <span>Reassess Vitals</span>
                </button>
              )}

              {canOverride && (
                <button
                  onClick={() => onOpenOverride(patient)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition active:scale-95"
                >
                  <Stethoscope className="h-4 w-4 text-slate-600" />
                  <span>Override Priority</span>
                </button>
              )}

              {canAttend && (
                <button
                  onClick={() => setShowAttendConfirm(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition shadow-sm active:scale-95"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  <span>Attend</span>
                </button>
              )}

              {!canReassess && !canOverride && (
                <div className="text-xs text-slate-500 font-mono italic py-1">
                  Read-Only Access (Reception Role)
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-5 space-y-6 flex-1 text-slate-900">

          {/* Assistive notice (active patients only) */}
          {!isAttended && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-2.5 text-xs text-slate-600">
              <ShieldCheck className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="text-slate-800">Assistive Prioritization:</strong> Highlights physiological drift and queue risk. All medical decisions remain with attending staff.
              </div>
            </div>
          )}

          {/* Attendance summary (for records view) */}
          {isAttended && att && (
            <section className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800">
                Attendance Record
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <div className="text-[10px] uppercase text-emerald-600 font-semibold">Attended At</div>
                  <div className="font-bold text-slate-900">
                    {att.attended_at ? new Date(att.attended_at).toLocaleString([], { 
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    }) : '--'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-emerald-600 font-semibold">Clinician</div>
                  <div className="font-bold text-slate-900">{att.clinician_name}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-emerald-600 font-semibold">Priority at Attendance</div>
                  <div className="font-bold text-slate-900">{att.tier_at_attendance?.replace('_', ' ')}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-emerald-600 font-semibold">NEWS2 at Attendance</div>
                  <div className="font-bold text-slate-900">{att.news2_at_attendance}</div>
                </div>
              </div>
            </section>
          )}

          {/* Factor Breakdown — show for both active and attended */}
          {score && (
            <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                  {isAttended ? 'Priority at Attendance' : 'Prioritization Rationale'}
                </h3>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {isAttended 
                    ? (att?.tier_at_attendance?.replace('_', ' ') || '--')
                    : `Urgency: ${score?.composite_score ?? 0}/100`
                  }
                </span>
              </div>

              {score?.ai_briefing && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                  {score.ai_briefing}
                </div>
              )}

              <div className="space-y-2 pt-1">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Clinical Factors:</div>
                {score?.factors?.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${
                          f.impact === 'HIGH' ? 'bg-red-600' : f.impact === 'MEDIUM' ? 'bg-amber-500' : 'bg-slate-400'
                        }`} />
                        <span>{f.label}</span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">{f.detail}</div>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                      f.impact === 'HIGH'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : f.impact === 'MEDIUM'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}>
                      {f.impact}
                    </span>
                  </div>
                ))}
              </div>

              {score?.missing_data_alerts?.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span>Information Completeness:</span>
                  </div>
                  <ul className="text-xs text-amber-900 list-disc list-inside space-y-0.5 pl-1 font-medium">
                    {score.missing_data_alerts.map((alert, i) => (
                      <li key={i}>{alert}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Latest Vitals */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                Latest Observations
              </h3>
              {v.recorded_at && (
                <span className="text-[10px] font-mono text-slate-400">
                  Recorded {new Date(v.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className={`border p-2.5 rounded-lg text-center ${v.heart_rate > 100 || v.heart_rate < 55 ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] font-mono uppercase text-slate-500">Heart Rate</div>
                <div className={`text-sm font-bold ${v.heart_rate > 100 || v.heart_rate < 55 ? 'text-red-700' : 'text-slate-900'}`}>
                  {v.heart_rate ?? '--'} <span className="text-[10px] font-normal text-slate-500">bpm</span>
                </div>
              </div>
              <div className={`border p-2.5 rounded-lg text-center ${v.systolic_bp < 100 || v.systolic_bp > 160 ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] font-mono uppercase text-slate-500">Blood Pressure</div>
                <div className={`text-sm font-bold ${v.systolic_bp < 100 || v.systolic_bp > 160 ? 'text-amber-800' : 'text-slate-900'}`}>
                  {v.systolic_bp ? `${v.systolic_bp}/${v.diastolic_bp}` : '--'} <span className="text-[10px] font-normal text-slate-500">mmHg</span>
                </div>
              </div>
              <div className={`border p-2.5 rounded-lg text-center ${v.sp_o2 < 94 ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] font-mono uppercase text-slate-500">SpO2</div>
                <div className={`text-sm font-bold ${v.sp_o2 < 94 ? 'text-red-700' : 'text-slate-900'}`}>
                  {v.sp_o2 ? `${v.sp_o2}%` : '--'}
                </div>
              </div>
              <div className={`border p-2.5 rounded-lg text-center ${v.resp_rate > 22 || v.resp_rate < 10 ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] font-mono uppercase text-slate-500">Resp Rate</div>
                <div className={`text-sm font-bold ${v.resp_rate > 22 || v.resp_rate < 10 ? 'text-red-700' : 'text-slate-900'}`}>
                  {v.resp_rate ?? '--'} <span className="text-[10px] font-normal text-slate-500">/min</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-center">
                <div className="text-[10px] font-mono uppercase text-slate-500">Temperature</div>
                <div className="text-sm font-bold text-slate-900">{v.temperature ? `${v.temperature}°C` : '--'}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-center">
                <div className="text-[10px] font-mono uppercase text-slate-500">NEWS2 Score</div>
                <div className={`text-sm font-bold ${score?.news2_score >= 5 ? 'text-red-700' : score?.news2_score >= 2 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {score?.news2_score ?? 0}
                </div>
              </div>
            </div>
          </section>

          {/* Vitals History */}
          {patient.vitals_history?.length > 1 && (
            <section className="space-y-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span>Vitals History</span>
                <span className="text-[10px] font-normal text-slate-400">({patient.vitals_history.length} records)</span>
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left border-collapse text-[11px] font-mono">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase">
                      <th className="py-1.5 px-2.5 font-semibold">Time</th>
                      <th className="py-1.5 px-2 font-semibold">HR</th>
                      <th className="py-1.5 px-2 font-semibold">BP</th>
                      <th className="py-1.5 px-2 font-semibold">SpO2</th>
                      <th className="py-1.5 px-2 font-semibold">RR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patient.vitals_history.slice().reverse().map((vh, idx) => (
                      <tr key={idx} className={idx === 0 ? 'bg-slate-50/50 font-bold text-slate-900' : 'text-slate-600'}>
                        <td className="py-1.5 px-2.5 text-slate-500 text-[10px]">
                          {vh.recorded_at ? new Date(vh.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                          {idx === 0 && <span className="ml-1 text-[9px] text-slate-400 font-semibold">(current)</span>}
                        </td>
                        <td className={`py-1.5 px-2 ${vh.heart_rate > 100 || vh.heart_rate < 55 ? 'text-red-600 font-bold' : ''}`}>
                          {vh.heart_rate ?? '--'}
                        </td>
                        <td className="py-1.5 px-2">
                          {vh.systolic_bp ? `${vh.systolic_bp}/${vh.diastolic_bp}` : '--'}
                        </td>
                        <td className={`py-1.5 px-2 ${vh.sp_o2 < 94 ? 'text-red-600 font-bold' : ''}`}>
                          {vh.sp_o2 ? `${vh.sp_o2}%` : '--'}
                        </td>
                        <td className="py-1.5 px-2">{vh.resp_rate ?? '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* History & Symptoms */}
          <section className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div>
              <span className="font-semibold text-slate-700 block mb-1">Presenting Complaint:</span>
              <div className="text-slate-800 font-medium">{patient.chief_complaint}</div>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <span className="font-semibold text-slate-700 block mb-1">Symptoms:</span>
              <div className="flex flex-wrap gap-1">
                {patient.symptoms.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {patient.medical_history?.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <span className="font-semibold text-slate-700 block mb-1">Medical History:</span>
                <div className="text-slate-600">{patient.medical_history.join(', ')}</div>
              </div>
            )}

            {patient.allergies?.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <span className="font-semibold text-red-700 block mb-1">Allergies:</span>
                <div className="text-red-600 font-medium">{patient.allergies.join(', ')}</div>
              </div>
            )}
          </section>

          {/* Clinical Event Log */}
          <section className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span>Clinical Event Log</span>
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {patient.notes?.length === 0 && (
                <div className="text-[11px] text-slate-400 font-mono italic py-2">No events recorded.</div>
              )}
              {patient.notes?.map((n, i) => (
                <div key={i} className={`p-2.5 rounded-lg border text-xs ${
                  n.note_type === 'ATTENDANCE'
                    ? 'bg-emerald-50 border-emerald-200'
                    : n.note_type === 'OVERRIDE'
                    ? 'bg-purple-50 border-purple-200'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between text-slate-500 mb-1 font-mono text-[10px]">
                    <span className="font-semibold text-slate-800">{n.author}</span>
                    <span className="flex items-center gap-1">
                      {n.note_type && n.note_type !== 'NOTE' && (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          n.note_type === 'ATTENDANCE' ? 'bg-emerald-100 text-emerald-700' :
                          n.note_type === 'OVERRIDE' ? 'bg-purple-100 text-purple-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>{n.note_type}</span>
                      )}
                      {n.timestamp ? new Date(n.timestamp).toLocaleTimeString() : ''}
                    </span>
                  </div>
                  <div className="text-slate-700">{n.text}</div>
                </div>
              ))}
            </div>

            {/* Add Note (only for active patients with permission) */}
            {canAddNote && !isAttended && (
              <form onSubmit={handleNoteSubmit} className="space-y-2 pt-1">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record nursing note or provider observation..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs text-red-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCriticalNote}
                      onChange={(e) => setIsCriticalNote(e.target.checked)}
                      className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                    <span>Flag Critical Update</span>
                  </label>

                  <button
                    type="submit"
                    disabled={!newNote.trim() || isSubmittingNote}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white font-semibold text-xs transition disabled:opacity-50"
                  >
                    <Send className="h-3 w-3" />
                    <span>Add Note</span>
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </aside>

      {/* Attend Confirmation Modal */}
      {showAttendConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setShowAttendConfirm(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <ClipboardCheck className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Mark patient as attended?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Once attended, <strong>{patient.name}</strong> will be removed from the active queue and preserved in Records.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-mono space-y-1">
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500">Patient</span>
                <span className="font-semibold">{patient.name}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500">Current Priority</span>
                <span className="font-semibold">{effectiveTier?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500">Attending Clinician</span>
                <span className="font-semibold">{currentUser?.name || 'Attending Provider'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowAttendConfirm(false)}
                disabled={isAttending}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAttend}
                disabled={isAttending}
                className="flex-1 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isAttending ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Mark as Attended</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
