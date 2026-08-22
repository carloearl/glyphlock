import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Image, Network, ShieldCheck } from "lucide-react";
import { scenarios } from "@/content/about/aboutContent";

const icons = { venue: Building2, creative: Image, enterprise: Network };

export default function ScenarioFlowExplorer() {
  const [activeId, setActiveId] = useState(scenarios[0].id);
  const active = scenarios.find((scenario) => scenario.id === activeId) || scenarios[0];

  return (
    <section id="scenarios" className="relative border-y border-white/10 bg-[#05070b] px-5 py-24 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Three real handoffs</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Follow the record, not the feature list.</h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Each scenario passes through different products, but the operating pattern stays consistent:
            identify the context, authorize the action, execute the work, preserve the record, reconcile the result, and verify the history.
          </p>
        </div>

        <div className="mt-10 grid gap-3 md:grid-cols-3" role="tablist" aria-label="Scenario flows">
          {scenarios.map((scenario) => {
            const Icon = icons[scenario.id] || Network;
            const selected = scenario.id === active.id;
            return (
              <button
                key={scenario.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveId(scenario.id)}
                className="group rounded-2xl border p-5 text-left transition"
                style={{
                  borderColor: selected ? scenario.color : "rgba(255,255,255,.1)",
                  background: selected ? `${scenario.color}12` : "rgba(255,255,255,.025)",
                }}
              >
                <Icon className="h-5 w-5" style={{ color: scenario.color }} />
                <span className="mt-4 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{scenario.label}</span>
                <span className="mt-2 block text-lg font-bold text-white">{scenario.title}</span>
              </button>
            );
          })}
        </div>

        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-[#090d14]"
        >
          <div className="flex flex-col gap-3 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: active.color }}>{active.label}</p>
              <h3 className="mt-1 text-2xl font-black text-white">{active.title}</h3>
            </div>
            <div className="inline-flex items-center gap-2 text-sm text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Evidence context survives each handoff
            </div>
          </div>

          <div className="grid gap-px bg-white/10 lg:grid-cols-3">
            {active.steps.map((step, index) => (
              <article key={step.label} className="relative bg-[#090d14] p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-500">0{index + 1}</span>
                  {index < active.steps.length - 1 && <ArrowRight className="h-4 w-4 text-slate-600" />}
                </div>
                <h4 className="mt-5 text-xl font-bold text-white">{step.label}</h4>
                <dl className="mt-5 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Actor</dt>
                    <dd className="mt-1 text-slate-200">{step.actor}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">System</dt>
                    <dd className="mt-1 text-slate-200">{step.system}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Record</dt>
                    <dd className="mt-1 font-mono text-xs" style={{ color: active.color }}>{step.record}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
