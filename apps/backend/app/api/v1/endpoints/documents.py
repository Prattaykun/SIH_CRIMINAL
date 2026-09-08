"""Document API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, BackgroundTasks
import hashlib
import shutil
from pathlib import Path
from sqlalchemy.orm import Session

from apps.backend.app.db.session import get_db
from apps.backend.app.repositories.case_repo import CaseRepository
from apps.backend.app.repositories.document_repo import DocumentRepository
from apps.backend.app.schemas.document import (
    DocumentCreate,
    DocumentListResponse,
    DocumentResponse,
    ReportTextCreate,
)
from apps.backend.app.api.deps import get_current_active_user, require_role, require_case_permission, Permission
from apps.backend.app.models.user import User, Role
from apps.backend.app.models.case_membership import CaseMembership, CaseMembership
from apps.backend.app.services.audit import log_action, DOCUMENT_UPLOADED

router = APIRouter()


@router.post(
    "",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a document to a case",
)
def create_document(
    case_id: str,
    data: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([Role.INVESTIGATOR, Role.ADMINISTRATOR])),
    access: CaseMembership = Depends(require_case_permission(Permission.VIEW_CASE)),
) -> DocumentResponse:
    """Create a new document record for a case."""
    case_repo = CaseRepository(db)
    case = case_repo.get_by_id(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found.")

    doc_repo = DocumentRepository(db)
    try:
        doc = doc_repo.create(case_id=case_id, data=data)
        log_action(
            db=db,
            action=DOCUMENT_UPLOADED,
            target_type="DOCUMENT",
            target_id=doc.id,
            user_id=current_user.id,
        )
        db.commit()
        return DocumentResponse.model_validate(doc)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to upload document.") from exc


def _dispatch_extraction(doc_id: str, background_tasks: BackgroundTasks) -> None:
    """Dispatch document extraction via Celery if available, or fallback to BackgroundTasks."""
    from apps.backend.app.tasks.extraction import async_extract_document
    try:
        import redis
        from apps.backend.app.core.config import settings
        r = redis.Redis.from_url(settings.REDIS_URL, socket_connect_timeout=1)
        r.ping()
        async_extract_document.delay(doc_id)
    except Exception:
        def run_sync_extraction(target_id: str):
            from apps.backend.app.db.session import SessionLocal, get_db
            from apps.backend.app.main import app
            from apps.backend.app.models.document import Document
            from apps.backend.app.services.document_parser import extract_text_from_file
            from apps.backend.app.extraction.service import DocumentExtractionService
            
            if get_db in app.dependency_overrides:
                gen = app.dependency_overrides[get_db]()
                session = next(gen)
            else:
                session = SessionLocal()
                
            try:
                doc_obj = session.query(Document).filter(Document.id == target_id).first()
                if not doc_obj:
                    return
                doc_obj.status = "PROCESSING"
                session.commit()

                if not doc_obj.raw_content or len(doc_obj.raw_content.strip()) == 0:
                    if doc_obj.file_path:
                        raw_text = extract_text_from_file(doc_obj.file_path, doc_obj.mime_type)
                        doc_obj.raw_content = raw_text
                        session.commit()

                service = DocumentExtractionService(session)
                res = service.process_document(target_id, extract_relationships=True)
                if res.get("status") == "FAILED":
                    doc_obj.status = "FAILED"
                    doc_obj.error_message = res.get("error", "Extraction failed")
                else:
                    doc_obj.status = "PROCESSED"
                session.commit()
            except Exception as exc:
                session.rollback()
                if doc_obj:
                    doc_obj.status = "FAILED"
                    doc_obj.error_message = str(exc)
                    session.commit()
            finally:
                session.close()
        
        background_tasks.add_task(run_sync_extraction, doc_id)


@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a physical document file and extract content",
)
def upload_document(
    case_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([Role.INVESTIGATOR, Role.ADMINISTRATOR])),
    access: CaseMembership = Depends(require_case_permission(Permission.VIEW_CASE)),
) -> DocumentResponse:
    """Upload a physical document and dispatch extraction."""
    from apps.backend.app.models.document import Document
    from apps.backend.app.core.config import settings
    
    case_repo = CaseRepository(db)
    case = case_repo.get_by_id(case_id) or case_repo.get_by_case_number(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found.")
    
    # Use the resolved case.id for directories and database links
    real_case_id = str(case.id)

    # File storage
    upload_dir = Path(settings.UPLOAD_DIR) / real_case_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    file_bytes = file.file.read()
    if not file_bytes or len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    sha256 = hashlib.sha256(file_bytes).hexdigest()
    
    # Check for deduplication
    existing_doc = db.query(Document).filter(Document.case_id == real_case_id, Document.file_hash == sha256).first()
    if existing_doc:
        # Return existing document if we've already uploaded this exact file
        return DocumentResponse.model_validate(existing_doc)

    safe_filename = file.filename.replace(" ", "_") if file.filename else "unknown"
    file_path = upload_dir / f"{sha256}_{safe_filename}"
    
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Extract text immediately as a safeguard
    try:
        raw_text = file_bytes.decode("utf-8")
    except Exception:
        try:
            from apps.backend.app.services.document_parser import extract_text_from_file
            raw_text = extract_text_from_file(str(file_path), file.content_type)
        except Exception:
            raw_text = ""
        
    doc = Document(
        case_id=real_case_id,
        file_name=file.filename or "unknown",
        file_type="TEXT_REPORT",  # simplify for now
        file_hash=sha256,
        file_path=str(file_path),
        mime_type=file.content_type,
        raw_content=raw_text,
        status="PROCESSING",  # Set to PROCESSING instead of UPLOADED so the UI sees it working
        uploaded_by=current_user.id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    log_action(
        db=db,
        action=DOCUMENT_UPLOADED,
        target_type="DOCUMENT",
        target_id=doc.id,
        user_id=current_user.id,
    )
    
    _dispatch_extraction(doc.id, background_tasks)
    
    return DocumentResponse.model_validate(doc)


@router.post(
    "/text",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest a directly written report and extract content",
)
def ingest_written_report(
    case_id: str,
    data: ReportTextCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([Role.INVESTIGATOR, Role.ADMINISTRATOR])),
    access: CaseMembership = Depends(require_case_permission(Permission.VIEW_CASE)),
) -> DocumentResponse:
    """Ingest directly written report text, compute hash, persist, and trigger NLP extraction."""
    from apps.backend.app.models.document import Document
    from apps.backend.app.core.config import settings

    case_repo = CaseRepository(db)
    case = case_repo.get_by_id(case_id) or case_repo.get_by_case_number(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found.")

    real_case_id = str(case.id)

    raw_text = data.content.strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="Report content cannot be empty.")

    file_bytes = raw_text.encode("utf-8")
    sha256 = hashlib.sha256(file_bytes).hexdigest()

    existing_doc = (
        db.query(Document)
        .filter(Document.case_id == real_case_id, Document.file_hash == sha256)
        .first()
    )
    if existing_doc:
        return DocumentResponse.model_validate(existing_doc)

    upload_dir = Path(settings.UPLOAD_DIR) / real_case_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    safe_title = data.title.strip().replace(" ", "_")
    if not safe_title.endswith(".txt"):
        safe_title = f"{safe_title}.txt"
    file_path = upload_dir / f"{sha256}_{safe_title}"

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    doc = Document(
        case_id=real_case_id,
        file_name=safe_title,
        file_type=data.file_type.value,
        file_hash=sha256,
        file_path=str(file_path),
        mime_type="text/plain",
        raw_content=raw_text,
        status="PROCESSING",
        uploaded_by=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    log_action(
        db=db,
        action=DOCUMENT_UPLOADED,
        target_type="DOCUMENT",
        target_id=doc.id,
        user_id=current_user.id,
    )

    _dispatch_extraction(doc.id, background_tasks)

    return DocumentResponse.model_validate(doc)



@router.get(
    "",
    response_model=DocumentListResponse,
    summary="List documents for a case",
)
def list_documents(
    case_id: str,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    access: CaseMembership = Depends(require_case_permission(Permission.VIEW_CASE)),
) -> DocumentListResponse:
    """List all documents belonging to a specific case."""
    case_repo = CaseRepository(db)
    case = case_repo.get_by_id(case_id) or case_repo.get_by_case_number(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found.")

    doc_repo = DocumentRepository(db)
    docs, total = doc_repo.list_by_case(case_id=str(case.id), skip=skip, limit=limit)
    return DocumentListResponse(
        total=total,
        documents=[DocumentResponse.model_validate(d) for d in docs],
    )


@router.delete(
    "/{document_id}",
    summary="Remove an ingested document/report from a case",
)
def delete_document(
    case_id: str,
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([Role.INVESTIGATOR, Role.ADMINISTRATOR])),
    access: CaseMembership = Depends(require_case_permission(Permission.VIEW_CASE)),
):
    """Remove a document, physical storage, and extracted entities from a case."""
    case_repo = CaseRepository(db)
    case = case_repo.get_by_id(case_id) or case_repo.get_by_case_number(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found.")

    doc_repo = DocumentRepository(db)
    doc = doc_repo.get_by_id(document_id)
    if doc is None or str(doc.case_id) != str(case.id):
        raise HTTPException(status_code=404, detail="Document not found for this case.")

    file_name = doc.file_name
    success = doc_repo.delete(document_id, deleted_by=current_user.id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete document.")

    return {"status": "success", "message": f"Document '{file_name}' removed successfully."}
