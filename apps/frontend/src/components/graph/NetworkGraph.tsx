'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
import { GraphResponse, GraphNode, GraphEdge } from '@/types/api';
import { EntityPanel } from './EntityPanel';
import { RelationshipPanel } from './RelationshipPanel';
import { GraphFilters } from './GraphFilters';

// Neon Threat-Intel Colors
const NODE_COLORS: Record<string, string> = {
  PERSON: '#3b82f6', // Neon Blue
  PHONE: '#a855f7', // Neon Purple
  VEHICLE: '#f97316', // Neon Orange
  LOCATION: '#10b981', // Emerald Green
  ORGANIZATION: '#eab308', // Cyber Yellow
  BANK_ACCOUNT: '#ff3b57', // Crimson Red
  CASE: '#cbd5e1', // Bright Slate
  DOCUMENT: '#06b6d4', // Cyber Cyan
  EVENT: '#ec4899', // Hot Pink
};

interface NetworkGraphProps {
  data: GraphResponse;
}

export function NetworkGraph({ data }: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    verifiedOnly: true,
    minConfidence: 0.0,
    egoMode: false,
  });

  const resetFilters = () => {
    setFilters({ search: '', verifiedOnly: true, minConfidence: 0.0, egoMode: false });
  };

  const elements = useMemo(() => {
    const nodes = data.nodes.slice(0, 1000).map(n => ({
      data: {
        id: n.id,
        label: n.properties.name || n.properties.title || n.properties.phone_number || n.id,
        entity_type: n.entity_type,
        color: NODE_COLORS[n.entity_type] || '#94a3b8',
        original: n
      }
    }));

    const nodeIds = new Set(nodes.map(n => n.data.id));

    const edges = data.edges
      .filter(e => nodeIds.has(e.source_id) && nodeIds.has(e.target_id))
      .slice(0, 2000)
      .map(e => ({
        data: {
          id: e.id,
          source: e.source_id,
          target: e.target_id,
          label: e.relationship_type,
          verified: e.verified,
          status: (e as any).verification_status || (e.verified ? 'ACCEPTED' : 'UNREVIEWED'),
          confidence: e.confidence ?? 1.0,
          original: e
        }
      }));

    return { nodes, edges };
  }, [data]);

  // Apply filters without mutating original data
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    cy.elements().removeClass('hidden faded');

    // Filter edges
    if (filters.verifiedOnly || filters.minConfidence > 0) {
      cy.edges().forEach(edge => {
        const data = edge.data();
        let hide = false;
        if (filters.verifiedOnly && data.status !== 'ACCEPTED' && data.status !== 'CORRECTED') hide = true;
        if (filters.minConfidence > 0 && data.confidence < filters.minConfidence) hide = true;
        if (hide) edge.addClass('hidden');
      });
    }

    // Filter nodes by search
    if (filters.search.trim()) {
      const term = filters.search.toLowerCase();
      cy.nodes().forEach(node => {
        const data = node.data();
        if (!data.label.toLowerCase().includes(term) && !data.id.toLowerCase().includes(term)) {
          node.addClass('hidden');
        }
      });
    }

    // Apply Ego Mode (2-hop)
    if (filters.egoMode && selectedNode) {
      const rootNode = cy.getElementById(selectedNode.id);
      if (rootNode.length > 0) {
        // 1-hop and 2-hop neighborhood
        const hop1 = rootNode.neighborhood().union(rootNode);
        const hop2 = hop1.neighborhood().union(hop1);
        
        // Everything not in 2-hop gets faded
        cy.elements().difference(hop2).addClass('faded');
      }
    }

  }, [filters, selectedNode]);

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'width': 36,
            'height': 36,
            'font-size': '10px',
            'font-weight': 'bold',
            'color': '#f8fafc',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'text-background-opacity': 0.85,
            'text-background-color': '#0b0d13',
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            'border-width': 2,
            'border-color': '#334155',
            'background-color': '#94a3b8' // Fallback
          }
        },
        {
          selector: 'node[entity_type = "PERSON"]',
          style: { 'background-color': '#3b82f6', 'border-color': '#60a5fa' } // Blue
        },
        {
          selector: 'node[entity_type = "ORGANIZATION"]',
          style: { 'background-color': '#a855f7', 'border-color': '#c084fc' } // Purple
        },
        {
          selector: 'node[entity_type = "ACCOUNT"], node[entity_type = "BANK_ACCOUNT"]',
          style: { 'background-color': '#10b981', 'border-color': '#34d399' } // Emerald
        },
        {
          selector: 'node[entity_type = "VEHICLE"]',
          style: { 'background-color': '#f97316', 'border-color': '#fb923c' } // Orange
        },
        {
          selector: 'node[entity_type = "PHONE"], node[entity_type = "PHONE_NUMBER"]',
          style: { 'background-color': '#ec4899', 'border-color': '#f472b6' } // Pink
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': '#334155',
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#334155',
            'arrow-scale': 0.8,
            'opacity': 0.6,
          }
        },
        {
          selector: 'edge[status = "ACCEPTED"], edge[status = "CORRECTED"]',
          style: {
            'width': 2.5,
            'line-color': '#10b981', // Clean Emerald for verified facts
            'target-arrow-color': '#10b981',
            'opacity': 1.0,
            'label': 'data(label)',
            'font-size': '8px',
            'color': '#94a3b8',
            'text-rotation': 'autorotate',
            'text-background-opacity': 0.9,
            'text-background-color': '#0b0d13',
            'text-background-padding': '2px',
          }
        },
        {
          selector: 'edge[status = "UNREVIEWED"], edge[!verified]',
          style: {
            'line-style': 'dashed',
            'line-color': '#475569',
            'opacity': 0.35, // De-emphasize unreviewed candidate edges
          }
        },
        // Selections
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#ffffff',
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'width': 3,
            'line-color': '#ffffff',
            'target-arrow-color': '#ffffff',
          }
        },
        // Hidden & Faded
        {
          selector: '.hidden',
          style: {
            'display': 'none'
          }
        },
        {
          selector: '.faded',
          style: {
            'opacity': 0.15
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: false,
        nodeDimensionsIncludeLabels: true,
        idealEdgeLength: () => 140,            // Spread nodes apart
        nodeRepulsion: () => 15000,            // Strong repulsion prevents overlapping
        edgeElasticity: () => 0.1,
        nestingFactor: 0.1,
        gravity: 0.25,                   // Prevents disconnected nodes from flying away
        padding: 50,
        randomize: false,
      }
    });

    cy.on('tap', 'node', (evt: EventObject) => {
      setSelectedEdge(null);
      setSelectedNode(evt.target.data('original'));
    });

    cy.on('tap', 'edge', (evt: EventObject) => {
      setSelectedNode(null);
      setSelectedEdge(evt.target.data('original'));
    });

    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) {
        setSelectedNode(null);
        setSelectedEdge(null);
      }
    });

    cyRef.current = cy;

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [elements]);

  return (
    <div className="relative w-full h-[600px] bg-[#050914] border border-slate-800 rounded-xl overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]"
         style={{
           backgroundImage: `
             linear-gradient(to right, rgba(30, 41, 59, 0.3) 1px, transparent 1px),
             linear-gradient(to bottom, rgba(30, 41, 59, 0.3) 1px, transparent 1px)
           `,
           backgroundSize: '30px 30px'
         }}
    >
      <GraphFilters filters={filters} setFilters={setFilters} onReset={resetFilters} />
      
      {data.truncated && (
        <div className="absolute top-4 right-4 z-10 bg-amber-500/10 border border-amber-500/50 text-amber-400 px-3 py-2 rounded shadow-lg flex items-center gap-2 text-sm max-w-sm">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <div>
            <div className="font-semibold">Graph Truncated</div>
            <div className="text-xs text-amber-400/80">Showing first {elements.nodes.length} nodes to ensure browser stability.</div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
        <button onClick={() => cyRef.current?.fit()} className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-600 shadow" title="Fit to screen">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
        </button>
        <button onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.2)} className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-600 shadow" title="Zoom in">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
        </button>
        <button onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)} className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-600 shadow" title="Zoom out">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
        </button>
      </div>

      <div ref={containerRef} className="w-full h-full" />

      {selectedNode && (
        <EntityPanel entity={selectedNode} onClose={() => setSelectedNode(null)} />
      )}
      
      {selectedEdge && (
        <RelationshipPanel edge={selectedEdge} caseId={data.case_id || ''} onClose={() => setSelectedEdge(null)} />
      )}
    </div>
  );
}
