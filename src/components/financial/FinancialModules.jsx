import React from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, Blocks, Banknote, Music, 
  ArrowRight, Shield, FileSignature, Users
} from "lucide-react";

const MODULES = [
  {
    id: "nups",
    title: "N.U.P.S.",
    subtitle: "Nexus Universal Point-of-Sale",
    description: "Full-stack POS system with multi-payment processing, real-time inventory, batch management, Z-reports, staff time clocks, and VIP contract management. Built for hospitality and entertainment venues.",
    icon: ShoppingCart,
    color: "from-purple-500 to-blue-600",
    borderColor: "border-purple-500/30",
    glowColor: "rgba(168,85,247,0.3)",
    badge: "ENTERPRISE",
    page: "NUPSLogin",
    features: ["Cash Register", "Inventory", "VIP Contracts", "Time Clock", "Z-Reports", "Dream Palace Orders"]
  },
  {
    id: "blockchain",
    title: "Blockchain Suite",
    subtitle: "Cryptographic Verification Engine",
    description: "Enterprise-grade hashing (SHA-256/512), Merkle tree generation, proof-of-work block mining, hash integrity verification, and exportable proof bundles for audit compliance.",
    icon: Blocks,
    color: "from-blue-500 to-cyan-600",
    borderColor: "border-blue-500/30",
    glowColor: "rgba(59,130,246,0.3)",
    badge: "SECURITY",
    page: "Blockchain",
    features: ["SHA-256/512 Hashing", "Merkle Trees", "Block Mining", "Proof Export", "Integrity Verify"]
  },
  {
    id: "currency",
    title: "Club Currency Press",
    subtitle: "Dream Dollar Issuance System",
    description: "Design, print, and track club currency (Dream Dollars) with built-in barcodes, serial numbers, contract terminals, and AI-powered configuration. Integrated with Dream Palace Sales Orders.",
    icon: Banknote,
    color: "from-green-500 to-emerald-600",
    borderColor: "border-green-500/30",
    glowColor: "rgba(34,197,94,0.3)",
    badge: "CURRENCY",
    page: "ClubCurrencyPress",
    features: ["Voucher Sheets", "Barcode Serials", "Contract Terminal", "AI Config", "Archive System"]
  },
  {
    id: "mixer",
    title: "DJ Pro Mixer",
    subtitle: "Entertainment Audio Engine",
    description: "Professional dual-deck DJ mixing console with crossfader, BPM sync, AI playlist generation, song library management, and live performance controls for entertainment venues.",
    icon: Music,
    color: "from-pink-500 to-rose-600",
    borderColor: "border-pink-500/30",
    glowColor: "rgba(236,72,153,0.3)",
    badge: "ENTERTAINMENT",
    page: "GlyphBotMixer",
    features: ["Dual Decks", "Crossfader", "AI Playlists", "BPM Sync", "Song Library"]
  }
];

export default function FinancialModules() {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section ref={ref} className="py-16 md:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold mb-3"
          >
            <span className="text-white">Financial </span>
            <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">Ecosystem</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-xl mx-auto"
          >
            Four integrated modules powering commerce, security, currency, and entertainment.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MODULES.map((mod, i) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 * i }}
            >
              <Card className={`bg-gray-900/60 backdrop-blur-xl ${mod.borderColor} border-2 hover:shadow-[0_0_40px_${mod.glowColor}] transition-all duration-500 group h-full`}>
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center shadow-lg`}>
                      <mod.icon className="w-6 h-6 text-white" />
                    </div>
                    <Badge className={`bg-white/5 ${mod.borderColor} text-gray-400 text-[10px]`}>
                      {mod.badge}
                    </Badge>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-0.5">{mod.title}</h3>
                  <p className="text-xs text-gray-500 mb-3">{mod.subtitle}</p>
                  <p className="text-sm text-gray-400 leading-relaxed mb-4 flex-1">{mod.description}</p>

                  {/* Feature pills */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {mod.features.map((f, j) => (
                      <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
                        {f}
                      </span>
                    ))}
                  </div>

                  <Link to={createPageUrl(mod.page)}>
                    <Button className={`w-full bg-gradient-to-r ${mod.color} text-white font-semibold h-11 rounded-xl group-hover:shadow-lg transition-all`}>
                      Launch Module <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* LLC Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 bg-green-500/5 border border-green-500/20 rounded-xl px-6 py-3">
            <Shield className="w-4 h-4 text-green-400" />
            <p className="text-xs text-gray-400">
              <span className="text-green-400 font-semibold">GlyphLock Financial, LLC</span> — A separate legal entity within the GlyphLock ecosystem. 
              All financial operations, POS transactions, and currency issuance are managed under this entity.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}