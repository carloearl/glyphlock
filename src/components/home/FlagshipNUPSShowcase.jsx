import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Radio, CreditCard, FileSignature, Fingerprint, ScanLine, BarChart3, Hotel, ShieldCheck } from 'lucide-react';
import { createPageUrl } from '@/utils';

const features = [
  [CreditCard, 'POS + Registers', 'Cash/card workflows, catalogs, void logging and shift-close controls.'],
  [FileSignature, 'Contracts', 'VIP contract workflows, printing, signing, rescanning and record retention.'],
  [Fingerprint, 'Staff + Identity', 'Role-aware access, shift logs and supported biometric workflows.'],
  [ScanLine, 'QR Operations', 'Guest, driver and operational QR issuance tied to auditable records.'],
  [BarChart3, 'Accounting + Reporting', 'Drawer reconciliation, settlement views, payout workflows and operating reports.'],
  [Hotel, 'Oracle OHIP', 'Authenticated server-side integration work with Oracle Hospitality Integration Platform.'],
];

export default function FlagshipNUPSShowcase() {
  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[8%] top-[12%] h-72 w-72 rounded-full bg-cyan-500/15 blur-[100px] animate-pulse" />
        <div className="absolute right-[5%] bottom-[8%] h-96 w-96 rounded-full bg-violet-600/20 blur-[130px] animate-pulse" />
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:'linear-gradient(rgba(34,211,238,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.12) 1px,transparent 1px)',backgroundSize:'42px 42px'}} />
      </div>

      <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="relative rounded-[30px] border border-cyan-400/30 bg-slate-950/65 backdrop-blur-xl p-5 md:p-9 shadow-[0_0_70px_rgba(6,182,212,.18),0_0_120px_rgba(124,58,237,.12)]">
        <div className="absolute -inset-px rounded-[30px] pointer-events-none bg-gradient-to-r from-cyan-400/20 via-transparent to-violet-500/20" />
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-[11px] font-black tracking-[.22em] text-emerald-300 uppercase shadow-[0_0_24px_rgba(16,185,129,.16)]"><Radio className="w-3.5 h-3.5 animate-pulse"/> GLYPHLOCK FLAGSHIP PLATFORM</div>
            <h2 className="mt-5 text-4xl md:text-6xl font-black text-white tracking-tight">NUPS <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">RUNS THE ROOM.</span></h2>
            <p className="mt-4 max-w-3xl text-base md:text-xl text-slate-300 leading-relaxed">Nexus Unified Portal System is GlyphLock's full-stack venue operating platform — connecting front-door workflows, point of sale, contracts, staff operations, payouts, records, reporting and integrations in one operating surface.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={createPageUrl('NUPSLanding')} className="group inline-flex items-center gap-2 rounded-xl border border-cyan-300/60 bg-cyan-400/15 px-5 py-3 font-black text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,.28)] hover:bg-cyan-300 hover:text-slate-950 hover:shadow-[0_0_50px_rgba(34,211,238,.55)] transition-all"><Play className="w-4 h-4"/> EXPERIENCE NUPS <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/></Link>
            <Link to="/NUPSKiosk" className="inline-flex items-center gap-2 rounded-xl border border-violet-400/60 bg-violet-500/15 px-5 py-3 font-black text-violet-100 shadow-[0_0_28px_rgba(139,92,246,.25)] hover:bg-violet-400 hover:text-white transition-all"><ShieldCheck className="w-4 h-4"/> ENTER SYSTEM</Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[26px] border border-cyan-300/40 bg-black/35 backdrop-blur-xl shadow-[0_0_40px_rgba(34,211,238,.18),0_0_90px_rgba(124,58,237,.16),inset_0_0_50px_rgba(59,130,246,.08)] mb-8 p-5 md:p-8 min-h-[280px]">
          <div className="absolute inset-0 opacity-30" style={{backgroundImage:'linear-gradient(rgba(34,211,238,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.12) 1px,transparent 1px)',backgroundSize:'34px 34px'}} />
          <div className="absolute -left-16 top-12 h-48 w-48 rounded-full bg-cyan-500/20 blur-[70px] animate-pulse" />
          <div className="absolute -right-12 bottom-0 h-56 w-56 rounded-full bg-violet-500/20 blur-[80px] animate-pulse" />
          <div className="relative z-10 grid md:grid-cols-[1.1fr_.9fr] gap-6 items-center h-full">
            <div>
              <div className="font-mono text-[10px] md:text-xs tracking-[.24em] text-cyan-300 mb-3">NUPS // LIVE OPERATING SURFACE</div>
              <h3 className="text-3xl md:text-5xl font-black text-white leading-tight">ONE COMMAND DECK.<br/><span className="text-violet-300">EVERY VENUE FLOW.</span></h3>
              <p className="mt-4 max-w-2xl text-slate-300">Front door, guest identity, staff shifts, registers, contracts, payouts, reporting, audit evidence and integrations are organized as one connected operating system.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['FRONT DOOR','POS / BAR','VIP CONTRACTS','STAFF SHIFTS','PAYOUTS','REPORTING','QR OPS','OHIP'].map((label,i)=><div key={label} className="rounded-xl border border-cyan-300/15 bg-white/[.055] backdrop-blur-lg px-3 py-4 text-center font-mono text-[10px] md:text-xs text-slate-200 shadow-[0_0_20px_rgba(59,130,246,.10),inset_0_0_18px_rgba(34,211,238,.04)] hover:-translate-y-1 hover:scale-[1.03] hover:border-cyan-300/60 hover:text-cyan-100 hover:bg-cyan-300/[.07] hover:shadow-[0_0_34px_rgba(34,211,238,.34),0_0_60px_rgba(124,58,237,.16)] transition-all duration-300">{String(i+1).padStart(2,'0')} // {label}</div>)}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(([Icon,title,desc],i)=><motion.div key={title} initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.06}} whileHover={{y:-7,scale:1.02}} className="group relative overflow-hidden rounded-2xl border border-cyan-300/15 bg-white/[.055] backdrop-blur-xl p-5 shadow-[0_0_24px_rgba(59,130,246,.12),inset_0_0_30px_rgba(124,58,237,.05)] hover:border-cyan-300/60 hover:shadow-[0_0_42px_rgba(6,182,212,.32),0_0_85px_rgba(124,58,237,.16)] transition-all duration-300">
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl group-hover:bg-cyan-400/15 transition-colors"/>
            <Icon className="relative w-7 h-7 text-cyan-300 mb-4 drop-shadow-[0_0_10px_rgba(34,211,238,.8)]"/><h3 className="relative text-white font-black tracking-wide mb-2">{title}</h3><p className="relative text-sm text-slate-400 leading-relaxed">{desc}</p>
          </motion.div>)}
        </div>
      </motion.div>
    </section>
  );
}