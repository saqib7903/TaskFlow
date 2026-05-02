import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import {
  FolderKanban,
  CheckSquare,
  Clock,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

const STATUS_COLORS = {
  todo: '#8888aa',
  'in-progress': '#60a5fa',
  review: '#fbbf24',
  done: '#34d399'
};

const PRIORITY_COLORS = {
  low: '#34d399',
  medium: '#60a5fa',
  high: '#fbbf24',
  critical: '#f87171'
};

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card" style={{ display: 'flex', gap: '1rem', padding: '1.25rem' }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: `${color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{value ?? 0}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</div>
        {sub && <div style={{ fontSize: '0.75rem', color }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  // ✅ FIXED API ROUTE
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/api/dashboard');
      return res.data;
    },
    retry: 1
  });

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 400
      }}>
        <div className="spinner" />
      </div>
    );
  }

  // ✅ SAFE FALLBACK (prevents crash)
  const stats = data?.stats || {};
  const recentTasks = data?.recentTasks || [];
  const overdueTasks = data?.overdueTasks || [];
  const myTasks = data?.myTasks || [];

  return (
    <div>

      {/* Welcome */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
          Good {new Date().getHours() < 12
            ? 'morning'
            : new Date().getHours() < 17
              ? 'afternoon'
              : 'evening'
          }, {user?.name?.split(' ')[0]}
        </h1>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <StatCard icon={FolderKanban} label="Active Projects" value={stats.activeProjects} color="#7c71f8" />
        <StatCard icon={CheckSquare} label="Total Tasks" value={stats.totalTasks} color="#34d399" />
        <StatCard icon={Clock} label="In Progress" value={stats.inProgress} color="#60a5fa" />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdue} color="#f87171" />
      </div>

      {/* My Tasks */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>My Tasks</h3>
          <Link to="/tasks">View all <ArrowRight size={12} /></Link>
        </div>

        {myTasks.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No tasks assigned</p>
        ) : (
          myTasks.map(task => (
            <div key={task._id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.5rem 0'
            }}>
              <div>
                <div style={{ fontWeight: 500 }}>{task.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'gray' }}>
                  {task.project?.name}
                </div>
              </div>
              <span>{task.status}</span>
            </div>
          ))
        )}
      </div>

      {/* Overdue */}
      {overdueTasks.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3 style={{ color: 'red' }}>Overdue Tasks</h3>

          {overdueTasks.map(task => (
            <div key={task._id}>
              {task.title} - {task.project?.name}
            </div>
          ))}
        </div>
      )}

      {/* Recent */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Recent Activity</h3>

        {recentTasks.map(task => (
          <div key={task._id}>
            {task.title} • {task.project?.name}
          </div>
        ))}
      </div>

    </div>
  );
}