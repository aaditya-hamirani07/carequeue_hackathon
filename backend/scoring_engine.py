from datetime import datetime, timezone
from typing import List, Tuple
from models import Vitals, PriorityTier, UrgencyScore, ClinicalFactor

def calculate_news2(vitals: Vitals) -> Tuple[int, List[ClinicalFactor]]:
    score = 0
    factors = []

    # 1. Respiration Rate (breaths/min)
    if vitals.resp_rate is not None:
        if vitals.resp_rate <= 8:
            score += 3
            factors.append(ClinicalFactor(category="VITALS", label="Bradypnea", impact="HIGH", detail=f"Resp rate severely low ({vitals.resp_rate}/min)"))
        elif 9 <= vitals.resp_rate <= 11:
            score += 1
            factors.append(ClinicalFactor(category="VITALS", label="Low Resp Rate", impact="LOW", detail=f"Resp rate slightly low ({vitals.resp_rate}/min)"))
        elif 12 <= vitals.resp_rate <= 20:
            score += 0 # Normal
        elif 21 <= vitals.resp_rate <= 24:
            score += 2
            factors.append(ClinicalFactor(category="VITALS", label="Tachypnea", impact="MEDIUM", detail=f"Elevated resp rate ({vitals.resp_rate}/min)"))
        elif vitals.resp_rate >= 25:
            score += 3
            factors.append(ClinicalFactor(category="VITALS", label="Severe Tachypnea", impact="HIGH", detail=f"Critical resp rate ({vitals.resp_rate}/min)"))

    # 2. Oxygen Saturation (SpO2 %)
    if vitals.sp_o2 is not None:
        if vitals.sp_o2 <= 91:
            score += 3
            factors.append(ClinicalFactor(category="VITALS", label="Hypoxemia (Critical)", impact="HIGH", detail=f"Oxygen saturation severely low ({vitals.sp_o2}%)"))
        elif 92 <= vitals.sp_o2 <= 93:
            score += 2
            factors.append(ClinicalFactor(category="VITALS", label="Moderate Hypoxemia", impact="MEDIUM", detail=f"Oxygen saturation low ({vitals.sp_o2}%)"))
        elif 94 <= vitals.sp_o2 <= 95:
            score += 1
            factors.append(ClinicalFactor(category="VITALS", label="Borderline SpO2", impact="LOW", detail=f"Borderline saturation ({vitals.sp_o2}%)"))

    # 3. Systolic Blood Pressure (mmHg)
    if vitals.systolic_bp is not None:
        if vitals.systolic_bp <= 90:
            score += 3
            factors.append(ClinicalFactor(category="VITALS", label="Hypotension (Shock Risk)", impact="HIGH", detail=f"Systolic BP dangerously low ({vitals.systolic_bp} mmHg)"))
        elif 91 <= vitals.systolic_bp <= 100:
            score += 2
            factors.append(ClinicalFactor(category="VITALS", label="Low Systolic BP", impact="MEDIUM", detail=f"Systolic BP below normal ({vitals.systolic_bp} mmHg)"))
        elif 101 <= vitals.systolic_bp <= 110:
            score += 1
            factors.append(ClinicalFactor(category="VITALS", label="Mild Low BP", impact="LOW", detail=f"Systolic BP slightly low ({vitals.systolic_bp} mmHg)"))
        elif 111 <= vitals.systolic_bp <= 219:
            score += 0 # Normal
        elif vitals.systolic_bp >= 220:
            score += 3
            factors.append(ClinicalFactor(category="VITALS", label="Hypertensive Crisis", impact="HIGH", detail=f"Severe hypertension ({vitals.systolic_bp} mmHg)"))

    # 4. Heart Rate (bpm)
    if vitals.heart_rate is not None:
        if vitals.heart_rate <= 40:
            score += 3
            factors.append(ClinicalFactor(category="VITALS", label="Severe Bradycardia", impact="HIGH", detail=f"Critical slow heart rate ({vitals.heart_rate} bpm)"))
        elif 41 <= vitals.heart_rate <= 50:
            score += 1
            factors.append(ClinicalFactor(category="VITALS", label="Bradycardia", impact="LOW", detail=f"Mildly slow heart rate ({vitals.heart_rate} bpm)"))
        elif 51 <= vitals.heart_rate <= 90:
            score += 0 # Normal
        elif 91 <= vitals.heart_rate <= 110:
            score += 1
            factors.append(ClinicalFactor(category="VITALS", label="Mild Tachycardia", impact="LOW", detail=f"Mild elevated heart rate ({vitals.heart_rate} bpm)"))
        elif 111 <= vitals.heart_rate <= 130:
            score += 2
            factors.append(ClinicalFactor(category="VITALS", label="Tachycardia", impact="MEDIUM", detail=f"Significant tachycardia ({vitals.heart_rate} bpm)"))
        elif vitals.heart_rate >= 131:
            score += 3
            factors.append(ClinicalFactor(category="VITALS", label="Critical Tachycardia", impact="HIGH", detail=f"Severe high heart rate ({vitals.heart_rate} bpm)"))

    # 5. Consciousness (GCS)
    if vitals.gcs is not None and vitals.gcs < 15:
        if vitals.gcs <= 8:
            score += 3
            factors.append(ClinicalFactor(category="VITALS", label="Severe Altered Mental Status", impact="HIGH", detail=f"GCS score {vitals.gcs}/15 (Airway/Coma alert)"))
        elif 9 <= vitals.gcs <= 13:
            score += 3
            factors.append(ClinicalFactor(category="VITALS", label="Altered Consciousness", impact="HIGH", detail=f"GCS decreased to {vitals.gcs}/15"))
        elif vitals.gcs == 14:
            score += 1
            factors.append(ClinicalFactor(category="VITALS", label="Mild Confusion / Lethargy", impact="LOW", detail=f"GCS {vitals.gcs}/15"))

    # 6. Temperature (Celsius)
    if vitals.temperature is not None:
        if vitals.temperature <= 35.0:
            score += 3
            factors.append(ClinicalFactor(category="VITALS", label="Hypothermia", impact="HIGH", detail=f"Body temp {vitals.temperature}°C"))
        elif 35.1 <= vitals.temperature <= 36.0:
            score += 1
            factors.append(ClinicalFactor(category="VITALS", label="Low Body Temp", impact="LOW", detail=f"Body temp {vitals.temperature}°C"))
        elif 36.1 <= vitals.temperature <= 38.0:
            score += 0 # Normal
        elif 38.1 <= vitals.temperature <= 39.0:
            score += 1
            factors.append(ClinicalFactor(category="VITALS", label="Fever", impact="LOW", detail=f"Elevated temp ({vitals.temperature}°C)"))
        elif vitals.temperature >= 39.1:
            score += 2
            factors.append(ClinicalFactor(category="VITALS", label="High Hyperpyrexia", impact="MEDIUM", detail=f"High fever ({vitals.temperature}°C)"))

    return score, factors


