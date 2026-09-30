import urllib.request
import json
import time

BASE = 'http://127.0.0.1:8000'

def test_attendance_and_records():
    # 1. Reset demo first to get baseline
    req_reset = urllib.request.Request(f'{BASE}/api/demo/reset', method='POST')
    urllib.request.urlopen(req_reset)

    # 2. Check initial active patients (should be 6) and records (should be 0)
    pts = json.loads(urllib.request.urlopen(f'{BASE}/api/patients').read().decode())
    recs = json.loads(urllib.request.urlopen(f'{BASE}/api/records').read().decode())
    stats = json.loads(urllib.request.urlopen(f'{BASE}/api/stats').read().decode())
    print(f"[STEP 1-2] Initial: {len(pts)} active, {len(recs)} records, stats: active={stats['total_active']}, attended={stats['attended_today']}")
    assert len(pts) == 6, f"Expected 6 active, got {len(pts)}"
    assert len(recs) == 0, f"Expected 0 records, got {len(recs)}"

    # 3-4. Attend pt-101 (Eleanor Vance)
    attend_payload = {"clinician_name": "Dr. Emily Watson, MD"}
    req_attend = urllib.request.Request(
        f'{BASE}/api/patients/pt-101/attend',
        data=json.dumps(attend_payload).encode(),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req_attend) as resp:
        assert resp.status == 200
        print("[STEP 3-4] Patient pt-101 successfully attended by Dr. Emily Watson, MD")

    # 5. Confirm patient disappears from active queue
    pts_after = json.loads(urllib.request.urlopen(f'{BASE}/api/patients').read().decode())
    print(f"[STEP 5] Active queue after attendance: {len(pts_after)} patients")
    assert len(pts_after) == 5, f"Expected 5 active, got {len(pts_after)}"
    assert not any(p['id'] == 'pt-101' for p in pts_after), "pt-101 still in active queue!"
    print("[PASS] pt-101 removed from active queue")

    # 6-9. Open Records: confirm patient appears
    recs_after = json.loads(urllib.request.urlopen(f'{BASE}/api/records').read().decode())
    print(f"[STEP 6-9] Records count: {len(recs_after)}")
    assert len(recs_after) == 1, f"Expected 1 record, got {len(recs_after)}"
    rec = recs_after[0]
    assert rec['id'] == 'pt-101'
    assert rec['name'] == 'Eleanor Vance'
    assert rec['status'] == 'ATTENDED'
    assert rec['attendance']['clinician_name'] == 'Dr. Emily Watson, MD'
    print(f"[PASS] Attended record verified in /api/records: {rec['name']} attended by {rec['attendance']['clinician_name']}")

    # Check stats
    stats_after = json.loads(urllib.request.urlopen(f'{BASE}/api/stats').read().decode())
    assert stats_after['total_active'] == 5
    assert stats_after['attended_today'] == 1
    print(f"[PASS] Statistics verified: active={stats_after['total_active']}, attended_today={stats_after['attended_today']}")

    print("\n[SUCCESS] PRE-RESTART ATTENDANCE WORKFLOW FULLY VERIFIED!")

if __name__ == '__main__':
    test_attendance_and_records()
