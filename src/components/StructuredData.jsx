import { useEffect } from "react";

export default function StructuredData({ type = "Organization", data = {} }) {
  useEffect(() => {
    const defaultOrgData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "GlyphLock LLC",
      "description": "GlyphLock connects secure image carriers, structured QR workflows, governed AI assistance, NUPS venue operations, value records, integrations, and governance through one evidence architecture.",
      "url": window.location.origin,
      "logo": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/d92107808_glyphlock-3d-logo.png",
      "foundingDate": "2025-05",
      "founders": [{
        "@type": "Person",
        "name": "Carlo Rene Earl",
        "jobTitle": "Founder, Chief Executive Officer & Product Architect"
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
      "keywords": "GlyphLock, evidence infrastructure, secure image carriers, LSB image carrier, Secure QR Studio, 91 QR payload types, GlyphBot, automated DJ, NUPS, venue operations, GlyphBucks, API integration, SDK integration, governance"
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