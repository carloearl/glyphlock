import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Shield, Zap, Eye, Brain, Lock, FileCode, Image } from "lucide-react";
import { motion, useInView } from "framer-motion";

/**
 * PHASE 3B SERVICES GRID
 * QR Studio is the ONLY QR link - points to /Qr
 * Hotzone Mapper REMOVED (it's an Image Suite tool, not a security product)
 */

const services = [
  {
    title: "NEXUS N.U.P.S.",
    description: "Commerce infrastructure with covenant-backed transactions and verified ownership trails",
    link: "NUPSLogin",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/9184b512b_Whisk_b9fd7532ee1e87a9152439bac427f256dr.jpg",
    icon: Zap
  },
  {
    title: "Master Covenant",
    description: "Authorship protocol – cryptographic proof of origin for creative work at ecosystem scale",
    link: "MasterCovenant",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/8f4e28351_Whisk_05f17d65a57cf59bf1a4fdd31ffd7d8edr.jpg",
    icon: FileCode
  },
  {
    title: "QR Identity Studio",
    description: "Visual identity layer – embed verified metadata into scannable assets across your ecosystem",
    link: "Qr",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/ef8ed5e35_ee8d4930-e046-49b0-8beb-87745181d506.jpg",
    icon: Eye
  },
  {
    title: "Blockchain Anchoring",
    description: "Immutable timestamping – lock creative assets to verifiable on-chain records",
    link: "Blockchain",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/b91660fea_Whisk_8fdb6d2b015dc9e846648880fcd03ca1dr.jpg",
    icon: Lock
  },
  {
    title: "Image Lab",
    description: "AI generation + interactive hotspots – turn static visuals into verified, linkable ecosystems",
    link: "ImageLab",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/9167e5df2_08f33231-115f-4c95-9719-682f4e9679cc.jpg",
    icon: Image
  },
  {
    title: "GlyphBot Intelligence",
    description: "AI builder assistant – site audits, architecture analysis, and knowledge synthesis for your ecosystem",
    link: "GlyphBot",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/0e2155dc3_Whisk_df925aca34d95e09a3b4274e0bd16f08dr.jpg",
    icon: Brain
  }
];

export default function ServicesGrid() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.15 });

  // Animation directions for each card
  const cardAnimations = [
    { x: -80, y: 0, rotate: -5 },
    { x: 0, y: -60, rotate: 0 },
    { x: 80, y: 0, rotate: 5 },
    { x: -80, y: 40, rotate: 5 },
    { x: 0, y: 60, rotate: 0 },
    { x: 80, y: 40, rotate: -5 }
  ];

  return (
    <div ref={containerRef} className="w-full max-w-7xl mx-auto px-4 pt-8 pb-16 relative" style={{ background: 'transparent', pointerEvents: 'auto' }}>
      <div className="text-center mb-12">
        {/* Title - Slide from left */}
        <motion.h2 
          initial={{ opacity: 0, x: -100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl md:text-5xl font-black text-white mb-4 drop-shadow-[0_0_25px_rgba(255,255,255,0.3)]"
        >
          Creative Infrastructure <span className="bg-gradient-to-r from-[#1E40AF] via-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent">Modules</span>
        </motion.h2>
        
        {/* Subtitle - Slide from right */}
        <motion.p 
          initial={{ opacity: 0, x: 100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg text-white/90"
        >
          Build, verify, and protect digital ecosystems with open covenant architecture
        </motion.p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, idx) => {
          const anim = cardAnimations[idx];
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 60, scale: 0.85 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ 
                duration: 1, 
                delay: 0.3 + (idx * 0.12),
                type: "spring",
                stiffness: 100,
                damping: 14
              }}
              whileHover={{ y: -10, scale: 1.03 }}
            >
              <Link to={createPageUrl(service.link)} className="block h-full touch-manipulation">
                <motion.div 
                  whileHover={{ boxShadow: '0 0 80px rgba(87,61,255,0.9)' }}
                  whileTap={{ scale: 0.97 }}
                  className="backdrop-blur-md border-2 border-indigo-500/60 rounded-xl overflow-hidden group cursor-pointer transition-all duration-300 h-full shadow-[0_0_30px_rgba(87,61,255,0.4)] hover:shadow-[0_0_60px_rgba(87,61,255,0.7)] hover:border-indigo-400/80 active:border-cyan-400" 
                  style={{ background: 'rgba(87,61,255,0.08)' }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={service.image} 
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.2 }}
                        transition={{ duration: 0.5 }}
                      >
                        <service.icon className="w-6 h-6 text-[#3B82F6] drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                      </motion.div>
                      <h3 className="text-xl font-bold text-white">{service.title}</h3>
                    </div>
                    <p className="text-white/90 text-sm md:text-base">{service.description}</p>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}