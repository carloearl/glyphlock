import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Shield, QrCode, Image, Bot, Building2, DollarSign,
  Link2, FileText, Eye, Cpu, ArrowRight
} from 'lucide-react';
import { createPageUrl } from '@/utils';

const modules = [
  {
    title: 'QR & Scanning',
    desc: 'Generate, brand, and track QR codes — with scan logging and signed payloads when a build calls for it.',
    icon: QrCode,
    color: '#06b6d4',
    border: 'rgba(6,182,212,0.35)',
    glow: 'rgba(6,182,212,0.5)',
    link: 'Qr'
  },
  {
    title: 'Image Lab',
    desc: 'AI image generation, interactive hotspot editing, and visual analysis you can drop into a product.',
    icon: Image,
    color: '#a855f7',
    border: 'rgba(168,85,247,0.35)',
    glow: 'rgba(168,85,247,0.5)',
    link: 'ImageLab'
  },
  {
    title: 'GlyphBot Assistants',
    desc: 'Multi-provider AI assistants we embed into apps for support, review, and natural-language workflows.',
    icon: Bot,
    color: '#4f46e5',
    border: 'rgba(79,70,229,0.35)',
    glow: 'rgba(79,70,229,0.5)',
    link: 'GlyphBot'
  },
  {
    title: 'Accounting & Payouts',
    desc: 'Ledgers, settlements, payout runs, and exports that turn day-to-day operations into clean books.',
    icon: DollarSign,
    color: '#10b981',
    border: 'rgba(16,185,129,0.35)',
    glow: 'rgba(16,185,129,0.5)',
    link: 'GlyphLockFinancial'
  },
  {
    title: 'Receipts & Records',
    desc: 'Timestamped, exportable records for transactions and documents — so nothing gets disputed later.',
    icon: Link2,
    color: '#f59e0b',
    border: 'rgba(245,158,11,0.35)',
    glow: 'rgba(245,158,11,0.5)',
    link: 'Blockchain'
  },
  {
    title: 'How We Work',
    desc: 'Our published standard for how we scope, build, document, and hand off every engagement.',
    icon: FileText,
    color: '#7c3aed',
    border: 'rgba(124,58,237,0.35)',
    glow: 'rgba(124,58,237,0.5)',
    link: 'MasterCovenant'
  },
  {
    title: 'Access & Monitoring',
    desc: 'Logins, roles, permissions, activity logs, and alerting — the plumbing every serious build needs.',
    icon: Eye,
    color: '#ef4444',
    border: 'rgba(239,68,68,0.35)',
    glow: 'rgba(239,68,68,0.5)',
    link: 'SecurityOperationsCenter'
  },
];

