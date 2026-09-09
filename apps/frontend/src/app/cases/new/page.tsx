"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PenLine, UploadCloud, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  surfaceBtnGhost,
  surfaceBtnPrimary,
  surfaceBtnSecondary,
  surfaceCard,
  surfaceInput,
  surfacePanel,
  surfaceSelect,
} from "@/components/layout/surface";

export default function NewCasePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("HIGH");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ingestOption, setIngestOption] = useState<"none" | "write" | "upload">(
    "none"
  );
  const [reportTitle, setReportTitle] = useState("");
  const [reportContent, setReportContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadSyntheticTemplate = () => {
    setReportTitle(`FIR-2024-SYN: Initial Report for ${title || "New Case"}`);
    setReportContent(
      `FIRST INFORMATION REPORT (SYNTHETIC RECORD)
Date: 14 January 2024
Jurisdiction: Special Cyber & Financial Investigation Cell

Subject Aditya Malhotra was observed coordinating financial transactions for Apex Traders Pvt Ltd. Communication intercepts indicate activity from cellular contact +91-98111-22222. Funds amounting to INR 18,00,000 were moved from City Bank ACCT-1234567890 to associate account ACCT-9876543210. Transport vehicle HR-26-XY-9999 was logged at Saket check-post.`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setError("Title is required");
      return;
    }

    if (ingestOption === "write" && !reportContent.trim()) {
      setError('Please provide content for the written report or select "Skip"');
      return;
    }

    if (ingestOption === "upload" && !selectedFile) {
      setError('Please select a file to upload or select "Skip"');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const randomId = Math.floor(Math.random() * 900) + 100;
      const case_number = `CASE-2024-SYN-${randomId}`;

      const newCase = await api.createCase({
        case_number,
        title,
        description,
        priority,
      });

      if (ingestOption === "write" && reportContent.trim()) {
        await api.ingestReportText(newCase.id, {
          title: reportTitle.trim() || `${title} - Initial Report`,
          content: reportContent.trim(),
          file_type: "TEXT_REPORT",
        });
        toast.success("Case created and report ingested for extraction!");
        router.push(`/cases/${newCase.id}/evidence`);
        return;
      } else if (ingestOption === "upload" && selectedFile) {
        await api.uploadDocument(newCase.id, selectedFile);
        toast.success("Case created and document uploaded for extraction!");
        router.push(`/cases/${newCase.id}/evidence`);
        return;
      }

      router.push(`/cases/${newCase.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create case");
    } finally {
      setLoading(false);
    }
  };

  const optionClass = (active: boolean) =>
    cn(
      "rounded-xl border p-3 text-left transition",
      active
        ? "border-blue-500 bg-blue-600/10 text-white"
        : "border-white/[0.08] bg-black/40 text-white/45 hover:border-white/[0.14]"
    );

  return (
    <div className="-m-5 space-y-0 sm:-m-6 lg:-m-8">
      <PageHeader
        badge="Investigations"
        title="Create New Case"
        description="Initialize a new investigative workspace with synthetic intelligence."
        actions={
          <Link href="/cases" className={surfaceBtnGhost}>
            ← Back to Cases
          </Link>
        }
      />

      <div className="mx-auto max-w-3xl space-y-6 px-5 py-5 sm:px-6 lg:px-8">
        <Card className={cn(surfaceCard, "gap-0 p-8")}>
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="border-b border-white/[0.08] pb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                Case Metadata
              </h3>

              <div>
                <label className="mb-1 block text-sm font-medium text-white/70">
                  Case Title *
                </label>
                <input
                  type="text"
                  className={surfaceInput}
                  placeholder="e.g. Synthetic Smuggling Ring - Operation Saket"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-white/70">
                  Description
                </label>
                <textarea
                  className={cn(surfaceInput, "h-20")}
                  placeholder="Case summary and investigative scope..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-white/70">
                  Priority
                </label>
                <select
                  className={cn(surfaceSelect, "w-full")}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">
                  Initial Evidence Ingestion (Optional)
                </h3>
                <span className="text-[11px] text-white/35">
                  Ingest FIR or dossier immediately
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setIngestOption("none")}
                  className={optionClass(ingestOption === "none")}
                >
                  <div className="text-xs font-semibold">Skip for Now</div>
                  <div className="mt-0.5 text-[11px] text-white/35">
                    Create empty case
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIngestOption("write")}
                  className={optionClass(ingestOption === "write")}
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <PenLine className="size-3.5 text-blue-400" /> Write Report
                  </div>
                  <div className="mt-0.5 text-[11px] text-white/35">
                    Type narrative / FIR
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIngestOption("upload")}
                  className={optionClass(ingestOption === "upload")}
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <UploadCloud className="size-3.5 text-blue-400" /> Upload
                    File
                  </div>
                  <div className="mt-0.5 text-[11px] text-white/35">
                    PDF, DOCX, TXT, JSON
                  </div>
                </button>
              </div>

              {ingestOption === "write" && (
                <div className={cn(surfacePanel, "mt-3 space-y-3 p-4")}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white/70">
                      Written Report Details
                    </span>
                    <button
                      type="button"
                      onClick={loadSyntheticTemplate}
                      className={cn(
                        surfaceBtnSecondary,
                        "gap-1.5 px-2.5 py-1 text-xs text-blue-400"
                      )}
                    >
                      <FileText className="size-3 text-blue-400" />
                      Load Synthetic FIR
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Report title or reference"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className={cn(surfaceInput, "text-xs")}
                  />

                  <textarea
                    placeholder="Type or paste the case report text here..."
                    value={reportContent}
                    onChange={(e) => setReportContent(e.target.value)}
                    className={cn(
                      surfaceInput,
                      "h-32 font-mono text-xs leading-relaxed"
                    )}
                  />
                </div>
              )}

              {ingestOption === "upload" && (
                <div
                  className={cn(surfacePanel, "mt-3 space-y-3 p-4 text-center")}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.docx,.doc,.txt,.json"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="py-4">
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2 text-sm text-emerald-400">
                        <span className="font-mono text-xs">
                          {selectedFile.name} (
                          {(selectedFile.size / 1024).toFixed(1)} KB)
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="ml-2 text-xs text-white/40 hover:text-red-400"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="mb-2 text-xs text-white/45">
                          Select a document (.pdf, .docx, .txt, .json) to ingest
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={surfaceBtnSecondary}
                        >
                          Browse File
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-white/[0.08] pt-4">
              <Link href="/cases" className={surfaceBtnSecondary}>
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className={cn(surfaceBtnPrimary, "gap-2")}
              >
                {loading ? "Processing..." : "Create Case"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
