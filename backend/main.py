import asyncio
import base64
import hashlib
import ipaddress
import json
import os
from pathlib import Path
import secrets
import sys
import tempfile
import time
import jwt
from jwt import PyJWKClient
from urllib.parse import quote
import urllib.request

import httpx
import joblib
from fastapi import Cookie, Depends, FastAPI, File, Header, HTTPException, Query, Response, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, StreamingResponse

from .db import get_connection, init_db
from .schemas import (
    AnalysisRequest,
    ClinicalPredictRequest,
    DeviceConfig,
    GuidanceGenerateRequest,
    GuidanceSaveRequest,
    PatientCreate,
    PatientVitalsUpdate,
    QuestionnairePayload,
    ScreeningCreate,
)

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = PROJECT_ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent / ".env")
    load_dotenv(PROJECT_ROOT / ".env")
except Exception:
    pass

from oa_screening.movement_prediction import predict_video
from oa_screening.risk_engine import combine_screening, recommendation_for
from oa_screening.xray_model import XRayModelSpec
from oa_screening.guidance import (
    DEFAULT_GUIDANCE_ENGINE,
    DietPreferences,
    EXERCISE_LIBRARY,
    MovementAssessmentData,
    NUTRITION_LIBRARY,
    PatientAssessmentContext,
    SymptomContext,
)

MODEL_PATH = PROJECT_ROOT / "artifacts" / "movement_baseline.joblib"
XRAY_MODEL_PATH = PROJECT_ROOT / "artifacts" / "xray_checkpoint.pth"
CLINICAL_MODEL_PATH = PROJECT_ROOT / "artifacts" / "clinical_biomechanical_oa_model.joblib"

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173").rstrip("/")
# Automatically enable secure cookies in production for cross-origin auth (Vercel to Render)
is_production = "localhost" not in FRONTEND_ORIGIN and "127.0.0.1" not in FRONTEND_ORIGIN
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", str(is_production)).lower() == "true"
SESSION_SECRET = os.environ.get("SESSION_SECRET", "oa_ner_session_secret_lts")
SESSION_MAX_AGE_SECONDS = 7 * 24 * 3600

MAX_VIDEO_BYTES = 100 * 1024 * 1024
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
MAX_IMAGE_BYTES = 20 * 1024 * 1024
ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}

OAUTH_STATES: dict[str, dict[str, object]] = {}

app = FastAPI(title="OA Risk Screening App", version="0.4.0")

