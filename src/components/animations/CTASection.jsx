/**
 * CTASection - Modern animated CTA component with scroll reveals
 * Features: Parallax, glow effects, staggered animations
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';
import { ScrollReveal, HorizontalReveal, GlowReveal, TextReveal, ParallaxScroll } from './ScrollReveal';

export function CTASection({
  title = "Ready to Secure Your Future?",
  subtitle = "Connect evidence across every handoff",
  description = "Get started with GlyphLock's enterprise-grade security platform today.",
  primaryCTA = { label: "Get Started", href: "Consultation" },
  secondaryCTA = { label: "Learn More", href: "About" },
  variant = 'default', // 'default' | 'minimal' | 'gradient' | 'glassmorphism'
  className = ''
}) {
  const containerRef = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0.5]);

  if (variant === 'minimal') {
    return (
      <section className={`py-20 px-6 ${className}`}>
        <div className="max-w-4xl mx-auto text-center">
          <HorizontalReveal direction="left">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{title}</h2>
          </HorizontalReveal>
          <HorizontalReveal direction="right" delay={0.2}>
            <p className="text-gray-400 mb-8">{description}</p>
          </HorizontalReveal>
          <ScrollReveal animation="scaleUp" delay={0.4}>
            <Link to={createPageUrl(primaryCTA.href)}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-full inline-flex items-center gap-2"
              >
                {primaryCTA.label}
                <ArrowRight size={18} />
              </motion.button>
            </Link>
          </ScrollReveal>
        </div>
      </section>
    );
  }

  if (variant === 'glassmorphism') {
    return (
      <section ref={containerRef} className={`relative py-32 px-6 overflow-hidden ${className}`}>
        {/* Background elements */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ y: backgroundY }}
        >
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-[120px]" />
        </motion.div>

        <div className="max-w-5xl mx-auto relative">
          <GlowReveal glowColor="rgba(0, 228, 255, 0.2)">
            <div className="relative bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-12 md:p-16 overflow-hidden">
              {/* Grid pattern */}
              <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: `linear-gradient(rgba(0,228,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,228,255,0.5) 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }} />
              
              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
              
              <div className="relative text-center">
                <ScrollReveal animation="fadeUp">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
                    <Sparkles size={14} className="text-cyan-400" />
                    <span className="text-cyan-400 text-sm font-medium">{subtitle}</span>
                  </div>
                </ScrollReveal>
                
                <HorizontalReveal direction="left" delay={0.1}>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                    {title}
                  </h2>
                </HorizontalReveal>
                
                <HorizontalReveal direction="right" delay={0.2}>
                  <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
                    {description}
                  </p>
                </HorizontalReveal>

                <ScrollReveal animation="scaleUp" delay={0.3}>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link to={createPageUrl(primaryCTA.href)}>
                      <motion.button
                        whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(0, 228, 255, 0.4)' }}
                        whileTap={{ scale: 0.97 }}
                        className="group relative px-8 py-4 rounded-full overflow-hidden"
                      >
                        {/* Animated gradient border */}
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: 'linear-gradient(90deg, #00E4FF, #3B82F6, #8B5CF6, #00E4FF)',
                            backgroundSize: '300% 100%'
                          }}
                          animate={{
                            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                          }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                        <div className="absolute inset-[2px] rounded-full bg-slate-900" />
                        
                        <span className="relative z-10 flex items-center gap-2 text-white font-bold">
                          <Zap size={18} className="text-cyan-400" />
                          {primaryCTA.label}
                          <motion.span
                            animate={{ x: [0, 4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <ArrowRight size={18} />
                          </motion.span>
                        </span>
                      </motion.button>
                    </Link>

                    <Link to={createPageUrl(secondaryCTA.href)}>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="px-8 py-4 rounded-full border border-white/20 text-gray-300 hover:text-white hover:border-white/40 font-semibold transition-colors"
                      >
                        {secondaryCTA.label}
                      </motion.button>
                    </Link>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </GlowReveal>
        </div>
      </section>
    );
  }

  // Default variant
  return (
    <section ref={containerRef} className={`relative py-32 px-6 overflow-hidden ${className}`}>
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: glowOpacity }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-500/20 to-transparent rounded-full blur-[100px]"
          style={{ y: backgroundY }}
        />
      </motion.div>

      <div className="max-w-4xl mx-auto text-center relative">
        <ParallaxScroll speed={0.2}>
          <ScrollReveal animation="blur">
            <Shield className="w-16 h-16 text-cyan-400 mx-auto mb-6" style={{ filter: 'drop-shadow(0 0 20px rgba(0,228,255,0.5))' }} />
          </ScrollReveal>
        </ParallaxScroll>

        <HorizontalReveal direction="left">
          <span className="text-cyan-400 text-sm font-bold uppercase tracking-widest mb-4 block">{subtitle}</span>
        </HorizontalReveal>

        <ScrollReveal animation="fadeUp" delay={0.1}>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
            <TextReveal text={title} delay={0.2} />
          </h2>
        </ScrollReveal>

        <HorizontalReveal direction="right" delay={0.3}>
          <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            {description}
          </p>
        </HorizontalReveal>

        <ScrollReveal animation="scaleUp" delay={0.4}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={createPageUrl(primaryCTA.href)}>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(0, 228, 255, 0.5)' }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 text-white font-bold rounded-full inline-flex items-center gap-3 text-lg shadow-[0_0_30px_rgba(0,228,255,0.3)]"
              >
                {primaryCTA.label}
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight size={20} />
                </motion.span>
              </motion.button>
            </Link>

            <Link to={createPageUrl(secondaryCTA.href)}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 border-2 border-white/20 text-white font-bold rounded-full hover:border-cyan-400/50 hover:bg-white/5 transition-all"
              >
                {secondaryCTA.label}
              </motion.button>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default CTASection;