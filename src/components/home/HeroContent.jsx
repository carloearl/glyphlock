import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, useInView } from "framer-motion";
import { ShieldCheck, ArrowRight, Eye, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function FloatingDebris() {
  const particles = Array.from({ length: 20 }, (_, i) => {
    const colors = ['#06b6d4', '#4f46e5', '#7c3aed'];
    const color = colors[i % 3];
    return {
      id: i,
      left: `${Math.random() * 100}%`,
      duration: `${Math.random() * 10 + 15}s`,
      delay: `${Math.random() * 5}s`,
      color
    };
  });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute w-[3px] h-[3px] rounded-full"
          style={{
            left: p.left,
            background: p.color,
            boxShadow: `0 0 6px ${p.color}`,
            animation: `heroDebrisFloat ${p.duration} linear ${p.delay} infinite`,
            opacity: 0
          }}
        />
      ))}
    </div>
  );
}

function CircuitLine({ top, width, delay, color }) {
  return (
    <div
      className="absolute h-[2px] opacity-40"
      style={{
        top,
        width,
        left: delay > 0.5 ? 'auto' : 0,
        right: delay > 0.5 ? 0 : 'auto',
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        boxShadow: `0 0 8px ${color}`,
        animation: `heroCircuitFlow 3s linear ${delay}s infinite`
      }}
    />
  );
}

function NeonDrip({ left, delay, color }) {
  return (
    <div
      className="absolute top-0"
      style={{
        left,
        width: '2px',
        height: 0,
        background: `linear-gradient(180deg, ${color}, transparent)`,
        boxShadow: `0 0 8px ${color}`,
        filter: 'blur(1px)',
        animation: `heroDrip 4s ease-in-out ${delay}s infinite`
      }}
    />
  );
}

