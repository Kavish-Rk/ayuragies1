"""Tests verifying 100% offline self-containment with zero external network requests."""
import pytest
from oa_screening.guidance.models import PatientAssessmentContext, SymptomContext
from oa_screening.guidance.recommendation_engine import AyuragiesGuidanceEngine


def test_offline_execution_no_network(monkeypatch):
    """Ensure the engine executes and produces full output without external network/sockets."""
    # Disallow network socket creation
    import socket

    def guard(*args, **kwargs):
        raise RuntimeError("External network connection attempted in offline test!")

    monkeypatch.setattr(socket, "socket", guard)

    engine = AyuragiesGuidanceEngine()
    ctx = PatientAssessmentContext(
        patient_id="OFFLINE-001",
        age=60,
        symptoms=SymptomContext(pain_level_0_10=5, morning_stiffness_mins=30),
    )
    output = engine.generate_guidance(ctx)

    assert output.offline_generated is True
    assert len(output.yoga_recommendations) >= 4
    assert len(output.nutrition_recommendations) >= 5
    assert output.clinical_summary
