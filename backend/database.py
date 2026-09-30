import sqlite3
import json
import os
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from models import (
    Patient, Vitals, PatientStatus, PriorityTier, UrgencyScore, AttendanceRecord
)
from scoring_engine import calculate_urgency
from ai_engine import generate_ai_briefing
from mock_data import get_initial_mock_patients

# Resolve database path relative to project root or environment variable
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DB_PATH = os.path.join(PROJECT_ROOT, "data", "carequeue.db")
DB_PATH = os.getenv("CAREQUEUE_DB_PATH", DEFAULT_DB_PATH)


def get_db_connection() -> sqlite3.Connection:
    """Creates a thread-safe connection to the SQLite database with WAL mode."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


def init_db():
    """Initializes the database schema and seeds initial demo patients if table is empty."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # 1. Patients master table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS patients (
                id TEXT PRIMARY KEY,
                mrn TEXT NOT NULL,
                name TEXT NOT NULL,
                age INTEGER NOT NULL,
                gender TEXT NOT NULL,
                arrival_time TEXT NOT NULL,
                chief_complaint TEXT NOT NULL,
                symptoms TEXT NOT NULL,           -- JSON List[str]
                medical_history TEXT NOT NULL,    -- JSON List[str]
                allergies TEXT NOT NULL,          -- JSON List[str]
                status TEXT NOT NULL DEFAULT 'WAITING',
                manual_override TEXT,             -- JSON Dict or NULL
                current_vitals TEXT NOT NULL,     -- JSON Vitals Dict
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        # 2. Vitals history table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vitals_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id TEXT NOT NULL,
                recorded_at TEXT NOT NULL,
                heart_rate INTEGER,
                systolic_bp INTEGER,
                diastolic_bp INTEGER,
                resp_rate INTEGER,
                sp_o2 REAL,
                temperature REAL,
                gcs INTEGER,
                pain_score INTEGER,
                note TEXT,
                raw_json TEXT NOT NULL,
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
            )
        """)

        # 3. Clinical notes & override audit table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                author TEXT NOT NULL,
                text TEXT NOT NULL,
                is_critical INTEGER DEFAULT 0,
                note_type TEXT DEFAULT 'NOTE',    -- 'NOTE', 'OVERRIDE', 'VITALS', 'ATTENDANCE'
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
            )
        """)

        # 4. Attendance records table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS attendance_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id TEXT NOT NULL UNIQUE,
                attended_at TEXT NOT NULL,
                clinician_name TEXT NOT NULL,
                tier_at_attendance TEXT NOT NULL,
                urgency_score_at_attendance REAL NOT NULL DEFAULT 0,
                news2_at_attendance INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
            )
        """)
        
        conn.commit()

        # Check if table is empty; if so, seed demo dataset
        cursor.execute("SELECT COUNT(*) FROM patients")
        count = cursor.fetchone()[0]
        if count == 0:
            seed_initial_demo_patients(conn)


def seed_initial_demo_patients(conn: sqlite3.Connection):
    """Seeds the exact 6 demo patients from mock_data.py into the SQLite database."""
    demo_patients = get_initial_mock_patients()
    now_iso = datetime.now(timezone.utc).isoformat()

    for p in demo_patients:
        # Insert Patient
        conn.execute("""
            INSERT OR REPLACE INTO patients (
                id, mrn, name, age, gender, arrival_time, chief_complaint,
                symptoms, medical_history, allergies, status, manual_override,
                current_vitals, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            p.id,
            p.mrn,
            p.name,
            p.age,
            p.gender,
            p.arrival_time,
            p.chief_complaint,
            json.dumps(p.symptoms),
            json.dumps(p.medical_history),
            json.dumps(p.allergies),
            p.status.value,
            json.dumps(p.manual_override) if p.manual_override else None,
            json.dumps(p.current_vitals.model_dump()),
            p.arrival_time,
            now_iso
        ))

        # Insert Vitals History
        for v in p.vitals_history:
            conn.execute("""
                INSERT INTO vitals_history (
                    patient_id, recorded_at, heart_rate, systolic_bp, diastolic_bp,
                    resp_rate, sp_o2, temperature, gcs, pain_score, raw_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                p.id,
                v.recorded_at,
                v.heart_rate,
                v.systolic_bp,
                v.diastolic_bp,
                v.resp_rate,
                v.sp_o2,
                v.temperature,
                v.gcs,
                v.pain_score,
                json.dumps(v.model_dump())
            ))

        # Insert Notes
        for n in p.notes:
            conn.execute("""
                INSERT INTO audit_notes (
                    patient_id, timestamp, author, text, is_critical, note_type
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                p.id,
                n.get("timestamp", now_iso),
                n.get("author", "Triage"),
                n.get("text", ""),
                1 if n.get("is_critical") else 0,
                "NOTE"
            ))

    conn.commit()


