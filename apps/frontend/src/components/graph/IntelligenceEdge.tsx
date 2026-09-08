'use client';

import React, { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
} from '@xyflow/react';

export interface IntelligenceEdgeData {
  type?: string;
  weight?: 'strong' | 'medium' | 'inferred';
  confidence?: number;
  evidenceCount?: number;
  status?: string;
  labelRatio?: number;
  onSelect?: (relData: any) => void;
  raw?: any;
  [key: string]: any;
}

export const IntelligenceEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps) => {
  const edgeData = (data || {}) as IntelligenceEdgeData;
  const labelRatio = edgeData.labelRatio ?? 0.5;

  // Use smooth bezier curves for natural line separation without orthogonal line-snapping
  const [edgePath, defaultLabelX, defaultLabelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.35,
  });

  // Calculate staggered label position along the bezier curve
  const offsetMultiplier = (labelRatio - 0.5) * 0.8;
  const labelX = defaultLabelX + (targetX - sourceX) * offsetMultiplier;
  const labelY = defaultLabelY + (targetY - sourceY) * offsetMultiplier;

  const labelText = edgeData.type || 'CONNECTED';
  const isStrong = edgeData.weight === 'strong';
  const isMedium = edgeData.weight === 'medium';
  const isVerified = edgeData.status === 'ACCEPTED' || edgeData.status === 'CORRECTED';
  const evidenceCount = edgeData.evidenceCount || 1;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          strokeWidth: selected ? 3 : style.strokeWidth || 1.8,
          transition: 'all 0.2s ease',
        }}
        markerEnd={markerEnd}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan select-none z-10"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (edgeData.onSelect) {
                edgeData.onSelect(edgeData.raw || edgeData);
              }
            }}
            className={`group flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase transition-all duration-200 border shadow-md backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 ${
              selected
                ? 'bg-[#101424] text-white border-blue-400 ring-2 ring-blue-500/30'
                : isStrong
                ? 'bg-[#0a1512]/95 text-emerald-400 border-emerald-500/40 hover:border-emerald-400 hover:text-emerald-300'
                : isMedium
                ? 'bg-[#0d1526]/95 text-blue-300 border-blue-500/40 hover:border-blue-400 hover:text-blue-200'
                : 'bg-[#0f131f]/95 text-slate-300 border-slate-700/70 hover:border-slate-500 hover:text-white'
            }`}
            title={`Relationship: ${labelText} (${Math.round((edgeData.confidence || 0.8) * 100)}% confidence)`}
          >
            <span>{labelText}</span>
            {evidenceCount > 1 && (
              <span className="flex items-center justify-center bg-blue-500/25 text-blue-300 text-[8px] font-mono px-1 rounded-full border border-blue-400/30">
                {evidenceCount}x
              </span>
            )}
            {isVerified && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Verified" />
            )}
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

IntelligenceEdge.displayName = 'IntelligenceEdge';
