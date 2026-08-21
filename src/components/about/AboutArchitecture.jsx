import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Braces,
  Building2,
  CircleDollarSign,
  Database,
  Fingerprint,
  Image as ImageIcon,
  LockKeyhole,
  Radio,
  ShieldCheck,
} from "lucide-react";
import { domains, lifecycle } from "@/content/about/aboutContent";

const iconMap = {
  identity: Fingerprint,
  media: ImageIcon,
  intelligence: Radio,
  operations: Building2,
  value: CircleDollarSign,
  integration: Braces,
};

export default function AboutArchitecture() {
  const [activeId, setActiveId] = useState("operations");
  const active = domains.find((domain) => domain.id === activeId) || domains[0];
  const ActiveIcon = iconMap[active.id];

  return (
    <section id="architecture" className="scroll-mt-32 border-y border-white/10 bg-[#03060b] py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#00E4FF]">Canonical system model</p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] text-white md:text-6xl font-space">
            One core. Six working domains. One trust envelope.
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-slate-300">
            Evidence is the center—not another product tile. Trust, governance, and security surround the
            whole system. The six domains do the work and exchange connected records.
          </p>
        </div>

        <div className="mt-12 rounded-[2rem] border border-[#B78CFF]/25 bg-gradient-to-br from-[#080d17] via-[#04070c] to-[#12091c] p-4 shadow-[0_40px_120px_rgba(0,0,0,.45)] sm:p-7">
          <div className="flex flex-col gap-4 rounded-[1.5rem] border border-[#B78CFF]/25 bg-[#B78CFF]/[0.035] p-4 sm:p-6">
            <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#B78CFF]/25 bg-[#B78CFF]/10 text-[#C9A7FF]">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#C9A7FF]">Surrounding envelope</p>
                  <h3 className="mt-1 font-black text-white">Trust · Governance · Security</h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[9px] font-bold text-slate-400">
                {["RBAC", "Venue scope", "Mode isolation", "Human approval", "Privacy", "Auditability"].map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-black/35 px-2.5 py-1.5">{item}</span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
              <div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                  {domains.map((domain) => {
                    const Icon = iconMap[domain.id];
                    const selected = domain.id === activeId;
                    return (
                      <button
                        id={"domain-" + domain.id}
                        key={domain.id}
                        type="button"
                        onClick={() => setActiveId(domain.id)}
                        aria-pressed={selected}
                        className={
                          "group rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-[#00E4FF] " +
                          (selected ? "border-white/25 bg-white/[0.085]" : "border-white/[0.08] bg-black/25 hover:border-white/15 hover:bg-white/[0.04]")
                        }
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/50" style={{ color: domain.color }}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="font-mono text-[9px] font-black text-slate-600">{domain.number}</span>
                        </div>
                        <p className="mt-4 text-sm font-black text-white">{domain.label}</p>
                        <p className="mt-1 text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: domain.color }}>{domain.maturity}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-2xl border border-[#00E4FF]/25 bg-[#00E4FF]/[0.045] p-5">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-[#00E4FF]" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#8EEBFF]">Evidence & provenance core</p>
                      <p className="mt-1 text-sm font-black text-white">The connected record survives the handoff.</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-400">
                    Identity · authority · agreements · transactions · approvals · provenance · seals · audit · reports
                  </p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.article
                  key={active.id}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl border border-white/10 bg-black/45 p-5 sm:p-7"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]" style={{ color: active.color }}>
                        <ActiveIcon className="h-6 w-6" />
                      </span>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Operating domain {active.number}</p>
                        <h3 className="mt-1 text-2xl font-black text-white">{active.label}</h3>
                      </div>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em]" style={{ color: active.color }}>
                      {active.maturity}
                    </span>
                  </div>

                  <p className="mt-6 leading-relaxed text-slate-300">{active.problem}</p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <InfoList title="What enters" items={active.inputs} color="#8EEBFF" />
                    <InfoList title="What GlyphLock does" items={active.actions} color={active.color} />
                    <InfoList title="What remains" items={active.records} color="#F4C76B" />
                    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">Next handoff</p>
                      <p className="mt-3 text-xs leading-relaxed text-slate-400">{active.handoff}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {active.modules.map((module) => (
                      <span key={module} className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[10px] font-semibold text-slate-300">{module}</span>
                    ))}
                  </div>

                  <p className="mt-5 text-xs leading-relaxed text-slate-500">{active.statusNote}</p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {active.links.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className="group inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/12 bg-white/[0.035] px-4 py-2 text-xs font-black text-white transition hover:bg-white/[0.075] focus:outline-none focus:ring-2 focus:ring-[#00E4FF]"
                      >
                        {link.label}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    ))}
                  </div>
                </motion.article>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <LockKeyhole className="h-4 w-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">One operating lifecycle across every domain</p>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            {lifecycle.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <span className="font-mono text-[9px] font-black text-[#00E4FF]">{item.step}</span>
                <h4 className="mt-3 font-black text-white">{item.label}</h4>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoList({ title, items, color }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color }}>{title}</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-xs leading-relaxed text-slate-400">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
