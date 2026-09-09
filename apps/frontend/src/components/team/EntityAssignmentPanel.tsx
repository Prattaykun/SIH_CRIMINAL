'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  surfaceBtnPrimary,
  surfaceBtnSecondary,
  surfaceCard,
  surfaceInput,
  surfaceSelect,
} from '@/components/layout/surface';

type Officer = {
  id: string;
  username: string;
  display_name: string;
  role: string;
  is_case_member: boolean;
  active_assignment_count: number;
};

type AssignableEntity = {
  id: string;
  entity_type: string;
  canonical_name: string;
  confidence_score?: number | null;
  verification_status?: string | null;
  assigned_officer_ids: string[];
  assigned_officer_names: string[];
};

type Assignment = {
  id: string;
  entity_id: string;
  entity_type?: string | null;
  entity_name?: string | null;
  assigned_to: string;
  assignee_display_name?: string | null;
  notes?: string | null;
  status: string;
};

const TYPE_FILTERS = [
  'ALL',
  'PERSON',
  'ORGANIZATION',
  'PHONE_NUMBER',
  'VEHICLE',
  'ACCOUNT',
  'LOCATION',
] as const;

export function EntityAssignmentPanel({ caseId }: { caseId: string }) {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [entities, setEntities] = useState<AssignableEntity[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, e, a] = await Promise.all([
        api.listCaseOfficers(caseId),
        api.listAssignableEntities(caseId),
        api.listEntityAssignments(caseId),
      ]);
      setOfficers(o || []);
      setEntities(e || []);
      setAssignments(a || []);
      setSelectedOfficerId((prev) => prev || o?.[0]?.id || '');
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const filteredEntities = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entities.filter((e) => {
      if (typeFilter !== 'ALL') {
        const t = e.entity_type.toUpperCase();
        if (typeFilter === 'ORGANIZATION' && !(t === 'ORGANIZATION' || t === 'ORG')) return false;
        else if (typeFilter === 'PHONE_NUMBER' && !(t === 'PHONE_NUMBER' || t === 'PHONE')) return false;
        else if (typeFilter === 'ACCOUNT' && !(t === 'ACCOUNT' || t === 'BANK_ACCOUNT')) return false;
        else if (typeFilter === 'LOCATION' && !(t === 'LOCATION' || t === 'ADDRESS')) return false;
        else if (
          !['ORGANIZATION', 'PHONE_NUMBER', 'ACCOUNT', 'LOCATION'].includes(typeFilter) &&
          t !== typeFilter
        )
          return false;
      }
      if (!q) return true;
      return e.canonical_name.toLowerCase().includes(q) || e.entity_type.toLowerCase().includes(q);
    });
  }, [entities, typeFilter, search]);

  const handleAssign = async () => {
    if (!selectedEntityId || !selectedOfficerId) {
      toast.error('Select an entity and an officer');
      return;
    }
    setSaving(true);
    try {
      await api.createEntityAssignment(caseId, {
        entity_id: selectedEntityId,
        assigned_to: selectedOfficerId,
        notes: notes.trim() || undefined,
      });
      toast.success('Entity assigned to officer');
      setNotes('');
      await load();
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Assignment failed');
    } finally {
      setSaving(false);
    }
  };

  const handleRelease = async (assignmentId: string) => {
    try {
      await api.releaseEntityAssignment(caseId, assignmentId);
      toast.success('Assignment released');
      await load();
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Failed to release');
    }
  };

  return (
    <Card className={cn(surfaceCard, 'p-5')}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/45">
            Entity → Officer Assignments
          </h2>
          <p className="mt-1 text-[11px] text-white/35">
            Assign persons, organizations, phones, vehicles, and other leads to seeded investigation officers.
            Synthetic demo only — investigative support, not guilt determination.
          </p>
        </div>
        <button type="button" onClick={load} className={cn(surfaceBtnSecondary, 'text-xs')}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={cn(surfaceSelect, 'text-xs')}
              >
                {TYPE_FILTERS.map((t) => (
                  <option key={t} value={t}>
                    {t === 'ALL' ? 'All types' : t}
                  </option>
                ))}
              </select>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search entities…"
                className={cn(surfaceInput, 'min-w-[10rem] flex-1 text-xs')}
              />
            </div>
            <div className="sih-thin-scrollbar max-h-72 overflow-y-auto rounded-xl border border-white/[0.08] bg-black/30">
              {filteredEntities.length === 0 ? (
                <p className="px-3 py-8 text-center text-xs text-white/35">No assignable entities found.</p>
              ) : (
                filteredEntities.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setSelectedEntityId(e.id)}
                    className={cn(
                      'flex w-full items-start gap-2 border-b border-white/[0.05] px-3 py-2.5 text-left transition hover:bg-white/[0.04]',
                      selectedEntityId === e.id && 'bg-blue-600/15'
                    )}
                  >
                    <span className="mt-0.5 rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/45">
                      {e.entity_type}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">{e.canonical_name}</span>
                      <span className="block truncate text-[10px] text-white/35">
                        {e.assigned_officer_names.length
                          ? `Assigned: ${e.assigned_officer_names.join(', ')}`
                          : 'Unassigned'}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">
              Assign to officer
            </label>
            <select
              value={selectedOfficerId}
              onChange={(e) => setSelectedOfficerId(e.target.value)}
              className={cn(surfaceSelect, 'w-full text-xs')}
            >
              {officers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.display_name} · {o.active_assignment_count} active
                  {o.is_case_member ? '' : ' (will join team)'}
                </option>
              ))}
            </select>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional assignment notes (follow-up focus, verification ask…)"
              className={cn(surfaceInput, 'min-h-[72px] w-full resize-y text-xs')}
            />
            <button
              type="button"
              disabled={saving || !selectedEntityId || !selectedOfficerId}
              onClick={handleAssign}
              className={cn(surfaceBtnPrimary, 'w-full text-xs')}
            >
              {saving ? 'Assigning…' : 'Assign entity to officer'}
            </button>

            <div className="pt-2">
              <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
                Active assignments
              </h3>
              <div className="sih-thin-scrollbar max-h-48 space-y-2 overflow-y-auto">
                {assignments.length === 0 ? (
                  <p className="text-xs text-white/35">No active assignments yet.</p>
                ) : (
                  assignments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start justify-between gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium text-white">
                          {a.entity_name || a.entity_id}
                        </div>
                        <div className="truncate text-[10px] text-white/40">
                          {a.entity_type} → {a.assignee_display_name || a.assigned_to}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRelease(a.id)}
                        className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-red-300 hover:text-red-200"
                      >
                        Release
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
