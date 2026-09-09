'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Clock,
  FileText,
  Filter,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Radio,
  Landmark,
  Car,
  Users,
  Focus,
  SlidersHorizontal,
  ArrowUpDown,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { TimelineEvent, EvidenceItem } from '@/lib/graphIntelligence';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface UnifiedItem {
  id: string;
  kind: 'TIMELINE' | 'EVIDENCE';
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:MM
  rawTimestamp: string;
  title: string;
  description: string;
  category: string;
  confidence: number;
  primaryEntityId?: string;
  secondaryEntityId?: string;
  sourceDoc?: string;
}

interface TimelineEvidenceCalendarMenuProps {
  isOpen: boolean;
  onClose: () => void;
  timelineEvents: TimelineEvent[];
  evidenceItems: EvidenceItem[];
  onFocusEntity?: (entityId: string) => void;
  onSelectRelationship?: (relId: string) => void;
}

export function TimelineEvidenceCalendarMenu({
  isOpen,
  onClose,
  timelineEvents,
  evidenceItems,
  onFocusEntity,
}: TimelineEvidenceCalendarMenuProps) {
  // Calendar Navigation State
  const [currentYear, setCurrentYear] = useState<number>(2024);
  const [currentMonth, setCurrentMonth] = useState<number>(9); // 0-indexed: 9 = October
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // 'YYYY-MM-DD'

  // Filter & Sort State
  const [activeTab, setActiveTab] = useState<'ALL' | 'TIMELINE' | 'EVIDENCE'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'CONFIDENCE' | 'CATEGORY'>('NEWEST');

  // Normalize all timeline and evidence into a unified searchable/sortable stream
  const unifiedItems: UnifiedItem[] = useMemo(() => {
    const list: UnifiedItem[] = [];

    // 1. Process Timeline Events
    timelineEvents.forEach((t) => {
      // Parse YYYY-MM-DD from timestamp e.g. "2024-10-18 14:10:00 UTC"
      const parts = t.timestamp.split(' ');
      const datePart = parts[0] || '2024-10-18';
      const timePart = parts[1] ? parts[1].slice(0, 5) : '12:00';

      list.push({
        id: t.id,
        kind: 'TIMELINE',
        dateStr: datePart,
        timeStr: timePart,
        rawTimestamp: t.timestamp,
        title: t.title,
        description: t.description,
        category: t.category,
        confidence: t.confidence,
        primaryEntityId: t.primaryEntityId,
        secondaryEntityId: t.secondaryEntityId,
      });
    });

    // 2. Process Evidence Items
    evidenceItems.forEach((e) => {
      const parts = (e.timestamp || '').split(' ');
      const datePart = parts[0]?.match(/^\d{4}-\d{2}-\d{2}$/) ? parts[0] : '2024-10-15';
      const timePart = parts[1] ? parts[1].slice(0, 5) : '10:30';

      list.push({
        id: e.id,
        kind: 'EVIDENCE',
        dateStr: datePart,
        timeStr: timePart,
        rawTimestamp: e.timestamp || '2024-10-15 10:30:00 UTC',
        title: e.title,
        description: e.snippet,
        category: e.type,
        confidence: e.reliability,
        primaryEntityId: e.linkedEntityIds?.[0],
        secondaryEntityId: e.linkedEntityIds?.[1],
        sourceDoc: e.sourceDoc,
      });
    });

    return list;
  }, [timelineEvents, evidenceItems]);

  // Aggregate items by day for calendar day badges
  const dateCounts = useMemo(() => {
    const counts: Record<string, { total: number; timeline: number; evidence: number }> = {};
    unifiedItems.forEach((item) => {
      if (!counts[item.dateStr]) {
        counts[item.dateStr] = { total: 0, timeline: 0, evidence: 0 };
      }
      counts[item.dateStr].total += 1;
      if (item.kind === 'TIMELINE') counts[item.dateStr].timeline += 1;
      else counts[item.dateStr].evidence += 1;
    });
    return counts;
  }, [unifiedItems]);

  // Generate calendar days for the active month view
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    // Day of week: 0 is Sunday, convert to Monday=0, Sunday=6
    let startingDayOfWeek = (firstDay.getDay() + 6) % 7;
    const totalDaysInMonth = lastDay.getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      hasEvents: boolean;
      eventCount: number;
    }> = [];

    // Leading padding days from previous month
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const m = currentMonth === 0 ? 12 : currentMonth;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        hasEvents: Boolean(dateCounts[dateStr]),
        eventCount: dateCounts[dateStr]?.total || 0,
      });
    }

    // Days in current month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        hasEvents: Boolean(dateCounts[dateStr]),
        eventCount: dateCounts[dateStr]?.total || 0,
      });
    }

    // Trailing padding days to fill 5 or 6 weeks (multiples of 7)
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const m = currentMonth === 11 ? 1 : currentMonth + 2;
        const y = currentMonth === 11 ? currentYear + 1 : currentYear;
        const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        days.push({
          dateStr,
          dayNumber: i,
          isCurrentMonth: false,
          hasEvents: Boolean(dateCounts[dateStr]),
          eventCount: dateCounts[dateStr]?.total || 0,
        });
      }
    }

    return days;
  }, [currentYear, currentMonth, dateCounts]);

  const monthName = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [currentYear, currentMonth]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Filter and sort the unified items
  const filteredSortedItems = useMemo(() => {
    let result = unifiedItems.filter((item) => {
      // Tab filter
      if (activeTab === 'TIMELINE' && item.kind !== 'TIMELINE') return false;
      if (activeTab === 'EVIDENCE' && item.kind !== 'EVIDENCE') return false;

      // Calendar Date filter
      if (selectedDate && item.dateStr !== selectedDate) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.sourceDoc && item.sourceDoc.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });

    // Sorting
    if (sortBy === 'NEWEST') {
      result.sort((a, b) => b.rawTimestamp.localeCompare(a.rawTimestamp));
    } else if (sortBy === 'OLDEST') {
      result.sort((a, b) => a.rawTimestamp.localeCompare(b.rawTimestamp));
    } else if (sortBy === 'CONFIDENCE') {
      result.sort((a, b) => b.confidence - a.confidence);
    } else if (sortBy === 'CATEGORY') {
      result.sort((a, b) => a.category.localeCompare(b.category));
    }

    return result;
  }, [unifiedItems, activeTab, selectedDate, searchQuery, sortBy]);

  // Category Icon & Color Resolver
  const getCategoryMeta = (cat: string, kind: 'TIMELINE' | 'EVIDENCE') => {
    const c = cat.toUpperCase();
    if (kind === 'EVIDENCE') {
      return {
        label: 'EVIDENCE',
        icon: FileText,
        badgeVariant: 'success' as const,
        colorClass: 'text-emerald-400',
        borderClass: 'border-l-emerald-500',
      };
    }
    if (c.includes('COMMUNICATION') || c.includes('CALL') || c.includes('PHONE')) {
      return {
        label: 'COMMUNICATION',
        icon: Radio,
        badgeVariant: 'info' as const,
        colorClass: 'text-blue-400',
        borderClass: 'border-l-blue-500',
      };
    }
    if (c.includes('FINANCIAL') || c.includes('TRANSFER') || c.includes('ACCOUNT')) {
      return {
        label: 'FINANCIAL',
        icon: Landmark,
        badgeVariant: 'success' as const,
        colorClass: 'text-emerald-400',
        borderClass: 'border-l-emerald-500',
      };
    }
    if (c.includes('MOVEMENT') || c.includes('VEHICLE') || c.includes('LOCATION')) {
      return {
        label: 'MOVEMENT',
        icon: Car,
        badgeVariant: 'warning' as const,
        colorClass: 'text-amber-400',
        borderClass: 'border-l-amber-500',
      };
    }
    return {
      label: cat,
      icon: Users,
      badgeVariant: 'purple' as const,
      colorClass: 'text-purple-400',
      borderClass: 'border-l-purple-500',
    };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (semi-transparent, dismiss on click) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
          />

          {/* Right-Hand Side Drawer / Popup Menu */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[450px] lg:w-[480px] bg-[#0d111a]/98 backdrop-blur-2xl border-l border-white/10 shadow-[-15px_0_40px_rgba(0,0,0,0.8)] flex flex-col text-slate-100"
          >
            {/* Header: Title, Total Count, Close */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#111624]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-sm">
                  <CalendarIcon className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                    <span>Intelligence Calendar</span>
                    <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5 bg-slate-900/60">
                      {unifiedItems.length} Events
                    </Badge>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Chronological timeline and verified evidence index
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="icon-sm"
                onClick={onClose}
                className="border-white/10 bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white"
                title="Close Calendar Drawer"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* 1. Interactive Calendar Widget */}
              <div className="p-3.5 rounded-2xl bg-[#131825] border border-white/10 shadow-xl space-y-3">
                {/* Month Navigator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-white tracking-wide">
                      {monthName}
                    </span>
                    {selectedDate && (
                      <Badge variant="info" className="text-[9px] py-0 px-1 font-mono">
                        Active Filter
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-xs"
                      onClick={prevMonth}
                      className="border-white/10 bg-slate-800/80 hover:bg-slate-700 text-slate-300"
                      title="Previous Month"
                    >
                      <ChevronLeft className="size-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => {
                        setCurrentYear(2024);
                        setCurrentMonth(9);
                      }}
                      className="h-6 shrink-0 border-white/10 bg-slate-800/80 px-2 text-[10px] font-mono leading-none text-slate-300 hover:bg-slate-700"
                      title="Current Case Month (Oct 2024)"
                    >
                      Oct&nbsp;&apos;24
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-xs"
                      onClick={nextMonth}
                      className="border-white/10 bg-slate-800/80 hover:bg-slate-700 text-slate-300"
                      title="Next Month"
                    >
                      <ChevronRight className="size-3" />
                    </Button>
                  </div>
                </div>

                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-slate-500 font-semibold border-b border-white/5 pb-1">
                  <span>Mo</span>
                  <span>Tu</span>
                  <span>We</span>
                  <span>Th</span>
                  <span>Fr</span>
                  <span>Sa</span>
                  <span>Su</span>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, idx) => {
                    const isSelected = selectedDate === day.dateStr;
                    return (
                      <button
                        key={`${day.dateStr}-${idx}`}
                        disabled={!day.hasEvents && !day.isCurrentMonth}
                        onClick={() => {
                          if (selectedDate === day.dateStr) {
                            setSelectedDate(null); // Toggle off
                          } else {
                            setSelectedDate(day.dateStr);
                          }
                        }}
                        className={`relative h-8 rounded-lg text-xs font-mono transition-all flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-blue-600 text-white font-bold shadow-[0_0_12px_rgba(59,130,246,0.5)] border border-blue-400'
                            : day.hasEvents
                            ? 'bg-blue-500/15 border border-blue-500/40 text-blue-200 hover:bg-blue-500/25 font-bold cursor-pointer'
                            : day.isCurrentMonth
                            ? 'text-slate-400 hover:bg-slate-800/60'
                            : 'text-slate-600 opacity-40'
                        }`}
                      >
                        <span>{day.dayNumber}</span>
                        {day.hasEvents && (
                          <span
                            className={`absolute bottom-0.5 size-1 rounded-full ${
                              isSelected ? 'bg-white' : 'bg-cyan-400'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Date Indicator & Clear Button */}
                {selectedDate && (
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-mono text-[11px]">
                      Selected: <strong className="text-blue-400">{selectedDate}</strong> (
                      {filteredSortedItems.length} items)
                    </span>
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="text-[11px] text-slate-400 hover:text-white font-semibold underline underline-offset-2"
                    >
                      Clear Date Filter
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Controls: Filter Tabs & Sorting */}
              <div className="space-y-2.5">
                {/* Mode Tabs */}
                <div className="flex items-center gap-1 bg-[#131825] p-1 rounded-xl border border-white/10 text-xs font-mono">
                  <button
                    onClick={() => setActiveTab('ALL')}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                      activeTab === 'ALL'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({unifiedItems.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('TIMELINE')}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                      activeTab === 'TIMELINE'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Timeline ({timelineEvents.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('EVIDENCE')}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                      activeTab === 'EVIDENCE'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Evidence ({evidenceItems.length})
                  </button>
                </div>

                {/* Search Input & Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Filter snippet or entity..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#131825] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
                    />
                  </div>

                  <div className="relative">
                    <select
                      aria-label="Sort timeline and evidence"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-[#131825] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="NEWEST" className="bg-[#131825] text-white">Newest First</option>
                      <option value="OLDEST" className="bg-[#131825] text-white">Oldest First</option>
                      <option value="CONFIDENCE" className="bg-[#131825] text-white">Confidence</option>
                      <option value="CATEGORY" className="bg-[#131825] text-white">Category</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Chronological Item Cards List */}
              <div className="space-y-3">
                {filteredSortedItems.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#131825]/50 border border-white/5 text-center text-slate-500 text-xs font-mono">
                    No matching timeline events or evidence found.
                  </div>
                ) : (
                  filteredSortedItems.map((item) => {
                    const meta = getCategoryMeta(item.category, item.kind);
                    const CategoryIcon = meta.icon;

                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl bg-[#131825] border border-white/10 p-4 shadow-xl hover:border-slate-600 transition-all border-l-4 ${meta.borderClass} space-y-2`}
                      >
                        {/* Top Meta Line: Timestamp, Kind Badge, Confidence */}
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                              <Clock className="size-3 text-slate-500" />
                              {item.dateStr} • {item.timeStr}
                            </span>
                            <Badge variant={meta.badgeVariant} className="text-[9px] py-0 px-1.5 uppercase font-mono">
                              {meta.label}
                            </Badge>
                          </div>
                          <span className="font-mono text-emerald-400 font-bold text-[11px]">
                            {Math.round(item.confidence * 100)}% Conf
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-bold text-white leading-snug">
                          {item.title}
                        </h4>

                        {/* Source Document if available */}
                        {item.sourceDoc && (
                          <div className="text-[10px] font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                            {item.sourceDoc}
                          </div>
                        )}

                        {/* Snippet Quote */}
                        <p className="text-xs text-slate-300 font-serif italic bg-black/40 p-2 rounded-lg border border-white/5">
                          "{item.description}"
                        </p>

                        {/* Card Footer: Graph Focus Action */}
                        {item.primaryEntityId && (
                          <div className="pt-2 border-t border-white/5 flex items-center justify-end">
                            <button
                              onClick={() => {
                                if (onFocusEntity && item.primaryEntityId) {
                                  onFocusEntity(item.primaryEntityId);
                                }
                              }}
                              className="py-1 px-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                            >
                              <Focus className="size-3" />
                              <span>Focus Node on Graph</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer Summary */}
            <div className="p-3 border-t border-white/10 bg-[#111624] flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
              <span className="flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="size-3.5 text-emerald-400" />
                Verified Intelligence Dossier
              </span>
              <span className="text-[11px]">
                Showing {filteredSortedItems.length} of {unifiedItems.length}
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