export default function HeroContent() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.15 });
  const [typedText, setTypedText] = useState("");
  const fullText = "GlyphLock = THE_CREATION_LAYER";

  useEffect(() => {
    if (!isInView) return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setTypedText(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(timer);
    }, 80);
    return () => clearInterval(timer);
  }, [isInView]);

  const features = [
    { highlight: "FULL ACCESS", text: "— modify anything" },
    { highlight: "CUSTOM FEATURES", text: "— no permission" },
    { highlight: "ANY DEVELOPER", text: "— open source" },
    { highlight: "YOUR PLATFORM", text: "— your rules" },
    { highlight: "NO LOCK-IN", text: "— you own it" }
  ];

  const cards = [
    {
      title: "FRAMEWORK ACCESS",
      desc: "No paywalls. No locked features. The entire creation layer is yours.",
      color: "#06b6d4",
      borderClass: "border-cyan-500/40",
      glowClass: "hover:shadow-[0_0_50px_rgba(6,182,212,0.5)]",
      clipPath: "polygon(0 10%, 90% 0%, 100% 90%, 10% 100%)",
      icon: <Code2 className="w-10 h-10" style={{ color: '#06b6d4', filter: 'drop-shadow(0 0 15px #06b6d4)' }} />
    },
    {
      title: "SOURCE PROOF",
      desc: "Transparent. Auditable. Forkable. No black boxes. No hidden agendas.",
      color: "#4f46e5",
      borderClass: "border-indigo-500/40",
      glowClass: "hover:shadow-[0_0_50px_rgba(79,70,229,0.5)]",
      clipPath: "polygon(10% 0%, 100% 10%, 90% 100%, 0% 90%)",
      icon: <Eye className="w-10 h-10" style={{ color: '#4f46e5', filter: 'drop-shadow(0 0 15px #4f46e5)' }} />
    },
    {
      title: "COVENANT SHIELD",
      desc: "Legally binds your rights. Your work stays yours. Forever. Period.",
      color: "#7c3aed",
      borderClass: "border-purple-500/40",
      glowClass: "hover:shadow-[0_0_50px_rgba(124,58,237,0.5)]",
      clipPath: "polygon(5% 0%, 95% 5%, 100% 95%, 0% 100%)",
      icon: <ShieldCheck className="w-10 h-10" style={{ color: '#7c3aed', filter: 'drop-shadow(0 0 15px #7c3aed)' }} />
    }
  ];

  return (
    <section ref={containerRef} className="w-full max-w-7xl mx-auto px-4 py-12 md:py-20 relative" style={{ background: 'transparent', pointerEvents: 'auto' }}>
      {/* Keyframe styles */}
      <style>{`
        @keyframes heroDebrisFloat {
          0% { transform: translateY(100vh) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(-100px) translateX(100px) rotate(360deg); opacity: 0; }
        }
        @keyframes heroCircuitFlow {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translateX(200%); opacity: 0; }
        }
        @keyframes heroDrip {
          0% { height: 0; opacity: 1; }
          70% { height: 150px; opacity: 1; }
          100% { height: 180px; opacity: 0; }
        }
        @keyframes heroLiquidMetal {
          0%, 100% { background-position: 0% center; }
          50% { background-position: 100% center; }
        }
        @keyframes heroHoloFoil {
          0% { background-position: 0% center; }
          100% { background-position: 300% center; }
        }
        @keyframes heroPulsate {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
        @keyframes heroGridPulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
        @keyframes heroBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes heroGlitchTag {
          0%, 90%, 100% { transform: translate(0, 0); filter: hue-rotate(0deg); }
          92% { transform: translate(-2px, 1px); filter: hue-rotate(90deg); }
          94% { transform: translate(2px, -1px); filter: hue-rotate(-90deg); }
        }
        @keyframes heroScanShift {
          0% { transform: translateX(0) translateY(0); }
          100% { transform: translateX(50px) translateY(50px); }
        }
        @keyframes heroSweep {
          0% { top: -200px; }
          100% { top: 100%; }
        }
        @keyframes heroIconFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .hero-word-robbed {
          background: linear-gradient(135deg, #7c3aed, #f0f9ff, #7c3aed);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 25px rgba(124, 58, 237, 0.8));
          animation: heroLiquidMetal 4s ease-in-out infinite;
        }
        .hero-word-creating {
          background: linear-gradient(135deg, #06b6d4 0%, #4f46e5 25%, #7c3aed 50%, #f0f9ff 75%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          background-size: 300% auto;
          animation: heroHoloFoil 3s linear infinite;
          filter: drop-shadow(0 0 30px rgba(6, 182, 212, 0.8));
        }
      `}</style>

      {/* EM Pulse Rings - background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              top: '50%',
              left: '50%',
              width: '400px',
              height: '400px',
              border: `2px solid ${['#06b6d4', '#7c3aed', '#4f46e5'][i]}`,
              animation: `heroPulsate 4s ease-out ${i}s infinite`,
              opacity: 0
            }}
          />
        ))}
      </div>

      <FloatingDebris />

      {/* Diagonal scan lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(6,182,212,0.02) 2px, rgba(6,182,212,0.02) 4px)',
          animation: 'heroScanShift 20s linear infinite',
          zIndex: 2
        }}
      />

      {/* Holo sweep */}
      <div
        className="absolute left-0 right-0 h-[200px] pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, transparent, rgba(6,182,212,0.1), rgba(124,58,237,0.1), transparent)',
          filter: 'blur(20px)',
          animation: 'heroSweep 8s linear infinite',
          zIndex: 2,
          top: '-200px'
        }}
      />

      {/* Main manifesto container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden mx-auto"
        style={{
          maxWidth: '1100px',
          background: 'linear-gradient(135deg, rgba(10,1,24,0.98) 0%, rgba(30,27,75,0.95) 100%)',
          border: '3px solid #06b6d4',
          boxShadow: '0 0 50px rgba(6,182,212,0.5), 0 0 100px rgba(79,70,229,0.3), inset 0 0 80px rgba(0,0,0,0.6)',
          clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% calc(100% - 30px), calc(100% - 30px) 100%, 30px 100%, 0 calc(100% - 30px))',
          zIndex: 10
        }}
      >
        {/* Circuit lines */}
        <CircuitLine top="20%" width="40%" delay={0} color="#06b6d4" />
        <CircuitLine top="50%" width="60%" delay={1} color="#7c3aed" />
        <CircuitLine top="80%" width="50%" delay={2} color="#4f46e5" />

        {/* Neon drips */}
        <NeonDrip left="15%" delay={0} color="#06b6d4" />
        <NeonDrip left="50%" delay={1.5} color="#7c3aed" />
        <NeonDrip left="80%" delay={3} color="#4f46e5" />

        {/* HUD corners */}
        <div className="absolute top-[15px] left-[15px] w-10 h-10 border-t-2 border-l-2 border-cyan-500 opacity-30 pointer-events-none" />
        <div className="absolute top-[15px] right-[15px] w-10 h-10 border-t-2 border-r-2 border-cyan-500 opacity-30 pointer-events-none" />
        <div className="absolute bottom-[15px] left-[15px] w-10 h-10 border-b-2 border-l-2 border-cyan-500 opacity-30 pointer-events-none" />
        <div className="absolute bottom-[15px] right-[15px] w-10 h-10 border-b-2 border-r-2 border-cyan-500 opacity-30 pointer-events-none" />

        {/* Neon tube top/bottom */}
        <div className="absolute top-0 left-0 right-0 h-1 opacity-20" style={{ background: 'linear-gradient(90deg, transparent, #06b6d4, transparent)', filter: 'blur(8px)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-1 opacity-20" style={{ background: 'linear-gradient(90deg, transparent, #7c3aed, transparent)', filter: 'blur(8px)' }} />

        {/* Content grid */}
        <div className="relative p-6 sm:p-8 md:p-10 grid gap-6 z-10" style={{ gridTemplateColumns: '1fr', gridTemplateAreas: `"header" "headline" "side" "features" "cta" "cards"` }}>
          {/* On md+, use 2-col layout */}
          <div className="contents md:hidden">
            {/* System tag */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="inline-block w-fit px-4 py-2 text-[10px] sm:text-xs font-mono uppercase tracking-[0.15em] border-2 border-cyan-500 border-l-[6px] text-cyan-400"
              style={{
                background: 'rgba(6,182,212,0.05)',
                boxShadow: '0 0 20px rgba(6,182,212,0.3)',
                animation: 'heroGlitchTag 5s infinite'
              }}
            >
              <span className="text-purple-400" style={{ animation: 'heroBlink 1s infinite' }}>&gt; </span>
              LIBERATION PROTOCOL v3.0 ACTIVE
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <h1 className="font-black text-4xl sm:text-5xl leading-[0.85] uppercase tracking-tight mb-4" style={{ transform: 'skewY(-2deg)' }}>
                <span className="text-white block">STOP</span>
                <span className="text-white block">GETTING</span>
                <span className="hero-word-robbed block">ROBBED.</span>
                <span className="text-white block text-[0.7em]">START</span>
                <span className="hero-word-creating block">CREATING.</span>
              </h1>
              <div className="bg-black/80 border-2 border-cyan-500 p-3 font-mono text-xs text-cyan-400 relative" style={{ boxShadow: '0 0 20px rgba(6,182,212,0.2)', textShadow: '0 0 10px #06b6d4' }}>
                <div className="opacity-50 text-[10px] mb-1">$ sudo access --level=CREATOR</div>
                <div>{typedText}<span className="inline-block w-[6px] h-3 bg-cyan-400 ml-[3px]" style={{ animation: 'heroBlink 1s infinite', boxShadow: '0 0 8px #06b6d4' }} /></div>
              </div>
            </motion.div>

            {/* Side panels */}
            <div className="flex flex-col gap-3">
              <GlassShard title="⚡ ENTERPRISE POWER" text="This is what billion-dollar companies have. Now you have it too." color="cyan" delay={0.4} isInView={isInView} />
              <GlassShard title="🔓 OPEN SOURCE" text="Every line visible. Audit it. Fork it. Own it." color="violet" delay={0.5} isInView={isInView} />
            </div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col gap-2"
            >
              {features.map((f, i) => (
                <FeatureLine key={i} highlight={f.highlight} text={f.text} delay={0.6 + i * 0.08} isInView={isInView} />
              ))}
            </motion.div>

            {/* CTAs */}
            <div className="flex flex-col gap-3">
              <CTAButtons isInView={isInView} />
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 gap-4">
              {cards.map((card, idx) => (
                <FragmentCard key={idx} card={card} delay={1.2 + idx * 0.15} isInView={isInView} />
              ))}
            </div>
          </div>

          {/* Desktop 2-col layout */}
          <div className="hidden md:grid gap-6" style={{ gridTemplateColumns: '1.5fr 1fr', gridTemplateRows: 'auto auto auto auto' }}>
            {/* Row 1: System tag spans both cols */}
            <div className="col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="inline-block w-fit px-4 py-2 text-xs font-mono uppercase tracking-[0.15em] border-2 border-cyan-500 border-l-[6px] text-cyan-400"
                style={{
                  background: 'rgba(6,182,212,0.05)',
                  boxShadow: '0 0 20px rgba(6,182,212,0.3)',
                  animation: 'heroGlitchTag 5s infinite'
                }}
              >
                <span className="text-purple-400" style={{ animation: 'heroBlink 1s infinite' }}>&gt; </span>
                LIBERATION PROTOCOL v3.0 ACTIVE
              </motion.div>
            </div>

            {/* Row 2: Headline + Side panels */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <h1 className="font-black text-5xl lg:text-6xl xl:text-7xl leading-[0.85] uppercase tracking-tight mb-4" style={{ transform: 'skewY(-2deg)' }}>
                <span className="text-white block">STOP</span>
                <span className="text-white block">GETTING</span>
                <span className="hero-word-robbed block">ROBBED.</span>
                <span className="text-white block text-[0.7em]">START</span>
                <span className="hero-word-creating block">CREATING.</span>
              </h1>
              <div className="bg-black/80 border-2 border-cyan-500 p-3 font-mono text-xs text-cyan-400 relative mt-3" style={{ boxShadow: '0 0 20px rgba(6,182,212,0.2)', textShadow: '0 0 10px #06b6d4' }}>
                <div className="opacity-50 text-[10px] mb-1">$ sudo access --level=CREATOR</div>
                <div>{typedText}<span className="inline-block w-[6px] h-3 bg-cyan-400 ml-[3px]" style={{ animation: 'heroBlink 1s infinite', boxShadow: '0 0 8px #06b6d4' }} /></div>
              </div>
            </motion.div>

            <div className="flex flex-col gap-3">
              <GlassShard title="⚡ ENTERPRISE POWER" text="This is what billion-dollar companies have. Now you have it too." color="cyan" delay={0.4} isInView={isInView} />
              <GlassShard title="🔓 OPEN SOURCE" text="Every line visible. Audit it. Fork it. Own it." color="violet" delay={0.5} isInView={isInView} />
            </div>

            {/* Row 3: Features + CTAs */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col gap-2"
            >
              {features.map((f, i) => (
                <FeatureLine key={i} highlight={f.highlight} text={f.text} delay={0.6 + i * 0.08} isInView={isInView} />
              ))}
            </motion.div>

            <div className="flex flex-col gap-3 justify-center">
              <CTAButtons isInView={isInView} />
            </div>

            {/* Row 4: Fragment cards span both cols */}
            <div className="col-span-2 grid grid-cols-3 gap-5">
              {cards.map((card, idx) => (
                <FragmentCard key={idx} card={card} delay={1.2 + idx * 0.15} isInView={isInView} />
              ))}
            </div>
          </div>
        </div>

        {/* Graffiti tag */}
        <div className="absolute bottom-4 right-6 font-mono text-[10px] text-purple-500 opacity-30 tracking-[0.25em] pointer-events-none" style={{ transform: 'rotate(-5deg)', textShadow: '2px 2px 0 rgba(0,0,0,0.5), 0 0 10px #7c3aed' }}>
          GLYPHLOCK_2026
        </div>
      </motion.div>
    </section>
  );
}

function GlassShard({ title, text, color, delay, isInView }) {
  const isCyan = color === 'cyan';
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.7, delay }}
      className={`relative overflow-hidden p-5 cursor-pointer transition-all duration-500 group`}
      style={{
        background: `linear-gradient(135deg, ${isCyan ? 'rgba(6,182,212,0.08)' : 'rgba(79,70,229,0.08)'}, ${isCyan ? 'rgba(79,70,229,0.05)' : 'rgba(124,58,237,0.05)'})`,
        border: `2px solid ${isCyan ? 'rgba(6,182,212,0.3)' : 'rgba(124,58,237,0.3)'}`,
        clipPath: isCyan ? 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)' : 'polygon(0% 0%, 95% 0%, 100% 100%, 5% 100%)',
        transform: isCyan ? 'rotate(-2deg)' : 'rotate(1deg)'
      }}
    >
      <div className={`text-sm font-bold uppercase tracking-wide mb-1 ${isCyan ? 'text-cyan-400' : 'text-purple-400'}`} style={{ textShadow: `0 0 10px ${isCyan ? '#06b6d4' : '#7c3aed'}` }}>
        {title}
      </div>
      <div className="text-xs text-white/90 leading-relaxed">{text}</div>
    </motion.div>
  );
}

