import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Sparkles, Github } from 'lucide-react';
import { createPageUrl } from '@/utils';

const VIDEO='https://base44.app/api/apps/6902128ac3c5c94a82446585/files/public/6902128ac3c5c94a82446585/643dc9ba3_Dec_05__2220_13s_202512052257_lc8rw.mp4';

export default function HeroSection(){
 const [ready,setReady]=useState(false);
 return <section className="relative w-full min-h-[78vh] md:min-h-[86vh] flex items-center overflow-hidden">
   <div className="absolute inset-0 z-0">
     {!ready&&<div className="absolute inset-0 bg-[#02040d]"/>}
     <video autoPlay loop muted playsInline preload="auto" onCanPlay={()=>setReady(true)} onLoadedData={()=>setReady(true)} className="absolute inset-0 w-full h-full object-cover scale-[1.03]" aria-label="GlyphLock platform cinematic hero">
       <source src={VIDEO} type="video/mp4"/>
     </video>
     <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(1,4,13,.94)_0%,rgba(1,4,13,.72)_40%,rgba(1,4,13,.25)_72%,rgba(1,4,13,.62)_100%)]"/>
     <div className="absolute inset-0 bg-gradient-to-t from-[#02040d] via-transparent to-[#02040d]/55"/>
     <div className="absolute inset-0 opacity-25" style={{backgroundImage:'linear-gradient(rgba(34,211,238,.14) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.14) 1px,transparent 1px)',backgroundSize:'48px 48px',maskImage:'linear-gradient(to bottom,black,transparent 88%)'}}/>
   </div>

   <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_24px_#22d3ee] z-10"/>
   <motion.div animate={{x:['-15%','115%']}} transition={{duration:7,repeat:Infinity,ease:'linear'}} className="absolute top-[18%] z-10 w-[28%] h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent shadow-[0_0_18px_#22d3ee] pointer-events-none"/>
   <div className="absolute right-[8%] top-[14%] w-72 h-72 rounded-full bg-violet-500/15 blur-[90px] z-10 pointer-events-none"/>

   <div className="relative z-20 max-w-7xl mx-auto w-full px-5 md:px-8 py-20">
     <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} className="inline-flex items-center gap-2 rounded-full border border-cyan-300/45 bg-black/35 backdrop-blur-xl px-4 py-2 font-mono text-[10px] md:text-xs tracking-[.22em] text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,.25)] mb-6"><span className="w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_14px_#6ee7b7] animate-pulse"/> GLYPHLOCK // PLATFORM ONLINE</motion.div>
     <motion.h1 initial={{opacity:0,y:36}} animate={{opacity:1,y:0}} transition={{delay:.08}} className="max-w-5xl text-[clamp(3.4rem,8.5vw,8.2rem)] font-black leading-[.82] tracking-[-.055em] text-white drop-shadow-[0_8px_30px_rgba(0,0,0,.75)]">BUILD.<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-blue-400 to-violet-400 drop-shadow-[0_0_24px_rgba(34,211,238,.35)]">CONNECT.</span><br/>OPERATE.</motion.h1>
     <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.2}} className="mt-7 max-w-2xl text-base md:text-xl text-slate-200 leading-relaxed drop-shadow-[0_3px_12px_rgba(0,0,0,.9)]">GlyphLock builds the software layer between an idea and a working operation — custom systems, AI workflows, verification, integrations, financial tooling and our flagship NUPS platform.</motion.p>
     <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:.3}} className="mt-8 flex flex-wrap gap-3">
       <Link to={createPageUrl('Consultation')} className="group inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-cyan-200 text-slate-950 font-black border border-white/80 shadow-[0_0_30px_rgba(34,211,238,.65),0_0_90px_rgba(34,211,238,.25)] hover:-translate-y-1 hover:scale-105 hover:bg-white hover:shadow-[0_0_55px_rgba(255,255,255,.8),0_0_120px_rgba(34,211,238,.35)] transition-all duration-300"><Sparkles size={18}/> BUILD WITH GLYPHLOCK <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/></Link>
       <Link to={createPageUrl('NUPSLanding')} className="group inline-flex items-center gap-2 px-7 py-4 rounded-xl border border-violet-300/70 bg-violet-500/20 backdrop-blur-xl text-violet-50 font-black shadow-[0_0_28px_rgba(139,92,246,.45),0_0_75px_rgba(139,92,246,.18)] hover:-translate-y-1 hover:scale-105 hover:bg-violet-400/30 hover:shadow-[0_0_50px_rgba(139,92,246,.7)] transition-all duration-300"><Play size={18}/> ENTER NUPS</Link>
       <a href="https://github.com/carloearl/glyphlock" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-4 rounded-xl border border-blue-300/35 bg-blue-400/10 backdrop-blur-xl text-blue-100 font-bold shadow-[0_0_22px_rgba(59,130,246,.22)] hover:-translate-y-1 hover:border-blue-200/70 hover:shadow-[0_0_42px_rgba(59,130,246,.45)] transition-all"><Github size={18}/> SOURCE</a>
     </motion.div>
   </div>

   <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 font-mono text-[9px] md:text-[10px] tracking-[.32em] text-cyan-200/65">GLYPHLOCK // CUSTOM SOFTWARE + OPERATIONS INTELLIGENCE</div>
 </section>
}