/**
 * Fable Engine X — background painter library.
 * Pure canvas drawing: (ctx, W, H, t, frame, theme, particles).
 * Each painter is registered in BG_PAINTERS and selected by key.
 */

const hex = (c, a) => `${c}${Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, "0")}`;

/* ── Real volumetric clouds ───────────────────────────────
   Each cloud is a cluster of soft radial puffs that drift
   across the frame and swell gently with the low end. */
function clouds(g, W, H, t, frame, theme, particles, opts = {}) {
  const [c1, c2, c3] = theme.colors;
  const dark = !!opts.storm;
  const count = 6;
  const swell = 1 + frame.bass * 0.22;

  for (let i = 0; i < count; i++) {
    const p = particles[i] || { z: 0.5, spin: i };
    const depth = 0.35 + p.z * 0.75;
    const speed = 0.004 + depth * 0.012;
    const span = W * 1.6;
    const cx = ((t * speed + i * 260) % span) - span * 0.18;
    const cy = H * (0.12 + ((i * 0.37) % 1) * 0.72) + Math.sin(t * 0.0002 + p.spin) * 14;
    const scale = Math.min(W, H) * (0.07 + depth * 0.1) * swell;

    // Puff cluster — offsets in units of `scale`.
    const puffs = [
      [-1.5, 0.22, 0.72], [-0.7, -0.18, 0.95], [0.15, -0.42, 1.05],
      [1.0, -0.1, 0.88], [1.75, 0.25, 0.66], [0.3, 0.3, 1.0], [-0.4, 0.34, 0.8],
    ];

    puffs.forEach(([ox, oy, pr], k) => {
      const x = cx + ox * scale;
      const y = cy + oy * scale;
      const r = pr * scale;
      const grad = g.createRadialGradient(x, y - r * 0.25, r * 0.1, x, y, r);
      const top = dark ? c1 : "#ffffff";
      const body = dark ? c2 : c3;
      grad.addColorStop(0, hex(top, dark ? 0.34 : 0.3 * depth + 0.1));
      grad.addColorStop(0.55, hex(body, 0.14 * depth + 0.04));
      grad.addColorStop(1, hex(c1, 0));
      g.fillStyle = grad;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();

      // Shaded underside gives the puffs real volume.
      if (k % 2 === 0) {
        const sh = g.createRadialGradient(x, y + r * 0.4, r * 0.05, x, y + r * 0.35, r * 0.8);
        sh.addColorStop(0, hex(c1, 0.3 * depth));
        sh.addColorStop(1, hex(c1, 0));
        g.fillStyle = sh;
        g.beginPath();
        g.arc(x, y + r * 0.35, r * 0.8, 0, Math.PI * 2);
        g.fill();
      }
    });
  }
}

