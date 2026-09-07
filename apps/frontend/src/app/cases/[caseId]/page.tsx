'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { CaseResponse } from '@/types/api';
import { AreaChart, Area, ResponsiveContainer, XAxis } from 'recharts';

export default function CaseOverviewPage() {
  const { caseId } = useParams() as { caseId: string };
  const [caseData, setCaseData] = useState<CaseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const caseRes = await api.getCase(caseId);
        setCaseData(caseRes);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load case data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [caseId]);

  const handleExportReport = async () => {
    try {
      await api.exportCaseReport(caseId);
    } catch (e: unknown) {
      alert(`Export failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const trendData = [
    { time: 'T-30d', score: 40 },
    { time: 'T-20d', score: 35 },
    { time: 'T-15d', score: 55 },
    { time: 'T-10d', score: 45 },
    { time: 'T-5d', score: 75 },
    { time: 'T-2d', score: 68 },
    { time: 'Present', score: 87 }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-[#0b0d13]">
        <div className="animate-spin w-8 h-8 border-4 border-[#ff3b57] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="min-h-screen bg-[#0b0d13] p-6">
        <div className="bg-[#ff3b57]/10 border border-[#ff3b57]/30 text-[#ff3b57] p-4 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          {error || 'Case not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0b0d13] p-6 text-slate-300 font-sans h-full">
      {/* Header & Top Navigation Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-bold tracking-wide text-xl">DASHBOARD</h1>
          <span className="bg-[#141721] border border-[#212638] text-slate-400 px-3 py-1 rounded-lg text-xs font-mono">{caseData.case_number}</span>
        </div>
        <div className="flex items-center w-full md:w-auto">
          <div className="relative w-full md:w-96">
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input 
              type="text" 
              placeholder="Search entities, accounts, phone numbers..." 
              className="bg-[#141721] border border-[#212638] text-sm text-slate-300 rounded-xl pl-9 pr-4 py-2 w-full focus:outline-none focus:border-slate-500 transition-colors"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-[#141721] border border-[#212638] px-4 py-1.5 rounded-full">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white relative">
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#10b981] rounded-full border-2 border-[#141721]"></span>
                V
            </div>
            <div className="text-xs">
              <div className="text-white font-semibold leading-tight">demo_investigator</div>
              <div className="text-slate-500 leading-tight">Investigator</div>
            </div>
          </div>
        </div>
      </div>

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
              <div className="pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                  <span className="text-[#10b981] text-[10px] font-bold uppercase tracking-widest">Active Target</span>
                </div>
                <h3 className="text-white text-2xl font-bold tracking-wide">Aditya Malhotra</h3>
                <div className="text-slate-400 text-xs mt-1 mb-2 font-medium">Managing Director &bull; Syndicate Key Node</div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs">Target ID</span>
                  <span className="text-white font-mono text-sm font-semibold">{caseData.id}</span>
                  <button className="text-slate-500 hover:text-white transition-colors" title="Copy ID">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-y-5 gap-x-4 mt-8">
            <div className="flex items-center justify-between border-b border-[#212638] pb-2">
              <span className="text-slate-500 text-xs tracking-wider">Syndicate / Entity</span>
              <span className="text-white text-sm font-medium">Apex Traders Pvt Ltd</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#212638] pb-2">
              <span className="text-slate-500 text-xs tracking-wider">Jurisdiction</span>
              <span className="text-white text-sm font-medium">New Delhi (South)</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#212638] pb-2">
              <span className="text-slate-500 text-xs tracking-wider">Primary Vehicle</span>
              <span className="text-white text-sm font-medium">Hyundai Creta (HR-26-XY-9999)</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#212638] pb-2">
              <span className="text-slate-500 text-xs tracking-wider">Primary Contact</span>
              <span className="text-white text-sm font-medium font-mono">+91-98111-22222</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#212638] pb-2">
              <span className="text-slate-500 text-xs tracking-wider">Case Status</span>
              <span className="text-white text-sm font-medium">ACTIVE INVESTIGATION</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#212638] pb-2">
              <span className="text-slate-500 text-xs tracking-wider">Investigative Priority</span>
              <div className="text-[#ff3b57] text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#ff3b57] animate-pulse"></span>
                HIGH / ELEVATED
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Investigative Anomaly Score & Sparkline Chart */}
        <div className="bg-[#141721] border border-[#212638] rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">ISOLATION FOREST ANOMALY INDEX</h2>
            <div className="flex items-baseline gap-1 relative z-10">
              <span className="text-7xl font-extrabold text-[#ff3b57] tracking-tight drop-shadow-[0_0_15px_rgba(255,59,87,0.3)]">87</span>
              <span className="text-2xl text-slate-500 font-medium">/ 100</span>
            </div>
            <div className="text-[#ff3b57] font-semibold text-sm mt-1 relative z-10">High Topological &amp; Transactional Divergence</div>
          </div>
          
          <div className="absolute top-[30%] bottom-[20%] left-0 right-0 z-0 px-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff3b57" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#ff3b57" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide={false} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={5} />
                <Area type="monotone" dataKey="score" stroke="#ff3b57" strokeWidth={3} fill="url(#riskGradient)" dot={{r: 4, strokeWidth: 2, fill: '#141721', stroke: '#ff3b57'}} activeDot={{r: 6, fill: '#ff3b57', stroke: '#fff'}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-10 relative z-10 pt-4 border-t border-[#212638]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold border border-slate-600/40 text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-full tracking-wider">Model: IsolationForest-GraphTopo v2.1</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold border border-slate-600/40 text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-full tracking-wider">Baseline: Synthetic Baseline Dataset</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold border border-[#ff3b57]/40 text-[#ff3b57] bg-[#ff3b57]/10 px-2.5 py-1 rounded-full tracking-wider">Confidence: 94% (Requires Human Verification)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Tactical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Card 3: Activity Timeline */}
        <div className="bg-[#141721] border border-[#212638] rounded-2xl p-6 shadow-2xl">
          <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-6">INVESTIGATIVE TIMELINE &amp; SURVEILLANCE LOGS</h2>
          <div className="relative border-l border-slate-700 ml-3 space-y-7">
            <div className="relative pl-6">
              <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-[#141721] border-2 border-[#ff3b57]"></div>
              <div className="flex justify-between items-start mb-0.5">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[#ff3b57]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  <span className="text-sm text-white font-medium">Flagged Fund Dispersal</span>
                </div>
                <span className="text-xs text-slate-500">Recent</span>
              </div>
              <div className="text-xs text-slate-400">INR 18,00,000 via IMPS from Apex Traders (ACCT-1234567890) to Sneha Kapoor (ACCT-0987654321).</div>
            </div>
            
            <div className="relative pl-6">
              <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-[#141721] border-2 border-[#10b981]"></div>
              <div className="flex justify-between items-start mb-0.5">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <span className="text-sm text-white font-medium">Cellular Co-Location</span>
                </div>
                <span className="text-xs text-slate-500">14 Jan 2024</span>
              </div>
              <div className="text-xs text-slate-400">+91-98111-22222 &amp; +91-98333-44444 co-located at Connaught Place Tower DEL-CP-049 (19:45 IST).</div>
            </div>

            <div className="relative pl-6">
              <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-[#141721] border-2 border-[#10b981]"></div>
              <div className="flex justify-between items-start mb-0.5">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  <span className="text-sm text-white font-medium">Physical Sighting</span>
                </div>
                <span className="text-xs text-slate-500">12 Jan 2024</span>
              </div>
              <div className="text-xs text-slate-400">Subject observed driving HR-26-XY-9999 at Saket Commercial Complex carrying encrypted media.</div>
            </div>

            <div className="relative pl-6">
              <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-[#141721] border-2 border-slate-500"></div>
              <div className="flex justify-between items-start mb-0.5">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                  <span className="text-sm text-white font-medium">Entity Linkage</span>
                </div>
                <span className="text-xs text-slate-500">Historical</span>
              </div>
              <div className="text-xs text-slate-400">17 telephonic calls recorded between key suspects.</div>
            </div>
          </div>
        </div>

        {/* Card 4: Detected Anomalies Map */}
        <div className="bg-[#141721] border border-[#212638] rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
          <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">CRIMINAL SYNDICATE TOPOLOGY</h2>
          <div className="flex-1 bg-[#0b0d13] border border-[#212638] rounded-xl flex items-center justify-center relative overflow-hidden group p-4">
             <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700 via-[#0b0d13] to-[#0b0d13]"></div>
             
             {/* Map Abstraction Canvas */}
             <div className="relative w-full h-full min-h-[160px] flex items-center justify-center">
                
                <svg className="absolute w-full h-full" viewBox="0 0 200 100">
                   <path d="M40,50 L80,30 L120,70 L160,50" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="3,3"/>
                </svg>

                <div className="absolute left-[15%] top-[40%] flex flex-col items-center">
                  <div className="w-8 h-8 bg-slate-800 rounded-full border border-slate-600 shadow-[0_0_10px_#475569] flex items-center justify-center text-[10px] font-bold text-white z-10">AM</div>
                  <div className="mt-1 text-center">
                     <div className="text-[9px] text-white font-semibold">Aditya Malhotra</div>
                  </div>
                </div>

                <div className="absolute left-[35%] top-[15%] flex flex-col items-center">
                  <div className="w-8 h-8 bg-[#ff3b57]/20 rounded-full border border-[#ff3b57] shadow-[0_0_15px_#ff3b57] animate-pulse flex items-center justify-center text-[10px] font-bold text-[#ff3b57] z-10">AT</div>
                  <div className="mt-1 text-center">
                     <div className="text-[9px] text-white font-semibold">Apex Traders</div>
                  </div>
                </div>

                <div className="absolute left-[55%] bottom-[15%] flex flex-col items-center">
                  <div className="w-8 h-8 bg-slate-800 rounded-full border border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-300 z-10">CB</div>
                  <div className="mt-1 text-center">
                     <div className="text-[9px] text-white font-semibold">City Bank</div>
                  </div>
                </div>
                
                <div className="absolute right-[15%] top-[40%] flex flex-col items-center">
                  <div className="w-8 h-8 bg-slate-800 rounded-full border border-slate-600 flex items-center justify-center text-[10px] font-bold text-white z-10">SK</div>
                  <div className="mt-1 text-center">
                     <div className="text-[9px] text-white font-semibold">Sneha Kapoor</div>
                  </div>
                </div>
             </div>
          </div>
          <Link href={`/cases/${caseId}/graph`} className="mt-4 block w-full text-center text-xs font-semibold text-white bg-[#1b1f2e] hover:bg-[#252a3d] border border-[#2e354f] py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2">
            Open Interactive Network Graph &rarr;
          </Link>
        </div>

        {/* Card 5: Linked Accounts */}
        <div className="bg-[#141721] border border-[#212638] rounded-2xl p-6 shadow-2xl">
          <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-5">LINKED ASSETS &amp; CO-OFFENDERS</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1b1f2e] rounded-lg text-slate-400 border border-[#212638]">🏢</div>
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors cursor-pointer">Apex Traders Pvt Ltd</div>
                  <div className="text-[11px] text-slate-500">Corporate Entity</div>
                </div>
              </div>
              <span className="text-[#ff3b57] text-[10px] font-bold uppercase tracking-wider">Flagged Hub</span>
            </div>
            
            <div className="w-full h-px bg-[#212638]"></div>

            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1b1f2e] rounded-lg text-slate-400 border border-[#212638]">💳</div>
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors cursor-pointer">ACCT-1234567890 (City Bank)</div>
                  <div className="text-[11px] text-slate-500 font-mono">Funnel Account</div>
                </div>
              </div>
              <span className="text-[#ff3b57] text-[10px] font-bold uppercase tracking-wider">High Volume</span>
            </div>

            <div className="w-full h-px bg-[#212638]"></div>

            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1b1f2e] rounded-lg text-slate-400 border border-[#212638]">🚘</div>
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors cursor-pointer">Hyundai Creta (HR-26-XY-9999)</div>
                  <div className="text-[11px] text-slate-500 font-mono">Tracked Vehicle</div>
                </div>
              </div>
              <span className="text-[#10b981] text-[10px] font-bold uppercase tracking-wider">Verified</span>
            </div>
            
            <div className="w-full h-px bg-[#212638]"></div>

            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1b1f2e] rounded-lg text-slate-400 border border-[#212638]">📱</div>
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors cursor-pointer">+91-98111-22222</div>
                  <div className="text-[11px] text-slate-500 font-mono">Primary Phone</div>
                </div>
              </div>
              <span className="text-[#10b981] text-[10px] font-bold uppercase tracking-wider">24 Linked Calls</span>
            </div>
            
            <div className="w-full h-px bg-[#212638]"></div>

            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1b1f2e] rounded-lg text-slate-400 border border-[#212638]">👤</div>
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors cursor-pointer">Sneha Kapoor</div>
                  <div className="text-[11px] text-slate-500 font-mono">Key Associate / Co-Signatory</div>
                </div>
              </div>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Suspect</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Decision & Action Toolbar */}
      <div className="bg-[#141721] border border-[#212638] rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm w-full md:w-auto">
             <div className="w-10 h-10 rounded-full border-2 border-[#ff3b57] flex items-center justify-center text-[#ff3b57] shrink-0 bg-[#ff3b57]/10">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
             </div>
             <div className="text-slate-300">
               <span className="block text-white font-medium">Multiple high-risk indicators detected.</span>
               <span className="text-slate-400">Select an action to proceed with this case.</span>
             </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <Link href={`/cases/${caseId}/evidence#upload`} className="flex-1 md:flex-none bg-[#1b1f2e] hover:bg-[#252a3d] border border-[#2e354f] text-slate-300 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex justify-center items-center gap-2">
              Ingest New Evidence
            </Link>
            <Link href={`/cases/${caseId}/evidence`} className="flex-1 md:flex-none bg-[#1b1f2e] hover:bg-[#252a3d] border border-[#2e354f] text-slate-300 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex justify-center items-center gap-2">
              Review Extracted Leads
            </Link>
            <button onClick={handleExportReport} className="flex-1 md:flex-none bg-[#10b981]/10 hover:bg-[#10b981]/20 border border-[#10b981]/30 text-[#10b981] px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex justify-center items-center gap-2">
              Export Intelligence Dossier (HTML)
            </button>
            <button className="flex-1 md:flex-none bg-[#ff3b57] hover:bg-[#e02d47] text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(255,59,87,0.3)] transition-colors flex justify-center items-center gap-2">
              Escalate Case &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
