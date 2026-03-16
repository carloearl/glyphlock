import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView } from "framer-motion";

const TECH_ITEMS = [
  { name: "AWS",         logo: "https://www.vectorlogo.zone/logos/amazon_aws/amazon_aws-icon.svg" },
  { name: "GCloud",      logo: "https://www.vectorlogo.zone/logos/google_cloud/google_cloud-icon.svg" },
  { name: "Azure",       logo: "https://www.vectorlogo.zone/logos/microsoft_azure/microsoft_azure-icon.svg" },
  { name: "Docker",      logo: "https://www.vectorlogo.zone/logos/docker/docker-icon.svg" },
  { name: "PostgreSQL",  logo: "https://www.vectorlogo.zone/logos/postgresql/postgresql-icon.svg" },
  { name: "MongoDB",     logo: "https://www.vectorlogo.zone/logos/mongodb/mongodb-icon.svg" },
  { name: "Redis",       logo: "https://www.vectorlogo.zone/logos/redis/redis-icon.svg" },
  { name: "OpenAI",      logo: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg" },
  { name: "NVIDIA",      logo: "https://www.vectorlogo.zone/logos/nvidia/nvidia-icon.svg" },
  { name: "GitHub",      logo: "https://www.vectorlogo.zone/logos/github/github-icon.svg" },
  { name: "Cloudflare",  logo: "https://www.vectorlogo.zone/logos/cloudflare/cloudflare-icon.svg" },
  { name: "Stripe",      logo: "https://www.vectorlogo.zone/logos/stripe/stripe-icon.svg" },
  { name: "Kubernetes",  logo: "https://www.vectorlogo.zone/logos/kubernetes/kubernetes-icon.svg" },
  { name: "React",       logo: "https://www.vectorlogo.zone/logos/reactjs/reactjs-icon.svg" },
  { name: "Node.js",     logo: "https://www.vectorlogo.zone/logos/nodejs/nodejs-icon.svg" },
  { name: "Python",      logo: "https://www.vectorlogo.zone/logos/python/python-icon.svg" },
  { name: "TypeScript",  logo: "https://www.vectorlogo.zone/logos/typescriptlang/typescriptlang-icon.svg" },
  { name: "GraphQL",     logo: "https://www.vectorlogo.zone/logos/graphql/graphql-icon.svg" },
  { name: "Okta",        logo: "https://www.vectorlogo.zone/logos/okta/okta-icon.svg" },
  { name: "Datadog",     logo: "https://www.vectorlogo.zone/logos/datadoghq/datadoghq-icon.svg" },
  { name: "Grafana",     logo: "https://www.vectorlogo.zone/logos/grafana/grafana-icon.svg" },
  { name: "Slack",       logo: "https://www.vectorlogo.zone/logos/slack/slack-icon.svg" },
  { name: "Twilio",      logo: "https://www.vectorlogo.zone/logos/twilio/twilio-icon.svg" },
  { name: "Figma",       logo: "https://www.vectorlogo.zone/logos/figma/figma-icon.svg" },
  { name: "Shopify",     logo: "https://www.vectorlogo.zone/logos/shopify/shopify-icon.svg" },
  { name: "Salesforce",  logo: "https://www.vectorlogo.zone/logos/salesforce/salesforce-icon.svg" },
  { name: "Oracle",      logo: "https://www.vectorlogo.zone/logos/oracle/oracle-icon.svg" },
  { name: "IBM",         logo: "https://www.vectorlogo.zone/logos/ibm/ibm-icon.svg" },
  { name: "Snowflake",   logo: "https://www.vectorlogo.zone/logos/snowflake/snowflake-icon.svg" },
  { name: "Intel",       logo: "https://www.vectorlogo.zone/logos/intel/intel-icon.svg" },
  { name: "Notion",      logo: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" },
  { name: "Discord",     logo: "https://www.vectorlogo.zone/logos/discordapp/discordapp-icon.svg" },
  { name: "Firebase",    logo: "https://www.vectorlogo.zone/logos/google_firebase/google_firebase-icon.svg" },
  { name: "Elastic",     logo: "https://www.vectorlogo.zone/logos/elastic/elastic-icon.svg" },
  { name: "Terraform",   logo: "https://www.vectorlogo.zone/logos/terraformio/terraformio-icon.svg" },
  { name: "GitLab",      logo: "https://www.vectorlogo.zone/logos/gitlab/gitlab-icon.svg" },
  { name: "Jira",        logo: "https://www.vectorlogo.zone/logos/atlassian_jira/atlassian_jira-icon.svg" },
  { name: "Ethereum",    logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/Ethereum_logo_2014.svg" },
  { name: "Coinbase",    logo: "https://upload.wikimedia.org/wikipedia/commons/1/1a/Coinbase.svg" },
  { name: "Linux",       logo: "https://www.vectorlogo.zone/logos/linux/linux-icon.svg" },
  { name: "Vercel",      logo: "https://www.vectorlogo.zone/logos/vercel/vercel-icon.svg" },
  { name: "Supabase",    logo: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Supabase_Logo.svg" },
  { name: "Splunk",      logo: "https://www.vectorlogo.zone/logos/splunk/splunk-icon.svg" },
  { name: "SendGrid",    logo: "https://www.vectorlogo.zone/logos/sendgrid/sendgrid-icon.svg" },
  { name: "Cisco",       logo: "https://www.vectorlogo.zone/logos/cisco/cisco-icon.svg" },
  { name: "Netlify",     logo: "https://www.vectorlogo.zone/logos/netlify/netlify-icon.svg" },
  { name: "PayPal",      logo: "https://www.vectorlogo.zone/logos/paypal/paypal-icon.svg" },
  { name: "Visa",        logo: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" },
  { name: "CircleCI",    logo: "https://www.vectorlogo.zone/logos/circleci/circleci-icon.svg" },
  { name: "Anthropic",   logo: "https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg" },
  { name: "Gemini",      logo: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg" },
  { name: "HuggingFace", logo: "https://huggingface.co/front/assets/huggingface_logo.svg" },
  { name: "Tailwind",    logo: "https://www.vectorlogo.zone/logos/tailwindcss/tailwindcss-icon.svg" },
  { name: "Asana",       logo: "https://www.vectorlogo.zone/logos/asana/asana-icon.svg" },
  { name: "Atlassian",   logo: "https://www.vectorlogo.zone/logos/atlassian/atlassian-icon.svg" },
  { name: "Dropbox",     logo: "https://www.vectorlogo.zone/logos/dropbox/dropbox-icon.svg" },
  { name: "PagerDuty",   logo: "https://www.vectorlogo.zone/logos/pagerduty/pagerduty-icon.svg" },
  { name: "Nginx",       logo: "https://www.vectorlogo.zone/logos/nginx/nginx-icon.svg" },
  { name: "Ubuntu",      logo: "https://www.vectorlogo.zone/logos/ubuntu/ubuntu-icon.svg" },
  { name: "NewRelic",    logo: "https://www.vectorlogo.zone/logos/newrelic/newrelic-icon.svg" },
  { name: "Mastercard",  logo: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" },
];

const RINGS = [
  {
    items: TECH_ITEMS.slice(0, 12),
    radiusX: 160,
    speed: 0.009,
    dir: 1,
    color: "#c4b5fd",
    glowColor: "rgba(167,139,250,0.9)",
    imgSize: 28,
  },
  {
    items: TECH_ITEMS.slice(12, 36),
    radiusX: 270,
    speed: 0.006,
    dir: -1,
    color: "#67e8f9",
    glowColor: "rgba(103,232,249,0.9)",
    imgSize: 32,
  },
  {
    items: TECH_ITEMS.slice(36),
    radiusX: 390,
    speed: 0.004,
    dir: 1,
    color: "#93c5fd",
    glowColor: "rgba(147,197,253,0.9)",
    imgSize: 36,
  },
];

function OrbitRing({ ring, containerWidth }) {
  const angleRef = useRef(0);
  const rafRef = useRef(null);
  const count = ring.items.length;
  const [positions, setPositions] = useState(() =>
    ring.items.map((_, i) => ({ x: 0, z: 0, normZ: 0.5 }))
  );
  const [hovered, setHovered] = useState(null);
  const pausedRef = useRef(false);

  const rx = Math.min(ring.radiusX, (containerWidth || 800) * 0.40);
  const rz = rx * 0.30; // elliptical depth flatten

  const tick = useCallback(() => {
    if (!pausedRef.current) {
      angleRef.current += ring.speed * ring.dir;
    }
    const base = angleRef.current;
    setPositions(
      ring.items.map((_, i) => {
        const theta = (i / count) * 2 * Math.PI + base;
        const x = Math.cos(theta) * rx;
        const z = Math.sin(theta) * rz;
        const normZ = (z / rz + 1) / 2;
        return { x, z, normZ };
      })
    );
    rafRef.current = requestAnimationFrame(tick);
  }, [ring, rx, rz, count]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ pointerEvents: "none" }}
    >
      {ring.items.map((item, i) => {
        const pos = positions[i] || { x: 0, z: 0, normZ: 0.5 };
        const isHov = hovered === i;
        // Perspective Y shift — tilt the ring so it looks like a 3D orbit
        const yShift = pos.z * 1.6;
        // Depth cues
        const scale = isHov ? 1.35 : 0.52 + pos.normZ * 0.48;
        const opacity = isHov ? 1 : 0.1 + pos.normZ * 0.82;
        const blur = isHov ? 0 : (1 - pos.normZ) * 2.0;
        const zIdx = Math.round(pos.normZ * 100);
        const size = ring.imgSize;
        const chipW = size + 16;

        return (
          <div
            key={item.name + i}
            onMouseEnter={() => { setHovered(i); pausedRef.current = true; }}
            onMouseLeave={() => { setHovered(null); pausedRef.current = false; }}
            title={item.name}
            style={{
              position: "absolute",
              transform: `translateX(${pos.x}px) translateY(${yShift}px) scale(${scale})`,
              opacity,
              filter: blur > 0 ? `blur(${blur}px)` : "none",
              zIndex: zIdx,
              pointerEvents: "auto",
              cursor: "pointer",
              width: chipW,
              height: chipW,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: isHov
                ? "rgba(255,255,255,0.12)"
                : pos.normZ > 0.65
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(255,255,255,0.02)",
              border: isHov
                ? `1.5px solid ${ring.color}`
                : pos.normZ > 0.65
                  ? "1px solid rgba(255,255,255,0.12)"
                  : "1px solid rgba(255,255,255,0.03)",
              boxShadow: isHov
                ? `0 0 28px ${ring.glowColor}, 0 0 8px ${ring.color}`
                : pos.normZ > 0.7
                  ? `0 0 10px ${ring.color}33`
                  : "none",
              transition: isHov ? "box-shadow 0.2s, border 0.2s" : "none",
            }}
          >
            <img
              src={item.logo}
              alt={item.name}
              loading="lazy"
              onError={e => { e.target.style.display = "none"; }}
              style={{
                width: size,
                height: size,
                objectFit: "contain",
                filter: isHov
                  ? "brightness(1.2)"
                  : pos.normZ > 0.6
                    ? "brightness(0.9) saturate(0.8)"
                    : "brightness(0.4) saturate(0.3)",
                transition: "filter 0.2s",
                pointerEvents: "none",
              }}
            />
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

  const ringHeights = [140, 200, 260];

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
                width: Math.min(ring.radiusX, (containerWidth || 800) * 0.40) * 2,
                height: Math.min(ring.radiusX, (containerWidth || 800) * 0.40) * 0.30 * 2,
                border: `1px dashed ${ring.color}28`,
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
          {TECH_ITEMS.length}+ Integrated Technologies
        </span>
        <div
          className="h-px flex-1 max-w-[120px]"
          style={{ background: "linear-gradient(to left, transparent, rgba(87,61,255,0.5))" }}
        />
      </motion.div>
    </div>
  );
}