function nebula(g, W, H, t, frame, theme) {
  const cols = theme.colors;
  for (let i = 0; i < 3; i++) {
    const cx = W * (0.3 + 0.2 * Math.sin(t * 0.00013 + i * 2));
    const cy = H * (0.4 + 0.25 * Math.cos(t * 0.00017 + i * 1.7));
    const rad = Math.min(W, H) * (0.35 + 0.18 * i + frame.energy * 0.25);
    const grad = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
    grad.addColorStop(0, hex(cols[i], 0.4));
    grad.addColorStop(1, hex(cols[i], 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
  }
}

function starfield(g, W, H, t, frame, theme, particles) {
  g.fillStyle = theme.colors[2];
  particles.forEach((p) => {
    p.y += (0.4 + p.z * 2.4) * (1 + frame.energy * 2);
    if (p.y > H) { p.y = -4; p.x = Math.random() * W; }
    g.globalAlpha = 0.25 + p.z * 0.7;
    g.fillRect(p.x, p.y, p.z * 2, p.z * 2 + frame.energy * 4);
  });
  g.globalAlpha = 1;
}

function warp(g, W, H, t, frame, theme, particles) {
  const cx = W / 2, cy = H / 2;
  g.lineWidth = 1.6;
  particles.forEach((p, i) => {
    p.z += 0.006 + frame.energy * 0.05;
    if (p.z > 1) p.z = 0.05;
    const a = p.spin * 2;
    const near = p.z * Math.max(W, H) * 0.75;
    const far = near * 0.82;
    g.strokeStyle = hex(theme.colors[i % 3], 0.2 + p.z * 0.7);
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * far, cy + Math.sin(a) * far);
    g.lineTo(cx + Math.cos(a) * near, cy + Math.sin(a) * near);
    g.stroke();
  });
}

function tunnel(g, W, H, t, frame, theme) {
  const cx = W / 2, cy = H / 2;
  g.lineWidth = 1.5;
  for (let i = 0; i < 18; i++) {
    const k = (t * 0.00035 + i / 18) % 1;
    const size = k * k * Math.max(W, H) * (1 + frame.energy * 0.5);
    g.strokeStyle = hex(theme.colors[i % 2], 0.5);
    g.strokeRect(cx - size / 2, cy - size / 2, size, size);
  }
}

function aurora(g, W, H, t, frame, theme) {
  for (let i = 0; i < 4; i++) {
    g.beginPath();
    const base = H * (0.25 + i * 0.16);
    g.moveTo(0, base);
    for (let x = 0; x <= W; x += 24) {
      g.lineTo(x, base + Math.sin(x * 0.004 + t * 0.0006 + i) * (40 + frame.energy * 160));
    }
    g.lineTo(W, H); g.lineTo(0, H); g.closePath();
    const grad = g.createLinearGradient(0, base - 120, 0, H);
    grad.addColorStop(0, hex(theme.colors[i % 3], 0.35));
    grad.addColorStop(1, hex(theme.colors[0], 0));
    g.fillStyle = grad;
    g.fill();
  }
}

function plasma(g, W, H, t, frame, theme) {
  const [c1, c2, c3] = theme.colors;
  const grad = g.createLinearGradient(0, 0, W, H);
  const shift = Math.max(0.05, Math.min(0.95, (Math.sin(t * 0.0004) + 1) / 2));
  grad.addColorStop(0, hex(c1, 0.25 + frame.energy * 0.4));
  grad.addColorStop(shift, hex(c2, 0.34));
  grad.addColorStop(1, hex(c3, 0.13));
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
}

function confetti(g, W, H, t, frame, theme, particles) {
  particles.forEach((p, i) => {
    p.y += (1.2 + p.z * 3) * (1 + frame.energy);
    p.x += Math.sin(t * 0.001 + p.spin) * p.drift;
    p.spin += 0.05;
    if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
    g.save(); g.translate(p.x, p.y); g.rotate(p.spin);
    g.fillStyle = theme.colors[i % 3];
    g.globalAlpha = 0.85;
    g.fillRect(-p.r, -p.r * 2, p.r * 2, p.r * 4);
    g.restore();
  });
  g.globalAlpha = 1;
}

function snow(g, W, H, t, frame, theme, particles) {
  g.fillStyle = theme.colors[2];
  particles.forEach((p) => {
    p.y += 0.6 + p.z * 1.6;
    p.x += Math.sin(t * 0.0008 + p.spin) * 0.8;
    if (p.y > H) { p.y = -6; p.x = Math.random() * W; }
    g.globalAlpha = 0.35 + p.z * 0.5;
    g.beginPath(); g.arc(p.x, p.y, p.r * 0.9, 0, Math.PI * 2); g.fill();
  });
  g.globalAlpha = 1;
}

function rain(g, W, H, t, frame, theme, particles) {
  g.lineWidth = 1.4;
  particles.forEach((p) => {
    p.y += 14 + p.z * 22 + frame.energy * 20;
    if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
    g.strokeStyle = hex(theme.colors[2], 0.15 + p.z * 0.4);
    g.beginPath();
    g.moveTo(p.x, p.y);
    g.lineTo(p.x + 2, p.y + 16 + p.z * 18);
    g.stroke();
  });
}

function embers(g, W, H, t, frame, theme, particles) {
  particles.forEach((p, i) => {
    p.y -= (0.8 + p.z * 2.6) * (1 + frame.bass * 2);
    p.x += Math.sin(t * 0.0012 + p.spin) * 1.1;
    if (p.y < -8) { p.y = H + 8; p.x = Math.random() * W; }
    g.globalAlpha = 0.2 + p.z * 0.6;
    g.fillStyle = theme.colors[i % 3];
    g.beginPath(); g.arc(p.x, p.y, p.r * (0.7 + frame.bass), 0, Math.PI * 2); g.fill();
  });
  g.globalAlpha = 1;
}

function smoke(g, W, H, t, frame, theme, particles) {
  particles.slice(0, 26).forEach((p, i) => {
    const y = H + 40 - ((t * (0.02 + p.z * 0.03) + i * 90) % (H + 120));
    const x = p.x + Math.sin(t * 0.0004 + p.spin) * 60;
    const r = Math.min(W, H) * (0.08 + p.z * 0.16) * (1 + frame.bass * 0.3);
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, hex(theme.colors[1], 0.16));
    grad.addColorStop(1, hex(theme.colors[0], 0));
    g.fillStyle = grad;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  });
}

