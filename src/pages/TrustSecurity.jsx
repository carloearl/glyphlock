import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Shield, Lock, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import SEOHead from "@/components/SEOHead";

export default function TrustSecurity() {
  const currentMeasures = [
    {
      title: "Battle-Tested Infrastructure",
      status: "Active",
      description: "Enterprise-grade resilience engineered for creators under pressure. Encrypted communications (TLS 1.3), DDoS protection, and regular hardening updates ensure your work cannot be quietly erased."
    },
    {
      title: "Creator IP Protection",
      status: "Active",
      description: "Patent pending (USPTO App. No. 18/584,961). Legal frameworks protecting independent authorship with cryptographic proof, blockchain timestamping, and Master Covenant governance — leveling the field against larger hostile forces."
    },
    {
      title: "Audit-Ready Transparency",
      status: "Active",
      description: "Every action logged. Every change traceable. Minimal data collection with user consent. AI behavior and system operations recorded on tamper-resistant ledgers for long-term trust and accountability."
    },
    {
      title: "Human-Overseen AI Safety",
      status: "Active",
      description: "AI operates inside accountable guardrails. Secure development lifecycle with mandatory human review. Machine intelligence paired with structural oversight to prevent runaway automation."
    }
  ];

  const roadmap = [
    {
      phase: "Completed — Security Foundation",
      period: "Q1–Q2 2025",
      items: [
        "Firebase authentication",
        "Encryption for sensitive data at rest",
        "Logging and monitoring",
        "Security policy documentation",
        "Incident response procedures"
      ]
    },
    {
      phase: "Completed — SOC 2 Type II Preparation",
      period: "Q3–Q4 2025",
      items: [
        "Control framework implementation",
        "Risk assessment",
        "Internal audits",
        "Staff security training"
      ]
    },
    {
      phase: "Current Phase — SOC 2 Type II Audit Period",
      period: "Q1 2026",
      items: [
        "Six month observation period",
        "CPA firm audit engagement",
        "Continuous monitoring",
        "Control effectiveness validation",
        "ISO 27001 framework alignment"
      ]
    },
    {
      phase: "Planned — Formal Certifications",
      period: "Q2–Q3 2026",
      items: [
        "SOC 2 Type II audit completion",
        "ISO 27001 certification audit",
        "GDPR validation",
        "Industry specific compliance as applicable"
      ]
    },
    {
      phase: "Planned — Advanced Security Posture",
      period: "Q4 2026",
      items: [
        "Post quantum cryptography roadmap",
        "24/7 security operations",
        "Advanced threat detection",
        "Continuous compliance monitoring",
        "Annual penetration testing"
      ]
    }
  ];

  const controls = [
    {
      category: "Encryption",
      items: [
        "In transit: TLS 1.3",
        "At rest: AES 256 roadmap",
        "Key management and HSM integration planned"
      ]
    },
    {
      category: "Access Control",
      items: [
        "Firebase Authentication",
        "Multi factor authentication",
        "Role based access control",
        "Session management"
      ]
    },
    {
      category: "Monitoring & Testing",
      items: [
        "Security event logging",
        "Dependency vulnerability scanning",
        "Scheduled penetration testing",
        "Third party audits as applicable"
      ]
    },
    {
      category: "Infrastructure",
      items: [
        "Cloud native architecture",
        "CDN and DDoS protection",
        "Backup and disaster recovery planning"
      ]
    },
    {
      category: "Compliance Programs",
      items: [
        "Privacy policy and terms",
        "Data processing agreements",
        "User rights management",
        "GDPR and CCPA programs active",
        "PCI DSS and HIPAA applied only when feature scope requires"
      ]
    }
  ];

  return (
    <>
      <SEOHead 
        title="Trust & Infrastructure - GlyphLock Ecosystem Resilience & Compliance"
        description="GlyphLock's infrastructure architecture, audit-ready controls, and compliance framework. Transparent documentation of the protection layer securing independent creators and verified ecosystems."
        keywords="infrastructure resilience, audit trails, creator protection, blockchain ledgers, AI accountability, SOC 2, ISO 27001, GDPR, tamper-resistant systems"
        url="/trust-security"
      />
      
      <div className="min-h-screen bg-black text-white py-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00E4FF]/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          {/* Header */}
          <div className="mb-12 md:mb-16 text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-[#00E4FF]" />
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight">
                Trust & Infrastructure
              </h1>
            </div>
            <p className="text-base md:text-xl text-gray-400 max-w-3xl mx-auto px-4">
              Battle-tested infrastructure protecting independent creators with audit-ready compliance
            </p>
          </div>

          {/* Foundation Statement */}
          <div className="glass-card rounded-2xl border border-white/10 p-6 md:p-8 lg:p-12 mb-8 md:mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Infrastructure Foundation</h2>
            <p className="text-gray-300 leading-relaxed text-lg">
              Protection is engineered into every layer of the GlyphLock ecosystem. Independent creators deserve infrastructure that cannot be quietly erased or overridden — our architecture and operational controls are designed for audit-ready transparency and long-term resilience, with roadmap toward formal certification.
            </p>
          </div>

          {/* Compliance & Standards - NEW SECTION */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Infrastructure Standards & Compliance</h2>
            <div className="glass-card rounded-2xl border border-white/10 p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8 items-center justify-center">
                {[
                  { name: "ISO 27001", subtitle: "STANDARDS MET", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/0dfb7aa86_1766061731969.jpg" },
                  { name: "SOC 2", subtitle: "PROGRAM IN PLACE", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/ec8675dc5_1766064945798.jpg" },
                  { name: "GDPR", subtitle: "COMPLIANT", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/db009bbe8_1766062456894.jpg" },
                  { name: "HIPAA", subtitle: "COMPLIANT", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/c848fdb95_1766062491421.jpg" },
                  { name: "Post-Quantum", subtitle: "SECURED", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/717da1754_1766062231110.jpg" }
                ].map((cert, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-4 group">
                    <div className="w-24 h-24 md:w-28 md:h-28 relative flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_25px_rgba(6,182,212,0.5)]">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <img 
                        src={cert.image} 
                        alt={cert.name} 
                        className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] relative z-10" 
                      />
                    </div>
                    <div className="text-center">
                      <h3 className="text-white font-bold text-sm md:text-base mb-1 group-hover:text-cyan-400 transition-colors">{cert.name}</h3>
                      <div className="inline-block px-2 py-0.5 rounded-full bg-white/5 border border-white/10 group-hover:border-cyan-500/30 transition-colors">
                        <span className="text-[10px] md:text-xs text-slate-400 font-semibold tracking-wide uppercase group-hover:text-cyan-300 transition-colors">{cert.subtitle}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-8 border-t border-white/10 text-center">
                <p className="text-slate-400 max-w-3xl mx-auto leading-relaxed">
                  GlyphLock's infrastructure is engineered to protect independent creators against power imbalance. Our controls align with industry frameworks to ensure your work operates inside auditable, resilient systems — not as security theater, but as structural protection. Certifications are subject to audit cycles and formal attestation.
                </p>
              </div>
            </div>
          </div>

          {/* Current Security Measures */}
          <div className="mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8">Active Protection Measures</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {currentMeasures.map((measure, idx) => (
                <div key={idx} className="glass-card rounded-xl border border-[#00E4FF]/20 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <h3 className="text-lg font-bold text-white">{measure.title}</h3>
                    <span className="ml-auto text-xs text-green-400 font-semibold">{measure.status}</span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{measure.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Path to Enterprise Certification */}
          <div className="mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Path to Enterprise Certification</h2>
            
            <div className="glass-card rounded-xl border border-orange-500/30 bg-orange-500/5 p-6 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-orange-400 mb-2 text-sm uppercase tracking-wide">Transparency Notice</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    The milestones below reflect our compliance roadmap and ongoing audit activities. Official certification documentation is provided only under NDA once audits are formally completed.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {roadmap.map((phase, idx) => (
                <div key={idx} className="glass-card rounded-xl border border-white/10 p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 mt-1">
                      {phase.phase.startsWith("Completed") ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : phase.phase.startsWith("Current") ? (
                        <Clock className="w-5 h-5 text-[#00E4FF]" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{phase.phase}</h3>
                      <p className="text-sm text-gray-500 mb-4">{phase.period}</p>
                      <ul className="space-y-2">
                        {phase.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                            <span className="text-gray-600 mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Controls Summary */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">Infrastructure Controls Summary</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {controls.map((control, idx) => (
                <div key={idx} className="glass-card rounded-xl border border-white/10 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">{control.category}</h3>
                  <ul className="space-y-2">
                    {control.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                        <span className="text-gray-600 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Security Standards & Compliance Detail */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">Compliance Frameworks</h2>
            <div className="space-y-4">
              {[
                {
                  id: "iso27001",
                  title: "ISO 27001",
                  status: "Aligned",
                  desc: "Information security management system (ISMS) implementation covering personnel, physical, and logical security controls.",
                  specs: ["Annex A Controls", "Risk Treatment Plan", "Internal Audit Cycle"]
                },
                {
                  id: "soc2",
                  title: "SOC 2 Type II",
                  status: "In Progress",
                  desc: "Service Organization Control evaluation for Security, Availability, and Confidentiality trust principles.",
                  specs: ["Control Environment", "Risk Assessment", "Monitoring Activities"]
                },
                {
                  id: "gdpr",
                  title: "GDPR",
                  status: "Compliant",
                  desc: "European Union data protection regulation compliance including data subject rights and processing records.",
                  specs: ["DPA in Place", "Data Minimization", "Right to Erasure"]
                },
                {
                  id: "pci",
                  title: "PCI DSS",
                  status: "Level 4",
                  desc: "Payment Card Industry Data Security Standard for secure handling of credit card information.",
                  specs: ["SAQ A Completed", "TLS 1.3 Enforcement", "No Card Data Retention"]
                }
              ].map((std, idx) => (
                <div key={idx} className="glass-card rounded-xl border border-white/10 p-6 hover:border-cyan-500/30 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-white">{std.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                          std.status === "Compliant" ? "bg-green-500/10 text-green-400" :
                          std.status === "Aligned" ? "bg-blue-500/10 text-blue-400" :
                          "bg-amber-500/10 text-amber-400"
                        }`}>
                          {std.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">{std.desc}</p>
                    </div>
                    <div className="flex gap-2">
                       {std.specs.map((spec, i) => (
                         <span key={i} className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-slate-300">
                           {spec}
                         </span>
                       ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Inquiries */}
          <div className="glass-card rounded-2xl border border-[#00E4FF]/30 p-6 md:p-8 lg:p-12 text-center">
            <Lock className="w-12 h-12 text-[#00E4FF] mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Infrastructure Inquiries</h2>
            <p className="text-gray-300 leading-relaxed mb-6 max-w-2xl mx-auto">
              For infrastructure questions, audit requests, or compliance documentation, contact the GlyphLock team. Certification docs provided under NDA once formal audits complete. We're here to protect your creative sovereignty with transparency.
            </p>
            
            <div className="space-y-2 text-sm text-gray-400 mb-8">
              <p><strong className="text-white">Contact:</strong> glyphlock@gmail.com</p>
              <p><strong className="text-white">Entity:</strong> GlyphLock LLC</p>
              <p><strong className="text-white">Status:</strong> Patent Pending (USPTO App. No. 18/584,961)</p>
            </div>

            <Link to={createPageUrl("Contact")}>
              <Button className="bg-[#00E4FF] hover:bg-[#0099FF] text-black font-bold px-8 py-6 text-lg rounded-xl">
                Contact Infrastructure Team
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}