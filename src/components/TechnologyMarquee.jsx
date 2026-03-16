import React, { useRef, useState, useEffect } from "react";
import { motion, useInView, useAnimationFrame } from "framer-motion";

const ALL_LOGOS = [
  "AWS", "Google Cloud", "Azure", "Docker", "PostgreSQL", "MongoDB",
  "Redis", "OpenAI", "NVIDIA", "GitHub", "Cloudflare", "Stripe",
  "Kubernetes", "React", "Node.js", "Python", "TypeScript", "TailwindCSS",
  "GraphQL", "CrowdStrike", "Claude", "Gemini", "Okta", "Datadog",
  "Grafana", "Slack", "Twilio", "Figma", "Shopify", "Salesforce",
  "Oracle", "IBM", "Snowflake", "Anthropic", "Intel", "Notion",
  "Discord", "Mastercard", "Firebase", "Elastic", "Terraform", "GitLab",
  "Jira", "Ethereum", "Bitcoin", "Coinbase", "Linux", "Vercel",
  "Supabase", "HuggingFace", "Splunk", "SendGrid", "Cisco", "VMware",
  "CircleCI", "PagerDuty", "New Relic", "Netlify", "PayPal", "Visa",
];

// Ring colors for each tier
const RING_COLORS = [
  { text: "#c4b5fd", glow: "rgba(167,139,250,0.7)", orbit: "rgba(139,92,246,0.35)" },  // top — purple
  { text: "#67e8f9", glow: "rgba(103,232,249,0.7)", orbit: "rgba(6,182,212,0.35)" },   // mid — cyan
  { text: "#a5f3fc", glow: "rgba(99,202,255,0.8)", orbit: "rgba(59,130,246,0.4)" },    // base — blue
];

function OrbitRing3D({ labels, radius, speed, direction, tiltX, color, itemSize }) {
  const angleRef = useRef(0);
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const count = labels.length;

  useAnimationFrame((_, delta) => {
    if (paused) return;
    angleRef.current += (delta / 1000) * speed * direction;
    setTick(t => t + 1);
  });

  const angle = angleRef.current;

  return (
    <div
      className="relative w-full flex items-center justify-center"
      style={{ height: itemSize * 2.2, perspective: 900, perspectiveOrigin: "50% 50%" }}
    >
      {/* Orbit ellipse ring */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: radius * 2,
          height: radius * 0.28,
          border: `1px dashed ${color.orbit}`,
          borderRadius: "50%",
          transform: `rotateX(${tiltX}deg)`,
          left: "50%",
          top: "50%",
          marginLeft: -radius,
          marginTop: -(radius * 0.14),
        }}
      />

      {/* Labels */}
      <div
        style={{
          position: "relative",
          width: radius * 2,
          height: itemSize,
          transformStyle: "preserve-3d",
          transform: `rotateX(${tiltX}deg)`,
        }}
      >
        {labels.map((label, i) => {
          const theta = (i / count) * 2 * Math.PI + (angle * Math.PI) / 180;
          const x = Math.cos(theta) * radius;
          const z = Math.sin(theta) * radius;
          const normZ = (z / radius + 1) / 2; // 0=back 1=front
          const isHovered = hoveredIdx === i;
          const opacity = isHovered ? 1 : 0.15 + normZ * 0.75;
          const scale = isHovered ? 1.2 : 0.65 + normZ * 0.35;

          return (
            <div
              key={label + i}
              onMouseEnter={() => { setPaused(true); setHoveredIdx(i); }}
              onMouseLeave={() => { setPaused(false); setHoveredIdx(null); }}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%) translateX(${x}px) translateZ(${z}px) scale(${scale})`,
                opacity,
                transition: "opacity 0.2s, transform 0.2s",
                zIndex: isHovered ? 20 : Math.round(normZ * 10),
                cursor: "default",
                whiteSpace: "nowrap",
                padding: isHovered ? "4px 12px" : "3px 8px",
                borderRadius: 20,
                background: isHovered
                  ? "rgba(255,255,255,0.1)"
                  : normZ > 0.7 ? "rgba(255,255,255,0.04)" : "transparent",
                border: isHovered
                  ? `1px solid ${color.text}`
                  : normZ > 0.7 ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                boxShadow: isHovered ? `0 0 20px ${color.glow}` : "none",
                fontSize: itemSize * 0.28,
                fontWeight: isHovered ? 700 : 500,
                letterSpacing: "0.04em",
                color: isHovered ? color.text : `rgba(255,255,255,${0.4 + normZ * 0.5})`,
                textShadow: isHovered ? `0 0 16px ${color.glow}` : "none",
              }}
            >
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TechnologyMarquee() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.15 });

  // Pyramid: top = fewest/narrowest, bottom = most/widest
  const ring1 = ALL_LOGOS.slice(0, 10);
  const ring2 = ALL_LOGOS.slice(10, 32);
  const ring3 = ALL_LOGOS.slice(32);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-7xl mx-auto px-4 py-16 relative overflow-hidden"
      style={{ background: "transparent" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 80% at 50% 60%, rgba(87,61,255,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="text-center mb-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
          style={{ background: "rgba(87,61,255,0.12)", border: "1px solid rgba(87,61,255,0.3)", color: "#a78bfa" }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#a78bfa" }} />
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
          Engineered under the Triple-E Standard — aligned with the same high-integrity benchmarks that leading global platforms refuse to compromise on.
        </motion.p>
      </div>

      {/* Cylindrical Pyramid — narrow apex → wide base */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1.2, delay: 0.3 }}
        className="relative z-10 flex flex-col items-center"
        style={{ gap: 0 }}
      >
        {/* TOP — smallest ring, fewest labels */}
        <OrbitRing3D
          labels={ring1}
          radius={260}
          speed={22}
          direction={1}
          tiltX={72}
          color={RING_COLORS[0]}
          itemSize={28}
        />

        {/* MIDDLE */}
        <OrbitRing3D
          labels={ring2}
          radius={400}
          speed={16}
          direction={-1}
          tiltX={72}
          color={RING_COLORS[1]}
          itemSize={34}
        />

        {/* BASE — widest ring, most labels */}
        <OrbitRing3D
          labels={ring3}
          radius={540}
          speed={12}
          direction={1}
          tiltX={72}
          color={RING_COLORS[2]}
          itemSize={40}
        />
      </motion.div>

      {/* Bottom label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 0.8 }}
        className="mt-8 flex items-center justify-center gap-3 relative z-10"
      >
        <div className="h-px flex-1 max-w-[120px]" style={{ background: "linear-gradient(to right, transparent, rgba(87,61,255,0.5))" }} />
        <span className="text-xs text-white/40 tracking-widest uppercase font-medium">
          {ALL_LOGOS.length}+ Integrated Technologies
        </span>
        <div className="h-px flex-1 max-w-[120px]" style={{ background: "linear-gradient(to left, transparent, rgba(87,61,255,0.5))" }} />
      </motion.div>
    </div>
  );
}