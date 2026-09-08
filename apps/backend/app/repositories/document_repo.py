"""Document repository — database access for Document operations."""

import hashlib
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from apps.backend.app.models.document import Document
from apps.backend.app.models.audit_log import AuditLog
from apps.backend.app.schemas.document import DocumentCreate


class DocumentRepository:
    """Encapsulates all Document database operations."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(
        self, case_id: str, data: DocumentCreate, uploaded_by: str | None = None
    ) -> Document:
        """Create a document record linked to a case and log the action."""
        file_hash: str | None = None
        if data.raw_content:
            file_hash = hashlib.sha256(data.raw_content.encode("utf-8")).hexdigest()

        doc = Document(
            case_id=case_id,
            file_name=data.file_name,
            file_type=data.file_type.value,
            raw_content=data.raw_content,
            file_hash=file_hash,
            status="UPLOADED",
            uploaded_by=uploaded_by,
        )
        self.db.add(doc)
        self.db.flush()

        audit = AuditLog(
            action="UPLOAD_DOCUMENT",
            target_type="DOCUMENT",
            target_id=doc.id,
            new_state=f'{{"file_name": "{doc.file_name}", "case_id": "{case_id}"}}',
        )
        self.db.add(audit)
        self.db.commit()
        self.db.refresh(doc)
        return doc

    def get_by_id(self, document_id: str) -> Document | None:
        """Retrieve a single document by its UUID."""
        return (
            self.db.query(Document).filter(Document.id == document_id).first()
        )

    def list_by_case(
        self, case_id: str, skip: int = 0, limit: int = 50
    ) -> tuple[list[Document], int]:
        """List documents belonging to a case with pagination."""
        query = self.db.query(Document).filter(Document.case_id == case_id)
        total = query.count()
        docs = (
            query.order_by(Document.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return docs, total

    def delete(self, document_id: str, deleted_by: str | None = None) -> bool:
        """Delete a document, its physical file, and associated extracted entities."""
        doc = self.get_by_id(document_id)
        if doc is None:
            return False

        doc_id = doc.id
        case_id = doc.case_id
        file_name = doc.file_name

        # 1. Unlink file on disk
        if doc.file_path:
            try:
                from pathlib import Path
                p = Path(doc.file_path)
                if p.exists():
                    p.unlink()
            except Exception:
                pass

        # 2. Delete extraction runs and entities for this document
        from apps.backend.app.models.extraction_run import ExtractionRun
        from apps.backend.app.models.entity import ExtractedEntity
        from apps.backend.app.models.relationship import ExtractedRelationship

        entities = self.db.query(ExtractedEntity).filter(ExtractedEntity.document_id == doc_id).all()
        ent_ids = [e.id for e in entities]
        if ent_ids:
            self.db.query(ExtractedRelationship).filter(
                (ExtractedRelationship.source_entity_id.in_(ent_ids)) |
                (ExtractedRelationship.target_entity_id.in_(ent_ids))
            ).delete(synchronize_session=False)

        self.db.query(ExtractedEntity).filter(ExtractedEntity.document_id == doc_id).delete(synchronize_session=False)
        self.db.query(ExtractionRun).filter(ExtractionRun.document_id == doc_id).delete(synchronize_session=False)

        # 3. Audit log
        audit = AuditLog(
            action="DELETE_DOCUMENT",
            target_type="DOCUMENT",
            target_id=doc_id,
            user_id=deleted_by,
            previous_state=f'{{"file_name": "{file_name}", "case_id": "{case_id}"}}',
        )
        self.db.add(audit)

        # 4. Delete document record
        self.db.delete(doc)
        self.db.commit()
        return True
