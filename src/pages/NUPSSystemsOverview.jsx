import React from "react";
import { ArrowDownRight, ArrowRight, BadgeCheck, Building2, ClipboardCheck, Cloud, Download, DoorOpen, FileCheck2, MonitorDown, ShieldCheck, WalletCards, Wine } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const products = [
  {
    id: "nups",
    number: "01",
    eyebrow: "THE VENUE PLATFORM",
    name: "NUPS",
    descriptor: "Nexus Unified Portal System",
    summary: "The complete operating system for the venue: one role-aware workspace for owners, managers, and the teams running the floor.",
    features: ["Owner and manager command views", "Guest check-in and front door", "VIP sales, register, and driver drop-off", "DJ and entertainer workflows", "Shift activity and financial records"],
    href: "/NUPSLanding",
    cta: "Explore the NUPS platform",
    featured: true,
    icon: Building2,
  },
  {
    id: "dce",
    number: "02",
    eyebrow: "THE EVIDENCE WORKFLOW",
    name: "DCE",
    descriptor: "Digital Contract Engine",
    summary: "A focused system for digital agreements and the evidence around venue transactions, staff actions, closeout, and disputes.",
    features: ["Agreement and signature workflows", "Connected transaction records", "Audit history and closeout evidence", "Purpose-built deployment at dce.glyphlock.io"],
    href: "https://dce.glyphlock.io",
    cta: "Open DCE",
    featured: false,
    icon: FileCheck2,
    external: true,
  },
  {
    id: "glyphlock-door-download",
    number: "03",
    eyebrow: "THE WINDOWS STATION",
    name: "GlyphLock Door",
    descriptor: "Desktop operations for the door",
    summary: "A Windows desktop product for venue door operations. Its paid download becomes available when the desktop release package and purchase flow are ready.",
    features: ["Designed for a dedicated Windows station", "Door-team workflow, built for venue use", "Release and purchase availability will be posted here"],
    href: "#glyphlock-door-download",
    cta: "View Windows release status",
    featured: false,
    icon: MonitorDown,
  },
];

function ProductCard({ product }) {
  const Icon = product.icon;
  const isExternal = product.external;
  return (
    <article className={`systems-card ${product.featured ? "systems-card-featured" : ""}`}>
      <div className="systems-card-top">
        <span className="systems-number">{product.number}</span>
        <span className="systems-eyebrow">{product.eyebrow}</span>
        <span className="systems-icon"><Icon size={22} strokeWidth={1.8} /></span>
      </div>
      <div className="systems-card-copy">
        <h2>{product.name}</h2>
        <p className="systems-descriptor">{product.descriptor}</p>
        <p className="systems-summary">{product.summary}</p>
      </div>
      <ul className="systems-feature-list">
        {product.features.map((feature) => (
          <li key={feature}><BadgeCheck size={16} /> <span>{feature}</span></li>
        ))}
      </ul>
      <a className={`systems-card-link ${product.featured ? "systems-card-link-primary" : ""}`}
         href={product.href}
         target={isExternal ? "_blank" : undefined}
         rel={isExternal ? "noreferrer" : undefined}>
        {product.cta}<ArrowRight size={17} />
      </a>
    </article>
  );
}

