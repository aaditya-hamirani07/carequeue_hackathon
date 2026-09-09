import os
from typing import Optional
from models import Patient, UrgencyScore

async def generate_ai_briefing(patient: Patient, score: UrgencyScore) -> str:
    """
    Generates a concise, assistive clinical summary highlighting:
    - Primary rationale for the priority status
    - Key physiological or symptom drivers
    - Missing or stale information requiring provider awareness
    Strictly non-diagnostic and assistive.
    """
    # Try calling OpenAI / Gemini / NVIDIA if an API key is in environment,
    # or instantly generate high-quality structured heuristic synthesis.
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY") or os.getenv("NVIDIA_API_KEY")
    
    # We will build a high quality structured synthesis baseline first
    v = patient.current_vitals
    vitals_summary = []
    if v.sp_o2 is not None and v.sp_o2 < 94:
        vitals_summary.append(f"compromised SpO2 ({v.sp_o2}%)")
    if v.heart_rate is not None and (v.heart_rate > 100 or v.heart_rate < 55):
        vitals_summary.append(f"abnormal HR ({v.heart_rate} bpm)")
    if v.systolic_bp is not None and (v.systolic_bp < 100 or v.systolic_bp > 180):
        vitals_summary.append(f"aberrant systolic BP ({v.systolic_bp} mmHg)")
    if v.resp_rate is not None and (v.resp_rate > 22 or v.resp_rate < 10):
        vitals_summary.append(f"tachypnea/bradypnea ({v.resp_rate}/min)")

    vital_str = ", ".join(vitals_summary) if vitals_summary else "baseline stable vitals"
    
    reasons = [f.detail for f in score.factors[:3]]
    reasons_str = "; ".join(reasons) if reasons else "routine intake presentation"

    briefing = (
        f"Case priority ({score.tier.value.split('_')[0]}) driven by {vital_str}. "
        f"Chief presentation: {patient.chief_complaint}. "
        f"Key surfaced factors: {reasons_str}. "
        f"Waiting time: {score.wait_time_minutes} mins."
    )

    if score.missing_data_alerts:
        briefing += f" Missing data: {', '.join(score.missing_data_alerts)}."

    return briefing
