'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { User, Building2, Landmark, Car, Phone, MapPin, FileText, CheckCircle2, AlertCircle, Link2, ShieldCheck } from 'lucide-react';

const iconMap: Record<string, any> = {
  PERSON: User,
  ORGANIZATION: Building2,
  ACCOUNT: Landmark,
  BANK_ACCOUNT: Landmark,
  VEHICLE: Car,
  PHONE_NUMBER: Phone,
  PHONE: Phone,
  LOCATION: MapPin,
  DOCUMENT: FileText,
};

const colorMap: Record<string, { border: string; bg: string; text: string; badge: string; glow: string }> = {
  PERSON: {
    border: 'border-blue-500/50',
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    badge: 'bg-blue-500/25',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.25)]',
  },
  ORGANIZATION: {
    border: 'border-purple-500/50',
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    badge: 'bg-purple-500/25',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.25)]',
  },
  ACCOUNT: {
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/25',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.25)]',
  },
  BANK_ACCOUNT: {
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/25',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.25)]',
  },
  VEHICLE: {
    border: 'border-orange-500/50',
    bg: 'bg-orange-500/15',
    text: 'text-orange-400',
    badge: 'bg-orange-500/25',
    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.25)]',
  },
  PHONE_NUMBER: {
    border: 'border-pink-500/50',
    bg: 'bg-pink-500/15',
    text: 'text-pink-400',
    badge: 'bg-pink-500/25',
    glow: 'shadow-[0_0_20px_rgba(236,72,153,0.25)]',
  },
  PHONE: {
    border: 'border-pink-500/50',
    bg: 'bg-pink-500/15',
    text: 'text-pink-400',
    badge: 'bg-pink-500/25',
    glow: 'shadow-[0_0_20px_rgba(236,72,153,0.25)]',
  },
  LOCATION: {
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    badge: 'bg-amber-500/25',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
  },
  DOCUMENT: {
    border: 'border-cyan-500/50',
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-400',
    badge: 'bg-cyan-500/25',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.25)]',
  },
};

export const EntityNode = memo(({ data, selected }: any) => {
  const type = (data?.entity_type || 'PERSON').toUpperCase();
  const colors = colorMap[type] || colorMap.PERSON;
  const Icon = iconMap[type] || User;

  const isVerified = data?.status === 'ACCEPTED' || data?.status === 'CORRECTED';
  const isFocusRoot = data?.isFocusRoot ?? false;
  const isFaded = data?.isFaded ?? false;
  const isSearchMatch = data?.isSearchMatch ?? false;
  const connectionsCount = data?.connectionsCount || 0;
  const evidenceCount = data?.evidenceCount || 0;
  const confidence = Math.round((data?.confidence ?? 0.85) * 100);
  const subTitle = data?.subTitle || (type === 'PERSON' ? 'Identified Subject' : type);

  // Focus root / Search match / Selected border override
  let cardBorder = colors.border;
  let shadowClass = colors.glow;

  if (isSearchMatch) {
    cardBorder = 'border-2 border-amber-400 ring-4 ring-amber-400/35';
    shadowClass = 'shadow-[0_0_40px_rgba(251,191,36,0.55)]';
  } else if (isFocusRoot) {
    cardBorder = 'border-2 border-cyan-400 ring-4 ring-cyan-500/30';
    shadowClass = 'shadow-[0_0_35px_rgba(6,182,212,0.5)]';
  } else if (selected) {
    cardBorder = 'border-2 border-white ring-2 ring-white/30';
    shadowClass = 'shadow-[0_0_25px_rgba(255,255,255,0.4)]';
  }

  return (
    <div
      className={`w-64 rounded-2xl bg-[#131622] ${cardBorder} p-3.5 ${shadowClass} transition-all duration-300 select-none ${
        isFaded && !isSearchMatch
          ? 'opacity-20 hover:opacity-100 grayscale hover:grayscale-0'
          : isSearchMatch
            ? 'opacity-100 scale-[1.03] z-10'
            : 'opacity-100 hover:scale-102 hover:border-white/60'
      }`}
    >
      {isSearchMatch && (
        <div className="mb-2 flex items-center gap-1.5 rounded-md border border-amber-400/40 bg-amber-500/15 px-2 py-0.5">
          <span className="text-[9px] font-black uppercase tracking-wider text-amber-300">Search match</span>
        </div>
      )}
      {/* Semantic Connection Ports (Left = Target, Right = Source, Top/Bottom = Hierarchical) */}
      <Handle
        type="target"
        position={Position.Left}
        id="port-left"
        className="w-3 h-3 bg-blue-500 border-2 border-[#131622] -left-1.5 hover:scale-125 transition-transform"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="port-top"
        className="w-2.5 h-2.5 bg-blue-400 border-2 border-[#131622] -top-1 hover:scale-125 transition-transform"
      />

      {/* Header: Icon + Category + Verification Badge */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center shrink-0 border border-white/5`}>
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className={`px-2 py-0.5 rounded text-[9px] font-black ${colors.badge} ${colors.text} uppercase tracking-wider`}>
              {type}
            </span>
            {isVerified ? (
              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" /> VERIFIED
              </span>
            ) : (
              <span className="text-[9px] font-medium text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                UNREVIEWED
              </span>
            )}
          </div>
          <h4 className="text-xs font-black text-white truncate mt-1" title={data?.label || 'Entity'}>
            {data?.label || 'Unknown Entity'}
          </h4>
          <p className="text-[10px] text-slate-400 font-medium truncate">{subTitle}</p>
        </div>
      </div>

      {/* Metric Badges: Connections, Evidence, Confidence */}
      <div className="mt-3 pt-2.5 border-t border-white/5 grid grid-cols-3 gap-1.5 text-center">
        <div className="bg-white/5 rounded-lg py-1 px-1 border border-white/5">
          <div className="text-[9px] text-slate-400">Links</div>
          <div className="text-[11px] font-bold text-white font-mono">{connectionsCount}</div>
        </div>
        <div className="bg-white/5 rounded-lg py-1 px-1 border border-white/5">
          <div className="text-[9px] text-slate-400">Evidence</div>
          <div className="text-[11px] font-bold text-blue-400 font-mono">{evidenceCount}</div>
        </div>
        <div className="bg-white/5 rounded-lg py-1 px-1 border border-white/5">
          <div className="text-[9px] text-slate-400">Score</div>
          <div className="text-[11px] font-bold text-emerald-400 font-mono">{confidence}%</div>
        </div>
      </div>

      {/* Semantic Connection Ports (Right = Output, Bottom = Hierarchical) */}
      <Handle
        type="source"
        position={Position.Right}
        id="port-right"
        className="w-3 h-3 bg-emerald-500 border-2 border-[#131622] -right-1.5 hover:scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="port-bottom"
        className="w-2.5 h-2.5 bg-emerald-400 border-2 border-[#131622] -bottom-1 hover:scale-125 transition-transform"
      />
    </div>
  );
});

EntityNode.displayName = 'EntityNode';
