import React from "react";

const STATUS = {
  live: { label: "Live workflow", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40" },
  evaluation: { label: "Controlled evaluation", cls: "bg-cyan-500/15 text-cyan-300 border-cyan-400/40" },
  development: { label: "In development", cls: "bg-blue-500/15 text-blue-300 border-blue-400/40" },
  partner: { label: "Partner-dependent", cls: "bg-amber-500/15 text-amber-300 border-amber-400/40" },
  roadmap: { label: "Roadmap", cls: "bg-white/10 text-white/60 border-white/20" }
};

const LEGEND = [
  ["live", "Used in an actual venue environment"],
  ["evaluation", "Working but still being tested or hardened"],
  ["development", "Actively being built"],
  ["partner", "Requires processor, acquirer, Oracle, or customer authorization"],
  ["roadmap", "Future intended capability"]
];

const LAYERS = [
  {
    layer: "Layer 1 — Venue workflows",
    items: [
      ["Front-door check-in and cover collection", "live"],
      ["Entertainer credentialing and shift check-in", "live"],
      ["Driver onboarding and per-guest payout tracking", "live"],
      ["Bar register and product sales", "evaluation"],
      ["VIP room contracts and session timing", "evaluation"]
    ]
  },
  {
    layer: "Layer 2 — NUPS core (Nexus Unified POS System)",
    items: [
      ["Role-based operator kiosk and session control", "live"],
      ["Transaction, batch, and nightly settlement engine", "live"],
      ["Rate and receipt configuration per venue", "live"],
      ["Offline-tolerant register behavior", "development"]
    ]
  },
  {
    layer: "Layer 3 — Evidence and accounting",
    items: [
      ["Activity and audit event recording", "live"],
      ["Receipt fingerprinting for later verification", "evaluation"],
      ["Double-entry ledger postings and trial balance", "evaluation"],
      ["Accounting export to external bookkeeping", "development"],
      ["External anchoring of evidence records", "development"]
    ]
  },
  {
    layer: "Layer 4 — External integrations",
    items: [
      ["Card processing through the venue's own processor", "partner"],
      ["Automated payout disbursement and split routing", "roadmap"],
      ["Oracle partner and OHIP integration path", "partner"],
      ["Property-management and hotel system connectivity", "partner"]
    ]
  },
  {
    layer: "Layer 5 — Future markets",
    items: [
      ["Additional adult-hospitality venues", "roadmap"],
      ["Bars, nightclubs, and event venues", "roadmap"],
      ["Multi-location operator deployments", "roadmap"]
    ]
  }
];

function Badge({ status }) {
  const s = STATUS[status];
  return (
    <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  );
}

export default function NUPSArchitectureMap() {
  return (
    <section id="architecture" className="w-full max-w-6xl mb-16">
      <h2 className="text-3xl sm:text-4xl font-black text-white text-center mb-3">
        NUPS Architecture Map
      </h2>
      <p className="text-blue-300 text-center mb-8 max-w-3xl mx-auto">
        Nexus Unified POS System. Every component carries an explicit status. Nothing on
        this map should be read as complete unless it is labelled as a live workflow.
      </p>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LEGEND.map(([key, meaning]) => (
          <div key={key} className="flex items-start gap-3">
            <Badge status={key} />
            <span className="text-xs text-blue-200/70 leading-relaxed">{meaning}</span>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {LAYERS.map((l) => (
          <div key={l.layer} className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6">
            <h3 className="text-sm tracking-[0.2em] uppercase text-blue-300 font-bold mb-4">
              {l.layer}
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {l.items.map(([name, status]) => (
                <div
                  key={name}
                  className="flex items-center justify-between gap-3 rounded-xl bg-black/20 border border-white/5 px-4 py-3"
                >
                  <span className="text-sm text-white/90">{name}</span>
                  <Badge status={status} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-blue-300/60 max-w-3xl mx-auto text-center leading-relaxed">
        Payment processing depends on the venue's own processor and acquirer relationships.
        Oracle partner and OHIP work follows a documented integration path and does not
        represent certification, validation, or endorsement. Compliance-related capability
        is scoped per deployment and confirmed in writing.
      </p>
    </section>
  );
}