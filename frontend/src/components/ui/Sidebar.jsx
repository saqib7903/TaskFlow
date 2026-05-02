import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, Users, User, LogOut, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: CheckSquare, label: 'My Tasks' },
];
const adminLinks = [
  { to: '/team', icon: Users, label: 'Team' },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      {/* Logo */}
      <div style={{ padding: '1.25rem 1.25rem 0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Zap size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>TaskFlow</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: -2 }}>
              {user?.role === 'admin' ? 'Admin Panel' : 'Member Portal'}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.5rem 0.5rem 0.25rem' }}>
          Navigation
        </div>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={onClose} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '0.7rem',
            padding: '0.55rem 0.75rem', borderRadius: 8, textDecoration: 'none',
            fontWeight: 600, fontSize: '0.875rem',
            background: isActive ? 'var(--primary-dim)' : 'transparent',
            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
            borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
            transition: 'all 0.15s',
          })}>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.75rem 0.5rem 0.25rem' }}>
              Admin
            </div>
            {adminLinks.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} onClick={onClose} style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '0.7rem',
                padding: '0.55rem 0.75rem', borderRadius: 8, textDecoration: 'none',
                fontWeight: 600, fontSize: '0.875rem',
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                transition: 'all 0.15s',
              })}>
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '0.75rem' }}>
        <NavLink to="/profile" onClick={onClose} style={({ isActive }) => ({
          display: 'flex', alignItems: 'center', gap: '0.7rem',
          padding: '0.6rem 0.75rem', borderRadius: 8, textDecoration: 'none',
          background: isActive ? 'var(--surface)' : 'transparent',
          color: 'var(--text)', transition: 'background 0.15s',
          marginBottom: '0.25rem',
        })}>
          <img src={user?.avatar} alt={user?.name} className="avatar avatar-sm" />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
            <span className={`badge badge-${user?.role}`} style={{ fontSize: '0.6rem' }}>{user?.role}</span>
          </div>
        </NavLink>
        <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
          <LogOut size={14} /> Logout
        </button>
      </div>
    </aside>
  );
}