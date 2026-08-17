import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Bot, QrCode, Gauge, ShieldCheck, FileSignature, Workflow, Image, Music2, Building2, DollarSign, Radio, Search, ArrowRight, Activity, CheckCircle2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

const layers = [
  { id:'CREATE', icon:Sparkles, color:'#d946ef', summary:'Create assets and experiences that can move into the rest of the GlyphLock system.' },
  { id:'INTELLIGENCE', icon:Bot, color:'#818cf8', summary:'Analyze, assist, inspect and orchestrate information before human-owned decisions.' },
  { id:'VERIFY', icon:QrCode, color:'#22d3ee', summary:'Give people, assets and records resolvable identifiers and inspectable verification events.' },
  { id:'OPERATE', icon:Gauge, color:'#38bdf8', summary:'Run real operational workflows and create the records that describe what happened.' },
  { id:'PROTECT', icon:ShieldCheck, color:'#f43f5e', summary:'Apply access boundaries, activity visibility and security-oriented operational controls.' },
  { id:'GOVERN', icon:FileSignature, color:'#f59e0b', summary:'Expose rules, evidence discipline, responsibilities, documentation and review methodology.' },
  { id:'CONNECT', icon:Workflow, color:'#10b981', summary:'Connect GlyphLock workflows to APIs, providers, infrastructure and external systems.' },
];

const modules = [
  { name:'Image Lab', icon:Image, layer:'CREATE', status:'LIVE', route:'ImageLab', action:'OPEN IMAGE LAB', what:'Generate and analyze images and build interactive image experiences.', capabilities:['AI image generation','Visual analysis','Interactive hotspots'], connects:['GlyphBot','QR Studio'], evidence:'Working Image Lab and image-generation interfaces are available in the platform.' },
  { name:'DJ Pro Mixer', icon:Music2, layer:'CREATE', status:'LIVE', route:'GlyphBotMixer', action:'OPEN THE MIXER', what:'Creator and venue-facing audio/DJ workspace inside the GlyphLock ecosystem.', capabilities:['Interactive mixer UI','Creator workflow surface','Venue-facing tooling'], connects:['NUPS','GlyphBot'], evidence:'Interactive DJ/audio tooling is implemented as a usable product surface.' },
  { name:'GlyphBot', icon:Bot, layer:'INTELLIGENCE', status:'LIVE', route:'GlyphBot', action:'ASK GLYPHBOT', what:'Multi-provider AI workspace for research, analysis, code assistance, review and workflows.', capabilities:['Research assistance','Code analysis','Workflow support'], connects:['Site Audit','Image Lab','Governance Hub'], evidence:'Interactive GlyphBot assistant and supporting workflow components are implemented.' },
  { name:'Site Audit', icon:Search, layer:'INTELLIGENCE', status:'LIVE', route:'GlyphBot', action:'RUN A SITE AUDIT', what:'Inspect digital properties, organize findings and turn them into remediation work.', capabilities:['Site analysis','Finding organization','Remediation output'], connects:['GlyphBot','Security Operations','Governance Hub'], evidence:'Site-audit workflows are exposed through the GlyphBot product surface.' },
  { name:'QR Studio', icon:QrCode, layer:'VERIFY', status:'LIVE', route:'Qr', action:'CREATE A GLYPH', what:'Generate, encode, distribute, scan, resolve and verify QR/Glyph-linked records.', capabilities:['QR generation','Payload workflows','Scan logging','Signing options','Verification'], connects:['NUPS','Image Lab','Governance Hub'], evidence:'Generator, payload, scan, signing and verification workflows are implemented in-product.' },
  { name:'NUPS', icon:Building2, layer:'OPERATE', status:'FLAGSHIP · LIVE', route:'NUPSLanding', action:'ENTER NUPS', what:'GlyphLock’s flagship venue operating environment and strongest real-world system implementation.', capabilities:['Front door','POS/registers','Contracts','Staff/entertainer workflows','VIP','Payouts','Reporting','QR operations'], connects:['QR Studio','GlyphLock Financial','Security Operations','Governance Hub','Integrations'], evidence:'Working venue workflows, contracts, POS, reporting and integration surfaces are present in the product.' },
  { name:'GlyphLock Financial', icon:DollarSign, layer:'OPERATE', status:'LIVE', route:'GlyphLockFinancial', action:'VIEW FINANCIAL', what:'Operational financial surfaces for ledgers, settlements, payouts, reconciliation and reporting.', capabilities:['Ledgers','Settlement views','Payout workflows','Reconciliation','Reporting'], connects:['NUPS','Governance Hub'], evidence:'Ledger, settlement, payout, reconciliation and reporting interfaces are implemented.' },
  { name:'Security Operations', icon:Radio, layer:'PROTECT', status:'LIVE · HARDENING', route:'SecurityOperationsCenter', action:'INSPECT SECURITY', what:'Operational security visibility around access, activity, events and audit records.', capabilities:['Access visibility','Activity monitoring','Audit events','Security operations'], connects:['NUPS','Site Audit','Governance Hub'], evidence:'Security-operations surfaces are implemented; control hardening and independent validation remain separate work.' },
  { name:'Governance Hub', icon:FileSignature, layer:'GOVERN', status:'LIVE', route:'GovernanceHub', action:'EXPLORE GOVERNANCE', what:'The public control plane for GlyphLock governance concepts, review methodology and evidence discipline.', capabilities:['Master Covenant','Architecture review','Evidence boundaries','Remediation methodology'], connects:['All platform layers'], evidence:'Published framework, review methodology, documentation and public-claims boundaries are available.' },
  { name:'Integration Layer', icon:Workflow, layer:'CONNECT', status:'ACTIVE', route:'Services', action:'EXPLORE INTEGRATIONS', what:'APIs, OAuth, payments, hospitality integrations and infrastructure that connect GlyphLock outward.', capabilities:['APIs','OAuth','Payments','Oracle OHIP work','External services'], connects:['NUPS','GlyphBot','QR Studio','Financial'], evidence:'Multiple integration surfaces exist in the codebase; each external connection is validated according to its own scope.' },
];

