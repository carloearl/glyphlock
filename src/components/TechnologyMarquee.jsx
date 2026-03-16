import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView } from "framer-motion";

const TECH_LABELS = [
  "AWS", "Google Cloud", "Azure", "Docker", "PostgreSQL", "MongoDB",
  "Redis", "OpenAI", "NVIDIA", "GitHub", "Cloudflare", "Stripe",
  "Kubernetes", "React", "Node.js", "Python", "TypeScript", "TailwindCSS",
  "GraphQL", "CrowdStrike", "Claude", "Gemini", "Okta", "Datadog",
  "Grafana", "Slack", "Twilio", "Figma", "Shopify", "Salesforce",
  "Oracle", "IBM", "Snowflake", "Anthropic", "Intel", "Notion",
  "Discord", "Mastercard", "Firebase", "Elastic", "Terraform", "GitLab",
  "Jira", "Ethereum", "Coinbase", "Linux", "Vercel", "Supabase",
  "HuggingFace", "Splunk", "SendGrid", "Cisco", "PagerDuty", "Netlify",
  "PayPal", "Visa", "CircleCI", "VMware", "Perplexity", "Wix",
];

const RINGS = [
  {
    labels: TECH_LABELS.slice(0, 12),
    radiusX: 200,
    radiusZ: 200,
    tilt: 18,           // degrees of X-tilt (makes it look like an ellipse/orbit)
    speed: 0.009,
    dir: 1,
    color: "#c4b5fd",
    glowColor: "rgba(167,139,250,0.9)",
    fontSize: 11,
    yOffset: 0,
  },
  {
    labels: TECH_LABELS.slice(12, 36),
    radiusX: 320,
    radiusZ: 320,
    tilt: 18,
    speed: 0.006,
    dir: -1,
    color: "#67e8f9",
    glowColor: "rgba(103,232,249,0.9)",
    fontSize: 13,
    yOffset: 0,
  },
  {
    labels: TECH_LABELS.slice(36),
    radiusX: 460,
    radiusZ: 460,
    tilt: 18,
    speed: 0.004,
    dir: 1,
    color: "#93c5fd",
    glowColor: "rgba(147,197,253,0.9)",
    fontSize: 15,
    yOffset: 0,
  },
];

function OrbitRing({ ring, containerWidth }) {
  const angleRef = useRef(0);
  const rafRef = useRef(null);
  const [items, setItems] = useState(() =>
    ring.labels.map((label, i) => {
      const theta = (i / ring.labels.length) * 2 * Math.PI;
      return { label, theta, x: 0, z: 0, normZ: 0 };
    })
  );
  const [hovered, setHovered] = useState(null);
  const pausedRef = useRef(false);

  // Responsive radius
  const rx = Math.min(ring.radiusX, (containerWidth || 800) * 0.44);
  const rz = rx * 0.28; // flatten the z-depth for elliptical look

  const tick = useCallback(() => {
    if (!pausedRef.current) {
      angleRef.current += ring.speed * ring.dir;
    }
    const base = angleRef.current;
    setItems(prev =>
      prev.map((item, i) => {
        const theta = (i / ring.labels.length) * 2 * Math.PI + base;
        const x = Math.cos(theta) * rx;
        const z = Math.sin(theta) * rz;
        const normZ = (z / rz + 1) / 2; // 0=back, 1=front
        return { ...item, theta, x, z, normZ };
      })
    );
    rafRef.current = requestAnimationFrame(tick);
  }, [ring, rx, rz]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  const tiltRad = (ring.tilt * Math.PI) / 180;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ pointerEvents: "none" }}
    >
      {items.map((item, i) => {
        const isHov = hovered === i;
        // Apply tilt: transform z into a vertical offset
        const yShift = item.z * Math.sin(tiltRad) * 2.2;
        // Depth scale: front items = 1.0, back = 0.55
        const scale = isHov ? 1.3 : 0.55 + item.normZ * 0.45;
        // Depth opacity: front = 1, back = 0.15
        const opacity = isHov ? 1 : 0.12 + item.normZ * 0.78;
        // Depth blur: back items blurred
        const blur = isHov ? 0 : (1 - item.normZ) * 1.8;
        // z-index
        const zIdx = Math.round(item.normZ * 100);

        return (
          <div
            key={item.label}
            onMouseEnter={() => { setHovered(i); pausedRef.current = true; }}
            onMouseLeave={() => { setHovered(null); pausedRef.current = false; }}
            style={{
              position: "absolute",
              transform: `translateX(${item.x}px) translateY(${yShift}px) scale(${scale})`,
              opacity,
              filter: blur > 0 ? `blur(${blur}px)` : "none",
              zIndex: zIdx,
              pointerEvents: "auto",
              cursor: "default",
              transition: isHov ? "transform 0.15s ease, opacity 0.15s" : "none",
              whiteSpace: "nowrap",
              padding: isHov ? "5px 14px" : "3px 10px",
              borderRadius: 24,
              background: isHov
                ? "rgba(255,255,255,0.1)"
                : item.normZ > 0.72
                  ? "rgba(255,255,255,0.04)"
                  : "transparent",
              border: isHov
                ? `1px solid ${ring.color}`
                : item.normZ > 0.72
                  ? "1px solid rgba(255,255,255,0.1)"
                  : "1px solid transparent",
              boxShadow: isHov ? `0 0 24px ${ring.glowColor}, 0 0 6px ${ring.color}` : "none",
              fontSize: ring.fontSize,
              fontWeight: isHov ? 700 : item.normZ > 0.6 ? 600 : 400,
              letterSpacing: "0.05em",
              color: isHov
                ? ring.color
                : `rgba(255,255,255,${0.25 + item.normZ * 0.65})`,
              textShadow: isHov
                ? `0 0 20px ${ring.glowColor}`
                : item.normZ > 0.7
                  ? `0 0 8px ${ring.color}66`
                  : "none",
              userSelect: "none",
            }}
          >
            {item.label}
          </div>
        );
      })}
    </div>
  );
}

