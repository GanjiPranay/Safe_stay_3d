import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrbBackground, Spinner } from './DesignSystem';

export default function ForgotPassword() {
  const API      = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const navigate = useNavigate();

  const [step, setStep]           = useState<'email' | 'otp' | 'done'>('email');
  const [email, setEmail]         = useState('');
  const [otp, setOtp]             = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [message, setMessage]     = useState('');
  const [countdown, setCountdown] = useState(0);
  const [showPw, setShowPw]       = useState(false);

  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(t); }
  }, [countdown]);

  const sendOTP = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setMessage(''); setLoading(true);
    try {
      const res  = await fetch(`${API}/api/otp/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() }) });
      const data = await res.json();
      if (data.success) { setMessage('OTP sent!'); setStep('otp'); setCountdown(60); }
      else setError(data.message);
    } catch { setError('Connection error'); } finally { setLoading(false); }
  };

  const resetPw = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (newPw !== confirmPw) { setError('Passwords do not match'); return; }
    if (newPw.length < 6)   { setError('Password too short (min 6)'); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/otp/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim(), otp: otp.trim(), newPassword: newPw }) });
      const data = await res.json();
      if (data.success) { setStep('done'); setTimeout(() => navigate('/login'), 2800); }
      else setError(data.message);
    } catch { setError('Connection error'); } finally { setLoading(false); }
  };

  const resend = async () => {
    if (countdown > 0) return;
    try {
      const res  = await fetch(`${API}/api/otp/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() }) });
      const data = await res.json();
      if (data.success) { setMessage('New code sent!'); setCountdown(60); } else setError(data.message);
    } catch { setError('Connection error'); }
  };

  // FIXED: step progress - each dot is active independently
  const stepNum = { email: 1, otp: 2, done: 3 }[step];

  return (
    <>
      <style>{CSS}</style>
      <OrbBackground intensity="subtle" accentColor="6366f1">
        <div className="fp-page">
          <div className="fp-card glass-hi fade-up">
            {/* Step dots — FIXED: progressive not simultaneous */}
            <div className="step-dots">
              {[1, 2, 3].map(n => (
                <div key={n} className={`step-dot ${stepNum >= n ? (stepNum === 3 ? 'step-dot-done' : 'step-dot-active') : ''}`} />
              ))}
            </div>

            {step === 'email' && (
              <>
                <p className="form-eyebrow">Account Recovery</p>
                <h2 className="form-heading">Recover Access</h2>
                <p className="form-sub">Enter your email and we'll send a reset code instantly.</p>
                {error && <div className="ss-error" style={{ marginBottom: 16 }}>{error}</div>}
                <form onSubmit={sendOTP}>
                  <div className="field-group">
                    <label className="field-label">Email Address</label>
                    <input type="email" className="ss-input" placeholder="you@university.edu"
                      value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <button type="submit" disabled={loading} className="ss-btn ss-btn-full">
                    {loading ? <Spinner /> : null}
                    {loading ? 'Sending code…' : 'Send Reset Code →'}
                  </button>
                </form>
              </>
            )}

            {step === 'otp' && (
              <>
                <p className="form-eyebrow">Step 2 of 2</p>
                <h2 className="form-heading">Verify & Reset</h2>
                <p className="form-sub">Code sent to <strong style={{ color: 'var(--text-1)' }}>{email}</strong>. Enter it below.</p>
                {error   && <div className="ss-error"   style={{ marginBottom: 16 }}>{error}</div>}
                {message && <div className="ss-success" style={{ marginBottom: 16 }}>{message}</div>}
                <form onSubmit={resetPw}>
                  <div className="field-group">
                    <label className="field-label">6-Digit Code</label>
                    <input type="text" className="ss-input otp-input" placeholder="000000" maxLength={6}
                      value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} required />
                  </div>
                  <div className="field-group">
                    <label className="field-label">New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPw ? 'text' : 'password'} className="ss-input" placeholder="Min. 6 characters"
                        value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={6} />
                      <button type="button" className="eye-btn" onClick={() => setShowPw(!showPw)}>
                        {showPw ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Confirm Password</label>
                    <input type="password" className="ss-input" placeholder="Repeat your password"
                      value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required minLength={6}
                      style={confirmPw && newPw !== confirmPw ? { borderColor: 'rgba(244,63,94,0.5)' } : confirmPw && newPw === confirmPw ? { borderColor: 'rgba(16,185,129,0.5)' } : {}} />
                    {confirmPw && newPw !== confirmPw && <p style={{ fontSize: 11, color: '#fda4af', marginTop: 4 }}>Passwords do not match</p>}
                  </div>
                  <button type="submit" disabled={loading || otp.length !== 6 || newPw !== confirmPw} className="ss-btn ss-btn-full">
                    {loading ? <Spinner /> : null}
                    {loading ? 'Resetting…' : 'Reset Password →'}
                  </button>
                </form>
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button onClick={resend} disabled={countdown > 0} className="resend-btn">
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                  </button>
                </div>
              </>
            )}

            {step === 'done' && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div className="success-icon">✓</div>
                <h2 className="form-heading" style={{ marginBottom: 8 }}>All Done!</h2>
                <p className="form-sub">Redirecting you to login…</p>
                <button onClick={() => navigate('/login')} className="ss-btn ss-btn-emerald" style={{ marginTop: 24, width: '100%' }}>
                  Go to Login →
                </button>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button onClick={() => navigate('/login')} className="back-btn">← Back to Login</button>
            </div>
          </div>
        </div>
      </OrbBackground>
    </>
  );
}

const CSS = `
  .fp-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 24px; }
  .fp-card { width: 100%; max-width: 420px; padding: 44px 40px; }

  .step-dots { display: flex; gap: 6px; margin-bottom: 32px; }
  .step-dot { flex: 1; height: 3px; border-radius: 2px; background: var(--border); transition: background 0.5s ease; }
  .step-dot-active { background: var(--indigo); }
  .step-dot-done   { background: var(--emerald); }

  .form-eyebrow { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: var(--indigo); margin-bottom: 10px; }
  .form-heading { font-size: 1.8rem; font-weight: 700; letter-spacing: -0.04em; color: var(--text-1); margin-bottom: 6px; }
  .form-sub { font-size: 13px; color: var(--text-2); margin-bottom: 28px; line-height: 1.55; }
  .field-group { margin-bottom: 18px; }

  .otp-input { text-align: center; font-size: 1.6rem; font-weight: 700; letter-spacing: 0.25em; }

  .eye-btn {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: none; font-size: 14px; opacity: 0.5; transition: opacity 0.2s;
  }
  .eye-btn:hover { opacity: 1; }

  .resend-btn {
    background: none; border: none; cursor: none; font-family: var(--font-body);
    font-size: 13px; font-weight: 600; color: var(--indigo); transition: color 0.2s;
  }
  .resend-btn:disabled { color: var(--text-3); cursor: default; }

  .back-btn {
    background: none; border: none; cursor: none; font-family: var(--font-body);
    font-size: 13px; color: var(--text-3); transition: color 0.2s;
  }
  .back-btn:hover { color: var(--text-2); }

  .success-icon {
    width: 72px; height: 72px;
    background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 28px; margin: 0 auto 24px; color: var(--emerald);
    box-shadow: 0 0 40px rgba(16,185,129,0.2);
  }
`;
