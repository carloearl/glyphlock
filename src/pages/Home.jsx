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
        title="Quantum-Resistant Encryption Platform | GlyphLock Security LLC"
        description="GlyphLock Security LLC delivers enterprise-grade quantum-resistant cybersecurity architecture, combining post-quantum encryption, AI-powered threat detection, visual cryptography, secure QR infrastructure, and the Master Covenant governance framework."
        keywords="quantum-resistant encryption, post-quantum cryptography, AI cybersecurity, enterprise security platform, visual cryptography, secure QR codes, blockchain security, AI governance framework, Master Covenant, GlyphLock Security, threat detection AI, zero-trust architecture"
        url="/"
      />
      
      {/* SEO H1 - Hidden but crawlable */}
      <h1 className="sr-only">GlyphLock Security — Enterprise Quantum-Resistant Cybersecurity Architecture</h1>

      <main className="w-full relative" style={{ background: 'transparent' }}>
        
        {/* Bootstrap Quote + Hero Section */}
        <section className="w-full">
          <div className="w-full text-center pt-6 sm:pt-8 pb-2 px-4 relative overflow-hidden">
            <p className="text-sm sm:text-base md:text-lg font-semibold leading-relaxed max-w-3xl mx-auto text-white/90 uppercase tracking-[3px]">
              Enterprise-Grade Quantum-Resistant Security Architecture
            </p>
            <p className="text-xs text-white/60 mt-2 tracking-widest uppercase">
              Post-Quantum Encryption · AI Governance · Zero-Trust Infrastructure
            </p>
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