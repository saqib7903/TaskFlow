import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { User, Lock, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', avatar: user?.avatar || '' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  const handleProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', profileForm);
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirm) return toast.error('Passwords do not match.');
    if (passForm.newPassword.length < 6) return toast.error('Password too short.');
    setChangingPass(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });
      toast.success('Password changed!');
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="page-header">
        <h1 className="page-title">Profile Settings</h1>
      </div>

      {/* Profile info */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <img src={user?.avatar} className="avatar avatar-xl" alt={user?.name} />
          <div>
            <h2 style={{ fontSize: '1.2rem' }}>{user?.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user?.email}</p>
            <span className={`badge badge-${user?.role}`} style={{ marginTop: '0.25rem' }}>{user?.role}</span>
          </div>
        </div>

        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={16} /> Update Profile
        </h3>
        <form onSubmit={handleProfile}>
          <div className="form-group">
            <label className="label">Full Name</label>
            <input className="input" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
          </div>
          <div className="form-group">
            <label className="label">Avatar URL</label>
            <input className="input" value={profileForm.avatar} onChange={e => setProfileForm(f => ({ ...f, avatar: e.target.value }))} placeholder="https://..." />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Leave blank for auto-generated avatar</span>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lock size={16} /> Change Password
        </h3>
        <form onSubmit={handlePassword}>
          {[
            { key: 'currentPassword', label: 'Current Password', placeholder: '••••••••' },
            { key: 'newPassword', label: 'New Password', placeholder: 'Min. 6 characters' },
            { key: 'confirm', label: 'Confirm New Password', placeholder: '••••••••' },
          ].map(({ key, label, placeholder }) => (
            <div className="form-group" key={key}>
              <label className="label">{label}</label>
              <input className="input" type="password" value={passForm[key]} onChange={e => setPassForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} required />
            </div>
          ))}
          <button type="submit" className="btn btn-primary" disabled={changingPass}>
            <Lock size={14} /> {changingPass ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}