import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import QrStudio from "@/components/qr/QrStudio";
import SEOHead from "@/components/SEOHead";
import HelpPanel from '@/components/global/HelpPanel';

/**
 * UNIFIED QR PAGE - /qr
 * Single authoritative QR route combining:
 * - Full QrStudio (OG Engine) with all tabs
 * - Basic Mode, Advanced Mode, Steganography Mode
 * 
 * Modes available via URL params:
 * - /qr (default: basic/create)
 * - /qr?tab=create
 * - /qr?tab=preview
 * - /qr?tab=customize
 * - /qr?tab=hotzones
 * - /qr?tab=stego
 * - /qr?tab=security
 * - /qr?tab=analytics
 * - /qr?tab=bulk
 * - /qr?mode=advanced
 */
export default function Qr() {
  const location = useLocation();
  const [initialTab, setInitialTab] = useState("create");
  const [advancedMode, setAdvancedMode] = useState(false);

  useEffect(() => {
    // Parse URL params for tab and mode
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    const modeParam = params.get("mode");

    const validTabs = ["create", "preview", "customize", "hotzones", "stego", "security", "analytics", "bulk"];
    if (tabParam && validTabs.includes(tabParam)) {
      setInitialTab(tabParam);
    }

    if (modeParam === "advanced") {
      setAdvancedMode(true);
    }
  }, [location.search]);

  useEffect(() => {
    // Add structured data for search engines
    const metaAI = document.createElement("meta");
    metaAI.name = "ai-agent";
    metaAI.content = "glyphlock qr studio unified";
    document.head.appendChild(metaAI);

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "qr-unified-schema";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "GlyphLock QR Studio",
      "description": "Military-grade QR code generation with anti-quishing protection, steganography, hot zones, and blockchain security. Unified QR system with 90+ payload types.",
      "url": "https://glyphlock.io/qr",
      "applicationCategory": "SecurityApplication",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Free tier with premium features"
      },
      "featureList": [
        "QR Code Generation",
        "Anti-Quishing Protection",
        "Steganography Embedding",
        "Hot Zone Interactive Areas",
        "Risk Analysis",
        "Bulk Generation",
        "Analytics Dashboard",
        "90+ Payload Types",
        "Dynamic QR Codes"
      ],
      "provider": {
        "@type": "Organization",
        "name": "GlyphLock Security LLC"
      }
    });
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(metaAI)) document.head.removeChild(metaAI);
      const existingScript = document.getElementById("qr-unified-schema");
      if (existingScript) document.head.removeChild(existingScript);
    };
  }, []);

  return (
    <>
      <HelpPanel
        title="QR Studio Guide"
        sections={[
          {
            title: 'Basics',
            content: [
              { heading: 'What This Does', text: 'Generate QR codes with customizable designs, payload types, and security features. Supports URLs, text, email, phone, WiFi, and 90+ other formats.' },
              { heading: 'Quick Start', text: 'Select payload type. Enter data (URL, text, etc.). Customize colors, logo, and error correction. Click generate. Download QR code as PNG or SVG.' },
              { heading: 'Scan Accuracy', text: 'Error correction levels: L (7%), M (15%), Q (25%), H (30%). Higher levels allow scanning even when QR code is partially damaged.' }
            ]
          },
          {
            title: 'Features',
            content: [
              { heading: 'Payload Types', text: 'URL, plain text, email, phone, SMS, WiFi credentials, vCard contact, event/calendar, location coordinates, and custom JSON payloads.' },
              { heading: 'Customization', text: 'Adjust foreground/background colors. Upload custom logo (centered, respects error correction). Set size and margin.' },
              { heading: 'Hot Zones', text: 'Advanced: Define interactive regions within QR code for multi-action codes. Requires special scanner or app.' },
              { heading: 'Security Analysis', text: 'AI-powered threat detection scans payloads for phishing, malware, and suspicious patterns before generation.' }
            ]
          },
          {
            title: 'Diagnostics',
            content: [
              { heading: 'Contrast Score', text: 'Measures foreground/background contrast. Scores below 60% may cause scan failures. Use high-contrast colors for reliability.' },
              { heading: 'Quiet Zone', text: 'White space border around QR code. Required for proper scanning. System validates automatically.' },
              { heading: 'Payload Resolution', text: 'Shows which payload slots are accepted or rejected based on rules and conditions. Useful for dynamic QR codes.' }
            ]
          }
        ]}
      />
      <SEOHead
        title="GlyphLock QR Studio | Secure QR Code Generator with Anti-Quishing Protection"
        description="Create secure QR codes with GlyphLock's unified QR Studio. Features anti-quishing protection, steganography, hot zones, 90+ payload types, and security scanning."
        keywords="QR code generator, secure QR codes, anti-quishing, steganography QR, QR security, hot zones QR, bulk QR generation, GlyphLock QR Studio, dynamic QR codes"
        url="/qr"
      />
      <div className="min-h-screen text-white relative overflow-x-hidden w-full" style={{ background: 'transparent', pointerEvents: 'auto' }}>
        <div className="relative z-10 py-4 md:py-8 w-full overflow-x-hidden" style={{ pointerEvents: 'auto' }}>
          <QrStudio initialTab={initialTab} />
        </div>
      </div>
    </>
  );
}