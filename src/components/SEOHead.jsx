import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getSeoData, SEO_DATA } from '@/components/seo/seoData';

export default function SEOHead({ 
  title,
  description,
  keywords,
  image = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/d92107808_glyphlock-3d-logo.png",
  ogImage = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/d92107808_glyphlock-3d-logo.png",
  url,
  type = "website"
}) {
  const location = useLocation();
  
  // Auto-resolve SEO data
  let autoData = {};
  const path = location.pathname;
  // Import SEO_DATA directly to iterate over all entries
  const allKeys = Object.keys(SEO_DATA);
  const key = allKeys.find(k => SEO_DATA[k] && SEO_DATA[k].url === path) || (path === "/" ? "Home" : null);
  
  if (key) {
      autoData = getSeoData(key);
  }

  const resolvedTitle = title || autoData.title || "Quantum-Resistant Enterprise Security Platform | GlyphLock LLC";
  const resolvedDescription = description || autoData.description || "GlyphLock LLC delivers enterprise-grade quantum-resistant cybersecurity architecture, combining post-quantum encryption, AI-powered threat detection, visual cryptography, secure QR infrastructure, and the Master Covenant governance framework. Designed for high-security environments and structured compliance alignment.";
  
  // Combine and deduplicate keywords
  const defaultKeywords = "GlyphLock LLC, quantum-resistant encryption, post-quantum cryptography, AI cybersecurity, enterprise security platform, visual cryptography, secure QR codes, blockchain security, AI governance framework, Master Covenant, GlyphLock Security, threat detection AI, zero-trust architecture, identity verification, fraud prevention, steganography tools, secure QR code generator, image encryption, NIST post-quantum standards, AI binding protocol, security operations center";
  const autoKeywords = autoData.keywords ? autoData.keywords.join(", ") : "";
  const propKeywords = Array.isArray(keywords) ? keywords.join(", ") : (keywords || "");
  
  const combinedKeywords = [propKeywords, autoKeywords, defaultKeywords]
    .filter(Boolean)
    .join(", ")
    .split(",")
    .map(k => k.trim())
    .filter((v, i, a) => a.indexOf(v) === i && v !== "") // Ensure unique and non-empty
    .join(", ");

  const resolvedKeywords = combinedKeywords;
  const resolvedSchemaType = autoData.schemaType || "WebSite";

  const siteUrl = "https://glyphlock.io";
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;

  useEffect(() => {
    // Update title
    document.title = resolvedTitle;

    // GLYPHLOCK: Enhanced favicon with multiple sizes
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.setAttribute('rel', 'icon');
      document.head.appendChild(favicon);
    }
    favicon.setAttribute('href', 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/08025b614_gl-logo.png');
    favicon.setAttribute('type', 'image/png');

    // Apple touch icon
    let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleTouchIcon) {
      appleTouchIcon = document.createElement('link');
      appleTouchIcon.setAttribute('rel', 'apple-touch-icon');
      document.head.appendChild(appleTouchIcon);
    }
    appleTouchIcon.setAttribute('href', 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/08025b614_gl-logo.png');

    // Manifest
    let manifest = document.querySelector('link[rel="manifest"]');
    if (!manifest) {
      manifest = document.createElement('link');
      manifest.setAttribute('rel', 'manifest');
      document.head.appendChild(manifest);
    }
    manifest.setAttribute('href', '/site.webmanifest');

    // Update or create meta tags
    const updateMetaTag = (name, content, property = false) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Primary Meta Tags
    updateMetaTag('title', resolvedTitle);
    updateMetaTag('description', resolvedDescription);
    updateMetaTag('keywords', resolvedKeywords);

    // Character set
    let charset = document.querySelector('meta[charset]');
    if (!charset) {
      charset = document.createElement('meta');
      charset.setAttribute('charset', 'utf-8');
      document.head.insertBefore(charset, document.head.firstChild);
    }

    // Language
    document.documentElement.setAttribute('lang', 'en');

    // GLYPHLOCK: Enhanced SEO & Security Meta Tags
    const isAdminPath = /^\/(admin|dashboard|editor|apps|modules|console|sie)/i.test(location.pathname);
    const robotsContent = isAdminPath 
      ? 'noindex, nofollow' 
      : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
    
    updateMetaTag('robots', robotsContent);
    updateMetaTag('googlebot', robotsContent);
    updateMetaTag('bingbot', robotsContent);
    updateMetaTag('author', 'GlyphLock LLC');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=5.0');
    updateMetaTag('theme-color', '#000000');
    updateMetaTag('format-detection', 'telephone=no');
    updateMetaTag('apple-mobile-web-app-capable', 'yes');
    updateMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
    updateMetaTag('apple-mobile-web-app-title', 'GlyphLock');
    updateMetaTag('application-name', 'GlyphLock Security');
    updateMetaTag('msapplication-TileColor', '#000000');
    updateMetaTag('referrer', 'strict-origin-when-cross-origin');

    // Geo tags
    updateMetaTag('geo.region', 'US-AZ');
    updateMetaTag('geo.placename', 'El Mirage');
    updateMetaTag('geo.position', '33.6131;-112.3246');
    updateMetaTag('ICBM', '33.6131, -112.3246');

    // GLYPHLOCK: Enhanced Open Graph
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:url', fullUrl, true);
    updateMetaTag('og:title', resolvedTitle, true);
    updateMetaTag('og:description', resolvedDescription, true);
    updateMetaTag('og:image', ogImage, true);
    updateMetaTag('og:image:secure_url', ogImage, true);
    updateMetaTag('og:image:width', '1200', true);
    updateMetaTag('og:image:height', '630', true);
    updateMetaTag('og:image:alt', resolvedTitle, true);
    updateMetaTag('og:image:type', 'image/png', true);
    updateMetaTag('og:site_name', 'GlyphLock Security', true);
    updateMetaTag('og:locale', 'en_US', true);
    // fb:app_id omitted — no verified FB app ID

    // GLYPHLOCK: Enhanced Twitter Cards
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:site', '@glyphlock');
    updateMetaTag('twitter:creator', '@glyphlock');
    updateMetaTag('twitter:url', fullUrl);
    updateMetaTag('twitter:title', resolvedTitle);
    updateMetaTag('twitter:description', resolvedDescription);
    updateMetaTag('twitter:image', ogImage);
    updateMetaTag('twitter:image:alt', resolvedTitle);
    updateMetaTag('twitter:domain', 'glyphlock.io');

    // Preconnect to Google Fonts for performance
    let preconnectGoogleFonts = document.querySelector('link[rel="preconnect"][href="https://fonts.googleapis.com"]');
    if (!preconnectGoogleFonts) {
      preconnectGoogleFonts = document.createElement('link');
      preconnectGoogleFonts.setAttribute('rel', 'preconnect');
      preconnectGoogleFonts.setAttribute('href', 'https://fonts.googleapis.com');
      document.head.appendChild(preconnectGoogleFonts);
    }

    let preconnectGstatic = document.querySelector('link[rel="preconnect"][href="https://fonts.gstatic.com"]');
    if (!preconnectGstatic) {
      preconnectGstatic = document.createElement('link');
      preconnectGstatic.setAttribute('rel', 'preconnect');
      preconnectGstatic.setAttribute('href', 'https://fonts.gstatic.com');
      preconnectGstatic.setAttribute('crossorigin', '');
      document.head.appendChild(preconnectGstatic);
    }

    let dnsPrefetch = document.querySelector('link[rel="dns-prefetch"][href="https://fonts.googleapis.com"]');
    if (!dnsPrefetch) {
      dnsPrefetch = document.createElement('link');
      dnsPrefetch.setAttribute('rel', 'dns-prefetch');
      dnsPrefetch.setAttribute('href', 'https://fonts.googleapis.com');
      document.head.appendChild(dnsPrefetch);
    }

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', fullUrl);

    // Sitemap links for SEO
    let sitemapLink = document.querySelector('link[rel="sitemap"]');
    if (!sitemapLink) {
      sitemapLink = document.createElement('link');
      sitemapLink.setAttribute('rel', 'sitemap');
      sitemapLink.setAttribute('type', 'application/xml');
      document.head.appendChild(sitemapLink);
    }
    sitemapLink.setAttribute('href', `${siteUrl}/sitemap.xml`);

    let llmIndexLink = document.querySelector('link[rel="alternate"][type="application/json"]');
    if (!llmIndexLink) {
      llmIndexLink = document.createElement('link');
      llmIndexLink.setAttribute('rel', 'alternate');
      llmIndexLink.setAttribute('type', 'application/json');
      document.head.appendChild(llmIndexLink);
    }
    llmIndexLink.setAttribute('href', `${siteUrl}/glyphlock-llm-index.json`);

    // Structured Data - Comprehensive Organization Schema (always present)
    let script = document.querySelector('script[type="application/ld+json"]#org-schema');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('id', 'org-schema');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "GlyphLock LLC",
      "alternateName": "GlyphLock",
      "url": siteUrl,
      "logo": image,
      "image": image,
      "description": "Enterprise-grade quantum-resistant cybersecurity architecture combining post-quantum encryption, AI-powered threat detection, visual cryptography, secure QR infrastructure, and the Master Covenant AI governance framework. Designed for structured compliance alignment.",
      "foundingDate": "2025-01",
      "founder": [
        {
          "@type": "Person",
          "name": "Carlo Rene Earl",
          "jobTitle": "Founder & Owner"
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
        "addressCountry": "US"
      },
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "telephone": "+1-424-246-6499",
          "contactType": "customer service",
          "email": "carloearl@glyphlock.com",
          "availableLanguage": ["en"]
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
      "keywords": resolvedKeywords,
      "knowsAbout": [
        "Quantum-resistant encryption",
        "Post-quantum cryptography",
        "AI cybersecurity",
        "Blockchain security",
        "Visual cryptography",
        "AI governance framework",
        "Zero-trust architecture",
        "Identity verification",
        "Fraud prevention",
        "Threat detection AI",
        "NIST post-quantum standards",
        "Steganography",
        "Secure QR infrastructure"
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Cybersecurity Services",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Professional Security Plan",
              "description": "Visual Cryptography Tools, Blockchain Security Suite, GlyphBot AI Assistant, up to 1,000 QR codes/month",
              "provider": {
                "@type": "Organization",
                "name": "GlyphLock LLC"
              }
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Enterprise Security Plan",
              "description": "Unlimited QR Generation, Priority AI Processing, Security Operations Center, N.U.P.S. POS System, 24/7 Premium Support",
              "provider": {
                "@type": "Organization",
                "name": "GlyphLock LLC"
              }
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "GlyphBot AI Assistant",
              "description": "AI-powered cybersecurity assistant for threat detection, code analysis, and security auditing",
              "provider": {
                "@type": "Organization",
                "name": "GlyphLock LLC"
              }
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "QR Code Security Generator",
              "description": "Generate secure, quantum-resistant QR codes with AI-powered threat detection",
              "provider": {
                "@type": "Organization",
                "name": "GlyphLock LLC"
              }
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Steganography Tools",
              "description": "Hide sensitive data within images using advanced cryptographic techniques",
              "provider": {
                "@type": "Organization",
                "name": "GlyphLock LLC"
              }
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Security Consultation",
              "description": "60-minute expert cybersecurity analysis and custom solution recommendations",
              "provider": {
                "@type": "Organization",
                "name": "GlyphLock LLC"
              }
            }
          }
        ]
      }
    });

    // WebSite Schema for search (always present)
    let websiteScript = document.querySelector('script[type="application/ld+json"]#website-schema');
    if (!websiteScript) {
      websiteScript = document.createElement('script');
      websiteScript.setAttribute('type', 'application/ld+json');
      websiteScript.setAttribute('id', 'website-schema');
      document.head.appendChild(websiteScript);
    }
    websiteScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "GlyphLock Security",
      "url": siteUrl,
      "description": resolvedDescription,
      "publisher": {
        "@type": "Organization",
        "name": "GlyphLock LLC"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${siteUrl}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    });
    
    // Page Specific Schema (if not Organization or WebSite)
    if (resolvedSchemaType !== "Organization" && resolvedSchemaType !== "WebSite") {
        let pageScript = document.querySelector('script[type="application/ld+json"]#page-schema');
        if (!pageScript) {
          pageScript = document.createElement('script');
          pageScript.setAttribute('type', 'application/ld+json');
          pageScript.setAttribute('id', 'page-schema');
          document.head.appendChild(pageScript);
        }
        pageScript.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": resolvedSchemaType,
            "name": resolvedTitle,
            "description": resolvedDescription,
            "url": fullUrl,
            "mainEntityOfPage": fullUrl,
            "provider": {
                 "@type": "Organization",
                 "name": "GlyphLock LLC"
            }
        });
    } else {
      // Remove page-specific schema if it exists and is no longer needed
      let pageScript = document.querySelector('script[type="application/ld+json"]#page-schema');
      if (pageScript) {
        pageScript.remove();
      }
    }

  }, [resolvedTitle, resolvedDescription, resolvedKeywords, image, ogImage, fullUrl, type, resolvedSchemaType]);

  return null;
}