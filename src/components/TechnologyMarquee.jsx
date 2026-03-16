import React, { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

const BANDS = [
  {
    label: "PAYMENTS · ANALYTICS",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.9)",
    logos: [
      { name: "Stripe",     src: "https://www.vectorlogo.zone/logos/stripe/stripe-icon.svg" },
      { name: "PayPal",     src: "https://www.vectorlogo.zone/logos/paypal/paypal-icon.svg" },
      { name: "Visa",       src: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" },
      { name: "Mastercard", src: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" },
      { name: "Datadog",    src: "https://www.vectorlogo.zone/logos/datadoghq/datadoghq-icon.svg" },
      { name: "Grafana",    src: "https://www.vectorlogo.zone/logos/grafana/grafana-icon.svg" },
      { name: "Splunk",     src: "https://www.vectorlogo.zone/logos/splunk/splunk-icon.svg" },
      { name: "NewRelic",   src: "https://www.vectorlogo.zone/logos/newrelic/newrelic-icon.svg" },
    ],
  },
  {
    label: "CLOUD · DATA",
    color: "#38bdf8",
    glow: "rgba(56,189,248,0.9)",
    logos: [
      { name: "AWS",        src: "https://www.vectorlogo.zone/logos/amazon_aws/amazon_aws-icon.svg" },
      { name: "GCloud",     src: "https://www.vectorlogo.zone/logos/google_cloud/google_cloud-icon.svg" },
      { name: "Azure",      src: "https://www.vectorlogo.zone/logos/microsoft_azure/microsoft_azure-icon.svg" },
      { name: "Snowflake",  src: "https://www.vectorlogo.zone/logos/snowflake/snowflake-icon.svg" },
      { name: "MongoDB",    src: "https://www.vectorlogo.zone/logos/mongodb/mongodb-icon.svg" },
      { name: "Redis",      src: "https://www.vectorlogo.zone/logos/redis/redis-icon.svg" },
      { name: "Firebase",   src: "https://www.vectorlogo.zone/logos/google_firebase/google_firebase-icon.svg" },
    ],
  },
  {
    label: "AI · SECURITY",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.9)",
    logos: [
      { name: "OpenAI",     src: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg" },
      { name: "NVIDIA",     src: "https://www.vectorlogo.zone/logos/nvidia/nvidia-icon.svg" },
      { name: "Cloudflare", src: "https://www.vectorlogo.zone/logos/cloudflare/cloudflare-icon.svg" },
      { name: "Okta",       src: "https://www.vectorlogo.zone/logos/okta/okta-icon.svg" },
      { name: "Cisco",      src: "https://www.vectorlogo.zone/logos/cisco/cisco-icon.svg" },
      { name: "Anthropic",  src: "https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg" },
    ],
  },
  {
    label: "INFRA · AI",
    color: "#60a5fa",
    glow: "rgba(96,165,250,0.9)",
    logos: [
      { name: "Docker",     src: "https://www.vectorlogo.zone/logos/docker/docker-icon.svg" },
      { name: "Kubernetes", src: "https://www.vectorlogo.zone/logos/kubernetes/kubernetes-icon.svg" },
      { name: "GitHub",     src: "https://www.vectorlogo.zone/logos/github/github-icon.svg" },
      { name: "Terraform",  src: "https://www.vectorlogo.zone/logos/terraformio/terraformio-icon.svg" },
    ],
  },
];

// Ring geometry: bottom = wide, top = narrow (cone shape)
// rx = half-width of ellipse, ry = half-height (perspective tilt), cy = vertical center fraction
const RING_LAYOUT = [
  { cyFrac: 0.80, rxFrac: 0.42, ryFrac: 0.07 }, // band 0 - base (widest, amber)
  { cyFrac: 0.57, rxFrac: 0.30, ryFrac: 0.055 }, // band 1
  { cyFrac: 0.37, rxFrac: 0.19, ryFrac: 0.042 }, // band 2
  { cyFrac: 0.18, rxFrac: 0.10, ryFrac: 0.030 }, // band 3 - apex (narrowest)
];

const LOGO_SIZE = 30;
const SPEEDS = [0.0035, 0.005, 0.007, 0.009];

export default function TechnologyMarquee() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const isInView = useInView(wrapRef, { once: true, amount: 0.1 });
  const rafRef = useRef(null);
  const anglesRef = useRef(BANDS.map((_, i) => (i * Math.PI) / BANDS.length));
  const imagesRef = useRef({}); // cache loaded images
  const [ready, setReady] = useState(false);

  // Pre-load all logos
  useEffect(() => {
    let loaded = 0;
    const all = BANDS.flatMap(b => b.logos);
    const total = all.length;
    all.forEach(({ name, src }) => {
      if (imagesRef.current[name]) { loaded++; if (loaded === total) setReady(true); return; }
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => { imagesRef.current[name] = img; loaded++; if (loaded === total) setReady(true); };
      img.onerror = () => { loaded++; if (loaded === total) setReady(true); };
      img.src = src;
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, W, H);

      // ── stars background ──
      ctx.save();
      for (let s = 0; s < 60; s++) {
        // deterministic star positions using index as seed
        const sx = ((s * 137.508 + 23) % W);
        const sy = ((s * 97.3 + 11) % H);
        const sr = 0.5 + (s % 3) * 0.5;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.08 + (s % 5) * 0.06})`;
        ctx.fill();
      }
      ctx.restore();

      // ── vertical glowing axis ──
      const cx = W / 2;
      const axisTop = H * 0.05;
      const axisBot = H * 0.88;
      const axisGrad = ctx.createLinearGradient(cx, axisTop, cx, axisBot);
      axisGrad.addColorStop(0, "rgba(96,165,250,0.9)");
      axisGrad.addColorStop(0.5, "rgba(167,139,250,0.5)");
      axisGrad.addColorStop(1, "rgba(245,158,11,0.3)");
      ctx.save();
      ctx.shadowColor = "#60a5fa";
      ctx.shadowBlur = 18;
      ctx.strokeStyle = axisGrad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, axisTop);
      ctx.lineTo(cx, axisBot);
      ctx.stroke();
      ctx.restore();

      // ── apex starburst ──
      const apexY = H * 0.05;
      for (let r = 3; r <= 28; r += 8) {
        ctx.beginPath();
        ctx.arc(cx, apexY, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(96,165,250,${0.6 - r * 0.015})`;
        ctx.lineWidth = r === 3 ? 3 : 1;
        ctx.shadowColor = "#60a5fa";
        ctx.shadowBlur = r === 3 ? 20 : 8;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(cx, apexY, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#93c5fd";
      ctx.shadowColor = "#60a5fa";
      ctx.shadowBlur = 30;
      ctx.fill();
      ctx.shadowBlur = 0;

      // ── draw each ring ──
      BANDS.forEach((band, bi) => {
        const layout = RING_LAYOUT[bi];
        const RX = W * layout.rxFrac;
        const RY = H * layout.ryFrac;
        const CY = H * layout.cyFrac;
        const angle = anglesRef.current[bi];
        const dir = bi % 2 === 0 ? 1 : -1;
        anglesRef.current[bi] += SPEEDS[bi] * dir;

        // ── ellipse ring glow layers ──
        // outer soft glow
        ctx.save();
        ctx.shadowColor = band.color;
        ctx.shadowBlur = 22;
        ctx.strokeStyle = band.color + "55";
        ctx.lineWidth = 18;
        ctx.beginPath();
        ctx.ellipse(cx, CY, RX, RY, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // mid glow
        ctx.save();
        ctx.shadowColor = band.color;
        ctx.shadowBlur = 14;
        ctx.strokeStyle = band.color + "88";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.ellipse(cx, CY, RX, RY, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // crisp ring line
        ctx.save();
        ctx.shadowColor = band.color;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = band.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(cx, CY, RX, RY, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // ── label on the front of the ring ──
        const fontSize = Math.max(10, RX * 0.13);
        ctx.save();
        ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
        ctx.letterSpacing = "3px";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = band.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#ffffff";
        // place label at right-front of ellipse (theta=0 is far right)
        const labelX = cx + RX * 0.28;
        const labelY = CY + RY * 0.2;
        ctx.fillText(band.label, labelX, labelY);
        ctx.restore();

        // ── logos orbiting the ring ──
        const logos = band.logos;
        logos.forEach((logo, li) => {
          const theta = (li / logos.length) * Math.PI * 2 + angle;
          const lx = cx + Math.cos(theta) * RX;
          const ly = CY + Math.sin(theta) * RY;

          // depth: sin(theta) ranges -1..1, remap to 0..1
          const depth = (Math.sin(theta) + 1) / 2; // 0=back, 1=front
          const scale = 0.45 + depth * 0.55;
          const opacity = 0.12 + depth * 0.85;
          const sz = LOGO_SIZE * scale;

          // behind center? draw smaller, dimmer
          const img = imagesRef.current[logo.name];
          if (!img) return;

          ctx.save();
          ctx.globalAlpha = opacity;

          // glow halo for front logos
          if (depth > 0.6) {
            ctx.shadowColor = band.color;
            ctx.shadowBlur = 14 * depth;
          }

          // pill background
          const pad = 4 * scale;
          ctx.beginPath();
          ctx.roundRect(lx - sz / 2 - pad, ly - sz / 2 - pad, sz + pad * 2, sz + pad * 2, 6 * scale);
          ctx.fillStyle = `rgba(10,15,40,${0.5 + depth * 0.3})`;
          ctx.fill();
          if (depth > 0.5) {
            ctx.strokeStyle = band.color + Math.round(depth * 99).toString(16).padStart(2, "0");
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          ctx.drawImage(img, lx - sz / 2, ly - sz / 2, sz, sz);
          ctx.restore();
        });
      });

      // ── base ground glow rings (amber like reference) ──
      const baseY = H * 0.87;
      const baseRX = W * 0.43;
      const baseRY = H * 0.048;

      [
        { rx: baseRX * 1.12, ry: baseRY * 1.35, color: "#f59e0b", lw: 1, opacity: 0.2 },
        { rx: baseRX * 1.0,  ry: baseRY,         color: "#f59e0b", lw: 2.5, opacity: 0.8 },
        { rx: baseRX * 0.88, ry: baseRY * 0.72,  color: "#f59e0b", lw: 1, opacity: 0.35 },
      ].forEach(r => {
        ctx.save();
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 20;
        ctx.strokeStyle = `rgba(245,158,11,${r.opacity})`;
        ctx.lineWidth = r.lw;
        ctx.beginPath();
        ctx.ellipse(cx, baseY, r.rx, r.ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [ready]);

  // Resize handler
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      const W = wrap.offsetWidth;
      const H = Math.min(680, Math.max(420, W * 0.75));
      canvas.width = W;
      canvas.height = H;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <div
      ref={wrapRef}
      className="w-full max-w-5xl mx-auto px-4 py-12 relative"
      style={{ background: "transparent" }}
    >
      {/* Header */}
      <div className="text-center mb-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
          style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8" }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#38bdf8" }} />
          Enterprise Integration Stack
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-2xl md:text-4xl font-bold text-white mb-2"
        >
          Built on World-Class Infrastructure
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-sm md:text-base text-white/55 max-w-xl mx-auto"
        >
          60+ enterprise technologies unified in one sovereign security stack.
        </motion.p>
      </div>

      {/* Canvas */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1.2, delay: 0.3 }}
        className="relative z-10 w-full"
      >
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            width: "100%",
            background: "transparent",
          }}
        />
      </motion.div>
    </div>
  );
}