allowed_origins = list(dict.fromkeys([
    FRONTEND_ORIGIN,
    "https://orthonex.vercel.app",
    "https://oa-ner-scanning-project.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]))
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)
init_db()


@app.get("/")
def root_health():
    """Health / root endpoint."""
    return {
        "application": "AYURAGIES",
        "backend": "online",
        "status": "ok",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    """Health endpoint for frontend connectivity check."""
    return {"status": "ok"}


def _patient_exists(conn, patient_id: int | None) -> None:
    if patient_id is not None and conn.execute("SELECT 1 FROM patients WHERE id = ?", (patient_id,)).fetchone() is None:
        raise HTTPException(status_code=404, detail="Patient record was not found.")


SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")

def get_current_user_optional(
    authorization: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None, alias="X-User-Role"),
    x_user_station: str | None = Header(default=None, alias="X-User-Station"),
    x_user_email: str | None = Header(default=None, alias="X-User-Email"),
    x_user_name: str | None = Header(default=None, alias="X-User-Name"),
) -> dict[str, object] | None:
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        try:
            if SUPABASE_JWT_SECRET:
                payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
            else:
                payload = jwt.decode(token, options={"verify_signature": False})
            
            user_metadata = payload.get("user_metadata", {})
            return {
                "id": payload.get("sub"),
                "email": payload.get("email"),
                "name": user_metadata.get("full_name", payload.get("email", "User")),
                "role_id": user_metadata.get("role_id", "screener"),
                "role": "Medical Officer" if user_metadata.get("role_id") == "officer" else "System Administrator" if user_metadata.get("role_id") == "admin" else "Clinical Screener",
                "station": user_metadata.get("station", "Diphu PHC"),
                "staff_id": user_metadata.get("staff_id", "NER-101")
            }
        except Exception as e:
            print(f"JWT Decode error: {e}")
            pass
            
    if x_user_role:
        role_clean = x_user_role.lower().strip()
        role_label = "Clinical Screener" if role_clean == "screener" else "Medical Officer" if role_clean == "officer" else "System Administrator"
        role_badge = "Station Screener" if role_clean == "screener" else "Medical Officer" if role_clean == "officer" else "System Admin"
        return {
            "id": 99,
            "email": x_user_email or f"{role_clean}@phc.assam.gov.in",
            "name": x_user_name or f"Authorized {role_label}",
            "role": role_label,
            "role_id": role_clean,
            "role_badge": role_badge,
            "station": x_user_station or ("Diphu PHC" if role_clean == "screener" else "GMCH Ortho Unit" if role_clean == "officer" else "ICMR Telemetry Hub"),
            "staff_id": f"NER-{role_clean.upper()}-01"
        }
    return None

def require_authenticated_user(user: dict[str, object] | None = Depends(get_current_user_optional)) -> dict[str, object]:
    if not user:
        raise HTTPException(status_code=401, detail="Authentication is required.")
    return user

def require_role(*allowed_roles: str):
    def role_checker(user: dict[str, object] = Depends(require_authenticated_user)) -> dict[str, object]:
        user_role = str(user.get("role_id") or "screener").lower()
        if allowed_roles and user_role not in allowed_roles:
            raise HTTPException(status_code=403, detail=f"Access forbidden: Role '{user_role}' required.")
        return user
    return role_checker

def create_patient(payload: PatientCreate, user: dict[str, object] = Depends(require_authenticated_user)) -> dict[str, object]:
    if not payload.consent:
        raise HTTPException(status_code=422, detail="Recorded consent is required before creating a patient record.")
    
    bmi = payload.bmi
    if bmi is None and payload.height_cm and payload.weight_kg and payload.height_cm > 0:
        bmi = round(payload.weight_kg / ((payload.height_cm / 100.0) ** 2), 1)

    assigned_station = payload.assigned_station or str(user.get("station") or "Diphu PHC")
    triage_status = payload.triage_status or "pending_survey"
    referral_status = payload.referral_status or "none"

    conn = get_connection()
    cursor = conn.execute(
        """INSERT INTO patients (
            name, age, gender, occupation, region, state, district, abha_id,
            height_cm, weight_kg, bmi, assigned_station, triage_status, referral_status, consent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            payload.name.strip(), payload.age, payload.gender, payload.occupation,
            payload.region, payload.state, payload.district, payload.abha_id,
            payload.height_cm, payload.weight_kg, bmi, assigned_station, triage_status, referral_status,
            int(payload.consent)
        )
    )
    conn.commit()
    patient_id = cursor.lastrowid
    conn.close()
    return {
        "id": patient_id,
        "name": payload.name.strip(),
        "age": payload.age,
        "gender": payload.gender,
        "occupation": payload.occupation,
        "region": payload.region,
        "state": payload.state,
        "district": payload.district,
        "abha_id": payload.abha_id,
        "height_cm": payload.height_cm,
        "weight_kg": payload.weight_kg,
        "bmi": bmi,
        "assigned_station": assigned_station,
        "triage_status": triage_status,
        "referral_status": referral_status,
        "consent": payload.consent,
        "message": "Patient registered successfully"
    }


@app.get("/api/patients")
def list_patients(
    station: str | None = Query(default=None),
    role: str | None = Query(default=None),
    user: dict[str, object] = Depends(require_authenticated_user)
) -> list[dict[str, object]]:
    conn = get_connection()
    user_role = (role or str(user.get("role_id") or "screener")).lower()
    user_station = station or str(user.get("station") or "")

    query = """SELECT id, name, age, gender, occupation, region, state, district, abha_id,
                      height_cm, weight_kg, bmi, assigned_station, triage_status, referral_status,
                      consent, created_at FROM patients"""
    params = []
    conditions = []

    if user_role == "screener":
        # Screeners only see their assigned station or local region/district queue
        if user_station:
            parts = [p.strip() for p in user_station.replace('/', ',').split(',') if p.strip()]
            words = [parts[0]]
            first_word = parts[0].split()[0]
            if first_word and first_word not in words:
                words.append(first_word)
            if len(parts) > 1 and parts[-1] not in words:
                words.append(parts[-1])

            sub_conds = []
            for w in words:
                sub_conds.append("(assigned_station LIKE ? OR region LIKE ? OR district LIKE ? OR state LIKE ?)")
                params.extend([f"%{w}%", f"%{w}%", f"%{w}%", f"%{w}%"])
            if sub_conds:
                conditions.append("(" + " OR ".join(sub_conds) + ")")
    elif user_role == "officer":
        # Medical Officers see patients in their clinical referral network
        if user_station:
            keyword = user_station.split(",")[0].strip()
            # If specified station, filter to relevant regional hospital or referral queue
            if "safdarjung" in keyword.lower() or "delhi" in keyword.lower():
                conditions.append("(region LIKE ? OR state LIKE ? OR assigned_station LIKE ?)")
                params.extend(["%Delhi%", "%Delhi%", "%Safdarjung%"])
            elif "noida" in keyword.lower():
                conditions.append("(region LIKE ? OR state LIKE ? OR district LIKE ?)")
                params.extend(["%Noida%", "%Uttar Pradesh%", "%Gautam%"])
            elif "diphu" in keyword.lower() or "assam" in keyword.lower():
                conditions.append("(region LIKE ? OR state LIKE ? OR assigned_station LIKE ?)")
                params.extend(["%Assam%", "%Assam%", "%Diphu%"])

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY id DESC"
    rows = conn.execute(query, tuple(params)).fetchall()
    conn.close()

    result = []
    for row in rows:
        d = dict(row)
        if user_role == "admin":
            # For system admin audit view, mask patient personal names for ABDM privacy compliance
            name_parts = (d.get("name") or "Patient").split()
            masked_name = f"{name_parts[0]} " + ("".join(["*"] * len(name_parts[-1])) if len(name_parts) > 1 else "***")
            d["name"] = masked_name
        result.append(d)
    return result


@app.patch("/api/patients/{patient_id}/vitals")
def update_patient_vitals(
    patient_id: int,
    payload: PatientVitalsUpdate,
    _: dict[str, object] = Depends(require_authenticated_user)
) -> dict[str, object]:
    conn = get_connection()
    _patient_exists(conn, patient_id)

    bmi = payload.bmi
    if bmi is None and payload.height_cm and payload.weight_kg and payload.height_cm > 0:
        bmi = round(payload.weight_kg / ((payload.height_cm / 100.0) ** 2), 1)

    updates = []
    values = []
    if payload.height_cm is not None:
        updates.append("height_cm = ?")
        values.append(payload.height_cm)
    if payload.weight_kg is not None:
        updates.append("weight_kg = ?")
        values.append(payload.weight_kg)
    if bmi is not None:
        updates.append("bmi = ?")
        values.append(bmi)

    if updates:
        values.append(patient_id)
        conn.execute(f"UPDATE patients SET {', '.join(updates)} WHERE id = ?", tuple(values))
        conn.commit()
    conn.close()
    return {
        "status": "success",
        "patient_id": patient_id,
        "height_cm": payload.height_cm,
        "weight_kg": payload.weight_kg,
        "bmi": bmi,
        "message": "Patient vitals updated successfully"
    }


@app.post("/api/questionnaire")
def save_questionnaire(payload: QuestionnairePayload, _: dict[str, object] = Depends(require_authenticated_user)) -> dict[str, object]:
    score, category, factors = _questionnaire_result(payload)
    conn = get_connection()
    _patient_exists(conn, payload.patient_id)
    cursor = conn.execute(
        "INSERT INTO questionnaires (patient_id, raw_score, category, payload_json) VALUES (?, ?, ?, ?)",
        (payload.patient_id, score, category, payload.model_dump_json())
    )
    conn.commit()
    record_id = cursor.lastrowid
    conn.close()
    return {
        "id": record_id,
        "patient_id": payload.patient_id,
        "raw_score": score,
        "category": category,
        "contributing_factors": factors,
        "recommendation": recommendation_for(category),
        "data_source": "backend_rule_engine",
        "is_simulated": False
    }


@app.post("/api/movement/analyze-video")
async def analyze_movement_video(file: UploadFile = File(...), _: dict[str, object] = Depends(require_authenticated_user)) -> dict[str, object]:
    raw_filename = Path(file.filename or "").name
    suffix = Path(raw_filename).suffix.lower()
    if suffix not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Upload an MP4, MOV, AVI, MKV, or WebM video.")
    if not MODEL_PATH.exists():
        raise HTTPException(status_code=503, detail="Movement model is unavailable.")
    content = await file.read(MAX_VIDEO_BYTES + 1)
    if not content or len(content) > MAX_VIDEO_BYTES:
        raise HTTPException(status_code=413, detail="Video must be between 1 byte and 100 MB.")
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp:
        temp.write(content)
        temp_path = Path(temp.name)
    try:
        result = predict_video(temp_path, MODEL_PATH)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    finally:
        temp_path.unlink(missing_ok=True)
    return {
        "status": "success",
        "filename": raw_filename or "gait_session.mp4",
        "dataset_label": result["dataset_label"],
        "category": result["category"],
        "binary_screening": result.get("binary_screening", "screen_negative"),
        "screening_tier": result.get("screening_tier", "Screen Negative (Low Risk)"),
        "screening_positive_prob": result.get("screening_positive_prob", 0.0),
        "confidence": result["confidence"],
        "probabilities": result["probabilities"],
        "features": result["features"],
        "recommendation": recommendation_for(result["category"]),
        "is_simulated": False,
        "data_source": "backend_model"
    }


@app.post("/api/clinical/predict")
def predict_clinical_oa_risk(payload: ClinicalPredictRequest, _: dict[str, object] = Depends(require_authenticated_user)) -> dict[str, object]:
    if not CLINICAL_MODEL_PATH.exists():
        raise HTTPException(status_code=503, detail="Clinical biomechanical OA model is not available.")
    
    try:
        bundle = joblib.load(CLINICAL_MODEL_PATH)
        pipeline = bundle["pipeline"]
        feature_names = bundle["feature_names"]
        
        koos_pain = max(0.0, min(100.0, 100.0 - (payload.pain * 10.0)))
        womac_pain = max(0.0, min(20.0, payload.pain * 2.0))
        womac_stiffness = max(0.0, min(8.0, (payload.stiffness / 60.0) * 8.0))
        womac_function = max(0.0, min(68.0, womac_pain * 3.4))
        womac_total = womac_pain + womac_stiffness + womac_function
        
        data_dict = {
            "side": float(payload.side),
            "age": float(payload.age),
            "sex": float(payload.sex),
            "bmi": float(payload.bmi),
            "bp_sys": float(payload.bp_sys),
            "bp_dias": float(payload.bp_dias),
            "koos_pain": koos_pain,
            "womac_pain": womac_pain,
            "womac_stiffness": womac_stiffness,
            "womac_function": womac_function,
            "womac_total": womac_total,
            "gait_speed_20m": float(payload.gait_speed or 0.95),
            "walk_time_400m": 320.0 if (payload.gait_speed or 0.95) < 1.0 else 260.0,
            "knee_flexion_deg": float(payload.knee_flexion_deg or 135.0),
            "knee_alignment_deg": 2.0,
            "knee_deficit_deg": float(payload.knee_deficit_deg or 10.0),
            "knee_force_max": 120.0 if payload.age > 65 else 160.0,
        }
        
        X_input = [[data_dict.get(col, 0.0) for col in feature_names]]
        probs = pipeline.predict_proba(X_input)[0]
        pred_idx = int(pipeline.predict(X_input)[0])
        
        prob_oa_pain = float(probs[1])
        risk_category = "high" if prob_oa_pain >= 0.65 else "moderate" if prob_oa_pain >= 0.35 else "low"
        
        return {
            "status": "success",
            "predicted_class": bundle["class_names"][pred_idx],
            "oa_pain_probability": round(prob_oa_pain, 4),
            "risk_category": risk_category,
            "model_accuracy": bundle["metrics"]["accuracy"],
            "model_roc_auc": bundle["metrics"]["roc_auc"],
            "cohort": bundle.get("provenance", "OAI Cohort"),
            "contributing_factors": [
                f"Pain VAS: {payload.pain}/10 (KOOS Pain: {round(koos_pain, 1)})",
                f"Morning Stiffness: {payload.stiffness} mins",
                f"Gait Velocity: {payload.gait_speed or 0.95} m/s",
                f"BMI: {payload.bmi} kg/m²"
            ]
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Inference error: {error}") from error


@app.post("/api/movement/analyze")
def combine_analysis(payload: AnalysisRequest, _: dict[str, object] = Depends(require_authenticated_user)) -> dict[str, object]:
    outcome = combine_screening(payload.movement_category, payload.questionnaire_category)
    return {
        "patient_id": payload.patient_id,
        "movement_category": outcome.movement_category,
        "questionnaire_category": outcome.questionnaire_category,
        "combined_category": outcome.combined_category,
        "recommendation": outcome.recommendation,
        "explanation": outcome.explanation
    }


@app.post("/api/xray/analyze")
async def analyze_xray_image(file: UploadFile = File(...), user: dict[str, object] = Depends(require_authenticated_user)) -> dict[str, object]:
    raw_filename = Path(file.filename or "").name
    suffix = Path(raw_filename).suffix.lower()
    if suffix not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Upload a valid PNG, JPG, or JPEG X-ray image.")
    content = await file.read(MAX_IMAGE_BYTES + 1)
    if not content or len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image must be between 1 byte and 20 MB.")
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp:
        temp.write(content)
        temp_path = Path(temp.name)
    try:
        spec = XRayModelSpec(checkpoint_path=XRAY_MODEL_PATH)
        pred = spec.predict(temp_path)
    except Exception as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    finally:
        temp_path.unlink(missing_ok=True)
    conf_val = round(pred.confidence * 100, 1) if pred.confidence <= 1.0 else pred.confidence
    return {
        "status": "success",
        "filename": raw_filename or "knee_xray.png",
        "kl_grade": pred.kl_grade,
        "label": pred.label,
        "risk_level": pred.risk_level,
        "confidence": conf_val,
        "probabilities": pred.probabilities,
        "findings": pred.findings,
        "gradcam_base64": pred.gradcam_base64,
        "recommendation": pred.recommendation,
        "is_bilateral": pred.is_bilateral,
        "right_knee": pred.right_knee,
        "left_knee": pred.left_knee,
        "bilateral_asymmetry": pred.bilateral_asymmetry,
        "right_knee_crop_base64": pred.right_knee_crop_base64,
        "left_knee_crop_base64": pred.left_knee_crop_base64,
        "is_simulated": False,
        "data_source": "xray_spec_gradcam"
    }


@app.post("/api/upload")
async def upload_media(file: UploadFile = File(...), _: dict[str, object] = Depends(require_authenticated_user)) -> dict[str, object]:
    raw_filename = Path(file.filename or "").name
    suffix = Path(raw_filename).suffix.lower()
    allowed_all = ALLOWED_VIDEO_EXTENSIONS | ALLOWED_IMAGE_EXTENSIONS
    if suffix not in allowed_all:
        raise HTTPException(status_code=415, detail="Unsupported file format.")
    content = await file.read(MAX_VIDEO_BYTES + 1)
    if not content or len(content) > MAX_VIDEO_BYTES:
        raise HTTPException(status_code=413, detail="File must be between 1 byte and 100 MB.")
    safe_name = f"upload_{secrets.token_hex(8)}{suffix}"
    return {
        "status": "success",
        "original_filename": raw_filename,
        "safe_filename": safe_name,
        "size_bytes": len(content)
    }


@app.post("/api/screenings")
def save_screening(payload: ScreeningCreate, _: dict[str, object] = Depends(require_authenticated_user)) -> dict[str, object]:
    conn = get_connection()
    _patient_exists(conn, payload.patient_id)
    
    gait_metrics_dict = dict(payload.gait_metrics or {})
    if payload.clinical_prediction and "clinical_prediction" not in gait_metrics_dict:
        gait_metrics_dict["clinical_prediction"] = payload.clinical_prediction
    if payload.vitals and "vitals" not in gait_metrics_dict:
        gait_metrics_dict["vitals"] = payload.vitals
    if payload.clinical_symptoms and "clinical_symptoms" not in gait_metrics_dict:
        gait_metrics_dict["clinical_symptoms"] = payload.clinical_symptoms

    gait_metrics_str = json.dumps(gait_metrics_dict) if gait_metrics_dict else None
    vitals_str = json.dumps(payload.vitals) if payload.vitals else None
    clinical_metrics_str = json.dumps(payload.clinical_symptoms) if payload.clinical_symptoms else None
    
    clinical_risk_cat = payload.clinical_risk_category
    if not clinical_risk_cat and payload.clinical_prediction and isinstance(payload.clinical_prediction, dict):
        clinical_risk_cat = payload.clinical_prediction.get("risk_category")
        
    clinical_prob = payload.clinical_probability
    if clinical_prob is None and payload.clinical_prediction and isinstance(payload.clinical_prediction, dict):
        clinical_prob = payload.clinical_prediction.get("oa_pain_probability")

    cursor = conn.execute(
        """
        INSERT INTO screenings (
            patient_id, status, questionnaire_score, questionnaire_category,
            movement_category, movement_confidence, gait_metrics_json,
            xray_grade, combined_result, recommendation, data_source,
            simulation_status, movement_result, questionnaire_result,
            clinical_risk_category, clinical_probability, vitals_json, clinical_metrics_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload.patient_id,
            payload.status,
            payload.questionnaire_score,
            payload.questionnaire_category,
            payload.movement_category,
            payload.movement_confidence,
            gait_metrics_str,
            payload.xray_grade,
            payload.combined_result,
            payload.recommendation,
            payload.data_source,
            payload.simulation_status,
            payload.movement_result,
            payload.questionnaire_result,
            clinical_risk_cat,
            clinical_prob,
            vitals_str,
            clinical_metrics_str
        )
    )
    conn.commit()
    record_id = cursor.lastrowid
    conn.close()
    return {"id": record_id, "message": "Screening saved successfully"}


@app.get("/api/screenings")
def list_screenings(_: dict[str, object] = Depends(require_authenticated_user)) -> list[dict[str, object]]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT s.*, p.name AS patient_name FROM screenings s LEFT JOIN patients p ON p.id=s.patient_id ORDER BY s.id DESC"
    ).fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        if d.get("gait_metrics_json"):
            try:
                d["gait_metrics"] = json.loads(d["gait_metrics_json"])
            except Exception:
                d["gait_metrics"] = None
        if d.get("vitals_json"):
            try:
                d["vitals"] = json.loads(d["vitals_json"])
            except Exception:
                d["vitals"] = None
        if d.get("clinical_metrics_json"):
            try:
                d["clinical_symptoms"] = json.loads(d["clinical_metrics_json"])
            except Exception:
                d["clinical_symptoms"] = None
        result.append(d)
    return result


@app.get("/api/screenings/latest/{patient_id}")
def get_latest_screening(patient_id: int, _: dict[str, object] = Depends(require_authenticated_user)) -> dict[str, object]:
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM screenings WHERE patient_id = ? ORDER BY id DESC LIMIT 1",
        (patient_id,)
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="No previous screening found for this patient.")
    d = dict(row)
    if d.get("gait_metrics_json"):
        try:
            d["gait_metrics"] = json.loads(d["gait_metrics_json"])
        except Exception:
            d["gait_metrics"] = None
    if d.get("vitals_json"):
        try:
            d["vitals"] = json.loads(d["vitals_json"])
        except Exception:
            d["vitals"] = None
    if d.get("clinical_metrics_json"):
        try:
            d["clinical_symptoms"] = json.loads(d["clinical_metrics_json"])
        except Exception:
            d["clinical_symptoms"] = None
    return d


