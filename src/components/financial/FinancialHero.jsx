import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Shield, ArrowRight, Play } from "lucide-react";

export default function FinancialHero({ videoUrl }) {
  const [showVideo, setShowVideo] = React.useState(false);

  return (
    <section className="relative w-full min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e27] via-[#0d1333] to-[#0a1628]" />
      
      {/* Animated grid overlay */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(34,197,94,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', filter: 'blur(50px)' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* LLC Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1.5 mb-6"
        >
          <Shield className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs font-semibold text-green-400 tracking-widest uppercase">GlyphLock Financial, LLC</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-7xl font-black mb-4 leading-tight"
        >
          <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            GlyphLock
          </span>{" "}
          <span className="text-white">Financial</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed"
        >
          Enterprise-grade point-of-sale, blockchain verification, club currency systems, 
          and entertainment technology — all under one financial umbrella.
        </motion.p>

        {/* Video / CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          {videoUrl && (
            <Button
              onClick={() => setShowVideo(!showVideo)}
              size="lg"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold px-8 h-14 text-lg rounded-xl shadow-[0_0_30px_rgba(34,197,94,0.3)]"
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Overview
            </Button>
          )}
          <Link to={createPageUrl("NUPSLogin")}>
            <Button
              size="lg"
              variant="outline"
              className="border-green-500/50 text-green-400 hover:bg-green-500/10 font-bold px-8 h-14 text-lg rounded-xl"
            >
              Launch N.U.P.S. <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>

        {/* Video player */}
        {showVideo && videoUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-3xl mx-auto rounded-2xl overflow-hidden border-2 border-green-500/30 shadow-[0_0_60px_rgba(34,197,94,0.2)] mb-8"
          >
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full aspect-video bg-black"
              playsInline
            />
          </motion.div>
        )}

        {/* Stats ticker */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-6 md:gap-10 text-sm"
        >
          {[
            { label: "POS Transactions", value: "N.U.P.S." },
            { label: "Blockchain Suite", value: "SHA-256" },
            { label: "Club Currency", value: "Dream $" },
            { label: "Entertainment", value: "DJ Mixer" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-green-400 font-bold text-lg">{stat.value}</div>
              <div className="text-gray-500 text-xs">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}