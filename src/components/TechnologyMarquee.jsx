import React from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const TOKEN = "live_6a1a28fd-6420-4492-aeb0-b297461d9de2";
const logo = (domain) => `https://img.logo.dev/${domain}?token=${TOKEN}&size=64&format=png&theme=dark`;

const ROWS = [
  {
    duration: "60s",
    dir: "normal",
    logos: [
      { name: "Stripe",        src: logo("stripe.com") },
      { name: "AWS",           src: logo("amazon.com") },
      { name: "OpenAI",        src: logo("openai.com") },
      { name: "Azure",         src: logo("azure.microsoft.com") },
      { name: "Docker",        src: logo("docker.com") },
      { name: "Kubernetes",    src: logo("kubernetes.io") },
      { name: "GitHub",        src: logo("github.com") },
      { name: "NVIDIA",        src: logo("nvidia.com") },
      { name: "Terraform",     src: logo("terraform.io") },
      { name: "Python",        src: logo("python.org") },
      { name: "Linux",         src: logo("kernel.org") },
      { name: "Snowflake",     src: logo("snowflake.com") },
      { name: "Vercel",        src: logo("vercel.com") },
      { name: "Netlify",       src: logo("netlify.com") },
      { name: "Heroku",        src: logo("heroku.com") },
      { name: "Cloudinary",    src: logo("cloudinary.com") },
      { name: "Twilio",        src: logo("twilio.com") },
      { name: "SendGrid",      src: logo("sendgrid.com") },
      { name: "Auth0",         src: logo("auth0.com") },
      { name: "HashiCorp",     src: logo("hashicorp.com") },
      { name: "Grafana",       src: logo("grafana.com") },
      { name: "Datadog",       src: logo("datadoghq.com") },
      { name: "New Relic",     src: logo("newrelic.com") },
      { name: "PagerDuty",     src: logo("pagerduty.com") },
      { name: "Splunk",        src: logo("splunk.com") },
      { name: "Elastic",       src: logo("elastic.co") },
      { name: "Kafka",         src: logo("confluent.io") },
      { name: "RabbitMQ",      src: logo("rabbitmq.com") },
      { name: "Consul",        src: logo("consul.io") },
      { name: "CircleCI",      src: logo("circleci.com") },
      { name: "TravisCI",      src: logo("travis-ci.com") },
      { name: "ArgoCD",        src: logo("argoproj.github.io") },
      { name: "Prometheus",    src: logo("prometheus.io") },
      { name: "Istio",         src: logo("istio.io") },
    ],
  },
  {
    duration: "70s",
    dir: "reverse",
    logos: [
      { name: "MongoDB",       src: logo("mongodb.com") },
      { name: "Redis",         src: logo("redis.io") },
      { name: "PostgreSQL",    src: logo("postgresql.org") },
      { name: "Firebase",      src: logo("firebase.google.com") },
      { name: "Cloudflare",    src: logo("cloudflare.com") },
      { name: "React",         src: logo("react.dev") },
      { name: "TypeScript",    src: logo("typescriptlang.org") },
      { name: "Nginx",         src: logo("nginx.com") },
      { name: "Go",            src: logo("golang.org") },
      { name: "Ansible",       src: logo("redhat.com") },
      { name: "Jenkins",       src: logo("jenkins.io") },
      { name: "MySQL",         src: logo("mysql.com") },
      { name: "MariaDB",       src: logo("mariadb.org") },
      { name: "Cassandra",     src: logo("apache.org") },
      { name: "CockroachDB",   src: logo("cockroachlabs.com") },
      { name: "Supabase",      src: logo("supabase.com") },
      { name: "PlanetScale",   src: logo("planetscale.com") },
      { name: "Neon",          src: logo("neon.tech") },
      { name: "Prisma",        src: logo("prisma.io") },
      { name: "GraphQL",       src: logo("graphql.org") },
      { name: "Apollo",        src: logo("apollographql.com") },
      { name: "Next.js",       src: logo("nextjs.org") },
      { name: "Nuxt",          src: logo("nuxt.com") },
      { name: "Svelte",        src: logo("svelte.dev") },
      { name: "Remix",         src: logo("remix.run") },
      { name: "Vite",          src: logo("vitejs.dev") },
      { name: "Webpack",       src: logo("webpack.js.org") },
      { name: "Babel",         src: logo("babeljs.io") },
      { name: "ESLint",        src: logo("eslint.org") },
      { name: "Jest",          src: logo("jestjs.io") },
      { name: "Playwright",    src: logo("playwright.dev") },
      { name: "Prettier",      src: logo("prettier.io") },
      { name: "tRPC",          src: logo("trpc.io") },
      { name: "Storybook",     src: logo("chromatic.com") },
    ],
  },
  {
    duration: "50s",
    dir: "normal",
    logos: [
      { name: "Anthropic",     src: logo("anthropic.com") },
      { name: "Google AI",     src: logo("google.com") },
      { name: "Visa",          src: logo("visa.com") },
      { name: "Mastercard",    src: logo("mastercard.com") },
      { name: "Slack",         src: logo("slack.com") },
      { name: "PayPal",        src: logo("paypal.com") },
      { name: "GitLab",        src: logo("about.gitlab.com") },
      { name: "Atlassian",     src: logo("atlassian.com") },
      { name: "Figma",         src: logo("figma.com") },
      { name: "Tailwind",      src: logo("tailwindcss.com") },
      { name: "Okta",          src: logo("okta.com") },
      { name: "HuggingFace",   src: logo("huggingface.co") },
      { name: "Cohere",        src: logo("cohere.com") },
      { name: "Mistral",       src: logo("mistral.ai") },
      { name: "Replicate",     src: logo("replicate.com") },
      { name: "Pinecone",      src: logo("pinecone.io") },
      { name: "Weaviate",      src: logo("weaviate.io") },
      { name: "LangChain",     src: logo("langchain.com") },
      { name: "Zapier",        src: logo("zapier.com") },
      { name: "Make",          src: logo("make.com") },
      { name: "Notion",        src: logo("notion.so") },
      { name: "Airtable",      src: logo("airtable.com") },
      { name: "Linear",        src: logo("linear.app") },
      { name: "Sentry",        src: logo("sentry.io") },
      { name: "Mixpanel",      src: logo("mixpanel.com") },
      { name: "Segment",       src: logo("segment.com") },
      { name: "Amplitude",     src: logo("amplitude.com") },
      { name: "Hubspot",       src: logo("hubspot.com") },
      { name: "Salesforce",    src: logo("salesforce.com") },
      { name: "Zendesk",       src: logo("zendesk.com") },
      { name: "Intercom",      src: logo("intercom.com") },
      { name: "Plaid",         src: logo("plaid.com") },
      { name: "Square",        src: logo("squareup.com") },
      { name: "Brex",          src: logo("brex.com") },
    ],
  },
];

