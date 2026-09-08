"""Case repository — database access for Case operations."""

from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from apps.backend.app.models.case import Case
from apps.backend.app.models.audit_log import AuditLog
from apps.backend.app.schemas.case import CaseCreate, CaseUpdate


class CaseRepository:
    """Encapsulates all Case database operations."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, data: CaseCreate, created_by: str | None = None) -> Case:
        """Create a new case and log the action."""
        case = Case(
            case_number=data.case_number,
            title=data.title,
            description=data.description,
            priority=data.priority.value,
            status="ACTIVE",
            created_by=created_by,
        )
        self.db.add(case)
        self.db.flush()  # Populate case.id before audit log

        audit = AuditLog(
            action="CREATE_CASE",
            target_type="CASE",
            target_id=case.id,
            new_state=f'{{"case_number": "{case.case_number}", "title": "{case.title}"}}',
        )
        self.db.add(audit)
        self.db.commit()
        self.db.refresh(case)
        return case

    def get_by_id(self, case_id: str) -> Case | None:
        """Retrieve a single case by its UUID."""
        import uuid
        try:
            val = uuid.UUID(case_id)
            return self.db.query(Case).filter(Case.id == str(val)).first()
        except ValueError:
            return None

    def get_by_case_number(self, case_number: str) -> Case | None:
        """Retrieve a single case by its unique case number."""
        return (
            self.db.query(Case).filter(Case.case_number == case_number).first()
        )

    def list_all(
        self, skip: int = 0, limit: int = 50, status: str | None = None
    ) -> tuple[list[Case], int]:
        """List cases with optional status filter and pagination."""
        query = self.db.query(Case)
        if status:
            query = query.filter(Case.status == status)
        total = query.count()
        cases = (
            query.order_by(Case.created_at.desc()).offset(skip).limit(limit).all()
        )
        return cases, total

    def update(self, case_id: str, data: CaseUpdate) -> Case | None:
        """Partially update a case and log the change."""
        case = self.get_by_id(case_id)
        if case is None:
            return None

        previous_state_parts: list[str] = []
        new_state_parts: list[str] = []
        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            old_val = getattr(case, field)
            new_val = value.value if hasattr(value, "value") else value
            previous_state_parts.append(f'"{field}": "{old_val}"')
            new_state_parts.append(f'"{field}": "{new_val}"')
            setattr(case, field, new_val)

        case.updated_at = datetime.now(timezone.utc)
        self.db.flush()

        if previous_state_parts:
            audit = AuditLog(
                action="UPDATE_CASE",
                target_type="CASE",
                target_id=case.id,
                previous_state="{" + ", ".join(previous_state_parts) + "}",
                new_state="{" + ", ".join(new_state_parts) + "}",
            )
            self.db.add(audit)

        self.db.commit()
        self.db.refresh(case)
        return case

    def delete(self, case_id: str, deleted_by: str | None = None) -> bool:
        """Delete a case and all associated cascade records across SQL and graph."""
        case = self.get_by_id(case_id) or self.get_by_case_number(case_id)
        if case is None:
            return False

        cid = str(case.id)
        case_num = case.case_number
        title = case.title

        # 1. Clean up physical files on disk from documents
        from apps.backend.app.models.document import Document
        from pathlib import Path
        docs = self.db.query(Document).filter(Document.case_id == cid).all()
        for doc in docs:
            if doc.file_path:
                try:
                    p = Path(doc.file_path)
                    if p.exists():
                        p.unlink()
                except Exception:
                    pass

        # 2. Delete dependent tables
        from apps.backend.app.models.case_access import CaseAccess
        from apps.backend.app.models.ml import CaseFeatureVector, ModelPrediction, SimilarityResult
        from apps.backend.app.models.analytics import EntityGraphFeature
        from apps.backend.app.models.alert import Alert
        from apps.backend.app.models.processing_job import ProcessingJob
        from apps.backend.app.models.extraction_run import ExtractionRun
        from apps.backend.app.models.relationship import ExtractedRelationship
        from apps.backend.app.models.entity import ExtractedEntity

        self.db.query(CaseAccess).filter(CaseAccess.case_id == cid).delete(synchronize_session=False)
        self.db.query(SimilarityResult).filter(
            (SimilarityResult.current_case_id == cid) | (SimilarityResult.similar_case_id == cid)
        ).delete(synchronize_session=False)
        self.db.query(CaseFeatureVector).filter(CaseFeatureVector.case_id == cid).delete(synchronize_session=False)
        self.db.query(ModelPrediction).filter(ModelPrediction.case_id == cid).delete(synchronize_session=False)
        self.db.query(EntityGraphFeature).filter(EntityGraphFeature.case_id == cid).delete(synchronize_session=False)
        self.db.query(Alert).filter(Alert.case_id == cid).delete(synchronize_session=False)
        self.db.query(ProcessingJob).filter(ProcessingJob.case_id == cid).delete(synchronize_session=False)
        self.db.query(ExtractedRelationship).filter(ExtractedRelationship.case_id == cid).delete(synchronize_session=False)
        self.db.query(ExtractedEntity).filter(ExtractedEntity.case_id == cid).delete(synchronize_session=False)
        self.db.query(ExtractionRun).filter(ExtractionRun.case_id == cid).delete(synchronize_session=False)
        self.db.query(Document).filter(Document.case_id == cid).delete(synchronize_session=False)

        # 3. Clean up Neo4j graph nodes if available
        try:
            from apps.backend.app.db.neo4j import get_neo4j_session
            with get_neo4j_session() as session:
                session.run("MATCH (n {case_id: $case_id}) DETACH DELETE n", case_id=cid)
                session.run("MATCH (c:Case {id: $case_id}) DETACH DELETE c", case_id=cid)
        except Exception:
            pass

        # 4. Audit log
        audit = AuditLog(
            action="DELETE_CASE",
            target_type="CASE",
            target_id=cid,
            user_id=deleted_by,
            previous_state=f'{{"case_number": "{case_num}", "title": "{title}"}}',
        )
        self.db.add(audit)

        # 5. Delete case row
        self.db.delete(case)
        self.db.commit()
        return True
