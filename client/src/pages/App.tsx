/**
 * App.tsx — SafeStay Root
 *
 * Wires together every system-level feature:
 *  - globalStyles injected once into <head>
 *  - ToastProvider  — wraps everything so useToast() works anywhere
 *  - CustomCursor   — magnetic glowing cursor (desktop only)
 *  - CommandPalette — Cmd/Ctrl+K global search overlay
 *  - Navbar         — fixed top nav (hidden on auth pages)
 *  - PageTransition — smooth fade between routes
 *  - All routes
 */

import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

import {
  globalStyles,
  ToastProvider,
  CustomCursor,
  Navbar,
  PageTransition,
} from './pages/DesignSystem';

import { CommandPalette } from './pages/components/CommandPalette';

// Pages
import { Home }              from './pages/Home';
import { Login }             from './pages/Login';
import { Register }          from './pages/Register';
import ForgotPassword        from './pages/ForgotPassword';
import VerifyEmail           from './pages/VerifyEmail';
import OwnerLogin            from './pages/OwnerLogin';
import OwnerRegister         from './pages/OwnerRegister';
import { Dashboard }         from './pages/Dashboard';
import { AccommodationList } from './pages/AccommodationList';
import { AccommodationDetail }from './pages/AccommodationDetail';
import ReportSafety          from './pages/ReportSafety';
import MyReports             from './pages/MyReports';
import Profile               from './pages/Profile';
import OwnerDashboard        from './pages/OwnerDashboard';
import AddProperty           from './pages/AddProperty';
import AdminDashboard        from './pages/AdminDashboard';
import ReportIncident        from './pages/ReportIncident';

// Auth pages that should NOT show navbar
const AUTH_PATHS = ['/', '/login', '/register', '/forgot-password', '/verify-email', '/owner/login', '/owner/register'];

function AppInner() {
  const location = useLocation();
  const [cmdOpen, setCmdOpen] = useState(false);
  const isAuthPage = AUTH_PATHS.includes(location.pathname);

  // Cmd+K / Ctrl+K shortcut
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setCmdOpen(prev => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  return (
    <>
      {/* Custom cursor — hidden on touch devices */}
      <CustomCursor />

      {/* Command palette */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

      {/* Navbar — only on authenticated pages */}
      {!isAuthPage && <Navbar />}

      {/* Cmd+K hint bar (only on authenticated pages, desktop) */}
      {!isAuthPage && (
        <div style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 900, pointerEvents: 'none',
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: '100px',
          background: 'rgba(12,12,22,0.85)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.06)',
          fontSize: 11, color: 'rgba(255,255,255,0.3)',
          fontFamily: "'Space Grotesk', sans-serif",
          letterSpacing: '0.04em',
          animation: 'fadeUp 0.6s 1.5s both',
        }}>
          <span style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 600,
          }}>
            ⌘K
          </span>
          Quick search
        </div>
      )}

      <PageTransition>
        <Routes>
          {/* Public */}
          <Route path="/"                    element={<Home />} />
          <Route path="/login"               element={<Login />} />
          <Route path="/register"            element={<Register />} />
          <Route path="/forgot-password"     element={<ForgotPassword />} />
          <Route path="/verify-email"        element={<VerifyEmail />} />
          <Route path="/owner/login"         element={<OwnerLogin />} />
          <Route path="/owner/register"      element={<OwnerRegister />} />

          {/* Student */}
          <Route path="/dashboard"           element={<Dashboard />} />
          <Route path="/accommodations"      element={<AccommodationList />} />
          <Route path="/accommodations/:id"  element={<AccommodationDetail />} />
          <Route path="/report"              element={<ReportSafety />} />
          <Route path="/report-incident"     element={<ReportIncident />} />
          <Route path="/my-reports"          element={<MyReports />} />
          <Route path="/profile"             element={<Profile />} />

          {/* Owner */}
          <Route path="/owner/dashboard"     element={<OwnerDashboard />} />
          <Route path="/owner/add-property"  element={<AddProperty />} />

          {/* Admin */}
          <Route path="/admin"               element={<AdminDashboard />} />

          {/* 404 */}
          <Route path="*"                    element={<NotFound />} />
        </Routes>
      </PageTransition>
    </>
  );
}

function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--void)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 16, fontFamily: "'Space Grotesk', sans-serif",
    }}>
      <span style={{ fontSize: 48, opacity: 0.3 }}>🌀</span>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#f0f0f8', letterSpacing: '-0.04em' }}>404</h1>
      <p style={{ fontSize: 14, color: '#8888aa' }}>Page not found</p>
      <a href="/" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 10,
        color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 600, marginTop: 8,
      }}>← Go Home</a>
    </div>
  );
}

export default function App() {
  // Inject globalStyles once
  useEffect(() => {
    const id = 'ss-global-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = globalStyles;
    document.head.appendChild(style);
  }, []);

  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppInner />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}