export default function InteractiveSystemMap() {
  const [activeLayer, setActiveLayer] = useState('OPERATE');
  const visible = useMemo(() => modules.filter(m => m.layer === activeLayer), [activeLayer]);
  const active = layers.find(l => l.id === activeLayer) || layers[0];

  return (
    <section id="system-map" className="gl-home-section relative max-w-7xl mx-auto px-5 py-20 md:py-28">
      <div className="absolute inset-x-[8%] top-[20%] h-80 rounded-full bg-cyan-500/[.07] blur-[130px] pointer-events-none" />
      <div className="relative mb-10 text-center">
        <div className="font-mono text-[10px] md:text-xs tracking-[.28em] text-cyan-300">// INTERACTIVE GLYPHLOCK ARCHITECTURE</div>
        <h2 className="mt-4 text-4xl md:text-6xl lg:text-7xl font-black leading-[.9] text-white">DON'T READ THE SYSTEM.<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-blue-400 to-violet-400">TOUCH IT.</span></h2>
        <p className="mx-auto mt-5 max-w-3xl text-slate-300 md:text-lg">Select a layer to see what it does, what is live, what it connects to, and what evidence supports the public description.</p>
      </div>

      <div className="relative overflow-hidden rounded-[30px] border border-cyan-300/25 bg-[#020611]/[.58] backdrop-blur-2xl shadow-[0_0_55px_rgba(34,211,238,.12),0_0_120px_rgba(124,58,237,.10)]">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{backgroundImage:'linear-gradient(rgba(34,211,238,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.09) 1px,transparent 1px)',backgroundSize:'38px 38px'}} />
        <div className="relative grid lg:grid-cols-[250px_1fr]">
          <div className="border-b lg:border-b-0 lg:border-r border-white/10 p-3 md:p-4">
            <div className="flex lg:flex-col gap-2 overflow-x-auto [scrollbar-width:none]">
              {layers.map(layer => {
                const Icon = layer.icon; const selected = activeLayer === layer.id;
                return <button key={layer.id} onClick={()=>setActiveLayer(layer.id)} className={`relative flex flex-shrink-0 items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-300 ${selected?'bg-white/[.08] text-white':'border-white/[.07] bg-white/[.025] text-slate-400 hover:text-white hover:bg-white/[.05]'}`} style={selected?{borderColor:`${layer.color}88`,boxShadow:`0 0 28px ${layer.color}30, inset 0 0 24px ${layer.color}12`}:{}}>
                  <Icon className="h-5 w-5" style={{color:layer.color,filter:selected?`drop-shadow(0 0 8px ${layer.color})`:undefined}}/><span className="font-mono text-[10px] font-bold tracking-[.13em]">{layer.id}</span>{selected&&<motion.span layoutId="map-active" className="absolute right-2 h-1.5 w-1.5 rounded-full" style={{background:layer.color,boxShadow:`0 0 12px ${layer.color}`}}/>}
                </button>
              })}
            </div>
          </div>

          <div className="relative p-5 md:p-8 lg:p-10 min-h-[620px]">
            <AnimatePresence mode="wait">
              <motion.div key={activeLayer} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.3}}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-white/10 pb-7">
                  <div><div className="font-mono text-[9px] tracking-[.22em]" style={{color:active.color}}>LAYER ACTIVE // {active.id}</div><h3 className="mt-2 text-3xl md:text-5xl font-black text-white">{active.id}</h3><p className="mt-3 max-w-2xl text-slate-300 leading-relaxed">{active.summary}</p></div>
                  <div className="flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/[.06] px-3 py-2 font-mono text-[9px] tracking-[.15em] text-emerald-200"><Activity className="h-3.5 w-3.5 animate-pulse"/> SYSTEM PATH ACTIVE</div>
                </div>

                <div className="mt-7 grid xl:grid-cols-2 gap-4">
                  {visible.map((m,i)=>{ const Icon=m.icon; return <motion.article key={m.name} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*.08}} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] p-5 md:p-6 hover:border-white/25 transition-all">
                    <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full blur-[55px] opacity-20" style={{background:active.color}}/>
                    <div className="relative flex items-start justify-between gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl border" style={{borderColor:`${active.color}66`,boxShadow:`0 0 22px ${active.color}22`}}><Icon className="h-5 w-5" style={{color:active.color}}/></div><span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 font-mono text-[8px] tracking-[.14em] text-slate-300">{m.status}</span></div>
                    <div className="relative mt-5"><h4 className="text-xl font-black text-white">{m.name}</h4><p className="mt-2 text-sm leading-relaxed text-slate-300">{m.what}</p></div>
                    <div className="relative mt-5 grid sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/[.07] bg-black/20 p-3"><div className="font-mono text-[8px] tracking-[.15em] text-white/40">LIVE CAPABILITIES</div><div className="mt-2 space-y-1.5">{m.capabilities.map(x=><div key={x} className="flex gap-2 text-[11px] text-slate-400"><CheckCircle2 className="mt-0.5 h-3 w-3 flex-none" style={{color:active.color}}/>{x}</div>)}</div></div>
                      <div className="rounded-xl border border-white/[.07] bg-black/20 p-3"><div className="font-mono text-[8px] tracking-[.15em] text-white/40">CONNECTED SYSTEMS</div><p className="mt-2 text-[11px] leading-relaxed text-slate-400">{m.connects.join(' · ')}</p></div>
                    </div>
                    <div className="relative mt-3 rounded-xl border border-white/[.07] bg-black/20 p-3"><div className="font-mono text-[8px] tracking-[.15em] text-white/40">EVIDENCE</div><p className="mt-2 text-[11px] leading-relaxed text-slate-400">{m.evidence}</p></div>
                    <Link to={createPageUrl(m.route)} className="gl-energy-button relative mt-5 inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 font-mono text-[9px] font-bold tracking-[.13em] transition-all hover:-translate-y-0.5" style={{color:active.color,borderColor:`${active.color}55`,background:`${active.color}10`,boxShadow:`0 0 20px ${active.color}18`}}>{m.action}<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"/></Link>
                  </motion.article>})}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <div className="mt-5 text-center font-mono text-[9px] tracking-[.16em] text-slate-500">CREATE → INTELLIGENCE → VERIFY → OPERATE → PROTECT → GOVERN → CONNECT</div>
    </section>
  );
}