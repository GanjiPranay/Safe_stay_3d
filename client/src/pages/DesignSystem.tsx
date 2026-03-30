/**
 * SAFESTAY DESIGN SYSTEM v2.0
 *
 * Exports:
 *  - globalStyles         — inject at app root via <style>
 *  - OrbBackground        — Three.js GLSL shader orb + particles (auth pages)
 *  - SubtleOrb            — Lightweight orb for dashboard pages
 *  - Navbar               — Responsive nav with auth-aware links
 *  - Spinner              — Inline loading spinner
 *  - PageLoader           — Full-page loader
 *  - SkeletonCard         — Shimmer skeleton for card loading states
 *  - SkeletonList         — Shimmer skeleton for list rows
 *  - ToastProvider        — Wrap app root; provides useToast hook
 *  - useToast             — { success, error, info, warning }
 *  - PageTransition       — Wrap route content for fade transitions
 *  - TrustScoreRing       — Animated SVG arc gauge
 */

import { useEffect, useRef, useState, useContext, createContext, useCallback, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { useAuth } from '../contexts/AuthContext';

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --void:      #05050a;
    --surface:   #0c0c14;
    --panel:     rgba(255,255,255,0.04);
    --border:    rgba(255,255,255,0.08);
    --border-hi: rgba(99,102,241,0.45);
    --text-1:    #f0f0f8;
    --text-2:    #8888aa;
    --text-3:    #44445a;
    --indigo:    #6366f1;
    --violet:    #8b5cf6;
    --emerald:   #10b981;
    --rose:      #f43f5e;
    --amber:     #f59e0b;
    --glow-in:   rgba(99,102,241,0.22);
    --glow-vi:   rgba(139,92,246,0.18);
    --font-body: 'Space Grotesk', system-ui, sans-serif;
    --font-serif:'Instrument Serif', Georgia, serif;
    --r-sm:      10px;
    --r-md:      16px;
    --r-lg:      24px;
    --r-xl:      32px;
  }

  html { scroll-behavior: smooth; }

  body {
    font-family: var(--font-body);
    background: var(--void);
    color: var(--text-1);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    letter-spacing: -0.01em;
    overflow-x: hidden;
    cursor: none;
  }

  /* ── Noise texture overlay (2% opacity grain) ── */
  body::before {
    content: '';
    position: fixed; inset: 0; z-index: 9999;
    pointer-events: none;
    opacity: 0.022;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 128px 128px;
  }

  /* ── Custom cursor ── */
  .cursor-dot {
    position: fixed; top: 0; left: 0; z-index: 99999;
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--indigo);
    pointer-events: none;
    transform: translate(-50%, -50%);
    transition: width 0.15s, height 0.15s, background 0.15s, opacity 0.2s;
    mix-blend-mode: screen;
  }
  .cursor-ring {
    position: fixed; top: 0; left: 0; z-index: 99998;
    width: 36px; height: 36px; border-radius: 50%;
    border: 1px solid rgba(99,102,241,0.5);
    pointer-events: none;
    transform: translate(-50%, -50%);
    transition: width 0.35s cubic-bezier(.22,.68,0,1.2),
                height 0.35s cubic-bezier(.22,.68,0,1.2),
                border-color 0.2s, opacity 0.3s;
  }
  body:has(a:hover) .cursor-dot, body:has(button:hover) .cursor-dot { width: 14px; height: 14px; background: var(--violet); }
  body:has(a:hover) .cursor-ring, body:has(button:hover) .cursor-ring { width: 52px; height: 52px; border-color: rgba(139,92,246,0.6); }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--void); }
  ::-webkit-scrollbar-thumb { background: var(--text-3); border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--indigo); }

  /* ── Glass card ── */
  .glass {
    background: rgba(12,12,22,0.72);
    backdrop-filter: blur(28px) saturate(180%);
    -webkit-backdrop-filter: blur(28px) saturate(180%);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
  }
  .glass-hi {
    background: rgba(12,12,22,0.85);
    backdrop-filter: blur(48px) saturate(220%);
    -webkit-backdrop-filter: blur(48px) saturate(220%);
    border: 1px solid rgba(99,102,241,0.18);
    border-radius: var(--r-xl);
    box-shadow:
      0 0 0 1px rgba(99,102,241,0.08),
      0 32px 80px rgba(0,0,0,0.65),
      inset 0 1px 0 rgba(255,255,255,0.05);
  }

  /* ── Pill label ── */
  .pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; border-radius: 100px;
    font-size: 10px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.12em;
    border: 1px solid var(--border); color: var(--text-2);
  }
  .pill-indigo  { border-color: rgba(99,102,241,0.4);  color: #a5b4fc; background: rgba(99,102,241,0.1);  }
  .pill-emerald { border-color: rgba(16,185,129,0.4);  color: #6ee7b7; background: rgba(16,185,129,0.1);  }
  .pill-rose    { border-color: rgba(244,63,94,0.4);   color: #fda4af; background: rgba(244,63,94,0.1);   }
  .pill-amber   { border-color: rgba(245,158,11,0.4);  color: #fcd34d; background: rgba(245,158,11,0.1);  }

  /* ── Input ── */
  .ss-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    padding: 13px 16px;
    color: var(--text-1);
    font-family: var(--font-body);
    font-size: 14px; font-weight: 400;
    outline: none;
    transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
  }
  .ss-input:focus {
    border-color: var(--border-hi);
    background: rgba(99,102,241,0.06);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12), inset 0 0 0 1px rgba(99,102,241,0.1);
  }
  .ss-input::placeholder { color: var(--text-3); }
  .ss-input-icon { padding-left: 44px; }

  /* ── Primary button ── */
  .ss-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 13px 24px;
    border: none; border-radius: var(--r-sm);
    font-family: var(--font-body); font-size: 14px; font-weight: 600;
    cursor: none; outline: none; transition: all 0.25s;
    position: relative; overflow: hidden;
    background: linear-gradient(135deg, var(--indigo) 0%, var(--violet) 100%);
    color: white;
    box-shadow: 0 0 0 0 rgba(99,102,241,0);
  }
  .ss-btn::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.14) 50%, transparent 100%);
    transform: translateX(-100%);
    transition: transform 0.7s ease;
  }
  .ss-btn:hover::before { transform: translateX(100%); }
  .ss-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 36px rgba(99,102,241,0.38); }
  .ss-btn:active { transform: translateY(0); }
  .ss-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }
  .ss-btn:disabled::before { display: none; }

  .ss-btn-ghost {
    background: transparent; border: 1px solid var(--border);
    color: var(--text-2); box-shadow: none;
  }
  .ss-btn-ghost:hover { border-color: var(--border-hi); color: var(--text-1); box-shadow: none; }

  .ss-btn-emerald {
    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  }
  .ss-btn-emerald:hover { box-shadow: 0 10px 36px rgba(16,185,129,0.32); }

  .ss-btn-rose {
    background: linear-gradient(135deg, #e11d48 0%, #f43f5e 100%);
  }
  .ss-btn-rose:hover { box-shadow: 0 10px 36px rgba(244,63,94,0.32); }

  .ss-btn-full { width: 100%; }

  /* ── Field label ── */
  .field-label {
    display: block;
    font-size: 10px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.12em;
    color: var(--text-2); margin-bottom: 8px;
  }

  /* ── Error / success banners ── */
  .ss-error {
    padding: 12px 16px; border-radius: var(--r-sm);
    background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.25);
    color: #fda4af; font-size: 13px; line-height: 1.5;
  }
  .ss-success {
    padding: 12px 16px; border-radius: var(--r-sm);
    background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25);
    color: #6ee7b7; font-size: 13px; line-height: 1.5;
  }

  /* ── Skeleton shimmer ── */
  @keyframes shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
  .skeleton {
    background: linear-gradient(90deg,
      rgba(255,255,255,0.04) 25%,
      rgba(255,255,255,0.08) 50%,
      rgba(255,255,255,0.04) 75%);
    background-size: 1200px 100%;
    animation: shimmer 1.8s infinite;
    border-radius: 6px;
  }

  /* ── Fade in animations ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .fade-up   { animation: fadeUp 0.6s cubic-bezier(.22,.68,0,1.2) both; }
  .fade-up-1 { animation-delay: 0.05s; }
  .fade-up-2 { animation-delay: 0.12s; }
  .fade-up-3 { animation-delay: 0.20s; }
  .fade-up-4 { animation-delay: 0.28s; }
  .fade-up-5 { animation-delay: 0.38s; }

  /* ── Page transition ── */
  @keyframes pageEnter {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .page-enter { animation: pageEnter 0.4s cubic-bezier(.22,.68,0,1.2) both; }

  /* ── Spin ── */
  @keyframes spin360 { to { transform: rotate(360deg); } }
  .ss-spin { animation: spin360 0.9s linear infinite; }

  /* ── Pulse ── */
  @keyframes pulsate { 0%,100%{opacity:1} 50%{opacity:0.5} }

  /* ── Stat card ── */
  .stat-card {
    background: var(--panel); border: 1px solid var(--border);
    border-radius: var(--r-lg); padding: 24px;
    transition: border-color 0.25s, transform 0.2s;
  }
  .stat-card:hover { border-color: rgba(99,102,241,0.25); transform: translateY(-1px); }
  .stat-num   { font-size: 2.4rem; font-weight: 700; letter-spacing: -0.04em; line-height: 1; }
  .stat-label { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-2); margin-top: 6px; }

  /* ── Table ── */
  .ss-table { width: 100%; border-collapse: collapse; }
  .ss-table th {
    padding: 10px 16px; text-align: left;
    font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;
    color: var(--text-3); border-bottom: 1px solid var(--border);
  }
  .ss-table td { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 13px; }
  .ss-table tr:last-child td { border-bottom: none; }
  .ss-table tr:hover td { background: rgba(255,255,255,0.02); }

  /* ── Navbar ── */
  .ss-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 32px; height: 60px;
    background: rgba(5,5,10,0.82);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border-bottom: 1px solid var(--border);
    transition: background 0.3s;
  }
  .ss-nav::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent);
  }
  .ss-nav-brand {
    font-weight: 700; font-size: 15px; letter-spacing: -0.03em;
    color: var(--text-1); text-decoration: none;
    display: flex; align-items: center; gap: 10px;
  }
  .ss-nav-logo {
    width: 28px; height: 28px;
    background: linear-gradient(135deg, var(--indigo), var(--violet));
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; box-shadow: 0 0 16px rgba(99,102,241,0.35);
  }
  .ss-nav-links {
    display: flex; align-items: center; gap: 4px;
  }
  .ss-nav-link {
    padding: 7px 14px; border-radius: 8px;
    font-size: 13px; font-weight: 500;
    color: var(--text-2); text-decoration: none;
    transition: color 0.2s, background 0.2s;
    cursor: none;
  }
  .ss-nav-link:hover { color: var(--text-1); background: rgba(255,255,255,0.05); }
  .ss-nav-link.active { color: #a5b4fc; background: rgba(99,102,241,0.12); }
  .ss-nav-actions { display: flex; align-items: center; gap: 10px; }
  @media(max-width: 768px) {
    .ss-nav-links { display: none; }
    .ss-nav { padding: 0 20px; }
  }
`;

// ─── CUSTOM CURSOR ────────────────────────────────────────────────────────────
export function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos     = useRef({ x: 0, y: 0 });
  const ring    = useRef({ x: 0, y: 0 });
  const raf     = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove);

    const animate = () => {
      ring.current.x += (pos.current.x - ring.current.x) * 0.1;
      ring.current.y += (pos.current.y - ring.current.y) * 0.1;
      if (dotRef.current) {
        dotRef.current.style.left = pos.current.x + 'px';
        dotRef.current.style.top  = pos.current.y + 'px';
      }
      if (ringRef.current) {
        ringRef.current.style.left = ring.current.x + 'px';
        ringRef.current.style.top  = ring.current.y + 'px';
      }
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <>
      <div ref={dotRef}  className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}

// ─── GLSL SHADER ORB (auth pages) ────────────────────────────────────────────
interface OrbBgProps {
  children?: ReactNode;
  intensity?: 'subtle' | 'normal' | 'high';
  accentColor?: string;
}

export function OrbBackground({ children, intensity = 'normal', accentColor = '6366f1' }: OrbBgProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animId: number;
    let renderer: any, scene: any, camera: any, orbMesh: any, particlesMesh: any, innerMesh: any;
    let mouse = { x: 0, y: 0 }, targetMouse = { x: 0, y: 0 };
    let time = 0;
    const opacityMap = { subtle: 0.14, normal: 0.24, high: 0.40 };
    const orbOpacity = opacityMap[intensity];

    const onMouseMove = (e: MouseEvent) => {
      targetMouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    const init = async () => {
      try {
        if (!mountRef.current) return;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);
        mountRef.current.appendChild(renderer.domElement);

        scene  = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 0, 5);

        // ── Primary orb (icosahedron wireframe with vertex morph) ──
        const geo = new THREE.IcosahedronGeometry(1.9, 5);
        const origPos = new Float32Array(geo.attributes.position.array);
        (geo as any)._orig = origPos;

        const mat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(`#${accentColor}`),
          wireframe: true,
          transparent: true,
          opacity: orbOpacity,
        });
        orbMesh = new THREE.Mesh(geo, mat);
        scene.add(orbMesh);

        // ── Secondary inner halo ──
        const innerGeo = new THREE.SphereGeometry(1.4, 32, 32);
        const innerMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(`#${accentColor}`),
          transparent: true, opacity: 0.03,
        });
        innerMesh = new THREE.Mesh(innerGeo, innerMat);
        scene.add(innerMesh);

        // ── Outer glow ring ──
        const ringGeo = new THREE.TorusGeometry(2.4, 0.008, 2, 180);
        const ringMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(`#${accentColor}`),
          transparent: true, opacity: 0.08,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.8;
        scene.add(ring);

        // ── Particles (spherical distribution) ──
        const pCount = 220;
        const pPos   = new Float32Array(pCount * 3);
        for (let i = 0; i < pCount; i++) {
          const theta = Math.random() * Math.PI * 2;
          const phi   = Math.acos(2 * Math.random() - 1);
          const r     = 3.0 + Math.random() * 2.5;
          pPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
          pPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
          pPos[i*3+2] = r * Math.cos(phi);
        }
        const pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        const pMat = new THREE.PointsMaterial({
          color: new THREE.Color(`#${accentColor}`),
          size: 0.028, transparent: true, opacity: 0.55,
        });
        particlesMesh = new THREE.Points(pGeo, pMat);
        scene.add(particlesMesh);

        // ── Animation ──
        const animate = () => {
          animId = requestAnimationFrame(animate);
          time += 0.007;

          // Smooth mouse lerp
          mouse.x += (targetMouse.x - mouse.x) * 0.04;
          mouse.y += (targetMouse.y - mouse.y) * 0.04;

          // Morph orb vertices
          const pos  = orbMesh.geometry.attributes.position;
          const orig = (orbMesh.geometry as any)._orig;
          for (let i = 0; i < pos.count; i++) {
            const ox = orig[i*3], oy = orig[i*3+1], oz = orig[i*3+2];
            const n1 = Math.sin(ox * 1.6 + time) * Math.cos(oy * 1.6 + time * 0.75) * 0.20;
            const n2 = Math.sin(oz * 1.2 + time * 1.1) * 0.10;
            const n  = (n1 + n2) * 0.5;
            pos.setXYZ(i,
              ox + n * ox * 0.18,
              oy + n * oy * 0.18,
              oz + n * oz * 0.18
            );
          }
          pos.needsUpdate = true;

          orbMesh.rotation.x += 0.0018 + mouse.y * 0.0006;
          orbMesh.rotation.y += 0.0025 + mouse.x * 0.0006;

          // Inner halo breathe
          const breathe = 1 + Math.sin(time * 0.8) * 0.04;
          innerMesh.scale.set(breathe, breathe, breathe);

          particlesMesh.rotation.x = time * 0.035 + mouse.y * 0.045;
          particlesMesh.rotation.y = time * 0.055 + mouse.x * 0.045;

          renderer.render(scene, camera);
        };
        animate();

        const onResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', onResize);
      } catch (err) {
        console.warn('Three.js orb failed:', err);
      }
    };
    init();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      if (renderer && mountRef.current) {
        try { mountRef.current.removeChild(renderer.domElement); } catch {}
        renderer.dispose();
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--void)' }}>
      <div ref={mountRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
      {/* Radial vignette */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 85% 85% at 50% 50%, transparent 25%, rgba(5,5,10,0.88) 100%)',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

// ─── SUBTLE ORB (dashboard pages) ────────────────────────────────────────────
export function SubtleOrb({ children }: { children: ReactNode }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animId: number;
    let renderer: any, scene: any, camera: any, mesh: any, particles: any;
    let mouse = { x: 0, y: 0 };
    let time = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    const init = async () => {
      try {
        if (!mountRef.current) return;
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);
        mountRef.current.appendChild(renderer.domElement);
        scene  = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.z = 7;

        const geo = new THREE.IcosahedronGeometry(2.2, 3);
        const mat = new THREE.MeshBasicMaterial({ color: 0x6366f1, wireframe: true, transparent: true, opacity: 0.05 });
        mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);

        const pCount = 90;
        const pArr   = new Float32Array(pCount * 3);
        for (let i = 0; i < pCount; i++) {
          pArr[i*3]   = (Math.random() - 0.5) * 18;
          pArr[i*3+1] = (Math.random() - 0.5) * 14;
          pArr[i*3+2] = (Math.random() - 0.5) * 10;
        }
        const pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute('position', new THREE.BufferAttribute(pArr, 3));
        particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x6366f1, size: 0.02, transparent: true, opacity: 0.3 }));
        scene.add(particles);

        const animate = () => {
          animId = requestAnimationFrame(animate);
          time += 0.004;
          mesh.rotation.x += 0.001 + mouse.y * 0.0003;
          mesh.rotation.y += 0.0015 + mouse.x * 0.0003;
          particles.rotation.y = time * 0.02;
          renderer.render(scene, camera);
        };
        animate();

        const onResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', onResize);
      } catch {}
    };
    init();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      if (renderer && mountRef.current) {
        try { mountRef.current.removeChild(renderer.domElement); } catch {}
        renderer.dispose();
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--void)' }}>
      <div ref={mountRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 120% 100% at 70% 20%, rgba(99,102,241,0.04) 0%, transparent 60%)',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
