# PROJECT SPECIFICATION: MedTech Intelligent Patient Prioritization Assistant
**Project Codename:** CareQueue Assist  
**Status:** Phase 2 Complete — Functional MVP Delivered & Verified (Phase B/C Active)  
**Single Source of Truth**

---

## 1. Executive Summary & Problem Definition
In busy healthcare settings (Emergency Departments, outpatient clinics, urgent care units), multiple patients arrive with varied acuity. Conventional systems rely on arrival tokens or static triage queues (e.g., triage at check-in that never updates). Patients with deteriorating or time-sensitive conditions can wait dangerously behind less urgent cases.

**Solution:** An assistive, provider-facing web dashboard that dynamically organizes and prioritizes patient cases using multivariable clinical signals (vitals, symptoms, risk history, wait times, information freshness), providing transparent explainability while strictly leaving all diagnostic and clinical decisions to medical staff.

---

## 2. Core Guardrails (Assistive Only — Non-Negotiable)
- **NOT a Diagnostic Tool:** Never diagnoses diseases or conditions.
- **NOT a Prescriptive Tool:** Never suggests medications or treatment orders.
- **NOT an Autonomous Decision Maker:** All prioritizations are assistive recommendations. Providers can override priority, reorder, or dismiss recommendations with 1-click auditing.
- **Transparency First:** Every priority level must show clear, itemized contributing factors (e.g. "Abnormal HR > 120 + Age > 65 + 45 min wait time without vitals recheck").
- **Design Philosophy (Swiss Style / International Typographic Style):** Crisp white architectural base, mathematical grid hierarchy, hairline borders, monospaced tabular vital signs, high-contrast typography, and purposeful clinical accent indicators (no dark neon gradients or artificial gimmicks).

---

## 3. Target Users & Personas
- **Primary:** Emergency Department Triage / Charge Nurse, Attending ED Physician, Urgent Care Clinic Lead.
- **Secondary:** Triage desk staff / Medical assistants updating vitals.

---

## 4. Key Capabilities & MVP Feature Scope

### Authentication & Role-Based Access Control (RBAC)
- **Role Matrix:**
  1. **Receptionist (`RECEPTIONIST`):** "Admit Patient" available, queue viewable, clinical reassessments & overrides locked.
  2. **Triage Nurse (`NURSE`):** Patient info viewable, "Reassess Vitals" available, clinical notes entry available, overrides locked (doctor level).
  3. **Attending Physician / Doctor (`DOCTOR`):** Full clinical access: Reassess vitals, manual priority override with clinical rationale, attend cases, add clinical notes, admit patients.
  4. **System Admin (`ADMIN`):** Full system access + 1-click Demo Queue Reset + system audit telemetry.
- **Role Switching:** Live header tag with 1-click account logout/switch.

### MVP Features (Target: 60–90 min)
1. **Dynamic Provider Prioritization Board:**
   - Real-time patient list sorted by composite urgency score (combining vitals acuity, symptom severity risk, wait time decay, and data staleness).
   - Visual Urgency Badges: **Immediate (P1 / Red)**, **Urgent (P2 / Orange)**, **Delayed (P3 / Yellow)**, **Standard (P4 / Green)**.
2. **Transparent Urgency Factor Breakdown ("Why Surfaced?"):**
   - Clear breakdown of clinical factors (e.g., O2 Sat < 92%, Tachycardia, Chest pressure symptom keyword, 60m wait).
   - "Information Freshness" and "Missing Data" flags (e.g., "⚠️ Vitals unrecorded for >90 mins").
3. **Interactive Case Detail & Timeline View:**
   - Patient baseline info, presenting complaints, vitals history, risk flags, timeline of events.
4. **Live Dynamic Reassessment Flow (Demo Killer Feature):**
   - Quick modal to add new vitals or nurse check-in notes (e.g. "Patient now reports sudden dizziness, BP dropped to 90/60").
   - Instant re-calculation of urgency with visual delta indicator (e.g., "Priority escalated: P3 ➔ P1 | Factor: Systolic BP drop & new symptom").
5. **Provider Control & Action Center:**
   - "Call Next / Attend Patient", "Provider Priority Override" (with quick reason tag), "Mark as Reassessed", "Add Clinical Note".
6. **Pre-seeded Demo Scenarios:**
   - 1-click switcher to load realistic clinic situations (e.g., "Surge Morning in ED", "Deteriorating Silent Hypoxia Patient", "Incomplete Triage Data Queue").

### Post-MVP / Teammate Polish Scope (Phase B & C)
- Advanced visual analytics / Clinic Load Heatmap (wait times vs acuity).
- Audio/Visual alert pings for rapid deterioration events.
- Simulated real-time stream / auto-tick wait-time progression.
- Export case handover summary.
- Comprehensive UI/UX theming, clean healthcare dark/light mode, mobile-responsive layout.

---

## 5. System Architecture & Tech Stack

### Tech Stack Recommendation
- **Frontend:** React 18 + Vite + Tailwind CSS + Lucide React (Fast, responsive, modular components ready for team parallelization).
- **Backend:** Python FastAPI (High performance, typed Pydantic models, built-in Swagger/OpenAPI docs, seamless AI LLM integration with fast JSON responses).
- **Prioritization & Explainability Engine:**
  - *Hybrid Architecture:*
    1. **Deterministic Clinical Heuristic Engine:** Calculates baseline National Early Warning Score (NEWS2 / ESI adapted) + Wait-time escalation curve + Missing data penalties. 100% deterministic, instant (<5ms), zero network failure risk during demos.
    2. **LLM Synthesis Layer (Gemini / OpenAI / NVIDIA API or structured fallback):** Generates structured natural-language clinical factor summaries, highlight flags, and missing data inquiry suggestions.
- **Database/State Management:**
  - In-memory state store with REST persistence and JSON seed fixtures for 100% reliability, instant reset, zero external DB configuration blocker during hackathon.
- **Real-Time Updates:**
  - Fast REST polling + optimistic UI state (with optional SSE endpoint for live event feed).

---

## 6. API Specification (REST)
- `GET /api/patients` - List all active patients with current urgency score, rank, priority tier, and factor highlights.
- `GET /api/patients/:id` - Detailed case view, vitals history, timeline, full explainability breakdown.
- `POST /api/patients` - Admit/triage new patient case.
- `POST /api/patients/:id/vitals` - Record new vitals, triggers automatic instant reassessment.
- `POST /api/patients/:id/notes` - Add triage/nurse note, triggers NLP/heuristic reassessment.
- `POST /api/patients/:id/override` - Provider manual priority override with audit rationale.
- `POST /api/patients/:id/status` - Update status (Waiting, In Consultation, Triaged, Discharged).
- `POST /api/demo/reset` - Reset patient queue to pre-configured demo scenarios.
- `GET /api/analytics` - Clinic capacity, average wait times, high-acuity load.

---

## 7. Parallel Team Contribution Map (Post-MVP)
Once MVP is functional:
- **Teammate A (UI/UX & Visual Polish):** Patient cards, color schemes, badges, smooth transitions, high-contrast healthcare theme.
- **Teammate B (Data & Demo Scenarios):** Realistic clinical case personas, demo scripts, step-by-step presentation slides.
- **Teammate C (Analytics & Secondary Views):** Department overview widgets, wait-time degradation charts, provider audit log.
- **Lead / Backend:** AI prompt tuning, edge case handling, deployment packaging (Vercel + Render/Railway or self-contained Docker/runner).
