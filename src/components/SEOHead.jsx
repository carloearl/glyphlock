import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getSeoData, SEO_DATA } from '@/components/seo/seoData';

export default function SEOHead({ 
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  image = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/d92107808_glyphlock-3d-logo.png",
  ogImage = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/d92107808_glyphlock-3d-logo.png",
  url,
  type = "website"
}) {
  const location = useLocation();
  
  // Resolve a single page record regardless of route casing or separators.
  const path = location.pathname || "/";
  const normalizeSeoPath = (value = "/") => {
    const normalized = value.toLowerCase().replace(/\/+$/, "") || "/";
    return normalized.replace(/[-_]/g, "");
  };
  const key = Object.keys(SEO_DATA).find((entryKey) => {
    const entryUrl = SEO_DATA[entryKey]?.url;
    return entryUrl && normalizeSeoPath(entryUrl) === normalizeSeoPath(path);
  }) || (normalizeSeoPath(path) === "/" ? "Home" : null);
  const autoData = key ? getSeoData(key) : {};

  const resolvedTitle = title || autoData.title || "GlyphLock | Evidence Infrastructure for Identity, Operations & Proof";
  const resolvedDescription = description || autoData.description || "GlyphLock connects identity and permission, secure QR and image carriers, AI-assisted workflows, NUPS venue operations, financial accountability, APIs, hardware, and governance through one evidence architecture.";
  const resolvedOgTitle = ogTitle || autoData.ogTitle || "GlyphLock | Connected Evidence Infrastructure";
  const resolvedOgDescription = ogDescription || autoData.ogDescription || "From Secure QR and interactive media to automated DJ, NUPS, financial records, SDKs, APIs, hardware, and governance—GlyphLock connects the full operating event.";

  // Use the page-specific keyword set as the source of truth. Global keywords
  // are a fallback only, preventing stale sitewide terms from leaking into pages.
  const defaultKeywords = "GlyphLock, evidence infrastructure, identity and permission workflows, Secure QR, interactive images, GlyphBot, automated DJ, NUPS, venue operations software, financial accountability, API and SDK integration, governance";
  const autoKeywords = autoData.keywords ? autoData.keywords.join(", ") : "";
  const propKeywords = Array.isArray(keywords) ? keywords.join(", ") : (keywords || "");
  const sourceKeywords = propKeywords || autoKeywords || defaultKeywords;
  const resolvedKeywords = sourceKeywords
    .split(",")
    .map((keyword) => keyword.trim())
    .filter((value, index, all) => value && all.indexOf(value) === index)
    .join(", ");
  const resolvedSchemaType = autoData.schemaType || "WebSite";

  const siteUrl = "https://glyphlock.io";
  const resolvedPath = url || autoData.url || path || "/";
  const fullUrl = /^https?:\/\//i.test(resolvedPath)
    ? resolvedPath
    : `${siteUrl}${resolvedPath.startsWith("/") ? resolvedPath : `/${resolvedPath}`}`;

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
    favicon.setAttribute('href', 'https://media.base44.com/images/public/697a087fb354faebb72df54b/9f98e49a1_c867401ee_GLLogo.png');
    favicon.setAttribute('type', 'image/png');

    // Apple touch icon
    let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleTouchIcon) {
      appleTouchIcon = document.createElement('link');
      appleTouchIcon.setAttribute('rel', 'apple-touch-icon');
      document.head.appendChild(appleTouchIcon);
    }
    appleTouchIcon.setAttribute('href', 'https://media.base44.com/images/public/697a087fb354faebb72df54b/9f98e49a1_c867401ee_GLLogo.png');

    // Manifest
    let manifest = document.querySelector('link[rel="manifest"]');
    if (!manifest) {
      manifest = document.createElement('link');
      manifest.setAttribute('rel', 'manifest');
      document.head.appendChild(manifest);
    }
    manifest.setAttribute('href', '/nups.webmanifest');

    // Update or create meta tags
    const updateMetaTag = (name, content, property = false) => {
      const attribute = property ? 'property' : 'name';
      const matches = [...document.querySelectorAll(`meta[${attribute}="${name}"]`)];
      let element = matches.shift();
      matches.forEach((duplicate) => duplicate.remove());
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
    updateMetaTag('application-name', 'GlyphLock');
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
    updateMetaTag('og:title', resolvedOgTitle, true);
    updateMetaTag('og:description', resolvedOgDescription, true);
    updateMetaTag('og:image', ogImage, true);
    updateMetaTag('og:image:secure_url', ogImage, true);
    updateMetaTag('og:image:width', '1200', true);
    updateMetaTag('og:image:height', '630', true);
    updateMetaTag('og:image:alt', resolvedOgTitle, true);
    updateMetaTag('og:image:type', 'image/png', true);
    updateMetaTag('og:site_name', 'GlyphLock', true);
    updateMetaTag('og:locale', 'en_US', true);
    // fb:app_id omitted — no verified FB app ID

    // GLYPHLOCK: Enhanced Twitter Cards
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:site', '@glyphlock');
    updateMetaTag('twitter:creator', '@glyphlock');
    updateMetaTag('twitter:url', fullUrl);
    updateMetaTag('twitter:title', resolvedOgTitle);
    updateMetaTag('twitter:description', resolvedOgDescription);
    updateMetaTag('twitter:image', ogImage);
    updateMetaTag('twitter:image:alt', resolvedOgTitle);
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

    // Canonical link — keep one canonical and remove stale duplicates.
    const canonicalLinks = [...document.querySelectorAll('link[rel="canonical"]')];
    let canonical = canonicalLinks.shift();
    canonicalLinks.forEach((duplicate) => duplicate.remove());
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
      "description": "GlyphLock LLC builds evidence infrastructure connecting identity and permission, secure QR and image carriers, AI-assisted workflows, NUPS (Nexus Unified POS System) venue operations, financial accountability, APIs, hardware, and governance.",
      "foundingDate": "2025-05-24",
      "founder": {
        "@type": "Person",
        "name": "Carlo Rene Earl",
        "jobTitle": "Founder & Chief Executive Officer"
      },
      "member": [
        {
          "@type": "Person",
          "name": "Jacub Lough",
          "jobTitle": "Chief Financial Officer & Chief Strategy Officer"
        },
        {
          "@type": "Person",
          "name": "Collin Vanderginst",
          "jobTitle": "Chief Technology Officer"
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
          "telephone": "+1-480-886-5588",
          "contactType": "customer service",
          "email": "carloearl@glyphlock.com",
          "availableLanguage": ["en"]
        },
        {
          "@type": "ContactPoint",
          "email": "carloearl@glyphlock.com",
          "contactType": "technical support"
        }
      ],
      "sameAs": [
        "https://github.com/carloearl/glyphlock",
        "https://instagram.com/glyphlock",
        "https://tiktok.com/@glyphlock"
      ],
      "slogan": "Infrastructure that makes activity provable.",
      "areaServed": "Worldwide",
      "keywords": resolvedKeywords,
      "knowsAbout": [
        "Evidence infrastructure",
        "Concealed image data and least-significant-bit steganography",
        "Secure QR payloads and interactive images",
        "AI-assisted construction and system auditing",
        "Venue operations software",
        "Closed-loop stored value recordkeeping",
        "Operational and financial ledgers",
        "Audit evidence and provenance",
        "Hospitality interoperability",
        "Hardware-assisted workflows",
        "Governance and human approval controls"
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "GlyphLock Engagements",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Platform Access",
              "description": "Secure QR, interactive image, verification, and GlyphBot-assisted workflows for creators, builders, and teams.",
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
              "name": "Venue Deployment",
              "description": "NUPS workflow configuration, role mapping, hardware planning, onboarding, and launch support.",
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
              "name": "Enterprise Integration",
              "description": "Custom interoperability, data-boundary planning, technical review, licensing, and service-level scoping.",
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
      "name": "GlyphLock",
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

  }, [resolvedTitle, resolvedDescription, resolvedOgTitle, resolvedOgDescription, resolvedKeywords, image, ogImage, fullUrl, type, resolvedSchemaType]);

  return null;
}