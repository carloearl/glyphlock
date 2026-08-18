import React from 'react';
import { FileCode, ExternalLink, CheckCircle2 } from 'lucide-react';

const ROBOTS_CONTENT = `# GlyphLock LLC - robots.txt
# https://glyphlock.io

User-agent: *
Allow: /

# Public Tools
Allow: /SecureQRStudio
Allow: /SecureQRStudio/*
Allow: /image-lab
Allow: /steganography
Allow: /blockchain
Allow: /glyphbot
Allow: /glyphbot-junior

# Block admin/private areas
Disallow: /dashboard
Disallow: /command-center
Disallow: /nups-staff
Disallow: /nups-owner
Disallow: /api/
Disallow: /functions/
Disallow: /admin/

# Crawl-delay for politeness
Crawl-delay: 1

# Google-specific
User-agent: Googlebot
Allow: /
Crawl-delay: 0

# Bing-specific
User-agent: Bingbot
Allow: /
Crawl-delay: 1`;

export default function Robots() {
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <FileCode className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-cyan-400">robots.txt</h1>
            <p className="text-gray-500 text-sm">https://glyphlock.io/robots.txt</p>
          </div>
        </div>

        {/* Status */}
        <div className="bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-semibold">Production Ready</span>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            robots.txt is served via backend function at <code className="text-cyan-300">https://app.base44.com/api/apps/U5jDzdts3bd4p19I5hID/robotsTxt</code>
          </p>
        </div>

        <p className="text-gray-400 mb-6 text-sm">
          This file instructs search engine crawlers on how to index GlyphLock.io.
          It references the primary sitemap index which contains all child sitemaps.
        </p>

        <pre className="bg-gray-900 p-6 rounded-lg text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap border border-cyan-500/20">
{ROBOTS_CONTENT}
        </pre>

        <div className="mt-6 flex flex-wrap gap-4">
          <a 
            href="https://app.base44.com/api/apps/U5jDzdts3bd4p19I5hID/robotsTxt" 
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View Raw robots.txt
          </a>
          <a 
            href="https://app.base44.com/api/apps/U5jDzdts3bd4p19I5hID/sitemap" 
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <FileCode className="w-4 h-4" />
            View Sitemap Index
          </a>
        </div>

        {/* SEO Notes */}
        <div className="mt-8 bg-gray-900/30 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-3">Important Notes</h3>
          <ul className="text-gray-400 text-sm space-y-2">
            <li>• <strong className="text-white">Sitemap:</strong> Single index at /sitemap.xml references all child sitemaps</li>
            <li>• <strong className="text-white">Crawl Delay:</strong> 1 second for polite crawling (0 for Googlebot)</li>
            <li>• <strong className="text-white">Blocked:</strong> Admin panels, API endpoints, and private areas</li>
            <li>• <strong className="text-white">Allowed:</strong> All public tools and pages</li>
          </ul>
        </div>
      </div>
    </div>
  );
}