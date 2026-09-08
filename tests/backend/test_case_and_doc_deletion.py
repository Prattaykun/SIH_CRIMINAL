"""Tests for case deletion (DELETE /cases/{id}) and document removal (DELETE /cases/{id}/documents/{doc_id})."""

import pytest


class TestCaseAndDocDeletion:
    """Tests for document removal and case deletion."""

    def test_list_and_delete_document_success(self, admin_client):
        """Verify listing documents and deleting a specific document."""
        # 1. Create a case
        resp = admin_client.post("/api/v1/cases", json={
            "case_number": "CASE-DEL-DOC-001",
            "title": "Document Deletion Test Case",
        })
        assert resp.status_code == 201
        case_id = resp.json()["id"]

        # 2. Ingest two documents
        doc1 = admin_client.post(f"/api/v1/cases/{case_id}/documents/text", json={
            "title": "Doc 1 Report",
            "content": "Aditya Malhotra was seen with Sneha Kapoor.",
            "file_type": "TEXT_REPORT",
        }).json()
        doc2 = admin_client.post(f"/api/v1/cases/{case_id}/documents/text", json={
            "title": "Doc 2 Report",
            "content": "Rajesh Kumar called Priya Mehta.",
            "file_type": "TEXT_REPORT",
        }).json()

        # 3. List documents using case UUID
        list_resp = admin_client.get(f"/api/v1/cases/{case_id}/documents")
        assert list_resp.status_code == 200
        docs = list_resp.json()["documents"]
        assert len(docs) == 2

        # 4. List documents using case number
        list_by_num = admin_client.get("/api/v1/cases/CASE-DEL-DOC-001/documents")
        assert list_by_num.status_code == 200
        assert list_by_num.json()["total"] == 2

        # 5. Delete doc 1
        del_resp = admin_client.delete(f"/api/v1/cases/{case_id}/documents/{doc1['id']}")
        assert del_resp.status_code == 200
        assert del_resp.json()["status"] == "success"

        # 6. Verify doc 1 is gone, doc 2 remains
        list_after = admin_client.get(f"/api/v1/cases/{case_id}/documents")
        assert list_after.status_code == 200
        remaining = list_after.json()["documents"]
        assert len(remaining) == 1
        assert remaining[0]["id"] == doc2["id"]

    def test_delete_case_cascade_success(self, admin_client):
        """Verify deleting a case cascades and removes all documents and case record."""
        # 1. Create case
        resp = admin_client.post("/api/v1/cases", json={
            "case_number": "CASE-DEL-FULL-001",
            "title": "Full Case Deletion Test",
        })
        case_id = resp.json()["id"]

        # 2. Ingest document into case
        admin_client.post(f"/api/v1/cases/{case_id}/documents/text", json={
            "title": "Surveillance Log",
            "content": "Vehicle HR-26-XY-9999 was parked near Bank.",
            "file_type": "TEXT_REPORT",
        })

        # 3. Delete case
        del_resp = admin_client.delete(f"/api/v1/cases/{case_id}")
        assert del_resp.status_code == 200
        assert del_resp.json()["status"] == "success"

        # 4. Verify case is gone (404)
        get_resp = admin_client.get(f"/api/v1/cases/{case_id}")
        assert get_resp.status_code == 404

        # 5. Verify documents query returns 404 for deleted case
        doc_resp = admin_client.get(f"/api/v1/cases/{case_id}/documents")
        assert doc_resp.status_code == 404
