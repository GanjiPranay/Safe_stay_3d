import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { OrbBackground } from './DesignSystem';
import { ScrollReveal, StaggerReveal, useParallax } from './useParallax';
import { MagneticButton } from './MagneticButton';

/* ─── Animated Counter ─── */
const AnimatedCounter: React.FC<{ end: number; suffix?: string; duration?: number }> = ({
  end, suffix = '', duration = 2000
}) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect(); } }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let startTime: number;
    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

export const Home: React.FC = () => {
  const { user } = useAuth();
  const parallaxRef = useParallax(0.25);

  const features = [
    { icon: '🗺️', title: 'Interactive Safety Map',   desc: 'Search any location and instantly see safe, caution, and unsafe accommodations within your radius.', accent: '#10b981' },
    { icon: '📊', title: 'Dynamic Trust Scores',      desc: 'Real-time 0–100 scores based on verified reports, resolutions, and peer confirmation.',               accent: '#6366f1' },
    { icon: '📸', title: 'Evidence-Based Reports',    desc: 'Photo and document proof required. No more unverifiable claims — only hard evidence.',                 accent: '#8b5cf6' },
    { icon: '🔄', title: 'Resolution Tracking',       desc: 'Owners must resolve issues with proof. Students verify fixes. Full accountability loop.',               accent: '#f59e0b' },
  ];

  const steps = [
    { n: '01', title: 'Search Location',  desc: 'Find accommodations near your college on our interactive map.' },
    { n: '02', title: 'Check Trust Score',desc: 'View 0–100 safety ratings calculated from real student reports.' },
    { n: '03', title: 'Read Reports',     desc: 'See verified issues with photo evidence and owner responses.' },
    { n: '04', title: 'Move In Safely',   desc: 'Make an informed decision backed by real community data.' },
  ];

  const testimonials = [
    { quote: "Found serious water contamination issues in 3 PGs near my college BEFORE signing. This platform saved me from a nightmare.", author: "Priya S.", role: "Engineering Student, Hyderabad" },
    { quote: "As a parent, I could verify my daughter's hostel had zero unresolved complaints. The transparency is incredible.", author: "Rajesh M.", role: "Parent" },
    { quote: "After addressing reports publicly, our trust score jumped from 52 to 89. Genuine accountability attracts quality tenants.", author: "Kavitha R.", role: "Property Owner, Bangalore" },
  ];

  return (
    <>
      <style>{CSS}</style>
      <OrbBackground intensity="high">
        <div className="home-page">
          {/* Navbar */}
          <nav className="home-nav">
            <div className="home-nav-inner">
              <Link to="/" className="home-brand">
                <span className="home-brand-icon">⬡</span>
                <span>SafeStay</span>
              </Link>
              <div className="home-nav-links">
                <Link to="/accommodations" className="home-nav-link">Browse</Link>
                {!user && <Link to="/login" className="home-nav-link">Login</Link>}
                {user && <Link to={user.role === 'owner' ? '/owner/dashboard' : '/dashboard'} className="home-nav-link">Dashboard</Link>}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {user ? (
                  <Link to={user.role === 'owner' ? '/owner/dashboard' : '/dashboard'} className="ss-btn" style={{ textDecoration: 'none', fontSize: 13, padding: '10px 20px' }}>Dashboard →</Link>
                ) : (
                  <>
                    <Link to="/login" className="ss-btn ss-btn-ghost" style={{ textDecoration: 'none', fontSize: 13, padding: '10px 18px' }}>Sign in</Link>
                    <MagneticButton>
                      <Link to="/register" className="ss-btn" style={{ textDecoration: 'none', fontSize: 13, padding: '10px 20px' }}>Get Started →</Link>
                    </MagneticButton>
                  </>
                )}
              </div>
            </div>
          </nav>

          {/* ── HERO ── */}
          <section className="hero-section">
            <div ref={parallaxRef} className="hero-orb-layer" />
            <div className="hero-content fade-up">
              <div className="hero-badge">
                <span className="hero-badge-dot" />
                Trusted by 10,000+ students across India
              </div>
              <h1 className="hero-h1">
                Know Before<br />
                <em>You Move In.</em>
              </h1>
              <p className="hero-sub">
                Real safety data from verified residents. Transparent trust scores. Full owner accountability. No fake reviews — just the truth.
              </p>
              <div className="hero-ctas">
                <MagneticButton>
                  <Link to="/accommodations" className="ss-btn hero-cta-primary" style={{ textDecoration: 'none' }}>
                    🔍 Search Safe Accommodations
                  </Link>
                </MagneticButton>
                <MagneticButton>
                  <Link to="/register" className="ss-btn ss-btn-ghost hero-cta-secondary" style={{ textDecoration: 'none' }}>
                    ⚠️ Report a Safety Issue
                  </Link>
                </MagneticButton>
              </div>
              <div className="hero-note">100% Free · No Hidden Charges · Verified Reports Only</div>
            </div>

            {/* Live stats */}
            <ScrollReveal delay={200}>
              <div className="hero-stats glass">
                {[
                  { label: 'Students Protected', end: 10000, suffix: '+' },
                  { label: 'Reports Filed',      end: 2847,  suffix: ''  },
                  { label: 'Issues Resolved',    end: 1940,  suffix: ''  },
                  { label: 'Cities Covered',     end: 28,    suffix: ''  },
                ].map((s, i) => (
                  <div key={i} className="hero-stat">
                    <div className="hero-stat-num"><AnimatedCounter end={s.end} suffix={s.suffix} /></div>
                    <div className="hero-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </section>

          {/* ── HOW IT WORKS ── */}
          <section className="section">
            <ScrollReveal>
              <span className="eyebrow">How It Works</span>
              <h2 className="section-h2">Find Safe Accommodation in <span style={{ color: '#6366f1' }}>4 Steps</span></h2>
            </ScrollReveal>
            <StaggerReveal stagger={100} className="steps-grid">
              {steps.map((s, i) => (
                <div key={i} className="step-card glass">
                  <div className="step-num">{s.n}</div>
                  <div className="step-title">{s.title}</div>
                  <div className="step-desc">{s.desc}</div>
                </div>
              ))}
            </StaggerReveal>
            <ScrollReveal delay={400} style={{ textAlign: 'center', marginTop: 48 }}>
              <MagneticButton>
                <Link to="/accommodations" className="ss-btn" style={{ textDecoration: 'none', padding: '14px 32px', fontSize: 15 }}>
                  Start Searching Now →
                </Link>
              </MagneticButton>
            </ScrollReveal>
          </section>

          {/* ── FEATURES ── */}
          <div style={{ background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <section className="section">
              <ScrollReveal>
                <span className="eyebrow">Powerful Features</span>
                <h2 className="section-h2">Everything for <span style={{ color: '#6366f1' }}>Safe Decisions</span></h2>
              </ScrollReveal>
              <StaggerReveal stagger={90} className="features-grid">
                {features.map((f, i) => (
                  <div key={i} className="feat-card glass" style={{ borderTop: `2px solid ${f.accent}33` }}>
                    <div className="feat-line" style={{ background: `linear-gradient(90deg, ${f.accent}55, transparent)` }} />
                    <div className="feat-icon">{f.icon}</div>
                    <div className="feat-title">{f.title}</div>
                    <div className="feat-desc">{f.desc}</div>
                  </div>
                ))}
              </StaggerReveal>
            </section>
          </div>

          {/* ── TRUST SCORE ── */}
          <section className="section score-section">
            <div className="score-grid">
              <ScrollReveal>
                <div>
                  <span className="eyebrow">Trust Score System</span>
                  <h2 className="section-h2">Every Accommodation Gets a <span style={{ color: '#6366f1' }}>Dynamic Safety Score</span></h2>
                  <p className="section-sub">Our algorithm calculates a 0–100 score based on verified reports, resolution speed, and peer confirmation. No manipulation. Pure data.</p>
                  <div className="score-tiers">
                    {[
                      { r: '80–100', l: 'Safe',   c: '#10b981', d: 'Minimal issues, quick resolutions' },
                      { r: '50–79',  l: 'Caution', c: '#f59e0b', d: 'Some concerns, check reports' },
                      { r: '0–49',   l: 'Unsafe',  c: '#ef4444', d: 'Multiple unresolved issues' },
                    ].map((t, i) => (
                      <div key={i} className="tier">
                        <div className="tier-dot" style={{ background: t.c, boxShadow: `0 0 10px ${t.c}60` }} />
                        <div className="tier-range">{t.r}</div>
                        <div className="tier-label" style={{ color: t.c }}>{t.l}</div>
                        <div className="tier-desc">{t.d}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              {/* Animated score orb */}
              <ScrollReveal delay={200} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="score-orb-wrap">
                  <div className="score-orb">
                    <div className="score-orb-ring" />
                    <div className="score-orb-ring-2" />
                    <div className="score-orb-inner">
                      <div className="score-num">87</div>
                      <div className="score-label-text">Safe</div>
                      <div className="score-sub-text">Trust Score</div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </section>

          {/* ── STAKEHOLDERS ── */}
          <section className="section">
            <ScrollReveal>
              <span className="eyebrow">For Everyone</span>
              <h2 className="section-h2">Built for <span style={{ color: '#6366f1' }}>Students, Parents & Owners</span></h2>
            </ScrollReveal>
            <StaggerReveal stagger={120} className="stake-grid">
              {[
                { e: '🎓', t: 'For Students', benefits: ['Report issues anonymously but verifiably', 'Search safe accommodations near any location', 'See real photos and evidence, not stock images', 'Verify if owners actually fix problems'], cta: 'Register Free', link: '/register' },
                { e: '👨‍👩‍👧', t: 'For Parents', benefits: ['Verify safety before your child moves in', 'Compare accommodations side-by-side', 'Track safety scores over time', 'Real reports from real students'], cta: 'Search Now', link: '/accommodations' },
                { e: '🏢', t: 'For Good Owners', benefits: ['Build genuine reputation with verified reviews', 'Respond to concerns and show improvements', 'Stand out from low-quality competitors', 'Attract safety-conscious tenants'], cta: 'Register Property', link: '/owner/register' },
              ].map((s, i) => (
                <div key={i} className="stake-card glass">
                  <div className="stake-icon">{s.e}</div>
                  <div className="stake-title">{s.t}</div>
                  <ul className="stake-list">
                    {s.benefits.map((b, j) => (
                      <li key={j}>
                        <span className="stake-check">✓</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                  <MagneticButton style={{ width: '100%' }}>
                    <Link to={s.link} className="stake-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {s.cta} →
                    </Link>
                  </MagneticButton>
                </div>
              ))}
            </StaggerReveal>
          </section>

          {/* ── TESTIMONIALS ── */}
          <div style={{ background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <section className="section">
              <ScrollReveal>
                <span className="eyebrow">Testimonials</span>
                <h2 className="section-h2">Real Stories from <span style={{ color: '#6366f1' }}>Real Users</span></h2>
              </ScrollReveal>
              <StaggerReveal stagger={100} className="testi-grid">
                {testimonials.map((t, i) => (
                  <div key={i} className="testi-card glass">
                    <div className="testi-stars">★★★★★</div>
                    <p className="testi-quote">"{t.quote}"</p>
                    <div className="testi-author">{t.author}</div>
                    <div className="testi-role">{t.role}</div>
                  </div>
                ))}
              </StaggerReveal>
            </section>
          </div>

          {/* ── CTA ── */}
          <section className="cta-section">
            <ScrollReveal style={{ position: 'relative', zIndex: 1 }}>
              <h2 className="cta-h2">Don't Let Your Next Home<br /><span>Become a Nightmare</span></h2>
              <p className="cta-p">Join 10,000+ students who made informed decisions. Your safety is too important to leave to chance.</p>
              <div className="cta-buttons">
                <MagneticButton>
                  <Link to="/accommodations" className="ss-btn cta-btn-primary" style={{ textDecoration: 'none' }}>🔍 Search Safe Accommodations</Link>
                </MagneticButton>
                <MagneticButton>
                  <Link to="/register" className="ss-btn ss-btn-ghost cta-btn-ghost" style={{ textDecoration: 'none' }}>⚠️ Report a Safety Issue</Link>
                </MagneticButton>
              </div>
              <div className="cta-note">100% Free &nbsp;·&nbsp; No Hidden Charges &nbsp;·&nbsp; Verified Reports Only</div>
            </ScrollReveal>
          </section>

          {/* ── FOOTER ── */}
          <footer className="footer">
            <div className="footer-inner">
              <div className="footer-grid">
                <div>
                  <div className="footer-brand">
                    <span style={{ fontSize: 18 }}>⬡</span>
                    SafeStay
                  </div>
                  <p className="footer-desc">Empowering students to make safe accommodation choices through verified reports and transparent ratings.</p>
                  <div className="footer-made">Made with ❤️ for student safety</div>
                </div>
                <div>
                  <div className="footer-col-title">Quick Links</div>
                  <Link to="/accommodations" className="footer-link">Search Accommodations</Link>
                  <Link to="/report"         className="footer-link">Report an Issue</Link>
                  <Link to="/login"          className="footer-link">Student Login</Link>
                  <Link to="/owner/login"    className="footer-link">Owner Login</Link>
                </div>
                <div>
                  <div className="footer-col-title">Contact</div>
                  <div className="footer-link">support@safestay.in</div>
                  <div className="footer-link">+91 98765 43210</div>
                  <div className="footer-link">Hyderabad, India</div>
                </div>
              </div>
              <div className="footer-bottom">© 2025 SafeStay. All rights reserved.</div>
            </div>
          </footer>
        </div>
      </OrbBackground>
    </>
  );
};

const CSS = `
  .home-page { min-height: 100vh; }

  /* Navbar */
  .home-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
    background: rgba(5,5,10,0.82); backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .home-nav-inner {
    max-width: 1200px; margin: 0 auto; padding: 0 32px;
    height: 60px; display: flex; align-items: center; gap: 32px;
  }
  .home-brand {
    display: flex; align-items: center; gap: 10px; text-decoration: none;
    color: var(--text-1); font-weight: 700; font-size: 15px; letter-spacing: -0.03em;
  }
  .home-brand-icon {
    font-size: 22px;
    background: linear-gradient(135deg, var(--indigo), var(--violet));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .home-nav-links { display: flex; gap: 4px; flex: 1; }
  .home-nav-link {
    padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 500;
    color: var(--text-2); text-decoration: none; transition: all 0.2s;
  }
  .home-nav-link:hover { color: var(--text-1); background: rgba(255,255,255,0.05); }

  /* Hero */
  .hero-section {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 120px 24px 60px; position: relative; overflow: hidden;
    text-align: center;
  }
  .hero-orb-layer { position: absolute; inset: 0; pointer-events: none; }

  .hero-content { position: relative; z-index: 1; max-width: 760px; margin: 0 auto; }
  .hero-badge {
    display: inline-flex; align-items: center; gap: 8px; margin-bottom: 32px;
    padding: 7px 16px; border-radius: 100px;
    background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2);
    font-size: 12px; font-weight: 600; color: #a5b4fc;
    letter-spacing: 0.02em;
  }
  .hero-badge-dot {
    width: 6px; height: 6px; border-radius: 50%; background: var(--indigo);
    animation: pulsate 2s ease-in-out infinite;
    box-shadow: 0 0 8px rgba(99,102,241,0.6);
  }
  .hero-h1 {
    font-size: clamp(3rem, 7vw, 5.5rem); font-weight: 700;
    letter-spacing: -0.05em; line-height: 0.97;
    color: var(--text-1); margin-bottom: 24px;
  }
  .hero-h1 em {
    font-style: normal;
    background: linear-gradient(125deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .hero-sub {
    font-size: clamp(15px, 2vw, 18px); color: var(--text-2);
    line-height: 1.7; max-width: 560px; margin: 0 auto 36px;
  }
  .hero-ctas { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-bottom: 20px; }
  .hero-cta-primary { padding: 16px 28px; font-size: 15px; }
  .hero-cta-secondary { padding: 16px 28px; font-size: 15px; }
  .hero-note { font-size: 11px; color: var(--text-3); letter-spacing: 0.05em; }

  .hero-stats {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 1px; background: var(--border);
    margin: 56px auto 0; max-width: 800px; width: 100%;
    border-radius: var(--r-xl); overflow: hidden;
  }
  @media(max-width: 600px) { .hero-stats { grid-template-columns: repeat(2, 1fr); } }
  .hero-stat { padding: 24px 20px; background: rgba(12,12,22,0.8); text-align: center; }
  .hero-stat-num { font-size: 1.8rem; font-weight: 700; letter-spacing: -0.04em; color: var(--indigo); margin-bottom: 4px; }
  .hero-stat-label { font-size: 11px; color: var(--text-3); font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; }

  /* Sections */
  .section { max-width: 1100px; margin: 0 auto; padding: 80px 32px; }
  .eyebrow {
    display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.16em; color: var(--indigo);
    margin-bottom: 16px;
  }
  .section-h2 {
    font-size: clamp(1.8rem, 3.5vw, 2.8rem); font-weight: 700;
    letter-spacing: -0.04em; color: var(--text-1);
    margin-bottom: 16px; line-height: 1.1;
  }
  .section-sub { color: var(--text-2); font-size: 15px; line-height: 1.7; max-width: 500px; margin-bottom: 48px; }

  /* Steps */
  .steps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-top: 40px; }
  .step-card { padding: 28px 24px; border-radius: var(--r-lg); transition: border-color 0.25s, transform 0.2s; }
  .step-card:hover { border-color: rgba(99,102,241,0.3); transform: translateY(-3px); }
  .step-num { font-size: 2.5rem; font-weight: 700; letter-spacing: -0.06em; color: rgba(99,102,241,0.25); margin-bottom: 14px; font-variant-numeric: tabular-nums; }
  .step-title { font-size: 15px; font-weight: 700; color: var(--text-1); margin-bottom: 8px; }
  .step-desc { font-size: 13px; color: var(--text-2); line-height: 1.65; }

  /* Features */
  .features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; margin-top: 40px; }
  .feat-card { padding: 28px 24px; border-radius: var(--r-lg); position: relative; overflow: hidden; transition: border-color 0.25s, transform 0.2s; }
  .feat-card:hover { transform: translateY(-3px); }
  .feat-line { position: absolute; top: 0; left: 0; right: 0; height: 1px; }
  .feat-icon { font-size: 24px; margin-bottom: 16px; }
  .feat-title { font-size: 15px; font-weight: 700; color: var(--text-1); margin-bottom: 8px; }
  .feat-desc { font-size: 13px; color: var(--text-2); line-height: 1.65; }

  /* Score section */
  .score-section { }
  .score-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
  @media(max-width: 768px) { .score-grid { grid-template-columns: 1fr; } }

  .score-tiers { display: flex; flex-direction: column; gap: 16px; margin-top: 32px; }
  .tier { display: flex; align-items: center; gap: 14px; }
  .tier-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .tier-range { font-size: 12px; font-weight: 700; color: var(--text-3); width: 56px; flex-shrink: 0; font-variant-numeric: tabular-nums; }
  .tier-label { font-size: 13px; font-weight: 700; width: 64px; flex-shrink: 0; }
  .tier-desc { font-size: 12px; color: var(--text-3); }

  .score-orb-wrap { display: flex; align-items: center; justify-content: center; }
  .score-orb {
    width: 220px; height: 220px; border-radius: 50%; position: relative;
    display: flex; align-items: center; justify-content: center;
    background: radial-gradient(circle at 40% 35%, rgba(99,102,241,0.15), rgba(5,5,10,0.95));
    border: 1px solid rgba(99,102,241,0.2);
    box-shadow: 0 0 80px rgba(99,102,241,0.12), inset 0 0 40px rgba(99,102,241,0.05);
  }
  @keyframes orbRing { to { transform: rotate(360deg); } }
  .score-orb-ring {
    position: absolute; inset: -12px; border-radius: 50%;
    border: 1px dashed rgba(99,102,241,0.15);
    animation: orbRing 20s linear infinite;
  }
  .score-orb-ring-2 {
    position: absolute; inset: -28px; border-radius: 50%;
    border: 1px dashed rgba(99,102,241,0.08);
    animation: orbRing 35s linear infinite reverse;
  }
  .score-orb-inner { text-align: center; }
  .score-num { font-size: 3.5rem; font-weight: 700; letter-spacing: -0.06em; color: #10b981; line-height: 1; text-shadow: 0 0 40px rgba(16,185,129,0.4); }
  .score-label-text { font-size: 14px; font-weight: 700; color: #10b981; margin-top: 4px; }
  .score-sub-text { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px; }

  /* Stakeholders */
  .stake-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 40px; }
  .stake-card { padding: 28px 24px; border-radius: var(--r-lg); transition: border-color 0.25s, transform 0.2s; display: flex; flex-direction: column; gap: 0; }
  .stake-card:hover { border-color: rgba(99,102,241,0.25); transform: translateY(-3px); }
  .stake-icon { font-size: 28px; margin-bottom: 16px; }
  .stake-title { font-size: 17px; font-weight: 700; color: var(--text-1); margin-bottom: 16px; }
  .stake-list { list-style: none; display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; flex: 1; }
  .stake-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: var(--text-2); line-height: 1.5; }
  .stake-check { color: var(--emerald); font-weight: 700; flex-shrink: 0; font-size: 12px; margin-top: 1px; }
  .stake-btn {
    padding: 12px 20px; border-radius: var(--r-sm);
    background: var(--panel); border: 1px solid var(--border);
    font-size: 13px; font-weight: 600; color: var(--indigo);
    cursor: none; transition: all 0.2s; width: 100%;
  }
  .stake-btn:hover { background: rgba(99,102,241,0.12); border-color: rgba(99,102,241,0.3); }

  /* Testimonials */
  .testi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 40px; }
  .testi-card { padding: 28px 24px; border-radius: var(--r-lg); transition: border-color 0.25s, transform 0.2s; }
  .testi-card:hover { border-color: rgba(99,102,241,0.25); transform: translateY(-2px); }
  .testi-stars { color: #f59e0b; font-size: 13px; margin-bottom: 14px; }
  .testi-quote { font-size: 14px; color: var(--text-2); line-height: 1.7; font-style: italic; margin-bottom: 18px; }
  .testi-author { font-size: 13px; font-weight: 700; color: var(--text-1); }
  .testi-role   { font-size: 11px; color: var(--text-3); margin-top: 2px; }

  /* CTA */
  .cta-section {
    padding: 100px 32px; text-align: center; position: relative; overflow: hidden;
    background: radial-gradient(ellipse 80% 60% at 50% 100%, rgba(99,102,241,0.08) 0%, transparent 70%);
  }
  .cta-h2 {
    font-size: clamp(2rem, 4.5vw, 3.5rem); font-weight: 700;
    letter-spacing: -0.04em; color: var(--text-1); margin-bottom: 16px; line-height: 1.05;
  }
  .cta-h2 span {
    background: linear-gradient(125deg, #6366f1, #8b5cf6);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .cta-p { font-size: 16px; color: var(--text-2); max-width: 520px; margin: 0 auto 36px; line-height: 1.7; }
  .cta-buttons { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-bottom: 20px; }
  .cta-btn-primary { padding: 16px 28px; font-size: 15px; }
  .cta-btn-ghost   { padding: 16px 28px; font-size: 15px; }
  .cta-note { font-size: 11px; color: var(--text-3); letter-spacing: 0.05em; }

  /* Footer */
  .footer { background: rgba(5,5,10,0.95); border-top: 1px solid var(--border); padding: 56px 0 32px; }
  .footer-inner { max-width: 1100px; margin: 0 auto; padding: 0 32px; }
  .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 48px; margin-bottom: 48px; }
  @media(max-width: 768px) { .footer-grid { grid-template-columns: 1fr; gap: 32px; } }
  .footer-brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 15px; color: var(--text-1); margin-bottom: 14px; }
  .footer-desc { font-size: 13px; color: var(--text-3); line-height: 1.7; max-width: 280px; margin-bottom: 14px; }
  .footer-made { font-size: 12px; color: var(--text-3); }
  .footer-col-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: var(--text-3); margin-bottom: 14px; }
  .footer-link { display: block; font-size: 13px; color: var(--text-2); text-decoration: none; margin-bottom: 10px; transition: color 0.2s; cursor: none; }
  .footer-link:hover { color: var(--text-1); }
  .footer-bottom { font-size: 11px; color: var(--text-3); border-top: 1px solid var(--border); padding-top: 24px; }
`;