function FeatureLine({ highlight, text, delay, isInView }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="bg-black/50 border-l-[3px] border-cyan-500 px-4 py-3 text-xs sm:text-sm font-bold cursor-pointer transition-all duration-300 hover:bg-cyan-500/10 hover:border-l-[6px] hover:translate-x-2 relative overflow-hidden group"
    >
      <span className="text-cyan-400 mr-2 group-hover:hidden" style={{ textShadow: '0 0 8px #06b6d4' }}>▸</span>
      <span className="text-cyan-400 mr-2 hidden group-hover:inline" style={{ textShadow: '0 0 8px #06b6d4' }}>►</span>
      <span className="text-white" style={{ textShadow: '0 0 10px #06b6d4' }}>{highlight}</span>
      <span className="text-white/90"> {text}</span>
      <div className="absolute left-0 top-0 w-0 h-full group-hover:w-full transition-all duration-400" style={{ background: 'linear-gradient(90deg, rgba(6,182,212,0.2), transparent)' }} />
    </motion.div>
  );
}

function CTAButtons({ isInView }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.9 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <Link to={createPageUrl("Consultation")} className="block">
          <div
            className="relative text-center py-4 px-6 font-black text-sm sm:text-base uppercase tracking-wide cursor-pointer text-black transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #06b6d4, #4f46e5)',
              boxShadow: '5px 5px 0 rgba(0,0,0,0.3), 0 0 30px rgba(6,182,212,0.5)',
              clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              ⚡ TAKE CONTROL NOW
            </span>
          </div>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 1.0 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <Link to={createPageUrl("SecurityTools")} className="block">
          <div
            className="relative text-center py-4 px-6 font-bold text-sm sm:text-base uppercase tracking-wide cursor-pointer text-purple-400 border-[3px] border-purple-500 transition-all duration-300 hover:bg-purple-500/10"
            style={{
              boxShadow: '4px 4px 0 rgba(124,58,237,0.3), 0 0 25px rgba(124,58,237,0.3)',
              clipPath: 'polygon(0% 8%, 92% 0%, 100% 92%, 8% 100%)'
            }}
          >
            👁 EXPLORE FRAMEWORK
          </div>
        </Link>
      </motion.div>
    </>
  );
}

function FragmentCard({ card, delay, isInView }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.8, delay, type: "spring", stiffness: 100, damping: 14 }}
      whileHover={{ scale: 1.05 }}
      className={`relative overflow-hidden p-6 border-2 ${card.borderClass} cursor-pointer transition-all duration-500 ${card.glowClass}`}
      style={{
        background: 'linear-gradient(135deg, rgba(10,1,24,0.95), rgba(30,27,75,0.9))',
        clipPath: card.clipPath
      }}
    >
      <div className="mb-3" style={{ animation: 'heroIconFloat 3s ease-in-out infinite' }}>
        {card.icon}
      </div>
      <h3 className="text-sm font-black uppercase tracking-wide mb-2" style={{ color: card.color, textShadow: `0 0 15px ${card.color}` }}>
        {card.title}
      </h3>
      <p className="text-xs text-white/90 leading-relaxed">{card.desc}</p>
    </motion.div>
  );
}