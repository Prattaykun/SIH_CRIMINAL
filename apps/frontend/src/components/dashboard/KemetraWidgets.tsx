'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Globe,
  AlertTriangle,
  Zap,
  Sparkles,
  MessageSquare,
  Sliders,
  ShieldCheck,
  Settings,
  HelpCircle,
  FolderArchive,
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
  Bell,
  Sun,
  Moon,
  ExternalLink,
  Shield,
  Layers,
  Database,
  Flame,
  Droplets,
  Car,
} from 'lucide-react';
import { KemetraTrendChart, KemetraTrendPoint } from './DashboardCharts';

// =========================================================================
// 1. LEFT NAVIGATION SIDEBAR (Matching Reference Image)
// =========================================================================
interface KemetraSidebarProps {
  isDark?: boolean;
  activePath?: string;
}

export function KemetraSidebar({ isDark = false, activePath = '/' }: KemetraSidebarProps) {
  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, active: activePath === '/' },
    { name: 'Live Map', href: '/graph', icon: Globe },
    { name: 'Events', href: '/cases', icon: AlertTriangle },
    { name: 'Optimize', href: '/graph?mode=analysis', icon: Zap },
    { name: 'Predict', href: '/cases?filter=predictions', icon: Sparkles },
    { name: 'Message', href: '/audit?tab=messages', icon: MessageSquare },
    { name: 'Rules Engine', href: '/audit', icon: Sliders },
    { name: 'Permissions', href: '/settings?tab=access', icon: ShieldCheck },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const bottomItems = [
    { name: 'Evidence Vault', href: '/evidence', icon: FolderArchive },
    { name: 'Get Help', href: 'mailto:support@sih26189.intel', icon: HelpCircle },
  ];

  return (
    <aside
      className={`w-52 lg:w-56 shrink-0 border-r flex flex-col justify-between p-3 select-none transition-colors ${
        isDark
          ? 'bg-[#0e121d] border-[#1e2436] text-slate-300'
          : 'bg-white border-slate-200/90 text-slate-700'
      }`}
    >
      <div>
        {/* Brand Logo Header */}
        <Link href="/" className="flex items-center gap-2 px-3 py-3 mb-3 group">
          <div className="size-8 rounded-xl bg-gradient-to-br from-[#5db329] to-[#3b82f6] flex items-center justify-center text-white shadow-md font-extrabold text-sm">
            <span className="font-mono tracking-tighter">K</span>
          </div>
          <div>
            <div className="font-extrabold tracking-wider text-sm font-sans uppercase text-slate-900 dark:text-white">
              KEMETRA<span className="text-[#5db329]">.AI</span>
            </div>
            <div className="text-[9px] font-mono text-slate-400 font-medium tracking-tight">
              SIH 26189 INTEL
            </div>
          </div>
        </Link>

        {/* Main Navigation Menu */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  item.active
                    ? isDark
                      ? 'bg-slate-800 text-white font-semibold shadow-sm'
                      : 'bg-slate-100 text-slate-900 font-semibold shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`size-4 shrink-0 ${
                    item.active ? 'text-[#5db329]' : 'text-slate-400'
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Help & Documentation */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="size-4 shrink-0 text-slate-400" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

// =========================================================================
// 2. TOP CONTEXT & CONTROL BAR (Matching Reference Image)
// =========================================================================
interface KemetraTopBarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  activeTab: 'overview' | 'registry' | 'topology';
  onTabChange: (tab: 'overview' | 'registry' | 'topology') => void;
  selectedCase: string;
  onCaseChange: (caseId: string) => void;
  availableCases: Array<{ id: string; case_number: string; title: string }>;
}

export function KemetraTopBar({
  isDark,
  onToggleTheme,
  activeTab,
  onTabChange,
  selectedCase,
  onCaseChange,
  availableCases,
}: KemetraTopBarProps) {
  return (
    <header
      className={`px-4 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-4 select-none transition-colors ${
        isDark
          ? 'bg-[#0f1422] border-[#1e2436] text-slate-100'
          : 'bg-white border-slate-200/90 text-slate-800'
      }`}
    >
      {/* Left: Active Location / Case Card (Matching Reference Image) */}
      <div
        className={`flex items-center gap-3 px-3.5 py-2 rounded-2xl border shadow-xs transition-colors ${
          isDark
            ? 'bg-[#151b2a] border-[#232b3f]'
            : 'bg-white border-slate-200'
        }`}
      >
        <ChevronDown className="size-4 text-slate-400 shrink-0" />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <select
              aria-label="Select command jurisdiction or active case"
              value={selectedCase}
              onChange={(e) => onCaseChange(e.target.value)}
              className="bg-transparent font-bold text-xs sm:text-sm text-slate-900 dark:text-white cursor-pointer focus:outline-none pr-1"
            >
              <option value="all" className="bg-white dark:bg-[#151b2a] text-slate-900 dark:text-white">
                Central Crime Command
              </option>
              {availableCases.map((c) => (
                <option
                  key={c.id}
                  value={c.case_number}
                  className="bg-white dark:bg-[#151b2a] text-slate-900 dark:text-white"
                >
                  {c.case_number} — {c.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400">
            <span className="size-1.5 rounded-full bg-[#5db329]" />
            <span className="font-semibold text-[#5db329]">Online</span>
            <span>Update 20:32</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800 text-slate-400">
          <button title="Bookmark Case" className="hover:text-amber-500 transition-colors p-1">
            <Star className="size-3.5" />
          </button>
          <button title="Share Link" className="hover:text-blue-500 transition-colors p-1">
            <ExternalLink className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Center: Segmented Navigation Pill Tabs (Overview in bright green) */}
      <div
        className={`flex items-center p-1 rounded-xl border text-xs font-medium ${
          isDark
            ? 'bg-[#151b2a] border-[#232b3f]'
            : 'bg-slate-100/90 border-slate-200/80'
        }`}
      >
        <button
          onClick={() => onTabChange('overview')}
          className={`px-4 py-1.5 rounded-lg transition-all ${
            activeTab === 'overview'
              ? 'bg-[#5db329] text-white font-semibold shadow-xs'
              : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => onTabChange('registry')}
          className={`px-4 py-1.5 rounded-lg transition-all ${
            activeTab === 'registry'
              ? 'bg-[#5db329] text-white font-semibold shadow-xs'
              : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Cases Registry
        </button>
        <button
          onClick={() => onTabChange('topology')}
          className={`px-4 py-1.5 rounded-lg transition-all ${
            activeTab === 'topology'
              ? 'bg-[#5db329] text-white font-semibold shadow-xs'
              : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Topology
        </button>
      </div>

      {/* Right: Theme Toggle, Notifications, Profile (Matching Jane Cooper) */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          className={`p-2 rounded-xl border transition-colors ${
            isDark
              ? 'bg-[#151b2a] border-[#232b3f] text-amber-400 hover:bg-slate-800'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        {/* Notification Bell with Red Badge */}
        <div className="relative">
          <button
            title="Operational Alerts"
            className={`p-2 rounded-xl border relative transition-colors ${
              isDark
                ? 'bg-[#151b2a] border-[#232b3f] text-slate-300 hover:text-white hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Bell className="size-4" />
            <span className="absolute -top-1 -right-1 size-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center shadow-xs">
              2
            </span>
          </button>
        </div>

        {/* User Profile Card */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="size-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-[#5db329]/30">
            JC
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              Jane Cooper
            </span>
            <span className="text-[10px] font-mono text-slate-400 leading-tight">
              Lead Investigator
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

// =========================================================================
// 3. TOP TREND METRIC CARD (Matching Vehicle Count / Speed in Reference)
// =========================================================================
interface KemetraMetricTrendCardProps {
  title: string;
  count: number | string;
  unit: string;
  lastUpdate?: string;
  average?: number;
  minVal?: number;
  maxVal?: number;
  chartData?: KemetraTrendPoint[];
  gradientId: string;
  isDark?: boolean;
  type?: 'count' | 'speed';
}

export function KemetraMetricTrendCard({
  title,
  count,
  unit,
  lastUpdate = 'Live',
  average = 28,
  minVal = 20,
  maxVal = 40,
  chartData,
  gradientId,
  isDark = false,
  type = 'count',
}: KemetraMetricTrendCardProps) {
  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between shadow-xs transition-colors ${
        isDark
          ? 'bg-[#111624] border-[#212738] text-slate-100'
          : 'bg-white border-slate-200/90 text-slate-800'
      }`}
    >
      {/* Card Header & Controls */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <RefreshCw className="size-3.5 text-slate-400 animate-spin-reverse" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <button className="hover:text-slate-600 dark:hover:text-white transition-colors">
            <Star className="size-3.5" />
          </button>
          <button className="hover:text-slate-600 dark:hover:text-white transition-colors">
            <Settings className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="text-[10px] text-slate-400 font-mono mt-1">
        Last update: {lastUpdate}
      </div>

      {/* Main Metric Stat & Legend */}
      <div className="flex items-baseline justify-between mt-2 mb-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#5db329]">
            {count}
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-[#5db329] tracking-wider">
            {unit}
          </span>
        </div>

        {/* Legend Indicators */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <span className="w-3 border-b border-dashed border-slate-400" />
            <span>Average</span>
          </div>
          {type === 'speed' && (
            <div className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-cyan-500" />
              <span>Normal</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-amber-500" />
            <span>Max</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-blue-500" />
            <span>Min</span>
          </div>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="w-full mt-1">
        <KemetraTrendChart
          data={chartData}
          average={average}
          minVal={minVal}
          maxVal={maxVal}
          isDark={isDark}
          gradientId={gradientId}
          lineColor="#5db329"
          unit={unit}
        />
      </div>
    </div>
  );
}

// =========================================================================
// 4. PATTERN INCIDENT CARD (Matching Accident Detected in Reference)
// =========================================================================
interface KemetraIncidentCardProps {
  isDark?: boolean;
}

export function KemetraIncidentCard({ isDark = false }: KemetraIncidentCardProps) {
  const checklistItems = [
    { label: 'Syndicate Involved', value: 'Confirmed', highlight: 'text-emerald-600 dark:text-emerald-400 font-bold' },
    { label: 'Confidence Score', value: '94% Match', highlight: 'text-emerald-600 dark:text-emerald-400 font-bold' },
    { label: 'Typology Profile', value: 'Hawala / Micro-Routing' },
    { label: 'Source Dossier', value: 'FIR-SYN-2024-001' },
    { label: 'Bridge Nodes', value: '4 Pending Verification', highlight: 'text-amber-600 dark:text-amber-400 font-bold' },
    { label: 'Human Sign-off', value: 'Mandatory Prior to Action', highlight: 'text-rose-600 dark:text-rose-400 font-bold' },
    { label: 'Freezing Order', value: 'Dispatched to FIU' },
    { label: 'Telecom Intercept', value: 'Active Monitoring' },
  ];

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between shadow-xs transition-colors ${
        isDark
          ? 'bg-[#111624] border-[#212738] text-slate-100'
          : 'bg-white border-slate-200/90 text-slate-800'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-[#5db329]" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Pattern Alerts
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
          <Camera className="size-3.5 cursor-pointer hover:text-slate-600 dark:hover:text-white" />
          <Check className="size-3.5 cursor-pointer hover:text-slate-600 dark:hover:text-white" />
          <Star className="size-3.5 cursor-pointer hover:text-slate-600 dark:hover:text-white" />
          <span className="text-[10px] text-slate-400">Event ID: SYN-7C2-21</span>
        </div>
      </div>

      <div className="text-[10px] text-slate-400 font-mono mt-1">
        Last update: Live Pipeline
      </div>

      {/* Title & Emergency Level Bars */}
      <div className="mt-2.5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-extrabold text-slate-900 dark:text-white">
            Syndicate Cluster Detected
          </span>
          <span className="text-[#5db329] text-xs font-bold">▲</span>
        </div>

        {/* Segmented Emergency Level Bars */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1">
            <span className="w-3 h-2 rounded-xs bg-[#5db329]" />
            <span className="w-3 h-2 rounded-xs bg-[#5db329]" />
            <span className="w-3 h-2 rounded-xs bg-[#5db329]" />
            <span className="w-3 h-2 rounded-xs bg-[#5db329]" />
            <span className="w-3 h-2 rounded-xs bg-slate-200 dark:bg-slate-700" />
          </div>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            Emergency Level
          </span>
        </div>
      </div>

      {/* Two Column Content: Narrative + Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs leading-relaxed">
        {/* Narrative Paragraph */}
        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
          Cross-border financial routing detected between 3 shell entities and Marcuz Kowalski syndicate. Rapid burst of micro-transactions flagged by FIU pattern analyzer. Neo4j Louvain algorithm isolated dense community cluster with 4 pending bridge nodes. Automated link telemetry dispatched for investigator review.
        </p>

        {/* Structured Key/Value Checklist with Bullet Dots */}
        <div className="space-y-1 text-[10px] font-sans">
          {checklistItems.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-1">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span className="size-1 rounded-full bg-slate-400 dark:bg-slate-500" />
                {item.label}:
              </span>
              <span className={`font-medium ${item.highlight || 'text-slate-800 dark:text-slate-200'}`}>
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
// 5. INTER-AGENCY DISPATCH MATRIX CARD (Matching CTECC in Reference)
// =========================================================================
interface KemetraAgencyMatrixProps {
  isDark?: boolean;
}

export function KemetraAgencyMatrixCard({ isDark = false }: KemetraAgencyMatrixProps) {
  const agencyRows = [
    { name: 'Financial Intelligence Unit (FIU)', status: 'In Progress', variant: 'amber' },
    { name: 'Cyber Crime Investigation Cell', status: 'Dispatched', variant: 'emerald' },
    { name: 'Telecom Intercept Division', status: 'Dispatched', variant: 'emerald' },
    { name: 'Identity & Biometric Registry', status: 'Notified', variant: 'rose' },
    { name: 'Prosecutor Review Queue', status: 'Notified', variant: 'rose' },
    { name: 'Neo4j Knowledge Graph Sync', status: 'Triggered', variant: 'slate' },
  ];

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between shadow-xs transition-colors ${
        isDark
          ? 'bg-[#111624] border-[#212738] text-slate-100'
          : 'bg-white border-slate-200/90 text-slate-800'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <Building className="size-4 text-[#5db329]" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Inter-Agency Dispatch Matrix
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
          <Phone className="size-3.5 cursor-pointer hover:text-slate-600 dark:hover:text-white" />
          <Star className="size-3.5 cursor-pointer hover:text-slate-600 dark:hover:text-white" />
          <span className="text-[10px] text-slate-400">Event ID: SYN-7C2-21</span>
        </div>
      </div>

      <div className="text-[10px] text-slate-400 font-mono mt-1 mb-2">
        Last update: Live Task Force
      </div>

      {/* Matrix Table List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {agencyRows.map((row, idx) => (
          <div key={idx} className="py-2 flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-200 text-[11px] truncate">
              {row.name}
            </span>

            {/* Colored Status Pill Badge matching reference image */}
            <span
              className={`px-3 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                row.variant === 'amber'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                  : row.variant === 'emerald'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : row.variant === 'rose'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
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
// 6. KEY METRICS 6-CARD GRID (Matching Bottom Section in Reference)
// =========================================================================
interface KemetraKeyMetricsProps {
  isDark?: boolean;
  timeFilter?: string;
  onTimeFilterChange?: (filter: string) => void;
  stats?: any;
}

export function KemetraKeyMetricsGrid({
  isDark = false,
  timeFilter = '24h',
  onTimeFilterChange,
  stats,
}: KemetraKeyMetricsProps) {
  const metrics = [
    {
      title: 'Extracted Nodes',
      value: stats?.network_structure?.node_count ? `${stats.network_structure.node_count} / 28` : '28 / 28',
      icon: Camera,
      color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
    {
      title: 'Verified Links',
      value: stats?.network_structure?.edge_count ? `${stats.network_structure.edge_count} / 17` : '12 / 17',
      icon: Activity,
      color: 'bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400',
    },
    {
      title: 'Signal Flash',
      value: '5 / 24 Hrs',
      icon: Zap,
      color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400',
    },
    {
      title: 'Conflict Cases',
      value: '21 / 21',
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
    {
      title: 'Accident Events',
      value: '2 / 24 Hrs',
      icon: Car,
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      title: 'Flood Events',
      value: '0 / 24 Hrs',
      icon: Droplets,
      color: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
          Key Metrics
        </h3>
        <div className="flex items-center gap-1 text-xs text-slate-500 font-sans cursor-pointer">
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
              className={`rounded-2xl border p-3 sm:p-4 flex items-center gap-3 shadow-xs transition-colors ${
                isDark
                  ? 'bg-[#111624] border-[#212738]'
                  : 'bg-white border-slate-200/90'
              }`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${m.color}`}>
                <Icon className="size-4" />
              </div>
              <div className="truncate">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                  {m.title}
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
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
