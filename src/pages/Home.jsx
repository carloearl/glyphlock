import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, ShieldCheck, Code2, Workflow, QrCode, Bot, Building2, Sparkles, Github } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { createPageUrl } from '@/utils';
import HeroSection from '@/components/home/HeroSection';
import FeaturedIntegrationsMarquee from '@/components/home/FeaturedIntegrationsMarquee';
import HomeDreamTeamCTA from '@/components/home/HomeDreamTeamCTA';
import ServicesGrid from '@/components/home/ServicesGrid';
import TechnologyMarquee from '@/components/TechnologyMarquee';
import CTASection from '@/components/home/CTASection';

const proof = [
  { icon: Building2, title: 'NUPS', text: 'Venue operations: POS, contracts, receipts, reporting, payouts, and audit trails.', link: 'NUPSLanding', c: '#38bdf8' },
  { icon: QrCode, title: 'QR Studio', text: 'Custom QR payloads, scan logging, signing options, and verification workflows.', link: 'Qr', c: '#22d3ee' },
  { icon: ShieldCheck, title: 'Governance Hub', text: 'Published operating standards for how GlyphLock scopes, documents, reviews, and governs systems.', link: 'GovernanceHub', c: '#8b5cf6' },
  { icon: Bot, title: 'GlyphBot', text: 'Multi-provider AI assistance for research, review, audits, and natural-language workflows.', link: 'GlyphBot', c: '#818cf8' },
];

const capabilities = [
  ['CUSTOM SOFTWARE', 'Web apps, internal tools, dashboards, portals, workflow systems, and purpose-built interfaces.'],
  ['SYSTEM INTEGRATION', 'APIs, payments, data, identity, automation, and third-party platforms connected into one operating flow.'],
  ['AI ENGINEERING', 'Multi-model workflows for research, coding, analysis, review, assistance, and automation.'],
  ['OPERATIONS SOFTWARE', 'POS, contracts, reporting, scheduling, payouts, access controls, audit logs, and venue workflows.'],
];

function CapabilityGrid() {
  return <section className="max-w-7xl mx-auto px-5 py-20">
    <div className="mb-10">
      <div className="font-mono text-cyan-400 text-xs tracking-[.28em] mb-3">// GLYPHLOCK CAPABILITIES</div>
      <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">BUILD THE SYSTEM.<br/><span className="text-cyan-400">CONNECT THE STACK.</span></h2>
    </div>
    <div className="grid md:grid-cols-2 gap-px bg-cyan-400/20 border border-cyan-400/20">
      {capabilities.map(([title,text],i)=><motion.div key={title} initial={{opacity:0,y:25}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.08}} className="bg-[#050817] p-7 md:p-9 group hover:bg-[#071126] transition-colors">
        <div className="font-mono text-[10px] text-cyan-400/60 mb-5">0{i+1} / CAPABILITY</div>
        <h3 className="text-xl font-black text-white mb-3 group-hover:text-cyan-300 transition-colors">{title}</h3>
        <p className="text-slate-400 leading-relaxed">{text}</p>
      </motion.div>)}
    </div>
  </section>
}

function ProductProof() {
  return <section className="max-w-7xl mx-auto px-5 py-20">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
      <div><div className="font-mono text-violet-400 text-xs tracking-[.28em] mb-3">// PROOF OF WORK</div><h2 className="text-4xl md:text-6xl font-black text-white">DON'T TAKE OUR<br/><span className="text-violet-400">WORD FOR IT.</span></h2></div>
      <Link to={createPageUrl('NUPSLanding')} className="text-cyan-300 font-bold flex items-center gap-2 hover:text-white">Enter NUPS <ArrowRight size={18}/></Link>
    </div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {proof.map((p,i)=>{const Icon=p.icon;return <Link key={p.title} to={createPageUrl(p.link)} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[.035] p-6 min-h-[260px] group hover:-translate-y-1 transition-all" style={{boxShadow:`inset 0 0 50px ${p.c}08`}}>
        <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full blur-3xl opacity-20" style={{background:p.c}}/>
        <Icon className="w-9 h-9 mb-12" style={{color:p.c}}/>
        <div className="font-mono text-[10px] text-white/35 mb-2">MODULE_0{i+1}</div>
        <h3 className="text-xl font-black text-white mb-3">{p.title}</h3><p className="text-sm text-slate-400 leading-relaxed">{p.text}</p>
        <ArrowRight className="absolute right-5 bottom-5 w-5 h-5 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all"/>
      </Link>})}
    </div>
  </section>
}

