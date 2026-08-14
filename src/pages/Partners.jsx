import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const valuationScenarios = [
  {
    label: "Current D&B Estimate",
    valuation: 340000,
    formatted: "$340,000",
    tag: "Conservative baseline",
    tone: "This is the slow, old-school view that ignores growth, IP, and AI leverage.",
  },
  {
    label: "Revenue Multiple (Low)",
    valuation: 6800000,
    formatted: "$6,800,000",
    tag: "Execution in motion",
    tone: "Anchored to actual revenue and early traction across live prototypes.",
  },
  {
    label: "Revenue Multiple (High)",
    valuation: 13600000,
    formatted: "$13,600,000",
    tag: "Aggressive growth case",
    tone: "Assumes continued revenue and expansion of use‑cases across clubs, POS, and security.",
  },
  {
    label: "Pre‑Seed Comparable",
    valuation: 3600000,
    formatted: "$3,600,000",
    tag: "Market reality check",
    tone: "In line with AI / security pre‑seed rounds backing strong IP and real pilots.",
  },
  {
    label: "Berkus Method",
    valuation: 1600000,
    formatted: "$1,600,000",
    tag: "Foundational IP floor",
    tone: "Weighted by team, tech, market, and early systems — before scaling upside.",
  },
];

const formatMillions = (value) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  return `$${value.toLocaleString()}`;
};