# ═════════════════════ AYURAGIES AI GUIDANCE ENDPOINTS ═════════════════════

@app.post("/api/guidance/generate")
def generate_ai_guidance(
    payload: GuidanceGenerateRequest,
    _: dict[str, object] = Depends(require_authenticated_user)
) -> dict[str, object]:
    """Generate personalized Yoga & Nutrition Guidance grounded in patient assessment data."""
    # Construct structured domain models from payload
    symptom_ctx = SymptomContext(
        pain_level_0_10=payload.symptoms.pain_level_0_10 if payload.symptoms else 4,
        morning_stiffness_mins=payload.symptoms.morning_stiffness_mins if payload.symptoms else 20,
        has_swelling=payload.symptoms.has_swelling if payload.symptoms else False,
        has_instability=payload.symptoms.has_instability if payload.symptoms else False,
        previous_knee_injury=payload.symptoms.previous_knee_injury if payload.symptoms else False,
        symptom_duration_weeks=payload.symptoms.symptom_duration_weeks if payload.symptoms else 12,
        walking_difficulty_0_3=payload.symptoms.walking_difficulty_0_3 if payload.symptoms else 1,
        stairs_difficulty_0_3=payload.symptoms.stairs_difficulty_0_3 if payload.symptoms else 1,
        squat_difficulty_0_3=payload.symptoms.squat_difficulty_0_3 if payload.symptoms else 1,
    )

    movement_ctx = MovementAssessmentData(
        stand_completed=payload.movement.stand_completed if payload.movement else True,
        stand_repetitions=payload.movement.stand_repetitions if payload.movement else 1,
        sit_to_stand_completed=payload.movement.sit_to_stand_completed if payload.movement else True,
        sit_to_stand_repetitions=payload.movement.sit_to_stand_repetitions if payload.movement else 5,
        sit_to_stand_knee_angle=payload.movement.sit_to_stand_knee_angle if payload.movement else None,
        squat_completed=payload.movement.squat_completed if payload.movement else True,
        squat_repetitions=payload.movement.squat_repetitions if payload.movement else 5,
        squat_knee_angle=payload.movement.squat_knee_angle if payload.movement else None,
        lunge_completed=payload.movement.lunge_completed if payload.movement else False,
        lunge_repetitions=payload.movement.lunge_repetitions if payload.movement else 0,
        knee_raise_completed=payload.movement.knee_raise_completed if payload.movement else True,
        knee_raise_repetitions=payload.movement.knee_raise_repetitions if payload.movement else 5,
        knee_flexion_deg=payload.movement.knee_flexion_deg if payload.movement else None,
        knee_deficit_deg=payload.movement.knee_deficit_deg if payload.movement else 10.0,
        gait_speed_mps=payload.movement.gait_speed_mps if payload.movement else 0.95,
        cadence_spm=payload.movement.cadence_spm if payload.movement else 98.0,
        limp_asymmetry_deg=payload.movement.limp_asymmetry_deg if payload.movement else 6.5,
        raw_movement_metrics=payload.movement.raw_movement_metrics if payload.movement else {},
    )

    diet_ctx = DietPreferences(
        diet_type=payload.diet.diet_type if payload.diet else "vegetarian",
        allergies=payload.diet.allergies if payload.diet else [],
        food_intolerances=payload.diet.food_intolerances if payload.diet else [],
        foods_to_avoid=payload.diet.foods_to_avoid if payload.diet else [],
        cultural_or_religious_notes=payload.diet.cultural_or_religious_notes if payload.diet else None,
        allergy_info_available=payload.diet.allergy_info_available if payload.diet else True,
    )

    patient_ctx = PatientAssessmentContext(
        patient_id=str(payload.patient_id or "DEMO-001"),
        name=payload.name or "Patient",
        age=payload.age,
        sex=payload.sex,
        bmi=payload.bmi,
        activity_level=payload.activity_level,
        occupation=payload.occupation or "General",
        assessment_type=payload.assessment_type or "functional_knee_assessment",
        is_demo=payload.is_demo,
        symptoms=symptom_ctx,
        movement=movement_ctx,
        diet=diet_ctx,
    )

    output = DEFAULT_GUIDANCE_ENGINE.generate_guidance(patient_ctx)
    return output.to_dict()


