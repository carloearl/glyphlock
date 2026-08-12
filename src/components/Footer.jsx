import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Twitter, Linkedin, Instagram, Github, Mail, Phone, MapPin, Shield, ExternalLink, LogIn } from "lucide-react";
import { FOOTER_LINKS } from "@/components/NavigationConfig";
import { filterUiArtifacts } from "@/lib/uiArtifactFilter";

const certifications = [
  { name: 'ISO 27001', subtitle: 'ARCHITECTURE', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/0dfb7aa86_1766061731969.jpg', page: 'TrustSecurity' },
  { name: 'SOC 2', subtitle: 'ALIGNED', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/ec8675dc5_1766064945798.jpg', page: 'TrustSecurity' },
  { name: 'GDPR', subtitle: 'ALIGNED', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/db009bbe8_1766062456894.jpg', page: 'Privacy' },
  { name: 'HIPAA', subtitle: 'READY', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/c848fdb95_1766062491421.jpg', page: 'TrustSecurity' },
  { name: 'PCI DSS', subtitle: 'COMPATIBLE', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/717da1754_1766062231110.jpg', page: 'TrustSecurity' }
];

const socials = [
  { href: "https://twitter.com/glyphlock", icon: Twitter, label: "Twitter" },
  { href: "https://linkedin.com/company/glyphlock", icon: Linkedin, label: "LinkedIn" },
  { href: "https://instagram.com/glyphlock", icon: Instagram, label: "Instagram" },
  { href: "https://github.com/glyphlock", icon: Github, label: "GitHub" },
];

const CLEAN_FOOTER_LINKS = Object.fromEntries(
  Object.entries(FOOTER_LINKS).map(([key, links]) => [key, filterUiArtifacts(links || [])])
);

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

        {/* ─── SIGN-IN CTA ─── */}
        <div className="mb-12 flex flex-col items-center gap-3 text-center">
          <p className="text-[11px] font-bold text-white/60 uppercase tracking-[0.25em]">Staff & Venue Access</p>
          <Link
            to={createPageUrl("NUPSLogin")}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-bold text-base text-white shadow-[0_0_30px_rgba(59,130,246,0.5)] active:scale-95 transition-all"
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #3B82F6 50%, #8B5CF6 100%)',
              minHeight: '52px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            aria-label="Sign in to NUPS"
          >
            <LogIn size={18} />
            Sign In to NUPS
          </Link>
        </div>

        {/* ─── TOP: Brand + Nav Grid ─── */}
        <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-8 lg:gap-10 mb-14">
          
          {/* Brand — spans 2 cols on md, 3 on lg */}
          <div className="col-span-2 md:col-span-6 lg:col-span-3 space-y-5">
            <div className="flex items-center gap-2.5">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/08025b614_gl-logo.png"
                alt="GlyphLock Security Platform Logo"
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
            <LinkGroup title="Company" links={CLEAN_FOOTER_LINKS.company} hoverColor="hover:text-blue-400" />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <LinkGroup title="Modules" links={CLEAN_FOOTER_LINKS.modules} hoverColor="hover:text-cyan-400" />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <LinkGroup title="Protocols" links={CLEAN_FOOTER_LINKS.protocols} hoverColor="hover:text-indigo-400" />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <LinkGroup title="Financial" links={CLEAN_FOOTER_LINKS.financial} hoverColor="hover:text-amber-400" />
              <div>
                <LinkGroup title="Resources" links={CLEAN_FOOTER_LINKS.resources} hoverColor="hover:text-purple-400" />
                <div className="mt-6">
                  <LinkGroup title="Account" links={CLEAN_FOOTER_LINKS.account} hoverColor="hover:text-blue-400" />
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
                  alt={`${cert.name} ${cert.subtitle} certification badge`}
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
          <a href="mailto:support@glyphlock.io" className="flex items-center gap-2 hover:text-blue-400 transition-colors" aria-label="Email GlyphLock support">
            <Mail size={14} /> support@glyphlock.io
          </a>
          <span className="hidden sm:block text-white/10">|</span>
          <a href="tel:+14808865588" className="flex items-center gap-2 hover:text-blue-400 transition-colors" aria-label="Call GlyphLock support">
            <Phone size={14} /> (480) 886-5588
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

        {/* ─── AUTHORITY BRAND BLOCK ─── */}
        <div className="border-t border-white/[0.06] pt-8 pb-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/08025b614_gl-logo.png"
                alt="GlyphLock Security Platform Logo"
                className="w-full h-full object-contain"
                loading="lazy"
                decoding="async"
                width={64}
                height={64}
                style={{ filter: 'drop-shadow(0 0 12px rgba(59,130,246,0.4))' }}
              />
            </div>
            <div className="text-center space-y-1.5">
              <p className="text-sm font-black text-white uppercase tracking-[0.25em]">GlyphLock LLC</p>
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
            © {new Date().getFullYear()} GlyphLock LLC. All rights reserved.
          </p>
          <div className="flex items-center gap-5 flex-wrap justify-center">
            {CLEAN_FOOTER_LINKS.legal && CLEAN_FOOTER_LINKS.legal.map((link) => (
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