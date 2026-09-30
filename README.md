# CareQueue Assist

**Assistive Clinical Patient Prioritisation & Attended Records Workstation**

CareQueue Assist helps healthcare providers organise and prioritise patient cases using structured clinical data — NEWS2 vital signs scoring, symptom analysis, wait time weighting, and provider attendance history.

> **CLINICAL SAFETY NOTICE:** CareQueue Assist is strictly a provider decision-support tool. It does not diagnose, prescribe, recommend treatment, or make final clinical decisions. Qualified healthcare professionals remain the sole clinical decision-makers at all times.

---

## Key Features

1. **Active Clinical Prioritisation Queue**
   - Deterministic Royal College of Physicians NEWS2 physiological scoring.
   - Multi-factor urgency engine incorporating vitals, red-flag symptoms, wait time drift, and patient medical history.
   - Dynamic real-time re-ranking when repeat vitals or clinical deterioration occur.
   - Clear clinical priority tiers: `P1 IMMEDIATE`, `P2 VERY URGENT`, `P3 URGENT`, `P4 STANDARD`.
   - Never communicates priority via colour alone — explicit clinical text and high-contrast badges throughout.

2. **Attended Patient Records Workflow**
   - Operational **"Attend Patient"** workflow with verification confirmation modal.
   - Once attended, patient leaves the active queue immediately and is preserved permanently in **Attended Records**.
   - Top-level primary navigation between **QUEUE** and **RECORDS** with live count badges.
   - Detailed clinical history table with live search (name, MRN, complaint, clinician) and priority filtering.
   - Read-only historical record view in the drawer with attendance timestamp and attending clinician metadata.

3. **Clinician Override & Audit Trail**
   - Attending physicians and administrators can override system-calculated priority with mandatory clinical rationale.
   - Immutable audit trail recording every intake, vitals observation, provider override, clinical note, and attendance event.

4. **Local-First Deterministic AI Briefings**
   - Structured, explainable clinical briefings generated locally and offline — **zero external API keys required**.
   - Fully deterministic and instant; optional fallback to external LLMs (Gemini / OpenAI) via `.env` if desired.

5. **Local SQLite Persistence**
   - Stored in `data/carequeue.db` with write-ahead logging (WAL mode).
   - All patient observations, overrides, and attendance records persist across server restarts.
   - One-click **Demo Reset** (`POST /api/demo/reset`) restores the initial 6-patient demo baseline.

---

## Project Structure

```
abc/
├── backend/                   # FastAPI application
│   ├── main.py                # REST API endpoints & route handlers
│   ├── database.py            # SQLite schema, queries & WAL connection
│   ├── models.py              # Pydantic data schemas & enums
│   ├── scoring_engine.py      # Deterministic NEWS2 + urgency scoring model
│   ├── ai_engine.py           # Local-first explainability & clinical briefings
│   ├── mock_data.py           # Initial 6-patient seed dataset
│   └── requirements.txt       # Backend dependencies
│
├── frontend/                  # React 18 + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/        # Header, PatientCard, PatientDetailDrawer, RecordsView, modals
│   │   ├── App.jsx            # Main workstation shell & navigation tabs
│   │   ├── utils.js           # Explicit priority tier configs & formatters
│   │   └── index.css          # Clinical typography & styles
│   └── package.json
│
├── tests/                     # Automated test suites
│   ├── test_backend.py        # Unit tests: NEWS2 scoring, SQLite models
│   ├── test_e2e.py            # End-to-end integration tests: vitals escalation, overrides, attendance
│   └── test_attendance.py     # Attendance workflow & restart persistence verification
│
├── data/                      # Local SQLite persistence directory
│   ├── .gitkeep
│   └── carequeue.db           # SQLite database file (git-ignored)
│
├── test_backend.py            # Root entry point → delegates to tests/test_backend.py
├── test_e2e.py                # Root entry point → delegates to tests/test_e2e.py
├── run.bat                    # Windows launcher (FastAPI on :8000, Vite on :5173)
├── start.sh                   # Unix/macOS launcher
├── requirements.txt           # Root Python dependencies
├── .env.example               # Environment variable reference
└── .gitignore
```

---

## Database Schema (SQLite)

Data is persisted in `data/carequeue.db`:

| Table                | Purpose                                                                 |
|----------------------|-------------------------------------------------------------------------|
| `patients`           | Active and attended patient master records, vitals snapshot, status     |
| `vitals_history`     | Chronological log of all recorded vitals sets per patient               |
| `audit_notes`        | Clinical notes, provider overrides, and attendance audit trail          |
| `attendance_records` | Dedicated attended records with timestamp, clinician, tier, and NEWS2  |

---

## Setup & Running

### Requirements
- Python 3.9+
- Node.js 18+

### Quick Start (Windows)
```bat
.\run.bat
```
Launches the FastAPI backend on `http://127.0.0.1:8000` and Vite frontend on `http://localhost:5173`.

### Quick Start (Unix / macOS)
```bash
bash start.sh
```

### Manual Setup

1. **Install backend dependencies:**
```bash
pip install -r requirements.txt
```

2. **Install frontend dependencies:**
```bash
cd frontend
npm install
cd ..
```

3. **Start backend (Terminal 1):**
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

4. **Start frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```

Open: **http://localhost:5173**

---

## API Reference

| Method | Endpoint                        | Description                                                    |
|--------|---------------------------------|----------------------------------------------------------------|
| GET    | `/api/patients`                 | Active patients sorted by priority tier and urgency score      |
| GET    | `/api/patients/{id}`            | Patient detail with clinical briefing and history              |
| POST   | `/api/patients`                 | Admit new patient into active queue                            |
| POST   | `/api/patients/{id}/vitals`     | Record repeat vitals; dynamically recalculates NEWS2 & urgency |
| POST   | `/api/patients/{id}/override`   | Provider priority override with required audit rationale       |
| POST   | `/api/patients/{id}/notes`      | Append clinical observation note                               |
| POST   | `/api/patients/{id}/status`     | Update triage status                                           |
| POST   | `/api/patients/{id}/attend`     | Mark patient as attended (moves from Queue to Records)         |
| GET    | `/api/records`                  | Retrieve all attended patient history records (newest first)   |
| GET    | `/api/stats`                    | Queue telemetry (active cases, P1, P2, avg wait, attended)     |
| POST   | `/api/demo/reset`               | Reset database to initial 6-patient demo baseline              |

Interactive Swagger Documentation: **http://127.0.0.1:8000/docs**

---

## Running Tests

```bash
# 1. Clinical scoring & SQLite unit tests
python test_backend.py

# 2. Complete End-to-End API & attendance integration suite (backend running)
python test_e2e.py

# 3. Attendance & restart persistence test
python tests/test_attendance.py

# 4. Frontend production compilation
cd frontend && npm run build
```

---

## Clinical Safety & Limitations

- **Provider Decision Support Only:** The system organises information to assist staff; it does not replace clinical judgement.
- **Dynamic Recalculation:** Urgency scores factor in dynamic wait times to surface physiological staleness.
- **Single-Node Persistence:** Designed for clinical workstations using SQLite WAL mode.
- **No Treatment Recommendations:** CareQueue Assist does not prescribe medication, suggest treatments, or make triage decisions autonomously.
