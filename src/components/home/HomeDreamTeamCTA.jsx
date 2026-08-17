import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, useInView } from "framer-motion";
import NebulaNodeField from "@/components/home/NebulaNodeField";
import BallEnergyFX from "@/components/home/BallEnergyFX";

export default function HomeDreamTeamCTA() {
  const containerRef = useRef(null);
  useInView(containerRef, { once: true, amount: 0.4 });
  const isInView = true; // always render content

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center px-4 overflow-hidden" style={{ maxWidth: '100vw' }}>
      
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
        className="relative w-full mx-auto max-w-5xl"
        style={{ maxWidth: 'min(1280px, calc(100vw - 32px))' }}
      >
        
        {/* ELECTRIC NEBULA NODE FIELD BACKDROP — edge-faded, no panel */}
        <div className="relative w-full aspect-[21/9]">
          <NebulaNodeField />
        </div>

        {/* BUTTON WITH GLOW - ON COURT */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <Link 
            to={createPageUrl("DreamTeam")} 
            className="group block"
          >
            <motion.div 
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 140, damping: 20 }}
              className="relative cursor-pointer flex flex-col items-center will-change-transform" 
              style={{ 
                isolation: 'isolate', 
                pointerEvents: 'auto',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              
              {/* SUBTLE DREAM GLOW */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{ 
                  zIndex: 2,
                  background: 'radial-gradient(circle, rgba(79,70,229,0.55) 0%, rgba(65,105,225,0.32) 42%, transparent 68%)',
                  filter: 'blur(38px)'
                }}
              ></div>
              
              {/* ELECTRIC ENERGY RIG (role ring reveals on hover) */}
              <BallEnergyFX />

              {/* LOGO - THE BALL IS THE BUTTON */}
              <motion.img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/48ca17dba_c44b0deb.png"
                alt="Click to Meet The Dream Team"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="relative w-48 sm:w-56 md:w-64 lg:w-72 h-auto will-change-transform dream-team-logo-glow transition-[filter] duration-700 group-hover:[filter:drop-shadow(0_0_26px_rgba(34,211,238,.9))_drop-shadow(0_0_52px_rgba(217,70,239,.6))_saturate(1.5)]"
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
                className="relative mt-2 text-white text-sm md:text-base font-black uppercase tracking-[0.3em] drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" 
                style={{ zIndex: 100 }}
              >
                ↑ CLICK THE BALL ↑
              </motion.p>

              {/* HIDDEN UNTIL HOVER */}
              <p
                className="relative mt-3 translate-y-2 rounded-full border border-cyan-200/60 bg-black/70 px-4 py-1.5 font-mono text-[10px] font-black tracking-[.28em] text-cyan-100 opacity-0 shadow-[0_0_26px_rgba(34,211,238,.5)] backdrop-blur-md transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
                style={{ zIndex: 100 }}
              >
                MEET THE DREAM TEAM →
              </p>
            </motion.div>
          </Link>
        </div>
      </motion.section>

      {/* ROSTER ROLES - BELOW COURT */}
      <div className="relative w-full max-w-5xl mt-12 mb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-4" style={{ maxWidth: 'min(1280px, 100%)' }}>
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