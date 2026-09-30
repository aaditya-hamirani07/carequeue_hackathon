# CareQueue Assist

**Assistive Clinical Patient Prioritisation Dashboard**

CareQueue Assist helps healthcare providers organise and prioritise patient cases using structured clinical data — NEWS2 vital signs scoring, symptom analysis, and wait time weighting. It is a provider decision-support tool only. It does not diagnose, prescribe, or make final clinical decisions. The provider remains the decision-maker at all times.

---

## Hackathon Context

Built for a 6-hour MedTech hackathon focused on helping healthcare providers **organise and prioritise patient cases** using relevant available information, while remaining strictly assistive.

---

## Architecture

```
abc/
├── backend/                   # FastAPI application
│   ├── main.py                # REST endpoints (8 routes)
│   ├── database.py            # SQLite persistence layer
│   ├── models.py              # Pydantic data models
│   ├── scoring_engine.py      # Deterministic NEWS2 + composite urgency scoring
│   ├── ai_engine.py           # Local-first structured clinical briefing
│   ├── mock_data.py           # Six initial seed patients (demo dataset)
│   └── requirements.txt       # Python dependencies
│
├── frontend/                  # React 18 + Vite + TailwindCSS
│   ├── src/
│   │   ├── App.jsx            # Main application shell
│   │   ├── components/        # PatientCard, PatientDetailDrawer, modals
│   │   ├── utils.js           # Tier config, formatters, helpers
│   │   └── index.css          # Global styles
│   └── package.json
│
├── tests/                     # Test suite
│   ├── test_backend.py        # Unit tests: NEWS2, scoring, SQLite
│   └── test_e2e.py            # Integration tests: all API endpoints
│
├── data/                      # SQLite database directory
│   └── carequeue.db           # Created automatically on first run (git-ignored)
│
├── test_backend.py            # Root entry point → delegates to tests/
├── test_e2e.py                # Root entry point → delegates to tests/
├── run.bat                    # Windows launcher (backend + frontend)
├── start.sh                   # Unix launcher (backend + frontend)
├── .env.example               # Environment variable reference
└── PROJECT_SPEC.md            # Hackathon project specification
```

---

## Technology Stack

| Layer       | Technology                             |
|-------------|----------------------------------------|
| Frontend    | React 18, Vite 5, TailwindCSS 3        |
| Backend     | FastAPI, Uvicorn, Pydantic v2          |
| Database    | SQLite (built-in `sqlite3`, no server) |
| Scoring     | Deterministic NEWS2 + composite model  |
| AI Briefing | Local heuristic engine (offline-first) |

---

## Local Persistence (SQLite)

Patient data is stored in **`data/carequeue.db`** — a local SQLite file created automatically on first run. No external database, no cloud service.

**Schema:**

| Table            | Purpose                                        |
|------------------|------------------------------------------------|
| `patients`       | Master patient record (vitals snapshot, status)|
| `vitals_history` | Every recorded vitals set per patient          |
| `audit_notes`    | Clinical notes, override audit trail           |

**Persistence behaviour:**
- Changes to vitals, priority overrides, new patients, and status updates **survive backend restarts**.
- The database file is git-ignored (`data/*.db`).

---

## Seed Data (Six Demo Patients)

The initial demonstration dataset consists of six carefully designed patients from `backend/mock_data.py`. They cover the full priority spectrum (P1–P4) and include a mix of clinical presentations.

On first run (empty database), these six patients are automatically seeded into SQLite. Subsequent backend restarts load from the persisted database — **changes to the six patients are preserved**.

> **Demo Reset** (`POST /api/demo/reset`) wipes the database and reseeds the original six patients, restoring the exact initial clinical baseline.

---

## Local-First AI

The AI engine (`backend/ai_engine.py`) generates structured, provider-facing clinical briefings using a **deterministic heuristic** — no external API key required.

- Default: `CAREQUEUE_AI_MODE=local` (offline, deterministic)
- Optional: `CAREQUEUE_AI_MODE=gemini` or `openai` with keys in `.env`
- External failures fall back to local automatically
- The core NEWS2 scoring engine is **always deterministic** — AI is briefing only

---

## Clinical Safety

CareQueue Assist is an assistive prototype. It does **not**:

- Diagnose patients
- Prescribe treatment or medication
- Make final clinical decisions
- Claim to replace clinician judgement

Briefings use neutral, informational language. The provider is always the decision-maker.

---

## Setup

### Requirements
- Python 3.9+
- Node.js 18+

### Installation

```bash
# Clone and navigate to project root
cd abc

# Backend dependencies
pip install -r backend/requirements.txt

# Frontend dependencies
cd frontend
npm install
cd ..
```

---

## Running the Application

### Windows (recommended)
```bat
.\run.bat
```
This opens two console windows — backend on port 8000, frontend on port 5173.

### Unix/macOS
```bash
bash start.sh
```

### Manual (separate terminals)

**Terminal 1 — Backend:**
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Then open: **http://localhost:5173**

---

## API Reference

| Method | Endpoint                              | Description                             |
|--------|---------------------------------------|-----------------------------------------|
| GET    | `/api/patients`                       | All patients, sorted by priority        |
| GET    | `/api/patients/{id}`                  | Single patient with AI briefing         |
| POST   | `/api/patients`                       | Admit new patient                       |
| POST   | `/api/patients/{id}/vitals`           | Record vitals + re-score urgency        |
| POST   | `/api/patients/{id}/override`         | Clinician priority override (audited)   |
| POST   | `/api/patients/{id}/notes`            | Add clinical note                       |
| POST   | `/api/patients/{id}/status`           | Update patient status                   |
| GET    | `/api/stats`                          | Queue summary statistics                |
| POST   | `/api/demo/reset`                     | Restore original six demo patients      |

Interactive API docs: **http://127.0.0.1:8000/docs**

---

## Running Tests

```bash
# From repository root (backend must NOT be running for unit tests)
python test_backend.py

# From repository root (backend MUST be running for E2E tests)
python test_e2e.py

# Frontend production build verification
cd frontend && npm run build
```

---

## Limitations

- **In-memory urgency scoring**: NEWS2 and composite scores are recalculated on every API call (not cached in DB). This is intentional — wait time is dynamic.
- **No authentication**: Role is self-declared at login for demo purposes only.
- **No department/bed routing**: Queue management only; no bed assignment.
- **Single-instance only**: SQLite WAL mode supports concurrent reads; not designed for distributed multi-server deployment.
- **No external LLM required**: The local briefing engine is heuristic. Connecting Gemini/OpenAI is optional via `.env`.
