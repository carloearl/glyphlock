import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import QrStudio from "@/components/qr/QrStudio";
import SEOHead from "@/components/SEOHead";
import HelpPanel from '@/components/global/HelpPanel';

/** Unified secure QR Studio page with create, preview, customization, hot zone, steganography, security, analytics, and bulk modes. */
export default function SecureQRStudio() {
  const location = useLocation();
  const [initialTab, setInitialTab] = useState("create");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    const validTabs = ["create", "preview", "customize", "hotzones", "stego", "security", "analytics", "bulk"];
    if (tabParam && validTabs.includes(tabParam)) setInitialTab(tabParam);
  }, [location.search]);

  useEffect(() => {
    const metaAI = document.createElement("meta");
    metaAI.name = "ai-agent";
    metaAI.content = "glyphlock secure qr studio unified";
    document.head.appendChild(metaAI);

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "qr-unified-schema";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "GlyphLock Secure QR Studio",
      description: "Secure QR code generation with anti-quishing protection, steganography, hot zones, and blockchain security. Unified QR system with 90+ payload types.",
      url: "https://glyphlock.io/SecureQRStudio",
      applicationCategory: "SecurityApplication",
      operatingSystem: "Web Browser",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free tier with premium features" },
      featureList: ["QR Code Generation", "Anti-Quishing Protection", "Steganography Embedding", "Hot Zone Interactive Areas", "Risk Analysis", "Bulk Generation", "Analytics Dashboard", "90+ Payload Types", "Dynamic QR Codes"],
      provider: { "@type": "Organization", name: "GlyphLock LLC" }
    });
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(metaAI)) document.head.removeChild(metaAI);
      document.getElementById("qr-unified-schema")?.remove();
    };
  }, []);

  return (
    <>
      <HelpPanel
        title="Secure QR Studio Guide"
        sections={[
          { title: 'Basics', content: [
            { heading: 'What This Does', text: 'Generate QR codes with customizable designs, payload types, and security features. Supports URLs, text, email, phone, WiFi, and 90+ other formats.' },
            { heading: 'Quick Start', text: 'Select a payload type, enter its data, customize the design, generate the QR code, then download it as PNG or SVG.' },
            { heading: 'Scan Accuracy', text: 'Error correction levels range from L (7%) to H (30%). Higher levels allow scanning when a code is partially damaged.' }
          ]},
          { title: 'Features', content: [
            { heading: 'Payload Types', text: 'URL, text, email, phone, SMS, WiFi, vCard, events, locations, and custom JSON payloads.' },
            { heading: 'Customization', text: 'Adjust colors, upload a logo, and set size and margin.' },
            { heading: 'Hot Zones', text: 'Define interactive regions for multi-action codes.' },
            { heading: 'Security Analysis', text: 'Scan payloads for phishing, malware, and suspicious patterns before generation.' }
          ]}
        ]}
      />
      <SEOHead
        title="GlyphLock Secure QR Studio | Protected QR Code Generator"
        description="Create secure QR codes with anti-quishing protection, steganography, hot zones, 90+ payload types, and security scanning."
        keywords="secure QR code generator, anti-quishing, steganography QR, QR security, hot zones QR, bulk QR generation, GlyphLock Secure QR Studio"
        url="/SecureQRStudio"
      />
      <div className="min-h-screen text-white relative overflow-x-hidden w-full" style={{ background: 'transparent', pointerEvents: 'auto' }}>
        <div className="relative z-10 py-4 md:py-8 w-full overflow-x-hidden" style={{ pointerEvents: 'auto' }}>
          <QrStudio initialTab={initialTab} />
        </div>
      </div>
    </>
  );
}