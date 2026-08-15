import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import HeroSection from '@/components/home/HeroSection';
import HeroContent from '@/components/home/HeroContent';
import CountdownPill from '@/components/marketing/CountdownPill';
import SEOHead from '@/components/SEOHead';
import HomeDreamTeamCTA from '@/components/home/HomeDreamTeamCTA';
import ServicesGrid from '@/components/home/ServicesGrid';
import OnSiteServices from '@/components/home/OnSiteServices';
import TechServicesPreview from '@/components/home/TechServicesPreview';
import TechnologyMarquee from '@/components/TechnologyMarquee';
import PlatformCapabilities from '@/components/home/PlatformCapabilities';
import CTASection from '@/components/home/CTASection';
import WordOfTheDay from '@/components/home/WordOfTheDay';
import IntroHeader from '@/components/home/IntroHeader';
import IntroStatement from '@/components/home/IntroStatement';
import AdminNupsBypass from '@/components/home/AdminNupsBypass';
import FeaturedIntegrationsMarquee from '@/components/home/FeaturedIntegrationsMarquee';

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
      <div className={`w-full py-8 md:py-10 ${className}`}>
        {children}
      </div>
    );
  }
  
  return (
    <div ref={sectionRef} className={`w-full py-8 md:py-10 ${className}`}>
      <div className="transition-all duration-500 ease-out" style={{ transform: 'perspective(1000px)', opacity: 1 }}>
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
        title="GlyphLock — Custom Software Development | Websites, Apps & Business Systems"
        description="GlyphLock is a custom software studio. We design, build, and maintain websites, apps, and business systems — point of sale, scheduling, payouts, reporting, integrations, and AI features. Builders of the NUPS venue operations platform."
        keywords="custom software development, custom app development, custom web development, business systems, point of sale development, software studio, API integrations, AI features, NUPS, GlyphLock"
        url="/"
      />
      
      {/* SEO H1 - Hidden but crawlable */}
      <h1 className="sr-only">GlyphLock — Custom Software Development. Websites, Apps, and Business Systems Built to Order.</h1>

      <main className="w-full relative" style={{ background: 'transparent', position: 'relative' }}>
        
        {/* Introduction header — very top, below the nav bar */}
        <IntroHeader />

        {/* Featured integrations — large scrolling marquee */}
        <FeaturedIntegrationsMarquee />

        {/* Admin-only NUPS bypass entry */}
        <AdminNupsBypass />

        {/* Bootstrap Quote + Hero Section */}
        <section className="w-full">
          <ScrollSection>
            <HeroSection />
          </ScrollSection>

          {/* Statement + CTAs — below the video */}
          <div className="pt-2 pb-6">
            <IntroStatement />
          </div>

          <div className="flex justify-center py-4">
            <CountdownPill />
          </div>

          <WordOfTheDay />
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

        {/* Technology Services Preview */}
        <ScrollSection className="container-responsive">
          <TechServicesPreview />
        </ScrollSection>

        {/* On-Site Services — We Come To You */}
        <ScrollSection className="container-responsive">
          <OnSiteServices />
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