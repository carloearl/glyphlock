import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Shield, Lock, CheckCircle, Clock, AlertCircle, Zap, Eye, Bot, Key } from "lucide-react";
import { motion, useInView } from "framer-motion";
import SEOHead from "@/components/SEOHead";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }
});

const slideLeft = (delay = 0) => ({
  initial: { opacity: 0, x: -60 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }
});

const slideRight = (delay = 0) => ({
  initial: { opacity: 0, x: 60 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }
});

const currentMeasures = [
  { title: "Security Foundation", icon: Shield, color: "blue", description: "Hosted security controls, transport encryption, access controls, logging, and ongoing hardening support the platform. Specific guarantees depend on the deployed service and configuration." },
  { title: "Creator IP Protection", icon: Key, color: "indigo", description: "Legal frameworks supporting independent authorship with cryptographic proof, timestamping, and Master Covenant governance. Patent status is not represented here pending verification of the applicable GlyphLock filing." },
  { title: "Audit-Ready Transparency", icon: Eye, color: "cyan", description: "Every action logged. Every change traceable. Minimal data collection with user consent. AI behavior and system operations recorded on tamper-resistant ledgers for long-term trust and accountability." },
  { title: "Human-Overseen AI Safety", icon: Bot, color: "purple", description: "AI operates inside accountable guardrails. Secure development lifecycle with mandatory human review. Machine intelligence paired with structural oversight to prevent runaway automation." }
];

const colorMap = {
  blue: { border: "border-blue-500/40", glow: "rgba(59,130,246,0.3)", icon: "text-blue-400", bg: "from-blue-500/10 to-blue-600/5" },
  indigo: { border: "border-indigo-500/40", glow: "rgba(99,102,241,0.3)", icon: "text-indigo-400", bg: "from-indigo-500/10 to-indigo-600/5" },
  cyan: { border: "border-cyan-500/40", glow: "rgba(6,182,212,0.3)", icon: "text-cyan-400", bg: "from-cyan-500/10 to-cyan-600/5" },
  purple: { border: "border-purple-500/40", glow: "rgba(168,85,247,0.3)", icon: "text-purple-400", bg: "from-purple-500/10 to-purple-600/5" }
};

const roadmap = [
  { phase: "Implemented — Security Foundation", period: "Current", status: "done", items: ["Authentication and role controls", "Transport encryption through hosted infrastructure", "Application logging and audit workflows", "Security and governance documentation", "Incident-response process documentation"] },
  { phase: "Active — Control Hardening", period: "2026", status: "current", items: ["Access-control review", "Dependency and configuration review", "Audit-log coverage expansion", "Backup and recovery validation", "Security documentation cleanup"] },
  { phase: "Active — Evidence Program", period: "2026", status: "current", items: ["Control inventory", "Evidence ownership", "Change-management records", "Vendor and integration documentation", "Remediation tracking"] },
  { phase: "Planned — Independent Assessment Readiness", period: "After evidence maturity", status: "planned", items: ["Select applicable assurance framework", "Engage qualified independent assessor if commercially justified", "Complete remediation before representing certification", "Publish attestation only after formal completion"] },
  { phase: "Planned — Advanced Security Posture", period: "Ongoing", status: "planned", items: ["Cryptography inventory and migration planning", "Expanded monitoring", "Threat-detection improvements", "Periodic penetration testing", "Continuous control review"] }
];

const controls = [
  { category: "Encryption", items: ["Transport encryption provided through hosted HTTPS/TLS infrastructure", "At-rest protection depends on the underlying managed service and data store", "Key-management and cryptography inventory remain part of the hardening roadmap"] },
  { category: "Access Control", items: ["Firebase Authentication", "Multi factor authentication", "Role based access control", "Session management"] },
  { category: "Monitoring & Testing", items: ["Security event logging", "Dependency vulnerability scanning", "Scheduled penetration testing", "Third party audits as applicable"] },
  { category: "Infrastructure", items: ["Cloud native architecture", "CDN and DDoS protection", "Backup and disaster recovery planning"] },
  { category: "Compliance Programs", items: ["Privacy policy and terms", "Data-processing documentation", "User-rights workflows", "Framework mapping performed where relevant", "Formal compliance or certification is not represented without supporting evidence"] }
];

