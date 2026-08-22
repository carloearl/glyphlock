import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Binary, Building2, Image as ImageIcon, MousePointer2, Network, QrCode, ScanLine, Workflow } from "lucide-react";
import { originTimeline, proofStrip } from "@/content/about/aboutContent";

export function ProofStrip() {
  return (
    <section aria-label="GlyphLock proof overview" className="border-y border-white/10 bg-[#03060a]">
      <div className="container mx-auto grid max-w-7xl gap-px bg-white/10 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-6">
        {proofStrip.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="group bg-[#03060a] px-4 py-5 transition hover:bg-white/[0.035] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#00E4FF]"
          >
            <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: item.color }}>{item.label}</p>
            <p className="mt-2 text-sm font-black text-white">{item.value}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{item.note}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

const originIcons = [ImageIcon, Binary, MousePointer2, QrCode, Building2, Workflow, Network];

export default function AboutOrigin() {
  return (
    <section id="origin" className="relative scroll-mt-32 overflow-hidden border-b border-white/10 py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(140,75,255,.11),transparent_30%),radial-gradient(circle_at_50%_92%,rgba(0,228,255,.07),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.22)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6">
        <header className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#8C4BFF]/25 bg-[#8C4BFF]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#C9A7FF]">
            <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" /> The origin
          </div>
          <h2 className="mt-6 text-4xl font-black leading-tight tracking-[-0.04em] text-white md:text-6xl font-space">
            It started with an image. The problem grew larger.
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            GlyphLock began in May 2025 with a practical carrier question: could a digital object keep
            machine-readable identity, permission, destination, and history attached to the work itself?
            When the same loss of continuity appeared across venue identity, agreements, transactions,
            stored value, external providers, and management reports, the experiment became a broader
            evidence architecture.
          </p>
          <Link
            to="/AboutCarlo"
            className="group mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#8C4BFF]/30 bg-[#8C4BFF]/10 px-5 py-3 font-black text-[#D9C3FF] transition hover:border-[#B78CFF]/60 hover:bg-[#8C4BFF]/15 focus:outline-none focus:ring-2 focus:ring-[#B78CFF]"
          >
            Read the founder story
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </header>

        <div className="mx-auto mt-12 flex max-w-4xl items-center justify-center gap-3 text-center">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#8C4BFF]/55" />
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
            Creative carrier <span className="mx-2 text-[#8C4BFF]">→</span> operating proof <span className="mx-2 text-[#34D399]">→</span> connected ecosystem
          </p>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#00E4FF]/55" />
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {originTimeline.map((event, index) => {
            const Icon = originIcons[index] || ScanLine;
            const isFinal = index === originTimeline.length - 1;

            return (
              <motion.article
                key={event.number}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.16 }}
                transition={{ delay: (index % 2) * 0.06, duration: 0.5 }}
                className={
                  "relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#070b12]/90 p-5 shadow-[0_22px_70px_rgba(0,0,0,.22)] sm:p-7 " +
                  (isFinal ? "md:col-span-2" : "")
                }
              >
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${event.color}, transparent)` }} />
                <div className={isFinal ? "mx-auto max-w-5xl" : ""}>
                  <div className="flex items-start justify-between gap-5">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/45"
                        style={{ color: event.color }}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="font-mono text-[10px] font-black" style={{ color: event.color }}>{event.number}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{event.year}</p>
                      </div>
                    </div>
                    <span
                      className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-right text-[9px] font-black uppercase tracking-[0.14em]"
                      style={{ color: event.color }}
                    >
                      {event.phase}
                    </span>
                  </div>

                  <h3 className="mt-6 text-2xl font-black leading-tight tracking-[-0.025em] text-white sm:text-3xl">{event.title}</h3>
                  <p className="mt-4 text-[15px] leading-7 text-slate-300">{event.body}</p>

                  <div className="mt-6 grid gap-3 xl:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: event.color }}>What GlyphLock built or tested</p>
                      <p className="mt-3 text-sm leading-6 text-slate-400">{event.work}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#8EEBFF]">What remains connected</p>
                      <p className="mt-3 text-sm leading-6 text-slate-400">{event.record}</p>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        <div className="mx-auto mt-8 grid max-w-5xl gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
          {[
            ["The starting point", "A visible or physical object"],
            ["The missing relationship", "Identity · permission · action"],
            ["The GlyphLock result", "A record authorized people can reconstruct"],
          ].map(([label, value]) => (
            <div key={label} className="bg-[#05080e] px-5 py-5 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">{label}</p>
              <p className="mt-2 text-sm font-black text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
