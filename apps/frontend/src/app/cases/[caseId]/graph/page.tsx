'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { api } from '@/lib/api';
import { EntityNode } from '@/components/graph/EntityNode';
import { ClusterGroupNode } from '@/components/graph/ClusterGroupNode';
import { CaseHubNode } from '@/components/graph/CaseHubNode';
import { IntelligenceEdge } from '@/components/graph/IntelligenceEdge';
import { RelationshipEvidenceDrawer } from '@/components/graph/RelationshipEvidenceDrawer';
import { TimelineEvidenceCalendarMenu } from '@/components/graph/TimelineEvidenceCalendarMenu';
import {
  normalizeGraphData,
  filterNHopNeighborhood,
  extractTimelineEvents,
  extractEvidenceItems,
  NormalizedEntity,
  NormalizedRelationship,
  ClusterGroup,
  TimelineEvent,
  EvidenceItem,
} from '@/lib/graphIntelligence';
import {
  ShieldCheck,
  Filter,
  RefreshCw,
  Search,
  Layers,
  Network,
  Calendar,
  FileText,
  X,
  Focus,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  surfaceBtnPrimary,
  surfaceBtnSecondary,
  surfaceCard,
  surfaceHeader,
  surfaceInput,
  surfacePanel,
} from '@/components/layout/surface';
import type { CaseResponse } from '@/types/api';

const nodeTypes = {
  entity: EntityNode,
  clusterGroup: ClusterGroupNode,
  caseHub: CaseHubNode,
};

const edgeTypes = {
  intelligence: IntelligenceEdge,
};

type ViewMode = 'OVERVIEW' | 'NETWORK' | 'TIMELINE' | 'EVIDENCE';

