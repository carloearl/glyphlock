import React, { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

export default function HeroSection() {
  const containerRef = useRef(null);
  useInView(containerRef, { once: true, amount: 0.4 });
  const isInView = true; // always render hero
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <div ref={containerRef} className="w-full flex justify-center px-4 sm:px-6 py-8" style={{ background: 'transparent', pointerEvents: 'auto', position: 'relative' }}>
      <motion.div 
        initial={{ opacity: 0, y: 60, scale: 0.9 }}
        animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[1200px] group"
      >
        {/* Royal Blue Glow Effect with Pulse */}
        <motion.div 
          className="absolute -inset-2 bg-gradient-to-r from-[#1E3A8A] via-[#3B82F6] to-[#1E40AF] rounded-2xl blur-xl"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: [0.3, 0.5, 0.3] } : { opacity: 0 }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          style={{ willChange: 'opacity', transform: 'translateZ(0)' }}
        />
        <div className="absolute -inset-1 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] rounded-2xl blur opacity-30" style={{ transform: 'translateZ(0)' }}></div>
        
        <div className="relative w-full rounded-[28px] overflow-hidden border-2 border-cyan-300/60 shadow-[0_0_45px_rgba(34,211,238,.42),0_0_100px_rgba(99,102,241,.32),0_0_160px_rgba(139,92,246,.16)] hover:shadow-[0_0_70px_rgba(34,211,238,.62),0_0_140px_rgba(99,102,241,.42)] transition-all duration-500" style={{ aspectRatio: '16/9', transform: 'translateZ(0)', willChange: 'box-shadow' }}>
          
          {/* Loading placeholder - Royal Blue gradient */}
          {!videoLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-900 z-20">
              <div className="text-center space-y-4">
                <div className="relative w-16 h-16 mx-auto">
                  <motion.div 
                    className="absolute inset-0 border-4 border-blue-500/30 border-t-blue-400 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div 
                    className="absolute inset-2 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                <p className="text-sm text-blue-300 font-semibold tracking-wide">Loading...</p>
              </div>
            </div>
          )}

          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="https://base44.app/api/apps/697a087fb354faebb72df54b/files/public/697a087fb354faebb72df54b/hero-poster.jpg"
            className="absolute inset-0 w-full h-full object-cover z-0"
            style={{ filter: 'brightness(1.1) contrast(1.1)', transform: 'translateZ(0)' }}
            onLoadedData={() => setVideoLoaded(true)}
            onCanPlay={() => setVideoLoaded(true)}
            onLoadedMetadata={() => setVideoLoaded(true)}
            onError={() => setVideoLoaded(true)}
            aria-label="GlyphLock futuristic systems showcase"
          >
            <source src="https://static.videezy.com/system/resources/previews/000/039/508/original/Triangle_VJ_Background_Loop.mp4" type="video/mp4" />
          </video>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-cyan-950/10 pointer-events-none z-[1]" />
          <div className="absolute inset-0 pointer-events-none z-[2] opacity-30" style={{backgroundImage:'linear-gradient(rgba(34,211,238,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.12) 1px,transparent 1px)',backgroundSize:'42px 42px',maskImage:'linear-gradient(to bottom,black,transparent 70%)'}} />
          <div className="absolute left-4 top-4 z-[3] rounded-full border border-cyan-300/50 bg-black/45 backdrop-blur-md px-4 py-2 text-[10px] sm:text-xs font-black tracking-[.22em] text-cyan-200 shadow-[0_0_22px_rgba(34,211,238,.3)]">GLYPHLOCK // SYSTEM ONLINE</div>
          
          <motion.div 
            initial={{ opacity: 0, x: 60 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-10 bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 md:bottom-3 md:right-3 lg:bottom-4 lg:right-4 flex items-center gap-2 md:gap-3"
          >
            <motion.span 
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-white font-black tracking-[0.3em] text-[10px] sm:text-xs md:text-sm uppercase hidden sm:block drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]"
            >
              CURRENT BUILD
            </motion.span>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/08025b614_gl-logo.png"
              alt="GlyphLock Secure Creative Technology Logo"
              width="120"
              height="120"
              fetchpriority="high"
              decoding="async"
              className="h-6 sm:h-8 md:h-10 lg:h-12 w-auto drop-shadow-[0_0_20px_rgba(59,130,246,0.8)]"
              style={{ transform: 'translateZ(0)' }}
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}