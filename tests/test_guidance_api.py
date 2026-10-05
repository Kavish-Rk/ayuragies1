"""API endpoint integration tests for AYURAGIES Guidance."""
import pytest
from fastapi.testclient import TestClient

from backend.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_headers():
    return {
        "X-User-Role": "screener",
        "X-User-Email": "screener@phc.assam.gov.in",
        "X-User-Name": "S. Terangpi",
        "X-User-Station": "Diphu PHC, Assam",
    }


def test_get_demo_context(client, auth_headers):
    res = client.get("/api/guidance/demo-context", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["patient_id"] == "DEMO-001"
    assert "movement" in data
    assert "symptoms" in data
    assert "diet" in data


def test_generate_guidance_api(client, auth_headers):
    payload = {
        "patient_id": "DEMO-001",
        "name": "Demo Benchmark",
        "age": 58,
        "sex": "male",
        "bmi": 27.4,
        "activity_level": "low",
        "movement": {
            "knee_flexion_deg": 108.5,
            "knee_deficit_deg": 14.6,
            "limp_asymmetry_deg": 7.2,
        },
        "symptoms": {
            "pain_level_0_10": 4,
            "morning_stiffness_mins": 35,
        },
        "diet": {
            "diet_type": "vegetarian",
            "allergies": ["peanut"],
            "allergy_info_available": True,
        },
    }
    res = client.post("/api/guidance/generate", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["session_id"].startswith("AYUR-GUIDE-")
    assert len(data["yoga_recommendations"]) >= 4
    assert len(data["nutrition_recommendations"]) >= 5


def test_save_and_retrieve_guidance_session(client, auth_headers):
    # 1. Generate
    gen_res = client.post(
        "/api/guidance/generate",
        json={"patient_id": "DEMO-001", "name": "Persistence Test"},
        headers=auth_headers,
    )
    gen_data = gen_res.json()

    # 2. Save
    save_payload = {
        "patient_id": None,
        "session_code": gen_data["session_id"],
        "is_demo": True,
        "overall_safety_status": gen_data["overall_safety_status"],
        "clinical_summary": gen_data["clinical_summary"],
        "safety_notices": gen_data["safety_notices"],
        "allergy_warning": gen_data["allergy_warning"],
        "yoga_recommendations": gen_data["yoga_recommendations"],
        "nutrition_recommendations": gen_data["nutrition_recommendations"],
    }
    save_res = client.post("/api/guidance/save", json=save_payload, headers=auth_headers)
    assert save_res.status_code == 200
    saved_id = save_res.json()["id"]

    # 3. Retrieve by session code
    get_res = client.get(f"/api/guidance/session/{gen_data['session_id']}", headers=auth_headers)
    assert get_res.status_code == 200
    retrieved = get_res.json()
    assert retrieved["session_code"] == gen_data["session_id"]
    assert len(retrieved["yoga_recommendations"]) == len(gen_data["yoga_recommendations"])

    # 4. Retrieve by integer database ID
    get_by_id = client.get(f"/api/guidance/session/{saved_id}", headers=auth_headers)
    assert get_by_id.status_code == 200


def test_yoga_and_nutrition_library_endpoints(client, auth_headers):
    y_res = client.get("/api/guidance/yoga-library", headers=auth_headers)
    assert y_res.status_code == 200
    assert len(y_res.json()) >= 12

    n_res = client.get("/api/guidance/nutrition-library", headers=auth_headers)
    assert n_res.status_code == 200
    assert len(n_res.json()) >= 10