function CommandCTA() {
  return <section className="max-w-7xl mx-auto px-5 py-10">
    <div className="relative overflow-hidden rounded-[28px] border border-cyan-400/30 bg-[#050817] px-6 py-12 md:px-12 md:py-16">
      <div className="absolute inset-0 opacity-30" style={{backgroundImage:'linear-gradient(rgba(34,211,238,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.08) 1px,transparent 1px)',backgroundSize:'35px 35px'}}/>
      <div className="absolute -top-32 right-0 w-96 h-96 rounded-full bg-blue-600/20 blur-[100px]"/>
      <div className="relative grid lg:grid-cols-[1fr_auto] gap-8 items-center">
        <div><div className="font-mono text-cyan-400 text-xs tracking-[.25em] mb-4">READY // BUILD QUEUE OPEN</div><h2 className="text-4xl md:text-6xl font-black text-white leading-[.95]">BRING US THE<br/>HARD PROBLEM.</h2><p className="mt-5 max-w-2xl text-slate-300 text-lg">We design the interface, wire the integrations, build the workflow, deploy it, and stay with the system after launch.</p></div>
        <div className="flex flex-col gap-3 min-w-[230px]">
          <Link to={createPageUrl('Consultation')} className="flex items-center justify-center gap-2 px-6 py-4 bg-cyan-400 text-slate-950 font-black rounded-xl hover:bg-white transition-colors">START A PROJECT <ArrowRight size={18}/></Link>
          <Link to={createPageUrl('Services')} className="flex items-center justify-center gap-2 px-6 py-4 border border-white/20 text-white font-bold rounded-xl hover:bg-white/10">EXPLORE SERVICES</Link>
          <Link to={createPageUrl('NUPSLanding')} className="flex items-center justify-center gap-2 px-6 py-4 border border-violet-400/30 text-violet-300 font-bold rounded-xl hover:bg-violet-400/10"><Play size={16}/> SEE NUPS</Link>
        </div>
      </div>
    </div>
  </section>
}

