import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrbBackground, Spinner, useToast } from './DesignSystem';

const ISSUE_TYPES = [
  { value: 'Food Safety',    icon: '🍽️', color: '#f97316' },
  { value: 'Water Quality',  icon: '💧', color: '#3b82f6' },
  { value: 'Hygiene',        icon: '🧹', color: '#a855f7' },
  { value: 'Security',       icon: '🔒', color: '#ef4444' },
  { value: 'Infrastructure', icon: '🏗️', color: '#f59e0b' },
];

export default function ReportSafety() {
  const API      = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const navigate = useNavigate();
  const toast    = useToast();

  const [form, setForm]       = useState({ accommodationName: '', issueType: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (e: any) => { const { name, value } = e.target; setForm(p => ({ ...p, [name]: value })); };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!form.issueType) { setError('Please select an issue category'); return; }
    setError(''); setLoading(true);

    // Haptic feedback on submit
    if (navigator.vibrate) navigator.vibrate(10);

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }

    try {
      const res  = await fetch(`${API}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        // Haptic success feedback
        if (navigator.vibrate) navigator.vibrate([10, 50, 20]);
        toast.success('Report submitted successfully! It will be reviewed shortly.');
        setForm({ accommodationName: '', issueType: '', description: '' });
        setTimeout(() => navigate('/my-reports'), 1200);
      } else {
        setError(data.message || 'Failed to submit report');
        toast.error(data.message || 'Failed to submit report');
      }
    } catch {
      setError('Error submitting report');
      toast.error('Error connecting to server');
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{CSS}</style>
      <OrbBackground intensity="normal" accentColor="ef4444">
        <div className="rs-page">
          <div className="rs-inner">
            {/* Header */}
            <header className="rs-header fade-up">
              <div className="rs-badge">
                <span className="rs-pulse" />
                Anonymous Reporting Active
              </div>
              <h1 className="rs-headline">
                Report a<br />
                <em>Safety Issue</em>
              </h1>
              <p className="rs-sub">
                Your identity stays protected. Every report creates accountability and helps students make informed housing decisions.
              </p>
            </header>

            {/* Form card */}
            <div className="rs-card glass fade-up fade-up-2">
              {error && <div className="ss-error" style={{ marginBottom: 24 }}>{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="field-group">
                  <label className="field-label">Accommodation Name</label>
                  <input name="accommodationName" type="text" className="ss-input"
                    placeholder="e.g. Sai Krishna PG, Ameerpet"
                    value={form.accommodationName} onChange={set} required />
                </div>

                <div className="field-group">
                  <label className="field-label">Issue Category</label>
                  <div className="issue-grid">
                    {ISSUE_TYPES.map(t => (
                      <button key={t.value} type="button"
                        className={`issue-btn ${form.issueType === t.value ? 'issue-btn-active' : ''}`}
                        style={{ ['--dot-color' as any]: t.color }}
                        onClick={() => {
                          setForm(p => ({ ...p, issueType: t.value }));
                          if (navigator.vibrate) navigator.vibrate(8);
                        }}>
                        <span className="issue-dot" />
                        <span className="issue-icon">{t.icon}</span>
                        <span className="issue-label">{t.value}</span>
                      </button>
                    ))}
                  </div>
                  <select name="issueType" value={form.issueType} onChange={set} required
                    style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }}>
                    <option value="">Select</option>
                    {ISSUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}
                  </select>
                </div>

                <div className="field-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label className="field-label" style={{ marginBottom: 0 }}>Describe the Issue</label>
                    <span style={{ fontSize: 11, color: form.description.length > 450 ? 'var(--amber)' : 'var(--text-3)' }}>{form.description.length}/500</span>
                  </div>
                  <textarea name="description" className="ss-input rs-textarea"
                    placeholder="Be specific — when did this happen? How severe is it? Has it been reported before?"
                    value={form.description} onChange={set} required maxLength={500} />
                </div>

                <button type="submit" disabled={loading} className="ss-btn ss-btn-rose ss-btn-full">
                  {loading ? <Spinner /> : null}
                  {loading ? 'Submitting Report…' : 'Submit Report →'}
                </button>
              </form>
            </div>

            <p className="rs-footer fade-up fade-up-4">
              🔒 Reports are reviewed by admins before publishing. Your privacy is guaranteed.
            </p>
          </div>
        </div>
      </OrbBackground>
    </>
  );
}

const CSS = `
  .rs-page {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 80px 24px 80px;
  }
  .rs-inner { width: 100%; max-width: 580px; }
  .rs-header { margin-bottom: 40px; }

  .rs-badge {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 6px 14px; border-radius: 100px;
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
    font-size: 10px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.12em; color: #fca5a5; margin-bottom: 20px;
  }
  .rs-pulse {
    width: 6px; height: 6px; border-radius: 50%; background: #ef4444;
    animation: pulsate 2s ease-in-out infinite;
  }

  .rs-headline {
    font-size: clamp(2.4rem, 5vw, 3.2rem); font-weight: 700;
    letter-spacing: -0.04em; line-height: 1.05; color: var(--text-1); margin-bottom: 14px;
  }
  .rs-headline em { font-style: normal; color: #ef4444; }
  .rs-sub { color: var(--text-2); font-size: 14px; line-height: 1.65; max-width: 440px; }

  .rs-card { padding: 36px; }
  .field-group { margin-bottom: 28px; position: relative; }

  .issue-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 10px; }

  .issue-btn {
    display: flex; align-items: center; gap: 10px; padding: 12px 14px;
    background: var(--panel); border: 1px solid var(--border);
    border-radius: var(--r-sm); cursor: none; transition: all 0.2s;
    font-family: var(--font-body); font-size: 13px; font-weight: 500;
    color: var(--text-2); position: relative; overflow: hidden;
  }
  .issue-btn:hover {
    border-color: var(--dot-color, var(--border-hi));
    color: var(--text-1); transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  }
  .issue-btn-active {
    border-color: var(--dot-color, var(--indigo)) !important;
    background: color-mix(in srgb, var(--dot-color, var(--indigo)) 12%, transparent) !important;
    color: var(--text-1) !important;
    box-shadow: 0 0 20px color-mix(in srgb, var(--dot-color, var(--indigo)) 25%, transparent) !important;
  }
  .issue-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--dot-color, var(--indigo)); flex-shrink: 0; }
  .issue-icon { font-size: 16px; }
  .issue-label { font-size: 13px; }

  .rs-textarea { resize: none; min-height: 130px; }

  .rs-footer {
    text-align: center; margin-top: 20px;
    font-size: 12px; color: var(--text-3); line-height: 1.5;
  }
`;
