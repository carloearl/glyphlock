import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Image as ImageIcon, ScanLine } from "lucide-react";
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

export default function AboutOrigin() {
  return (
    <section id="origin" className="scroll-mt-32 py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.68fr_1.32fr] lg:items-start">
          <div className="lg:sticky lg:top-32">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8C4BFF]/25 bg-[#8C4BFF]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#C9A7FF]">
              <ImageIcon className="h-3.5 w-3.5" /> The origin
            </div>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.04em] text-white md:text-5xl font-space">
              It started with an image. The problem grew larger.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-300">
              GlyphLock did not begin as venue software. It began with a question about whether a
              digital object could retain machine-readable identity and history. Real operations
              revealed that people, agreements, transactions, and external systems needed the same continuity.
            </p>
            <Link
              to="/AboutCarlo"
              className="group mt-7 inline-flex items-center gap-2 font-black text-[#B78CFF] focus:outline-none focus:ring-2 focus:ring-[#B78CFF]"
            >
              Read the founder story
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="relative">
            <div className="absolute bottom-7 left-6 top-7 w-px bg-gradient-to-b from-[#8C4BFF]/65 via-[#00E4FF]/50 to-[#34D399]/45 sm:left-8" />
            <div className="space-y-3">
              {originTimeline.map((event, index) => (
                <motion.article
                  key={event.title}
                  initial={{ opacity: 0, x: 18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: index * 0.035, duration: 0.45 }}
                  className="relative ml-12 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:ml-16 sm:p-6"
                >
                  <span className="absolute -left-[2.12rem] top-6 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-[#05080e] sm:-left-[3rem]">
                    {index < 4 ? <ImageIcon className="h-3.5 w-3.5 text-[#B78CFF]" /> : <ScanLine className="h-3.5 w-3.5 text-[#34D399]" />}
                  </span>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8EEBFF]">{event.year}</p>
                  <h3 className="mt-2 text-xl font-black text-white">{event.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{event.body}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
