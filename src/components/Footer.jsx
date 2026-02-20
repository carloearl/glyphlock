import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Twitter, Linkedin, Instagram, Github, Mail, Phone } from "lucide-react";
import { FOOTER_LINKS } from "@/components/NavigationConfig";
/**
 * PHASE 3B FOOTER - FULLY CORRECTED
 * All links point to glyphlock.io routes ONLY
 * NO base44.app references
 */

const certifications = [
  { name: "ISO 27001", subtitle: "ALIGNED", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/0dfb7aa86_1766061731969.jpg", page: "TrustSecurity" },
  { name: "SOC 2", subtitle: "ALIGNED", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/ec8675dc5_1766064945798.jpg", page: "TrustSecurity" },
  { name: "GDPR", subtitle: "ALIGNED", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/db009bbe8_1766062456894.jpg", page: "Privacy" },
  { name: "HIPAA", subtitle: "ALIGNED", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/c848fdb95_1766062491421.jpg", page: "TrustSecurity" },
  { name: "Post-Quantum", subtitle: "DESIGNED FOR", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/717da1754_1766062231110.jpg", page: "TrustSecurity" }
];

export default function Footer() {
  return (
    <footer className="w-full bg-gradient-to-br from-indigo-950/20 via-violet-950/10 to-blue-950/20 border-t border-white/10 text-violet-200 pt-16 md:pt-24 pb-8 md:pb-12 relative overflow-x-hidden backdrop-blur-2xl">
    {/* Decorative Glows */}
    <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-[120px] pointer-events-none"></div>
    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/15 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-14 gap-6 md:gap-8 lg:gap-10 mb-12 md:mb-20">
          {/* Brand Column */}
          <div className="md:col-span-2 lg:col-span-3 space-y-6">
            <div className="flex items-center gap-3">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/08025b614_gl-logo.png"
                alt="GlyphLock"
                className="h-10 w-auto"
                loading="lazy"
                decoding="async"
                width={40}
                height={40}
              />
              <span className="text-2xl font-black tracking-tighter font-space text-white">
                GLYPH<span className="text-[#00E4FF]">LOCK</span>
              </span>
            </div>
            <div className="space-y-4 max-w-md">
              <p className="text-white text-lg font-black leading-tight">
                POST-QUANTUM CYBERSECURITY ARCHITECTURE
              </p>
              <p className="text-slate-300 leading-relaxed text-sm">
                Enterprise-grade quantum-resistant encryption, AI-powered threat detection, visual cryptography, and the Master Covenant AI governance framework.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-indigo-300 text-xs font-bold uppercase tracking-wider">AI GOVERNANCE</span>
                <span className="text-violet-400">•</span>
                <span className="text-indigo-300 text-xs font-bold uppercase tracking-wider">ZERO-TRUST</span>
                <span className="text-violet-400">•</span>
                <span className="text-indigo-300 text-xs font-bold uppercase tracking-wider">POST-QUANTUM</span>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-4">
              <a href="https://twitter.com/glyphlock" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/8 flex items-center justify-center text-indigo-300 hover:bg-violet-500 hover:text-white hover:shadow-[0_0_15px_rgba(168,60,255,0.6)] transition-all duration-300">
                <Twitter size={18} />
              </a>
              <a href="https://linkedin.com/company/glyphlock" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/8 flex items-center justify-center text-indigo-300 hover:bg-violet-500 hover:text-white hover:shadow-[0_0_15px_rgba(168,60,255,0.6)] transition-all duration-300">
                <Linkedin size={18} />
              </a>
              <a href="https://instagram.com/glyphlock" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/8 flex items-center justify-center text-indigo-300 hover:bg-violet-500 hover:text-white hover:shadow-[0_0_15px_rgba(168,60,255,0.6)] transition-all duration-300">
                <Instagram size={18} />
              </a>
              <a href="https://github.com/glyphlock" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/8 flex items-center justify-center text-indigo-300 hover:bg-violet-500 hover:text-white hover:shadow-[0_0_15px_rgba(168,60,255,0.6)] transition-all duration-300">
                <Github size={18} />
              </a>
            </div>
          </div>

          {/* Company Column */}
          <div className="md:col-span-1 lg:col-span-2">
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Company</h4>
            <div className="flex flex-col gap-4">
              {FOOTER_LINKS.company && FOOTER_LINKS.company.map((link) => (
                <Link key={link.page} to={createPageUrl(link.page)} className="text-slate-300 font-medium hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] transition-all duration-300">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Modules Column */}
          <div className="md:col-span-1 lg:col-span-2">
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Modules</h4>
            <div className="flex flex-col gap-4">
              {FOOTER_LINKS.modules && FOOTER_LINKS.modules.map((link) => (
                <Link key={link.page} to={createPageUrl(link.page)} className="text-slate-300 font-medium hover:text-blue-400 hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all duration-300">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Financial Column */}
          <div className="md:col-span-1 lg:col-span-2">
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Financial</h4>
            <div className="flex flex-col gap-4">
              {FOOTER_LINKS.financial && FOOTER_LINKS.financial.map((link) => (
                <Link key={link.page} to={createPageUrl(link.page)} className="text-slate-300 font-medium hover:text-amber-400 hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] transition-all duration-300">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Protocols Column */}
          <div className="md:col-span-1 lg:col-span-2">
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Protocols</h4>
            <div className="flex flex-col gap-4">
              {FOOTER_LINKS.protocols && FOOTER_LINKS.protocols.map((link) => (
                <Link key={link.page} to={createPageUrl(link.page)} className="text-slate-300 font-medium hover:text-indigo-400 hover:drop-shadow-[0_0_8px_rgba(129,140,248,0.8)] transition-all duration-300">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Resources Column */}
          <div className="md:col-span-1 lg:col-span-2">
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Resources</h4>
            <div className="flex flex-col gap-4">
              {FOOTER_LINKS.resources && FOOTER_LINKS.resources.map((link) => (
                <Link key={link.page} to={createPageUrl(link.page)} className="text-slate-300 font-medium hover:text-purple-400 hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-all duration-300">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Account Column */}
          <div className="md:col-span-1 lg:col-span-2">
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Account</h4>
            <div className="flex flex-col gap-4">
              {FOOTER_LINKS.account && FOOTER_LINKS.account.map((link) => (
                <Link key={link.page} to={createPageUrl(link.page)} className="text-slate-300 font-medium hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] transition-all duration-300">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Contact Column */}
          <div className="md:col-span-1 lg:col-span-2">
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Contact</h4>
            <div className="flex flex-col gap-4">
              <a href="mailto:support@glyphlock.io" className="flex items-center gap-2 text-slate-300 font-medium hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] transition-all duration-300">
                <Mail size={16} /> support@glyphlock.io
              </a>
              <a href="tel:+14242466499" className="flex items-center gap-2 text-slate-300 font-medium hover:text-blue-400 hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all duration-300">
                <Phone size={16} /> (424) 246-6499
              </a>
              <p className="text-sm text-slate-300 pt-2">
                El Mirage, Arizona<br/>United States
              </p>
            </div>
          </div>
        </div>

        {/* SEO Keywords & Meta Tags Section - Crawler Optimized */}
        <div className="border-t border-white/10 pt-8 mb-12">
          <details className="group">
            <summary className="cursor-pointer text-center text-xs text-slate-400 tracking-wide mb-3 hover:text-cyan-400 transition-colors list-none">
              <span className="inline-flex items-center gap-2">
                🏷️ Keywords & SEO Metadata
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </span>
            </summary>
            <div className="mt-4 p-6 bg-slate-900/50 rounded-xl border border-slate-800 space-y-6">
              {/* Primary Keywords */}
              <div>
                <h5 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">Primary Keywords</h5>
                <p className="text-xs text-slate-300 leading-relaxed">
                  quantum-resistant encryption, post-quantum cryptography, AI cybersecurity, enterprise security platform, 
                  visual cryptography, secure QR codes, blockchain security, AI governance framework, Master Covenant, 
                  GlyphLock Security, threat detection AI, zero-trust architecture, identity verification, fraud prevention
                </p>
              </div>
              
              {/* Secondary Keywords */}
              <div>
                <h5 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">Secondary Keywords</h5>
                <p className="text-xs text-slate-300 leading-relaxed">
                  steganography tools, secure QR code generator, image encryption, NIST post-quantum standards, 
                  AI binding protocol, security operations center, 
                  SOC 2 aligned, ISO 27001 aligned, GDPR aligned, HIPAA aligned, PCI DSS aligned
                </p>
              </div>

              {/* Long-tail Keywords */}
              <div>
                <h5 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">Long-tail Keywords</h5>
                <p className="text-xs text-slate-300 leading-relaxed">
                  quantum-immune security for enterprises, AI-powered threat detection platform, 
                  visual authentication that can't be forged, autonomous defense engine for cybersecurity,
                  first legal framework for AI accountability, legally binding AI governance,
                  secure QR code generation with blockchain verification, enterprise-grade steganography tools,
                  real-time security monitoring dashboard, multi-provider LLM security assistant
                </p>
              </div>

              {/* Meta Description */}
              <div>
                <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">Meta Description</h5>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "GlyphLock Security LLC delivers enterprise-grade quantum-resistant cybersecurity architecture, 
                  combining post-quantum encryption, AI-powered threat detection, visual cryptography, secure QR infrastructure, 
                  and the Master Covenant governance framework. Built for high-security environments and structured compliance readiness."
                </p>
              </div>

              {/* Schema.org Types */}
              <div>
                <h5 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-3">Schema.org Structured Data</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <span className="text-slate-300">Organization</span>
                  <span className="text-slate-300">SoftwareApplication</span>
                  <span className="text-slate-300">WebApplication</span>
                  <span className="text-slate-300">SecurityService</span>
                  <span className="text-slate-300">CreativeWork</span>
                  <span className="text-slate-300">Article</span>
                  <span className="text-slate-300">FAQPage</span>
                  <span className="text-slate-300">HowTo</span>
                </div>
              </div>

              {/* Open Graph Tags */}
              <div>
                <h5 className="text-xs font-bold text-pink-400 uppercase tracking-wider mb-3">Open Graph & Social</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                  <span>og:type: website</span>
                  <span>og:site_name: GlyphLock Security</span>
                  <span>twitter:card: summary_large_image</span>
                  <span>twitter:site: @glyphlock</span>
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* Crawler Discovery Section - Static HTML for SEO */}
        <div className="border-t border-white/10 pt-8 mb-12">
          <details className="group">
            <summary className="cursor-pointer text-center text-xs text-slate-400 tracking-wide mb-3 hover:text-cyan-400 transition-colors list-none">
              <span className="inline-flex items-center gap-2">
                🔍 Sitemap & Crawler Discovery
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </span>
            </summary>
            <nav aria-label="Sitemap Discovery" className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-300 mb-4 text-center">Machine-readable discovery endpoints for search engines and AI crawlers</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <a href="https://app.base44.com/api/apps/U5jDzdts3bd4p19I5hID/sitemap" target="_blank" rel="noopener" className="text-cyan-400 hover:text-cyan-300 underline">sitemap.xml</a>
                <a href="https://app.base44.com/api/apps/U5jDzdts3bd4p19I5hID/robotsTxt" target="_blank" rel="noopener" className="text-cyan-400 hover:text-cyan-300 underline">robots.txt</a>
                <a href="https://app.base44.com/api/apps/U5jDzdts3bd4p19I5hID/llmsTxt" target="_blank" rel="noopener" className="text-cyan-400 hover:text-cyan-300 underline">llms.txt</a>
                <a href="https://app.base44.com/api/apps/U5jDzdts3bd4p19I5hID/aiTxtEnhanced" target="_blank" rel="noopener" className="text-cyan-400 hover:text-cyan-300 underline">ai.txt</a>
                <a href="https://app.base44.com/api/apps/U5jDzdts3bd4p19I5hID/glyphlockKnowledge" target="_blank" rel="noopener" className="text-cyan-400 hover:text-cyan-300 underline">knowledge.json</a>
                <Link to={createPageUrl('Sitemap')} className="text-cyan-400 hover:text-cyan-300 underline">HTML Sitemap</Link>
                <Link to={createPageUrl('CaseStudies')} className="text-cyan-400 hover:text-cyan-300 underline">Case Studies</Link>
                <Link to={createPageUrl('MasterCovenant')} className="text-cyan-400 hover:text-cyan-300 underline">Master Covenant</Link>
              </div>
            </nav>
          </details>
        </div>

        {/* Compliance Badges - Clickable */}
        <div className="border-t border-white/10 pt-8 mb-12">
          <p className="text-center text-xs text-slate-300 tracking-wide mb-6">
            Compliance Alignment & Standards
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mb-6">
            {certifications.map((cert) => (
              <Link 
                key={cert.name} 
                to={createPageUrl(cert.page)}
                className="group flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all duration-300"
              >
                <div className="w-14 h-14 md:w-20 md:h-20 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-300">
                  <img src={cert.image} alt={cert.name} className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]" loading="lazy" decoding="async" width={80} height={80} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">{cert.name}</p>
                  <p className="text-[10px] text-slate-400">{cert.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
          <p className="text-center text-xs text-slate-300 max-w-3xl mx-auto leading-relaxed">
            GlyphLock Security is structured to support alignment with widely recognized industry frameworks, including SOC 2, ISO 27001, PCI DSS, GDPR, and HIPAA. These designations reflect architectural alignment and do not constitute formal certification unless explicitly stated in a written agreement.
          </p>
        </div>

        {/* Enterprise Security Capabilities — SEO Long-tail Section */}
        <div className="border-t border-white/10 pt-8 mb-10">
          <h3 className="text-xs font-bold text-white/90 uppercase tracking-[3px] text-center mb-4">Enterprise Security Capabilities</h3>
          <div className="max-w-3xl mx-auto space-y-3 text-xs text-slate-300 leading-relaxed text-center">
            <p>
              GlyphLock Security delivers quantum-resistant security architecture designed for enterprises operating in high-scrutiny environments. The platform combines an AI-powered threat detection engine with post-quantum cryptographic primitives aligned with NIST post-quantum standards, providing structured cybersecurity defense across distributed infrastructure.
            </p>
            <p>
              Visual authentication mechanisms built on enterprise-grade steganography tools ensure that identity artifacts cannot be forged or replicated. Secure QR generation with blockchain verification anchors every asset to an immutable provenance chain. A real-time security monitoring dashboard provides continuous visibility across all operational surfaces.
            </p>
            <p>
              The Master Covenant framework establishes a structured AI governance architecture — defining accountability, enforcement protocols, and compliance alignment across multi-provider LLM security assistant deployments. Designed for structured compliance alignment, zero-trust environments, and post-quantum resilience.
            </p>
          </div>
        </div>

        {/* Authority Line */}
        <div className="border-t border-white/10 pt-6 mb-8 text-center space-y-1">
          <p className="text-xs font-bold text-white uppercase tracking-[3px]">GlyphLock Security LLC</p>
          <p className="text-[10px] text-slate-300 uppercase tracking-[2px]">Post-Quantum Cybersecurity Architecture</p>
          <p className="text-[10px] text-slate-300 uppercase tracking-[2px]">AI Governance Framework</p>
          <p className="text-[10px] text-slate-300 uppercase tracking-[2px]">Enterprise Security Platform</p>
          <p className="text-[10px] text-slate-300 mt-2 max-w-xl mx-auto">
            Designed for structured compliance alignment, zero-trust environments, and post-quantum resilience.
          </p>
        </div>

        {/* Bottom Bar - Legal Links */}
        <div className="border-t border-white/10 pt-6 md:pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs md:text-sm">
          <p className="text-slate-300 font-medium text-center md:text-left">© {new Date().getFullYear()} GlyphLock Security LLC. All rights reserved.</p>
          <div className="flex items-center gap-4 md:gap-8 flex-wrap justify-center">
            {FOOTER_LINKS.legal && FOOTER_LINKS.legal.map((link) => (
            <Link key={link.page} to={createPageUrl(link.page)} className="text-slate-300 font-medium hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] transition-all duration-300">
              {link.label}
            </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}