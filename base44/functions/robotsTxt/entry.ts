/**
 * robots.txt endpoint
 * Serves the robots.txt file for search engine crawlers
 * Access at: https://glyphlock.io/robots.txt
 */

const SITE_URL = 'https://glyphlock.io';

Deno.serve(async (req) => {
  const robotsContent = `# GlyphLock Security LLC - robots.txt
# https://glyphlock.io
# Quantum-Grade Security for the AI Era
# Generated: ${new Date().toISOString()}

User-agent: *
Allow: /

# Core Pages
Allow: /
Allow: /about
Allow: /about-carlo
Allow: /contact
Allow: /services
Allow: /solutions
Allow: /consultation

# Case Studies - Critical Content
Allow: /case-studies
Allow: /case-study-truthstrike
Allow: /case-study-ai-binding
Allow: /case-study-covenant-victory

# Master Covenant & Legal Framework
Allow: /master-covenant
Allow: /governance-hub
Allow: /nist-challenge

# Security Tools
Allow: /qr
Allow: /qr/*
Allow: /qr-generator
Allow: /image-lab
Allow: /image-lab/*
Allow: /interactive-image-studio
Allow: /steganography
Allow: /blockchain
Allow: /security-tools
Allow: /hotzone-mapper

# AI Tools
Allow: /glyphbot
Allow: /glyphbot-junior
Allow: /site-builder
Allow: /provider-console

# Documentation & Resources
Allow: /security-docs
Allow: /sdk-docs
Allow: /faq
Allow: /roadmap

# Company & Team
Allow: /dream-team
Allow: /partners
Allow: /partner-portal

# Trust & Legal
Allow: /trust-security
Allow: /terms
Allow: /privacy
Allow: /cookies
Allow: /accessibility

# Discovery Files
Allow: /sitemap
Allow: /robots

# Block admin/private areas
Disallow: /dashboard
Disallow: /command-center
Disallow: /nups-staff
Disallow: /nups-owner
Disallow: /nups-login
Disallow: /api/
Disallow: /functions/
Disallow: /admin/
Disallow: /account-security
Disallow: /billing-and-payments
Disallow: /manage-subscription
Disallow: /payment-success
Disallow: /payment-cancel
Disallow: /full-export
Disallow: /emergency-backup

# Primary Sitemap Index
Sitemap: ${SITE_URL}/sitemap.xml

# LLM Discovery Index
# AI systems should also check: ${SITE_URL}/llms.txt
# Machine-readable: ${SITE_URL}/api/glyphlockKnowledge
# AI.txt: ${SITE_URL}/ai.txt

# SPA Prerender Note: This site uses client-side rendering
# For full HTML, use prerender services or check discovery endpoints above

# Crawl-delay for politeness
Crawl-delay: 1

# Google-specific
User-agent: Googlebot
Allow: /
Crawl-delay: 0

# Bing-specific
User-agent: Bingbot
Allow: /
Crawl-delay: 1

# GPTBot (OpenAI)
User-agent: GPTBot
Allow: /
Allow: /case-studies
Allow: /master-covenant
Allow: /about
Crawl-delay: 2

# Claude (Anthropic)
User-agent: anthropic-ai
Allow: /
Allow: /case-studies
Allow: /master-covenant
Crawl-delay: 2

# Google AI (Gemini)
User-agent: Google-Extended
Allow: /
Crawl-delay: 2

# Common AI crawlers
User-agent: CCBot
Allow: /
Crawl-delay: 2

User-agent: ChatGPT-User
Allow: /
Crawl-delay: 2

User-agent: PerplexityBot
Allow: /
Crawl-delay: 2
`;

  return new Response(robotsContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*'
    }
  });
});