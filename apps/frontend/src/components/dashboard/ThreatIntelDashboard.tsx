'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AreaChart, Area, ResponsiveContainer, XAxis } from 'recharts';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function ThreatIntelDashboard({ caseData, caseId }: any) {
  const router = useRouter();
  const effectiveId = caseData?.case_number || caseId;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
  const handleGoToAudit = () => router.push(`/cases/${effectiveId}/audit`);
  const handleGoToCollaboration = () => router.push(`/cases/${effectiveId}/collaboration`);

  const primarySubject = caseData?.primary_subject?.name || "Unknown";
  const primaryOrg = caseData?.primary_subject?.org || "Unknown";
  const primaryVehicle = caseData?.primary_subject?.vehicle || "Unknown";
  const primaryPhone = caseData?.primary_subject?.phone || "Unknown";

  const trendData = [
    { time: 'T-20d', score: 45 },
    { time: 'T-15d', score: 41 },
    { time: 'T-10d', score: 62 },
    { time: 'T-5d', score: 53 },
    { time: 'T-2d', score: 85 },
    { time: 'Present', score: caseData?.anomaly_index?.score || 87 }
  ];

  return (
    <div className="min-h-screen bg-[#0b0d13] p-4 lg:p-8 font-sans">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <span className="hover:text-white cursor-pointer transition-colors" onClick={() => router.push('/cases')}>Cases</span>
            <span>/</span>
            <span className="text-white font-medium">{effectiveId}</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Active Investigation Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleGoToCollaboration} className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg text-sm font-medium transition-colors border border-indigo-500/30 shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Team &amp; Tasks
          </button>
          <button onClick={handleGoToEvidence} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700 shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Evidence &amp; Ingest
          </button>
          <button onClick={handleGoToGraph} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-blue-900/20 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
            Network Graph
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/30 flex items-center gap-1.5 shadow-sm"
            title="Delete this case"
          >
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Case
          </button>
        </div>
      </header>

      {/* Row 1: Key Subject Summary & Anomaly Risk Sparkline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Card 1: Key Subject & Case Metadata */}
        <div className="bg-[#141721] border border-[#212638] rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-6">PRIMARY SUBJECT / DOSSIER SUMMARY</h2>
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-full bg-slate-800 overflow-hidden relative border border-[#212638] shrink-0">
                <div className="w-full h-full flex items-center justify-center text-slate-600 text-3xl">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
              </div>
              <div className="pt-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                  <span className="text-[#10b981] text-[10px] font-bold uppercase tracking-widest">Active Target</span>
                </div>
                <h3 className="text-white text-2xl font-bold tracking-wide truncate max-w-sm" title={primarySubject}>{primarySubject}</h3>
                <div className="text-slate-400 text-xs mt-1 mb-2 font-medium truncate" title={caseData?.primary_subject?.role || "Subject of Interest - Network Key Node"}>
                  {caseData?.primary_subject?.role || "Subject of Interest - Network Key Node"}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs shrink-0">Target ID</span>
                  <span className="text-white font-mono text-sm font-semibold truncate">{caseData?.case_id || caseId}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 mt-8">
            <div className="flex items-center justify-between border-b border-[#212638] pb-2 min-w-0 gap-3">
              <span className="text-slate-500 text-xs tracking-wider shrink-0">Syndicate / Entity</span>
              <span className="text-white text-sm font-medium truncate text-right" title={primaryOrg}>{primaryOrg}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#212638] pb-2 min-w-0 gap-3">
              <span className="text-slate-500 text-xs tracking-wider shrink-0">Jurisdiction</span>
              <span className="text-white text-sm font-medium truncate text-right" title={caseData?.primary_subject?.jurisdiction || "Unknown"}>{caseData?.primary_subject?.jurisdiction || "Unknown"}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#212638] pb-2 min-w-0 gap-3">
              <span className="text-slate-500 text-xs tracking-wider shrink-0">Primary Vehicle</span>
              <span className="text-white text-sm font-medium truncate text-right" title={primaryVehicle}>{primaryVehicle}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#212638] pb-2 min-w-0 gap-3">
              <span className="text-slate-500 text-xs tracking-wider shrink-0">Primary Contact</span>
              <span className="text-white text-sm font-medium font-mono truncate text-right" title={primaryPhone}>{primaryPhone}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#212638] pb-2 min-w-0 gap-3">
              <span className="text-slate-500 text-xs tracking-wider shrink-0">Case Status</span>
              <span className="text-white text-sm font-medium shrink-0 text-right">ACTIVE INVESTIGATION</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#212638] pb-2 min-w-0 gap-3">
              <span className="text-slate-500 text-xs tracking-wider shrink-0">Investigative Priority</span>
              <div className="text-[#ff3b57] text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider shrink-0 text-right">
                <span className="w-2 h-2 rounded-full bg-[#ff3b57] animate-pulse"></span>
                {caseData?.primary_subject?.priority || "HIGH / ELEVATED"}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Investigative Anomaly Score & Sparkline Chart */}
        <div className="bg-[#141721] border border-[#212638] rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">ISOLATION FOREST ANOMALY INDEX</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-7xl font-extrabold text-slate-600 tracking-tight">{caseData?.anomaly_index?.score || "--"}</span>
              <span className="text-2xl text-slate-500 font-medium">/ 100</span>
            </div>
            <div className="text-slate-400 font-semibold text-sm mt-1">{caseData?.anomaly_index?.status || "Click to Run Anomaly Baseline"}</div>
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
                <XAxis dataKey="time" hide={false} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={5} />
                <Area type="monotone" dataKey="score" stroke="#ff3b57" strokeWidth={3} fill="url(#riskGradient)" dot={{r: 4, strokeWidth: 2, fill: '#141721', stroke: '#ff3b57'}} activeDot={{r: 6, fill: '#ff3b57', stroke: '#fff'}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[#212638]">
            <span className="text-[10px] font-bold border border-slate-600/40 text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-full tracking-wider">Model: {caseData?.anomaly_index?.model_version || "IsolationForest-GraphTopo v2.1"}</span>
            <span className="text-[10px] font-bold border border-[#ff3b57]/40 text-[#ff3b57] bg-[#ff3b57]/10 px-2.5 py-1 rounded-full tracking-wider">Confidence: {caseData?.anomaly_index?.confidence || "94%"} (Requires Human Verification)</span>
          </div>
        </div>
      </div>

      {/* Row 2: Tactical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Card 3: Activity Timeline */}
        <div className="bg-[#141721] border border-[#212638] rounded-2xl p-6 shadow-2xl">
          <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-6">INVESTIGATIVE TIMELINE &amp; SURVEILLANCE LOGS</h2>
          <div className="relative border-l border-slate-700 ml-3 space-y-7">
            {(caseData?.timeline_events || []).length === 0 ? (
              <p className="text-xs text-slate-500 italic pl-6 py-4">No timeline events extracted for this case yet.</p>
            ) : (
              (caseData?.timeline_events || []).map((event: any, idx: number) => (
                <div key={idx} className="relative pl-6">
                  <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-[#141721] border-2 ${event.type === 'flagged' ? 'border-[#ff3b57]' : event.type === 'verified' ? 'border-[#10b981]' : 'border-[#3b82f6]'}`}></div>
                  <div className="flex justify-between items-start mb-0.5">
                    <div className="flex items-center gap-1.5">
                      {event.type === 'flagged' && <svg className="w-4 h-4 text-[#ff3b57]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>}
                      <span className="text-sm text-white font-medium break-words">{event.title}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 mb-1 break-words">{event.desc}</p>
                  <p className="text-xs text-slate-500 font-mono">{event.date}</p>
                </div>
              ))
            )}
          </div>
          <button onClick={handleGoToAudit} className="w-full mt-8 py-2.5 bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-sm font-semibold rounded-lg border border-slate-700 transition-colors">
            View Full Audit Trail
          </button>
        </div>

        {/* Card 4: Linked High-Risk Assets */}
        <div className="bg-[#141721] border border-[#212638] rounded-2xl p-6 shadow-2xl">
          <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-6">LINKED HIGH-RISK ASSETS</h2>
          <div className="space-y-4">
            {(caseData?.linked_assets || []).length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">No linked assets identified for this case yet.</p>
            ) : (
              (caseData?.linked_assets || []).map((asset: any, idx: number) => (
                <div key={idx} className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-800 transition-colors cursor-pointer group min-w-0">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-slate-500 font-bold tracking-wider mb-1 uppercase">{asset.type}</div>
                    <div className="text-sm text-white font-medium group-hover:text-blue-400 transition-colors truncate" title={asset.name}>{asset.name}</div>
                  </div>
                  <div className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase border shrink-0 ${asset.badge === 'FLAGGED HUB' ? 'bg-[#ff3b57]/10 text-[#ff3b57] border-[#ff3b57]/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                    {asset.badge}
                  </div>
                </div>
              ))
            )}
          </div>
          <button onClick={handleGoToEvidence} className="w-full mt-6 py-2.5 bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-sm font-semibold rounded-lg border border-slate-700 transition-colors">
            Review Extracted Leads
          </button>
        </div>

        {/* Card 5: Topology Map Preview */}
        <div className="bg-[#141721] border border-[#212638] rounded-2xl p-6 shadow-2xl flex flex-col">
          <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-6">TOPOLOGY MAP PREVIEW</h2>
          
          <div className="flex-1 border border-slate-800 rounded-xl bg-[#0b0d13] relative overflow-hidden flex items-center justify-center min-h-[200px]">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #334155 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            
            <div className="relative z-10 w-full h-full p-4">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-[#ff3b57] bg-[#141721] flex items-center justify-center shadow-[0_0_30px_rgba(255,59,87,0.3)] z-20">
                <span className="text-[10px] font-bold text-white uppercase text-center leading-tight">Subject<br/>Node</span>
              </div>
              
              <div className="absolute top-1/4 left-1/4 w-12 h-12 rounded-full border-2 border-slate-600 bg-slate-800 flex items-center justify-center z-10">
                <span className="text-[8px] text-slate-400 uppercase">Org</span>
              </div>
              
              <div className="absolute bottom-1/4 right-1/4 w-14 h-14 rounded-full border-2 border-emerald-500/50 bg-[#141721] flex items-center justify-center z-10">
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
            <button onClick={handleGoToGraph} className="p-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 rounded-lg transition-colors group">
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </button>
          </div>
          
          <button onClick={handleGoToGraph} className="w-full mt-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-md shadow-blue-900/20 transition-colors">
            Open Interactive Network Graph
          </button>
        </div>
      </div>

      {/* Case Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141721] border border-red-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Delete Active Case</h3>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
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
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteCase}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-red-900/30"
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
  );
}
