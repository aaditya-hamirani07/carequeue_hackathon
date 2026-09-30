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
import { Search, AlertTriangle, CheckCircle2, List, ClipboardCheck } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');

  // Navigation: 'queue' or 'records'
  const [activeTab, setActiveTab] = useState('queue');

  // Modals state
  const [vitalsModalPatient, setVitalsModalPatient] = useState(null);
  const [overrideModalPatient, setOverrideModalPatient] = useState(null);
  const [isAdmitOpen, setIsAdmitOpen] = useState(false);

  // Notification toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Track previous tiers to detect background priority shifts on polling
  const previousTiersRef = useRef({});

  const fetchPatients = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) setIsLoading(true);
      const res = await fetch('/api/patients');
      if (res.ok) {
        const data = await res.json();

        // Detect priority changes during background polling
        if (isPolling && Object.keys(previousTiersRef.current).length > 0) {
          data.forEach(p => {
            const currentTier = getEffectiveTier(p);
            const prevTier = previousTiersRef.current[p.id];
            if (prevTier && prevTier !== currentTier) {
              const prevLabel = TIER_CONFIG[prevTier]?.label || prevTier;
              const currentLabel = TIER_CONFIG[currentTier]?.label || currentTier;
              const isEscalation = currentTier === 'P1_IMMEDIATE' || (currentTier === 'P2_URGENT' && prevTier !== 'P1_IMMEDIATE');
              showToast(
                `Priority updated: ${p.name} shifted from ${prevLabel} to ${currentLabel}.`,
                isEscalation ? 'warning' : 'info'
              );
            }
          });
        }

        const newSnapshot = {};
        data.forEach(p => { newSnapshot[p.id] = getEffectiveTier(p); });
        previousTiersRef.current = newSnapshot;

        setPatients(data);

        // If selected patient is in active queue, keep it updated
        if (selectedPatient && selectedPatient.status !== 'ATTENDED') {
          const updated = data.find(p => p.id === selectedPatient.id);
          if (updated) setSelectedPatient(updated);
        }
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    } finally {
      if (!isPolling) setIsLoading(false);
    }
  }, [selectedPatient]);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch('/api/records');
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
        // If viewing an attended record in the drawer, keep it refreshed
        if (selectedPatient && selectedPatient.status === 'ATTENDED') {
          const updated = data.find(r => r.id === selectedPatient.id);
          if (updated) setSelectedPatient(updated);
        }
      }
    } catch (err) {
      console.error('Failed to fetch records:', err);
    }
  }, [selectedPatient]);

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

  useEffect(() => {
    fetchPatients(false);
    fetchRecords();
    fetchStats();
    const interval = setInterval(() => {
      fetchPatients(true);
      fetchRecords();
      fetchStats();
    }, 12000);
    return () => clearInterval(interval);
  }, [fetchPatients, fetchRecords, fetchStats]);

  const handleResetDemo = async () => {
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      if (res.ok) {
        await fetchPatients();
        await fetchRecords();
        await fetchStats();
        setSelectedPatient(null);
        setActiveTab('queue');
        showToast('Queue reset to initial clinical baseline.', 'success');
      }
    } catch (err) {
      showToast('Failed to reset demo', 'error');
    }
  };

  const handleAttendPatient = async (patientId, clinicianName) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/attend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinician_name: clinicianName })
      });
      if (res.ok) {
        await fetchPatients();
        await fetchRecords();
        await fetchStats();
        setSelectedPatient(null);
        showToast('Patient marked as attended.', 'success');
      } else if (res.status === 409) {
        showToast('Patient has already been attended.', 'error');
      } else {
        showToast('Error recording attendance.', 'error');
      }
    } catch (err) {
      showToast('Error recording attendance.', 'error');
    }
  };

  const handleSubmitVitals = async (patientId, vitals, note) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vitals, note })
      });
      if (res.ok) {
        const result = await res.json();
        await fetchPatients();
        await fetchStats();
        if (selectedPatient?.id === patientId) {
          setSelectedPatient(result.patient);
        }
        showToast(result.message, result.escalated ? 'warning' : 'success');
      }
    } catch (err) {
      showToast('Error updating vitals', 'error');
    }
  };

  const handleSubmitOverride = async (patientId, newTier, reason, providerName) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_tier: newTier, reason, provider_name: providerName })
      });
      if (res.ok) {
        const result = await res.json();
        await fetchPatients();
        await fetchStats();
        if (selectedPatient?.id === patientId) {
          setSelectedPatient(result.patient);
        }
        showToast(`Manual override logged for ${result.patient.name}.`, 'info');
      }
    } catch (err) {
      showToast('Error recording override', 'error');
    }
  };

  const handleAddNote = async (patientId, text, isCritical) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, is_critical_flag: isCritical })
      });
      if (res.ok) {
        const result = await res.json();
        await fetchPatients();
        if (selectedPatient?.id === patientId) {
          setSelectedPatient(result.patient);
        }
        showToast('Clinical note added.', 'success');
      }
    } catch (err) {
      showToast('Error adding note', 'error');
    }
  };

  const handleAdmitPatient = async (patientData) => {
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      });
      if (res.ok) {
        await fetchPatients();
        await fetchStats();
        showToast(`Patient ${patientData.name} admitted to queue.`, 'success');
      }
    } catch (err) {
      showToast('Error admitting patient', 'error');
    }
  };

  // Filter and Search logic (queue only)
  const filteredPatients = patients.filter(p => {
    const tier = getEffectiveTier(p);
    const matchesTier = tierFilter === 'ALL' || tierFilter === tier;
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(query) ||
      p.mrn.toLowerCase().includes(query) ||
      p.chief_complaint.toLowerCase().includes(query) ||
      p.symptoms.some(s => s.toLowerCase().includes(query));
    return matchesTier && matchesSearch;
  });

  if (!currentUser) {
    return <LoginPage onLogin={(user) => setCurrentUser(user)} />;
  }

  const showDrawer = !!selectedPatient;

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-slate-900 flex flex-col font-sans">

      {/* App Header */}
      <Header
        stats={stats}
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
        onResetDemo={handleResetDemo}
        onOpenAdmit={() => setIsAdmitOpen(true)}
        onRefresh={() => { fetchPatients(); fetchRecords(); fetchStats(); }}
        isLoading={isLoading}
        activeTab={activeTab}
        onSetTab={setActiveTab}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">

        {/* Active Queue view */}
        {activeTab === 'queue' && (
          <main className="flex-1 p-6 space-y-4 overflow-y-auto">

            {/* Filter & Search Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search patient, MRN, complaint, symptom..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 font-mono text-xs">
                {[
                  { key: 'ALL', label: 'All Cases' },
                  { key: 'P1_IMMEDIATE', label: 'P1 Immediate' },
                  { key: 'P2_URGENT', label: 'P2 Very Urgent' },
                  { key: 'P3_DELAYED', label: 'P3 Urgent' },
                  { key: 'P4_ROUTINE', label: 'P4 Standard' },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setTierFilter(f.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      tierFilter === f.key
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Patient Cards List */}
            <div className="space-y-2.5">
              {filteredPatients.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                  <p className="text-sm text-slate-500 font-medium">
                    {patients.length === 0
                      ? 'No active patients in queue.'
                      : 'No cases match current filters.'}
                  </p>
                </div>
              ) : (
                filteredPatients.map(patient => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    currentUser={currentUser}
                    isSelected={selectedPatient?.id === patient.id}
                    onSelect={(p) => setSelectedPatient(p)}
                    onOpenVitals={(p) => setVitalsModalPatient(p)}
                    onOpenOverride={(p) => setOverrideModalPatient(p)}
                  />
                ))
              )}
            </div>
          </main>
        )}

        {/* Records view */}
        {activeTab === 'records' && (
          <RecordsView
            records={records}
            attendedToday={stats?.attended_today}
            onSelectRecord={(r) => setSelectedPatient(r)}
            selectedRecordId={selectedPatient?.id}
          />
        )}

        {/* Case Detail Drawer — shown for both queue and records */}
        {showDrawer && (
          <PatientDetailDrawer
            patient={selectedPatient}
            currentUser={currentUser}
            onClose={() => setSelectedPatient(null)}
            onOpenVitals={(p) => setVitalsModalPatient(p)}
            onOpenOverride={(p) => setOverrideModalPatient(p)}
            onAddNote={handleAddNote}
            onAttend={handleAttendPatient}
          />
        )}

      </div>

      {/* Notification Toast */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-slideUp ${
          toastMessage.type === 'warning'
            ? 'bg-red-900 text-white border-red-800'
            : toastMessage.type === 'success'
            ? 'bg-slate-900 text-white border-slate-800'
            : toastMessage.type === 'error'
            ? 'bg-red-700 text-white border-red-800'
            : 'bg-white text-slate-900 border-slate-300 shadow-2xl'
        }`}>
          {toastMessage.type === 'warning' || toastMessage.type === 'error' ? (
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Vitals Modal */}
      <VitalsModal
        patient={vitalsModalPatient}
        isOpen={!!vitalsModalPatient}
        onClose={() => setVitalsModalPatient(null)}
        onSubmitVitals={handleSubmitVitals}
      />

      {/* Override Modal */}
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
