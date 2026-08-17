import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

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

      {/* ROSTER ROLES */}
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