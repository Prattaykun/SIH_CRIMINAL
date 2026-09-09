"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { CaseResponse } from "@/types/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { CaseWorkspacePicker } from "@/components/case/CaseWorkspacePicker";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { surfaceBtnPrimary, surfaceCard, surfaceInput } from "@/components/layout/surface";

export default function TeamHubPage() {
  const router = useRouter();
  const [cases, setCases] = useState<CaseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter(
      (c) =>
        c.case_number.toLowerCase().includes(q) ||
        (c.title || "").toLowerCase().includes(q)
    );
  }, [cases, query]);

  const defaultCaseId = cases[0]?.id || "";

  return (
    <div className="-m-5 space-y-0 sm:-m-6 lg:-m-8">
      <PageHeader
        badge="Investigation"
        title="Team & Assignments"
        description="Pick a case to assign persons, organizations, phones, vehicles, and other leads to investigation officers."
        leading={
          defaultCaseId ? (
            <CaseWorkspacePicker currentCaseId={defaultCaseId} workspace="collaboration" />
          ) : undefined
        }
      />

      <div className="mx-auto max-w-4xl space-y-4 px-5 py-6 sm:px-6 lg:px-8">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter cases…"
          className={cn(surfaceInput, "max-w-md")}
        />

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className={cn(surfaceCard, "p-8 text-center text-sm text-white/45")}>
            No cases available. Create a case first.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => router.push(`/cases/${c.id}/collaboration`)}
                className={cn(
                  surfaceCard,
                  "p-4 text-left transition hover:border-blue-500/40"
                )}
              >
                <div className="font-mono text-xs text-white/50">{c.case_number}</div>
                <div className="mt-1 text-sm font-semibold text-white">{c.title}</div>
                <div className="mt-3">
                  <span className={cn(surfaceBtnPrimary, "pointer-events-none px-2.5 py-1 text-[10px]")}>
                    Open team workspace
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
