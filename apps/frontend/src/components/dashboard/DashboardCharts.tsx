"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import { surfacePanel } from "@/components/layout/surface";

// Custom pitch-black admin tooltip
function CustomChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className={cn(surfacePanel, "px-3 py-2 shadow-2xl backdrop-blur-md text-xs font-mono bg-black/95")}>
        {label && <div className="text-white/45 font-bold mb-1">{label}</div>}
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: entry.color || entry.payload?.fill || "#3b82f6" }}
            />
            <span className="text-white/70 font-sans">{entry.name}:</span>
            <span className="font-bold text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// 1. KPI Micro Sparkline Component
interface MicroSparklineProps {
  data: number[];
  color?: string;
  gradientId: string;
}

export function MicroSparkline({ data, color = "#3b82f6", gradientId }: MicroSparklineProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-10 w-24 bg-white/[0.05] rounded animate-pulse" />;
  }

  const chartData = data.map((val, idx) => ({ idx, val }));

  return (
    <div className="h-10 w-24 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="val"
            stroke={color}
            strokeWidth={1.8}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// 2. Entity Type Distribution Donut Chart
interface EntityTypeItem {
  name: string;
  value: number;
  color: string;
}

interface EntityDistributionChartProps {
  byType?: Record<string, number>;
}

export function EntityDistributionChart({ byType }: EntityDistributionChartProps) {
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  useEffect(() => setMounted(true), []);

  const defaultTypes: Record<string, number> = {
    PERSON: 7,
    LOCATION: 3,
    ORGANIZATION: 2,
    PHONE: 3,
    ACCOUNT: 3,
    VEHICLE: 2,
  };

  const dataMap = byType && Object.keys(byType).length > 0 ? byType : defaultTypes;

  const colorPalette: Record<string, string> = {
    PERSON: "#3b82f6", // blue
    LOCATION: "#f59e0b", // amber
    ORGANIZATION: "#a855f7", // purple
    PHONE: "#06b6d4", // cyan
    ACCOUNT: "#10b981", // emerald
    VEHICLE: "#f43f5e", // rose
  };

  const data: EntityTypeItem[] = Object.entries(dataMap).map(([type, count]) => ({
    name: type,
    value: count,
    color: colorPalette[type.toUpperCase()] || "#94a3b8",
  }));

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  if (!mounted) {
    return <div className="h-56 w-full bg-white/[0.05] rounded-xl animate-pulse" />;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="relative size-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomChartTooltip />} />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="#0c0c0c"
                  strokeWidth={2}
                  className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                  style={{
                    filter: activeIndex === index ? `drop-shadow(0 0 6px ${entry.color}88)` : "none",
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Centered Total Count Indicator */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-extrabold text-white font-mono">{total}</span>
          <span className="text-[10px] uppercase font-mono text-white/45 tracking-wider">Entities</span>
        </div>
      </div>

      {/* Interactive Legend Breakdown */}
      <div className="grid grid-cols-2 gap-2 w-full text-xs font-mono">
        {data.map((item, idx) => {
          const pct = Math.round((item.value / (total || 1)) * 100);
          const isSelected = activeIndex === idx;
          return (
            <div
              key={item.name}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
              className={cn(
                "p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between",
                isSelected
                  ? "bg-white/[0.08] border-white/[0.15] shadow-md"
                  : "bg-white/[0.03] border-white/[0.08] hover:border-white/[0.12]"
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-white/70 truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-bold text-white">{item.value}</span>
                <span className="text-[10px] text-white/35">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 3. Topology Roles Horizontal Bar Chart
interface TopologyChartProps {
  roles?: {
    high_degree: number;
    bridge: number;
    financial: number;
    communication: number;
    peripheral: number;
  };
}

export function TopologyRolesChart({ roles }: TopologyChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const activeRoles = roles || {
    high_degree: 6,
    bridge: 4,
    financial: 3,
    communication: 5,
    peripheral: 14,
  };

  const data = [
    { role: "High-Degree Hubs", count: activeRoles.high_degree, color: "#3b82f6", tag: "Deg ≥ 3" },
    { role: "Bridge Gateways", count: activeRoles.bridge, color: "#a855f7", tag: "Betweenness" },
    { role: "Communication Relays", count: activeRoles.communication, color: "#06b6d4", tag: "Telecom / CDR" },
    { role: "Financial Channels", count: activeRoles.financial, color: "#10b981", tag: "Accounts" },
    { role: "Perimeter Leaves", count: activeRoles.peripheral, color: "#64748b", tag: "Deg = 1" },
  ];

  if (!mounted) {
    return <div className="h-48 w-full bg-white/[0.05] rounded-xl animate-pulse" />;
  }

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          barSize={14}
        >
          <XAxis type="number" stroke="rgba(255,255,255,0.25)" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="role"
            stroke="rgba(255,255,255,0.45)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={125}
          />
          <Tooltip content={<CustomChartTooltip />} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`bar-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 4. Multi-Stream Investigation Activity Velocity Chart (30-day timeline)
export function InvestigationVelocityChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const timelineData = [
    { day: "Day 1", evidence: 4, links: 7, audits: 3 },
    { day: "Day 5", evidence: 8, links: 14, audits: 6 },
    { day: "Day 10", evidence: 12, links: 22, audits: 11 },
    { day: "Day 15", evidence: 9, links: 18, audits: 14 },
    { day: "Day 20", evidence: 16, links: 29, audits: 20 },
    { day: "Day 25", evidence: 14, links: 34, audits: 25 },
    { day: "Current", evidence: 20, links: 42, audits: 32 },
  ];

  if (!mounted) {
    return <div className="h-64 w-full bg-white/[0.05] rounded-xl animate-pulse" />;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorLinks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorEvidence" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorAudits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" stroke="rgba(255,255,255,0.25)" fontSize={11} tickLine={false} />
          <YAxis stroke="rgba(255,255,255,0.25)" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomChartTooltip />} />
          <Area
            type="monotone"
            name="Graph Links"
            dataKey="links"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#colorLinks)"
          />
          <Area
            type="monotone"
            name="Human Verifications"
            dataKey="audits"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#colorAudits)"
          />
          <Area
            type="monotone"
            name="Evidence Streams"
            dataKey="evidence"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#colorEvidence)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// 5. Kemetra Signature Area Trend Chart (Matching Reference Image)
export interface KemetraTrendPoint {
  time: string;
  value: number;
}

interface KemetraTrendChartProps {
  data?: KemetraTrendPoint[];
  average?: number;
  minVal?: number;
  maxVal?: number;
  isDark?: boolean;
  gradientId?: string;
  lineColor?: string;
  unit?: string;
}

export function KemetraTrendChart({
  data,
  average = 28,
  minVal = 20,
  maxVal = 40,
  isDark = false,
  gradientId = "kemetraGreenGrad",
  lineColor = "#5db329",
  unit = "NODES",
}: KemetraTrendChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const defaultData: KemetraTrendPoint[] = [
    { time: "00:00", value: 35 },
    { time: "01:00", value: 32 },
    { time: "02:00", value: 30 },
    { time: "03:00", value: 20 },
    { time: "04:00", value: 40 },
    { time: "05:00", value: 34 },
    { time: "06:00", value: 34 },
    { time: "07:00", value: 34 },
  ];

  const chartData = data && data.length > 0 ? data : defaultData;

  if (!mounted) {
    return <div className="h-32 w-full bg-slate-200/40 dark:bg-slate-800/20 rounded animate-pulse" />;
  }

  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 10, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            stroke={isDark ? "#64748b" : "#94a3b8"}
            fontSize={9}
            tickLine={false}
            axisLine={{ stroke: isDark ? "#1e293b" : "#e2e8f0" }}
          />
          <YAxis
            stroke={isDark ? "#64748b" : "#94a3b8"}
            fontSize={9}
            tickLine={false}
            axisLine={false}
            domain={[0, 60]}
            ticks={[10, 20, 30, 40, 50, 60]}
          />
          <Tooltip
            content={({ active, payload, label }: any) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg bg-slate-900 text-white text-[11px] px-2 py-1 shadow-lg border border-slate-700">
                    <div className="font-semibold">{label}</div>
                    <div className="text-[#5db329] font-mono">
                      {payload[0].value} {unit}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine
            y={average}
            stroke={isDark ? "#475569" : "#cbd5e1"}
            strokeDasharray="3 3"
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={1.8}
            fill={`url(#${gradientId})`}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (payload.value === minVal) {
                return (
                  <circle
                    key={`dot-min-${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={3.5}
                    fill="#3b82f6"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                );
              }
              if (payload.value === maxVal) {
                return (
                  <circle
                    key={`dot-max-${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={3.5}
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                );
              }
              return null;
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

