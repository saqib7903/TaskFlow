import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Trash2, Shield, User, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function TeamPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }) => api.put(`/users/${id}/role`, { role }),
    onSuccess: () => { qc.invalidateQueries(['users']); toast.success('Role updated!'); },
    onError: err => toast.error(err.response?.data?.message || 'Error'),
  });

  const deleteUser = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => { qc.invalidateQueries(['users']); toast.success('User deleted.'); },
    onError: err => toast.error(err.response?.data?.message || 'Error'),
  });

  const users = (data?.users || []).filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  const admins = users.filter(u => u.role === 'admin').length;
  const members = users.filter(u => u.role === 'member').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="text-muted text-sm">{users.length} total users · {admins} admin{admins !== 1 ? 's' : ''} · {members} member{members !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Users', value: data?.users?.length || 0, color: 'var(--primary)', icon: '👥' },
          { label: 'Admins', value: admins, color: 'var(--accent)', icon: '🛡️' },
          { label: 'Members', value: members, color: 'var(--success)', icon: '👤' },
        ].map(s => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.25rem', maxWidth: 320 }}>
        <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
        <input className="input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.2rem' }} />
      </div>

      {/* Users table */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 120px 120px 80px', gap: '1rem', padding: '0.75rem 1.25rem', background: 'var(--surface)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          <span>User</span><span>Email</span><span>Joined</span><span>Role</span><span>Actions</span>
        </div>
        {users.map((u, i) => (
          <div key={u._id} style={{ display: 'grid', gridTemplateColumns: '1fr 200px 120px 120px 80px', gap: '1rem', padding: '0.9rem 1.25rem', alignItems: 'center', borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src={u.avatar} className="avatar avatar-sm" alt={u.name} />
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</span>
            </div>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{format(new Date(u.createdAt), 'MMM d, yyyy')}</span>
            <select
              className="select"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
              value={u.role}
              onChange={e => updateRole.mutate({ id: u._id, role: e.target.value })}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button className="btn-icon" onClick={() => { if (confirm(`Delete ${u.name}?`)) deleteUser.mutate(u._id); }} style={{ color: 'var(--danger)' }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {users.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No users found</div>
        )}
      </div>
    </div>
  );
}