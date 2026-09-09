import React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { surfaceCard } from "@/components/layout/surface";

export default function SettingsPage() {
  return (
    <div className="-m-5 space-y-0 sm:-m-6 lg:-m-8">
      <PageHeader
        badge="System"
        title="System Settings"
        description="Configure extraction thresholds, link prediction confidence cuts, model endpoints, and system parameters."
        actions={
          <span className="rounded-full border border-white/[0.12] bg-white/[0.05] px-3 py-1 text-xs font-semibold text-white/60">
            Module in Development
          </span>
        }
      />

      <div className="px-5 py-5 sm:px-6 lg:px-8">
        <Card
          className={cn(
            surfaceCard,
            "flex min-h-[400px] flex-col items-center justify-center p-8 text-center"
          )}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.04] text-white/40">
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white/90">
            Configuration Panel Coming Soon
          </h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/45">
            Manage FastAPI backend URL, Neo4j connection parameters, Ollama/vLLM
            inference settings, and verification threshold parameters.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <div className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 font-mono text-xs text-white/60">
              Environment: Local Synthetic Sandbox
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 font-mono text-xs text-amber-400">
              Synthetic Data Only
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
