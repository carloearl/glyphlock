import React, { useEffect } from "react";
import { HelpCircle } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import FaqSectionGlyphPanel from "@/components/faq/FaqSectionGlyphPanel";

export default function FAQ() {
  useEffect(() => {
    const metaAI = document.createElement('meta');
    metaAI.name = 'ai-agent';
    metaAI.content = 'glyphlock faq knowledge base';
    document.head.appendChild(metaAI);

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "name": "GlyphLock FAQ",
      "url": "https://glyphlock.io/faq"
    });
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(metaAI)) document.head.removeChild(metaAI);
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, []);

  return (
    <>
      <SEOHead 
        title="FAQ - Frequently Asked Questions | GlyphLock Help Center"
        description="Find answers about GlyphLock's creative ecosystem platform, QR identity tools, site building AI, Master Covenant authorship, pricing, and creator protection infrastructure."
        keywords="FAQ, help center, creator support, ecosystem questions, QR identity, site building, GlyphBot AI, Master Covenant, technical support, audit trails"
        url="/faq"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/20 to-black text-white py-16 md:py-32 relative">
        {/* Cosmic Background */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-cyan-900/10 to-transparent pointer-events-none z-0" />
        <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDYsIDE4MiwgMjEyLCAwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20 pointer-events-none z-0" />
        <div className="glyph-orb fixed top-20 right-20 opacity-20 glyph-pulse" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.3), rgba(59,130,246,0.2))' }}></div>
        
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 glyph-glass border-2 border-cyan-500/40 rounded-2xl mb-4 md:mb-6 glyph-glow">
              <HelpCircle className="w-7 h-7 md:w-8 md:h-8 text-cyan-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black mb-3 md:mb-6 font-space tracking-tight">
              FREQUENTLY ASKED <span className="text-transparent bg-gradient-to-r from-[#00E4FF] to-[#8C4BFF] bg-clip-text">QUESTIONS</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 px-2">
              Creator protection, ecosystem infrastructure, and Master Covenant authorship framework.
            </p>
          </div>

          <FaqSectionGlyphPanel />

          <div className="glyph-glass-dark rounded-2xl border-2 border-purple-500/40 p-6 md:p-8 text-center mt-12 md:mt-16 glyph-glow">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4 font-space">Still Need Help?</h3>
            <p className="text-sm md:text-base text-gray-400 mb-6 md:mb-8 max-w-lg mx-auto px-2">
              Our infrastructure team protects creators 24/7. Enterprise clients get immediate support, all users receive responses within 24 hours.
            </p>
            <a
              href="mailto:glyphlock@gmail.com"
              className="inline-flex items-center justify-center bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold uppercase tracking-wide px-8 py-4 rounded-xl shadow-lg transition-all glyph-glow min-h-[52px]"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </>
  );
}