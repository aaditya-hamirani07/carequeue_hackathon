# CareQueue Assist (MedTech Intelligent Patient Prioritization)

> **Assistive Healthcare Prioritization & Dynamic Triage Radar**  
> Built strictly as a provider decision-support tool. Non-diagnostic, non-prescriptive, and fully transparent.

---

## 🌟 Key Capabilities
1. **Dynamic Priority Board (P1 Immediate ➔ P4 Routine):** Calculates urgency using multivariable signals (NEWS2 clinical vitals score, high-risk symptom keywords, time-decay waiting curves, and data freshness penalties).
2. **Transparent Urgency Breakdown ("Why Surfaced"):** Every patient card displays exact contributing clinical factors (e.g. `SpO2 88% severe hypoxia`, `Extended wait > 45m`, `Stale vitals alert`).
3. **Live Reassessment Flow (Demo Killer Feature):** Live simulation modal where new vitals/nursing notes trigger instant re-ranking with visual priority escalation.
4. **Provider Control & Audit Trail:** Attending providers can manually override priority tiers with required rationale, logged for auditability.
5. **Information Completeness Guard:** Alerts providers when vitals are missing or unrecorded for $>45$ minutes.

---

## 🚀 Quickstart Guide

### 1. Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
- API Docs & Swagger: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Frontend (React + Vite + Tailwind CSS)
```bash
cd frontend
npm install
npm run dev
```
- Web Application: [http://localhost:5173](http://localhost:5173)

---

## 🎬 Hackathon Judging Demo Script (2–3 Minutes)

1. **The Problem Showcase:**  
   Point out that conventional queues only sort by arrival order or static token numbers. Show how a patient with silent respiratory fatigue might sit in the waiting room behind less critical cases.
2. **Dynamic Live Reassessment:**  
   Click the preset button: **"1. Escalate Asthma Case (P3 ➔ P1)"** (Eleanor Vance).  
   Demonstrate recording repeat vitals where SpO2 drops to 88% and HR jumps to 128 bpm.  
   *Result:* Patient immediately surges to the top of the queue with itemized hypoxia factor flags.
3. **Transparent Explainability Drawer:**  
   Click on the patient card to open the detail drawer. Show the AI briefing, NEWS2 score breakdown, and the "Contributing Factors" list.
4. **Provider-in-the-Loop Override:**  
   Click **"Override Priority"** on Arthur Pendelton (chest pain). Enter clinical instinct rationale. Verify that provider authority is preserved and logged in the audit trail.
5. **1-Click Reset:**  
   Click **"Reset Demo"** in the top header to return to initial baseline.

---

## 👥 Team Parallel Work Distribution (Phase B)
- **UI/UX & Polish:** Customize Tailwind color palettes, add card animations in `frontend/src/components/`.
- **Demo Scenarios & Data:** Add new clinical patient personas in `backend/mock_data.py`.
- **Analytics View:** Expand telemetry metrics in `backend/main.py` and `frontend/src/components/Header.jsx`.
