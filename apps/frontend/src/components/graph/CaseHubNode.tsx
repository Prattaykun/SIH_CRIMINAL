'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ShieldAlert, FolderKey, GitFork, ArrowDown } from 'lucide-react';

export const CaseHubNode = memo(({ data }: any) => {
  const caseNumber = data?.caseNumber || 'CASE-DOSSIER';
  const title = data?.title || 'Criminal Network Investigation';
  const totalClusters = data?.totalClusters || 5;
  const totalEntities = data?.totalEntities || 0;

  return (
    <div className="w-80 rounded-2xl bg-gradient-to-b from-[#181c2b] to-[#0f121d] border-2 border-red-500/60 p-4 shadow-[0_0_40px_rgba(239,68,68,0.2)] text-white select-none">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono tracking-widest text-red-400 font-bold uppercase">PRIMARY INVESTIGATION</div>
            <div className="text-sm font-black text-white font-mono">{caseNumber}</div>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/40 text-[9px] font-bold text-red-300 uppercase tracking-wider">
          ACTIVE LEAD
        </span>
      </div>

      <div className="mt-3">
        <h3 className="text-xs font-bold text-slate-200 line-clamp-1">{title}</h3>
        <p className="text-[11px] text-slate-400 mt-1">Multi-jurisdiction syndicate intelligence chart</p>
      </div>

      <div className="mt-3.5 pt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-center">
        <div className="bg-white/5 rounded-lg py-1.5 px-2 border border-white/5">
          <div className="text-[10px] text-slate-400">Clusters</div>
          <div className="text-xs font-bold text-blue-400 font-mono">{totalClusters} Sectors</div>
        </div>
        <div className="bg-white/5 rounded-lg py-1.5 px-2 border border-white/5">
          <div className="text-[10px] text-slate-400">Identified Entities</div>
          <div className="text-xs font-bold text-emerald-400 font-mono">{totalEntities} Nodes</div>
        </div>
      </div>

      {/* Semantic Connection Ports */}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-red-500 border-2 border-[#0f121d] -bottom-1.5" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500 border-2 border-[#0f121d] -right-1.5" />
      <Handle type="source" position={Position.Left} className="w-3 h-3 bg-blue-500 border-2 border-[#0f121d] -left-1.5" />
    </div>
  );
});

CaseHubNode.displayName = 'CaseHubNode';
