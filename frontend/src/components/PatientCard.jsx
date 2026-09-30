import React from 'react';
import { TIER_CONFIG, getEffectiveTier, formatMinutes, formatDateTime } from '../utils';
import { Clock, HeartPulse, Stethoscope, ChevronRight, AlertTriangle } from 'lucide-react';

export function PatientCard({ patient, currentUser, isSelected, onSelect, onOpenVitals, onOpenOverride }) {
  const role = currentUser?.role || 'DOCTOR';
  const canReassess = role === 'NURSE' || role === 'DOCTOR' || role === 'ADMIN';
  const canOverride = role === 'DOCTOR' || role === 'ADMIN';

  const effectiveTier = getEffectiveTier(patient);
  const tierStyle = TIER_CONFIG[effectiveTier] || TIER_CONFIG.P4_ROUTINE;
  const isOverridden = !!patient.manual_override;
  const score = patient.urgency;
  const v = patient.current_vitals || {};

  return (
    <div
      onClick={() => onSelect(patient)}
      className={`group relative rounded-xl border transition-all duration-150 cursor-pointer ${
        isSelected
          ? 'bg-slate-50 border-slate-900 ring-2 ring-slate-900/15 shadow-sm'
          : `${tierStyle.borderClass} bg-white hover:bg-slate-50/80 shadow-xs hover:border-slate-300`
      }`}
    >
      <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        
        {/* LEFT ZONE: Priority + Patient Identity */}
        <div className="flex items-start gap-3.5 min-w-[270px] max-w-sm">
          {/* Priority Dominance */}
          <div className="flex flex-col items-start gap-1 flex-shrink-0 pt-0.5">
            <div className={`px-2.5 py-1 rounded-md border text-[11px] font-mono tracking-tight font-bold flex items-center gap-1.5 ${tierStyle.badgeClass}`}>
              <span className={`h-2 w-2 rounded-full ${tierStyle.dotClass} ${effectiveTier === 'P1_IMMEDIATE' ? 'animate-ping' : ''}`} />
              <span>{tierStyle.label}</span>
            </div>
            {isOverridden && (
              <span className="text-[9px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                OVERRIDE
              </span>
            )}
          </div>

          {/* Demographics & Wait Time */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-slate-950 text-sm tracking-tight group-hover:text-black transition">
                {patient.name}
              </h3>
              <span className="text-[11px] font-mono text-slate-500 font-semibold">
                {patient.mrn}
              </span>
            </div>
            
            <div className="text-[11px] text-slate-500 font-mono mt-1 flex items-center gap-2">
              <span className="font-medium">{patient.age}y &bull; {patient.gender}</span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-slate-600 flex items-center gap-1 font-medium">
                <Clock className="h-3 w-3 text-slate-400" />
                <span>{formatMinutes(score?.wait_time_minutes)} wait</span>
              </span>
            </div>
          </div>
        </div>

        {/* CENTER ZONE: Chief Complaint + Surfaced Contributing Factors */}
        <div className="flex-1 min-w-0 px-0 lg:px-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-2.5 lg:pt-0">
          <p className="text-xs font-bold text-slate-900 truncate">
            {patient.chief_complaint}
          </p>

          {/* Surfaced contributing factors */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {score?.factors?.slice(0, 3).map((f, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                  f.impact === 'HIGH'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : f.impact === 'MEDIUM'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <strong className="font-bold">{f.label}:</strong>
                <span className="truncate max-w-[160px]">{f.detail}</span>
              </span>
            ))}
            {score?.factors?.length > 3 && (
              <span className="text-[10px] font-mono text-slate-400 font-medium">
                +{score.factors.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* RIGHT ZONE: NEWS2 + Urgency + Quick Actions */}
        <div className="flex items-center justify-between lg:justify-end gap-3 pt-2.5 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-100 pl-0 lg:pl-4 flex-shrink-0">
          
          {/* Clinical Scores */}
          <div className="flex items-center gap-2 font-mono text-right">
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-center">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">NEWS2</span>
              <span
                className={`text-xs font-bold ${
                  (score?.news2_score ?? 0) >= 7
                    ? 'text-red-700'
                    : (score?.news2_score ?? 0) >= 5
                    ? 'text-amber-700'
                    : (score?.news2_score ?? 0) >= 3
                    ? 'text-yellow-700'
                    : 'text-emerald-700'
                }`}
              >
                {score?.news2_score ?? 0}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-center">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Urgency</span>
              <span className="text-xs font-bold text-slate-900">
                {score?.composite_score ?? 0}
              </span>
            </div>
          </div>

          {/* Clinical Actions */}
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {canReassess && (
              <button
                type="button"
                onClick={() => onOpenVitals(patient)}
                title="Record repeat vitals / reassess"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold transition active:scale-95 shadow-xs"
              >
                <HeartPulse className="h-3.5 w-3.5" />
                <span>Reassess</span>
              </button>
            )}

            {canOverride && (
              <button
                type="button"
                onClick={() => onOpenOverride(patient)}
                title="Clinician priority override (Doctor/Admin)"
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs transition active:scale-95"
              >
                <Stethoscope className="h-3.5 w-3.5 text-purple-700" />
              </button>
            )}

            <button
              type="button"
              onClick={() => onSelect(patient)}
              className="p-1.5 text-slate-400 hover:text-slate-900 transition"
              title="Open full clinical review"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
export default PatientCard;
