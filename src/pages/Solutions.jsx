import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Shield, Building2, Heart, ShoppingBag, Code, 
  Globe, Lock, CheckCircle2, ArrowRight 
} from "lucide-react";
import SEOHead from "@/components/SEOHead";

export default function Solutions() {
  const solutions = [
    {
      industry: "Hospitality & Entertainment",
      icon: Building2,
      description: "Transaction verification module – protocol-governed payment processing restricted to credentialed venues.",
      features: [
        "NUPS POS System with VIP room tracking",
        "Entertainer management and contracts",
        "Customer loyalty programs",
        "Secure payment processing with blockchain verification",
        "Real-time transaction monitoring",
        "Z-report generation and reconciliation"
      ],
      cta: "Explore NUPS POS",
      page: "NUPSLogin",
      color: "emerald"
    },
    {
      industry: "Healthcare",
      icon: Heart,
      description: "HIPAA verification module – system-enforced data protection with cryptographic audit governance.",
      features: [
        "HIPAA-compliant data encryption",
        "Patient data protection with steganography",
        "Secure medical record storage",
        "Audit logging and compliance reporting",
        "Multi-factor authentication",
        "Quantum-resistant encryption"
      ],
      cta: "Healthcare Security",
      page: "SecurityOperationsCenter",
      color: "red"
    },
    {
      industry: "Financial Services",
      icon: Lock,
      description: "PCI DSS verification module – protocol-enforced transaction integrity with credentialed access control.",
      features: [
        "PCI DSS-aligned transaction controls",
        "Real-time fraud detection",
        "Blockchain transaction verification",
        "Multi-signature authentication",
        "Regulatory compliance automation",
        "Secure API integration"
      ],
      cta: "Financial Security",
      page: "Blockchain",
      color: "blue"
    },
    {
      industry: "Retail & E-commerce",
      icon: ShoppingBag,
      description: "Transaction verification module – system-enforced checkout integrity restricted to provisioned merchants.",
      features: [
        "Secure payment gateway integration",
        "Customer data encryption",
        "Inventory tracking with blockchain",
        "Loyalty program management",
        "Fraud detection and prevention",
        "Multi-location support"
      ],
      cta: "Retail Solutions",
      page: "SecurityTools",
      color: "violet"
    },
    {
      industry: "Technology & Software",
      icon: Code,
      description: "IP verification module – protocol-governed asset protection with cryptographic provenance enforcement.",
      features: [
        "IP protection with Master Covenant",
        "Secure code repository integration",
        "AI model protection",
        "Automated security scanning",
        "GlyphBot AI development assistant",
        "Vulnerability detection"
      ],
      cta: "Tech Security",
      page: "GlyphBot",
      color: "cyan"
    },
    {
      industry: "Enterprise & Government",
      icon: Globe,
      description: "Security operations module – system-enforced threat monitoring with credentialed command authority.",
      features: [
        "24/7 security operations center",
        "Threat intelligence monitoring",
        "Compliance automation (SOC 2, ISO 27001)",
        "Incident response management",
        "Custom security policies",
        "Dedicated account management"
      ],
      cta: "Enterprise SOC",
      page: "SecurityOperationsCenter",
      color: "orange"
    }
  ];

  const benefits = [
    "Quantum-resistant encryption protecting against future threats",
    "AI-powered threat detection with real-time monitoring",
    "Blockchain verification for transaction immutability",
    "Multi-layer security combining cryptography and legal frameworks",
    "Control mapping for SOC 2, GDPR, ISO 27001, PCI DSS, and HIPAA readiness",
    "24/7 enterprise support with dedicated account managers"
  ];

  return (
    <>
      <SEOHead 
        title="Industry Solutions - Cybersecurity for Every Sector | GlyphLock"
        description="Tailored cybersecurity solutions for hospitality, healthcare, finance, retail, technology, and enterprise. Quantum-resistant protection with industry-specific compliance and features."
        keywords="industry cybersecurity solutions, healthcare HIPAA security, financial PCI DSS compliance, retail fraud prevention, technology IP protection, enterprise SOC, hospitality POS security, government classified data"
        url="/solutions"
      />
      
      <div className="min-h-screen text-white pt-14 md:pt-20 pb-12 md:pb-20" style={{ background: 'transparent' }}>
        <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
          <div className="text-center mb-10 md:mb-12 lg:mb-16 px-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-3 md:mb-4 lg:mb-6">
              <span className="text-white">Verification Modules for </span>
              <span className="bg-gradient-to-r from-blue-400 to-violet-600 bg-clip-text text-transparent">
                Credentialed Industries
              </span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base lg:text-xl text-white/70 max-w-3xl mx-auto mb-4 md:mb-6 lg:mb-8">
              Protocol-governed verification modules restricted to provisioned operators with industry-specific credential frameworks.
            </p>
          </div>

          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8 mb-10 md:mb-12 lg:mb-16">
            {solutions.map((solution, idx) => (
              <div key={idx} className="glass-card-dark border border-blue-500/30 hover:border-blue-500/50 transition-all rounded-lg md:rounded-xl p-4 md:p-6 lg:p-8" style={{ background: 'rgba(30, 58, 138, 0.2)', backdropFilter: 'blur(16px)' }}>
                <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
                  <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-blue-500/20 border border-blue-500/50 flex-shrink-0">
                    <solution.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white mb-1 md:mb-2">{solution.industry}</h2>
                    <p className="text-xs sm:text-sm md:text-base text-white/70 line-clamp-2">{solution.description}</p>
                  </div>
                </div>

                <div className="space-y-1.5 md:space-y-2 mb-4 md:mb-6">
                  {solution.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-white/80">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link to={createPageUrl(solution.page)}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 md:h-auto text-sm md:text-base" style={{ touchAction: 'manipulation' }}>
                    {solution.cta}
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <div className="glass-card-dark border border-blue-500/30 rounded-lg md:rounded-xl p-5 md:p-6 lg:p-8 mb-10 md:mb-12 lg:mb-16" style={{ background: 'rgba(30, 58, 138, 0.2)', backdropFilter: 'blur(16px)' }}>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6 text-center">
              Why Choose GlyphLock?
            </h2>
            <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-2 md:gap-3">
                  <Shield className="w-4 h-4 md:w-5 md:h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm md:text-base text-white/80">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center px-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4">
              Ready to Deploy Industry-Specific Verification?
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-white/70 mb-6 md:mb-8 max-w-2xl mx-auto">
              Initiate credential provisioning for protocol-governed access to industry-specific verification modules.
            </p>
            <Link to={createPageUrl("Consultation")}>
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white h-12 md:h-auto text-sm md:text-base" style={{ touchAction: 'manipulation' }}>
                Request Credentials
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}