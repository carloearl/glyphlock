import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Shield, Lock, Eye, Zap, Server, Activity } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { motion, useInView } from "framer-motion";

export default function SecurityTools() {
  const heroRef = useRef(null);
  const toolsRef = useRef(null);
  const whyRef = useRef(null);
  const ctaRef = useRef(null);
  
  const heroInView = useInView(heroRef, { once: true, amount: 0.4 });
  const toolsInView = useInView(toolsRef, { once: true, amount: 0.2 });
  const whyInView = useInView(whyRef, { once: true, amount: 0.3 });
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.4 });

  const tools = [
    {
      title: "QR Verification Module",
      description: "Cryptographic QR generation with steganographic encoding – governed by protocol, accessible only with provisioned credentials.",
      price: "Credentialed",
      link: "Qr",
      icon: Eye,
      image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/584a72f27_quantum-encryption-visualization-with-glowing-part.jpg"
    },
    {
      title: "Blockchain Verification Module",
      description: "Immutable ledger integrity – protocol-enforced verification with cryptographic governance.",
      price: "Credentialed",
      link: "Blockchain",
      icon: Lock,
      image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/9be80d6ca_Whisk_43831818b9d5e77953345c3626f3d976eg.jpg"
    },
    {
      title: "Security Operations Module",
      description: "System-enforced threat monitoring – credentialed access to real-time intelligence.",
      price: "Credentialed",
      link: "SecurityOperationsCenter",
      icon: Activity,
      image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/7e319a981_Whisk_429a6543b81e30d9bab4065457f3b62ddr.jpg"
    },
    {
      title: "GlyphBot Intelligence Module",
      description: "Autonomous security analysis – AI-driven threat suppression restricted to credentialed operators.",
      price: "Credentialed",
      link: "GlyphBot",
      icon: Zap,
      image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/9774d266e_openai-logo-inspired-abstract.png"
    },
    {
      title: "NUPS Transaction Verification",
      description: "Protocol-governed transaction module – system-enforced verification restricted to authorized venues.",
      price: "Credentialed",
      link: "NUPSLogin",
      icon: Server,
      image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/b6f63d51b_Whisk_b9fd7532ee1e87a9152439bac427f256dr.jpg"
    }
  ];

  return (
    <>
      <SEOHead
        title="Security Tools | GlyphLock Cybersecurity Suite"
        description="Professional cybersecurity toolkit: QR security, steganography, blockchain verification, AI threat detection, and secure POS systems for enterprise protection."
        url="/security-tools"
      />
      <div className="text-white min-h-screen" style={{ background: 'transparent' }}>
      <section ref={heroRef} className="relative py-16 md:py-20 overflow-hidden" style={{ background: 'transparent' }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)",
          backgroundSize: "50px 50px"
        }} />
        
        <div className="container mx-auto px-3 sm:px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.7 }}
              animate={heroInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.9, type: "spring", stiffness: 120 }}
              className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mx-auto mb-4 md:mb-6"
            >
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, x: -100 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight"
            >
              Credentialed Verification <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">System</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: 100 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1.1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 mb-6 md:mb-8 leading-relaxed px-2"
            >
              Protocol-governed modules for cryptographic verification, blockchain integrity, and system-enforced monitoring.
            </motion.p>
          </div>
        </div>
      </section>

      <section ref={toolsRef} className="py-14 md:py-20" style={{ background: 'transparent' }}>
        <div className="container mx-auto px-3 sm:px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-7xl mx-auto">
            {tools.map((tool, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 60, scale: 0.9 }}
                animate={toolsInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.9, delay: 0.1 + (index * 0.1), type: "spring", stiffness: 100 }}
              >
              <Link to={createPageUrl(tool.link)}>
                <Card className="glass-card-dark border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 h-full group cursor-pointer rounded-lg overflow-hidden" style={{background: 'rgba(30, 58, 138, 0.2)', backdropFilter: 'blur(16px)'}}>
                  <div className="relative h-32 sm:h-40 md:h-48 overflow-hidden">
                    <img 
                      src={tool.image}
                      alt={tool.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-800 via-gray-800/50 to-transparent" />
                    <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                        <tool.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-start justify-between gap-2 mb-2 md:mb-3">
                      <h3 className="text-sm sm:text-base md:text-xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                        {tool.title}
                      </h3>
                      <span className="text-xs md:text-sm font-semibold text-blue-400 flex-shrink-0">
                        {tool.price}
                      </span>
                    </div>
                    <p className="text-gray-400 mb-3 text-xs sm:text-sm line-clamp-2">
                      {tool.description}
                    </p>
                    <div className="flex items-center text-blue-400 text-xs sm:text-sm font-semibold">
                      Try Now <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section ref={whyRef} className="py-14 md:py-20" style={{ background: 'transparent' }}>
        <div className="container mx-auto px-3 sm:px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2 
              initial={{ opacity: 0, x: -80 }}
              animate={whyInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4 text-white"
            >
              Why Deploy <span className="text-blue-400">Protocol-Governed Verification?</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, x: 80 }}
              animate={whyInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm md:text-base text-gray-400 mb-8 md:mb-12"
            >
              System-enforced capabilities restricted to credentialed operators
            </motion.p>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {[
                { icon: Shield, title: "System-Enforced Verification", desc: "Quantum-resistant cryptographic governance", gradient: "from-green-600 to-emerald-700" },
                { icon: Eye, title: "Autonomous Intelligence", desc: "AI-driven threat suppression with protocol enforcement", gradient: "from-blue-600 to-blue-700" },
                { icon: Lock, title: "Credentialed Integrity", desc: "Protocol-governed modules with provisioned access", gradient: "from-purple-600 to-purple-700" }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={whyInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{ duration: 0.9, delay: 0.2 + (idx * 0.12), type: "spring", stiffness: 100 }}
                  className="text-center"
                >
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br ${item.gradient} rounded-lg flex items-center justify-center mx-auto mb-3 md:mb-4`}>
                    <item.icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                  </div>
                  <h3 className="text-base md:text-xl font-bold mb-1 md:mb-2 text-white">{item.title}</h3>
                  <p className="text-xs md:text-base text-gray-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section ref={ctaRef} className="py-14 md:py-20" style={{ background: 'transparent' }}>
        <div className="container mx-auto px-3 sm:px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2 
              initial={{ opacity: 0, x: -100 }}
              animate={ctaInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6 text-white"
            >
              Ready to Deploy Credentialed Verification?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, x: 100 }}
              animate={ctaInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm md:text-base lg:text-xl text-gray-400 mb-6 md:mb-8"
            >
              Initiate protocol-governed access to system-enforced modules
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={ctaInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 1, delay: 0.3, type: "spring", stiffness: 100 }}
              className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-2"
            >
              <Link to={createPageUrl("Qr")}>
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                  Access QR Module
                </Button>
              </Link>
              <Link to={createPageUrl("Consultation")}>
                <Button size="lg" variant="outline" className="border-blue-500/50 hover:bg-blue-500/10 text-white">
                  Request Credentials
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}