function LogoCard({ logo }) {
  return (
    <div className="marquee-logo-card">
      <img
        src={logo.src}
        alt={logo.name}
        loading="lazy"
        style={{ width: 36, height: 36, objectFit: "contain" }}
        onError={(e) => { e.target.style.opacity = 0.15; }}
      />
      <span style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", letterSpacing: 0.5, textAlign: "center", lineHeight: 1.2, marginTop: 4 }}>
        {logo.name.toUpperCase()}
      </span>
    </div>
  );
}

function MarqueeRow({ logos, duration, dir }) {
  const items = [...logos, ...logos, ...logos];
  return (
    <div
      className="w-full overflow-hidden"
      style={{
        maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "20px",
          width: "max-content",
          animation: `marquee-scroll ${duration} linear infinite ${dir}`,
          padding: "10px 0",
        }}
      >
        {items.map((logo, i) => (
          <LogoCard key={i} logo={logo} />
        ))}
      </div>
    </div>
  );
}

const ROW_CONFIGS = [
  { rotateX: 0, scaleX: 1.00, opacity: 0.40, mb: 48 },
  { rotateX: 0, scaleX: 1.00, opacity: 0.70, mb: 48 },
  { rotateX: 0, scaleX: 1.00, opacity: 1.00, mb:  0 },
];

export default function TechnologyMarquee() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <div ref={ref} className="w-full max-w-6xl mx-auto px-4 py-20">
      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .marquee-logo-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 90px;
          height: 80px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 12px 14px;
          filter: grayscale(1) brightness(0.45);
          transition: filter 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease, background 0.25s ease, z-index 0s;
          cursor: default;
          position: relative;
          z-index: 0;
          overflow: visible;
        }
        .marquee-logo-card:hover {
          filter: grayscale(0) brightness(1.15) saturate(1.3);
          border-color: rgba(56,189,248,0.5);
          box-shadow: 0 0 20px rgba(56,189,248,0.35), 0 0 40px rgba(56,189,248,0.15), 0 8px 24px rgba(0,0,0,0.4);
          background: rgba(56,189,248,0.08);
          transform: translateY(-6px) scale(1.12);
          z-index: 10;
        }
      `}</style>

      <div className="text-center mb-14">
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
          className="text-2xl md:text-4xl font-bold text-white mb-3"
        >
          Built on World-Class Infrastructure
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-sm md:text-base text-white/50 max-w-xl mx-auto"
        >
          100+ enterprise technologies unified in one sovereign security stack.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 0.3 }}
        style={{ display: "flex", flexDirection: "column" }}
      >
        {ROWS.map((row, i) => {
          const cfg = ROW_CONFIGS[i];
          return (
            <div
              key={i}
              style={{
                transform: `rotateX(${cfg.rotateX}deg) scaleX(${cfg.scaleX})`,
                transformOrigin: "center top",
                marginBottom: cfg.mb,
                opacity: cfg.opacity,
                transformStyle: "preserve-3d",
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
        className="mt-12 flex items-center justify-center gap-3"
      >
        <div className="h-px flex-1 max-w-[120px]" style={{ background: "linear-gradient(to right, transparent, rgba(56,189,248,0.3))" }} />
        <span className="text-xs text-white/30 tracking-widest uppercase">100+ Integrated Technologies</span>
        <div className="h-px flex-1 max-w-[120px]" style={{ background: "linear-gradient(to left, transparent, rgba(56,189,248,0.3))" }} />
      </motion.div>
    </div>
  );
}