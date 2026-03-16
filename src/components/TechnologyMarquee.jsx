import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

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

// Infinite scroll marquee row
function MarqueeRow({ logos, speed = 40, direction = 1, itemH = 56, imgH = 32, opacity = 1 }) {
  // Double the logos so the loop is seamless
  const doubled = [...logos, ...logos];
  const duration = (logos.length * 160) / speed;

  return (
    <div
      className="overflow-hidden w-full"
      style={{ height: itemH + 16, opacity, maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)", WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)" }}
    >
      <div
        className="flex items-center gap-3"
        style={{
          width: "max-content",
          animation: `marquee-scroll ${duration}s linear infinite`,
          animationDirection: direction === -1 ? "reverse" : "normal",
        }}
      >
        {doubled.map((logo, i) => (
          <div
            key={`${logo.name}-${i}`}
            className="flex items-center justify-center flex-shrink-0 group"
            style={{
              width: 120,
              height: itemH,
              borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "6px 12px",
              transition: "all 0.3s ease",
            }}
          >
            <img
              src={logo.logo}
              alt={logo.name}
              loading="lazy"
              style={{
                maxWidth: "100%",
                height: imgH,
                objectFit: "contain",
                filter: "brightness(0) invert(1) opacity(0.55)",
                transition: "filter 0.3s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.filter = "none"; e.currentTarget.parentElement.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.parentElement.style.borderColor = "rgba(255,255,255,0.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.filter = "brightness(0) invert(1) opacity(0.55)"; e.currentTarget.parentElement.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.parentElement.style.borderColor = "rgba(255,255,255,0.08)"; }}
              onError={e => { e.target.style.display = "none"; }}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

export default function TechnologyMarquee() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.15 });

  // Pyramid: top row fewest logos (narrowest visually), bottom row most
  const ring1 = ALL_LOGOS.slice(0, 10);   // top — smallest/fewest
  const ring2 = ALL_LOGOS.slice(10, 35);  // middle
  const ring3 = ALL_LOGOS.slice(35);      // base — widest/most

  return (
    <div
      ref={containerRef}
      className="w-full mx-auto px-0 py-16 relative overflow-hidden"
      style={{ background: "transparent" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 60%, rgba(87,61,255,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="text-center mb-12 relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
          style={{ background: "rgba(87,61,255,0.12)", border: "1px solid rgba(87,61,255,0.3)", color: "#a78bfa" }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#a78bfa" }} />
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

      {/* Pyramid rows — top is narrowest (centered, clipped), base is full width */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, delay: 0.3 }}
        className="relative z-10 flex flex-col items-center gap-3"
      >
        {/* Row 1 — TOP: narrowest, fewest, most faded */}
        <div style={{ width: "42%", minWidth: 320 }}>
          <MarqueeRow logos={ring1} speed={28} direction={1} itemH={48} imgH={26} opacity={0.6} />
        </div>

        {/* Row 2 — MIDDLE */}
        <div style={{ width: "72%", minWidth: 480 }}>
          <MarqueeRow logos={ring2} speed={38} direction={-1} itemH={56} imgH={32} opacity={0.8} />
        </div>

        {/* Row 3 — BASE: full width, most opaque, largest */}
        <div style={{ width: "100%" }}>
          <MarqueeRow logos={ring3} speed={48} direction={1} itemH={64} imgH={38} opacity={1} />
        </div>
      </motion.div>

      {/* Bottom label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 0.8 }}
        className="mt-10 flex items-center justify-center gap-3 relative z-10 px-4"
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