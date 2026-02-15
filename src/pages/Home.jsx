import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import HeroSection from '@/components/home/HeroSection';
import HeroContent from '@/components/home/HeroContent';
import HomeDreamTeamCTA from '@/components/home/HomeDreamTeamCTA';
import ServicesGrid from '@/components/home/ServicesGrid';
import CTASection from '@/components/home/CTASection';
import TechnologyMarquee from '@/components/TechnologyMarquee';
import CountdownPill from '@/components/marketing/CountdownPill';
import SEOHead from '@/components/SEOHead';

const useScrollEffect = (sectionRef) => {
  const [style, setStyle] = useState({ transform: 'perspective(1000px)', opacity: 1 });

  useEffect(() => {
    // Disable scroll effects on mobile for performance
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      return;
    }

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (sectionRef.current) {
            const { top, height } = sectionRef.current.getBoundingClientRect();
            const screenHeight = window.innerHeight;
            const elementCenter = top + height / 2;
            const screenCenter = screenHeight / 2;
            const distance = screenCenter - elementCenter;
            const factor = distance / (screenCenter * 1.5);

            let rotation = 0;
            let scale = 1;
            let opacity = 1;

            if (factor < 0) {
              const progress = Math.max(0, Math.min(1, (1 + factor) * 1.5));
              rotation = (1 - progress) * 10;
              scale = 0.95 + (progress * 0.05);
              opacity = Math.max(0.5, progress);
            } else if (factor > 0) {
              const progress = Math.min(1, factor * 1.5);
              rotation = -progress * 10;
              scale = 1 - (progress * 0.05);
              opacity = Math.max(0.5, 1 - progress);
            }

            setStyle({
              transform: `perspective(1000px) rotateX(${rotation}deg) scale(${scale})`,
              opacity: opacity,
            });
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionRef]);

  return style;
};

