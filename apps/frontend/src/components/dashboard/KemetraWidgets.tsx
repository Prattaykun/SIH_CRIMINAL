'use client';

import React from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  Star,
  Camera,
  Check,
  Phone,
  Radio,
  FileText,
  Activity,
  ChevronDown,
  Building,
  Shield,
  Layers,
  Zap,
  AlertTriangle,
  Flame,
  Droplets,
  Landmark,
  Eye,
  ShieldCheck,
  Search,
  Settings,
} from 'lucide-react';
import { KemetraTrendChart, KemetraTrendPoint } from './DashboardCharts';

// =========================================================================
// 1. HIGH-IMPACT METRIC TREND CARD (Matching Reference Image Card Structure)
// =========================================================================
interface InvestigationMetricCardProps {
  title: string;
  count: number | string;
  unit: string;
  lastUpdate?: string;
  average?: number;
  minVal?: number;
  maxVal?: number;
  chartData?: KemetraTrendPoint[];
  gradientId: string;
  type?: 'count' | 'speed';
}

export function InvestigationMetricCard({
  title,
  count,
  unit,
  lastUpdate = 'Live Pipeline',
  average = 28,
  minVal = 20,
  maxVal = 40,
  chartData,
  gradientId,
  type = 'count',
}: InvestigationMetricCardProps) {
  return (
    <div className="rounded-2xl border border-[#212738] bg-[#111624] p-4 sm:p-5 flex flex-col justify-between shadow-lg text-slate-100 transition-colors">
      {/* Card Header & Actions */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1e2436]">
        <div className="flex items-center gap-2">
          <RefreshCw className="size-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-200">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <button title="Bookmark Metric" className="hover:text-amber-400 transition-colors">
            <Star className="size-3.5" />
          </button>
          <button title="Metric Config" className="hover:text-white transition-colors">
            <Settings className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="text-[10px] text-slate-400 font-mono mt-1">
        Last update: {lastUpdate}
      </div>

      {/* Main Number Display & Threshold Legend */}
      <div className="flex items-baseline justify-between mt-2.5 mb-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#5db329]">
            {count}
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-[#5db329] tracking-wider font-mono">
            {unit}
          </span>
        </div>

        {/* Legend Indicators */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1">
            <span className="w-3 border-b border-dashed border-slate-400" />
            <span>Average</span>
          </div>
          {type === 'speed' && (
            <div className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-cyan-400" />
              <span>Normal</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-amber-400" />
            <span>Max</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-blue-400" />
            <span>Min</span>
          </div>
        </div>
      </div>

      {/* Green Area Trend Chart */}
      <div className="w-full mt-1">
        <KemetraTrendChart
          data={chartData}
          average={average}
          minVal={minVal}
          maxVal={maxVal}
          isDark={true}
          gradientId={gradientId}
          lineColor="#5db329"
          unit={unit}
        />
      </div>
    </div>
  );
}

// =========================================================================
// 2. PATTERN ALERT CARD (Matching Accident Detected Card in Reference)
// =========================================================================
interface InvestigationPatternCardProps {
  caseNumber?: string;
}

export function InvestigationPatternCard({
  caseNumber = 'CASE-2024-SYN-922',
}: InvestigationPatternCardProps) {
  const checklistItems = [
    { label: 'Syndicate', value: 'Marcuz Kowalski', highlight: 'text-emerald-400 font-semibold', dotColor: 'bg-emerald-400' },
    { label: 'Match Confidence', value: '94% (High)', highlight: 'text-emerald-400 font-semibold', dotColor: 'bg-emerald-400' },
    { label: 'Typology', value: 'Hawala / Micro-Routing', highlight: 'text-blue-400', dotColor: 'bg-blue-400' },
    { label: 'Evidence Dossier', value: 'FIR-SYN-2024-001', highlight: 'text-slate-200 font-mono text-[9px]', dotColor: 'bg-indigo-400' },
    { label: 'Bridge Nodes', value: '4 Pending Review', highlight: 'text-amber-400 font-semibold', dotColor: 'bg-amber-400' },
    { label: 'Sign-off', value: 'Mandatory Prior to Action', highlight: 'text-rose-400 font-semibold', dotColor: 'bg-rose-400' },
    { label: 'Freezing Order', value: 'Dispatched to FIU', highlight: 'text-cyan-400', dotColor: 'bg-cyan-400' },
    { label: 'CDR Intercept', value: 'Active Monitoring', highlight: 'text-purple-400', dotColor: 'bg-purple-400' },
  ];

  return (
    <div className="rounded-2xl border border-[#212738] bg-[#111624] p-4 sm:p-5 flex flex-col justify-between shadow-lg text-slate-100 transition-colors h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-[#1e2436]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-[#5db329]" />
            <span className="text-xs font-bold text-slate-200">
              Explainable Pattern Signals
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
            <Camera className="size-3.5 cursor-pointer hover:text-white" />
            <Check className="size-3.5 cursor-pointer hover:text-white" />
            <Star className="size-3.5 cursor-pointer hover:text-white" />
            <span className="text-[10px] text-slate-400 font-mono">Event ID: {caseNumber}</span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-mono mt-1">
          Last update: Live Graph Topology Pipeline
        </div>

        {/* Title & Emergency Level Bars */}
        <div className="mt-2.5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-extrabold text-white">
              Syndicate Community Cluster Flagged
            </span>
            <span className="text-[#5db329] text-xs font-bold">▲</span>
          </div>

          {/* Segmented Emergency Level Indicator */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-2 rounded-xs bg-[#5db329]" />
              <span className="w-3.5 h-2 rounded-xs bg-[#5db329]" />
              <span className="w-3.5 h-2 rounded-xs bg-[#5db329]" />
              <span className="w-3.5 h-2 rounded-xs bg-[#5db329]" />
              <span className="w-3.5 h-2 rounded-xs bg-slate-700" />
            </div>
            <span className="text-[10px] font-semibold text-slate-400 font-mono">
              Priority: HIGH
            </span>
          </div>
        </div>
      </div>

      {/* Two-Column Content: Narrative + Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 mt-3 pt-3 border-t border-[#1e2436] text-xs leading-relaxed">
        {/* Narrative Paragraph (7 cols) */}
        <div className="md:col-span-6 flex flex-col justify-between space-y-2">
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Cross-border financial routing detected between 3 shell entities and Marcuz Kowalski syndicate. Rapid burst of micro-transactions flagged by FIU pattern analyzer. Neo4j Louvain algorithm isolated dense community cluster with 4 pending bridge nodes. Automated link telemetry dispatched for authorized investigator review.
          </p>
          <div className="pt-2 border-t border-[#1e2436]/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Algorithm: Louvain Community</span>
            <span className="text-emerald-400 font-medium">94% Confidence</span>
          </div>
        </div>

        {/* Structured Key/Value Checklist (6 cols) */}
        <div className="md:col-span-6 space-y-1 text-[10px] font-sans md:border-l md:border-[#1e2436] md:pl-3 pt-2 md:pt-0">
          {checklistItems.map((item, idx) => (
            <div key={idx} className="flex items-baseline gap-1.5 leading-snug">
              <span className={`size-1.5 rounded-full shrink-0 ${item.dotColor} mt-0.5`} />
              <span className="text-slate-400 shrink-0">{item.label}:</span>
              <span className={`truncate ${item.highlight || 'text-slate-200'}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 3. TASK FORCE DISPATCH MATRIX (Matching CTECC Table Card in Reference)
// =========================================================================
interface TaskForceDispatchProps {
  caseNumber?: string;
}

export function TaskForceDispatchCard({
  caseNumber = 'CASE-2024-SYN-922',
}: TaskForceDispatchProps) {
  const agencyRows = [
    { name: 'Financial Intelligence Unit (FIU)', status: 'In Progress', variant: 'amber' },
    { name: 'Cyber Crime Investigation Cell', status: 'Dispatched', variant: 'emerald' },
    { name: 'Telecom Intercept Division', status: 'Dispatched', variant: 'emerald' },
    { name: 'Identity & Biometric Registry', status: 'Notified', variant: 'rose' },
    { name: 'Prosecutor Review Queue', status: 'Notified', variant: 'rose' },
    { name: 'Neo4j Knowledge Graph Sync', status: 'Triggered', variant: 'slate' },
  ];

  return (
    <div className="rounded-2xl border border-[#212738] bg-[#111624] p-4 sm:p-5 flex flex-col justify-between shadow-lg text-slate-100 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1e2436]">
        <div className="flex items-center gap-2">
          <Building className="size-4 text-[#5db329]" />
          <span className="text-xs font-bold text-slate-200">
            Inter-Agency Task Force Queue
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
          <Phone className="size-3.5 cursor-pointer hover:text-white" />
          <Star className="size-3.5 cursor-pointer hover:text-white" />
          <span className="text-[10px] text-slate-400">Event ID: {caseNumber}</span>
        </div>
      </div>

      <div className="text-[10px] text-slate-400 font-mono mt-1 mb-2">
        Last update: Live Task Force Interconnect
      </div>

      {/* Matrix Table List */}
      <div className="divide-y divide-[#1e2436]">
        {agencyRows.map((row, idx) => (
          <div key={idx} className="py-2 flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-slate-300 text-[11px] truncate">
              {row.name}
            </span>

            {/* Colored Status Pill Badge matching reference image */}
            <span
              className={`px-3 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                row.variant === 'amber'
                  ? 'bg-amber-950/50 text-amber-300 border border-amber-500/30'
                  : row.variant === 'emerald'
                  ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30'
                  : row.variant === 'rose'
                  ? 'bg-rose-950/50 text-rose-300 border border-rose-500/30'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {row.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =========================================================================
// 4. KEY METRICS 6-CARD GRID (Matching Bottom Section in Reference)
// =========================================================================
interface InvestigationKeyMetricsProps {
  stats?: any;
}

export function InvestigationKeyMetrics({ stats }: InvestigationKeyMetricsProps) {
  const metrics = [
    {
      title: 'Extracted Entities',
      value: stats?.network_structure?.node_count ? `${stats.network_structure.node_count} / 28 Nodes` : '28 / 28 Nodes',
      icon: Layers,
      color: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    },
    {
      title: 'Verified Relationships',
      value: stats?.network_structure?.edge_count ? `${stats.network_structure.edge_count} / 17 Links` : '12 / 17 Links',
      icon: Activity,
      color: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
    },
    {
      title: 'Flagged Wires / CDR',
      value: '5 / 24 Hrs',
      icon: Zap,
      color: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    },
    {
      title: 'Cross-Case Matches',
      value: '3 Active Cases',
      icon: Landmark,
      color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    },
    {
      title: 'Priority Alerts',
      value: '2 High Severity',
      icon: AlertTriangle,
      color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    },
    {
      title: 'Audit Trail Integrity',
      value: '100% Traceable',
      icon: ShieldCheck,
      color: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-white">
          Key Investigation Metrics
        </h3>
        <div className="flex items-center gap-1 text-xs text-slate-400 font-sans cursor-pointer hover:text-slate-200 transition-colors">
          <span>Last 24 Hours</span>
          <ChevronDown className="size-3.5" />
        </div>
      </div>

      {/* 6 Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-[#212738] bg-[#111624] p-3 sm:p-4 flex items-center gap-3 shadow-md hover:border-slate-700 transition-colors"
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${m.color}`}>
                <Icon className="size-4" />
              </div>
              <div className="truncate">
                <div className="text-[11px] font-medium text-slate-400 truncate">
                  {m.title}
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-white font-mono mt-0.5">
                  {m.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
