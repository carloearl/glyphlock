import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, ArrowRight, Zap, Shield, Sparkles } from "lucide-react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

export default function CTASection() {
  const [email, setEmail] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);
  useInView(containerRef, { once: true, amount: 0.5 });
  const isInView = true; // always render content
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 1, 0.5]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.98]);

  const handleGetStarted = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    window.location.href = createPageUrl("Consultation") + `?email=${encodeURIComponent(email)}`;
  };

  const benefits = [
    { text: "Free scoping call, no obligation", icon: CheckCircle2 },
    { text: "Fixed quote before we start", icon: Shield },
    { text: "You talk to the people building it", icon: Zap },
    { text: "Support and updates after launch", icon: Sparkles }
  ];

  // Stagger animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };

  const slideLeftVariants = {
    hidden: { opacity: 0, x: -60 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };

  const slideRightVariants = {
    hidden: { opacity: 0, x: 60 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };

  return (
    <motion.div 
      ref={containerRef}
      className="w-full max-w-6xl mx-auto px-4 py-20 relative overflow-hidden"
      style={{ background: 'transparent', pointerEvents: 'auto', scale, maxWidth: '100vw' }}
    >
      {/* Animated background orbs - Royal Blue/Indigo - Mobile Safe */}
      <motion.div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ y: backgroundY, willChange: 'transform' }}
      >
        <motion.div
          className="absolute top-0 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-blue-500/25 rounded-full blur-[80px] md:blur-[120px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-indigo-500/25 rounded-full blur-[80px] md:blur-[120px]"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.3, 0.4]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </motion.div>

      <motion.div
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={containerVariants}
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Main card with animated border */}
        <div className="relative rounded-[34px] overflow-hidden shadow-[0_0_55px_rgba(59,130,246,.24),0_0_120px_rgba(124,58,237,.20)]">
          {/* VIVID Royal Blue Glow - Behind everything - Mobile Safe */}
          <motion.div
            className="absolute -inset-2 md:-inset-4 rounded-3xl blur-2xl md:blur-3xl"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.7) 0%, rgba(37,99,235,0.5) 40%, rgba(29,78,216,0.3) 70%, transparent 100%)',
              willChange: 'transform, opacity'
            }}
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.6, 0.9, 0.6]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Secondary glow pulse - Mobile Safe */}
          <motion.div
            className="absolute -inset-3 md:-inset-6 rounded-3xl blur-[40px] md:blur-[60px]"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.5) 0%, rgba(6,182,212,0.2) 50%, transparent 80%)',
              willChange: 'opacity'
            }}
            animate={{
              opacity: isHovered ? 0.8 : 0.5
            }}
            transition={{ duration: 0.4 }}
          />

          {/* Animated gradient border - Vivid Royal Blue */}
          <motion.div
            className="absolute inset-0 rounded-3xl p-[2px]"
            style={{
              background: 'linear-gradient(90deg, #22d3ee, #3B82F6, #8b5cf6, #d946ef, #22d3ee)',
              backgroundSize: '300% 100%'
            }}
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute inset-[2px] rounded-3xl bg-gradient-to-br from-blue-950/90 via-slate-950/95 to-indigo-950/90 backdrop-blur-2xl" />
          </motion.div>
          
          {/* Content container - Deep Royal Blue glassmorphism */}
          <div className="relative bg-gradient-to-br from-blue-950/45 via-slate-950/55 to-violet-950/45 backdrop-blur-2xl rounded-[34px] p-8 md:p-14 overflow-hidden border-2 border-cyan-300/35 shadow-[inset_0_1px_0_rgba(103,232,249,.35),inset_0_0_70px_rgba(99,102,241,.10)]">
            {/* Grid pattern overlay - Purple/Violet */}
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `
                linear-gradient(rgba(168,85,247,0.7) 1px, transparent 1px),
                linear-gradient(90deg, rgba(139,92,246,0.7) 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px'
            }} />

            {/* Top accent line - Vivid Royal Blue with glow */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-[2px] shadow-[0_0_20px_rgba(59,130,246,0.8)]"
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{
                background: 'linear-gradient(90deg, transparent, #3B82F6 20%, #60A5FA 50%, #3B82F6 80%, transparent)'
              }}
            />
            
            <div className="relative z-10 text-center">
              {/* Badge - Royal Blue with scale pop */}
              <motion.div
                initial={{ opacity: 0, scale: 0.6, y: 20 }}
                animate={isInView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.6, y: 20 }}
                transition={{ duration: 0.9, delay: 0.2, type: "spring", stiffness: 120, damping: 14 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/15 border border-blue-400/30 mb-6"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles size={14} className="text-blue-400" />
                </motion.div>
                <span className="text-blue-300 text-sm font-medium tracking-wide">GlyphLock — Custom Software Studio</span>
              </motion.div>

              {/* Title - Slide from LEFT */}
              <motion.h2
                initial={{ opacity: 0, x: -100 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -100 }}
                transition={{ duration: 1.1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]"
              >
READY TO{' '}
                <motion.span 
                  className="bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-[#3B82F6] bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  style={{
                    backgroundSize: '200% 100%'
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
BUILD IT?
                </motion.span>
              </motion.h2>

              {/* Subtitle - Slide from RIGHT */}
              <motion.p
                initial={{ opacity: 0, x: 100 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 }}
                transition={{ duration: 1.1, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="text-base md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto font-medium"
              >
                Tell us what you're building or running — we'll reply with a real plan and a real quote.
              </motion.p>

              {/* Email form - Scale up with bounce */}
              <motion.form
                onSubmit={handleGetStarted}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.9 }}
                transition={{ duration: 1, delay: 0.7, type: "spring", stiffness: 100, damping: 14 }}
                className="flex flex-col sm:flex-row gap-3 md:gap-4 max-w-lg mx-auto mb-10"
              >
                <div className="flex-1 relative group">
                  <Input
                    type="email"
                    required
                    placeholder="Your work email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/8 backdrop-blur-md border-2 border-white/20 text-white placeholder:text-white/60 focus:border-indigo-400 focus:shadow-[0_0_30px_rgba(87,61,255,0.5)] transition-all h-14 md:h-16 rounded-xl text-base px-5"
                    aria-label="Email address for getting started"
                  />
                  {/* Focus glow */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity pointer-events-none" />
                </div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    type="submit"
                    size="lg"
                    className="relative overflow-hidden h-14 md:h-16 px-6 md:px-10 bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:from-[#2563EB] hover:to-[#60A5FA] text-white font-black tracking-wide shadow-[0_0_25px_rgba(59,130,246,0.5)] hover:shadow-[0_0_40px_rgba(30,64,175,0.7)] transition-all duration-300 rounded-xl w-full sm:w-auto"
                  >
                    {/* Shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                    />
                    <span className="relative flex items-center gap-2 text-sm md:text-base">
START MY PROJECT
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight size={18} />
                      </motion.span>
                    </span>
                  </Button>
                </motion.div>
              </motion.form>

              {/* Benefits grid - Alternating slide from LEFT and RIGHT - Mobile Safe */}
              <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
               {benefits.map((benefit, idx) => {
                 const Icon = benefit.icon;
                 const isLeft = idx % 2 === 0;
                 return (
                   <motion.div
                     key={idx}
                     initial={{ opacity: 0, x: isLeft ? -80 : 80, scale: 0.9 }}
                     animate={isInView ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: isLeft ? -80 : 80, scale: 0.9 }}
                     transition={{ 
                       duration: 1, 
                       delay: 0.9 + (idx * 0.15), 
                       ease: [0.16, 1, 0.3, 1] 
                     }}
                     whileHover={{ scale: 1.03, x: isLeft ? 8 : -8 }}
                     className="flex items-center gap-3 text-white font-medium p-3 md:p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-400/50 hover:bg-blue-500/10 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all cursor-default"
                     style={{ maxWidth: '100%', overflow: 'hidden', willChange: 'transform' }}
                   >
                     <motion.div
                       whileHover={{ rotate: 360, scale: 1.1 }}
                       transition={{ duration: 0.5 }}
                       className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-500/25 to-blue-600/25 flex items-center justify-center"
                     >
                       <Icon className="w-4 h-4 md:w-5 md:h-5 text-[#3B82F6]" style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.9))' }} />
                     </motion.div>
                     <span className="text-xs md:text-sm tracking-wide">{benefit.text}</span>
                   </motion.div>
                 );
               })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}