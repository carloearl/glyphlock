import React, { useEffect, useRef } from 'react';

/**
 * Electric nebula node field — drifting dots wired by energy lines.
 * Decorative canvas backdrop; never intercepts pointer events.
 */
export default function NebulaNodeField({ density = 62 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let nodes = [];
    let frame;
    let w = 0;
    let h = 0;

    const COLORS = ['#22d3ee', '#818cf8', '#d946ef', '#38bdf8'];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = Array.from({ length: density }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.24,
        vy: (Math.random() - 0.5) * 0.24,
        r: 1 + Math.random() * 2.1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);

      // energy links
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 132) {
            ctx.strokeStyle = a.color;
            ctx.globalAlpha = (1 - dist / 132) * 0.24;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // nodes
      for (const n of nodes) {
        const pulse = 0.6 + 0.4 * Math.sin(t / 620 + n.phase);
        ctx.globalAlpha = 0.9;
        ctx.shadowBlur = 14;
        ctx.shadowColor = n.color;
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (!reduce) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
        }
      }
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };

    resize();
    frame = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [density]);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
      style={{
        maskImage: 'radial-gradient(ellipse 62% 62% at 50% 50%, black 40%, transparent 78%)',
        WebkitMaskImage: 'radial-gradient(ellipse 62% 62% at 50% 50%, black 40%, transparent 78%)',
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,.30),transparent_62%),radial-gradient(circle_at_18%_78%,rgba(34,211,238,.18),transparent_55%),radial-gradient(circle_at_82%_22%,rgba(217,70,239,.18),transparent_55%)]" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}