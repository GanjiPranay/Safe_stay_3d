/**
 * MagneticButton — button that magnetically attracts the cursor within a radius
 * Wraps any button/link with a subtle pull effect on hover.
 * Usage: <MagneticButton><button>Click me</button></MagneticButton>
 */

import { useRef, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  strength?: number;   // 0-1, default 0.35
  radius?: number;     // px, default 80
  className?: string;
  style?: React.CSSProperties;
}

export function MagneticButton({ children, strength = 0.35, radius = 80, className, style }: Props) {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const raf      = useRef<number>(0);
  const current  = useRef({ x: 0, y: 0 });
  const target   = useRef({ x: 0, y: 0 });

  const onEnter = () => {
    const lerp = () => {
      current.current.x += (target.current.x - current.current.x) * 0.12;
      current.current.y += (target.current.y - current.current.y) * 0.12;
      if (innerRef.current) {
        innerRef.current.style.transform = `translate(${current.current.x}px, ${current.current.y}px)`;
      }
      raf.current = requestAnimationFrame(lerp);
    };
    raf.current = requestAnimationFrame(lerp);
  };

  const onMove = (e: React.MouseEvent) => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < radius) {
      const factor = (1 - dist / radius) * strength;
      target.current = { x: dx * factor, y: dy * factor };
    }
  };

  const onLeave = () => {
    cancelAnimationFrame(raf.current);
    target.current  = { x: 0, y: 0 };
    // animate back
    const reset = () => {
      current.current.x += (0 - current.current.x) * 0.1;
      current.current.y += (0 - current.current.y) * 0.1;
      if (innerRef.current) {
        innerRef.current.style.transform = `translate(${current.current.x}px, ${current.current.y}px)`;
      }
      if (Math.abs(current.current.x) > 0.1 || Math.abs(current.current.y) > 0.1) {
        raf.current = requestAnimationFrame(reset);
      } else {
        if (innerRef.current) innerRef.current.style.transform = 'translate(0, 0)';
        current.current = { x: 0, y: 0 };
      }
    };
    raf.current = requestAnimationFrame(reset);
  };

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ display: 'inline-block', position: 'relative', ...style }}
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div ref={innerRef} style={{ willChange: 'transform', transition: 'none' }}>
        {children}
      </div>
    </div>
  );
}
