import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { OrbBackground, Spinner } from './DesignSystem';

export default function VerifyEmail() {
  const API      = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || '';

  const [email, setEmail]           = useState(emailFromState);
  const [digits, setDigits]         = useState(['', '', '', '', '', '']);
  const [otp, setOtp]               = useState('');
  const [loading, setLoading]       = useState(false);
  const [resendLoading, setResend]  = useState(false);
  const [message, setMessage]       = useState('');
  const [error, setError]           = useState('');
  const [countdown, setCountdown]   = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(t); } }, [countdown]);
  useEffect(() => { setOtp(digits.join('')); }, [digits]);

  const handleDigit = (i: number, v: string) => {
    const c = v.replace(/\D/g, '').slice(-1);
    const next = [...digits]; next[i] = c; setDigits(next);
    if (c && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (p.length === 6) { setDigits(p.split('')); inputRefs.current[5]?.focus(); }
    e.preventDefault();
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setMessage(''); setLoading(true);
    try {
      const res  = await fetch(`${API}/api/otp/verify-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim(), otp }) });
      const data = await res.json();
      if (data.success) { setMessage(data.message); setTimeout(() => navigate('/login'), 2000); }
      else setError(data.message);
    } catch { setError('Connection error'); } finally { setLoading(false); }
  };

  const resend = async () => {
    if (countdown > 0 || !email.trim()) return;
    setResend(true);
    try {
      const res  = await fetch(`${API}/api/otp/send-verification`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() }) });
      const data = await res.json();
      if (data.success) { setMessage('New OTP sent!'); setCountdown(60); } else setError(data.message);
    } catch { setError('Connection error'); } finally { setResend(false); }
  };

  return (
    <>
      <style>{CSS}</style>
      <OrbBackground intensity="subtle" accentColor="10b981">
        <div className="ve-page">
          <div className="ve-card glass-hi fade-up">
            <div className="ve-icon-wrap">
              <span className="ve-icon">📧</span>
            </div>

            <p className="form-eyebrow">Email Verification</p>
            <h2 className="form-heading">Check Your Inbox</h2>
            <p className="form-sub">
              We sent a 6-digit code to{' '}
              <strong style={{ color: 'var(--text-1)' }}>{email || 'your email'}</strong>.
              Enter it below to activate your account.
            </p>

            <form onSubmit={verify}>
              {!emailFromState && (
                <div className="field-group">
                  <label className="field-label">Email Address</label>
                  <input type="email" className="ss-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
                </div>
              )}

              <div className="field-group">
                <label className="field-label">Verification Code</label>
                <div className="digits-row" onPaste={handlePaste}>
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={el => inputRefs.current[i] = el}
                      type="text" inputMode="numeric" maxLength={1}
                      value={d}
                      onChange={e => handleDigit(i, e.target.value)}
                      onKeyDown={e => handleKey(i, e)}
                      className={`digit-cell ${d ? 'digit-filled' : ''}`}
                    />
                  ))}
                </div>
              </div>

              {error   && <div className="ss-error"   style={{ marginBottom: 16 }}>{error}</div>}
              {message && <div className="ss-success" style={{ marginBottom: 16 }}>{message}</div>}

              <button type="submit" disabled={loading || otp.length !== 6} className="ss-btn ss-btn-emerald ss-btn-full">
                {loading ? <Spinner /> : null}
                {loading ? 'Verifying…' : 'Verify & Activate →'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <p style={{ color: 'var(--text-3)', fontSize: 12, marginBottom: 8 }}>Didn't receive it?</p>
              <button onClick={resend} disabled={resendLoading || countdown > 0} className="resend-btn">
                {resendLoading ? 'Sending…' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button onClick={() => navigate('/login')} className="back-btn">← Back to Login</button>
            </div>
          </div>
        </div>
      </OrbBackground>
    </>
  );
}

const CSS = `
  .ve-page {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    padding: 40px 24px;
  }

  .ve-card {
    width: 100%; max-width: 420px;
    padding: 48px 40px;
    text-align: center;
  }

  .ve-icon-wrap {
    width: 72px; height: 72px;
    background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2);
    border-radius: 20px; display: flex; align-items: center; justify-content: center;
    margin: 0 auto 28px; font-size: 28px;
  }

  .form-eyebrow {
    font-size: 10px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.14em; color: var(--emerald); margin-bottom: 10px;
  }
  .form-heading {
    font-size: 1.8rem; font-weight: 700; letter-spacing: -0.04em;
    color: var(--text-1); margin-bottom: 6px;
  }
  .form-sub { font-size: 13px; color: var(--text-2); margin-bottom: 32px; line-height: 1.55; }

  .field-group { margin-bottom: 24px; text-align: left; }

  .digits-row {
    display: flex; gap: 10px; justify-content: center;
  }

  .digit-cell {
    width: 52px; height: 60px;
    background: var(--panel); border: 1px solid var(--border);
    border-radius: var(--r-sm); text-align: center;
    font-size: 1.5rem; font-weight: 700; color: var(--text-1);
    font-family: var(--font-body); outline: none;
    transition: all 0.2s; caret-color: transparent;
  }
  .digit-cell:focus {
    border-color: var(--border-hi);
    background: rgba(99,102,241,0.08);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
    transform: scale(1.04);
  }
  .digit-filled {
    border-color: rgba(16,185,129,0.4);
    color: #34d399;
  }

  .resend-btn {
    background: none; border: none; cursor: pointer;
    font-family: var(--font-body); font-size: 13px; font-weight: 600;
    color: var(--emerald); transition: color 0.2s;
  }
  .resend-btn:disabled { color: var(--text-3); cursor: default; }

  .back-btn {
    background: none; border: none; cursor: pointer;
    font-family: var(--font-body); font-size: 13px;
    color: var(--text-3); transition: color 0.2s;
  }
  .back-btn:hover { color: var(--text-2); }
`;
