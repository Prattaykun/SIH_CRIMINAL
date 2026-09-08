'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function NewCasePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ingestion option: 'none' | 'write' | 'upload'
  const [ingestOption, setIngestOption] = useState<'none' | 'write' | 'upload'>('none');
  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadSyntheticTemplate = () => {
    setReportTitle(`FIR-2024-SYN: Initial Report for ${title || 'New Case'}`);
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
      setError('Title is required');
      return;
    }

    if (ingestOption === 'write' && !reportContent.trim()) {
      setError('Please provide content for the written report or select "Skip"');
      return;
    }

    if (ingestOption === 'upload' && !selectedFile) {
      setError('Please select a file to upload or select "Skip"');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Generate a random synthetic case number
      const randomId = Math.floor(Math.random() * 900) + 100;
      const case_number = `CASE-2024-SYN-${randomId}`;
      
      const newCase = await api.createCase({
        case_number,
        title,
        description,
        priority
      });

      // Handle optional initial ingestion
      if (ingestOption === 'write' && reportContent.trim()) {
        await api.ingestReportText(newCase.id, {
          title: reportTitle.trim() || `${title} - Initial Report`,
          content: reportContent.trim(),
          file_type: 'TEXT_REPORT',
        });
        toast.success('Case created and report ingested for extraction!');
        router.push(`/cases/${newCase.id}/evidence`);
        return;
      } else if (ingestOption === 'upload' && selectedFile) {
        await api.uploadDocument(newCase.id, selectedFile);
        toast.success('Case created and document uploaded for extraction!');
        router.push(`/cases/${newCase.id}/evidence`);
        return;
      }
      
      // Redirect to the new case overview
      router.push(`/cases/${newCase.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 mt-6 mb-12">
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
        <Link href="/cases" className="hover:text-slate-200">Cases</Link>
        <span>/</span>
        <span className="text-slate-200">New Case</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Create New Case</h2>
        <p className="text-slate-400 text-sm mb-6">Initialize a new investigative workspace with synthetic intelligence.</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
              Case Metadata
            </h3>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Case Title *</label>
              <input 
                type="text" 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-slate-100 focus:outline-none focus:border-blue-500 text-sm"
                placeholder="e.g. Synthetic Smuggling Ring - Operation Saket"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
              <textarea 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-slate-100 focus:outline-none focus:border-blue-500 h-20 text-sm"
                placeholder="Case summary and investigative scope..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
              <select 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-slate-100 focus:outline-none focus:border-blue-500 text-sm"
                value={priority}
                onChange={e => setPriority(e.target.value)}
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          {/* Initial Ingestion Option */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Initial Evidence Ingestion (Optional)
              </h3>
              <span className="text-[11px] text-slate-500">Ingest FIR or dossier immediately</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setIngestOption('none')}
                className={`p-3 rounded-lg border text-left transition ${
                  ingestOption === 'none'
                    ? 'bg-blue-600/10 border-blue-500 text-slate-100'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold">Skip for Now</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Create empty case</div>
              </button>

              <button
                type="button"
                onClick={() => setIngestOption('write')}
                className={`p-3 rounded-lg border text-left transition ${
                  ingestOption === 'write'
                    ? 'bg-blue-600/10 border-blue-500 text-slate-100'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold flex items-center gap-1">
                  <span>✍️</span> Write Report
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Type narrative / FIR</div>
              </button>

              <button
                type="button"
                onClick={() => setIngestOption('upload')}
                className={`p-3 rounded-lg border text-left transition ${
                  ingestOption === 'upload'
                    ? 'bg-blue-600/10 border-blue-500 text-slate-100'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold flex items-center gap-1">
                  <span>📁</span> Upload File
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">PDF, DOCX, TXT, JSON</div>
              </button>
            </div>

            {/* Write Report Section */}
            {ingestOption === 'write' && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">Written Report Details</span>
                  <button
                    type="button"
                    onClick={loadSyntheticTemplate}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 px-2.5 py-1 rounded border border-slate-700 transition"
                  >
                    ⚡ Load Synthetic FIR
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Report title or reference (e.g. Initial FIR Report)"
                  value={reportTitle}
                  onChange={e => setReportTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />

                <textarea
                  placeholder="Type or paste the case report text here..."
                  value={reportContent}
                  onChange={e => setReportContent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500 h-32 font-mono leading-relaxed"
                />
              </div>
            )}

            {/* Upload File Section */}
            {ingestOption === 'upload' && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3 mt-3 text-center">
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
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-mono text-xs">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-xs text-slate-500 hover:text-red-400 ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Select a document (.pdf, .docx, .txt, .json) to ingest</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 transition"
                      >
                        Browse File
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
            <Link 
              href="/cases" 
              className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition text-sm font-medium"
            >
              Cancel
            </Link>
            <button 
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-sm transition disabled:opacity-50 shadow-md shadow-blue-900/30 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  Processing...
                </>
              ) : (
                'Create Case'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
