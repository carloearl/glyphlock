import React from 'react';
import { FileCode, ExternalLink, CheckCircle2 } from 'lucide-react';

const ROBOTS_CONTENT = `# GlyphLock LLC — robots.txt
# Canonical origin: https://glyphlock.io
# NUPS = Nexus Unified POS System

User-agent: *
Allow: /
Allow: /About
Allow: /SecureQRStudio
Allow: /ImageLab
Allow: /InteractiveImageStudio
Allow: /GlyphBot
Allow: /GlyphBotMixer
Allow: /SecurityTools
Allow: /SecurityOperationsCenter
Allow: /Blockchain
Allow: /SDKDocs
Allow: /SecurityDocs
Allow: /NUPSLanding
Allow: /GlyphLockFinancial
Allow: /GovernanceHub
Allow: /MasterCovenant
Allow: /CaseStudies
Allow: /CaseStudyOracleOHIP
Allow: /OracleOHIPMilestone
Allow: /Roadmap
Allow: /Partners
Allow: /DreamTeam
Allow: /FAQ
Allow: /Contact
Allow: /Consultation
Allow: /Services
Allow: /Solutions
Allow: /Pricing
Allow: /Privacy
Allow: /Terms
Allow: /Accessibility
Allow: /CodeOfEthics

# Noindex: admin / private / authenticated / payment-result / test / sandbox / internal audit
Disallow: /Dashboard
Disallow: /CommandCenter
Disallow: /AccountSecurity
Disallow: /PaymentSuccess
Disallow: /PaymentCancel
Disallow: /NUPSOwner
Disallow: /NUPSSandbox
Disallow: /NUPSStaff
Disallow: /OHIPReadiness
Disallow: /ohipreadiness
Disallow: /SiteBuilder
Disallow: /api/
Disallow: /functions/
Disallow: /admin/

Sitemap: https://glyphlock.io/sitemap.xml

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
            robots.txt is served at <code className="text-cyan-300">https://glyphlock.io/robots.txt</code>
          </p>
        </div>

        <p className="text-gray-400 mb-6 text-sm">
          This file instructs search engine crawlers on how to index GlyphLock.io.
          It references the canonical public sitemap and keeps authenticated routes out of discovery.
        </p>

        <pre className="bg-gray-900 p-6 rounded-lg text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap border border-cyan-500/20">
{ROBOTS_CONTENT}
        </pre>

        <div className="mt-6 flex flex-wrap gap-4">
          <a 
            href="https://glyphlock.io/robots.txt"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View Raw robots.txt
          </a>
          <a
            href="https://glyphlock.io/sitemap.xml"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <FileCode className="w-4 h-4" />
            View Sitemap
          </a>
        </div>

        {/* SEO Notes */}
        <div className="mt-8 bg-gray-900/30 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-3">Important Notes</h3>
          <ul className="text-gray-400 text-sm space-y-2">
            <li>• <strong className="text-white">Sitemap:</strong> Canonical public routes are listed at /sitemap.xml</li>
            <li>• <strong className="text-white">Crawl Delay:</strong> 1 second for polite crawling</li>
            <li>• <strong className="text-white">Blocked:</strong> Admin panels, API endpoints, and private areas</li>
            <li>• <strong className="text-white">Allowed:</strong> All public tools and pages</li>
          </ul>
        </div>
      </div>
    </div>
  );
}