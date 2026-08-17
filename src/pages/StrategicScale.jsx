import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { TrendingUp, Globe, Shield, Zap } from "lucide-react";

export default function StrategicScale() {
  return (
    <>
      <SEOHead 
        title="Strategic Scale | GlyphLock Platform Architecture"
        description="GlyphLock's long-term platform direction: modular software, reusable integrations, operational reliability, documentation discipline, and scalable deployment patterns."
        keywords="GlyphLock platform architecture, scalable software, systems integration, NUPS, operational software, deployment architecture"
        url="/strategic-scale"
      />
      
      <div className="min-h-screen bg-black text-white py-24 relative overflow-hidden">
        {/* Background effects */}
        <div className="pointer-events-none fixed inset-0 opacity-30 mix-blend-screen">
          <div className="absolute -top-40 left-10 h-96 w-96 rounded-full bg-[#8C4BFF] blur-[120px]" />
          <div className="absolute top-40 right-0 h-96 w-96 rounded-full bg-[#00E4FF] blur-[120px]" />
        </div>

        <main className="relative z-10 max-w-5xl mx-auto px-6 md:px-12">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter font-space text-white mb-6 leading-tight">
              STRATEGIC <span className="text-transparent bg-gradient-to-r from-[#00E4FF] to-[#8C4BFF] bg-clip-text">SCALE TARGET</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              GlyphLock is being engineered for repeatable, scalable deployment.
            </p>
            <p className="text-base text-gray-400 max-w-2xl mx-auto mt-4">
              The objective is a reusable software and integration layer that can support multiple operational environments without overstating present deployment scale.
            </p>
          </div>

          {/* Core Objective */}
          <div className="glass-card rounded-3xl border border-[#00E4FF]/30 p-12 mb-16 text-center bg-gradient-to-b from-[#001F54] to-black relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative z-10">
              <p className="text-sm text-[#00E4FF] font-bold uppercase tracking-widest mb-4">Long-term engineering objective</p>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6 font-space">
                REPEATABLE<span className="text-[#00E4FF]"> DEPLOYMENT</span>
              </h2>
              <p className="text-xl text-gray-300 mb-4">modular systems · documented integrations · measurable reliability</p>
              <p className="text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Scale the platform through reusable modules, deployment playbooks, evidence-backed integrations, observability, and operational support rather than valuation claims.
              </p>
            </div>
          </div>

          {/* Infrastructure Pillars */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="glass-card rounded-xl border border-[#00E4FF]/20 p-6 hover:border-[#00E4FF]/40 transition-all">
              <Globe className="w-8 h-8 text-[#00E4FF] mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Protocol Licensing</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Credentialed operator access provisioning across enterprise and creative ecosystems.
              </p>
            </div>
            <div className="glass-card rounded-xl border border-[#8C4BFF]/20 p-6 hover:border-[#8C4BFF]/40 transition-all">
              <Shield className="w-8 h-8 text-[#8C4BFF] mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Global Identity Infrastructure</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                QR-based persistent identity layer for verified authorship and asset provenance.
              </p>
            </div>
            <div className="glass-card rounded-xl border border-emerald-500/20 p-6 hover:border-emerald-500/40 transition-all">
              <Zap className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Credential Governance Networks</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Master Covenant framework for verifiable digital truth and compliance infrastructure.
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-12">
            <p className="text-sm text-yellow-200 leading-relaxed text-center">
              <strong>Important:</strong> This page describes engineering direction and product strategy. It is not a valuation, revenue, customer-count, certification, or deployment-scale claim.
            </p>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link to={createPageUrl("Contact")}>
              <Button className="bg-gradient-to-r from-[#00E4FF] to-[#8C4BFF] hover:scale-105 transition-transform text-white text-lg font-bold uppercase tracking-wide px-10 py-6 shadow-[0_0_30px_rgba(0,228,255,0.3)]">
                Request Partnership Documentation
              </Button>
            </Link>
          </div>

          <footer className="border-t border-white/10 pt-8 mt-16 text-center text-xs text-gray-500">
            <p>© GlyphLock LLC • Not an offer to sell securities</p>
          </footer>
        </main>
      </div>
    </>
  );
}