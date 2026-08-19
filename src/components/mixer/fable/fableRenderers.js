/**
 * Fable Engine X canvas painters — backgrounds and spectrum visuals.
 * Every function is pure drawing: (ctx, geometry, frame, theme, settings).
 */
import { paintBackground } from "./fableBackgrounds";

export function makeParticles(count, W, H) {
  return Array.from({ length: count }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    z: Math.random() * 0.9 + 0.1,
    r: Math.random() * 3 + 1,
    drift: Math.random() * 2 - 1,
    spin: Math.random() * Math.PI,
  }));
}

/* ─────────────── Backgrounds ─────────────── */
/** Backgrounds now live in fableBackgrounds.js; this stays as the entry point. */
export function drawBackground(g, W, H, t, frame, theme, mode, particles) {
  paintBackground(g, W, H, t, frame, theme, mode, particles);
}



/* ─────────────── Spectrum visuals ─────────────── */

export function drawVisual(g, W, H, t, frame, theme, mode, intensity) {
  const [c1, c2, c3] = theme.colors;
  const bands = frame.bands || [];
  const gain = intensity;

  if (mode === "off") return;

  if (mode === "bars" || mode === "mirror") {
    const count = 64;
    const gap = 3;
    const bw = W / count - gap;
    for (let i = 0; i < count; i++) {
      const v = (bands[i] || 0) * gain;
      const h = Math.max(3, v * H * (mode === "mirror" ? 0.42 : 0.78));
      const x = i * (bw + gap);
      const grad = g.createLinearGradient(0, H - h, 0, H);
      grad.addColorStop(0, c3);
      grad.addColorStop(0.5, c2);
      grad.addColorStop(1, c1);
      g.fillStyle = grad;
      if (mode === "mirror") {
        g.fillRect(x, H / 2 - h, bw, h);
        g.globalAlpha = 0.45;
        g.fillRect(x, H / 2, bw, h);
        g.globalAlpha = 1;
      } else {
        g.fillRect(x, H - h, bw, h);
      }
    }
    return;
  }

  if (mode === "radial") {
    const cx = W / 2;
    const cy = H / 2;
    const base = Math.min(W, H) * 0.16;
    const count = 96;
    g.lineWidth = Math.max(2, W / 420);
    for (let i = 0; i < count; i++) {
      const v = (bands[i % bands.length] || 0) * gain;
      const a = (i / count) * Math.PI * 2 + t * 0.0002;
      const len = base + v * Math.min(W, H) * 0.38;
      g.strokeStyle = i % 3 === 0 ? c3 : i % 3 === 1 ? c2 : c1;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * base, cy + Math.sin(a) * base);
      g.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      g.stroke();
    }
    g.strokeStyle = c3;
    g.lineWidth = 2 + frame.bass * 8;
    g.beginPath();
    g.arc(cx, cy, base * (1 + frame.bass * 0.35), 0, Math.PI * 2);
    g.stroke();
    return;
  }

  if (mode === "wave") {
    const shape = frame.shape || [];
    g.lineWidth = Math.max(2, H / 200);
    for (let layer = 0; layer < 3; layer++) {
      g.strokeStyle = [c1, c2, c3][layer];
      g.globalAlpha = 0.5 + layer * 0.22;
      g.beginPath();
      shape.forEach((v, i) => {
        const x = (i / Math.max(1, shape.length - 1)) * W;
        const y = H / 2 + v * H * 0.3 * gain * (1 - layer * 0.25) + layer * 10;
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      });
      g.stroke();
    }
    g.globalAlpha = 1;
    return;
  }

  if (mode === "peaks") {
    const count = 56;
    const gap = 4;
    const bw = W / count - gap;
    for (let i = 0; i < count; i++) {
      const v = (bands[i] || 0) * gain;
      const h = Math.max(3, v * H * 0.7);
      const x = i * (bw + gap);
      g.fillStyle = `${c1}cc`;
      g.fillRect(x, H - h, bw, h);
      g.fillStyle = c3;
      g.fillRect(x, H - h - 6, bw, 4);
    }
    return;
  }

  if (mode === "rings") {
    const cx = W / 2;
    const cy = H / 2;
    for (let i = 0; i < 9; i++) {
      const v = (bands[i * 6] || 0) * gain;
      g.strokeStyle = [c1, c2, c3][i % 3];
      g.globalAlpha = 0.35 + v;
      g.lineWidth = 2 + v * 10;
      g.beginPath();
      g.arc(cx, cy, Math.min(W, H) * (0.06 + i * 0.05) * (1 + v * 0.3), 0, Math.PI * 2);
      g.stroke();
    }
    g.globalAlpha = 1;
    return;
  }

  if (mode === "spiral") {
    const cx = W / 2;
    const cy = H / 2;
    const turns = 220;
    g.lineWidth = Math.max(2, W / 500);
    g.beginPath();
    for (let i = 0; i < turns; i++) {
      const v = (bands[i % Math.max(1, bands.length)] || 0) * gain;
      const a = (i / turns) * Math.PI * 8 + t * 0.0004;
      const rad = (i / turns) * Math.min(W, H) * 0.45 * (1 + v * 0.5);
      const x = cx + Math.cos(a) * rad;
      const y = cy + Math.sin(a) * rad;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.strokeStyle = c2;
    g.stroke();
    return;
  }

  if (mode === "blocks") {
    const cols = 32;
    const rows = 12;
    const cw = W / cols;
    const ch = H / rows;
    for (let i = 0; i < cols; i++) {
      const v = (bands[i * 2] || 0) * gain;
      const lit = Math.round(v * rows);
      for (let r = 0; r < lit; r++) {
        g.fillStyle = r > rows * 0.75 ? c3 : r > rows * 0.45 ? c2 : c1;
        g.fillRect(i * cw + 2, H - (r + 1) * ch + 2, cw - 4, ch - 4);
      }
    }
    return;
  }

  if (mode === "orbs") {
    const cx = W / 2;
    const cy = H / 2;
    for (let i = 0; i < 7; i++) {
      const v = (bands[i * 8] || 0) * gain;
      const a = t * 0.0004 * (i % 2 ? 1 : -1) + i;
      const dist = Math.min(W, H) * (0.12 + i * 0.055);
      const x = cx + Math.cos(a) * dist;
      const y = cy + Math.sin(a) * dist * 0.7;
      const r = Math.min(W, H) * (0.03 + v * 0.09);
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, c3);
      grad.addColorStop(0.4, `${c2}cc`);
      grad.addColorStop(1, "transparent");
      g.fillStyle = grad;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
  }
}