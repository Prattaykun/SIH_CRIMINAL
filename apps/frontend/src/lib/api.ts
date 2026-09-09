import {
  GraphResponse,
  EntityNeighbourResponse,
  RelationshipEvidenceResponse,
  GraphHealthResponse,
  CaseResponse,
  CaseListResponse,
  ApiError,
  AnalyticsRunResponse,
  PatternAlert,
  EntityGraphFeature,
  DocumentResponse,
  DocumentListResponse,
} from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const MOCK_GRAPH_ENABLED = process.env.NEXT_PUBLIC_ENABLE_MOCK_GRAPH === 'true';

class ApiClientError extends Error {
  public status: number;
  public details?: unknown;
  public graphUnavailable?: boolean;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiClientError';
    this.status = error.status;
    this.details = error.details;
    this.graphUnavailable = error.graphUnavailable;
  }
}

import { getMemoryToken, setMemoryToken } from '@/context/AuthContext';
import { getStoredToken, setStoredToken, setStoredUser, clearAuth } from './auth';

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const token = getStoredToken() || getMemoryToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.log(`[API-TRACE] ${options.method || 'GET'} ${url}`, {
      hasToken: Boolean(token),
      tokenSnippet: token ? `${token.slice(0, 15)}...` : 'NONE',
    });
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    return response;
  } catch (error: unknown) {
    const err = error as Error;
    if (err.name === 'AbortError') {
      throw new ApiClientError({
        status: 408,
        message: 'Request timed out. Please try again.',
      });
    }
    throw new ApiClientError({
      status: 0,
      message: 'Network error. The backend may be offline.',
    });
  } finally {
    clearTimeout(id);
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'An API error occurred.';
    let details = undefined;
    let graphUnavailable = false;

    if (response.status === 503) {
      message = 'Graph data is temporarily unavailable. Case records remain available from PostgreSQL. Retry after Neo4j synchronization is restored.';
      graphUnavailable = true;
    }

    try {
      const errorData = await response.json();
      if (response.status !== 503) {
        message = errorData.detail || errorData.error?.message || message;
      }
      details = errorData;
    } catch {
      // Body is not JSON
    }
    
    if (response.status === 401) {
      clearAuth();
      setMemoryToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('unauthorized'));
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }

    throw new ApiClientError({
      status: response.status,
      message,
      details,
      graphUnavailable,
    });
  }

  // Do not log response body directly to prevent sensitive evidence leakage
  return await response.json() as T;
}

export interface DashboardOverviewStats {
  total_cases: number;
  active_investigations: number;
  pending_verifications: number;
  entities_extracted: number;
  recent_cases: Array<{
    id: string;
    case_number: string;
    title: string;
    status: string;
    priority: string;
    created_at: string | null;
  }>;
  active_cases_summary?: {
    total: number;
    active: number;
    high_priority: number;
  };
  verification_queue?: {
    total_pending: number;
    pending_entities: number;
    pending_relationships: number;
    by_entity_type: Record<string, number>;
    oldest_pending_item: {
      id: string;
      name: string;
      type: string;
      created_at: string | null;
    } | null;
    high_priority_pending_count: number;
  };
  verified_entities?: {
    verified: number;
    pending: number;
    rejected: number;
    total: number;
  };
  network_structure?: {
    high_degree_nodes: number;
    bridge_nodes: number;
    financial_nodes: number;
    communication_nodes: number;
    peripheral_nodes: number;
    node_count: number;
    edge_count: number;
    selected_case: string;
    time_range: string;
  };
  explainable_pattern_signals?: {
    cluster_cohesion_index: number;
    baseline_delta: string;
    bridge_nodes_pending: number;
    calculation_source: string;
    evidence_references: string[];
    disclaimer: string;
  };
  cases_table?: Array<{
    id: string;
    case_number: string;
    title: string;
    status: string;
    priority: string;
    created_at: string | null;
    last_activity: string | null;
    evidence_count: number;
    pending_verifications: number;
  }>;
}

