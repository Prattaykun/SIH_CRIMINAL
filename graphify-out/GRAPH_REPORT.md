# Graph Report - .  (2026-09-09)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1461 nodes · 3386 edges · 111 communities (82 shown, 29 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 415 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b29add9e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103

## God Nodes (most connected - your core abstractions)
1. `ExtractedEntity` - 55 edges
2. `Base` - 52 edges
3. `ExtractedRelationship` - 52 edges
4. `Case` - 47 edges
5. `TimestampMixin` - 45 edges
6. `UUIDPrimaryKeyMixin` - 45 edges
7. `Document` - 42 edges
8. `CaseRepository` - 39 edges
9. `CaseMembership` - 35 edges
10. `ExtractedEntityCandidate` - 33 edges

## Surprising Connections (you probably didn't know these)
- `About` --uses--> `Base`  [INFERRED]
  scripts/seed_demo_data.py → apps/backend/app/db/base.py
- `DirectBcryptContext` --uses--> `Base`  [INFERRED]
  scripts/seed_demo_data.py → apps/backend/app/db/base.py
- `About` --uses--> `Alert`  [INFERRED]
  scripts/seed_demo_data.py → apps/backend/app/models/alert.py
- `DirectBcryptContext` --uses--> `Alert`  [INFERRED]
  scripts/seed_demo_data.py → apps/backend/app/models/alert.py
- `reset_demo_data()` --indirect_call--> `AuditLog`  [INFERRED]
  scripts/reset_demo_data.py → apps/backend/app/models/audit_log.py

## Import Cycles
- None detected.

## Communities (111 total, 29 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (43): Create a provider backed by a custom trained model from the registry., ExtractionModel, Metadata registry for locally trained NER models (e.g. custom spaCy).      Sec, compute_directory_checksum(), _constant_time_compare(), _is_excluded(), load_trusted_spacy_model(), ModelLoadError (+35 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (29): Alembic migrations environment — configured for SIH 26189 models., Run migrations in 'offline' mode., run_migrations_offline(), run_migrations_online(), Base, SQLAlchemy declarative base and common model mixins., Base class for all SQLAlchemy ORM models., Mixin that adds created_at and updated_at columns to a model. (+21 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (38): api_compare_providers(), extract_and_review_preview(), extract_case_documents(), extract_document(), get_case_extraction_candidates(), get_evaluation_metadata(), get_extraction_health(), get_extraction_model() (+30 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (46): check_graph_health(), get_case_graph(), get_entity_neighbours(), get_graph_service(), get_relationship_evidence(), EntityNeighbourResponse, GraphHealthResponse, GraphResponse (+38 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (31): get_model_metadata(), get_predictions(), ml_health(), Session, API Endpoints for Machine Learning Models., Retrieves metadata about the models used for this case., Health check for ML module., Runs baseline ML models for a case. (+23 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (30): api_evaluate_extraction(), Evaluate specified providers against the synthetic test set., EntityEvaluationMetrics, evaluate_entities(), Any, BaseModel, Entity Extraction Evaluation Metrics., Evaluate predicted entities against gold standard (exact span matching). (+22 more)

