'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { CaseWorkspacePicker } from '@/components/case/CaseWorkspacePicker';
import { EntityAssignmentPanel } from '@/components/team/EntityAssignmentPanel';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  surfaceBtnPrimary,
  surfaceBtnSecondary,
  surfaceCard,
  surfaceInput,
  surfacePanel,
  surfaceSelect,
} from '@/components/layout/surface';

interface TeamMember {
  id: string;
  case_id: string;
  user_id: string;
  case_role: 'CASE_LEAD' | 'INVESTIGATOR' | 'ANALYST' | 'REVIEWER' | 'OBSERVER';
  status: 'ACTIVE' | 'REMOVED';
  assigned_by?: string;
  assigned_at: string;
  removed_by?: string;
  removed_at?: string;
}

interface CaseTask {
  id: string;
  case_id: string;
  title: string;
  description?: string;
  task_type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
  assigned_to?: string;
  created_by: string;
  completed_by?: string;
  due_at?: string;
  completed_at?: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export default function CollaborationPage() {
  const params = useParams();
  const caseId = params?.caseId as string;
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<CaseTask[]>([]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Modals
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskType, setNewTaskType] = useState('GENERAL');
  const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'INVESTIGATOR' | 'ANALYST' | 'REVIEWER' | 'OBSERVER'>('INVESTIGATOR');
  const [newMemberReason, setNewMemberReason] = useState('');
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);

  const [showTransferLeadModal, setShowTransferLeadModal] = useState(false);
  const [transferTargetUserId, setTransferTargetUserId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Load Team & Tasks
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [teamData, taskData] = await Promise.all([
        api.getCaseTeam(caseId),
        api.getCaseTasks(caseId)
      ]);
      setTeam(teamData || []);
      setTasks(taskData || []);
    } catch (err: any) {
      if (err.status === 403) {
        setError('You do not have permission to view collaboration details for this case.');
      } else {
        setError(err.message || 'Failed to load team and task data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) {
      loadData();
    }
  }, [caseId]);

  // Current user's membership
  const currentMembership = useMemo(() => {
    if (!user) return null;
    return team.find(m => m.user_id === user.id && m.status === 'ACTIVE');
  }, [team, user]);

  const isCaseLead = currentMembership?.case_role === 'CASE_LEAD' || user?.role === 'ADMINISTRATOR';
  const canManageTeam = isCaseLead;

  // My Tasks
  const myTasks = useMemo(() => {
    if (!user) return [];
    return tasks.filter(t => t.assigned_to === user.id);
  }, [tasks, user]);

  // Filtered Team Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, statusFilter, priorityFilter]);

  // Handle Mark Complete
  const handleCompleteTask = async (task: CaseTask) => {
    try {
      await api.completeCaseTask(caseId, task.id, {
        expected_version: task.version,
        reason: 'Marked completed by investigator'
      });
      toast.success('Task marked as completed.');
      loadData();
    } catch (err: any) {
      if (err.status === 409 || err.message?.includes('conflict') || err.message?.includes('VERSION_CONFLICT')) {
        toast.error('Version conflict: This task was modified by another member. Refreshing...');
        loadData();
      } else {
        toast.error(err.message || 'Failed to complete task.');
      }
    }
  };