def row_to_patient(row: sqlite3.Row, conn: sqlite3.Connection) -> Patient:
    """Converts a SQLite patient row with vitals history and notes into a Pydantic Patient."""
    patient_id = row["id"]

    # Load vitals history
    v_rows = conn.execute(
        "SELECT raw_json FROM vitals_history WHERE patient_id = ? ORDER BY recorded_at ASC",
        (patient_id,)
    ).fetchall()
    vitals_history = [Vitals(**json.loads(vr["raw_json"])) for vr in v_rows]

    # Load notes / audit log
    n_rows = conn.execute(
        "SELECT timestamp, author, text, is_critical, note_type FROM audit_notes WHERE patient_id = ? ORDER BY timestamp ASC",
        (patient_id,)
    ).fetchall()
    notes = [
        {
            "timestamp": nr["timestamp"],
            "author": nr["author"],
            "text": nr["text"],
            "is_critical": bool(nr["is_critical"]),
            "note_type": nr["note_type"]
        }
        for nr in n_rows
    ]

    current_vitals_dict = json.loads(row["current_vitals"])
    current_vitals = Vitals(**current_vitals_dict)
    manual_override = json.loads(row["manual_override"]) if row["manual_override"] else None

    # Load attendance record if present
    attendance_row = conn.execute(
        "SELECT * FROM attendance_records WHERE patient_id = ?", (patient_id,)
    ).fetchone()
    attendance = None
    if attendance_row:
        attendance = {
            "id": attendance_row["id"],
            "attended_at": attendance_row["attended_at"],
            "clinician_name": attendance_row["clinician_name"],
            "tier_at_attendance": attendance_row["tier_at_attendance"],
            "urgency_score_at_attendance": attendance_row["urgency_score_at_attendance"],
            "news2_at_attendance": attendance_row["news2_at_attendance"],
        }

    patient = Patient(
        id=row["id"],
        mrn=row["mrn"],
        name=row["name"],
        age=row["age"],
        gender=row["gender"],
        arrival_time=row["arrival_time"],
        chief_complaint=row["chief_complaint"],
        symptoms=json.loads(row["symptoms"]),
        medical_history=json.loads(row["medical_history"]),
        allergies=json.loads(row["allergies"]),
        current_vitals=current_vitals,
        vitals_history=vitals_history,
        notes=notes,
        status=PatientStatus(row["status"]),
        manual_override=manual_override,
        attendance=attendance
    )

    # Calculate real-time clinical urgency based on elapsed wait time
    score = calculate_urgency(
        current_vitals=patient.current_vitals,
        symptoms=patient.symptoms,
        arrival_time_str=patient.arrival_time,
        age=patient.age,
        medical_history=patient.medical_history
    )
    patient.urgency = score

    return patient


def get_all_patients(status: Optional[str] = None) -> List[Patient]:
    """Retrieves active patients (non-ATTENDED) from SQLite with real-time urgency scores."""
    with get_db_connection() as conn:
        if status:
            rows = conn.execute("SELECT * FROM patients WHERE status = ?", (status,)).fetchall()
        else:
            # Exclude ATTENDED patients from the active queue
            rows = conn.execute(
                "SELECT * FROM patients WHERE status != ?", (PatientStatus.ATTENDED.value,)
            ).fetchall()
        
        patients = [row_to_patient(r, conn) for r in rows]
        return patients


def get_patient_by_id(patient_id: str) -> Optional[Patient]:
    """Retrieves a single patient by ID from SQLite with full vitals and audit history."""
    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
        if not row:
            return None
        return row_to_patient(row, conn)


