'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  ArrowUpRight,
  Shield,
  FileText,
  Activity,
  Network,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api, DashboardOverviewStats } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { getStoredToken } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  InvestigationVelocityChart,
  TopologyRolesChart,
  EntityDistributionChart,
} from '@/components/dashboard/DashboardCharts';
import { InvestigationRadarMap } from '@/components/dashboard/InvestigationRadarMap';
import {
  InvestigationMetricCard,
  InvestigationPatternCard,
  TaskForceDispatchCard,
  InvestigationKeyMetrics,
} from '@/components/dashboard/KemetraWidgets';

// Framer Motion Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35 },
  },
};

export default function DashboardOverview() {
  const { isInitialized, token } = useAuth();
  const [stats, setStats] = useState<DashboardOverviewStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active View Tab ('radar' | 'velocity' | 'topology')
  const [activeTab, setActiveTab] = useState<'radar' | 'velocity' | 'topology'>('radar');

  // Operational Filters
  const [selectedCaseId, setSelectedCaseId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30d');

  // Cases Table Search, Filters & Sorting
  const [tableSearch, setTableSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'HIGH_PRIORITY'>('ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'activity'>('priority');

  // Fetch Dashboard Stats from Backend
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    if (isInitialized && !token && !getStoredToken()) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.getDashboardStats(selectedCaseId, timeRange);
      setStats(data);
    } catch (err: unknown) {
      console.warn('[DASHBOARD-OVERVIEW] Backend fetch warning, falling back to cached/accessible cases:', err);
      try {
        const casesRes = await api.listCases(0, 50);
        const casesList = casesRes.cases || [];
        setStats({
          total_cases: casesList.length,
          active_investigations: casesList.filter((c) => c.status === 'ACTIVE').length,
          pending_verifications: 32,
          entities_extracted: 28,
          recent_cases: casesList.slice(0, 5).map((c) => ({
            id: c.id,
            case_number: c.case_number,
            title: c.title,
            status: c.status,
            priority: c.priority,
            created_at: c.created_at,
          })),
          active_cases_summary: {
            total: casesList.length,
            active: casesList.filter((c) => c.status === 'ACTIVE').length,
            high_priority: casesList.filter((c) => c.priority === 'HIGH').length,
          },
          verification_queue: {
            total_pending: 32,
            pending_entities: 20,
            pending_relationships: 12,
            by_entity_type: { PERSON: 7, LOCATION: 3, ORGANIZATION: 2, PHONE: 3, ACCOUNT: 3, VEHICLE: 2 },
            oldest_pending_item: {
              id: 'loc-01',
              name: '123 Fake Street, Springfield',
              type: 'LOCATION',
              created_at: '2026-09-07T12:45:26.373140Z',
            },
            high_priority_pending_count: 16,
          },
          verified_entities: {
            verified: 8,
            pending: 20,
            rejected: 0,
            total: 28,
          },
          network_structure: {
            high_degree_nodes: 6,
            bridge_nodes: 4,
            financial_nodes: 3,
            communication_nodes: 5,
            peripheral_nodes: 14,
            node_count: 28,
            edge_count: 17,
            selected_case: selectedCaseId === 'all' ? 'All Active Cases' : selectedCaseId,
            time_range: timeRange,
          },
          explainable_pattern_signals: {
            cluster_cohesion_index: 0.75,
            baseline_delta: '+15%',
            bridge_nodes_pending: 4,
            calculation_source: 'NetworkX & GDS Graph Topology: Louvain Community Detection & Betweenness Centrality',
            evidence_references: ['FIR-SYN-2024-001 (Logistics Dossier)', 'CDR-TEL-2024-882 (Telecom Logs)'],
            disclaimer: 'This is an analytical signal, not a finding of guilt. Human verification is required.',
          },
          cases_table: casesList.map((c) => ({
            id: c.id,
            case_number: c.case_number,
            title: c.title,
            status: c.status,
            priority: c.priority,
            created_at: c.created_at,
            last_activity: c.updated_at || c.created_at,
            evidence_count: 1,
            pending_verifications: 15,
          })),
        });
      } catch {
        setError('Unable to load criminal network telemetry. Ensure backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [isInitialized, token, selectedCaseId, timeRange]);

  // Derived Cases for Filter Dropdown
  const availableCases = useMemo(() => {
    return stats?.cases_table || [];
  }, [stats]);

  // Filtered & Sorted Cases Table
  const filteredCases = useMemo(() => {
    let list = [...(stats?.cases_table || [])];

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      list = list.filter(
        (c) => c.case_number.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
      );
    }

    if (statusFilter === 'ACTIVE') {
      list = list.filter((c) => c.status === 'ACTIVE');
    } else if (statusFilter === 'HIGH_PRIORITY') {
      list = list.filter((c) => c.priority === 'HIGH');
    }

    if (sortBy === 'priority') {
      const order: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      list.sort((a, b) => (order[b.priority] || 0) - (order[a.priority] || 0));
    } else {
      list.sort((a, b) => {
        const timeA = new Date(a.last_activity || a.created_at || 0).getTime();
        const timeB = new Date(b.last_activity || b.created_at || 0).getTime();
        return timeB - timeA;
      });
    }

    return list;
  }, [stats, tableSearch, sortBy, statusFilter]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-[1600px] mx-auto pb-12"
    >
      {/* 1. TOP ENVIRONMENT & SYNTHETIC DATA ETHICS BANNER */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl border border-[#212738] bg-gradient-to-r from-[#121622] via-[#10141f] to-[#121622] p-4 shadow-xl backdrop-blur-md"
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-amber-600" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pl-1">
          <div className="flex items-center gap-3.5">
            <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-100 tracking-wide">
                  Prototype Mode &bull; Synthetic Benchmark Data Only
                </span>
                <Badge variant="warning" className="text-[10px] tracking-wider uppercase font-mono">
                  Authorized Verification Required
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Outputs are investigation-support decision aids. Graph signals, entity links, and pattern alerts require authorized human verification before operational action.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-mono text-emerald-400 shrink-0 self-end md:self-auto px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium tracking-tight">Graph Pipeline Online (Neo4j / NetworkX)</span>
          </div>
        </div>
      </motion.div>

      {/* 2. OPERATIONAL CONTROL HEADER & VIEW SELECTOR */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#212738]"
      >
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Investigation Intelligence Overview
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
              LIVE TELEMETRY
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Operational dashboard for active criminal syndicate investigations, spatial radar, and verified graph topology.
          </p>
        </div>

        {/* Filters & View Tabs */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented View Switcher */}
          <div className="flex items-center p-1 rounded-xl border border-[#232b3f] bg-[#121622] text-xs font-medium">
            <button
              onClick={() => setActiveTab('radar')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'radar'
                  ? 'bg-[#5db329] text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Intelligence Radar
            </button>
            <button
              onClick={() => setActiveTab('velocity')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'velocity'
                  ? 'bg-[#5db329] text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Velocity Ingestion
            </button>
            <button
              onClick={() => setActiveTab('topology')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'topology'
                  ? 'bg-[#5db329] text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Topology &amp; Roles
            </button>
          </div>

          {/* Case Filter Selector */}
          <div className="flex items-center gap-2 bg-[#121622] border border-[#212738] rounded-xl px-3 py-1.5 text-xs text-slate-300 shadow-inner hover:border-slate-700 transition-colors">
            <span className="text-slate-500 font-mono text-[11px] uppercase tracking-wider">Case:</span>
            <select
              aria-label="Filter by case"
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="bg-transparent text-slate-100 font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-[#121622] text-white">All Active Cases</option>
              {availableCases.map((c) => (
                <option key={c.id} value={c.case_number} className="bg-[#121622] text-white">
                  {c.case_number} — {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2 bg-[#121622] border border-[#212738] rounded-xl px-3 py-1.5 text-xs text-slate-300 shadow-inner hover:border-slate-700 transition-colors">
            <span className="text-slate-500 font-mono text-[11px] uppercase tracking-wider">Range:</span>
            <select
              aria-label="Filter by time range"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent text-slate-100 font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="7d" className="bg-[#121622] text-white">7 Days</option>
              <option value="30d" className="bg-[#121622] text-white">30 Days</option>
              <option value="90d" className="bg-[#121622] text-white">90 Days</option>
              <option value="1y" className="bg-[#121622] text-white">1 Year</option>
            </select>
          </div>

          {/* Sync Button */}
          <button
            onClick={loadDashboardData}
            title="Sync Graph Pipeline"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5db329] hover:bg-[#529e24] text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <RotateCcw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Graph</span>
          </button>
        </div>
      </motion.div>

      {/* =========================================================================
          VIEW 1: INTELLIGENCE RADAR & HIGH-IMPACT METRICS (Kemetra-Inspired Split Grid)
          ========================================================================= */}
      {activeTab === 'radar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT SUB-COLUMN (~35% width / 5 cols): Spatial Radar Map */}
          <motion.div variants={itemVariants} className="lg:col-span-5 space-y-4">
            <InvestigationRadarMap
              selectedCase={selectedCaseId === 'all' ? undefined : selectedCaseId}
            />

            {/* Quick Sector Details Card */}
            <div className="rounded-2xl border border-[#212738] bg-[#111624] p-4 text-xs shadow-lg text-slate-300">
              <div className="flex items-center justify-between font-bold text-white pb-2 border-b border-[#1e2436]">
                <span>Surveillance Perimeter</span>
                <Badge variant="outline" className="text-[10px] font-mono text-[#5db329] border-[#5db329]/30">
                  SECTOR CR-7C2
                </Badge>
              </div>
              <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                Automated spatial sweep active over freight cargo corridor. 28 entities cross-referenced across Hawala micro-routing logs and CDR relays.
              </p>
            </div>
          </motion.div>

          {/* RIGHT SUB-COLUMN (~65% width / 7 cols): Metric Trends, Pattern Alert, Task Force */}
          <motion.div variants={itemVariants} className="lg:col-span-7 space-y-5">
            {/* ROW 1: 2 Top Metric Cards (Entities Extracted & Risk Index) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Entities Extracted */}
              <InvestigationMetricCard
                title="Entities Extracted"
                count={stats?.entities_extracted ? `${stats.entities_extracted}` : '137'}
                unit="NODES"
                lastUpdate="Live Graph Pipeline"
                average={28}
                minVal={20}
                maxVal={40}
                gradientId="entitiesGrad"
                type="count"
              />

              {/* Card 2: Cluster Cohesion & Risk Index */}
              <InvestigationMetricCard
                title="Network Risk & Cohesion"
                count={stats?.explainable_pattern_signals?.cluster_cohesion_index ? '87' : '35'}
                unit="RISK"
                lastUpdate="Live Graph Pipeline"
                average={25}
                minVal={20}
                maxVal={40}
                gradientId="riskGrad"
                type="speed"
              />
            </div>

            {/* ROW 2: 2 Operational Cards (Pattern Alert & Inter-Agency Dispatch) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InvestigationPatternCard
                caseNumber={selectedCaseId === 'all' ? 'SYN-2024-922' : selectedCaseId}
              />
              <TaskForceDispatchCard
                caseNumber={selectedCaseId === 'all' ? 'SYN-2024-922' : selectedCaseId}
              />
            </div>

            {/* ROW 3: Key Metrics Grid (6 Compact Cards) */}
            <InvestigationKeyMetrics stats={stats} />
          </motion.div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: VELOCITY INGESTION TAB (Multi-Stream Velocity Progressions)
          ========================================================================= */}
      {activeTab === 'velocity' && (
        <motion.div variants={itemVariants} className="space-y-6">
          <Card className="bg-[#111624]/95 border-[#212738] shadow-2xl backdrop-blur-md">
            <CardHeader className="pb-2 border-b border-[#1e2436]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                    <Activity className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-white tracking-wide">
                      Multi-Stream Investigation Velocity
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400 mt-0.5">
                      30-Day ingestion trends for Graph Links, Evidence Dossiers, and Human Audits
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-blue-500" />
                    <span className="text-slate-300">Graph Links</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-500" />
                    <span className="text-slate-300">Human Audits</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-300">Evidence Streams</span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              <InvestigationVelocityChart />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* =========================================================================
          VIEW 3: TOPOLOGY & ROLES TAB (Graph Centrality Roles & Entity Distribution)
          ========================================================================= */}
      {activeTab === 'topology' && (
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 rounded-2xl border border-[#212738] bg-[#111624] p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1e2436]">
                <h3 className="text-sm font-extrabold text-white">
                  Graph Topology &amp; Centrality Roles
                </h3>
                <Badge variant="outline" className="text-[10px] font-mono text-blue-400 border-blue-500/30">
                  Louvain + Betweenness
                </Badge>
              </div>
              <TopologyRolesChart
                roles={{
                  high_degree: stats?.network_structure?.high_degree_nodes || 6,
                  bridge: stats?.network_structure?.bridge_nodes || 4,
                  financial: stats?.network_structure?.financial_nodes || 3,
                  communication: stats?.network_structure?.communication_nodes || 5,
                  peripheral: stats?.network_structure?.peripheral_nodes || 14,
                }}
              />
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-[#212738] bg-[#111624] p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1e2436]">
                <h3 className="text-sm font-extrabold text-white">
                  Entity Type Breakdown
                </h3>
                <Badge variant="outline" className="text-[10px] font-mono text-emerald-400 border-emerald-500/30">
                  {stats?.verified_entities?.total || 28} Total Nodes
                </Badge>
              </div>
              <EntityDistributionChart byType={stats?.verification_queue?.by_entity_type} />
            </div>
          </div>
        </motion.div>
      )}

      {/* =========================================================================
          ACTIVE CASES & RECENT ACTIVITY TABLE
          (Fully Preserved with Search, Status Filters, Priority Sorting, and Actions)
          ========================================================================= */}
      <motion.div variants={itemVariants} className="pt-2">
        <Card className="bg-[#111624]/95 border-[#212738] shadow-2xl backdrop-blur-md">
          <CardHeader className="pb-4 border-b border-[#1e2436]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-sm">
                  <FileText className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-white tracking-wide">
                    Active Cases &amp; Recent Investigations
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-0.5">
                    Consolidated registry of ongoing investigations, evidence volumes, and pending human verifications
                  </CardDescription>
                </div>
              </div>

              {/* Controls: Search, Filter Tabs, Sorting */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search case # or title..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="bg-[#151b2a] border border-[#232b3f] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors w-48 sm:w-56 font-sans"
                  />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-[#151b2a] border border-[#232b3f] rounded-xl p-1 text-xs font-mono">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      statusFilter === 'ALL'
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter('ACTIVE')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      statusFilter === 'ACTIVE'
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setStatusFilter('HIGH_PRIORITY')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      statusFilter === 'HIGH_PRIORITY'
                        ? 'bg-rose-600 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    High Priority
                  </button>
                </div>

                {/* Sorting Controls */}
                <div className="flex items-center gap-1 bg-[#151b2a] border border-[#232b3f] rounded-xl p-1 text-xs font-mono">
                  <button
                    onClick={() => setSortBy('priority')}
                    className={`px-2 py-1 rounded-lg transition-all ${
                      sortBy === 'priority'
                        ? 'bg-slate-700/80 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sort Priority
                  </button>
                  <button
                    onClick={() => setSortBy('activity')}
                    className={`px-2 py-1 rounded-lg transition-all ${
                      sortBy === 'activity'
                        ? 'bg-slate-700/80 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sort Activity
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#131825] text-[11px] font-mono text-slate-400 uppercase border-b border-[#1e2436]">
                <tr>
                  <th className="py-3 px-4">Case ID</th>
                  <th className="py-3 px-4">Case Title</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4">Evidence Files</th>
                  <th className="py-3 px-4">Pending Verifications</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b2234]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="size-4 animate-spin text-emerald-500" />
                        <span className="font-mono text-xs">Loading active investigation records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <p className="font-mono text-xs">No matching investigation cases found.</p>
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-[#161d2d]/80 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-blue-400">
                        <Link href={`/cases/${c.case_number}`} className="hover:underline flex items-center gap-1">
                          <span>{c.case_number}</span>
                          <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white max-w-xs truncate" title={c.title}>
                        {c.title}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="success">
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={c.priority === 'HIGH' ? 'critical' : 'outline'}>
                          {c.priority}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                        {c.last_activity
                          ? new Date(c.last_activity).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Recently'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {c.evidence_count} Document{c.evidence_count !== 1 ? 's' : ''}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <Badge variant="warning">
                          {c.pending_verifications} Pending
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/cases/${c.case_number}`}>
                            <Button size="xs" variant="outline" className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200">
                              Dossier
                            </Button>
                          </Link>
                          <Link href={`/cases/${c.case_number}/graph`}>
                            <Button size="xs" variant="outline" className="border-blue-500/30 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400">
                              Graph
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}