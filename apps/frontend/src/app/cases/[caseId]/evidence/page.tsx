'use client';

import React, { useEffect, useState, Suspense, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { CaseResponse, RelationshipEvidenceResponse } from '@/types/api';
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
        <DocumentUploadZone caseId={caseId} onUploadComplete={(docId) => setActiveDocumentId(docId)} />
      </div>

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

      <div className="mt-12">
        <ExtractionReviewPanel documentId={activeDocumentId} caseId={caseId} />
      </div>

    </div>
  );
}

function DocumentUploadZone({ caseId, onUploadComplete }: { caseId: string, onUploadComplete?: (docId: string) => void }) {
  const params = useParams();
  const rawCaseId = (params?.caseId as string) || caseId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [candidateCount, setCandidateCount] = useState<number>(0);

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
      // 1. Send Upload Request to Backend
      const uploadRes = await api.uploadDocument(rawCaseId, file);

      const documentId = uploadRes?.id || uploadRes?.document_id;
      if (!documentId) {
        throw new Error('No document ID returned from server.');
      }

      setUploadStatus('Extracting Entities & Relations via NLP...');

      // 2. Poll extraction status with a 30-second safety window
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
            // Safety timeout: stop spinner and refresh list
            clearInterval(pollInterval);
            setIsUploading(false);
            toast.success('Extraction processed. Refreshing candidates.');
            if (onUploadComplete) onUploadComplete(documentId);
          }
        } catch (pollErr) {
          if (attempts >= 10) {
            clearInterval(pollInterval);
            setIsUploading(false);
          }
        }
      }, 1500);

    } catch (err: any) {
      console.error('File upload failed:', err);
      setIsUploading(false);
      const errorDetail = err?.details?.detail || err?.message || 'Upload failed.';
      toast.error(`Upload error: ${errorDetail}`);
    } finally {
      // Reset input value so selecting the exact same file fires onChange again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
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
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="w-full border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-lg p-10 flex flex-col items-center justify-center transition-colors min-h-[160px]"
      >
        {isUploading ? (
          <div className="w-full max-w-md flex flex-col items-center">
            <div className="flex justify-between w-full text-sm font-medium text-slate-300 mb-2">
              <span className="text-emerald-400 animate-pulse">{uploadStatus}</span>
              <span>{candidateCount} candidates found</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div className="bg-emerald-500 h-2.5 rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: '100%', transformOrigin: 'left' }}></div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <svg className="w-12 h-12 mx-auto text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            <p className="text-slate-300 text-base font-medium mb-1">
              Drag and drop evidence files here
            </p>
            <p className="text-slate-500 text-xs mb-4">
              Supports .pdf, .docx, .txt, .json
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm border border-slate-600 transition-all shadow-md active:scale-95"
            >
              Browse Files
            </button>
          </div>
        )}
      </div>
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
