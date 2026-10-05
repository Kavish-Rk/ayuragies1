"""End-to-end integration test for Demo Mode (DEMO-001) and persistence workflow."""
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.db import get_connection


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_headers():
    return {
        "X-User-Role": "screener",
        "X-User-Email": "screener@phc.assam.gov.in",
        "X-User-Name": "S. Terangpi",
    }


def test_demo_patient_complete_workflow(client, auth_headers):
    """Verify exact acceptance workflow:
    1. Retrieve Demo Patient Context (DEMO-001)
    2. Generate AI Guidance
    3. Verify Yoga & Nutrition structure
    4. Save Guidance Session
    5. Retrieve History
    6. Verify provenance tag
    """
    # 1. Retrieve Demo Context
    demo_ctx_res = client.get("/api/guidance/demo-context", headers=auth_headers)
    assert demo_ctx_res.status_code == 200
    demo_ctx = demo_ctx_res.json()
    assert demo_ctx["patient_id"] == "DEMO-001"
    assert demo_ctx["is_demo"] is True

    # 2. Generate AI Guidance
    gen_res = client.post("/api/guidance/generate", json=demo_ctx, headers=auth_headers)
    assert gen_res.status_code == 200
    guidance = gen_res.json()

    # 3. Verify Yoga & Nutrition
    assert "DEMONSTRATION" in guidance["data_provenance"]
    assert len(guidance["yoga_recommendations"]) > 0
    assert len(guidance["nutrition_recommendations"]) > 0

    # Verify every yoga item has explanation and precautions
    for y in guidance["yoga_recommendations"]:
        assert y["why_selected"]
        assert len(y["precautions"]) > 0
        assert len(y["stop_conditions"]) > 0

    # Verify nutrition contains PRIORITIZE and LIMIT
    nutr_cats = {n["category"] for n in guidance["nutrition_recommendations"]}
    assert "PRIORITIZE" in nutr_cats
    assert "LIMIT" in nutr_cats

    # 4. Save Guidance Session
    save_payload = {
        "patient_id": None,
        "session_code": guidance["session_id"],
        "is_demo": True,
        "data_provenance": guidance["data_provenance"],
        "overall_safety_status": guidance["overall_safety_status"],
        "clinical_summary": guidance["clinical_summary"],
        "safety_notices": guidance["safety_notices"],
        "allergy_warning": guidance["allergy_warning"],
        "patient_context": demo_ctx,
        "yoga_recommendations": guidance["yoga_recommendations"],
        "nutrition_recommendations": guidance["nutrition_recommendations"],
    }
    save_res = client.post("/api/guidance/save", json=save_payload, headers=auth_headers)
    assert save_res.status_code == 200
    saved_id = save_res.json()["id"]

    # 5. Retrieve from database directly to verify schema persistence
    conn = get_connection()
    session_row = conn.execute("SELECT * FROM guidance_sessions WHERE id = ?", (saved_id,)).fetchone()
    assert session_row is not None
    assert session_row["session_code"] == guidance["session_id"]
    assert session_row["mode"] == "demo_simulation"

    yoga_count = conn.execute("SELECT COUNT(*) FROM yoga_recommendations WHERE session_id = ?", (saved_id,)).fetchone()[0]
    assert yoga_count == len(guidance["yoga_recommendations"])

    nutr_count = conn.execute("SELECT COUNT(*) FROM nutrition_recommendations WHERE session_id = ?", (saved_id,)).fetchone()[0]
    assert nutr_count == len(guidance["nutrition_recommendations"])
    conn.close()