function bokeh(g, W, H, t, frame, theme, particles) {
  particles.slice(0, 34).forEach((p, i) => {
    const x = p.x + Math.sin(t * 0.0003 + p.spin) * 40;
    const y = p.y + Math.cos(t * 0.00025 + p.spin) * 30;
    const r = Math.min(W, H) * (0.02 + p.z * 0.07) * (1 + frame.mid * 0.5);
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, hex(theme.colors[i % 3], 0.4));
    grad.addColorStop(0.7, hex(theme.colors[i % 3], 0.12));
    grad.addColorStop(1, hex(theme.colors[i % 3], 0));
    g.fillStyle = grad;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  });
}

function fireworks(g, W, H, t, frame, theme) {
  for (let s = 0; s < 4; s++) {
    const cycle = (t * 0.0006 + s * 0.31) % 1;
    const cx = W * (0.2 + ((s * 0.27) % 0.7));
    const cy = H * (0.2 + ((s * 0.19) % 0.45));
    const rad = cycle * Math.min(W, H) * 0.42;
    const alpha = (1 - cycle) * (0.5 + frame.energy * 0.5);
    g.lineWidth = 2;
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      g.strokeStyle = hex(theme.colors[(i + s) % 3], alpha);
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * rad * 0.75, cy + Math.sin(a) * rad * 0.75);
      g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
      g.stroke();
    }
  }
}

function ocean(g, W, H, t, frame, theme) {
  for (let i = 0; i < 7; i++) {
    const base = H * (0.5 + i * 0.08);
    g.beginPath();
    g.moveTo(0, base);
    for (let x = 0; x <= W; x += 18) {
      g.lineTo(x, base + Math.sin(x * 0.006 + t * 0.0011 + i) * (10 + frame.bass * 40));
    }
    g.lineTo(W, H); g.lineTo(0, H); g.closePath();
    g.fillStyle = hex(theme.colors[i % 3], 0.16);
    g.fill();
  }
}

function city(g, W, H, t, frame, theme) {
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, hex(theme.colors[0], 0.5));
  grad.addColorStop(1, hex(theme.colors[1], 0.1));
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  const cols = 26;
  for (let i = 0; i < cols; i++) {
    const bw = W / cols;
    const bh = H * (0.18 + ((i * 37) % 100) / 100 * 0.34) * (1 + frame.bass * 0.12);
    g.fillStyle = hex("#000000", 0.72);
    g.fillRect(i * bw, H - bh, bw - 3, bh);
    for (let r = 0; r < 7; r++) {
      if ((i * 7 + r) % 3) continue;
      g.fillStyle = hex(theme.colors[2], 0.35 + frame.high * 0.5);
      g.fillRect(i * bw + 6, H - bh + 10 + r * (bh / 8), bw * 0.22, bh / 16);
    }
  }
}

function hexgrid(g, W, H, t, frame, theme) {
  const r = 34;
  const dy = r * 1.5;
  const dx = Math.sqrt(3) * r;
  g.lineWidth = 1.2;
  for (let row = -1; row * dy < H + dy; row++) {
    for (let col = -1; col * dx < W + dx; col++) {
      const cx = col * dx + (row % 2 ? dx / 2 : 0);
      const cy = row * dy;
      const pulse = (Math.sin(t * 0.002 + col * 0.5 + row * 0.4) + 1) / 2;
      g.strokeStyle = hex(theme.colors[(row + col) % 3], 0.08 + pulse * (0.15 + frame.energy * 0.5));
      g.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const x = cx + Math.cos(a) * r * 0.92;
        const y = cy + Math.sin(a) * r * 0.92;
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.closePath();
      g.stroke();
    }
  }
}