function ModuleCard({ mod, index, isInView }) {
  const [hovered, setHovered] = useState(false);
  const Icon = mod.icon;
  const fromLeft = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: fromLeft ? -60 : 60, y: 30 }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.2 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, scale: 1.02 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <Link to={createPageUrl(mod.link)} className="block h-full">
        <div
          className="relative overflow-hidden rounded-xl p-6 h-full transition-all duration-400 cursor-pointer"
          style={{
            filter: hovered ? 'grayscale(0) saturate(1.15)' : 'grayscale(1)',
            opacity: hovered ? 1 : 0.85,
            background: hovered
              ? `linear-gradient(135deg, rgba(10,1,24,0.98), rgba(20,10,50,0.95))`
              : 'linear-gradient(135deg, rgba(10,1,24,0.95), rgba(15,5,35,0.9))',
            border: `1px solid ${hovered ? mod.color : mod.border}`,
            boxShadow: hovered
              ? `0 0 40px ${mod.glow}, 0 0 80px ${mod.glow.replace('0.5', '0.2')}, inset 0 0 30px rgba(0,0,0,0.4)`
              : `0 0 15px ${mod.glow.replace('0.5', '0.15')}`,
          }}
        >
          {/* HUD corner accents */}
          <div className="absolute top-0 left-0 w-5 h-5 border-t border-l opacity-40 transition-opacity duration-300"
            style={{ borderColor: mod.color, opacity: hovered ? 0.8 : 0.3 }} />
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r opacity-40 transition-opacity duration-300"
            style={{ borderColor: mod.color, opacity: hovered ? 0.8 : 0.3 }} />

          {/* Glow sweep on hover */}
          {hovered && (
            <div className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at top left, ${mod.glow.replace('0.5', '0.08')}, transparent 70%)`,
              }}
            />
          )}

          <div className="relative z-10 flex items-start gap-4">
            <div
              className="flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-300"
              style={{
                background: `${mod.color}18`,
                border: `1px solid ${mod.color}60`,
                boxShadow: hovered ? `0 0 20px ${mod.glow}` : 'none',
              }}
            >
              <Icon className="w-5 h-5" style={{ color: mod.color, filter: hovered ? `drop-shadow(0 0 6px ${mod.color})` : 'none' }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm uppercase tracking-wider mb-2 transition-all duration-300"
                style={{ color: hovered ? mod.color : '#ffffff', textShadow: hovered ? `0 0 12px ${mod.color}` : 'none' }}>
                {mod.title}
              </h3>
              <p className="text-xs text-white/70 leading-relaxed">{mod.desc}</p>
            </div>
          </div>

          {hovered && (
            <div className="absolute bottom-4 right-4 z-10">
              <ArrowRight className="w-4 h-4 opacity-60" style={{ color: mod.color }} />
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default function PlatformCapabilities() {
  const containerRef = useRef(null);
  useInView(containerRef, { once: true, amount: 0.1 });
  const isInView = true; // always render content

  return (
    <section
      ref={containerRef}
      className="w-full relative overflow-hidden"
      style={{ background: 'transparent', padding: '80px 0 100px' }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.08), transparent)', filter: 'blur(60px)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.06), transparent)', filter: 'blur(60px)' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-block mb-4 px-4 py-1 text-xs font-mono uppercase tracking-[0.2em] border border-cyan-500/40 text-cyan-400"
            style={{ background: 'rgba(6,182,212,0.05)', boxShadow: '0 0 15px rgba(6,182,212,0.2)' }}
          >
WHAT WE BUILD WITH
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, x: -80 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl md:text-5xl font-black text-white mb-5 drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]"
          >
Our{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Toolkit
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, x: 80 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-white/70 text-base md:text-lg max-w-3xl mx-auto leading-relaxed"
          >
These are the components we've already built and run in production. When we take on a project,
            we assemble from proven parts instead of starting from zero — which is why our builds ship faster
            and hold up under real use.
          </motion.p>
        </div>

        {/* Module Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {modules.map((mod, idx) => (
            <ModuleCard key={mod.title} mod={mod} index={idx} isInView={isInView} />
          ))}
        </div>

        {/* IP + Compliance Banner */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="relative overflow-hidden rounded-2xl p-8 mb-10"
          style={{
            background: 'linear-gradient(135deg, rgba(10,1,24,0.98), rgba(30,10,60,0.95))',
            border: '1px solid rgba(124,58,237,0.4)',
            boxShadow: '0 0 50px rgba(124,58,237,0.2), inset 0 0 60px rgba(0,0,0,0.5)'
          }}
        >
          {/* HUD corners */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-purple-500 opacity-50" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-purple-500 opacity-50" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-purple-500 opacity-50" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-purple-500 opacity-50" />

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-purple-400" style={{ filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.8))' }} />
                <h3 className="text-sm font-black uppercase tracking-widest text-purple-400">
                  Intellectual Property
                </h3>
              </div>
              <p className="text-white/70 text-sm leading-relaxed mb-3">
GlyphLock includes original software, interface designs, documentation, workflows, verification components,
                QR tooling, record-keeping methods, and AI workflow configurations. GlyphLock-created material may be
                protected under applicable intellectual-property law and governing agreements. Client work and ownership terms are set per engagement.
              </p>
              <p className="text-white/60 text-xs leading-relaxed">
                GlyphLock names, marks, original designs, documentation, and protocol specifications may be subject to trademark,
                copyright, contract, or other protections. Third-party technologies and marks remain the property of their respective owners.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-5 h-5 text-cyan-400" style={{ filter: 'drop-shadow(0 0 6px rgba(6,182,212,0.8))' }} />
                <h3 className="text-sm font-black uppercase tracking-widest text-cyan-400">
  Standards We Build Against
                </h3>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {['SOC 2', 'ISO 27001', 'PCI DSS', 'GDPR', 'HIPAA'].map(f => (
                  <span key={f} className="px-3 py-1 text-xs font-bold rounded border border-cyan-500/30 text-cyan-300"
                    style={{ background: 'rgba(6,182,212,0.08)', boxShadow: '0 0 8px rgba(6,182,212,0.15)' }}>
                    {f}
                  </span>
                ))}
              </div>
              <p className="text-white/60 text-xs leading-relaxed">
These labels identify frameworks we consider when architecting a build. They do not represent certification,
                audit completion, regulatory approval, or legal compliance unless separately documented for the applicable system and scope.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Doctrine + CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="text-center"
        >
          <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-3">
From point of sale and payouts to AI features and QR tooling — built and maintained by one team.
            Availability varies by module, account permissions, integration status, and deployment.
          </p>
          <p className="text-white font-bold text-lg md:text-xl mb-10">
            Tell us what you need built. We'll tell you what it takes.<br />
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Every capability above is labeled honestly, so you can tell shipped features from demos and work in progress.
            </span>
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link
                to={createPageUrl('Consultation')}
                className="inline-flex items-center gap-2 px-8 py-4 font-black text-sm uppercase tracking-wide text-black transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #4f46e5)',
                  boxShadow: '0 0 30px rgba(6,182,212,0.4), 5px 5px 0 rgba(0,0,0,0.3)',
                  clipPath: 'polygon(6% 0%, 100% 0%, 94% 100%, 0% 100%)'
                }}
              >
⚡ START A PROJECT
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link
                to={createPageUrl('Services')}
                className="inline-flex items-center gap-2 px-8 py-4 font-bold text-sm uppercase tracking-wide text-purple-400 border-2 border-purple-500 transition-all duration-300 hover:bg-purple-500/10"
                style={{
                  boxShadow: '0 0 20px rgba(124,58,237,0.3), 4px 4px 0 rgba(124,58,237,0.2)',
                  clipPath: 'polygon(0% 6%, 94% 0%, 100% 94%, 6% 100%)'
                }}
              >
👁 SEE WHAT WE BUILD
              </Link>
            </motion.div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}