export default function Partners() {
  const [projectedVal, setProjectedVal] = React.useState(2000000);

  const computedScenarios = [
    valuationScenarios[0],
    {
      ...valuationScenarios[1],
      valuation: projectedVal * 3.4,
      formatted: `$${(projectedVal * 3.4).toLocaleString()}`,
    },
    {
      ...valuationScenarios[2],
      valuation: projectedVal * 6.8,
      formatted: `$${(projectedVal * 6.8).toLocaleString()}`,
    },
    valuationScenarios[3],
    valuationScenarios[4],
  ];

  const minVal = Math.min(...computedScenarios.map((v) => v.valuation));
  const maxVal = Math.max(...computedScenarios.map((v) => v.valuation));

  return (
    <>
      <SEOHead 
        title="Partners & Investors - GlyphLock | Strategic Partnerships & Licensing"
        description="Explore GlyphLock partnership opportunities, technology stack, operational case studies, and strategic licensing framework. Financial figures are provided only where supported by current company records."
        keywords="cybersecurity partnerships, strategic licensing, technology partnerships, investor relations, IP protection, quantum-resistant encryption, enterprise security, partnership opportunities"
        url="/partners"
      />
      <div className="min-h-screen bg-black text-white py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 opacity-30 mix-blend-screen">
        <div className="absolute -top-40 left-10 h-96 w-96 rounded-full bg-[#8C4BFF] blur-[120px]" />
        <div className="absolute top-40 right-0 h-96 w-96 rounded-full bg-[#00E4FF] blur-[120px]" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 w-full">
        {/* Badge */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 md:mb-8">
          <Badge className="bg-[#00E4FF]/10 text-[#00E4FF] border-[#00E4FF]/30 px-2 sm:px-3 py-1 text-xs">
            <div className="h-1.5 w-1.5 rounded-full bg-[#00E4FF] mr-2 animate-pulse" />
            GlyphLock • Public Snapshot
          </Badge>
          <span className="text-xs text-gray-400 line-clamp-2 sm:line-clamp-none">
            Valuation scenarios based on live traction, IP, and market comps.
          </span>
        </div>

        {/* Hero section */}
        <section className="grid gap-8 md:gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start mb-16 md:mb-24">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black tracking-tighter font-space text-white mb-4 md:mb-6 leading-tight">
              PARTNERSHIP <span className="text-transparent bg-gradient-to-r from-[#00E4FF] to-[#8C4BFF] bg-clip-text">OVERVIEW</span>
            </h1>
            <p className="text-lg text-[#00E4FF] font-bold mb-4">
              Credentialed Integrity System
            </p>
            <p className="text-base text-gray-400 font-semibold mb-6">
              Protocol Governed Access Control
            </p>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              GlyphLock provisions cryptographic verification infrastructure addressing the $283B annual IP theft crisis. This document outlines architecture posture, credential framework, and licensing model for early operators.
            </p>

            <div className="grid gap-4 sm:grid-cols-3 mb-8">
              <div className="glass-card rounded-xl p-4 border border-[#00E4FF]/20">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1 font-bold">Current valuation band</p>
                <p className="text-xl font-black text-white font-space">$1.6M – $3.6M</p>
                <p className="text-xs text-gray-500 mt-1">Berkus and comparable pre-seed frameworks</p>
              </div>
              <div className="glass-card rounded-xl p-4 border border-[#8C4BFF]/50 bg-[#8C4BFF]/5 shadow-[0_0_20px_rgba(140,75,255,0.2)]">
                <p className="text-[10px] uppercase tracking-widest text-[#8C4BFF] mb-1 font-bold">Revenue anchored band</p>
                <p className="text-xl font-black text-white font-space">$6.8M – $13.6M</p>
                <p className="text-xs text-gray-400 mt-1">Live deployment multiple</p>
              </div>
              <div className="glass-card rounded-xl p-4 border border-emerald-500/30 bg-emerald-500/5">
                <p className="text-[10px] uppercase tracking-widest text-emerald-400 mb-1 font-bold">Execution target</p>
                <p className="text-xl font-black text-white font-space">$8M – $10M</p>
                <p className="text-xs text-gray-500 mt-1">Working range for partnership rounds</p>
              </div>
            </div>

            <p className="text-xs text-gray-500 italic">
              This snapshot reflects present valuation frameworks. Forward projections and strategic scale models are available under NDA.
            </p>
          </div>

          {/* Compact visual bar chart */}
          <div className="glass-card rounded-2xl border border-[#00E4FF]/20 p-8 shadow-2xl backdrop-blur-xl bg-black/40">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-bold text-white uppercase tracking-wider">Scenario comparison</p>
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">Relative scale</span>
            </div>
            <div className="space-y-4">
              {computedScenarios.map((scenario) => {
                const ratio = (scenario.valuation - minVal) / (maxVal - minVal || 1);
                const widthPercent = 25 + ratio * 75;
                const isPrimary = scenario.label.includes("Revenue Multiple");

                return (
                  <div key={scenario.label} className="space-y-2 group">
                    <div className="flex items-center justify-between text-xs text-gray-300">
                      <span className="font-medium truncate mr-2 group-hover:text-white transition-colors">{scenario.label}</span>
                      <span className="tabular-nums text-[#00E4FF] font-bold">{scenario.formatted}</span>
                    </div>
                    <div className="h-4 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                          isPrimary
                            ? "bg-gradient-to-r from-[#8C4BFF] via-[#00E4FF] to-[#00E4FF] shadow-[0_0_15px_rgba(0,228,255,0.5)]"
                            : "bg-gradient-to-r from-gray-700 to-gray-600"
                        }`}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-6 text-[10px] text-gray-500 leading-relaxed border-t border-white/10 pt-4">
              Highlighted bars represent revenue‑driven valuations, which we consider the primary anchor for
              near‑term partnership and deployment discussions.
            </p>
          </div>
        </section>

        {/* Company Overview */}
        <section className="mb-24 grid lg:grid-cols-2 gap-8">
          <div className="glass-card rounded-2xl border border-[#00E4FF]/20 p-8">
            <h2 className="text-2xl font-bold text-white mb-6 font-space">Company Overview</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-[#00E4FF] mb-2 uppercase tracking-widest">Mission</h3>
                <p className="text-gray-300 leading-relaxed">
                  Deploy a credentialed integrity system governed by cryptographic protocol to counter the global IP theft economy and establish verifiable authorship infrastructure.
                </p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#00E4FF] mb-2 uppercase tracking-widest">Founded</h3>
                <p className="text-white font-medium">2025 • El Mirage, Arizona</p>
                <p className="text-gray-500 text-xs mt-1">Active early stage infrastructure company</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-[#8C4BFF]/20 p-8">
            <h2 className="text-2xl font-bold text-white mb-6 font-space">Market Opportunity</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <p className="text-3xl font-black text-red-500 font-space">$283B</p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">annual IP theft exposure</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <p className="text-3xl font-black text-[#00E4FF] font-space">$10T+</p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">addressable digital infrastructure market</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <p className="text-3xl font-black text-[#8C4BFF] font-space">$3.78B</p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">QR identity market 2025</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <p className="text-3xl font-black text-emerald-400 font-space">$2.7T</p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">mobile QR payments 2025</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-6 leading-relaxed">
              GlyphLock positions as protocol infrastructure inside these sectors.
            </p>
          </div>
        </section>

        {/* Financial Highlights */}
        <section className="mb-24 glass-card rounded-2xl border border-emerald-500/30 p-8 bg-emerald-900/5">
          <h2 className="text-2xl font-bold text-emerald-400 mb-8 font-space">Commercial Readiness</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { label: "Commercial status", val: "Evidence-led", sub: "Verified figures available in diligence", color: "text-white" },
              { label: "Insurance pipeline", val: "Diligence only", sub: "Figures available when verified", color: "text-[#00E4FF]" },
              { label: "Enterprise pricing", val: "Custom", sub: "Scoped per deployment", color: "text-[#8C4BFF]" },
              { label: "Financial reporting", val: "Evidence-led", sub: "Verified data on request", color: "text-emerald-400" }
            ].map((item, i) => (
              <div key={i} className="bg-black/40 p-6 rounded-xl border border-white/10">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">{item.label}</p>
                <p className={`text-3xl font-black font-space ${item.color}`}>{item.val}</p>
                {item.sub && <p className="text-xs text-gray-400 mt-2">{item.sub}</p>}
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-emerald-500/20">
            <p className="text-sm text-emerald-200/80 leading-relaxed">
              Early traction demonstrates enterprise demand for protocol governed verification systems.
            </p>
          </div>
        </section>

        {/* Vision Statement */}
        <section className="mb-24">
          <div className="rounded-3xl p-12 text-center bg-gradient-to-b from-[#001F54] to-black border border-[#00E4FF]/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <h2 className="text-3xl font-bold text-white mb-6 font-space relative z-10">VISION</h2>
            <p className="text-xl text-gray-300 leading-relaxed max-w-4xl mx-auto relative z-10">
              Build the global verification layer for digital identity and authorship.
            </p>
            <p className="text-base text-gray-400 mt-6 max-w-3xl mx-auto relative z-10">
              Target outcome: billion scale protocol infrastructure securing creative and enterprise ecosystems.
            </p>
          </div>
        </section>

        {/* Valuation Calculator */}
        <section className="mb-24 glass-card rounded-2xl border border-[#00E4FF]/20 p-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2 font-space">Valuation Calculator</h2>
              <p className="text-gray-400 text-sm mb-8">
                Adjust projected revenue to simulate real-time valuation based on market multiples.
              </p>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm font-bold text-[#00E4FF]">
                    <span>$500K</span>
                    <span>Current Projection: ${(projectedVal).toLocaleString()}</span>
                    <span>$20M</span>
                  </div>
                  <input
                    type="range"
                    min={500000}
                    max={20000000}
                    step={500000}
                    value={projectedVal}
                    onChange={(e) => setProjectedVal(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#00E4FF]"
                  />
                </div>

                <div className="bg-[#00E4FF]/10 border border-[#00E4FF]/20 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-300">Estimated Valuation</span>
                    <span className="text-xs text-[#00E4FF] uppercase font-bold">Revenue Multiple (Low)</span>
                  </div>
                  <p className="text-4xl font-black text-white font-space">
                    ${(projectedVal * 3.4).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">5-Year Projection</h3>
              <div className="space-y-3">
                {[1,2,3,4,5].map((year) => {
                  const base = projectedVal;
                  const growth = 1 + year * 0.4;
                  const val = base * growth * 3.4;
                  return (
                    <div key={year} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                      <span className="text-xs font-bold text-gray-500 uppercase">Year {year}</span>
                      <span className="text-sm font-bold text-white font-space">${val.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Partnership CTA */}
        <section className="mb-12 glass-card rounded-3xl border border-[#8C4BFF]/50 p-8 bg-gradient-to-r from-[#8C4BFF]/10 to-[#00E4FF]/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2 font-space">Protocol Licensing Model</h2>
              <p className="text-gray-300 text-sm max-w-xl mb-4">
                <strong>Equity is not offered.</strong> GlyphLock provisions access through credentialed licensing.
              </p>
              <p className="text-xs text-gray-500 italic">
                No dilution • No equity sale • Protocol governed operator network
              </p>
            </div>
            <div className="flex gap-4">
              <Link to={createPageUrl("Consultation")}>
                <Button className="bg-[#00E4FF] text-black hover:bg-white font-bold shadow-lg shadow-[#00E4FF]/20">
                  Request Credentials
                </Button>
              </Link>
              <Link to={createPageUrl("Contact")}>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Contact Authority
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 pt-8 flex justify-between text-xs text-gray-500">
          <p>© GlyphLock LLC</p>
          <p>Not an offer to sell securities</p>
        </footer>
      </main>
      </div>
    </>
  );
}