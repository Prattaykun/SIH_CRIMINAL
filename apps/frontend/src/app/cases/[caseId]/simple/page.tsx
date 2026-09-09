'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  surfaceCard,
  surfacePanel,
  surfaceBtnSecondary
} from '@/components/layout/surface';

export default function SimpleViewPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params?.caseId as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSimpleView() {
      try {
        const res = await api.getCaseSimple(caseId);
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load case details.');
      } finally {
        setLoading(false);
      }
    }
    if (caseId) loadSimpleView();
  }, [caseId]);

  const handleGoToDashboard = () => router.push(`/cases/${caseId}`);

  if (loading) {
    return (
      <div className="-m-5 space-y-0 sm:-m-6 lg:-m-8">
        <PageHeader badge="Simple View" title="Loading case details..." />
        <div className="flex items-center justify-center px-5 py-20">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="-m-5 space-y-0 sm:-m-6 lg:-m-8">
        <PageHeader badge="Simple View" title="Error" />
        <div className="px-5 py-10">
          <Card className={cn(surfaceCard, "p-8 text-center max-w-lg mx-auto")}>
            <p className="text-red-400 mb-6">{error || 'Simple summary is not available for this case yet.'}</p>
            <button onClick={handleGoToDashboard} className={cn(surfaceBtnSecondary)}>Back to Dashboard</button>
          </Card>
        </div>
      </div>
    );
  }

  // Group key people
  const roleGroups: Record<string, any[]> = {};
  data.key_people.forEach((p: any) => {
    if (!roleGroups[p.role]) roleGroups[p.role] = [];
    roleGroups[p.role].push(p);
  });

  return (
    <div className="-m-5 space-y-0 sm:-m-6 lg:-m-8">
      <PageHeader
        badge={`Cases / ${data.case_number || caseId} / Simple View`}
        title={`${data.title || caseId} — Case Summary`}
        description="A plain language overview of the case proceedings and insights."
        actions={
          <button type="button" onClick={handleGoToDashboard} className={cn(surfaceBtnSecondary)}>
            Back to Dashboard
          </button>
        }
      />

      <div className="space-y-6 px-5 py-6 sm:px-6 lg:px-8 max-w-5xl">
        
        {/* Case Summary */}
        <Card className={cn(surfaceCard, "p-6")}>
          <h2 className="text-white/45 text-xs font-semibold uppercase tracking-wider mb-4">Case Summary</h2>
          <p className="text-white/90 text-sm leading-relaxed">{data.summary}</p>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key Events Timeline */}
          <Card className={cn(surfaceCard, "p-6")}>
            <h2 className="text-white/45 text-xs font-semibold uppercase tracking-wider mb-6">Key Events</h2>
            <div className="relative border-l border-white/[0.12] ml-3 space-y-7">
              {data.timeline.length === 0 ? (
                <p className="text-xs text-white/35 italic pl-6 py-2">No timeline events extracted for this case yet.</p>
              ) : (
                data.timeline.map((event: any, idx: number) => (
                  <div key={idx} className="relative pl-6">
                    <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-[#0c0c0c] border-2 border-blue-500"></div>
                    <p className="text-sm text-white mb-1">{event.description}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* AI Insights */}
          <Card className={cn(surfaceCard, "p-6 bg-blue-900/10 border-blue-500/20")}>
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              <h2 className="text-blue-400 text-xs font-bold uppercase tracking-wider">AI-Generated Observations</h2>
            </div>
            <ul className="space-y-4">
              {data.ai_insights.length === 0 ? (
                <p className="text-xs text-white/35 italic">No AI insights available.</p>
              ) : (
                data.ai_insights.map((insight: string, idx: number) => (
                  <li key={idx} className="text-sm text-white/90 flex gap-3">
                    <span className="text-blue-500 font-bold">•</span>
                    <span className="leading-relaxed">{insight}</span>
                  </li>
                ))
              )}
            </ul>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key People */}
          <Card className={cn(surfaceCard, "p-6")}>
            <h2 className="text-white/45 text-xs font-semibold uppercase tracking-wider mb-6">Key People</h2>
            {Object.keys(roleGroups).length === 0 ? (
              <p className="text-xs text-white/35 italic">No key people extracted.</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(roleGroups).map(([role, people]) => (
                  <div key={role}>
                    <h3 className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-3">{role}</h3>
                    <div className="space-y-2">
                      {people.map((p, idx) => (
                        <div key={idx} className={cn(surfacePanel, "px-3 py-2 text-sm text-white/90")}>
                          {p.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Important Locations */}
          <Card className={cn(surfaceCard, "p-6")}>
            <h2 className="text-white/45 text-xs font-semibold uppercase tracking-wider mb-6">Important Locations</h2>
            {data.key_locations.length === 0 ? (
              <p className="text-xs text-white/35 italic">No important locations extracted.</p>
            ) : (
              <ul className="space-y-2">
                {data.key_locations.map((loc: string, idx: number) => (
                  <li key={idx} className={cn(surfacePanel, "px-3 py-2 flex items-center gap-3")}>
                    <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span className="text-sm text-white/90">{loc}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        
      </div>
    </div>
  );
}
