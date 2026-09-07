from apps.backend.app.worker import celery_app
from apps.backend.app.db.session import SessionLocal
from apps.backend.app.models.document import Document
from apps.backend.app.services.document_parser import extract_text_from_file
from apps.backend.app.extraction.service import DocumentExtractionService

@celery_app.task(bind=True, max_retries=2)
def async_extract_document(self, document_id: str):
    db = SessionLocal()
    doc = None
    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return
            
        doc.status = "PROCESSING"
        db.commit()
        
        # 1. Parse text from storage
        raw_text = extract_text_from_file(doc.file_path, doc.mime_type)
        doc.raw_content = raw_text
        db.commit()
        
        # 2. Run NLP Extraction pipeline
        service = DocumentExtractionService(db)
        service.process_document(document_id, extract_relationships=True)
        
        doc.status = "PROCESSED"
        db.commit()
    except Exception as exc:
        db.rollback()
        if doc:
            doc.status = "FAILED"
            doc.error_message = str(exc)
            db.commit()
        raise self.retry(exc=exc, countdown=5)
    finally:
        db.close()
