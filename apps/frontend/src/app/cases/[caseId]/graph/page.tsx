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
  Eye,
  X,
  ChevronRight,
  Focus,
  Sliders,
  CheckCircle2,
  Activity,
} from 'lucide-react';

const nodeTypes = {
  entity: EntityNode,
  clusterGroup: ClusterGroupNode,
  caseHub: CaseHubNode,
};

const edgeTypes = {
  intelligence: IntelligenceEdge,
};

type ViewMode = 'OVERVIEW' | 'NETWORK';

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

  // Right-hand popup timeline & evidence calendar menu state
  const [isCalendarMenuOpen, setIsCalendarMenuOpen] = useState(false);

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

        {/* Right-hand side Timeline Calendar & Evidence trigger */}
        <button
          onClick={() => setIsCalendarMenuOpen((prev) => !prev)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
            isCalendarMenuOpen
              ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
              : 'bg-blue-600/15 hover:bg-blue-600/25 border-blue-500/40 text-blue-300 hover:text-white'
          }`}
          title="Open Timeline Calendar & Evidence Stream"
        >
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          <span>Calendar & Evidence</span>
          <span className="px-1.5 py-0.2 rounded-full bg-blue-500 text-white font-mono text-[10px]">
            {timelineEvents.length + evidenceItems.length}
          </span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* React Flow Intelligence Canvas */}
        <div className="w-full h-full relative">
            <ReactFlow
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
      </div>

      {/* Right-Hand Timeline & Evidence Calendar Popup Drawer */}
      <TimelineEvidenceCalendarMenu
        isOpen={isCalendarMenuOpen}
        onClose={() => setIsCalendarMenuOpen(false)}
        timelineEvents={timelineEvents}
        evidenceItems={evidenceItems}
        onFocusEntity={(entityId) => {
          setFocusRootId(entityId);
          setViewMode('NETWORK');
        }}
        onSelectRelationship={(relId) => {
          const rel = relationships.find((r) => r.id === relId);
          if (rel) {
            setSelectedRelationship(rel);
          }
        }}
      />
    </div>
  );
}
