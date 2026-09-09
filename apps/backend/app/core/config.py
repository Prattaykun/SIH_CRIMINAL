from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        # Prefer apps/backend/.env when running uvicorn from the repo root;
        # also accept a local .env when the process cwd is apps/backend.
        env_file=(".env", "apps/backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # General App Settings
    PROJECT_NAME: str = "SIH-26189 Criminal Network Analysis"
    API_V1_STR: str = "/api/v1"
    APP_NAME: str = "SIH 26189 Criminal Network Analysis System"
    APP_ENV: str = Field(default="development", description="Application environment")
    API_PREFIX: str = Field(default="/api/v1", description="Global API version prefix")
    API_HOST: str = Field(default="0.0.0.0", description="Host to bind the API server")
    API_PORT: int = Field(default=8000, description="Port to bind the API server")

    # Static JWT Secret Key (Prevents session invalidation on restart)
    SECRET_KEY: str = Field(
        default="sih-26189-permanent-deterministic-secret-key-2026",
        description="Application secret key",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=60 * 24 * 7,  # 7-day token persistence for multi-device login
        description="Access token expiration in minutes",
    )

    # Deterministic Seed Password for demo/evaluator accounts
    DEFAULT_DEMO_PASSWORD: str = Field(
        default="DemoPassword123!",
        description="Deterministic seed password for demo/evaluator accounts",
    )

    # Cross-Origin Configuration allowing local network IP access
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://sih-criminal.onrender.com",
        "https://sih-criminal-frontend.onrender.com",
    ]

    # Password Policy
    BCRYPT_ROUNDS: int = 12
    MIN_PASSWORD_LENGTH: int = 8
    MAX_BCRYPT_PASSWORD_BYTES: int = 72

    # PostgreSQL connection — synchronous driver for the prototype.
    # Override with a real PostgreSQL URL in production:
    #   DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/db
    DATABASE_URL: str = Field(
        default="sqlite:///./sih_dev.db",
        description="SQLAlchemy database connection string",
    )

    # Redis configuration for Celery
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis broker URI for Celery tasks",
    )

    # File Upload configuration
    UPLOAD_DIR: str = Field(
        default="data/uploads",
        description="Local directory for storing uploaded files",
    )

    # Neo4j Graph Database (future milestone)
    NEO4J_URI: str = Field(
        default="bolt://localhost:7687",
        description="Neo4j Bolt connection URI",
    )
    NEO4J_USER: str = Field(
        default="neo4j",
        description="Neo4j username",
    )
    NEO4J_PASSWORD: str = Field(
        default="neo4j_dev_password",
        description="Neo4j password",
    )
    NEO4J_DATABASE: str = Field(
        default="neo4j",
        description="Neo4j database name (e.g., 'neo4j' or 'system')",
    )

    # CORS & Security
    FRONTEND_URL: str = Field(
        default="http://localhost:3000",
        description="Allowed CORS origin for frontend application",
    )

    # Development reviewer identity.
    # Used as the reviewer_id for human-review actions when no authentication
    # system is active.  Must be replaced by a real authenticated identity in
    # any production or staging deployment.  Set via the DEV_REVIEWER_ID
    # environment variable.  A None value means the variable was not
    # configured; callers must handle this explicitly.
    DEV_REVIEWER_ID: Optional[str] = Field(
        default=None,
        description=(
            "Reviewer identity used in development mode when authentication "
            "is not available.  Configure via DEV_REVIEWER_ID env var.  "
            "Never hardcode a fallback value in application logic."
        ),
    )

    # Extraction
    EXTRACTION_PROVIDER: str = Field(
        default="MOCK",
        description=(
            "Active NER provider. Allow-listed values: MOCK, SPACY_BASELINE, SPACY_CUSTOM. "
            "SPACY_CUSTOM requires SPACY_CUSTOM_MODEL_ID to be set."
        ),
    )

    # Model artifact storage — server-side only, never exposed to the frontend.
    # Set to a directory on a local volume with restricted permissions.
    MODEL_ARTIFACT_ROOT: str = Field(
        default="data/training/models",
        description=(
            "Trusted root directory for model artifacts. All model paths are resolved "
            "relative to this directory. Never expose this value in API responses or logs."
        ),
    )

    # ID of the custom spaCy model to load when EXTRACTION_PROVIDER=SPACY_CUSTOM.
    # Must be a registry model_id, not a filesystem path.
    SPACY_CUSTOM_MODEL_ID: Optional[str] = Field(
        default=None,
        description=(
            "Registry model_id for the custom spaCy model. "
            "This is an opaque identifier, not a filesystem path."
        ),
    )

    # NER training gate. Must be explicitly set to true to allow CLI training.
    NER_TRAINING_ENABLED: bool = Field(
        default=False,
        description=(
            "Set to true to allow running the spaCy NER training CLI. "
            "Training via API endpoints is always disabled regardless of this flag."
        ),
    )

    # Subprocess timeout for spaCy training in seconds.
    NER_TRAINING_TIMEOUT_SECONDS: int = Field(
        default=3600,
        description="Maximum wall-clock seconds for a spaCy training subprocess.",
    )


settings = Settings()