def create_patient_record(p: Patient) -> Patient:
    """Inserts a newly registered patient into SQLite and persists initial vitals and notes."""
    now_iso = datetime.now(timezone.utc).isoformat()
    with get_db_connection() as conn:
        conn.execute("""
            INSERT INTO patients (
                id, mrn, name, age, gender, arrival_time, chief_complaint,
                symptoms, medical_history, allergies, status, manual_override,
                current_vitals, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            p.id,
            p.mrn,
            p.name,
            p.age,
            p.gender,
            p.arrival_time,
            p.chief_complaint,
            json.dumps(p.symptoms),
            json.dumps(p.medical_history),
            json.dumps(p.allergies),
            p.status.value,
            json.dumps(p.manual_override) if p.manual_override else None,
            json.dumps(p.current_vitals.model_dump()),
            now_iso,
            now_iso
        ))

        # Insert initial vitals to history
        v = p.current_vitals
        conn.execute("""
            INSERT INTO vitals_history (
                patient_id, recorded_at, heart_rate, systolic_bp, diastolic_bp,
                resp_rate, sp_o2, temperature, gcs, pain_score, raw_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            p.id,
            v.recorded_at,
            v.heart_rate,
            v.systolic_bp,
            v.diastolic_bp,
            v.resp_rate,
            v.sp_o2,
            v.temperature,
            v.gcs,
            v.pain_score,
            json.dumps(v.model_dump())
        ))

        for n in p.notes:
            conn.execute("""
                INSERT INTO audit_notes (
                    patient_id, timestamp, author, text, is_critical, note_type
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                p.id,
                n.get("timestamp", now_iso),
                n.get("author", "Triage"),
                n.get("text", ""),
                1 if n.get("is_critical") else 0,
                "NOTE"
            ))

        conn.commit()

    return get_patient_by_id(p.id)


def record_patient_vitals(patient_id: str, vitals: Vitals, note: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Records new vitals in SQLite:
    1. Reads existing patient
    2. Updates current vitals and appends to vitals_history
    3. If note provided, appends to audit_notes
    4. Recalculates NEWS2, composite score, tier, and local AI briefing
    5. Persists updated record
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    vitals.recorded_at = now_iso

    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
        if not row:
            return None

        # Existing patient & prior tier
        existing_patient = row_to_patient(row, conn)
        old_tier = existing_patient.urgency.tier if existing_patient.urgency else PriorityTier.P4_ROUTINE

        # Update patient current_vitals in SQLite
        conn.execute(
            "UPDATE patients SET current_vitals = ?, updated_at = ? WHERE id = ?",
            (json.dumps(vitals.model_dump()), now_iso, patient_id)
        )

        # Append to vitals_history table
        conn.execute("""
            INSERT INTO vitals_history (
                patient_id, recorded_at, heart_rate, systolic_bp, diastolic_bp,
                resp_rate, sp_o2, temperature, gcs, pain_score, note, raw_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            patient_id,
            vitals.recorded_at,
            vitals.heart_rate,
            vitals.systolic_bp,
            vitals.diastolic_bp,
            vitals.resp_rate,
            vitals.sp_o2,
            vitals.temperature,
            vitals.gcs,
            vitals.pain_score,
            note,
            json.dumps(vitals.model_dump())
        ))

        # Append note if provided
        if note:
            conn.execute("""
                INSERT INTO audit_notes (
                    patient_id, timestamp, author, text, is_critical, note_type
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                patient_id,
                now_iso,
                "Nurse / Vitals Check",
                f"Vitals check: {note}",
                0,
                "VITALS"
            ))

        conn.commit()

        # Load updated patient with re-calculated urgency
        updated_patient = row_to_patient(
            conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone(),
            conn
        )

    new_tier = updated_patient.urgency.tier
    escalated = (old_tier != new_tier)

    return {
        "status": "success",
        "message": f"Vitals recorded. Priority shifted from {old_tier.value} to {new_tier.value}.",
        "patient": updated_patient,
        "escalated": escalated
    }


def record_patient_override(patient_id: str, new_tier: PriorityTier, reason: str, provider_name: str) -> Optional[Patient]:
    """Records a manual provider override and logs it to audit_notes."""
    now_iso = datetime.now(timezone.utc).isoformat()
    override_dict = {
        "new_tier": new_tier.value,
        "reason": reason,
        "provider_name": provider_name,
        "timestamp": now_iso
    }

    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
        if not row:
            return None

        conn.execute(
            "UPDATE patients SET manual_override = ?, updated_at = ? WHERE id = ?",
            (json.dumps(override_dict), now_iso, patient_id)
        )

        conn.execute("""
            INSERT INTO audit_notes (
                patient_id, timestamp, author, text, is_critical, note_type
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            patient_id,
            now_iso,
            provider_name,
            f"Manual Provider Priority Override to {new_tier.value}. Rationale: {reason}",
            0,
            "OVERRIDE"
        ))

        conn.commit()
        return row_to_patient(conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone(), conn)


