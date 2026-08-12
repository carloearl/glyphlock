import { useEffect } from "react";

export default function StructuredData({ type = "Organization", data = {} }) {
  useEffect(() => {
    const defaultOrgData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "GlyphLock LLC",
      "description": "AI-powered cybersecurity platform with quantum-resistant encryption, visual cryptography, blockchain security, and enterprise POS systems",
      "url": window.location.origin,
      "logo": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/d92107808_glyphlock-3d-logo.png",
      "foundingDate": "2025-05",
      "founders": [{
        "@type": "Person",
        "name": "Carlo Rene Earl",
        "jobTitle": "Founder & Chief Operations Officer"
      }],
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "El Mirage",
        "addressRegion": "AZ",
        "addressCountry": "US"
      },
      "contactPoint": [{
        "@type": "ContactPoint",
        "telephone": "+1-480-886-5588",
        "email": "carloearl@glyphlock.com",
        "contactType": "customer support",
        "areaServed": "US"
      }],
      "sameAs": [
        window.location.origin + "/about",
        window.location.origin + "/partners"
      ],
      "keywords": "cybersecurity, quantum-resistant encryption, AI security, visual cryptography, QR code security, blockchain verification, enterprise security, POS systems, threat detection, IP protection"
    };

    const structuredData = type === "Organization" ? defaultOrgData : data;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [type, data]);

  return null;
}