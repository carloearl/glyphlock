import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, useInView } from "framer-motion";

export default function HomeDreamTeamCTA() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.4 });

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center mt-20">
      
      {/* HERO TEXT - ABOVE COURT */}
      <div className="text-center px-8 mb-8 max-w-5xl">
        {/* Title - Slide from left */}
        <motion.h2 
          initial={{ opacity: 0, x: -100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-white text-4xl md:text-5xl font-black mb-6 leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,1)]"
        >
          <span className="text-blue-400">DREAM TEAM AI</span> — ORCHESTRATED INTELLIGENCE
        </motion.h2>
        
        {/* Subtitle - Slide from right */}
        <motion.div 
          initial={{ opacity: 0, x: 100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl md:text-2xl leading-relaxed font-black drop-shadow-[0_4px_12px_rgba(0,0,0,1)] space-y-4"
        >
          <p className="text-white">Other platforms run single models with guardrails.<br />GlyphLock orchestrates a full roster — <span className="text-blue-400">six specialized AI agents executing coordinated plays.</span></p>
        </motion.div>
      </div>

      {/* PULSING GLOW BEHIND ENTIRE CTA */}
      <div 
        className="absolute inset-0 -m-8 rounded-3xl animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(79,70,229,0.4) 0%, rgba(65,105,225,0.2) 50%, transparent 70%)',
          filter: 'blur(80px)',
          zIndex: -1
        }}
      />

      {/* COURT IMAGE WITH BUTTON OVERLAY */}
      <motion.section 
        initial={{ opacity: 0, y: 70, scale: 0.9 }}
        animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full mx-auto max-w-5xl rounded-3xl shadow-[0_0_80px_rgba(79,70,229,0.6)] overflow-hidden"
      >
        
        {/* COURT BACKGROUND - TIGHTER CROP */}
        <div className="relative w-full aspect-[21/9]">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/03ba5648e_3880beef-889a-4dec-9b80-2b561f3c47a31.jpg"
            alt="Basketball Court"
            className="w-full h-full object-cover object-center brightness-125 contrast-125 saturate-150"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        </div>

        {/* BUTTON WITH GLOW - ON COURT */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <Link 
            to={createPageUrl("DreamTeam")} 
            className="group block"
          >
            <motion.div 
              whileHover={{ scale: 1.15, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="relative cursor-pointer transition-all duration-300 flex flex-col items-center" 
              style={{ 
                isolation: 'isolate', 
                pointerEvents: 'auto',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              
              {/* STATIC BLACK GLOW */}
              <div 
                className="absolute inset-0 -m-20 rounded-full bg-black/90 blur-[100px]" 
                style={{ 
                  zIndex: 1,
                  boxShadow: '0 0 120px rgba(0,0,0,0.95), inset 0 0 80px rgba(0,0,0,0.8)'
                }}
              ></div>
              
              {/* SUBTLE DREAM GLOW */}
              <div 
                className="absolute inset-0 -m-16 rounded-full"
                style={{ 
                  zIndex: 2,
                  background: 'radial-gradient(circle, rgba(79,70,229,0.6) 0%, rgba(65,105,225,0.4) 40%, transparent 70%)',
                  filter: 'blur(60px)'
                }}
              ></div>
              
              {/* LOGO - THE BALL IS THE BUTTON */}
              <motion.img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/48ca17dba_c44b0deb.png"
                alt="Click to Meet The Dream Team"
                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className="relative w-48 sm:w-56 md:w-64 lg:w-72 h-auto dream-team-logo-glow"
                style={{ 
                  zIndex: 100,
                  pointerEvents: 'auto',
                  display: 'block',
                  visibility: 'visible',
                  opacity: 1
                }}
                loading="lazy"
                decoding="async"
                draggable="false"
              />

              {/* SUBTLE TEXT */}
              <motion.p 
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="relative mt-6 text-white text-sm md:text-base font-black uppercase tracking-[0.3em] drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" 
                style={{ zIndex: 100 }}
              >
                ↑ CLICK THE BALL ↑
              </motion.p>
            </motion.div>
          </Link>
        </div>
      </motion.section>

      {/* ROSTER ROLES - BELOW COURT */}
      <div className="relative w-full max-w-5xl mt-12 mb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        {[
          { name: 'Alfred', role: 'Point Guard (Floor General)', desc: 'Orchestrates the chain, calls the plays, enforces execution order so every touch has purpose.' },
          { name: 'Claude', role: 'Shooting Guard (Closer)', desc: 'Pure shot-maker on hard problems: deep reasoning, constraints, proofs. When it has to be right, the ball goes here.' },
          { name: 'Gemini', role: 'Power Forward (Matchup Nightmare)', desc: 'Multimodal force that bangs inside with data and stretches the floor with text, vision, code, and context.' },
          { name: 'Copilot', role: 'Small Forward (Two-Way Wing)', desc: 'Does the dirty work across the floor: enterprise integration, refactors, PRs, and safe deployment at scale.' },
          { name: 'Perplexity', role: 'Center (Rim Protector)', desc: 'Lives on truth—rebounds live data, blocks hallucinations, cleans every possession at the source.' },
          { name: 'Cursor', role: 'Sixth Man (Spark Plug & Binder)', desc: 'Comes off the bench and binds the stack—wires Alfred\'s plays into Claude, proxies Gemini, pipes through Copilot, feeds Perplexity clean looks.' }
        ].map((player, idx) => {
          // Alternating directions for visual variety
          const directions = [
            { x: -60, y: 30 },
            { x: 0, y: 50 },
            { x: 60, y: 30 },
            { x: -60, y: 30 },
            { x: 0, y: 50 },
            { x: 60, y: 30 }
          ];
          const dir = directions[idx];
          
          return (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 50, scale: 0.85 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ 
                duration: 1, 
                delay: 0.7 + (idx * 0.12),
                ease: [0.16, 1, 0.3, 1]
              }}
              whileHover={{ y: -8, scale: 1.03, boxShadow: "0 0 40px rgba(59,130,246,0.5)" }}
              className="p-6 rounded-xl bg-black/60 border-2 border-blue-500/40 backdrop-blur-md hover:border-blue-400 transition-colors duration-300"
            >
              <h3 className="text-xl font-black text-blue-400 mb-2">{player.name}</h3>
              <p className="text-sm text-white/90 font-bold mb-3">{player.role}</p>
              <p className="text-sm text-white/80 leading-relaxed">{player.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}