def calculate_urgency(
    current_vitals: Vitals,
    symptoms: List[str],
    arrival_time_str: str,
    age: int,
    medical_history: List[str]
) -> UrgencyScore:
    # 1. Base NEWS2 Score
    news2, factors = calculate_news2(current_vitals)

    # 2. Time metrics calculation
    now = datetime.now(timezone.utc)
    try:
        arr_time = datetime.fromisoformat(arrival_time_str.replace("Z", "+00:00"))
        wait_mins = max(0, int((now - arr_time).total_seconds() / 60))
    except Exception:
        wait_mins = 25 # fallback

    # 3. Missing data check
    missing_alerts = []
    if current_vitals.sp_o2 is None:
        missing_alerts.append("SpO2 oxygen saturation unrecorded")
    if current_vitals.heart_rate is None:
        missing_alerts.append("Heart rate unrecorded")
    if current_vitals.systolic_bp is None:
        missing_alerts.append("Blood pressure unrecorded")

    # 4. Symptom & Clinical Red Flags
    symptom_keywords_high = [
        "chest pain", "chest pressure", "radiating to jaw", "shortness of breath",
        "severe dyspnea", "syncope", "sudden weakness", "facial droop", "slurred speech",
        "anaphylaxis", "massive hemorrhage", "unresponsive", "acute confusion"
    ]
    symptom_keywords_med = [
        "moderate asthma", "severe abdominal pain", "fever in elderly", "diabetic vomiting",
        "persistent vertigo", "head injury with nausea", "palpitations", "deep laceration"
    ]

    symptom_boost = 0
    symptoms_lower = " ".join([s.lower() for s in symptoms])
    for kw in symptom_keywords_high:
        if kw in symptoms_lower:
            symptom_boost += 18
            factors.append(ClinicalFactor(category="SYMPTOM", label="High-Risk Red Flag", impact="HIGH", detail=f"Chief symptom includes '{kw.title()}'"))
            break

    for kw in symptom_keywords_med:
        if kw in symptoms_lower:
            symptom_boost += 8
            factors.append(ClinicalFactor(category="SYMPTOM", label="Moderate Risk Symptom", impact="MEDIUM", detail=f"Symptom includes '{kw.title()}'"))
            break

    # Age & Comorbidity Risk Multiplier
    if age >= 70:
        symptom_boost += 5
        factors.append(ClinicalFactor(category="RISK_HISTORY", label="Geriatric Vulnerability", impact="LOW", detail=f"Age {age} with increased risk of rapid decompensation"))

    if any(h.lower() in ["copd", "heart failure", "cad", "diabetes", "immunocompromised", "stroke"] for h in medical_history):
        symptom_boost += 5
        factors.append(ClinicalFactor(category="RISK_HISTORY", label="Comorbidity Risk", impact="LOW", detail="Significant cardiovascular/pulmonary history"))

    # 5. Wait-Time Decay Curve (Adds up to 15 points over 120 mins)
    wait_time_points = min(15.0, (wait_mins / 120.0) * 15.0)
    if wait_mins >= 60:
        factors.append(ClinicalFactor(
            category="WAIT_TIME",
            label="Extended Wait Time",
            impact="MEDIUM" if wait_mins < 90 else "HIGH",
            detail=f"Patient has been waiting for {wait_mins} mins"
        ))

    # 6. Composite Score Calculation (0 to 100)
    # NEWS2 physiological acuity is primary driver (up to 60 points)
    news2_points = min(60.0, news2 * 6.5)
    
    # Critical vital threshold bonus
    critical_vital_bonus = 0
    if current_vitals.sp_o2 is not None and current_vitals.sp_o2 <= 90:
        critical_vital_bonus += 20
    if current_vitals.systolic_bp is not None and current_vitals.systolic_bp <= 90:
        critical_vital_bonus += 20
    if current_vitals.resp_rate is not None and current_vitals.resp_rate >= 28:
        critical_vital_bonus += 10

    composite = min(100.0, max(5.0, news2_points + critical_vital_bonus + symptom_boost + wait_time_points))

    # 7. Tier Assignment
    # P1 (Immediate / Red): Composite >= 75 or single extreme NEWS2 trigger (e.g. NEWS2 >= 7 or critical SpO2/BP)
    # P2 (Urgent / Orange): Composite >= 50 or NEWS2 >= 5
    # P3 (Delayed / Yellow): Composite >= 28 or NEWS2 >= 2
    # P4 (Routine / Green): Composite < 28
    if composite >= 72 or news2 >= 7 or (current_vitals.sp_o2 and current_vitals.sp_o2 <= 89) or (current_vitals.systolic_bp and current_vitals.systolic_bp <= 85):
        tier = PriorityTier.P1_IMMEDIATE
    elif composite >= 48 or news2 >= 4:
        tier = PriorityTier.P2_URGENT
    elif composite >= 26 or news2 >= 2:
        tier = PriorityTier.P3_DELAYED
    else:
        tier = PriorityTier.P4_ROUTINE

    return UrgencyScore(
        composite_score=round(composite, 1),
        tier=tier,
        news2_score=news2,
        wait_time_minutes=wait_mins,
        factors=factors,
        missing_data_alerts=missing_alerts,
        last_evaluated_at=datetime.utcnow().isoformat()
    )
