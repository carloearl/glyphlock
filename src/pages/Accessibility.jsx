import React, { useState } from "react";
import { 
  Eye, EyeOff, Keyboard, Users, Volume2, Hand, Ear, EarOff,
  Contrast, Type, ZoomIn, MousePointer2, Pause, Accessibility,
  CheckCircle2, ArrowRight, Sparkles, Phone, Mail, MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import AccessibilityToolbar from "@/components/accessibility/AccessibilityToolbar";
import ReadAloudButton from "@/components/accessibility/ReadAloudButton";
import SignLanguagePanel from "@/components/accessibility/SignLanguagePanel";

const WCAG_STANDARDS = [
  { code: "WCAG 2.1 AA", description: "Web Content Accessibility Guidelines compliance target" },
  { code: "Section 508", description: "U.S. federal accessibility requirements" },
  { code: "ADA Title III", description: "Americans with Disabilities Act digital compliance" },
  { code: "EN 301 549", description: "European accessibility standard for ICT products" },
];

const VISION_FEATURES = [
  { title: "Screen Reader Optimization", description: "Full ARIA labeling, semantic HTML, landmark regions, and live announcements for JAWS, NVDA, and VoiceOver users.", icon: Eye },
  { title: "High Contrast Mode", description: "One-click toggle increases contrast ratios to 7:1 minimum across all UI elements for users with low vision.", icon: Contrast },
  { title: "Text Scaling (12px–28px)", description: "Real-time font size adjustment without breaking layout. All content reflows to fit enlarged text.", icon: ZoomIn },
  { title: "Color Inversion", description: "Full color inversion for users who need light-on-dark or inverted palettes to reduce eye strain.", icon: EyeOff },
  { title: "Read-Aloud on Every Section", description: "Built-in text-to-speech buttons on page sections. Click 'Listen' to hear any content read aloud instantly.", icon: Volume2 },
  { title: "Link Underlining", description: "Force-underline all links sitewide so they're identifiable without relying on color alone.", icon: Type },
];

const DEAF_FEATURES = [
  { title: "ASL Gloss Translator", description: "AI-powered English-to-ASL gloss converter. Translates any text into American Sign Language notation with fingerspelling visuals.", icon: Hand },
  { title: "No Audio-Only Content", description: "All audio content has text transcripts. GlyphBot responses always include written text alongside any voice output.", icon: EarOff },
  { title: "Visual Alerts", description: "All system notifications use visual indicators (color, icons, animations) — never audio-only alerts.", icon: Sparkles },
  { title: "Captioned Media", description: "All video and audio content includes captions or full transcripts. No information is communicated through sound alone.", icon: MessageSquare },
];

const MOTOR_FEATURES = [
  { title: "Full Keyboard Navigation", description: "Every interactive element is reachable via Tab, Enter, Space, and arrow keys. Visible focus indicators on all controls.", icon: Keyboard },
  { title: "Large Touch Targets (48px+)", description: "All buttons and interactive elements meet 48×48px minimum for users with limited motor control.", icon: MousePointer2 },
  { title: "Reduce Motion", description: "Disables all animations, parallax, and transitions for users with vestibular disorders or motion sensitivity.", icon: Pause },
  { title: "No Time-Limited Actions", description: "No session timeouts or timed interactions that force quick responses. Users can take as long as needed.", icon: Pause },
];

const COGNITIVE_FEATURES = [
  { title: "Dyslexia-Friendly Font", description: "Toggle a font optimized for dyslexic readers with increased letter spacing and distinct letterforms.", icon: Type },
  { title: "Clear Language", description: "UI labels use plain, direct language. No jargon without explanation. Error messages explain what to do next.", icon: MessageSquare },
  { title: "Consistent Layout", description: "Navigation, controls, and content areas maintain the same position across all pages to reduce cognitive load.", icon: Users },
  { title: "Large Cursor Mode", description: "Enlarged cursor for users who have difficulty tracking the pointer on screen.", icon: MousePointer2 },
];

function FeatureCard({ feature, idx }) {
  const Icon = feature.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className="p-5 rounded-xl border-2 border-white/10 bg-white/[0.03] backdrop-blur-sm hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-cyan-500/10 flex-shrink-0">
          <Icon className="w-5 h-5 text-cyan-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-sm mb-1">{feature.title}</h3>
          <p className="text-white/50 text-xs leading-relaxed">{feature.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function AccessibilityPage() {
  const [toolbarOpen, setToolbarOpen] = useState(false);

  const commitmentText = "GlyphLock is built for everyone. We don't treat accessibility as a checkbox — it's a core design principle. Every feature is engineered to work for blind users navigating with screen readers, deaf users who need visual-only communication, users with limited motor control who rely on keyboard navigation, and users with cognitive differences who benefit from clear, consistent interfaces. Our accessibility tools are not hidden in settings. They are first-class features available on every page.";

  return (
    <>
      <SEOHead 
        title="Accessibility Center — Real Tools for Real People | GlyphLock"
        description="GlyphLock's accessibility center with real tools: screen reader optimization, ASL translation, text-to-speech, high contrast, dyslexia fonts, keyboard navigation, and motor support."
        url="/accessibility"
      />

      <AccessibilityToolbar open={toolbarOpen} onClose={() => setToolbarOpen(false)} />

      <div className="min-h-screen text-white pt-16 pb-20 relative" style={{ background: 'transparent' }}>
        <div className="container mx-auto px-4 max-w-6xl relative z-10">

          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/15 border border-cyan-400/30 mb-6">
              <Accessibility className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-300 text-sm font-semibold">Accessibility Center</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-4">
              Built for <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">Everyone</span>
            </h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8">
              Real tools for blind, deaf, motor-impaired, and cognitively diverse users. Not a statement — a system.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                onClick={() => setToolbarOpen(true)}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-6"
              >
                <Accessibility className="w-4 h-4 mr-2" />
                Open Accessibility Tools
              </Button>
              <ReadAloudButton text={commitmentText} label="Listen to our commitment" />
            </div>
          </div>

          {/* Standards */}
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {WCAG_STANDARDS.map((s) => (
              <div key={s.code} className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03]" title={s.description}>
                <span className="text-xs font-bold text-cyan-400">{s.code}</span>
              </div>
            ))}
          </div>

          {/* Our Commitment */}
          <section className="mb-16 p-8 rounded-2xl border-2 border-cyan-500/20 bg-white/[0.02] backdrop-blur-sm">
            <div className="flex items-start gap-4 mb-4">
              <Users className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">Our Commitment</h2>
                <ReadAloudButton text={commitmentText} className="mb-4" />
              </div>
            </div>
            <p className="text-white/60 leading-relaxed">{commitmentText}</p>
          </section>

          {/* Blind / Low Vision */}
          <section className="mb-16" aria-labelledby="vision-heading">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="w-6 h-6 text-blue-400" />
              <h2 id="vision-heading" className="text-2xl font-bold text-white">Blind & Low Vision</h2>
              <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-xs">6 Features</Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {VISION_FEATURES.map((f, i) => <FeatureCard key={i} feature={f} idx={i} />)}
            </div>
          </section>

          {/* Deaf / Hard of Hearing */}
          <section className="mb-16" aria-labelledby="deaf-heading">
            <div className="flex items-center gap-3 mb-6">
              <Ear className="w-6 h-6 text-amber-400" />
              <h2 id="deaf-heading" className="text-2xl font-bold text-white">Deaf & Hard of Hearing</h2>
              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs">4 Features</Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {DEAF_FEATURES.map((f, i) => <FeatureCard key={i} feature={f} idx={i} />)}
            </div>

            {/* Live ASL Tool */}
            <div className="p-6 rounded-2xl border-2 border-amber-500/20 bg-amber-500/5">
              <SignLanguagePanel />
            </div>
          </section>

          {/* Motor Impairment */}
          <section className="mb-16" aria-labelledby="motor-heading">
            <div className="flex items-center gap-3 mb-6">
              <Keyboard className="w-6 h-6 text-emerald-400" />
              <h2 id="motor-heading" className="text-2xl font-bold text-white">Motor & Mobility</h2>
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">4 Features</Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {MOTOR_FEATURES.map((f, i) => <FeatureCard key={i} feature={f} idx={i} />)}
            </div>
          </section>

          {/* Cognitive */}
          <section className="mb-16" aria-labelledby="cognitive-heading">
            <div className="flex items-center gap-3 mb-6">
              <Type className="w-6 h-6 text-purple-400" />
              <h2 id="cognitive-heading" className="text-2xl font-bold text-white">Cognitive & Learning</h2>
              <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-xs">4 Features</Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {COGNITIVE_FEATURES.map((f, i) => <FeatureCard key={i} feature={f} idx={i} />)}
            </div>
          </section>

          {/* Quick Access */}
          <section className="mb-16 p-8 rounded-2xl border-2 border-blue-500/20 bg-gradient-to-br from-blue-950/30 via-slate-950/40 to-indigo-950/30 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Accessibility Toolbar — Always Available</h2>
            <p className="text-white/50 mb-6 max-w-xl mx-auto">
              The accessibility toolbar is available on every page. Click the button below or press <kbd className="px-2 py-1 rounded bg-white/10 text-cyan-400 font-mono text-xs">Alt + A</kbd> to open it anywhere.
            </p>
            <Button
              onClick={() => setToolbarOpen(true)}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold px-8"
            >
              <Accessibility className="w-4 h-4 mr-2" />
              Open Accessibility Tools
            </Button>
          </section>

          {/* Contact / Feedback */}
          <section className="p-8 rounded-2xl border-2 border-cyan-500/20 bg-cyan-500/5 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Report Accessibility Issues</h2>
            <p className="text-white/50 mb-6 max-w-xl mx-auto">
              Found a barrier? We take accessibility bugs as seriously as security vulnerabilities. Report issues and we'll fix them within 48 hours.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="mailto:carloearl@glyphlock.com?subject=Accessibility%20Issue" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors">
                <Mail className="w-4 h-4" /> Email Accessibility Team
              </a>
              <a href="tel:+14808865588" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 font-bold transition-colors">
                <Phone className="w-4 h-4" /> (480) 886-5588
              </a>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}