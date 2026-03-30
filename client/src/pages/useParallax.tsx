/**
 * useScrollReveal — IntersectionObserver-based reveal hook
 * useParallax    — rAF-based parallax offset hook
 * ScrollReveal   — wrapper component for staggered reveals
 */

import { useEffect, useRef, useState, ReactNode } from 'react';

// ─── useScrollReveal ──────────────────────────────────────────────────────────
export function useScrollReveal(options?: IntersectionObserverInit) {
  const ref      = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        obs.unobserve(el);
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px', ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, visible };
}

// ─── useParallax ──────────────────────────────────────────────────────────────
export function useParallax(speed = 0.3) {
  const ref    = useRef<HTMLDivElement>(null);
  const offset = useRef(0);
  const raf    = useRef<number>(0);

  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      offset.current = center * speed;
    };

    const tick = () => {
      onScroll();
      if (ref.current) {
        ref.current.style.transform = `translateY(${offset.current}px)`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [speed]);

  return ref;
}

// ─── ScrollReveal component ───────────────────────────────────────────────────
interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;     // ms
  distance?: number;  // px translate
  className?: string;
  style?: React.CSSProperties;
}

export function ScrollReveal({ children, delay = 0, distance = 24, className, style }: ScrollRevealProps) {
  const { ref, visible } = useScrollReveal();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0)' : `translateY(${distance}px)`,
        transition: `opacity 0.65s cubic-bezier(.22,.68,0,1.2) ${delay}ms, transform 0.65s cubic-bezier(.22,.68,0,1.2) ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── StaggerReveal — reveals children with staggered delays ──────────────────
interface StaggerProps {
  children: ReactNode[];
  stagger?: number;   // ms between each child
  className?: string;
}

export function StaggerReveal({ children, stagger = 80, className }: StaggerProps) {
  const { ref, visible } = useScrollReveal();

  return (
    <div ref={ref} className={className}>
      {(children as ReactNode[]).map((child, i) => (
        <div
          key={i}
          style={{
            opacity:    visible ? 1 : 0,
            transform:  visible ? 'translateY(0)' : 'translateY(20px)',
            transition: `opacity 0.55s cubic-bezier(.22,.68,0,1.2) ${i * stagger}ms, transform 0.55s cubic-bezier(.22,.68,0,1.2) ${i * stagger}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
