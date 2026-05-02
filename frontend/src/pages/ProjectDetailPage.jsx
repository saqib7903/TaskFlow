import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Plus, ArrowLeft, UserPlus, Trash2, Edit3, MessageSquare, User } from 'lucide-react';
import { format } from 'date-fns';

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: '#8888aa' },
  { key: 'in-progress', label: 'In Progress', color: '#60a5fa' },
  { key: 'review', label: 'Review', color: '#fbbf24' },
  { key: 'done', label: 'Done', color: '#34d399' },
];

function TaskModal({ task, projectId, members, onClose, onSave }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assignee: task?.assignee?._id || '',
    dueDate: task?.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
    project: projectId,
  });
  const handleSubmit = (e) => { e.preventDefault(); onSave(form); };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 style={{ marginBottom: '1.25rem' }}>{task ? 'Edit Task' : 'New Task'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Task title..." />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Task details..." />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="label">Status</label>
              <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Priority</label>
              <select className="select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="label">Assignee</label>
              <select className="select" value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Due Date</label>
              <input className="input" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{task ? 'Save' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/projects/${projectId}/members`, { email, role });
      qc.invalidateQueries(['project', projectId]);
      toast.success('Member added!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <h2 style={{ marginBottom: '1.25rem' }}>Add Member</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Email Address</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="member@example.com" />
          </div>
          <div className="form-group">
            <label className="label">Role</label>
            <select className="select" value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [activeTab, setActiveTab] = useState('board');

  const { data, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`).then(r => r.data),
  });

  const createTask = useMutation({
    mutationFn: (d) => api.post('/tasks', d),
    onSuccess: () => { qc.invalidateQueries(['project', id]); toast.success('Task created!'); setShowTaskModal(false); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  const updateTask = useMutation({
    mutationFn: ({ tid, d }) => api.put(`/tasks/${tid}`, d),
    onSuccess: () => { qc.invalidateQueries(['project', id]); toast.success('Task updated!'); setEditTask(null); },
  });

  const deleteTask = useMutation({
    mutationFn: (tid) => api.delete(`/tasks/${tid}`),
    onSuccess: () => { qc.invalidateQueries(['project', id]); toast.success('Task deleted.'); },
  });

  const removeMember = useMutation({
    mutationFn: (uid) => api.delete(`/projects/${id}/members/${uid}`),
    onSuccess: () => { qc.invalidateQueries(['project', id]); toast.success('Member removed.'); },
  });

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  const { project, tasks } = data;
  const isAdmin = user?.role === 'admin';
  const myMember = project.members?.find(m => m.user._id === user?._id);
  const isProjectAdmin = project.owner?._id === user?._id || myMember?.role === 'admin' || isAdmin;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-icon" onClick={() => navigate('/projects')}><ArrowLeft size={18} /></button>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${project.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.2rem' }}>📁</span>
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{project.name}</h1>
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.15rem' }}>
              <span className={`badge badge-${project.priority}`}>{project.priority}</span>
              <span className={`badge badge-${project.status === 'active' ? 'in-progress' : 'todo'}`}>{project.status}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isProjectAdmin && (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowMemberModal(true)}>
              <UserPlus size={14} /> Add Member
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setShowTaskModal(true)}>
            <Plus size={14} /> Add Task
          </button>
        </div>
      </div>

      {project.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>{project.description}</p>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0' }}>
        {['board', 'team'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '0.5rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font)', fontWeight: 600, fontSize: '0.875rem',
            color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: -1,
          }}>
            {tab === 'board' ? '📋 Board' : '👥 Team'}
          </button>
        ))}
      </div>

      {activeTab === 'board' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', alignItems: 'start' }}>
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key);
            return (
              <div key={col.key} style={{ background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                {/* Column header */}
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                    <span style={{ fontWeight: 700, fontSize: '0.825rem' }}>{col.label}</span>
                  </div>
                  <span style={{ background: 'var(--surface)', color: 'var(--text-muted)', borderRadius: 99, padding: '0.1rem 0.45rem', fontSize: '0.7rem', fontWeight: 700 }}>
                    {colTasks.length}
                  </span>
                </div>
                {/* Tasks */}
                <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: 100 }}>
                  {colTasks.map(task => (
                    <div key={task._id} style={{ background: 'var(--bg-overlay)', borderRadius: 8, padding: '0.75rem', border: '1px solid var(--border-subtle)', cursor: 'pointer' }} onClick={() => setEditTask(task)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.3 }}>{task.title}</span>
                        <button className="btn-icon" style={{ padding: '0.1rem', marginLeft: '0.25rem', flexShrink: 0 }} onClick={e => { e.stopPropagation(); if (confirm('Delete task?')) deleteTask.mutate(task._id); }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {task.dueDate && (
                            <span style={{ fontSize: '0.7rem', color: new Date() > new Date(task.dueDate) && task.status !== 'done' ? 'var(--danger)' : 'var(--text-dim)' }}>
                              {format(new Date(task.dueDate), 'MMM d')}
                            </span>
                          )}
                          {task.assignee && <img src={task.assignee.avatar} className="avatar" style={{ width: 20, height: 20 }} alt={task.assignee.name} title={task.assignee.name} />}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setShowTaskModal(true)} style={{ padding: '0.4rem', background: 'none', border: '1px dashed var(--border)', borderRadius: 8, color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                    <Plus size={12} /> Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'team' && (
        <div style={{ maxWidth: 600 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Owner */}
            <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src={project.owner.avatar} className="avatar avatar-md" alt={project.owner.name} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{project.owner.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{project.owner.email}</div>
              </div>
              <span className="badge badge-admin">Owner</span>
            </div>
            {/* Members */}
            {project.members.filter(m => m.user._id !== project.owner._id).map(m => (
              <div key={m.user._id} style={{ padding: '0.75rem 1rem', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img src={m.user.avatar} className="avatar avatar-md" alt={m.user.name} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{m.user.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.user.email}</div>
                </div>
                <span className={`badge badge-${m.role}`}>{m.role}</span>
                {isProjectAdmin && (
                  <button className="btn-icon" onClick={() => { if (confirm('Remove member?')) removeMember.mutate(m.user._id); }} style={{ color: 'var(--danger)' }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showTaskModal && <TaskModal projectId={id} members={project.members} onClose={() => setShowTaskModal(false)} onSave={createTask.mutate} />}
      {editTask && <TaskModal task={editTask} projectId={id} members={project.members} onClose={() => setEditTask(null)} onSave={(d) => updateTask.mutate({ tid: editTask._id, d })} />}
      {showMemberModal && <AddMemberModal projectId={id} onClose={() => setShowMemberModal(false)} />}
    </div>
  );
}