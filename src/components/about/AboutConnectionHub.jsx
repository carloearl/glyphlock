import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Building2,
  Braces,
  Check,
  Image as ImageIcon,
} from "lucide-react";

const PATHWAYS = [
  {
    icon: ImageIcon,
    label: "Images + QR",
    prompt: "Protect, activate, or verify creative work",
    title: "Start with the carrier",
    body: "Explore concealed-image data experiments, interactive hotspots, provenance context, and a Secure QR catalog containing 91 payload structures.",
    cta: "Explore image technology",
    to: "/ImageLab",
    accent: "#00E4FF",
  },
  {
    icon: Bot,
    label: "GlyphBot",
    prompt: "Build, inspect, or audit a digital system",
    title: "Start with assisted intelligence",
    body: "Use GlyphBot surfaces for guided construction, site building, system inspection, security audits, and human-approved workflows.",
    cta: "Meet GlyphBot",
    to: "/GlyphBot",
    accent: "#B78CFF",
  },
  {
    icon: Building2,
    label: "Operations",
    prompt: "Connect the work of a real venue",
    title: "Start with NUPS",
    body: "See identity, roles, contracts, registers, closed-loop value, payouts, reconciliation, and audit evidence work inside one venue boundary.",
    cta: "Explore NUPS",
    to: "/NUPSLanding",
    accent: "#7DE2B8",
  },
  {
    icon: Braces,
    label: "Integration",
    prompt: "Connect an enterprise workflow",
    title: "Start with interoperability",
    body: "Map authorized payment references, hospitality systems, storage, analytics, hardware, APIs, and governance without erasing provider responsibility.",
    cta: "Review integration paths",
    to: "/SDKDocs",
    accent: "#F4C76B",
  },
];

export default function AboutConnectionHub() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const selected = PATHWAYS[active];
  const SelectedIcon = selected.icon;

  return (
    <aside
      aria-label="Choose where to enter the GlyphLock ecosystem"
      className="relative mx-auto w-full max-w-[35rem]"
    >
      <div className="absolute -inset-px rounded-[2rem] bg-gradient-to-b from-white/20 via-[#00E4FF]/10 to-transparent opacity-70" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070A0F]/95 p-5 shadow-[0_35px_100px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-6">
        <div className="flex items-start justify-between gap-5 border-b border-white/10 pb-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8EEBFF]">
              Find your entry point
            </p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
              What needs to become verifiable?
            </h2>
          </div>
          <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
            Interactive
          </span>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {PATHWAYS.map((pathway, index) => {
            const Icon = pathway.icon;
            const isActive = index === active;
            return (
              <button
                key={pathway.label}
                type="button"
                onClick={() => setActive(index)}
                onMouseEnter={() => setActive(index)}
                aria-pressed={isActive}
                className={
                  "group flex min-h-[5.25rem] items-start gap-3 rounded-2xl border p-3.5 text-left transition focus:outline-none focus:ring-2 focus:ring-[#00E4FF] " +
                  (isActive
                    ? "border-white/25 bg-white/[0.07]"
                    : "border-white/[0.08] bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.045]")
                }
              >
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/60"
                  style={{ color: pathway.accent }}
                >
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-xs font-black text-white">{pathway.label}</span>
                  <span className="mt-1 block text-[10px] leading-relaxed text-slate-500">
                    {pathway.prompt}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <motion.div
          key={selected.label}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="mt-4 rounded-2xl border border-white/10 bg-black/45 p-5"
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035]"
              style={{ color: selected.accent }}
            >
              <SelectedIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                Recommended path
              </p>
              <h3 className="mt-1 text-base font-black text-white">{selected.title}</h3>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-400 sm:text-sm">{selected.body}</p>
          <Link
            to={selected.to}
            className="group mt-5 flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-black text-black transition hover:bg-[#DDFBFF] focus:outline-none focus:ring-2 focus:ring-[#00E4FF] focus:ring-offset-2 focus:ring-offset-black"
          >
            {selected.cta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </motion.div>

        <div className="mt-4 grid grid-cols-4 gap-1.5" aria-label="GlyphLock evidence sequence">
          {["Identify", "Permit", "Record", "Verify"].map((label, index) => (
            <div key={label} className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-2 py-2 text-center">
              <Check className="mx-auto h-3 w-3 text-[#7DE2B8]" aria-hidden="true" />
              <span className="mt-1 block text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
                {index + 1}. {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
