import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { format, isPast } from 'date-fns';
import { FolderKanban, CheckSquare, Clock, AlertTriangle, Users, TrendingUp, ArrowRight } from 'lucide-react';

const STATUS_COLORS = { todo: '#8888aa', 'in-progress': '#60a5fa', review: '#fbbf24', done: '#34d399' };
const PRIORITY_COLORS = { low: '#34d399', medium: '#60a5fa', high: '#fbbf24', critical: '#f87171' };

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: '0.75rem', color, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data),
  });

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  const { stats, recentTasks, overdueTasks, myTasks } = data;

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Here's what's happening with your team today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <StatCard icon={FolderKanban} label="Active Projects" value={stats.activeProjects} color="var(--primary)" sub={`${stats.totalProjects} total`} />
        <StatCard icon={CheckSquare} label="Total Tasks" value={stats.totalTasks} color="var(--success)" sub={`${stats.done} completed`} />
        <StatCard icon={Clock} label="In Progress" value={stats.inProgress} color="var(--info)" sub={`${stats.review} in review`} />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdue} color="var(--danger)" sub={stats.overdue > 0 ? 'Needs attention' : 'All on track!'} />
      </div>

      {/* Task status breakdown */}
      <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Status bars */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Task Overview</h3>
          {[
            { key: 'todo', label: 'To Do', value: stats.todo },
            { key: 'in-progress', label: 'In Progress', value: stats.inProgress },
            { key: 'review', label: 'In Review', value: stats.review },
            { key: 'done', label: 'Done', value: stats.done },
          ].map(({ key, label, value }) => (
            <div key={key} style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{value}</span>
              </div>
              <div style={{ height: 6, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: stats.totalTasks ? `${(value / stats.totalTasks) * 100}%` : '0%',
                  background: STATUS_COLORS[key],
                  borderRadius: 3,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* My tasks */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>My Tasks</h3>
            <Link to="/tasks" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {myTasks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No tasks assigned to you.</p>
          ) : (
            myTasks.map(task => (
              <div key={task._id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[task.priority], flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.project?.name}</div>
                </div>
                <span className={`badge badge-${task.status}`}>{task.status}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Overdue tasks */}
      {overdueTasks.length > 0 && (
        <div className="card" style={{ borderColor: 'rgba(248,113,113,0.3)', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={16} /> Overdue Tasks
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {overdueTasks.map(task => (
              <div key={task._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', background: 'var(--danger-dim)', borderRadius: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{task.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {task.project?.name} · Due {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : 'N/A'}
                  </div>
                </div>
                {task.assignee && (
                  <img src={task.assignee.avatar} className="avatar avatar-sm" alt={task.assignee.name} title={task.assignee.name} />
                )}
                <span className={`badge badge-${task.priority}`}>{task.priority}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Recent Activity</h3>
        {recentTasks.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No recent activity.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentTasks.map((task, i) => (
              <div key={task._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: i < recentTasks.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: task.project?.color || 'var(--primary)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {task.project?.name} · by {task.createdBy?.name}
                  </div>
                </div>
                <span className={`badge badge-${task.status}`}>{task.status.replace('-', ' ')}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                  {format(new Date(task.updatedAt), 'MMM d')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}