export const api = {
  get: async <T = any>(endpoint: string): Promise<{ data: T }> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`);
    const data = await handleResponse<T>(response);
    return { data };
  },

  async getCaseSummary(caseId: string): Promise<any> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}/summary`);
    return handleResponse<any>(response);
  },

  async getDashboardStats(caseId?: string, timeRange?: string): Promise<DashboardOverviewStats> {
    const params = new URLSearchParams();
    if (caseId && caseId !== 'all') params.append('case_id', caseId);
    if (timeRange) params.append('time_range', timeRange);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/overview/stats${qs}`);
    return handleResponse<DashboardOverviewStats>(response);
  },

  isMockEnabled: () => MOCK_GRAPH_ENABLED,

  async listCases(skip = 0, limit = 50, status?: string): Promise<CaseListResponse> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    if (status) {
      params.append('status', status);
    }
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases?${params.toString()}`);
    return handleResponse<CaseListResponse>(response);
  },

  async createCase(data: { case_number: string, title: string, description: string, priority: string }): Promise<CaseResponse> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<CaseResponse>(response);
  },

  async getCase(caseId: string): Promise<CaseResponse> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}`);
    return handleResponse<CaseResponse>(response);
  },

  async getCaseGraph(caseId: string, limit = 500): Promise<GraphResponse> {
    if (this.isMockEnabled()) {
      const { getMockCaseGraph } = await import('./mockGraphData');
      return getMockCaseGraph(caseId);
    }
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}/graph?limit=${limit}`);
    return handleResponse<GraphResponse>(response);
  },

  async getEntityNeighbours(entityId: string, label: string, limit = 100): Promise<EntityNeighbourResponse> {
    const params = new URLSearchParams({
      label,
      limit: limit.toString(),
    });
    const response = await fetchWithTimeout(`${API_BASE_URL}/entities/${entityId}/neighbours?${params.toString()}`);
    return handleResponse<EntityNeighbourResponse>(response);
  },

  async getRelationshipEvidence(relationshipId: string): Promise<RelationshipEvidenceResponse> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/relationships/${relationshipId}/evidence`);
    return handleResponse<RelationshipEvidenceResponse>(response);
  },

  async getGraphHealth(): Promise<GraphHealthResponse> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/graph/health`, undefined, 5000); // Shorter timeout for health check
    return handleResponse<GraphHealthResponse>(response);
  },

  async runAnalytics(caseId: string): Promise<AnalyticsRunResponse> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}/analytics`, { method: 'POST' });
    return handleResponse<AnalyticsRunResponse>(response);
  },

  async getCasePatterns(caseId: string): Promise<PatternAlert[]> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}/patterns`);
    return handleResponse<PatternAlert[]>(response);
  },

  async getCaseFeatures(caseId: string): Promise<EntityGraphFeature[]> {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}/features`);
      if (response.status === 404) return [];
      return handleResponse<EntityGraphFeature[]>(response);
    } catch {
      return [];
    }
  },

  async reviewAlert(alertId: string, action: string, rationale: string = ""): Promise<unknown> {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/alerts/${alertId}/review?action=${action}&rationale=${encodeURIComponent(rationale)}`,
      { method: 'POST' }
    );
    return handleResponse<unknown>(response);
  },

  async checkAnalyticsHealth(): Promise<unknown> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/analytics/health`, undefined, 5000);
    return handleResponse<unknown>(response);
  },

  async getCaseSimilarity(caseId: string, limit: number = 5): Promise<unknown> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}/similarity?limit=${limit}`);
    return handleResponse<unknown>(response);
  },

  async runCaseSimilarity(caseId: string, limit: number = 5): Promise<unknown> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}/similarity?top_k=${limit}`, { method: 'POST' });
    return handleResponse<unknown>(response);
  },

  async getMLPredictions(caseId: string): Promise<unknown> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}/predictions`);
    return handleResponse<unknown>(response);
  },

  async runMLPredictions(caseId: string): Promise<unknown> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}/predict`, { method: 'POST' });
    return handleResponse<unknown>(response);
  },

  async getCaseIngestionSummary(caseId: string): Promise<unknown> {
    // Expected endpoint: GET /api/v1/cases/{caseId}/ingestion-summary (Assuming it exists or will be handled gracefully if 404)
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}/ingestion-summary`);
    return handleResponse<unknown>(response);
  },

  // Training & Models
  async getTrainingReadiness() {
    const response = await fetchWithTimeout(`${API_BASE_URL}/extraction/training-readiness`);
    return handleResponse<any>(response);
  },
  async listModels() {
    const response = await fetchWithTimeout(`${API_BASE_URL}/extraction/models`);
    return handleResponse<any[]>(response);
  },
  async getModelMetrics(modelId: string) {
    const response = await fetchWithTimeout(`${API_BASE_URL}/extraction/models/${modelId}/metrics`);
    return handleResponse<any>(response);
  },

  // Auth
  async login(username: string, password: string): Promise<{ access_token: string, user: any }> {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params
    });
    const data = await handleResponse<{ access_token: string, user: any }>(response);
    if (data?.access_token) {
      setStoredToken(data.access_token);
      setMemoryToken(data.access_token);
      if (data.user) {
        setStoredUser(data.user);
      }
    }
    return data;
  },

  async getExtractionCandidates(caseOrDocId: string, type: "document" | "case" = "document"): Promise<any> {
    const primaryUrl = type === "document" 
      ? `${API_BASE_URL}/documents/${caseOrDocId}/extraction-candidates`
      : `${API_BASE_URL}/cases/${caseOrDocId}/candidates`;
    
    try {
      const response = await fetchWithTimeout(primaryUrl);
      if (response.ok) {
        return await handleResponse<any>(response);
      }
    } catch {
      // Fallback to empty candidates if request fails
    }

    return { entities: [], relationships: [] };
  },

  async reviewCandidate(
    type: "entity" | "relationship",
    candidateId: string,
    status: string,
    correctedValue?: string,
    rationale?: string,
    caseId?: string
  ): Promise<any> {
    const payload = {
      verification_status: status,
      status: status,
      corrected_value: correctedValue,
      rationale: rationale,
    };

    const url = caseId 
      ? `${API_BASE_URL}/cases/${caseId}/candidates/${candidateId}/review?candidate_type=${type}`
      : `${API_BASE_URL}/extraction-candidates/${type}/${candidateId}/review`;

    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(response);
  },

  async uploadDocument(caseId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<any>(response);
  },

  async ingestReportText(
    caseId: string,
    data: { title: string; content: string; file_type?: string }
  ): Promise<any> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}/documents/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        content: data.content,
        file_type: data.file_type || 'TEXT_REPORT',
      }),
    });
    return handleResponse<any>(response);
  },

  async getExtractionStatus(documentId: string): Promise<any> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/documents/${documentId}/extraction-status`);
    return handleResponse<any>(response);
  },

  async runDocumentExtraction(
    docOrCaseId: string,
    scope: "document" | "case" = "case"
  ): Promise<any> {
    // Prefer explicit scope — real document UUIDs do not start with "doc-".
    const isDocument =
      scope === "document" || docOrCaseId.startsWith("doc-");
    const url = isDocument
      ? `${API_BASE_URL}/documents/${docOrCaseId}/extract`
      : `${API_BASE_URL}/cases/${docOrCaseId}/extract`;

    // #region agent log
    fetch('http://127.0.0.1:7267/ingest/e2dbf843-7e56-4e83-b0d0-931cc70abd78',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e250be'},body:JSON.stringify({sessionId:'e250be',runId:'post-fix',hypothesisId:'H',location:'api.ts:runDocumentExtraction',message:'extract route selected',data:{docOrCaseId,scope,isDocument,url},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    const response = await fetchWithTimeout(url, { method: "POST" });
    return handleResponse<any>(response);
  },

  async syncApprovedCandidates(
    docOrCaseId: string,
    scope: "document" | "case" = "case"
  ): Promise<any> {
    const isDocument =
      scope === "document" || docOrCaseId.startsWith("doc-");
    const url = isDocument
      ? `${API_BASE_URL}/documents/${docOrCaseId}/sync-approved`
      : `${API_BASE_URL}/cases/${docOrCaseId}/sync-approved`;

    // #region agent log
    fetch('http://127.0.0.1:7267/ingest/e2dbf843-7e56-4e83-b0d0-931cc70abd78',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e250be'},body:JSON.stringify({sessionId:'e250be',runId:'post-fix',hypothesisId:'H',location:'api.ts:syncApprovedCandidates',message:'sync route selected',data:{docOrCaseId,scope,isDocument,url},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    const response = await fetchWithTimeout(url, { method: "POST" });
    return handleResponse<any>(response);
  },

  async deleteCase(caseId: string): Promise<{ status: string; message: string }> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}`, {
      method: 'DELETE',
    });
    return handleResponse<{ status: string; message: string }>(response);
  },

  async listDocuments(caseId: string, skip = 0, limit = 50): Promise<DocumentListResponse> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}/documents?${params.toString()}`);
    return handleResponse<DocumentListResponse>(response);
  },

  async deleteDocument(caseId: string, documentId: string): Promise<{ status: string; message: string }> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}/documents/${documentId}`, {
      method: 'DELETE',
    });
    return handleResponse<{ status: string; message: string }>(response);
  },

  // Export
  async exportCaseReport(caseId: string): Promise<void> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}/report/html`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('unauthorized'));
        }
        throw new Error("Authentication required.");
      }
      if (response.status === 403) {
        throw new Error("You do not have permission to export this case report.");
      }
      throw new Error(`Export failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `case_${caseId}_report.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Collaboration - Team
  async getCaseTeam(caseId: string): Promise<any[]> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}/team`);
    return handleResponse<any[]>(response);
  },
  async addTeamMember(caseId: string, data: { user_id: string; case_role: string; reason?: string }): Promise<any> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}/team`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },
  async removeTeamMember(caseId: string, userId: string, reason: string): Promise<any> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}/team/${userId}?reason=${encodeURIComponent(reason)}`, {
      method: 'DELETE',
    });
    return handleResponse<any>(response);
  },
  async transferCaseLead(caseId: string, data: { new_lead_user_id: string; reason: string }): Promise<any> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}/team/transfer-lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },

  // Collaboration - Tasks
  async getCaseTasks(caseId: string): Promise<any[]> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}/tasks`);
    return handleResponse<any[]>(response);
  },
  async createCaseTask(caseId: string, data: any): Promise<any> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },
  async updateCaseTask(caseId: string, taskId: string, data: any): Promise<any> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },
  async completeCaseTask(caseId: string, taskId: string, data: { expected_version: number; reason?: string }): Promise<any> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },
  async reopenCaseTask(caseId: string, taskId: string, data: { expected_version: number; reason: string }): Promise<any> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cases/${caseId}/tasks/${taskId}/reopen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  }
};
