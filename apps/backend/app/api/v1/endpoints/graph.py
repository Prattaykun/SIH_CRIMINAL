"""Graph API endpoints for retrieving network data and health."""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from apps.backend.app.graph.service import GraphService, GraphServiceUnavailableError
from apps.backend.app.graph.schema import (
    GraphResponse,
    EntityNeighbourResponse,
    RelationshipEvidenceResponse,
    GraphHealthResponse,
)

router = APIRouter()


def get_graph_service() -> GraphService:
    """Dependency provider for GraphService."""
    return GraphService()


@router.get(
    "/graph/health",
    response_model=GraphHealthResponse,
    summary="Check Neo4j graph database health",
)
def check_graph_health(service: GraphService = Depends(get_graph_service)) -> GraphHealthResponse:
    """Returns the availability and status of the Neo4j graph database."""
    # This must work even if offline
    return service.health_check()


from datetime import datetime, timezone
from sqlalchemy.orm import Session
from apps.backend.app.db.session import get_db
from apps.backend.app.models.case import Case
from apps.backend.app.models.entity import ExtractedEntity
from apps.backend.app.models.relationship import ExtractedRelationship
from apps.backend.app.graph.schema import GraphNode, GraphEdge

@router.get(
    "/cases/{case_id}/graph",
    response_model=GraphResponse,
    summary="Retrieve the graph for a case",
)
def get_case_graph(
    case_id: str,
    limit: int = Query(default=500, ge=1, le=2000, description="Max nodes/edges to retrieve"),
    service: GraphService = Depends(get_graph_service),
    db: Session = Depends(get_db),
) -> GraphResponse:
    """Retrieve the full graph (nodes and relationships) associated with a case."""
    # Resolve case_id to UUID and human-readable case_number
    case = db.query(Case).filter((Case.id == case_id) | (Case.case_number == case_id)).first()
    resolved_id = str(case.id) if case else case_id
    effective_case_id = getattr(case, "case_number", case_id) or case_id

    # Try Neo4j first if available and populated
    try:
        subgraph = service.get_case_subgraph(resolved_id, limit=limit)
        if subgraph and subgraph.nodes:
            return subgraph
    except (GraphServiceUnavailableError, Exception):
        pass

    # Fallback to PostgreSQL relational data (either Neo4j is offline or has no data synced yet)
    entities = db.query(ExtractedEntity).filter(
        ExtractedEntity.case_id == resolved_id, 
        ExtractedEntity.verification_status != "REJECTED"
    ).all()
    relationships = db.query(ExtractedRelationship).filter(
        ExtractedRelationship.case_id == resolved_id, 
        ExtractedRelationship.verification_status != "REJECTED"
    ).all()
    
    # Normalize entity types for frontend graph schema and colors
    # (e.g. PHONE_NUMBER -> PHONE, ACCOUNT -> BANK_ACCOUNT)
    type_norm = {
        "PHONE_NUMBER": "PHONE",
        "ACCOUNT": "BANK_ACCOUNT",
        "BANK": "BANK_ACCOUNT",
    }

    nodes = []
    entity_id_set = set()
    for e in entities:
        norm_type = type_norm.get(e.entity_type.upper(), e.entity_type.upper())
        nodes.append(GraphNode(
            id=str(e.id),
            label=norm_type.title(),
            entity_type=norm_type,
            properties={
                "name": e.canonical_name,
                "canonical_name": e.canonical_name,
                "original_value": e.original_value or e.canonical_name,
                "status": e.verification_status,
                "confidence": float(e.confidence_score) if e.confidence_score is not None else 0.95,
            },
            case_id=effective_case_id,
            source_document_ids=[str(e.document_id)] if e.document_id else [],
        ))
        entity_id_set.add(str(e.id))

    edges = []
    for r in relationships:
        src = str(r.source_entity_id)
        tgt = str(r.target_entity_id)
        if src in entity_id_set and tgt in entity_id_set:
            is_verified = r.verification_status in ["ACCEPTED", "CORRECTED"]
            edges.append(GraphEdge(
                id=str(r.id),
                source_id=src,
                target_id=tgt,
                relationship_type=r.relation_type,
                properties={
                    "status": r.verification_status,
                    "confidence": float(r.confidence_score) if r.confidence_score is not None else 0.9,
                },
                confidence=float(r.confidence_score) if r.confidence_score is not None else 0.9,
                verified=is_verified,
                source_document_id=str(r.document_id) if r.document_id else None,
            ))
    
    return GraphResponse(
        case_id=effective_case_id,
        nodes=nodes,
        edges=edges,
        generated_at=datetime.now(timezone.utc)
    )


@router.get(
    "/entities/{entity_id}/neighbours",
    response_model=EntityNeighbourResponse,
    summary="Retrieve an entity and its neighbours",
)
def get_entity_neighbours(
    entity_id: str,
    label: str = Query(..., description="The label of the entity (e.g., Person, Phone)"),
    limit: int = Query(default=100, ge=1, le=500),
    service: GraphService = Depends(get_graph_service),
) -> EntityNeighbourResponse:
    """Retrieve an entity and its immediate (1-hop) neighbours. Development only."""
    try:
        response = service.get_entity_neighbours(label, entity_id, limit=limit)
        if not response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Entity {entity_id} with label {label} not found."
            )
        return response
    except GraphServiceUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc)
        )
    except ValueError as exc:
        # e.g., Invalid label
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving entity neighbours."
        )


@router.get(
    "/relationships/{relationship_id}/evidence",
    response_model=RelationshipEvidenceResponse,
    summary="Retrieve relationship evidence details",
)
def get_relationship_evidence(
    relationship_id: str,
    service: GraphService = Depends(get_graph_service),
) -> RelationshipEvidenceResponse:
    """Retrieve evidence text and metadata for a specific relationship. Development only."""
    try:
        response = service.get_relationship_evidence(relationship_id)
        if not response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Relationship {relationship_id} not found."
            )
        return response
    except GraphServiceUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving relationship evidence."
        )
