import React from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  Bot,
  Braces,
  Building2,
  FileCheck2,
  Fingerprint,
  Image as ImageIcon,
  Radio,
  ShieldCheck,
} from "lucide-react";

const systemFlow = [
  { label: "Subject or asset", note: "Identity · image · device", icon: Fingerprint, color: "#00E4FF" },
  { label: "Permission", note: "Role · scope · approval", icon: ShieldCheck, color: "#8C4BFF" },
  { label: "Workflow", note: "Create · operate · connect", icon: Building2, color: "#34D399" },
  { label: "Record", note: "Agreement · event · reference", icon: FileCheck2, color: "#FBBF24" },
  { label: "Verification", note: "Reconcile · audit · review", icon: BadgeCheck, color: "#A7F3D0" },
];

const proofMarkers = [
  { label: "91 Secure QR payload definitions", status: "Implemented", icon: ImageIcon, color: "#00E4FF" },
  { label: "Hardware-tested NUPS workflows", status: "Operational proof", icon: Building2, color: "#34D399" },
  { label: "Automated DJ + Fable visuals", status: "Active development", icon: Radio, color: "#F5B942" },
  { label: "SDK · API · webhook · OHIP surfaces", status: "Integration work", icon: Braces, color: "#C084FC" },
];

export default function AboutHero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-white/10 pt-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(0,228,255,0.14),transparent_28%),radial-gradient(circle_at_88%_24%,rgba(140,75,255,0.16),transparent_30%),linear-gradient(to_bottom,#020407,#050912_62%,#020407)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.09] [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="container relative z-10 mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:pb-20">
        <div className="grid items-center gap-10 py-12 lg:grid-cols-[0.88fr_1.12fr] lg:gap-14 lg:py-16">
          <div>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-[#00E4FF]/25 bg-[#00E4FF]/[0.07] px-4 py-2"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#00E4FF]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9AF4FF]">
                GlyphLock LLC · Evidence infrastructure · El Mirage, Arizona
              </span>
            </motion.div>

            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06, duration: 0.6 }}
              className="mt-7 max-w-3xl text-5xl font-black leading-[0.94] tracking-[-0.055em] text-white sm:text-6xl lg:text-[4.5rem] font-space"
            >
              Identity. Permission.{" "}
              <span className="bg-gradient-to-r from-[#00E4FF] via-white to-[#B78CFF] bg-clip-text text-transparent">
                Operations. Proof.
              </span>
            </motion.h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.13, duration: 0.6 }}
              className="mt-7 max-w-2xl text-lg leading-relaxed text-slate-300"
            >
              GlyphLock connects machine-readable media, human authorization, venue workflows,
              automated intelligence, closed-loop value, and enterprise integrations to records
              authorized people can reconstruct.
            </motion.p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-500">
              <strong className="text-white">NUPS is GlyphLock&apos;s first real operating proof</strong>
              —but it is only one part of the wider system.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#architecture"
                className="group inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 font-black text-black transition hover:bg-[#DDFBFF] focus:outline-none focus:ring-2 focus:ring-[#00E4FF] focus:ring-offset-2 focus:ring-offset-black"
              >
                Explore the architecture
                <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
              </a>
              <Link
                to="/NUPSLanding"
                className="group inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#34D399]/35 bg-[#34D399]/10 px-5 py-3 font-black text-white transition hover:bg-[#34D399]/15 focus:outline-none focus:ring-2 focus:ring-[#34D399]"
              >
                See NUPS in operation
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#technology-record"
                className="inline-flex min-h-12 items-center rounded-xl border border-white/12 bg-white/[0.035] px-5 py-3 font-bold text-slate-200 transition hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-white"
              >
                Technology record
              </a>
              <Link
                to="/Consultation"
                className="inline-flex min-h-12 items-center gap-2 px-2 py-3 text-sm font-bold text-slate-400 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-[#00E4FF]"
              >
                Discuss an integration <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.75 }}
            className="relative"
          >
            <div className="absolute -inset-px rounded-[2rem] bg-gradient-to-br from-[#00E4FF]/40 via-white/10 to-[#8C4BFF]/35 opacity-70" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#05080e]/95 p-5 shadow-[0_40px_120px_rgba(0,0,0,.55)] sm:p-7">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8EEBFF]">
                    The connected record
                  </p>
                  <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">
                    Context survives every handoff.
                  </h2>
                </div>
                <Bot className="h-6 w-6 shrink-0 text-[#B78CFF]" />
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-5">
                {systemFlow.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="relative">
                      <div className="h-full rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-center">
                        <span
                          className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/55"
                          style={{ color: item.color }}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <p className="mt-3 text-xs font-black text-white">{item.label}</p>
                        <p className="mt-1 text-[9px] leading-relaxed text-slate-500">{item.note}</p>
                      </div>
                      {index < systemFlow.length - 1 ? (
                        <ArrowRight className="absolute -right-2.5 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-slate-600 sm:block" />
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {proofMarkers.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/35 p-4">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: item.color }} />
                      <div>
                        <p className="text-xs font-bold text-white">{item.label}</p>
                        <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: item.color }}>
                          {item.status}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
