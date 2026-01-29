import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Shield, Lock, Cpu, QrCode, Eye, Map, Zap, Database, 
  ShoppingCart, Brain, Globe, AlertCircle, CheckCircle2
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { motion, useInView } from "framer-motion";

export default function Services() {
  const heroRef = useRef(null);
  const servicesRef = useRef(null);
  const industriesRef = useRef(null);
  const techRef = useRef(null);
  const ctaRef = useRef(null);
  
  const heroInView = useInView(heroRef, { once: true, amount: 0.4 });
  const servicesInView = useInView(servicesRef, { once: true, amount: 0.2 });
  const industriesInView = useInView(industriesRef, { once: true, amount: 0.3 });
  const techInView = useInView(techRef, { once: true, amount: 0.4 });
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.4 });

  const services = [
    {
      id: "qr-verification",
      icon: QrCode,
      title: "QR Verification Module",
      description: "QR verification and steganographic encoding module – governed by protocol, accessible only with provisioned credentials.",
      features: [
        "Quantum-resistant QR code generation with embedded encryption",
        "Steganographic encoding - hide encrypted data within images",
        "AI-powered threat detection to prevent quishing attacks",
        "Blockchain immutability for transaction verification",
        "Custom branding and logo embedding",
        "Multiple format support (PNG, SVG, JPG)"
      ],
      page: "Qr",
      color: "blue"
    },
    {
      id: "glyphbot-ai",
      icon: Brain,
      title: "GlyphBot Intelligence Module",
      description: "Autonomous threat suppression module – AI-driven security analysis restricted to credentialed operators.",
      features: [
        "Real-time threat analysis and detection",
        "Secure code execution in isolated environments",
        "Automated vulnerability scanning",
        "Security audit report generation",
        "Natural language security consultations",
        "WhatsApp integration for mobile access",
        "Multiple AI personas for specialized tasks"
      ],
      page: "GlyphBot",
      color: "violet"
    },
    {
      id: "nups-pos",
      icon: ShoppingCart,
      title: "NUPS Transaction Verification",
      description: "Protocol-governed transaction module – system-enforced verification restricted to authorized venues.",
      features: [
        "Real-time inventory tracking with low-stock alerts",
        "Customer loyalty programs and rewards",
        "VIP room management and tracking",
        "Entertainer check-in and contract management",
        "Multi-location support with centralized reporting",
        "Z-report generation for daily reconciliation",
        "Marketing campaign management (Email/SMS)",
        "AI-powered product recommendations"
      ],
      page: "NUPSLogin",
      color: "emerald"
    },

    {
      id: "security-operations",
      icon: Shield,
      title: "Security Operations Module",
      description: "System-enforced monitoring module – credentialed threat intelligence restricted to provisioned operators.",
      features: [
        "24/7 real-time threat monitoring",
        "Automated vulnerability scanning",
        "Incident response workflow automation",
        "Threat intelligence integration",
        "Security audit logging and compliance",
        "Custom security policies and rules",
        "Enterprise-grade encryption and access control"
      ],
      page: "SecurityOperationsCenter",
      color: "red"
    },
    {
      id: "blockchain-security",
      icon: Database,
      title: "Blockchain Verification Module",
      description: "Immutable ledger module – protocol-enforced integrity verification with cryptographic governance.",
      features: [
        "Immutable transaction records",
        "Smart contract integration",
        "Cryptographic verification",
        "Audit trail generation",
        "Tamper-proof data storage",
        "Multi-signature authentication"
      ],
      page: "Blockchain",
      color: "cyan"
    }
  ];

  const industries = [
    {
      name: "Hospitality & Entertainment",
      description: "Clubs, bars, restaurants, hotels, and entertainment venues requiring secure payment processing, customer tracking, and VIP management."
    },
    {
      name: "Enterprise & Corporate",
      description: "Large organizations needing comprehensive security operations, threat monitoring, and compliance management."
    },
    {
      name: "Technology & Software",
      description: "Tech companies requiring AI security, intellectual property protection, and secure development workflows."
    },
    {
      name: "Healthcare & Finance",
      description: "Regulated industries needing HIPAA and PCI DSS compliant security solutions with audit trails."
    },
    {
      name: "Retail & E-commerce",
      description: "Online and brick-and-mortar retailers needing secure payment processing and fraud prevention."
    },
    {
      name: "Government & Defense",
      description: "Public sector organizations requiring quantum-resistant encryption and classified data protection."
    }
  ];

  return (
    <>
      <SEOHead 
        title="Services - Cybersecurity Solutions | GlyphLock Platform"
        description="Explore GlyphLock's comprehensive cybersecurity services including Visual Cryptography, GlyphBot AI, NUPS POS System, Security Operations Center, Blockchain Security, and Hotzone Mapper. Quantum-resistant protection for enterprises."
        keywords="cybersecurity services, visual cryptography, QR security, steganography, GlyphBot AI, NUPS POS, security operations center, blockchain security, hotzone mapper, threat detection, vulnerability scanning"
        url="/services"
      />
      
      <div className="min-h-screen bg-black text-white py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div ref={heroRef} className="text-center mb-12 md:mb-16 px-4">
            <motion.h1 
              initial={{ opacity: 0, x: -100 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl md:text-4xl lg:text-6xl font-bold mb-4 md:mb-6"
            >
              <span className="bg-gradient-to-r from-blue-400 via-violet-500 to-emerald-400 bg-clip-text text-transparent">
                GlyphLock System Modules
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: 100 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="text-base md:text-xl text-white/70 max-w-3xl mx-auto mb-6 md:mb-8"
            >
              Protocol-governed verification modules – credentialed integrity system operating under cryptographic governance.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={heroInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.9, delay: 0.3, type: "spring", stiffness: 120 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <Link to={createPageUrl("Consultation")}>
                <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white">
                  Request Credentials
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Services Grid */}
          <div ref={servicesRef} className="space-y-8 md:space-y-12 mb-12 md:mb-16">
            {services.map((service, idx) => (
              <motion.div 
                key={service.id} 
                initial={{ opacity: 0, x: idx % 2 === 0 ? -80 : 80 }}
                animate={servicesInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 1, delay: 0.15 + (idx * 0.12), ease: [0.16, 1, 0.3, 1] }}
                className="glass-card-dark border border-blue-500/30 rounded-xl p-6 md:p-8" 
                style={{ background: 'rgba(30, 58, 138, 0.2)', backdropFilter: 'blur(16px)' }}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/50">
                    <service.icon className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">{service.title}</h3>
                    <p className="text-white/70">{service.description}</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3 mb-6">
                  {service.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                      <span className="text-sm text-white/80">{feature}</span>
                    </div>
                  ))}
                </div>
                <Link to={createPageUrl(service.page)}>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Access Module
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Industries Served */}
          <div ref={industriesRef} className="mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 40 }}
              animate={industriesInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl font-bold text-center mb-8"
            >
              <span className="text-white">Industries We </span>
              <span className="text-blue-400">Protect</span>
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-6">
              {industries.map((industry, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={industriesInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{ duration: 0.9, delay: 0.2 + (idx * 0.1), ease: [0.16, 1, 0.3, 1] }}
                  className="glass-card-dark border border-blue-500/30 rounded-xl p-6" 
                  style={{ background: 'rgba(30, 58, 138, 0.2)', backdropFilter: 'blur(16px)' }}
                >
                  <h3 className="text-lg font-semibold text-white mb-2">{industry.name}</h3>
                  <p className="text-sm text-white/70">{industry.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Technology Stack */}
          <motion.div 
            ref={techRef}
            initial={{ opacity: 0, y: 60 }}
            animate={techInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card-dark border border-blue-500/30 rounded-xl p-8 text-center" 
            style={{ background: 'rgba(30, 58, 138, 0.2)', backdropFilter: 'blur(16px)' }}
          >
            <motion.h2 
              initial={{ opacity: 0, x: -80 }}
              animate={techInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl font-bold text-white mb-4"
            >
              System-Enforced Verification Architecture
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, x: 80 }}
              animate={techInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="text-white/70 mb-6 max-w-3xl mx-auto"
            >
              Quantum-resistant cryptographic governance with autonomous threat suppression. 
              Protocol-enforced compliance with SOC 2, GDPR, ISO 27001, PCI DSS, and HIPAA.
            </motion.p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-400" />
                <span>AES-256 Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span>Quantum-Resistant</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-violet-400" />
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Blockchain Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-orange-400" />
                <span>Global Infrastructure</span>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div 
            ref={ctaRef}
            initial={{ opacity: 0, y: 70, scale: 0.92 }}
            animate={ctaInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 text-center"
          >
            <motion.h2 
              initial={{ opacity: 0, x: -100 }}
              animate={ctaInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl font-bold text-white mb-4"
            >
              Ready to Deploy Protocol-Governed Verification?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, x: 100 }}
              animate={ctaInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1.1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="text-white/70 mb-8 max-w-2xl mx-auto"
            >
              Initiate credentialed access verification with GlyphLock specialists to provision system-enforced capabilities.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={ctaInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 1, delay: 0.4, type: "spring", stiffness: 100 }}
            >
              <Link to={createPageUrl("Consultation")}>
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white">
                  Request Credentials
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
}