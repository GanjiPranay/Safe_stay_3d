import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SubtleOrb, PageLoader, SkeletonCard, useToast } from './DesignSystem';

interface Stats { totalUsers: number; totalAccommodations: number; totalReports: number; pendingReports: number; }
interface Report { _id: string; category: string; description: string; status: string; createdAt: string; userId: { name: string }; accommodationId: { name: string }; }

export default function AdminDashboard() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [search,  setSearch]  = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const navigate = useNavigate();
  const toast    = useToast();
  const API      = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role  = localStorage.getItem('userRole');
    if (!token || role !== 'admin') { navigate('/login'); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const token = localStorage.getItem('token');
    try {
      const [sr, rr] = await Promise.all([
        fetch(`${API}/api/admin/stats`,   { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/admin/reports`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const sd = await sr.json(); const rd = await rr.json();
      if (sd.success) setStats(sd.data);
      if (rd.success) setReports(rd.data);
    } catch { toast.error('Failed to load admin data'); } finally { setLoading(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    const token = localStorage.getItem('token');
    setUpdating(id);
    try {
      const res = await fetch(`${API}/api/admin/reports/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setReports(r => r.map(x => x._id === id ? { ...x, status } : x));
        toast.success(`Report marked as ${status}`);
      } else {
        toast.error('Failed to update status');
      }
    } catch { toast.error('Connection error'); } finally { setUpdating(null); }
  };

  if (loading) return <PageLoader />;

  const filtered = reports.filter(r => {
    const mf = filter === 'all' || r.status === filter;
    const ms = r.accommodationId?.name?.toLowerCase().includes(search.toLowerCase()) ||
               r.description?.toLowerCase().includes(search.toLowerCase());
    return mf && ms;
  });

  const statusCounts = {
    pending:  reports.filter(r => r.status === 'pending').length,
    approved: reports.filter(r => r.status === 'approved').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    rejected: reports.filter(r => r.status === 'rejected').length,
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    pending:  { label: 'Pending',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)'  },
    approved: { label: 'Approved', color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.3)'  },
    resolved: { label: 'Resolved', color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)'  },
    rejected: { label: 'Rejected', color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',   border: 'rgba(244,63,94,0.3)'   },
  };

  return (
    <>
      <style>{CSS}</style>
      <SubtleOrb>
        <div className="adm-page">
          {/* Header */}
          <header className="adm-header fade-up">
            <div className="adm-header-inner">
              <div>
                <p className="adm-eyebrow">Admin Console</p>
                <h1 className="adm-title">Platform Overview</h1>
                <p className="adm-sub">Manage reports, users, and accommodation listings.</p>
              </div>
              <div className="adm-header-badge">
                <span className="adm-badge-dot" />
                Live Dashboard
              </div>
            </div>
          </header>

          <div className="adm-body">
            {/* Stat cards */}
            <div className="adm-stats fade-up fade-up-2">
              {[
                { label: 'Total Users',        value: stats?.totalUsers || 0,          icon: '👥', color: 'var(--indigo)'  },
                { label: 'Accommodations',      value: stats?.totalAccommodations || 0, icon: '🏠', color: 'var(--violet)'  },
                { label: 'Total Reports',       value: stats?.totalReports || 0,        icon: '📋', color: 'var(--amber)'   },
                { label: 'Pending Review',      value: stats?.pendingReports || 0,      icon: '⏳', color: 'var(--rose)'    },
              ].map((s, i) => (
                <div key={i} className="adm-stat-card glass">
                  <div className="adm-stat-icon">{s.icon}</div>
                  <div className="adm-stat-num" style={{ color: s.color }}>{s.value}</div>
                  <div className="adm-stat-label">{s.label}</div>
                  <div className="adm-stat-bar" style={{ background: `linear-gradient(90deg, ${s.color}40 0%, transparent 100%)` }} />
                </div>
              ))}
            </div>

            {/* Status breakdown */}
            <div className="adm-breakdown glass fade-up fade-up-3">
              <h3 className="adm-section-title">Report Status Breakdown</h3>
              <div className="adm-breakdown-grid">
                {Object.entries(statusCounts).map(([key, count]) => {
                  const cfg = statusConfig[key];
                  const total = reports.length || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={key} className="adm-breakdown-item">
                      <div className="adm-breakdown-header">
                        <span className="adm-status-dot" style={{ background: cfg.color }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{cfg.label}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: cfg.color }}>{count}</span>
                      </div>
                      <div className="adm-bar-track">
                        <div className="adm-bar-fill" style={{ width: `${pct}%`, background: cfg.color }} />
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Filters toolbar */}
            <div className="adm-toolbar glass fade-up fade-up-3">
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: 13 }}>🔍</span>
                <input type="text" className="ss-input" style={{ paddingLeft: 40 }} placeholder="Search by property or description…"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>

              <div className="adm-filter-group">
                {['all', 'pending', 'approved', 'resolved', 'rejected'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`adm-filter-btn ${filter === f ? 'adm-filter-active' : ''}`}
                    style={filter === f && f !== 'all' ? {
                      background: statusConfig[f]?.bg || 'rgba(99,102,241,0.15)',
                      borderColor: statusConfig[f]?.border || 'rgba(99,102,241,0.4)',
                      color: statusConfig[f]?.color || '#a5b4fc',
                    } : {}}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    {f !== 'all' && <span className="adm-filter-count">{statusCounts[f as keyof typeof statusCounts] ?? 0}</span>}
                  </button>
                ))}
              </div>

              <span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                {filtered.length} report{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Reports table */}
            <div className="adm-table-wrap glass fade-up fade-up-4">
              {filtered.length === 0 ? (
                <div className="adm-empty">
                  <span style={{ fontSize: 28, opacity: 0.3 }}>📋</span>
                  <p>No reports match your filter</p>
                </div>
              ) : (
                <table className="ss-table">
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Reporter</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => {
                      const cfg = statusConfig[r.status] || statusConfig.pending;
                      return (
                        <tr key={r._id}>
                          <td style={{ fontWeight: 600, color: 'var(--text-1)', maxWidth: 160 }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.accommodationId?.name || '—'}
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{r.userId?.name || 'Anonymous'}</td>
                          <td style={{ maxWidth: 220 }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-2)' }}>
                              {r.description}
                            </div>
                          </td>
                          <td>
                            <span className="adm-status-badge" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
                              {cfg.label}
                            </span>
                          </td>
                          <td style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                            {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </td>
                          <td>
                            <div className="adm-action-btns">
                              {r.status !== 'approved' && (
                                <button className="adm-action-btn adm-action-approve"
                                  disabled={updating === r._id}
                                  onClick={() => updateStatus(r._id, 'approved')}>
                                  Approve
                                </button>
                              )}
                              {r.status !== 'resolved' && (
                                <button className="adm-action-btn adm-action-resolve"
                                  disabled={updating === r._id}
                                  onClick={() => updateStatus(r._id, 'resolved')}>
                                  Resolve
                                </button>
                              )}
                              {r.status !== 'rejected' && (
                                <button className="adm-action-btn adm-action-reject"
                                  disabled={updating === r._id}
                                  onClick={() => updateStatus(r._id, 'rejected')}>
                                  Reject
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </SubtleOrb>
    </>
  );
}

const CSS = `
  .adm-page { min-height: 100vh; background: transparent; padding-top: 60px; }

  .adm-header {
    background: rgba(5,5,10,0.75); border-bottom: 1px solid var(--border);
    padding: 40px 0 32px; margin-bottom: 40px; backdrop-filter: blur(12px);
  }
  .adm-header-inner {
    max-width: 1100px; margin: 0 auto; padding: 0 32px;
    display: flex; justify-content: space-between; align-items: flex-start;
    flex-wrap: wrap; gap: 16px;
  }
  .adm-eyebrow { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: var(--amber); margin-bottom: 8px; }
  .adm-title { font-size: 2rem; font-weight: 700; letter-spacing: -0.04em; color: var(--text-1); margin-bottom: 4px; }
  .adm-sub { font-size: 13px; color: var(--text-2); }

  .adm-header-badge {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 16px; border-radius: 100px;
    border: 1px solid rgba(245,158,11,0.3); background: rgba(245,158,11,0.08);
    font-size: 12px; font-weight: 600; color: var(--amber);
  }
  .adm-badge-dot {
    width: 7px; height: 7px; border-radius: 50%; background: var(--amber);
    animation: pulsate 2s ease-in-out infinite;
  }

  .adm-body { max-width: 1100px; margin: 0 auto; padding: 0 32px 60px; }

  .adm-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
  @media(max-width: 800px) { .adm-stats { grid-template-columns: repeat(2, 1fr); } }

  .adm-stat-card {
    padding: 22px; position: relative; overflow: hidden;
    transition: border-color 0.25s, transform 0.2s;
  }
  .adm-stat-card:hover { border-color: rgba(99,102,241,0.25); transform: translateY(-2px); }
  .adm-stat-icon { font-size: 20px; margin-bottom: 10px; }
  .adm-stat-num { font-size: 2rem; font-weight: 700; letter-spacing: -0.04em; margin-bottom: 4px; }
  .adm-stat-label { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); }
  .adm-stat-bar {
    position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
  }

  .adm-breakdown {
    padding: 24px; margin-bottom: 20px; border-radius: var(--r-lg);
  }
  .adm-section-title { font-size: 13px; font-weight: 600; color: var(--text-1); margin-bottom: 20px; }
  .adm-breakdown-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
  @media(max-width: 700px) { .adm-breakdown-grid { grid-template-columns: repeat(2, 1fr); } }

  .adm-breakdown-item { display: flex; flex-direction: column; gap: 6px; }
  .adm-breakdown-header { display: flex; align-items: center; gap: 8px; }
  .adm-status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .adm-bar-track { height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden; }
  .adm-bar-fill { height: 100%; border-radius: 2px; transition: width 1s cubic-bezier(.22,.68,0,1.2); }

  .adm-toolbar {
    padding: 16px 20px; margin-bottom: 16px; border-radius: var(--r-lg);
    display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  }
  .adm-filter-group { display: flex; gap: 4px; }
  .adm-filter-btn {
    padding: 7px 14px; border: 1px solid var(--border);
    background: transparent; border-radius: var(--r-sm); cursor: none;
    font-family: var(--font-body); font-size: 12px; font-weight: 600;
    color: var(--text-3); transition: all 0.2s;
    display: flex; align-items: center; gap: 6px;
  }
  .adm-filter-btn:hover { color: var(--text-1); border-color: var(--border-hi); }
  .adm-filter-active { color: #a5b4fc; background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.35); }
  .adm-filter-count {
    background: rgba(255,255,255,0.1); padding: 1px 6px; border-radius: 100px;
    font-size: 10px; font-weight: 700;
  }

  .adm-table-wrap { border-radius: var(--r-lg); overflow: hidden; }
  .adm-empty {
    padding: 56px; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
  }
  .adm-empty p { font-size: 13px; color: var(--text-3); }

  .adm-status-badge {
    display: inline-flex; align-items: center;
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
    padding: 3px 9px; border-radius: 100px; border: 1px solid; white-space: nowrap;
  }

  .adm-action-btns { display: flex; gap: 6px; }
  .adm-action-btn {
    padding: 5px 11px; border-radius: var(--r-sm); border: 1px solid;
    font-family: var(--font-body); font-size: 11px; font-weight: 600;
    cursor: none; transition: all 0.2s; background: transparent;
  }
  .adm-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .adm-action-approve { border-color: rgba(99,102,241,0.3); color: #a5b4fc; }
  .adm-action-approve:hover { background: rgba(99,102,241,0.12); }
  .adm-action-resolve { border-color: rgba(16,185,129,0.3); color: #6ee7b7; }
  .adm-action-resolve:hover { background: rgba(16,185,129,0.12); }
  .adm-action-reject  { border-color: rgba(244,63,94,0.3); color: #fda4af; }
  .adm-action-reject:hover  { background: rgba(244,63,94,0.08); }
`;