// Dagre Layout computation with ample node separation and accurate dimensions
const layoutElements = (nodes: Node[], edges: Edge[], direction: 'LR' | 'TB' = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: direction === 'TB' ? 140 : 180,
    nodesep: direction === 'TB' ? 60 : 75,
  });

  nodes.forEach((node) => {
    const width = node.type === 'caseHub' ? 340 : node.type === 'clusterGroup' ? 280 : 270;
    const height = node.type === 'caseHub' ? 150 : node.type === 'clusterGroup' ? 120 : 145;
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    if (edge.source && edge.target) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  // Fallback grid if 0 edges exist
  if (edges.length === 0) {
    const cols = Math.max(2, Math.min(4, Math.ceil(Math.sqrt(nodes.length))));
    const layoutedNodes = nodes.map((node, i) => ({
      ...node,
      position: {
        x: (i % cols) * 300 + 40,
        y: Math.floor(i / cols) * 160 + 40,
      },
    }));
    return { nodes: layoutedNodes, edges };
  }

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = node.type === 'caseHub' ? 340 : node.type === 'clusterGroup' ? 280 : 270;
    const height = node.type === 'caseHub' ? 150 : node.type === 'clusterGroup' ? 120 : 145;
    return {
      ...node,
      position: {
        x: nodeWithPosition ? nodeWithPosition.x - width / 2 : 0,
        y: nodeWithPosition ? nodeWithPosition.y - height / 2 : 0,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export default function CaseGraphPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params?.caseId as string;

  // View mode tab state
  const [viewMode, setViewMode] = useState<ViewMode>('NETWORK');

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Raw and normalized data
  const [entities, setEntities] = useState<NormalizedEntity[]>([]);
  const [relationships, setRelationships] = useState<NormalizedRelationship[]>([]);
  const [clusters, setClusters] = useState<ClusterGroup[]>([]);
  const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState<CaseResponse | null>(null);

  // Focus & Hop mode state
  const [focusRootId, setFocusRootId] = useState<string | null>(null);
  const [hopDepth, setHopDepth] = useState<number>(2);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minConfidence, setMinConfidence] = useState(0.5);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [typeFilters, setTypeFilters] = useState<Record<string, boolean>>({
    PERSON: true,
    ORGANIZATION: true,
    ACCOUNT: true,
    VEHICLE: true,
    PHONE_NUMBER: true,
    LOCATION: true,
  });

  // Selected edge/relationship for evidence inspection drawer
  const [selectedRelationship, setSelectedRelationship] = useState<NormalizedRelationship | null>(null);

  // Right-hand popup timeline & evidence calendar menu state
  const [isCalendarMenuOpen, setIsCalendarMenuOpen] = useState(false);

  // GCP-style case picker
  const [availableCases, setAvailableCases] = useState<CaseResponse[]>([]);
  const [casePickerOpen, setCasePickerOpen] = useState(false);
  const [casePickerQuery, setCasePickerQuery] = useState('');
  const [casesLoading, setCasesLoading] = useState(false);
  const casePickerRef = React.useRef<HTMLDivElement>(null);

  const caseLabel = caseData?.case_number || caseId;
  const caseTitle = caseData?.title || 'Select a case';

  // Fetch initial graph data
  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    setFocusRootId(null);
    setSelectedRelationship(null);
    try {
      let rawEntities: any[] = [];
      let rawRels: any[] = [];

      const casePromise = api.getCase(caseId).catch(() => null);

      if (typeof api.getExtractionCandidates === 'function') {
        const res = await api.getExtractionCandidates(caseId, 'case');
        rawEntities = res?.entities || res?.data?.entities || [];
        rawRels = res?.relationships || res?.data?.relationships || [];
      } else if (typeof (api as any).get === 'function') {
        const res = await (api as any).get(`/cases/${caseId}/candidates`);
        rawEntities = res?.data?.entities || res?.entities || [];
        rawRels = res?.data?.relationships || res?.relationships || [];
      }

      const caseRes = await casePromise;
      if (caseRes) setCaseData(caseRes);

      const normalized = normalizeGraphData(rawEntities, rawRels);
      // #region agent log
      fetch('http://127.0.0.1:7267/ingest/e2dbf843-7e56-4e83-b0d0-931cc70abd78',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e250be'},body:JSON.stringify({sessionId:'e250be',runId:'post-fix',hypothesisId:'C,D',location:'graph/page.tsx:fetchGraphData',message:'graph candidates loaded from API',data:{caseId,rawEntityCount:rawEntities.length,rawRelCount:rawRels.length,normalizedEntityCount:normalized.entities.length,normalizedRelCount:normalized.relationships.length,phoneLike:normalized.entities.filter((e)=>e.type==='PHONE_NUMBER'||e.type==='PHONE').map((e)=>({id:e.id,label:e.label,type:e.type})).slice(0,20),accountLike:normalized.entities.filter((e)=>e.type==='ACCOUNT'||e.type==='BANK_ACCOUNT').map((e)=>({id:e.id,label:e.label,type:e.type})).slice(0,20),relTypes:Array.from(new Set(normalized.relationships.map((r)=>r.type))),sampleRels:normalized.relationships.slice(0,12).map((r)=>({type:r.type,source:r.source,target:r.target})),labelsWithAcctDigits:normalized.entities.filter((e)=>/5512830476|6094512237/.test(e.label)).map((e)=>({label:e.label,type:e.type}))},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      setEntities(normalized.entities);
      setRelationships(normalized.relationships);
      setClusters(normalized.clusters);

      // Default expand all clusters in network mode
      const exp: Record<string, boolean> = {};
      normalized.clusters.forEach((c) => {
        exp[c.key] = true;
      });
      setExpandedClusters(exp);
    } catch (err) {
      console.error('Failed to load intelligence graph data:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  useEffect(() => {
    let cancelled = false;
    async function loadCases() {
      setCasesLoading(true);
      try {
        const res = await api.listCases(0, 100);
        if (!cancelled) setAvailableCases(res.cases || []);
      } catch (err) {
        console.error('Failed to load cases for picker:', err);
      } finally {
        if (!cancelled) setCasesLoading(false);
      }
    }
    loadCases();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!casePickerOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!casePickerRef.current?.contains(event.target as globalThis.Node)) {
        setCasePickerOpen(false);
        setCasePickerQuery('');
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCasePickerOpen(false);
        setCasePickerQuery('');
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [casePickerOpen]);

  const filteredPickerCases = useMemo(() => {
    const q = casePickerQuery.trim().toLowerCase();
    if (!q) return availableCases;
    return availableCases.filter(
      (c) =>
        c.case_number.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.status || '').toLowerCase().includes(q)
    );
  }, [availableCases, casePickerQuery]);

  const handleSelectCase = (nextCase: CaseResponse) => {
    if (nextCase.id === caseId) {
      setCasePickerOpen(false);
      setCasePickerQuery('');
      return;
    }
    setCasePickerOpen(false);
    setCasePickerQuery('');
    router.push(`/cases/${nextCase.id}/graph`);
  };

  // Derived timeline events and evidence directory
  const timelineEvents = useMemo(() => {
    return extractTimelineEvents(entities, relationships, caseId);
  }, [entities, relationships, caseId]);

  const evidenceItems = useMemo(() => {
    return extractEvidenceItems(entities, relationships);
  }, [entities, relationships]);

  // Build React Flow graph based on viewMode, focus, and filters
  useEffect(() => {
    if (entities.length === 0) return;

    if (viewMode === 'OVERVIEW') {
      // MODE 1: Case Overview Graph (Case Node -> Cluster Category Nodes -> Top Samples)
      const overviewNodes: Node[] = [];
      const overviewEdges: Edge[] = [];

      // 1. Case Hub Node
      overviewNodes.push({
        id: 'case-root',
        type: 'caseHub',
        data: {
          caseNumber: caseLabel,
          title: caseTitle,
          totalClusters: clusters.length,
          totalEntities: entities.length,
        },
        position: { x: 0, y: 0 },
      });

      // 2. Cluster Sector Nodes
      clusters.forEach((cluster) => {
        const clusterNodeId = `cluster-node-${cluster.key}`;
        overviewNodes.push({
          id: clusterNodeId,
          type: 'clusterGroup',
          data: {
            cluster: cluster.key,
            label: cluster.label,
            description: cluster.description,
            count: cluster.count,
            isExpanded: !!expandedClusters[cluster.key],
            onToggle: () => {
              setExpandedClusters((prev) => ({ ...prev, [cluster.key]: !prev[cluster.key] }));
            },
          },
          position: { x: 0, y: 0 },
        });

        // Edge: Case -> Cluster
        overviewEdges.push({
          id: `case-to-${cluster.key}`,
          source: 'case-root',
          target: clusterNodeId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
        });

        // If expanded, render top 3 entities from this cluster
        if (expandedClusters[cluster.key]) {
          const clusterEntities = entities
            .filter((e) => {
              const k = e.type === 'BANK_ACCOUNT' ? 'ACCOUNT' : (e.type === 'PHONE' ? 'PHONE_NUMBER' : e.type);
              return k === cluster.key;
            })
            .slice(0, 3);

          clusterEntities.forEach((ent) => {
            overviewNodes.push({
              id: ent.id,
              type: 'entity',
              data: {
                ...ent,
                label: ent.label,
                entity_type: ent.type,
              },
              position: { x: 0, y: 0 },
            });

            overviewEdges.push({
              id: `${clusterNodeId}-to-${ent.id}`,
              source: clusterNodeId,
              target: ent.id,
              type: 'smoothstep',
              style: { stroke: '#64748b', strokeWidth: 1.5, strokeDasharray: '4,4' },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
            });
          });
        }
      });

      const layouted = layoutElements(overviewNodes, overviewEdges, 'TB');
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
    } else if (viewMode === 'NETWORK') {
      // MODE 2: Full Progressive Network Graph with Focus Mode & N-Hop Filtering
      let visibleNodeIds = new Set(entities.map((e) => e.id));
      let visibleEdgeIds = new Set(relationships.map((r) => r.id));
      let hopMap = new Map<string, number>();

      if (focusRootId) {
        const focusResult = filterNHopNeighborhood(focusRootId, entities, relationships, hopDepth);
        visibleNodeIds = focusResult.visibleNodeIds;
        visibleEdgeIds = focusResult.visibleEdgeIds;
        hopMap = focusResult.hopDistances;
      }

      // Filter entities
      const filteredEntities = entities.filter((e) => {
        // Search query
        if (searchQuery.trim() && !e.label.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        // Type filter
        const key = e.type === 'BANK_ACCOUNT' ? 'ACCOUNT' : (e.type === 'PHONE' ? 'PHONE_NUMBER' : e.type);
        if (typeFilters[key] === false) return false;

        return true;
      });

      const filteredNodeIdSet = new Set(filteredEntities.map((e) => e.id));

      // Filter relationships
      const filteredRelationships = relationships.filter((r) => {
        if (verifiedOnly && r.status !== 'ACCEPTED' && r.status !== 'CORRECTED') return false;
        if (r.confidence < minConfidence) return false;
        return filteredNodeIdSet.has(r.source) && filteredNodeIdSet.has(r.target);
      });

      // Map to React Flow nodes with focus state
      const flowNodes: Node[] = filteredEntities.map((e) => {
        const isFocusRoot = e.id === focusRootId;
        const isInHop = focusRootId ? visibleNodeIds.has(e.id) : true;
        const isFaded = focusRootId ? !isInHop : false;

        return {
          id: e.id,
          type: 'entity',
          data: {
            ...e,
            label: e.label,
            entity_type: e.type,
            isFocusRoot,
            isFaded,
            hopDistance: hopMap.get(e.id),
          },
          position: { x: 0, y: 0 },
        };
      });

      // Group edges by target node to stagger labels and prevent any label collisions
      const targetEdgeCounts: Record<string, number> = {};
      const targetEdgeIndex: Record<string, number> = {};
      filteredRelationships.forEach((r) => {
        targetEdgeCounts[r.target] = (targetEdgeCounts[r.target] || 0) + 1;
      });

      // Map to React Flow edges with visual hierarchy and staggered HTML pill badges
      const flowEdges: Edge[] = filteredRelationships.map((r) => {
        const count = targetEdgeCounts[r.target] || 1;
        const idx = targetEdgeIndex[r.target] || 0;
        targetEdgeIndex[r.target] = idx + 1;
        // Stagger ratio between 0.35 and 0.65 to ensure labels on parallel lines never collide
        const labelRatio = count === 1 ? 0.5 : 0.35 + (idx / Math.max(1, count - 1)) * 0.3;

        const isFaded = focusRootId ? !visibleEdgeIds.has(r.id) : false;
        const isStrong = r.weight === 'strong';
        const isMedium = r.weight === 'medium';

        let strokeColor = '#475569';
        let strokeWidth = 1.6;
        let isAnimated = false;
        let dashPattern: string | undefined = '4,4';

        if (isStrong) {
          strokeColor = '#10b981'; // Emerald
          strokeWidth = 2.4;
          isAnimated = true;
          dashPattern = undefined;
        } else if (isMedium) {
          strokeColor = '#3b82f6'; // Blue
          strokeWidth = 1.8;
          dashPattern = undefined;
        }

        return {
          id: r.id,
          source: r.source,
          target: r.target,
          type: 'intelligence',
          animated: isAnimated,
          style: {
            stroke: strokeColor,
            strokeWidth,
            strokeDasharray: dashPattern,
            opacity: isFaded ? 0.12 : 0.9,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strokeColor,
          },
          data: {
            ...r,
            labelRatio,
            onSelect: (rel: any) => setSelectedRelationship(rel),
          },
        };
      });

      const layouted = layoutElements(flowNodes, flowEdges, 'LR');
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
    }
  }, [
    entities,
    relationships,
    clusters,
    expandedClusters,
    viewMode,
    focusRootId,
    hopDepth,
    searchQuery,
    verifiedOnly,
    minConfidence,
    typeFilters,
    caseId,
    caseLabel,
    caseTitle,
    setNodes,
    setEdges,
  ]);

  // Handle node selection for Focus Mode
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'entity') {
        if (focusRootId === node.id) {
          // Deselect
          setFocusRootId(null);
        } else {
          setFocusRootId(node.id);
        }
      }
    },
    [focusRootId]
  );

  // Handle edge selection for Evidence Inspection Drawer
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const rel = relationships.find((r) => r.id === edge.id);
      if (rel) {
        setSelectedRelationship(rel);
      }
    },
    [relationships]
  );

  // Human-in-the-loop review action
  const handleReviewRelationship = useCallback(
    async (relId: string, status: 'ACCEPTED' | 'REJECTED') => {
      try {
        setRelationships((prev) =>
          prev.map((r) =>
            r.id === relId
              ? { ...r, status, weight: status === 'ACCEPTED' ? 'strong' : 'inferred' }
              : r
          )
        );
        setSelectedRelationship(null);
      } catch (err) {
        console.error('Failed to review relationship:', err);
      }
    },
    []
  );

  // Clear focus mode
  const handleClearFocus = () => {
    setFocusRootId(null);
  };

  const currentFocusEntity = useMemo(() => {
    if (!focusRootId) return null;
    return entities.find((e) => e.id === focusRootId) || null;
  }, [focusRootId, entities]);

  const sourceEntityForDrawer = useMemo(() => {
    if (!selectedRelationship) return undefined;
    return entities.find((e) => e.id === selectedRelationship.source);
  }, [selectedRelationship, entities]);

  const targetEntityForDrawer = useMemo(() => {
    if (!selectedRelationship) return undefined;
    return entities.find((e) => e.id === selectedRelationship.target);
  }, [selectedRelationship, entities]);

  return (
    <div className="-m-5 flex h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden text-white select-none sm:-m-6 lg:-m-8">
      {/* Top Bar: Case picker, Visualization Mode Tabs, & Search */}
      <header className={cn(surfaceHeader, 'z-30 flex min-h-14 shrink-0 items-center gap-3 px-4 !py-2 md:gap-4 md:px-6')}>
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="shrink-0 rounded border border-red-500/30 bg-red-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-red-400">
            SIH-26189
          </span>

          {/* GCP-style case selector */}
          <div className="relative min-w-0 max-w-md" ref={casePickerRef}>
            <button
              type="button"
              onClick={() => setCasePickerOpen((open) => !open)}
              className={cn(
                'flex w-full max-w-md items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left transition',
                casePickerOpen
                  ? 'border-blue-500/50 bg-blue-600/10'
                  : 'border-white/[0.1] bg-white/[0.03] hover:border-white/[0.18] hover:bg-white/[0.06]'
              )}
              aria-expanded={casePickerOpen}
              aria-haspopup="listbox"
            >
              <Briefcase className="h-3.5 w-3.5 shrink-0 text-blue-400" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-xs font-bold text-white">{caseLabel}</div>
                <div className="truncate text-[10px] text-white/45">{caseTitle}</div>
              </div>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 shrink-0 text-white/40 transition-transform',
                  casePickerOpen && 'rotate-180'
                )}
              />
            </button>

            {casePickerOpen && (
              <div className={cn(surfaceCard, 'absolute left-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-6rem))] overflow-hidden p-0')}>
                <div className="border-b border-white/[0.08] p-2.5">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
                    <input
                      autoFocus
                      type="text"
                      value={casePickerQuery}
                      onChange={(e) => setCasePickerQuery(e.target.value)}
                      placeholder="Search cases..."
                      className={cn(surfaceInput, 'py-1.5 pl-8 text-xs')}
                    />
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto p-1.5" role="listbox">
                  {casesLoading ? (
                    <div className="px-3 py-6 text-center text-xs text-white/40">Loading cases…</div>
                  ) : filteredPickerCases.length === 0 ? (
                    <div className="px-3 py-6 text-center text-xs text-white/40">No cases found</div>
                  ) : (
                    filteredPickerCases.map((c) => {
                      const selected = c.id === caseId;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => handleSelectCase(c)}
                          className={cn(
                            'flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition',
                            selected ? 'bg-blue-600/15' : 'hover:bg-white/[0.06]'
                          )}
                        >
                          <Briefcase
                            className={cn(
                              'mt-0.5 h-3.5 w-3.5 shrink-0',
                              selected ? 'text-blue-400' : 'text-white/35'
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-mono text-xs font-bold text-white">
                                {c.case_number}
                              </span>
                              <span className="shrink-0 rounded border border-white/[0.08] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-white/40">
                                {c.status}
                              </span>
                            </div>
                            <div className="truncate text-[11px] text-white/45">{c.title}</div>
                          </div>
                          {selected ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" /> : null}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className={cn(surfacePanel, 'flex shrink-0 items-center gap-0.5 p-1')}>
          {(
            [
              { mode: 'OVERVIEW' as const, icon: Layers, label: 'Overview' },
              { mode: 'NETWORK' as const, icon: Network, label: 'Network' },
              { mode: 'TIMELINE' as const, icon: Calendar, label: 'Timeline' },
              { mode: 'EVIDENCE' as const, icon: FileText, label: 'Evidence' },
            ] as const
          ).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              title={label}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all md:px-3',
                viewMode === mode ? 'bg-blue-600 text-white shadow-md' : 'text-white/45 hover:text-white'
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden lg:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Quick Search Input */}
        <div className="relative hidden w-44 shrink-0 md:block lg:w-52 xl:w-64">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entity, phone..."
            className={cn(surfaceInput, 'py-1.5 pl-9 text-xs')}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* React Flow Intelligence Canvas */}
        {(viewMode === 'OVERVIEW' || viewMode === 'NETWORK') && (
        <div className="w-full h-full relative">
            <ReactFlow
              colorMode="dark"
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.15}
              maxZoom={1.8}
            >
              <Background color="#333" gap={28} size={1} />
              <Controls
                className={cn(
                  surfaceCard,
                  'sih-rf-controls overflow-hidden p-0 text-white',
                  '!bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:!bottom-4'
                )}
              />

              {/* Focus Mode Banner (if an entity is selected) */}
              {currentFocusEntity && viewMode === 'NETWORK' && (
                <Panel position="top-center" className={cn(surfaceCard, 'flex items-center gap-4 border-cyan-500/40 px-5 py-2.5 shadow-[0_0_30px_rgba(6,182,212,0.3)] backdrop-blur-md')}>
                  <div className="flex items-center gap-2">
                    <Focus className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <div>
                      <div className="text-[9px] font-mono font-bold text-cyan-400 uppercase">ACTIVE FOCUS MODE</div>
                      <div className="text-xs font-black text-white">{currentFocusEntity.label}</div>
                    </div>
                  </div>

                  <div className="h-6 w-px bg-white/10" />

                  {/* N-Hop Depth Buttons */}
                  <div className="flex items-center gap-1">
                    <span className="mr-1 text-[10px] text-white/45">Depth:</span>
                    {[1, 2, 3].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHopDepth(h)}
                        className={cn(
                          'h-6 w-6 rounded-lg font-mono text-[10px] font-bold transition-all',
                          hopDepth === h
                            ? 'bg-cyan-500 text-black shadow-md'
                            : 'bg-white/[0.05] text-white/45 hover:text-white'
                        )}
                      >
                        {h}H
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleClearFocus}
                    className="ml-2 flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.05] text-white/45 transition-colors hover:bg-white/[0.1] hover:text-white"
                    title="Exit Focus Mode"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Panel>
              )}

              {/* Filter Panel (Left) */}
              <Panel
                position="top-left"
                className={cn(
                  surfaceCard,
                  'backdrop-blur-md transition-all',
                  filtersCollapsed ? 'w-auto p-1.5' : 'w-72 space-y-4 p-4'
                )}
              >
                {filtersCollapsed ? (
                  <button
                    type="button"
                    onClick={() => setFiltersCollapsed(false)}
                    className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold text-white/80 transition hover:bg-white/[0.06] hover:text-white"
                    title="Expand investigation filters"
                  >
                    <Filter className="h-3.5 w-3.5 text-blue-400" />
                    <span className="font-mono text-[10px] text-white/45">
                      {nodes.length}N · {edges.length}E
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-white/40" />
                  </button>
                ) : (
                  <>
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                        <Filter className="h-3.5 w-3.5 text-blue-400" />
                        <span>Investigation Filters</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded border border-white/[0.08] bg-white/[0.05] px-2 py-0.5 font-mono text-[10px] text-white/45">
                          {nodes.length}N · {edges.length}E
                        </span>
                        <button
                          type="button"
                          onClick={() => setFiltersCollapsed(true)}
                          className="flex h-6 w-6 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/[0.08] hover:text-white"
                          title="Collapse filters"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Relationship Status Filter */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-white/70">Relationship Hierarchy</label>
                      <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-white/70">
                        <input
                          type="checkbox"
                          checked={verifiedOnly}
                          onChange={(e) => setVerifiedOnly(e.target.checked)}
                          className="rounded border-white/[0.12] bg-black/50 text-emerald-500 focus:ring-0"
                        />
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                        <span>Verified / Confirmed Only</span>
                      </label>
                    </div>

                    {/* Entity Category Toggles */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-white/70">Entity Clusters</label>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        {Object.keys(typeFilters).map((typeKey) => (
                          <label key={typeKey} className="flex cursor-pointer select-none items-center gap-1.5 text-white/70">
                            <input
                              type="checkbox"
                              checked={typeFilters[typeKey]}
                              onChange={(e) =>
                                setTypeFilters((prev) => ({ ...prev, [typeKey]: e.target.checked }))
                              }
                              className="rounded border-white/[0.12] bg-black/50 text-blue-500 focus:ring-0"
                            />
                            <span className="capitalize">{typeKey.toLowerCase().replace('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Minimum Confidence Slider */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-white/45">Min Score</span>
                        <span className="font-mono font-bold text-emerald-400">{Math.round(minConfidence * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={minConfidence}
                        onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                        className="h-1.5 w-full cursor-pointer rounded-lg bg-white/[0.08] accent-blue-500"
                      />
                    </div>

                    {/* Refresh / Re-layout Button */}
                    <button
                      type="button"
                      onClick={fetchGraphData}
                      className={cn(surfaceBtnPrimary, 'w-full gap-2 active:scale-95')}
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Recompute Hierarchical Layout
                    </button>
                  </>
                )}
              </Panel>

              {/* Quick Launch Timeline & Evidence Calendar Panel (Top Right) */}
              <Panel position="top-right" className="mr-3 mt-3">
                <button
                  onClick={() => setIsCalendarMenuOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111420]/95 backdrop-blur-md border border-blue-500/40 text-blue-300 hover:text-white text-xs font-bold transition-all shadow-xl hover:border-blue-400 active:scale-95 group"
                >
                  <Calendar className="w-4 h-4 text-blue-400 group-hover:rotate-6 transition-transform" />
                  <span>Timeline Calendar</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-500 text-white font-mono text-[10px]">
                    {timelineEvents.length}
                  </span>
                </button>
              </Panel>
            </ReactFlow>

            {/* Evidence & Relationship Inspector Drawer */}
            <RelationshipEvidenceDrawer
              relationship={selectedRelationship}
              sourceEntity={sourceEntityForDrawer}
              targetEntity={targetEntityForDrawer}
              onClose={() => setSelectedRelationship(null)}
              onReview={handleReviewRelationship}
            />
          </div>
        )}

        {/* MODE 3: Timeline Mode (Chronological Events & Intercepts) */}
        {viewMode === 'TIMELINE' && (
          <div className="w-full h-full overflow-y-auto p-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" /> Chronological Case Timeline
                </h2>
                <p className="mt-1 text-xs text-white/45">
                  Sequential record of communication intercepts, fund transfers, and suspect sightings
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-xs font-bold">
                {timelineEvents.length} Verified Events
              </span>
            </div>

            <div className="relative border-l-2 border-white/10 ml-4 pl-6 space-y-8">
              {timelineEvents.map((evt) => (
                <div key={evt.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-blue-500 bg-black transition-transform group-hover:scale-125" />

                  <div className={cn(surfaceCard, 'gap-0 p-4 transition-all hover:border-blue-500/50')}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                          {evt.category}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-xs text-white/45">
                          <Clock className="h-3 w-3 text-white/40" /> {evt.timestamp}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 font-bold">
                        {Math.round(evt.confidence * 100)}% Conf
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white mt-2">{evt.title}</h3>
                    <p className="mt-1 rounded-lg border border-white/[0.08] border-l-2 border-l-blue-500 bg-black/30 p-2.5 font-serif text-xs italic text-white/70">
                      "{evt.description}"
                    </p>

                    {/* Action: Focus Graph Around this Event */}
                    {evt.primaryEntityId && (
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setFocusRootId(evt.primaryEntityId!);
                            setViewMode('NETWORK');
                          }}
                          className={cn(surfaceBtnSecondary, 'gap-1.5 border-blue-500/20 bg-blue-500/10 py-1 text-xs text-blue-300 hover:bg-blue-500/20')}
                        >
                          <Focus className="w-3.5 h-3.5 text-blue-400" /> Show Graph Around This Event
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODE 4: Evidence Mode (Evidence-First Directory & Provenance) */}
        {viewMode === 'EVIDENCE' && (
          <div className="w-full h-full overflow-y-auto p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" /> Case Evidence Dossier
                </h2>
                <p className="mt-1 text-xs text-white/45">
                  Evidence-first directory linking source documentation to extracted entities & verified relationships
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
                {evidenceItems.length} Evidence Records
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {evidenceItems.map((ev) => (
                <div key={ev.id} className={cn(surfaceCard, 'gap-0 p-5 transition-all hover:border-emerald-500/40')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">{ev.sourceDoc}</h4>
                        <h3 className="text-sm font-black text-white">{ev.title}</h3>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
                      {Math.round(ev.reliability * 100)}% Reliability
                    </span>
                  </div>

                  <div className="mt-3 rounded-xl border border-white/[0.08] border-l-4 border-l-emerald-500 bg-black/40 p-3 font-serif text-xs italic text-white/70">
                    "{ev.snippet}"
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-white/[0.08] pt-3 text-xs text-white/45">
                    <span className="flex items-center gap-1.5 font-mono text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Extracted & Validated via Hybrid NER Pipeline
                    </span>
                    <button
                      onClick={() => {
                        if (ev.linkedEntityIds[0]) {
                          setFocusRootId(ev.linkedEntityIds[0]);
                          setViewMode('NETWORK');
                        }
                      }}
                      className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition-colors"
                    >
                      View on Graph <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <TimelineEvidenceCalendarMenu
          isOpen={isCalendarMenuOpen}
          onClose={() => setIsCalendarMenuOpen(false)}
          timelineEvents={timelineEvents}
          evidenceItems={evidenceItems}
          onFocusEntity={(entityId) => {
            setFocusRootId(entityId);
            setViewMode('NETWORK');
            setIsCalendarMenuOpen(false);
          }}
        />
      </div>
    </div>
  );
}