function vortex(g, W, H, t, frame, theme) {
  const cx = W / 2, cy = H / 2;
  g.lineWidth = 2;
  for (let arm = 0; arm < 5; arm++) {
    g.strokeStyle = hex(theme.colors[arm % 3], 0.35 + frame.energy * 0.4);
    g.beginPath();
    for (let i = 0; i < 140; i++) {
      const k = i / 140;
      const a = k * Math.PI * 5 + t * 0.0007 + (arm / 5) * Math.PI * 2;
      const rad = k * Math.min(W, H) * 0.5 * (1 + frame.bass * 0.2);
      const x = cx + Math.cos(a) * rad;
      const y = cy + Math.sin(a) * rad * 0.72;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  }
}

function ribbons(g, W, H, t, frame, theme) {
  for (let i = 0; i < 5; i++) {
    g.beginPath();
    for (let x = 0; x <= W; x += 16) {
      const y = H / 2 + Math.sin(x * 0.003 + t * 0.0008 + i * 1.2) * (H * 0.18 + frame.mid * H * 0.2);
      if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.lineWidth = 10 + frame.bass * 22;
    g.strokeStyle = hex(theme.colors[i % 3], 0.3);
    g.stroke();
  }
}

function sunset(g, W, H, t, frame, theme) {
  const bands = 12;
  for (let i = 0; i < bands; i++) {
    const k = i / bands;
    g.fillStyle = hex(theme.colors[i % 3], 0.1 + k * 0.28);
    const h = (H / bands) * (1 + Math.sin(t * 0.0006 + i) * 0.08);
    g.fillRect(0, k * H, W, h);
  }
  const sunR = Math.min(W, H) * (0.16 + frame.bass * 0.05);
  const grad = g.createRadialGradient(W / 2, H * 0.52, 0, W / 2, H * 0.52, sunR);
  grad.addColorStop(0, hex(theme.colors[2], 0.85));
  grad.addColorStop(1, hex(theme.colors[1], 0));
  g.fillStyle = grad;
  g.beginPath(); g.arc(W / 2, H * 0.52, sunR, 0, Math.PI * 2); g.fill();
}

function matrix(g, W, H, t, frame, theme) {
  const cols = Math.ceil(W / 18);
  g.font = "16px 'JetBrains Mono', monospace";
  for (let i = 0; i < cols; i++) {
    const speed = 60 + ((i * 37) % 90);
    const y = ((t * 0.001 * speed + i * 90) % (H + 160)) - 80;
    g.fillStyle = i % 5 === 0 ? theme.colors[2] : theme.colors[1];
    g.globalAlpha = 0.25 + frame.energy * 0.6;
    g.fillText("01".charAt(i % 2), i * 18, y);
    g.globalAlpha = 0.5 + frame.energy * 0.5;
    g.fillText("Δ", i * 18, y - 22);
  }
  g.globalAlpha = 1;
}

function kaleido(g, W, H, t, frame, theme) {
  const cx = W / 2, cy = H / 2, wedges = 12;
  for (let i = 0; i < wedges; i++) {
    const a = (i / wedges) * Math.PI * 2 + t * 0.0003;
    const rad = Math.min(W, H) * (0.25 + frame.energy * 0.5);
    g.fillStyle = hex(theme.colors[i % 3], 0.27);
    g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, rad, a, a + Math.PI / wedges); g.closePath(); g.fill();
  }
}

function lasers(g, W, H, t, frame, theme) {
  g.lineWidth = 2;
  for (let i = 0; i < 14; i++) {
    const a = Math.sin(t * 0.0006 + i * 0.5) * 0.7 - Math.PI / 2;
    const len = Math.max(W, H) * (0.8 + frame.energy * 0.6);
    g.strokeStyle = hex(theme.colors[i % 3], 0.55);
    g.beginPath();
    g.moveTo(W / 2, H * 0.08);
    g.lineTo(W / 2 + Math.cos(a + i * 0.22) * len, H * 0.08 + Math.sin(a + i * 0.22) * len);
    g.stroke();
  }
}

function floor(g, W, H, t, frame, theme) {
  const horizon = H * 0.45;
  const rows = 16;
  for (let r = 0; r < rows; r++) {
    const k = (r + ((t * 0.0004) % 1)) / rows;
    const y = horizon + k * k * (H - horizon) * 1.3;
    const nh = Math.max(2, (H - horizon) * 0.06 * (k + 0.2));
    for (let c = 0; c < 12; c++) {
      if ((c + r) % 2) continue;
      g.fillStyle = hex((r + c) % 4 === 0 ? theme.colors[1] : theme.colors[0], 0.18 + frame.energy * 0.4);
      g.fillRect((c / 12) * W, y, W / 12, nh);
    }
  }
}

function spotlights(g, W, H, t, frame, theme) {
  for (let i = 0; i < 5; i++) {
    const sway = Math.sin(t * 0.0008 + i * 1.3) * W * 0.28;
    const baseX = (i + 0.5) * (W / 5);
    g.beginPath();
    g.moveTo(baseX, -20);
    g.lineTo(baseX + sway - 90, H + 20);
    g.lineTo(baseX + sway + 90, H + 20);
    g.closePath();
    const grad = g.createLinearGradient(baseX, 0, baseX + sway, H);
    grad.addColorStop(0, hex(theme.colors[i % 3], 0.34 + frame.energy * 0.3));
    grad.addColorStop(1, hex(theme.colors[i % 3], 0));
    g.fillStyle = grad;
    g.fill();
  }
}

export const BG_PAINTERS = {
  clouds,
  storm: (g, W, H, t, f, th, p) => clouds(g, W, H, t, f, th, p, { storm: true }),
  nebula, starfield, warp, tunnel, aurora, plasma, confetti, snow, rain,
  embers, smoke, bokeh, fireworks, ocean, city, hexgrid, vortex, ribbons,
  sunset, matrix, kaleido, lasers, floor, spotlights,
};

export function paintBackground(g, W, H, t, frame, theme, mode, particles) {
  const painter = BG_PAINTERS[mode];
  if (painter) painter(g, W, H, t, frame, theme, particles);
}