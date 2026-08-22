import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { 
  QrCode, Link2, ShieldCheck, Bot, ImagePlus, CreditCard,
  ChevronRight, Wrench, Lock
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { motion, useInView } from "framer-motion";

const TOOLS = [
  {
    title: "QR Generator & Verification",
    subtitle: "QR Code Generator with Steganography",
    description: "Create secure QR codes with hidden data layers. Perfect for voucher systems, tickets, and authentication.",
    features: ["Cryptographic verification", "Steganographic encoding", "Custom branding options"],
    icon: QrCode,
    link: "SecureQRStudio",
    cta: "Try Generator",
    color: "cyan"
  },
  {
    title: "Blockchain Analysis",
    subtitle: "Blockchain Transaction Verifier",
    description: "Analyze smart contracts and verify transaction integrity. Support for Ethereum, Polygon, and major chains.",
    features: ["Contract code auditing", "Transaction tracing", "Gas optimization tips"],
    icon: Link2,
    link: "Blockchain",
    cta: "Analyze Contract",
    color: "purple"
  },
  {
    title: "Security Scanner",
    subtitle: "Code & System Security Scanner",
    description: "Scan code for vulnerabilities and system misconfigurations. Get actionable fixes, not just warnings.",
    features: ["Dependency analysis", "Configuration auditing", "Real-time threat detection"],
    icon: ShieldCheck,
    link: "SecurityOperationsCenter",
    cta: "Start Scan",
    color: "emerald"
  },
  {
    title: "GlyphBot Assistant",
    subtitle: "AI Security Assistant",
    description: "Ask security questions, analyze code, debug issues. Trained on cybersecurity best practices.",
    features: ["Code review assistance", "Threat explanation", "Fix recommendations"],
    icon: Bot,
    link: "GlyphBot",
    cta: "Open GlyphBot",
    color: "blue"
  },
  {
    title: "Image Processing Lab",
    subtitle: "Image Analysis & Processing",
    description: "Upload, analyze, and manipulate images with AI. Extract data, detect objects, process batches.",
    features: ["OCR text extraction", "Object detection", "Batch processing", "Format conversion"],
    icon: ImagePlus,
    link: "ImageLab",
    cta: "Open Image Lab",
    color: "amber"
  },
  {
    title: "NUPS Transaction System",
    subtitle: "Venue Payment Verification",
    description: "Custom payment processing for entertainment venues. Verify transactions without third-party fees.",
    features: ["Real-time verification", "Custom currency support", "Audit trail logging"],
    icon: CreditCard,
    link: "NUPSLogin",
    cta: "Access NUPS",
    badge: "Venue Login Required",
    color: "rose"
  }
];

const COLOR_MAP = {
  cyan:    { card: "border-cyan-500/20 hover:border-cyan-400/50", icon: "from-cyan-500 to-cyan-600", badge: "bg-cyan-500/10 text-cyan-400", glow: "hover:shadow-[0_0_40px_rgba(6,182,212,0.15)]" },
  purple:  { card: "border-purple-500/20 hover:border-purple-400/50", icon: "from-purple-500 to-purple-600", badge: "bg-purple-500/10 text-purple-400", glow: "hover:shadow-[0_0_40px_rgba(168,85,247,0.15)]" },
  emerald: { card: "border-emerald-500/20 hover:border-emerald-400/50", icon: "from-emerald-500 to-emerald-600", badge: "bg-emerald-500/10 text-emerald-400", glow: "hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]" },
  blue:    { card: "border-blue-500/20 hover:border-blue-400/50", icon: "from-blue-500 to-blue-600", badge: "bg-blue-500/10 text-blue-400", glow: "hover:shadow-[0_0_40px_rgba(59,130,246,0.15)]" },
  amber:   { card: "border-amber-500/20 hover:border-amber-400/50", icon: "from-amber-500 to-amber-600", badge: "bg-amber-500/10 text-amber-400", glow: "hover:shadow-[0_0_40px_rgba(245,158,11,0.15)]" },
  rose:    { card: "border-rose-500/20 hover:border-rose-400/50", icon: "from-rose-500 to-rose-600", badge: "bg-rose-500/10 text-rose-400", glow: "hover:shadow-[0_0_40px_rgba(244,63,94,0.15)]" },
};

function ToolCard({ tool, index, inView }) {
  const c = COLOR_MAP[tool.color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.08 * index, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link to={createPageUrl(tool.link)} className="block h-full">
        <div className={`
          group h-full rounded-2xl border-2 ${c.card} ${c.glow}
          bg-white/[0.03] backdrop-blur-xl
          p-5 sm:p-6 transition-all duration-500 cursor-pointer
          hover:bg-white/[0.06] hover:-translate-y-1
        `}>
          {/* Icon + Title row */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`
              w-11 h-11 rounded-xl bg-gradient-to-br ${c.icon}
              flex items-center justify-center flex-shrink-0
              shadow-lg group-hover:scale-110 transition-transform duration-300
            `}>
              <tool.icon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight group-hover:text-blue-300 transition-colors">
                {tool.title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{tool.subtitle}</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            {tool.description}
          </p>

          {/* Features */}
          <ul className="space-y-1.5 mb-5">
            {tool.features.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
                <span className={`w-1 h-1 rounded-full bg-gradient-to-r ${c.icon} flex-shrink-0`} />
                {f}
              </li>
            ))}
          </ul>

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.06]">
            <span className={`
              inline-flex items-center gap-1.5 text-xs font-semibold
              ${c.badge.split(' ')[1]} 
              group-hover:translate-x-0.5 transition-transform
            `}>
              {tool.cta}
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
            {tool.badge && (
              <span className="text-[10px] text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">
                {tool.badge}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function SecurityTools() {
  const heroRef = useRef(null);
  const gridRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true, amount: 0.4 });
  const gridInView = useInView(gridRef, { once: true, amount: 0.1 });

  return (
    <>
      <SEOHead
        title="GlyphLock Developer Tools | Code, Images, QR & Records"
        description="Explore supported tools for code review, image and QR workflows, record inspection, site analysis, and venue operations with documented outputs."
        keywords="GlyphLock developer tools, code review, image tools, QR tools, record inspection, site analysis, venue operations"
        url="/security-tools"
      />

      <div className="text-white min-h-screen" style={{ background: 'transparent' }}>
        {/* Hero */}
        <section ref={heroRef} className="pt-12 pb-6 md:pt-20 md:pb-10" style={{ background: 'transparent' }}>
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.7, type: "spring", stiffness: 150 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-6"
              >
                <Wrench className="w-3.5 h-3.5" />
                Developer Tools & Analysis
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight"
              >
                AI-Powered <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">Utilities</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
              >
                Code, blockchain, images, and system verification.
                <br className="hidden sm:block" />
                Built for venues and developers who need real solutions.
              </motion.p>
            </div>
          </div>
        </section>

        {/* Tool Grid */}
        <section ref={gridRef} className="py-8 md:py-14" style={{ background: 'transparent' }}>
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {TOOLS.map((tool, i) => (
                <ToolCard key={i} tool={tool} index={i} inView={gridInView} />
              ))}
            </div>
          </div>
        </section>

        {/* Minimal CTA */}
        <section className="py-12 md:py-20" style={{ background: 'transparent' }}>
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Open Source Framework</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white">
              Stop Getting Robbed. Start Creating.
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mb-6">
              All tools are open access. No paywall. No trial. Just build.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to={createPageUrl("SecureQRStudio")}>
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-6">
                  Try QR Generator
                </Button>
              </Link>
              <Link to={createPageUrl("GlyphBot")}>
                <Button variant="outline" className="border-slate-700 hover:bg-slate-800 text-white px-6">
                  Chat with GlyphBot
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}