import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import SecurityMonitor from "@/components/SecurityMonitor";
import { UI } from "@/components/glyphlock/bot";
import NebulaLayer from "@/components/global/NebulaLayer";
import CursorOrb from "@/components/global/CursorOrb";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GlyphLoader from "@/components/GlyphLoader";
import MobileScalingSystem from "@/components/mobile/mobile-utils";
import HelpPanel from "@/components/global/HelpPanel";

import ThemeProvider from "@/components/ThemeProvider";
import { Badge } from "@/components/ui/badge";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import StructuredDataOrg from "@/components/StructuredDataOrg";
import SecurityHeaders from "@/components/security/SecurityHeaders";
import CrawlerFallback from "@/components/seo/CrawlerFallback";
import PrerenderHints from "@/components/seo/PrerenderHints";

const { GlyphBotJr } = UI;

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    (async () => {
      try {
        const isAuthenticated = await base44.auth.isAuthenticated();
        if (isAuthenticated) {
          const userData = await base44.auth.me();
          setUser(userData);
        }
      } catch (err) {
        console.error("Failed to get user:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      const isLocal = host === 'localhost' || host === '127.0.0.1';
      
      if (!isLocal) {
        // 1. Force non-www (canonical domain) to fix CERT_COMMON_NAME_INVALID
        if (host.startsWith('www.')) {
          const target = `https://${host.replace(/^www\./, '')}${window.location.pathname}${window.location.search}`;
          window.location.replace(target);
          return;
        }
        
        // 2. Force HTTPS
        if (window.location.protocol === 'http:') {
          window.location.replace(window.location.href.replace('http:', 'https:'));
          return;
        }
      }

      // Initialize mobile scaling system
      new MobileScalingSystem();
    }
  }, []);

  useEffect(() => {
    // Disable scroll snap on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      document.body.style.scrollSnapType = 'none';
      document.documentElement.style.scrollSnapType = 'none';
    }
    
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  if (loading) return <GlyphLoader text="Initializing Secure Environment..." />;

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleLogin = async () => {
    try {
      await base44.auth.redirectToLogin();
    } catch (err) {
      console.error("Login redirect failed:", err);
    }
  };

  return (
    <ThemeProvider>
      {/* GLYPHLOCK: Analytics, SEO & Security */}
      <GoogleAnalytics />
      <StructuredDataOrg />
      <SecurityHeaders />
      <CrawlerFallback />
      <PrerenderHints />
      
      {/* SITE-WIDE NEBULA - Absolute bottom layer */}
      <div 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: 0, 
          pointerEvents: 'none',
          touchAction: 'none',
          userSelect: 'none',
          transform: 'translateZ(0)',
          willChange: 'transform',
          backfaceVisibility: 'hidden'
        }}
      >
        <NebulaLayer intensity={1.0} />
      </div>

      {/* CURSOR ORB - Desktop only, above nebula */}
      <div 
        className="hidden md:block" 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: 1, 
          pointerEvents: 'none',
          touchAction: 'none',
          userSelect: 'none',
          transform: 'translateZ(0)',
          willChange: 'transform',
          backfaceVisibility: 'hidden'
        }}
      >
        <CursorOrb />
      </div>

      <div 
        className="min-h-screen text-white flex flex-col relative overflow-x-hidden selection:bg-[#00E4FF] selection:text-black" 
        style={{ 
          background: 'transparent',
          paddingBottom: 'env(safe-area-inset-bottom)',
          width: '100%',
          maxWidth: '100vw',
          minHeight: '100vh',
          height: 'auto',
          boxSizing: 'border-box'
        }}
      >
        <SecurityMonitor />

        {/* Version Badge - Top Right */}
        <div className="fixed top-20 right-4 z-[9997] pointer-events-none hidden md:block">
          <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-2 border-indigo-400/40 shadow-[0_0_20px_rgba(99,102,241,0.4)] text-xs font-bold px-3 py-1.5">
            Beta Version 2.0
          </Badge>
        </div>

        {/* Mobile Version Badge - Bottom Left */}
        <div className="fixed bottom-20 left-4 z-[9997] pointer-events-none md:hidden">
          <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-2 border-indigo-400/40 shadow-[0_0_20px_rgba(99,102,241,0.4)] text-[10px] font-bold px-2 py-1">
            v2.0
          </Badge>
        </div>

        {/* Navbar */}
        <div style={{ position: 'relative', zIndex: 9998, pointerEvents: 'auto' }}>
          <Navbar user={user} onLogin={handleLogin} onLogout={handleLogout} />
        </div>

        {/* Main content */}
        <main className="flex-1 relative pt-4 w-full" style={{ background: 'transparent', zIndex: 10, width: '100%', maxWidth: '100vw', boxSizing: 'border-box' }}>
          {children}
        </main>

        {/* Global Help System */}
        <HelpPanel 
          title="GlyphLock Guide"
          sections={[
            {
              title: 'Getting Started',
              content: [
                { heading: 'Welcome to GlyphLock', text: 'GlyphLock is your quantum-resistant cybersecurity platform. Navigate using the top menu to access QR Studio, Image Lab, GlyphBot AI, and more.' },
                { heading: 'Command Center', text: 'Access your admin dashboard by clicking your profile icon (top right) and selecting Command Center. Manage API keys, view analytics, and monitor security.' },
                { heading: 'Quick Actions', text: 'Use the floating GlyphBot Jr assistant (bottom right) for instant help and guidance on any page.' }
              ]
            },
            {
              title: 'Core Features',
              content: [
                { heading: 'QR Studio', text: 'Create secure, credentialed QR codes with multi-slot payloads. Access via Tools → QR Studio in the navigation menu.' },
                { heading: 'Image Lab', text: 'Generate AI images and add interactive hotspots. Click anywhere on images to create smart zones that link to URLs or trigger actions.' },
                { heading: 'GlyphBot AI', text: 'Chat with our security AI assistant. Switch personas for audits, debugging, security analysis, and more.' },
                { heading: 'Site Builder', text: 'Build and audit websites with AI assistance. Access comprehensive SIE architecture scanning.' }
              ]
            },
            {
              title: 'Security',
              content: [
                { heading: 'Authentication', text: 'All data is protected with role-based access control. Admin features require admin privileges.' },
                { heading: 'API Keys', text: 'Generate and manage API keys from Command Center. Rotate keys regularly for optimal security.' },
                { heading: 'Threat Detection', text: 'AI-powered threat detection monitors your assets automatically. View alerts in Command Center → Threats tab.' }
              ]
            }
          ]}
        />

        {/* GlyphBot Jr */}
        <div style={{ 
          position: 'fixed', 
          bottom: 0, 
          right: 0, 
          zIndex: 99999, 
          pointerEvents: 'auto !important',
          isolation: 'isolate',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          display: 'block !important',
          visibility: 'visible !important'
        }}>
          <GlyphBotJr />
        </div>

        {/* Footer - always rendered */}
        <footer className="relative overflow-hidden" style={{ zIndex: 100, pointerEvents: 'auto', isolation: 'isolate' }}>
          <Footer />
        </footer>
      </div>
    </ThemeProvider>
  );
  }