export default function NUPSSystemsOverview() {
  return (
    <>
      <SEOHead />
      <main className="systems-page">
        <style>{`
          .systems-page {
            --systems-bg: #050817;
            --systems-panel: rgba(13, 20, 42, .82);
            --systems-line: rgba(145, 170, 220, .16);
            --systems-cyan: #65e7f5;
            --systems-ink: #f4f7ff;
            --systems-muted: #a6b1ca;
            position: relative;
            isolation: isolate;
            overflow: hidden;
            min-height: 100vh;
            padding: clamp(3.5rem, 8vw, 7rem) clamp(1.1rem, 5vw, 5rem) 5rem;
            color: var(--systems-ink);
            background: radial-gradient(ellipse at 50% -8%, rgba(37, 112, 198, .24), transparent 42%), var(--systems-bg);
            font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          }
          .systems-page::before {
            content: "";
            position: absolute;
            inset: 0;
            z-index: -1;
            opacity: .35;
            background-image: linear-gradient(rgba(129, 163, 225, .055) 1px, transparent 1px), linear-gradient(90deg, rgba(129, 163, 225, .055) 1px, transparent 1px);
            background-size: 48px 48px;
            mask-image: linear-gradient(to bottom, black, transparent 76%);
            pointer-events: none;
          }
          .systems-wrap { max-width: 1240px; margin: 0 auto; }
          .systems-kicker { display: inline-flex; gap: .6rem; align-items: center; color: var(--systems-cyan); font-size: .72rem; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; }
          .systems-kicker::before { content: ""; width: 24px; height: 1px; background: currentColor; }
          .systems-hero { max-width: 820px; margin-bottom: clamp(2.6rem, 6vw, 5rem); }
          .systems-hero h1 { margin: 1rem 0 1.2rem; font-size: clamp(2.8rem, 7vw, 6.2rem); font-weight: 750; letter-spacing: -.065em; line-height: .98; }
          .systems-hero h1 span { color: var(--systems-cyan); }
          .systems-hero p { max-width: 680px; margin: 0; color: var(--systems-muted); font-size: clamp(1.05rem, 1.8vw, 1.28rem); line-height: 1.7; }
          .systems-proofline { display: flex; gap: .65rem; align-items: center; margin-top: 1.5rem; color: #d8e2f8; font-size: .92rem; }
          .systems-proofline svg { color: #68e5b2; flex: none; }
          .systems-grid { display: grid; grid-template-columns: 1.16fr 1fr 1fr; gap: 1rem; align-items: stretch; }
          .systems-card { display: flex; flex-direction: column; min-width: 0; padding: clamp(1.2rem, 2.3vw, 1.8rem); border: 1px solid var(--systems-line); border-radius: 22px; background: var(--systems-panel); box-shadow: 0 22px 80px rgba(0, 0, 0, .22); backdrop-filter: blur(16px); }
          .systems-card-featured { border-color: rgba(101, 231, 245, .45); background: linear-gradient(154deg, rgba(14, 51, 75, .92), rgba(11, 18, 41, .9) 65%); box-shadow: 0 24px 90px rgba(0, 166, 200, .12), inset 0 1px rgba(255, 255, 255, .06); }
          .systems-card-top { display: flex; align-items: center; gap: .7rem; color: var(--systems-cyan); }
          .systems-number { font-size: .72rem; font-weight: 800; letter-spacing: .12em; opacity: .72; }
          .systems-eyebrow { font-size: .67rem; font-weight: 800; letter-spacing: .14em; }
          .systems-icon { display: grid; width: 42px; height: 42px; margin-left: auto; place-items: center; border: 1px solid rgba(170, 194, 235, .14); border-radius: 13px; background: rgba(255,255,255,.045); color: #dce9ff; }
          .systems-card-copy h2 { margin: 1.5rem 0 .15rem; font-size: clamp(1.8rem, 3vw, 2.6rem); letter-spacing: -.04em; line-height: 1.05; }
          .systems-descriptor { margin: 0; color: #c0cde6; font-size: .9rem; font-weight: 650; }
          .systems-summary { min-height: 5.2rem; margin: 1rem 0 1.25rem; color: var(--systems-muted); font-size: .96rem; line-height: 1.65; }
          .systems-feature-list { display: grid; gap: .8rem; margin: 0 0 1.6rem; padding: 0; list-style: none; }
          .systems-feature-list li { display: flex; gap: .6rem; align-items: flex-start; color: #dce5f7; font-size: .88rem; line-height: 1.45; }
          .systems-feature-list svg { flex: none; margin-top: .1rem; color: var(--systems-cyan); }
          .systems-card-link { display: flex; min-height: 48px; gap: .65rem; align-items: center; justify-content: space-between; margin-top: auto; padding: .75rem .95rem; border: 1px solid rgba(174, 194, 230, .2); border-radius: 12px; color: #eff5ff; font-size: .9rem; font-weight: 750; text-decoration: none; transition: transform .18s ease, border-color .18s ease, background .18s ease; }
          .systems-card-link:hover { transform: translateY(-2px); border-color: rgba(101, 231, 245, .65); background: rgba(67, 190, 214, .08); }
          .systems-card-link-primary { border-color: transparent; color: #031321; background: linear-gradient(100deg, #64e0ef, #3b9ff0); }
          .systems-card-link-primary:hover { border-color: transparent; background: linear-gradient(100deg, #8af0f8, #68b8ff); }
          .systems-strip { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: .7rem; margin-top: 1.2rem; }
          .systems-strip-item { display: flex; gap: .65rem; align-items: center; min-height: 66px; padding: .8rem 1rem; border: 1px solid var(--systems-line); border-radius: 14px; background: rgba(10, 15, 34, .7); color: #cfdaef; font-size: .82rem; font-weight: 650; }
          .systems-strip-item svg { flex: none; color: var(--systems-cyan); }
          .systems-principle { display: grid; grid-template-columns: 1fr auto; gap: 1.5rem; align-items: center; margin-top: clamp(3rem, 7vw, 5.5rem); padding: clamp(1.4rem, 3vw, 2.2rem); border: 1px solid rgba(101, 231, 245, .2); border-radius: 20px; background: linear-gradient(110deg, rgba(15, 35, 65, .86), rgba(15, 20, 43, .8)); }
          .systems-principle h2 { margin: .5rem 0 .45rem; font-size: clamp(1.4rem, 3vw, 2.2rem); letter-spacing: -.035em; }
          .systems-principle p { max-width: 730px; margin: 0; color: var(--systems-muted); line-height: 1.65; }
          .systems-principle-link { display: inline-flex; gap: .6rem; align-items: center; color: var(--systems-cyan); font-size: .9rem; font-weight: 750; text-decoration: none; white-space: nowrap; }
          .systems-door { scroll-margin-top: 2rem; display: grid; grid-template-columns: 1fr auto; gap: 1.5rem; align-items: center; margin-top: 1.2rem; padding: 1.35rem 1.5rem; border: 1px solid rgba(174, 194, 230, .16); border-radius: 16px; background: rgba(7, 12, 28, .72); }
          .systems-door h3 { margin: 0 0 .35rem; font-size: 1.12rem; }
          .systems-door p { max-width: 720px; margin: 0; color: var(--systems-muted); font-size: .91rem; line-height: 1.55; }
          .systems-release { display: inline-flex; gap: .5rem; align-items: center; margin-top: .7rem; color: #ffd18a; font-size: .75rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
          .systems-release-dot { width: 7px; height: 7px; border-radius: 50%; background: #ffbb64; box-shadow: 0 0 13px rgba(255, 187, 100, .55); }
          .systems-door-actions { display: flex; flex-direction: column; align-items: flex-end; gap: .55rem; }
          .systems-door-actions a { display: inline-flex; gap: .55rem; align-items: center; color: #e7edf9; font-size: .88rem; font-weight: 750; text-decoration: none; }
          .systems-door-actions a:hover { color: var(--systems-cyan); }
          .systems-door-actions small { color: #74809a; font-size: .73rem; text-align: right; }
          .systems-note { margin-top: 1.2rem; color: #75819b; font-size: .77rem; line-height: 1.6; }
          @media (max-width: 960px) {
            .systems-grid { grid-template-columns: 1fr 1fr; }
            .systems-card-featured { grid-column: 1 / -1; }
            .systems-summary { min-height: 0; }
          }
          @media (max-width: 640px) {
            .systems-page { padding-top: 3.2rem; }
            .systems-grid, .systems-strip { grid-template-columns: 1fr; }
            .systems-card-featured { grid-column: auto; }
            .systems-principle, .systems-door { grid-template-columns: 1fr; }
            .systems-principle-link { white-space: normal; }
            .systems-door-actions { align-items: flex-start; }
            .systems-door-actions small { text-align: left; }
          }
          @media (prefers-reduced-motion: reduce) {
            .systems-card-link { transition: none; }
            .systems-card-link:hover { transform: none; }
          }
        `}</style>
        <div className="systems-wrap">
          <header className="systems-hero">
            <div className="systems-kicker">GlyphLock venue systems</div>
            <h1>Three systems.<br /><span>One objective.</span></h1>
            <p>Help every part of the venue run with more clarity: a complete operating platform, focused agreement evidence, and a dedicated Windows door station.</p>
            <div className="systems-proofline"><ShieldCheck size={18} /> One venue mission. Three purpose-built ways to support it.</div>
          </header>

          <section className="systems-grid" aria-label="The three GlyphLock venue systems">
            {products.map((product) => <ProductCard product={product} key={product.id} />)}
          </section>

          <section className="systems-strip" aria-label="NUPS operating workspaces">
            <div className="systems-strip-item"><DoorOpen size={18} /> Front door & guest check-in</div>
            <div className="systems-strip-item"><Wine size={18} /> VIP sales & floor workflows</div>
            <div className="systems-strip-item"><WalletCards size={18} /> Register & shift records</div>
            <div className="systems-strip-item"><ClipboardCheck size={18} /> Owner oversight & closeout</div>
          </section>

          <section className="systems-principle">
            <div>
              <div className="systems-kicker">NUPS is the flagship</div>
              <h2>Start with the whole venue. Add focused tools where they fit.</h2>
              <p>NUPS brings the venue’s roles and day-to-day work into one platform. DCE and GlyphLock Door are distinct products with focused jobs; their access, records, and release paths remain product-specific.</p>
            </div>
            <a className="systems-principle-link" href="/NUPSLanding">See the full NUPS platform <ArrowDownRight size={17} /></a>
          </section>

          <section className="systems-door" id="glyphlock-door-download" aria-labelledby="door-release-heading">
            <div>
              <div className="systems-kicker">GlyphLock Door for Windows</div>
              <h3 id="door-release-heading">Paid desktop download</h3>
              <p>The release page is reserved for the signed Windows installer and its purchase flow. The installer and payment rail are not published yet; this section will become the download destination when the desktop release is complete.</p>
              <div className="systems-release"><span className="systems-release-dot" /> Release package and checkout in preparation</div>
            </div>
            <div className="systems-door-actions">
              <a href="#glyphlock-door-download" aria-label="GlyphLock Door paid Windows download release status">
                <Download size={17} /> Windows download
              </a>
              <small>Paid download opens after release</small>
            </div>
          </section>

          <p className="systems-note">NUPS, DCE, and GlyphLock Door are presented here as separate product destinations. Use each product’s own access and release instructions.</p>
        </div>
      </main>
    </>
  );
}
