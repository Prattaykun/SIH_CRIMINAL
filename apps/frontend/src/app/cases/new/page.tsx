'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function NewCasePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setError('Title is required');
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
      
      // Redirect to the new case overview
      router.push(`/cases/${newCase.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 mt-10">
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
        <Link href="/cases" className="hover:text-slate-200">Cases</Link>
        <span>/</span>
        <span className="text-slate-200">New Case</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Create New Case</h2>
        <p className="text-slate-400 text-sm mb-6">Initialize a new investigative workspace.</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Case Title</label>
            <input 
              type="text" 
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
              placeholder="e.g. Synthetic Smuggling Ring"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea 
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500 h-24"
              placeholder="Case details..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
            <select 
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
              value={priority}
              onChange={e => setPriority(e.target.value)}
            >
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
            <Link 
              href="/cases" 
              className="px-4 py-2 rounded text-slate-300 hover:bg-slate-800 transition text-sm font-medium"
            >
              Cancel
            </Link>
            <button 
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium text-sm transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
