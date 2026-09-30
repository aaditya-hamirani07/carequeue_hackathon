import sys
import os

# Ensure backend directory is in sys.path so modules can be imported directly
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid

from models import (
    Patient, Vitals, PatientStatus, PriorityTier,
    VitalsUpdateRequest, NoteAddRequest, OverrideRequest, AttendRequest
)
from scoring_engine import calculate_urgency
from ai_engine import generate_ai_briefing
import database as db

app = FastAPI(
    title="CareQueue Assist API",
    description="Intelligent Patient Prioritization Assistant for Healthcare Providers (Local SQLite)",
    version="1.0.0"
)

# Enable CORS for local dev and frontend deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database schema and initial seed data if empty
db.init_db()

TIER_ORDER = {
    PriorityTier.P1_IMMEDIATE: 1,
    PriorityTier.P2_URGENT: 2,
    PriorityTier.P3_DELAYED: 3,
    PriorityTier.P4_ROUTINE: 4
}

@app.get("/")
def root():
    patients = db.get_all_patients()
    return {
        "service": "CareQueue Assist API",
        "status": "operational",
        "storage": "SQLite (Local Persistence)",
        "active_patients": len(patients),
        "docs_url": "/docs"
    }

@app.get("/api/patients")
async def get_patients(status: Optional[str] = None):
    # Retrieve all patients with real-time urgency re-evaluated from SQLite
    results = db.get_all_patients(status=status)

    # Sort algorithm:
    # 1. Effective Tier (accounting for manual override if present)
    # 2. Composite urgency score descending
    # 3. Wait time descending
    def sort_key(p: Patient):
        tier = p.manual_override.get("new_tier") if p.manual_override else p.urgency.tier
        tier_weight = TIER_ORDER.get(tier, 99)
        composite = p.urgency.composite_score if p.urgency else 0
        return (tier_weight, -composite)

    results.sort(key=sort_key)
    return results

@app.get("/api/patients/{patient_id}")
async def get_patient_detail(patient_id: str):
    patient = db.get_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if not patient.urgency.ai_briefing:
        patient.urgency.ai_briefing = await generate_ai_briefing(patient, patient.urgency)
    return patient

@app.post("/api/patients")
async def create_patient(patient_data: Patient):
    created = db.create_patient_record(patient_data)
    if not created:
        raise HTTPException(status_code=500, detail="Failed to persist patient record")
    return created

@app.post("/api/patients/{patient_id}/vitals")
async def record_vitals(patient_id: str, request: VitalsUpdateRequest):
    result = db.record_patient_vitals(patient_id, request.vitals, request.note)
    if not result:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Generate fresh clinical briefing
    patient = result["patient"]
    patient.urgency.ai_briefing = await generate_ai_briefing(patient, patient.urgency)
    result["patient"] = patient

    return result

@app.post("/api/patients/{patient_id}/notes")
async def add_clinical_note(patient_id: str, req: NoteAddRequest):
    result = db.add_patient_note(patient_id, req.author, req.text, req.is_critical_flag)
    if not result:
        raise HTTPException(status_code=404, detail="Patient not found")
    return result

@app.post("/api/patients/{patient_id}/override")
async def override_priority(patient_id: str, req: OverrideRequest):
    patient = db.record_patient_override(patient_id, req.new_tier, req.reason, req.provider_name)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"status": "success", "patient": patient}

@app.post("/api/patients/{patient_id}/status")
async def update_status(patient_id: str, new_status: PatientStatus):
    patient = db.update_patient_status(patient_id, new_status)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"status": "success", "patient": patient}

@app.post("/api/patients/{patient_id}/attend")
async def attend_patient_endpoint(patient_id: str, req: AttendRequest):
    result = db.attend_patient(patient_id, req.clinician_name)
    if result is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    if result == "already_attended":
        raise HTTPException(status_code=409, detail="Patient has already been attended")
    return result

@app.get("/api/records")
async def get_records():
    """Returns all attended patients sorted by most recently attended."""
    records = db.get_all_records()
    return records

@app.post("/api/demo/reset")
async def reset_demo():
    count = db.reset_database_to_demo()
    return {"status": "success", "message": "Queue reset to initial demo state", "count": count}

@app.get("/api/stats")
async def get_stats():
    patients = db.get_all_patients()
    total = len(patients)
    p1_count = 0
    p2_count = 0
    p3_count = 0
    p4_count = 0
    total_wait = 0

    for p in patients:
        tier = p.manual_override.get("new_tier") if p.manual_override else p.urgency.tier
        if tier == PriorityTier.P1_IMMEDIATE:
            p1_count += 1
        elif tier == PriorityTier.P2_URGENT:
            p2_count += 1
        elif tier == PriorityTier.P3_DELAYED:
            p3_count += 1
        elif tier == PriorityTier.P4_ROUTINE:
            p4_count += 1

        total_wait += p.urgency.wait_time_minutes

    avg_wait = int(total_wait / total) if total > 0 else 0

    return {
        "total_active": total,
        "p1_immediate": p1_count,
        "p2_urgent": p2_count,
        "p3_delayed": p3_count,
        "p4_routine": p4_count,
        "avg_wait_minutes": avg_wait,
        "attended_today": db.get_attended_today_count()
    }

