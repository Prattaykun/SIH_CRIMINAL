"""Tests for written report ingestion endpoint: POST /api/v1/cases/{case_id}/documents/text."""

import pytest


class TestWrittenReportIngestion:
    """Tests for POST /api/v1/cases/{case_id}/documents/text."""

    def _create_case(self, admin_client) -> str:
        """Helper — create a synthetic case and return its ID."""
        resp = admin_client.post("/api/v1/cases", json={
            "case_number": "CASE-TEXT-001",
            "title": "Written Report Test Case",
        })
        return resp.json()["id"]

    def test_ingest_written_report_success(self, admin_client):
        """Investigator writes a report directly into a case."""
        case_id = self._create_case(admin_client)

        payload = {
            "title": "FIR Synthetic Report 101",
            "content": "Aditya Malhotra was observed meeting Sneha Kapoor at Connaught Place on 15 January 2024.",
            "file_type": "TEXT_REPORT",
        }
        response = admin_client.post(f"/api/v1/cases/{case_id}/documents/text", json=payload)
        assert response.status_code == 201

        data = response.json()
        assert data["file_name"] == "FIR_Synthetic_Report_101.txt"
        assert data["file_type"] == "TEXT_REPORT"
        assert data["case_id"] == case_id
        assert data["file_hash"] is not None
        assert data["status"] in ["PROCESSING", "PROCESSED"]

    def test_ingest_written_report_extraction_e2e(self, investigator_client, db_session):
        """End-to-end extraction when report is written directly."""
        from apps.backend.app.worker import celery_app
        celery_app.conf.update(task_always_eager=True)

        case_id = "16d5cee3-d1c4-4ff8-b9a2-bfd31932453f"
        from apps.backend.app.models.case import Case
        from apps.backend.app.models.case_access import CaseAccess, CaseAccessLevel
        from apps.backend.app.models.user import User

        if not db_session.query(Case).filter_by(id=case_id).first():
            db_session.add(Case(id=case_id, case_number="CASE-SYN-TEST-E2E", title="E2E Case", description="Test", status="OPEN"))
            test_user = db_session.query(User).filter_by(email="test_investigator@example.com").first()
            if test_user:
                db_session.add(CaseAccess(case_id=case_id, user_id=test_user.id, access_level=CaseAccessLevel.MANAGE))
            db_session.commit()

        payload = {
            "title": "Field Surveillance Incident",
            "content": "Aditya Malhotra visited Apex Traders in Saket driving a Hyundai Creta on 10 March 2024.",
            "file_type": "TEXT_REPORT",
        }
        response = investigator_client.post(f"/api/v1/cases/{case_id}/documents/text", json=payload)
        assert response.status_code == 201
        doc_id = response.json()["id"]

        # Check extraction status endpoint
        status_res = investigator_client.get(f"/api/v1/documents/{doc_id}/extraction-status")
        assert status_res.status_code == 200
        assert status_res.json()["status"] == "PROCESSED"
        assert status_res.json()["entity_count"] > 0

    def test_ingest_written_report_case_not_found(self, admin_client):
        """Ingest report into non-existent case returns 404."""
        payload = {
            "title": "Orphan Report",
            "content": "Some report content.",
        }
        response = admin_client.post("/api/v1/cases/non-existent-case-id/documents/text", json=payload)
        assert response.status_code == 404

    def test_ingest_written_report_empty_content(self, admin_client):
        """Empty report content returns validation error."""
        resp = admin_client.post("/api/v1/cases", json={
            "case_number": "CASE-EMPTY-TEST",
            "title": "Empty Test",
        })
        case_id = resp.json()["id"]

        payload = {
            "title": "Empty Report",
            "content": "   ",
        }
        response = admin_client.post(f"/api/v1/cases/{case_id}/documents/text", json=payload)
        assert response.status_code == 400

    def test_ingest_written_report_deduplication(self, admin_client):
        """Identical report content returns existing document record."""
        resp = admin_client.post("/api/v1/cases", json={
            "case_number": "CASE-DEDUP-001",
            "title": "Dedup Test",
        })
        case_id = resp.json()["id"]

        payload = {
            "title": "Unique Report 1",
            "content": "Exact duplicate content to test idempotency and provenance deduplication.",
        }
        res1 = admin_client.post(f"/api/v1/cases/{case_id}/documents/text", json=payload)
        assert res1.status_code == 201

        payload["title"] = "Unique Report 2"
        res2 = admin_client.post(f"/api/v1/cases/{case_id}/documents/text", json=payload)
        assert res2.status_code == 201
        assert res1.json()["id"] == res2.json()["id"]
