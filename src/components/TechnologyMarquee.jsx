import React from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const ROWS = [
  {
    duration: "35s",
    dir: "normal",
    logos: [
      { name: "Stripe",      src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/devicon/devicon-original.svg", emoji: "💳", color: "#635BFF" },
      { name: "AWS",         src: null, emoji: "☁️", color: "#FF9900" },
      { name: "Google Cloud",src: null, emoji: "🌐", color: "#4285F4" },
      { name: "Azure",       src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg", emoji: null, color: "#0078D4" },
      { name: "Docker",      src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg", emoji: null, color: "#2496ED" },
      { name: "Kubernetes",  src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg", emoji: null, color: "#326CE5" },
      { name: "GitHub",      src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg", emoji: null, color: "#ffffff" },
      { name: "NVIDIA",      src: null, emoji: "⚡", color: "#76B900" },
      { name: "OpenAI",      src: null, emoji: "🤖", color: "#ffffff" },
      { name: "Terraform",   src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/terraform/terraform-original.svg", emoji: null, color: "#7B42BC" },
      { name: "Linux",       src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg", emoji: null, color: "#FCC624" },
      { name: "Python",      src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg", emoji: null, color: "#3776AB" },
    ],
  },
  {
    duration: "45s",
    dir: "reverse",
    logos: [
      { name: "MongoDB",     src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg", emoji: null, color: "#47A248" },
      { name: "Redis",       src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg", emoji: null, color: "#DC382D" },
      { name: "PostgreSQL",  src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg", emoji: null, color: "#336791" },
      { name: "Firebase",    src: null, emoji: "🔥", color: "#FFCA28" },
      { name: "Cloudflare",  src: null, emoji: "🛡️", color: "#F38020" },
      { name: "Grafana",     src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/grafana/grafana-original.svg", emoji: null, color: "#F46800" },
      { name: "React",       src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg", emoji: null, color: "#61DAFB" },
      { name: "TypeScript",  src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg", emoji: null, color: "#3178C6" },
      { name: "Nginx",       src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg", emoji: null, color: "#009639" },
      { name: "Ansible",     src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ansible/ansible-original.svg", emoji: null, color: "#EE0000" },
      { name: "Bitbucket",   src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bitbucket/bitbucket-original.svg", emoji: null, color: "#0052CC" },
      { name: "Go",          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg", emoji: null, color: "#00ADD8" },
    ],
  },
  {
    duration: "28s",
    dir: "normal",
    logos: [
      { name: "Anthropic",   src: null, emoji: "🧠", color: "#C17E3E" },
      { name: "Gemini",      src: null, emoji: "♊", color: "#8E75B2" },
      { name: "Slack",       src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/slack/slack-original.svg", emoji: null, color: "#4A154B" },
      { name: "Visa",        src: null, emoji: "💳", color: "#1A1F71" },
      { name: "Mastercard",  src: null, emoji: "🔴", color: "#EB001B" },
      { name: "Stripe",      src: null, emoji: "⚡", color: "#635BFF" },
      { name: "PayPal",      src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/paypal/paypal-original.svg", emoji: null, color: "#00457C" },
      { name: "GitLab",      src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/gitlab/gitlab-original.svg", emoji: null, color: "#FC6D26" },
      { name: "Jenkins",     src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jenkins/jenkins-original.svg", emoji: null, color: "#D33833" },
      { name: "Jira",        src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jira/jira-original.svg", emoji: null, color: "#0052CC" },
      { name: "Figma",       src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg", emoji: null, color: "#F24E1E" },
      { name: "Tailwind",    src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-plain.svg", emoji: null, color: "#06B6D4" },
    ],
  },
];

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
          gap: "16px",
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
              gap: "6px",
              flexShrink: 0,
              width: 80,
              height: 72,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: "10px 12px",
            }}
          >
            <img
              src={logo.src}
              alt={logo.name}
              loading="lazy"
              style={{ width: 32, height: 32, objectFit: "contain", filter: "brightness(0.9) saturate(0.75)" }}
            />
            <span style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textAlign: "center" }}>
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
          // Each row tilts slightly differently to simulate a stacked cylinder cone
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
                transition: "transform 0.3s",
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