### Community 6 - "Community 6"
Cohesion: 0.17
Nodes (25): BaseDetector, BridgeBetweenCommunitiesDetector, CrossCaseConnectorDetector, HighConnectivityDetector, HistoricalSimilarityDetector, GraphResponse, PatternAlert, RapidTransactionChainDetector (+17 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (18): CaseSimilarityCardProps, ModelMetadataPanelProps, Props, Props, AnalyticsRunResponse, CaseListResponse, DocumentListResponse, EntityNeighbourResponse (+10 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (14): ABC, Deterministic mock extraction provider., ExtractorProvider, HuggingFaceExtractor, LLMExtractor, Extraction provider interfaces., Extract entities and relationships from document text., Placeholder for future LLM-based extraction provider. (+6 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (26): CaseGraphPage(), edgeTypes, layoutElements(), nodeTypes, ViewMode, CaseHubNode, ClusterGroupNode, clusterIconMap (+18 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (28): login_access_token(), LoginResponse, Any, BaseModel, Depends, Session, User, Authentication endpoints. (+20 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (20): Configuration settings and thresholds for graph analytics., Graph pattern detectors (Explainable Rules)., Analytics engine coordinator to switch between GDS and NetworkX fallback., Python (NetworkX) graph feature extraction fallback., AnalyticsRunResponse, CaseGraphAnalytics, PatternAlert, BaseModel (+12 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (27): ArtifactSecurityError, _compute_sha256(), _get_trusted_root(), load_model_artifact(), any, Exception, Path, Session (+19 more)

### Community 13 - "Community 13"
Cohesion: 0.11
Nodes (21): extract_relationships(), get_extraction_candidates(), get_extraction_status(), Session, RelationshipExtractionService, Any, Push ACCEPTED/CORRECTED entities and relationships to Neo4j., ExtractedEntity (+13 more)

### Community 14 - "Community 14"
Cohesion: 0.19
Nodes (22): create_splits(), main(), validate_annotations(), write_reports(), generate(), Synthetic data generator for SIH 26189 Prototype., _bank_acct(), _date() (+14 more)

### Community 15 - "Community 15"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 16 - "Community 16"
Cohesion: 0.11
Nodes (13): GraphRepository, Any, Session, Graph database repository for executing Cypher queries safely., Merge a relationship between two nodes., Retrieve all nodes and intra-case relationships for a given case., Retrieve an entity and its immediate 1-hop neighbours., Retrieve a specific relationship's metadata by its ID. (+5 more)

### Community 17 - "Community 17"
Cohesion: 0.18
Nodes (21): DashboardOverview(), AuthContext, AuthContextType, AuthProvider(), getMemoryToken(), Role, setMemoryToken(), User (+13 more)

### Community 18 - "Community 18"
Cohesion: 0.10
Nodes (19): GraphAnalyticsEngine, CaseGraphAnalytics, GraphResponse, Coordinates feature extraction using either Neo4j GDS or NetworkX fallback., Safely detect if Neo4j Graph Data Science is available., Extract graph features. Falls back to NetworkX if GDS is unavailable., AnalyticsEngine, AnalyticsStatus (+11 more)

### Community 19 - "Community 19"
Cohesion: 0.22
Nodes (16): extract_called(), extract_connected_to(), extract_involved_in(), extract_mentioned_in(), extract_occurred_at(), extract_owns(), extract_transferred_to(), extract_used() (+8 more)

### Community 20 - "Community 20"
Cohesion: 0.08
Nodes (25): devDependencies, eslint, jsdom, tailwindcss, @tailwindcss/postcss, @testing-library/jest-dom, @testing-library/react, @types/node (+17 more)

### Community 21 - "Community 21"
Cohesion: 0.14
Nodes (16): EntityFeaturesPanel(), EntityFeaturesPanelProps, EntityPanel(), EntityPanelProps, FilterState, GraphFilters(), GraphFiltersProps, NetworkGraph() (+8 more)

### Community 22 - "Community 22"
Cohesion: 0.19
Nodes (17): get_current_active_user(), Permission, Ensure the user is active., Dependency to check if the user has specific permission in a case., require_case_permission(), JSONResponse, _structured_error(), Document API endpoints. (+9 more)

### Community 23 - "Community 23"
Cohesion: 0.17
Nodes (19): compute_similarity(), get_similarity(), Session, API Endpoints for Case Similarity., Computes similarity for a case and returns top-k similar cases., Retrieves already computed similarity results., CaseFeatureVector, Machine Learning SQLAlchemy models. (+11 more)

### Community 24 - "Community 24"
Cohesion: 0.17
Nodes (17): BaseIngestionRecord, CallRecord, CaseRecord, CaseReportRecord, LocationRecord, PersonRecord, PhoneRecord, BaseModel (+9 more)

### Community 25 - "Community 25"
Cohesion: 0.09
Nodes (23): dependencies, @base-ui/react, class-variance-authority, clsx, cytoscape, dagre, elkjs, lucide-react (+15 more)

### Community 26 - "Community 26"
Cohesion: 0.16
Nodes (15): get_password_hash(), Generate a bcrypt password hash., CaseAccess, CaseAccessLevel, str, Case Access control SQLAlchemy model., Assignment mapping a user to a case with a specific access level., str (+7 more)

### Community 27 - "Community 27"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 28 - "Community 28"
Cohesion: 0.14
Nodes (14): Any, Session, Entity resolution service for extraction candidates., Look for existing entities in the database matching the normalized value and typ, resolve_entity_candidate(), compute_entity_confidence(), Service orchestrating extraction, human review, and Neo4j sync., Calculates realistic dynamic confidence scores based on pattern precision and co (+6 more)

### Community 29 - "Community 29"
Cohesion: 0.15
Nodes (20): create_document(), delete_document(), _dispatch_extraction(), ingest_written_report(), list_documents(), BackgroundTasks, Session, UploadFile (+12 more)

### Community 30 - "Community 30"
Cohesion: 0.14
Nodes (17): Case repository — database access for Case operations., Create a new case and log the action., CaseCreate, CaseListResponse, CasePriority, CaseResponse, CaseStatus, CaseUpdate (+9 more)

### Community 31 - "Community 31"
Cohesion: 0.19
Nodes (16): CaseReportContext, BaseModel, Schemas for report generation., ReportAlertItem, ReportEntityItem, ReportExportMetadata, ReportRelationshipItem, Any (+8 more)

### Community 32 - "Community 32"
Cohesion: 0.19
Nodes (9): IngestionResult, IngestionService, BaseModel, Session, Attempts to sync to graph, returning True if successful., Run all synthetic files., Idempotent get or create for Postgres., ProcessingJob (+1 more)

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (18): create_case(), delete_case(), get_case(), get_case_intelligence_summary(), list_cases(), Session, User, List cases. Administrators see all, others see assigned. (+10 more)

### Community 34 - "Community 34"
Cohesion: 0.14
Nodes (17): get_ingestion_service(), get_ingestion_summary(), get_processing_status(), ingest_synthetic(), process_document(), BackgroundTasks, Session, UploadFile (+9 more)

### Community 35 - "Community 35"
Cohesion: 0.14
Nodes (12): get_feature_vector(), Retrieves the latest feature vector for a case, extracting on demand if needed., ExtractionRun, Tracks versioned, idempotent extraction runs per document and provider., CaseRepository, Session, Delete a case and all associated cascade records across SQL and graph., Encapsulates all Case database operations. (+4 more)

### Community 36 - "Community 36"
Cohesion: 0.16
Nodes (13): CaseTask, CollaborationPage(), TeamMember, geist, inter, metadata, RootLayout(), LoginPage() (+5 more)

### Community 37 - "Community 37"
Cohesion: 0.17
Nodes (15): ADMINISTRATOR, get_current_user(), get_optional_user(), Depends, Session, User, Dependency to check if the user has one of the allowed roles., Dependency for requiring administrator privileges. (+7 more)

### Community 38 - "Community 38"
Cohesion: 0.15
Nodes (5): Structured status code for the load result., Raise RuntimeError with a safe status message if unavailable., Internal constructor — use factory methods., Create a provider backed by the pre-installed baseline spaCy model.          N, SpacyNERProvider

### Community 41 - "Community 41"
Cohesion: 0.19
Nodes (8): EvidenceTable(), EntityCandidate, Props, VerificationStatus, Props, ExtractionStatusProps, Props, RelationshipCandidate

### Community 42 - "Community 42"
Cohesion: 0.45
Nodes (13): str, Case Task SQLAlchemy model., TaskPriority, TaskStatus, TaskType, Config, BaseModel, TaskAssign (+5 more)

### Community 43 - "Community 43"
Cohesion: 0.24
Nodes (16): assign_task(), complete_task(), create_task(), get_case_tasks(), Session, User, reopen_task(), update_task() (+8 more)

### Community 44 - "Community 44"
Cohesion: 0.17
Nodes (15): normalize_account_id(), normalize_amount(), normalize_date(), normalize_name(), normalize_phone(), normalize_string(), normalize_vehicle_id(), Any (+7 more)

### Community 45 - "Community 45"
Cohesion: 0.21
Nodes (10): Button(), buttonVariants, Card(), CardContent(), CardDescription(), CardFooter(), CardHeader(), CardTitle() (+2 more)

### Community 46 - "Community 46"
Cohesion: 0.15
Nodes (15): get_analytics_health(), get_case_features(), get_case_patterns(), AnalyticsRunResponse, Any, Session, Retrieve pattern alerts for a case., Retrieve all entity graph features for a case. (+7 more)

### Community 47 - "Community 47"
Cohesion: 0.30
Nodes (13): add_team_member(), get_case_team(), Session, User, remove_team_member(), transfer_case_lead(), update_team_member(), Config (+5 more)

### Community 48 - "Community 48"
Cohesion: 0.15
Nodes (6): MockExtractor, Deterministic mock extractor for synthetic case reports., normalize_entity_value(), Extraction normalization utilities., Normalize extracted entity value based on its type., Session

### Community 49 - "Community 49"
Cohesion: 0.19
Nodes (11): map_spacy_label(), Mapping external provider labels to internal entity types., Map a spaCy label to an internal entity type, or None if unmapped., Local NER Provider using spaCy (Optional Dependency).  Security: - SpacyNERPr, calculate_confidence(), generate_stable_candidate_id(), post_process_entities(), Post-processing logic for extraction results. (+3 more)

### Community 50 - "Community 50"
Cohesion: 0.19
Nodes (8): Any, ReviewDecision, DocumentExtractionService, AuditLog, Immutable audit record tracking every system and user action., Create a document record linked to a case and log the action., DocumentCreate, Schema for creating a document record.

### Community 51 - "Community 51"
Cohesion: 0.15
Nodes (8): Neo4jManager, Session, Manages the Neo4j driver lifecycle., Initialize the driver based on configuration., Close the Neo4j driver., Check if Neo4j is reachable and authentication succeeds., Return True if Neo4j is available., Provide a context-managed Neo4j session.

### Community 52 - "Community 52"
Cohesion: 0.18
Nodes (6): CaseTimeline(), CaseTimelineProps, TimelineEvent, CaseResponse, DocumentResponse, RelationshipEvidenceResponse

### Community 53 - "Community 53"
Cohesion: 0.24
Nodes (11): DocumentListResponse, DocumentResponse, DocumentStatus, DocumentType, BaseModel, Enum, str, Pydantic schemas for Document request/response models. (+3 more)

### Community 54 - "Community 54"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, dev, lint, start, test (+2 more)

### Community 55 - "Community 55"
Cohesion: 0.20
Nodes (9): global_exception_handler(), lifespan(), Exception, JSONResponse, Lifecycle events for the FastAPI application., Global structured exception handler., Root metadata endpoint., root_info() (+1 more)

### Community 56 - "Community 56"
Cohesion: 0.31
Nodes (8): react, PatternAlertCard(), PatternAlertCardProps, severityConfig, PatternAlertList(), PatternAlertListProps, PatternAlert, react

### Community 57 - "Community 57"
Cohesion: 0.29
Nodes (6): IngestionRowError, Exception, Memory-conscious CSV streaming reader with robust error handling., Stream a CSV file row by row, validating against a Pydantic schema.     Yields, stream_csv_file(), T

### Community 58 - "Community 58"
Cohesion: 0.46
Nodes (7): compute_sha256(), detect_sections(), generate_reports(), load_manifest(), main(), normalize_text(), process_case()

### Community 59 - "Community 59"
Cohesion: 0.32
Nodes (5): AnomalyExplanation(), AnomalyExplanationProps, FeatureDetail, ModelPredictionCardProps, ModelPrediction

### Community 60 - "Community 60"
Cohesion: 0.33
Nodes (6): health_check(), HealthCheckResponse, BaseModel, Health check endpoint., Schema for health check response., Return system health status.

### Community 61 - "Community 61"
Cohesion: 0.83
Nodes (3): load_manifest(), main(), process_doccano_import()

### Community 76 - "Community 76"
Cohesion: 0.67
Nodes (3): AnalyticsConfig, BaseSettings, Typed configuration for analytics pattern thresholds.

## Knowledge Gaps
- **126 isolated node(s):** `Config`, `$schema`, `style`, `rsc`, `tsx` (+121 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SpacyNERProvider` connect `Community 38` to `Community 0`, `Community 2`, `Community 5`, `Community 8`, `Community 48`, `Community 49`, `Community 50`, `Community 28`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `ExtractedEntity` connect `Community 13` to `Community 32`, `Community 1`, `Community 33`, `Community 2`, `Community 3`, `Community 35`, `Community 4`, `Community 11`, `Community 46`, `Community 50`, `Community 19`, `Community 22`, `Community 24`, `Community 26`, `Community 28`, `Community 30`, `Community 31`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `ExtractedRelationship` connect `Community 13` to `Community 32`, `Community 1`, `Community 33`, `Community 2`, `Community 3`, `Community 35`, `Community 4`, `Community 11`, `Community 46`, `Community 50`, `Community 19`, `Community 22`, `Community 24`, `Community 26`, `Community 28`, `Community 30`, `Community 31`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Are the 33 inferred relationships involving `ExtractedEntity` (e.g. with `run_case_analytics()` and `get_case_intelligence_summary()`) actually correct?**
  _`ExtractedEntity` has 33 INFERRED edges - model-reasoned connections that need verification._
- **Are the 29 inferred relationships involving `Base` (e.g. with `Alert` and `CaseGraphAnalytics`) actually correct?**
  _`Base` has 29 INFERRED edges - model-reasoned connections that need verification._
- **Are the 30 inferred relationships involving `ExtractedRelationship` (e.g. with `run_case_analytics()` and `get_case_intelligence_summary()`) actually correct?**
  _`ExtractedRelationship` has 30 INFERRED edges - model-reasoned connections that need verification._
- **Are the 22 inferred relationships involving `Case` (e.g. with `Permission` and `run_case_analytics()`) actually correct?**
  _`Case` has 22 INFERRED edges - model-reasoned connections that need verification._