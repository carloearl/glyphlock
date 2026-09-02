import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getSeoData, SEO_DATA } from '@/components/seo/seoData';

export default function SEOHead({ 
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  image = "https://glyphlock.io/glyphlock-logo.png",
  ogImage = "https://glyphlock.io/glyphlock-social-card.png",
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

  // Canonical public-route data outranks page-local props so one source controls
  // title, description, Open Graph, Twitter, and canonical URL consistently.
  const resolvedTitle = key
    ? autoData.title
    : (title || "GlyphLock | Evidence Infrastructure for Identity, Operations & Proof");
  const resolvedDescription = key
    ? autoData.description
    : (description || "Evidence infrastructure for identity, operations, and proof. Secure QR, verified access, and financial accountability in one auditable system.");
  const resolvedOgTitle = key
    ? resolvedTitle
    : (ogTitle || title || resolvedTitle);
  const resolvedOgDescription = key
    ? resolvedDescription
    : (ogDescription || description || resolvedDescription);

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
  const resolvedPath = autoData.url || url || path || "/";
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
    favicon.setAttribute('href', '/glyphlock-logo.png');
    favicon.setAttribute('type', 'image/png');

    // Apple touch icon
    let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleTouchIcon) {
      appleTouchIcon = document.createElement('link');
      appleTouchIcon.setAttribute('rel', 'apple-touch-icon');
      document.head.appendChild(appleTouchIcon);
    }
    appleTouchIcon.setAttribute('href', '/glyphlock-logo.png');

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
    // Index only exact canonical public paths. Every private, internal, test,
    // duplicate-case, and unknown route fails closed to noindex/no-follow.
    const isCanonicalPublicPath = Boolean(key && autoData.url === path);
    const robotsContent = isCanonicalPublicPath
      ? 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
      : 'noindex, nofollow, noarchive, nosnippet';
    
    updateMetaTag('robots', robotsContent);
    updateMetaTag('googlebot', robotsContent);
    updateMetaTag('bingbot', robotsContent);
    updateMetaTag('author', 'GlyphLock LLC');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=5.0');
    updateMetaTag('theme-color', '#020617');
    updateMetaTag('format-detection', 'telephone=no');
    updateMetaTag('apple-mobile-web-app-capable', 'yes');
    updateMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
    updateMetaTag('apple-mobile-web-app-title', 'GlyphLock');
    updateMetaTag('application-name', 'GlyphLock');
    updateMetaTag('msapplication-TileColor', '#020617');
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

    // One canonical identity graph. Base44 platform JSON-LD must remain
    // disabled in Dashboard > SEO & GEO > Advanced SEO to prevent duplicates.
    document.querySelector('script[type="application/ld+json"]#org-schema')?.remove();
    document.querySelector('script[type="application/ld+json"]#website-schema')?.remove();

    let identityScript = document.querySelector('script[type="application/ld+json"]#identity-schema');
    if (!identityScript) {
      identityScript = document.createElement('script');
      identityScript.setAttribute('type', 'application/ld+json');
      identityScript.setAttribute('id', 'identity-schema');
      document.head.appendChild(identityScript);
    }

    const organizationId = siteUrl + '/#organization';
    const websiteId = siteUrl + '/#website';
    const organization = {
      "@type": "Organization",
      "@id": organizationId,
      "name": "GlyphLock",
      "legalName": "GlyphLock LLC",
      "alternateName": ["GlyphLock LLC", "Glyphlock"],
      "url": siteUrl + "/",
      "logo": {
        "@type": "ImageObject",
        "@id": siteUrl + "/#logo",
        "url": image,
        "caption": "GlyphLock"
      },
      "image": { "@id": siteUrl + "/#logo" },
      "description": "Evidence infrastructure for identity, operations, and proof. GlyphLock builds custom software, NUPS venue operations, secure QR and image verification, AI-assisted workflows, and documented governance controls.",
      "foundingDate": "2025-05-24",
      "founder": {
        "@type": "Person",
        "@id": siteUrl + "/#carloearl",
        "name": "Carlo Earl",
        "jobTitle": "Chief Executive Officer",
        "worksFor": { "@id": organizationId }
      },
      "email": "carloearl@glyphlock.com",
      "areaServed": "US",
      "knowsAbout": [
        "Evidence infrastructure",
        "Secure QR verification",
        "Identity and permission workflows",
        "Venue operations software",
        "Digital contract and evidence capture",
        "AI governance"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "sales",
        "email": "carloearl@glyphlock.com",
        "areaServed": "US",
        "availableLanguage": "en"
      },
      "sameAs": [
        "https://github.com/carloearl/glyphlock",
        "https://www.bbb.org/us/az/el-mirage/profile/computer-system-designers/glyphlock-llc-1126-1000169606"
      ]
    };
    const website = {
      "@type": "WebSite",
      "@id": websiteId,
      "url": siteUrl + "/",
      "name": "GlyphLock",
      "description": "Evidence infrastructure for identity, operations, and proof.",
      "publisher": { "@id": organizationId },
      "inLanguage": "en-US"
    };
    const homepageProducts = path === "/" ? [
      {
        "@type": "SoftwareApplication",
        "@id": siteUrl + "/#nups",
        "name": "NUPS",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "url": siteUrl + "/NUPSLanding",
        "description": "Venue operations across front door, register, contracts, staff, payouts, reporting, and audit trails.",
        "publisher": { "@id": organizationId },
        "isPartOf": { "@id": websiteId }
      },
      {
        "@type": "SoftwareApplication",
        "@id": siteUrl + "/#qrstudio",
        "name": "GlyphLock QR Studio",
        "applicationCategory": "SecurityApplication",
        "operatingSystem": "Web",
        "url": siteUrl + "/SecureQRStudio",
        "description": "Custom QR payloads, branded codes, scan logging, signing options, verification, and vault workflows.",
        "publisher": { "@id": organizationId },
        "isPartOf": { "@id": websiteId }
      },
      {
        "@type": "SoftwareApplication",
        "@id": siteUrl + "/#glyphbot",
        "name": "GlyphBot",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "url": siteUrl + "/GlyphBot",
        "description": "AI-assisted research, code analysis, site auditing, support, and workflow drafting with human responsibility for decisions and approvals.",
        "publisher": { "@id": organizationId },
        "isPartOf": { "@id": websiteId }
      },
      {
        "@type": "SoftwareApplication",
        "@id": siteUrl + "/#imagelab",
        "name": "GlyphLock Image Lab",
        "applicationCategory": "MultimediaApplication",
        "operatingSystem": "Web",
        "url": siteUrl + "/ImageLab",
        "description": "AI-assisted image generation, visual analysis, interactive hotspots, and media tooling.",
        "publisher": { "@id": organizationId },
        "isPartOf": { "@id": websiteId }
      },
      {
        "@type": "TechArticle",
        "@id": siteUrl + "/SDKDocs#documentation",
        "headline": "GlyphLock SDK Documentation",
        "url": siteUrl + "/SDKDocs",
        "description": "GlyphLock SDK documentation and integration references.",
        "author": { "@id": organizationId },
        "publisher": { "@id": organizationId },
        "isPartOf": { "@id": websiteId },
        "inLanguage": "en-US"
      }
    ] : [];

    identityScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [organization, website, ...homepageProducts]
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
            ...(resolvedSchemaType === "TechArticle" ? {
              "datePublished": autoData.datePublished,
              "dateModified": autoData.dateModified || autoData.datePublished,
              "author": {
                "@type": "Organization",
                "name": "GlyphLock LLC",
                "url": siteUrl
              },
              "publisher": {
                "@type": "Organization",
                "name": "GlyphLock LLC",
                "url": siteUrl,
                "logo": { "@type": "ImageObject", "url": image }
              }
            } : {}),
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

  }, [resolvedTitle, resolvedDescription, resolvedOgTitle, resolvedOgDescription, resolvedKeywords, image, ogImage, fullUrl, type, resolvedSchemaType, path]);

  return null;
}