export function Navbar() {
  const { user, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  const studentLinks = [
    { to: '/dashboard',      label: 'Dashboard' },
    { to: '/accommodations', label: 'Browse' },
    { to: '/report',         label: 'Report Issue' },
    { to: '/my-reports',     label: 'My Reports' },
    { to: '/profile',        label: 'Profile' },
  ];

  const ownerLinks = [
    { to: '/owner/dashboard',  label: 'Dashboard' },
    { to: '/accommodations',   label: 'Browse' },
    { to: '/owner/add-property', label: 'Add Property' },
    { to: '/profile',          label: 'Profile' },
  ];

  const adminLinks = [
    { to: '/admin',          label: 'Admin' },
    { to: '/accommodations', label: 'Browse' },
    { to: '/profile',        label: 'Profile' },
  ];

  const links = user.role === 'owner' ? ownerLinks : user.role === 'admin' ? adminLinks : studentLinks;
  const accentColor = user.role === 'owner' ? 'var(--emerald)' : user.role === 'admin' ? 'var(--amber)' : 'var(--indigo)';

  return (
    <>
      <style>{NAV_CSS}</style>
      <nav className="ss-nav">
        <Link to={user.role === 'owner' ? '/owner/dashboard' : user.role === 'admin' ? '/admin' : '/dashboard'} className="ss-nav-brand">
          <div className="ss-nav-logo" style={{ background: `linear-gradient(135deg, ${accentColor}, var(--violet))` }}>⬡</div>
          SafeStay
        </Link>

        <div className="ss-nav-links">
          {links.map(l => (
            <Link key={l.to} to={l.to} className={`ss-nav-link ${isActive(l.to) ? 'active' : ''}`}
              style={isActive(l.to) ? { color: accentColor === 'var(--indigo)' ? '#a5b4fc' : accentColor === 'var(--emerald)' ? '#6ee7b7' : '#fcd34d', background: `color-mix(in srgb, ${accentColor} 12%, transparent)` } : {}}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className="ss-nav-actions">
          <div className="nav-user-badge" style={{ borderColor: `color-mix(in srgb, ${accentColor} 40%, transparent)` }}>
            <div className="nav-user-dot" style={{ background: accentColor }} />
            <span>{user.name?.split(' ')[0] || 'User'}</span>
            <span className="nav-user-role" style={{ color: accentColor }}>
              {user.role === 'owner' ? 'Owner' : user.role === 'admin' ? 'Admin' : 'Student'}
            </span>
          </div>
          <button onClick={handleLogout} className="nav-logout-btn">Sign out</button>
        </div>
      </nav>
    </>
  );
}

const NAV_CSS = `
  .nav-user-badge {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 12px; border-radius: 100px;
    border: 1px solid rgba(255,255,255,0.1);
    font-size: 12px; font-weight: 500; color: var(--text-2);
  }
  .nav-user-dot { width: 6px; height: 6px; border-radius: 50%; }
  .nav-user-role { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; }
  .nav-logout-btn {
    padding: 7px 14px; border-radius: var(--r-sm);
    border: 1px solid var(--border);
    background: transparent; cursor: none;
    font-family: var(--font-body); font-size: 12px; font-weight: 600;
    color: var(--text-3); transition: all 0.2s;
  }
  .nav-logout-btn:hover { border-color: rgba(244,63,94,0.4); color: #fda4af; background: rgba(244,63,94,0.08); }
  @media(max-width: 768px) { .nav-user-badge { display: none; } }
`;

// ─── TOAST SYSTEM ─────────────────────────────────────────────────────────────
interface Toast { id: string; type: 'success' | 'error' | 'info' | 'warning'; message: string; }
interface ToastContextType { success: (msg: string) => void; error: (msg: string) => void; info: (msg: string) => void; warning: (msg: string) => void; }

const ToastContext = createContext<ToastContextType>({
  success: () => {}, error: () => {}, info: () => {}, warning: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-3), { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4200);
  }, []);

  const ctx: ToastContextType = {
    success: (m) => add('success', m),
    error:   (m) => add('error', m),
    info:    (m) => add('info', m),
    warning: (m) => add('warning', m),
  };

  const icons: Record<Toast['type'], string> = {
    success: '✓', error: '✕', info: 'ℹ', warning: '⚠',
  };

  const colors: Record<Toast['type'], { bg: string; border: string; icon: string }> = {
    success: { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  icon: '#6ee7b7' },
    error:   { bg: 'rgba(244,63,94,0.12)',   border: 'rgba(244,63,94,0.3)',   icon: '#fda4af' },
    info:    { bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.3)',  icon: '#a5b4fc' },
    warning: { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  icon: '#fcd34d' },
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <style>{TOAST_CSS}</style>
      <div className="toast-container">
        {toasts.map(t => {
          const c = colors[t.type];
          return (
            <div key={t.id} className="toast-item" style={{ background: c.bg, borderColor: c.border }}>
              <span className="toast-icon" style={{ color: c.icon }}>{icons[t.type]}</span>
              <span className="toast-msg">{t.message}</span>
              <div className="toast-progress" style={{ background: c.icon }} />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() { return useContext(ToastContext); }

const TOAST_CSS = `
  .toast-container {
    position: fixed; bottom: 24px; right: 24px; z-index: 99990;
    display: flex; flex-direction: column; gap: 10px;
    pointer-events: none;
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(110%) scale(0.96); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes toastOut {
    from { opacity: 1; max-height: 80px; margin-bottom: 0; }
    to   { opacity: 0; max-height: 0; margin-bottom: -10px; }
  }
  .toast-item {
    display: flex; align-items: center; gap: 10px;
    padding: 13px 18px 16px;
    border-radius: var(--r-md); border: 1px solid;
    backdrop-filter: blur(20px);
    min-width: 280px; max-width: 380px;
    position: relative; overflow: hidden;
    animation: toastIn 0.4s cubic-bezier(.22,.68,0,1.2) both;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  }
  .toast-icon {
    font-size: 14px; font-weight: 700; flex-shrink: 0;
    width: 22px; height: 22px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.08);
  }
  .toast-msg { font-size: 13px; font-weight: 500; color: var(--text-1); line-height: 1.4; flex: 1; }
  .toast-progress {
    position: absolute; bottom: 0; left: 0;
    height: 2px; width: 100%;
    animation: progressShrink 4s linear forwards;
    border-radius: 0 0 var(--r-md) var(--r-md);
    opacity: 0.7;
  }
  @keyframes progressShrink {
    from { transform: scaleX(1); transform-origin: left; }
    to   { transform: scaleX(0); transform-origin: left; }
  }
`;

// ─── PAGE TRANSITION ──────────────────────────────────────────────────────────
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [key, setKey] = useState(location.pathname);
  const [show, setShow] = useState(true);

  useEffect(() => {
    setShow(false);
    const t = setTimeout(() => { setKey(location.pathname); setShow(true); }, 80);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <div className={show ? 'page-enter' : ''} key={key}>
      {children}
    </div>
  );
}

// ─── SKELETON LOADERS ─────────────────────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="glass" style={{ padding: 20, borderRadius: 'var(--r-lg)' }}>
      <div className="skeleton" style={{ height: 160, borderRadius: 'var(--r-md)', marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 18, width: '70%', marginBottom: 10 }} />
      <div className="skeleton" style={{ height: 14, width: '50%', marginBottom: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="skeleton" style={{ height: 44 }} />
        <div className="skeleton" style={{ height: 44 }} />
      </div>
    </div>
  );
}

export function SkeletonList() {
  return (
    <div className="glass" style={{ padding: '20px 24px', borderRadius: 'var(--r-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="skeleton" style={{ height: 16, width: '40%' }} />
        <div className="skeleton" style={{ height: 16, width: '15%' }} />
      </div>
      <div className="skeleton" style={{ height: 13, width: '85%', marginBottom: 16 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="skeleton" style={{ height: 28, width: 80 }} />
        <div className="skeleton" style={{ height: 28, width: 60 }} />
      </div>
    </div>
  );
}

// ─── TRUST SCORE RING ─────────────────────────────────────────────────────────
export function TrustScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const [animated, setAnimated] = useState(0);
  const radius     = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset     = circumference - (animated / 100) * circumference;
  const color      = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#f43f5e';
  const label      = score >= 80 ? 'Safe' : score >= 50 ? 'Caution' : 'Avoid';
  const shadowColor = score >= 80 ? 'rgba(16,185,129,0.4)' : score >= 50 ? 'rgba(245,158,11,0.4)' : 'rgba(244,63,94,0.4)';

  useEffect(() => {
    const timeout = setTimeout(() => setAnimated(score), 200);
    return () => clearTimeout(timeout);
  }, [score]);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        {/* Progress arc */}
        <circle cx={size/2} cy={size/2} r={radius}
          fill="none" stroke={color} strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1.4s cubic-bezier(.22,.68,0,1.2), stroke 0.6s ease',
            filter: `drop-shadow(0 0 8px ${shadowColor})`,
          }}
        />
      </svg>
      {/* Center label */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontSize: size * 0.22, fontWeight: 700, letterSpacing: '-0.04em',
          color, lineHeight: 1,
          textShadow: `0 0 20px ${shadowColor}`,
          transition: 'color 0.6s',
        }}>{score}</span>
        <span style={{ fontSize: size * 0.1, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>{label}</span>
      </div>
    </div>
  );
}

// ─── SPINNER ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg className="ss-spin" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

// ─── PAGE LOADER ──────────────────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--void)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <Spinner size={36} color="var(--indigo)" />
        <p style={{ marginTop: 16, color: 'var(--text-3)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Loading…</p>
      </div>
    </div>
  );
}
