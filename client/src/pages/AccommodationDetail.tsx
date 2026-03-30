import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SubtleOrb, PageLoader, Spinner, TrustScoreRing, useToast } from './DesignSystem';
import { AISafetySummary } from './AISafetySummary';
import { formatDistanceToNow } from 'date-fns';

export const AccommodationDetail: React.FC = () => {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [accommodation, setAccommodation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [responseText, setResponseText] = useState('');
  const [responseImages, setResponseImages] = useState<File[]>([]);
  const [responseImagePreviews, setResponseImagePreviews] = useState<string[]>([]);
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [responseSuccess, setResponseSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'reports' | 'info'>('reports');

  useEffect(() => { fetchAccommodation(); }, [id]);

  const fetchAccommodation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}/api/accommodations/${id}`);
      const data = await response.json();
      if (data.success) setAccommodation(data.data);
      else setError('Accommodation not found');
    } catch { setError('Error loading accommodation'); }
    finally { setLoading(false); }
  };

  const isOwner = useMemo(() => {
    if (!user || !accommodation) return false;
    if (user.role !== 'owner') return false;
    const ownerId = accommodation.owner?._id || accommodation.owner?.id || accommodation.owner;
    return String(user.id) === String(ownerId);
  }, [user, accommodation]);

  const reportStats = useMemo(() => {
    if (!accommodation?.reports) return { pending: 0, resolved: 0, disputed: 0 };
    return {
      pending:  accommodation.reports.filter((r: any) => r.status === 'pending' || r.status === 'approved').length,
      resolved: accommodation.reports.filter((r: any) => r.status === 'resolved' || r.status === 'verified').length,
      disputed: accommodation.reports.filter((r: any) => r.status === 'disputed').length,
    };
  }, [accommodation?.reports]);

  const openResolveModal = (report: any) => {
    setSelectedReport(report); setResponseText(''); setResponseImages([]);
    setResponseImagePreviews([]); setResponseSuccess(false); setShowResolveModal(true);
  };

  const closeResolveModal = () => {
    setShowResolveModal(false); setSelectedReport(null); setResponseText('');
    setResponseImages([]); setResponseImagePreviews([]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setResponseImages(prev => [...prev, ...files].slice(0, 5));
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setResponseImagePreviews(p => [...p, ev.target!.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const submitResolution = async () => {
    if (!selectedReport || !responseText.trim()) return;
    setSubmittingResponse(true);
    const token = localStorage.getItem('token');
    try {
      const formData = new FormData();
      formData.append('responseText', responseText);
      formData.append('actionTaken', 'Owner responded with resolution');
      responseImages.forEach(img => formData.append('images', img));

      const res = await fetch(`${API}/api/reports/${selectedReport._id}/resolve`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
      });

      if (res.ok) {
        setResponseSuccess(true);
        toast.success('Resolution submitted successfully!');
        await fetchAccommodation();
        setTimeout(() => closeResolveModal(), 2000);
      } else {
        toast.error('Failed to submit resolution');
      }
    } catch { toast.error('Connection error'); }
    finally { setSubmittingResponse(false); }
  };

  if (loading) return <PageLoader />;
  if (error || !accommodation) return (
    <SubtleOrb>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, paddingTop: 60 }}>
        <span style={{ fontSize: 28, opacity: 0.4 }}>🏠</span>
        <p style={{ color: 'var(--text-2)', fontSize: 14 }}>{error || 'Property not found'}</p>
        <button onClick={() => navigate('/accommodations')} className="ss-btn ss-btn-ghost" style={{ fontSize: 13 }}>← Back to Listings</button>
      </div>
    </SubtleOrb>
  );

  const score = accommodation.trustScore ?? 0;
  const approvedReports = (accommodation.reports || []).filter((r: any) => r.status === 'approved' || r.status === 'resolved' || r.status === 'verified');

  return (
    <>
      <style>{CSS}</style>
      <SubtleOrb>
        <div className="ad-page">
          {/* Header */}
          <div className="ad-header fade-up">
            <div className="ad-header-inner">
              <button onClick={() => navigate('/accommodations')} className="ad-back-btn">← Back</button>

              <div className="ad-hero">
                <div className="ad-hero-left">
                  <p className="ad-eyebrow">{accommodation.type || 'Hostel / PG'}</p>
                  <h1 className="ad-title">{accommodation.name}</h1>
                  <div className="ad-location">
                    <span style={{ color: 'var(--indigo)' }}>📍</span>
                    <span>{accommodation.address}, {accommodation.city}</span>
                  </div>

                  {/* Quick stats */}
                  <div className="ad-quick-stats">
                    {[
                      { label: 'Pending',  value: reportStats.pending,  color: 'var(--amber)'   },
                      { label: 'Resolved', value: reportStats.resolved, color: 'var(--emerald)' },
                      { label: 'Disputed', value: reportStats.disputed, color: 'var(--rose)'    },
                    ].map(s => (
                      <div key={s.label} className="ad-quick-stat">
                        <span style={{ fontSize: '1.4rem', fontWeight: 700, color: s.color }}>{s.value}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="ad-actions">
                    {isOwner && (
                      <Link to={`/owner/edit-property/${id}`} className="ss-btn ss-btn-emerald" style={{ textDecoration: 'none', fontSize: 13 }}>Edit Property</Link>
                    )}
                    <Link to="/report" className="ss-btn ss-btn-rose" style={{ textDecoration: 'none', fontSize: 13 }}>Report Issue</Link>
                  </div>
                </div>

                {/* Animated trust score ring */}
                <div className="ad-score-wrap fade-up fade-up-2">
                  <TrustScoreRing score={score} size={180} />
                  <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', marginTop: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Trust Score
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="ad-body">
            <div className="ad-tabs fade-up fade-up-3">
              <button onClick={() => setActiveTab('reports')} className={`ad-tab ${activeTab === 'reports' ? 'ad-tab-active' : ''}`}>
                📋 Reports ({approvedReports.length})
              </button>
              <button onClick={() => setActiveTab('info')} className={`ad-tab ${activeTab === 'info' ? 'ad-tab-active' : ''}`}>
                ℹ Info
              </button>
              <button onClick={() => setActiveTab('ai' as any)} className={`ad-tab ${activeTab === ('ai' as any) ? 'ad-tab-active' : ''}`} style={(activeTab as any) === 'ai' ? { background: 'rgba(99,102,241,0.12)', color: '#a5b4fc' } : {}}>
                ✨ AI Analysis
              </button>
            </div>

            {activeTab === 'reports' && (
              <div className="ad-reports fade-up fade-up-4">
                {approvedReports.length === 0 ? (
                  <div className="ad-empty glass">
                    <span style={{ fontSize: 32, opacity: 0.25 }}>✅</span>
                    <p>No reports for this property. Looking good!</p>
                  </div>
                ) : approvedReports.map((report: any, i: number) => {
                  const isResolved = report.status === 'resolved' || report.status === 'verified';
                  return (
                    <div key={report._id} className="ad-report-card glass fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                      <div className="ad-report-header">
                        <div>
                          <span className="ad-report-type">{report.issueType}</span>
                          <span className="ad-report-status" style={{
                            color: isResolved ? 'var(--emerald)' : 'var(--amber)',
                            background: isResolved ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                            borderColor: isResolved ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)',
                          }}>
                            {isResolved ? '✅ Resolved' : '⚠️ Open'}
                          </span>
                        </div>
                        {isOwner && !isResolved && (
                          <button onClick={() => openResolveModal(report)} className="ss-btn ss-btn-emerald" style={{ padding: '7px 14px', fontSize: 12 }}>
                            Respond
                          </button>
                        )}
                      </div>

                      <p className="ad-report-desc">{report.description}</p>

                      {report.images?.length > 0 && (
                        <div className="ad-report-images">
                          {report.images.slice(0, 3).map((img: any, j: number) => (
                            <img key={j} src={img.url || img} alt="" className="ad-report-img" />
                          ))}
                        </div>
                      )}

                      {report.resolution && (
                        <div className="ad-resolution">
                          <p className="ad-resolution-label">✅ Owner Response</p>
                          <p className="ad-resolution-text">{report.resolution.responseText || report.resolution.description}</p>
                        </div>
                      )}

                      <div className="ad-report-meta">
                        <span>{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
                        {report.upvotes > 0 && <span>▲ {report.upvotes} verified</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'info' && (
              <div className="ad-info fade-up fade-up-4">
                <div className="ad-info-card glass">
                  <h3 className="ad-info-title">Property Details</h3>
                  <div className="ad-info-grid">
                    {[
                      { label: 'Name',    value: accommodation.name },
                      { label: 'Address', value: accommodation.address },
                      { label: 'City',    value: accommodation.city },
                      { label: 'Type',    value: accommodation.type || 'Hostel / PG' },
                      { label: 'Phone',   value: accommodation.phone || '—' },
                      { label: 'Email',   value: accommodation.email || '—' },
                    ].map(item => (
                      <div key={item.label} className="ad-info-row">
                        <span className="ad-info-label">{item.label}</span>
                        <span className="ad-info-value">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {accommodation.amenities?.length > 0 && (
                  <div className="ad-info-card glass">
                    <h3 className="ad-info-title">Amenities</h3>
                    <div className="ad-amenities">
                      {accommodation.amenities.map((a: string, i: number) => (
                        <span key={i} className="pill pill-indigo">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {(activeTab as any) === 'ai' && (
              <div className="fade-up fade-up-4">
                <AISafetySummary
                  accommodationName={accommodation.name}
                  trustScore={score}
                  reports={approvedReports}
                />
              </div>
            )}
          </div>
        </div>

        {/* Resolve Modal */}
        {showResolveModal && selectedReport && (
          <div className="ad-modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeResolveModal(); }}>
            <div className="ad-modal glass-hi fade-up">
              {responseSuccess ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div className="ad-success-icon">✓</div>
                  <h3 style={{ color: 'var(--text-1)', marginBottom: 8 }}>Response Submitted!</h3>
                  <p style={{ color: 'var(--text-2)', fontSize: 13 }}>Report marked as resolved.</p>
                </div>
              ) : (
                <>
                  <div className="ad-modal-header">
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--emerald)', marginBottom: 6 }}>Resolve Report</p>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)' }}>{selectedReport.issueType}</h3>
                    </div>
                    <button onClick={closeResolveModal} className="ad-modal-close">✕</button>
                  </div>

                  <div className="ad-modal-report">
                    <p>{selectedReport.description}</p>
                  </div>

                  <div className="field-group" style={{ marginBottom: 16 }}>
                    <label className="field-label">Resolution Details</label>
                    <textarea className="ss-input" style={{ resize: 'none', minHeight: 110 }}
                      placeholder="What action did you take to resolve this issue?"
                      value={responseText} onChange={e => setResponseText(e.target.value)} />
                  </div>

                  {responseImagePreviews.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                      {responseImagePreviews.map((p, i) => (
                        <img key={i} src={p} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <label className="ss-btn ss-btn-ghost" style={{ fontSize: 12, flex: 1, cursor: 'none' }}>
                      📎 Add Photos
                      <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                    </label>
                    <button onClick={submitResolution} disabled={submittingResponse || !responseText.trim()} className="ss-btn ss-btn-emerald" style={{ fontSize: 13, flex: 2 }}>
                      {submittingResponse ? <Spinner size={14} /> : null}
                      {submittingResponse ? 'Submitting…' : 'Submit Resolution →'}
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
};

const CSS = `
  .ad-page { min-height: 100vh; background: transparent; padding-top: 60px; }

  .ad-header { background: rgba(5,5,10,0.8); border-bottom: 1px solid var(--border); padding: 32px 0; backdrop-filter: blur(12px); margin-bottom: 40px; }
  .ad-header-inner { max-width: 1100px; margin: 0 auto; padding: 0 32px; }

  .ad-back-btn {
    background: none; border: none; cursor: none; font-family: var(--font-body);
    font-size: 13px; color: var(--text-3); padding: 0; margin-bottom: 24px; display: block;
    transition: color 0.2s;
  }
  .ad-back-btn:hover { color: var(--text-1); }

  .ad-hero { display: flex; justify-content: space-between; align-items: flex-start; gap: 40px; flex-wrap: wrap; }
  .ad-hero-left { flex: 1; min-width: 280px; }
  .ad-eyebrow { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: var(--indigo); margin-bottom: 10px; }
  .ad-title { font-size: clamp(1.6rem, 3vw, 2.4rem); font-weight: 700; letter-spacing: -0.04em; color: var(--text-1); margin-bottom: 10px; line-height: 1.1; }
  .ad-location { display: flex; align-items: center; gap: 6px; color: var(--text-2); font-size: 13px; margin-bottom: 24px; }

  .ad-quick-stats { display: flex; gap: 24px; margin-bottom: 24px; }
  .ad-quick-stat { display: flex; flex-direction: column; gap: 3px; }

  .ad-actions { display: flex; gap: 10px; flex-wrap: wrap; }

  .ad-score-wrap { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }

  .ad-body { max-width: 1100px; margin: 0 auto; padding: 0 32px 60px; }

  .ad-tabs { display: flex; gap: 4px; background: var(--panel); border: 1px solid var(--border); border-radius: var(--r-md); padding: 4px; width: fit-content; margin-bottom: 24px; }
  .ad-tab { padding: 9px 20px; border: none; background: transparent; cursor: none; font-family: var(--font-body); font-size: 13px; font-weight: 600; border-radius: 10px; color: var(--text-3); transition: all 0.2s; }
  .ad-tab:hover { color: var(--text-1); }
  .ad-tab-active { background: rgba(99,102,241,0.15); color: #a5b4fc; }

  .ad-reports { display: flex; flex-direction: column; gap: 14px; }

  .ad-report-card { padding: 22px 24px; }
  .ad-report-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 12px; flex-wrap: wrap; }
  .ad-report-type { display: inline-block; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--indigo); margin-bottom: 6px; margin-right: 10px; }
  .ad-report-status { display: inline-flex; align-items: center; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 3px 9px; border-radius: 100px; border: 1px solid; }
  .ad-report-desc { font-size: 13px; color: var(--text-2); line-height: 1.65; margin-bottom: 14px; }
  .ad-report-images { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
  .ad-report-img { width: 80px; height: 80px; object-fit: cover; border-radius: var(--r-sm); border: 1px solid var(--border); }

  .ad-resolution { padding: 12px 16px; background: rgba(16,185,129,0.05); border: 1px solid rgba(16,185,129,0.2); border-radius: var(--r-sm); margin-bottom: 14px; }
  .ad-resolution-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--emerald); margin-bottom: 6px; }
  .ad-resolution-text { font-size: 13px; color: var(--text-2); line-height: 1.6; }
  .ad-report-meta { display: flex; gap: 14px; font-size: 11px; color: var(--text-3); }

  .ad-empty { padding: 56px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .ad-empty p { font-size: 13px; color: var(--text-3); }

  .ad-info { display: flex; flex-direction: column; gap: 16px; }
  .ad-info-card { padding: 24px; border-radius: var(--r-lg); }
  .ad-info-title { font-size: 14px; font-weight: 700; color: var(--text-1); margin-bottom: 18px; }
  .ad-info-grid { display: flex; flex-direction: column; gap: 12px; }
  .ad-info-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .ad-info-row:last-child { border-bottom: none; }
  .ad-info-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); }
  .ad-info-value { font-size: 13px; color: var(--text-1); font-weight: 500; }
  .ad-amenities { display: flex; flex-wrap: wrap; gap: 8px; }

  /* Modal */
  .ad-modal-overlay {
    position: fixed; inset: 0; z-index: 9000;
    background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center; padding: 24px;
  }
  .ad-modal { width: 100%; max-width: 500px; padding: 32px; border-radius: var(--r-xl); }
  .ad-modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
  .ad-modal-close { width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--border); background: transparent; cursor: none; color: var(--text-3); font-size: 14px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .ad-modal-close:hover { border-color: rgba(244,63,94,0.4); color: #fda4af; }
  .ad-modal-report { padding: 14px 16px; border-radius: var(--r-sm); background: rgba(255,255,255,0.03); border: 1px solid var(--border); margin-bottom: 20px; }
  .ad-modal-report p { font-size: 13px; color: var(--text-2); line-height: 1.6; }
  .field-group { margin-bottom: 18px; }
  .ad-success-icon { width: 72px; height: 72px; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 20px; color: var(--emerald); }
`;
