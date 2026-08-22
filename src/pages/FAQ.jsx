import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { HelpCircle, Shield, Bot, QrCode, Image, Music, Building2, FileCheck, ArrowRight } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import FaqSectionGlyphPanel from "@/components/faq/FaqSectionGlyphPanel";

const quickTopics = [
  { icon: Shield, label: "Security Tools", page: "SecurityTools", color: "from-blue-500 to-indigo-600" },
  { icon: Bot, label: "GlyphBot AI", page: "GlyphBot", color: "from-cyan-500 to-blue-600" },
  { icon: QrCode, label: "QR Studio", page: "SecureQRStudio", color: "from-indigo-500 to-purple-600" },
  { icon: Image, label: "Image Lab", page: "ImageLab", color: "from-purple-500 to-pink-600" },
  { icon: Building2, label: "N.U.P.S. POS", page: "NUPSLogin", color: "from-amber-500 to-orange-600" },
  { icon: FileCheck, label: "Master Covenant", page: "GovernanceHub", color: "from-emerald-500 to-teal-600" },
];

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
        title="GlyphLock FAQ | QR, Images, GlyphBot, NUPS & Integrations"
        description="Find answers about Secure QR, image carriers and hotspots, GlyphBot, automated DJ workflows, NUPS venue operations, value records, APIs, SDKs, and governance."
        keywords="GlyphLock FAQ, Secure QR, image carriers, interactive hotspots, GlyphBot, automated DJ, NUPS, GlyphBucks, API integration, SDK integration, governance"
        url="/faq"
      />
      
      <div className="min-h-screen text-white relative" style={{ background: 'transparent' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-20 relative z-10">
          
          {/* Hero Header */}
          <div className="text-center mb-10 md:mb-14">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <HelpCircle className="w-7 h-7 text-blue-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight leading-[1.1]">
              Help Center &{" "}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">FAQ</span>
            </h1>
            <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Everything you need to know about GlyphLock's security platform, AI tools, and enterprise services.
            </p>
          </div>

          {/* Quick Topic Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-12 md:mb-16">
            {quickTopics.map((topic) => (
              <Link 
                key={topic.label}
                to={createPageUrl(topic.page)}
                className="group flex flex-col items-center gap-2.5 p-4 rounded-xl transition-all duration-200 hover:scale-[1.03]"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${topic.color} flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}>
                  <topic.icon size={18} className="text-white" />
                </div>
                <span className="text-[12px] font-medium text-slate-400 group-hover:text-white transition-colors text-center leading-tight">{topic.label}</span>
              </Link>
            ))}
          </div>

          {/* FAQ Accordion */}
          <FaqSectionGlyphPanel />

          {/* Support CTA */}
          <div className="mt-14 md:mt-16 rounded-2xl p-8 md:p-10 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.06))', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.06), transparent 70%)' }} />
            <div className="relative z-10">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3">Can't find what you're looking for?</h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto text-sm md:text-base">
                Reach out directly — enterprise clients receive priority response, all users within 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="mailto:carloearl@glyphlock.com"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-all text-sm"
                >
                  Contact Support <ArrowRight size={16} />
                </a>
                <Link
                  to={createPageUrl("GlyphBot")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <Bot size={16} /> Ask GlyphBot AI
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}