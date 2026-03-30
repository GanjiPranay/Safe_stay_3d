import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { OrbBackground, Spinner } from './DesignSystem';

export default function OwnerLogin() {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const user = await login(email.trim().toLowerCase(), password);
      if (user.role !== 'owner') {
        setError('This account is not a property owner. Please use student login instead.');
        localStorage.removeItem('token'); localStorage.removeItem('user');
        setLoading(false); return;
      }
      window.location.href = '/owner/dashboard';
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
      setLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <OrbBackground intensity="normal" accentColor="059669">
        <div className="ol-page">
          {/* Left sidebar */}
          <aside className="ol-left fade-up">
            <Link to="/" className="brand">
              <span className="brand-icon" style={{ color: 'var(--emerald)' }}>⬡</span>
              <span>SafeStay</span>
            </Link>

            <div className="ol-body">
              <p className="ol-eyebrow">Property Owner Portal</p>
              <h1 className="ol-headline">
                Build trust,<br />
                <em>attract tenants.</em>
              </h1>
              <p className="ol-sub">
                Manage properties, respond to safety reports, and demonstrate accountability to safety-conscious students.
              </p>

              <ul className="ol-feature-list">
                {FEATURES.map((f, i) => (
                  <li key={i} className="ol-feature fade-up" style={{ animationDelay: `${0.1 + i * 0.07}s` }}>
                    <span className="ol-check">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="ol-trust-badge">
              <span className="ol-trust-dot" />
              Trusted by 500+ Property Owners
            </div>
          </aside>

          {/* Form */}
          <main className="ol-right">
            <div className="form-card glass-hi fade-up fade-up-2">
              <div className="ol-icon-wrap">
                <span>🏠</span>
              </div>

              <p className="form-eyebrow" style={{ color: 'var(--emerald)' }}>Owner Access</p>
              <h2 className="form-heading">Welcome back, Owner</h2>
              <p className="form-sub">Manage your properties and build trust.</p>

              {error && <div className="ss-error" style={{ marginBottom: 20 }}>{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="field-group">
                  <label className="field-label">Email Address</label>
                  <input type="email" className="ss-input" placeholder="owner@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                </div>

                <div className="field-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label className="field-label" style={{ marginBottom: 0 }}>Password</label>
                    <Link to="/forgot-password" className="forgot-link">Forgot?</Link>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input type={showPass ? 'text' : 'password'} className="ss-input" placeholder="••••••••"
                      value={password} onChange={e => setPassword(e.target.value)} required />
                    <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                      {showPass ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="ss-btn ss-btn-emerald ss-btn-full" style={{ marginTop: 8 }}>
                  {loading ? <Spinner /> : null}
                  {loading ? 'Signing in…' : 'Access Dashboard →'}
                </button>
              </form>

              <div className="divider"><span>New here?</span></div>

              <Link to="/owner/register" className="ss-btn ss-btn-ghost ss-btn-full" style={{ textDecoration: 'none', textAlign: 'center' }}>
                Register Your Property →
              </Link>

              <p className="footer-note">
                Are you a student? <Link to="/login">Student Login</Link>
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                <span style={{ fontSize: 12, opacity: 0.5 }}>🔒</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Your data is encrypted and secure</span>
              </div>
            </div>
          </main>
        </div>
      </OrbBackground>
    </>
  );
}

const FEATURES = [
  'Respond to safety reports with proof',
  'Track your property trust scores',
  'Attract safety-conscious tenants',
  'Stand out from unverified competitors',
];

const CSS = `
  .ol-page {
    min-height: 100vh;
    display: flex; align-items: stretch;
  }

  .ol-left {
    display: none;
    width: 44%;
    flex-direction: column;
    justify-content: space-between;
    padding: 52px 56px;
    border-right: 1px solid var(--border);
  }
  @media(min-width: 1024px) { .ol-left { display: flex; } }

  .brand {
    display: flex; align-items: center; gap: 10px;
    text-decoration: none; color: var(--text-1);
    font-weight: 700; font-size: 16px; letter-spacing: -0.02em;
  }
  .brand-icon { font-size: 22px; }

  .ol-body { flex: 1; display: flex; flex-direction: column; justify-content: center; }

  .ol-eyebrow {
    font-size: 10px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.14em; color: var(--emerald); margin-bottom: 14px;
  }
  .ol-headline {
    font-size: clamp(2.2rem, 3vw, 3.2rem); font-weight: 700;
    letter-spacing: -0.04em; line-height: 1.05; color: var(--text-1);
    margin-bottom: 16px;
  }
  .ol-headline em {
    font-style: normal;
    background: linear-gradient(120deg, #059669, #10b981);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .ol-sub { color: var(--text-2); font-size: 14px; line-height: 1.65; margin-bottom: 36px; max-width: 340px; }

  .ol-feature-list { list-style: none; display: flex; flex-direction: column; gap: 12px; }
  .ol-feature {
    display: flex; align-items: center; gap: 12px;
    font-size: 13px; color: var(--text-2);
  }
  .ol-check {
    width: 22px; height: 22px; border-radius: 50%;
    background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; color: var(--emerald); flex-shrink: 0;
  }

  .ol-trust-badge {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 12px; font-weight: 600; color: var(--text-2);
    border: 1px solid var(--border); padding: 8px 14px;
    border-radius: 100px;
  }
  .ol-trust-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--emerald); }

  .ol-right {
    flex: 1; display: flex; align-items: center; justify-content: center;
    padding: 40px 24px;
  }

  .form-card {
    width: 100%; max-width: 400px;
    padding: 44px 40px;
  }

  .ol-icon-wrap {
    width: 56px; height: 56px;
    background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25);
    border-radius: 16px; display: flex; align-items: center; justify-content: center;
    font-size: 22px; margin-bottom: 24px;
  }

  .form-eyebrow {
    font-size: 10px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.14em; margin-bottom: 8px;
  }
  .form-heading {
    font-size: 1.7rem; font-weight: 700; letter-spacing: -0.04em;
    color: var(--text-1); margin-bottom: 6px;
  }
  .form-sub { font-size: 13px; color: var(--text-2); margin-bottom: 28px; }

  .field-group { margin-bottom: 18px; }

  .eye-btn {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; font-size: 14px; opacity: 0.5;
  }
  .eye-btn:hover { opacity: 1; }

  .forgot-link { font-size: 12px; font-weight: 600; color: var(--emerald); text-decoration: none; }
  .forgot-link:hover { color: #34d399; }

  .divider {
    display: flex; align-items: center; gap: 12px; margin: 24px 0;
  }
  .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .divider span { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); }

  .footer-note {
    text-align: center; margin-top: 18px; font-size: 12px; color: var(--text-3);
  }
  .footer-note a { color: var(--indigo); text-decoration: none; font-weight: 600; }
`;
