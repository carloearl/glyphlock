import React, { useRef } from "react";
import { Shield, Zap, Lock, Eye } from "lucide-react";
import { motion, useInView } from "framer-motion";

export default function FeaturesSection() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.15 });

  const features = [
    {
      icon: Shield,
      title: "Cryptography Roadmap",
      description: "Current controls use documented platform and provider capabilities, with future cryptographic migration treated as a scoped evaluation track."
    },
    {
      icon: Zap,
      title: "AI-Assisted",
      description: "AI tools support review, analysis, and triage workflows; outputs remain subject to human validation."
    },
    {
      icon: Lock,
      title: "Access Controls",
      description: "Authentication, role-based permissions, and account controls are used where supported by the applicable module."
    },
    {
      icon: Eye,
      title: "Monitoring & Logging",
      description: "Selected modules provide activity logging, configurable alerts, and operational review tools."
    }
  ];

  // Animation directions for feature cards
  const featureDirections = [
    { x: -60, y: 0, rotate: -5 },
    { x: 0, y: -50, rotate: 0 },
    { x: 0, y: 50, rotate: 0 },
    { x: 60, y: 0, rotate: 5 }
  ];

  return (
    <section ref={containerRef} className="py-24 relative">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          {/* Title - Slide from left */}
          <motion.h2 
            initial={{ opacity: 0, x: -100 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl md:text-5xl font-bold mb-6 text-white"
          >
            Why Choose <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">GlyphLock</span>
          </motion.h2>
          
          {/* Subtitle - Slide from right */}
          <motion.p 
            initial={{ opacity: 0, x: 100 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl text-white/70 max-w-3xl mx-auto"
          >
            Practical security controls, verifiable records, and clearly scoped capabilities
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            const dir = featureDirections[idx];
            return (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 50, scale: 0.85 }}
                animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ 
                  duration: 1, 
                  delay: 0.3 + (idx * 0.15),
                  ease: [0.16, 1, 0.3, 1]
                }}
                whileHover={{ y: -10, scale: 1.05, boxShadow: "0 0 50px rgba(6,182,212,0.4)" }}
                className="glass-royal p-8 rounded-2xl hover:border-cyan-500/60 transition-colors duration-300 group"
              >
                <motion.div 
                  whileHover={{ rotate: 360, scale: 1.15 }}
                  transition={{ duration: 0.8 }}
                  className="bg-cyan-500/20 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-cyan-500/30 transition-colors"
                >
                  <Icon className="w-8 h-8 text-cyan-400" />
                </motion.div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-white/70">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/11242d8a3_Whisk_ecd15257dc62aafae4b457b73ff01aa9dr.jpg", alt: "Digital Agreements", icon: Lock, title: "Digital Agreements", desc: "Electronic agreement workflows with signatures, records, and audit trails where configured" },
            { img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/fd28593b3_Whisk_938e90eff0a4d8da277467baf360248edr.jpg", alt: "Full Stack Development", icon: Shield, title: "Security-Aware Development", desc: "Security controls considered across application, access, deployment, and operational workflows" },
            { img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/870d85755_Whisk_429a6543b81e30d9bab4065457f3b62ddr.jpg", alt: "Web Development", icon: Eye, title: "Secure Development", desc: "Build with security at the foundation" }
          ].map((card, idx) => {
            const Icon = card.icon;
            const directions = [{ x: -80, rotate: -8 }, { y: 60, rotate: 0 }, { x: 80, rotate: 8 }];
            const dir = directions[idx];
            
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 60, scale: 0.85 }}
                animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ 
                  duration: 1, 
                  delay: 0.9 + (idx * 0.15),
                  ease: [0.16, 1, 0.3, 1]
                }}
                whileHover={{ y: -12, scale: 1.03 }}
                className="relative group overflow-hidden rounded-2xl"
              >
                <img
                  src={card.img}
                  alt={card.alt}
                  className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-end p-8">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className="w-7 h-7 text-cyan-400" />
                      <h3 className="text-2xl font-bold text-white">{card.title}</h3>
                    </div>
                    <p className="text-white/80">{card.desc}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}