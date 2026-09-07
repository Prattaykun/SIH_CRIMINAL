import pytest

def test_document_upload_and_extraction(investigator_client, db_session):
    from apps.backend.app.worker import celery_app
    celery_app.conf.update(task_always_eager=True)
    
    file_content = b"Aditya Malhotra visited Apex Traders in Saket on 10 March 2024."
    
    # We need to make sure the case exists first (e.g. CASE-2024-SYN-001 or standard test case)
    # The client/db_session fixture should create it, or we use doc-1's case: 16d5cee3-d1c4-4ff8-b9a2-bfd31932453f
    case_id = "16d5cee3-d1c4-4ff8-b9a2-bfd31932453f"
    from apps.backend.app.models.case import Case
    from apps.backend.app.models.case_access import CaseAccess, CaseAccessLevel
    if not db_session.query(Case).filter_by(id=case_id).first():
        db_session.add(Case(id=case_id, case_number="CASE-TEST", title="Test", description="Test", status="OPEN"))
        
        # Get the investigator user from DB.
        from apps.backend.app.models.user import User
        test_user = db_session.query(User).filter_by(email="test_investigator@example.com").first()
        if test_user:
            db_session.add(CaseAccess(case_id=case_id, user_id=test_user.id, access_level=CaseAccessLevel.MANAGE))
        db_session.commit()
    
    response = investigator_client.post(
        f"/api/v1/cases/{case_id}/documents/upload",
        files={"file": ("report.txt", file_content, "text/plain")}
    )
    
    assert response.status_code == 201
    doc_id = response.json()["id"]
    
    # Poll status endpoint
    status_res = investigator_client.get(f"/api/v1/documents/{doc_id}/extraction-status")
    
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "PROCESSED"
    assert status_res.json()["entity_count"] > 0
