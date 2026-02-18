import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Video, Image, Box, Music, Lock, Rocket, ArrowRight, Sparkles, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    id: 'img-to-video',
    name: 'Image → Video',
    icon: Video,
    description: 'Transform static images into animated sequences with AI-powered motion synthesis. Control duration, camera movement, and animation style.',
    status: 'Coming Soon',
    statusColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    cardBorder: 'border-cyan-500/30 hover:border-cyan-400/60',
    glow: 'hover:shadow-[0_0_40px_rgba(6,182,212,0.2)]',
    iconBg: 'from-cyan-500/20 to-blue-500/20',
    capabilities: ['Motion synthesis from keyframes', 'Camera path animation', '4K output up to 30s', 'Style-consistent frame interpolation'],
  },
  {
    id: 'video-style',
    name: 'Video Style Transfer',
    icon: Image,
    description: 'Apply artistic styles to video footage while maintaining temporal coherence. From oil painting to anime, transform any footage.',
    status: 'Roadmap Q3',
    statusColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    cardBorder: 'border-purple-500/30 hover:border-purple-400/60',
    glow: 'hover:shadow-[0_0_40px_rgba(168,85,247,0.2)]',
    iconBg: 'from-purple-500/20 to-pink-500/20',
    capabilities: ['Temporal coherence engine', '60+ artistic presets', 'Real-time preview', 'Batch processing support'],
  },
  {
    id: 'img-to-3d',
    name: 'Image → 3D Object',
    icon: Box,
    description: 'Generate textured 3D models from single or multi-view 2D images. Export as GLB, OBJ, or USDZ for AR/VR deployment.',
    status: 'Beta Access',
    statusColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    cardBorder: 'border-emerald-500/30 hover:border-emerald-400/60',
    glow: 'hover:shadow-[0_0_40px_rgba(16,185,129,0.2)]',
    iconBg: 'from-emerald-500/20 to-teal-500/20',
    capabilities: ['Single-image reconstruction', 'PBR texture generation', 'GLB/OBJ/USDZ export', 'AR Quick Look compatible'],
  },
  {
    id: 'audio-visual',
    name: 'Audio → Visual',
    icon: Music,
    description: 'Create synchronized visuals from audio input. Analyze waveforms, beats, and mood to generate reactive imagery and video loops.',
    status: 'Research',
    statusColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    cardBorder: 'border-amber-500/30 hover:border-amber-400/60',
    glow: 'hover:shadow-[0_0_40px_rgba(245,158,11,0.2)]',
    iconBg: 'from-amber-500/20 to-orange-500/20',
    capabilities: ['Beat-reactive generation', 'Mood-to-palette mapping', 'Waveform visualization', 'Loopable video output'],
  },
];

export default function MultimodalTab() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/15 border border-purple-400/30 mb-6">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-purple-300 text-sm font-semibold">Multimodal Expansion</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
          Beyond <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Static Images</span>
        </h2>
        <p className="text-lg text-white/60 max-w-2xl mx-auto">
          The next generation of creative tools — video, 3D, and audio-reactive generation powered by GlyphLock's AI pipeline.
        </p>
      </motion.div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FEATURES.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative group rounded-2xl border-2 ${feature.cardBorder} ${feature.glow} bg-white/[0.03] backdrop-blur-xl p-6 transition-all duration-500 overflow-hidden`}
            >
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

              {/* Status badge */}
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <Badge className={`${feature.statusColor} border text-xs font-bold`}>
                  {feature.status}
                </Badge>
              </div>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                  {feature.name}
                </h3>
                <p className="text-sm text-white/60 mb-4 leading-relaxed">
                  {feature.description}
                </p>

                {/* Capabilities */}
                <div className="space-y-2 mb-4">
                  {feature.capabilities.map((cap, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-white/50">
                      <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${feature.iconBg} flex-shrink-0`} />
                      {cap}
                    </div>
                  ))}
                </div>

                {/* Lock state */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                  <Lock className="w-4 h-4 text-white/30" />
                  <span className="text-xs text-white/40">
                    {feature.status === 'Coming Soon' ? 'Launching soon — join the waitlist' :
                     feature.status === 'Beta Access' ? 'Enterprise beta — request access' :
                     feature.status === 'Research' ? 'In active R&D — stay tuned' :
                     'On the roadmap'}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Enterprise CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-slate-950/50 to-indigo-950/40 backdrop-blur-xl p-8 text-center overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }} />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 mb-4">
            <Crown className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-blue-300 text-xs font-semibold">Enterprise Priority</span>
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-3">
            Get Priority Access to New Features
          </h3>
          <p className="text-white/60 mb-6 max-w-xl mx-auto">
            Enterprise customers receive early beta access, dedicated support, and custom model fine-tuning for multimodal features.
          </p>
          
          <Link to={createPageUrl("Consultation")}>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-8 py-3 rounded-xl shadow-[0_0_25px_rgba(59,130,246,0.4)]">
              <Rocket className="w-4 h-4 mr-2" />
              Contact Sales
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}