import React, { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

// Category bands that spiral up the cone — like the reference image
const SPIRAL_BANDS = [
  {
    label: "PAYMENTS · ANALYTICS",
    color: "#f59e0b",        // amber/gold — base glow like reference
    glowColor: "rgba(245,158,11,0.8)",
    items: ["Stripe", "PayPal", "Visa", "Mastercard", "Coinbase", "Datadog", "Grafana", "Splunk", "NewRelic"],
  },
  {
    label: "CLOUD · DATA",
    color: "#38bdf8",
    glowColor: "rgba(56,189,248,0.9)",
    items: ["AWS", "GCloud", "Azure", "Snowflake", "PostgreSQL", "MongoDB", "Redis", "Firebase", "Supabase"],
  },
  {
    label: "AI · SECURITY",
    color: "#818cf8",
    glowColor: "rgba(129,140,248,0.9)",
    items: ["OpenAI", "Anthropic", "Gemini", "NVIDIA", "Okta", "Cloudflare", "Cisco", "HuggingFace"],
  },
  {
    label: "INFRA · AI",
    color: "#60a5fa",
    glowColor: "rgba(96,165,250,0.9)",
    items: ["Docker", "Kubernetes", "Terraform", "Linux", "GitHub", "GitLab", "CircleCI", "Nginx"],
  },
];

const TECH_LOGOS = {
  Stripe:     "https://www.vectorlogo.zone/logos/stripe/stripe-icon.svg",
  PayPal:     "https://www.vectorlogo.zone/logos/paypal/paypal-icon.svg",
  Visa:       "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg",
  Mastercard: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg",
  Coinbase:   "https://upload.wikimedia.org/wikipedia/commons/1/1a/Coinbase.svg",
  Datadog:    "https://www.vectorlogo.zone/logos/datadoghq/datadoghq-icon.svg",
  Grafana:    "https://www.vectorlogo.zone/logos/grafana/grafana-icon.svg",
  Splunk:     "https://www.vectorlogo.zone/logos/splunk/splunk-icon.svg",
  NewRelic:   "https://www.vectorlogo.zone/logos/newrelic/newrelic-icon.svg",
  AWS:        "https://www.vectorlogo.zone/logos/amazon_aws/amazon_aws-icon.svg",
  GCloud:     "https://www.vectorlogo.zone/logos/google_cloud/google_cloud-icon.svg",
  Azure:      "https://www.vectorlogo.zone/logos/microsoft_azure/microsoft_azure-icon.svg",
  Snowflake:  "https://www.vectorlogo.zone/logos/snowflake/snowflake-icon.svg",
  PostgreSQL: "https://www.vectorlogo.zone/logos/postgresql/postgresql-icon.svg",
  MongoDB:    "https://www.vectorlogo.zone/logos/mongodb/mongodb-icon.svg",
  Redis:      "https://www.vectorlogo.zone/logos/redis/redis-icon.svg",
  Firebase:   "https://www.vectorlogo.zone/logos/google_firebase/google_firebase-icon.svg",
  Supabase:   "https://upload.wikimedia.org/wikipedia/commons/b/b8/Supabase_Logo.svg",
  OpenAI:     "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg",
  Anthropic:  "https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg",
  Gemini:     "https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg",
  NVIDIA:     "https://www.vectorlogo.zone/logos/nvidia/nvidia-icon.svg",
  Okta:       "https://www.vectorlogo.zone/logos/okta/okta-icon.svg",
  Cloudflare: "https://www.vectorlogo.zone/logos/cloudflare/cloudflare-icon.svg",
  Cisco:      "https://www.vectorlogo.zone/logos/cisco/cisco-icon.svg",
  HuggingFace:"https://huggingface.co/front/assets/huggingface_logo.svg",
  Docker:     "https://www.vectorlogo.zone/logos/docker/docker-icon.svg",
  Kubernetes: "https://www.vectorlogo.zone/logos/kubernetes/kubernetes-icon.svg",
  Terraform:  "https://www.vectorlogo.zone/logos/terraformio/terraformio-icon.svg",
  Linux:      "https://www.vectorlogo.zone/logos/linux/linux-icon.svg",
  GitHub:     "https://www.vectorlogo.zone/logos/github/github-icon.svg",
  GitLab:     "https://www.vectorlogo.zone/logos/gitlab/gitlab-icon.svg",
  CircleCI:   "https://www.vectorlogo.zone/logos/circleci/circleci-icon.svg",
  Nginx:      "https://www.vectorlogo.zone/logos/nginx/nginx-icon.svg",
};

// Each band is a horizontal ellipse at a different Y height and radius
// Bottom band = widest, top band = narrowest (cone/pyramid shape)
const BAND_CONFIG = [
  { yFrac: 0.82, rxFrac: 0.42, thickness: 52, tilt: 0.18 },  // base — widest
  { yFrac: 0.58, rxFrac: 0.30, thickness: 44, tilt: 0.16 },
  { yFrac: 0.36, rxFrac: 0.20, thickness: 36, tilt: 0.14 },
  { yFrac: 0.16, rxFrac: 0.11, thickness: 28, tilt: 0.12 },  // apex — narrowest
];

function SpiralBand({ band, config, containerWidth, containerHeight, totalBands, bandIndex }) {
  const angleRef = useRef(bandIndex % 2 === 0 ? 0 : Math.PI);
  const rafRef = useRef(null);
  const speed = 0.004 + bandIndex * 0.002;
  const dir = bandIndex % 2 === 0 ? 1 : -1;

  const rx = containerWidth * config.rxFrac;
  const ry = rx * 0.22; // flatten for perspective tilt
  const cy = containerHeight * config.yFrac;
  const count = band.items.length;

  const [positions, setPositions] = useState(() =>
    band.items.map((_, i) => ({ x: 0, y: 0, z: 0, normZ: 0.5 }))
  );

  useEffect(() => {
    const tick = () => {
      angleRef.current += speed * dir;
      const base = angleRef.current;
      setPositions(
        band.items.map((_, i) => {
          const theta = (i / count) * 2 * Math.PI + base;
          const x = Math.cos(theta) * rx;
          const z = Math.sin(theta) * ry;
          const normZ = (z / ry + 1) / 2;
          const yOffset = z * config.tilt * 2.5; // perspective y dip
          return { x, y: yOffset, z, normZ };
        })
      );
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [rx, ry, count, speed, dir, config.tilt]);

  const cx = containerWidth / 2;

  return (
    <g>
      {/* Glowing ellipse ring */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry * 2.2}
        fill="none"
        stroke={band.color}
        strokeWidth={config.thickness * 0.12}
        strokeOpacity={0.15}
      />
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry * 2.2}
        fill="none"
        stroke={band.color}
        strokeWidth={2}
        strokeOpacity={0.7}
        style={{ filter: `drop-shadow(0 0 8px ${band.color}) drop-shadow(0 0 20px ${band.color})` }}
      />
      {/* Band label — visible on front side */}
      <text
        x={cx + rx * 0.4}
        y={cy + ry * 2.2 * 0.15}
        textAnchor="middle"
        fill="white"
        fontSize={config.thickness * 0.38}
        fontWeight="700"
        letterSpacing="3"
        opacity={0.92}
        style={{ fontFamily: "system-ui, sans-serif", textTransform: "uppercase" }}
      >
        {band.label}
      </text>

      {/* Floating tech logos on the ring */}
      {band.items.map((name, i) => {
        const pos = positions[i] || { x: 0, y: 0, normZ: 0.5 };
        const scale = 0.45 + pos.normZ * 0.55;
        const opacity = 0.1 + pos.normZ * 0.85;
        const size = config.thickness * 0.55 * scale;
        const px = cx + pos.x - size / 2;
        const py = cy + pos.y - size / 2;
        const logo = TECH_LOGOS[name];
        if (!logo) return null;
        return (
          <image
            key={name}
            href={logo}
            x={px}
            y={py}
            width={size}
            height={size}
            opacity={opacity}
            style={{
              filter: pos.normZ > 0.6
                ? `drop-shadow(0 0 6px ${band.color})`
                : "none",
            }}
            preserveAspectRatio="xMidYMid meet"
          />
        );
      })}
    </g>
  );
}

export default function TechnologyMarquee() {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        const h = Math.min(640, Math.max(400, w * 0.72));
        setSize({ w, h });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div ref={containerRef} className="w-full max-w-5xl mx-auto px-4 py-12 relative">

      {/* Deep ambient glow backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 50% 60%, rgba(56,189,248,0.07) 0%, rgba(87,61,255,0.06) 40%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="text-center mb-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
          style={{
            background: "rgba(56,189,248,0.1)",
            border: "1px solid rgba(56,189,248,0.3)",
            color: "#38bdf8",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#38bdf8" }} />
          Enterprise Integration Stack
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="text-2xl md:text-4xl font-bold text-white mb-3"
        >
          Built on the World's Best Infrastructure
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="text-base text-white/60 max-w-2xl mx-auto"
        >
          60+ enterprise technologies spiraling into a unified, sovereign security stack.
        </motion.p>
      </div>

      {/* Spiral Cone SVG */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 1.2, delay: 0.3 }}
        className="relative z-10"
        style={{ width: "100%", height: size.h }}
      >
        {/* Star particles background */}
        <div className="absolute inset-0 pointer-events-none" style={{ overflow: "hidden" }}>
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 2 + 1,
                height: Math.random() * 2 + 1,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: "white",
                opacity: Math.random() * 0.4 + 0.1,
                animation: `pulse ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${size.w} ${size.h}`}
          style={{ overflow: "visible" }}
        >
          <defs>
            {SPIRAL_BANDS.map((band, i) => (
              <filter key={i} id={`glow-${i}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            ))}
          </defs>

          {/* Vertical glowing core spine */}
          <line
            x1={size.w / 2}
            y1={size.h * 0.05}
            x2={size.w / 2}
            y2={size.h * 0.88}
            stroke="#38bdf8"
            strokeWidth={2}
            strokeOpacity={0.3}
            style={{ filter: "drop-shadow(0 0 6px #38bdf8) drop-shadow(0 0 15px #38bdf8)" }}
          />

          {/* Apex star burst */}
          <circle
            cx={size.w / 2}
            cy={size.h * 0.06}
            r={6}
            fill="#38bdf8"
            style={{ filter: "drop-shadow(0 0 12px #38bdf8) drop-shadow(0 0 30px #60a5fa)" }}
          />
          <circle cx={size.w / 2} cy={size.h * 0.06} r={14} fill="none" stroke="#38bdf8" strokeWidth={1} strokeOpacity={0.3} />
          <circle cx={size.w / 2} cy={size.h * 0.06} r={24} fill="none" stroke="#38bdf8" strokeWidth={0.5} strokeOpacity={0.15} />

          {/* Base ground glow rings */}
          <ellipse
            cx={size.w / 2}
            cy={size.h * 0.88}
            rx={size.w * 0.38}
            ry={size.h * 0.045}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={2.5}
            strokeOpacity={0.7}
            style={{ filter: "drop-shadow(0 0 10px #f59e0b) drop-shadow(0 0 25px #f59e0b)" }}
          />
          <ellipse
            cx={size.w / 2}
            cy={size.h * 0.88}
            rx={size.w * 0.44}
            ry={size.h * 0.055}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={1}
            strokeOpacity={0.3}
          />
          <ellipse
            cx={size.w / 2}
            cy={size.h * 0.88}
            rx={size.w * 0.48}
            ry={size.h * 0.062}
            fill="none"
            stroke="#38bdf8"
            strokeWidth={0.8}
            strokeOpacity={0.18}
          />

          {/* Spiral bands — rendered bottom to top */}
          {SPIRAL_BANDS.map((band, i) => (
            <SpiralBand
              key={i}
              band={band}
              config={BAND_CONFIG[i]}
              containerWidth={size.w}
              containerHeight={size.h}
              totalBands={SPIRAL_BANDS.length}
              bandIndex={i}
            />
          ))}
        </svg>
      </motion.div>

      {/* Bottom counter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 1 }}
        className="mt-4 flex items-center justify-center gap-3 relative z-10"
      >
        <div className="h-px flex-1 max-w-[100px]" style={{ background: "linear-gradient(to right, transparent, rgba(56,189,248,0.4))" }} />
        <span className="text-xs text-white/40 tracking-widest uppercase font-medium">60+ Integrated Technologies</span>
        <div className="h-px flex-1 max-w-[100px]" style={{ background: "linear-gradient(to left, transparent, rgba(56,189,248,0.4))" }} />
      </motion.div>
    </div>
  );
}