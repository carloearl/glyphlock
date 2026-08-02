import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import {
  Truck, Smartphone, Laptop, Code2, Globe, Cpu,
  CreditCard, Building2, Mic, Wrench
} from 'lucide-react';

const SERVICES = [
  { title: 'Mobile Device Repair', desc: 'Phones and tablets — screens, batteries, data recovery, on-site.', icon: Smartphone, color: '#06b6d4' },
  { title: 'Computer Repair', desc: 'Desktops, laptops, diagnostics, tune-ups, and virus removal.', icon: Laptop, color: '#3b82f6' },
  { title: 'Software Design', desc: 'Custom applications built around how your business actually runs.', icon: Code2, color: '#7c3aed' },
  { title: 'Web Development', desc: 'Fast, secure, mobile-first sites and web apps end to end.', icon: Globe, color: '#4f46e5' },
  { title: 'Hardware & Networking', desc: 'Servers, workstations, cabling, routers, cameras, and Wi-Fi.', icon: Cpu, color: '#10b981' },
  { title: 'POS Systems', desc: 'Register hardware, receipt printers, card readers, and setup.', icon: CreditCard, color: '#f59e0b' },
  { title: 'N.U.P.S. Deployment', desc: 'Full venue operating system — POS, accounting, and compliance.', icon: Building2, color: '#ec4899' },
  { title: 'Recording & Engineering', desc: 'Studio recording, mixing, mastering, and live audio engineering.', icon: Mic, color: '#a855f7' },
  { title: 'Install & Configuration', desc: 'Software and hardware installed, configured, and tested on-site.', icon: Wrench, color: '#06b6d4' },
];

function ServiceCard({ svc, index }) {
  const Icon = svc.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
      whileHover={{ y: -6 }}
      className="relative rounded-xl p-5 h-full transition-all duration-300"
      style={{
        background: 'linear-gradient(135deg, rgba(10,1,24,0.95), rgba(15,5,35,0.9))',
        border: `1px solid ${svc.color}44`,
        boxShadow: `0 0 18px ${svc.color}22`,
      }}
    >
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center mb-3"
        style={{ background: `${svc.color}18`, border: `1px solid ${svc.color}60` }}
      >
        <Icon className="w-5 h-5" style={{ color: svc.color }} />
      </div>
      <h3 className="text-white font-bold text-sm uppercase tracking-wide mb-2">{svc.title}</h3>
      <p className="text-white/70 text-xs leading-relaxed">{svc.desc}</p>
    </motion.div>
  );
}

export default function OnSiteServices() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 mb-5 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300"
          style={{ background: 'rgba(6,182,212,0.08)', border: '2px solid rgba(6,182,212,0.4)', clipPath: 'polygon(6% 0%, 100% 0%, 94% 100%, 0% 100%)' }}
        >
          <Truck className="w-4 h-4" />
          We Come To You
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
          On-Site{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
            Technology Services
          </span>
        </h2>
        <p className="text-white/70 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
          Repairs, builds, installs, and full system deployments — done at your home, office, or venue.
          One team for hardware, software, networks, point of sale, and audio.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {SERVICES.map((svc, i) => (
          <ServiceCard key={svc.title} svc={svc} index={i} />
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <Link
          to={createPageUrl('Consultation')}
          className="inline-flex items-center gap-2 px-8 py-4 font-black text-sm uppercase tracking-wide text-black transition-all duration-300 hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, #06b6d4, #4f46e5)',
            boxShadow: '0 0 30px rgba(6,182,212,0.4)',
            clipPath: 'polygon(6% 0%, 100% 0%, 94% 100%, 0% 100%)',
          }}
        >
          ⚡ Book An On-Site Visit
        </Link>
        <Link
          to={createPageUrl('Contact')}
          className="inline-flex items-center gap-2 px-8 py-4 font-bold text-sm uppercase tracking-wide text-purple-400 border-2 border-purple-500 transition-all duration-300 hover:bg-purple-500/10"
          style={{ clipPath: 'polygon(0% 6%, 94% 0%, 100% 94%, 6% 100%)' }}
        >
          Get A Quote
        </Link>
      </div>
    </section>
  );
}