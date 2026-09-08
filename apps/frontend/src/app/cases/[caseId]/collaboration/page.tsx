'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

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
      <div className="min-h-screen bg-[#0b0d13] flex flex-col items-center justify-center text-slate-400 font-sans">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm">Loading Case Collaboration Space...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b0d13] p-8 flex flex-col items-center justify-center font-sans text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied / Offline</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">{error}</p>
        <button
          onClick={() => router.push(`/cases/${caseId}`)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition"
        >
          Return to Case Dossier
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d13] text-slate-200 p-4 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & Breadcrumb */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#212638] pb-6">
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono uppercase tracking-wider mb-1">
              <Link href="/cases" className="hover:text-white transition">Cases</Link>
              <span>/</span>
              <Link href={`/cases/${caseId}`} className="hover:text-white transition font-semibold text-slate-300">{caseId}</Link>
              <span>/</span>
              <span className="text-indigo-400">Collaboration &amp; Tasks</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              Multi-Investigator Workspace
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Phase 1 Active
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/cases/${caseId}`}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Back to Dossier
            </Link>
            <button
              onClick={() => setShowNewTaskModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-900/20 transition flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
              New Task
            </button>
            {canManageTeam && (
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
              >
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
                Add Member
              </button>
            )}
          </div>
        </header>

        {/* Section 1: My Work */}
        <section className="bg-[#141721] border border-[#212638] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">My Assigned Work ({myTasks.length})</h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">Logged in as {user?.username} ({currentMembership?.case_role || user?.role || 'Guest'})</span>
          </div>

          {myTasks.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 text-xs">
              No investigative tasks are currently assigned to you on this case.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myTasks.map(task => (
                <div key={task.id} className="bg-[#0b0d13] border border-[#212638] rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {task.task_type.replace('_', ' ')}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase
                        ${task.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                          task.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                          'bg-slate-800 text-slate-400'}`}>
                        {task.priority}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1 line-clamp-1">{task.title}</h3>
                    {task.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">{task.description}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
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
        </section>

        {/* Section 2: Team Tasks */}
        <section className="bg-[#141721] border border-[#212638] rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Case Task Queue ({filteredTasks.length})</h2>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#0b0d13] border border-[#212638] text-xs text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
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
                className="bg-[#0b0d13] border border-[#212638] text-xs text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
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
            <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 text-xs">
              No tasks match the selected filter criteria.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTasks.map(task => {
                const assignee = team.find(m => m.user_id === task.assigned_to);
                return (
                  <div key={task.id} className="bg-[#0b0d13] border border-[#212638] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase
                          ${task.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                            task.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                            'bg-slate-800 text-slate-400'}`}>
                          {task.priority}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                          {task.task_type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">v{task.version}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white truncate">{task.title}</h4>
                      {task.description && (
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{task.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-xs">
                      <div className="text-right">
                        <div className="text-slate-400 text-[11px]">
                          Assignee: <span className="text-white font-medium">{assignee ? assignee.user_id : (task.assigned_to || 'Unassigned')}</span>
                        </div>
                        <div className="text-slate-500 text-[10px]">
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
        </section>

        {/* Section 3: Team Roster */}
        <section className="bg-[#141721] border border-[#212638] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Assigned Investigators &amp; Roles ({team.length})</h2>
            </div>
            {isCaseLead && team.length > 1 && (
              <button
                onClick={() => setShowTransferLeadModal(true)}
                className="text-xs text-amber-400 hover:text-amber-300 transition underline underline-offset-4"
              >
                Transfer Case Leadership
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.map(member => (
              <div key={member.id} className="bg-[#0b0d13] border border-[#212638] rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white font-mono">{member.user_id}</span>
                    {member.case_role === 'CASE_LEAD' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-widest">
                        CASE LEAD
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                        {member.case_role}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <p>Status: <span className={member.status === 'ACTIVE' ? 'text-emerald-400 font-semibold' : 'text-red-400'}>{member.status}</span></p>
                    <p>Assigned: {new Date(member.assigned_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateTask} className="bg-[#141721] border border-[#212638] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white mb-2">Create Investigation Task</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Title *</label>
              <input
                type="text"
                required
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="e.g. Verify beneficiary phone records"
                className="w-full bg-[#0b0d13] border border-[#212638] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
              <textarea
                rows={2}
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
                placeholder="Details of evidence or entity verification required..."
                className="w-full bg-[#0b0d13] border border-[#212638] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Task Type</label>
                <select
                  value={newTaskType}
                  onChange={(e) => setNewTaskType(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-[#212638] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as any)}
                  className="w-full bg-[#0b0d13] border border-[#212638] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Assignee</label>
              <select
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                className="w-full bg-[#0b0d13] border border-[#212638] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Unassigned (or self-assigned)</option>
                {team.filter(m => m.status === 'ACTIVE').map(m => (
                  <option key={m.user_id} value={m.user_id}>{m.user_id} ({m.case_role})</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingTask}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-2"
              >
                {isSubmittingTask ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddMember} className="bg-[#141721] border border-[#212638] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white mb-2">Add Investigator to Case</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">User ID or Username *</label>
              <input
                type="text"
                required
                value={newMemberUserId}
                onChange={(e) => setNewMemberUserId(e.target.value)}
                placeholder="e.g. demo_analyst or UUID"
                className="w-full bg-[#0b0d13] border border-[#212638] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Case Role</label>
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as any)}
                className="w-full bg-[#0b0d13] border border-[#212638] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="INVESTIGATOR">INVESTIGATOR</option>
                <option value="ANALYST">ANALYST</option>
                <option value="REVIEWER">REVIEWER</option>
                <option value="OBSERVER">OBSERVER</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Assignment Reason</label>
              <input
                type="text"
                value={newMemberReason}
                onChange={(e) => setNewMemberReason(e.target.value)}
                placeholder="e.g. Financial transaction tracing support"
                className="w-full bg-[#0b0d13] border border-[#212638] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-3 justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingMember}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
              >
                {isSubmittingMember ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transfer Lead Modal */}
      {showTransferLeadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleTransferLead} className="bg-[#141721] border border-[#212638] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white mb-2">Transfer Case Leadership</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Designate another active member as the new Case Lead. Your role will be transitioned to Investigator.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New Case Lead *</label>
              <select
                required
                value={transferTargetUserId}
                onChange={(e) => setTransferTargetUserId(e.target.value)}
                className="w-full bg-[#0b0d13] border border-[#212638] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select an active member</option>
                {team.filter(m => m.status === 'ACTIVE' && m.case_role !== 'CASE_LEAD').map(m => (
                  <option key={m.user_id} value={m.user_id}>{m.user_id} ({m.case_role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Transfer Rationale / Reason *</label>
              <input
                type="text"
                required
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="e.g. Lead re-assigned to Senior Inspector"
                className="w-full bg-[#0b0d13] border border-[#212638] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-3 justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowTransferLeadModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingTransfer}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition"
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
