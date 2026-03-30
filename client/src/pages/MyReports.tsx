import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SubtleOrb, PageLoader, SkeletonList, Spinner, useToast } from './DesignSystem';

interface Image { url: string; publicId?: string; }
interface Resolution { description: string; actionTaken: string; images: Array<{ url: string; publicId: string }>; resolvedBy?: { name: string } | string; resolvedAt?: string; }
interface Verification { isVerified: boolean; verifiedBy?: string; verifiedAt?: string; feedback?: string; isDisputed: boolean; disputeReason?: string; }
interface Report {
  _id: string; accommodationName: string; accommodationId?: string;
  issueType: string; description: string; images?: Image[];
  createdAt: string; status?: string; upvotes?: number; upvotedBy?: string[];
  user?: string; resolution?: Resolution; verification?: Verification;
}

const ISSUE_TYPES = ['Food Safety', 'Water Quality', 'Hygiene', 'Security', 'Infrastructure'];

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  pending:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  label: 'Pending' },
  approved: { color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.3)',  label: 'Published' },
  resolved: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.3)',  label: 'Owner Responded' },
  verified: { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)',  label: 'Verified ✓' },
  disputed: { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',   border: 'rgba(244,63,94,0.3)',   label: 'Disputed' },
  rejected: { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',   border: 'rgba(244,63,94,0.3)',   label: 'Rejected' },
};

export default function MyReports() {
  const API   = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const toast = useToast();
  const [reports, setReports]               = useState<Report[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [activeFilter, setActiveFilter]     = useState('all');
  const [editingReport, setEditingReport]   = useState<Report | null>(null);
  const [editFormData, setEditFormData]     = useState({ accommodationName: '', issueType: '', description: '' });
  const [editLoading, setEditLoading]       = useState(false);
  const [deleteConfirm, setDeleteConfirm]   = useState<string | null>(null);
  const [deletingId, setDeletingId]         = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => { fetchMyReports(); }, []);

  const fetchMyReports = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      const res  = await fetch(`${API}/api/reports/my-reports`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setReports(data.data);
      else setError(data.message || 'Failed to fetch reports');
    } catch { setError('Error connecting to server'); }
    finally { setLoading(false); }
  };

  const handleEdit = (report: Report) => {
    setEditingReport(report);
    setEditFormData({ accommodationName: report.accommodationName, issueType: report.issueType, description: report.description });
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;
    const token = localStorage.getItem('token'); setEditLoading(true);
    try {
      const res  = await fetch(`${API}/api/reports/${editingReport._id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(editFormData) });
      const data = await res.json();
      if (data.success) {
        setEditingReport(null);
        toast.success('Report updated successfully');
        fetchMyReports();
      } else { toast.error(data.message || 'Failed to update report'); }
    } catch { toast.error('Error updating report'); }
    finally { setEditLoading(false); }
  };

  const handleDelete = async (reportId: string) => {
    const token = localStorage.getItem('token'); setDeletingId(reportId);
    try {
      const res  = await fetch(`${API}/api/reports/${reportId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        toast.success('Report deleted');
        fetchMyReports();
      } else { toast.error('Failed to delete report'); }
    } catch { toast.error('Error deleting report'); }
    finally { setDeletingId(null); setDeleteConfirm(null); }
  };

  const handleVerify = async (id: string, accepted: boolean, reason: string) => {
    const token = localStorage.getItem('token');
    try {
      const res  = await fetch(`${API}/api/reports/${id}/verify`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ accepted, feedback: accepted ? reason : '', disputeReason: !accepted ? reason : '' }) });
      const data = await res.json();
      if (data.success) {
        toast.success(accepted ? 'Resolution verified!' : 'Resolution disputed');
        fetchMyReports();
      }
    } catch { toast.error('Error verifying resolution'); }
  };

  const filteredReports = reports.filter(r => activeFilter === 'all' || r.status === activeFilter);

  const STATS = [
    { label: 'Total',   value: reports.length,                                     icon: '📄', color: 'var(--indigo)'  },
    { label: 'Pending', value: reports.filter(r => r.status === 'pending').length,  icon: '⏳', color: 'var(--amber)'   },
    { label: 'Active',  value: reports.filter(r => r.status === 'resolved').length, icon: '🔧', color: 'var(--violet)'  },
    { label: 'Verified',value: reports.filter(r => r.status === 'verified').length, icon: '✅', color: 'var(--emerald)' },
  ];

  const FILTERS = [
    { id: 'all',      label: 'All'       },
    { id: 'pending',  label: '⏳ Pending' },
    { id: 'approved', label: '✅ Live'   },
    { id: 'resolved', label: '🔧 Responded' },
    { id: 'verified', label: '🎉 Verified'  },
    { id: 'disputed', label: '⚠️ Disputed'  },
  ];

  return (
    <>
      <style>{CSS}</style>
      <SubtleOrb>
        <div className="mr-page">
          <header className="mr-header fade-up">
            <div className="mr-header-inner">
              <div>
                <Link to="/dashboard" className="mr-back-link">← Dashboard</Link>
                <p className="mr-eyebrow">Your Contributions</p>
                <h1 className="mr-title">My Safety Reports</h1>
              </div>
              <Link to="/report" className="ss-btn ss-btn-rose" style={{ textDecoration: 'none', fontSize: 13 }}>+ New Report</Link>
            </div>
            <div className="mr-stats">
              {STATS.map((s, i) => (
                <div key={i} className="mr-stat fade-up" style={{ animationDelay: `${0.05 + i * 0.06}s` }}>
                  <span className="mr-stat-icon">{s.icon}</span>
                  <span className="mr-stat-num" style={{ color: s.color }}>{s.value}</span>
                  <span className="mr-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </header>

          <div className="mr-body">
            {/* Filters */}
            <div className="mr-filters glass fade-up fade-up-2">
              {FILTERS.map(f => (
                <button key={f.id} onClick={() => setActiveFilter(f.id)}
                  className={`mr-filter-btn ${activeFilter === f.id ? 'mr-filter-active' : ''}`}>
                  {f.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array.from({ length: 5 }).map((_, i) => <SkeletonList key={i} />)}
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="mr-empty glass fade-up fade-up-3">
                <span style={{ fontSize: 36, opacity: 0.2 }}>📄</span>
                <h3 className="mr-empty-title">
                  {activeFilter === 'all' ? "No reports yet" : `No ${activeFilter} reports`}
                </h3>
                <p className="mr-empty-sub">
                  {activeFilter === 'all' ? 'Your reports help thousands of students stay safe.' : 'No reports match this filter.'}
                </p>
                {activeFilter === 'all' && (
                  <Link to="/report" className="ss-btn" style={{ textDecoration: 'none', marginTop: 12 }}>Report an Issue →</Link>
                )}
              </div>
            ) : (
              <div className="mr-list fade-up fade-up-3">
                {filteredReports.map((report, i) => {
                  const sc = STATUS_CONFIG[report.status || 'pending'] || STATUS_CONFIG.pending;
                  const hasResolution = !!report.resolution;
                  const awaitingVerify = report.status === 'resolved' && !report.verification?.isVerified;

                  return (
                    <div key={report._id} className="mr-report-card glass" style={{ animationDelay: `${i * 0.04}s` }}>
                      <div className="mr-report-header">
                        <div>
                          <span className="mr-issue-type">{report.issueType}</span>
                          <h3 className="mr-place">{report.accommodationName}</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="mr-status-badge" style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}>{sc.label}</span>
                          <div className="mr-actions">
                            <button onClick={() => handleEdit(report)} className="mr-action-btn mr-action-edit" title="Edit">✎</button>
                            <button onClick={() => setDeleteConfirm(report._id)} className="mr-action-btn mr-action-delete" title="Delete">🗑</button>
                          </div>
                        </div>
                      </div>

                      <p className="mr-desc">{report.description}</p>

                      {report.images && report.images.length > 0 && (
                        <div className="mr-images">
                          {report.images.slice(0, 4).map((img, j) => (
                            <img key={j} src={img.url} alt="" className="mr-img" />
                          ))}
                        </div>
                      )}

                      {/* Owner resolution */}
                      {hasResolution && (
                        <div className="mr-resolution">
                          <p className="mr-resolution-label">🔧 Owner responded</p>
                          <p className="mr-resolution-text">{report.resolution?.responseText || report.resolution?.description}</p>
                          {awaitingVerify && (
                            <div className="mr-verify-row">
                              <p style={{ fontSize: 12, color: 'var(--amber)', marginBottom: 8 }}>⚡ Was this resolved to your satisfaction?</p>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => handleVerify(report._id, true, 'Issue has been resolved')} className="ss-btn ss-btn-emerald" style={{ padding: '7px 14px', fontSize: 12 }}>
                                  ✓ Yes, resolved
                                </button>
                                <button onClick={() => handleVerify(report._id, false, 'Issue not resolved')} className="ss-btn ss-btn-ghost" style={{ padding: '7px 14px', fontSize: 12, borderColor: 'rgba(244,63,94,0.3)', color: '#fda4af' }}>
                                  ✕ Not resolved
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mr-meta">
                        <span>{new Date(report.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {(report.upvotes ?? 0) > 0 && <span>▲ {report.upvotes} confirmations</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Edit Modal */}
        {editingReport && (
          <div className="mr-modal-overlay" onClick={() => setEditingReport(null)}>
            <div className="mr-modal glass-hi fade-up" onClick={e => e.stopPropagation()}>
              <div className="mr-modal-header">
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--indigo)', marginBottom: 6 }}>Edit Report</p>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)' }}>{editingReport.accommodationName}</h3>
                </div>
                <button onClick={() => setEditingReport(null)} className="mr-modal-close">✕</button>
              </div>
              <form onSubmit={handleUpdateSubmit} style={{ marginTop: 20 }}>
                <div className="field-group">
                  <label className="field-label">Accommodation Name</label>
                  <input className="ss-input" value={editFormData.accommodationName}
                    onChange={e => setEditFormData(p => ({ ...p, accommodationName: e.target.value }))} required />
                </div>
                <div className="field-group">
                  <label className="field-label">Issue Type</label>
                  <select className="ss-input" value={editFormData.issueType}
                    onChange={e => setEditFormData(p => ({ ...p, issueType: e.target.value }))} style={{ appearance: 'none' }} required>
                    {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Description</label>
                  <textarea className="ss-input" style={{ resize: 'none', minHeight: 100 }}
                    value={editFormData.description}
                    onChange={e => setEditFormData(p => ({ ...p, description: e.target.value }))} required />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setEditingReport(null)} className="ss-btn ss-btn-ghost" style={{ flex: 1, fontSize: 13 }}>Cancel</button>
                  <button type="submit" disabled={editLoading} className="ss-btn" style={{ flex: 2, fontSize: 13 }}>
                    {editLoading ? <Spinner size={14} /> : null}
                    {editLoading ? 'Saving…' : 'Save Changes →'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className="mr-modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="mr-delete-modal glass-hi fade-up" onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>🗑️</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>Delete Report?</h3>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 24, lineHeight: 1.6 }}>
                This action cannot be undone. The report will be permanently removed.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setDeleteConfirm(null)} className="ss-btn ss-btn-ghost" style={{ flex: 1, fontSize: 13 }}>Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} disabled={!!deletingId} className="ss-btn ss-btn-rose" style={{ flex: 1, fontSize: 13 }}>
                  {deletingId ? <Spinner size={14} /> : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </SubtleOrb>
    </>
  );
}

const CSS = `
  .mr-page { min-height: 100vh; background: transparent; padding-top: 60px; }

  .mr-header { background: rgba(5,5,10,0.8); border-bottom: 1px solid var(--border); padding: 36px 0 0; margin-bottom: 36px; backdrop-filter: blur(12px); }
  .mr-header-inner { max-width: 1000px; margin: 0 auto; padding: 0 32px 28px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; }
  .mr-back-link { font-size: 12px; color: var(--text-3); text-decoration: none; display: block; margin-bottom: 14px; transition: color 0.2s; }
  .mr-back-link:hover { color: var(--text-1); }
  .mr-eyebrow { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: var(--indigo); margin-bottom: 8px; }
  .mr-title { font-size: 1.8rem; font-weight: 700; letter-spacing: -0.04em; color: var(--text-1); }

  .mr-stats { max-width: 1000px; margin: 0 auto; padding: 0 32px 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); border-top: 1px solid var(--border); }
  .mr-stat { padding: 16px 24px; background: rgba(5,5,10,0.8); display: flex; flex-direction: column; gap: 3px; }
  .mr-stat-icon { font-size: 16px; margin-bottom: 4px; }
  .mr-stat-num { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.04em; }
  .mr-stat-label { font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); }

  .mr-body { max-width: 1000px; margin: 0 auto; padding: 0 32px 60px; }

  .mr-filters {
    display: flex; flex-wrap: wrap; gap: 6px; padding: 14px 16px;
    border-radius: var(--r-md); margin-bottom: 20px;
  }
  .mr-filter-btn {
    padding: 6px 14px; border: 1px solid var(--border); background: transparent; border-radius: var(--r-sm);
    font-family: var(--font-body); font-size: 12px; font-weight: 600; color: var(--text-3); cursor: none; transition: all 0.2s;
  }
  .mr-filter-btn:hover { color: var(--text-1); border-color: var(--border-hi); }
  .mr-filter-active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.35); color: #a5b4fc; }

  .mr-list { display: flex; flex-direction: column; gap: 12px; }

  .mr-report-card { padding: 20px 24px; }
  .mr-report-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 12px; flex-wrap: wrap; }
  .mr-issue-type { display: block; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--indigo); margin-bottom: 4px; }
  .mr-place { font-size: 15px; font-weight: 700; letter-spacing: -0.02em; color: var(--text-1); }
  .mr-status-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 3px 9px; border-radius: 100px; border: 1px solid; white-space: nowrap; }
  .mr-actions { display: flex; gap: 6px; }
  .mr-action-btn { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border); background: transparent; cursor: none; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .mr-action-edit:hover  { border-color: rgba(99,102,241,0.4); color: #a5b4fc; background: rgba(99,102,241,0.08); }
  .mr-action-delete:hover{ border-color: rgba(244,63,94,0.4);  color: #fda4af; background: rgba(244,63,94,0.08); }

  .mr-desc { font-size: 13px; color: var(--text-2); line-height: 1.6; margin-bottom: 12px; }
  .mr-images { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
  .mr-img { width: 72px; height: 72px; object-fit: cover; border-radius: var(--r-sm); border: 1px solid var(--border); }

  .mr-resolution { padding: 12px 16px; background: rgba(139,92,246,0.06); border: 1px solid rgba(139,92,246,0.2); border-radius: var(--r-sm); margin-bottom: 12px; }
  .mr-resolution-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--violet); margin-bottom: 6px; }
  .mr-resolution-text { font-size: 12px; color: var(--text-2); line-height: 1.6; margin-bottom: 8px; }
  .mr-verify-row { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px; margin-top: 8px; }

  .mr-meta { display: flex; gap: 14px; font-size: 11px; color: var(--text-3); }

  .mr-empty { padding: 64px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .mr-empty-title { font-size: 1rem; font-weight: 700; color: var(--text-1); }
  .mr-empty-sub { font-size: 13px; color: var(--text-3); max-width: 320px; text-align: center; }

  /* Modals */
  .mr-modal-overlay { position: fixed; inset: 0; z-index: 9000; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 24px; }
  .mr-modal { width: 100%; max-width: 480px; padding: 28px; border-radius: var(--r-xl); }
  .mr-modal-header { display: flex; justify-content: space-between; align-items: flex-start; }
  .mr-modal-close { width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--border); background: transparent; cursor: none; color: var(--text-3); font-size: 13px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .mr-modal-close:hover { border-color: rgba(244,63,94,0.4); color: #fda4af; }
  .mr-delete-modal { width: 100%; max-width: 380px; padding: 32px; border-radius: var(--r-xl); text-align: center; }
  .field-group { margin-bottom: 14px; }
`;
