import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Folder, Users, CheckSquare, ArrowRight, Trash2, Edit3, Search } from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['#7c71f8', '#f472b6', '#34d399', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa', '#2dd4bf'];

function ProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'active',
    priority: project?.priority || 'medium',
    color: project?.color || COLORS[0],
    dueDate: project?.dueDate ? format(new Date(project.dueDate), 'yyyy-MM-dd') : '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 style={{ marginBottom: '1.25rem' }}>{project ? 'Edit Project' : 'New Project'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Project Name *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Website Redesign" />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief project description..." />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="label">Status</label>
              <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
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
          <div className="form-group">
            <label className="label">Due Date</label>
            <input className="input" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="label">Color</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '3px solid #fff' : '2px solid transparent', cursor: 'pointer', outline: form.color === c ? `2px solid ${c}` : 'none' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{project ? 'Save Changes' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/projects', data),
    onSuccess: () => { qc.invalidateQueries(['projects']); toast.success('Project created!'); setShowModal(false); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create project'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/projects/${id}`, data),
    onSuccess: () => { qc.invalidateQueries(['projects']); toast.success('Project updated!'); setEditProject(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/projects/${id}`),
    onSuccess: () => { qc.invalidateQueries(['projects']); toast.success('Project deleted.'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const projects = data?.projects?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-muted text-sm">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: 320 }}>
        <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
        <input className="input" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.2rem' }} />
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📁</div>
          <h3>No projects yet</h3>
          <p style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>Create your first project to get started</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Project</button>
        </div>
      ) : (
        <div className="grid-3">
          {projects.map(project => (
            <div key={project._id} className="card" style={{ borderLeft: `3px solid ${project.color}`, position: 'relative' }}>
              {/* Actions */}
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.25rem' }}>
                <button className="btn-icon" onClick={() => setEditProject(project)} title="Edit"><Edit3 size={14} /></button>
                <button className="btn-icon" onClick={() => { if (confirm('Delete this project?')) deleteMutation.mutate(project._id); }} title="Delete" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
              </div>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem', paddingRight: '4rem' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${project.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Folder size={18} color={project.color} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.15rem' }}>{project.name}</h3>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span className={`badge badge-${project.priority}`}>{project.priority}</span>
                    <span className={`badge badge-${project.status === 'active' ? 'in-progress' : project.status === 'completed' ? 'done' : 'todo'}`}>{project.status}</span>
                  </div>
                </div>
              </div>

              {project.description && (
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                  {project.description.slice(0, 100)}{project.description.length > 100 ? '...' : ''}
                </p>
              )}

              {/* Stats */}
              {project.stats && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <CheckSquare size={13} /> {project.stats.total} tasks
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--success)' }}>
                    {project.stats.done} done
                  </div>
                  {project.stats.overdue > 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>
                      ⚠ {project.stats.overdue} overdue
                    </div>
                  )}
                </div>
              )}

              {/* Progress */}
              {project.stats?.total > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ height: 4, background: 'var(--surface)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(project.stats.done / project.stats.total) * 100}%`, background: project.color, borderRadius: 2, transition: 'width 0.4s' }} />
                  </div>
                </div>
              )}

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Users size={13} /> {project.members.length} member{project.members.length !== 1 ? 's' : ''}
                </div>
                <Link to={`/projects/${project._id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: project.color, textDecoration: 'none', fontWeight: 600 }}>
                  View <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showModal) && <ProjectModal onClose={() => setShowModal(false)} onSave={createMutation.mutate} />}
      {editProject && <ProjectModal project={editProject} onClose={() => setEditProject(null)} onSave={(data) => updateMutation.mutate({ id: editProject._id, data })} />}
    </div>
  );
}