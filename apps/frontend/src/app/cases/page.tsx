"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { CaseResponse } from "@/types/api";
import { toast } from "react-hot-toast";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  surfaceBtnDanger,
  surfaceBtnPrimary,
  surfaceBtnSecondary,
  surfaceCard,
  surfaceInput,
  surfacePanel,
  surfaceSelect,
} from "@/components/layout/surface";

export default function CasesPage() {
  const router = useRouter();
  const [cases, setCases] = useState<CaseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [caseToDelete, setCaseToDelete] = useState<CaseResponse | null>(null);
  const [isDeletingCase, setIsDeletingCase] = useState(false);
  const [caseToEdit, setCaseToEdit] = useState<CaseResponse | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const openEditCase = (c: CaseResponse, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCaseToEdit(c);
    setEditTitle(c.title || "");
    setEditDescription(c.description || "");
  };

  const handleSaveEdit = async () => {
    if (!caseToEdit) return;
    const title = editTitle.trim();
    if (!title) {
      toast.error("Title is required.");
      return;
    }
    setIsSavingEdit(true);
    try {
      const updated = await api.updateCase(caseToEdit.id, {
        title,
        description: editDescription.trim(),
      });
      setCases((prev) =>
        prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
      );
      setCaseToEdit(null);
      toast.success("Case title and description updated.");
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Failed to update case.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteCaseConfirm = async () => {
    if (!caseToDelete) return;
    setIsDeletingCase(true);
    try {
      await api.deleteCase(caseToDelete.id);
      toast.success(`Case ${caseToDelete.case_number} deleted successfully.`);
      setCases((prev) => prev.filter((c) => c.id !== caseToDelete.id));
      setCaseToDelete(null);
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Failed to delete case.");
    } finally {
      setIsDeletingCase(false);
    }
  };

  useEffect(() => {
    async function loadCases() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.listCases(0, 100, statusFilter || undefined);
        setCases(res.cases);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load cases");
      } finally {
        setLoading(false);
      }
    }
    loadCases();
  }, [statusFilter]);

  const filteredCases = cases.filter((c) => {
    if (priorityFilter && c.priority !== priorityFilter) return false;
    if (
      search &&
      !c.title.toLowerCase().includes(search.toLowerCase()) &&
      !c.case_number.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="-m-5 space-y-0 sm:-m-6 lg:-m-8">
      <PageHeader
        badge="Investigations"
        title="Cases & Investigations"
        description="Browse and manage synthetic case files and active investigations."
        actions={
          <Link href="/cases/new" className={surfaceBtnPrimary}>
            + New Case
          </Link>
        }
      />

      <div className="space-y-6 px-5 py-5 sm:px-6 lg:px-8">
        <div className={cn(surfacePanel, "flex flex-wrap gap-3 p-4")}>
          <input
            type="text"
            placeholder="Search by case number or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(surfaceInput, "min-w-[200px] flex-1")}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={surfaceSelect}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="CLOSED">CLOSED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={surfaceSelect}
          >
            <option value="">All Priorities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p className="text-white/45">Loading cases...</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-red-200">
            {error}
          </div>
        ) : filteredCases.length === 0 ? (
          <Card
            className={cn(
              surfaceCard,
              "border-dashed py-12 text-center text-white/45"
            )}
          >
            No cases found matching your criteria.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCases.map((c) => (
              <Link key={c.id} href={`/cases/${c.id}`} className="group block">
                <Card
                  className={cn(
                    surfaceCard,
                    "h-full gap-0 p-5 py-5 transition hover:border-blue-500/40"
                  )}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <span className="rounded-lg bg-white/[0.05] px-2 py-1 font-mono text-xs text-white/70">
                      {c.case_number}
                    </span>
                    <div className="flex gap-2">
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          c.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-white/[0.05] text-white/45"
                        )}
                      >
                        {c.status}
                      </span>
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          c.priority === "CRITICAL"
                            ? "bg-red-500/10 text-red-400"
                            : c.priority === "HIGH"
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-white/[0.05] text-white/45"
                        )}
                      >
                        {c.priority}
                      </span>
                    </div>
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-white transition group-hover:text-blue-400">
                    {c.title}
                  </h3>
                  <p className="line-clamp-2 flex-1 text-sm text-white/45">
                    {c.description || "No description provided."}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-white/[0.08] pt-4 text-xs text-white/40">
                    <span>
                      Created {new Date(c.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => openEditCase(c, e)}
                        className="rounded-lg p-1.5 text-white/40 transition hover:bg-blue-500/20 hover:text-blue-300"
                        title={`Edit title & description for ${c.case_number}`}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(
                            `/cases/${c.case_number || c.id}/collaboration`
                          );
                        }}
                        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-600/10 px-2.5 py-1 text-xs font-medium text-blue-300 transition hover:bg-blue-600/20"
                      >
                        Team &amp; Tasks
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCaseToDelete(c);
                        }}
                        className="rounded-lg p-1.5 text-white/40 transition hover:bg-red-500/20 hover:text-red-400"
                        title={`Delete case ${c.case_number}`}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                      <span className="flex items-center gap-1 transition group-hover:text-blue-400">
                        View Details
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {caseToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className={cn(surfaceCard, "w-full max-w-lg gap-0 p-6")}>
            <h3 className="mb-1 text-lg font-bold text-white">Edit case details</h3>
            <p className="mb-5 text-xs text-white/45">
              Updates the title and description shown on this card ({caseToEdit.case_number}).
            </p>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-white/40">
              Title
            </label>
            <input
              className={cn(surfaceInput, "mb-4 w-full")}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              maxLength={255}
            />
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-white/40">
              Description
            </label>
            <textarea
              className={cn(surfaceInput, "mb-6 min-h-[110px] w-full resize-y")}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={() => setCaseToEdit(null)}
                className={surfaceBtnSecondary}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={handleSaveEdit}
                className={surfaceBtnPrimary}
              >
                {isSavingEdit ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {caseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className={cn(surfaceCard, "w-full max-w-md gap-0 p-6")}>
            <h3 className="mb-2 text-lg font-bold text-white">
              Delete Investigation Case
            </h3>
            <p className="mb-4 text-sm leading-relaxed text-white/70">
              Are you sure you want to permanently delete{" "}
              <span className="font-mono font-semibold text-white">
                {caseToDelete.case_number}
              </span>{" "}
              ({caseToDelete.title})?
            </p>
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
              This action permanently erases the case, evidence, graph nodes,
              relationships, and audit history.
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeletingCase}
                onClick={() => setCaseToDelete(null)}
                className={surfaceBtnSecondary}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingCase}
                onClick={handleDeleteCaseConfirm}
                className={surfaceBtnDanger}
              >
                {isDeletingCase ? "Deleting..." : "Permanently Delete Case"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
