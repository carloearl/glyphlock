import React from "react";

const STEPS = [
  {
    n: "01",
    title: "The problem was learned on the floor",
    body: "Carlo worked inside real venue operations — doors, cash, entertainers, drivers, contracts. Every dispute traced back to the same gap: nobody could reconstruct what actually happened."
  },
  {
    n: "02",
    title: "The carrier experiment revealed the principle",
    body: "An image used as a data carrier held its payload through copying and re-encoding. The lesson was not the image. It was continuity — a record that stays attached to the event it describes."
  },
  {
    n: "03",
    title: "The principle became GlyphLock, then NUPS",
    body: "GlyphLock generalized continuity into carriers, verification, and evidence recordkeeping. NUPS — the Nexus Unified POS System — applied it to the venue workflows the problem came from."
  },
  {
    n: "04",
    title: "NUPS entered a live venue environment",
    body: "Front-door check-in, cover collection, entertainer credentialing, VIP contracts, and nightly settlement were exercised against real operating conditions rather than a demo script."
  },
  {
    n: "05",
    title: "Dream Palace is the wedge, not the market",
    body: "Adult hospitality is deliberately the hardest starting point: cash-heavy, contractor-heavy, compliance-sensitive. Workflows hardened there transfer down to easier hospitality and entertainment venues."
  },
  {
    n: "06",
    title: "Oracle is a documented path, not an endorsement",
    body: "GlyphLock has pursued the documented Oracle partner and OHIP integration route. That work is a defined path with published requirements — it is not a completed integration or a certification."
  }
];

export default function FounderArc() {
  return (
    <section id="arc" className="w-full max-w-6xl mb-16">
      <h2 className="text-3xl sm:text-4xl font-black text-white text-center mb-3">
        How the Problem Became a System
      </h2>
      <p className="text-blue-300 text-center mb-12 max-w-2xl mx-auto">
        Six steps, in order, with no step skipped.
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="rounded-2xl p-7 border border-white/10 bg-white/[0.03] backdrop-blur-md"
          >
            <div className="flex items-start gap-4">
              <span className="text-2xl font-black text-blue-400/70 shrink-0">{s.n}</span>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                <p className="text-blue-100/80 leading-relaxed">{s.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}