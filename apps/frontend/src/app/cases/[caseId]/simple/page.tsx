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
  surfaceBtnSecondary,
  surfaceBtnPrimary,
} from '@/components/layout/surface';
import { FileText, Users, Share2, Lightbulb, User, Building, Phone, Users as GroupIcon, Edit, ExternalLink, Maximize2, UploadCloud } from 'lucide-react';

export default function SimpleViewPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params?.caseId as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    async function loadOnce(kickstart = false) {
      try {
        const res = kickstart
          ? await api.getCaseSimple(caseId, true)
          : await api.getCaseSimple(caseId);
        if (cancelled) return;

        const status = res?.generation_status || (res?.summary ? 'READY' : 'NONE');
        if (status === 'READY' && res?.summary) {
          setData(res);
          setGenerating(false);
          setLoading(false);
          setError('');
          return;
        }

        if (status === 'FAILED') {
          setError(res?.error || 'Simple View generation failed.');
          setData(res);
          setGenerating(false);
          setLoading(false);
          return;
        }

        // GENERATING / PENDING / NONE — keep polling
        setData(res);
        setGenerating(true);
        setLoading(false);
        pollTimer = setTimeout(() => loadOnce(false), 2500);
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message || 'Failed to load Simple View.');
        setGenerating(false);
        setLoading(false);
      }
    }

    if (caseId) loadOnce(true);
    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [caseId]);

  const handleGoToDashboard = () => router.push(`/cases/${caseId}`);
  const handleRegenerate = async () => {
    setGenerating(true);
    setError('');
    setData((prev: any) => (prev ? { ...prev, summary: null, generation_status: 'GENERATING' } : prev));
    try {
      await api.generateCaseSimple(caseId, false);
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 2500));
        const res = await api.getCaseSimple(caseId);
        setData(res);
        if (res?.generation_status === 'READY' && res?.summary) {
          setGenerating(false);
          return;
        }
        if (res?.generation_status === 'FAILED') {
          setError(res?.error || 'Generation failed.');
          setGenerating(false);
          return;
        }
      }
      setError('Generation is taking longer than expected. Refresh this page shortly.');
      setGenerating(false);
    } catch (err: any) {
      setError(err.message || 'Failed to start regeneration.');
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="-m-5 space-y-0 sm:-m-6 lg:-m-8">
        <PageHeader badge="Simple View" title="Loading dashboard..." />
        <div className="flex items-center justify-center px-5 py-20">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error && !data?.summary) {
    return (
      <div className="-m-5 space-y-0 sm:-m-6 lg:-m-8">
        <PageHeader badge="Simple View" title="Error" />
        <div className="px-5 py-10">
          <Card className={cn(surfaceCard, 'p-8 text-center max-w-lg mx-auto')}>
            <p className="text-red-400 mb-6">{error}</p>
            <div className="flex justify-center gap-3">
              <button type="button" onClick={handleRegenerate} className={cn(surfaceBtnPrimary)}>
                Retry generation
              </button>
              <button type="button" onClick={handleGoToDashboard} className={cn(surfaceBtnSecondary)}>
                Back to Dashboard
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (generating && !data?.summary) {
    return (
      <div className="-m-5 space-y-0 sm:-m-6 lg:-m-8">
        <PageHeader
          badge={`Cases / ${data?.case_number || caseId} / Simple View`}
          title={`${data?.title || caseId} — Generating Summary`}
          description="Plain-language overview is being built from extracted case and graph data."
          actions={
            <button type="button" onClick={handleGoToDashboard} className={cn(surfaceBtnSecondary)}>
              Back to Dashboard
            </button>
          }
        />
        <div className="px-5 py-16 flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm text-white/55 max-w-md text-center">
            {data?.message ||
              'Generating Simple View asynchronously and storing it in Postgres. This page will refresh when ready.'}
          </p>
        </div>
      </div>
    );
  }

  const roleGroups: Record<string, any[]> = {};
  (data?.key_people || []).forEach((p: any) => {
    const roleKey = p.role || 'Other';
    if (!roleGroups[roleKey]) roleGroups[roleKey] = [];
    roleGroups[roleKey].push(p);
  });

  const effectiveNumber = data?.case_number || caseId;
  const insightColors = [
    'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    'bg-violet-500/20 text-violet-300 border border-violet-500/30',
    'bg-rose-500/20 text-rose-300 border border-rose-500/30',
  ];

  return (
    <div className="-m-5 space-y-0 sm:-m-6 lg:-m-8">
      {/* Top Header Row */}
      <PageHeader
        badge={`Cases / ${effectiveNumber}`}
        title={
          <div className="flex items-center gap-3">
            <span>Case Overview</span>
            <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider border border-green-500/30">
              Active
            </span>
          </div>
        }
        description={`#${(data.case_id || caseId).toString().substring(0, 8)} | ${data.title || effectiveNumber}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleRegenerate} className={cn(surfaceBtnSecondary)} disabled={generating}>
              {generating ? 'Regenerating…' : 'Regenerate'}
            </button>
            <button type="button" onClick={handleGoToDashboard} className={cn(surfaceBtnSecondary)}>
              Back to Dashboard
            </button>
          </div>
        }
      />

      <div className="space-y-6 px-5 py-6 sm:px-6 lg:px-8 max-w-5xl">
        {data.disclaimer && (
          <p className="text-[11px] text-white/35">{data.disclaimer}</p>
        )}
        {data.generated_at && (
          <p className="text-[10px] text-white/30 font-mono">
            Stored summary · {data.generation_method || 'persisted'} · {data.generated_at}
          </p>
        )}

        <Card className={cn(surfaceCard, 'p-6')}>
          <h2 className="text-white/45 text-xs font-semibold uppercase tracking-wider mb-4">Case Summary</h2>
          <p className="text-white/90 text-sm leading-relaxed">{data.summary}</p>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className={cn(surfaceCard, 'p-6')}>
            <h2 className="text-white/45 text-xs font-semibold uppercase tracking-wider mb-6">Key Events</h2>
            <div className="relative border-l-2 border-white/[0.08] ml-2.5 space-y-7 flex-1 overflow-y-auto pr-2 pb-2">
              {(!data.timeline || data.timeline.length === 0) ? (
                <p className="text-xs text-white/35 italic pl-6 py-2">No case events have been recorded yet.</p>
              ) : (
                data.timeline.map((event: any, idx: number) => {
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                  const color = colors[idx % colors.length];

                  return (
                    <div key={idx} className="relative pl-6">
                      <div className={`absolute -left-[6px] top-1.5 w-[10px] h-[10px] rounded-full ${color} shadow-[0_0_8px_currentColor]`}></div>
                      <div className="flex justify-between items-baseline mb-1">
                        <p className="text-xs text-white/50 font-mono font-semibold">
                          {event.date || 'Unknown Date'}
                          {event.time && <span className="ml-2 text-white/30">{event.time}</span>}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-white mb-1 break-words">{event.title || 'Event Logged'}</p>
                      <p className="text-xs text-white/60 break-words leading-relaxed">{event.description}</p>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <Card className={cn(surfaceCard, 'p-6 bg-blue-900/10 border-blue-500/20')}>
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h2 className="text-blue-400 text-xs font-bold uppercase tracking-wider">AI-Generated Observations</h2>
            </div>
            <div className="space-y-3">
              {(!data.ai_insights || data.ai_insights.length === 0) ? (
                <p className="text-xs text-white/35 italic py-2">No AI insights available.</p>
              ) : (
                data.ai_insights.map((insight: string, idx: number) => (
                  <div key={idx} className={cn(surfacePanel, 'p-4 flex gap-4 items-start shadow-sm border border-white/[0.05]')}>
                    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold', insightColors[idx % insightColors.length])}>
                      {idx + 1}
                    </div>
                    <span className="text-sm text-white/90 leading-relaxed font-medium pt-0.5">{insight}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className={cn(surfaceCard, 'p-6')}>
            <h2 className="text-white/45 text-xs font-semibold uppercase tracking-wider mb-4">Key People</h2>
            {Object.keys(roleGroups).length === 0 ? (
              <p className="text-xs text-white/35 italic">No people extracted yet.</p>
            ) : (
              <div className="space-y-5">
                {Object.entries(roleGroups).map(([role, people]) => (
                  <div key={role}>
                    <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-2">{role}</div>
                    <ul className="space-y-1.5">
                      {people.map((p: any, i: number) => (
                        <li key={`${p.name}-${i}`} className="text-sm text-white/85">
                          {p.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className={cn(surfaceCard, 'p-6')}>
            <h2 className="text-white/45 text-xs font-semibold uppercase tracking-wider mb-4">Key Locations</h2>
            {(!data.key_locations || data.key_locations.length === 0) ? (
              <p className="text-xs text-white/35 italic">No locations extracted yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.key_locations.map((loc: string, idx: number) => (
                  <li key={idx} className="text-sm text-white/85">
                    {loc}
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