export default function TechnologyMarquee() {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Pyramid heights: top ring gets smallest container, base gets tallest
  const ringHeights = [160, 220, 290];

  return (
    <div
      ref={containerRef}
      className="w-full max-w-7xl mx-auto px-4 py-16 relative overflow-hidden"
    >
      {/* Deep ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 70% at 50% 65%, rgba(87,61,255,0.1) 0%, rgba(6,182,212,0.05) 50%, transparent 75%)",
        }}
      />

      {/* Header */}
      <div className="text-center mb-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
          style={{
            background: "rgba(87,61,255,0.12)",
            border: "1px solid rgba(87,61,255,0.3)",
            color: "#a78bfa",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "#a78bfa" }}
          />
          Enterprise Integration Network
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, x: -60 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1 }}
          className="text-2xl md:text-4xl font-bold text-white mb-3"
        >
          Enterprise Engineering Excellence
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, x: 60 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1, delay: 0.15 }}
          className="text-base md:text-lg text-white/70 max-w-3xl mx-auto"
        >
          Engineered under the Triple-E Standard — aligned with the same high-integrity benchmarks
          that leading global platforms refuse to compromise on.
        </motion.p>
      </div>

      {/* 3D Orbital Pyramid */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1.2, delay: 0.3 }}
        className="relative z-10 flex flex-col items-center"
      >
        {RINGS.map((ring, ri) => (
          <div
            key={ri}
            className="relative w-full"
            style={{ height: ringHeights[ri] }}
          >
            {/* Orbit ellipse guide */}
            <div
              className="absolute left-1/2 top-1/2 pointer-events-none"
              style={{
                width: Math.min(ring.radiusX, (containerWidth || 800) * 0.44) * 2,
                height: Math.min(ring.radiusX, (containerWidth || 800) * 0.44) * 0.56 * 0.28 * 2,
                border: `1px dashed ${ring.color}33`,
                borderRadius: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
            <OrbitRing ring={ring} containerWidth={containerWidth} />
          </div>
        ))}
      </motion.div>

      {/* Bottom label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 1 }}
        className="mt-8 flex items-center justify-center gap-3 relative z-10"
      >
        <div
          className="h-px flex-1 max-w-[120px]"
          style={{ background: "linear-gradient(to right, transparent, rgba(87,61,255,0.5))" }}
        />
        <span className="text-xs text-white/40 tracking-widest uppercase font-medium">
          {TECH_LABELS.length}+ Integrated Technologies
        </span>
        <div
          className="h-px flex-1 max-w-[120px]"
          style={{ background: "linear-gradient(to left, transparent, rgba(87,61,255,0.5))" }}
        />
      </motion.div>
    </div>
  );
}