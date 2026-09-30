import React, { useState, useEffect } from 'react';
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

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
    await onSubmitOverride(patient.id, selectedTier, reason.trim(), providerName.trim());
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">Provider Priority Override</h3>
              <p className="text-xs font-mono text-slate-500">{patient.name} &bull; {patient.mrn}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 transition p-1 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Warning notice */}
        <div className="p-3 bg-purple-50/80 border-b border-purple-100 flex items-center gap-2 text-xs text-purple-900 font-medium">
          <ShieldAlert className="h-4 w-4 text-purple-600 flex-shrink-0" />
          <span>Overrides require clinical rationale and are committed to permanent audit history.</span>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 block mb-2">
              Designated Urgency Tier
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TIER_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedTier(key)}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition ${
                    selectedTier === key
                      ? 'border-purple-600 bg-purple-50/80 text-purple-950 ring-1 ring-purple-600'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="font-bold font-mono">{config.label}</div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">{config.code} Tier</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700">
                Clinical Override Rationale
              </label>
            </div>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State clinical indication for modifying system calculated priority..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white resize-none"
            />
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1.5 font-bold">
              Standard Clinical Presets:
            </span>
            <div className="space-y-1">
              {presetReasons.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setReason(r)}
                  className="block w-full text-left text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-50 p-1.5 rounded transition truncate border border-transparent hover:border-slate-200"
                >
                  &bull; {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 block mb-1">
              Authorizing Physician
            </label>
            <input
              type="text"
              required
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-md border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="px-4 py-2 rounded-md bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition disabled:opacity-50 active:scale-95 shadow-xs"
            >
              {isSubmitting ? 'Committing Override...' : 'Commit Override'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
export default OverrideModal;
