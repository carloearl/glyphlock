import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Play, DollarSign, Shield, Zap } from "lucide-react";

export default function FinancialHero({ videoUrl }) {
  const [videoPlaying, setVideoPlaying] = useState(false);

  return (
    <section className="relative w-full min-h-[80vh] flex items-center overflow-hidden">
      {/* Background video / fallback gradient */}
      {videoUrl ? (
        <div className="absolute inset-0 z-0">
          <video
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.3) saturate(1.2)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/50 via-transparent to-emerald-950/50" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-black to-green-950" />
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(16,185,129,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16,185,129,0.08) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }} />
        </div>
      )}

      {/* Ambient glow orbs */}
      <motion.div className="absolute top-20 left-[20%] w-[400px] h-[400px] rounded-full pointer-events-none z-[1]"
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.3), transparent 70%)', filter: 'blur(80px)' }}
      />
      <motion.div className="absolute bottom-20 right-[15%] w-[350px] h-[350px] rounded-full pointer-events-none z-[1]"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{ background: 'radial-gradient(circle, rgba(234,179,8,0.25), transparent 70%)', filter: 'blur(80px)' }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 max-w-6xl py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text side */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs font-bold uppercase tracking-widest mb-6"
            >
              <DollarSign className="w-3.5 h-3.5" />
              GlyphLock Financial LLC
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95] mb-6"
            >
              <span className="text-white">GLYPH</span>
              <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-yellow-400 bg-clip-text text-transparent">LOCK</span>
              <br />
              <span className="text-white text-3xl sm:text-4xl md:text-5xl">FINANCIAL</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg text-slate-300 max-w-lg leading-relaxed mb-8"
            >
              The financial technology arm of the GlyphLock ecosystem. 
              Point-of-sale systems, blockchain verification, club currency, 
              and entertainment venue technology — built from scratch, owned outright.
            </motion.p>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-wrap gap-6 mb-8"
            >
              {[
                { label: "POS System", value: "NUPS", icon: Zap },
                { label: "Currency Press", value: "Dream$", icon: DollarSign },
                { label: "Blockchain", value: "Verified", icon: Shield },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{stat.value}</div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">{stat.label}</div>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-wrap gap-3"
            >
              <Link to={createPageUrl("NUPSLogin")}>
                <Button className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white px-8 py-6 text-base font-bold shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  Access NUPS POS
                </Button>
              </Link>
              <Link to={createPageUrl("Blockchain")}>
                <Button variant="outline" className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 px-8 py-6 text-base font-bold">
                  Blockchain Tools
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Video / visual side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative"
          >
            {videoUrl ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.2)]">
                <video
                  src={videoUrl}
                  controls={videoPlaying}
                  autoPlay={false}
                  muted={!videoPlaying}
                  playsInline
                  className="w-full aspect-video object-cover"
                  onClick={() => setVideoPlaying(true)}
                />
                {!videoPlaying && (
                  <div
                    className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/40 hover:bg-black/30 transition-colors"
                    onClick={() => setVideoPlaying(true)}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-20 h-20 rounded-full bg-emerald-500/80 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.6)]"
                    >
                      <Play className="w-8 h-8 text-white ml-1" />
                    </motion.div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-950/50 to-green-950/50 aspect-video flex items-center justify-center">
                <div className="text-center p-8">
                  <DollarSign className="w-16 h-16 text-emerald-500/40 mx-auto mb-4" />
                  <p className="text-sm text-emerald-400/60">Hero video placeholder</p>
                  <p className="text-xs text-slate-600 mt-1">Upload your GlyphLock Financial intro video</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}