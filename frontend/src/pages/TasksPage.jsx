import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Filter, Trash2, Edit3 } from 'lucide-react';

const PRIORITY_DOT = { low: '#34d399', medium: '#60a5fa', high: '#fbbf24', critical: '#f87171' };

export default function TasksPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ status: '', priority: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => api.get('/tasks/my').then(r => r.data),
  });

  const updateTask = useMutation({
    mutationFn: ({ id, status }) => api.put(`/tasks/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries(['my-tasks']),
  });

  const deleteTask = useMutation({
    mutationFn: (id) => api.delete(`/tasks/${id}`),
    onSuccess: () => { qc.invalidateQueries(['my-tasks']); toast.success('Task deleted.'); },
  });

  const tasks = (data?.tasks || []).filter(t =>
    (!filters.status || t.status === filters.status) &&
    (!filters.priority || t.priority === filters.priority)
  );

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="text-muted text-sm">{tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={15} style={{ color: 'var(--text-muted)' }} />
        <select className="select" style={{ width: 140 }} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
        <select className="select" style={{ width: 140 }} value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        {(filters.status || filters.priority) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ status: '', priority: '' })}>Clear</button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          <div className="icon">✅</div>
          <h3>No tasks found</h3>
          <p style={{ marginTop: '0.5rem' }}>Tasks assigned to you will appear here</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {tasks.map(task => {
            const overdue = task.status !== 'done' && task.dueDate && new Date() > new Date(task.dueDate);
            return (
              <div key={task._id} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `3px solid ${task.project?.color || 'var(--primary)'}` }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_DOT[task.priority], flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{task.title}</div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📁 {task.project?.name}</span>
                    {task.dueDate && (
                      <span style={{ fontSize: '0.75rem', color: overdue ? 'var(--danger)' : 'var(--text-muted)' }}>
                        {overdue ? '⚠️ ' : '📅 '}{format(new Date(task.dueDate), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                <select
                  className="select" style={{ width: 140, fontSize: '0.8rem' }}
                  value={task.status}
                  onChange={e => updateTask.mutate({ id: task._id, status: e.target.value })}
                  onClick={e => e.stopPropagation()}
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
                <button className="btn-icon" onClick={() => { if (confirm('Delete task?')) deleteTask.mutate(task._id); }} style={{ color: 'var(--danger)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}