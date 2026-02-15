import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, useInView } from "framer-motion";
import { 
  CreditCard, Link2, Banknote, Music, ShieldCheck, FileText,
  ChevronRight, Coins, BarChart3
} from "lucide-react";

const MODULES = [
  {
    title: "N.U.P.S. Point-of-Sale",
    subtitle: "Nexus Universal Point-of-Sale System",
    description: "Full-stack POS built for entertainment venues. Cash register, batch management, VIP contracts, entertainer check-in, Z-reports, and real-time floor operations.",
    features: ["Multi-payment processing", "VIP contract signing", "Real-time floor view", "Dream Dollar integration"],
    icon: CreditCard,
    link: "NUPSLogin",
    cta: "Launch NUPS",
    badge: "Venue Login Required",
    color: "emerald"
  },
  {
    title: "Club Currency Press",
    subtitle: "Dream Dollar Printing System",
    description: "Custom currency generation for venues. Print secure vouchers with barcodes, serial numbers, and anti-counterfeiting measures. Integrated with NUPS contracts.",
    features: ["Voucher sheet press", "Barcode & serial system", "30% surcharge calc", "Contract integration"],
    icon: Banknote,
    link: "ClubCurrencyPress",
    cta: "Open Press",
    color: "yellow"
  },
  {
    title: "Blockchain Verification",
    subtitle: "On-Chain Proof & Analysis",
    description: "Hash generation, Merkle tree construction, block mining simulation, and cryptographic verification tools for digital asset integrity.",
    features: ["SHA-256 hash generator", "Merkle tree builder", "Block mining demo", "Proof export & verify"],
    icon: Link2,
    link: "Blockchain",
    cta: "Verify On-Chain",
    color: "purple"
  },
  {
    title: "Crypto & Security Tools",
    subtitle: "Cryptographic Operations Suite",
    description: "QR-based cryptographic operations, steganographic encoding, and security scanning for financial systems and digital assets.",
    features: ["QR crypto encoding", "Steganographic payloads", "Security scanning", "Threat detection"],
    icon: ShieldCheck,
    link: "SecurityTools",
    cta: "Open Tools",
    color: "cyan"
  },
  {
    title: "DJ Pro Mixer",
    subtitle: "Entertainment Venue Audio System",
    description: "Professional audio mixing for entertainment venues. AI-powered playlist generation, crossfading, BPM matching, and live performance tools.",
    features: ["AI playlist generation", "Dual deck mixing", "BPM sync & crossfade", "Venue audio management"],
    icon: Music,
    link: "GlyphBotMixer",
    cta: "Open Mixer",
    color: "rose"
  },
  {
    title: "Dream Palace Contracts",
    subtitle: "Digital Sales & Order Receipts",
    description: "Full digital contract system for venue sales. Customer info, line items, Dream Dollar calculations, biometric signatures, and printable receipts.",
    features: ["6-step signing flow", "Biometric capture", "Staff counter-sign", "Print & archive"],
    icon: FileText,
    link: "NUPSLogin",
    cta: "Access Contracts",
    badge: "Inside NUPS",
    color: "amber"
  },
];

const COLOR_MAP = {
  emerald: { card: "border-emerald-500/20 hover:border-emerald-400/50", icon: "from-emerald-500 to-emerald-600", text: "text-emerald-400", glow: "hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]" },
  yellow:  { card: "border-yellow-500/20 hover:border-yellow-400/50", icon: "from-yellow-500 to-amber-600", text: "text-yellow-400", glow: "hover:shadow-[0_0_40px_rgba(234,179,8,0.15)]" },
  purple:  { card: "border-purple-500/20 hover:border-purple-400/50", icon: "from-purple-500 to-purple-600", text: "text-purple-400", glow: "hover:shadow-[0_0_40px_rgba(168,85,247,0.15)]" },
  cyan:    { card: "border-cyan-500/20 hover:border-cyan-400/50", icon: "from-cyan-500 to-cyan-600", text: "text-cyan-400", glow: "hover:shadow-[0_0_40px_rgba(6,182,212,0.15)]" },
  rose:    { card: "border-rose-500/20 hover:border-rose-400/50", icon: "from-rose-500 to-rose-600", text: "text-rose-400", glow: "hover:shadow-[0_0_40px_rgba(244,63,94,0.15)]" },
  amber:   { card: "border-amber-500/20 hover:border-amber-400/50", icon: "from-amber-500 to-amber-600", text: "text-amber-400", glow: "hover:shadow-[0_0_40px_rgba(245,158,11,0.15)]" },
};

function ModuleCard({ mod, index, inView }) {
  const c = COLOR_MAP[mod.color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.08 * index, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link to={createPageUrl(mod.link)} className="block h-full">
        <div className={`group h-full rounded-2xl border-2 ${c.card} ${c.glow} bg-white/[0.03] backdrop-blur-xl p-5 sm:p-6 transition-all duration-500 cursor-pointer hover:bg-white/[0.06] hover:-translate-y-1`}>
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.icon} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <mod.icon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight group-hover:text-emerald-300 transition-colors">{mod.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{mod.subtitle}</p>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">{mod.description}</p>
          <ul className="space-y-1.5 mb-5">
            {mod.features.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
                <span className={`w-1 h-1 rounded-full bg-gradient-to-r ${c.icon} flex-shrink-0`} />
                {f}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.06]">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${c.text} group-hover:translate-x-0.5 transition-transform`}>
              {mod.cta}
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
            {mod.badge && (
              <span className="text-[10px] text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">{mod.badge}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function FinancialModules() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section ref={ref} className="py-16 md:py-24" style={{ background: 'transparent' }}>
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-bold uppercase tracking-widest mb-4"
          >
            <Coins className="w-3.5 h-3.5" />
            Financial Technology Suite
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold text-white mb-3"
          >
            Our <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">Modules</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-slate-400 max-w-xl mx-auto"
          >
            Every tool is built in-house, bootstrapped, and owned by GlyphLock Financial LLC.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {MODULES.map((mod, i) => (
            <ModuleCard key={i} mod={mod} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}