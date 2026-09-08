'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ReactFlow,
  MiniMap,
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
import { RelationshipEvidenceDrawer } from '@/components/graph/RelationshipEvidenceDrawer';
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
  Eye,
  X,
  Sparkles,
  ChevronRight,
  Focus,
  Sliders,
  CheckCircle2,
  Clock,
  ArrowRight,
  Activity,
} from 'lucide-react';

const nodeTypes = {
  entity: EntityNode,
  clusterGroup: ClusterGroupNode,
  caseHub: CaseHubNode,
};

type ViewMode = 'OVERVIEW' | 'NETWORK' | 'TIMELINE' | 'EVIDENCE';

// Dagre Layout computation supporting different rankdirs and cluster groupings
const layoutElements = (nodes: Node[], edges: Edge[], direction: 'LR' | 'TB' = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: direction === 'TB' ? 90 : 130,
    nodesep: direction === 'TB' ? 40 : 50,
  });

  nodes.forEach((node) => {
    const width = node.type === 'caseHub' ? 320 : node.type === 'clusterGroup' ? 260 : 260;
    const height = node.type === 'caseHub' ? 140 : node.type === 'clusterGroup' ? 100 : 100;
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
        x: (i % cols) * 280 + 40,
        y: Math.floor(i / cols) * 130 + 40,
      },
    }));
    return { nodes: layoutedNodes, edges };
  }

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = node.type === 'caseHub' ? 320 : node.type === 'clusterGroup' ? 260 : 260;
    const height = node.type === 'caseHub' ? 140 : node.type === 'clusterGroup' ? 100 : 100;
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

  // Focus & Hop mode state
  const [focusRootId, setFocusRootId] = useState<string | null>(null);
  const [hopDepth, setHopDepth] = useState<number>(2);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minConfidence, setMinConfidence] = useState(0.5);
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

  // Fetch initial graph data
  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    try {
      let rawEntities: any[] = [];
      let rawRels: any[] = [];

      if (typeof api.getExtractionCandidates === 'function') {
        const res = await api.getExtractionCandidates(caseId, 'case');
        rawEntities = res?.entities || res?.data?.entities || [];
        rawRels = res?.relationships || res?.data?.relationships || [];
      } else if (typeof (api as any).get === 'function') {
        const res = await (api as any).get(`/cases/${caseId}/candidates`);
        rawEntities = res?.data?.entities || res?.entities || [];
        rawRels = res?.data?.relationships || res?.relationships || [];
      }

      const normalized = normalizeGraphData(rawEntities, rawRels);
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
          caseNumber: caseId,
          title: 'Organized Syndicate & Criminal Network Analysis',
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

      // Map to React Flow edges with visual hierarchy
      const flowEdges: Edge[] = filteredRelationships.map((r) => {
        const isFaded = focusRootId ? !visibleEdgeIds.has(r.id) : false;
        const isStrong = r.weight === 'strong';
        const isMedium = r.weight === 'medium';

        let strokeColor = '#475569';
        let strokeWidth = 1.5;
        let isAnimated = false;
        let dashPattern: string | undefined = '4,4';

        if (isStrong) {
          strokeColor = '#10b981'; // Emerald
          strokeWidth = 2.5;
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
          label: r.type,
          type: 'smoothstep',
          animated: isAnimated,
          style: {
            stroke: strokeColor,
            strokeWidth,
            strokeDasharray: dashPattern,
            opacity: isFaded ? 0.12 : 0.9,
          },
          labelStyle: {
            fill: isStrong ? '#34d399' : '#94a3b8',
            fontSize: 9,
            fontWeight: 700,
          },
          labelBgStyle: { fill: '#0b0d13', fillOpacity: 0.85 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strokeColor,
          },
          data: r,
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
    <div className="w-full h-screen bg-[#090b10] text-white flex flex-col overflow-hidden select-none">
      {/* Top Bar: Case Identity, Visualization Mode Tabs, & Search */}
      <header className="h-14 border-b border-white/10 bg-[#0f121d]/90 backdrop-blur px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-red-400 bg-red-500/15 border border-red-500/30 px-2 py-0.5 rounded">
              SIH-26189
            </span>
            <h1 className="text-sm font-black text-white tracking-wide font-mono">{caseId}</h1>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-xs text-slate-400 font-medium">Criminal Intelligence Network Platform</span>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center bg-[#141724] border border-white/10 rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode('OVERVIEW')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'OVERVIEW' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Overview
          </button>
          <button
            onClick={() => setViewMode('NETWORK')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'NETWORK' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Network className="w-3.5 h-3.5" /> Network
          </button>
          <button
            onClick={() => setViewMode('TIMELINE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'TIMELINE' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Timeline
          </button>
          <button
            onClick={() => setViewMode('EVIDENCE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'EVIDENCE' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Evidence
          </button>
        </div>

        {/* Quick Search Input */}
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entity, phone, vehicle..."
            className="w-full bg-[#141724] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Render View Mode: OVERVIEW or NETWORK (React Flow) */}
        {(viewMode === 'OVERVIEW' || viewMode === 'NETWORK') && (
          <div className="w-full h-full relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.15}
              maxZoom={1.8}
            >
              <Background color="#1e293b" gap={28} size={1} />
              <Controls className="bg-[#141721] border border-white/10 text-white rounded-xl overflow-hidden shadow-xl" />
              <MiniMap
                nodeColor={(n: any) =>
                  n.type === 'caseHub' ? '#ef4444' : n.type === 'clusterGroup' ? '#3b82f6' : '#10b981'
                }
                className="bg-[#141721] border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                maskColor="rgba(9, 11, 16, 0.8)"
              />

              {/* Focus Mode Banner (if an entity is selected) */}
              {currentFocusEntity && viewMode === 'NETWORK' && (
                <Panel position="top-center" className="bg-[#111420]/95 backdrop-blur-md border border-cyan-500/40 rounded-2xl px-5 py-2.5 shadow-[0_0_30px_rgba(6,182,212,0.3)] flex items-center gap-4">
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
                    <span className="text-[10px] text-slate-400 mr-1">Depth:</span>
                    {[1, 2, 3].map((h) => (
                      <button
                        key={h}
                        onClick={() => setHopDepth(h)}
                        className={`w-6 h-6 rounded-lg text-[10px] font-bold font-mono transition-all ${
                          hopDepth === h
                            ? 'bg-cyan-500 text-black shadow-md'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {h}H
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleClearFocus}
                    className="ml-2 w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                    title="Exit Focus Mode"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Panel>
              )}

              {/* Filter Panel (Left) */}
              <Panel position="top-left" className="bg-[#111420]/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl space-y-4 w-72">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                    <Filter className="w-3.5 h-3.5 text-blue-400" />
                    <span>Investigation Filters</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                    {nodes.length}N • {edges.length}E
                  </span>
                </div>

                {/* Relationship Status Filter */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 block">Relationship Hierarchy</label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0"
                    />
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Verified / Confirmed Only</span>
                  </label>
                </div>

                {/* Entity Category Toggles */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 block">Entity Clusters</label>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {Object.keys(typeFilters).map((typeKey) => (
                      <label key={typeKey} className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={typeFilters[typeKey]}
                          onChange={(e) =>
                            setTypeFilters((prev) => ({ ...prev, [typeKey]: e.target.checked }))
                          }
                          className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
                        />
                        <span className="capitalize">{typeKey.toLowerCase().replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Minimum Confidence Slider */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Min Score</span>
                    <span className="font-mono text-emerald-400 font-bold">{Math.round(minConfidence * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={minConfidence}
                    onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Refresh / Re-layout Button */}
                <button
                  onClick={fetchGraphData}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Recompute Hierarchical Layout
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
                <p className="text-xs text-slate-400 mt-1">
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
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[#090b10] border-2 border-blue-500 flex items-center justify-center group-hover:scale-125 transition-transform" />

                  <div className="rounded-2xl bg-[#111420] border border-white/10 p-4 shadow-xl hover:border-blue-500/50 transition-all">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                          {evt.category}
                        </span>
                        <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" /> {evt.timestamp}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 font-bold">
                        {Math.round(evt.confidence * 100)}% Conf
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white mt-2">{evt.title}</h3>
                    <p className="text-xs text-slate-300 font-serif italic mt-1 bg-black/30 p-2.5 rounded-lg border border-white/5 border-l-2 border-l-blue-500">
                      "{evt.description}"
                    </p>

                    {/* Action: Focus Graph Around this Event */}
                    {evt.primaryEntityId && (
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-end">
                        <button
                          onClick={() => {
                            setFocusRootId(evt.primaryEntityId!);
                            setViewMode('NETWORK');
                          }}
                          className="py-1 px-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
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
                <p className="text-xs text-slate-400 mt-1">
                  Evidence-first directory linking source documentation to extracted entities & verified relationships
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
                {evidenceItems.length} Evidence Records
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {evidenceItems.map((ev) => (
                <div key={ev.id} className="rounded-2xl bg-[#111420] border border-white/10 p-5 shadow-xl hover:border-emerald-500/40 transition-all">
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

                  <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/5 font-serif text-xs text-slate-300 italic border-l-4 border-l-emerald-500">
                    "{ev.snippet}"
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
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
      </div>
    </div>
  );
}
