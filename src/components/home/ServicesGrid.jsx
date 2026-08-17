import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Shield, Zap, Eye, Brain, Lock, FileCode, Image } from "lucide-react";
import { motion, useInView } from "framer-motion";

/**
 * PHASE 3B SERVICES GRID
 * QR Studio is the ONLY QR link - points to /SecureQRStudio
 * Hotzone Mapper REMOVED (it's an Image Suite tool, not a security product)
 */

const services = [
  {
    title: "Master Covenant",
    description: "Our published governance framework – the standards and accountability rules our AI systems are built to follow",
    link: "MasterCovenant",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/8f4e28351_Whisk_05f17d65a57cf59bf1a4fdd31ffd7d8edr.jpg",
    icon: FileCode
  },
  {
    title: "QR Studio",
    description: "Generate custom QR codes with cryptographic signing options, scan logging, and configurable payload checks",
    link: "SecureQRStudio",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/ef8ed5e35_ee8d4930-e046-49b0-8beb-87745181d506.jpg",
    icon: Eye
  },
  {
    title: "Timestamp Proofs",
    description: "SHA-256 hashing with exportable timestamped proofs that a record existed and hasn't changed",
    link: "Blockchain",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/b91660fea_Whisk_8fdb6d2b015dc9e846648880fcd03ca1dr.jpg",
    icon: Lock
  },
  {
    title: "Image Lab",
    description: "AI image generation plus interactive hotspots – make images clickable and shareable",
    link: "ImageLab",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/9167e5df2_08f33231-115f-4c95-9719-682f4e9679cc.jpg",
    icon: Image
  },
  {
    title: "GlyphBot",
    description: "AI assistant built on multiple AI providers – chat, site audits, and code analysis",
    link: "GlyphBot",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/0e2155dc3_Whisk_df925aca34d95e09a3b4274e0bd16f08dr.jpg",
    icon: Brain
  }
];

export default function ServicesGrid() {
  const containerRef = useRef(null);
  useInView(containerRef, { once: true, amount: 0.15 });
  const isInView = true; // always render content

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
          Platform <span className="bg-gradient-to-r from-[#1E40AF] via-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent">Modules</span>
        </motion.h2>
        
        {/* Subtitle - Slide from right */}
        <motion.p 
          initial={{ opacity: 0, x: 100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg text-white/90"
        >
          Working tools you can use today — QR verification, timestamping, AI imaging, and an AI assistant
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
              <Link 
                to={createPageUrl(service.link)} 
                className="block h-full touch-manipulation"
                aria-label={`Navigate to ${service.title} - ${service.description}`}
              >
                <motion.div 
                  whileHover={{ boxShadow: '0 0 80px rgba(87,61,255,0.9)' }}
                  whileTap={{ scale: 0.97 }}
                  className="backdrop-blur-md border-2 border-indigo-500/60 rounded-xl overflow-hidden group cursor-pointer transition-all duration-300 h-full shadow-[0_0_30px_rgba(87,61,255,0.4)] hover:shadow-[0_0_60px_rgba(87,61,255,0.7)] hover:border-indigo-400/80 active:border-cyan-400" 
                  style={{ background: 'rgba(87,61,255,0.08)' }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={service.image} 
                      alt={`${service.title} - ${service.description}`}
                      width="800"
                      height="600"
                      loading="lazy"
                      decoding="async"
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