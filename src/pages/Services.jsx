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
      id: "qr-identity",
      icon: QrCode,
      title: "QR Identity Studio",
      description: "Visual identity layer – embed verified metadata into scannable assets across your creative ecosystem.",
      features: [
        "QR-based identity for every asset",
        "Steganographic data embedding",
        "Multi-slot credentialed payloads",
        "Blockchain timestamping",
        "Custom branding and design",
        "Cross-platform verification"
      ],
      page: "Qr",
      color: "blue"
    },
    {
      id: "glyphbot-ai",
      icon: Brain,
      title: "GlyphBot Builder AI",
      description: "AI assistant for site audits, architecture analysis, and ecosystem design guidance.",
      features: [
        "Site architecture analysis",
        "Code quality audits",
        "Automated optimization suggestions",
        "Knowledge synthesis and documentation",
        "Natural language builder consultations",
        "WhatsApp integration",
        "Multiple AI personas for specialized tasks"
      ],
      page: "GlyphBot",
      color: "violet"
    },
    {
      id: "nups-commerce",
      icon: ShoppingCart,
      title: "NUPS Commerce Infrastructure",
      description: "Covenant-backed commerce platform with verified transactions and ownership trails.",
      features: [
        "Real-time inventory with blockchain sync",
        "Customer loyalty with verified rewards",
        "VIP access management",
        "Contract automation with Covenant proof",
        "Multi-location ecosystem support",
        "Automated reconciliation reports",
        "Marketing with verified attribution",
        "AI-powered recommendations"
      ],
      page: "NUPSLogin",
      color: "emerald"
    },

    {
      id: "site-builder",
      icon: Shield,
      title: "AI Site Building Engine",
      description: "Build verified web ecosystems with AI-powered architecture, design, and deployment tools.",
      features: [
        "AI-powered site generation",
        "Component library access",
        "Real-time collaboration",
        "Automated optimization",
        "SEO and performance audits",
        "Master Covenant integration",
        "Open source extensibility"
      ],
      page: "SiteBuilder",
      color: "red"
    },
    {
      id: "blockchain-authorship",
      icon: Database,
      title: "Blockchain Authorship Proof",
      description: "Immutable timestamping – lock creative work to verifiable on-chain records with Master Covenant architecture.",
      features: [
        "Immutable creation timestamps",
        "Smart contract authorship",
        "Cryptographic ownership proof",
        "Full audit trail generation",
        "Tamper-evident asset registry",
        "Multi-signature verification"
      ],
      page: "Blockchain",
      color: "cyan"
    }
  ];

  const industries = [
    {
      name: "Creators & Artists",
      description: "Protect creative work with verifiable authorship, QR-linked portfolios, and Covenant-backed ownership proof."
    },
    {
      name: "Web Agencies & Builders",
      description: "Build verified client sites with AI infrastructure, covenant contracts, and blockchain-anchored deliverables."
    },
    {
      name: "Technology & Platforms",
      description: "Extend your platform with GlyphLock's open framework for identity, verification, and creative infrastructure."
    },
    {
      name: "Commerce & Hospitality",
      description: "Verified transactions, customer identity, and covenant-backed contracts for trust at scale."
    },
    {
      name: "Education & Publishing",
      description: "Protect intellectual property with Master Covenant authorship and immutable creative records."
    },
    {
      name: "Enterprise & Government",
      description: "Custom ecosystem architecture with compliance-ready verification and open source auditability."
    }
  ];

  return (
    <>
      <SEOHead 
        title="Services - Creative Infrastructure Modules | GlyphLock Ecosystem"
        description="Explore GlyphLock's creative infrastructure: QR Identity Studio, Image Lab, GlyphBot AI builder, Site Building tools, Blockchain authorship, and Master Covenant verification. Open framework for verified digital worlds."
        keywords="creative infrastructure, QR identity, image generation, site building, GlyphBot AI, blockchain authorship, Master Covenant, verified ownership, digital ecosystem, open source framework"
        url="/services"
      />
      
      <div className="min-h-screen bg-black text-white py-12 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          {/* Header */}
          <div ref={heroRef} className="text-center mb-10 md:mb-16 px-2 sm:px-4">
            <motion.h1 
              initial={{ opacity: 0, x: -100 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-3 md:mb-6 leading-tight"
            >
              <span className="bg-gradient-to-r from-blue-400 via-violet-500 to-emerald-400 bg-clip-text text-transparent">
                GlyphLock Creative Modules
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: 100 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm sm:text-base md:text-xl text-white/70 max-w-3xl mx-auto mb-6 md:mb-8"
            >
              Build verified ecosystems with QR identity, AI site infrastructure, and Covenant-backed authorship proof.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={heroInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.9, delay: 0.3, type: "spring", stiffness: 120 }}
              className="flex flex-wrap justify-center gap-3 px-2"
            >
              <Link to={createPageUrl("Consultation")}>
                <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white">
                  Start Building
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Services Grid */}
          <div ref={servicesRef} className="space-y-6 md:space-y-12 mb-12 md:mb-16">
            {services.map((service, idx) => (
              <motion.div 
                key={service.id} 
                initial={{ opacity: 0, x: idx % 2 === 0 ? -80 : 80 }}
                animate={servicesInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 1, delay: 0.15 + (idx * 0.12), ease: [0.16, 1, 0.3, 1] }}
                className="glass-card-dark border border-blue-500/30 rounded-xl p-5 md:p-8" 
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
                    Explore Module
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
              <span className="text-white">Ecosystems We </span>
              <span className="text-blue-400">Enable</span>
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
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
              Open Framework Architecture
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, x: 80 }}
              animate={techInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="text-white/70 mb-6 max-w-3xl mx-auto"
            >
              Build on verified infrastructure with QR identity, blockchain authorship, and Master Covenant proof. 
              Extensible, auditable, and designed for creative sovereignty at scale.
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
              Ready to Build Your Creative Ecosystem?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, x: 100 }}
              animate={ctaInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1.1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="text-white/70 mb-8 max-w-2xl mx-auto"
            >
              Start with GlyphLock's open framework for QR identity, site building, and verified ownership infrastructure.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={ctaInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 1, delay: 0.4, type: "spring", stiffness: 100 }}
            >
              <Link to={createPageUrl("Consultation")}>
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white">
                  Start Building
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
}