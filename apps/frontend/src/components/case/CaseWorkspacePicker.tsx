'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, ChevronDown, Check } from 'lucide-react';
import { api } from '@/lib/api';
import type { CaseResponse } from '@/types/api';
import { cn } from '@/lib/utils';
import { surfaceCard } from '@/components/layout/surface';

type CaseWorkspacePickerProps = {
  currentCaseId: string;
  currentLabel?: string;
  /** Path suffix after /cases/{id}/ e.g. "collaboration" | "graph" */
  workspace: string;
  className?: string;
};

export function CaseWorkspacePicker({
  currentCaseId,
  currentLabel,
  workspace,
  className,
}: CaseWorkspacePickerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cases, setCases] = useState<CaseResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.listCases(0, 100);
        if (!cancelled) setCases(res.cases || []);
      } catch {
        if (!cancelled) setCases([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const filtered = cases.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.case_number.toLowerCase().includes(q) ||
      (c.title || '').toLowerCase().includes(q) ||
      (c.status || '').toLowerCase().includes(q)
    );
  });

  const active =
    cases.find((c) => c.id === currentCaseId || c.case_number === currentCaseId) || null;
  const label = currentLabel || active?.case_number || currentCaseId;
  const sub = active?.title || 'Select investigation';

  return (
    <div ref={ref} className={cn('relative min-w-0 max-w-md', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'flex w-full max-w-md items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left transition',
          open
            ? 'border-blue-500/40 bg-blue-600/10'
            : 'border-white/[0.1] bg-white/[0.03] hover:border-white/[0.18] hover:bg-white/[0.06]'
        )}
      >
        <Briefcase className="h-4 w-4 shrink-0 text-blue-400" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-mono text-xs font-semibold text-white">{label}</span>
          <span className="block truncate text-[10px] text-white/40">{sub}</span>
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-white/40 transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className={cn(
            surfaceCard,
            'absolute left-0 top-full z-[200] mt-2 w-[min(22rem,90vw)] overflow-hidden p-0 shadow-2xl'
          )}
          role="listbox"
        >
          <div className="border-b border-white/[0.08] p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cases…"
              className="w-full rounded-lg border border-white/[0.1] bg-black/60 px-2.5 py-1.5 text-xs text-white outline-none placeholder:text-white/30 focus:border-blue-500/40"
            />
          </div>
          <div className="sih-thin-scrollbar max-h-64 overflow-y-auto py-1">
            {loading ? (
              <p className="px-3 py-4 text-center text-xs text-white/40">Loading cases…</p>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-white/40">No matching cases</p>
            ) : (
              filtered.map((c) => {
                const selected = c.id === currentCaseId || c.case_number === currentCaseId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={cn(
                      'flex w-full items-start gap-2 px-3 py-2 text-left transition hover:bg-white/[0.05]',
                      selected && 'bg-blue-600/15'
                    )}
                    onClick={() => {
                      setOpen(false);
                      router.push(`/cases/${c.id}/${workspace}`);
                    }}
                  >
                    <span className="mt-0.5 w-4 shrink-0">
                      {selected ? <Check className="h-3.5 w-3.5 text-blue-400" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-xs font-semibold text-white">
                        {c.case_number}
                      </span>
                      <span className="block truncate text-[11px] text-white/45">{c.title}</span>
                    </span>
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
