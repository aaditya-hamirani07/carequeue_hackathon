import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000"

def test_e2e_api():
    # 1. Test get patients
    req = urllib.request.Request(f"{BASE_URL}/api/patients")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        patients = json.loads(resp.read().decode())
        print(f"[PASS] GET /api/patients returned {len(patients)} patients")
        top_patient = patients[0]
        print(f"       Current top priority patient: {top_patient['name']} ({top_patient['urgency']['tier']})")

    # 2. Test vitals escalation on Eleanor Vance (pt-101)
    vitals_payload = {
        "vitals": {
            "heart_rate": 128,
            "systolic_bp": 118,
            "diastolic_bp": 75,
            "resp_rate": 28,
            "sp_o2": 88.0,
            "temperature": 37.0,
            "gcs": 15,
            "pain_score": 5
        },
        "note": "Sudden onset severe dyspnea and wheezing."
    }
    req = urllib.request.Request(
        f"{BASE_URL}/api/patients/pt-101/vitals",
        data=json.dumps(vitals_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        result = json.loads(resp.read().decode())
        print(f"[PASS] POST /api/patients/pt-101/vitals escalated: {result['patient']['urgency']['tier']}")
        assert result['patient']['urgency']['tier'] == "P1_IMMEDIATE"

    # 3. Test queue re-ranking (Eleanor should now be #1)
    req = urllib.request.Request(f"{BASE_URL}/api/patients")
    with urllib.request.urlopen(req) as resp:
        patients = json.loads(resp.read().decode())
        assert patients[0]['id'] == "pt-101", f"Expected Eleanor pt-101 at top of queue, got {patients[0]['id']}"
        print(f"[PASS] Queue dynamically re-ranked Eleanor Vance to #1 (P1_IMMEDIATE)")

    # 4. Test Provider Override
    override_payload = {
        "new_tier": "P1_IMMEDIATE",
        "reason": "Substernal chest pressure in patient with prior stent. High risk.",
        "provider_name": "Dr. Emily Watson, MD"
    }
    req = urllib.request.Request(
        f"{BASE_URL}/api/patients/pt-102/override",
        data=json.dumps(override_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        print("[PASS] POST /api/patients/pt-102/override successfully applied")

    # 5. Test stats
    req = urllib.request.Request(f"{BASE_URL}/api/stats")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        stats = json.loads(resp.read().decode())
        print(f"[PASS] GET /api/stats: {stats['total_active']} active, {stats['p1_immediate']} P1 cases")

    # 6. Test Demo Reset
    req = urllib.request.Request(f"{BASE_URL}/api/demo/reset", method='POST')
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        print("[PASS] POST /api/demo/reset queue restored to baseline")

    print("\nALL END-TO-END SYSTEM INTEGRATION TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_e2e_api()
