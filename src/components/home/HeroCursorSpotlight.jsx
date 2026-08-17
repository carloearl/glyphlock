import React, { useEffect, useRef, useState } from 'react';

/**
 * Cursor-tracking energy spotlight that covers an entire section.
 * Mount inside a `relative` section; purely decorative.
 */
export default function HeroCursorSpotlight() {
  const wrapRef = useRef(null);
  const [pos, setPos] = useState({ x: -9999, y: -9999 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    const section = wrapRef.current?.parentElement;
    if (!section) return;

    const onMove = (e) => {
      const rect = section.getBoundingClientRect();
      setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setActive(true);
    };
    const onLeave = () => setActive(false);

    section.addEventListener('mousemove', onMove);
    section.addEventListener('mouseleave', onLeave);
    return () => {
      section.removeEventListener('mousemove', onMove);
      section.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div ref={wrapRef} className="pointer-events-none absolute inset-0 z-[15] overflow-hidden" aria-hidden="true">
      {/* Hidden circuit grid, revealed only where the cursor travels */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: active ? 1 : 0,
          backgroundImage:
            'linear-gradient(rgba(34,211,238,.55) 1px,transparent 1px),linear-gradient(90deg,rgba(217,70,239,.45) 1px,transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage: `radial-gradient(220px circle at ${pos.x}px ${pos.y}px, black 0%, rgba(0,0,0,.35) 55%, transparent 72%)`,
          WebkitMaskImage: `radial-gradient(220px circle at ${pos.x}px ${pos.y}px, black 0%, rgba(0,0,0,.35) 55%, transparent 72%)`,
        }}
      />

      {/* Soft plasma glow trailing the cursor */}
      <div
        className="absolute h-[560px] w-[560px] rounded-full transition-opacity duration-500"
        style={{
          left: pos.x,
          top: pos.y,
          transform: 'translate(-50%,-50%)',
          opacity: active ? 1 : 0,
          background:
            'radial-gradient(circle, rgba(34,211,238,.16) 0%, rgba(99,102,241,.12) 38%, rgba(217,70,239,.08) 58%, transparent 72%)',
          filter: 'blur(28px)',
        }}
      />

      {/* Tight core */}
      <div
        className="absolute h-24 w-24 rounded-full transition-opacity duration-300"
        style={{
          left: pos.x,
          top: pos.y,
          transform: 'translate(-50%,-50%)',
          opacity: active ? 1 : 0,
          background: 'radial-gradient(circle, rgba(224,252,255,.30), transparent 68%)',
          filter: 'blur(6px)',
        }}
      />
    </div>
  );
}