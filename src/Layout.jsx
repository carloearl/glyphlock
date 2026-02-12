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
                { heading: 'Quick Actions', text: 'Press ? key anytime to open this help guide. Use GlyphBot Jr (right side) for instant AI assistance on any page.' },
                { heading: 'Account Security', text: 'Enable MFA (Multi-Factor Authentication) from your profile menu → Account Security for enhanced protection.' }
              ]
            },
            {
              title: 'QR Studio',
              content: [
                { heading: 'Create Secure QR Codes', text: 'QR Studio lets you create quantum-resistant QR codes with credentialed payloads. Navigate to Tools → QR Studio to begin.' },
                { heading: 'Multi-Slot Payloads', text: 'Add multiple payload slots with different credential levels (public, authenticated, admin). Each slot can contain URLs, vCards, WiFi credentials, or custom data.' },
                { heading: 'Design Customization', text: 'Customize colors, add logos, adjust error correction levels, and preview your QR code in real-time before downloading.' },
                { heading: 'Analytics & Tracking', text: 'Track scans, view analytics, and monitor QR code performance from the QR Vault panel.' }
              ]
            },
            {
              title: 'Image Lab',
              content: [
                { heading: 'AI Image Generation', text: 'Generate high-quality images using AI. Enter prompts, upload reference images, and adjust advanced controls like seed, creativity, and quality mode.' },
                { heading: 'Interactive Hotspots', text: 'Add clickable zones to any image. Upload an image, click to add hotspots, and configure actions like opening URLs, showing modals, or triggering custom events.' },
                { heading: 'Share & Export', text: 'Generate shareable links for interactive images or download them for use in presentations, websites, and marketing materials.' },
                { heading: 'Prompt Engineering', text: 'Use the AI Expand feature to enhance your prompts. Upload reference images to extract features and apply styles to new generations.' }
              ]
            },
            {
              title: 'GlyphBot AI',
              content: [
                { heading: 'AI Assistant', text: 'GlyphBot is your security-focused AI assistant. Access it from Tools → GlyphBot to ask questions, run audits, and get technical guidance.' },
                { heading: 'Multiple Personas', text: 'Switch between personas: Security Architect, Code Debugger, Site Auditor, and more. Each persona specializes in different tasks.' },
                { heading: 'Website Audits', text: 'Run comprehensive security audits on any website. GlyphBot analyzes vulnerabilities, performance, SEO, and compliance issues.' },
                { heading: 'Voice Assistance', text: 'Enable text-to-speech to hear responses. Customize voice speed, pitch, and provider from the settings panel.' }
              ]
            },
            {
              title: 'Site Builder & SIE',
              content: [
                { heading: 'AI-Powered Site Building', text: 'Describe your website vision and let AI generate the structure, pages, and components. Access via Tools → Site Builder.' },
                { heading: 'SIE Architecture', text: 'System Intelligence Engine (SIE) scans your entire application architecture, analyzing routes, components, features, and dependencies.' },
                { heading: 'Automated Remediation', text: 'Get AI-generated fixes for detected issues. Review, approve, or modify suggestions before applying changes.' },
                { heading: 'Scan History', text: 'Track all scans, compare results over time, and export detailed audit reports for compliance and documentation.' }
              ]
            },
            {
              title: 'Security & Privacy',
              content: [
                { heading: 'Role-Based Access', text: 'All features respect user roles. Admins have full access, while regular users see only their own data and permitted features.' },
                { heading: 'API Key Management', text: 'Generate API keys from Command Center → API Keys. Each key can have custom permissions and can be rotated or revoked anytime.' },
                { heading: 'MFA Protection', text: 'Enable Multi-Factor Authentication from Account Security. Use authenticator apps like Google Authenticator or Authy for 2FA codes.' },
                { heading: 'Trusted Devices', text: 'Mark devices as trusted to skip MFA prompts. Revoke access to any device from the Account Security panel.' },
                { heading: 'Data Encryption', text: 'All data is encrypted at rest and in transit. Sensitive information like API keys uses additional encryption layers.' }
              ]
            },
            {
              title: 'Blockchain Tools',
              content: [
                { heading: 'Hash Generation', text: 'Create SHA-256, MD5, and other cryptographic hashes. Access via Tools → Blockchain in the navigation.' },
                { heading: 'Merkle Trees', text: 'Build and verify Merkle trees for data integrity. Perfect for audit trails and tamper-proof records.' },
                { heading: 'Proof Export', text: 'Export blockchain proofs as JSON bundles for verification. Share immutable records with stakeholders.' },
                { heading: 'Verification', text: 'Verify blockchain proofs by uploading proof bundles. Instantly validate data integrity and authenticity.' }
              ]
            },
            {
              title: 'Tips & Shortcuts',
              content: [
                { heading: 'Keyboard Shortcuts', text: 'Press ? to open help guide. Use Ctrl/Cmd + K for quick navigation. Tab through forms for faster data entry.' },
                { heading: 'Mobile Access', text: 'GlyphLock is fully responsive. Access all features from mobile devices with optimized touch interfaces.' },
                { heading: 'Save Your Work', text: 'Most tools auto-save your progress. Look for the save icon or status indicator in the top-right of panels.' },
                { heading: 'Export & Share', text: 'Export QR codes, images, audit reports, and blockchain proofs. Generate shareable links for collaboration.' },
                { heading: 'Need Help?', text: 'Use GlyphBot Jr (right sidebar) for instant answers. Contact support from the footer or visit our documentation.' }
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