export default function Home() {
  const [loading,setLoading]=useState(true);
  useEffect(()=>{const t=setTimeout(()=>setLoading(false),180);return()=>clearTimeout(t)},[]);
  if(loading)return <div className="fixed inset-0 z-[99999] bg-[#02040d] flex items-center justify-center"><div className="relative"><div className="w-20 h-20 rounded-full border border-cyan-400/30 animate-ping"/><div className="absolute inset-5 rounded-full bg-cyan-400 shadow-[0_0_50px_#22d3ee]"/></div></div>;
  return <>
    <SEOHead title="GlyphLock — Custom Software, AI & Operations Systems" description="GlyphLock designs, builds, integrates, and operates custom software, AI-assisted workflows, websites, apps, and business systems. Explore NUPS and GlyphLock's working platform modules." keywords="GlyphLock, custom software, NUPS, software development, AI workflows, integrations, POS, QR verification" url="/"/>
    <main className="min-h-screen text-white overflow-hidden" style={{background:'radial-gradient(circle at 50% 0%,#0d1f47 0,#050817 28%,#02040d 70%)'}}>
      <section className="relative min-h-[92vh] flex flex-col justify-center pt-10">
        <div className="absolute inset-0 pointer-events-none opacity-30" style={{backgroundImage:'linear-gradient(rgba(56,189,248,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,.08) 1px,transparent 1px)',backgroundSize:'55px 55px',maskImage:'linear-gradient(to bottom,black,transparent 90%)'}}/>
        <div className="absolute left-1/2 top-20 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none"/>
        <div className="relative z-10 max-w-7xl mx-auto px-5 w-full">
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="flex items-center gap-2 font-mono text-[11px] tracking-[.24em] text-cyan-300 mb-6"><span className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_12px_#34d399]"/> GLYPHLOCK // SYSTEMS ONLINE</motion.div>
          <motion.h1 initial={{opacity:0,y:35}} animate={{opacity:1,y:0}} transition={{delay:.08}} className="text-[clamp(3.3rem,9vw,8.4rem)] font-black leading-[.82] tracking-[-.06em] max-w-6xl">WE BUILD<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500">SYSTEMS THAT RUN.</span></motion.h1>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.25}} className="grid lg:grid-cols-[1fr_auto] gap-8 items-end mt-8 mb-5">
            <p className="text-lg md:text-2xl text-slate-300 max-w-3xl leading-relaxed">Custom software, AI-assisted workflows, integrations, and operations platforms engineered around how the business actually moves.</p>
            <div className="flex flex-wrap gap-3">
              <Link to={createPageUrl('Consultation')} className="px-6 py-4 rounded-xl bg-cyan-400 text-slate-950 font-black flex items-center gap-2 hover:bg-white transition-colors">BUILD WITH US <ArrowRight size={18}/></Link>
              <Link to={createPageUrl('NUPSLanding')} className="px-6 py-4 rounded-xl border border-white/20 bg-white/5 font-bold flex items-center gap-2 hover:bg-white/10"><Play size={17}/> VIEW NUPS</Link>
              <a href="https://github.com/carloearl/glyphlock" target="_blank" rel="noreferrer" className="px-5 py-4 rounded-xl border border-white/10 text-slate-300 flex items-center gap-2 hover:text-white hover:border-white/30"><Github size={18}/> SOURCE</a>
            </div>
          </motion.div>
        </div>
        <div className="relative z-10 mt-4"><HeroSection/></div>
        <div className="relative z-10 max-w-7xl mx-auto px-5 w-full grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border-y border-white/10">
          {[['01','DESIGN'],['02','BUILD'],['03','INTEGRATE'],['04','OPERATE']].map(([n,t])=><div key={n} className="bg-[#030611]/80 px-5 py-4"><span className="font-mono text-cyan-400 text-xs mr-3">{n}</span><span className="font-black tracking-widest text-xs">{t}</span></div>)}
        </div>
      </section>

      <section className="border-y border-white/10 bg-black/20 py-3"><FeaturedIntegrationsMarquee/></section>
      <CapabilityGrid/>
      <ProductProof/>

      <section className="py-10"><HomeDreamTeamCTA/></section>
      <section className="py-8"><ServicesGrid/></section>

      <section className="max-w-7xl mx-auto px-5 py-16">
        <div className="rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-blue-950/60 to-violet-950/40 p-8 md:p-12 relative">
          <div className="absolute right-0 top-0 w-72 h-72 bg-violet-500/15 blur-[90px] rounded-full"/>
          <div className="relative"><div className="flex items-center gap-2 text-cyan-300 font-mono text-xs tracking-[.25em] mb-5"><Workflow size={16}/> ENGINEERING MODEL</div><h2 className="text-4xl md:text-6xl font-black max-w-4xl">AI IS IN THE WORKFLOW.<br/><span className="text-violet-400">PEOPLE OWN THE OUTCOME.</span></h2><p className="text-slate-300 text-lg max-w-3xl mt-6">We use multiple AI providers as tools for research, coding, analysis, review, and automation. Roles are defined by workflow—not by claims of endorsement, partnership, or legal binding by third-party model providers.</p><Link to={createPageUrl('DreamTeam')} className="inline-flex items-center gap-2 mt-7 text-cyan-300 font-black">EXPLORE THE AI WORKFLOW <ArrowRight size={18}/></Link></div>
        </div>
      </section>

      <section className="py-4"><TechnologyMarquee/></section>
      <CommandCTA/>
      <section className="pb-16"><CTASection/></section>
      <footer className="border-t border-white/10 max-w-7xl mx-auto px-5 py-10 flex flex-col md:flex-row justify-between gap-5 text-sm text-slate-500"><div><strong className="text-white">GLYPHLOCK LLC</strong><br/>Custom software · NUPS · AI workflows · systems integration</div><div className="md:text-right">Third-party names identify technologies used, evaluated, supported, or integrated.<br/>They do not imply endorsement, certification, or partnership unless separately documented.</div></footer>
    </main>
  </>;
}
