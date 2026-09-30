import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { PatientCard } from './components/PatientCard';
import { PatientDetailDrawer } from './components/PatientDetailDrawer';
import { VitalsModal } from './components/VitalsModal';
import { OverrideModal } from './components/OverrideModal';
import { AdmitPatientModal } from './components/AdmitPatientModal';
import { RecordsView } from './components/RecordsView';
import { TIER_CONFIG, getEffectiveTier } from './utils';
import { Search, AlertTriangle, CheckCircle2, List, ClipboardCheck, WifiOff } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');

  // Navigation tab: 'queue' or 'records'
  const [activeTab, setActiveTab] = useState('queue');

  // Modals state
  const [vitalsModalPatient, setVitalsModalPatient] = useState(null);
  const [overrideModalPatient, setOverrideModalPatient] = useState(null);
  const [isAdmitOpen, setIsAdmitOpen] = useState(false);

  // Restrained notification toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Stable ref for selected patient to completely prevent async race conditions
  const selectedPatientRef = useRef(null);

  const handleSelectPatient = (patient) => {
    selectedPatientRef.current = patient;
    setSelectedPatient(patient);
  };

  const handleCloseDrawer = () => {
    selectedPatientRef.current = null;
    setSelectedPatient(null);
  };

  // Track previous tiers to detect background priority shifts on polling
  const previousTiersRef = useRef({});

  const fetchPatients = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) setIsLoading(true);
      const res = await fetch('/api/patients');
      if (res.ok) {
        const data = await res.json();
        setApiError(false);

        // Detect priority changes during background polling
        if (isPolling && Object.keys(previousTiersRef.current).length > 0) {
          data.forEach(p => {
            const currentTier = getEffectiveTier(p);
            const prevTier = previousTiersRef.current[p.id];
            if (prevTier && prevTier !== currentTier) {
              const currentLabel = TIER_CONFIG[currentTier]?.label || currentTier;
              showToast(
                `Priority updated: ${p.name} shifted to ${currentLabel}.`,
                currentTier === 'P1_IMMEDIATE' ? 'warning' : 'info'
              );
            }
          });
        }

        const newSnapshot = {};
        data.forEach(p => { newSnapshot[p.id] = getEffectiveTier(p); });
        previousTiersRef.current = newSnapshot;

        setPatients(data);

        // ONLY update selectedPatient if the user STILL has this patient open (checks current ref)
        if (selectedPatientRef.current && selectedPatientRef.current.status !== 'ATTENDED') {
          const targetId = selectedPatientRef.current.id;
          const updated = data.find(p => p.id === targetId);
          if (updated && selectedPatientRef.current?.id === targetId) {
            selectedPatientRef.current = updated;
            setSelectedPatient(updated);
          }
        }
      } else {
        setApiError(true);
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
      setApiError(true);
    } finally {
      if (!isPolling) setIsLoading(false);
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch('/api/records');
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
        // ONLY update selected record if user still has this record open
        if (selectedPatientRef.current && selectedPatientRef.current.status === 'ATTENDED') {
          const targetId = selectedPatientRef.current.id;
          const updated = data.find(r => r.id === targetId);
          if (updated && selectedPatientRef.current?.id === targetId) {
            selectedPatientRef.current = updated;
            setSelectedPatient(updated);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch records:', err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  // Periodic polling every 5 seconds
  useEffect(() => {
    fetchPatients(false);
    fetchRecords();
    fetchStats();
    const interval = setInterval(() => {
      fetchPatients(true);
      fetchRecords();
      fetchStats();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchPatients, fetchRecords, fetchStats]);

  // Tab switching: cleanly close drawer when switching tabs
  const handleTabChange = (newTab) => {
    handleCloseDrawer();
    setActiveTab(newTab);
  };

  // Demo Reset
  const handleResetDemo = async () => {
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      if (res.ok) {
        handleCloseDrawer();
        setActiveTab('queue');
        await fetchPatients(false);
        await fetchRecords();
        await fetchStats();
        showToast('Queue reset to initial clinical baseline.', 'success');
      }
    } catch (err) {
      showToast('Failed to reset demo.', 'error');
    }
  };

  // Attend Patient workflow
  const handleAttendPatient = async (patientId, clinicianName) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/attend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinician_name: clinicianName })
      });
      if (res.ok) {
        // Close drawer immediately for instant responsive UI feedback
        handleCloseDrawer();
        showToast('Patient marked as attended.', 'success');
        // Refresh queue and records
        await fetchPatients(false);
        await fetchRecords();
        await fetchStats();
      } else if (res.status === 409) {
        showToast('Patient has already been attended.', 'warning');
      } else {
        showToast('Error recording attendance.', 'error');
      }
    } catch (err) {
      showToast('Error connecting to attendance service.', 'error');
    }
  };

  // Record vitals
  const handleSubmitVitals = async (patientId, vitals, note) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vitals, note })
      });
      if (res.ok) {
        const result = await res.json();
        await fetchPatients(false);
        await fetchStats();
        if (selectedPatientRef.current?.id === patientId) {
          selectedPatientRef.current = result.patient;
          setSelectedPatient(result.patient);
        }
        showToast('Vitals reassessment saved.', result.escalated ? 'warning' : 'success');
      }
    } catch (err) {
      showToast('Error updating vitals.', 'error');
    }
  };

  // Override priority
  const handleSubmitOverride = async (patientId, newTier, reason, providerName) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_tier: newTier, reason, provider_name: providerName })
      });
      if (res.ok) {
        const result = await res.json();
        await fetchPatients(false);
        await fetchStats();
        if (selectedPatientRef.current?.id === patientId) {
          selectedPatientRef.current = result.patient;
          setSelectedPatient(result.patient);
        }
        showToast('Override recorded.', 'info');
      }
    } catch (err) {
      showToast('Error recording override.', 'error');
    }
  };

  // Add clinical note
  const handleAddNote = async (patientId, text, isCritical) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, is_critical_flag: isCritical })
      });
      if (res.ok) {
        const result = await res.json();
        await fetchPatients(false);
        if (selectedPatientRef.current?.id === patientId) {
          selectedPatientRef.current = result.patient;
          setSelectedPatient(result.patient);
        }
        showToast('Clinical note added.', 'success');
      }
    } catch (err) {
      showToast('Error adding note.', 'error');
    }
  };

  // Admit new patient
  const handleAdmitPatient = async (patientData) => {
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      });
      if (res.ok) {
        await fetchPatients(false);
        await fetchStats();
        showToast(`Patient ${patientData.name} admitted to queue.`, 'success');
      }
    } catch (err) {
      showToast('Error admitting patient.', 'error');
    }
  };

  // Search & filter
  const filteredPatients = patients.filter(p => {
    const tier = getEffectiveTier(p);
    const matchesTier = tierFilter === 'ALL' || tierFilter === tier;
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      p.name?.toLowerCase().includes(query) ||
      p.mrn?.toLowerCase().includes(query) ||
      p.chief_complaint?.toLowerCase().includes(query) ||
      (p.symptoms || []).some(s => s.toLowerCase().includes(query));
    return matchesTier && matchesSearch;
  });

  if (!currentUser) {
    return <LoginPage onLogin={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">

      {/* Main Clinical Workstation Masthead */}
      <Header
        stats={stats}
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
        onResetDemo={handleResetDemo}
        onOpenAdmit={() => setIsAdmitOpen(true)}
        onRefresh={() => { fetchPatients(); fetchRecords(); fetchStats(); }}
        isLoading={isLoading}
        activeTab={activeTab}
        onSetTab={handleTabChange}
        recordsCount={records.length}
      />

      {/* API offline warning banner */}
      {apiError && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 flex items-center justify-between text-xs text-red-800">
          <div className="flex items-center gap-2 font-medium">
            <WifiOff className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span>Backend API service unreachable at http://127.0.0.1:8000. Re-attempting connection...</span>
          </div>
          <button
            onClick={() => { fetchPatients(); fetchRecords(); fetchStats(); }}
            className="text-[11px] font-bold text-red-900 underline hover:no-underline"
          >
            Retry Now
          </button>
        </div>
      )}

      {/* Primary Workspace View Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col">

        {/* ACTIVE QUEUE VIEW */}
        {activeTab === 'queue' && (
          <main className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto">

            {/* Queue Filter & Search Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search patient, MRN, complaint, symptom..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition"
                />
              </div>

              {/* Priority Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto font-mono text-xs pb-1 sm:pb-0">
                {[
                  { key: 'ALL', label: 'All Cases' },
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

            {/* Patient Cards / Rows List */}
            <div className="space-y-2.5">
              {isLoading && patients.length === 0 ? (
                // Loading Skeleton Rows
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                      <div className="flex items-center justify-between gap-4">
                        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/6"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
                  <List className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider font-mono">
                    {patients.length === 0 ? 'NO ACTIVE PATIENTS IN QUEUE' : 'NO MATCHING CASES'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {patients.length === 0
                      ? 'All admitted patients have been attended or discharged.'
                      : 'No cases match your search query or priority filter.'}
                  </p>
                </div>
              ) : (
                filteredPatients.map(patient => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    currentUser={currentUser}
                    isSelected={selectedPatient?.id === patient.id}
                    onSelect={handleSelectPatient}
                    onOpenVitals={(p) => setVitalsModalPatient(p)}
                    onOpenOverride={(p) => setOverrideModalPatient(p)}
                  />
                ))
              )}
            </div>

          </main>
        )}

        {/* ATTENDED RECORDS VIEW */}
        {activeTab === 'records' && (
          <RecordsView
            records={records}
            attendedToday={stats?.attended_today ?? 0}
            onSelectRecord={handleSelectPatient}
            selectedRecordId={selectedPatient?.id}
          />
        )}

      </div>

      {/* Case Detail Drawer — Always accessible, reliable close, sticky bottom action bar */}
      {selectedPatient && (
        <PatientDetailDrawer
          patient={selectedPatient}
          currentUser={currentUser}
          onClose={handleCloseDrawer}
          onOpenVitals={(p) => setVitalsModalPatient(p)}
          onOpenOverride={(p) => setOverrideModalPatient(p)}
          onAddNote={handleAddNote}
          onAttend={handleAttendPatient}
        />
      )}

      {/* Restrained Clinical Notification Toast */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-70 px-4 py-2.5 rounded-lg border shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-slideUp ${
            toastMessage.type === 'warning'
              ? 'bg-amber-900 text-white border-amber-800'
              : toastMessage.type === 'success'
              ? 'bg-slate-900 text-white border-slate-800'
              : toastMessage.type === 'error'
              ? 'bg-red-800 text-white border-red-700'
              : 'bg-white text-slate-900 border-slate-300 shadow-md'
          }`}
        >
          {toastMessage.type === 'warning' || toastMessage.type === 'error' ? (
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Vitals Reassessment Modal */}
      <VitalsModal
        patient={vitalsModalPatient}
        isOpen={!!vitalsModalPatient}
        onClose={() => setVitalsModalPatient(null)}
        onSubmitVitals={handleSubmitVitals}
      />

      {/* Override Priority Modal */}
      <OverrideModal
        patient={overrideModalPatient}
        isOpen={!!overrideModalPatient}
        onClose={() => setOverrideModalPatient(null)}
        onSubmitOverride={handleSubmitOverride}
      />

      {/* Admit Patient Modal */}
      <AdmitPatientModal
        isOpen={isAdmitOpen}
        onClose={() => setIsAdmitOpen(false)}
        onAdmitPatient={handleAdmitPatient}
      />

    </div>
  );
}
export default App;
