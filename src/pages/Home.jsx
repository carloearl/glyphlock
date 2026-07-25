import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import HeroSection from '@/components/home/HeroSection';
import HeroContent from '@/components/home/HeroContent';
import CountdownPill from '@/components/marketing/CountdownPill';
import SEOHead from '@/components/SEOHead';
import HomeDreamTeamCTA from '@/components/home/HomeDreamTeamCTA';
import ServicesGrid from '@/components/home/ServicesGrid';
import TechnologyMarquee from '@/components/TechnologyMarquee';
import PlatformCapabilities from '@/components/home/PlatformCapabilities';
import CTASection from '@/components/home/CTASection';
import ExperienceLiveSystemCTA from '@/components/demo/ExperienceLiveSystemCTA';
import WordOfTheDay from '@/components/home/WordOfTheDay';

const SectionLoader = () => (
  <div className="w-full py-20 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
  </div>
);


const ScrollSection = ({ children, className = "" }) => {
  const sectionRef = useRef(null);
  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    return (
      <div className={`w-full py-16 md:py-20 lg:py-24 ${className}`}>
        {children}
      </div>
    );
  }
  
  return (
    <div ref={sectionRef} className={`w-full py-16 md:py-20 lg:py-24 ${className}`}>
      <div className="transition-all duration-500 ease-out" style={{ transform: 'perspective(1000px)', opacity: 1 }}>
        {children}
      </div>
    </div>
  );
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      <div className="fixed inset-0 z-[99999] flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #172554, #1e1b4b, #1e3a5f)' }}>
        <div className="text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            {/* Outer ring */}
            <motion.div 
              className="absolute inset-0 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              style={{ boxShadow: '0 0 20px rgba(59,130,246,0.5)', border: '3px solid rgba(59,130,246,0.2)', borderTopColor: 'rgba(96,165,250,1)' }}
            />
            {/* Middle ring */}
            <motion.div 
              className="absolute inset-2 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
              style={{ boxShadow: '0 0 15px rgba(99,102,241,0.5)', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: 'rgba(129,140,248,1)' }}
            />
            {/* Inner pulse */}
            <motion.div 
              className="absolute inset-6 rounded-full"
              animate={{ scale: [0.8, 1, 0.8], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{ boxShadow: '0 0 25px rgba(59,130,246,0.8)', background: 'linear-gradient(to bottom right, #3b82f6, #4f46e5)' }}
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
        title="NUPS — Nexus Unified Portal System | GlyphLock"
        description="NUPS is live — the Nexus Unified Portal System for venue operations, POS, double-entry accounting, and BPAAA v3.0 compliance. Built by GlyphLock."
        keywords="NUPS, Nexus Unified Portal System, venue management, POS, point of sale, double-entry accounting, 1099 contractor payroll, driver payouts, BPAAA compliance, GlyphLock, venue operations"
        url="/"
      />
      
      {/* SEO H1 - Hidden but crawlable */}
      <h1 className="sr-only">NUPS — Nexus Unified Portal System. Live venue operations, POS, accounting & compliance by GlyphLock.</h1>

      <main className="w-full relative" style={{ background: 'transparent', position: 'relative' }}>
        
        {/* Bootstrap Quote + Hero Section */}
        <section className="w-full">
          <div className="w-full text-center pt-6 sm:pt-8 pb-2 px-4 relative overflow-hidden">
            <p className="text-sm sm:text-base md:text-lg font-semibold leading-relaxed max-w-3xl mx-auto text-white/90 uppercase tracking-[3px]">
              NUPS — Nexus Unified Portal System. Live venue operations, POS, accounting & compliance — now active.
            </p>
          </div>

          <ScrollSection>
            <HeroSection />
          </ScrollSection>

          <div className="flex justify-center py-6 px-4">
            <button
              onClick={() => navigate('/NUPSLanding')}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-black uppercase tracking-[0.15em] text-white text-sm sm:text-base transition-all"
              style={{
                background: 'linear-gradient(135deg, #1E40AF, #3B82F6)',
                boxShadow: '0 0 30px rgba(59,130,246,0.4)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 0 50px rgba(59,130,246,0.7)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 0 30px rgba(59,130,246,0.4)')}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              See The NUPS Walkthrough
            </button>
          </div>

          <div className="flex justify-center -mt-2">
            <CountdownPill />
          </div>

          <WordOfTheDay />

          <ExperienceLiveSystemCTA variant="home" />
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
        <section className="w-full py-8">
          <TechnologyMarquee />
        </section>

        {/* Platform Capabilities */}
        <PlatformCapabilities />

        {/* Final Call to Action */}
        <ScrollSection className="container-responsive">
          <CTASection />
        </ScrollSection>
      </main>
    </>
  );
}