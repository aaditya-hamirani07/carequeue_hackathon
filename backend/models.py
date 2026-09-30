from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class PriorityTier(str, Enum):
    P1_IMMEDIATE = "P1_IMMEDIATE"   # Critical / Immediate Resuscitation / Severe Risk
    P2_URGENT = "P2_URGENT"         # Emergent / Urgent Attention
    P3_DELAYED = "P3_DELAYED"       # Moderate / Can wait with monitoring
    P4_ROUTINE = "P4_ROUTINE"       # Low acuity / Stable

class PatientStatus(str, Enum):
    WAITING = "WAITING"
    IN_TRIAGE = "IN_TRIAGE"
    ATTENDING = "ATTENDING"
    COMPLETED = "COMPLETED"
    ATTENDED = "ATTENDED"  # Final state: provider has attended/reviewed

class Vitals(BaseModel):
    heart_rate: Optional[int] = Field(None, description="Beats per minute")
    systolic_bp: Optional[int] = Field(None, description="mmHg systolic")
    diastolic_bp: Optional[int] = Field(None, description="mmHg diastolic")
    resp_rate: Optional[int] = Field(None, description="Breaths per minute")
    sp_o2: Optional[float] = Field(None, description="Oxygen saturation %")
    temperature: Optional[float] = Field(None, description="Body temperature in Celsius")
    gcs: Optional[int] = Field(15, description="Glasgow Coma Scale (3-15)")
    pain_score: Optional[int] = Field(None, description="0-10 scale")
    recorded_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class ClinicalFactor(BaseModel):
    category: str # "VITALS", "SYMPTOM", "WAIT_TIME", "STALENESS", "RISK_HISTORY"
    label: str
    impact: str # "HIGH", "MEDIUM", "LOW"
    detail: str

class UrgencyScore(BaseModel):
    composite_score: float # 0 - 100
    tier: PriorityTier
    news2_score: int
    wait_time_minutes: int
    factors: List[ClinicalFactor]
    ai_briefing: Optional[str] = None
    missing_data_alerts: List[str] = []
    last_evaluated_at: str

class VitalsUpdateRequest(BaseModel):
    vitals: Vitals
    note: Optional[str] = None

class NoteAddRequest(BaseModel):
    author: str = "Triage Nurse"
    text: str
    is_critical_flag: bool = False

class OverrideRequest(BaseModel):
    new_tier: PriorityTier
    reason: str
    provider_name: str = "Dr. Attending"

class AttendRequest(BaseModel):
    clinician_name: str = "Attending Provider"

class AttendanceRecord(BaseModel):
    id: int
    patient_id: str
    patient_name: str
    patient_age: int
    patient_gender: str
    chief_complaint: str
    attended_at: str
    clinician_name: str
    tier_at_attendance: str
    urgency_score_at_attendance: float
    news2_at_attendance: int
    patient: Optional[Any] = None  # Full patient object for drawer

class Patient(BaseModel):
    id: str
    mrn: str
    name: str
    age: int
    gender: str
    arrival_time: str
    chief_complaint: str
    symptoms: List[str]
    medical_history: List[str] = []
    allergies: List[str] = []
    current_vitals: Vitals
    vitals_history: List[Vitals] = []
    notes: List[Dict[str, Any]] = []
    status: PatientStatus = PatientStatus.WAITING
    manual_override: Optional[Dict[str, Any]] = None
    urgency: Optional[UrgencyScore] = None
    attendance: Optional[Dict[str, Any]] = None  # Set when status=ATTENDED
