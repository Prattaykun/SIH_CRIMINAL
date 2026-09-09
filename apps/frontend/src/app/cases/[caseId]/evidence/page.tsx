'use client';

import React, { useEffect, useState, Suspense, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { CaseResponse, RelationshipEvidenceResponse, DocumentResponse } from '@/types/api';
import { CaseTimeline, TimelineEvent } from '@/components/cases/CaseTimeline';
import ExtractionReviewPanel from '@/components/extraction/ExtractionReviewPanel';
import { DashboardCasePicker } from '@/components/dashboard/DashboardCasePicker';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  surfaceBtnDanger,
  surfaceBtnGhost,
  surfaceBtnPrimary,
  surfaceBtnSecondary,
  surfaceCard,
  surfaceInput,
  surfacePanel,
  surfaceSelect,
} from '@/components/layout/surface';

function EvidenceContent() {
  const { caseId } = useParams() as { caseId: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const relId = searchParams.get('rel');

  const [caseData, setCaseData] = useState<CaseResponse | null>(null);
  const [availableCases, setAvailableCases] = useState<CaseResponse[]>([]);
  const [evidence, setEvidence] = useState<RelationshipEvidenceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | undefined>(undefined);

  // Ingested Documents state
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(true);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<DocumentResponse | null>(null);
  const [docToDelete, setDocToDelete] = useState<DocumentResponse | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState<boolean>(false);

  const fetchDocuments = async (opts?: { quiet?: boolean }) => {
    try {
      if (!opts?.quiet) setLoadingDocs(true);
      const res = await api.listDocuments(caseId);
      setDocuments(res.documents || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      if (!opts?.quiet) setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [caseId]);

  // Live-refresh PROCESSING rows + toast stage changes for already-ingested docs
  useEffect(() => {
    const processing = documents.filter(
      (d) => d.status === 'PROCESSING' || d.status === 'UPLOADED'
    );
    if (processing.length === 0) return;

    const toastId = 'doc-table-progress';
    let lastMsg = '';
    const id = window.setInterval(async () => {
      let anyStillProcessing = false;
      for (const doc of processing) {
        try {
          const statusRes = await api.getExtractionStatus(doc.id);
          const status = (statusRes.status || '').toUpperCase();
          const message = statusRes.message || status;
          if (message && message !== lastMsg) {
            lastMsg = message;
            if (status === 'PROCESSING' || status === 'UPLOADED') {
              toast.loading(message, { id: toastId });
            }
          }
          if (status === 'PROCESSED' || status === 'COMPLETED' || status === 'SUCCESS') {
            toast.success(
              `${doc.file_name}: extraction complete (${statusRes.entity_count || 0} entities)`,
              { id: toastId }
            );
          } else if (status === 'FAILED' || status === 'ERROR') {
            toast.error(statusRes.error_message || statusRes.message || 'Extraction failed', {
              id: toastId,
            });
          } else {
            anyStillProcessing = true;
          }
        } catch {
          anyStillProcessing = true;
        }
      }
      await fetchDocuments({ quiet: true });
      if (!anyStillProcessing) {
        window.clearInterval(id);
      }
    }, 2500);

    return () => window.clearInterval(id);
  }, [documents.map((d) => `${d.id}:${d.status}`).join('|')]);

  const docStageLabel = (doc: DocumentResponse) => {
    const raw = doc.error_message || '';
    if (raw.startsWith('STAGE:') && raw.includes('|')) {
      return raw.split('|', 2)[1] || doc.status;
    }
    return doc.status || 'PROCESSED';
  };
  const handleDeleteDocConfirm = async () => {
    if (!docToDelete) return;
    setIsDeletingDoc(true);
    try {
      await api.deleteDocument(caseId, docToDelete.id);
      toast.success(`Removed '${docToDelete.file_name}' from case.`);
      setDocToDelete(null);
      await fetchDocuments();
      if (activeDocumentId === docToDelete.id) {
        setActiveDocumentId(undefined);
      }
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to remove document.';
      toast.error(msg);
    } finally {
      setIsDeletingDoc(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [caseRes, casesRes] = await Promise.all([
          api.getCase(caseId),
          api.listCases().catch(() => ({ cases: [] as CaseResponse[] })),
        ]);
        setCaseData(caseRes);
        setAvailableCases(casesRes.cases || []);

        if (relId) {
          const ev = await api.getRelationshipEvidence(relId).catch(() => null);
          setEvidence(ev);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load case data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [caseId, relId]);

  if (loading) {
    return (
      <div className="-m-5 space-y-0 sm:-m-6 lg:-m-8">
        <PageHeader badge="Evidence" title="Loading evidence..." />
        <div className="flex justify-center px-5 py-20 sm:px-6 lg:px-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  // Generate a mock timeline based on the evidence if a specific relationship was requested.
  // In a real implementation, we'd fetch the timeline events from a dedicated endpoint.
  const timelineEvents: TimelineEvent[] = [];
  if (evidence && evidence.event_date) {
    timelineEvents.push({
      id: evidence.relationship_id,
      date: evidence.event_date,
      type: evidence.relationship_type,
      description: evidence.evidence_text || `Extracted ${evidence.relationship_type.toLowerCase()} relationship`,
      entities: [evidence.source_id, evidence.target_id],
      sourceDocument: evidence.source_document_id || 'Unknown Document',
      confidence: evidence.confidence,
      verified: evidence.verified
    });
  }

  return (
    <div className="-m-5 space-y-0 sm:-m-6 lg:-m-8">
      <PageHeader
        leading={
          <DashboardCasePicker
            value={caseId}
            valueKey="id"
            includeAll={false}
            dropdownAlign="right"
            className="w-[min(100%,22rem)]"
            cases={
              availableCases.length > 0
                ? availableCases
                : caseData
                  ? [caseData]
                  : []
            }
            onChange={(nextCaseId) => {
              if (nextCaseId === caseId) return;
              router.push(`/cases/${nextCaseId}/evidence`);
            }}
          />
        }
        title="Evidence Traceability"
        description="Trace extracted relationships back to their source records."
        actions={
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400">
            Verification Engine
          </span>
        }
      />

      <div className="mx-auto max-w-7xl space-y-6 px-5 py-5 sm:px-6 lg:px-8">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      <div id="upload" className="mb-8">
        <h3 className="mb-4 border-b border-white/[0.08] pb-2 text-lg font-semibold text-white">Ingest New Evidence</h3>
        <DocumentUploadZone
          caseId={caseId}
          onUploadComplete={(docId) => {
            setActiveDocumentId(docId);
            fetchDocuments();
          }}
        />
      </div>

      {/* Ingested Evidence & Reports Section */}
      <Card id="ingested-documents" className={cn(surfaceCard, 'mb-8 gap-0 p-6')}>
        <div className="mb-5 flex flex-col justify-between gap-4 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="flex items-center gap-2.5 text-lg font-bold tracking-wide text-white">
                Ingested Evidence &amp; Reports
                <span className="rounded-full border border-white/[0.12] bg-white/[0.05] px-2.5 py-0.5 font-mono text-xs font-medium text-white/70">
                  {documents.length}
                </span>
              </h3>
              <p className="mt-0.5 text-xs text-white/45">
                Forensic records, FIR statements, and written interrogation notes active in this investigation.
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={fetchDocuments}
            disabled={loadingDocs}
            className={cn(surfaceBtnSecondary, 'self-start gap-1.5 text-xs sm:self-auto')}
          >
            <svg className={`w-3.5 h-3.5 ${loadingDocs ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Records
          </button>
        </div>

        {loadingDocs ? (
          <div className="py-10 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="font-mono text-xs text-white/45">Loading ingested evidence records...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-white/[0.08] bg-black/30 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-white/40">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="mb-1 text-sm font-medium text-white/70">No Evidence Records Ingested Yet</p>
            <p className="mx-auto mb-4 max-w-sm text-xs text-white/40">
              Upload files or write investigative reports above to extract topological entities and relationships.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] bg-black/40 text-[11px] font-semibold uppercase tracking-wider text-white/45">
                  <th className="py-3 px-4">Evidence / Report</th>
                  <th className="py-3 px-4">Ingestion Type</th>
                  <th className="py-3 px-4">Extraction Status</th>
                  <th className="py-3 px-4">Provenance (SHA-256)</th>
                  <th className="py-3 px-4">Ingested At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] font-sans">
                {documents.map((doc) => {
                  const isTextReport = doc.file_type === 'TEXT_REPORT' || doc.file_name.endsWith('.txt');
                  const isProcessing = doc.status === 'PROCESSING' || doc.status === 'UPLOADED';
                  const isFailed = doc.status === 'FAILED' || doc.status === 'ERROR';

                  return (
                    <tr key={doc.id} className="group transition-colors hover:bg-white/[0.03]">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isTextReport ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                            {isTextReport ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate max-w-xs" title={doc.file_name}>
                              {doc.file_name}
                            </div>
                            <div className="font-mono text-[11px] text-white/40">
                              {doc.raw_content ? `${doc.raw_content.length} chars` : (doc.mime_type || 'Evidence File')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase border ${isTextReport ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                          {isTextReport ? 'Written Report' : 'Uploaded File'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 w-max border ${
                          isProcessing ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse' :
                          isFailed ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`} title={doc.error_message || doc.status || ''}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-amber-400' : isFailed ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                          {isProcessing ? docStageLabel(doc) : (doc.status || 'PROCESSED')}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-white/45">
                        {doc.file_hash ? (
                          <span
                            className="cursor-pointer rounded border border-white/[0.08] bg-black px-2 py-1 text-white/45 transition-colors hover:text-white"
                            title={`Full SHA-256: ${doc.file_hash}`}
                            onClick={() => {
                              navigator.clipboard.writeText(doc.file_hash || '');
                              toast.success('Provenance hash copied to clipboard!');
                            }}
                          >
                            {doc.file_hash.substring(0, 8)}...{doc.file_hash.substring(doc.file_hash.length - 6)}
                          </span>
                        ) : (
                          <span className="text-white/30">Pending</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-white/45">
                        {doc.created_at ? new Date(doc.created_at).toLocaleString() : 'Recent'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {doc.raw_content && (
                            <button
                              type="button"
                              onClick={() => setSelectedDocForPreview(doc)}
                              className={cn(surfaceBtnSecondary, 'gap-1 px-2.5 py-1.5 text-xs')}
                              title="Preview Raw Content"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              View
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setActiveDocumentId(doc.id);
                              document.getElementById('extraction-review')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={cn(
                              'flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-colors',
                              activeDocumentId === doc.id
                                ? 'border-blue-500 bg-blue-600 text-white shadow-sm shadow-blue-900/30'
                                : cn(surfaceBtnSecondary, 'hover:text-blue-400')
                            )}
                            title="Inspect Extracted Entities"
                          >
                            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Leads
                          </button>

                          <button
                            type="button"
                            onClick={() => setDocToDelete(doc)}
                            className={cn(surfaceBtnGhost, 'ml-1 border border-white/[0.12] p-1.5 hover:border-red-500/30 hover:bg-red-500/20 hover:text-red-400')}
                            title="Remove Document from Ingestion"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Content Preview Modal */}
      {selectedDocForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className={cn(surfaceCard, 'flex max-h-[85vh] w-full max-w-3xl flex-col gap-0 overflow-hidden p-0')}>
            <div className="flex items-center justify-between border-b border-white/[0.08] p-5">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="size-4 text-blue-400 shrink-0" /> {selectedDocForPreview.file_name}
                </h3>
                <div className="mt-1 font-mono text-xs text-white/45">
                  SHA-256: {selectedDocForPreview.file_hash || 'Uncomputed'} &bull; Ingested {new Date(selectedDocForPreview.created_at).toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDocForPreview(null)}
                className={surfaceBtnGhost}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-black/50 p-6">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-white/80">
                {selectedDocForPreview.raw_content || 'No raw text content available for this binary file.'}
              </pre>
            </div>

            <div className="flex items-center justify-between border-t border-white/[0.08] p-4">
              <span className="font-mono text-xs text-white/40">
                {selectedDocForPreview.raw_content ? `${selectedDocForPreview.raw_content.length} characters` : ''}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveDocumentId(selectedDocForPreview.id);
                    setSelectedDocForPreview(null);
                    document.getElementById('extraction-review')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={surfaceBtnPrimary}
                >
                  Inspect Extracted Leads
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDocForPreview(null)}
                  className={surfaceBtnSecondary}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Document Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className={cn(surfaceCard, 'w-full max-w-md gap-0 p-6')}>
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Remove Ingested Document</h3>
            <p className="mb-4 text-sm leading-relaxed text-white/70">
              Are you sure you want to remove <span className="font-semibold text-white font-mono">{docToDelete.file_name}</span> from this case?
            </p>
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-xs text-red-300 mb-6">
              This action permanently deletes the stored document file and removes any unverified extracted leads derived from it.
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                disabled={isDeletingDoc}
                onClick={() => setDocToDelete(null)}
                className={surfaceBtnSecondary}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingDoc}
                onClick={handleDeleteDocConfirm}
                className={surfaceBtnDanger}
              >
                {isDeletingDoc ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Removing...
                  </>
                ) : (
                  'Confirm Removal'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {relId && evidence ? (
        <Card className={cn(surfaceCard, 'gap-0 overflow-hidden p-0')}>
          <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] p-4">
            <h3 className="font-semibold text-white">Focused Relationship</h3>
            <span className="font-mono text-xs text-white/45">ID: {relId}</span>
          </div>
          
          <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-2">
            <div className="space-y-6">
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Extraction Context</h4>
                <div className={cn(surfacePanel, 'p-4 font-mono text-sm text-white/70')}>
                  <div>Source: <span className="text-blue-400">{evidence.source_id}</span></div>
                  <div>Target: <span className="text-blue-400">{evidence.target_id}</span></div>
                  <div className="mt-2 text-indigo-400">Type: {evidence.relationship_type}</div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Algorithm Confidence</h4>
                <div className={cn(surfacePanel, 'flex items-center gap-4 p-4')}>
                  <div className="flex-1">
                    <div className="h-2 w-full rounded-full bg-black">
                      <div 
                        className={`h-2 rounded-full ${evidence.confidence! > 0.8 ? 'bg-emerald-500' : evidence.confidence! > 0.5 ? 'bg-amber-500' : 'bg-red-500'}`} 
                        style={{ width: `${Math.max(10, (evidence.confidence || 0) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="font-mono text-sm text-white/70">
                    {evidence.confidence ? (evidence.confidence * 100).toFixed(0) : 'N/A'}%
                  </span>
                </div>
                <p className="mt-2 text-right text-[10px] text-white/40">
                  Confidence score indicates the model suggestion probability. It is an investigative lead, not verified fact.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Source Record</h4>
                <div className="rounded border-l-4 border-emerald-500 bg-white/[0.03] p-4 text-sm text-white/80">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-white/45">{evidence.source_type || 'DOCUMENT'}</span>
                    <span className="font-mono text-xs text-emerald-400">{evidence.source_document_id}</span>
                  </div>
                  <p className="rounded border border-white/[0.08] bg-black p-3 italic">
                    &ldquo;{evidence.evidence_text || 'Structured record extraction. No raw text snippet available.'}&rdquo;
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Verification Status</h4>
                {evidence.verified ? (
                  <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded">
                    <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="font-medium text-sm">Verified by Investigator</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 p-4 rounded">
                    <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span className="font-medium text-sm">Unverified AI Lead (Requires Human Verification)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      ) : relId && !evidence && !loading ? (
        <Card className={cn(surfaceCard, 'border-dashed p-8 text-center text-white/45')}>
          Relationship evidence not found or backend capability not yet implemented.
        </Card>
      ) : null}

      <div>
        <h3 className="mb-6 border-b border-white/[0.08] pb-2 text-lg font-semibold text-white">Event Timeline</h3>
        <CaseTimeline events={timelineEvents} />
      </div>

      <div id="extraction-review" className="mt-12">
        <ExtractionReviewPanel documentId={activeDocumentId} caseId={caseId} />
      </div>

      </div>
    </div>
  );
}

function DocumentUploadZone({ caseId, onUploadComplete }: { caseId: string, onUploadComplete?: (docId: string) => void }) {
  const params = useParams();
  const rawCaseId = (params?.caseId as string) || caseId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'upload' | 'write'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [candidateCount, setCandidateCount] = useState<number>(0);

  // Write Report State
  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [reportType, setReportType] = useState('TEXT_REPORT');

  const pollExtraction = (documentId: string) => {
    setUploadStatus('Queued for extraction pipeline...');
    let attempts = 0;
    let lastStage = '';
    const toastId = 'extraction-progress';
    toast.loading('Queued for extraction pipeline...', { id: toastId });

    const pollInterval = setInterval(async () => {
      attempts++;
      try {
        const statusRes = await api.getExtractionStatus(documentId);
        const status = (statusRes.status || '').toUpperCase();
        const count = statusRes.entity_count || 0;
        const stage = String(statusRes.stage || '');
        const message =
          statusRes.message ||
          (status === 'PROCESSING' ? 'Extraction pipeline running...' : status);
        setCandidateCount(count);
        setUploadStatus(message);

        if (stage && stage !== lastStage) {
          lastStage = stage;
          toast.loading(message, { id: toastId });
          // #region agent log
          fetch('http://127.0.0.1:7267/ingest/e2dbf843-7e56-4e83-b0d0-931cc70abd78',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e250be'},body:JSON.stringify({sessionId:'e250be',runId:'pre-fix',hypothesisId:'P4',location:'evidence/page.tsx:pollExtraction',message:'extraction stage toast',data:{documentId,stage,status,count,attempts},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
        }

        if (status === 'PROCESSED' || status === 'COMPLETED' || status === 'SUCCESS') {
          clearInterval(pollInterval);
          setIsUploading(false);
          setUploadStatus('Complete');
          toast.success(
            `Extraction complete — ${count} entities, ${statusRes.relationship_count || 0} links.`,
            { id: toastId }
          );
          if (onUploadComplete) onUploadComplete(documentId);
        } else if (status === 'FAILED' || status === 'ERROR') {
          clearInterval(pollInterval);
          setIsUploading(false);
          toast.error(statusRes.error_message || statusRes.message || 'NLP extraction pipeline failed.', {
            id: toastId,
          });
        } else if (attempts >= 180) {
          // ~6 minutes at 2s interval — Gemini may still finish; keep UI honest
          clearInterval(pollInterval);
          setIsUploading(false);
          toast.error('Extraction is taking longer than expected. Use Refresh Records.', { id: toastId });
          if (onUploadComplete) onUploadComplete(documentId);
        }
      } catch {
        if (attempts >= 20) {
          clearInterval(pollInterval);
          setIsUploading(false);
          toast.error('Lost connection while polling extraction status.', { id: toastId });
        }
      }
    }, 2000);
  };

  const handleFile = async (file: File) => {
    if (!file) return;

    const validExtensions = ['.txt', '.pdf', '.docx', '.doc', '.json'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      toast.error(`Unsupported file type (${fileExt}). Please upload .txt, .pdf, or .docx`);
      return;
    }

    setIsUploading(true);
    setUploadStatus('Uploading document...');
    setCandidateCount(0);

    try {
      const uploadRes = await api.uploadDocument(rawCaseId, file);
      const documentId = uploadRes?.id || uploadRes?.document_id;
      if (!documentId) {
        throw new Error('No document ID returned from server.');
      }

      pollExtraction(documentId);
    } catch (err: unknown) {
      console.error('File upload failed:', err);
      setIsUploading(false);
      const errorDetail = (err as { details?: { detail?: string }; message?: string })?.details?.detail || (err as Error)?.message || 'Upload failed.';
      toast.error(`Upload error: ${errorDetail}`);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleWriteReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim()) {
      toast.error('Please enter a report title or reference.');
      return;
    }
    if (!reportContent.trim()) {
      toast.error('Please enter report narrative content.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Ingesting written report...');
    setCandidateCount(0);

    try {
      const res = await api.ingestReportText(rawCaseId, {
        title: reportTitle.trim(),
        content: reportContent.trim(),
        file_type: reportType,
      });

      const documentId = res?.id || res?.document_id;
      if (!documentId) {
        throw new Error('No document ID returned from server.');
      }

      pollExtraction(documentId);
    } catch (err: unknown) {
      console.error('Report submission failed:', err);
      setIsUploading(false);
      const errorDetail = (err as { details?: { detail?: string }; message?: string })?.details?.detail || (err as Error)?.message || 'Submission failed.';
      toast.error(`Ingest error: ${errorDetail}`);
    }
  };

  const loadSyntheticFir = () => {
    setReportTitle('FIR-2024-SYN-088: Saket Syndicate Observation');
    setReportType('TEXT_REPORT');
    setReportContent(
`FIRST INFORMATION REPORT (SYNTHETIC RECORD - INVESTIGATION BENCHMARK)
Reference: FIR-2024-SYN-088
Date of Incident: 14 January 2024, 18:30 IST
Jurisdiction: Saket District, New Delhi

Investigative Narrative:
On 14-01-2024, primary subject Aditya Malhotra was observed attending an unlogged meeting with Sneha Kapoor at Saket District Center. Aditya Malhotra arrived in a black Hyundai Creta bearing registration HR-26-XY-9999. Surveillance intercepts identified communication with cellular contact +91-98111-22222 registered under Apex Traders Pvt Ltd.

Financial audit logs from City Bank reflect an anomalous fund transfer of INR 18,00,000 via IMPS originating from account ACCT-1234567890 to associate account ACCT-9876543210 linked to Sneha Kapoor.

Investigative Priority: Requires verification of cellular cell tower co-location, toll plaza passage, and account beneficial ownership.`
    );
  };

  const loadSyntheticInterrogation = () => {
    setReportTitle('Interrogation Transcript - Sneha Kapoor');
    setReportType('TEXT_REPORT');
    setReportContent(
`RECORD OF INTERROGATION (SYNTHETIC BENCHMARK RECORD)
Subject: Sneha Kapoor
Date: 18 January 2024
Interrogating Officer: Inspector R. Kumar

Interview Summary:
Subject stated that she communicated with Aditya Malhotra regarding business logistics for Apex Traders Pvt Ltd. Subject confirmed usage of cellular number +91-98111-33444 for business messages. When questioned regarding the IMPS transfer of INR 18,00,000 into ACCT-9876543210, subject stated the funds were intended for material transport coordinated by Deepak driving vehicle HR-26-XY-9999.

Investigator Assessment: Lead requires cross-referencing with call detail records and bank statements.`
    );
  };

  const wordCount = reportContent.trim() ? reportContent.trim().split(/\s+/).length : 0;
  const charCount = reportContent.length;

  return (
    <Card className={cn(surfaceCard, 'mb-8 gap-0 p-6')}>
      {/* Mode Selector Tabs */}
      <div className="mb-6 flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
              activeTab === 'upload'
                ? surfaceBtnPrimary
                : cn(surfaceBtnSecondary, 'border-transparent bg-white/[0.04] text-white/45 hover:text-white')
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload File
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
              activeTab === 'write'
                ? surfaceBtnPrimary
                : cn(surfaceBtnSecondary, 'border-transparent bg-white/[0.04] text-white/45 hover:text-white')
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Write Report
          </button>
        </div>

        <span className="hidden font-mono text-xs text-white/40 sm:inline-block">
          Case Ingestion Pipeline • SHA-256 Provenance
        </span>
      </div>

      {/* Progress / Extraction Indicator */}
      {isUploading && (
        <div className={cn(surfacePanel, 'mb-6 w-full border-blue-500/30 p-5')}>
          <div className="mb-2 flex items-center justify-between text-sm font-medium text-white/70">
            <span className="flex animate-pulse items-center gap-2 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {uploadStatus}
            </span>
            <span className="rounded bg-white/[0.05] px-2 py-0.5 font-mono text-xs text-white/45">
              {candidateCount} candidates detected
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="bg-gradient-to-r from-blue-500 via-emerald-400 to-blue-500 h-2 rounded-full animate-[progress_2s_ease-in-out_infinite]"
              style={{ width: '100%', transformOrigin: 'left' }}
            ></div>
          </div>
        </div>
      )}

      {/* Tab 1: Upload File Option */}
      {activeTab === 'upload' && !isUploading && (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.docx,.doc,.txt,.json"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
              }
            }}
          />
          <div
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
              }
            }}
            className="flex min-h-[180px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/[0.12] bg-black/40 p-10 transition-colors hover:border-blue-500/50"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="mb-1 text-base font-medium text-white">
                Drag and drop synthetic evidence files here
              </p>
              <p className="mb-4 text-xs text-white/40">
                Supports .pdf, .docx, .txt, .json (Multi-modal FIRs, CDRs, Forensics)
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(surfaceBtnPrimary, 'gap-2 active:scale-95')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Browse Files
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Write Report Option */}
      {activeTab === 'write' && !isUploading && (
        <form onSubmit={handleWriteReportSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/70">
                Report Title / Case Document Reference
              </label>
              <input
                type="text"
                className={surfaceInput}
                placeholder="e.g. FIR-2024-SYN-042 - Initial Investigation Report"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/70">
                Evidence Document Type
              </label>
              <select
                className={surfaceSelect}
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="TEXT_REPORT">Text Report / Narrative</option>
                <option value="CDR">Call Detail Record (CDR)</option>
                <option value="BANK_STATEMENT">Bank Statement Summary</option>
                <option value="LOCATION_LOG">Location / Tower Log</option>
                <option value="VEHICLE_LOG">Vehicle Surveillance Log</option>
                <option value="OTHER">Other Evidence Document</option>
              </select>
            </div>
          </div>

          {/* Quick Synthetic Templates */}
          <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
            <span className="text-xs font-medium text-white/45">Synthetic Presets:</span>
            <button
              type="button"
              onClick={loadSyntheticFir}
              className={cn(surfaceBtnSecondary, 'gap-1.5 px-2.5 py-1 text-xs hover:text-blue-400')}
            >
              <FileText className="size-3 text-blue-400" /> Load Synthetic FIR
            </button>
            <button
              type="button"
              onClick={loadSyntheticInterrogation}
              className={cn(surfaceBtnSecondary, 'gap-1.5 px-2.5 py-1 text-xs hover:text-emerald-400')}
            >
              <FileText className="size-3 text-emerald-400" /> Load Interrogation Note
            </button>
            {(reportTitle || reportContent) && (
              <button
                type="button"
                onClick={() => { setReportTitle(''); setReportContent(''); }}
                className={cn(surfaceBtnGhost, 'ml-auto px-2 py-1 text-xs hover:text-red-400')}
              >
                Clear Form
              </button>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Report Text & Findings
              </label>
              <div className="font-mono text-[11px] text-white/40">
                {wordCount} words • {charCount} characters
              </div>
            </div>
            <textarea
              className={cn(surfaceInput, 'h-56 font-mono leading-relaxed')}
              placeholder="Write or paste synthetic FIR narrative, officer statement, interrogation notes, or surveillance summary here..."
              value={reportContent}
              onChange={(e) => setReportContent(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-white/40">
              Submitted report is hashed (SHA-256) and immediately queued for NLP entity & relation extraction.
            </p>
            <button
              type="submit"
              disabled={!reportTitle.trim() || !reportContent.trim()}
              className={cn(surfaceBtnPrimary, 'gap-2 active:scale-95 disabled:opacity-50')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ingest & Analyze Report
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}

export default function EvidencePage() {
  return (
    <Suspense fallback={
      <div className="-m-5 flex justify-center px-5 py-20 sm:-m-6 sm:px-6 lg:-m-8 lg:px-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    }>
      <EvidenceContent />
    </Suspense>
  );
}
