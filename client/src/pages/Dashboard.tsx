import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SubtleOrb, PageLoader, SkeletonList, SkeletonCard, useToast } from './DesignSystem';
import UpvoteButton from '../components/UpvoteButton';

interface Accommodation { _id: string; name: string; location: string; trustScore: number; type?: string; }
interface Report { _id: string; accommodationName: string; issueType: string; description: string; createdAt: string; upvotes: number; upvotedBy: string[]; user: string | { _id: string }; }

const classify = (score: number) =>
  score >= 80 ? { label: 'Safe',    color: 'var(--emerald)', bg: 'rgba(16,185,129,0.1)'  } :
  score >= 50 ? { label: 'Caution', color: 'var(--amber)',   bg: 'rgba(245,158,11,0.1)'  } :
               { label: 'Unsafe',   color: 'var(--rose)',    bg: 'rgba(244,63,94,0.1)'   };

export const Dashboard: React.FC = () => {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const { user } = useAuth();
  const toast = useToast();
  const [reports, setReports]             = useState<Report[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading]             = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [activeTab, setActiveTab]         = useState<'reports' | 'accommodations'>('reports');

  useEffect(() => {
    try {
      const t = localStorage.getItem('token');
      if (t) { const p = JSON.parse(atob(t.split('.')[1])); setCurrentUserId(p.user?.id || p.id || ''); }
    } catch {}
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rr, ar] = await Promise.all([fetch(`${API}/api/reports`), fetch(`${API}/api/accommodations`)]);
      const rd = await rr.json(); const ad = await ar.json();
      if (rd.success) setReports(rd.data || []);
      if (ad.success) setAccommodations(ad.data || []);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally { setLoading(false); }
  };

  const handleUpvote = async (reportId: string) => {
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Please login to upvote'); return; }
    try {
      const res = await fetch(`${API}/api/reports/${reportId}/upvote`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setReports(rs => rs.map(r => r._id === reportId ? { ...r, upvotes: data.upvotes, upvotedBy: data.upvotedBy } : r));
        toast.success('Upvoted successfully');
      }
    } catch { toast.error('Failed to upvote'); }
  };

  const recentReports = [...reports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
  const topAccomm     = [...accommodations].sort((a, b) => b.trustScore - a.trustScore).slice(0, 8);

  return (
    <>
      <style>{CSS}</style>
      <SubtleOrb>
        <div className="dash-page">
          {/* Header */}
          <header className="dash-header fade-up">
            <div className="dash-header-inner">
              <div>
                <p className="dash-eyebrow">Student Dashboard</p>
                <h1 className="dash-title">
                  {user?.name ? `Hello, ${user.name.split(' ')[0]} 👋` : 'Dashboard'}
                </h1>
                <p className="dash-sub">Real-time safety reports from your city.</p>
              </div>
              <div className="dash-header-actions">
                <Link to="/report" className="ss-btn ss-btn-rose" style={{ textDecoration: 'none', fontSize: 13 }}>+ Report Issue</Link>
                <Link to="/accommodations" className="ss-btn ss-btn-ghost" style={{ textDecoration: 'none', fontSize: 13 }}>Browse →</Link>
              </div>
            </div>

            {/* Stats */}
            <div className="dash-stats">
              {[
                { label: 'Total Reports',     value: reports.length,                                              icon: '📄', color: 'var(--indigo)'  },
                { label: 'Listed Properties', value: accommodations.length,                                       icon: '🏠', color: 'var(--emerald)' },
                { label: 'Safe Properties',   value: accommodations.filter(a => a.trustScore >= 80).length,       icon: '✅', color: 'var(--emerald)' },
                { label: 'Needs Review',      value: accommodations.filter(a => a.trustScore < 50).length,        icon: '⚠️', color: 'var(--rose)'    },
              ].map((s, i) => (
                <div key={i} className="dash-stat fade-up" style={{ animationDelay: `${0.05 + i * 0.06}s` }}>
                  <div className="dash-stat-icon">{s.icon}</div>
                  <div className="dash-stat-num" style={{ color: s.color }}>{s.value}</div>
                  <div className="dash-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </header>

          <div className="dash-body">
            {/* Tabs */}
            <div className="dash-tabs fade-up fade-up-3">
              <button onClick={() => setActiveTab('reports')} className={`dash-tab ${activeTab === 'reports' ? 'dash-tab-active' : ''}`}>
                📄 Recent Reports
              </button>
              <button onClick={() => setActiveTab('accommodations')} className={`dash-tab ${activeTab === 'accommodations' ? 'dash-tab-active' : ''}`}>
                🏠 Top Accommodations
              </button>
            </div>

            {/* Reports tab */}
            {activeTab === 'reports' && (
              <div className="dash-reports-list fade-up fade-up-4">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => <SkeletonList key={i} />)
                ) : recentReports.length === 0 ? (
                  <div className="dash-empty glass">
                    <span style={{ fontSize: 32, opacity: 0.3 }}>📄</span>
                    <p>No reports yet. Be the first to report an issue!</p>
                    <Link to="/report" className="ss-btn" style={{ textDecoration: 'none', marginTop: 12 }}>Report an Issue</Link>
                  </div>
                ) : recentReports.map((r, i) => {
                  const userId = typeof r.user === 'object' ? r.user?._id : r.user;
                  const isOwn  = userId === currentUserId;
                  return (
                    <div key={r._id} className="report-card glass fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                      <div className="report-card-header">
                        <div>
                          <span className="report-tag">{r.issueType}</span>
                          <h3 className="report-place">{r.accommodationName}</h3>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {isOwn && <span className="pill pill-indigo">My Report</span>}
                          <UpvoteButton reportId={r._id} upvotes={r.upvotes} upvotedBy={r.upvotedBy} onUpvote={() => handleUpvote(r._id)} />
                        </div>
                      </div>
                      <p className="report-desc">{r.description}</p>
                      <div className="report-meta">
                        <span className="report-date">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Accommodations tab */}
            {activeTab === 'accommodations' && (
              <div className="dash-accomm-grid fade-up fade-up-4">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                ) : topAccomm.map((a, i) => {
                  const cls = classify(a.trustScore);
                  return (
                    <Link key={a._id} to={`/accommodations/${a._id}`} className="accomm-card glass" style={{ textDecoration: 'none', animationDelay: `${i * 0.04}s` }}>
                      <div className="accomm-card-top">
                        <div className="accomm-icon">🏠</div>
                        <span className="accomm-score" style={{ color: cls.color, background: cls.bg }}>
                          {a.trustScore}% {cls.label}
                        </span>
                      </div>
                      <h3 className="accomm-name">{a.name}</h3>
                      <p className="accomm-loc">{a.location}</p>
                      {a.type && <span className="pill" style={{ marginTop: 12 }}>{a.type}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SubtleOrb>
    </>
  );
};

const CSS = `
  .dash-page { min-height: 100vh; background: transparent; padding-top: 60px; }

  .dash-header {
    background: rgba(5,5,10,0.75); border-bottom: 1px solid var(--border);
    padding: 40px 0 0; margin-bottom: 40px;
    backdrop-filter: blur(12px);
  }
  .dash-header-inner {
    max-width: 1100px; margin: 0 auto; padding: 0 32px;
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 32px; flex-wrap: wrap; gap: 16px;
  }
  .dash-eyebrow { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: var(--indigo); margin-bottom: 8px; }
  .dash-title { font-size: 2rem; font-weight: 700; letter-spacing: -0.04em; color: var(--text-1); margin-bottom: 4px; }
  .dash-sub { font-size: 13px; color: var(--text-2); }
  .dash-header-actions { display: flex; gap: 10px; align-items: center; padding-top: 12px; }

  .dash-stats {
    max-width: 1100px; margin: 0 auto; padding: 0 32px 32px;
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 1px; background: var(--border); border-top: 1px solid var(--border);
  }
  @media(max-width: 700px) { .dash-stats { grid-template-columns: repeat(2, 1fr); } }

  .dash-stat {
    padding: 20px 24px; background: rgba(5,5,10,0.8);
    display: flex; flex-direction: column; gap: 4px;
    transition: background 0.2s;
  }
  .dash-stat:hover { background: rgba(12,12,22,0.9); }
  .dash-stat-icon { font-size: 18px; margin-bottom: 6px; }
  .dash-stat-num { font-size: 1.8rem; font-weight: 700; letter-spacing: -0.04em; }
  .dash-stat-label { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); }

  .dash-body { max-width: 1100px; margin: 0 auto; padding: 0 32px 60px; }

  .dash-tabs {
    display: flex; gap: 4px; background: var(--panel);
    border: 1px solid var(--border); border-radius: var(--r-md);
    padding: 4px; width: fit-content; margin-bottom: 24px;
  }
  .dash-tab {
    padding: 9px 20px; border: none; background: transparent; cursor: none;
    font-family: var(--font-body); font-size: 13px; font-weight: 600;
    border-radius: 10px; color: var(--text-3); transition: all 0.2s;
  }
  .dash-tab:hover { color: var(--text-1); }
  .dash-tab-active { background: rgba(99,102,241,0.15); color: #a5b4fc; }

  .dash-reports-list { display: flex; flex-direction: column; gap: 12px; }

  .report-card { padding: 20px 24px; }
  .report-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 12px; flex-wrap: wrap; }
  .report-tag { display: inline-block; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--indigo); margin-bottom: 4px; }
  .report-place { font-size: 15px; font-weight: 700; letter-spacing: -0.02em; color: var(--text-1); }
  .report-desc { font-size: 13px; color: var(--text-2); line-height: 1.6; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .report-meta { display: flex; align-items: center; gap: 12px; }
  .report-date { font-size: 11px; color: var(--text-3); }

  .dash-empty {
    padding: 64px; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
  }
  .dash-empty p { font-size: 13px; color: var(--text-3); }

  .dash-accomm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }

  .accomm-card { padding: 22px; cursor: none; transition: border-color 0.25s, transform 0.2s; }
  .accomm-card:hover { border-color: rgba(99,102,241,0.3); transform: translateY(-3px); }
  .accomm-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
  .accomm-icon {
    width: 40px; height: 40px; border-radius: 12px;
    background: var(--panel); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center; font-size: 18px;
  }
  .accomm-score { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 100px; }
  .accomm-name { font-size: 14px; font-weight: 700; letter-spacing: -0.02em; color: var(--text-1); margin-bottom: 4px; }
  .accomm-loc { font-size: 12px; color: var(--text-2); }
`;
