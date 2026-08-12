/**
 * GLYPHLOCK SEO UTILITY LIBRARY
 * Centralized SEO helpers for consistent metadata across all routes
 */

import { getSeoData } from '@/components/seo/seoData';

/**
 * Get SEO configuration for a page
 * @param {string} pageName - Name of the page (e.g., "Home", "Pricing")
 * @param {object} overrides - Custom overrides for title, description, etc.
 * @returns {object} Complete SEO config
 */
export const getPageSEO = (pageName, overrides = {}) => {
  const baseData = getSeoData(pageName);
  
  return {
    title: overrides.title || baseData.title,
    description: overrides.description || baseData.description,
    keywords: overrides.keywords || baseData.keywords,
    url: overrides.url || baseData.url,
    ogTitle: overrides.ogTitle || baseData.ogTitle || baseData.title,
    ogDescription: overrides.ogDescription || baseData.ogDescription || baseData.description,
    schemaType: overrides.schemaType || baseData.schemaType || 'WebPage',
    image: overrides.image || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/d92107808_glyphlock-3d-logo.png"
  };
};

/**
 * Inject SoftwareApplication schema for tool pages
 * @param {string} name - Application name
 * @param {string} description - Application description
 * @param {string} url - Application URL
 * @param {array} features - Array of feature strings
 */
export const injectSoftwareSchema = (name, description, url, features = []) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": name,
    "description": description,
    "url": `https://glyphlock.io${url}`,
    "applicationCategory": "SecurityApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free tier with premium upgrades"
    },
    "featureList": features,
    "provider": {
      "@type": "Organization",
      "name": "GlyphLock LLC"
    },
    "softwareVersion": "2.0",
    "releaseNotes": "Enterprise-grade security features with AI-powered threat detection"
  };

  const scriptId = `software-schema-${url.replace(/\//g, '-')}`;
  let script = document.getElementById(scriptId);
  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schema);

  return () => {
    if (script && document.head.contains(script)) {
      document.head.removeChild(script);
    }
  };
};

/**
 * Inject Service schema for service pages
 * @param {string} name - Service name
 * @param {string} description - Service description
 * @param {string} url - Service URL
 */
export const injectServiceSchema = (name, description, url) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": name,
    "description": description,
    "url": `https://glyphlock.io${url}`,
    "provider": {
      "@type": "Organization",
      "name": "GlyphLock LLC"
    },
    "areaServed": "Worldwide",
    "serviceType": "Cybersecurity Consulting"
  };

  const scriptId = `service-schema-${url.replace(/\//g, '-')}`;
  let script = document.getElementById(scriptId);
  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schema);

  return () => {
    if (script && document.head.contains(script)) {
      document.head.removeChild(script);
    }
  };
};

/**
 * Inject Article schema for content pages
 */
export const injectArticleSchema = (title, description, url, datePublished, author = "GlyphLock LLC") => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "url": `https://glyphlock.io${url}`,
    "datePublished": datePublished,
    "author": {
      "@type": "Organization",
      "name": author
    },
    "publisher": {
      "@type": "Organization",
      "name": "GlyphLock LLC",
      "logo": {
        "@type": "ImageObject",
        "url": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/d92107808_glyphlock-3d-logo.png"
      }
    }
  };

  const scriptId = `article-schema-${url.replace(/\//g, '-')}`;
  let script = document.getElementById(scriptId);
  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schema);

  return () => {
    if (script && document.head.contains(script)) {
      document.head.removeChild(script);
    }
  };
};