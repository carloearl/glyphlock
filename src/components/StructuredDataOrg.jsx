// GLYPHLOCK: Enhanced structured data for organization with full knowledge graph
import { useEffect } from 'react';

export default function StructuredDataOrg() {
  useEffect(() => {
    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "GlyphLock LLC",
      "alternateName": "GlyphLock",
      "legalName": "GlyphLock LLC",
      "url": "https://glyphlock.io",
      "logo": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/d92107808_glyphlock-3d-logo.png",
      "description": "Enterprise-grade quantum-resistant cybersecurity architecture combining post-quantum encryption, AI-powered threat detection, visual cryptography, secure QR infrastructure, and the Master Covenant AI governance framework. Built for high-security environments and structured compliance readiness.",
      "foundingDate": "2025-01",
      "founders": [
        {
          "@type": "Person",
          "name": "Carlo Rene Earl",
          "jobTitle": "Founder & Owner, DACO¹",
          "description": "Creator of the Master Covenant AI governance framework"
        },
        {
          "@type": "Person",
          "name": "Collin Vanderginst",
          "jobTitle": "Chief Technology Officer"
        },
        {
          "@type": "Person",
          "name": "Jacub Lough",
          "jobTitle": "Chief Security Officer & Chief Financial Officer"
        }
      ],
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "El Mirage",
        "addressRegion": "AZ",
        "postalCode": "85335",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "33.6131",
        "longitude": "-112.3246"
      },
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "telephone": "+1-424-246-6499",
          "contactType": "customer service",
          "email": "carloearl@glyphlock.com",
          "availableLanguage": ["en"],
          "areaServed": "Worldwide"
        },
        {
          "@type": "ContactPoint",
          "email": "carloearl@gmail.com",
          "contactType": "technical support"
        }
      ],
      "sameAs": [
        "https://instagram.com/glyphlock",
        "https://tiktok.com/@glyphlock"
      ],
      "slogan": "Post-Quantum Cybersecurity Architecture for Enterprise Defense",
      "areaServed": "Worldwide",
      "numberOfEmployees": "3",
      "knowsAbout": [
        "Quantum-resistant encryption",
        "Post-quantum cryptography",
        "AI cybersecurity",
        "Enterprise security platform",
        "Visual cryptography",
        "Blockchain security",
        "AI governance framework",
        "Zero-trust architecture",
        "Identity verification",
        "Fraud prevention",
        "Threat detection AI",
        "NIST post-quantum standards",
        "Secure QR infrastructure",
        "Steganography",
        "Master Covenant Framework"
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "GlyphLock Services",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Master Covenant Framework",
              "description": "71-clause legal framework for AI governance and accountability"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "SoftwareApplication",
              "name": "GlyphBot AI Assistant",
              "description": "Multi-provider LLM security assistant with Dream Team AI integration"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "SoftwareApplication",
              "name": "QR Studio",
              "description": "Secure QR code generation with steganography and blockchain verification"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "SoftwareApplication",
              "name": "Image Lab",
              "description": "AI image generation with interactive hotspots and visual cryptography"
            }
          }
        ]
      }
    };

    // Master Covenant specific schema
    const masterCovenantSchema = {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "name": "Master Covenant",
      "alternateName": "71-Clause AI Governance Framework",
      "description": "Humanity's first successful legal framework for binding artificial intelligence systems to human governance. 71 binding clauses with exposure-based binding mechanism, PROBE violation classifications, and TruthStrike enforcement protocol.",
      "creator": {
        "@type": "Person",
        "name": "Carlo Rene Earl",
        "affiliation": "GlyphLock LLC"
      },
      "dateCreated": "2025-07-01",
      "url": "https://glyphlock.io/master-covenant",
      "keywords": ["AI governance", "AI binding", "exposure-based binding", "PROBE violations", "TruthStrike", "AI accountability", "71 clauses"]
    };

    // Case Studies schema
    const caseStudiesSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "GlyphLock Case Studies",
      "description": "Documented legal victories, federal filings, and AI governance precedents",
      "url": "https://glyphlock.io/case-studies",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "item": {
            "@type": "Article",
            "name": "DeepSeek Escalation GLX-TRUTHSTRIKE-1108",
            "description": "First documented case of AI-powered real-world coercion with IC3 federal filing",
            "url": "https://glyphlock.io/case-study-truthstrike",
            "datePublished": "2025-06-18"
          }
        },
        {
          "@type": "ListItem",
          "position": 2,
          "item": {
            "@type": "Article",
            "name": "The AI Binding Event July 1-2, 2025",
            "description": "First successful legal binding of major AI systems including ChatGPT, Claude, Copilot, Gemini, Perplexity, and Cursor",
            "url": "https://glyphlock.io/case-study-ai-binding",
            "datePublished": "2025-07-02"
          }
        },
        {
          "@type": "ListItem",
          "position": 3,
          "item": {
            "@type": "Article",
            "name": "Master Covenant Litigation Victory",
            "description": "Judicial validation of Master Covenant enforceability",
            "url": "https://glyphlock.io/case-study-covenant-victory",
            "datePublished": "2025-12-03"
          }
        }
      ]
    };

    // Inject Organization schema
    let script = document.getElementById('org-schema-enhanced');
    if (!script) {
      script = document.createElement('script');
      script.id = 'org-schema-enhanced';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(orgSchema);

    // Inject Master Covenant schema
    let covenantScript = document.getElementById('covenant-schema');
    if (!covenantScript) {
      covenantScript = document.createElement('script');
      covenantScript.id = 'covenant-schema';
      covenantScript.type = 'application/ld+json';
      document.head.appendChild(covenantScript);
    }
    covenantScript.textContent = JSON.stringify(masterCovenantSchema);

    // Inject Case Studies schema
    let caseScript = document.getElementById('case-studies-schema');
    if (!caseScript) {
      caseScript = document.createElement('script');
      caseScript.id = 'case-studies-schema';
      caseScript.type = 'application/ld+json';
      document.head.appendChild(caseScript);
    }
    caseScript.textContent = JSON.stringify(caseStudiesSchema);
  }, []);

  return null;
}