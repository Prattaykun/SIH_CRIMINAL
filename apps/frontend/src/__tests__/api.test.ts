import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '../lib/api';

describe('API Client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles 503 Graph Unavailable correctly', async () => {
    const mockResponse = {
      ok: false,
      status: 503,
      json: async () => ({ detail: 'Graph Service is offline' })
    };
    
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response);

    try {
      await api.getCaseGraph('C001');
      expect.fail('Should have thrown');
    } catch (error: unknown) {
      const err = error as { status: number; graphUnavailable: boolean; message: string };
      expect(err.status).toBe(503);
      expect(err.graphUnavailable).toBe(true);
      expect(err.message).toContain('Graph data is temporarily unavailable');
    }
  });

  it('handles successful responses safely without exposing evidence unnecessarily', async () => {
    const mockData = { case_number: 'C001', title: 'Test Case' };
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => mockData
    };
    
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response);

    const result = await api.getCase('C001');
    expect(result.case_number).toBe('C001');
  });

  it('respects mock configuration', async () => {
    // If mock enabled, fetch is bypassed
    vi.spyOn(api, 'isMockEnabled').mockReturnValue(true);
    
    const result = await api.getCaseGraph('C001');
    expect(result.case_id).toBe('C001');
    expect(result.nodes.length).toBeGreaterThan(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  describe('exportCaseReport', () => {
    beforeEach(() => {
      // Mock URL.createObjectURL and URL.revokeObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
      global.URL.revokeObjectURL = vi.fn();
      
      // Mock document.createElement and click
      const mockClick = vi.fn();
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
    });

    it('successfully downloads report and revokes URL', async () => {
      const mockBlob = new Blob(['<html></html>']);
      const mockHeaders = new Headers();
      mockHeaders.set('Content-Disposition', 'attachment; filename="test-case.html"');
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
        headers: mockHeaders
      } as unknown as Response);

      await api.exportCaseReport('C001');

      expect(fetch).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('throws authentication error on 401', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401
      } as Response);

      await expect(api.exportCaseReport('C001')).rejects.toThrow("Authentication required.");
    });

    it('throws authorization error on 403', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 403
      } as Response);

      await expect(api.exportCaseReport('C001')).rejects.toThrow("You do not have permission to export this case report.");
    });
  });

  describe('ingestReportText', () => {
    it('sends report payload with title, content, and file_type', async () => {
      const mockResult = {
        id: 'doc-written-123',
        file_name: 'Synthetic_Report.txt',
        status: 'PROCESSING'
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResult
      } as Response);

      const result = await api.ingestReportText('case-101', {
        title: 'Synthetic Report',
        content: 'Subject was seen meeting associate in Saket.',
        file_type: 'TEXT_REPORT'
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/cases/case-101/documents/text'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Headers),
          body: JSON.stringify({
            title: 'Synthetic Report',
            content: 'Subject was seen meeting associate in Saket.',
            file_type: 'TEXT_REPORT'
          })
        })
      );
      expect(result.id).toBe('doc-written-123');
      expect(result.status).toBe('PROCESSING');
    });
  });

  describe('listDocuments and deletion operations', () => {
    it('calls GET /cases/{id}/documents with pagination parameters', async () => {
      const mockDocs = {
        total: 1,
        documents: [{ id: 'doc-1', file_name: 'test.txt', file_type: 'TEXT_REPORT', status: 'PROCESSED' }]
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockDocs
      } as Response);

      const result = await api.listDocuments('case-101', 0, 20);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/cases/case-101/documents?skip=0&limit=20'),
        expect.anything()
      );
      expect(result.total).toBe(1);
      expect(result.documents[0].id).toBe('doc-1');
    });

    it('calls DELETE /cases/{id}/documents/{doc_id}', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'success', message: 'Document removed successfully.' })
      } as Response);

      const result = await api.deleteDocument('case-101', 'doc-1');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/cases/case-101/documents/doc-1'),
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result.status).toBe('success');
    });

    it('calls DELETE /cases/{id} to delete full case', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'success', message: 'Case deleted successfully.' })
      } as Response);

      const result = await api.deleteCase('case-101');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/cases/case-101'),
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result.status).toBe('success');
    });
  });

  describe('Authentication & Storage Persistence', () => {
    const TOKEN_KEY = 'sih_auth_token';
    const USER_KEY = 'sih_auth_user';

    beforeEach(() => {
      localStorage.clear();
    });

    it('attaches Authorization header from localStorage token', async () => {
      localStorage.setItem(TOKEN_KEY, 'sample-persisted-jwt-token');

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'C001', case_number: 'CASE-001' })
      } as Response);

      await api.getCase('C001');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/cases/C001'),
        expect.objectContaining({
          headers: expect.any(Headers)
        })
      );

      const calledHeaders = vi.mocked(fetch).mock.calls[0][1]?.headers as Headers;
      expect(calledHeaders.get('Authorization')).toBe('Bearer sample-persisted-jwt-token');
    });

    it('stores token and user in localStorage on successful login', async () => {
      const mockLoginResponse = {
        access_token: 'new-jwt-access-token-12345',
        token_type: 'bearer',
        expires_in: 604800,
        user: {
          id: 'user-001',
          username: 'demo_investigator',
          email: 'investigator@sih.internal',
          role: 'INVESTIGATOR'
        }
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockLoginResponse
      } as Response);

      const result = await api.login('demo_investigator', 'DemoPassword123!');

      expect(result.access_token).toBe('new-jwt-access-token-12345');
      expect(localStorage.getItem(TOKEN_KEY)).toBe('new-jwt-access-token-12345');
      expect(JSON.parse(localStorage.getItem(USER_KEY) || '{}')).toEqual(mockLoginResponse.user);
    });

    it('clears localStorage and dispatches unauthorized event on 401', async () => {
      localStorage.setItem(TOKEN_KEY, 'expired-token');
      localStorage.setItem(USER_KEY, JSON.stringify({ username: 'demo_investigator' }));

      const unauthorizedSpy = vi.fn();
      window.addEventListener('unauthorized', unauthorizedSpy);

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Token expired' })
      } as Response);

      await expect(api.getCase('C001')).rejects.toThrow();

      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(USER_KEY)).toBeNull();
      expect(unauthorizedSpy).toHaveBeenCalled();

      window.removeEventListener('unauthorized', unauthorizedSpy);
    });
  });
});
