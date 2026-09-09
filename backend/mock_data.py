from datetime import datetime, timezone, timedelta
from models import Patient, Vitals, PatientStatus, PriorityTier

def get_initial_mock_patients():
    now = datetime.now(timezone.utc)

    p1_time = (now - timedelta(minutes=42)).isoformat()
    p1_rec = (now - timedelta(minutes=40)).isoformat()

    p2_time = (now - timedelta(minutes=28)).isoformat()
    p2_rec = (now - timedelta(minutes=25)).isoformat()

    p3_time = (now - timedelta(minutes=75)).isoformat()
    p3_rec = (now - timedelta(minutes=70)).isoformat()

    p4_time = (now - timedelta(minutes=18)).isoformat()
    p4_rec = (now - timedelta(minutes=15)).isoformat()

    p5_time = (now - timedelta(minutes=55)).isoformat()
    p5_rec = (now - timedelta(minutes=50)).isoformat()

    p6_time = (now - timedelta(minutes=12)).isoformat()
    p6_rec = (now - timedelta(minutes=10)).isoformat()

    return [
        Patient(
            id="pt-101",
            mrn="MRN-84920",
            name="Eleanor Vance",
            age=34,
            gender="Female",
            arrival_time=p1_time,
            chief_complaint="Exacerbation of known asthma with audible wheeze",
            symptoms=["moderate asthma", "dry cough", "chest tightness", "mild shortness of breath"],
            medical_history=["Asthma", "Allergic Rhinitis"],
            allergies=["Penicillin"],
            current_vitals=Vitals(
                heart_rate=88,
                systolic_bp=122,
                diastolic_bp=78,
                resp_rate=19,
                sp_o2=95.0,
                temperature=36.8,
                gcs=15,
                pain_score=3,
                recorded_at=p1_rec
            ),
            vitals_history=[
                Vitals(heart_rate=88, systolic_bp=122, diastolic_bp=78, resp_rate=19, sp_o2=95.0, temperature=36.8, gcs=15, pain_score=3, recorded_at=p1_rec)
            ],
            notes=[
                {"timestamp": p1_time, "author": "Triage Desk", "text": "Arrived via self-transport. Reports using home inhaler x2 with partial relief."}
            ],
            status=PatientStatus.WAITING
        ),
        Patient(
            id="pt-102",
            mrn="MRN-73911",
            name="Arthur Pendelton",
            age=68,
            gender="Male",
            arrival_time=p2_time,
            chief_complaint="Substernal chest pressure radiating to left arm",
            symptoms=["chest pain", "chest pressure", "diaphoresis", "nausea"],
            medical_history=["CAD (Stent 2019)", "Type 2 Diabetes", "Hypertension"],
            allergies=["Sulfa drugs"],
            current_vitals=Vitals(
                heart_rate=108,
                systolic_bp=165,
                diastolic_bp=98,
                resp_rate=22,
                sp_o2=94.0,
                temperature=37.1,
                gcs=15,
                pain_score=7,
                recorded_at=p2_rec
            ),
            vitals_history=[
                Vitals(heart_rate=108, systolic_bp=165, diastolic_bp=98, resp_rate=22, sp_o2=94.0, temperature=37.1, gcs=15, pain_score=7, recorded_at=p2_rec)
            ],
            notes=[
                {"timestamp": p2_time, "author": "Triage Desk", "text": "ECG requested. Appears pale and anxious. Reports onset 90 mins ago during yard work."}
            ],
            status=PatientStatus.WAITING
        ),
        Patient(
            id="pt-103",
            mrn="MRN-55201",
            name="Harold Finch",
            age=76,
            gender="Male",
            arrival_time=p3_time,
            chief_complaint="General malaise, low-grade fever, mild disorientation per family",
            symptoms=["fever in elderly", "acute confusion", "lethargy", "decreased oral intake"],
            medical_history=["Mild Dementia", "Chronic Kidney Disease Stage 3", "Hypertension"],
            allergies=["None"],
            current_vitals=Vitals(
                heart_rate=98,
                systolic_bp=104,
                diastolic_bp=64,
                resp_rate=21,
                sp_o2=93.0,
                temperature=38.6,
                gcs=14,
                pain_score=1,
                recorded_at=p3_rec # Stale vitals > 70 mins
            ),
            vitals_history=[
                Vitals(heart_rate=98, systolic_bp=104, diastolic_bp=64, resp_rate=21, sp_o2=93.0, temperature=38.6, gcs=14, pain_score=1, recorded_at=p3_rec)
            ],
            notes=[
                {"timestamp": p3_time, "author": "Nurse triage", "text": "Accompanied by daughter. Daughter notes patient has not urinated since morning."}
            ],
            status=PatientStatus.WAITING
        ),
        Patient(
            id="pt-104",
            mrn="MRN-33019",
            name="Marcus Brody",
            age=26,
            gender="Male",
            arrival_time=p4_time,
            chief_complaint="Right wrist pain and swelling after soccer fall",
            symptoms=["wrist pain", "localized swelling", "mild contusion"],
            medical_history=["None"],
            allergies=["None"],
            current_vitals=Vitals(
                heart_rate=72,
                systolic_bp=118,
                diastolic_bp=76,
                resp_rate=14,
                sp_o2=99.0,
                temperature=36.6,
                gcs=15,
                pain_score=4,
                recorded_at=p4_rec
            ),
            vitals_history=[
                Vitals(heart_rate=72, systolic_bp=118, diastolic_bp=76, resp_rate=14, sp_o2=99.0, temperature=36.6, gcs=15, pain_score=4, recorded_at=p4_rec)
            ],
            notes=[
                {"timestamp": p4_time, "author": "Triage Desk", "text": "Ice pack applied. Radial pulse intact. X-ray pending."}
            ],
            status=PatientStatus.WAITING
        ),
        Patient(
            id="pt-105",
            mrn="MRN-91204",
            name="Sofia Chen",
            age=45,
            gender="Female",
            arrival_time=p5_time,
            chief_complaint="Severe right lower quadrant abdominal pain with vomiting",
            symptoms=["severe abdominal pain", "nausea and vomiting", "guarding"],
            medical_history=["Asthma"],
            allergies=["Aspirin"],
            current_vitals=Vitals(
                heart_rate=102,
                systolic_bp=130,
                diastolic_bp=82,
                resp_rate=18,
                sp_o2=98.0,
                temperature=37.9,
                gcs=15,
                pain_score=8,
                recorded_at=p5_rec
            ),
            vitals_history=[
                Vitals(heart_rate=102, systolic_bp=130, diastolic_bp=82, resp_rate=18, sp_o2=98.0, temperature=37.9, gcs=15, pain_score=8, recorded_at=p5_rec)
            ],
            notes=[
                {"timestamp": p5_time, "author": "Nurse triage", "text": "Pain worsened over last 6 hours. NPO status initiated."}
            ],
            status=PatientStatus.WAITING
        ),
        Patient(
            id="pt-106",
            mrn="MRN-64210",
            name="David Miller",
            age=52,
            gender="Male",
            arrival_time=p6_time,
            chief_complaint="Laceration on left forearm from power tool, bleeding controlled",
            symptoms=["deep laceration", "bleeding controlled", "moderate pain"],
            medical_history=["Hyperlipidemia"],
            allergies=["None"],
            current_vitals=Vitals(
                heart_rate=80,
                systolic_bp=128,
                diastolic_bp=80,
                resp_rate=16,
                sp_o2=98.0,
                temperature=36.7,
                gcs=15,
                pain_score=5,
                recorded_at=p6_rec
            ),
            vitals_history=[
                Vitals(heart_rate=80, systolic_bp=128, diastolic_bp=80, resp_rate=16, sp_o2=98.0, temperature=36.7, gcs=15, pain_score=5, recorded_at=p6_rec)
            ],
            notes=[
                {"timestamp": p6_time, "author": "Triage Desk", "text": "Pressure dressing intact. Tetanus shot up to date."}
            ],
            status=PatientStatus.WAITING
        )
    ]
