import React from 'react';
import { TIER_CONFIG, getEffectiveTier, formatMinutes } from '../utils';
import { Clock, AlertCircle, HeartPulse, Stethoscope, ChevronRight, Flame } from 'lucide-react';

export function PatientCard({ patient, currentUser, isSelected, onSelect, onOpenVitals, onOpenOverride }) {
  const role = currentUser?.role || 'DOCTOR';
  const canReassess = role === 'NURSE' || role === 'DOCTOR' || role === 'ADMIN';
  const canOverride = role === 'DOCTOR' || role === 'ADMIN';

  const effectiveTier = getEffectiveTier(patient);
  const tierStyle = TIER_CONFIG[effectiveTier] || TIER_CONFIG.P4_ROUTINE;
  const isOverridden = !!patient.manual_override;
  const score = patient.urgency;
  const v = patient.current_vitals;

  return (
    <div
      onClick={() => onSelect(patient)}
      className={`group relative rounded-xl border p-4 transition-all duration-150 cursor-pointer bg-white ${
        isSelected
          ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-md'
          : `${tierStyle.borderClass} shadow-sm hover:shadow`
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        
        {/* Left: Priority Badge & Patient Demographic Header */}
        <div className="flex items-start gap-3.5">
          {/* Priority Tag */}
          <div className="flex flex-col items-center gap-1 pt-0.5">
            <div className={`px-2.5 py-1 rounded border text-xs font-mono font-bold flex items-center gap-1.5 ${tierStyle.badgeClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${tierStyle.dotClass}`} />
              <span>{tierStyle.code}</span>
            </div>
            {isOverridden && (
              <span className="text-[9px] font-mono font-bold text-purple-700 bg-purple-50 px-1 py-0.5 rounded border border-purple-200">
                OVERRIDE
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 group-hover:text-black text-sm tracking-tight transition">
                {patient.name}
              </h3>
              <span className="text-xs font-mono text-slate-500">
                {patient.age}y / {patient.gender[0]} &bull; {patient.mrn}
              </span>
              {score?.composite_score >= 70 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-50 text-red-700 border border-red-200">
                  <Flame className="h-2.5 w-2.5 text-red-600" /> High Acuity
                </span>
              )}
            </div>
            
            <p className="text-xs text-slate-600 font-medium mt-1 line-clamp-1">
              {patient.chief_complaint}
            </p>
          </div>
        </div>

        {/* Center: Monospaced Vital Signs Strip */}
        <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 text-center font-mono-data">
          <div className="px-1.5">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 block">HR</span>
            <span className={`text-xs font-bold ${v.heart_rate > 100 || v.heart_rate < 55 ? 'text-red-600' : 'text-slate-800'}`}>
              {v.heart_rate ?? '--'} <span className="text-[9px] font-normal text-slate-400">bpm</span>
            </span>
          </div>

          <div className="px-1.5 border-l border-slate-200">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 block">BP</span>
            <span className={`text-xs font-bold ${v.systolic_bp < 100 || v.systolic_bp > 160 ? 'text-amber-700' : 'text-slate-800'}`}>
              {v.systolic_bp ? `${v.systolic_bp}/${v.diastolic_bp}` : '--'}
            </span>
          </div>

          <div className="px-1.5 border-l border-slate-200">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 block">SpO2</span>
            <span className={`text-xs font-bold ${v.sp_o2 < 94 ? 'text-red-600' : 'text-slate-800'}`}>
              {v.sp_o2 ? `${v.sp_o2}%` : '--'}
            </span>
          </div>

          <div className="px-1.5 border-l border-slate-200">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 block">NEWS2</span>
            <span className={`text-xs font-bold ${score?.news2_score >= 5 ? 'text-red-600' : score?.news2_score >= 2 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {score?.news2_score ?? 0}
            </span>
          </div>
        </div>

        {/* Right: Metrics & Actions */}
        <div className="flex items-center justify-between md:justify-end gap-3">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-xs text-slate-500 font-mono-data">
              <Clock className="h-3 w-3 text-slate-400" />
              <span>Wait: <strong className="text-slate-900 font-bold">{formatMinutes(score?.wait_time_minutes)}</strong></span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
              Urgency: <span className="font-bold text-slate-900">{score?.composite_score ?? 0}/100</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {canReassess && (
              <button
                onClick={() => onOpenVitals(patient)}
                title="Record new vitals or reassess"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold transition active:scale-95 shadow-sm"
              >
                <HeartPulse className="h-3.5 w-3.5" />
                <span>Reassess</span>
              </button>
            )}

            {canOverride && (
              <button
                onClick={() => onOpenOverride(patient)}
                title="Provider priority override (Doctor/Admin)"
                className="p-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs transition active:scale-95"
              >
                <Stethoscope className="h-3.5 w-3.5 text-slate-600" />
              </button>
            )}

            <button
              onClick={() => onSelect(patient)}
              className="p-1.5 text-slate-400 group-hover:text-slate-900 transition"
              title="View Case Details"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Tray: Surfaced Factors */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Factors:</span>
          {score?.factors?.slice(0, 3).map((f, i) => (
            <span
              key={i}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                f.impact === 'HIGH'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : f.impact === 'MEDIUM'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <strong>{f.label}:</strong> {f.detail}
            </span>
          ))}
          {score?.factors?.length > 3 && (
            <span className="text-[10px] font-mono text-slate-400">+{score.factors.length - 3} more</span>
          )}
        </div>
      </div>

    </div>
  );
}
