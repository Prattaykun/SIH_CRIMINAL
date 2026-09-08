'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import ThreatIntelDashboard from '@/components/dashboard/ThreatIntelDashboard';

export default function CaseOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params?.caseId as string;
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteCase = async () => {
    setIsDeleting(true);
    try {
      await api.deleteCase(caseId);
      toast.success('Case deleted successfully.');
      router.push('/cases');
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Failed to delete case.');
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    async function loadSummary() {
      try {
        const res = await api.getCaseSummary(caseId);
        setSummaryData(res);
      } catch (err) {
        console.warn('Failed to load case summary:', err);
      } finally {
        setLoading(false);
      }
    }
    if (caseId) loadSummary();
  }, [caseId]);

  if (loading) {
    return <div className="min-h-screen bg-[#0b0d13] flex items-center justify-center text-white">Loading Intelligence Dossier...</div>;
  }

  // Ensure an empty state is shown if there's no topology preview yet (0 nodes), or no primary subject
  if (!summaryData || !summaryData?.topology_preview || summaryData?.topology_preview?.node_count === 0 || !summaryData?.primary_subject) {
    return (
      <div className="min-h-screen bg-[#0b0d13] p-4 lg:p-8 flex items-center justify-center font-sans">
        <div className="max-w-md w-full bg-[#141721] border border-[#212638] rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Evidence Ingested Yet</h2>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">
            Case <span className="text-slate-300 font-mono">{summaryData?.case_number || caseId}</span> has no extracted topological entities. Please ingest raw FIR documents or digital dossiers to extract the criminal network.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push(`/cases/${caseId}/evidence`)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-900/20"
            >
              Ingest New Evidence
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full py-2.5 bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg text-xs font-semibold transition-colors border border-slate-700 hover:border-red-500/30 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Empty Case
            </button>
          </div>
        </div>

        {/* Delete Case Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#141721] border border-red-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Delete Case</h3>
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                Are you sure you want to permanently delete case <span className="font-semibold text-white font-mono">{summaryData?.case_number || caseId}</span>?
              </p>
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-xs text-red-300 mb-6">
                This action permanently removes the case from the database.
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
                      Deleting...
                    </>
                  ) : (
                    'Confirm Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return <ThreatIntelDashboard caseData={summaryData} caseId={caseId} />;
}
