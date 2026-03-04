import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Twitter, Linkedin, Instagram, Github, Mail, Phone, MapPin, Shield, ExternalLink } from "lucide-react";
import { FOOTER_LINKS } from "@/components/NavigationConfig";

const certifications = [
  { name: "ISO 27001", subtitle: "ALIGNED", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/0dfb7aa86_1766061731969.jpg", page: "TrustSecurity" },
  { name: "SOC 2", subtitle: "ALIGNED", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/ec8675dc5_1766064945798.jpg", page: "TrustSecurity" },
  { name: "GDPR", subtitle: "ALIGNED", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/db009bbe8_1766062456894.jpg", page: "Privacy" },
  { name: "HIPAA", subtitle: "ALIGNED", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/c848fdb95_1766062491421.jpg", page: "TrustSecurity" },
  { name: "Post-Quantum", subtitle: "DESIGNED FOR", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/717da1754_1766062231110.jpg", page: "TrustSecurity" }
];

const socials = [
  { href: "https://twitter.com/glyphlock", icon: Twitter, label: "Twitter" },
  { href: "https://linkedin.com/company/glyphlock", icon: Linkedin, label: "LinkedIn" },
  { href: "https://instagram.com/glyphlock", icon: Instagram, label: "Instagram" },
  { href: "https://github.com/glyphlock", icon: Github, label: "GitHub" },
];

const LinkGroup = ({ title, links, hoverColor = "hover:text-blue-400" }) => (
  <div>
    <h4 className="text-[11px] font-bold text-white/60 uppercase tracking-[0.2em] mb-4">{title}</h4>
    <ul className="space-y-2.5">
      {links && links.map((link) => (
        <li key={link.page}>
          <Link 
            to={createPageUrl(link.page)} 
            className={`text-[13px] text-slate-400 ${hoverColor} transition-colors duration-200 leading-tight block`}
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export default function Footer() {
  return (
    <footer className="w-full relative overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(15,15,35,0.95) 8%, rgba(10,10,30,1) 100%)' }}>
      {/* Subtle top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.4), rgba(139,92,246,0.3), transparent)' }} />

      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-12 pt-16 md:pt-20 pb-8">
        
        {/* ─── TOP: Brand + Nav Grid ─── */}
        <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-8 lg:gap-10 mb-14">
          
          {/* Brand — spans 2 cols on md, 3 on lg */}
          <div className="col-span-2 md:col-span-6 lg:col-span-3 space-y-5">
            <div className="flex items-center gap-2.5">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/08025b614_gl-logo.png"
                alt="GlyphLock"
                className="h-9 w-auto"
                loading="lazy"
                decoding="async"
                width={36}
                height={36}
              />
              <span className="text-xl font-black tracking-tight text-white">
                GLYPH<span style={{ color: '#3B82F6' }}>LOCK</span>
              </span>
            </div>
            <p className="text-[13px] text-slate-400 leading-relaxed max-w-xs">
              Quantum-resistant encryption, AI-powered threat detection, and the Master Covenant governance framework.
            </p>
            
            {/* Social icons */}
            <div className="flex items-center gap-2.5 pt-1">
              {socials.map((s) => (
                <a 
                  key={s.label}
                  href={s.href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label={s.label}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-white transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <s.icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Nav Columns — each takes 1 col on mobile (2-col grid), auto on larger */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <LinkGroup title="Company" links={FOOTER_LINKS.company} hoverColor="hover:text-blue-400" />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <LinkGroup title="Modules" links={FOOTER_LINKS.modules} hoverColor="hover:text-cyan-400" />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <LinkGroup title="Protocols" links={FOOTER_LINKS.protocols} hoverColor="hover:text-indigo-400" />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <LinkGroup title="Financial" links={FOOTER_LINKS.financial} hoverColor="hover:text-amber-400" />
              <div>
                <LinkGroup title="Resources" links={FOOTER_LINKS.resources} hoverColor="hover:text-purple-400" />
                <div className="mt-6">
                  <LinkGroup title="Account" links={FOOTER_LINKS.account} hoverColor="hover:text-blue-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── COMPLIANCE BADGES ─── */}
        <div className="py-8 border-t border-white/[0.06]">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {certifications.map((cert) => (
              <Link 
                key={cert.name} 
                to={createPageUrl(cert.page)}
                className="group flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <img 
                  src={cert.image} 
                  alt={cert.name} 
                  className="w-8 h-8 md:w-10 md:h-10 object-contain opacity-80 group-hover:opacity-100 transition-opacity" 
                  loading="lazy" 
                  decoding="async" 
                  width={40} 
                  height={40} 
                />
                <div>
                  <p className="text-[11px] font-semibold text-white/80 group-hover:text-white transition-colors leading-tight">{cert.name}</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">{cert.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ─── CONTACT BAR ─── */}
        <div className="py-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-center gap-6 text-[13px] text-slate-500">
          <a href="mailto:support@glyphlock.io" className="flex items-center gap-2 hover:text-blue-400 transition-colors">
            <Mail size={14} /> support@glyphlock.io
          </a>
          <span className="hidden sm:block text-white/10">|</span>
          <a href="tel:+14242466499" className="flex items-center gap-2 hover:text-blue-400 transition-colors">
            <Phone size={14} /> (424) 246-6499
          </a>
          <span className="hidden sm:block text-white/10">|</span>
          <span className="flex items-center gap-2">
            <MapPin size={14} /> El Mirage, AZ · United States
          </span>
        </div>

        {/* ─── SEO COLLAPSIBLES (crawler-only, minimal UI) ─── */}
        <div className="border-t border-white/[0.06] pt-6 space-y-3">
          <details className="group">
            <summary className="cursor-pointer text-center text-[10px] text-slate-600 tracking-wide hover:text-slate-400 transition-colors list-none select-none">
              <span className="inline-flex items-center gap-1.5">
                SEO Metadata
                <svg className="w-3 h-3 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </span>
            </summary>
            <div className="mt-3 p-4 rounded-lg text-[10px] text-slate-500 leading-relaxed space-y-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p>quantum-resistant encryption, post-quantum cryptography, AI cybersecurity, enterprise security platform, visual cryptography, secure QR codes, blockchain security, AI governance framework, Master Covenant, GlyphLock Security, threat detection AI, zero-trust architecture, identity verification, fraud prevention, steganography tools, secure QR code generator, image encryption, NIST post-quantum standards, AI binding protocol, security operations center, SOC 2 aligned, ISO 27001 aligned, GDPR aligned, HIPAA aligned</p>
            </div>
          </details>
          <details className="group">
            <summary className="cursor-pointer text-center text-[10px] text-slate-600 tracking-wide hover:text-slate-400 transition-colors list-none select-none">
              <span className="inline-flex items-center gap-1.5">
                Crawler Discovery
                <svg className="w-3 h-3 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </span>
            </summary>
            <nav aria-label="Sitemap Discovery" className="mt-3 p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[10px]">
                <a href="https://app.base44.com/api/apps/U5jDzdts3bd4p19I5hID/sitemap" target="_blank" rel="noopener" className="text-slate-500 hover:text-blue-400 underline">sitemap.xml</a>
                <a href="https://app.base44.com/api/apps/U5jDzdts3bd4p19I5hID/robotsTxt" target="_blank" rel="noopener" className="text-slate-500 hover:text-blue-400 underline">robots.txt</a>
                <a href="https://app.base44.com/api/apps/U5jDzdts3bd4p19I5hID/llmsTxt" target="_blank" rel="noopener" className="text-slate-500 hover:text-blue-400 underline">llms.txt</a>
                <a href="https://app.base44.com/api/apps/U5jDzdts3bd4p19I5hID/aiTxtEnhanced" target="_blank" rel="noopener" className="text-slate-500 hover:text-blue-400 underline">ai.txt</a>
                <a href="https://app.base44.com/api/apps/U5jDzdts3bd4p19I5hID/glyphlockKnowledge" target="_blank" rel="noopener" className="text-slate-500 hover:text-blue-400 underline">knowledge.json</a>
                <Link to={createPageUrl('Sitemap')} className="text-slate-500 hover:text-blue-400 underline">HTML Sitemap</Link>
              </div>
            </nav>
          </details>
        </div>

        {/* ─── PLATFORM CAPABILITIES ─── */}
        <div className="border-t border-white/[0.06] mt-6 pt-10 pb-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Authority Header */}
            <div className="text-center space-y-2">
              <h3 className="text-xs font-bold text-white/50 uppercase tracking-[0.3em]">Platform Capabilities</h3>
              <div className="w-16 h-px mx-auto" style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)' }} />
            </div>

            {/* Capability Paragraphs */}
            <div className="space-y-4 text-[12px] text-slate-500 leading-[1.8] text-center">
              <p>
                GlyphLock Security LLC delivers a unified cybersecurity platform spanning <strong className="text-slate-400">quantum-resistant encryption</strong>, <strong className="text-slate-400">AI-powered threat detection</strong>, and <strong className="text-slate-400">visual cryptography</strong> — architected for enterprises operating in zero-trust, high-scrutiny environments. Post-quantum cryptographic primitives align with NIST PQC standards to future-proof every layer of the stack.
              </p>
              <p>
                The <strong className="text-slate-400">QR Verification Studio</strong> generates tamper-proof QR codes with blockchain-anchored provenance chains, AI risk scoring, and steganographic payloads. The <strong className="text-slate-400">Image Lab</strong> provides AI image generation, interactive hotspot editing, and multimodal analysis — all secured with SHA-256 hash verification and immutable audit trails.
              </p>
              <p>
                <strong className="text-slate-400">GlyphBot Intelligence</strong> is a multi-provider AI assistant offering real-time site auditing, security scanning, code analysis, and natural-language threat assessment — powered by a provider chain architecture that routes across LLM backends for optimal accuracy and uptime.
              </p>
              <p>
                The <strong className="text-slate-400">N.U.P.S. Point-of-Sale</strong> system provides venue-grade transaction processing with RBAC staff management, entertainer scheduling, VIP guest tracking, Z-report generation, and the <strong className="text-slate-400">Club Currency Press</strong> for custom voucher and <strong className="text-slate-400">Glyph Buck™</strong> issuance with digital contract signing and biometric verification.
              </p>
              <p>
                <strong className="text-slate-400">GlyphLock Financial</strong> delivers underwriting dossier generation, deterministic risk profiling, and qualification assessment frameworks designed for institutional-grade compliance review. The <strong className="text-slate-400">Blockchain Verification</strong> module creates timestamped cryptographic proofs exportable as legal evidence.
              </p>
              <p>
                The <strong className="text-slate-400">Master Covenant</strong> framework establishes the first structured AI governance architecture — defining binding accountability, enforcement protocols, and compliance alignment across multi-provider LLM deployments. The <strong className="text-slate-400">Security Operations Center</strong> provides continuous monitoring, alert thresholds, and live threat intelligence across all operational surfaces.
              </p>
              <p>
                Additional modules include the <strong className="text-slate-400">DJ Pro Mixer</strong> for AI-powered music mixing, the <strong className="text-slate-400">Media Processing Hub</strong> for video and asset management, <strong className="text-slate-400">SDK Documentation</strong> for developer integration, the <strong className="text-slate-400">Dream Team AI</strong> multi-model orchestration system, and the <strong className="text-slate-400">Site Intelligence Engine</strong> for automated codebase auditing and remediation.
              </p>
            </div>

            {/* Compliance Disclosure */}
            <p className="text-[10px] text-slate-600 text-center max-w-2xl mx-auto leading-relaxed">
              GlyphLock Security is structured to support alignment with SOC 2, ISO 27001, PCI DSS, GDPR, and HIPAA frameworks. These designations reflect architectural alignment and do not constitute formal certification unless explicitly stated in a written agreement.
            </p>
          </div>
        </div>

        {/* ─── AUTHORITY BRAND BLOCK ─── */}
        <div className="border-t border-white/[0.06] pt-8 pb-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/08025b614_gl-logo.png"
                alt="GlyphLock"
                className="w-full h-full object-contain"
                loading="lazy"
                decoding="async"
                width={64}
                height={64}
                style={{ filter: 'drop-shadow(0 0 12px rgba(59,130,246,0.4))' }}
              />
            </div>
            <div className="text-center space-y-1.5">
              <p className="text-sm font-black text-white uppercase tracking-[0.25em]">GlyphLock Security LLC</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">Post-Quantum Cybersecurity Architecture</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">AI Governance · Zero-Trust · Enterprise Defense</p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-blue-400/60 font-bold uppercase tracking-[0.15em]">AI Governance</span>
              <span className="text-white/10">·</span>
              <span className="text-[10px] text-indigo-400/60 font-bold uppercase tracking-[0.15em]">Zero-Trust</span>
              <span className="text-white/10">·</span>
              <span className="text-[10px] text-purple-400/60 font-bold uppercase tracking-[0.15em]">Post-Quantum</span>
            </div>
          </div>
        </div>

        {/* ─── BOTTOM BAR ─── */}
        <div className="border-t border-white/[0.06] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-600 text-center md:text-left">
            © {new Date().getFullYear()} GlyphLock Security LLC. All rights reserved.
          </p>
          <div className="flex items-center gap-5 flex-wrap justify-center">
            {FOOTER_LINKS.legal && FOOTER_LINKS.legal.map((link) => (
              <Link 
                key={link.page} 
                to={createPageUrl(link.page)} 
                className="text-[11px] text-slate-600 hover:text-slate-300 transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}