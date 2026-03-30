import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { OrbBackground, Spinner } from './DesignSystem';

export default function OwnerRegister() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', propertyName: '', propertyCount: '1-2' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/auth/register-owner`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password, propertyName: form.propertyName, propertyCount: form.propertyCount, role: 'owner' }) });
      const data = await res.json();
      if (res.ok && data.success) { localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user)); await login(form.email.trim().toLowerCase(), form.password); window.location.href = '/owner/dashboard'; }
      else setError(data.message || 'Registration failed');
    } catch { setError('Connection error'); } finally { setLoading(false); }
  };

  return (
    <>
      <style>{CSS}</style>
      <OrbBackground intensity="subtle" accentColor="059669">
        <div className="or-page">
          <div className="or-wrap">
            {/* Left sidebar */}
            <aside className="or-sidebar fade-up">
              <Link to="/" className="brand">
                <span className="brand-icon">⬡</span> SafeStay
              </Link>

              <div>
                <h2 className="or-headline">Start Building<br /><em>Tenant Trust.</em></h2>
                <ul className="or-benefits">
                  {BENEFITS.map((b, i) => (
                    <li key={i} className="or-benefit fade-up" style={{ animationDelay: `${0.1 + i * 0.07}s` }}>
                      <span className="or-check">✓</span>
                      <div>
                        <strong>{b.title}</strong>
                        <span>{b.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <blockquote className="or-quote">
                <p>"Since joining SafeStay, my property's trust rating increased by 40%, and my vacancy rate dropped significantly."</p>
                <cite>— Sarah J., Property Manager</cite>
              </blockquote>
            </aside>

            {/* Form */}
            <main className="or-form-side fade-up fade-up-2">
              <div>
                <p className="form-eyebrow" style={{ color: 'var(--emerald)' }}>Owner Registration</p>
                <h2 className="form-heading">Register Your Property</h2>
                <p className="form-sub">Join the platform trusted by 10,000+ students.</p>
              </div>

              {error && <div className="ss-error" style={{ marginBottom: 20 }}>{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="field-group">
                    <label className="field-label">Full Name</label>
                    <input name="name" type="text" className="ss-input" placeholder="Jane Doe"
                      value={form.name} onChange={set} required />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Work Email</label>
                    <input name="email" type="email" className="ss-input" placeholder="jane@company.com"
                      value={form.email} onChange={set} required />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Main Property Name</label>
                    <input name="propertyName" type="text" className="ss-input" placeholder="Evergreen Apartments"
                      value={form.propertyName} onChange={set} required />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Properties Managed</label>
                    <select name="propertyCount" className="ss-input" value={form.propertyCount} onChange={set} style={{ appearance: 'none', cursor: 'pointer' }}>
                      <option value="1-2">1-2 Properties</option>
                      <option value="3-5">3-5 Properties</option>
                      <option value="5-10">5-10 Properties</option>
                      <option value="10+">10+ Properties</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Password</label>
                    <input name="password" type="password" className="ss-input" placeholder="••••••••"
                      value={form.password} onChange={set} required minLength={6} />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Confirm Password</label>
                    <input name="confirmPassword" type="password" className="ss-input" placeholder="••••••••"
                      value={form.confirmPassword} onChange={set} required minLength={6} />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="ss-btn ss-btn-emerald ss-btn-full" style={{ marginTop: 8 }}>
                  {loading ? <Spinner /> : null}
                  {loading ? 'Creating Account…' : 'Start Building Trust →'}
                </button>
              </form>

              <p className="footer-note">
                Already have an account? <Link to="/owner/login">Sign in</Link>
              </p>
              <p className="footer-note" style={{ marginTop: 6 }}>
                Student? <Link to="/register">Register here</Link>
              </p>
              <p style={{ marginTop: 16, fontSize: 10, color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                By registering, you agree to our Terms of Service and Privacy Policy regarding property ownership verification.
              </p>
            </main>
          </div>
        </div>
      </OrbBackground>
    </>
  );
}

const BENEFITS = [
  { title: 'Public Accountability', desc: 'Respond to student concerns publicly.' },
  { title: 'Boost Your Rating', desc: 'Resolve issues quickly to improve your score.' },
  { title: 'Competitive Edge', desc: 'Stand out with a verified profile.' },
  { title: 'Quality Tenants', desc: 'Attract safety-conscious residents.' },
];

const CSS = `
  .or-page {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    padding: 40px 24px;
  }

  .or-wrap {
    display: flex;
    width: 100%; max-width: 980px;
    background: rgba(12,12,22,0.85);
    backdrop-filter: blur(40px);
    border: 1px solid var(--border);
    border-radius: 32px;
    overflow: hidden;
    box-shadow: 0 40px 120px rgba(0,0,0,0.7);
  }

  .or-sidebar {
    display: none;
    width: 360px; flex-shrink: 0;
    flex-direction: column; justify-content: space-between;
    padding: 48px 40px;
    background: rgba(0,0,0,0.3);
    border-right: 1px solid var(--border);
  }
  @media(min-width: 900px) { .or-sidebar { display: flex; } }

  .brand {
    display: flex; align-items: center; gap: 8px;
    text-decoration: none; color: var(--text-1);
    font-weight: 700; font-size: 15px; letter-spacing: -0.02em;
    margin-bottom: 40px;
  }
  .brand-icon {
    font-size: 20px;
    background: linear-gradient(135deg, var(--indigo), var(--violet));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }

  .or-headline {
    font-size: 2.2rem; font-weight: 700; letter-spacing: -0.04em;
    line-height: 1.1; color: var(--text-1); margin-bottom: 32px;
  }
  .or-headline em {
    font-style: normal; color: var(--emerald);
  }

  .or-benefits { list-style: none; display: flex; flex-direction: column; gap: 18px; }
  .or-benefit { display: flex; align-items: flex-start; gap: 12px; }
  .or-check {
    width: 20px; height: 20px; border-radius: 50%;
    background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; color: var(--emerald); flex-shrink: 0; margin-top: 2px;
  }
  .or-benefit strong { display: block; font-size: 13px; font-weight: 600; color: var(--text-1); margin-bottom: 2px; }
  .or-benefit span   { font-size: 12px; color: var(--text-2); }

  .or-quote {
    padding: 16px 18px;
    background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.2);
    border-radius: var(--r-md);
  }
  .or-quote p    { font-size: 12px; color: var(--text-2); line-height: 1.65; font-style: italic; margin-bottom: 8px; }
  .or-quote cite { font-size: 11px; font-weight: 600; color: var(--emerald); font-style: normal; }

  .or-form-side {
    flex: 1; padding: 48px 44px;
    display: flex; flex-direction: column;
    gap: 4px;
  }

  .form-eyebrow {
    font-size: 10px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.14em; margin-bottom: 8px;
  }
  .form-heading {
    font-size: 1.7rem; font-weight: 700; letter-spacing: -0.04em;
    color: var(--text-1); margin-bottom: 4px;
  }
  .form-sub { font-size: 13px; color: var(--text-2); margin-bottom: 28px; }

  .form-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  }
  @media(max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }

  .field-group { }

  .footer-note {
    text-align: center; margin-top: 14px; font-size: 12px; color: var(--text-2);
  }
  .footer-note a { color: var(--emerald); font-weight: 600; text-decoration: none; }
`;
