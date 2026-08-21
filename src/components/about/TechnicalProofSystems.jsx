import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Braces,
  CheckCircle2,
  Image as ImageIcon,
  QrCode,
  Radio,
} from "lucide-react";
import { technicalSystems } from "@/content/about/aboutContent";

const iconMap = {
  "auto-dj": Radio,
  stego: ImageIcon,
  "secure-qr": QrCode,
  "developer-rail": Braces,
};

export default function TechnicalProofSystems() {
  return (
    <section id="technical-systems" className="scroll-mt-32 py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#B78CFF]">Technical proof systems</p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] text-white md:text-6xl font-space">
            The engines behind the ecosystem—not just their names.
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-slate-300">
            These systems show how creative input, venue activity, automation, machine-readable carriers,
            and external software become connected, reviewable records.
          </p>
        </div>

        <div className="mt-14 space-y-6">
          {technicalSystems.map((system, index) => {
            const Icon = iconMap[system.id];
            return (
              <motion.article
                key={system.id}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.16 }}
                transition={{ duration: 0.55 }}
                className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent"
              >
                <div className={"grid gap-0 lg:grid-cols-2 " + (index % 2 ? "lg:[&>*:first-child]:order-2" : "")}>
                  <div className="p-6 sm:p-8 lg:p-10">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/50" style={{ color: system.color }}>
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em]" style={{ color: system.color }}>
                        {system.maturity}
                      </span>
                    </div>
                    <p className="mt-7 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: system.color }}>{system.eyebrow}</p>
                    <h3 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">{system.title}</h3>
                    <p className="mt-5 leading-relaxed text-slate-300">{system.summary}</p>

                    <div className="mt-6 rounded-xl border border-white/10 bg-black/35 p-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Maturity note</p>
                      <p className="mt-2 text-sm leading-relaxed text-white">{system.statusNote}</p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {system.links.map((link) => (
                        <Link
                          key={link.to}
                          to={link.to}
                          className="group inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-black text-white transition hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#00E4FF]"
                        >
                          {link.label}
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/10 bg-black/30 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8EEBFF]">How it moves</p>
                    <div className="mt-5 space-y-2">
                      {system.flow.map((step, stepIndex) => (
                        <div key={step} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/50 font-mono text-[9px] font-black" style={{ color: system.color }}>
                            {String(stepIndex + 1).padStart(2, "0")}
                          </span>
                          <span className="pt-1 text-xs leading-relaxed text-slate-300">{step}</span>
                        </div>
                      ))}
                    </div>

                    <p className="mt-7 text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">Implementation evidence</p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {system.proof.map((item) => (
                        <div key={item} className="flex gap-2 rounded-xl border border-white/10 bg-black/30 p-3 text-xs leading-relaxed text-slate-400">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: system.color }} />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
