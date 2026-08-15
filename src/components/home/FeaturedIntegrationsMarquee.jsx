import React from "react";

const TOKEN = "live_6a1a28fd-6420-4492-aeb0-b297461d9de2";
const logo = (domain) => `https://img.logo.dev/${domain}?token=${TOKEN}&size=256&format=png&retina=true&theme=dark`;

const FEATURED = [
  { name: "Oracle", subtitle: "Enterprise Platform", src: logo("oracle.com") },
  { name: "OPERA", subtitle: "Hospitality Property System", src: logo("opera.com") },
  { name: "Base44", subtitle: "Application Platform", src: logo("base44.com") },
  { name: "Stripe", subtitle: "Payments & Payouts", src: logo("stripe.com") },
  { name: "Claude", subtitle: "AI Assistant", src: logo("anthropic.com") },
  { name: "ChatGPT", subtitle: "AI Assistant", src: logo("openai.com") },
  { name: "Gemini", subtitle: "AI Assistant", src: logo("gemini.google.com") },
  { name: "Qwen", subtitle: "AI Assistant", src: logo("qwen.ai") },
  { name: "Copilot", subtitle: "AI Assistant", src: logo("copilot.microsoft.com") },
  { name: "Perplexity", subtitle: "AI Search", src: logo("perplexity.ai") },
];

export default function FeaturedIntegrationsMarquee() {
  const items = [...FEATURED, ...FEATURED, ...FEATURED, ...FEATURED];

  return (
    <section className="w-full py-8 md:py-12">
      <style>{`
        @keyframes featured-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .featured-int-card {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-shrink: 0;
          padding: 16px 24px;
          border-radius: 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 0 30px rgba(59,130,246,0.15);
          transition: border-color .25s ease, box-shadow .25s ease, transform .25s ease;
        }
        .featured-int-card:hover {
          border-color: rgba(56,189,248,0.5);
          box-shadow: 0 0 40px rgba(56,189,248,0.35);
          transform: translateY(-4px);
        }
        .featured-int-logo {
          width: 42px;
          height: 42px;
          object-fit: contain;
          image-rendering: -webkit-optimize-contrast;
          filter: grayscale(1) brightness(1.35) contrast(1.05)
                  drop-shadow(0 2px 3px rgba(0,0,0,0.6));
          opacity: 0.75;
          transition: filter .3s ease, opacity .3s ease, transform .3s ease;
        }
        .featured-int-card:hover .featured-int-logo {
          filter: grayscale(0) contrast(1.08) saturate(1.15)
                  drop-shadow(0 4px 8px rgba(0,0,0,0.65))
                  drop-shadow(0 0 12px rgba(56,189,248,0.4));
          opacity: 1;
          transform: translateY(-2px) scale(1.08);
        }
        .featured-int-card .featured-int-name {
          color: rgba(255,255,255,0.72);
          transition: color .3s ease;
        }
        .featured-int-card:hover .featured-int-name {
          color: #ffffff;
        }
      `}</style>

      <div className="text-center mb-6 md:mb-8 px-4">
        <span
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] md:text-xs font-bold tracking-[0.2em] uppercase"
          style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)", color: "#38bdf8" }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#38bdf8" }} />
          Integrations
        </span>
      </div>

      <div
        className="w-full"
        style={{
          overflowX: "hidden",
          maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "28px",
            width: "max-content",
            padding: "8px 14px",
            animation: "featured-marquee 45s linear infinite",
          }}
        >
          {items.map((item, i) => (
            <div key={i} className="featured-int-card">
              {item.src ? (
                <img
                  src={item.src}
                  alt={item.name}
                  loading="lazy"
                  className="featured-int-logo"
                  onError={(e) => { e.target.style.opacity = 0.2; }}
                />
              ) : (
                <div
                  className="flex items-center justify-center rounded-xl font-black text-white"
                  style={{
                    width: 56,
                    height: 56,
                    fontSize: 20,
                    letterSpacing: 1,
                    background: `linear-gradient(135deg, ${item.markColor}, rgba(0,0,0,0.6))`,
                    boxShadow: `0 0 18px ${item.markColor}66`,
                  }}
                  aria-label={item.name}
                >
                  {item.mark}
                </div>
              )}
              <div className="text-left">
                <p className="featured-int-name text-base md:text-lg font-black leading-tight whitespace-nowrap">{item.name}</p>
                <p className="text-[11px] md:text-xs text-white/50 uppercase tracking-wider whitespace-nowrap">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}