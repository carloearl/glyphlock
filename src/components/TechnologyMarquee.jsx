import React, { useRef, useState, useEffect } from "react";
import { motion, useInView, useAnimationFrame } from "framer-motion";

const ALL_LOGOS = [
  { name: "AWS", logo: "https://www.vectorlogo.zone/logos/amazon_aws/amazon_aws-ar21.svg" },
  { name: "Google Cloud", logo: "https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg" },
  { name: "Microsoft Azure", logo: "https://www.vectorlogo.zone/logos/microsoft_azure/microsoft_azure-ar21.svg" },
  { name: "Docker", logo: "https://www.vectorlogo.zone/logos/docker/docker-ar21.svg" },
  { name: "PostgreSQL", logo: "https://www.vectorlogo.zone/logos/postgresql/postgresql-ar21.svg" },
  { name: "MongoDB", logo: "https://www.vectorlogo.zone/logos/mongodb/mongodb-ar21.svg" },
  { name: "Redis", logo: "https://www.vectorlogo.zone/logos/redis/redis-ar21.svg" },
  { name: "OpenAI", logo: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg" },
  { name: "NVIDIA", logo: "https://www.vectorlogo.zone/logos/nvidia/nvidia-ar21.svg" },
  { name: "GitHub", logo: "https://www.vectorlogo.zone/logos/github/github-ar21.svg" },
  { name: "Cloudflare", logo: "https://www.vectorlogo.zone/logos/cloudflare/cloudflare-ar21.svg" },
  { name: "Stripe", logo: "https://logo.clearbit.com/stripe.com" },
  { name: "Kubernetes", logo: "https://www.vectorlogo.zone/logos/kubernetes/kubernetes-ar21.svg" },
  { name: "React", logo: "https://www.vectorlogo.zone/logos/reactjs/reactjs-ar21.svg" },
  { name: "Node.js", logo: "https://www.vectorlogo.zone/logos/nodejs/nodejs-ar21.svg" },
  { name: "Python", logo: "https://www.vectorlogo.zone/logos/python/python-ar21.svg" },
  { name: "TypeScript", logo: "https://www.vectorlogo.zone/logos/typescriptlang/typescriptlang-ar21.svg" },
  { name: "TailwindCSS", logo: "https://www.vectorlogo.zone/logos/tailwindcss/tailwindcss-ar21.svg" },
  { name: "GraphQL", logo: "https://www.vectorlogo.zone/logos/graphql/graphql-ar21.svg" },
  { name: "CrowdStrike", logo: "https://upload.wikimedia.org/wikipedia/commons/3/3e/CrowdStrike_logo.svg" },
  { name: "Claude", logo: "https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg" },
  { name: "Gemini", logo: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg" },
  { name: "Okta", logo: "https://www.vectorlogo.zone/logos/okta/okta-ar21.svg" },
  { name: "Datadog", logo: "https://www.vectorlogo.zone/logos/datadoghq/datadoghq-ar21.svg" },
  { name: "Grafana", logo: "https://www.vectorlogo.zone/logos/grafana/grafana-ar21.svg" },
  { name: "Slack", logo: "https://www.vectorlogo.zone/logos/slack/slack-ar21.svg" },
  { name: "Twilio", logo: "https://www.vectorlogo.zone/logos/twilio/twilio-ar21.svg" },
  { name: "VS Code", logo: "https://www.vectorlogo.zone/logos/visualstudio_code/visualstudio_code-ar21.svg" },
  { name: "Figma", logo: "https://www.vectorlogo.zone/logos/figma/figma-ar21.svg" },
  { name: "Shopify", logo: "https://www.vectorlogo.zone/logos/shopify/shopify-ar21.svg" },
  { name: "Apple", logo: "https://www.vectorlogo.zone/logos/apple/apple-ar21.svg" },
  { name: "Microsoft", logo: "https://www.vectorlogo.zone/logos/microsoft/microsoft-ar21.svg" },
  { name: "Google", logo: "https://www.vectorlogo.zone/logos/google/google-ar21.svg" },
  { name: "Amazon", logo: "https://www.vectorlogo.zone/logos/amazon/amazon-ar21.svg" },
  { name: "PayPal", logo: "https://www.vectorlogo.zone/logos/paypal/paypal-ar21.svg" },
  { name: "Visa", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" },
  { name: "Salesforce", logo: "https://www.vectorlogo.zone/logos/salesforce/salesforce-ar21.svg" },
  { name: "Oracle", logo: "https://www.vectorlogo.zone/logos/oracle/oracle-ar21.svg" },
  { name: "IBM", logo: "https://www.vectorlogo.zone/logos/ibm/ibm-ar21.svg" },
  { name: "Snowflake", logo: "https://www.vectorlogo.zone/logos/snowflake/snowflake-ar21.svg" },
  { name: "Perplexity", logo: "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/perplexity-ai-icon.png" },
  { name: "Anthropic", logo: "https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg" },
  { name: "Intel", logo: "https://www.vectorlogo.zone/logos/intel/intel-ar21.svg" },
  { name: "Notion", logo: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" },
  { name: "Discord", logo: "https://www.vectorlogo.zone/logos/discordapp/discordapp-ar21.svg" },
  { name: "Base44", logo: "https://avatars.githubusercontent.com/u/145019558?s=200&v=4" },
  { name: "Mastercard", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" },
  { name: "Firebase", logo: "https://upload.wikimedia.org/wikipedia/commons/b/bd/Firebase_Logo.png" },
  { name: "Elastic", logo: "https://www.vectorlogo.zone/logos/elastic/elastic-ar21.svg" },
  { name: "Terraform", logo: "https://www.vectorlogo.zone/logos/terraformio/terraformio-ar21.svg" },
  { name: "CircleCI", logo: "https://www.vectorlogo.zone/logos/circleci/circleci-ar21.svg" },
  { name: "GitLab", logo: "https://www.vectorlogo.zone/logos/gitlab/gitlab-ar21.svg" },
  { name: "Jira", logo: "https://www.vectorlogo.zone/logos/atlassian_jira/atlassian_jira-ar21.svg" },
  { name: "Dropbox", logo: "https://www.vectorlogo.zone/logos/dropbox/dropbox-ar21.svg" },
  { name: "Atlassian", logo: "https://www.vectorlogo.zone/logos/atlassian/atlassian-ar21.svg" },
  { name: "Asana", logo: "https://www.vectorlogo.zone/logos/asana/asana-ar21.svg" },
  { name: "Ethereum", logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/Ethereum_logo_2014.svg" },
  { name: "Bitcoin", logo: "https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg" },
  { name: "Coinbase", logo: "https://upload.wikimedia.org/wikipedia/commons/1/1a/Coinbase.svg" },
  { name: "Plaid", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Plaid_logo.svg" },
  { name: "Nginx", logo: "https://www.vectorlogo.zone/logos/nginx/nginx-ar21.svg" },
  { name: "Linux", logo: "https://www.vectorlogo.zone/logos/linux/linux-ar21.svg" },
  { name: "Ubuntu", logo: "https://www.vectorlogo.zone/logos/ubuntu/ubuntu-ar21.svg" },
  { name: "Netlify", logo: "https://www.vectorlogo.zone/logos/netlify/netlify-ar21.svg" },
  { name: "Vercel", logo: "https://www.vectorlogo.zone/logos/vercel/vercel-ar21.svg" },
  { name: "Supabase", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Supabase_Logo.svg" },
  { name: "Hugging Face", logo: "https://huggingface.co/front/assets/huggingface_logo.svg" },
  { name: "PagerDuty", logo: "https://www.vectorlogo.zone/logos/pagerduty/pagerduty-ar21.svg" },
  { name: "Splunk", logo: "https://www.vectorlogo.zone/logos/splunk/splunk-ar21.svg" },
  { name: "New Relic", logo: "https://www.vectorlogo.zone/logos/newrelic/newrelic-ar21.svg" },
  { name: "SendGrid", logo: "https://www.vectorlogo.zone/logos/sendgrid/sendgrid-ar21.svg" },
  { name: "Cisco", logo: "https://www.vectorlogo.zone/logos/cisco/cisco-ar21.svg" },
  { name: "VMware", logo: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Vmware.svg" },
];

// --- 3D Carousel Row ---
function Carousel3DRow({ logos, radius, speed, direction = 1, tiltX = 0 }) {
  const angleRef = useRef(0);
  const [angle, setAngle] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const ringPausedRef = useRef(false);
  const count = logos.length;
  const itemW = radius > 400 ? 115 : 85;
  const itemH = radius > 400 ? 58 : 44;
  const imgW = radius > 400 ? 80 : 58;

  useAnimationFrame((_, delta) => {
    if (ringPausedRef.current) return;
    angleRef.current += (delta / 1000) * speed * direction;
    setAngle(angleRef.current);
  });

  return (
    <div
      className="relative w-full flex items-center justify-center"
      style={{ height: "100%", perspective: 1200, perspectiveOrigin: "50% 50%" }}
    >
      <div
        style={{
          position: "relative",
          width: radius * 2,
          height: itemH,
          transformStyle: "preserve-3d",
          transform: `rotateX(${tiltX}deg)`,
        }}
      >
        {logos.map((logo, i) => {
          const theta = (i / count) * 2 * Math.PI + (angle * Math.PI) / 180;
          const x = Math.cos(theta) * radius;
          const z = Math.sin(theta) * radius;
          const normalizedZ = (z / radius + 1) / 2; // 0=back, 1=front
          const isHovered = hoveredIdx === i;
          const opacity = isHovered ? 1 : 0.2 + normalizedZ * 0.7;
          const scale = isHovered ? 1.15 : 0.72 + normalizedZ * 0.28;

          return (
            <div
              key={`${logo.name}-${i}`}
              onMouseEnter={() => { ringPausedRef.current = true; setHoveredIdx(i); }}
              onMouseLeave={() => { ringPausedRef.current = false; setHoveredIdx(null); }}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 115,
                height: 58,
                transform: `translate(-50%, -50%) translateX(${x}px) translateZ(${z}px) scale(${scale})`,
                opacity,
                transition: "opacity 0.25s, transform 0.25s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "6px 10px",
                borderRadius: 12,
                background: isHovered
                  ? "rgba(255,255,255,0.1)"
                  : normalizedZ > 0.75
                  ? "rgba(255,255,255,0.05)"
                  : "transparent",
                border: isHovered
                  ? "1px solid rgba(255,255,255,0.25)"
                  : normalizedZ > 0.75
                  ? "1px solid rgba(255,255,255,0.1)"
                  : "1px solid transparent",
                backdropFilter: normalizedZ > 0.7 || isHovered ? "blur(8px)" : "none",
                boxShadow: isHovered
                  ? "0 0 28px rgba(87,61,255,0.5)"
                  : "none",
                cursor: "default",
                zIndex: isHovered ? 10 : Math.round(normalizedZ * 5),
              }}
            >
              <img
                src={logo.logo}
                alt={logo.name}
                loading="lazy"
                width={80}
                height={40}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  // On hover: show real brand color. Otherwise white/faded.
                  filter: isHovered
                    ? "none"
                    : `brightness(0) invert(1) opacity(${(0.35 + normalizedZ * 0.55).toFixed(2)})`,
                  transition: "filter 0.35s ease",
                }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Orbit Ring SVG ---
function OrbitRing({ opacity = 0.25, scale = 1 }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none flex items-center justify-center"
      style={{ zIndex: 0 }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1200 220"
        preserveAspectRatio="xMidYMid meet"
        style={{ opacity, transform: `scaleX(${scale})` }}
      >
        <ellipse
          cx="600" cy="110" rx="520" ry="40"
          fill="none"
          stroke="url(#orbitGrad)"
          strokeWidth="1"
          strokeDasharray="8 6"
        />
        <defs>
          <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="30%" stopColor="#5b3dff" />
            <stop offset="70%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function TechnologyMarquee() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.15 });

  // Split logos across 3 rings
  const ring1 = ALL_LOGOS.slice(0, 24);
  const ring2 = ALL_LOGOS.slice(24, 48);
  const ring3 = ALL_LOGOS.slice(48);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-7xl mx-auto px-4 py-16 relative overflow-hidden"
      style={{ background: "transparent" }}
    >
      {/* Ambient glow behind section */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(87,61,255,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="text-center mb-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
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
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-2xl md:text-4xl font-bold text-white mb-3"
        >
          Enterprise Engineering Excellence
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, x: 60 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="text-base md:text-lg text-white/70 max-w-3xl mx-auto"
        >
          Engineered under the Triple-E Standard — aligned with the same high-integrity benchmarks that leading global platforms refuse to compromise on.
        </motion.p>
      </div>

      {/* 3D Carousel Rings — each in its own isolated row */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col gap-4"
      >
        {/* Ring 1 — large, forward tilt */}
        <div className="relative w-full overflow-hidden" style={{ height: 110 }}>
          <OrbitRing opacity={0.35} scale={1} />
          <Carousel3DRow logos={ring1} radius={560} speed={18} direction={1} tiltX={-6} />
        </div>

        {/* Ring 2 — medium, flat, reverse */}
        <div className="relative w-full overflow-hidden" style={{ height: 110 }}>
          <OrbitRing opacity={0.22} scale={0.88} />
          <Carousel3DRow logos={ring2} radius={480} speed={14} direction={-1} tiltX={0} />
        </div>

        {/* Ring 3 — small, back tilt, slower */}
        <div className="relative w-full overflow-hidden" style={{ height: 80 }}>
          <OrbitRing opacity={0.15} scale={0.7} />
          <Carousel3DRow logos={ring3} radius={340} speed={9} direction={1} tiltX={6} />
        </div>
      </motion.div>

      {/* Bottom label strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 0.8 }}
        className="mt-10 flex items-center justify-center gap-3 relative z-10"
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