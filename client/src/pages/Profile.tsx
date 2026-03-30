import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SubtleOrb, PageLoader, Spinner, useToast } from './DesignSystem';

interface ProfileData {
  _id: string; name: string; email: string; role: string; createdAt: string;
  totalReports: number; totalUpvotes: number; resolvedReports?: number; profilePhoto?: string;
  totalProperties?: number; avgTrustScore?: number; totalReportsOnProperties?: number; resolutionRate?: number;
}
interface NotificationPreferences { securityAlerts: boolean; responseUpdates: boolean; platformNews: boolean; }

export default function Profile() {
  const { user } = useAuth();
  const toast    = useToast();
  const [profile, setProfile]   = useState<ProfileData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const [editingName, setEditingName]   = useState(false);
  const [newName, setNewName]           = useState('');
  const [nameLoading, setNameLoading]   = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword]   = useState('');
  const [newPassword, setNewPassword]           = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [passwordLoading, setPasswordLoading]   = useState(false);
  const [passwordMessage, setPasswordMessage]   = useState('');

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({ securityAlerts: true, responseUpdates: true, platformNews: false });
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [showPhotoModal, setShowPhotoModal]   = useState(false);
  const [uploadingPhoto, setUploadingPhoto]   = useState(false);
  const [photoPreview, setPhotoPreview]       = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate     = useNavigate();
  const API          = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const isOwner      = user?.role === 'owner';
  const accentColor  = isOwner ? 'var(--emerald)' : 'var(--indigo)';

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      const res  = await fetch(`${API}/api/profile`, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setNewName(data.data.name);
        if (data.data.notificationPrefs) setNotificationPrefs(data.data.notificationPrefs);
      } else { setError(data.message || 'Failed to load profile'); }
    } catch { setError('Error connecting to server'); }
    finally { setLoading(false); }
  };

  const handleNameUpdate = async () => {
    if (!newName.trim() || newName.trim() === profile?.name) { setEditingName(false); return; }
    const token = localStorage.getItem('token'); setNameLoading(true);
    try {
      const res  = await fetch(`${API}/api/profile`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim() }) });
      const data = await res.json();
      if (data.success) {
        setProfile(p => p ? { ...p, name: data.data.name } : null);
        setEditingName(false);
        toast.success('Name updated successfully!');
      } else { toast.error(data.message || 'Failed to update name'); }
    } catch { toast.error('Error updating name'); }
    finally { setNameLoading(false); }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault(); setPasswordMessage('');
    if (newPassword !== confirmPassword) { setPasswordMessage('mismatch'); return; }
    if (newPassword.length < 6) { setPasswordMessage('short'); return; }
    const token = localStorage.getItem('token'); setPasswordLoading(true);
    try {
      const res  = await fetch(`${API}/api/profile/password`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) });
      const data = await res.json();
      if (data.success) {
        toast.success('Password changed successfully!');
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        setTimeout(() => { setShowPasswordForm(false); setPasswordMessage(''); }, 500);
      } else {
        setPasswordMessage(data.message || 'Failed');
        toast.error(data.message || 'Failed to change password');
      }
    } catch { toast.error('Error changing password'); }
    finally { setPasswordLoading(false); }
  };

  const handleNotificationToggle = async (key: keyof NotificationPreferences) => {
    const newPrefs = { ...notificationPrefs, [key]: !notificationPrefs[key] };
    setNotificationPrefs(newPrefs); setSavingPrefs(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API}/api/profile/notifications`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ notificationPrefs: newPrefs }) });
      toast.success('Preferences saved');
    } catch { toast.info('Saved locally'); }
    finally { setSavingPrefs(false); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024)    { toast.error('Image must be under 5MB'); return; }
    const r = new FileReader(); r.onloadend = () => setPhotoPreview(r.result as string); r.readAsDataURL(file);
  };

  const handlePhotoUpload = async () => {
    if (!photoPreview || !fileInputRef.current?.files?.[0]) { toast.error('Please select an image first'); return; }
    setUploadingPhoto(true);
    try {
      const token = localStorage.getItem('token');
      const fd    = new FormData(); fd.append('image', fileInputRef.current.files[0]);
      const upRes  = await fetch(`${API}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      const upData = await upRes.json();
      if (upData.success && upData.urls?.length > 0) {
        const updRes  = await fetch(`${API}/api/profile`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ profilePhoto: upData.urls[0] }) });
        const updData = await updRes.json();
        if (updData.success) {
          setProfile(p => p ? { ...p, profilePhoto: upData.urls[0] } : null);
          setShowPhotoModal(false); setPhotoPreview(null);
          toast.success('Profile photo updated!');
        }
      } else { toast.error('Failed to upload image'); }
    } catch { toast.error('Error uploading image'); }
    finally { setUploadingPhoto(false); }
  };

  const handleRemovePhoto = async () => {
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API}/api/profile`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ profilePhoto: null }) });
      const data  = await res.json();
      if (data.success) {
        setProfile(p => p ? { ...p, profilePhoto: undefined } : null);
        setShowPhotoModal(false);
        toast.success('Profile photo removed');
      }
    } catch { toast.error('Error removing photo'); }
  };

  if (loading) return <PageLoader />;

  const STATS = isOwner ? [
    { label: 'Properties',     value: profile?.totalProperties || 0,         icon: '🏠', color: 'var(--emerald)' },
    { label: 'Avg Score',      value: `${profile?.avgTrustScore || 0}%`,      icon: '⭐', color: 'var(--indigo)'  },
    { label: 'Reports',        value: profile?.totalReportsOnProperties || 0, icon: '📄', color: 'var(--amber)'   },
    { label: 'Resolution %',   value: `${profile?.resolutionRate || 0}%`,     icon: '✅', color: 'var(--emerald)' },
  ] : [
    { label: 'Reports Filed',  value: profile?.totalReports || 0,     icon: '📄', color: 'var(--indigo)'  },
    { label: 'Confirmations',  value: profile?.totalUpvotes || 0,     icon: '👍', color: 'var(--violet)'  },
    { label: 'Issues Resolved',value: profile?.resolvedReports || 0,  icon: '✅', color: 'var(--emerald)' },
  ];

  const NOTIF_PREFS = [
    { key: 'securityAlerts' as const, label: isOwner ? 'New Reports'     : 'Security Alerts',  sub: isOwner ? 'When students file reports on your properties' : 'Critical safety reports in your area' },
    { key: 'responseUpdates' as const,label: 'Response Updates', sub: isOwner ? 'Student verification of your resolutions' : 'When owners reply to your reports' },
    { key: 'platformNews' as const,   label: 'Platform News',   sub: 'New features and safety guides' },
  ];

  return (
    <>
      <style>{CSS}</style>
      <SubtleOrb>
        <div className="pf-page">
          {/* Header */}
          <header className="pf-header fade-up">
            <div className="pf-header-inner">
              <Link to={isOwner ? '/owner/dashboard' : '/dashboard'} className="pf-back-link">← Back to Dashboard</Link>

              <div className="pf-hero-row">
                {/* Avatar */}
                <div className="pf-avatar-wrap">
                  <div className="pf-avatar" style={{ background: isOwner ? 'linear-gradient(135deg,#059669,#10b981)' : 'linear-gradient(135deg,var(--indigo),var(--violet))' }}>
                    {profile?.profilePhoto
                      ? <img src={profile.profilePhoto} alt={profile?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : profile?.name.charAt(0).toUpperCase()
                    }
                  </div>
                  <button onClick={() => setShowPhotoModal(true)} className="pf-avatar-edit" title="Edit photo">📷</button>
                </div>

                <div>
                  <div className="pf-name-row">
                    <h1 className="pf-name">{profile?.name}</h1>
                    <span className="pill" style={{ borderColor: `${accentColor === 'var(--emerald)' ? 'rgba(16,185,129,0.4)' : 'rgba(99,102,241,0.4)'}`, color: accentColor, marginTop: 4 }}>
                      {isOwner ? '🏢 Property Owner' : '🎓 Student'}
                    </span>
                  </div>
                  <p className="pf-email">✉️ {profile?.email}</p>
                  <div className="pf-since">
                    📅 Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats bar */}
            <div className="pf-stats" style={{ ['--accent-color' as any]: accentColor }}>
              {STATS.map((s, i) => (
                <div key={i} className="pf-stat fade-up" style={{ animationDelay: `${0.06 + i * 0.06}s` }}>
                  <span className="pf-stat-icon">{s.icon}</span>
                  <span className="pf-stat-num" style={{ color: s.color }}>{s.value}</span>
                  <span className="pf-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </header>

          <div className="pf-body">
            {error && <div className="ss-error fade-up" style={{ marginBottom: 20 }}>{error}</div>}

            <div className="pf-grid">
              {/* Left column */}
              <div className="pf-col">
                {/* Edit Name */}
                <div className="pf-card glass fade-up fade-up-2">
                  <h3 className="pf-card-title">Personal Information</h3>
                  <div className="pf-field-row">
                    <label className="field-label" style={{ marginBottom: 0 }}>Full Name</label>
                    {editingName ? (
                      <div className="pf-edit-row">
                        <input className="ss-input pf-edit-input" value={newName}
                          onChange={e => setNewName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleNameUpdate(); if (e.key === 'Escape') setEditingName(false); }}
                          autoFocus />
                        <button onClick={handleNameUpdate} disabled={nameLoading} className="ss-btn" style={{ padding: '10px 14px', fontSize: 12 }}>
                          {nameLoading ? <Spinner size={12} /> : 'Save'}
                        </button>
                        <button onClick={() => setEditingName(false)} className="ss-btn ss-btn-ghost" style={{ padding: '10px 14px', fontSize: 12 }}>✕</button>
                      </div>
                    ) : (
                      <div className="pf-field-value-row">
                        <span className="pf-field-value">{profile?.name}</span>
                        <button onClick={() => setEditingName(true)} className="pf-edit-link">Edit</button>
                      </div>
                    )}
                  </div>
                  <div className="pf-divider" />
                  <div className="pf-field-row">
                    <label className="field-label" style={{ marginBottom: 0 }}>Email</label>
                    <span className="pf-field-value" style={{ fontSize: 13 }}>{profile?.email}</span>
                  </div>
                  <div className="pf-divider" />
                  <div className="pf-field-row">
                    <label className="field-label" style={{ marginBottom: 0 }}>Role</label>
                    <span className="pf-field-value" style={{ fontSize: 13, textTransform: 'capitalize' }}>{profile?.role}</span>
                  </div>
                </div>

                {/* Change Password */}
                <div className="pf-card glass fade-up fade-up-3">
                  <div className="pf-card-header">
                    <h3 className="pf-card-title">Security</h3>
                    <button onClick={() => setShowPasswordForm(!showPasswordForm)} className="pf-toggle-btn" style={{ color: accentColor }}>
                      {showPasswordForm ? 'Cancel' : 'Change Password'}
                    </button>
                  </div>

                  {!showPasswordForm && (
                    <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
                      🔒 Your password is securely encrypted
                    </p>
                  )}

                  {showPasswordForm && (
                    <form onSubmit={handlePasswordChange} style={{ marginTop: 16 }}>
                      {passwordMessage === 'mismatch' && <div className="ss-error" style={{ marginBottom: 14 }}>Passwords do not match</div>}
                      {passwordMessage === 'short'    && <div className="ss-error" style={{ marginBottom: 14 }}>Min 6 characters</div>}

                      <div className="field-group">
                        <label className="field-label">Current Password</label>
                        <input type="password" className="ss-input" placeholder="••••••••"
                          value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                      </div>
                      <div className="field-group">
                        <label className="field-label">New Password</label>
                        <input type="password" className="ss-input" placeholder="Min. 6 characters"
                          value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                      </div>
                      <div className="field-group">
                        <label className="field-label">Confirm New Password</label>
                        <input type="password" className="ss-input" placeholder="Repeat new password"
                          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                          style={confirmPassword && newPassword !== confirmPassword ? { borderColor: 'rgba(244,63,94,0.5)' } : {}} />
                      </div>
                      <button type="submit" disabled={passwordLoading} className="ss-btn ss-btn-full" style={{ fontSize: 13 }}>
                        {passwordLoading ? <Spinner size={14} /> : null}
                        {passwordLoading ? 'Updating…' : 'Update Password →'}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Right column */}
              <div className="pf-col">
                {/* Notifications */}
                <div className="pf-card glass fade-up fade-up-2">
                  <div className="pf-card-header">
                    <h3 className="pf-card-title">Notification Preferences</h3>
                    {savingPrefs && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Saving…</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 16 }}>
                    {NOTIF_PREFS.map((pref, i) => (
                      <div key={pref.key}>
                        <div className="pf-notif-row">
                          <div>
                            <p className="pf-notif-label">{pref.label}</p>
                            <p className="pf-notif-sub">{pref.sub}</p>
                          </div>
                          <button
                            className={`pf-toggle ${notificationPrefs[pref.key] ? 'pf-toggle-on' : ''}`}
                            style={notificationPrefs[pref.key] ? { background: accentColor } : {}}
                            onClick={() => handleNotificationToggle(pref.key)}
                          >
                            <span className="pf-toggle-thumb" />
                          </button>
                        </div>
                        {i < NOTIF_PREFS.length - 1 && <div className="pf-divider" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="pf-card glass fade-up fade-up-3">
                  <h3 className="pf-card-title" style={{ marginBottom: 16 }}>Quick Actions</h3>
                  <div className="pf-actions-grid">
                    {isOwner ? (
                      <>
                        <Link to="/owner/add-property" className="pf-action-btn" style={{ textDecoration: 'none' }}>
                          <span className="pf-action-icon">➕</span>
                          <span>Add Property</span>
                        </Link>
                        <Link to="/accommodations" className="pf-action-btn" style={{ textDecoration: 'none' }}>
                          <span className="pf-action-icon">🗺️</span>
                          <span>Browse Map</span>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link to="/report" className="pf-action-btn" style={{ textDecoration: 'none' }}>
                          <span className="pf-action-icon">⚠️</span>
                          <span>Report Issue</span>
                        </Link>
                        <Link to="/my-reports" className="pf-action-btn" style={{ textDecoration: 'none' }}>
                          <span className="pf-action-icon">📋</span>
                          <span>My Reports</span>
                        </Link>
                        <Link to="/accommodations" className="pf-action-btn" style={{ textDecoration: 'none' }}>
                          <span className="pf-action-icon">🏠</span>
                          <span>Browse</span>
                        </Link>
                        <Link to="/dashboard" className="pf-action-btn" style={{ textDecoration: 'none' }}>
                          <span className="pf-action-icon">⚡</span>
                          <span>Dashboard</span>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Modal */}
        {showPhotoModal && (
          <div className="pf-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowPhotoModal(false); }}>
            <div className="pf-modal glass-hi fade-up">
              <div className="pf-modal-header">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)' }}>Profile Photo</h3>
                <button onClick={() => setShowPhotoModal(false)} className="pf-modal-close">✕</button>
              </div>

              <div className="pf-photo-preview">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="pf-photo-img" />
                ) : profile?.profilePhoto ? (
                  <img src={profile.profilePhoto} alt="Current" className="pf-photo-img" />
                ) : (
                  <div className="pf-photo-placeholder">
                    {profile?.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                <button onClick={() => fileInputRef.current?.click()} className="ss-btn ss-btn-ghost ss-btn-full" style={{ fontSize: 13 }}>
                  {photoPreview ? '↺ Choose Different Photo' : '📷 Choose Photo'}
                </button>

                {photoPreview && (
                  <button onClick={handlePhotoUpload} disabled={uploadingPhoto} className="ss-btn ss-btn-full" style={{ fontSize: 13 }}>
                    {uploadingPhoto ? <Spinner size={14} /> : null}
                    {uploadingPhoto ? 'Uploading…' : 'Save Photo →'}
                  </button>
                )}

                {profile?.profilePhoto && !photoPreview && (
                  <button onClick={handleRemovePhoto} className="ss-btn ss-btn-ghost ss-btn-full" style={{ fontSize: 13, color: '#fda4af', borderColor: 'rgba(244,63,94,0.3)' }}>
                    🗑 Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </SubtleOrb>
    </>
  );
}

const CSS = `
  .pf-page { min-height: 100vh; background: transparent; padding-top: 60px; }

  .pf-header { background: rgba(5,5,10,0.8); border-bottom: 1px solid var(--border); padding: 36px 0 0; margin-bottom: 40px; backdrop-filter: blur(12px); }
  .pf-header-inner { max-width: 1000px; margin: 0 auto; padding: 0 32px 32px; }
  .pf-back-link { font-size: 13px; color: var(--text-3); text-decoration: none; display: block; margin-bottom: 20px; transition: color 0.2s; }
  .pf-back-link:hover { color: var(--text-1); }

  .pf-hero-row { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }

  .pf-avatar-wrap { position: relative; }
  .pf-avatar {
    width: 88px; height: 88px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 2rem; font-weight: 700; color: white;
    overflow: hidden; border: 3px solid rgba(255,255,255,0.1);
    box-shadow: 0 0 40px rgba(99,102,241,0.25);
  }
  .pf-avatar-edit {
    position: absolute; bottom: 0; right: 0;
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--surface); border: 1px solid var(--border);
    font-size: 12px; cursor: none;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  .pf-avatar-edit:hover { background: var(--panel); border-color: var(--border-hi); }

  .pf-name-row { display: flex; align-items: flex-start; gap: 12px; flex-wrap: wrap; margin-bottom: 6px; }
  .pf-name { font-size: 1.6rem; font-weight: 700; letter-spacing: -0.04em; color: var(--text-1); }
  .pf-email { font-size: 13px; color: var(--text-2); margin-bottom: 4px; }
  .pf-since { font-size: 12px; color: var(--text-3); }

  .pf-stats {
    max-width: 1000px; margin: 0 auto; padding: 0 32px 0;
    display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    border-top: 1px solid var(--border); background: var(--border); gap: 1px;
  }
  .pf-stat { padding: 18px 24px; background: rgba(5,5,10,0.8); display: flex; flex-direction: column; gap: 3px; }
  .pf-stat-icon { font-size: 16px; margin-bottom: 4px; }
  .pf-stat-num { font-size: 1.4rem; font-weight: 700; letter-spacing: -0.04em; }
  .pf-stat-label { font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); }

  .pf-body { max-width: 1000px; margin: 0 auto; padding: 0 32px 60px; }

  .pf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media(max-width: 768px) { .pf-grid { grid-template-columns: 1fr; } }
  .pf-col { display: flex; flex-direction: column; gap: 16px; }

  .pf-card { padding: 24px; border-radius: var(--r-lg); }
  .pf-card-header { display: flex; justify-content: space-between; align-items: center; }
  .pf-card-title { font-size: 13px; font-weight: 700; color: var(--text-1); margin-bottom: 4px; }

  .pf-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 12px 0; }

  .pf-field-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; gap: 16px; flex-wrap: wrap; }
  .pf-field-value { font-size: 13px; color: var(--text-1); font-weight: 500; }
  .pf-field-value-row { display: flex; align-items: center; gap: 12px; }
  .pf-edit-link { font-size: 11px; font-weight: 600; color: var(--indigo); background: none; border: none; cursor: none; transition: color 0.2s; padding: 0; font-family: var(--font-body); }
  .pf-edit-link:hover { color: var(--violet); }
  .pf-edit-row { display: flex; gap: 8px; align-items: center; flex: 1; }
  .pf-edit-input { flex: 1; padding: 9px 12px !important; font-size: 13px !important; }

  .pf-toggle-btn { font-size: 12px; font-weight: 600; color: var(--indigo); background: none; border: none; cursor: none; font-family: var(--font-body); }

  .pf-notif-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; gap: 16px; }
  .pf-notif-label { font-size: 13px; font-weight: 600; color: var(--text-1); margin-bottom: 2px; }
  .pf-notif-sub   { font-size: 11px; color: var(--text-3); }

  .pf-toggle {
    width: 40px; height: 22px; border-radius: 11px; flex-shrink: 0;
    background: var(--border); border: none; cursor: none; position: relative;
    transition: background 0.3s; box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
  }
  .pf-toggle-thumb {
    position: absolute; top: 3px; left: 3px;
    width: 16px; height: 16px; border-radius: 50%;
    background: white; transition: transform 0.3s cubic-bezier(.22,.68,0,1.2);
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  }
  .pf-toggle-on .pf-toggle-thumb { transform: translateX(18px); }

  .pf-actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .pf-action-btn {
    display: flex; align-items: center; gap: 10px;
    padding: 13px 14px; border-radius: var(--r-sm);
    background: var(--panel); border: 1px solid var(--border);
    font-size: 13px; font-weight: 500; color: var(--text-2);
    transition: all 0.2s; cursor: none;
  }
  .pf-action-btn:hover { border-color: var(--border-hi); color: var(--text-1); transform: translateY(-1px); }
  .pf-action-icon { font-size: 16px; }

  .field-group { margin-bottom: 14px; }

  /* Modal */
  .pf-modal-overlay { position: fixed; inset: 0; z-index: 9000; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 24px; }
  .pf-modal { width: 100%; max-width: 400px; padding: 28px; border-radius: var(--r-xl); }
  .pf-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .pf-modal-close { width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--border); background: transparent; cursor: none; color: var(--text-3); font-size: 13px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .pf-modal-close:hover { border-color: rgba(244,63,94,0.4); color: #fda4af; }
  .pf-photo-preview { display: flex; justify-content: center; }
  .pf-photo-img { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(255,255,255,0.1); }
  .pf-photo-placeholder { width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, var(--indigo), var(--violet)); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: 700; color: white; }
`;
