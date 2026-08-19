/**
 * Fable Engine X canvas painters — backgrounds and spectrum visuals.
 * Every function is pure drawing: (ctx, geometry, frame, theme, settings).
 */

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

export function drawBackground(g, W, H, t, frame, theme, mode, particles) {
  const [c1, c2, c3] = theme.colors;
  const e = frame.energy;

  if (mode === "nebula") {
    for (let i = 0; i < 3; i++) {
      const cx = W * (0.3 + 0.2 * Math.sin(t * 0.00013 + i * 2));
      const cy = H * (0.4 + 0.25 * Math.cos(t * 0.00017 + i * 1.7));
      const rad = Math.min(W, H) * (0.35 + 0.18 * i + e * 0.25);
      const grad = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
      grad.addColorStop(0, `${[c1, c2, c3][i]}66`);
      grad.addColorStop(1, "transparent");
      g.fillStyle = grad;
      g.fillRect(0, 0, W, H);
    }
    return;
  }

  if (mode === "starfield") {
    g.fillStyle = c3;
    particles.forEach((p) => {
      p.y += (0.4 + p.z * 2.4) * (1 + e * 2);
      if (p.y > H) { p.y = -4; p.x = Math.random() * W; }
      g.globalAlpha = 0.25 + p.z * 0.7;
      g.fillRect(p.x, p.y, p.z * 2, p.z * 2 + e * 4);
    });
    g.globalAlpha = 1;
    return;
  }

  if (mode === "tunnel") {
    const cx = W / 2;
    const cy = H / 2;
    g.lineWidth = 1.5;
    for (let i = 0; i < 18; i++) {
      const k = ((t * 0.00035 + i / 18) % 1);
      const size = k * k * Math.max(W, H) * (1 + e * 0.5);
      g.strokeStyle = i % 2 ? `${c1}80` : `${c2}80`;
      g.strokeRect(cx - size / 2, cy - size / 2, size, size);
    }
    return;
  }

  if (mode === "aurora") {
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      const base = H * (0.25 + i * 0.16);
      g.moveTo(0, base);
      for (let x = 0; x <= W; x += 24) {
        const y = base + Math.sin(x * 0.004 + t * 0.0006 + i) * (40 + e * 160);
        g.lineTo(x, y);
      }
      g.lineTo(W, H);
      g.lineTo(0, H);
      g.closePath();
      const grad = g.createLinearGradient(0, base - 120, 0, H);
      grad.addColorStop(0, `${[c1, c2, c3][i % 3]}55`);
      grad.addColorStop(1, "transparent");
      g.fillStyle = grad;
      g.fill();
    }
    return;
  }

  if (mode === "plasma") {
    const grad = g.createLinearGradient(0, 0, W, H);
    const shift = (Math.sin(t * 0.0004) + 1) / 2;
    grad.addColorStop(0, `${c1}${Math.round(60 + e * 80).toString(16).padStart(2, "0")}`);
    grad.addColorStop(Math.max(0.05, Math.min(0.95, shift)), `${c2}55`);
    grad.addColorStop(1, `${c3}22`);
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
    return;
  }

  if (mode === "confetti") {
    particles.forEach((p, i) => {
      p.y += (1.2 + p.z * 3) * (1 + e);
      p.x += Math.sin(t * 0.001 + p.spin) * p.drift;
      p.spin += 0.05;
      if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.spin);
      g.fillStyle = [c1, c2, c3][i % 3];
      g.globalAlpha = 0.85;
      g.fillRect(-p.r, -p.r * 2, p.r * 2, p.r * 4);
      g.restore();
    });
    g.globalAlpha = 1;
    return;
  }

  if (mode === "snow") {
    g.fillStyle = c3;
    particles.forEach((p) => {
      p.y += 0.6 + p.z * 1.6;
      p.x += Math.sin(t * 0.0008 + p.spin) * 0.8;
      if (p.y > H) { p.y = -6; p.x = Math.random() * W; }
      g.globalAlpha = 0.35 + p.z * 0.5;
      g.beginPath();
      g.arc(p.x, p.y, p.r * 0.9, 0, Math.PI * 2);
      g.fill();
    });
    g.globalAlpha = 1;
    return;
  }

  if (mode === "embers") {
    particles.forEach((p, i) => {
      p.y -= (0.8 + p.z * 2.6) * (1 + frame.bass * 2);
      p.x += Math.sin(t * 0.0012 + p.spin) * 1.1;
      if (p.y < -8) { p.y = H + 8; p.x = Math.random() * W; }
      g.globalAlpha = 0.2 + p.z * 0.6;
      g.fillStyle = [c1, c2, c3][i % 3];
      g.beginPath();
      g.arc(p.x, p.y, p.r * (0.7 + frame.bass), 0, Math.PI * 2);
      g.fill();
    });
    g.globalAlpha = 1;
  }
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