import React, { useState } from 'react';
import { X, HeartPulse } from 'lucide-react';

export function VitalsModal({ patient, isOpen, onClose, onSubmitVitals }) {
  if (!isOpen || !patient) return null;

  const current = patient.current_vitals;

  const [heartRate, setHeartRate] = useState(current.heart_rate || '');
  const [systolicBp, setSystolicBp] = useState(current.systolic_bp || '');
  const [diastolicBp, setDiastolicBp] = useState(current.diastolic_bp || '');
  const [respRate, setRespRate] = useState(current.resp_rate || '');
  const [spO2, setSpO2] = useState(current.sp_o2 || '');
  const [temperature, setTemperature] = useState(current.temperature || '');
  const [gcs, setGcs] = useState(current.gcs || 15);
  const [painScore, setPainScore] = useState(current.pain_score || '');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyPreset = (preset) => {
    if (preset === 'ASTHMA_CRISIS') {
      setSpO2(88);
      setHeartRate(128);
      setRespRate(28);
      setNote('Patient experiencing acute respiratory distress, severe audible wheezing.');
    } else if (preset === 'SEPSIS_DRIFT') {
      setSystolicBp(85);
      setDiastolicBp(55);
      setTemperature(39.3);
      setHeartRate(115);
      setNote('Patient febrile, skin mottled, sudden hypotension detected on repeat check.');
    } else if (preset === 'STABILIZED') {
      setSpO2(98);
      setHeartRate(76);
      setRespRate(16);
      setSystolicBp(120);
      setDiastolicBp(78);
      setTemperature(37.0);
      setNote('Post-nebulizer stabilization, breathing unlabored.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const vitalsData = {
      heart_rate: heartRate ? parseInt(heartRate) : null,
      systolic_bp: systolicBp ? parseInt(systolicBp) : null,
      diastolic_bp: diastolicBp ? parseInt(diastolicBp) : null,
      resp_rate: respRate ? parseInt(respRate) : null,
      sp_o2: spO2 ? parseFloat(spO2) : null,
      temperature: temperature ? parseFloat(temperature) : null,
      gcs: gcs ? parseInt(gcs) : 15,
      pain_score: painScore ? parseInt(painScore) : null,
    };
    await onSubmitVitals(patient.id, vitalsData, note);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden text-slate-900">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-900 text-white">
              <HeartPulse className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">Reassess Physiological State</h3>
              <p className="text-xs font-mono text-slate-500">{patient.name} &bull; {patient.mrn}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Demo Preset Bar */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Clinical Simulation Presets:
          </div>
          <div className="flex flex-wrap gap-1.5 font-mono text-xs">
            <button
              type="button"
              onClick={() => applyPreset('ASTHMA_CRISIS')}
              className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-medium transition"
            >
              Acute Hypoxia (SpO2 88%)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('SEPSIS_DRIFT')}
              className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-medium transition"
            >
              Hypotension / Shock (BP 85)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('STABILIZED')}
              className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-medium transition"
            >
              Stabilized Normal
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Heart Rate (bpm)</label>
              <input
                type="number"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                placeholder="e.g. 110"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Systolic BP (mmHg)</label>
              <input
                type="number"
                value={systolicBp}
                onChange={(e) => setSystolicBp(e.target.value)}
                placeholder="e.g. 120"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Diastolic BP (mmHg)</label>
              <input
                type="number"
                value={diastolicBp}
                onChange={(e) => setDiastolicBp(e.target.value)}
                placeholder="e.g. 80"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">SpO2 Saturation (%)</label>
              <input
                type="number"
                step="0.1"
                value={spO2}
                onChange={(e) => setSpO2(e.target.value)}
                placeholder="e.g. 96.0"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Resp Rate (/min)</label>
              <input
                type="number"
                value={respRate}
                onChange={(e) => setRespRate(e.target.value)}
                placeholder="e.g. 18"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="e.g. 37.0"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">Nursing / Triage Observation</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Patient visibly diaphoretic, reports sudden chest tightness..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
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
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-black text-xs font-bold text-white transition shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Recalculating...' : 'Apply & Recalculate Priority'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
