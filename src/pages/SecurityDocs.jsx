import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Key, FileText, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SEOHead from "@/components/SEOHead";

export default function SecurityDocs() {
  const docs = [
    {
      icon: Shield,
      title: "Encryption Standards",
      description: "Documented encryption controls use supported platform and provider capabilities. Exact algorithms, key handling, and transport settings depend on the deployed service and configuration.",
      badge: "AES-256"
    },
    {
      icon: Key,
      title: "Authentication",
      description: "Multi-factor authentication, OAuth 2.0, and JWT tokens with secure key rotation every 30 days. Hardware key support enabled.",
      badge: "MFA Enabled"
    },
    {
      icon: Lock,
      title: "Data Protection",
      description: "All user data is encrypted, backed up daily, and stored in SOC 2 aligned infrastructure with 99.99% uptime SLA. Zero-knowledge architecture available.",
      badge: "SOC 2 Aligned"
    },
    {
      icon: FileText,
      title: "Compliance",
      description: "Privacy and security frameworks are treated as scope-dependent references and design targets. Certification or independent attestation is claimed only when specifically documented.",
      badge: "Scope Dependent"
    }
  ];

  return (
    <>
      <SEOHead 
        title="Security Documentation | GlyphLock"
        description="Overview of GlyphLock's encryption standards, compliance protocols, and data protection architecture."
        url="/security-docs"
      />
      <div className="min-h-screen bg-black text-white py-32 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#001F54]/50 to-transparent pointer-events-none"></div>
        
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <div className="text-center mb-20">
            <h1 className="text-5xl md:text-7xl font-black mb-6 font-space tracking-tighter">
              SECURITY <span className="text-[#00E4FF]">DOCS</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Transparency in our defense architecture.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {docs.map((doc, idx) => {
              const Icon = doc.icon;
              return (
                <div key={idx} className="glass-card rounded-2xl p-8 border border-white/10 hover:border-[#00E4FF]/30 transition-all group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 bg-[#00E4FF]/10 rounded-xl flex items-center justify-center border border-[#00E4FF]/20 group-hover:bg-[#00E4FF]/20 transition-all">
                      <Icon className="w-7 h-7 text-[#00E4FF]" />
                    </div>
                    <Badge className="bg-[#00E4FF]/10 text-[#00E4FF] border-[#00E4FF]/30">
                      {doc.badge}
                    </Badge>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 font-space">{doc.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-lg">{doc.description}</p>
                </div>
              );
            })}
          </div>

          <div className="glass-card rounded-2xl border border-[#8C4BFF]/30 p-10 bg-[#8C4BFF]/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#8C4BFF]/10 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-white mb-6 font-space">Security Reporting</h3>
              <p className="text-gray-300 mb-8 text-lg max-w-2xl">
                Found a security vulnerability? We take security seriously and appreciate responsible disclosure. 
                Our bounty program rewards valid findings.
              </p>
              <a href="mailto:carloearl@glyphlock.com" className="inline-flex items-center gap-2 text-[#00E4FF] hover:text-white font-bold uppercase tracking-wide transition-colors border-b border-[#00E4FF] pb-1">
                Report Vulnerability <Shield className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}