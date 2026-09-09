import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from models import Vitals, PriorityTier
from scoring_engine import calculate_news2, calculate_urgency
from mock_data import get_initial_mock_patients

def test_clinical_scoring():
    # 1. Test normal vitals
    normal_v = Vitals(heart_rate=72, systolic_bp=120, resp_rate=16, sp_o2=98.0, temperature=36.8)
    news2, factors = calculate_news2(normal_v)
    assert news2 == 0, f"Expected 0 NEWS2 for normal vitals, got {news2}"
    print("[PASS] Normal vitals NEWS2 = 0 verified")

    # 2. Test severe hypoxia & tachycardia deterioration
    crisis_v = Vitals(heart_rate=135, systolic_bp=85, resp_rate=29, sp_o2=87.0, temperature=38.9)
    news2_c, factors_c = calculate_news2(crisis_v)
    assert news2_c >= 9, f"Expected critical NEWS2 (>=9), got {news2_c}"
    print(f"[PASS] Critical crisis vitals NEWS2 = {news2_c} verified")

    # 3. Test composite urgency calculation
    score = calculate_urgency(
        current_vitals=crisis_v,
        symptoms=["acute asthma crisis", "severe shortness of breath"],
        arrival_time_str="2026-09-09T06:00:00Z",
        age=34,
        medical_history=["Asthma"]
    )
    assert score.tier == PriorityTier.P1_IMMEDIATE, f"Expected P1_IMMEDIATE, got {score.tier}"
    assert score.composite_score >= 70, f"Expected high composite score >= 70, got {score.composite_score}"
    assert len(score.factors) >= 3, "Expected multiple contributing factors identified"
    print(f"[PASS] Composite Score = {score.composite_score}, Tier = {score.tier.value} verified")

    # 4. Test mock patient initialization
    patients = get_initial_mock_patients()
    assert len(patients) == 6, f"Expected 6 demo patients, got {len(patients)}"
    print(f"[PASS] {len(patients)} Demo Patient Profiles loaded successfully")

    print("\nALL CLINICAL & BACKEND UNIT TESTS PASSED!")

if __name__ == "__main__":
    test_clinical_scoring()
