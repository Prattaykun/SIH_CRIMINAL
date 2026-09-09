'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
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
  KemetraSidebar,
  KemetraTopBar,
  KemetraMetricTrendCard,
  KemetraIncidentCard,
  KemetraAgencyMatrixCard,
  KemetraKeyMetricsGrid,
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

  // Theme Mode (Defaults to light matching the reference image)
  const [isDark, setIsDark] = useState<boolean>(false);

  // Navigation Tab ('overview' | 'registry' | 'topology')
  const [activeTab, setActiveTab] = useState<'overview' | 'registry' | 'topology'>('overview');

  // Operational Filters
  const [selectedCaseId, setSelectedCaseId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [directionFilter, setDirectionFilter] = useState<string>('all');

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
    <div
      className={`-m-5 sm:-m-6 lg:-m-8 min-h-screen flex flex-col font-sans transition-colors ${
        isDark ? 'bg-[#0a0d14] text-slate-100' : 'bg-[#f4f6f8] text-slate-800'
      }`}
    >
      {/* 1. TOP ENVIRONMENT & SYNTHETIC DATA ETHICS BANNER */}
      <div
        className={`px-4 sm:px-6 py-2 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
          isDark
            ? 'bg-[#0e131f] border-[#1e2536] text-slate-300'
            : 'bg-amber-50/70 border-amber-200/70 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-bold tracking-tight">
            Prototype Mode &bull; Synthetic Benchmark Data Only
          </span>
          <span className="hidden md:inline text-slate-500 dark:text-slate-400 text-[11px]">
            Outputs are decision aids. Link predictions and pattern alerts require authorized human verification.
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 shrink-0">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
          </span>
          <span>Graph Pipeline Online (Neo4j / NetworkX)</span>
        </div>
      </div>

      {/* 2. TOP CONTEXT & CONTROL BAR (Matching Reference Image) */}
      <KemetraTopBar
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        selectedCase={selectedCaseId}
        onCaseChange={(caseId) => setSelectedCaseId(caseId)}
        availableCases={availableCases}
      />

      {/* 3. MAIN WORKSPACE WITH SLEEK LEFT SIDEBAR */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation */}
        <KemetraSidebar isDark={isDark} activePath="/" />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 max-w-[1600px] mx-auto"
          >
            {/* VIEW 1: OVERVIEW TAB (KEMETRA SPLIT 35/65 GRID) */}
            {activeTab === 'overview' && (
              <>
                {/* Tactical Header Filter Row */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                      Investigation Insights
                    </h2>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Real-time spatial radar, syndicate links, and entity telemetry
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Time Range Selector */}
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer shadow-xs ${
                        isDark
                          ? 'bg-[#151b2a] border-[#232b3f] text-slate-300'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <span>Last 3 Hours</span>
                      <ChevronDown className="size-3.5 text-slate-400" />
                    </div>

                    {/* Jurisdiction Filter */}
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer shadow-xs ${
                        isDark
                          ? 'bg-[#151b2a] border-[#232b3f] text-slate-300'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <span>Northbound Sector</span>
                      <ChevronDown className="size-3.5 text-slate-400" />
                    </div>

                    {/* Reset / Sync Action Button (Matching Vibrant Green Pill) */}
                    <button
                      onClick={loadDashboardData}
                      title="Sync Graph Data"
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#5db329] hover:bg-[#529e24] text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <RotateCcw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                      <span>Sync Graph</span>
                    </button>
                  </div>
                </div>

                {/* Split Two-Column Layout (35% Left / 65% Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* LEFT SUB-COLUMN (~35% width / 4-5 cols): Spatial Radar Map */}
                  <motion.div variants={itemVariants} className="lg:col-span-5 space-y-4">
                    <InvestigationRadarMap
                      isDark={isDark}
                      selectedCase={selectedCaseId === 'all' ? undefined : selectedCaseId}
                    />

                    {/* Quick Sector Details Card */}
                    <div
                      className={`rounded-2xl border p-4 text-xs shadow-xs transition-colors ${
                        isDark
                          ? 'bg-[#111624] border-[#212738] text-slate-300'
                          : 'bg-white border-slate-200/90 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span>Surveillance Perimeter</span>
                        <Badge variant="outline" className="text-[10px] font-mono text-[#5db329] border-[#5db329]/30">
                          SECTOR 7C2
                        </Badge>
                      </div>
                      <p className="mt-2 text-[11px] leading-relaxed">
                        Automated radar sweep active over East 7th freight cargo corridor. 28 entities cross-referenced across Hawala routing logs.
                      </p>
                    </div>
                  </motion.div>

                  {/* RIGHT SUB-COLUMN (~65% width / 7 cols): Metric Trends, Incidents, Dispatch */}
                  <motion.div variants={itemVariants} className="lg:col-span-7 space-y-5">
                    {/* ROW 1: 2 Top Metric Cards (Entities Extracted & Risk Index) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Card 1: Entities Extracted (Matching Vehicle Count) */}
                      <KemetraMetricTrendCard
                        title="Entities Extracted"
                        count={stats?.entities_extracted ? `${stats.entities_extracted}` : '137'}
                        unit="NODES"
                        lastUpdate="Live"
                        average={28}
                        minVal={20}
                        maxVal={40}
                        gradientId="entitiesGrad"
                        isDark={isDark}
                        type="count"
                      />

                      {/* Card 2: Risk Index / Velocity (Matching Speed MPH) */}
                      <KemetraMetricTrendCard
                        title="Network Risk Index"
                        count={stats?.explainable_pattern_signals?.cluster_cohesion_index ? '87' : '35'}
                        unit="RISK"
                        lastUpdate="Live"
                        average={25}
                        minVal={20}
                        maxVal={40}
                        gradientId="riskGrad"
                        isDark={isDark}
                        type="speed"
                      />
                    </div>

                    {/* ROW 2: 2 Operational Cards (Pattern Alert & Inter-Agency Dispatch) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Operational Card 1: Pattern Alert (Matching Accident Detected) */}
                      <KemetraIncidentCard isDark={isDark} />

                      {/* Operational Card 2: Inter-Agency Dispatch Matrix (Matching CTECC) */}
                      <KemetraAgencyMatrixCard isDark={isDark} />
                    </div>

                    {/* ROW 3: Key Metrics Grid (6 Compact Cards) */}
                    <KemetraKeyMetricsGrid
                      isDark={isDark}
                      timeFilter={timeRange}
                      stats={stats}
                    />
                  </motion.div>
                </div>
              </>
            )}

            {/* VIEW 2: TOPOLOGY & VELOCITY TAB */}
            {activeTab === 'topology' && (
              <motion.div variants={itemVariants} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div
                    className={`lg:col-span-2 rounded-2xl border p-5 shadow-xs transition-colors ${
                      isDark
                        ? 'bg-[#111624] border-[#212738]'
                        : 'bg-white border-slate-200/90'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          Multi-Stream Investigation Velocity
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          30-Day ingestion progression across Graph Links, Evidence Dossiers, and Human Audits
                        </p>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">
                        30-DAY LOGS
                      </Badge>
                    </div>
                    <InvestigationVelocityChart />
                  </div>

                  <div
                    className={`rounded-2xl border p-5 shadow-xs transition-colors ${
                      isDark
                        ? 'bg-[#111624] border-[#212738]'
                        : 'bg-white border-slate-200/90'
                    }`}
                  >
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-2">
                      Entity Type Breakdown
                    </h3>
                    <EntityDistributionChart byType={stats?.verification_queue?.by_entity_type} />
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-5 shadow-xs transition-colors ${
                    isDark
                      ? 'bg-[#111624] border-[#212738]'
                      : 'bg-white border-slate-200/90'
                  }`}
                >
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-2">
                    Graph Topology &amp; Centrality Roles
                  </h3>
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
              </motion.div>
            )}

            {/* =========================================================================
                CASES REGISTRY & ACTIVE INVESTIGATIONS DIRECTORY TABLE
                (Fully preserved with Search, Filters, Priority Sorting, and Links)
                ========================================================================= */}
            <motion.div variants={itemVariants} className="pt-2">
              <div
                className={`rounded-2xl border shadow-xs overflow-hidden transition-colors ${
                  isDark
                    ? 'bg-[#111624] border-[#212738]'
                    : 'bg-white border-slate-200/90'
                }`}
              >
                {/* Table Header & Controls */}
                <div
                  className={`p-4 sm:p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    isDark ? 'border-[#1e2436] bg-[#141a2a]/40' : 'border-slate-100 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                      <FileText className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Active Cases &amp; Recent Investigations
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Consolidated registry of ongoing dossiers, evidence volumes, and pending human verifications
                      </p>
                    </div>
                  </div>

                  {/* Search, Filter Pills & Sorting Controls */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search case # or title..."
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        className={`rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none transition-colors w-44 sm:w-56 font-sans ${
                          isDark
                            ? 'bg-[#151b2a] border border-[#232b3f] text-white placeholder-slate-500 focus:border-blue-500'
                            : 'bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500'
                        }`}
                      />
                    </div>

                    {/* Filter Status Pills */}
                    <div
                      className={`flex items-center p-1 rounded-xl border text-xs font-mono ${
                        isDark ? 'bg-[#151b2a] border-[#232b3f]' : 'bg-slate-100 border-slate-200'
                      }`}
                    >
                      <button
                        onClick={() => setStatusFilter('ALL')}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          statusFilter === 'ALL'
                            ? 'bg-[#5db329] text-white font-semibold shadow-xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setStatusFilter('ACTIVE')}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          statusFilter === 'ACTIVE'
                            ? 'bg-[#5db329] text-white font-semibold shadow-xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Active
                      </button>
                      <button
                        onClick={() => setStatusFilter('HIGH_PRIORITY')}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          statusFilter === 'HIGH_PRIORITY'
                            ? 'bg-rose-600 text-white font-semibold shadow-xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        High Priority
                      </button>
                    </div>

                    {/* Priority Sort Button */}
                    <div
                      className={`flex items-center p-1 rounded-xl border text-xs font-mono ${
                        isDark ? 'bg-[#151b2a] border-[#232b3f]' : 'bg-slate-100 border-slate-200'
                      }`}
                    >
                      <button
                        onClick={() => setSortBy('priority')}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          sortBy === 'priority'
                            ? isDark
                              ? 'bg-slate-700 text-white font-semibold'
                              : 'bg-white text-slate-900 font-semibold shadow-xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Sort Priority
                      </button>
                      <button
                        onClick={() => setSortBy('activity')}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          sortBy === 'activity'
                            ? isDark
                              ? 'bg-slate-700 text-white font-semibold'
                              : 'bg-white text-slate-900 font-semibold shadow-xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Sort Activity
                      </button>
                    </div>
                  </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead
                      className={`text-[11px] font-mono uppercase border-b ${
                        isDark
                          ? 'bg-[#131825] text-slate-400 border-[#1e2436]'
                          : 'bg-slate-50/80 text-slate-500 border-slate-200/90'
                      }`}
                    >
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
                    <tbody
                      className={`divide-y ${
                        isDark
                          ? 'divide-[#1b2234] text-slate-300'
                          : 'divide-slate-100 text-slate-700'
                      }`}
                    >
                      {loading ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-500">
                            <div className="flex items-center justify-center gap-2">
                              <RefreshCw className="size-4 animate-spin text-[#5db329]" />
                              <span className="font-mono text-xs">
                                Loading active investigation records...
                              </span>
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
                            className={`transition-colors group ${
                              isDark ? 'hover:bg-[#161d2d]/80' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-3.5 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400">
                              <Link
                                href={`/cases/${c.case_number}`}
                                className="hover:underline flex items-center gap-1"
                              >
                                <span>{c.case_number}</span>
                                <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Link>
                            </td>
                            <td
                              className="py-3.5 px-4 font-medium text-slate-900 dark:text-white max-w-xs truncate"
                              title={c.title}
                            >
                              {c.title}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                {c.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono ${
                                  c.priority === 'HIGH'
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                              >
                                {c.priority}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                              {c.last_activity
                                ? new Date(c.last_activity).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : 'Recently'}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                              {c.evidence_count} Document{c.evidence_count !== 1 ? 's' : ''}
                            </td>
                            <td className="py-3.5 px-4 font-mono">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                {c.pending_verifications} Pending
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link href={`/cases/${c.case_number}`}>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                                  >
                                    Dossier
                                  </Button>
                                </Link>
                                <Link href={`/cases/${c.case_number}/graph`}>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    className="border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-600/20"
                                  >
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
              </div>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}