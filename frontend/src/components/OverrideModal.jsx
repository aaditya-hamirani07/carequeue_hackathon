import React, { useState } from 'react';
import { X, Stethoscope, ShieldAlert } from 'lucide-react';
import { TIER_CONFIG } from '../utils';

export function OverrideModal({ patient, isOpen, onClose, onSubmitOverride }) {
  if (!isOpen || !patient) return null;

  const [selectedTier, setSelectedTier] = useState(
    patient.manual_override?.new_tier || patient.urgency?.tier || 'P2_URGENT'
  );
  const [reason, setReason] = useState('');
  const [providerName, setProviderName] = useState('Dr. J. Attending, MD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const presetReasons = [
    "Clinical instinct: Patient looks more toxic than vitals reflect",
    "High-risk cardiac history with escalating symptom frequency",
    "Airway compromise potential / Rapid respiratory fatigue",
    "Awaiting critical STAT lab results",
    "Patient stable post-analgesia, safe to monitor in lower tier"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setIsSubmitting(true);
    await onSubmitOverride(patient.id, selectedTier, reason, providerName);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden text-slate-900">
        
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">Provider Priority Override</h3>
              <p className="text-xs font-mono text-slate-500">{patient.name} &bull; {patient.mrn}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-3 bg-purple-50 border-b border-purple-100 flex items-center gap-2 text-xs text-purple-800">
          <ShieldAlert className="h-4 w-4 text-purple-600 flex-shrink-0" />
          <span>Manual overrides are recorded in the permanent audit trail.</span>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">Target Urgency Tier</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TIER_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedTier(key)}
                  className={`p-2.5 rounded-lg border text-left transition ${
                    selectedTier === key
                      ? `${config.badgeClass} ring-2 ring-slate-900`
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-mono font-bold">{config.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">{config.sublabel}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Clinical Rationale (Required)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State clinical justification for override..."
              rows={3}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Quick Rationale Presets:</span>
            <div className="flex flex-wrap gap-1">
              {presetReasons.slice(0, 3).map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setReason(r)}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded border border-slate-200 text-left truncate max-w-full"
                >
                  &bull; {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Provider ID / Credential</label>
            <input
              type="text"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-900 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason.trim() || isSubmitting}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-black text-xs font-bold text-white transition shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Logging...' : 'Confirm Override'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
