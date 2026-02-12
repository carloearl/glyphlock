import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Shield, Lock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, useInView } from "framer-motion";

export default function HeroContent() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });

  return (
    <section ref={containerRef} className="w-full max-w-7xl mx-auto px-4 py-16 relative" style={{ background: 'transparent', pointerEvents: 'auto' }}>
      <div className="text-center mb-16">
        {/* Title - Slide from left */}
        <motion.h1 
          initial={{ opacity: 0, x: -100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-4 md:mb-6 text-white tracking-tight drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] leading-tight px-2"
        >
          BUILD <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-600 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(139,92,246,0.9)] animate-pulse">VERIFIED</span> DIGITAL WORLDS
        </motion.h1>
        
        {/* Subtitle - Slide from right */}
        <motion.p 
          initial={{ opacity: 0, x: 100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-base sm:text-lg md:text-xl lg:text-2xl text-[#00E4FF] max-w-4xl mx-auto mb-4 md:mb-6 font-bold leading-relaxed px-4"
        >
          Identity. Infrastructure. Sovereignty.
        </motion.p>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="text-sm sm:text-base md:text-lg text-gray-300 max-w-3xl mx-auto mb-3 leading-relaxed px-4"
        >
          QR based identity imaging and AI backed site architecture secured under the Master Covenant.
        </motion.p>
        
        {/* Badge - Pop up with bounce */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.7 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.4, type: "spring", stiffness: 120, damping: 14 }}
        >
          <Badge className="mb-10 bg-blue-600/10 backdrop-blur-md border-2 border-cyan-400/40 text-white px-6 py-2 shadow-[0_0_30px_rgba(6,182,212,0.5)]">
            <span className="font-black tracking-[0.2em] text-sm">OPEN SOURCE FRAMEWORK FOR CREATIVE CONTROL</span>
          </Badge>
        </motion.div>
        
        {/* CTA Buttons - Slide in from opposite sides */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
          <motion.div
            initial={{ opacity: 0, x: -80, scale: 0.85 }}
            animate={isInView ? { opacity: 1, x: 0, scale: 1 } : {}}
            transition={{ duration: 1, delay: 0.9, type: "spring", stiffness: 100, damping: 15 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to={createPageUrl("Consultation")}>
              <Button size="lg" className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-base md:text-lg px-6 md:px-8 py-6 font-black tracking-wide shadow-[0_0_35px_rgba(59,130,246,0.6)] hover:shadow-[0_0_55px_rgba(59,130,246,0.8)] transition-all duration-300 w-full sm:w-auto">
                {/* Shimmer sweep */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                />
                <span className="relative flex items-center gap-2">
                  START YOUR ECOSYSTEM
                  <motion.span
                    animate={{ x: [0, 6, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.span>
                </span>
              </Button>
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 80, scale: 0.85 }}
            animate={isInView ? { opacity: 1, x: 0, scale: 1 } : {}}
            transition={{ duration: 1, delay: 1.05, type: "spring", stiffness: 100, damping: 15 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to={createPageUrl("SecurityTools")}>
              <Button size="lg" variant="outline" className="relative overflow-hidden border-2 border-cyan-400/60 text-white hover:bg-cyan-500/20 text-base md:text-lg px-6 md:px-8 py-6 font-bold tracking-wide shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] transition-all duration-300 w-full sm:w-auto">
                {/* Animated border glow */}
                <motion.div
                  className="absolute inset-0 rounded-lg opacity-0 hover:opacity-100"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.3), transparent)',
                    backgroundSize: '200% 100%'
                  }}
                  animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <span className="relative">EXPLORE THE FRAMEWORK</span>
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Stats grid - Staggered pop-up with unique animations */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 px-4">
        {[
          { label: "AES 256 ENCRYPTION", value: "●", icon: Shield },
          { label: "POST QUANTUM READY KEYS", value: "●", icon: Lock },
          { label: "REAL TIME SITE VERIFICATION", value: "●", icon: Shield },
          { label: "PERSISTENT IDENTITY LAYER", value: "●", icon: Lock },
          { label: "ZERO TRUST ARCHITECTURE", value: "●", icon: Shield },
          { label: "INFINITE PROOF CHAIN", value: "●", icon: Lock }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          // Alternate animation directions
          const directions = [
            { x: -60, y: 40, rotate: -10 },
            { x: 60, y: 40, rotate: 10 },
            { x: -60, y: 40, rotate: 10 },
            { x: 60, y: 40, rotate: -10 }
          ];
          const dir = directions[idx];
          
          return (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ 
                duration: 0.9, 
                delay: 1.2 + (idx * 0.15),
                type: "spring",
                stiffness: 100,
                damping: 14
              }}
              whileHover={{ 
                scale: 1.08, 
                y: -8,
                boxShadow: "0 0 60px rgba(6,182,212,0.7)"
              }}
              className="bg-gradient-to-br from-blue-600/20 via-cyan-500/15 to-indigo-500/20 backdrop-blur-md border border-cyan-400/20 p-6 rounded-xl text-center shadow-[0_0_35px_rgba(6,182,212,0.4)] hover:border-cyan-400/40 transition-colors duration-300 group cursor-default"
            >
              <motion.div
                whileHover={{ rotate: 360, scale: 1.2 }}
                transition={{ duration: 0.6 }}
              >
                <Icon className="w-8 h-8 text-cyan-300 mx-auto mb-3 drop-shadow-[0_0_15px_rgba(6,182,212,1)] group-hover:text-blue-300 transition-colors duration-300" />
              </motion.div>
              <motion.div 
                className="text-3xl font-black text-white mb-2 tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.7, delay: 1.35 + (idx * 0.15), type: "spring", stiffness: 120 }}
              >
                {stat.value}
              </motion.div>
              <div className="text-sm text-cyan-100 font-bold tracking-wider">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}