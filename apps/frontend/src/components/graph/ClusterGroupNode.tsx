'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Users, Landmark, Car, Phone, MapPin, Building2, ChevronRight, Layers } from 'lucide-react';

const clusterIconMap: Record<string, any> = {
  PERSON: Users,
  ORGANIZATION: Building2,
  ACCOUNT: Landmark,
  BANK_ACCOUNT: Landmark,
  VEHICLE: Car,
  PHONE_NUMBER: Phone,
  PHONE: Phone,
  LOCATION: MapPin,
};

export const ClusterGroupNode = memo(({ data }: any) => {
  const cluster = data?.cluster || 'PERSON';
  const label = data?.label || `${cluster} CLUSTER`;
  const count = data?.count || 0;
  const description = data?.description || 'Connected investigation entities';
  const isExpanded = data?.isExpanded ?? false;
  const onToggle = data?.onToggle;

  const Icon = clusterIconMap[cluster] || Layers;

  return (
    <div
      onClick={onToggle}
      className="w-64 rounded-2xl bg-[#111420] border-2 border-blue-500/50 hover:border-blue-400 p-3.5 shadow-xl cursor-pointer transition-all hover:scale-102 select-none group"
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500 border-2 border-[#111420] -top-1.5" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500 border-2 border-[#111420] -left-1.5" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold text-blue-400 uppercase tracking-wider">CLUSTER SECTOR</span>
            <h4 className="text-xs font-black text-white">{label}</h4>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-xs font-bold border border-blue-500/30">
          {count}
        </span>
      </div>

      <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">{description}</p>

      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center gap-1 text-blue-400 font-medium">
          {isExpanded ? 'Collapse Sector' : 'Expand Network'}
        </span>
        <ChevronRight className={`w-3.5 h-3.5 text-blue-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-emerald-500 border-2 border-[#111420] -bottom-1.5" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-500 border-2 border-[#111420] -right-1.5" />
    </div>
  );
});

ClusterGroupNode.displayName = 'ClusterGroupNode';
