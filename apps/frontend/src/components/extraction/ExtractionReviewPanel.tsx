"use client";

import React, { useState, useEffect, useCallback } from "react";
import ExtractionCandidateCard, { EntityCandidate, VerificationStatus } from "./ExtractionCandidateCard";
import RelationshipCandidateCard, { RelationshipCandidate } from "./RelationshipCandidateCard";

import ExtractionStatus from "./ExtractionStatus";
import { EvidenceTable } from "../evidence/EvidenceTable";

import { api } from "@/lib/api";

interface Props {
  documentId?: string;
  caseId?: string;
}

export default function ExtractionReviewPanel({ documentId, caseId }: Props) {
  const targetId = documentId || caseId || "";
  const targetType = documentId ? "document" : "case";
  const [entities, setEntities] = useState<EntityCandidate[]>([]);
  const [relationships, setRelationships] = useState<RelationshipCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<{ message: string; isSuccess: boolean } | null>(null);
  const [selectedItem, setSelectedItem] = useState<{item: any, type: 'entity'|'relationship', isEditing?: boolean} | null>(null);

  const fetchCandidates = useCallback(async () => {
    if (!targetId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getExtractionCandidates(targetId, targetType);
      setEntities(data.entities || []);
      setRelationships(data.relationships || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch candidates");
    } finally {
      setLoading(false);
    }
  }, [targetId, targetType]);

  useEffect(() => {
    if (!targetId) {
      setLoading(false);
      return;
    }
    let active = true;
    api.getExtractionCandidates(targetId, targetType)
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
      const data = await api.syncApprovedCandidates(targetId, targetType);
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
      await api.runDocumentExtraction(targetId, targetType);
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

      <div className="flex flex-col lg:flex-row gap-6 mt-6">
        <div className={`transition-all duration-300 ${selectedItem ? 'lg:w-2/3' : 'w-full'}`}>
          <EvidenceTable 
            entities={entities} 
            relationships={relationships} 
            onReview={handleReview} 
            onRowClick={(item: any, type: 'entity'|'relationship', isEditing?: boolean) => setSelectedItem({item, type, isEditing})}
            selectedId={selectedItem?.item?.id}
          />
        </div>

        {selectedItem && (
          <div className="lg:w-1/3 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl flex flex-col mt-12 max-h-[600px] sticky top-6">
             <div className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
               <h3 className="font-bold text-white flex items-center gap-2">
                 <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                 Source Document
               </h3>
               <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white transition-colors">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
             </div>
             
             <div className="p-5 overflow-y-auto flex-1 text-sm text-slate-300 leading-relaxed font-serif bg-slate-950">
               <div className="text-xs font-mono text-slate-500 mb-4 border-b border-slate-800 pb-2">
                  Source: {documentId || 'Financial_Intelligence_Report_CASE_001.txt'}
               </div>
               
               <p className="mb-4 opacity-50">
                 Confidential Financial Intelligence Report. The following activities were flagged by automated screening processes and require manual investigator review.
               </p>
               <p className="mb-4 bg-slate-900 p-3 rounded border-l-2 border-yellow-500/50">
                 <span className="bg-yellow-500/20 text-yellow-200 border-b border-yellow-500/50 py-0.5 px-1 rounded font-medium">
                   {selectedItem.item.source_text}
                 </span>
               </p>
               <p className="mb-4 opacity-50">
                 Further analysis suggests multiple potential linkages across jurisdictions. Accounts involved may have been subjected to rapid layering techniques.
               </p>
               
               <div className="mt-8 pt-4 border-t border-slate-800">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Item Details</h4>
                 <div className="grid grid-cols-2 gap-2 text-xs">
                   <div className="text-slate-500">Extracted Value:</div>
                   <div className="text-white font-semibold">{selectedItem.type === 'entity' ? selectedItem.item.normalized_value : selectedItem.item.relation_type}</div>
                   
                   <div className="text-slate-500">Confidence:</div>
                   <div className="text-white">{Math.round((selectedItem.item.confidence || 0.85) * 100)}%</div>
                   
                   <div className="text-slate-500">Current Status:</div>
                   <div className={`${selectedItem.item.verification_status === 'UNREVIEWED' ? 'text-amber-400' : selectedItem.item.verification_status === 'ACCEPTED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                     {selectedItem.item.verification_status}
                   </div>
                 </div>
               </div>
               
               {selectedItem.isEditing && selectedItem.item.verification_status === 'UNREVIEWED' && (
                 <div className="mt-6 p-4 bg-slate-900 border border-slate-700 rounded-lg">
                   <h4 className="text-sm font-bold text-white mb-3">Correct Information</h4>
                   <input 
                     type="text" 
                     className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white mb-3 focus:border-blue-500 focus:outline-none"
                     placeholder={selectedItem.type === 'entity' ? "Corrected Value" : "Corrected Relation"}
                     defaultValue={selectedItem.type === 'entity' ? selectedItem.item.normalized_value : selectedItem.item.relation_type}
                     id="correction-input"
                   />
                   <input 
                     type="text" 
                     className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white mb-3 focus:border-blue-500 focus:outline-none"
                     placeholder="Rationale (required)"
                     id="rationale-input"
                   />
                   <div className="flex gap-2">
                     <button 
                       onClick={() => {
                         const val = (document.getElementById('correction-input') as HTMLInputElement).value;
                         const rationale = (document.getElementById('rationale-input') as HTMLInputElement).value;
                         if (!rationale) { alert('Rationale required'); return; }
                         handleReview(selectedItem.type, selectedItem.item.id, 'CORRECTED', val, rationale);
                         setSelectedItem({...selectedItem, isEditing: false});
                       }}
                       className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded py-1.5 text-sm font-medium transition-colors"
                     >
                       Submit
                     </button>
                     <button 
                       onClick={() => setSelectedItem({...selectedItem, isEditing: false})}
                       className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded py-1.5 text-sm font-medium transition-colors"
                     >
                       Cancel
                     </button>
                   </div>
                 </div>
               )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
