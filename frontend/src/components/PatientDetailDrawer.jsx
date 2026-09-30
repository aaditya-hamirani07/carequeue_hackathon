import React, { useState, useEffect } from 'react';
import { TIER_CONFIG, getEffectiveTier, formatMinutes, formatDateTime } from '../utils';
import {
  X, HeartPulse, Stethoscope, ShieldCheck,
  FileText, Send, AlertCircle, CheckCircle2,
  ClipboardCheck, Clock, AlertTriangle, ShieldAlert
} from 'lucide-react';

export function PatientDetailDrawer({
  patient,
  currentUser,
  onClose,
  onOpenVitals,
  onOpenOverride,
  onAddNote,
  onAttend,
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

  // Global Escape key listener with capture phase to guarantee interception
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (showAttendConfirm) {
          setShowAttendConfirm(false);
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose, showAttendConfirm]);

  if (!patient) return null;

  const effectiveTier = getEffectiveTier(patient);
  const tierStyle = TIER_CONFIG[effectiveTier] || TIER_CONFIG.P4_ROUTINE;
  const score = patient.urgency;
  const v = patient.current_vitals || {};
  const att = patient.attendance;

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsSubmittingNote(true);
    await onAddNote(patient.id, newNote.trim(), isCriticalNote);
    setNewNote('');
    setIsCriticalNote(false);
    setIsSubmittingNote(false);
  };

  const handleConfirmAttend = async () => {
    setIsAttending(true);
    await onAttend(patient.id, currentUser?.name || 'Attending Clinician');
    setIsAttending(false);
    setShowAttendConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      
      {/* 1. Backdrop Overlay (click to dismiss drawer) */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity cursor-pointer animate-fadeIn"
        onClick={onClose}
        aria-label="Backdrop"
      />

      {/* 2. Slide-over Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <aside
          className="w-screen max-w-lg lg:max-w-xl bg-white shadow-2xl flex flex-col border-l border-slate-200 pointer-events-auto animate-slideLeft overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-patient-title"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* ======================================================== */}
          {/* DRAWER TOP: HEADER (Fixed / Non-scrolling, flex-shrink-0) */}
          {/* ======================================================== */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/95 flex-shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                
                {/* Priority & Status Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`px-2.5 py-0.5 rounded border text-[11px] font-mono tracking-tight font-bold ${
                      isAttended
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : tierStyle.badgeClass
                    }`}
                  >
                    {isAttended ? 'ATTENDED' : tierStyle.label}
                  </span>

                  {patient.manual_override && !isAttended && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      OVERRIDE ACTIVE
                    </span>
                  )}

                  <span className="text-[11px] font-mono text-slate-500 font-semibold">
                    {patient.mrn}
                  </span>
                </div>

                {/* Patient Name */}
                <h2
                  id="drawer-patient-title"
                  className="text-xl font-extrabold text-slate-950 tracking-tight mt-1.5 truncate"
                >
                  {patient.name}
                </h2>

                {/* Demographics & Timing */}
                <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>{patient.age} yrs &bull; {patient.gender}</span>
                  <span className="text-slate-300">&bull;</span>
                  {!isAttended ? (
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>Waited {formatMinutes(score?.wait_time_minutes)}</span>
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold">
                      Attended by {att?.clinician_name || 'Clinician'}
                    </span>
                  )}
                </div>

              </div>

              {/* Obvious Accessible Close Button */}
              <button
                type="button"
                id="close-drawer-x-btn"
                onClick={onClose}
                title="Close review (Esc)"
                className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-200/80 transition-colors flex-shrink-0"
                aria-label="Close review"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* DRAWER MIDDLE: SCROLLABLE CONTENT (flex-1 overflow-y-auto) */}
          {/* ======================================================== */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-slate-900">

            {/* Section 1: Urgency & Acuity Overview */}
            <section className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
                  {isAttended ? 'Priority at Attendance' : 'Current Urgency & Clinical Acuity'}
                </span>
                <span className="text-xs font-mono font-bold text-slate-900">
                  Composite Score: {score?.composite_score ?? 0}/100
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                <div className="bg-white border border-slate-200 rounded-lg p-2 text-center">
                  <span className="text-[9px] uppercase text-slate-400 block font-bold">Priority Tier</span>
                  <span className="font-bold text-slate-900">{tierStyle.label}</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-2 text-center">
                  <span className="text-[9px] uppercase text-slate-400 block font-bold">NEWS2 Score</span>
                  <span className={`font-bold ${score?.news2_score >= 5 ? 'text-red-700' : 'text-slate-900'}`}>
                    {score?.news2_score ?? 0}
                  </span>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-2 text-center col-span-2 sm:col-span-1">
                  <span className="text-[9px] uppercase text-slate-400 block font-bold">Total Wait</span>
                  <span className="font-bold text-slate-900">{formatMinutes(score?.wait_time_minutes)}</span>
                </div>
              </div>

              {patient.manual_override && (
                <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-xs text-purple-900">
                  <div className="font-bold flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5 text-purple-700" />
                    <span>Provider Override: {patient.manual_override.new_tier?.replace('_', ' ')}</span>
                  </div>
                  <div className="mt-1 text-purple-800 text-[11px]">
                    Rationale: {patient.manual_override.reason}
                  </div>
                  <div className="text-[10px] text-purple-600 font-mono mt-0.5">
                    Author: {patient.manual_override.provider_name || 'Attending Physician'}
                  </div>
                </div>
              )}
            </section>

            {/* Section 2: Why This Patient Is Surfaced (Explainability) */}
            <section className="space-y-2.5">
              <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                <span>Why This Patient Is Surfaced</span>
                <span className="text-[10px] text-slate-400 font-normal">Deterministic Clinical AI</span>
              </h3>

              {score?.ai_briefing && (
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium">
                  {score.ai_briefing}
                </div>
              )}

              <div className="space-y-1.5">
                {score?.factors?.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-white border border-slate-200 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                            f.impact === 'HIGH'
                              ? 'bg-red-600'
                              : f.impact === 'MEDIUM'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        <span>{f.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {f.detail}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${
                        f.impact === 'HIGH'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : f.impact === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {f.impact}
                    </span>
                  </div>
                ))}
              </div>

              {score?.missing_data_alerts?.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-700" />
                    <span>Clinical Assessment Incomplete</span>
                  </div>
                  {score.missing_data_alerts.map((alert, i) => (
                    <p key={i} className="text-[11px] text-amber-700">{alert}</p>
                  ))}
                </div>
              )}
            </section>

            {/* Section 3: Latest Observations (Current Vitals) */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
                  Latest Observations
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  Recorded {formatDateTime(v.recorded_at)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                  <span className="text-[9px] uppercase text-slate-400 block font-bold">Heart Rate</span>
                  <span className={`text-xs font-bold ${v.heart_rate > 100 || v.heart_rate < 55 ? 'text-red-700' : 'text-slate-900'}`}>
                    {v.heart_rate ?? '--'} <span className="text-[10px] font-normal text-slate-500">bpm</span>
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                  <span className="text-[9px] uppercase text-slate-400 block font-bold">Blood Press.</span>
                  <span className={`text-xs font-bold ${v.systolic_bp < 90 || v.systolic_bp > 160 ? 'text-red-700' : 'text-slate-900'}`}>
                    {v.systolic_bp ? `${v.systolic_bp}/${v.diastolic_bp}` : '--'}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                  <span className="text-[9px] uppercase text-slate-400 block font-bold">Resp Rate</span>
                  <span className={`text-xs font-bold ${v.resp_rate >= 25 || v.resp_rate <= 8 ? 'text-red-700' : 'text-slate-900'}`}>
                    {v.resp_rate ?? '--'} <span className="text-[10px] font-normal text-slate-500">/min</span>
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                  <span className="text-[9px] uppercase text-slate-400 block font-bold">SpO2 Oxygen</span>
                  <span className={`text-xs font-bold ${v.sp_o2 < 93 ? 'text-red-700' : 'text-slate-900'}`}>
                    {v.sp_o2 ? `${v.sp_o2}%` : '--'}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                  <span className="text-[9px] uppercase text-slate-400 block font-bold">Temperature</span>
                  <span className="text-xs font-bold text-slate-900">
                    {v.temperature ? `${v.temperature}°C` : '--'}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                  <span className="text-[9px] uppercase text-slate-400 block font-bold">GCS Scale</span>
                  <span className="text-xs font-bold text-slate-900">
                    {v.gcs ?? '--'}/15
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                  <span className="text-[9px] uppercase text-slate-400 block font-bold">Pain Score</span>
                  <span className="text-xs font-bold text-slate-900">
                    {v.pain_score ?? '--'}/10
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                  <span className="text-[9px] uppercase text-slate-400 block font-bold">NEWS2</span>
                  <span className={`text-xs font-bold ${score?.news2_score >= 5 ? 'text-red-700' : 'text-emerald-700'}`}>
                    {score?.news2_score ?? 0}
                  </span>
                </div>
              </div>
            </section>

            {/* Section 4: Chief Complaint & Medical History */}
            <section className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Chief Complaint</span>
                <p className="text-xs font-semibold text-slate-900 mt-0.5">{patient.chief_complaint}</p>
              </div>

              {patient.medical_history?.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Medical History</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {patient.medical_history.map((h, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Section 5: Vitals History (Trajectory) */}
            {patient.vitals_history?.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
                  Vitals Trajectory ({patient.vitals_history.length} records)
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <div className="grid grid-cols-5 bg-slate-50 p-2.5 font-mono text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <div>Time</div>
                    <div>HR</div>
                    <div>BP</div>
                    <div>SpO2</div>
                    <div>RR</div>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto font-mono text-[11px]">
                    {patient.vitals_history.map((vh, idx) => (
                      <div key={idx} className="grid grid-cols-5 p-2.5 hover:bg-slate-50">
                        <div className="text-slate-500">{formatDateTime(vh.recorded_at)}</div>
                        <div className="font-semibold">{vh.heart_rate ?? '--'}</div>
                        <div>{vh.systolic_bp ? `${vh.systolic_bp}/${vh.diastolic_bp}` : '--'}</div>
                        <div className={vh.sp_o2 < 93 ? 'text-red-600 font-bold' : ''}>{vh.sp_o2 ? `${vh.sp_o2}%` : '--'}</div>
                        <div>{vh.resp_rate ?? '--'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Section 6: Clinical Event Log / Notes */}
            <section className="space-y-2.5">
              <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                <span>Clinical Event Log & Notes</span>
                <span className="text-[10px] font-normal text-slate-400 font-mono">
                  {patient.notes?.length ?? 0} entries
                </span>
              </h3>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {patient.notes?.map((n, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border text-xs ${
                      n.is_critical || n.type === 'ATTENDANCE'
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : n.type === 'OVERRIDE'
                        ? 'bg-purple-50/70 border-purple-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                      <span className="font-bold text-slate-700">{n.author}</span>
                      <span>{formatDateTime(n.timestamp)}</span>
                    </div>
                    <p className="text-slate-800 leading-snug">{n.text}</p>
                  </div>
                ))}
              </div>

              {/* Note Entry (Active patients only) */}
              {!isAttended && canAddNote && (
                <form onSubmit={handleNoteSubmit} className="pt-2 border-t border-slate-100 space-y-2">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Record clinical observation or handover note..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isCriticalNote}
                        onChange={(e) => setIsCriticalNote(e.target.checked)}
                        className="rounded border-slate-300 text-slate-900"
                      />
                      <span>Flag as critical observation</span>
                    </label>
                    <button
                      type="submit"
                      disabled={isSubmittingNote || !newNote.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold disabled:opacity-40 transition shadow-xs"
                    >
                      <Send className="h-3 w-3" />
                      <span>Post Note</span>
                    </button>
                  </div>
                </form>
              )}
            </section>

          </div>

          {/* ======================================================== */}
          {/* DRAWER BOTTOM: STICKY ACTION BAR (Non-scrolling, flex-shrink-0) */}
          {/* ======================================================== */}
          <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-white shadow-lg flex-shrink-0 z-10">
            {!isAttended ? (
              <div className="flex items-center gap-2.5">
                {canAttend && (
                  <button
                    type="button"
                    id="drawer-attend-patient-btn"
                    onClick={() => setShowAttendConfirm(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs tracking-wide transition shadow-sm active:scale-95"
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    <span>Attend Patient</span>
                  </button>
                )}

                {canReassess && (
                  <button
                    type="button"
                    onClick={() => onOpenVitals(patient)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-slate-900 hover:bg-black text-white font-semibold text-xs transition shadow-sm active:scale-95"
                  >
                    <HeartPulse className="h-4 w-4" />
                    <span>Update Vitals</span>
                  </button>
                )}

                {canOverride && (
                  <button
                    type="button"
                    onClick={() => onOpenOverride(patient)}
                    title="Clinician Priority Override"
                    className="flex items-center justify-center p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  >
                    <Stethoscope className="h-4 w-4 text-purple-700" />
                  </button>
                )}

                {!canAttend && !canReassess && !canOverride && (
                  <div className="text-xs text-slate-500 font-mono italic py-1">
                    Read-only workstation access.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800">
                <span className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Patient Attended (Permanent Record)</span>
                </span>
                <span className="text-[11px] text-slate-500 font-sans">
                  {formatDateTime(att?.attended_at)}
                </span>
              </div>
            )}
          </div>

        </aside>
      </div>

      {/* Attend Confirmation Modal */}
      {showAttendConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <ClipboardCheck className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-950">
                  Mark patient as attended?
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  After confirmation, this patient will leave the active queue and remain available in Attended Records.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-900">{patient.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">MRN:</span>
                <span className="font-bold text-slate-700">{patient.mrn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Priority:</span>
                <span className="font-bold text-slate-900">{tierStyle.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Attending Clinician:</span>
                <span className="font-bold text-emerald-800">{currentUser?.name || 'Attending Clinician'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAttendConfirm(false)}
                disabled={isAttending}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-mark-attended-btn"
                onClick={handleConfirmAttend}
                disabled={isAttending}
                className="flex-1 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                {isAttending ? (
                  <span>Recording...</span>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Mark as Attended</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
export default PatientDetailDrawer;