  // Handle Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      toast.error('Please enter a task title.');
      return;
    }
    setIsSubmittingTask(true);
    try {
      await api.createCaseTask(caseId, {
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim() || undefined,
        task_type: newTaskType,
        priority: newTaskPriority,
        assigned_to: newTaskAssignee || undefined
      });
      toast.success('Task created successfully.');
      setShowNewTaskModal(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskAssignee('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create task.');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // Handle Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberUserId.trim()) {
      toast.error('Please enter a valid user ID or username.');
      return;
    }
    setIsSubmittingMember(true);
    try {
      await api.addTeamMember(caseId, {
        user_id: newMemberUserId.trim(),
        case_role: newMemberRole,
        reason: newMemberReason.trim() || 'Assigned to investigation team'
      });
      toast.success('Team member added successfully.');
      setShowAddMemberModal(false);
      setNewMemberUserId('');
      setNewMemberReason('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member.');
    } finally {
      setIsSubmittingMember(false);
    }
  };

  // Handle Transfer Lead
  const handleTransferLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTargetUserId) {
      toast.error('Please select a team member.');
      return;
    }
    if (!transferReason.trim()) {
      toast.error('Please specify a reason for transferring case leadership.');
      return;
    }
    setIsSubmittingTransfer(true);
    try {
      await api.transferCaseLead(caseId, {
        new_lead_user_id: transferTargetUserId,
        reason: transferReason.trim()
      });
      toast.success('Case leadership successfully transferred.');
      setShowTransferLeadModal(false);
      setTransferReason('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to transfer leadership.');
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  if (loading) {
    return (
      <div className="-m-5 space-y-0 sm:-m-6 lg:-m-8">
        <PageHeader badge="Collaboration" title="Loading workspace..." />
        <div className="flex flex-col items-center justify-center px-5 py-20 sm:px-6 lg:px-8">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-sm text-white/45">Loading Case Collaboration Space...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="-m-5 space-y-0 sm:-m-6 lg:-m-8">
        <PageHeader badge="Collaboration" title="Access Denied / Offline" description={error} />
        <div className="flex flex-col items-center justify-center px-5 py-10 text-center sm:px-6 lg:px-8">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-400">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/cases/${caseId}`)}
            className={surfaceBtnSecondary}
          >
            Return to Case Dossier
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="-m-5 space-y-0 sm:-m-6 lg:-m-8">
      <PageHeader
        badge={`Cases / ${caseId}`}
        title="Multi-Investigator Workspace"
        description="Assign entities to officers, collaborate on tasks, and manage team roles."
        leading={<CaseWorkspacePicker currentCaseId={caseId} workspace="collaboration" />}
        actions={
          <>
            <Link href={`/cases/${caseId}`} className={cn(surfaceBtnSecondary, 'gap-1.5 text-xs')}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Back to Dossier
            </Link>
            <button
              type="button"
              onClick={() => setShowNewTaskModal(true)}
              className={cn(surfaceBtnPrimary, 'gap-1.5 text-xs')}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
              New Task
            </button>
            {canManageTeam && (
              <button
                type="button"
                onClick={() => setShowAddMemberModal(true)}
                className={cn(surfaceBtnSecondary, 'gap-1.5 text-xs')}
              >
                <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
                Add Member
              </button>
            )}
          </>
        }
      />

      <div className="mx-auto max-w-7xl space-y-8 px-5 py-5 sm:px-6 lg:px-8">
        <EntityAssignmentPanel caseId={caseId} />

        {/* Section 1: My Work */}
        <Card className={cn(surfaceCard, 'gap-0 p-6')}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">My Assigned Work ({myTasks.length})</h2>
            </div>
            <span className="font-mono text-xs text-white/40">Logged in as {user?.username} ({currentMembership?.case_role || user?.role || 'Guest'})</span>
          </div>

          {myTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.08] p-8 text-center text-xs text-white/40">
              No investigative tasks are currently assigned to you on this case.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myTasks.map(task => (
                <div key={task.id} className={cn(surfacePanel, 'flex flex-col justify-between p-4 transition hover:border-white/[0.14]')}>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded bg-white/[0.05] px-2 py-0.5 font-mono text-[10px] uppercase text-white/70">
                        {task.task_type.replace('_', ' ')}
                      </span>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase
                        ${task.priority === 'CRITICAL' ? 'border border-red-500/20 bg-red-500/10 text-red-400' : 
                          task.priority === 'HIGH' ? 'border border-amber-500/20 bg-amber-500/10 text-amber-400' : 
                          'bg-white/[0.05] text-white/45'}`}>
                        {task.priority}
                      </span>
                    </div>
                    <h3 className="mb-1 line-clamp-1 text-sm font-semibold text-white">{task.title}</h3>
                    {task.description && (
                      <p className="mb-3 line-clamp-2 text-xs text-white/45">{task.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-white/[0.08] pt-3 text-xs">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${task.status === 'COMPLETED' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                      {task.status}
                    </span>
                    {task.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleCompleteTask(task)}
                        className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded text-xs font-medium transition"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Section 2: Team Tasks */}
        <Card className={cn(surfaceCard, 'gap-0 p-6')}>
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">Case Task Queue ({filteredTasks.length})</h2>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={cn(surfaceSelect, 'text-xs')}
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="BLOCKED">BLOCKED</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className={cn(surfaceSelect, 'text-xs')}
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.08] p-8 text-center text-xs text-white/40">
              No tasks match the selected filter criteria.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTasks.map(task => {
                const assignee = team.find(m => m.user_id === task.assigned_to);
                return (
                  <div key={task.id} className={cn(surfacePanel, 'flex flex-col justify-between gap-4 p-4 transition hover:border-white/[0.14] sm:flex-row sm:items-center')}>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase
                          ${task.priority === 'CRITICAL' ? 'border border-red-500/20 bg-red-500/10 text-red-400' : 
                            task.priority === 'HIGH' ? 'border border-amber-500/20 bg-amber-500/10 text-amber-400' : 
                            'bg-white/[0.05] text-white/45'}`}>
                          {task.priority}
                        </span>
                        <span className="rounded bg-white/[0.05] px-2 py-0.5 font-mono text-[10px] uppercase text-white/45">
                          {task.task_type.replace('_', ' ')}
                        </span>
                        <span className="font-mono text-xs text-white/40">v{task.version}</span>
                      </div>
                      <h4 className="truncate text-sm font-semibold text-white">{task.title}</h4>
                      {task.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-white/45">{task.description}</p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-4 text-xs">
                      <div className="text-right">
                        <div className="text-[11px] text-white/45">
                          Assignee: <span className="font-medium text-white">{assignee ? assignee.user_id : (task.assigned_to || 'Unassigned')}</span>
                        </div>
                        <div className="text-[10px] text-white/40">
                          Created: {new Date(task.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider
                        ${task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          task.status === 'BLOCKED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Section 3: Team Roster */}
        <Card className={cn(surfaceCard, 'gap-0 p-6')}>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">Assigned Investigators &amp; Roles ({team.length})</h2>
            </div>
            {isCaseLead && team.length > 1 && (
              <button
                type="button"
                onClick={() => setShowTransferLeadModal(true)}
                className="text-xs text-amber-400 underline underline-offset-4 transition hover:text-amber-300"
              >
                Transfer Case Leadership
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {team.map(member => (
              <div key={member.id} className={cn(surfacePanel, 'flex flex-col justify-between p-4')}>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white">{member.user_id}</span>
                    {member.case_role === 'CASE_LEAD' ? (
                      <span className="rounded border border-blue-500/30 bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-blue-300">
                        CASE LEAD
                      </span>
                    ) : (
                      <span className="rounded bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold uppercase text-white/45">
                        {member.case_role}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-[11px] text-white/45">
                    <p>Status: <span className={member.status === 'ACTIVE' ? 'font-semibold text-emerald-400' : 'text-red-400'}>{member.status}</span></p>
                    <p>Assigned: {new Date(member.assigned_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <form onSubmit={handleCreateTask} className={cn(surfaceCard, 'w-full max-w-lg space-y-4 gap-0 p-6')}>
            <h3 className="mb-2 text-lg font-bold text-white">Create Investigation Task</h3>
            <div>
              <label className="mb-1 block text-xs font-semibold text-white/70">Title *</label>
              <input
                type="text"
                required
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="e.g. Verify beneficiary phone records"
                className={surfaceInput}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-white/70">Description</label>
              <textarea
                rows={2}
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
                placeholder="Details of evidence or entity verification required..."
                className={surfaceInput}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-white/70">Task Type</label>
                <select
                  value={newTaskType}
                  onChange={(e) => setNewTaskType(e.target.value)}
                  className={cn(surfaceSelect, 'w-full text-xs')}
                >
                  <option value="GENERAL">GENERAL</option>
                  <option value="VERIFY_ENTITY">VERIFY_ENTITY</option>
                  <option value="VERIFY_RELATIONSHIP">VERIFY_RELATIONSHIP</option>
                  <option value="REVIEW_DOCUMENT">REVIEW_DOCUMENT</option>
                  <option value="TRACE_PHONE">TRACE_PHONE</option>
                  <option value="REVIEW_TRANSACTION">REVIEW_TRANSACTION</option>
                  <option value="GRAPH_REVIEW">GRAPH_REVIEW</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-white/70">Priority</label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as any)}
                  className={cn(surfaceSelect, 'w-full text-xs')}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-white/70">Assignee</label>
              <select
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                className={cn(surfaceSelect, 'w-full text-xs')}
              >
                <option value="">Unassigned (or self-assigned)</option>
                {team.filter(m => m.status === 'ACTIVE').map(m => (
                  <option key={m.user_id} value={m.user_id}>{m.user_id} ({m.case_role})</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 border-t border-white/[0.08] pt-3">
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
                className={surfaceBtnSecondary}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingTask}
                className={surfaceBtnPrimary}
              >
                {isSubmittingTask ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <form onSubmit={handleAddMember} className={cn(surfaceCard, 'w-full max-w-md space-y-4 gap-0 p-6')}>
            <h3 className="mb-2 text-lg font-bold text-white">Add Investigator to Case</h3>
            <div>
              <label className="mb-1 block text-xs font-semibold text-white/70">User ID or Username *</label>
              <input
                type="text"
                required
                value={newMemberUserId}
                onChange={(e) => setNewMemberUserId(e.target.value)}
                placeholder="e.g. demo_analyst or UUID"
                className={surfaceInput}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-white/70">Case Role</label>
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as any)}
                className={cn(surfaceSelect, 'w-full text-xs')}
              >
                <option value="INVESTIGATOR">INVESTIGATOR</option>
                <option value="ANALYST">ANALYST</option>
                <option value="REVIEWER">REVIEWER</option>
                <option value="OBSERVER">OBSERVER</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-white/70">Assignment Reason</label>
              <input
                type="text"
                value={newMemberReason}
                onChange={(e) => setNewMemberReason(e.target.value)}
                placeholder="e.g. Financial transaction tracing support"
                className={surfaceInput}
              />
            </div>
            <div className="flex justify-end gap-3 border-t border-white/[0.08] pt-3">
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className={surfaceBtnSecondary}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingMember}
                className={cn(surfaceBtnPrimary, 'bg-emerald-600 hover:bg-emerald-500')}
              >
                {isSubmittingMember ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transfer Lead Modal */}
      {showTransferLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <form onSubmit={handleTransferLead} className={cn(surfaceCard, 'w-full max-w-md space-y-4 gap-0 p-6')}>
            <h3 className="mb-2 text-lg font-bold text-white">Transfer Case Leadership</h3>
            <p className="text-xs leading-relaxed text-white/45">
              Designate another active member as the new Case Lead. Your role will be transitioned to Investigator.
            </p>
            <div>
              <label className="mb-1 block text-xs font-semibold text-white/70">New Case Lead *</label>
              <select
                required
                value={transferTargetUserId}
                onChange={(e) => setTransferTargetUserId(e.target.value)}
                className={cn(surfaceSelect, 'w-full text-xs')}
              >
                <option value="">Select an active member</option>
                {team.filter(m => m.status === 'ACTIVE' && m.case_role !== 'CASE_LEAD').map(m => (
                  <option key={m.user_id} value={m.user_id}>{m.user_id} ({m.case_role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-white/70">Transfer Rationale / Reason *</label>
              <input
                type="text"
                required
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="e.g. Lead re-assigned to Senior Inspector"
                className={surfaceInput}
              />
            </div>
            <div className="flex justify-end gap-3 border-t border-white/[0.08] pt-3">
              <button
                type="button"
                onClick={() => setShowTransferLeadModal(false)}
                className={surfaceBtnSecondary}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingTransfer}
                className={cn(surfaceBtnPrimary, 'bg-amber-600 hover:bg-amber-500')}
              >
                {isSubmittingTransfer ? 'Transferring...' : 'Transfer Leadership'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
