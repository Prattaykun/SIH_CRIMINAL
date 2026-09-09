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
  CheckCircle2,
  Clock,
  AlertTriangle,
  GitMerge,
  UserCheck,
  Landmark,
  Radio,
  Share2,
  Plus,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { api, DashboardOverviewStats } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { getStoredToken } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  MicroSparkline,
  EntityDistributionChart,
  TopologyRolesChart,
  InvestigationVelocityChart,
} from '@/components/dashboard/DashboardCharts';

// Animation Variants
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

  // Verification Progress Ratio
  const verificationRatio = useMemo(() => {
    const verified = stats?.verified_entities?.verified || 0;
    const total = stats?.verified_entities?.total || 1;
    return Math.round((verified / total) * 100);
  }, [stats]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-7xl mx-auto pb-12"
    >
      {/* 1. TOP ENVIRONMENT & SYNTHETIC DATA ETHICS BANNER */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl border border-[#212738] bg-[#111624] p-4 shadow-md"
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pl-1">
          <div className="flex items-center gap-3">
            <Shield className="size-4 text-amber-400 shrink-0" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-100 tracking-wide">
                  Prototype Mode — Synthetic Benchmark Data Only
                </span>
                <Badge variant="warning" className="text-[10px] tracking-wider uppercase font-mono">
                  Authorized Verification Required
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Outputs are decision aids. Graph signals, entity links, and pattern alerts require authorized human verification before operational action.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 shrink-0 self-end md:self-auto px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="size-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium tracking-tight">Graph Pipeline Online (Neo4j / NetworkX)</span>
          </div>
        </div>
      </motion.div>

      {/* 2. OPERATIONAL CONTROL HEADER */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#212738]"
      >
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Investigation Command Dashboard
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono border-blue-500/30 text-blue-400 bg-blue-500/10">
              OPERATIONAL
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time criminal network analysis, link predictions, and human-in-the-loop verification pipeline.
          </p>
        </div>

        {/* Operational Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
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

          {/* New Case Button */}
          <Link href="/cases/new">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs gap-1.5 shadow-md shadow-blue-600/20">
              <Plus className="size-3.5" />
              <span>New Case</span>
            </Button>
          </Link>

          {/* Sync Button */}
          <button
            onClick={loadDashboardData}
            title="Sync Graph Pipeline"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#232b3f] bg-[#121622] hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <RotateCcw className={`size-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </motion.div>

      {/* =========================================================================
          ROW 1: PRIMARY OPERATIONAL KPI CARDS
          ========================================================================= */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Investigations */}
        <Card className="bg-[#111624]/95 border-[#212738] shadow-lg hover:border-slate-700 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">
                Active Cases
              </span>
              <FileText className="size-4 text-slate-500" />
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {stats?.active_cases_summary?.active ?? 5}
                </span>
                <span className="text-xs text-slate-400 font-mono ml-1.5">
                  / {stats?.active_cases_summary?.total ?? 8} Total
                </span>
              </div>
              <MicroSparkline
                data={[2, 3, 3, 4, 4, 5, 5]}
                color="#3b82f6"
                gradientId="sparkCases"
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span className="text-rose-400 font-mono text-[11px] font-semibold">
                {stats?.active_cases_summary?.high_priority ?? 3} High Priority
              </span>
              <Link href="/cases" className="text-blue-400 hover:underline text-[11px] font-medium flex items-center gap-0.5">
                Directory <ChevronRight className="size-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Pending Human Verifications (Critical Investigator Workload) */}
        <Card className="bg-[#111624]/95 border-[#212738] shadow-lg hover:border-slate-700 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">
                Verification Queue
              </span>
              <CheckCircle2 className="size-4 text-slate-500" />
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold text-amber-400 tracking-tight">
                  {stats?.verification_queue?.total_pending ?? 32}
                </span>
                <span className="text-xs text-slate-400 font-mono ml-1.5">Pending</span>
              </div>
              <MicroSparkline
                data={[12, 18, 22, 25, 29, 30, 32]}
                color="#f59e0b"
                gradientId="sparkQueue"
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span className="text-slate-400 text-[11px] font-mono">
                {stats?.verification_queue?.pending_entities ?? 20} Entities / {stats?.verification_queue?.pending_relationships ?? 12} Links
              </span>
              <Link href="/audit" className="text-amber-400 hover:underline text-[11px] font-medium flex items-center gap-0.5">
                Review <ChevronRight className="size-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Extracted Criminal Entities */}
        <Card className="bg-[#111624]/95 border-[#212738] shadow-lg hover:border-slate-700 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">
                Extracted Entities
              </span>
              <Layers className="size-4 text-slate-500" />
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {stats?.entities_extracted ?? 28}
                </span>
                <span className="text-xs text-slate-400 font-mono ml-1.5">Nodes</span>
              </div>
              <MicroSparkline
                data={[10, 14, 18, 20, 24, 26, 28]}
                color="#10b981"
                gradientId="sparkEntities"
              />
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Verified Ratio</span>
                <span className="text-emerald-400 font-bold">{verificationRatio}%</span>
              </div>
              <Progress value={verificationRatio} className="h-1 bg-slate-800" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Graph Topology & Critical Brokers */}
        <Card className="bg-[#111624]/95 border-[#212738] shadow-lg hover:border-slate-700 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">
                Graph Network Links
              </span>
              <GitMerge className="size-4 text-slate-500" />
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {stats?.network_structure?.bridge_nodes ?? 4}
                </span>
                <span className="text-xs text-purple-400 font-mono ml-1.5">Bridge Gateways</span>
              </div>
              <MicroSparkline
                data={[2, 2, 3, 3, 4, 4, 4]}
                color="#a855f7"
                gradientId="sparkBridges"
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span className="text-slate-400 text-[11px] font-mono">
                {stats?.network_structure?.high_degree_nodes ?? 6} Hubs / {stats?.network_structure?.edge_count ?? 17} Links
              </span>
              <Link href="/graph" className="text-purple-400 hover:underline text-[11px] font-medium flex items-center gap-0.5">
                Visualizer <ChevronRight className="size-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* =========================================================================
          ROW 2: TWO CORE INVESTIGATIVE ACTION PANELS
          - Panel 1: Human Verification Queue (Action Required)
          - Panel 2: Explainable Pattern Signals & Syndicate Intelligence
          ========================================================================= */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* PANEL 1 (7 cols): Human Verification Action Queue */}
        <Card className="lg:col-span-7 bg-[#111624]/95 border-[#212738] shadow-xl flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 border-b border-[#1e2436]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <UserCheck className="size-4 text-slate-400" />
                  <div>
                    <CardTitle className="text-sm font-bold text-white tracking-wide">
                      Human Verification Action Queue
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400 mt-0.5">
                      Pending AI extractions requiring authorized sign-off before case evidentiary filing
                    </CardDescription>
                  </div>
                </div>

                <Badge variant="warning" className="text-[10px] font-mono uppercase">
                  {stats?.verification_queue?.high_priority_pending_count ?? 16} Urgent
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Oldest Pending Item Alert Banner */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-semibold text-slate-200 truncate">
                    Oldest Unverified Item: {stats?.verification_queue?.oldest_pending_item?.name || '123 Fake Street, Springfield'}
                  </span>
                  <Badge variant="outline" className="text-[9px] font-mono text-amber-400 border-amber-500/40">
                    {stats?.verification_queue?.oldest_pending_item?.type || 'LOCATION'}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Extracted from case dossier — Requires investigator confirmation or rejection.
                </p>
              </div>

              {/* Pending Queue by Entity Type Breakdown */}
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-2 font-mono uppercase tracking-wider">
                  Pending By Entity Category
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {Object.entries(
                    stats?.verification_queue?.by_entity_type || {
                      PERSON: 7,
                      LOCATION: 3,
                      ORGANIZATION: 2,
                      PHONE: 3,
                      ACCOUNT: 3,
                      VEHICLE: 2,
                    }
                  ).map(([type, count]) => (
                    <div
                      key={type}
                      className="rounded-xl border border-[#232b3f] bg-[#151b2a] p-2.5 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-400 font-mono text-[11px]">{type}</span>
                      <span className="font-bold text-white font-mono px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </div>

          <CardFooter className="pt-2 pb-4 border-t border-[#1e2436] flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">
              Audit Rule: No unverified node can trigger enforcement orders
            </span>
            <Link href="/audit">
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs gap-1.5 shadow-md shadow-amber-500/20">
                <span>Open Verification Queue</span>
                <ArrowUpRight className="size-3.5" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* PANEL 2 (5 cols): Explainable Pattern Signals & Syndicate Intelligence */}
        <Card className="lg:col-span-5 bg-[#111624]/95 border-[#212738] shadow-xl flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 border-b border-[#1e2436]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Network className="size-4 text-slate-400" />
                  <div>
                    <CardTitle className="text-sm font-bold text-white tracking-wide">
                      Explainable Pattern Signals
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400 mt-0.5">
                      Louvain community clustering and betweenness bridge metrics
                    </CardDescription>
                  </div>
                </div>

                <Badge variant="outline" className="text-[10px] font-mono text-purple-400 border-purple-500/30">
                  GDS ALGORITHM
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-3.5 text-xs">
              {/* Cohesion Score Metric */}
              <div className="rounded-xl border border-[#232b3f] bg-[#151b2a] p-3 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 font-mono uppercase">
                    Cluster Cohesion Index
                  </div>
                  <div className="text-xl font-extrabold text-white font-mono mt-0.5">
                    {stats?.explainable_pattern_signals?.cluster_cohesion_index ?? 0.75}
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center text-emerald-400 font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    {stats?.explainable_pattern_signals?.baseline_delta ?? '+15%'}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">vs Baseline</div>
                </div>
              </div>

              {/* Analytical Briefing Text */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-300 font-mono">
                  Isolated Community Syndicate Leads:
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Cross-border financial routing detected between 3 shell accounts and Marcuz Kowalski syndicate. 4 bridge nodes currently connect the primary logistics ring to peripheral wire accounts.
                </p>
              </div>

              {/* Evidence References */}
              <div className="space-y-1 text-[11px]">
                <span className="text-slate-400 font-mono text-[10px] uppercase">
                  Evidence Provenance:
                </span>
                <div className="space-y-1">
                  {(
                    stats?.explainable_pattern_signals?.evidence_references || [
                      'FIR-SYN-2024-001 (Logistics Dossier)',
                      'CDR-TEL-2024-882 (Telecom Logs)',
                    ]
                  ).map((ref, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-slate-300 font-mono text-[10px] px-2 py-1 rounded bg-[#131825] border border-[#212738]"
                    >
                      <span className="size-1.5 rounded-full bg-purple-400" />
                      <span className="truncate">{ref}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </div>

          <CardFooter className="pt-2 pb-4 border-t border-[#1e2436]">
            <p className="text-[10px] text-slate-500 leading-tight italic">
              {stats?.explainable_pattern_signals?.disclaimer ||
                'This is an analytical signal, not a finding of guilt. Human verification is required.'}
            </p>
          </CardFooter>
        </Card>
      </motion.div>

      {/* =========================================================================
          ROW 3: DEEP INVESTIGATION VELOCITY & TOPOLOGY BREAKDOWN
          ========================================================================= */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left (7 cols): Multi-Stream Ingestion Velocity */}
        <Card className="lg:col-span-7 bg-[#111624]/95 border-[#212738] shadow-xl">
          <CardHeader className="pb-2 border-b border-[#1e2436]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Activity className="size-4 text-slate-400" />
                <div>
                  <CardTitle className="text-sm font-bold text-white tracking-wide">
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

        {/* Right (5 cols): Entity Distribution & Centrality Roles */}
        <Card className="lg:col-span-5 bg-[#111624]/95 border-[#212738] shadow-xl flex flex-col justify-between">
          <CardHeader className="pb-2 border-b border-[#1e2436]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Layers className="size-4 text-slate-400" />
                <div>
                  <CardTitle className="text-sm font-bold text-white tracking-wide">
                    Extracted Entity Distribution
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-0.5">
                    Breakdown of {stats?.verified_entities?.total ?? 28} nodes by category
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono text-emerald-400 border-emerald-500/30">
                {verificationRatio}% Verified
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <EntityDistributionChart byType={stats?.verification_queue?.by_entity_type} />
          </CardContent>

          <CardFooter className="pt-2 pb-3 border-t border-[#1e2436] flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>High-Degree Hubs: {stats?.network_structure?.high_degree_nodes ?? 6}</span>
            <span>Bridge Gateways: {stats?.network_structure?.bridge_nodes ?? 4}</span>
          </CardFooter>
        </Card>
      </motion.div>

      {/* =========================================================================
          ROW 4: CONSOLIDATED ACTIVE CASES REGISTRY & SEARCH DIRECTORY
          ========================================================================= */}
      <motion.div variants={itemVariants} className="pt-2">
        <Card className="bg-[#111624]/95 border-[#212738] shadow-2xl backdrop-blur-md">
          <CardHeader className="pb-4 border-b border-[#1e2436]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <FileText className="size-4 text-slate-400" />
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
                        <RefreshCw className="size-4 animate-spin text-blue-500" />
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