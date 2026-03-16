import React from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

// All logos: real CDN URLs or inline SVG strings
const LOGOS = {
  // Row 1
  AWS: {
    svg: `<svg viewBox="0 0 80 48" xmlns="http://www.w3.org/2000/svg">
      <text x="4" y="20" font-family="Arial" font-weight="bold" font-size="11" fill="#FF9900">AWS</text>
      <path d="M8 28 Q20 22 32 28 Q44 34 56 28 Q68 22 72 26" stroke="#FF9900" stroke-width="2" fill="none"/>
      <path d="M60 24 L72 26 L64 32" fill="#FF9900"/>
    </svg>`
  },
  OpenAI: {
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="17" fill="none" stroke="#ffffff" stroke-width="1.5"/>
      <path d="M20 8 L26 14 L32 12 L30 18 L36 20 L30 22 L32 28 L26 26 L20 32 L14 26 L8 28 L10 22 L4 20 L10 18 L8 12 L14 14 Z" fill="none" stroke="#ffffff" stroke-width="1.2"/>
      <circle cx="20" cy="20" r="4" fill="#ffffff"/>
    </svg>`
  },
  Anthropic: {
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="8" fill="#C17E3E" opacity="0.15"/>
      <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" font-family="Georgia,serif" font-weight="bold" font-size="13" fill="#C17E3E">A</text>
      <line x1="10" y1="30" x2="20" y2="12" stroke="#C17E3E" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="30" y1="30" x2="20" y2="12" stroke="#C17E3E" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="14" y1="24" x2="26" y2="24" stroke="#C17E3E" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  },
  Visa: {
    svg: `<svg viewBox="0 0 60 24" xmlns="http://www.w3.org/2000/svg">
      <text x="2" y="18" font-family="Arial" font-weight="900" font-size="20" fill="#1A1F71" letter-spacing="-1">VISA</text>
      <text x="2" y="18" font-family="Arial" font-weight="900" font-size="20" fill="#ffffff" letter-spacing="-1">VISA</text>
    </svg>`
  },
  Mastercard: {
    svg: `<svg viewBox="0 0 50 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="16" r="13" fill="#EB001B"/>
      <circle cx="32" cy="16" r="13" fill="#F79E1B"/>
      <path d="M25 7 Q28 12 28 16 Q28 20 25 25 Q22 20 22 16 Q22 12 25 7Z" fill="#FF5F00"/>
    </svg>`
  },
  Firebase: {
    svg: `<svg viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 34 L16 4 L22 16 L16 10Z" fill="#FFA000"/>
      <path d="M4 34 L22 16 L28 34Z" fill="#F57C00"/>
      <path d="M4 34 L28 34 L16 20Z" fill="#FFCA28"/>
      <path d="M16 4 L22 16 L16 10Z" fill="#FF6D00"/>
    </svg>`
  },
  Cloudflare: {
    svg: `<svg viewBox="0 0 50 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M35 22 Q40 10 30 8 Q28 2 20 4 Q14 2 12 8 Q6 8 6 14 Q6 22 14 22Z" fill="#F38020"/>
      <path d="M36 22 Q42 22 42 16 Q42 10 36 10 Q34 4 28 6" fill="#FBAD41" stroke="none"/>
    </svg>`
  },
  Gemini: {
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gem" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4285F4"/>
          <stop offset="50%" stop-color="#9C27B0"/>
          <stop offset="100%" stop-color="#EA4335"/>
        </linearGradient>
      </defs>
      <path d="M20 4 C20 4 20 20 4 20 C4 20 20 20 20 36 C20 36 20 20 36 20 C36 20 20 20 20 4Z" fill="url(#gem)"/>
    </svg>`
  },
  Stripe: {
    svg: `<svg viewBox="0 0 50 22" xmlns="http://www.w3.org/2000/svg">
      <text x="2" y="17" font-family="Arial" font-weight="bold" font-size="16" fill="#635BFF">stripe</text>
    </svg>`
  },
  NVIDIA: {
    svg: `<svg viewBox="0 0 56 20" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="2" width="16" height="16" rx="2" fill="#76B900"/>
      <text x="2" y="14" font-family="Arial" font-weight="bold" font-size="9" fill="#ffffff">NV</text>
      <text x="20" y="15" font-family="Arial" font-weight="bold" font-size="11" fill="#76B900">NVIDIA</text>
    </svg>`
  },
  Snowflake: {
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="4" x2="20" y2="36" stroke="#29B5E8" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="4" y1="20" x2="36" y2="20" stroke="#29B5E8" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="8" y1="8" x2="32" y2="32" stroke="#29B5E8" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="32" y1="8" x2="8" y2="32" stroke="#29B5E8" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="20" cy="20" r="3" fill="#29B5E8"/>
      <circle cx="20" cy="4" r="2" fill="#29B5E8"/>
      <circle cx="20" cy="36" r="2" fill="#29B5E8"/>
      <circle cx="4" cy="20" r="2" fill="#29B5E8"/>
      <circle cx="36" cy="20" r="2" fill="#29B5E8"/>
    </svg>`
  },
};

const ROWS = [
  {
    duration: "38s",
    dir: "normal",
    logos: [
      { name: "Stripe",      svgKey: "Stripe",      src: null },
      { name: "AWS",         svgKey: "AWS",         src: null },
      { name: "OpenAI",      svgKey: "OpenAI",      src: null },
      { name: "Azure",       svgKey: null, src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg" },
      { name: "Docker",      svgKey: null, src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" },
      { name: "Kubernetes",  svgKey: null, src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg" },
      { name: "GitHub",      svgKey: null, src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" },
      { name: "NVIDIA",      svgKey: "NVIDIA",      src: null },
      { name: "Terraform",   svgKey: null, src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/terraform/terraform-original.svg" },
      { name: "Python",      svgKey: null, src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" },
      { name: "Linux",       svgKey: null, src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg" },
      { name: "Snowflake",   svgKey: "Snowflake",   src: null },
    ],
  },
  {
    duration: "48s",
    dir: "reverse",
    logos: [
      { name: "MongoDB",     svgKey: null, src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg" },
      { name: "Redis",       svgKey: null, src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg" },
      { name: "PostgreSQL",  svgKey: null, src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" },
      { name: "Firebase",    svgKey: "Firebase",    src: null },
      { name: "Cloudflare",  svgKey: "Cloudflare",  src: null },
      { name: "Grafana",     svgKey: null, src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/grafana/grafana-original.svg" },
      { name: "React",       svgKey: null, src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" },
      { name: "TypeScript",  svgKey: null, src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" },
      { name: "Nginx",       svgKey: null, src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg" },
      { name: "Go",          svgKey: null, src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original-wordmark.svg" },
      { name: "Ansible",     svgKey: null, src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ansible/ansible-original.svg" },
      { name: "Jenkins",     svgKey: null, src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jenkins/jenkins-original.svg" },
    ],
  },
  {
    duration: "30s",
    dir: "normal",
    logos: [
      { name: "Anthropic",   svgKey: "Anthropic",   src: null },
      { name: "Gemini",      svgKey: "Gemini",      src: null },
      { name: "Visa",        svgKey: "Visa",        src: null },
      { name: "Mastercard",  svgKey: "Mastercard",  src: null },
      { name: "Slack",       svgKey: null, src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/slack/slack-original.svg" },
      { name: "PayPal",      svgKey: null, src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/paypal/paypal-original.svg" },
      { name: "GitLab",      svgKey: null, src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/gitlab/gitlab-original.svg" },
      { name: "Jira",        svgKey: null, src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jira/jira-original.svg" },
      { name: "Figma",       svgKey: null, src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg" },
      { name: "Tailwind",    svgKey: null, src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-plain.svg" },
      { name: "Bitbucket",   svgKey: null, src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bitbucket/bitbucket-original.svg" },
      { name: "Okta",        svgKey: null, src: "https://www.vectorlogo.zone/logos/okta/okta-icon.svg" },
    ],
  },
];

function LogoIcon({ logo }) {
  if (logo.svgKey && LOGOS[logo.svgKey]) {
    return (
      <div
        style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}
        dangerouslySetInnerHTML={{ __html: LOGOS[logo.svgKey].svg }}
      />
    );
  }
  return (
    <img
      src={logo.src}
      alt={logo.name}
      loading="lazy"
      style={{ width: 34, height: 34, objectFit: "contain", filter: "brightness(0.9) saturate(0.8)" }}
      onError={(e) => { e.target.style.opacity = 0; }}
    />
  );
}

function MarqueeRow({ logos, duration, dir }) {
  const items = [...logos, ...logos, ...logos];
  return (
    <div
      className="w-full overflow-hidden"
      style={{
        maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "14px",
          width: "max-content",
          animation: `marquee-scroll ${duration} linear infinite ${dir}`,
        }}
      >
        {items.map((logo, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              flexShrink: 0,
              width: 80,
              height: 70,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: "8px 10px",
            }}
          >
            <LogoIcon logo={logo} />
            <span style={{ fontSize: 7, color: "rgba(255,255,255,0.4)", letterSpacing: 0.5, textAlign: "center", lineHeight: 1.2 }}>
              {logo.name.toUpperCase()}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}

export default function TechnologyMarquee() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <div ref={ref} className="w-full max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
          style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)", color: "#38bdf8" }}
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
          className="text-sm md:text-base text-white/50 max-w-xl mx-auto"
        >
          60+ enterprise technologies unified in one sovereign security stack.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 0.3 }}
        className="flex flex-col"
        style={{ gap: 0, perspective: "1200px" }}
      >
        {ROWS.map((row, i) => {
          const rotateX = [-12, -6, 0][i];
          const scaleX = [0.72, 0.86, 1][i];
          const opacity = [0.6, 0.8, 1][i];
          const mb = [-8, -4, 0][i];
          return (
            <div
              key={i}
              style={{
                transform: `rotateX(${rotateX}deg) scaleX(${scaleX})`,
                transformOrigin: "center center",
                marginBottom: mb,
                opacity,
              }}
            >
              <MarqueeRow logos={row.logos} duration={row.duration} dir={row.dir} />
            </div>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 0.6 }}
        className="mt-8 flex items-center justify-center gap-3"
      >
        <div className="h-px flex-1 max-w-[120px]" style={{ background: "linear-gradient(to right, transparent, rgba(56,189,248,0.3))" }} />
        <span className="text-xs text-white/30 tracking-widest uppercase">60+ Integrated Technologies</span>
        <div className="h-px flex-1 max-w-[120px]" style={{ background: "linear-gradient(to left, transparent, rgba(56,189,248,0.3))" }} />
      </motion.div>
    </div>
  );
}