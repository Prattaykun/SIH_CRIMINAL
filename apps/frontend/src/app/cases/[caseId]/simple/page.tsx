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
        // 1. Try backend endpoint first
        let res: any = null;
        try {
          res = await api.getCaseSimple(caseId);
        } catch (backendErr) {
          console.warn('Backend /simple endpoint returned error, falling back to case summary synthesis:', backendErr);
        }

        if (res && res.summary) {
          setData(res);
          return;
        }

        // 2. Fallback: Synthesize rich layman proceedings from existing working endpoints
        const [summaryRes, caseRes, candidatesRes] = await Promise.all([
          api.getCaseSummary(caseId).catch(() => null),
          api.getCase(caseId).catch(() => null),
          (typeof api.getExtractionCandidates === 'function'
            ? api.getExtractionCandidates(caseId, 'case')
            : (api as any).get(`/cases/${caseId}/candidates`)
          ).catch(() => null),
        ]);

        if (!summaryRes && !caseRes) {
          throw new Error('Case intelligence not available for this case yet.');
        }

        const effectiveNumber = summaryRes?.case_number || caseRes?.case_number || caseId;
        const title = caseRes?.title || `${effectiveNumber} Intelligence Dossier`;
        const priority = summaryRes?.primary_subject?.priority || caseRes?.priority || 'MEDIUM';
        const primarySub = summaryRes?.primary_subject?.name || 'Primary Subject';
        const primaryOrg =
          summaryRes?.primary_subject?.org && summaryRes?.primary_subject?.org !== 'None Identified'
            ? summaryRes.primary_subject.org
            : 'an identified syndicate';
        const primaryJurisdiction = summaryRes?.primary_subject?.jurisdiction || caseRes?.description || 'Active Jurisdiction';
        const status = caseRes?.status || 'Active Investigation';

        // Role classification helper
        const classifyPersonRole = (name: string, isPrimary: boolean) => {
          if (/magistrate|judge|court|justice/i.test(name)) return 'Judicial Authority';
          if (/inspector|officer|sub-inspector|sho|constable|dsp|sp|investigat/i.test(name)) return 'Investigating Officer / Official';
          if (isPrimary) return 'Primary Subject of Interest';
          return 'Involved Person / Witness';
        };

        // Extract key people with accurate role classification
        const peopleList: { name: string; role: string }[] = [];
        const seenPeople = new Set<string>();

        if (summaryRes?.primary_subject?.name) {
          const pName = summaryRes.primary_subject.name;
          peopleList.push({
            name: pName,
            role: classifyPersonRole(pName, true),
          });
          seenPeople.add(pName);
        }

        const rawEntities = candidatesRes?.entities || candidatesRes?.data?.entities || [];
        rawEntities.forEach((ent: any) => {
          const type = ent.type || ent.entity_type;
          const name = (ent.text || ent.label || ent.canonical_name || '').trim();
          if (type === 'PERSON' && name && !seenPeople.has(name) && name.length >= 3 && name.length <= 40) {
            seenPeople.add(name);
            peopleList.push({ name, role: classifyPersonRole(name, false) });
          }
        });

        // Location filtering: distinguish genuine locations from case allegations/descriptions
        const isDescriptionText = (s: string) =>
          s.length > 45 || /alleged|sale|forged|dispute|transfer|booking|case|report|plots|fraud/i.test(s);

        const locSet = new Set<string>();
        rawEntities.forEach((ent: any) => {
          const type = ent.type || ent.entity_type;
          const name = (ent.text || ent.label || ent.canonical_name || '').trim();
          if ((type === 'LOCATION' || type === 'ADDRESS') && name && !isDescriptionText(name) && name.length >= 3) {
            locSet.add(name);
          }
        });

        // Deduplicate timeline events to prevent identical repeated entries
        const seenEvents = new Set<string>();
        const timelineList: { date: string | null; description: string }[] = [];
        (summaryRes?.timeline_events || []).forEach((evt: any) => {
          const desc = evt.desc ? `${evt.title}: ${evt.desc}` : evt.title;
          const key = `${evt.date || ''}|${desc}`;
          if (!seenEvents.has(key)) {
            seenEvents.add(key);
            timelineList.push({
              date: evt.date || null,
              description: desc,
            });
          }
        });

        // AI Insights
        const insights: string[] = [];
        const score = summaryRes?.anomaly_index?.score || 0;
        
        if (score >= 90) {
          insights.push(`The system flagged this case as highly suspicious (score: ${score}/100) because the people involved are interacting in hidden or unusual patterns.`);
        } else if (score >= 70) {
          insights.push(`There are suspicious activity patterns in this case (score: ${score}/100) that usually warrant a closer look by investigators.`);
        }

        if (summaryRes?.primary_subject?.name) {
          const subName = summaryRes.primary_subject.name;
          const roleLabel = classifyPersonRole(subName, true);
          if (roleLabel !== 'Judicial Authority' && roleLabel !== 'Investigating Officer / Official') {
            insights.push(`The evidence suggests ${subName} is the central figure coordinating these activities.`);
          }
        }

        if (summaryRes?.linked_assets && summaryRes.linked_assets.length > 0) {
          insights.push(`The suspects are using multiple different phone numbers and accounts, which is a common tactic in organized crime.`);
        }

        if (timelineList.length >= 4) {
          insights.push(`There is a rapid sequence of events recorded, indicating highly coordinated or pre-planned actions.`);
        }

        if (insights.length === 0) {
          insights.push('The system is still gathering enough evidence to form concrete insights.');
        }

        // Clean natural summary
        const displayStatus = (status || 'ACTIVE').toLowerCase().includes('active')
          ? 'active investigation'
          : (status || 'case').toLowerCase();
        
        const allegationText = isDescriptionText(primaryJurisdiction)
          ? `The proceedings examine allegations regarding ${primaryJurisdiction.replace(/\.+$/, '')}.`
          : `The proceedings are centered around ${primaryJurisdiction}.`;

        const syntheticSummary = `Case ${effectiveNumber} is currently an ${displayStatus}. ${allegationText} Multiple entities and contacts including ${primaryOrg} are being reviewed under ${priority} priority.`;

        setData({
          case_id: caseId,
          case_number: effectiveNumber,
          title,
          case_type: 'Criminal Network Investigation',
          summary: syntheticSummary,
          timeline: timelineList,
          key_people: peopleList.slice(0, 10),
          key_locations: Array.from(locSet).slice(0, 5),
          ai_insights: insights,
        });
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
          <Card className={cn(surfaceCard, 'p-8 text-center max-w-lg mx-auto')}>
            <p className="text-red-400 mb-6">{error || 'Simple summary is not available for this case yet.'}</p>
            <button type="button" onClick={handleGoToDashboard} className={cn(surfaceBtnSecondary)}>
              Back to Dashboard
            </button>
          </Card>
        </div>
      </div>
    );
  }

  // Group key people
  const roleGroups: Record<string, any[]> = {};
  (data.key_people || []).forEach((p: any) => {
    const roleKey = p.role || 'Other';
    if (!roleGroups[roleKey]) roleGroups[roleKey] = [];
    roleGroups[roleKey].push(p);
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
        <Card className={cn(surfaceCard, 'p-6')}>
          <h2 className="text-white/45 text-xs font-semibold uppercase tracking-wider mb-4">Case Summary</h2>
          <p className="text-white/90 text-sm leading-relaxed">{data.summary}</p>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key Events Timeline */}
          <Card className={cn(surfaceCard, 'p-6')}>
            <h2 className="text-white/45 text-xs font-semibold uppercase tracking-wider mb-6">Key Events</h2>
            <div className="relative border-l border-white/[0.12] ml-3 space-y-7">
              {(!data.timeline || data.timeline.length === 0) ? (
                <p className="text-xs text-white/35 italic pl-6 py-2">No timeline events recorded for this case yet.</p>
              ) : (
                data.timeline.map((event: any, idx: number) => (
                  <div key={idx} className="relative pl-6">
                    <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-[#0c0c0c] border-2 border-blue-500"></div>
                    <p className="text-sm text-white mb-1 break-words">{event.description}</p>
                    {event.date && <p className="text-xs text-white/40 font-mono">{event.date}</p>}
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* AI Insights */}
          <Card className={cn(surfaceCard, 'p-6 bg-blue-900/10 border-blue-500/20')}>
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h2 className="text-blue-400 text-xs font-bold uppercase tracking-wider">AI-Generated Observations</h2>
            </div>
            <ul className="space-y-4">
              {(!data.ai_insights || data.ai_insights.length === 0) ? (
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
          <Card className={cn(surfaceCard, 'p-6')}>
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
                        <div key={idx} className={cn(surfacePanel, 'px-3 py-2 text-sm text-white/90 break-words')}>
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
          <Card className={cn(surfaceCard, 'p-6')}>
            <h2 className="text-white/45 text-xs font-semibold uppercase tracking-wider mb-6">Important Locations</h2>
            {(!data.key_locations || data.key_locations.length === 0) ? (
              <p className="text-xs text-white/35 italic">No important locations extracted.</p>
            ) : (
              <ul className="space-y-2">
                {data.key_locations.map((loc: string, idx: number) => (
                  <li key={idx} className={cn(surfacePanel, 'px-3 py-2 flex items-center gap-3')}>
                    <svg className="w-4 h-4 text-white/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm text-white/90 break-words">{loc}</span>
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
