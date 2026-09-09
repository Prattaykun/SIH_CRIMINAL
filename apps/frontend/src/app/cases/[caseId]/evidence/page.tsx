'use client';

import React, { useEffect, useState, Suspense, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { CaseResponse, RelationshipEvidenceResponse, DocumentResponse } from '@/types/api';
import { CaseTimeline, TimelineEvent } from '@/components/cases/CaseTimeline';
import ExtractionReviewPanel from '@/components/extraction/ExtractionReviewPanel';

function EvidenceContent() {
  const { caseId } = useParams() as { caseId: string };
  const searchParams = useSearchParams();
  const relId = searchParams.get('rel');

  const [caseData, setCaseData] = useState<CaseResponse | null>(null);
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

  const fetchDocuments = async () => {
    try {
      setLoadingDocs(true);
      const res = await api.listDocuments(caseId);
      setDocuments(res.documents || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [caseId]);

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
        const caseRes = await api.getCase(caseId);
        setCaseData(caseRes);
        
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
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
        <Link href="/cases" className="hover:text-slate-200">Cases</Link>
        <span>/</span>
        <Link href={`/cases/${caseId}`} className="hover:text-slate-200">{caseData?.case_number || caseId}</Link>
        <span>/</span>
        <span className="text-slate-200">Evidence</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            Evidence Traceability
            <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              Verification Engine
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Trace extracted relationships back to their source records.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div id="upload" className="mb-8">
        <h3 className="text-lg font-semibold text-slate-200 mb-4 border-b border-slate-800 pb-2">Ingest New Evidence</h3>
        <DocumentUploadZone
          caseId={caseId}
          onUploadComplete={(docId) => {
            setActiveDocumentId(docId);
            fetchDocuments();
          }}
        />
      </div>

      {/* Ingested Evidence & Reports Section */}
      <div id="ingested-documents" className="mb-8 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2.5">
                Ingested Evidence &amp; Reports
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-medium border border-slate-700">
                  {documents.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Forensic records, FIR statements, and written interrogation notes active in this investigation.
              </p>
            </div>
          </div>
          
          <button
            onClick={fetchDocuments}
            disabled={loadingDocs}
            className="self-start sm:self-auto px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors border border-slate-700 flex items-center gap-1.5"
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
            <p className="text-xs text-slate-400 font-mono">Loading ingested evidence records...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-slate-800 rounded-lg bg-slate-950/30">
            <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-3 text-slate-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-300 mb-1">No Evidence Records Ingested Yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Upload files or write investigative reports above to extract topological entities and relationships.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                  <th className="py-3 px-4">Evidence / Report</th>
                  <th className="py-3 px-4">Ingestion Type</th>
                  <th className="py-3 px-4">Extraction Status</th>
                  <th className="py-3 px-4">Provenance (SHA-256)</th>
                  <th className="py-3 px-4">Ingested At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {documents.map((doc) => {
                  const isTextReport = doc.file_type === 'TEXT_REPORT' || doc.file_name.endsWith('.txt');
                  const isProcessing = doc.status === 'PROCESSING' || doc.status === 'UPLOADED';
                  const isFailed = doc.status === 'FAILED' || doc.status === 'ERROR';

                  return (
                    <tr key={doc.id} className="hover:bg-slate-800/30 transition-colors group">
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
                            <div className="text-[11px] text-slate-500 font-mono">
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
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-amber-400' : isFailed ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                          {doc.status || 'PROCESSED'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-xs text-slate-400">
                        {doc.file_hash ? (
                          <span
                            className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
                            title={`Full SHA-256: ${doc.file_hash}`}
                            onClick={() => {
                              navigator.clipboard.writeText(doc.file_hash || '');
                              toast.success('Provenance hash copied to clipboard!');
                            }}
                          >
                            {doc.file_hash.substring(0, 8)}...{doc.file_hash.substring(doc.file_hash.length - 6)}
                          </span>
                        ) : (
                          <span className="text-slate-600">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-400">
                        {doc.created_at ? new Date(doc.created_at).toLocaleString() : 'Recent'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {doc.raw_content && (
                            <button
                              onClick={() => setSelectedDocForPreview(doc)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors border border-slate-700 flex items-center gap-1"
                              title="Preview Raw Content"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              View
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setActiveDocumentId(doc.id);
                              document.getElementById('extraction-review')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border flex items-center gap-1 ${activeDocumentId === doc.id ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-900/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400 border-slate-700'}`}
                            title="Inspect Extracted Entities"
                          >
                            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Leads
                          </button>

                          <button
                            onClick={() => setDocToDelete(doc)}
                            className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg text-xs font-medium transition-colors border border-slate-700 hover:border-red-500/30 ml-1"
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
      </div>

      {/* Content Preview Modal */}
      {selectedDocForPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141721] border border-[#212638] rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-[#212638] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="size-4 text-blue-400 shrink-0" /> {selectedDocForPreview.file_name}
                </h3>
                <div className="text-xs text-slate-400 font-mono mt-1">
                  SHA-256: {selectedDocForPreview.file_hash || 'Uncomputed'} &bull; Ingested {new Date(selectedDocForPreview.created_at).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedDocForPreview(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-950/70">
              <pre className="font-mono text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {selectedDocForPreview.raw_content || 'No raw text content available for this binary file.'}
              </pre>
            </div>

            <div className="p-4 border-t border-[#212638] flex justify-between items-center bg-[#141721]">
              <span className="text-xs text-slate-500 font-mono">
                {selectedDocForPreview.raw_content ? `${selectedDocForPreview.raw_content.length} characters` : ''}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActiveDocumentId(selectedDocForPreview.id);
                    setSelectedDocForPreview(null);
                    document.getElementById('extraction-review')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Inspect Extracted Leads
                </button>
                <button
                  onClick={() => setSelectedDocForPreview(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141721] border border-red-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Remove Ingested Document</h3>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
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
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingDoc}
                onClick={handleDeleteDocConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-red-900/30"
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
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-semibold text-slate-200">Focused Relationship</h3>
            <span className="text-xs font-mono text-slate-400">ID: {relId}</span>
          </div>
          
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Extraction Context</h4>
                <div className="bg-slate-950 border border-slate-800 rounded p-4 text-sm font-mono text-slate-300">
                  <div>Source: <span className="text-blue-400">{evidence.source_id}</span></div>
                  <div>Target: <span className="text-blue-400">{evidence.target_id}</span></div>
                  <div className="mt-2 text-indigo-400">Type: {evidence.relationship_type}</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Algorithm Confidence</h4>
                <div className="flex items-center gap-4 bg-slate-800 rounded p-4">
                  <div className="flex-1">
                    <div className="w-full bg-slate-950 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${evidence.confidence! > 0.8 ? 'bg-emerald-500' : evidence.confidence! > 0.5 ? 'bg-amber-500' : 'bg-red-500'}`} 
                        style={{ width: `${Math.max(10, (evidence.confidence || 0) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-mono text-slate-300">
                    {evidence.confidence ? (evidence.confidence * 100).toFixed(0) : 'N/A'}%
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 text-right">
                  Confidence score indicates the model suggestion probability. It is an investigative lead, not verified fact.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Source Record</h4>
                <div className="bg-slate-800 border-l-4 border-emerald-500 p-4 rounded text-sm text-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400">{evidence.source_type || 'DOCUMENT'}</span>
                    <span className="text-xs font-mono text-emerald-400">{evidence.source_document_id}</span>
                  </div>
                  <p className="italic bg-slate-950 p-3 rounded border border-slate-700">
                    &ldquo;{evidence.evidence_text || 'Structured record extraction. No raw text snippet available.'}&rdquo;
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Verification Status</h4>
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
        </div>
      ) : relId && !evidence && !loading ? (
        <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-8 text-center">
          <p className="text-slate-400">Relationship evidence not found or backend capability not yet implemented.</p>
        </div>
      ) : null}

      <div>
        <h3 className="text-lg font-semibold text-slate-200 mb-6 border-b border-slate-800 pb-2">Event Timeline</h3>
        <CaseTimeline events={timelineEvents} />
      </div>

      <div id="extraction-review" className="mt-12">
        <ExtractionReviewPanel documentId={activeDocumentId} caseId={caseId} />
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
    setUploadStatus('Extracting Entities & Relations via NLP...');
    let attempts = 0;
    const pollInterval = setInterval(async () => {
      attempts++;
      try {
        const statusRes = await api.getExtractionStatus(documentId);
        const status = (statusRes.status || '').toUpperCase();
        const count = statusRes.entity_count || 0;
        setCandidateCount(count);

        if (status === 'PROCESSED' || status === 'COMPLETED' || status === 'SUCCESS') {
          clearInterval(pollInterval);
          setIsUploading(false);
          setUploadStatus('Complete');
          toast.success(`Extraction complete! Found ${count} entities.`);
          if (onUploadComplete) onUploadComplete(documentId);
        } else if (status === 'FAILED' || status === 'ERROR') {
          clearInterval(pollInterval);
          setIsUploading(false);
          toast.error(statusRes.error_message || 'NLP extraction pipeline failed.');
        } else if (attempts >= 20) {
          clearInterval(pollInterval);
          setIsUploading(false);
          toast.success('Extraction processed. Refreshing candidates.');
          if (onUploadComplete) onUploadComplete(documentId);
        }
      } catch {
        if (attempts >= 10) {
          clearInterval(pollInterval);
          setIsUploading(false);
        }
      }
    }, 1500);
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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 shadow-lg">
      {/* Mode Selector Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload File
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'write'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Write Report
          </button>
        </div>

        <span className="text-xs text-slate-500 font-mono hidden sm:inline-block">
          Case Ingestion Pipeline • SHA-256 Provenance
        </span>
      </div>

      {/* Progress / Extraction Indicator */}
      {isUploading && (
        <div className="w-full bg-slate-950/80 border border-blue-500/30 rounded-lg p-5 mb-6">
          <div className="flex justify-between items-center text-sm font-medium text-slate-300 mb-2">
            <span className="text-emerald-400 flex items-center gap-2 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {uploadStatus}
            </span>
            <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              {candidateCount} candidates detected
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
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
            className="w-full border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-lg p-10 flex flex-col items-center justify-center transition-colors min-h-[180px] bg-slate-950/40"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-slate-200 text-base font-medium mb-1">
                Drag and drop synthetic evidence files here
              </p>
              <p className="text-slate-500 text-xs mb-4">
                Supports .pdf, .docx, .txt, .json (Multi-modal FIRs, CDRs, Forensics)
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-md active:scale-95 flex items-center gap-2"
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
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Report Title / Case Document Reference
              </label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                placeholder="e.g. FIR-2024-SYN-042 - Initial Investigation Report"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Evidence Document Type
              </label>
              <select
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
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
            <span className="text-xs text-slate-400 font-medium">Synthetic Presets:</span>
            <button
              type="button"
              onClick={loadSyntheticFir}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400 px-2.5 py-1 rounded border border-slate-700 transition flex items-center gap-1.5"
            >
              <FileText className="size-3 text-blue-400" /> Load Synthetic FIR
            </button>
            <button
              type="button"
              onClick={loadSyntheticInterrogation}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 px-2.5 py-1 rounded border border-slate-700 transition flex items-center gap-1.5"
            >
              <FileText className="size-3 text-emerald-400" /> Load Interrogation Note
            </button>
            {(reportTitle || reportContent) && (
              <button
                type="button"
                onClick={() => { setReportTitle(''); setReportContent(''); }}
                className="text-xs text-slate-500 hover:text-red-400 px-2 py-1 transition ml-auto"
              >
                Clear Form
              </button>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Report Text & Findings
              </label>
              <div className="text-[11px] font-mono text-slate-500">
                {wordCount} words • {charCount} characters
              </div>
            </div>
            <textarea
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition font-mono leading-relaxed h-56"
              placeholder="Write or paste synthetic FIR narrative, officer statement, interrogation notes, or surveillance summary here..."
              value={reportContent}
              onChange={(e) => setReportContent(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-slate-500">
              Submitted report is hashed (SHA-256) and immediately queued for NLP entity & relation extraction.
            </p>
            <button
              type="submit"
              disabled={!reportTitle.trim() || !reportContent.trim()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-sm font-semibold transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ingest & Analyze Report
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function EvidencePage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <EvidenceContent />
    </Suspense>
  );
}
