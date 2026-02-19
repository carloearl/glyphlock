import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Shield, DollarSign, Zap } from "lucide-react";

const SHIELD_LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/5e2e34bf7_b70d54f1-3b3b-418e-ac6f-c4ecad013f91.png";
const GL_COIN_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/b001ff48e_ChatGPTImageFeb6202606_25_17PM.png";

export default function FinancialFooterCTA() {
  return (
    <section className="py-16 md:py-24" style={{ background: 'transparent' }}>
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="relative rounded-3xl overflow-hidden border-2 border-emerald-500/30 p-8 md:p-14 text-center">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/80 via-black/90 to-green-950/80" />
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(16,185,129,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16,185,129,0.06) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }} />
          <motion.div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.8), transparent)' }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <img src={SHIELD_LOGO_URL} alt="GlyphLock Financial" className="w-20 h-20 object-contain drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]" />
                <img src={GL_COIN_URL} alt="GL Coin" className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full object-cover border-2 border-emerald-500/40 shadow-[0_0_12px_rgba(255,215,0,0.4)]" />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-400 uppercase tracking-widest font-bold">Separate Legal Entity</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              GlyphLock Financial <span className="text-emerald-400">LLC</span>
            </h2>

            <p className="text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
              GlyphLock Financial is a separate limited liability company operating within the GlyphLock ecosystem. 
              All financial products, POS systems, club currency operations, and blockchain tools are 
              developed and maintained under this entity. Bootstrapped. No outside investors. Full ownership.
            </p>

            <div className="flex flex-wrap gap-4 justify-center mb-8">
              {[
                { label: "POS Revenue Processing", icon: DollarSign },
                { label: "Club Currency Issuance", icon: Zap },
                { label: "Blockchain Verification", icon: Shield },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-semibold">
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <Link to={createPageUrl("NUPSLogin")}>
                <Button className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white px-8 py-5 text-base font-bold">
                  Access NUPS
                </Button>
              </Link>
              <Link to={createPageUrl("Consultation")}>
                <Button variant="outline" className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 px-8 py-5 text-base font-bold">
                  Get a Consultation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}