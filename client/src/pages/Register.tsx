import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { OrbBackground, Spinner } from './DesignSystem';

export const Register: React.FC = () => {
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [role, setRole]             = useState<'student' | 'owner'>('student');
  const [agreed, setAgreed]         = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [strength, setStrength]     = useState(0);
  const [showPw, setShowPw]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailError, setEmailError] = useState('');

  const { register } = useAuth();
  const navigate     = useNavigate();

  useEffect(() => {
    let s = 0;
    if (password.length > 5) s++;
    if (password.length > 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    setStrength(s);
  }, [password]);

  const validateEmail = (val: string) => {
    if (!val) { setEmailError(''); return; }
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    setEmailError(ok ? '' : 'Please enter a valid email address');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPw) { setError('Passwords do not match'); return; }
    if (password.length < 6)   { setError('Password must be at least 6 characters'); return; }
    if (!agreed) { setError('Please accept the Terms of Service to continue'); return; }
    setLoading(true);
    try {
      await register(name, email, password, role);
      navigate('/verify-email', { state: { email } });
    } catch (err: any) {
      if (err.message?.includes('verify')) { navigate('/verify-email', { state: { email } }); return; }
      setError(err.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const strengthLabel = strength < 2 ? 'Weak' : strength < 4 ? 'Medium' : 'Strong';
  const strengthColor = strength < 2 ? '#f43f5e' : strength < 4 ? '#f59e0b' : '#10b981';
  const pwMatch = confirmPw.length > 0 && password === confirmPw;
  const pwMismatch = confirmPw.length > 0 && password !== confirmPw;

  return (
    <>
      <style>{CSS}</style>
      <OrbBackground intensity="subtle" accentColor="8b5cf6">
        <div className="reg-page">
          <div className="reg-card glass-hi fade-up">
            <div className="reg-header">
              <Link to="/" className="brand">
                <span className="brand-icon">⬡</span> SafeStay
              </Link>
              <div>
                <p className="form-eyebrow">Join for free</p>
                <h2 className="form-heading">Create your account</h2>
                <p className="form-sub">Start your journey towards safer student housing.</p>
              </div>
            </div>

            {error && <div className="ss-error" style={{ marginBottom: 20 }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="field-group">
                  <label className="field-label">Full Name</label>
                  <input type="text" className="ss-input" placeholder="Jane Doe"
                    value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="field-group">
                  <label className="field-label">I am a…</label>
                  <select className="ss-input" value={role} onChange={e => setRole(e.target.value as any)}
                    style={{ appearance: 'none', cursor: 'none' }}>
                    <option value="student">Student / Resident</option>
                    <option value="owner">Property Owner</option>
                  </select>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Email Address</label>
                <input type="email" className="ss-input" placeholder="name@university.edu"
                  value={email}
                  onChange={e => { setEmail(e.target.value); validateEmail(e.target.value); }}
                  required
                  style={emailError ? { borderColor: 'rgba(244,63,94,0.5)' } : {}}
                />
                {emailError && <p style={{ fontSize: 11, color: '#fda4af', marginTop: 6 }}>{emailError}</p>}
              </div>

              <div className="field-group">
                <label className="field-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} className="ss-input" placeholder="Min. 6 characters"
                    value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                  <button type="button" className="eye-btn" onClick={() => setShowPw(!showPw)}>
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="strength-bar">
                    <div className="strength-track">
                      {[1,2,3,4,5].map(n => (
                        <div key={n} className="strength-seg"
                          style={{ background: n <= strength ? strengthColor : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
                      ))}
                    </div>
                    <span className="strength-label" style={{ color: strengthColor }}>{strengthLabel}</span>
                  </div>
                )}
              </div>

              <div className="field-group">
                <label className="field-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showConfirm ? 'text' : 'password'} className="ss-input" placeholder="Repeat your password"
                    value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required minLength={6}
                    style={pwMismatch ? { borderColor: 'rgba(244,63,94,0.5)' } : pwMatch ? { borderColor: 'rgba(16,185,129,0.5)' } : {}}
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? '🙈' : '👁'}
                  </button>
                  {pwMatch    && <span className="pw-status pw-ok">✓</span>}
                  {pwMismatch && <span className="pw-status pw-err">✕</span>}
                </div>
                {pwMismatch && <p style={{ fontSize: 11, color: '#fda4af', marginTop: 6 }}>Passwords do not match</p>}
              </div>

              {/* Terms checkbox */}
              <label className="terms-row">
                <div className={`checkbox-wrap ${agreed ? 'checked' : ''}`} onClick={() => setAgreed(!agreed)}>
                  {agreed && <span className="checkbox-tick">✓</span>}
                </div>
                <span className="terms-text">
                  I agree to the{' '}
                  <a href="#" onClick={e => e.preventDefault()}>Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" onClick={e => e.preventDefault()}>Privacy Policy</a>
                </span>
              </label>

              <button type="submit" disabled={loading || !!emailError || pwMismatch} className="ss-btn ss-btn-full" style={{ marginTop: 8 }}>
                {loading ? <Spinner /> : null}
                {loading ? 'Creating account…' : 'Start Protecting Yourself →'}
              </button>
            </form>

            <p className="footer-note" style={{ marginTop: 24 }}>
              Already have an account?{' '}
              <Link to="/login">Sign in here</Link>
            </p>
          </div>
        </div>
      </OrbBackground>
    </>
  );
};

const CSS = `
  .reg-page {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 40px 24px;
  }
  .reg-card { width: 100%; max-width: 520px; padding: 48px 44px; }
  .reg-header { margin-bottom: 32px; }

  .brand {
    display: inline-flex; align-items: center; gap: 8px; text-decoration: none;
    color: var(--text-1); font-weight: 700; font-size: 15px; letter-spacing: -0.02em;
    margin-bottom: 28px;
  }
  .brand-icon {
    font-size: 20px;
    background: linear-gradient(135deg, var(--indigo), var(--violet));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .form-eyebrow { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: var(--violet); margin-bottom: 8px; }
  .form-heading { font-size: 1.8rem; font-weight: 700; letter-spacing: -0.04em; color: var(--text-1); margin-bottom: 6px; }
  .form-sub { font-size: 13px; color: var(--text-2); }

  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media(max-width: 480px) { .form-row { grid-template-columns: 1fr; } }
  .field-group { margin-bottom: 18px; }

  .eye-btn {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: none; font-size: 14px; opacity: 0.5; transition: opacity 0.2s;
  }
  .eye-btn:hover { opacity: 1; }

  .pw-status {
    position: absolute; right: 44px; top: 50%; transform: translateY(-50%);
    font-size: 13px; font-weight: 700;
  }
  .pw-ok  { color: #10b981; }
  .pw-err { color: #f43f5e; }

  .strength-bar { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
  .strength-track { flex: 1; display: flex; gap: 3px; }
  .strength-seg { flex: 1; height: 3px; border-radius: 2px; }
  .strength-label { font-size: 11px; font-weight: 600; min-width: 42px; }

  .terms-row {
    display: flex; align-items: flex-start; gap: 10px; margin-bottom: 20px;
    cursor: none; user-select: none;
  }
  .checkbox-wrap {
    width: 18px; height: 18px; border-radius: 5px; flex-shrink: 0;
    border: 1px solid var(--border); background: var(--panel);
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; margin-top: 1px;
  }
  .checkbox-wrap.checked {
    background: var(--indigo); border-color: var(--indigo);
  }
  .checkbox-tick { font-size: 11px; font-weight: 700; color: white; }
  .terms-text { font-size: 12px; color: var(--text-2); line-height: 1.5; }
  .terms-text a { color: var(--indigo); text-decoration: none; font-weight: 600; }

  .footer-note { text-align: center; font-size: 12px; color: var(--text-2); }
  .footer-note a { color: var(--indigo); text-decoration: none; font-weight: 600; }
`;
