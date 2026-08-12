import React, { useState } from "react";
import { UploadCloud, Network, ScanSearch, RefreshCcw, CheckCircle2, Loader2 } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";

export default function SitemapHub() {
  const [pinging, setPinging] = useState({});
  const [pinged, setPinged] = useState({});

  const sitemaps = [
    { name: "Main Sitemap Index", url: "/sitemap.xml", description: "Master index for all sitemaps" },
    { name: "Pages Sitemap", url: "/sitemap-pages.xml", description: "All public pages and routes" },
    { name: "QR Studio Sitemap", url: "/sitemap-qr.xml", description: "QR code generation tools" },
    { name: "Image Lab Sitemap", url: "/sitemap-images.xml", description: "AI image generation and interactive tools" },
    { name: "Knowledge Base Sitemap", url: "/sitemap-kb.xml", description: "Documentation and FAQ" },
    { name: "LLM Discovery Index", url: "/glyphlock-llm-index.json", description: "AI crawler instructions" }
  ];

  const engines = [
    { name: "Google", url: "https://www.google.com/ping?sitemap=", icon: "🔍" },
    { name: "Bing", url: "https://www.bing.com/ping?sitemap=", icon: "🔷" },
    { name: "Brave Search", url: "https://search.brave.com/ping?sitemap=", icon: "🦁" },
    { name: "DuckDuckGo", url: null, icon: "🦆" },
    { name: "OpenAI GPT Crawler", url: null, icon: "🤖" },
    { name: "Anthropic Claude Crawler", url: null, icon: "⚡" },
  ];

  const handlePing = async (engineName, engineUrl) => {
    setPinging(prev => ({ ...prev, [engineName]: true }));
    
    try {
      const sitemapUrl = encodeURIComponent("https://glyphlock.io/sitemap.xml");
      await fetch(`${engineUrl}${sitemapUrl}`, { mode: 'no-cors' });
      setPinged(prev => ({ ...prev, [engineName]: true }));
      setTimeout(() => {
        setPinged(prev => ({ ...prev, [engineName]: false }));
      }, 3000);
    } catch (error) {
      console.error(`Failed to ping ${engineName}:`, error);
    } finally {
      setPinging(prev => ({ ...prev, [engineName]: false }));
    }
  };

  return (
    <>
      <SEOHead
        title="Sitemap Command Center | GlyphLock Discovery Hub"
        description="Centralized routing for search engines, LLM crawlers, and automated discovery systems. XML sitemaps and AI indexing endpoints."
        keywords="sitemap, SEO, search engines, LLM crawler, AI discovery, XML sitemap, robots.txt"
        url="/sitemap"
      />

      <div className="min-h-screen bg-black text-white px-4 sm:px-6 py-16 relative">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-blue-500/5 pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto space-y-16 relative z-10">

          {/* Header */}
          <header className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-cyan-500/10 rounded-2xl mb-4 border border-cyan-500/30">
              <Network className="w-10 h-10 text-cyan-400" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Sitemap Command Center
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto">
              Centralized routing for search engines, LLM crawlers, and automated discovery systems.
            </p>
          </header>

          {/* XML Sitemaps Section */}
          <section className="bg-gray-900/50 p-6 md:p-10 rounded-3xl border border-gray-800 shadow-2xl backdrop-blur-sm">
            <h2 className="text-2xl md:text-3xl font-semibold mb-8 flex items-center gap-3">
              <Network className="text-cyan-400 w-8 h-8" /> 
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                XML Sitemaps
              </span>
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sitemaps.map((item, i) => (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 min-h-[44px]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      {item.name}
                    </h3>
                    <ScanSearch className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{item.description}</p>
                  <p className="text-cyan-400 text-xs font-mono bg-black/30 px-3 py-2 rounded-lg">
                    {item.url}
                  </p>
                </a>
              ))}
            </div>
          </section>

          {/* Search Engine Notify Section */}
          <section className="bg-gray-900/50 p-6 md:p-10 rounded-3xl border border-gray-800 shadow-2xl backdrop-blur-sm">
            <h2 className="text-2xl md:text-3xl font-semibold mb-6 flex items-center gap-3">
              <UploadCloud className="text-green-400 w-8 h-8" /> 
              <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                Search Engine Notify
              </span>
            </h2>

            <p className="text-gray-400 mb-8 text-base md:text-lg">
              Clicking a button below alerts engines that your sitemap has been updated.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {engines.map((eng, i) => (
                <div
                  key={i}
                  className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{eng.icon}</span>
                    <h3 className="text-lg font-semibold text-white">{eng.name}</h3>
                  </div>
                  
                  {eng.url ? (
                    <Button
                      onClick={() => handlePing(eng.name, eng.url)}
                      disabled={pinging[eng.name]}
                      className="w-full mt-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all duration-300 min-h-[44px]"
                    >
                      {pinging[eng.name] ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Pinging...
                        </>
                      ) : pinged[eng.name] ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Notified!
                        </>
                      ) : (
                        <>
                          <RefreshCcw className="w-4 h-4 mr-2" />
                          Ping {eng.name}
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="mt-3 px-4 py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <p className="text-yellow-400 text-sm font-medium">
                        🤖 Uses AI/LLM auto-crawl (no manual ping required)
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Technical Details */}
          <section className="bg-gray-900/50 p-6 md:p-10 rounded-3xl border border-gray-800 shadow-2xl backdrop-blur-sm">
            <h2 className="text-2xl md:text-3xl font-semibold mb-6 flex items-center gap-3">
              <ScanSearch className="text-purple-400 w-8 h-8" /> 
              <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Discovery Protocol
              </span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-semibold text-cyan-400 mb-3">SEO Optimization</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>✓ XML Sitemap Index</li>
                  <li>✓ Auto-generated lastmod timestamps</li>
                  <li>✓ Priority and frequency hints</li>
                  <li>✓ Mobile-first indexing ready</li>
                  <li>✓ Canonical URL enforcement</li>
                </ul>
              </div>

              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-semibold text-green-400 mb-3">LLM Discoverability</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>✓ Structured JSON crawl index</li>
                  <li>✓ Permission-based content access</li>
                  <li>✓ Context-aware knowledge extraction</li>
                  <li>✓ API documentation endpoints</li>
                  <li>✓ Real-time update protocols</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="text-center text-gray-500 text-sm pt-8 border-t border-gray-800">
            <p>GlyphLock LLC — Autonomous Discovery Protocol v2.1</p>
            <p className="mt-2">Last Updated: {new Date().toLocaleDateString()}</p>
          </footer>
        </div>
      </div>
    </>
  );
}