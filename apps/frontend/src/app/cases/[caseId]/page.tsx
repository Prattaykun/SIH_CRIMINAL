'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import ThreatIntelDashboard from '@/components/dashboard/ThreatIntelDashboard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  surfaceBtnDanger,
  surfaceBtnPrimary,
  surfaceBtnSecondary,
  surfaceCard,
} from '@/components/layout/surface';

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
    return (
      <div className="-m-5 space-y-0 sm:-m-6 lg:-m-8">
        <PageHeader badge="Case Dossier" title="Loading case..." />
        <div className="flex items-center justify-center px-5 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p className="text-white/45">Loading Intelligence Dossier...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!summaryData || !summaryData?.topology_preview || summaryData?.topology_preview?.node_count === 0 || !summaryData?.primary_subject) {
    return (
      <div className="-m-5 space-y-0 sm:-m-6 lg:-m-8">
        <PageHeader
          badge="Case Dossier"
          title={summaryData?.case_number || caseId}
          description="No extracted topology yet — ingest evidence to build the criminal network."
        />
        <div className="flex items-center justify-center px-5 py-10 sm:px-6 lg:px-8">
          <Card className={cn(surfaceCard, 'w-full max-w-md gap-0 p-8 text-center')}>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04]">
              <svg className="h-8 w-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
            </div>
            <h2 className="mb-2 text-xl font-bold text-white">No Evidence Ingested Yet</h2>
            <p className="mb-8 text-sm leading-relaxed text-white/45">
              Case <span className="font-mono text-white/70">{summaryData?.case_number || caseId}</span> has no extracted topological entities. Please ingest raw FIR documents or digital dossiers to extract the criminal network.
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => router.push(`/cases/${caseId}/evidence`)}
                className={cn(surfaceBtnPrimary, 'w-full py-3')}
              >
                Ingest New Evidence
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className={cn(surfaceBtnSecondary, 'w-full border-red-500/30 text-red-300 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300')}
              >
                <svg className="mr-2 inline h-4 w-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Empty Case
              </button>
            </div>
          </Card>
        </div>

        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className={cn(surfaceCard, 'w-full max-w-md gap-0 p-6')}>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-400">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">Delete Case</h3>
              <p className="mb-4 text-sm leading-relaxed text-white/70">
                Are you sure you want to permanently delete case <span className="font-mono font-semibold text-white">{summaryData?.case_number || caseId}</span>?
              </p>
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                This action permanently removes the case from the database.
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteModal(false)}
                  className={surfaceBtnSecondary}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteCase}
                  className={surfaceBtnDanger}
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
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
