'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function CollaborationPage() {
  const params = useParams();
  const caseId = params?.caseId as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [team, setTeam] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [teamData, taskData] = await Promise.all([
          api.get(`/api/v1/cases/${caseId}/team`),
          api.get(`/api/v1/cases/${caseId}/tasks`)
        ]);
        setTeam(teamData.data);
        setTasks(taskData.data);
      } catch (err: any) {
        if (err.response?.status === 403) {
          setError('You do not have permission to view collaboration details for this case.');
        } else {
          setError('Failed to load team and tasks data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }
    
    if (caseId) loadData();
  }, [caseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0d13] p-8 flex items-center justify-center text-gray-400">
        Loading Collaboration Data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b0d13] p-8 flex flex-col items-center justify-center text-red-500">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p>{error}</p>
        <button onClick={() => router.push('/cases')} className="mt-4 px-4 py-2 bg-gray-800 rounded">
          Return to Cases
        </button>
      </div>
    );
  }

  // TODO: Add actual current user check. For now, assume dummy logic.
  const myWork = tasks.filter(t => t.assigned_to === 'me'); // Dummy filter
  
  return (
    <div className="min-h-screen bg-[#0b0d13] text-gray-200 p-8 font-mono">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex justify-between items-center border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-bold text-white tracking-widest">CASE COLLABORATION</h1>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">
            + Add Member
          </button>
        </header>

        <section>
          <h2 className="text-xl font-bold text-red-500 mb-4 tracking-widest">MY WORK</h2>
          {myWork.length === 0 ? (
            <div className="p-4 border border-gray-800 rounded text-gray-500 bg-[#141721]">
              No tasks assigned to you.
            </div>
          ) : (
            <div className="space-y-2">
              {myWork.map(task => (
                <div key={task.id} className="p-4 border border-gray-800 rounded bg-[#141721] flex justify-between">
                  <div>
                    <h3 className="font-bold text-white">{task.title}</h3>
                    <span className="text-xs text-gray-400">{task.task_type} • {task.status}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${task.priority === 'CRITICAL' ? 'bg-red-900/50 text-red-400' : 'bg-gray-800'}`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold text-red-500 mb-4 tracking-widest">TEAM TASKS</h2>
          {tasks.length === 0 ? (
            <div className="p-4 border border-gray-800 rounded text-gray-500 bg-[#141721]">
              No tasks recorded for this case.
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task.id} className="p-4 border border-gray-800 rounded bg-[#141721] flex justify-between">
                  <div>
                    <h3 className="font-bold text-white">{task.title}</h3>
                    <span className="text-xs text-gray-400">{task.task_type} • {task.status}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${task.priority === 'CRITICAL' ? 'bg-red-900/50 text-red-400' : 'bg-gray-800'}`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold text-blue-500 mb-4 tracking-widest">TEAM ROSTER</h2>
          {team.length === 0 ? (
            <div className="p-4 border border-gray-800 rounded text-gray-500 bg-[#141721]">
              No team members found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.map(member => (
                <div key={member.id} className="p-4 border border-gray-800 rounded bg-[#141721]">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-white">{member.user_id}</span>
                    {member.case_role === 'CASE_LEAD' && (
                      <span className="text-[10px] bg-red-900/50 text-red-400 px-2 py-0.5 rounded uppercase tracking-wider">
                        LEAD
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>Role: {member.case_role}</p>
                    <p>Status: <span className={member.status === 'ACTIVE' ? 'text-green-400' : 'text-red-400'}>{member.status}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