@app.post("/api/guidance/save")
def save_ai_guidance(
    payload: GuidanceSaveRequest,
    _: dict[str, object] = Depends(require_authenticated_user)
) -> dict[str, object]:
    """Persist generated guidance session with recommendations and safety notices."""
    conn = get_connection()
    if payload.patient_id:
        _patient_exists(conn, payload.patient_id)

    safety_notices_json = json.dumps([s.model_dump() for s in payload.safety_notices])
    patient_context_json = json.dumps(payload.patient_context) if payload.patient_context else None

    cursor = conn.execute(
        """
        INSERT INTO guidance_sessions (
            session_code, patient_id, screening_id, mode, status,
            overall_safety_status, data_provenance, clinical_summary,
            safety_notices_json, allergy_warning, patient_context_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload.session_code,
            payload.patient_id,
            payload.screening_id,
            "demo_simulation" if payload.is_demo else "clinical_rules_offline",
            "completed",
            payload.overall_safety_status,
            payload.data_provenance or ("DEMONSTRATION SYNTHETIC DATA" if payload.is_demo else "CLINICAL TRIAGE DATA"),
            payload.clinical_summary,
            safety_notices_json,
            payload.allergy_warning,
            patient_context_json,
        )
    )
    session_db_id = cursor.lastrowid

    # Insert Yoga recommendations
    for y in payload.yoga_recommendations:
        conn.execute(
            """
            INSERT INTO yoga_recommendations (
                session_id, exercise_id, name, sanskrit_name, category,
                why_selected, target_areas_json, difficulty, recommended_duration,
                recommended_repetitions, recommended_frequency, instructions_json,
                expected_purpose, precautions_json, stop_conditions_json,
                camera_tracking_available, tracking_metric, required_equipment_json,
                evidence_type, confidence_tier, personalization_factors_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session_db_id,
                y.exercise_id,
                y.name,
                y.sanskrit_name,
                y.category,
                y.why_selected,
                json.dumps(y.target_areas),
                y.difficulty,
                y.recommended_duration,
                y.recommended_repetitions,
                y.recommended_frequency,
                json.dumps(y.instructions),
                y.expected_purpose,
                json.dumps(y.precautions),
                json.dumps(y.stop_conditions),
                1 if y.camera_tracking_available else 0,
                y.tracking_metric,
                json.dumps(y.required_equipment),
                y.evidence_type,
                y.confidence_tier,
                json.dumps(y.personalization_factors),
            )
        )

    # Insert Nutrition recommendations
    for n in payload.nutrition_recommendations:
        conn.execute(
            """
            INSERT INTO nutrition_recommendations (
                session_id, item_name, category, recommendation_level,
                why_selected, alternative_option, target_nutrients_or_mechanism,
                precautions_or_notes, personalization_reason, evidence_type,
                confidence_tier, allergens_flagged_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session_db_id,
                n.item_name,
                n.category,
                n.recommendation_level,
                n.why_selected,
                n.alternative_option,
                n.target_nutrients_or_mechanism,
                n.precautions_or_notes,
                n.personalization_reason,
                n.evidence_type,
                n.confidence_tier,
                json.dumps(n.allergens_flagged),
            )
        )

    conn.commit()
    conn.close()
    return {
        "id": session_db_id,
        "session_code": payload.session_code,
        "status": "saved",
        "message": "AYURAGIES AI Guidance session saved successfully"
    }


@app.get("/api/guidance/history/{patient_id}")
def get_guidance_history(
    patient_id: int,
    _: dict[str, object] = Depends(require_authenticated_user)
) -> list[dict[str, object]]:
    """Retrieve all recommendation history sessions for a patient."""
    conn = get_connection()
    _patient_exists(conn, patient_id)
    rows = conn.execute(
        """
        SELECT g.*, COUNT(DISTINCT y.id) AS yoga_count, COUNT(DISTINCT n.id) AS nutrition_count
        FROM guidance_sessions g
        LEFT JOIN yoga_recommendations y ON y.session_id = g.id
        LEFT JOIN nutrition_recommendations n ON n.session_id = g.id
        WHERE g.patient_id = ?
        GROUP BY g.id
        ORDER BY g.id DESC
        """,
        (patient_id,)
    ).fetchall()
    conn.close()

    result = []
    for r in rows:
        d = dict(r)
        if d.get("safety_notices_json"):
            try:
                d["safety_notices"] = json.loads(d["safety_notices_json"])
            except Exception:
                d["safety_notices"] = []
        if d.get("patient_context_json"):
            try:
                d["patient_context"] = json.loads(d["patient_context_json"])
            except Exception:
                d["patient_context"] = None
        result.append(d)
    return result


@app.get("/api/guidance/session/{session_id}")
def get_guidance_session_details(
    session_id: str,
    _: dict[str, object] = Depends(require_authenticated_user)
) -> dict[str, object]:
    """Retrieve full guidance session with all yoga and nutrition recommendations."""
    conn = get_connection()
    if session_id.isdigit():
        session_row = conn.execute(
            "SELECT * FROM guidance_sessions WHERE id = ? OR session_code = ?",
            (int(session_id), session_id)
        ).fetchone()
    else:
        session_row = conn.execute(
            "SELECT * FROM guidance_sessions WHERE session_code = ?",
            (session_id,)
        ).fetchone()
    if not session_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Guidance session not found.")

    sess_dict = dict(session_row)
    db_id = sess_dict["id"]

    if sess_dict.get("safety_notices_json"):
        try:
            sess_dict["safety_notices"] = json.loads(sess_dict["safety_notices_json"])
        except Exception:
            sess_dict["safety_notices"] = []

    yoga_rows = conn.execute(
        "SELECT * FROM yoga_recommendations WHERE session_id = ? ORDER BY id ASC",
        (db_id,)
    ).fetchall()
    yoga_recs = []
    for yr in yoga_rows:
        yd = dict(yr)
        yd["target_areas"] = json.loads(yd["target_areas_json"]) if yd.get("target_areas_json") else []
        yd["instructions"] = json.loads(yd["instructions_json"]) if yd.get("instructions_json") else []
        yd["precautions"] = json.loads(yd["precautions_json"]) if yd.get("precautions_json") else []
        yd["stop_conditions"] = json.loads(yd["stop_conditions_json"]) if yd.get("stop_conditions_json") else []
        yd["required_equipment"] = json.loads(yd["required_equipment_json"]) if yd.get("required_equipment_json") else []
        yd["personalization_factors"] = json.loads(yd["personalization_factors_json"]) if yd.get("personalization_factors_json") else []
        yd["camera_tracking_available"] = bool(yd.get("camera_tracking_available"))
        yoga_recs.append(yd)

    nutrition_rows = conn.execute(
        "SELECT * FROM nutrition_recommendations WHERE session_id = ? ORDER BY id ASC",
        (db_id,)
    ).fetchall()
    nutrition_recs = []
    for nr in nutrition_rows:
        nd = dict(nr)
        nd["allergens_flagged"] = json.loads(nd["allergens_flagged_json"]) if nd.get("allergens_flagged_json") else []
        nutrition_recs.append(nd)

    conn.close()
    sess_dict["yoga_recommendations"] = yoga_recs
    sess_dict["nutrition_recommendations"] = nutrition_recs
    return sess_dict


@app.get("/api/guidance/yoga-library")
def list_yoga_library(
    category: str | None = Query(default=None),
    _: dict[str, object] = Depends(require_authenticated_user)
) -> list[dict[str, object]]:
    """List all approved exercises in the yoga & movement library with metadata."""
    exercises = EXERCISE_LIBRARY
    if category:
        cat_clean = category.strip().lower()
        exercises = [ex for ex in exercises if ex.category.value.lower() == cat_clean]

    return [
        {
            "id": ex.id,
            "name": ex.name,
            "sanskrit_name": ex.sanskrit_name,
            "category": ex.category.value,
            "target_areas": ex.target_areas,
            "difficulty": ex.difficulty,
            "recommended_duration": ex.recommended_duration,
            "recommended_repetitions": ex.recommended_repetitions,
            "recommended_frequency": ex.recommended_frequency,
            "instructions": ex.instructions,
            "expected_purpose": ex.expected_purpose,
            "precautions": ex.precautions,
            "stop_conditions": ex.stop_conditions,
            "indications": ex.indications,
            "contraindications": ex.contraindications,
            "camera_tracking_available": ex.camera_tracking_available,
            "tracking_metric": ex.tracking_metric,
            "required_equipment": ex.required_equipment,
            "evidence_type": ex.evidence_type.value,
        }
        for ex in exercises
    ]


@app.get("/api/guidance/nutrition-library")
def list_nutrition_library(
    category: str | None = Query(default=None),
    _: dict[str, object] = Depends(require_authenticated_user)
) -> list[dict[str, object]]:
    """List all items in the approved nutrition guidance library."""
    items = NUTRITION_LIBRARY
    if category:
        cat_clean = category.strip().upper()
        items = [it for it in items if it.category.value == cat_clean]

    return [
        {
            "id": it.id,
            "name": it.name,
            "category": it.category.value,
            "default_level": it.default_level,
            "general_why": it.general_why,
            "target_nutrients_or_mechanism": it.target_nutrients_or_mechanism,
            "default_alternative": it.default_alternative,
            "common_allergens": it.common_allergens,
            "dietary_tags": it.dietary_tags,
            "evidence_type": it.evidence_type.value,
        }
        for it in items
    ]


@app.get("/api/guidance/demo-context")
def get_demo_guidance_context(
    _: dict[str, object] = Depends(require_authenticated_user)
) -> dict[str, object]:
    """Provide standard calibrated DEMO-001 assessment context for interactive demonstrations."""
    return {
        "patient_id": "DEMO-001",
        "name": "DEMO-001: Rajesh Khurana (Benchmark Profile)",
        "age": 58,
        "sex": "male",
        "bmi": 27.4,
        "activity_level": "low",
        "occupation": "Desk Work & Community Volunteer",
        "assessment_type": "functional_knee_assessment",
        "is_demo": True,
        "movement": {
            "stand_completed": True,
            "stand_repetitions": 1,
            "sit_to_stand_completed": True,
            "sit_to_stand_repetitions": 5,
            "sit_to_stand_knee_angle": 91.4,
            "squat_completed": True,
            "squat_repetitions": 4,
            "squat_knee_angle": 94.2,
            "lunge_completed": False,
            "lunge_repetitions": 0,
            "knee_raise_completed": True,
            "knee_raise_repetitions": 5,
            "knee_flexion_deg": 108.5,
            "knee_deficit_deg": 14.6,
            "gait_speed_mps": 0.84,
            "cadence_spm": 92.0,
            "limp_asymmetry_deg": 7.2,
            "raw_movement_metrics": {
                "antalgic_lag": 14.6,
                "stride_length_m": 1.12,
                "stance_time_percent": 64.2
            }
        },
        "symptoms": {
            "pain_level_0_10": 4,
            "morning_stiffness_mins": 35,
            "has_swelling": False,
            "has_instability": False,
            "previous_knee_injury": False,
            "symptom_duration_weeks": 16,
            "walking_difficulty_0_3": 1,
            "stairs_difficulty_0_3": 2,
            "squat_difficulty_0_3": 2
        },
        "diet": {
            "diet_type": "vegetarian",
            "allergies": ["peanut"],
            "food_intolerances": [],
            "foods_to_avoid": ["deep_fried_snacks"],
            "cultural_or_religious_notes": "Vegetarian Indian diet, preference for traditional lentils, millets, and dairy",
            "allergy_info_available": True
        }
    }


@app.post("/api/hardware/connect")
def connect_device(payload: DeviceConfig, user: dict[str, object] = Depends(require_role("admin"))) -> dict[str, object]:
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO devices (name, device_type, ip, status, config_json, last_connected) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
        (payload.name.strip(), payload.device_type, payload.ip, payload.status, payload.config_json)
    )
    conn.commit()
    device_id = cursor.lastrowid
    conn.close()
    return {"id": device_id, "status": "connected"}


@app.get("/api/hardware/devices")
def list_devices(user: dict[str, object] = Depends(require_role("admin", "officer"))) -> list[dict[str, object]]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT id, name, device_type, ip, status, config_json, last_connected FROM devices ORDER BY id DESC"
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def _clean_esp_host(host_or_ip: str) -> tuple[str, int]:
    raw = host_or_ip.strip().replace("http://", "").replace("https://", "").rstrip("/")
    if ":" in raw:
        parts = raw.split(":", 1)
        try:
            return parts[0], int(parts[1])
        except ValueError:
            return parts[0], 80
    return raw, 80


@app.get("/api/hardware/ping")
def ping_hardware(ip: str = Query(...)) -> dict[str, object]:
    host, port = _clean_esp_host(ip)
    t0 = time.time()
    try:
        url = f"http://{host}:{port}/status" if port != 80 else f"http://{host}/status"
        with urllib.request.urlopen(url, timeout=1.2) as response:
            latency = round((time.time() - t0) * 1000)
            return {"reachable": True, "latency_ms": latency, "status_code": response.status, "target": host}
    except Exception as e:
        return {"reachable": False, "target": host, "error": "Device did not respond"}


@app.get("/api/esp/ping")
def esp_ping(ip: str = Query(...)) -> dict[str, object]:
    return ping_hardware(ip)


@app.get("/api/esp/status")
async def esp_status(ip: str = Query(...)) -> dict[str, object]:
    host, port = _clean_esp_host(ip)
    base_url = f"http://{host}"
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{base_url}/status")
            if resp.status_code == 200:
                try:
                    return resp.json()
                except Exception:
                    return {"raw": resp.text, "status": "ok"}
            raise HTTPException(status_code=resp.status_code, detail=f"ESP returned status {resp.status_code}")
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Cannot reach ESP32-CAM at {host}: {exc}") from exc


@app.get("/api/esp/control")
async def esp_control(
    ip: str = Query(...),
    var: str = Query(...),
    val: int = Query(...)
) -> dict[str, object]:
    host, port = _clean_esp_host(ip)
    base_url = f"http://{host}"
    try:
        async with httpx.AsyncClient(timeout=3.5) as client:
            if var == "flash":
                # Try dedicated /flash first, fallback to /control?var=flash
                try:
                    resp = await client.get(f"{base_url}/flash?val={val}")
                    if resp.status_code == 200:
                        return {"status": "ok", "variable": var, "val": val, "response": resp.json() if resp.headers.get("content-type", "").startswith("application/json") else resp.text}
                except Exception:
                    pass
            resp = await client.get(f"{base_url}/control?var={var}&val={val}")
            return {"status": "ok" if resp.status_code == 200 else "error", "status_code": resp.status_code, "variable": var, "val": val}
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Failed to send command to ESP32-CAM at {host}: {exc}") from exc


@app.get("/api/esp/frame")
async def esp_frame(ip: str = Query(...)):
    host, port = _clean_esp_host(ip)
    capture_url = f"http://{host}/capture"
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(capture_url)
            if resp.status_code == 200:
                return Response(content=resp.content, media_type="image/jpeg", headers={"Cache-Control": "no-cache, no-store, must-revalidate"})
            raise HTTPException(status_code=resp.status_code, detail="Failed to capture frame from ESP32-CAM")
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch frame from ESP32-CAM at {host}: {exc}") from exc


@app.get("/api/esp/stream")
async def esp_stream(ip: str = Query(...)):
    host, port = _clean_esp_host(ip)
    stream_url = f"http://{host}:{port}/stream" if port != 80 else f"http://{host}:81/stream"

    async def stream_generator():
        client = httpx.AsyncClient(timeout=None)
        try:
            async with client.stream("GET", stream_url) as response:
                async for chunk in response.aiter_bytes():
                    yield chunk
        except Exception:
            pass
        finally:
            await client.aclose()

    return StreamingResponse(
        stream_generator(),
        media_type="multipart/x-mixed-replace; boundary=123456789000000000000987654321",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "Access-Control-Allow-Origin": "*"
        }
    )


class EspWebSocketHub:
    """Relays real-time binary JPEG frames and control commands between ESP32-CAM and web clients."""

    def __init__(self):
        self.camera_ws: WebSocket | None = None
        self.viewers: set[WebSocket] = set()
        self.last_frame: bytes | None = None
        self.fps_count: int = 0
        self.fps_timer: float = time.time()
        self.current_fps: float = 0.0
        self.camera_status: dict = {"flash": 0, "resolution": "QVGA"}

    async def register_camera(self, ws: WebSocket):
        await ws.accept()
        self.camera_ws = ws
        await self.broadcast_viewer_event({"type": "camera_status", "online": True, "fps": self.current_fps})

    def unregister_camera(self, ws: WebSocket):
        if self.camera_ws == ws:
            self.camera_ws = None
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.create_task(self.broadcast_viewer_event({"type": "camera_status", "online": False}))
            except Exception:
                pass

    async def register_viewer(self, ws: WebSocket):
        await ws.accept()
        self.viewers.add(ws)
        # Send initial status
        try:
            await ws.send_json({
                "type": "camera_status",
                "online": self.camera_ws is not None,
                "fps": self.current_fps,
                **self.camera_status
            })
            if self.last_frame:
                await ws.send_bytes(self.last_frame)
        except Exception:
            pass

    def unregister_viewer(self, ws: WebSocket):
        self.viewers.discard(ws)

    async def broadcast_frame(self, frame_bytes: bytes):
        self.last_frame = frame_bytes
        self.fps_count += 1
        now = time.time()
        if now - self.fps_timer >= 1.0:
            self.current_fps = round(self.fps_count / (now - self.fps_timer), 1)
            self.fps_count = 0
            self.fps_timer = now

        dead = []
        for v in list(self.viewers):
            try:
                await v.send_bytes(frame_bytes)
            except Exception:
                dead.append(v)
        for d in dead:
            self.viewers.discard(d)

    async def broadcast_viewer_event(self, event: dict):
        dead = []
        for v in list(self.viewers):
            try:
                await v.send_json(event)
            except Exception:
                dead.append(v)
        for d in dead:
            self.viewers.discard(d)

    async def send_command_to_camera(self, cmd: dict):
        if self.camera_ws:
            try:
                await self.camera_ws.send_json(cmd)
                return True
            except Exception:
                self.camera_ws = None
        return False


esp_hub = EspWebSocketHub()


@app.websocket("/api/esp/ws/camera")
async def esp_camera_ws(websocket: WebSocket):
    """ESP32-CAM connects here to push live binary JPEG frames."""
    await esp_hub.register_camera(websocket)
    try:
        while True:
            message = await websocket.receive()
            if "bytes" in message and message["bytes"]:
                await esp_hub.broadcast_frame(message["bytes"])
            elif "text" in message and message["text"]:
                try:
                    data = json.loads(message["text"])
                    if "flash" in data:
                        esp_hub.camera_status["flash"] = data["flash"]
                    await esp_hub.broadcast_viewer_event({"type": "camera_telemetry", **data})
                except Exception:
                    pass
    except (WebSocketDisconnect, Exception):
        esp_hub.unregister_camera(websocket)


@app.websocket("/api/esp/ws/viewer")
async def esp_viewer_ws(websocket: WebSocket):
    """Frontend web browser connects here to stream video and send hardware commands."""
    await esp_hub.register_viewer(websocket)
    try:
        while True:
            text = await websocket.receive_text()
            try:
                cmd = json.loads(text)
                await esp_hub.send_command_to_camera(cmd)
            except Exception:
                pass
    except (WebSocketDisconnect, Exception):
        esp_hub.unregister_viewer(websocket)


@app.get("/api/esp/ws/status")
def esp_ws_status() -> dict[str, object]:
    """HTTP status of cloud WebSocket relay."""
    return {
        "camera_online": esp_hub.camera_ws is not None,
        "viewers_count": len(esp_hub.viewers),
        "fps": esp_hub.current_fps,
        "has_last_frame": esp_hub.last_frame is not None,
        "status": esp_hub.camera_status
    }


@app.get("/api/esp/live.jpg")
async def esp_live_frame():
    """Returns the most recent JPEG frame captured by ESP32-CAM."""
    if not esp_hub.last_frame:
        raise HTTPException(status_code=404, detail="No camera frame received yet.")
    return Response(content=esp_hub.last_frame, media_type="image/jpeg", headers={"Cache-Control": "no-cache, no-store, must-revalidate"})


@app.get("/api/esp/stream.mjpg")
async def esp_mjpeg_stream():
    """Multipart MJPEG stream of live ESP32-CAM frames for direct <img> rendering."""
    async def frame_generator():
        last_sent = None
        while True:
            if esp_hub.last_frame and esp_hub.last_frame != last_sent:
                last_sent = esp_hub.last_frame
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n"
                    b"Content-Length: " + str(len(last_sent)).encode() + b"\r\n\r\n" +
                    last_sent +
                    b"\r\n"
                )
            await asyncio.sleep(0.04)  # ~25 FPS check cycle

    return StreamingResponse(
        frame_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
    )
