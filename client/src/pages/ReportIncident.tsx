import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ImageUpload } from '../components/ImageUpload';
import { OrbBackground, Spinner } from './DesignSystem';

interface Image { url: string; publicId: string; }
interface Accommodation { _id: string; name: string; address: string; city: string; type?: string; }

export const ReportIncident: React.FC = () => {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    accommodation: '',
    issueType: 'Security' as 'Food Safety' | 'Water Quality' | 'Hygiene' | 'Security' | 'Infrastructure',
    description: '',
  });

  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [accommodationsLoading, setAccommodationsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadedImages, setUploadedImages] = useState<Image[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => { fetchAccommodations(); }, []);

  const fetchAccommodations = async () => {
    try {
      const res = await fetch(`${API}/api/accommodations/dropdown`);
      const data = await res.json();
      if (data.success) setAccommodations(data.data);
    } catch {}
    finally { setAccommodationsLoading(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.accommodation) { alert('Please select an accommodation'); setStep(1); return; }
    if (!formData.description.trim()) { alert('Please provide a description'); setStep(2); return; }
    const token = localStorage.getItem('token');
    if (!token) { alert('Please login first'); navigate('/login'); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accommodation: formData.accommodation, issueType: formData.issueType, description: formData.description, images: uploadedImages }),
      });
      const data = await res.json();
      if (data.success) { setSubmitSuccess(true); setUploadedImages([]); setTimeout(() => navigate('/my-reports'), 2500); }
      else alert(data.message || 'Failed to submit report');
    } catch { alert('Error submitting report'); }
    finally { setIsSubmitting(false); }
  };

  const CATEGORIES = [
    { id: 'Food Safety', icon: '🍽️', desc: 'Unhygienic kitchen, food poisoning, pest issues', color: '#f97316' },
    { id: 'Water Quality', icon: '💧', desc: 'Contaminated water, irregular supply, dirty tanks', color: '#3b82f6' },
    { id: 'Security', icon: '🔒', desc: 'Broken locks, no CCTV, unauthorized access', color: '#ef4444' },
    { id: 'Hygiene', icon: '🧹', desc: 'Dirty bathrooms, garbage issues, pest infestation', color: '#a855f7' },
    { id: 'Infrastructure', icon: '🏗️', desc: 'Electrical hazards, broken furniture, leaks', color: '#f59e0b' },
  ];

  const filteredAccom = accommodations.filter(acc =>
    acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const STEP_LABELS = ['Place', 'Describe', 'Evidence'];

  return (
    <>
      <style>{CSS}</style>
      <OrbBackground intensity="subtle" accentColor="ef4444">
        <div className="ri-page">
          <div className="ri-inner">

            {/* Header */}
            <header className="ri-header fade-up">
              <Link to="/dashboard" className="ri-back-link">← Back to Dashboard</Link>
              <div className="ri-badge">
                <span className="ri-pulse" />
                Anonymous Reporting Active
              </div>
              <h1 className="ri-title">Report a <em>Safety Concern</em></h1>
              <p className="ri-sub">Your identity stays protected. Every report creates accountability for safer student housing.</p>
            </header>

            {/* Card */}
            <div className="ri-card glass fade-up fade-up-2">

              {/* Step indicator */}
              <div className="ri-steps">
                {STEP_LABELS.map((label, i) => {
                  const n = i + 1;
                  return (
                    <React.Fragment key={n}>
                      <div className="ri-step">
                        <div className={`ri-step-circle ${step >= n ? 'ri-step-active' : ''} ${submitSuccess ? 'ri-step-done' : ''}`}>
                          {step > n ? '✓' : n}
                        </div>
                        <span className={`ri-step-label ${step >= n ? 'ri-step-label-active' : ''}`}>{label}</span>
                      </div>
                      {n < 3 && <div className={`ri-step-line ${step > n ? 'ri-step-line-active' : ''}`} />}
                    </React.Fragment>
                  );
                })}
              </div>

              {submitSuccess ? (
                <div className="ri-success">
                  <div className="ri-success-icon">✓</div>
                  <h2 className="ri-success-title">Report Submitted!</h2>
                  <p className="ri-success-sub">Moderators will review it shortly. Redirecting you…</p>
                </div>
              ) : (
                <div className="ri-content">

                  {/* Step 1 */}
                  {step === 1 && (
                    <div className="ri-step-content fade-up">
                      <div className="field-group">
                        <label className="field-label ri-step-heading">
                          <span className="ri-step-num">1</span> Which property has the issue?
                        </label>
                        {accommodationsLoading ? (
                          <div className="ri-skeleton" />
                        ) : (
                          <>
                            <div style={{ position: 'relative', marginBottom: 10 }}>
                              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, fontSize: 13 }}>🔍</span>
                              <input type="text" className="ss-input" style={{ paddingLeft: 40 }}
                                placeholder="Search by name, city, or address…"
                                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            <select name="accommodation" value={formData.accommodation} onChange={handleInputChange} className="ss-input" style={{ cursor: 'pointer' }}>
                              <option value="">-- Choose Accommodation --</option>
                              {(searchTerm ? filteredAccom : accommodations).map(acc => (
                                <option key={acc._id} value={acc._id}>{acc.name} — {acc.address}, {acc.city}</option>
                              ))}
                            </select>
                            {accommodations.length === 0 && (
                              <div className="ss-error" style={{ marginTop: 10, fontSize: 12 }}>No accommodations registered yet. Tell owners to register!</div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="field-group">
                        <label className="field-label ri-step-heading">
                          <span className="ri-step-num">2</span> What kind of issue is it?
                        </label>
                        <div className="ri-categories">
                          {CATEGORIES.map(cat => (
                            <button key={cat.id} type="button"
                              onClick={() => setFormData(p => ({ ...p, issueType: cat.id as any }))}
                              className={`ri-cat-btn ${formData.issueType === cat.id ? 'ri-cat-active' : ''}`}
                              style={{ ['--cat-color' as any]: cat.color }}>
                              <span className="ri-cat-dot" style={{ background: cat.color }} />
                              <span className="ri-cat-icon">{cat.icon}</span>
                              <div>
                                <p className="ri-cat-name">{cat.id}</p>
                                <p className="ri-cat-desc">{cat.desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2 */}
                  {step === 2 && (
                    <div className="ri-step-content fade-up">
                      <div className="field-group">
                        <label className="field-label ri-step-heading">
                          <span className="ri-step-num">3</span> Describe what happened (be specific — it helps!)
                        </label>
                        <div className="ri-info-box">
                          🔒 Your identity stays anonymous. Only <strong>"Verified Resident"</strong> is shown to others.
                        </div>
                        <div style={{ position: 'relative' }}>
                          <textarea name="description" value={formData.description} onChange={handleInputChange}
                            rows={8} maxLength={2000}
                            className="ss-input ri-textarea"
                            placeholder="What happened? When did it occur? Have you spoken to the owner? Be as detailed as possible." />
                          <span className="ri-char-count">{formData.description.length}/2000</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3 */}
                  {step === 3 && (
                    <div className="ri-step-content fade-up">
                      <div className="field-group">
                        <label className="field-label ri-step-heading">
                          <span className="ri-step-num">4</span> Add Evidence (Optional but Recommended)
                        </label>
                        <div className="ri-info-box" style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.25)', color: '#6ee7b7' }}>
                          📸 Photos increase report credibility by 3x. Evidence helps owners resolve issues faster.
                        </div>
                        <div className="ri-upload-wrap">
                          <ImageUpload onImagesChange={setUploadedImages} uploadedImages={uploadedImages} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Nav Buttons */}
                  <div className="ri-nav">
                    {step > 1 ? (
                      <button onClick={() => setStep(step - 1)} className="ss-btn ss-btn-ghost">← Back</button>
                    ) : (
                      <div />
                    )}

                    {step < 3 ? (
                      <button onClick={() => {
                        if (step === 1 && !formData.accommodation) { alert('Please select an accommodation'); return; }
                        setStep(step + 1);
                      }} className="ss-btn">Next Step →</button>
                    ) : (
                      <button onClick={handleSubmit} disabled={isSubmitting} className="ss-btn ss-btn-rose">
                        {isSubmitting ? <Spinner /> : null}
                        {isSubmitting ? 'Submitting…' : '🚨 Submit Report →'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <p className="ri-footer fade-up fade-up-4">🔒 Reports are reviewed by admins before publishing. Your privacy is guaranteed.</p>
          </div>
        </div>
      </OrbBackground>
    </>
  );
};

const CSS = `
  .ri-page {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 60px 24px 80px;
  }
  .ri-inner { width: 100%; max-width: 680px; }

  /* Header */
  .ri-header { margin-bottom: 36px; }
  .ri-back-link { display: inline-block; font-size: 12px; font-weight: 600; color: var(--indigo); text-decoration: none; margin-bottom: 20px; transition: color 0.2s; }
  .ri-back-link:hover { color: var(--violet); }

  .ri-badge {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 5px 13px; border-radius: 100px;
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
    font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em;
    color: #fca5a5; margin-bottom: 18px;
  }
  .ri-pulse { width: 6px; height: 6px; border-radius: 50%; background: #ef4444; animation: pulse 2s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.5)} }

  .ri-title {
    font-size: clamp(2rem, 5vw, 2.8rem); font-weight: 700; letter-spacing: -0.04em;
    color: var(--text-1); line-height: 1.1; margin-bottom: 12px;
  }
  .ri-title em { font-style: normal; color: #ef4444; }
  .ri-sub { font-size: 14px; color: var(--text-2); line-height: 1.65; max-width: 500px; }

  /* Card */
  .ri-card { padding: 32px 36px; }

  /* Steps */
  .ri-steps { display: flex; align-items: center; margin-bottom: 32px; }
  .ri-step { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .ri-step-circle {
    width: 36px; height: 36px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700;
    background: var(--panel); border: 1px solid var(--border); color: var(--text-3);
    transition: all 0.3s;
  }
  .ri-step-active { background: rgba(99,102,241,0.15) !important; border-color: rgba(99,102,241,0.5) !important; color: #a5b4fc !important; }
  .ri-step-done { background: rgba(16,185,129,0.15) !important; border-color: rgba(16,185,129,0.4) !important; color: var(--emerald) !important; }
  .ri-step-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); }
  .ri-step-label-active { color: #a5b4fc; }
  .ri-step-line { flex: 1; height: 1px; background: var(--border); margin: 0 12px; transition: background 0.3s; margin-bottom: 22px; }
  .ri-step-line-active { background: rgba(99,102,241,0.4); }

  /* Content */
  .ri-content { display: flex; flex-direction: column; min-height: 380px; }
  .ri-step-content { flex: 1; }

  .ri-step-heading { display: flex; align-items: center; gap: 10px; font-size: 14px; margin-bottom: 14px !important; color: var(--text-1) !important; text-transform: none !important; letter-spacing: 0 !important; }
  .ri-step-num {
    width: 26px; height: 26px; border-radius: 8px;
    background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: #a5b4fc; flex-shrink: 0;
  }

  .ri-skeleton { height: 48px; background: var(--panel); border-radius: var(--r-sm); animation: shimmer 1.6s infinite; }

  /* Categories */
  .ri-categories { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  @media(max-width: 500px) { .ri-categories { grid-template-columns: 1fr; } }

  .ri-cat-btn {
    display: flex; align-items: flex-start; gap: 10px; padding: 14px 14px;
    background: var(--panel); border: 1px solid var(--border);
    border-radius: var(--r-sm); cursor: pointer; transition: all 0.2s;
    font-family: var(--font-body); text-align: left;
  }
  .ri-cat-btn:hover { border-color: rgba(99,102,241,0.3); transform: translateY(-1px); }
  .ri-cat-active { border-color: var(--cat-color, var(--indigo)) !important; background: color-mix(in srgb, var(--cat-color, var(--indigo)) 10%, transparent) !important; }
  .ri-cat-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 6px; }
  .ri-cat-icon { font-size: 18px; flex-shrink: 0; }
  .ri-cat-name { font-size: 13px; font-weight: 600; color: var(--text-1); margin-bottom: 3px; }
  .ri-cat-desc { font-size: 11px; color: var(--text-3); line-height: 1.4; }

  /* Description */
  .ri-info-box {
    padding: 12px 14px; border-radius: var(--r-sm); margin-bottom: 14px;
    background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2);
    font-size: 12px; color: #a5b4fc; line-height: 1.55;
  }
  .ri-textarea { resize: none; min-height: 200px; }
  .ri-char-count { position: absolute; bottom: 12px; right: 14px; font-size: 11px; color: var(--text-3); }

  /* Upload */
  .ri-upload-wrap { padding: 20px; background: var(--panel); border: 1px dashed var(--border); border-radius: var(--r-md); }

  /* Nav */
  .ri-nav { display: flex; justify-content: space-between; align-items: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--border); }

  /* Success */
  .ri-success { padding: 40px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .ri-success-icon { width: 72px; height: 72px; border-radius: 50%; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3); display: flex; align-items: center; justify-content: center; font-size: 28px; color: var(--emerald); }
  .ri-success-title { font-size: 1.6rem; font-weight: 700; color: var(--text-1); letter-spacing: -0.03em; }
  .ri-success-sub { font-size: 13px; color: var(--text-2); }

  /* Footer */
  .ri-footer { text-align: center; margin-top: 20px; font-size: 12px; color: var(--text-3); }

  .field-group { margin-bottom: 24px; }
`;
