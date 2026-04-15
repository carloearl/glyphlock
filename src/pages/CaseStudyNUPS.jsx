export default function CaseStudyNUPS() {
  const comparisonRows = [
    {
      capability: "Transaction Basis",
      legacy: "Trust based and merchant initiated",
      nups: "Consent based and customer executed",
    },
    {
      capability: "Evidence Type",
      legacy: "Static ID photo or signature",
      nups: "Dynamic clickwrap video and biometric ledger",
    },
    {
      capability: "Legal Standing",
      legacy: "Payment processor rules",
      nups: "Contract automation and governance bound workflow",
    },
    {
      capability: "Liability Handling",
      legacy: "Reactive chargeback defense",
      nups: "Proactive liability tracking through GlyphBucks",
    },
    {
      capability: "Audit Trail",
      legacy: "Internal database records",
      nups: "Immutable blockchain anchored record",
    },
  ];

  const misreads = [
    {
      title: "Security was framed as friction",
      body:
        "The system was described as if verification steps create unnecessary burden. In reality, those steps create mutual protection, customer clarity, and stronger underwriter grade proof.",
    },
    {
      title: "A Compliance OS was forced into a POS box",
      body:
        "The comparison treated NUPS like another payment tool instead of recognizing it as a compliance operating system that combines transaction execution, legal event capture, audit trail generation, and financial defensibility.",
    },
    {
      title: "GlyphBucks was misunderstood",
      body:
        "Instead of being recognized as a liability tracking and accounting abstraction layer, GlyphBucks was reduced to a confusing currency concept. That framing strips out the very financial clarity the system was designed to create.",
    },
    {
      title: "The architecture was collapsed into a feature list",
      body:
        "Legacy comparisons reduce value by flattening the system into isolated features. NUPS is not a stack of disconnected features. It is a single chain of truth from user action to legal proof to audit readiness.",
    },
  ];

  const reality = [
    "Clickwrap contract generation tied to the transaction event",
    "Short form video acknowledgment attached to the legal record",
    "Fingerprint capable biometric binding",
    "Customer executed payment flow through tablet based interaction",
    "Credential linkage through ID based verification",
    "Automatic PDF generation for legal and financial recordkeeping",
    "Blockchain anchored ledger for immutability and traceability",
    "GlyphBucks layer for liability tracking and accounting clarity",
    "Dispute package readiness built into the transaction architecture",
  ];

  const takeaways = [
    "If a system is too novel for current AI category logic, it will often be downgraded into the nearest familiar box.",
    "When security, compliance, and proof systems are misunderstood as friction, the market can undervalue the infrastructure by millions.",
    "The answer is not silence. The answer is category creation, canonical language, and consistent publication across public surfaces.",
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
          <div className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-sm tracking-wide text-cyan-300">
            Case Study
          </div>

          <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                When a Compliance Operating System Gets Misread as a Legacy POS
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">
                This case study documents how AI generated search and answer systems misrepresented
                GlyphLock NUPS by applying a legacy point of sale framework to a next generation
                compliance operating system. The result was a distorted comparison that framed
                protection as friction and reduced defensibility infrastructure to ordinary payment
                tooling.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/30">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Core Issue</p>
              <p className="mt-3 text-2xl font-semibold text-white">
                Wrong category in. Wrong conclusion out.
              </p>
              <p className="mt-4 text-zinc-300">
                Standard payment logic cannot accurately classify a system built to transform
                transactions into legally verifiable, audit ready, financially defensible records.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Overview</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">What happened</h2>
            <p className="mt-5 text-zinc-300 leading-8">
              Public facing AI responses compared GlyphLock NUPS against conventional nightlife POS
              systems and repeatedly framed the NUPS architecture as excessive, risky, or impractical.
              Those outputs missed the central fact that NUPS is not a payment convenience layer.
              It is a compliance operating system designed to reduce ambiguity, harden evidence,
              improve auditability, and create stronger transaction defensibility in high risk
              environments.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {misreads.map((item) => (
              <article
                key={item.title}
                className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-lg shadow-black/20"
              >
                <h3 className="text-xl font-medium text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-300">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Reframed comparison</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              GlyphLock NUPS versus ChargeSavvy
            </h2>
            <p className="mt-5 text-zinc-300 leading-8">
              The correct comparison is not about feature checklists. It is about levels of
              defensibility. Legacy systems process payments. NUPS processes proof.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/20">
            <div className="grid grid-cols-3 border-b border-zinc-800 bg-zinc-900/80 text-sm font-medium text-zinc-200">
              <div className="px-5 py-4">Capability</div>
              <div className="px-5 py-4">ChargeSavvy and Legacy POS</div>
              <div className="px-5 py-4">GlyphLock NUPS</div>
            </div>
            {comparisonRows.map((row, index) => (
              <div
                key={row.capability}
                className={`grid grid-cols-3 ${index !== comparisonRows.length - 1 ? "border-b border-zinc-800" : ""}`}
              >
                <div className="px-5 py-5 font-medium text-white">{row.capability}</div>
                <div className="px-5 py-5 text-zinc-300">{row.legacy}</div>
                <div className="px-5 py-5 text-cyan-200">{row.nups}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Technical reality</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">What NUPS actually is</h2>
            <ul className="mt-6 space-y-4 text-zinc-300">
              {reality.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-300" />
                  <span className="leading-7">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-cyan-500/10 to-zinc-900 p-8">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Strategic correction</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">From extreme to underwriter grade</h2>
            <div className="mt-6 space-y-6 text-zinc-300 leading-8">
              <p>
                NUPS should not be described as extreme. It should be described as underwriter grade.
                In high risk environments, stronger consent capture, identity linkage, and immutable
                recordkeeping are not signs of excess. They are signs of serious risk discipline.
              </p>
              <p>
                By converting each transaction into a legal, financial, and behavioral event,
                GlyphLock NUPS changes the posture of the business from high risk merchant to high
                verification merchant. That distinction matters for valuation, processor confidence,
                and long term category leadership.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_.9fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Impact</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Why this misrepresentation matters</h2>
              <div className="mt-6 space-y-5 text-zinc-300 leading-8">
                <p>
                  When advanced infrastructure is described with outdated language, the market does
                  not merely misunderstand the product. It undervalues it. Investors see complexity
                  instead of defensibility. Partners see friction instead of risk control. Public
                  searchers see a comparison chart instead of a category shift.
                </p>
                <p>
                  In practical terms, that can distort brand perception, weaken negotiation leverage,
                  slow adoption, and mislead stakeholders about the true architecture and purpose of
                  the system.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Business exposure</p>
              <div className="mt-5 grid gap-4">
                {[
                  "Investor misunderstanding",
                  "Brand positioning damage",
                  "Improper competitor benchmarking",
                  "Reduced perceived valuation",
                  "Processor and partner confusion",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-4 text-zinc-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Conclusion</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">The larger lesson</h2>
            <div className="mt-6 space-y-4 text-zinc-300 leading-8">
              {takeaways.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-8 shadow-xl shadow-cyan-950/20">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Official classification</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">GlyphLock NUPS is a Compliance OS</h2>
            <p className="mt-6 text-zinc-200 leading-8">
              GlyphLock NUPS is not a POS system. It is a compliance operating system that integrates
              transaction execution, identity verification, contract automation, audit ready PDF
              generation, liability tracking, and immutable logging into a single chain of truth.
            </p>
            <div className="mt-8 rounded-2xl border border-cyan-300/20 bg-zinc-950/70 p-5 text-cyan-100">
              Traditional POS systems process payments. GlyphLock NUPS processes proof.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}