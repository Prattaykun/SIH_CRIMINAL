"""
SIH-26189: FastAPI demo endpoint for NER inference.

Loads the trained spaCy model from ./models/ner_v1/model-best at startup
and exposes a single POST /ner endpoint.

Usage:
  pip install fastapi uvicorn
  uvicorn app_ner_demo:app --reload --port 8001

Then test with:
  curl -X POST http://127.0.0.1:8001/ner \
       -H "Content-Type: application/json" \
       -d "{\"text\": \"Inspector Ramesh Kumar of Pune Police arrested Vikram Shah.\"}"
"""

import os
from contextlib import asynccontextmanager
from typing import Any

import spacy
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
NER_MODEL_PATH = os.path.join(BASE_DIR, "models", "ner_v6", "model-best")
RF_MODEL_PATH = os.path.join(BASE_DIR, "models", "random_forest_context_proxy_v3.pkl")

# ---------------------------------------------------------------------------
# App state — holds the loaded model
# ---------------------------------------------------------------------------
_state: dict[str, Any] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the spaCy model once at startup; release on shutdown."""
    if not os.path.exists(NER_MODEL_PATH):
        raise RuntimeError(
            f"spaCy model not found at '{NER_MODEL_PATH}'. "
            "Train it first: python -m spacy train config.cfg --output ./models/ner_v6"
        )
    print(f"Loading NER model from {NER_MODEL_PATH} ...")
    _state["nlp"] = spacy.load(NER_MODEL_PATH)
    print("Model loaded. Ready to serve requests.")
    yield
    _state.clear()


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="SIH-26189 NER Demo",
    description=(
        "Named Entity Recognition endpoint for Indian cybercrime / legal documents. "
        "Labels: PERSON, ORGANIZATION, ADDRESS, LOCATION, ROLE. "
        "This is a prototype demo — not for production use."
    ),
    version="0.1.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------
class NERRequest(BaseModel):
    text: str

    model_config = {"json_schema_extra": {"examples": [
        {"text": "Inspector Ramesh Kumar of Pune Police arrested Vikram Shah near MG Road, Pune."}
    ]}}


class EntityResult(BaseModel):
    start: int
    end: int
    label: str
    text: str


class NERResponse(BaseModel):
    entities: list[EntityResult]
    entity_count: int


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/")
def read_root() -> dict[str, str]:
    """Root endpoint detailing public routes."""
    return {
        "service": "sih-criminal-ner",
        "health": "/health",
        "ner": "/ner",
        "api_version": "v1"
    }

def get_health_data() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "sih-criminal-ner",
        "api_version": "v1",
        "ner_model_version": "ner_v6",
        "rf_status": "experimental_proxy_not_for_enforcement",
        "release": "v6-murder-integration"
    }

@app.get("/health")
def health() -> dict[str, str]:
    """Simple liveness probe."""
    return get_health_data()

@app.get("/api/v1/health")
def health_v1() -> dict[str, str]:
    return get_health_data()

@app.post("/ner", response_model=NERResponse, summary="Extract named entities from text")
def run_ner(request: NERRequest) -> NERResponse:
    """
    Extract named entities (PERSON, ORGANIZATION, ADDRESS, LOCATION, ROLE)
    from the provided text using the trained spaCy NER model.
    """
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="'text' field must not be empty.")

    nlp = _state.get("nlp")
    if nlp is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")

    doc = nlp(text)
    entities = [
        EntityResult(
            start=ent.start_char,
            end=ent.end_char,
            label=ent.label_,
            text=ent.text,
        )
        for ent in doc.ents
    ]

    return NERResponse(entities=entities, entity_count=len(entities))

@app.post("/api/v1/ner", response_model=NERResponse, summary="Extract named entities from text")
def run_ner_v1(request: NERRequest) -> NERResponse:
    return run_ner(request)
