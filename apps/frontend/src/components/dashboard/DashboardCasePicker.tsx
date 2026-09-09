'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Briefcase, Check, ChevronDown, Layers, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { surfaceCard, surfaceInput } from '@/components/layout/surface';

export interface DashboardCaseOption {
  id: string;
  case_number: string;
  title: string;
  status?: string;
}

interface DashboardCasePickerProps {
  value: string;
  onChange: (value: string) => void;
  cases: DashboardCaseOption[];
  className?: string;
  /** Compact trigger for card headers */
  compact?: boolean;
  /** Include the aggregate "All Cases" row (dashboard only). Default true. */
  includeAll?: boolean;
  /** Dropdown panel horizontal alignment. */
  dropdownAlign?: 'left' | 'right';
  /** Which case field `value` / `onChange` use. Default case_number. */
  valueKey?: 'case_number' | 'id';
}

/**
 * Graph-style case scope picker. Dashboard uses `includeAll`; workspace pages
 * (evidence/graph) omit it and pass `valueKey="id"` for navigation.
 */
export function DashboardCasePicker({
  value,
  onChange,
  cases,
  className,
  compact = false,
  includeAll = true,
  dropdownAlign = 'right',
  valueKey = 'case_number',
}: DashboardCasePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedCase = useMemo(
    () => cases.find((c) => c.case_number === value || c.id === value) ?? null,
    [cases, value]
  );

  const isAll = includeAll && (value === 'all' || !selectedCase);

  const label = isAll ? 'All Cases' : (selectedCase?.case_number ?? 'Select case');
  const subtitle = isAll
    ? 'Aggregate across investigations'
    : (selectedCase?.title ?? 'Loading…');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter(
      (c) =>
        c.case_number.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.status || '').toLowerCase().includes(q)
    );
  }, [cases, query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const selectValue = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className={cn('relative min-w-0', className)} ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Filter by case"
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'flex w-full max-w-md items-center gap-2 rounded-xl border text-left transition',
          compact ? 'max-w-[14rem] px-2 py-1' : 'px-2.5 py-1.5',
          open
            ? 'border-blue-500/50 bg-blue-600/10'
            : 'border-white/[0.1] bg-white/[0.03] hover:border-white/[0.18] hover:bg-white/[0.06]'
        )}
      >
        {isAll ? (
          <Layers className={cn('shrink-0 text-blue-400', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
        ) : (
          <Briefcase className={cn('shrink-0 text-blue-400', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
        )}
        <div className="min-w-0 flex-1">
          <div className={cn('truncate font-mono font-bold text-white', compact ? 'text-[10px]' : 'text-xs')}>
            {label}
          </div>
          {!compact && (
            <div className="truncate text-[10px] text-white/45">{subtitle}</div>
          )}
        </div>
        <ChevronDown
          className={cn(
            'shrink-0 text-white/40 transition-transform',
            compact ? 'h-3 w-3' : 'h-3.5 w-3.5',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            surfaceCard,
            'absolute top-full z-50 mt-2 w-[min(22rem,calc(100vw-3rem))] overflow-hidden p-0',
            dropdownAlign === 'left' ? 'left-0' : 'right-0'
          )}
        >
          <div className="border-b border-white/[0.08] p-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cases..."
                className={cn(surfaceInput, 'py-1.5 pl-8 text-xs')}
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto p-1.5" role="listbox">
            {includeAll ? (
              <button
                type="button"
                role="option"
                aria-selected={isAll}
                onClick={() => selectValue('all')}
                className={cn(
                  'flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition',
                  isAll ? 'bg-blue-600/15' : 'hover:bg-white/[0.06]'
                )}
              >
                <Layers
                  className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', isAll ? 'text-blue-400' : 'text-white/35')}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-xs font-bold text-white">All Cases</div>
                  <div className="truncate text-[11px] text-white/45">
                    Aggregate telemetry across all investigations
                  </div>
                </div>
                {isAll ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" /> : null}
              </button>
            ) : null}

            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-white/40">No cases found</div>
            ) : (
              filtered.map((c) => {
                const selected = c.case_number === value || c.id === value;
                const nextValue = valueKey === 'id' ? c.id : c.case_number;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => selectValue(nextValue)}
                    className={cn(
                      'flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition',
                      selected ? 'bg-blue-600/15' : 'hover:bg-white/[0.06]'
                    )}
                  >
                    <Briefcase
                      className={cn(
                        'mt-0.5 h-3.5 w-3.5 shrink-0',
                        selected ? 'text-blue-400' : 'text-white/35'
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-mono text-xs font-bold text-white">
                          {c.case_number}
                        </span>
                        {c.status ? (
                          <span className="shrink-0 rounded border border-white/[0.08] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-white/40">
                            {c.status}
                          </span>
                        ) : null}
                      </div>
                      <div className="truncate text-[11px] text-white/45">{c.title}</div>
                    </div>
                    {selected ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" /> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
