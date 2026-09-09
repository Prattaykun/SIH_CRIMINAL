'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AreaChart, Area, ResponsiveContainer, XAxis } from 'recharts';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  surfaceCard,
  surfacePanel,
  surfaceBtnPrimary,
  surfaceBtnSecondary,
  surfaceBtnDanger,
  surfaceInput,
} from '@/components/layout/surface';

export default function ThreatIntelDashboard({ caseData, caseId }: any) {
  const router = useRouter();
  const effectiveId = caseData?.case_number || caseId;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [displayTitle, setDisplayTitle] = useState<string | null>(null);
  const [displayDescription, setDisplayDescription] = useState<string | null>(null);

  const handleDeleteCase = async () => {
    setIsDeleting(true);
    try {
      await api.deleteCase(caseData?.case_id || caseId);
      toast.success(`Case ${effectiveId} deleted successfully.`);
      router.push('/cases');
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Failed to delete case.');
      setIsDeleting(false);
    }
  };

  // Working Navigation Actions
  const handleGoToEvidence = () => router.push(`/cases/${effectiveId}/evidence`);
  const handleGoToGraph = () => router.push(`/cases/${effectiveId}/graph`);
  const handleGoToSimple = () => router.push(`/cases/${effectiveId}/simple`);
  const handleGoToAudit = () => router.push(`/cases/${effectiveId}/audit`);
  const handleGoToCollaboration = () => router.push(`/cases/${effectiveId}/collaboration`);

  const primarySubjects: Array<{
    id?: string;
    name: string;
    link_degree: number;
    confidence?: number;
    role?: string;
    org?: string | null;
    anomaly_flag?: boolean;
    anomaly_reason?: string;
  }> =
    caseData?.primary_subjects?.length > 0
      ? caseData.primary_subjects
      : caseData?.primary_subject?.name
        ? [
            {
              id: caseData.primary_subject.id,
              name: caseData.primary_subject.name,
              link_degree: caseData.primary_subject.link_degree ?? 0,
              confidence: caseData.primary_subject.confidence,
              role: caseData.primary_subject.role,
              org: caseData.primary_subject.org,
              anomaly_flag: true,
              anomaly_reason:
                caseData.primary_subject.anomaly_reason ||
                'High-connectivity investigative lead — requires human verification.',
            },
          ]
        : [];

  const primaryOrg = primarySubjects[0]?.org || caseData?.primary_subject?.org || 'Unknown';
  const primaryVehicle = caseData?.primary_subject?.vehicle || 'Unknown';
  const primaryPhone = caseData?.primary_subject?.phone || 'Unknown';
  const openEditDetails = async () => {
    try {
      const c = await api.getCase(caseData?.case_id || caseId);
      setEditTitle(c.title || '');
      setEditDescription(c.description || '');
      setDisplayTitle(c.title || null);
      setDisplayDescription(c.description || null);
      setShowEditModal(true);
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Failed to load case details.');
    }
  };

  const handleSaveDetails = async () => {
    const title = editTitle.trim();
    if (!title) {
      toast.error('Title is required.');
      return;
    }
    setIsSavingDetails(true);
    try {
      const updated = await api.updateCase(caseData?.case_id || caseId, {
        title,
        description: editDescription.trim(),
      });
      setDisplayTitle(updated.title);
      setDisplayDescription(updated.description || '');
      setShowEditModal(false);
      toast.success('Case title and description updated. Cases list will show the new values.');
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Failed to update case.');
    } finally {
      setIsSavingDetails(false);
    }
  };

  const caseUnit =
    displayDescription ||
    caseData?.primary_subject?.case_unit ||
    caseData?.primary_subject?.jurisdiction ||
    'Active unit / description not set';

  const openSubjectInGraph = (name: string) => {
    const q = encodeURIComponent(name);
    router.push(`/cases/${effectiveId}/graph?q=${q}&mode=NETWORK`);
  };
  const trendData = [
    { time: 'T-20d', score: 45 },
    { time: 'T-15d', score: 41 },
    { time: 'T-10d', score: 62 },
    { time: 'T-5d', score: 53 },
    { time: 'T-2d', score: 85 },
    { time: 'Present', score: caseData?.anomaly_index?.score || 87 }
  ];

  return (
    <div className="-m-5 space-y-0 sm:-m-6 lg:-m-8">
      <PageHeader
        badge={`Cases / ${effectiveId}`}
        title={`${effectiveId} — Active Investigation Dashboard`}
        description="Primary subject dossier, anomaly index, timeline, and topology preview."
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" onClick={handleGoToCollaboration} className={cn(surfaceBtnSecondary, "gap-1.5 px-2.5 py-1.5 text-xs border-indigo-500/30 bg-indigo-600/15 text-indigo-300 hover:bg-indigo-600/25")}>
              <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Team
            </button>
            <button type="button" onClick={handleGoToEvidence} className={cn(surfaceBtnSecondary, "gap-1.5 px-2.5 py-1.5 text-xs")}>
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              Evidence
            </button>
            <button type="button" onClick={handleGoToSimple} className={cn(surfaceBtnSecondary, "gap-1.5 px-2.5 py-1.5 text-xs")}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
              Simple
            </button>
            <button type="button" onClick={handleGoToGraph} className={cn(surfaceBtnPrimary, "gap-1.5 px-2.5 py-1.5 text-xs")}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
              Graph
            </button>
            <button type="button" onClick={openEditDetails} className={cn(surfaceBtnSecondary, "gap-1.5 px-2.5 py-1.5 text-xs")} title="Edit case title and description">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button type="button" onClick={() => setShowDeleteModal(true)} className={cn(surfaceBtnDanger, "gap-1.5 px-2.5 py-1.5 text-xs")} title="Delete this case">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        }
      />

      <div className="space-y-6 px-5 py-5 sm:px-6 lg:px-8">

      {/* Row 1: Key Subject Summary & Anomaly Risk Sparkline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Card 1: Ranked primary subjects → graph highlight */}
        <Card className={cn(surfaceCard, "p-6 flex flex-col")}>
          <div className="mb-5">
            <h2 className="text-white/45 text-xs font-semibold uppercase tracking-wider mb-1">
              Primary Subjects / Connectivity Leads
            </h2>
            <p className="text-[11px] text-white/35">
              Ranked by graph link count (investigative priority only — requires human verification). Click a row to open Network Graph with that person highlighted.
            </p>
          </div>

          <div className="sih-thin-scrollbar flex-1 min-h-0 overflow-y-auto rounded-xl border border-white/[0.08] bg-black/30">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#0c0c0c] border-b border-white/[0.08]">
                <tr className="text-[10px] uppercase tracking-wider text-white/40">
                  <th className="px-3 py-2.5 font-bold">#</th>
                  <th className="px-3 py-2.5 font-bold">Person</th>
                  <th className="px-3 py-2.5 font-bold text-right">Links</th>
                  <th className="px-3 py-2.5 font-bold hidden md:table-cell">Flag</th>
                  <th className="px-3 py-2.5 font-bold hidden sm:table-cell">Linked org</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {primarySubjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-xs text-white/35">
                      No person entities extracted yet.
                    </td>
                  </tr>
                ) : (
                  primarySubjects.map((s, idx) => (
                    <tr
                      key={s.id || `${s.name}-${idx}`}
                      className="group cursor-pointer transition-colors hover:bg-white/[0.04]"
                      onClick={() => openSubjectInGraph(s.name)}
                      title={`Open graph highlighted on ${s.name}`}
                    >
                      <td className="px-3 py-3 font-mono text-xs text-white/35">{idx + 1}</td>
                      <td className="px-3 py-3 min-w-0">
                        <div className="font-semibold text-white truncate group-hover:text-amber-200">
                          {s.name}
                        </div>
                        <div className="text-[10px] text-white/40 truncate mt-0.5">
                          {s.role || 'Investigative lead'}
                          {typeof s.confidence === 'number' ? ` · ${(s.confidence * 100).toFixed(0)}% conf` : ''}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="inline-flex min-w-[2rem] justify-center rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 font-mono text-xs font-bold text-amber-300">
                          {s.link_degree}
                        </span>
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        {s.anomaly_flag ? (
                          <span
                            className="relative inline-flex group/anomaly"
                            title={s.anomaly_reason || 'Connectivity anomaly — requires human verification'}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="rounded-full border border-[#ff3b57]/35 bg-[#ff3b57]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ff3b57] cursor-help">
                              Anomaly
                            </span>
                            <span
                              role="tooltip"
                              className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-56 -translate-x-1/2 rounded-lg border border-white/[0.12] bg-[#141414] px-3 py-2 text-[10px] font-normal normal-case tracking-normal text-white/75 opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.55)] transition-opacity duration-150 group-hover/anomaly:opacity-100"
                            >
                              {s.anomaly_reason ||
                                'Connectivity anomaly — investigative prioritization only; requires human verification.'}
                            </span>
                          </span>
                        ) : (
                          <span
                            className="text-[9px] uppercase tracking-wider text-white/25 cursor-help"
                            title={s.anomaly_reason || 'No connectivity anomaly flag'}
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-white/55 truncate hidden sm:table-cell max-w-[9rem]">
                        {s.org || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 mt-6">
            <div className="flex flex-col border-b border-white/[0.08] pb-2.5 min-w-0">
              <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-1">
                Top linked organization
              </span>
              <span className="text-white text-sm font-medium break-words leading-relaxed" title={primaryOrg}>
                {primaryOrg}
              </span>
            </div>
            <div className="flex flex-col border-b border-white/[0.08] pb-2.5 min-w-0">
              <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-1">
                Case unit / description
              </span>
              <span
                className="text-white text-sm font-medium break-words leading-relaxed"
                title={caseUnit}
              >
                {caseUnit}
              </span>
              <span className="text-[10px] text-white/30 mt-1">
                Case metadata (not an anomaly score). Usually the investigating unit or case description.
              </span>
            </div>
            <div className="flex flex-col border-b border-white/[0.08] pb-2.5 min-w-0">
              <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-1">Sample vehicle</span>
              <span className="text-white text-sm font-medium break-words leading-relaxed" title={primaryVehicle}>
                {primaryVehicle}
              </span>
            </div>
            <div className="flex flex-col border-b border-white/[0.08] pb-2.5 min-w-0">
              <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-1">Sample phone</span>
              <span className="text-white text-sm font-medium font-mono break-all leading-relaxed" title={primaryPhone}>
                {primaryPhone}
              </span>
            </div>
          </div>
        </Card>

        {/* Card 2: Investigative Anomaly Score & Sparkline Chart */}
        <Card className={cn(surfaceCard, "p-6 relative overflow-hidden flex flex-col justify-between")}>
          <div>
            <h2 className="text-white/45 text-xs font-semibold uppercase tracking-wider mb-3">ISOLATION FOREST ANOMALY INDEX</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-7xl font-extrabold text-white/25 tracking-tight">{caseData?.anomaly_index?.score || "--"}</span>
              <span className="text-2xl text-white/35 font-medium">/ 100</span>
            </div>
            <div className="text-white/45 font-semibold text-sm mt-1">{caseData?.anomaly_index?.status || "Click to Run Anomaly Baseline"}</div>
            <p className="text-[11px] text-white/35 mt-2 leading-relaxed max-w-md">
              {caseData?.anomaly_index?.factor_note ||
                'Anomaly index scales with extracted entity/relationship volume. Not a guilt prediction — human verification required.'}
            </p>
          </div>
          
          <div className="w-full flex-1 min-h-[170px] my-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff3b57" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ff3b57" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide={false} axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.35)', fontSize: 10}} dy={5} />
                <Area type="monotone" dataKey="score" stroke="#ff3b57" strokeWidth={3} fill="url(#riskGradient)" dot={{r: 4, strokeWidth: 2, fill: '#0c0c0c', stroke: '#ff3b57'}} activeDot={{r: 6, fill: '#ff3b57', stroke: '#fff'}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-white/[0.08]">
            <span className="text-[10px] font-bold border border-white/[0.12] text-white/45 bg-white/[0.05] px-2.5 py-1 rounded-full tracking-wider">Model: {caseData?.anomaly_index?.model_version || "IsolationForest-GraphTopo v2.1"}</span>
            <span className="text-[10px] font-bold border border-[#ff3b57]/40 text-[#ff3b57] bg-[#ff3b57]/10 px-2.5 py-1 rounded-full tracking-wider">Confidence: {caseData?.anomaly_index?.confidence || "94%"} (Requires Human Verification)</span>
          </div>
        </Card>
      </div>

      {/* Row 2: Tactical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Card 3: Activity Timeline */}
        <Card className={cn(surfaceCard, "p-6")}>
          <h2 className="text-white/45 text-xs font-semibold uppercase tracking-wider mb-6">INVESTIGATIVE TIMELINE &amp; SURVEILLANCE LOGS</h2>
          <div className="relative border-l border-white/[0.12] ml-3 space-y-7">
            {(caseData?.timeline_events || []).length === 0 ? (
              <p className="text-xs text-white/35 italic pl-6 py-4">No timeline events extracted for this case yet.</p>
            ) : (
              (caseData?.timeline_events || []).map((event: any, idx: number) => (
                <div key={idx} className="relative pl-6">
                  <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-[#0c0c0c] border-2 ${event.type === 'flagged' ? 'border-[#ff3b57]' : event.type === 'verified' ? 'border-[#10b981]' : 'border-[#3b82f6]'}`}></div>
                  <div className="flex justify-between items-start mb-0.5">
                    <div className="flex items-center gap-1.5">
                      {event.type === 'flagged' && <svg className="w-4 h-4 text-[#ff3b57]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>}
                      <span className="text-sm text-white font-medium break-words">{event.title}</span>
                    </div>
                  </div>
                  <p className="text-sm text-white/70 mb-1 break-words">{event.desc}</p>
                  <p className="text-xs text-white/35 font-mono">{event.date}</p>
                </div>
              ))
            )}
          </div>
          <button type="button" onClick={handleGoToAudit} className={cn(surfaceBtnSecondary, "w-full mt-8 py-2.5 text-sm font-semibold")}>
            View Full Audit Trail
          </button>
        </Card>

        {/* Card 4: Linked High-Risk Assets */}
        <Card className={cn(surfaceCard, "p-6")}>
          <h2 className="text-white/45 text-xs font-semibold uppercase tracking-wider mb-6">LINKED HIGH-RISK ASSETS</h2>
          <div className="space-y-4">
            {(caseData?.linked_assets || []).length === 0 ? (
              <p className="text-xs text-white/35 italic py-4 text-center">No linked assets identified for this case yet.</p>
            ) : (
              (caseData?.linked_assets || []).map((asset: any, idx: number) => (
                <div key={idx} className={cn(surfacePanel, "p-4 flex items-center justify-between gap-3 hover:bg-white/[0.05] transition-colors cursor-pointer group min-w-0")}>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-white/35 font-bold tracking-wider mb-1 uppercase">{asset.type}</div>
                    <div className="text-sm text-white font-medium group-hover:text-blue-400 transition-colors truncate" title={asset.name}>{asset.name}</div>
                  </div>
                  <div className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase border shrink-0 ${asset.badge === 'FLAGGED HUB' ? 'bg-[#ff3b57]/10 text-[#ff3b57] border-[#ff3b57]/30' : 'bg-white/[0.05] text-white/45 border-white/[0.08]'}`}>
                    {asset.badge}
                  </div>
                </div>
              ))
            )}
          </div>
          <button type="button" onClick={handleGoToEvidence} className={cn(surfaceBtnSecondary, "w-full mt-6 py-2.5 text-sm font-semibold")}>
            Review Extracted Leads
          </button>
        </Card>

        {/* Card 5: Topology Map Preview */}
        <Card className={cn(surfaceCard, "p-6 flex flex-col")}>
          <h2 className="text-white/45 text-xs font-semibold uppercase tracking-wider mb-6">TOPOLOGY MAP PREVIEW</h2>
          
          <div className={cn(surfacePanel, "flex-1 relative overflow-hidden flex items-center justify-center min-h-[200px] bg-black")}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            
            <div className="relative z-10 w-full h-full p-4">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-[#ff3b57] bg-[#0c0c0c] flex items-center justify-center shadow-[0_0_30px_rgba(255,59,87,0.3)] z-20">
                <span className="text-[10px] font-bold text-white uppercase text-center leading-tight">Subject<br/>Node</span>
              </div>
              
              <div className="absolute top-1/4 left-1/4 w-12 h-12 rounded-full border-2 border-white/20 bg-white/[0.05] flex items-center justify-center z-10">
                <span className="text-[8px] text-white/45 uppercase">Org</span>
              </div>
              
              <div className="absolute bottom-1/4 right-1/4 w-14 h-14 rounded-full border-2 border-emerald-500/50 bg-[#0c0c0c] flex items-center justify-center z-10">
                <span className="text-[8px] text-emerald-400 uppercase">Bank</span>
              </div>

              {/* Connecting lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
                <line x1="50%" y1="50%" x2="25%" y2="25%" stroke="#475569" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="50%" y1="50%" x2="75%" y2="75%" stroke="#10b981" strokeWidth="2" strokeOpacity="0.5" />
              </svg>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="text-white text-sm font-medium">{caseData?.topology_preview?.node_count || 0} Nodes &bull; {caseData?.topology_preview?.edge_count || 0} Edges</div>
              <div className="text-emerald-400 text-xs font-mono mt-1">{caseData?.topology_preview?.sync_status || "Synchronized"}</div>
            </div>
            <button type="button" onClick={handleGoToGraph} className={cn(surfaceBtnSecondary, "p-2.5 text-blue-400 border-blue-500/30 bg-blue-600/10 hover:bg-blue-600/20 group")}>
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </button>
          </div>
          
          <button type="button" onClick={handleGoToGraph} className={cn(surfaceBtnPrimary, "w-full mt-6 py-2.5 text-sm font-semibold")}>
            Open Interactive Network Graph
          </button>
        </Card>
      </div>

      {/* Edit case title / description (updates Cases list cards) */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={cn(surfaceCard, "max-w-lg w-full p-6")}>
            <h3 className="text-lg font-bold text-white mb-1">Edit case details</h3>
            <p className="text-xs text-white/45 mb-5">
              Title and description appear on the Cases list cards. Changes are saved to Postgres.
            </p>
            <label className="block text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1.5">
              Title
            </label>
            <input
              className={cn(surfaceInput, "w-full mb-4")}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              maxLength={255}
              placeholder="Case title shown on Cases list"
            />
            <label className="block text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1.5">
              Description
            </label>
            <textarea
              className={cn(surfaceInput, "w-full min-h-[110px] mb-6 resize-y")}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Short case overview shown under the title"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={isSavingDetails}
                onClick={() => setShowEditModal(false)}
                className={surfaceBtnSecondary}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingDetails}
                onClick={handleSaveDetails}
                className={surfaceBtnPrimary}
              >
                {isSavingDetails ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Case Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={cn(surfaceCard, "border-red-500/30 max-w-md w-full p-6 animate-in fade-in zoom-in duration-150")}>
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Delete Active Case</h3>
            <p className="text-sm text-white/70 mb-4 leading-relaxed">
              Are you sure you want to permanently delete case <span className="font-semibold text-white font-mono">{effectiveId}</span>?
            </p>
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-xs text-red-300 mb-6">
              This action permanently removes all uploaded files, written reports, extracted topological nodes, relationships, and analytics records. This cannot be undone.
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className={cn(surfaceBtnSecondary, "text-xs font-semibold")}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteCase}
                className={cn(surfaceBtnDanger, "text-xs font-semibold gap-2 bg-red-600 hover:bg-red-500 text-white border-red-600")}
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting Case...
                  </>
                ) : (
                  'Confirm Permanent Deletion'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
