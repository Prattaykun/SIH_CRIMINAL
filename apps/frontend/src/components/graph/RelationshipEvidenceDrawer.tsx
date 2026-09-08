'use client';

import React from 'react';
import { NormalizedRelationship, NormalizedEntity } from '@/lib/graphIntelligence';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Cpu,
  Check,
  Ban,
  Clock,
  ExternalLink,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface RelationshipEvidenceDrawerProps {
  relationship: NormalizedRelationship | null;
  sourceEntity?: NormalizedEntity;
  targetEntity?: NormalizedEntity;
  onClose: () => void;
  onReview?: (relId: string, status: 'ACCEPTED' | 'REJECTED') => void;
}

export function RelationshipEvidenceDrawer({
  relationship,
  sourceEntity,
  targetEntity,
  onClose,
  onReview,
}: RelationshipEvidenceDrawerProps) {
  if (!relationship) return null;

  const isVerified = relationship.status === 'ACCEPTED' || relationship.status === 'CORRECTED';
  const confidencePercent = Math.round(relationship.confidence * 100);

  return (
    <div className="absolute top-4 right-4 z-20 w-96 max-h-[90vh] overflow-y-auto rounded-2xl bg-[#111420]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-white p-5 animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">RELATIONSHIP EVIDENCE</div>
            <h3 className="text-xs font-black text-white font-mono">{relationship.type}</h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Connected Entities Banner */}
      <div className="mt-4 p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="text-[9px] font-mono text-blue-400 font-bold uppercase">{sourceEntity?.type || 'SOURCE'}</span>
          <div className="text-xs font-bold text-white truncate" title={sourceEntity?.label}>
            {sourceEntity?.label || relationship.source}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center px-1 shrink-0">
          <ArrowRight className="w-4 h-4 text-emerald-400" />
          <span className="text-[8px] font-mono font-bold text-emerald-400 uppercase mt-0.5">{relationship.type}</span>
        </div>

        <div className="min-w-0 flex-1 text-right">
          <span className="text-[9px] font-mono text-purple-400 font-bold uppercase">{targetEntity?.type || 'TARGET'}</span>
          <div className="text-xs font-bold text-white truncate" title={targetEntity?.label}>
            {targetEntity?.label || relationship.target}
          </div>
        </div>
      </div>

      {/* Confidence & Status Meter */}
      <div className="mt-4 p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Investigative Confidence</span>
          <span className="font-mono font-black text-emerald-400">{confidencePercent}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              confidencePercent >= 80 ? 'bg-emerald-500' : confidencePercent >= 60 ? 'bg-blue-500' : 'bg-amber-500'
            }`}
            style={{ width: `${confidencePercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] pt-1">
          <span className="text-slate-400">Verification Status</span>
          {isVerified ? (
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 text-[10px]">
              ACCEPTED AS FACT
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 text-[10px]">
              UNREVIEWED CANDIDATE
            </span>
          )}
        </div>
      </div>

      {/* Source Evidence Text Snippet */}
      <div className="mt-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
          <FileText className="w-3.5 h-3.5 text-blue-400" />
          <span>Source Document Snippet</span>
        </div>
        <div className="p-3 rounded-xl bg-[#090b10] border border-white/10 text-xs text-slate-300 font-serif leading-relaxed italic border-l-4 border-l-blue-500">
          "{relationship.evidenceSnippet || 'Direct transactional link extracted from case filings and surveillance logs.'}"
        </div>
      </div>

      {/* Model Provenance & Traceability */}
      <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span>Model Provenance & Extraction Trace</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
          <div>
            <div className="text-slate-500 text-[10px]">Provider / Model</div>
            <div className="font-mono text-slate-300 truncate">{relationship.modelProvenance || 'Hybrid NER Engine'}</div>
          </div>
          <div>
            <div className="text-slate-500 text-[10px]">Edge Weight Class</div>
            <div className="font-mono text-slate-300 uppercase">{relationship.weight}</div>
          </div>
        </div>
      </div>

      {/* Human In The Loop Actions */}
      <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2">
        <button
          onClick={() => onReview && onReview(relationship.id, 'ACCEPTED')}
          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
        >
          <Check className="w-4 h-4" /> Accept Link
        </button>
        <button
          onClick={() => onReview && onReview(relationship.id, 'REJECTED')}
          className="flex-1 py-2 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
        >
          <Ban className="w-4 h-4" /> Reject Link
        </button>
      </div>
    </div>
  );
}