const ScrollSection = ({ children, className = "" }) => {
  const sectionRef = useRef(null);
  const style = useScrollEffect(sectionRef);
  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  return (
    <div ref={sectionRef} className={`w-full py-16 md:py-20 lg:py-24 ${className}`}>
      <div style={isMobile ? {} : style} className={isMobile ? '' : 'transition-all duration-500 ease-out'}>
        {children}
      </div>
    </div>
  );
};

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (!isMobile) {
      document.documentElement.style.scrollBehavior = 'smooth';
    } else {
      // Disable scroll snap and perspective effects on mobile
      document.documentElement.style.scrollBehavior = 'auto';
      document.body.style.scrollSnapType = 'none';
    }
    
    // Faster initial load - just check if DOM is ready
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => {
      document.documentElement.style.scrollBehavior = '';
      clearTimeout(timer);
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-900">
        <div className="text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            {/* Outer ring */}
            <motion.div 
              className="absolute inset-0 border-[3px] border-blue-500/20 border-t-blue-400 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              style={{ boxShadow: '0 0 20px rgba(59,130,246,0.5)' }}
            />
            {/* Middle ring */}
            <motion.div 
              className="absolute inset-2 border-[3px] border-indigo-500/20 border-t-indigo-400 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
              style={{ boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}
            />
            {/* Inner pulse */}
            <motion.div 
              className="absolute inset-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full"
              animate={{ scale: [0.8, 1, 0.8], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{ boxShadow: '0 0 25px rgba(59,130,246,0.8)' }}
            />
          </div>
          <motion.h2 
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-xl font-black text-white tracking-wide"
          >
            GLYPHLOCK
          </motion.h2>
          <p className="text-sm text-blue-300 font-medium">Initializing Protocol...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="GlyphLock - Protected Creative Ecosystem | QR Identity, Site Building & Covenant Architecture"
        description="GlyphLock is an open framework for verified digital environments. QR-based identity, AI site building, Master Covenant authorship proof, and blockchain-anchored creative infrastructure for limitless construction."
        keywords="GlyphLock, creative ecosystem, QR identity, site building framework, Master Covenant, verified ownership, digital authorship, blockchain verification, open source web infrastructure, creative sovereignty"
        url="/"
      />
      
      {/* SEO H1 - Hidden but crawlable */}
      <h1 className="sr-only">GlyphLock - Protected Creative Ecosystem for Verified Digital Worlds</h1>

      <main className="w-full relative" style={{ background: 'transparent' }}>
        
        {/* Bootstrap Quote + Hero Section */}
        <section className="w-full">
          <div className="w-full text-center pt-6 sm:pt-8 pb-2 px-4 relative overflow-hidden">
            {/* Ambient glow orbs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse, rgba(87,61,255,0.25) 0%, rgba(59,130,246,0.12) 40%, transparent 70%)',
                filter: 'blur(40px)',
                animation: 'quoteGlow 4s ease-in-out infinite',
              }}
            />
            <div className="absolute top-1/2 left-[30%] -translate-y-1/2 w-[250px] h-[120px] rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse, rgba(168,60,255,0.2) 0%, transparent 70%)',
                filter: 'blur(50px)',
                animation: 'quoteGlow 5s ease-in-out 1s infinite',
              }}
            />
            <div className="absolute top-1/2 right-[25%] -translate-y-1/2 w-[200px] h-[100px] rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse, rgba(6,182,212,0.18) 0%, transparent 70%)',
                filter: 'blur(45px)',
                animation: 'quoteGlow 6s ease-in-out 2s infinite',
              }}
            />

            {/* Horizontal light beam */}
            <div className="absolute top-1/2 left-0 right-0 h-[1px] pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 5%, rgba(87,61,255,0.4) 30%, rgba(6,182,212,0.5) 50%, rgba(168,60,255,0.4) 70%, transparent 95%)',
                boxShadow: '0 0 20px rgba(87,61,255,0.4), 0 0 40px rgba(6,182,212,0.2)',
                animation: 'beamPulse 3s ease-in-out infinite',
              }}
            />

            <blockquote className="max-w-3xl mx-auto relative z-10">
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="text-sm sm:text-base md:text-lg italic leading-relaxed"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(147,197,253,0.9) 50%, rgba(255,255,255,0.75) 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: 'none',
                  filter: 'drop-shadow(0 0 12px rgba(87,61,255,0.3))',
                }}
              >
                "We didn't wait for permission. We didn't ask for funding. We built it from nothing —
                <span style={{
                  background: 'linear-gradient(135deg, #06b6d4 0%, #818cf8 50%, #a78bfa 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700,
                  fontStyle: 'normal',
                  filter: 'drop-shadow(0 0 16px rgba(6,182,212,0.5))',
                }}> and we own every line.</span>"
              </motion.p>
              <motion.footer 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.4 }}
                className="mt-3 text-[10px] sm:text-xs uppercase tracking-[3px] font-semibold"
                style={{
                  background: 'linear-gradient(90deg, rgba(87,61,255,0.6), rgba(6,182,212,0.5), rgba(168,60,255,0.5))',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 8px rgba(87,61,255,0.3))',
                }}
              >
                — GlyphLock Founding Protocol · Bootstrapped Since Day One
              </motion.footer>
            </blockquote>

            <style>{`
              @keyframes quoteGlow {
                0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
                50% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
              }
              @keyframes beamPulse {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 0.8; }
              }
            `}</style>
          </div>

          <ScrollSection>
            <HeroSection />
          </ScrollSection>
          
          <div className="flex justify-center -mt-8">
            <CountdownPill />
          </div>
        </section>

        {/* Value Proposition */}
        <ScrollSection className="container-responsive">
          <HeroContent />
        </ScrollSection>

        {/* Dream Team CTA */}
        <ScrollSection className="container-responsive">
          <HomeDreamTeamCTA />
        </ScrollSection>

        {/* Services Overview */}
        <ScrollSection className="container-responsive">
          <ServicesGrid />
        </ScrollSection>

        {/* Technology Partners */}
        <ScrollSection>
          <TechnologyMarquee />
        </ScrollSection>

        {/* Final Call to Action */}
        <ScrollSection className="container-responsive">
          <CTASection />
        </ScrollSection>
      </main>
    </>
  );
}