import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Code2, Eye, ShieldCheck } from "lucide-react";
import { motion, useInView } from "framer-motion";

export default function HeroContent() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });

  const features = [
    "Full framework access — modify anything",
    "Build custom features yourself — no permission needed",
    "Hire ANY developer — it's open source",
    "Extend the platform — your business, your rules",
    "No vendor lock-in — you own the code"
  ];

  return (
    <section ref={containerRef} className="w-full max-w-7xl mx-auto px-4 py-16 relative" style={{ background: 'transparent', pointerEvents: 'auto' }}>
      <div className="text-center mb-12 md:mb-16">
        {/* Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: -40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-6 md:mb-8 text-white tracking-tight drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] leading-[1.1] px-2"
        >
          STOP GETTING <span className="bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(239,68,68,0.9)]">ROBBED</span>.<br />
          START <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(6,182,212,0.9)]">CREATING</span>.
        </motion.h1>
        
        {/* The problem statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto mb-8 px-4"
        >
          <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-4 leading-relaxed italic">
            Most tech companies give you a locked box:<br className="hidden sm:block" />
            <span className="text-gray-500">"Here's our software. Pay monthly. Can't change it. Trust us."</span>
          </p>
          <p className="text-lg sm:text-xl md:text-2xl text-[#00E4FF] font-black tracking-wide">
            GlyphLock gives you <span className="uppercase">the creation layer</span>.
          </p>
        </motion.div>

        {/* Feature checklist */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto mb-8 px-4"
        >
          <div className="grid grid-cols-1 gap-3 text-left">
            {features.map((feat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -40 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.5 + idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-start gap-3"
              >
                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-sm sm:text-base md:text-lg text-gray-200 font-medium leading-snug">{feat}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Proof statements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto mb-10 px-4"
        >
          <p className="text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed">
            This is what <span className="text-white font-bold">enterprise companies</span> have. Now <span className="text-white font-bold">you</span> have it too.
          </p>
          <p className="text-sm sm:text-base text-gray-400 mt-2">
            Open source framework <span className="text-cyan-400 font-semibold">proves it works</span>. Master Covenant framework <span className="text-cyan-400 font-semibold">protects your rights</span>.
          </p>
        </motion.div>
        
        {/* CTA Buttons - 3 buttons */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4 flex-wrap">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.85 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 1, delay: 1.15, type: "spring", stiffness: 100, damping: 15 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to={createPageUrl("Consultation")}>
              <Button size="lg" className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-base md:text-lg px-6 md:px-8 py-6 font-black tracking-wide shadow-[0_0_35px_rgba(59,130,246,0.6)] hover:shadow-[0_0_55px_rgba(59,130,246,0.8)] transition-all duration-300 w-full sm:w-auto">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                />
                <span className="relative flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  TAKE CONTROL
                  <motion.span animate={{ x: [0, 6, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
                    <ArrowRight className="w-5 h-5" />
                  </motion.span>
                </span>
              </Button>
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.85 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 1, delay: 1.3, type: "spring", stiffness: 100, damping: 15 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to={createPageUrl("SecurityTools")}>
              <Button size="lg" variant="outline" className="relative overflow-hidden border-2 border-cyan-400/60 text-white hover:bg-cyan-500/20 text-base md:text-lg px-6 md:px-8 py-6 font-bold tracking-wide shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] transition-all duration-300 w-full sm:w-auto">
                <span className="relative flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  EXPLORE THE FRAMEWORK
                </span>
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.85 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 1, delay: 1.45, type: "spring", stiffness: 100, damping: 15 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to={createPageUrl("SDKDocs")}>
              <Button size="lg" variant="outline" className="relative overflow-hidden border-2 border-purple-400/60 text-white hover:bg-purple-500/20 text-base md:text-lg px-6 md:px-8 py-6 font-bold tracking-wide shadow-[0_0_25px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transition-all duration-300 w-full sm:w-auto">
                <span className="relative flex items-center gap-2">
                  <Code2 className="w-5 h-5" />
                  VIEW THE CODE
                </span>
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Value props grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-4">
        {[
          { 
            title: "FULL FRAMEWORK ACCESS", 
            desc: "Modify anything. No locked features, no paywalls on core tools. The entire creation layer is yours.",
            icon: Code2,
            color: "from-emerald-500/20 to-cyan-500/15",
            borderColor: "border-emerald-400/30",
            glowColor: "shadow-[0_0_35px_rgba(16,185,129,0.3)]"
          },
          { 
            title: "OPEN SOURCE PROOF", 
            desc: "Every line of code is visible. You can audit it, fork it, extend it. No black boxes. No hidden agendas.",
            icon: Eye,
            color: "from-blue-500/20 to-indigo-500/15",
            borderColor: "border-blue-400/30",
            glowColor: "shadow-[0_0_35px_rgba(59,130,246,0.3)]"
          },
          { 
            title: "COVENANT PROTECTED", 
            desc: "The Master Covenant legally binds the framework to your rights. Your work stays yours. Period.",
            icon: ShieldCheck,
            color: "from-purple-500/20 to-violet-500/15",
            borderColor: "border-purple-400/30",
            glowColor: "shadow-[0_0_35px_rgba(168,85,247,0.3)]"
          }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ 
                duration: 0.9, 
                delay: 1.6 + (idx * 0.15),
                type: "spring",
                stiffness: 100,
                damping: 14
              }}
              whileHover={{ scale: 1.04, y: -6 }}
              className={`bg-gradient-to-br ${card.color} backdrop-blur-md border ${card.borderColor} p-6 md:p-8 rounded-xl text-center ${card.glowColor} hover:shadow-[0_0_60px_rgba(6,182,212,0.5)] transition-all duration-300 group cursor-default`}
            >
              <Icon className="w-10 h-10 text-cyan-300 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(6,182,212,1)] group-hover:text-white transition-colors duration-300" />
              <h3 className="text-lg font-black text-white mb-3 tracking-wide">{card.title}</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{card.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}