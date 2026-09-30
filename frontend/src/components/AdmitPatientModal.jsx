import React, { useState, useEffect } from 'react';
import { X, UserPlus, HeartPulse } from 'lucide-react';

export function AdmitPatientModal({ isOpen, onClose, onAdmitPatient }) {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Female');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [systolicBp, setSystolicBp] = useState('');
  const [diastolicBp, setDiastolicBp] = useState('');
  const [spO2, setSpO2] = useState('');
  const [respRate, setRespRate] = useState('');
  const [temperature, setTemperature] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !chiefComplaint.trim()) return;

    setIsSubmitting(true);
    const id = `pt-${Date.now().toString().slice(-4)}`;
    const mrn = `MRN-${Math.floor(10000 + Math.random() * 90000)}`;
    const arrivalTime = new Date().toISOString();

    const patientData = {
      id,
      mrn,
      name: name.trim(),
      age: age ? parseInt(age) : 40,
      gender,
      arrival_time: arrivalTime,
      chief_complaint: chiefComplaint.trim(),
      symptoms: symptoms.split(',').map(s => s.trim()).filter(Boolean),
      medical_history: medicalHistory.split(',').map(s => s.trim()).filter(Boolean),
      allergies: [],
      current_vitals: {
        heart_rate: heartRate ? parseInt(heartRate) : null,
        systolic_bp: systolicBp ? parseInt(systolicBp) : null,
        diastolic_bp: diastolicBp ? parseInt(diastolicBp) : null,
        resp_rate: respRate ? parseInt(respRate) : null,
        sp_o2: spO2 ? parseFloat(spO2) : null,
        temperature: temperature ? parseFloat(temperature) : null,
        gcs: 15,
        pain_score: 5,
        recorded_at: arrivalTime
      },
      vitals_history: [],
      notes: [
        {
          timestamp: arrivalTime,
          author: "Triage Reception",
          text: `Intake registered: ${chiefComplaint.trim()}`
        }
      ],
      status: "WAITING"
    };

    await onAdmitPatient(patientData);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-900 text-white">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">Admit New Patient</h3>
              <p className="text-xs text-slate-500 font-medium">Register intake demographics and baseline vitals</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 transition p-1 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Demographics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 45"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">Gender</label>
            <div className="flex gap-2">
              {['Female', 'Male', 'Other'].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold transition ${
                    gender === g
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">Chief Complaint *</label>
            <input
              type="text"
              required
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="e.g. Sudden severe left-sided chest pain radiating to jaw"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Symptoms (comma separated)</label>
              <input
                type="text"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g. chest tightness, diaphoresis"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Medical History (comma separated)</label>
              <input
                type="text"
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                placeholder="e.g. Hypertension, CAD"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
              />
            </div>
          </div>

          {/* Baseline Vitals */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 block mb-2">
              Initial Intake Vitals
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Heart Rate (bpm)</label>
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  placeholder="75"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Systolic BP (mmHg)</label>
                <input
                  type="number"
                  value={systolicBp}
                  onChange={(e) => setSystolicBp(e.target.value)}
                  placeholder="120"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Diastolic BP (mmHg)</label>
                <input
                  type="number"
                  value={diastolicBp}
                  onChange={(e) => setDiastolicBp(e.target.value)}
                  placeholder="80"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">SpO2 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={spO2}
                  onChange={(e) => setSpO2(e.target.value)}
                  placeholder="98.0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Resp Rate (/min)</label>
                <input
                  type="number"
                  value={respRate}
                  onChange={(e) => setRespRate(e.target.value)}
                  placeholder="16"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder="36.8"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>
            </div>
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
              disabled={isSubmitting || !name.trim() || !chiefComplaint.trim()}
              className="px-4 py-2 rounded-md bg-slate-900 hover:bg-black text-white text-xs font-bold transition disabled:opacity-50 active:scale-95 shadow-xs"
            >
              {isSubmitting ? 'Admitting...' : 'Admit & Prioritize'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
export default AdmitPatientModal;
