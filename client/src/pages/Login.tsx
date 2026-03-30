import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { OrbBackground, Spinner } from './DesignSystem';

export const Login: React.FC = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(email, password);
      if (!user) { setError('Login failed'); return; }
      if (user.role === 'owner') { setError('Use the Owner Portal for owner accounts.'); return; }
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      if (err.message?.includes('verify')) { navigate('/verify-email', { state: { email } }); return; }
      setError(err.message || 'Connection error');
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{CSS}</style>
      <OrbBackground intensity="normal">
        <div className="login-page">
          {/* Left panel */}
          <aside className="login-left fade-up">
            <Link to="/" className="brand">
              <span className="brand-icon">⬡</span>
              <span className="brand-name">SafeStay</span>
            </Link>

            <div className="left-body">
              <h1 className="left-headline">
                Know before<br />
                <em>you move in.</em>
              </h1>
              <p className="left-sub">
                Real safety data from verified residents. No fake reviews. Just accountability.
              </p>

              <ul className="feature-list">
                {FEATURES.map((f, i) => (
                  <li key={i} className="feature-item fade-up" style={{ animationDelay: `${0.15 + i * 0.08}s` }}>
                    <span className="feature-dot" style={{ background: f.color }} />
                    <div>
                      <strong>{f.title}</strong>
                      <span>{f.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <blockquote className="testimonial fade-up fade-up-5">
              <p>"Found water issues in 3 PGs near my college BEFORE signing. Saved me from a nightmare."</p>
              <cite>— Priya S., Engineering Student</cite>
            </blockquote>
          </aside>

          {/* Right panel */}
          <main className="login-right">
            <div className="form-card glass-hi fade-up fade-up-2">
              <p className="form-eyebrow">Student Portal</p>
              <h2 className="form-heading">Welcome back</h2>
              <p className="form-sub">Access your safety dashboard and reports.</p>

              {error && <div className="ss-error" style={{ marginBottom: 20 }}>{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="field-group">
                  <label className="field-label">Email Address</label>
                  <div className="field-wrap">
                    <span className="fi">✉</span>
                    <input type="email" className="ss-input ss-input-icon"
                      placeholder="you@university.edu"
                      value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>

                <div className="field-group">
                  <div className="field-row">
                    <label className="field-label" style={{ marginBottom: 0 }}>Password</label>
                    <Link to="/forgot-password" className="forgot-link">Forgot?</Link>
                  </div>
                  <div className="field-wrap">
                    <span className="fi">🔒</span>
                    <input type={showPass ? 'text' : 'password'} className="ss-input ss-input-icon"
                      placeholder="••••••••"
                      value={password} onChange={e => setPassword(e.target.value)} required />
                    <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                      {showPass ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="ss-btn ss-btn-full" style={{ marginTop: 8 }}>
                  {loading ? <Spinner /> : null}
                  {loading ? 'Signing in…' : 'Access Dashboard →'}
                </button>
              </form>

              <div className="divider"><span>New here?</span></div>

              <Link to="/register" className="ss-btn ss-btn-ghost ss-btn-full" style={{ textDecoration: 'none', textAlign: 'center' }}>
                Create a student account →
              </Link>

              <p className="footer-note">
                Property owner? <Link to="/owner/login">Owner Portal</Link>
              </p>
            </div>
          </main>
        </div>
      </OrbBackground>
    </>
  );
};

const FEATURES = [
  { title: 'Verified Reports Only', desc: 'Every report tied to a real resident.', color: '#6366f1' },
  { title: 'Live Trust Scores',     desc: 'Safety scores updated in real-time.',   color: '#8b5cf6' },
  { title: 'Owner Accountability',  desc: 'Owners must resolve issues publicly.',  color: '#10b981' },
];

const CSS = `
  .login-page { min-height: 100vh; display: flex; align-items: stretch; }

  .login-left {
    display: none; width: 44%;
    flex-direction: column; justify-content: space-between;
    padding: 52px 56px; border-right: 1px solid var(--border);
  }
  @media(min-width: 1024px) { .login-left { display: flex; } }

  .brand {
    display: flex; align-items: center; gap: 10px; text-decoration: none;
    color: var(--text-1); font-weight: 700; font-size: 16px; letter-spacing: -0.03em;
  }
  .brand-icon {
    font-size: 22px;
    background: linear-gradient(135deg, var(--indigo), var(--violet));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }

  .left-body { flex: 1; display: flex; flex-direction: column; justify-content: center; }
  .left-headline {
    font-size: clamp(2.4rem, 3.5vw, 3.4rem); font-weight: 700; line-height: 1.05;
    letter-spacing: -0.04em; color: var(--text-1); margin-bottom: 16px;
  }
  .left-headline em {
    font-style: normal;
    background: linear-gradient(120deg, var(--indigo), var(--violet));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .left-sub { color: var(--text-2); font-size: 15px; line-height: 1.65; margin-bottom: 40px; max-width: 340px; }

  .feature-list { list-style: none; display: flex; flex-direction: column; gap: 14px; }
  .feature-item {
    display: flex; align-items: flex-start; gap: 14px;
    padding: 14px 16px; background: var(--panel);
    border: 1px solid var(--border); border-radius: var(--r-md);
    transition: border-color 0.25s, transform 0.2s;
  }
  .feature-item:hover { border-color: rgba(99,102,241,0.25); transform: translateX(3px); }
  .feature-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
  .feature-item strong { display: block; font-size: 13px; font-weight: 600; color: var(--text-1); margin-bottom: 2px; }
  .feature-item span { font-size: 12px; color: var(--text-2); }

  .testimonial {
    padding: 18px 20px; border-left: 2px solid var(--indigo);
    background: var(--panel); border-radius: 0 var(--r-sm) var(--r-sm) 0;
  }
  .testimonial p { font-size: 13px; color: var(--text-2); line-height: 1.65; font-style: italic; margin-bottom: 8px; }
  .testimonial cite { font-size: 11px; font-weight: 600; color: var(--indigo); font-style: normal; }

  .login-right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 24px; }

  .form-card { width: 100%; max-width: 400px; padding: 44px 40px; }
  .form-eyebrow {
    font-size: 10px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.14em; color: var(--indigo); margin-bottom: 10px;
  }
  .form-heading { font-size: 2rem; font-weight: 700; letter-spacing: -0.04em; color: var(--text-1); margin-bottom: 6px; }
  .form-sub { font-size: 13px; color: var(--text-2); margin-bottom: 32px; line-height: 1.5; }

  .field-group { margin-bottom: 18px; }
  .field-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .field-wrap { position: relative; }

  .fi { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 14px; pointer-events: none; opacity: 0.5; }
  .eye-btn {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: none; font-size: 14px; opacity: 0.5; transition: opacity 0.2s;
  }
  .eye-btn:hover { opacity: 1; }

  .forgot-link { font-size: 12px; font-weight: 600; color: var(--indigo); text-decoration: none; }
  .forgot-link:hover { color: var(--violet); }

  .divider { display: flex; align-items: center; gap: 12px; margin: 24px 0; }
  .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .divider span { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); }

  .footer-note { text-align: center; margin-top: 18px; font-size: 12px; color: var(--text-3); }
  .footer-note a { color: var(--indigo); text-decoration: none; font-weight: 600; }
  .footer-note a:hover { color: var(--violet); }
`;
