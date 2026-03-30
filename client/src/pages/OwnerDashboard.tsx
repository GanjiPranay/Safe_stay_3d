import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SubtleOrb, PageLoader, Spinner, SkeletonCard, useToast } from './DesignSystem';

interface Property { _id: string; name: string; address: string; city: string; safetyScore: number; totalReports: number; trustScore?: number; }
interface Feedback  { _id: string; category: string; description: string; status: string; createdAt: string; images?: string[]; accommodationId: { _id: string; name: string }; }

export default function OwnerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [properties, setProperties]   = useState<Property[]>([]);
  const [feedbacks, setFeedbacks]      = useState<Feedback[]>([]);
  const [loading, setLoading]          = useState(true);
  const toast    = useToast();

  const [showModal, setShowModal]         = useState(false);
  const [selFeedback, setSelFeedback]     = useState<Feedback | null>(null);
  const [responseText, setResponseText]   = useState('');
  const [responseImages, setResponseImages] = useState<File[]>([]);
  const [previews, setPreviews]           = useState<string[]>([]);
  const [submitting, setSubmitting]       = useState(false);
  const [resSuccess, setResSuccess]       = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab]         = useState<'properties' | 'feedbacks'>('feedbacks');

  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/owner/login'); return; }
    if (user.role !== 'owner') { navigate(user.role === 'admin' ? '/admin' : '/dashboard'); return; }
    fetchAll();
  }, [user, authLoading]);

  const fetchAll = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/owner/login'); return; }
    setLoading(true);
    try {
      const [pr, fr] = await Promise.all([
        fetch(`${API}/api/owner/properties`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/owner/feedbacks`,  { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const pd = await pr.json(); const fd = await fr.json();
      if (pd.success) setProperties(pd.data || []);
      if (fd.success) setFeedbacks(fd.data || []);
    } catch { toast.error('Failed to load dashboard data'); } finally { setLoading(false); }
  };

  const openModal = (fb: Feedback) => {
    setSelFeedback(fb); setResponseText(''); setResponseImages([]); setPreviews([]); setResSuccess(false); setShowModal(true);
  };

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setResponseImages(prev => [...prev, ...files].slice(0, 5));
    files.forEach(f => { const r = new FileReader(); r.onload = ev => setPreviews(p => [...p, ev.target!.result as string]); r.readAsDataURL(f); });
  };

  const submitResponse = async () => {
    if (!selFeedback || !responseText.trim()) return;
    setSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      const fd = new FormData();
      fd.append('responseText', responseText); fd.append('actionTaken', 'Owner responded');
      responseImages.forEach(img => fd.append('images', img));
      const res = await fetch(`${API}/api/owner/feedbacks/${selFeedback._id}/respond`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      if (res.ok) {
        setResSuccess(true);
        setFeedbacks(fbs => fbs.map(f => f._id === selFeedback._id ? { ...f, status: 'resolved' } : f));
        toast.success('Response submitted successfully!');
        setTimeout(() => setShowModal(false), 1800);
      } else {
        toast.error('Failed to submit response');
      }
    } catch { toast.error('Connection error'); } finally { setSubmitting(false); }
  };

  if (authLoading || loading) return <PageLoader />;

  const pendingCount  = feedbacks.filter(f => f.status === 'pending' || f.status === 'approved').length;
  const resolvedCount = feedbacks.filter(f => f.status === 'resolved').length;
  const avgScore      = properties.length ? Math.round(properties.reduce((a, p) => a + (p.trustScore ?? p.safetyScore ?? 0), 0) / properties.length) : 0;

  const statusColor = (s: string) =>
    s === 'resolved' ? { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' } :
    s === 'pending'  ? { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' } :
                       { color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.3)'  };

  return (
    <>
      <style>{CSS}</style>
      <SubtleOrb>
        <div className="od-page">
          <header className="od-header fade-up">
            <div className="od-header-inner">
              <div>
                <p className="od-eyebrow">Owner Dashboard</p>
                <h1 className="od-title">Hello, {user?.name?.split(' ')[0] || 'Owner'} 👋</h1>
                <p className="od-sub">Manage your properties and build tenant trust.</p>
              </div>
              <div className="od-header-actions">
                <Link to="/owner/add-property" className="ss-btn ss-btn-emerald" style={{ textDecoration: 'none', fontSize: 13 }}>+ Add Property</Link>
                <Link to="/accommodations" className="ss-btn ss-btn-ghost" style={{ textDecoration: 'none', fontSize: 13 }}>Browse →</Link>
              </div>
            </div>

            {/* Stats */}
            <div className="od-stats">
              {[
                { label: 'Properties',      value: properties.length, icon: '🏠', color: 'var(--emerald)' },
                { label: 'Avg Trust Score', value: `${avgScore}%`,    icon: '⭐', color: 'var(--indigo)'  },
                { label: 'Pending Reports', value: pendingCount,      icon: '⚠️', color: 'var(--amber)'   },
                { label: 'Resolved',        value: resolvedCount,     icon: '✅', color: 'var(--emerald)' },
              ].map((s, i) => (
                <div key={i} className="od-stat fade-up" style={{ animationDelay: `${0.05 + i * 0.06}s` }}>
                  <div className="od-stat-icon">{s.icon}</div>
                  <div className="od-stat-num" style={{ color: s.color }}>{s.value}</div>
                  <div className="od-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </header>

          <div className="od-body">
            <div className="od-tabs fade-up fade-up-3">
              <button onClick={() => setActiveTab('feedbacks')} className={`od-tab ${activeTab === 'feedbacks' ? 'od-tab-active' : ''}`}>
                ⚠️ Reports {pendingCount > 0 && <span className="od-badge">{pendingCount}</span>}
              </button>
              <button onClick={() => setActiveTab('properties')} className={`od-tab ${activeTab === 'properties' ? 'od-tab-active' : ''}`}>
                🏠 My Properties
              </button>
            </div>

            {activeTab === 'feedbacks' && (
              <div className="od-feedbacks fade-up fade-up-4">
                {feedbacks.length === 0 ? (
                  <div className="od-empty glass">
                    <span style={{ fontSize: 28, opacity: 0.3 }}>✅</span>
                    <p>No reports on your properties. Keep up the great work!</p>
                  </div>
                ) : feedbacks.map((f, i) => {
                  const sc = statusColor(f.status);
                  return (
                    <div key={f._id} className="feedback-card glass fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                      <div className="feedback-header">
                        <div>
                          <span className="feedback-property">{f.accommodationId?.name || '—'}</span>
                          <span className="feedback-category">{f.category}</span>
                        </div>
                        <span className="feedback-status" style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}>
                          {f.status}
                        </span>
                      </div>
                      <p className="feedback-desc">{f.description}</p>
                      <div className="feedback-footer">
                        <span className="feedback-date">{new Date(f.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {(f.status === 'pending' || f.status === 'approved') && (
                          <button className="ss-btn ss-btn-emerald" style={{ padding: '8px 16px', fontSize: 12 }}
                            onClick={() => openModal(f)}>
                            Respond
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'properties' && (
              <div className="od-props-grid fade-up fade-up-4">
                {properties.length === 0 ? (
                  <div className="od-empty glass" style={{ gridColumn: '1 / -1' }}>
                    <span style={{ fontSize: 28, opacity: 0.3 }}>🏠</span>
                    <p>No properties yet.</p>
                    <Link to="/owner/add-property" className="ss-btn ss-btn-emerald" style={{ textDecoration: 'none', marginTop: 12 }}>Add Your First Property →</Link>
                  </div>
                ) : properties.map((p, i) => {
                  const score = p.trustScore ?? p.safetyScore ?? 0;
                  const color = score >= 80 ? 'var(--emerald)' : score >= 50 ? 'var(--amber)' : 'var(--rose)';
                  return (
                    <Link key={p._id} to={`/accommodations/${p._id}`} className="od-prop-card glass" style={{ textDecoration: 'none', animationDelay: `${i * 0.05}s` }}>
                      <div className="od-prop-top">
                        <div className="od-prop-icon">🏠</div>
                        <span className="od-prop-score" style={{ color }}>{score}%</span>
                      </div>
                      <h3 className="od-prop-name">{p.name}</h3>
                      <p className="od-prop-addr">{p.address}, {p.city}</p>
                      <div className="od-prop-reports">
                        <span>⚠️ {p.totalReports || 0} reports</span>
                        <span style={{ color: 'var(--indigo)' }}>View →</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Response Modal */}
        {showModal && selFeedback && (
          <div className="od-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <div className="od-modal glass-hi fade-up">
              {resSuccess ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div className="od-success-icon">✓</div>
                  <h3 style={{ color: 'var(--text-1)', marginBottom: 8 }}>Response Submitted!</h3>
                  <p style={{ color: 'var(--text-2)', fontSize: 13 }}>Report marked as resolved.</p>
                </div>
              ) : (
                <>
                  <div className="od-modal-header">
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--emerald)', marginBottom: 6 }}>Respond to Report</p>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-1)' }}>{selFeedback.accommodationId?.name}</h3>
                    </div>
                    <button onClick={() => setShowModal(false)} className="od-modal-close">✕</button>
                  </div>

                  <div className="od-modal-report">
                    <span className="od-modal-cat">{selFeedback.category}</span>
                    <p>{selFeedback.description}</p>
                  </div>

                  <div className="field-group" style={{ marginBottom: 16 }}>
                    <label className="field-label">Your Response</label>
                    <textarea className="ss-input" style={{ resize: 'none', minHeight: 110 }}
                      placeholder="Describe what action you've taken to resolve this issue…"
                      value={responseText} onChange={e => setResponseText(e.target.value)} />
                  </div>

                  {previews.length > 0 && (
                    <div className="od-previews">
                      {previews.map((p, i) => <img key={i} src={p} alt="" className="od-preview-img" />)}
                    </div>
                  )}

                  <input type="file" ref={fileRef} multiple accept="image/*" style={{ display: 'none' }} onChange={handleImages} />

                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <button onClick={() => fileRef.current?.click()} className="ss-btn ss-btn-ghost" style={{ fontSize: 12, flex: 1 }}>
                      📎 Attach Photos
                    </button>
                    <button onClick={submitResponse} disabled={submitting || !responseText.trim()} className="ss-btn ss-btn-emerald" style={{ fontSize: 13, flex: 2 }}>
                      {submitting ? <Spinner size={14} /> : null}
                      {submitting ? 'Submitting…' : 'Submit Response →'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </SubtleOrb>
    </>
  );
}

const CSS = `
  .od-page { min-height: 100vh; background: transparent; padding-top: 60px; }

  .od-header { background: rgba(5,5,10,0.75); border-bottom: 1px solid var(--border); padding: 40px 0 0; margin-bottom: 40px; backdrop-filter: blur(12px); }
  .od-header-inner { max-width: 1100px; margin: 0 auto; padding: 0 32px; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
  .od-eyebrow { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: var(--emerald); margin-bottom: 8px; }
  .od-title { font-size: 2rem; font-weight: 700; letter-spacing: -0.04em; color: var(--text-1); margin-bottom: 4px; }
  .od-sub { font-size: 13px; color: var(--text-2); }
  .od-header-actions { display: flex; gap: 10px; align-items: center; padding-top: 12px; }

  .od-stats { max-width: 1100px; margin: 0 auto; padding: 0 32px 32px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); border-top: 1px solid var(--border); }
  @media(max-width: 700px) { .od-stats { grid-template-columns: repeat(2, 1fr); } }
  .od-stat { padding: 20px 24px; background: rgba(5,5,10,0.8); display: flex; flex-direction: column; gap: 4px; }
  .od-stat-icon { font-size: 18px; margin-bottom: 6px; }
  .od-stat-num { font-size: 1.8rem; font-weight: 700; letter-spacing: -0.04em; }
  .od-stat-label { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); }

  .od-body { max-width: 1100px; margin: 0 auto; padding: 0 32px 60px; }

  .od-tabs { display: flex; gap: 4px; background: var(--panel); border: 1px solid var(--border); border-radius: var(--r-md); padding: 4px; width: fit-content; margin-bottom: 24px; }
  .od-tab { padding: 9px 20px; border: none; background: transparent; cursor: none; font-family: var(--font-body); font-size: 13px; font-weight: 600; border-radius: 10px; color: var(--text-3); transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
  .od-tab:hover { color: var(--text-1); }
  .od-tab-active { background: rgba(16,185,129,0.12); color: #6ee7b7; }
  .od-badge { background: var(--amber); color: #000; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 100px; }

  .od-feedbacks { display: flex; flex-direction: column; gap: 12px; }
  .feedback-card { padding: 20px 24px; }
  .feedback-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 12px; flex-wrap: wrap; }
  .feedback-property { display: block; font-size: 14px; font-weight: 700; color: var(--text-1); margin-bottom: 3px; }
  .feedback-category { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--indigo); }
  .feedback-status { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 100px; border: 1px solid; white-space: nowrap; }
  .feedback-desc { font-size: 13px; color: var(--text-2); line-height: 1.6; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .feedback-footer { display: flex; justify-content: space-between; align-items: center; }
  .feedback-date { font-size: 11px; color: var(--text-3); }

  .od-empty { padding: 64px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .od-empty p { font-size: 13px; color: var(--text-3); }

  .od-props-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
  .od-prop-card { padding: 22px; cursor: none; transition: border-color 0.25s, transform 0.2s; display: flex; flex-direction: column; }
  .od-prop-card:hover { border-color: rgba(16,185,129,0.3); transform: translateY(-3px); }
  .od-prop-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
  .od-prop-icon { width: 40px; height: 40px; border-radius: 12px; background: var(--panel); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .od-prop-score { font-size: 1.2rem; font-weight: 700; letter-spacing: -0.04em; }
  .od-prop-name { font-size: 14px; font-weight: 700; letter-spacing: -0.02em; color: var(--text-1); margin-bottom: 4px; }
  .od-prop-addr { font-size: 12px; color: var(--text-2); margin-bottom: 14px; }
  .od-prop-reports { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-3); margin-top: auto; }

  /* Modal */
  .od-modal-overlay {
    position: fixed; inset: 0; z-index: 9000;
    background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center; padding: 24px;
  }
  .od-modal { width: 100%; max-width: 500px; padding: 32px; border-radius: var(--r-xl); }
  .od-modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .od-modal-close {
    width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--border);
    background: transparent; cursor: none; color: var(--text-3);
    font-size: 14px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;
  }
  .od-modal-close:hover { border-color: rgba(244,63,94,0.4); color: #fda4af; }
  .od-modal-report {
    padding: 14px 16px; border-radius: var(--r-sm);
    background: rgba(255,255,255,0.03); border: 1px solid var(--border);
    margin-bottom: 20px;
  }
  .od-modal-cat { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--amber); display: block; margin-bottom: 6px; }
  .od-modal-report p { font-size: 13px; color: var(--text-2); line-height: 1.6; }
  .field-group { margin-bottom: 18px; }
  .od-previews { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
  .od-preview-img { width: 72px; height: 72px; object-fit: cover; border-radius: var(--r-sm); border: 1px solid var(--border); }
  .od-success-icon {
    width: 72px; height: 72px; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 28px; margin: 0 auto 20px; color: var(--emerald);
  }
`;