const frameworks = [
  { title: "ISO/IEC 27001", status: "Reference", statusColor: "blue", desc: "Used as a reference point for information-security management concepts. GlyphLock does not represent ISO/IEC 27001 certification on this page.", specs: ["Risk Management", "Access Control", "Evidence Discipline"] },
  { title: "SOC 2", status: "Reference", statusColor: "blue", desc: "Trust Services Criteria may inform control design and evidence planning. GlyphLock does not represent a completed SOC 2 examination on this page.", specs: ["Security", "Availability", "Change Management"] },
  { title: "Privacy", status: "Program", statusColor: "amber", desc: "Privacy requirements are handled according to feature scope, user data, contracts, and applicable law. No blanket GDPR certification claim is made.", specs: ["Data Minimization", "Access Requests", "Retention Review"] },
  { title: "Payments", status: "Scoped", statusColor: "purple", desc: "Payment-card responsibilities depend on the payment flow and processor architecture. No PCI DSS certification level is represented here.", specs: ["Processor Scope", "Tokenized Flows", "No Unnecessary Card Storage"] }
];

const certs = [
  { name: "ISO/IEC 27001", subtitle: "REFERENCE FRAMEWORK", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/0dfb7aa86_1766061731969.jpg" },
  { name: "SOC 2", subtitle: "REFERENCE CRITERIA", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/ec8675dc5_1766064945798.jpg" },
  { name: "PRIVACY", subtitle: "SCOPE DEPENDENT", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/db009bbe8_1766062456894.jpg" },
  { name: "HEALTH DATA", subtitle: "SCOPE DEPENDENT", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/c848fdb95_1766062491421.jpg" },
  { name: "CRYPTOGRAPHY", subtitle: "HARDENING ROADMAP", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/717da1754_1766062231110.jpg" }
];

const statusBadge = {
  Reference: "bg-blue-500/10 border border-blue-500/30 text-blue-400",
  Program: "bg-amber-500/10 border border-amber-500/30 text-amber-400",
  Scoped: "bg-purple-500/10 border border-purple-500/30 text-purple-400"
};

export default function TrustSecurity() {
  return (
    <>
      <SEOHead
        title="GlyphLock Trust & Infrastructure | Controls & Boundaries"
        description="Review GlyphLock’s current access controls, evidence practices, audit records, infrastructure safeguards, framework references, limitations, and hardening roadmap."
        keywords="GlyphLock trust, infrastructure controls, access boundaries, evidence practices, audit records, security roadmap, framework references, product limitations"
        url="/trust-security"
      />

      <div className="min-h-screen text-white relative overflow-hidden" style={{ background: 'transparent' }}>
        {/* Ambient orbs — match site palette */}
        <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/12 rounded-full blur-[130px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[110px]" />
          <div className="absolute top-2/3 left-1/2 w-[300px] h-[300px] bg-purple-600/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 max-w-6xl py-24 md:py-32">

          {/* ── HERO ── */}
          <div className="text-center mb-16 md:mb-20">
            <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
                <Shield size={14} className="text-blue-400" />
              </motion.div>
              <span className="text-blue-300 text-sm font-semibold tracking-wide">Sovereign Infrastructure</span>
            </motion.div>

            <motion.h1 {...slideLeft(0.1)}
              className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white mb-5 drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]">
              Trust &amp;{" "}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">
                Infrastructure
              </span>
            </motion.h1>

            <motion.p {...slideRight(0.2)} className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Current controls, evidence practices, framework references, and the security-hardening roadmap
            </motion.p>
          </div>

          {/* ── FOUNDATION STATEMENT ── */}
          <motion.div {...fadeUp(0.1)} className="mb-12 rounded-2xl overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(99,102,241,0.04) 100%)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 40px rgba(59,130,246,0.12)' }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)' }} />
            <div className="p-8 md:p-12">
              <h2 className="text-2xl font-bold text-white mb-4">Infrastructure Foundation</h2>
              <p className="text-slate-300 leading-relaxed text-lg">
                GlyphLock is building security controls, evidence practices, and operational safeguards into the platform. The current goal is traceability, clear access boundaries, recoverability, and documented hardening. Formal certification is a separate future process and is not implied by this architecture.
              </p>
            </div>
          </motion.div>

          {/* ── COMPLIANCE BADGES ── */}
          <div className="mb-16">
            <motion.h2 {...fadeUp(0)} className="text-3xl font-bold text-white mb-8 text-center">
              Security Framework References
            </motion.h2>
            <motion.div {...fadeUp(0.1)} className="rounded-2xl overflow-hidden relative"
              style={{ background: 'linear-gradient(135deg, rgba(87,61,255,0.06) 0%, rgba(168,60,255,0.04) 100%)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 50px rgba(87,61,255,0.15)' }}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
              <div className="relative p-8 md:p-12">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center justify-center">
                  {certs.map((cert, idx) => (
                    <motion.div key={idx} {...fadeUp(idx * 0.08)} className="flex flex-col items-center gap-3 group cursor-default">
                      <motion.div whileHover={{ scale: 1.12 }} className="relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <img src={cert.image} alt={cert.name} className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]" loading="lazy" />
                      </motion.div>
                      <div className="text-center">
                        <p className="text-white font-bold text-sm group-hover:text-blue-300 transition-colors">{cert.name}</p>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{cert.subtitle}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-10 pt-8 border-t border-white/[0.07] text-center">
                  <p className="text-slate-400 max-w-3xl mx-auto leading-relaxed text-sm md:text-base">
                    These framework references describe design targets and evidence disciplines. They are not certification badges or third-party attestations. Formal certification will be represented only after the applicable independent process is completed and documented.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── ACTIVE PROTECTION MEASURES ── */}
          <div className="mb-16">
            <motion.h2 {...slideLeft(0)} className="text-3xl font-bold text-white mb-8">Active Protection Measures</motion.h2>
            <div className="grid md:grid-cols-2 gap-5">
              {currentMeasures.map((m, idx) => {
                const c = colorMap[m.color];
                const Icon = m.icon;
                return (
                  <motion.div key={idx} {...fadeUp(idx * 0.1)}
                    whileHover={{ y: -4, boxShadow: `0 0 40px ${c.glow}` }}
                    className={`rounded-xl p-6 relative overflow-hidden transition-all duration-300 ${c.border}`}
                    style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid`, backdropFilter: 'blur(16px)' }}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${c.bg} opacity-60`} />
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <Icon size={18} className={c.icon} />
                        </div>
                        <h3 className="text-base font-bold text-white">{m.title}</h3>
                        <span className="ml-auto flex items-center gap-1.5 text-xs text-green-400 font-semibold">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse" />
                          Active
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">{m.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ── ROADMAP ── */}
          <div className="mb-16">
            <motion.h2 {...slideRight(0)} className="text-3xl font-bold text-white mb-6">Security Hardening & Assurance Roadmap</motion.h2>

            <motion.div {...fadeUp(0.05)} className="rounded-xl p-5 mb-8 flex items-start gap-3"
              style={{ background: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.25)' }}>
              <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-orange-400 uppercase tracking-wide mb-1">Transparency Notice</p>
                <p className="text-sm text-slate-300 leading-relaxed">The milestones below describe internal hardening and evidence work. They do not imply that an independent audit, certification engagement, or regulatory validation is currently underway unless separately documented.</p>
              </div>
            </motion.div>

            {/* Timeline */}
            <div className="relative pl-8 space-y-4">
              {/* Vertical line */}
              <div className="absolute left-3.5 top-2 bottom-2 w-px" style={{ background: 'linear-gradient(to bottom, rgba(59,130,246,0.5), rgba(99,102,241,0.3), rgba(255,255,255,0.05))' }} />

              {roadmap.map((phase, idx) => {
                const isDone = phase.status === "done";
                const isCurrent = phase.status === "current";
                return (
                  <motion.div key={idx} {...fadeUp(idx * 0.08)} className="relative">
                    {/* Dot */}
                    <div className={`absolute -left-8 top-5 w-4 h-4 rounded-full flex items-center justify-center border-2 ${isDone ? 'border-green-400 bg-green-400/20' : isCurrent ? 'border-blue-400 bg-blue-400/20' : 'border-white/20 bg-white/5'}`}>
                      {isDone && <CheckCircle size={10} className="text-green-400" />}
                      {isCurrent && <motion.div className="w-2 h-2 bg-blue-400 rounded-full" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />}
                    </div>

                    <div className="rounded-xl p-5 transition-all duration-300 hover:border-blue-500/30"
                      style={{ background: isCurrent ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.025)', border: `1px solid ${isCurrent ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`, boxShadow: isCurrent ? '0 0 30px rgba(59,130,246,0.1)' : 'none' }}>
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 className="text-base font-bold text-white">{phase.phase}</h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDone ? 'bg-green-500/10 text-green-400' : isCurrent ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-slate-500'}`}>
                          {phase.period}
                        </span>
                      </div>
                      <ul className="grid sm:grid-cols-2 gap-1.5">
                        {phase.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                            <span className={`mt-1.5 w-1 h-1 rounded-full flex-shrink-0 ${isDone ? 'bg-green-400' : isCurrent ? 'bg-blue-400' : 'bg-slate-600'}`} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ── CONTROLS SUMMARY ── */}
          <div className="mb-16">
            <motion.h2 {...fadeUp(0)} className="text-3xl font-bold text-white mb-8">Infrastructure Controls Summary</motion.h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {controls.map((ctrl, idx) => (
                <motion.div key={idx} {...fadeUp(idx * 0.07)}
                  whileHover={{ y: -4, boxShadow: '0 0 30px rgba(59,130,246,0.15)' }}
                  className="rounded-xl p-5 transition-all duration-300"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
                  <h3 className="text-sm font-bold text-blue-300 uppercase tracking-widest mb-3">{ctrl.category}</h3>
                  <ul className="space-y-1.5">
                    {ctrl.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── COMPLIANCE FRAMEWORKS ── */}
          <div className="mb-16">
            <motion.h2 {...slideLeft(0)} className="text-3xl font-bold text-white mb-8">Compliance Frameworks</motion.h2>
            <div className="space-y-4">
              {frameworks.map((f, idx) => (
                <motion.div key={idx} {...fadeUp(idx * 0.08)}
                  whileHover={{ x: 4, boxShadow: '0 0 30px rgba(59,130,246,0.12)' }}
                  className="rounded-xl p-6 transition-all duration-300"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{f.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${statusBadge[f.status]}`}>{f.status}</span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {f.specs.map((spec, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg text-[11px] text-slate-300 font-medium"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── CONTACT CTA ── */}
          <motion.div {...fadeUp(0.1)} className="rounded-2xl overflow-hidden relative text-center"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(99,102,241,0.06) 100%)', border: '1px solid rgba(59,130,246,0.3)', boxShadow: '0 0 60px rgba(59,130,246,0.15)' }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.6), rgba(99,102,241,0.4), transparent)' }} />
            <div className="absolute inset-0 pointer-events-none">
              <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[100px]"
                style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15), transparent)' }}
                animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
            </div>
            <div className="relative z-10 p-8 md:p-14">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} className="inline-flex mb-6">
                <Lock className="w-12 h-12 text-blue-400" style={{ filter: 'drop-shadow(0 0 15px rgba(59,130,246,0.7))' }} />
              </motion.div>
              <h2 className="text-3xl font-black text-white mb-4">Infrastructure Inquiries</h2>
              <p className="text-slate-300 leading-relaxed mb-6 max-w-2xl mx-auto">
                For infrastructure questions, architecture reviews, control documentation, or evidence requests, contact the GlyphLock team. Any future third-party attestation will be identified by the assessor, scope, period, and supporting report when available.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-slate-400 mb-8">
                <span><strong className="text-white">Contact:</strong> carloearl@glyphlock.com</span>
                <span className="hidden sm:block text-white/20">·</span>
                <span><strong className="text-white">Entity:</strong> GlyphLock LLC</span>
                <span className="hidden sm:block text-white/20">·</span>
                <span><strong className="text-white">Status:</strong> IP filing details withheld pending verification</span>
              </div>
              <Link to={createPageUrl("Contact")}>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(59,130,246,0.5)' }}
                  whileTap={{ scale: 0.97 }}
                  className="relative overflow-hidden px-10 py-4 rounded-xl font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #1E40AF, #3B82F6)' }}>
                  <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }} />
                  <span className="relative flex items-center gap-2">
                    <Zap size={16} />
                    Contact Infrastructure Team
                  </span>
                </motion.button>
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </>
  );
}