def add_patient_note(patient_id: str, author: str, text: str, is_critical: bool) -> Optional[Dict[str, Any]]:
    """Adds a clinical note to the patient audit trail."""
    now_iso = datetime.now(timezone.utc).isoformat()
    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
        if not row:
            return None

        conn.execute("""
            INSERT INTO audit_notes (
                patient_id, timestamp, author, text, is_critical, note_type
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            patient_id,
            now_iso,
            author,
            text,
            1 if is_critical else 0,
            "NOTE"
        ))

        if is_critical:
            # Append critical symptom to symptoms list
            symptoms = json.loads(row["symptoms"])
            symptoms.append(text)
            conn.execute(
                "UPDATE patients SET symptoms = ?, updated_at = ? WHERE id = ?",
                (json.dumps(symptoms), now_iso, patient_id)
            )

        conn.commit()
        updated_patient = row_to_patient(conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone(), conn)
        return {"status": "success", "notes": updated_patient.notes, "patient": updated_patient}


def update_patient_status(patient_id: str, new_status: PatientStatus) -> Optional[Patient]:
    """Updates the triage status of a patient."""
    now_iso = datetime.now(timezone.utc).isoformat()
    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
        if not row:
            return None

        conn.execute(
            "UPDATE patients SET status = ?, updated_at = ? WHERE id = ?",
            (new_status.value, now_iso, patient_id)
        )
        conn.commit()
        return row_to_patient(conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone(), conn)


def attend_patient(patient_id: str, clinician_name: str) -> Optional[dict]:
    """
    Marks a patient as ATTENDED:
    1. Verifies patient exists and is currently active (not already ATTENDED)
    2. Records attendance event in attendance_records table
    3. Updates patient status to ATTENDED in patients table
    4. Logs the attendance event in audit_notes
    Returns attendance dict on success, None if not found, 'already_attended' if duplicate.
    """
    now_iso = datetime.now(timezone.utc).isoformat()

    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
        if not row:
            return None

        # Reject if already attended
        if row["status"] == PatientStatus.ATTENDED.value:
            return "already_attended"

        # Calculate current urgency for snapshot
        patient = row_to_patient(row, conn)
        score = patient.urgency
        tier_now = score.tier.value if score else PriorityTier.P4_ROUTINE.value
        # Honor manual override tier if present
        if patient.manual_override and patient.manual_override.get("new_tier"):
            tier_now = patient.manual_override["new_tier"]
        urgency_score_now = score.composite_score if score else 0.0
        news2_now = score.news2_score if score else 0

        # Insert into attendance_records
        conn.execute("""
            INSERT OR REPLACE INTO attendance_records (
                patient_id, attended_at, clinician_name,
                tier_at_attendance, urgency_score_at_attendance, news2_at_attendance
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            patient_id, now_iso, clinician_name,
            tier_now, urgency_score_now, news2_now
        ))

        # Update patient status to ATTENDED
        conn.execute(
            "UPDATE patients SET status = ?, updated_at = ? WHERE id = ?",
            (PatientStatus.ATTENDED.value, now_iso, patient_id)
        )

        # Audit log entry
        conn.execute("""
            INSERT INTO audit_notes (
                patient_id, timestamp, author, text, is_critical, note_type
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            patient_id,
            now_iso,
            clinician_name,
            f"Patient attended by {clinician_name}. Tier at attendance: {tier_now}. NEWS2: {news2_now}.",
            0,
            "ATTENDANCE"
        ))

        conn.commit()

        # Return full updated patient with attendance record attached
        updated_patient = row_to_patient(
            conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone(),
            conn
        )
        return {
            "status": "success",
            "patient": updated_patient,
            "attendance": updated_patient.attendance
        }


def get_all_records() -> List[Patient]:
    """
    Returns all ATTENDED patients sorted by most recently attended.
    Each patient object includes the attendance record.
    """
    with get_db_connection() as conn:
        # Join patients with attendance_records to sort by attended_at
        rows = conn.execute(
            """
            SELECT p.* FROM patients p
            INNER JOIN attendance_records ar ON p.id = ar.patient_id
            WHERE p.status = ?
            ORDER BY ar.attended_at DESC
            """,
            (PatientStatus.ATTENDED.value,)
        ).fetchall()
        return [row_to_patient(r, conn) for r in rows]


def get_attended_today_count() -> int:
    """Returns count of patients attended today (UTC date)."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    with get_db_connection() as conn:
        row = conn.execute(
            "SELECT COUNT(*) FROM attendance_records WHERE attended_at LIKE ?",
            (f"{today}%",)
        ).fetchone()
        return row[0] if row else 0


def reset_database_to_demo() -> int:
    """
    Demo Reset:
    Clears current patient table, vitals history, audit notes, and attendance records,
    and reseeds the exact 6 original demo patients.
    """
    with get_db_connection() as conn:
        conn.execute("DELETE FROM attendance_records")
        conn.execute("DELETE FROM audit_notes")
        conn.execute("DELETE FROM vitals_history")
        conn.execute("DELETE FROM patients")
        conn.commit()

        seed_initial_demo_patients(conn)
        cursor = conn.execute("SELECT COUNT(*) FROM patients")
        return cursor.fetchone()[0]
