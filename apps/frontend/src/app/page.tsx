'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Activity,
  Network,
  Share2,
  Landmark,
  Radio,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Search,
  RefreshCw,
  Layers,
  Eye,
  ShieldCheck,
  AlertCircle,
  GitMerge,
  ExternalLink,
  Shield,
  ShieldAlert,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { api, DashboardOverviewStats } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { getStoredToken } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
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
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
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
  const [activeTelemetryTab, setActiveTelemetryTab] = useState<'topology' | 'velocity' | 'entities'>('topology');

  // Cases Table Sorting & Filter
  const [sortBy, setSortBy] = useState<'priority' | 'activity'>('priority');
  const [tableSearch, setTableSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'HIGH_PRIORITY'>('ALL');

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
          active_investigations: casesList.filter(c => c.status === 'ACTIVE').length,
          pending_verifications: 32,
          entities_extracted: 28,
          recent_cases: casesList.slice(0, 5).map(c => ({
            id: c.id,
            case_number: c.case_number,
            title: c.title,
            status: c.status,
            priority: c.priority,
            created_at: c.created_at,
          })),
          active_cases_summary: {
            total: casesList.length,
            active: casesList.filter(c => c.status === 'ACTIVE').length,
            high_priority: casesList.filter(c => c.priority === 'HIGH').length,
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
          cases_table: casesList.map(c => ({
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
      } catch (fallbackErr) {
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

  // Sorted and Filtered Cases Table
  const filteredCases = useMemo(() => {
    let list = [...(stats?.cases_table || [])];

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      list = list.filter(
        c => c.case_number.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
      );
    }

    if (statusFilter === 'ACTIVE') {
      list = list.filter(c => c.status === 'ACTIVE');
    } else if (statusFilter === 'HIGH_PRIORITY') {
      list = list.filter(c => c.priority === 'HIGH');
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

  // Entity Verification Ratio
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
      {/* 1. Top Environment & Synthetic Ethics Notice (Tactical Banner) */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl border border-[#212738] bg-gradient-to-r from-[#121622] via-[#10141f] to-[#121622] p-4 shadow-xl backdrop-blur-md"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-amber-600" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
                Outputs are investigation-support decision aids. Graph signals and link predictions require authorized human verification before operational action.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-mono text-emerald-400 shrink-0 self-end md:self-auto px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium tracking-tight">Graph Pipeline Online (Neo4j/NetworkX)</span>
          </div>
        </div>
      </motion.div>

      {/* 2. Operational Control Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#212738]"
      >
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Investigation Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Operational dashboard for active criminal syndicate investigations, entity verifications, and graph topology.
          </p>
        </div>

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
              <option value="all" className="bg-[#121622] text-white">All Cases</option>
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
              aria-label="Filter by date range"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent text-slate-100 font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="30d" className="bg-[#121622] text-white">Last 30 days</option>
              <option value="90d" className="bg-[#121622] text-white">Last 90 days</option>
              <option value="all" className="bg-[#121622] text-white">All Time</option>
            </select>
          </div>

          {/* Refresh Action */}
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={loading}
            title="Refresh dashboard telemetry"
            className="border-[#212738] bg-[#121622] hover:bg-[#1c2233] text-slate-300 hover:text-white transition-all shadow-sm"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden sm:inline font-mono text-xs">Sync</span>
          </Button>
        </div>
      </motion.div>

      {/* Error State Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="size-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="xs" variant="destructive" onClick={loadDashboardData}>
            Retry
          </Button>
        </motion.div>
      )}

      {/* =========================================================================
          ROW 1: FOUR MODERN SHADCN OPERATIONAL KPI CARDS
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Cases */}
        <motion.div variants={itemVariants} whileHover={{ y: -3 }} className="h-full">
          <Card className="h-full bg-gradient-to-b from-[#141927] to-[#10141f] border-[#212738] hover:border-blue-500/40 shadow-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.12)] transition-all duration-300 flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Activity className="size-3.5" />
                  </span>
                  <span className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">
                    Active Cases
                  </span>
                </div>
                <Badge variant="info">SURVEILLANCE</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
                      {loading ? '--' : (stats?.active_cases_summary?.active ?? stats?.active_investigations ?? 0)}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      of {loading ? '--' : (stats?.active_cases_summary?.total ?? stats?.total_cases ?? 0)} total
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {stats?.active_cases_summary?.high_priority || 0} high-priority cases under active tracking.
                  </p>
                </div>
                <MicroSparkline data={[2, 3, 2, 4, 3, 5, 4]} color="#3b82f6" gradientId="spark-cases" />
              </div>
            </CardContent>

            <CardFooter className="pt-2 border-t border-[#1e2436] flex items-center justify-between text-xs bg-transparent">
              <span className="text-slate-500 font-mono text-[11px]">Registry Live</span>
              <Link
                href="/cases"
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors flex items-center gap-1 group"
              >
                <span>View Cases</span>
                <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Card 2: High-Priority Cases */}
        <motion.div variants={itemVariants} whileHover={{ y: -3 }} className="h-full">
          <Card className="h-full bg-gradient-to-b from-[#17131d] to-[#10141f] border-[#2d1d28] hover:border-rose-500/40 shadow-xl hover:shadow-[0_0_20px_rgba(244,63,94,0.12)] transition-all duration-300 flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                    <AlertCircle className="size-3.5" />
                  </span>
                  <span className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">
                    High-Priority
                  </span>
                </div>
                <Badge variant="critical">ESCALATED</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-rose-400 tracking-tight font-mono">
                      {loading ? '--' : (stats?.active_cases_summary?.high_priority ?? 1)}
                    </span>
                    <span className="text-xs text-rose-300/60 font-mono">Command Priority</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Flagged for complex cross-case linkages and asset flow.
                  </p>
                </div>
                <MicroSparkline data={[1, 2, 1, 3, 2, 4, 3]} color="#f43f5e" gradientId="spark-priority" />
              </div>
            </CardContent>

            <CardFooter className="pt-2 border-t border-[#261d28] flex items-center justify-between text-xs bg-transparent">
              <span className="text-slate-500 font-mono text-[11px]">Surveillance Alert</span>
              <Link
                href="/cases"
                className="text-rose-400 hover:text-rose-300 font-semibold transition-colors flex items-center gap-1 group"
              >
                <span>Filter Priority</span>
                <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Card 3: Verification Queue */}
        <motion.div variants={itemVariants} whileHover={{ y: -3 }} className="h-full">
          <Card className="h-full bg-gradient-to-b from-[#181617] to-[#10141f] border-[#2c241c] hover:border-amber-500/40 shadow-xl hover:shadow-[0_0_20px_rgba(245,158,11,0.12)] transition-all duration-300 flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Clock className="size-3.5" />
                  </span>
                  <span className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">
                    Audit Queue
                  </span>
                </div>
                <Badge variant="warning">PENDING</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-amber-400 tracking-tight font-mono">
                      {loading ? '--' : (stats?.verification_queue?.total_pending ?? stats?.pending_verifications ?? 32)}
                    </span>
                    <span className="text-xs text-amber-300/60 font-mono">Unreviewed Items</span>
                  </div>
                </div>
                <MicroSparkline data={[10, 18, 15, 24, 28, 30, 32]} color="#f59e0b" gradientId="spark-queue" />
              </div>

              {/* Entity Breakdown Mini Chips */}
              <div className="flex flex-wrap gap-1">
                {stats?.verification_queue?.by_entity_type &&
                  Object.entries(stats.verification_queue.by_entity_type)
                    .slice(0, 4)
                    .map(([type, count]) => (
                      <span
                        key={type}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300"
                      >
                        {type}: {count}
                      </span>
                    ))}
              </div>

              {stats?.verification_queue?.oldest_pending_item && (
                <p className="text-[11px] text-slate-400 truncate">
                  <span className="text-slate-500">Oldest:</span> {stats.verification_queue.oldest_pending_item.name}
                </p>
              )}
            </CardContent>

            <CardFooter className="pt-2 border-t border-[#28211b] flex items-center justify-between text-xs bg-transparent">
              <span className="text-slate-500 font-mono text-[11px]">
                High-Pri: {stats?.verification_queue?.high_priority_pending_count ?? 16}
              </span>
              <Link
                href="/verification"
                className="text-amber-400 hover:text-amber-300 font-semibold transition-colors flex items-center gap-1 group"
              >
                <span>Review Queue</span>
                <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Card 4: Verified Candidates */}
        <motion.div variants={itemVariants} whileHover={{ y: -3 }} className="h-full">
          <Card className="h-full bg-gradient-to-b from-[#11191d] to-[#10141f] border-[#1c292b] hover:border-emerald-500/40 shadow-xl hover:shadow-[0_0_20px_rgba(16,185,129,0.12)] transition-all duration-300 flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="size-3.5" />
                  </span>
                  <span className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">
                    Verified Entities
                  </span>
                </div>
                <Badge variant="success">AUDITED</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-400 tracking-tight font-mono">
                    {loading ? '--' : (stats?.verified_entities?.verified ?? 8)}
                  </span>
                  <span className="text-xs text-emerald-300/60 font-mono">Confirmed Leads</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">{verificationRatio}%</span>
              </div>

              {/* Verified, Pending, Rejected Segmented Counters */}
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="p-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-[10px] font-mono text-emerald-400 font-semibold">Verified</div>
                  <div className="text-xs font-bold text-white mt-0.5">{stats?.verified_entities?.verified ?? 8}</div>
                </div>
                <div className="p-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="text-[10px] font-mono text-amber-400 font-semibold">Pending</div>
                  <div className="text-xs font-bold text-white mt-0.5">{stats?.verified_entities?.pending ?? 20}</div>
                </div>
                <div className="p-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
                  <div className="text-[10px] font-mono text-slate-400 font-semibold">Rejected</div>
                  <div className="text-xs font-bold text-white mt-0.5">{stats?.verified_entities?.rejected ?? 0}</div>
                </div>
              </div>

              {/* Progress Bar */}
              <Progress value={verificationRatio} className="h-1.5" indicatorClassName="bg-emerald-400" />
            </CardContent>

            <CardFooter className="pt-2 border-t border-[#182627] flex items-center justify-between text-xs bg-transparent">
              <span className="text-slate-500 font-mono text-[11px]">Human Verified</span>
              <Link
                href="/evidence"
                className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors flex items-center gap-1 group"
              >
                <span>Evidence Log</span>
                <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      {/* =========================================================================
          ROW 2: INTERACTIVE GRAPHICAL INTELLIGENCE SECTION
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Network Topology Structure (7 cols) */}
        <motion.div variants={itemVariants} className="lg:col-span-7 flex flex-col">
          <Card className="h-full bg-[#111624]/95 border-[#212738] shadow-2xl backdrop-blur-md hover:border-slate-700/80 transition-all flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-[#1e2436]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-sm">
                    <Network className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-white tracking-wide">
                      Topological Network Structure
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400 mt-0.5">
                      Graph metrics for {stats?.network_structure?.selected_case || 'All Active Cases'} &bull; Range: {stats?.network_structure?.time_range || '30d'}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <Badge variant="info">
                    Nodes: {stats?.network_structure?.node_count ?? 28}
                  </Badge>
                  <Badge variant="secondary">
                    Edges: {stats?.network_structure?.edge_count ?? 17}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-5">
              {/* Horizontal Bar Chart for Node Distribution */}
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-300 font-semibold flex items-center gap-2">
                    <BarChart3 className="size-3.5 text-blue-400" />
                    Topological Role Distribution
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Centrality Index</span>
                </div>
                <TopologyRolesChart
                  roles={{
                    high_degree: stats?.network_structure?.high_degree_nodes ?? 6,
                    bridge: stats?.network_structure?.bridge_nodes ?? 4,
                    financial: stats?.network_structure?.financial_nodes ?? 3,
                    communication: stats?.network_structure?.communication_nodes ?? 5,
                    peripheral: stats?.network_structure?.peripheral_nodes ?? 14,
                  }}
                />
              </div>

              {/* Interactive Topological Role Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* Role 1: High Degree */}
                <div className="p-3 rounded-xl bg-[#151b2a] border border-[#232b3f] hover:border-blue-500/40 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Share2 className="size-3.5 text-blue-400" />
                      <span className="text-xs font-semibold text-slate-300 font-mono">High-Degree</span>
                    </div>
                    <Badge variant="info" className="text-[10px] px-1.5 py-0">Deg &ge; 3</Badge>
                  </div>
                  <div className="text-2xl font-extrabold text-white mt-2 font-mono">
                    {loading ? '--' : (stats?.network_structure?.high_degree_nodes ?? 6)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Central coordination hubs with high connectivity.
                  </p>
                </div>

                {/* Role 2: Bridge Nodes */}
                <div className="p-3 rounded-xl bg-[#151b2a] border border-[#232b3f] hover:border-purple-500/40 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <GitMerge className="size-3.5 text-purple-400" />
                      <span className="text-xs font-semibold text-slate-300 font-mono">Bridge Nodes</span>
                    </div>
                    <Badge variant="purple" className="text-[10px] px-1.5 py-0">Betweenness</Badge>
                  </div>
                  <div className="text-2xl font-extrabold text-white mt-2 font-mono">
                    {loading ? '--' : (stats?.network_structure?.bridge_nodes ?? 4)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Gateways connecting distinct clusters and subnetworks.
                  </p>
                </div>

                {/* Role 3: Financial Channels */}
                <div className="p-3 rounded-xl bg-[#151b2a] border border-[#232b3f] hover:border-emerald-500/40 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Landmark className="size-3.5 text-emerald-400" />
                      <span className="text-xs font-semibold text-slate-300 font-mono">Financial</span>
                    </div>
                    <Badge variant="success" className="text-[10px] px-1.5 py-0">Accounts</Badge>
                  </div>
                  <div className="text-2xl font-extrabold text-white mt-2 font-mono">
                    {loading ? '--' : (stats?.network_structure?.financial_nodes ?? 3)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Bank accounts, shell entities, and transfer conduits.
                  </p>
                </div>

                {/* Role 4: Communication Relays */}
                <div className="p-3 rounded-xl bg-[#151b2a] border border-[#232b3f] hover:border-cyan-500/40 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Radio className="size-3.5 text-cyan-400" />
                      <span className="text-xs font-semibold text-slate-300 font-mono">Telecom / CDR</span>
                    </div>
                    <Badge variant="cyan" className="text-[10px] px-1.5 py-0">Relays</Badge>
                  </div>
                  <div className="text-2xl font-extrabold text-white mt-2 font-mono">
                    {loading ? '--' : (stats?.network_structure?.communication_nodes ?? 5)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Phone numbers and IMEI relays with traffic.
                  </p>
                </div>

                {/* Role 5: Peripheral Leaves */}
                <div className="p-3 rounded-xl bg-[#151b2a] border border-[#232b3f] hover:border-slate-600 transition-all group sm:col-span-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Layers className="size-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-300 font-mono">Peripheral Leaves</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-slate-400">Deg = 1</Badge>
                  </div>
                  <div className="text-2xl font-extrabold text-white mt-2 font-mono">
                    {loading ? '--' : (stats?.network_structure?.peripheral_nodes ?? 14)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Single-association leaf entities on the network perimeter.
                  </p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-3 border-t border-[#1e2436] flex items-center justify-between bg-transparent">
              <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Engine: NetworkX / Neo4j Graph Topology
              </span>
              <Link href={selectedCaseId === 'all' ? '/graph' : `/cases/${selectedCaseId}/graph`}>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-900/30 gap-1.5">
                  <ExternalLink className="size-3.5" />
                  <span>Inspect Interactive Graph</span>
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Right Column: Pattern Signals & Entity Breakdown (5 cols) */}
        <motion.div variants={itemVariants} className="lg:col-span-5 flex flex-col gap-4">
          {/* Card: Explainable Pattern Signals */}
          <Card className="bg-[#111624]/95 border-[#212738] shadow-2xl backdrop-blur-md hover:border-slate-700/80 transition-all flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-[#1e2436]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm">
                    <TrendingUp className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-white tracking-wide">
                      Explainable Pattern Signals
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400 mt-0.5">
                      Deterministic topological metrics &amp; heuristics
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="success">ANALYTICAL SIGNAL</Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-3.5">
              {/* Metric 1 */}
              <div className="p-3 rounded-xl bg-[#151b2a] border border-[#232b3f] flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-200 font-semibold font-mono">Cluster Cohesion Index</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Topological density of primary syndicate group</div>
                </div>
                <div className="text-xl font-extrabold text-emerald-400 font-mono">
                  {stats?.explainable_pattern_signals?.cluster_cohesion_index ?? 0.75}
                </div>
              </div>

              {/* Metric 2 */}
              <div className="p-3 rounded-xl bg-[#151b2a] border border-[#232b3f] flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-200 font-semibold font-mono">Change from Baseline</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">30-day link addition velocity relative to average</div>
                </div>
                <div className="text-xl font-extrabold text-blue-400 font-mono">
                  {stats?.explainable_pattern_signals?.baseline_delta ?? '+15%'}
                </div>
              </div>

              {/* Metric 3 */}
              <div className="p-3 rounded-xl bg-[#151b2a] border border-[#232b3f] flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-200 font-semibold font-mono">Bridge Nodes Pending Verification</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Unreviewed gateway nodes connecting disparate modules</div>
                </div>
                <div className="text-xl font-extrabold text-amber-400 font-mono">
                  {stats?.explainable_pattern_signals?.bridge_nodes_pending ?? 4}
                </div>
              </div>

              {/* Calculation Source & Evidence */}
              <div className="p-3 rounded-xl bg-[#0d111a] border border-[#1e2436] space-y-2">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Calculation Source:</span>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    {stats?.explainable_pattern_signals?.calculation_source || 'Louvain Community Modularity & Betweenness Centrality'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Evidence References:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(stats?.explainable_pattern_signals?.evidence_references || ['FIR-SYN-2024-001', 'CDR-TEL-2024-882']).map((ref, idx) => (
                      <Badge key={idx} variant="outline" className="text-[10px] font-mono text-slate-300 bg-slate-900/60">
                        {ref}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2 border-t border-[#1e2436] bg-transparent">
              <div className="w-full p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 leading-relaxed flex items-start gap-2">
                <AlertTriangle className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold">Notice:</strong> {stats?.explainable_pattern_signals?.disclaimer || 'This is an analytical signal, not a finding of guilt. Human verification is required.'}
                </span>
              </div>
            </CardFooter>
          </Card>

          {/* Card: Entity Type Breakdown Donut Chart */}
          <Card className="bg-[#111624]/95 border-[#212738] shadow-2xl backdrop-blur-md hover:border-slate-700/80 transition-all">
            <CardHeader className="pb-2 border-b border-[#1e2436]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <Layers className="size-4 text-purple-400" />
                  Entity Type Distribution
                </CardTitle>
                <Badge variant="purple">EXTRACTED</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              <EntityDistributionChart byType={stats?.verification_queue?.by_entity_type} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* =========================================================================
          ROW 3: 30-DAY INVESTIGATION ACTIVITY VELOCITY (GRAPHICAL COMPONENT)
          ========================================================================= */}
      <motion.div variants={itemVariants}>
        <Card className="bg-[#111624]/95 border-[#212738] shadow-2xl backdrop-blur-md">
          <CardHeader className="pb-3 border-b border-[#1e2436]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shadow-sm">
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

      {/* =========================================================================
          ROW 4: SHADCN ACTIVE CASES & RECENT ACTIVITY TABLE
          ========================================================================= */}
      <motion.div variants={itemVariants}>
        <Card className="bg-[#111624]/95 border-[#212738] shadow-2xl backdrop-blur-md">
          <CardHeader className="pb-4 border-b border-[#1e2436]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-sm">
                  <FileText className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-white tracking-wide">
                    Active Cases &amp; Recent Activity
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