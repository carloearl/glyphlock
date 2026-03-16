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
      { name: "AWS",           src: logo("aws.amazon.com") },
      { name: "OpenAI",        src: logo("openai.com") },
      { name: "Azure",         src: logo("azure.microsoft.com") },
      { name: "Docker",        src: logo("docker.com") },
      { name: "Kubernetes",    src: logo("kubernetes.io") },
      { name: "GitHub",        src: logo("github.com") },
      { name: "NVIDIA",        src: logo("nvidia.com") },
      { name: "Terraform",     src: logo("terraform.io") },
      { name: "Python",        src: logo("python.org") },
      { name: "Linux",         src: logo("linux.org") },
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
      { name: "Kafka",         src: logo("kafka.apache.org") },
      { name: "RabbitMQ",      src: logo("rabbitmq.com") },
      { name: "Vault",         src: logo("vaultproject.io") },
      { name: "Consul",        src: logo("consul.io") },
      { name: "Nomad",         src: logo("nomadproject.io") },
      { name: "Packer",        src: logo("packer.io") },
      { name: "CircleCI",      src: logo("circleci.com") },
      { name: "Travis CI",     src: logo("travis-ci.com") },
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
      { name: "Go",            src: logo("go.dev") },
      { name: "Ansible",       src: logo("ansible.com") },
      { name: "Jenkins",       src: logo("jenkins.io") },
      { name: "MySQL",         src: logo("mysql.com") },
      { name: "MariaDB",       src: logo("mariadb.org") },
      { name: "Cassandra",     src: logo("cassandra.apache.org") },
      { name: "CockroachDB",   src: logo("cockroachlabs.com") },
      { name: "DynamoDB",      src: logo("aws.amazon.com") },
      { name: "Supabase",      src: logo("supabase.com") },
      { name: "PlanetScale",   src: logo("planetscale.com") },
      { name: "Neon",          src: logo("neon.tech") },
      { name: "Prisma",        src: logo("prisma.io") },
      { name: "GraphQL",       src: logo("graphql.org") },
      { name: "Apollo",        src: logo("apollographql.com") },
      { name: "tRPC",          src: logo("trpc.io") },
      { name: "Next.js",       src: logo("nextjs.org") },
      { name: "Nuxt",          src: logo("nuxt.com") },
      { name: "SvelteKit",     src: logo("svelte.dev") },
      { name: "Remix",         src: logo("remix.run") },
      { name: "Vite",          src: logo("vitejs.dev") },
      { name: "Webpack",       src: logo("webpack.js.org") },
      { name: "Babel",         src: logo("babeljs.io") },
      { name: "ESLint",        src: logo("eslint.org") },
      { name: "Prettier",      src: logo("prettier.io") },
      { name: "Jest",          src: logo("jestjs.io") },
      { name: "Playwright",    src: logo("playwright.dev") },
    ],
  },
  {
    duration: "50s",
    dir: "normal",
    logos: [
      { name: "Anthropic",     src: logo("anthropic.com") },
      { name: "Gemini",        src: logo("deepmind.google") },
      { name: "Visa",          src: logo("visa.com") },
      { name: "Mastercard",    src: logo("mastercard.com") },
      { name: "Slack",         src: logo("slack.com") },
      { name: "PayPal",        src: logo("paypal.com") },
      { name: "GitLab",        src: logo("gitlab.com") },
      { name: "Jira",          src: logo("atlassian.com") },
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
      { name: "Brex",          src: logo("brex.com") },
      { name: "Plaid",         src: logo("plaid.com") },
      { name: "Square",        src: logo("squareup.com") },
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
            <img
              src={logo.src}
              alt={logo.name}
              loading="lazy"
              style={{ width: 34, height: 34, objectFit: "contain" }}
              onError={(e) => { e.target.style.opacity = 0.2; }}
            />
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
          100+ enterprise technologies unified in one sovereign security stack.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 0.3 }}
        className="flex flex-col"
        style={{ gap: 0, perspective: "600px" }}
      >
        {ROWS.map((row, i) => {
          const rotateX = [-28, -14, 0][i];
          const scaleX = [0.55, 0.78, 1][i];
          const opacity = [0.45, 0.72, 1][i];
          const mb = [-18, -10, 0][i];
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
        <span className="text-xs text-white/30 tracking-widest uppercase">100+ Integrated Technologies</span>
        <div className="h-px flex-1 max-w-[120px]" style={{ background: "linear-gradient(to left, transparent, rgba(56,189,248,0.3))" }} />
      </motion.div>
    </div>
  );
}