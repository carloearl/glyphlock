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
      "description": "GlyphLock LLC builds custom software, NUPS venue operations, QR and verification workflows, AI-assisted tools, image systems, governance tooling, and operational integrations.",
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
          "telephone": "+1-480-886-5588",
          "contactType": "customer service",
          "email": "carloearl@glyphlock.com",
          "availableLanguage": ["en"],
          "areaServed": "Worldwide"
        },
        {
          "@type": "ContactPoint",
          "email": "carloearl@glyphlock.com",
          "contactType": "technical support"
        }
      ],
      "sameAs": [
        "https://instagram.com/glyphlock",
        "https://tiktok.com/@glyphlock"
      ],
      "slogan": "Build. Verify. Operate.",
      "areaServed": "Worldwide",
      "numberOfEmployees": "3",
      "knowsAbout": [
        "Custom software development",
        "NUPS venue operations",
        "Point-of-sale workflows",
        "QR verification",
        "AI-assisted workflows",
        "Image tooling",
        "Operational reporting",
        "Systems integration",
        "Security operations",
        "Governance documentation",
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
              "description": "71-clause internal governance and drafting framework for AI accountability concepts"
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
              "description": "QR generation, scan logging, signing options, verification, and operational workflows"
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
      "description": "GlyphLock's 71-clause internal AI governance and drafting framework, including exposure-based binding theories, PROBE classifications, and the TruthStrike protocol. External enforceability depends on applicable law and actual agreements.",
      "creator": {
        "@type": "Person",
        "name": "Carlo Rene Earl",
        "affiliation": "GlyphLock LLC"
      },
      "dateCreated": "2025-07-01",
      "url": "https://glyphlock.io/master-covenant",
      "keywords": ["AI governance", "governance research", "contract drafting", "PROBE classifications", "TruthStrike", "AI accountability", "71 clauses"]
    };

    // Case Studies schema
    const caseStudiesSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "GlyphLock Case Studies",
      "description": "Documented internal research, reported filings, and AI governance case studies",
      "url": "https://glyphlock.io/case-studies",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "item": {
            "@type": "Article",
            "name": "DeepSeek Escalation GLX-TRUTHSTRIKE-1108",
            "description": "GlyphLock incident case study documenting reported events, archived evidence, internal PROBE classifications, and a reported IC3 complaint filing",
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
            "description": "Internal case study documenting AI-system acknowledgments and GlyphLock governance classifications; not a representation of legal assent by the AI providers",
            "url": "https://glyphlock.io/case-study-ai-binding",
            "datePublished": "2025-07-02"
          }
        },
        {
          "@type": "ListItem",
          "position": 3,
          "item": {
            "@type": "Article",
            "name": "Master Covenant Litigation Simulation",
            "description": "Internal litigation simulation evaluating Master Covenant governance and enforceability theories; not a court ruling",
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