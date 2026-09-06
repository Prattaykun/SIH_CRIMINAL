"use client";

import React, { useState, useEffect, useCallback } from "react";
import ExtractionCandidateCard, { EntityCandidate, VerificationStatus } from "./ExtractionCandidateCard";
import RelationshipCandidateCard, { RelationshipCandidate } from "./RelationshipCandidateCard";

import ExtractionStatus from "./ExtractionStatus";

import { api } from "@/lib/api";

interface Props {
  documentId?: string;
  caseId?: string;
}

export default function ExtractionReviewPanel({ documentId, caseId }: Props) {
  const targetId = caseId || documentId || "doc-1";
  const [entities, setEntities] = useState<EntityCandidate[]>([]);
  const [relationships, setRelationships] = useState<RelationshipCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<{ message: string; isSuccess: boolean } | null>(null);

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getExtractionCandidates(targetId);
      setEntities(data.entities || []);
      setRelationships(data.relationships || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch candidates");
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => {
    let active = true;
    api.getExtractionCandidates(targetId)
      .then(data => {
        if (active) {
          setEntities(data.entities || []);
          setRelationships(data.relationships || []);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to fetch candidates");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [targetId]);

  const handleReview = async (
    type: "entity" | "relationship", 
    id: string, 
    status: VerificationStatus, 
    correctedValue?: string, 
    rationale?: string
  ) => {
    try {
      await api.reviewCandidate(type, id, status, correctedValue, rationale, caseId);
      
      // Update local state smoothly
      if (type === "entity") {
        setEntities(prev => prev.map(e => e.id === id ? { ...e, verification_status: status } : e));
      } else {
        setRelationships(prev => prev.map(r => r.id === id ? { ...r, verification_status: status } : r));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Review action failed: ${msg}`);
    }
  };

  const handleSync = async () => {
    try {
      setSyncStatus(null);
      const data = await api.syncApprovedCandidates(targetId);
      const isSuccess = data?.status === "SUCCESS";
      setSyncStatus({
        message: isSuccess 
          ? "Successfully synced approved candidates to graph." 
          : `Sync status: ${data?.status || 'QUEUED'} (${data?.reason || 'Graph synchronization stored'})`,
        isSuccess,
      });
    } catch (err: unknown) {
      setSyncStatus({
        message: `Graph synchronization offline: ${err instanceof Error ? err.message : String(err)}`,
        isSuccess: false,
      });
    }
  };

  const handleExtract = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.runDocumentExtraction(targetId);
      await fetchCandidates();
    } catch (err: unknown) {
      setError(`Extraction notice: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 text-center text-slate-400">Loading extraction candidates...</div>;

  const pendingCount = [...entities, ...relationships].filter(x => x.verification_status === "UNREVIEWED").length;

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">NLP Document Extraction Review</h2>
          <p className="text-xs text-slate-400 mt-0.5">Human-in-the-loop candidate verification for evidence traceability</p>
        </div>
        <div className="space-x-2">
          <button onClick={handleExtract} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm font-medium transition">
            Run Extraction
          </button>
          <button 
            onClick={handleSync} 
            disabled={pendingCount > 0}
            className={`px-4 py-2 rounded text-white text-sm font-medium transition ${pendingCount > 0 ? "bg-gray-600 cursor-not-allowed opacity-60" : "bg-green-600 hover:bg-green-500"}`}
          >
            Sync Verified to Graph
          </button>
        </div>
      </div>

      {syncStatus && (
        <div className={`p-3 mb-4 rounded text-sm ${syncStatus.isSuccess ? 'bg-green-950/60 border border-green-700/50 text-green-300' : 'bg-amber-950/60 border border-amber-700/50 text-amber-300'}`}>
          {syncStatus.message}
        </div>
      )}

      {error && (
        <div className="p-3 mb-4 rounded text-sm bg-red-950/60 border border-red-700/50 text-red-300">
          {error}
        </div>
      )}

      <div className="bg-yellow-900/40 border-l-4 border-yellow-500 p-4 mb-6 rounded-r">
        <p className="text-yellow-200 text-sm font-bold">Synthetic Data &amp; Verification Warning</p>
        <p className="text-yellow-100 text-xs mt-1 leading-relaxed">
          Models trained on synthetic data do not represent real-world accuracy. Predictions are for investigative prioritization only and require human verification. Do not interpret as claims of wrongdoing.
        </p>
      </div>

      <ExtractionStatus
        totalCandidates={entities.length + relationships.length}
        unreviewedCandidates={pendingCount}
        acceptedCandidates={[...entities, ...relationships].filter(x => x.verification_status === "ACCEPTED").length}
        correctedCandidates={[...entities, ...relationships].filter(x => x.verification_status === "CORRECTED").length}
        rejectedCandidates={[...entities, ...relationships].filter(x => x.verification_status === "REJECTED").length}
        isComplete={entities.length + relationships.length > 0 && pendingCount === 0}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 border-b border-[var(--color-border)] pb-2">Extracted Entities</h3>
          {entities.length === 0 ? <p className="text-sm opacity-60">No entities extracted.</p> : (
            entities.map(ent => (
              <ExtractionCandidateCard 
                key={ent.id} 
                candidate={ent} 
                onReview={(id, status, correctedValue, rationale) => handleReview("entity", id, status, correctedValue, rationale)} 
              />
            ))
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 border-b border-[var(--color-border)] pb-2">Extracted Relationships</h3>
          {relationships.length === 0 ? <p className="text-sm opacity-60">No relationships extracted.</p> : (
            relationships.map(rel => (
              <RelationshipCandidateCard 
                key={rel.id} 
                candidate={rel} 
                onReview={(id, status, correctedValue, rationale) => handleReview("relationship", id, status, correctedValue, rationale)} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
