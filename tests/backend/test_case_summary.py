"""Tests for dynamic case intelligence summary endpoint: GET /api/v1/cases/{case_id}/summary."""

import pytest
from apps.backend.app.models.case import Case
from apps.backend.app.models.entity import ExtractedEntity
from apps.backend.app.models.relationship import ExtractedRelationship


class TestCaseIntelligenceSummary:
    """Tests for GET /api/v1/cases/{case_id}/summary."""

    def test_new_case_summary_is_empty(self, admin_client):
        """A new case without ingested entities returns node_count=0 and no leaked data."""
        resp = admin_client.post("/api/v1/cases", json={
            "case_number": "CASE-EMPTY-SUMM-001",
            "title": "Clean Empty Case",
            "priority": "MEDIUM",
        })
        assert resp.status_code == 201
        case_id = resp.json()["id"]

        summary_res = admin_client.get(f"/api/v1/cases/{case_id}/summary")
        assert summary_res.status_code == 200
        data = summary_res.json()

        # Must not contain previous benchmark data
        assert data["topology_preview"]["node_count"] == 0
        assert data["topology_preview"]["edge_count"] == 0
        assert data["primary_subject"] is None
        assert data["timeline_events"] == []
        assert data["linked_assets"] == []
        assert data["anomaly_index"]["score"] == 0

    def test_case_summary_with_own_entities(self, admin_client, db_session):
        """A case with its own entities displays its own data, not previous case data."""
        resp = admin_client.post("/api/v1/cases", json={
            "case_number": "CASE-CUSTOM-SUMM-002",
            "title": "Custom Investigation",
            "priority": "HIGH",
        })
        assert resp.status_code == 201
        case_id = resp.json()["id"]

        # Insert custom entities specific to this case
        person = ExtractedEntity(
            case_id=case_id,
            entity_type="PERSON",
            original_value="Vikram Rathore",
            canonical_name="Vikram Rathore",
            confidence_score=0.92,
            verification_status="UNREVIEWED",
        )
        phone = ExtractedEntity(
            case_id=case_id,
            entity_type="PHONE_NUMBER",
            original_value="+91-99999-88888",
            canonical_name="+91-99999-88888",
            confidence_score=0.88,
            verification_status="UNREVIEWED",
        )
        db_session.add_all([person, phone])
        db_session.flush()

        rel = ExtractedRelationship(
            case_id=case_id,
            source_entity_id=person.id,
            target_entity_id=phone.id,
            relation_type="COMMUNICATED_WITH",
            source_text_snippet="Vikram Rathore was contacted at +91-99999-88888",
            confidence_score=0.90,
            verification_status="UNREVIEWED",
        )
        db_session.add(rel)
        db_session.commit()

        summary_res = admin_client.get(f"/api/v1/cases/{case_id}/summary")
        assert summary_res.status_code == 200
        data = summary_res.json()

        assert data["topology_preview"]["node_count"] == 2
        assert data["topology_preview"]["edge_count"] == 1
        assert data["primary_subject"] is not None
        assert data["primary_subject"]["name"] == "Vikram Rathore"
        assert "Aditya Malhotra" not in data["primary_subject"]["name"]
        assert data["primary_subject"]["phone"] == "+91-99999-88888"
        assert len(data["timeline_events"]) == 1
        assert data["timeline_events"][0]["title"] == "Communicated With"
