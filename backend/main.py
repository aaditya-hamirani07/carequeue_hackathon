from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid

from models import (
    Patient, Vitals, PatientStatus, PriorityTier,
    VitalsUpdateRequest, NoteAddRequest, OverrideRequest
)
from scoring_engine import calculate_urgency
from ai_engine import generate_ai_briefing
from mock_data import get_initial_mock_patients

app = FastAPI(
    title="CareQueue Assist API",
    description="Intelligent Patient Prioritization Assistant for Healthcare Providers",
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

# In-Memory State Store
PATIENT_STORE: Dict[str, Patient] = {}

def refresh_patient_urgency(patient: Patient):
    score = calculate_urgency(
        current_vitals=patient.current_vitals,
        symptoms=patient.symptoms,
        arrival_time_str=patient.arrival_time,
        age=patient.age,
        medical_history=patient.medical_history
    )
    patient.urgency = score

def initialize_store():
    global PATIENT_STORE
    PATIENT_STORE = {}
    for p in get_initial_mock_patients():
        refresh_patient_urgency(p)
        PATIENT_STORE[p.id] = p

initialize_store()

TIER_ORDER = {
    PriorityTier.P1_IMMEDIATE: 1,
    PriorityTier.P2_URGENT: 2,
    PriorityTier.P3_DELAYED: 3,
    PriorityTier.P4_ROUTINE: 4
}

@app.get("/")
def root():
    return {
        "service": "CareQueue Assist API",
        "status": "operational",
        "active_patients": len(PATIENT_STORE),
        "docs_url": "/docs"
    }

@app.get("/api/patients")
async def get_patients(status: Optional[str] = None):
    # Refresh all urgency calculations on poll/fetch to account for elapsed wait time
    results = []
    for p in PATIENT_STORE.values():
        if status and p.status.value != status:
            continue
        refresh_patient_urgency(p)
        results.append(p)

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
    patient = PATIENT_STORE.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    refresh_patient_urgency(patient)
    if not patient.urgency.ai_briefing:
        patient.urgency.ai_briefing = await generate_ai_briefing(patient, patient.urgency)
    return patient

@app.post("/api/patients")
async def create_patient(patient_data: Patient):
    refresh_patient_urgency(patient_data)
    PATIENT_STORE[patient_data.id] = patient_data
    return patient_data

@app.post("/api/patients/{patient_id}/vitals")
async def record_vitals(patient_id: str, request: VitalsUpdateRequest):
    patient = PATIENT_STORE.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    old_tier = patient.urgency.tier if patient.urgency else "UNKNOWN"
    
    # Update current vitals and append to history
    vitals = request.vitals
    vitals.recorded_at = datetime.now(timezone.utc).isoformat()
    patient.current_vitals = vitals
    patient.vitals_history.append(vitals)

    if request.note:
        patient.notes.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "author": "Nurse / Vitals Check",
            "text": f"Vitals check: {request.note}"
        })

    refresh_patient_urgency(patient)
    patient.urgency.ai_briefing = await generate_ai_briefing(patient, patient.urgency)
    
    new_tier = patient.urgency.tier
    return {
        "status": "success",
        "message": f"Vitals recorded. Priority shifted from {old_tier} to {new_tier}.",
        "patient": patient,
        "escalated": old_tier != new_tier
    }

@app.post("/api/patients/{patient_id}/notes")
async def add_clinical_note(patient_id: str, req: NoteAddRequest):
    patient = PATIENT_STORE.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient.notes.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "author": req.author,
        "text": req.text,
        "is_critical": req.is_critical_flag
    })

    # If critical note is flagged, check if symptoms should be enriched
    if req.is_critical_flag:
        patient.symptoms.append(req.text)
        refresh_patient_urgency(patient)

    return {"status": "success", "notes": patient.notes, "patient": patient}

@app.post("/api/patients/{patient_id}/override")
async def override_priority(patient_id: str, req: OverrideRequest):
    patient = PATIENT_STORE.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient.manual_override = {
        "new_tier": req.new_tier,
        "reason": req.reason,
        "provider_name": req.provider_name,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    patient.notes.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "author": req.provider_name,
        "text": f"Manual Provider Priority Override to {req.new_tier.value}. Rationale: {req.reason}"
    })

    return {"status": "success", "patient": patient}

@app.post("/api/patients/{patient_id}/status")
async def update_status(patient_id: str, new_status: PatientStatus):
    patient = PATIENT_STORE.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient.status = new_status
    return {"status": "success", "patient": patient}

@app.post("/api/demo/reset")
async def reset_demo():
    initialize_store()
    return {"status": "success", "message": "Queue reset to initial demo state", "count": len(PATIENT_STORE)}

@app.get("/api/stats")
async def get_stats():
    total = len(PATIENT_STORE)
    p1_count = 0
    p2_count = 0
    p3_count = 0
    p4_count = 0
    total_wait = 0

    for p in PATIENT_STORE.values():
        refresh_patient_urgency(p)
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
        "avg_wait_minutes": avg_wait
    }
