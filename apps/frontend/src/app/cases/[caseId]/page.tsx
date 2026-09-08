'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import ThreatIntelDashboard from '@/components/dashboard/ThreatIntelDashboard';

export default function CaseOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params?.caseId as string;
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      try {
        const res = await api.getCaseSummary(caseId);
        setSummaryData(res);
      } catch (err) {
        console.error('Failed to load case summary:', err);
      } finally {
        setLoading(false);
      }
    }
    if (caseId) loadSummary();
  }, [caseId]);

  if (loading) {
    return <div className="min-h-screen bg-[#0b0d13] flex items-center justify-center text-white">Loading Intelligence Dossier...</div>;
  }

  // Ensure an empty state is shown if there's no topology preview yet (0 nodes)
  if (summaryData?.topology_preview?.node_count === 0) {
    return (
      <div className="min-h-screen bg-[#0b0d13] p-4 lg:p-8 flex items-center justify-center font-sans">
        <div className="max-w-md w-full bg-[#141721] border border-[#212638] rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Evidence Ingested Yet</h2>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">
            Case <span className="text-slate-300 font-mono">{caseId}</span> has no extracted topological entities. Please ingest raw FIR documents or digital dossiers to extract the criminal network.
          </p>
          <button
            onClick={() => router.push(`/cases/${caseId}/evidence`)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-900/20"
          >
            Ingest New Evidence
          </button>
        </div>
      </div>
    );
  }

  return <ThreatIntelDashboard caseData={summaryData} caseId={caseId} />;
}
