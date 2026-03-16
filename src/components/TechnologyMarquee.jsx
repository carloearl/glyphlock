import React, { useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";

const ROWS = [
  {
    logos: [
      { name: "Stripe",     src: "https://www.vectorlogo.zone/logos/stripe/stripe-icon.svg" },
      { name: "PayPal",     src: "https://www.vectorlogo.zone/logos/paypal/paypal-icon.svg" },
      { name: "AWS",        src: "https://www.vectorlogo.zone/logos/amazon_aws/amazon_aws-icon.svg" },
      { name: "GCloud",     src: "https://www.vectorlogo.zone/logos/google_cloud/google_cloud-icon.svg" },
      { name: "Azure",      src: "https://www.vectorlogo.zone/logos/microsoft_azure/microsoft_azure-icon.svg" },
      { name: "Docker",     src: "https://www.vectorlogo.zone/logos/docker/docker-icon.svg" },
      { name: "Kubernetes", src: "https://www.vectorlogo.zone/logos/kubernetes/kubernetes-icon.svg" },
      { name: "GitHub",     src: "https://www.vectorlogo.zone/logos/github/github-icon.svg" },
      { name: "OpenAI",     src: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg" },
      { name: "NVIDIA",     src: "https://www.vectorlogo.zone/logos/nvidia/nvidia-icon.svg" },
    ],
    speed: 40, // px/sec
    dir: 1,
  },
  {
    logos: [
      { name: "MongoDB",    src: "https://www.vectorlogo.zone/logos/mongodb/mongodb-icon.svg" },
      { name: "Redis",      src: "https://www.vectorlogo.zone/logos/redis/redis-icon.svg" },
      { name: "PostgreSQL", src: "https://www.vectorlogo.zone/logos/postgresql/postgresql-icon.svg" },
      { name: "Snowflake",  src: "https://www.vectorlogo.zone/logos/snowflake/snowflake-icon.svg" },
      { name: "Cloudflare", src: "https://www.vectorlogo.zone/logos/cloudflare/cloudflare-icon.svg" },
      { name: "Okta",       src: "https://www.vectorlogo.zone/logos/okta/okta-icon.svg" },
      { name: "Terraform",  src: "https://www.vectorlogo.zone/logos/terraformio/terraformio-icon.svg" },
      { name: "Grafana",    src: "https://www.vectorlogo.zone/logos/grafana/grafana-icon.svg" },
      { name: "Datadog",    src: "https://www.vectorlogo.zone/logos/datadoghq/datadoghq-icon.svg" },
      { name: "Firebase",   src: "https://www.vectorlogo.zone/logos/google_firebase/google_firebase-icon.svg" },
    ],
    speed: 32,
    dir: -1,
  },
  {
    logos: [
      { name: "Anthropic",  src: "https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg" },
      { name: "Gemini",     src: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg" },
      { name: "Slack",      src: "https://www.vectorlogo.zone/logos/slack/slack-icon.svg" },
      { name: "Splunk",     src: "https://www.vectorlogo.zone/logos/splunk/splunk-icon.svg" },
      { name: "GitLab",     src: "https://www.vectorlogo.zone/logos/gitlab/gitlab-icon.svg" },
      { name: "Cisco",      src: "https://www.vectorlogo.zone/logos/cisco/cisco-icon.svg" },
      { name: "Mastercard", src: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" },
      { name: "Visa",       src: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" },
      { name: "React",      src: "https://www.vectorlogo.zone/logos/reactjs/reactjs-icon.svg" },
      { name: "Tailwind",   src: "https://www.vectorlogo.zone/logos/tailwindcss/tailwindcss-icon.svg" },
    ],
    speed: 48,
    dir: 1,
  },
];

function MarqueeRow({ logos, speed, dir }) {
  const trackRef = useRef(null);
  const posRef = useRef(0);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Duplicate logos for seamless loop
  const items = [...logos, ...logos];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const tick = (time) => {
      if (lastTimeRef.current === null) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      posRef.current += speed * dir * dt;

      // Each set is half the track width
      const halfW = track.scrollWidth / 2;
      if (dir === 1 && posRef.current >= halfW) posRef.current -= halfW;
      if (dir === -1 && posRef.current <= -halfW) posRef.current += halfW;

      track.style.transform = `translateX(${-posRef.current}px)`;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [speed, dir]);

  return (
    <div className="w-full overflow-hidden" style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}>
      <div ref={trackRef} className="flex gap-6 w-max py-2">
        {items.map((logo, i) => (
          <div
            key={logo.name + i}
            className="flex flex-col items-center justify-center gap-2 flex-shrink-0"
            style={{
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
              onError={e => { e.target.style.opacity = 0; }}
              style={{ width: 32, height: 32, objectFit: "contain", filter: "brightness(0.85) saturate(0.8)" }}
            />
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", letterSpacing: 1, textAlign: "center", lineHeight: 1 }}>
              {logo.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TechnologyMarquee() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <div ref={ref} className="w-full max-w-6xl mx-auto px-4 py-16">
      {/* Header */}
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

      {/* Rows */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 0.3 }}
        className="flex flex-col gap-4"
      >
        {ROWS.map((row, i) => (
          <MarqueeRow key={i} logos={row.logos} speed={row.speed} dir={row.dir} />
        ))}
      </motion.div>

      {/* Footer line */}
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