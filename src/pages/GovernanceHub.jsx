import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Shield, Lock, ChevronRight, Scale, Crown, AlertCircle
} from "lucide-react";
import SEOHead from "@/components/SEOHead";

export default function GovernanceHub() {
  const [selectedSection, setSelectedSection] = useState("overview");

  const sections = [
    { id: "overview", label: "Overview", icon: FileText },
    { id: "scope", label: "Governance Scope", icon: Shield },
    { id: "cab", label: "Constructive Binding", icon: Lock },
    { id: "authority", label: "Authority & Enforcement", icon: Scale },
    { id: "patent", label: "Patent & Jurisdiction", icon: Crown }
  ];

  const renderContent = () => {
    switch(selectedSection) {
      case "overview":
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 font-space tracking-tight">
                The GlyphLock Master Covenant
              </h2>
              <p className="text-lg text-[#00E4FF] mb-8 font-medium">
                Protocol Governance Framework
              </p>
              
              <div className="glass-card rounded-2xl border border-[#00E4FF]/30 p-8 space-y-6 bg-[#00E4FF]/5">
                <p className="text-gray-300 leading-relaxed">
                  The GlyphLock Master Covenant is the structural shield protecting independent creators from power imbalance. It defines authorship governance, AI accountability guardrails, and ledger-backed enforcement architecture — ensuring creative work cannot be quietly erased, stolen, or overridden.
                </p>
                
                <div className="bg-black/40 border border-[#00E4FF]/20 rounded-xl p-6">
                  <p className="text-white font-semibold mb-3">It is battle-tested infrastructure, not a passive agreement.</p>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Binding obligations arise through <strong className="text-white">credentialed access</strong>, <strong className="text-white">explicit execution</strong>, or <strong className="text-white">authorized protocol interaction</strong>. Every action is logged on tamper-resistant ledgers. Every AI operation runs inside human-overseen guardrails.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl border border-[#8C4BFF]/30 p-8">
              <h3 className="text-xl font-bold text-white mb-6 font-space">Access Control Notice</h3>
              <div className="space-y-4 text-sm text-gray-300">
                <p className="text-white font-semibold">
                  This page does not constitute an agreement.
                </p>
                <p className="leading-relaxed">
                  Access to binding terms, enforcement mechanisms, and execution pathways is restricted to credentialed parties following protocol verification.
                </p>
                <div className="bg-[#8C4BFF]/10 border border-[#8C4BFF]/20 rounded-lg p-4 mt-4">
                  <p className="text-xs text-[#8C4BFF] font-semibold uppercase tracking-wide mb-2">
                    Next Step
                  </p>
                  <p className="text-xs text-gray-300">
                    Execution of the Master Covenant occurs only as part of a verified GlyphLock protocol engagement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "scope":
        return (
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 font-space">
              What the Master Covenant Protects
            </h2>
            
            <div className="glass-card rounded-2xl border border-[#00E4FF]/20 p-8 space-y-6">
              <p className="text-gray-300 leading-relaxed text-lg">
                The Master Covenant is the unified governance layer defending creators and ensuring accountability:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  "Creator authorship proof with blockchain timestamps",
                  "Intellectual property that cannot be silently stolen",
                  "AI operations inside auditable guardrails",
                  "Credentialed access with tamper-evident logs",
                  "Machine intelligence paired with human oversight",
                  "Execution terms enforced through verifiable ledgers"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-black/40 rounded-lg border border-white/5">
                    <ChevronRight className="w-5 h-5 text-[#00E4FF] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>

              <div className="bg-[#00E4FF]/10 border border-[#00E4FF]/30 rounded-xl p-6 mt-6">
                <p className="text-white font-semibold text-sm">
                  All GlyphLock ecosystems operate inside this protective framework — engineered for resilience, not hype.
                </p>
              </div>
            </div>
          </div>
        );

      case "cab":
        return (
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 font-space">
              Constructive Binding Architecture (CAB)
            </h2>
            
            <div className="glass-card rounded-2xl border border-emerald-500/20 p-8 space-y-6">
              <p className="text-gray-300 leading-relaxed text-lg mb-6">
                Constructive Binding Architecture (CAB) defines how obligations become binding within the GlyphLock ecosystem — protecting small operators from ambiguous terms and ensuring every commitment is traceable, auditable, and enforceable on tamper-resistant ledgers.
              </p>

              <div className="bg-black/40 rounded-xl border border-emerald-500/20 p-6">
                <h3 className="font-bold text-white mb-4">CAB recognizes binding events through verifiable actions:</h3>
                <div className="space-y-3">
                  {[
                    "Executed agreements with cryptographic signatures",
                    "Credentialed system access logged on blockchain",
                    "Authorized protocol interactions with audit trails"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span className="text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                <p className="text-sm text-gray-300 leading-relaxed">
                  <strong className="text-white">CAB operates within established legal frameworks</strong> and does not replace statutory law. It strengthens enforcement through machine-readable accountability — every obligation, every action, every change recorded for long-term trust.
                </p>
              </div>
            </div>
          </div>
        );

      case "authority":
        return (
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 font-space">
              Authority & Enforcement
            </h2>
            
            <div className="glass-card rounded-2xl border border-[#8C4BFF]/20 p-8 space-y-6">
              <p className="text-gray-300 leading-relaxed text-lg">
                Enforcement authority under the Master Covenant protects independent creators by leveling the field. Authority is exercised only by designated GlyphLock principals or governed entities, as defined in executed agreements — ensuring larger forces cannot quietly override creator rights.
              </p>

              <div className="bg-black/40 border border-[#8C4BFF]/20 rounded-xl p-6">
                <h3 className="font-bold text-white mb-4">No enforcement action without verifiable proof:</h3>
                <div className="space-y-3">
                  {[
                    "Cryptographic verification on blockchain ledgers",
                    "Explicit authorization logged with audit trails",
                    "Documented scope with tamper-evident timestamps"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-[#8C4BFF] rounded-full"></div>
                      <span className="text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "patent":
        return (
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 font-space">
              Patent & Jurisdiction
            </h2>
            
            <div className="glass-card rounded-2xl border border-[#00E4FF]/20 p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-black/40 border border-[#00E4FF]/20 p-6 rounded-xl">
                  <h4 className="text-sm font-bold text-[#00E4FF] mb-2 uppercase tracking-wide">Patent Application</h4>
                  <p className="text-2xl font-black text-white mb-1">USPTO 18/584,961</p>
                  <p className="text-xs text-gray-400">Patent-pending framework protecting GlyphLock protocol operations</p>
                </div>
                
                <div className="bg-black/40 border border-[#00E4FF]/20 p-6 rounded-xl">
                  <h4 className="text-sm font-bold text-[#00E4FF] mb-2 uppercase tracking-wide">Primary Jurisdiction</h4>
                  <p className="text-2xl font-black text-white mb-1">Arizona</p>
                  <p className="text-xs text-gray-400">International considerations apply through executed agreements</p>
                </div>
              </div>

              <div className="bg-[#00E4FF]/10 border border-[#00E4FF]/30 rounded-xl p-6">
                <p className="text-sm text-gray-300 leading-relaxed">
                  Jurisdictional scope and enforcement mechanisms are defined within executed agreements or credentialed protocol deployments. This framework does not assert global enforceability absent formal agreement.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return <div className="text-white">Select a section to view content</div>;
    }
  };

  return (
    <>
      <SEOHead 
        title="Master Covenant - GlyphLock Authorship Governance Framework"
        description="The GlyphLock Master Covenant - Structural shield protecting independent creators with ledger-backed accountability, AI safety guardrails, and tamper-resistant authorship proof."
        keywords="master covenant, creator protection, authorship governance, AI accountability, blockchain ledgers, IP protection, audit trails, tamper-resistant systems"
        url="/governancehub"
      />
      
      <div className="min-h-screen bg-black text-white py-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00E4FF]/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          {/* Header */}
          <div className="mb-12 md:mb-16">
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-6">
              <Badge className="bg-[#8C4BFF]/10 text-[#8C4BFF] border-[#8C4BFF]/30 px-3 py-1">
                <Lock className="w-3 h-3 mr-2" /> Governance Framework
              </Badge>
              <Badge className="bg-[#00E4FF]/10 text-[#00E4FF] border-[#00E4FF]/30 px-3 py-1">
                Patent App. 18/584,961
              </Badge>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-3 py-1">
                Protocol Authority
              </Badge>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black mb-4 md:mb-6 tracking-tighter font-space leading-tight">
              <span className="text-transparent bg-gradient-to-r from-[#00E4FF] to-[#8C4BFF] bg-clip-text">
                MASTER COVENANT
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl">
              Structural Shield for Independent Creators
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
            {/* Sidebar */}
            <div className="glass-card rounded-2xl border border-white/10 p-3 md:p-4 h-fit lg:sticky lg:top-24">
              <div className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      selectedSection === section.id
                        ? "bg-[#00E4FF] text-black shadow-[0_0_15px_rgba(0,228,255,0.3)]"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <section.icon className="w-4 h-4" />
                    <span className="flex-1 text-left">{section.label}</span>
                    {selectedSection === section.id && <ChevronRight className="w-4 h-4" />}
                  </button>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="bg-[#8C4BFF]/10 border border-[#8C4BFF]/20 rounded-xl p-4">
                  <p className="text-xs text-gray-300 leading-relaxed">
                    <strong className="text-white">Framework Notice:</strong><br/>
                    This page provides governance context. Full binding terms require credentialed verification or explicit execution.
                  </p>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="glass-card rounded-2xl md:rounded-3xl border border-white/10 p-6 md:p-8 lg:p-12 bg-black/40">
              {renderContent()}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 md:mt-16 text-center glass-card rounded-2xl border border-[#00E4FF]/20 p-6 md:p-8 lg:p-12">
            <h3 className="text-2xl font-bold text-white mb-4">
              Build Inside Protected Infrastructure
            </h3>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Access the full enforcement framework with credentialed verification. Your work deserves infrastructure that cannot be quietly erased — Master Covenant provides the shield.
            </p>
            <Link to={createPageUrl("Consultation")}>
              <Button className="bg-[#00E4FF] hover:bg-[#0099FF] text-black font-bold px-8 py-6 text-lg rounded-xl shadow-[0_0_30px_rgba(0,228,255,0.4)]">
                Start Protected Building
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}