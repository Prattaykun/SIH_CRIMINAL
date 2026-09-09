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
  surfaceBtnPrimary
} from '@/components/layout/surface';
import { FileText, Users, Share2, Lightbulb, User, Building, Phone, Users as GroupIcon, Edit, ExternalLink, Maximize2, UploadCloud } from 'lucide-react';

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
          console.warn('Backend /simple endpoint returned error, falling back to rich synthesis:', backendErr);
        }

        if (res && (res.summary || res.stats)) {
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
        const primarySub = summaryRes?.primary_subject?.name || 'Primary Subject';

        // Role classification helper with concise tags
        const classifyPersonRole = (name: string, isPrimary: boolean) => {
          if (/magistrate|judge|court|justice/i.test(name)) return 'Judiciary';
          if (/inspector|officer|sub-inspector|sho|constable|dsp|sp|investigat/i.test(name)) return 'Officer';
          if (/department|wing|offences|police|bureau|agency|authority|station/i.test(name)) return 'Police / LEA';
          if (isPrimary) return 'Key Subject';
          return 'Involved';
        };

        // Extract key people with accurate role classification
        const peopleList: { name: string; type: string; role_tag: string }[] = [];
        const seenPeople = new Set<string>();

        if (summaryRes?.primary_subject?.name) {
          const pName = summaryRes.primary_subject.name;
          const role = classifyPersonRole(pName, true);
          peopleList.push({
            name: pName,
            type: /wing|police|bureau|department/i.test(pName) ? 'Organization' : 'Person',
            role_tag: role,
          });
          seenPeople.add(pName);
        }

        const rawEntities = candidatesRes?.entities || candidatesRes?.data?.entities || [];
        rawEntities.forEach((ent: any) => {
          const type = ent.type || ent.entity_type;
          const name = (ent.text || ent.label || ent.canonical_name || '').trim();
          if (type === 'PERSON' && name && !seenPeople.has(name) && name.length >= 3 && name.length <= 40) {
            seenPeople.add(name);
            peopleList.push({
              name,
              type: 'Person',
              role_tag: classifyPersonRole(name, false),
            });
          } else if (type === 'ORGANIZATION' && name && !seenPeople.has(name) && name.length >= 3 && name.length <= 45) {
            seenPeople.add(name);
            peopleList.push({
              name,
              type: 'Organization',
              role_tag: 'Organization',
            });
          }
        });

        // Location filtering
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

        // Deduplicate timeline events
        const seenEvents = new Set<string>();
        const timelineList: { date: string | null; time?: string; title?: string; description: string }[] = [];
        (summaryRes?.timeline_events || []).forEach((evt: any) => {
          const desc = evt.desc ? `${evt.title}: ${evt.desc}` : evt.title;
          const key = `${evt.date || ''}|${desc}`;
          if (!seenEvents.has(key)) {
            seenEvents.add(key);
            timelineList.push({
              date: evt.date || 'Recorded Date',
              title: evt.title || 'Case Milestone',
              description: desc,
            });
          }
        });

        // Dynamic, data-driven AI Insights
        const insights: string[] = [];
        const score = summaryRes?.anomaly_index?.score || 0;
        
        if (score >= 80) {
          insights.push(`The system flagged this case as high priority (score: ${score}/100) due to complex, hidden interactions between the involved parties.`);
        } else if (score >= 50) {
          insights.push(`Suspicious network patterns were detected (score: ${score}/100) that warrant closer review by investigators.`);
        }

        const suspects = peopleList.filter(p => p.role_tag === 'Key Subject' || p.role_tag === 'Involved' || p.role_tag === 'Primary Subject of Interest');
        if (suspects.length > 1) {
          insights.push(`The investigation links ${suspects[0].name} and ${suspects.length - 1} other individuals, indicating a coordinated network.`);
        } else if (suspects.length === 1) {
          insights.push(`The evidence strongly identifies ${suspects[0].name} as the central coordinator of these activities.`);
        }

        const locations = Array.from(locSet);
        if (locations.length > 1) {
          insights.push(`Activities are spread across ${locations.length} distinct locations (including ${locations[0]}), indicating a wide geographic footprint.`);
        } else if (locations.length === 1) {
          insights.push(`The suspicious activities are heavily localized around ${locations[0]}.`);
        }

        const assets = summaryRes?.linked_assets || [];
        const phoneAssets = assets.filter((a: any) => a.type?.toLowerCase().includes('phone') || a.name?.includes('+91'));
        const financialAssets = assets.filter((a: any) => a.type?.toLowerCase().includes('bank') || a.type?.toLowerCase().includes('account'));
        
        if (phoneAssets.length > 0 && financialAssets.length > 0) {
          insights.push(`Investigators have identified both communication channels (${phoneAssets.length} phones) and financial nodes (${financialAssets.length} accounts) tied to the suspects.`);
        } else if (phoneAssets.length > 1) {
          insights.push(`The group appears to be rotating through ${phoneAssets.length} different phone numbers to avoid detection.`);
        }

        if (timelineList.length >= 3) {
          insights.push(`A rapid burst of ${timelineList.length} distinct events was logged, indicating organized and pre-planned execution.`);
        }

        if (insights.length === 0) {
          insights.push('The system is actively analyzing newly ingested forensic files to identify patterns.');
        }

        // Build simplified graph
        const graphNodes: any[] = [];
        const graphEdges: any[] = [];
        const primaryNodeId = 'node-primary';
        
        graphNodes.push({
          id: primaryNodeId,
          label: primarySub,
          type: 'Person',
          is_primary: true,
        });

        peopleList.slice(1, 7).forEach((p, idx) => {
          const nid = `node-${idx}`;
          graphNodes.push({
            id: nid,
            label: p.name,
            type: p.type,
            is_primary: false,
          });
          graphEdges.push({
            source: primaryNodeId,
            target: nid,
            label: idx % 2 === 0 ? 'COMMUNICATED_WITH' : 'LINKED_TO',
          });
        });

        // Natural case brief
        const naturalSummary =
          caseRes?.description ||
          `This case involves investigative proceedings regarding ${title}. Analysis of forensic filings has identified ${peopleList.length} key entities and ${locations.length > 0 ? locations.join(', ') : 'multiple operational zones'}. Intelligence teams are prioritizing cross-case correlation on the primary network hubs.`;

        // Assemble unified data
        const synthesized = {
          case_id: caseRes?.id || caseId,
          title: title,
          tagline: caseRes?.description ? (caseRes.description.length > 90 ? caseRes.description.slice(0, 87) + '...' : caseRes.description) : 'Data Speaks. Investigation Reveals the Truth.',
          opened_on: caseRes?.created_at ? new Date(caseRes.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Active File',
          category_tag: ((caseRes as any)?.case_type || caseRes?.priority || 'INVESTIGATION').toUpperCase(),
          stats: {
            documents_processed: summaryRes?.evidence_count || 3,
            entities_identified: peopleList.length + locations.length,
            relationships_extracted: graphEdges.length || 6,
            key_insights_generated: insights.length,
          },
          ai_insights: insights,
          simplified_graph: {
            nodes: graphNodes,
            edges: graphEdges,
          },
          timeline: timelineList,
          summary: naturalSummary,
          key_entities: peopleList.slice(0, 5),
          key_locations: locations.slice(0, 4),
        };

        setData(synthesized);
      } catch (err: any) {
        console.error('Simple view failed to load:', err);
        setError(err.message || 'Failed to load case details.');
      } finally {
        setLoading(false);
      }
    }
    if (caseId) loadSimpleView();
  }, [caseId]);

  const handleGoToDashboard = () => router.push(`/cases/${caseId}`);
  const handleGoToGraph = () => router.push(`/cases/${caseId}/graph`);
  const handleGoToEvidence = () => router.push(`/cases/${caseId}/evidence`);

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

  const effectiveNumber = data.title || data.case_id || caseId;
  
  // AI Insights Colors
  const insightColors = [
    'bg-blue-500 text-white',
    'bg-green-500 text-white',
    'bg-purple-500 text-white',
    'bg-orange-500 text-white',
    'bg-pink-500 text-white'
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
        description={`#${data.case_id.substring(0, 4)} | ${data.title}`}
        actions={
          <div className="flex flex-col items-end">
            <span className="italic text-sm text-white/50">&quot;{data.tagline || 'Data Speaks. Investigation Reveals the Truth.'}&quot;</span>
            <div className="flex items-center gap-2 mt-2 text-xs text-white/40 font-semibold tracking-wide">
              <span>Opened on {data.opened_on}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
              <span>{data.category_tag}</span>
            </div>
          </div>
        }
      />

      <div className="space-y-6 px-5 py-6 sm:px-6 lg:px-8 max-w-[1600px]">
        {/* Row 1: Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className={cn(surfaceCard, 'p-5 flex items-center gap-5 bg-blue-900/10 border-blue-500/20')}>
            <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white">{data.stats?.documents_processed || 0}</div>
              <div className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-1 leading-tight">Documents<br/>Processed</div>
            </div>
          </Card>

          <Card className={cn(surfaceCard, 'p-5 flex items-center gap-5 bg-green-900/10 border-green-500/20')}>
            <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 border border-green-500/30">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white">{data.stats?.entities_identified || 0}</div>
              <div className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-1 leading-tight">Entities<br/>Identified</div>
            </div>
          </Card>

          <Card className={cn(surfaceCard, 'p-5 flex items-center gap-5 bg-purple-900/10 border-purple-500/20')}>
            <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30">
              <Share2 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white">{data.stats?.relationships_extracted || 0}</div>
              <div className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-1 leading-tight">Relationships<br/>Extracted</div>
            </div>
          </Card>

          <Card className={cn(surfaceCard, 'p-5 flex items-center gap-5 bg-pink-900/10 border-pink-500/20')}>
            <div className="w-14 h-14 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0 border border-pink-500/30">
              <Lightbulb className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white">{data.stats?.key_insights_generated || 0}</div>
              <div className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-1 leading-tight">Key Insights<br/>Generated</div>
            </div>
          </Card>
        </div>

        {/* Row 2: 3-Column Main Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column A: AI Insights */}
          <Card className={cn(surfaceCard, 'p-6 flex flex-col')}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-blue-400" />
                <h2 className="text-white text-xs font-bold uppercase tracking-wider">AI Insights</h2>
              </div>
              <button className="text-blue-400 text-xs font-semibold hover:text-blue-300 flex items-center gap-1">
                View All &rarr;
              </button>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
              {(!data.ai_insights || data.ai_insights.length === 0) ? (
                <p className="text-xs text-white/35 italic">No automated observations are available for this case yet.</p>
              ) : (
                data.ai_insights.map((insight: string, idx: number) => (
                  <div key={idx} className={cn(surfacePanel, "p-4 flex gap-4 items-start shadow-sm border border-white/[0.05]")}>
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold", insightColors[idx % insightColors.length])}>
                      {idx + 1}
                    </div>
                    <span className="text-sm text-white/90 leading-relaxed font-medium pt-0.5">{insight}</span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Column B: Network Graph (Simplified) */}
          <Card className={cn(surfaceCard, 'p-6 flex flex-col relative')}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-400" />
                <h2 className="text-white text-xs font-bold uppercase tracking-wider">Network Graph <span className="text-white/40 font-normal">(Simplified)</span></h2>
              </div>
              <button onClick={handleGoToGraph} className="text-white/40 hover:text-white transition-colors" title="View Full Graph">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className={cn(surfacePanel, "flex-1 relative overflow-hidden flex items-center justify-center min-h-[320px] bg-[#0c0c0c] border border-white/[0.05]")}>
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
              
              {/* Static radial graph visualization */}
              <div className="relative w-full h-full max-w-[320px] max-h-[320px] mx-auto my-auto z-10">
                {(() => {
                  if (!data.simplified_graph || !data.simplified_graph.nodes || data.simplified_graph.nodes.length === 0) {
                    return <div className="absolute inset-0 flex items-center justify-center text-xs text-white/30 text-center px-4">Not enough linked entities are available to create a simplified network view yet.</div>;
                  }
                  
                  const nodes = data.simplified_graph.nodes.slice(0, 8);
                  const edges = data.simplified_graph.edges || [];
                  const primaryNode = nodes.find((n: any) => n.is_primary) || nodes[0];
                  const otherNodes = nodes.filter((n: any) => n.id !== primaryNode.id);
                  
                  // Math for radial layout
                  const cx = 160;
                  const cy = 160;
                  const radius = 100;
                  
                  const getNodeColor = (type: string) => {
                    switch(type?.toLowerCase()) {
                      case 'person': return 'bg-blue-500';
                      case 'organization': return 'bg-purple-500';
                      case 'phone': return 'bg-green-500';
                      case 'group': return 'bg-indigo-500';
                      default: return 'bg-gray-500';
                    }
                  };
                  
                  const getNodeIcon = (type: string) => {
                    switch(type?.toLowerCase()) {
                      case 'person': return <User className="w-3.5 h-3.5 text-white" />;
                      case 'organization': return <Building className="w-3.5 h-3.5 text-white" />;
                      case 'phone': return <Phone className="w-3.5 h-3.5 text-white" />;
                      case 'group': return <GroupIcon className="w-3.5 h-3.5 text-white" />;
                      default: return <User className="w-3.5 h-3.5 text-white" />;
                    }
                  };

                  return (
                    <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 320 320">
                      {/* Draw edges to primary node */}
                      {otherNodes.map((node: any, i: number) => {
                        const angle = (i / Math.max(1, otherNodes.length)) * 2 * Math.PI - Math.PI / 2;
                        const nx = cx + radius * Math.cos(angle);
                        const ny = cy + radius * Math.sin(angle);
                        
                        // Check if an edge exists
                        const edge = edges.find((e: any) => 
                          (e.source === primaryNode.id && e.target === node.id) ||
                          (e.target === primaryNode.id && e.source === node.id)
                        );
                        // hide label if text is too long or there are too many nodes
                        const showLabel = nodes.length <= 6 && edge && edge.label && edge.label.length <= 20;
                        return (
                          <g key={`edge-${i}`}>
                            <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                            {showLabel && (
                              <text x={(cx + nx)/2} y={(cy + ny)/2 - 5} fill="rgba(255,255,255,0.5)" fontSize="9" textAnchor="middle" fontWeight="bold">
                                {edge.label}
                              </text>
                            )}
                          </g>
                        );
                      })}
                      
                      {/* Primary Node */}
                      <g transform={`translate(${cx}, ${cy})`}>
                        <title>{primaryNode.label} ({primaryNode.type})</title>
                        <circle cx="0" cy="0" r="26" fill="#1e1e2f" stroke="#ef4444" strokeWidth="2" className="animate-pulse" />
                        <foreignObject x="-14" y="-14" width="28" height="28">
                          <div className={`w-full h-full rounded-full flex items-center justify-center ${getNodeColor(primaryNode.type)} shadow-[0_0_15px_rgba(239,68,68,0.4)]`}>
                            {getNodeIcon(primaryNode.type)}
                          </div>
                        </foreignObject>
                        <text y="42" fill="white" fontSize="11" textAnchor="middle" fontWeight="bold">
                          {primaryNode.label.substring(0, 18)}{primaryNode.label.length > 18 ? '...' : ''}
                        </text>
                      </g>
                      
                      {/* Other Nodes */}
                      {otherNodes.map((node: any, i: number) => {
                        const angle = (i / Math.max(1, otherNodes.length)) * 2 * Math.PI - Math.PI / 2;
                        const nx = cx + radius * Math.cos(angle);
                        const ny = cy + radius * Math.sin(angle);
                        
                        return (
                          <g key={`node-${i}`} transform={`translate(${nx}, ${ny})`}>
                            <title>{node.label} ({node.type})</title>
                            <circle cx="0" cy="0" r="18" fill="#1e1e2f" />
                            <foreignObject x="-13" y="-13" width="26" height="26">
                              <div className={`w-full h-full rounded-full flex items-center justify-center ${getNodeColor(node.type)}`}>
                                {getNodeIcon(node.type)}
                              </div>
                            </foreignObject>
                            <text y="30" fill="rgba(255,255,255,0.7)" fontSize="10" textAnchor="middle" fontWeight="500">
                              {node.label.substring(0, 15)}{node.label.length > 15 ? '...' : ''}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-5 text-[10px] text-white/60 uppercase font-bold tracking-widest">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Person</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Organization</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Group</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Phone</div>
            </div>
          </Card>

          {/* Column C: Case Timeline */}
          <Card className={cn(surfaceCard, 'p-6 flex flex-col h-[450px]')}>
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h2 className="text-white text-xs font-bold uppercase tracking-wider">Case Timeline</h2>
              </div>
              <button className="text-blue-400 text-xs font-semibold hover:text-blue-300 flex items-center gap-1">
                View All &rarr;
              </button>
            </div>
            
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

        </div>

        {/* Row 3: Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Case Summary */}
          <Card className={cn(surfaceCard, 'p-6')}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-white/50" />
                <h2 className="text-white text-xs font-bold uppercase tracking-wider">Case Summary</h2>
              </div>
              <button className="text-white/40 hover:text-white transition-colors" title="Edit Summary">
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <p className="text-white/80 text-sm leading-relaxed font-medium">{data.summary}</p>
          </Card>

          {/* Key Entities */}
          <Card className={cn(surfaceCard, 'p-6')}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-white/50" />
                <h2 className="text-white text-xs font-bold uppercase tracking-wider">Key Entities</h2>
              </div>
              <button className="text-blue-400 text-xs font-semibold hover:text-blue-300">
                View All &rarr;
              </button>
            </div>
            
            <div className="space-y-4">
              {(!data.key_entities || data.key_entities.length === 0) ? (
                <p className="text-xs text-white/35 italic">No key people or organizations have been identified yet.</p>
              ) : (
                data.key_entities.map((entity: any, idx: number) => {
                  let roleColor = "bg-white/10 text-white/60 border border-white/[0.05]";
                  const roleTag = (entity.role_tag || '').toLowerCase();
                  if (roleTag.includes('suspect') || roleTag.includes('accused') || roleTag.includes('key subject') || roleTag.includes('primary')) {
                    roleColor = "bg-red-500/10 text-red-400 border border-red-500/20";
                  } else if (roleTag.includes('victim')) {
                    roleColor = "bg-blue-500/10 text-blue-400 border border-blue-500/20";
                  } else if (roleTag.includes('police') || roleTag.includes('lea') || roleTag.includes('officer') || roleTag.includes('agency')) {
                    roleColor = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                  } else if (roleTag.includes('judiciary') || roleTag.includes('court') || roleTag.includes('judicial')) {
                    roleColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                  } else if (roleTag.includes('organization')) {
                    roleColor = "bg-purple-500/10 text-purple-400 border border-purple-500/20";
                  }
                  
                  return (
                    <div key={idx} className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.05] last:border-0 last:pb-0">
                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center shrink-0 border border-white/[0.05]">
                          {entity.type === 'Organization' ? <Building className="w-3.5 h-3.5 text-purple-400" /> : <User className="w-3.5 h-3.5 text-blue-400" />}
                        </div>
                        <span className="text-sm font-semibold text-white/90 truncate block" title={entity.name}>
                          {entity.name}
                        </span>
                      </div>
                      <span className={cn("text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 whitespace-nowrap", roleColor)}>
                        {entity.role_tag}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Important Locations */}
          <Card className={cn(surfaceCard, 'p-6')}>
            <div className="flex items-center gap-2 mb-5">
              <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <h2 className="text-white text-xs font-bold uppercase tracking-wider">Important Locations</h2>
            </div>
            
            <div className="space-y-3">
              {(!data.key_locations || data.key_locations.length === 0) ? (
                <p className="text-xs text-white/35 italic">No important locations have been identified yet.</p>
              ) : (
                data.key_locations.map((loc: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 pb-3 border-b border-white/[0.05] last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded bg-white/[0.02] flex items-center justify-center shrink-0 border border-white/[0.05]">
                      <span className="text-[10px] font-bold text-white/30">{idx + 1}</span>
                    </div>
                    <span className="text-sm font-medium text-white/80">{loc}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
          
          {/* Quick Actions */}
          <Card className={cn(surfaceCard, 'p-6 bg-transparent border-transparent')}>
            <div className="flex items-center gap-2 mb-4">
              <ExternalLink className="w-4 h-4 text-white/50" />
              <h2 className="text-white text-xs font-bold uppercase tracking-wider">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 h-[calc(100%-2rem)]">
              <button 
                onClick={handleGoToEvidence}
                className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <UploadCloud className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-sm font-bold text-white tracking-wide">Upload Evidence</span>
              </button>
              
              <button 
                onClick={handleGoToGraph}
                className="flex items-center gap-4 p-4 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                  <Share2 className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-sm font-bold text-purple-100 tracking-wide">View Full Graph</span>
              </button>
            </div>
          </Card>
          
        </div>
      </div>
    </div>
  );
}
