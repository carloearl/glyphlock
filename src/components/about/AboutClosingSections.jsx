import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ExternalLink, FileCheck2, Gem, Landmark, Lightbulb, RadioTower, Scale, ShieldCheck, UserRound, WalletCards } from "lucide-react";
import { leadership, maturityGroups } from "@/content/about/aboutContent";

export function FinancialAccountability() {
  const rules = [
    { icon: Landmark, title: "Sales stay sales", body: "Cash and authorized card activity form total sales. The page does not inflate sales with stored value, payouts, or unrelated movements." },
    { icon: WalletCards, title: "GlyphBucks stay liabilities", body: "Issuance and redemption are tracked through closed-loop value records and a liability roll-forward, never mislabeled as banking or acquiring." },
    { icon: UserRound, title: "Contractor boundaries stay visible", body: "Entertainers are treated as independent contractors. Their agreements and payout evidence do not become W-2 payroll or a venue tip pool." },
    { icon: Scale, title: "Provider boundaries stay explicit", body: "External processors, hospitality platforms, and other providers retain their own approval, availability, settlement, and compliance responsibilities." },
  ];
  return (
    <section id="financial-accountability" className="bg-[#05070b] px-5 py-24 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">Financial accountability</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">The record model protects the meaning of money.</h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">GlyphLock Financial is a software recordkeeping and reconciliation layer. It is not represented here as a bank, acquirer, or blanket promise of provider approval.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {rules.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-white/[.025] p-6">
              <Icon className="h-5 w-5 text-amber-300" />
              <h3 className="mt-4 text-xl font-bold text-white">{title}</h3>
              <p className="mt-3 leading-7 text-slate-400">{body}</p>
            </article>
          ))}
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/GlyphLockFinancial" className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-5 py-3 text-sm font-bold text-slate-950">Explore GlyphLock Financial <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/Blockchain" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-white">Blockchain evidence</Link>
          <Link to="/GovernanceHub" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-white">Governance hub</Link>
        </div>
      </div>
    </section>
  );
}

export function TechnologyRecord() {
  const records = [
    { label: "May 2025 · concealed-image experiment", href: "https://www.dailymotion.com/video/x9lshzs", body: "A dated visual record of the early carrier work that preceded the broader GlyphLock architecture." },
    { label: "May 2025 · working technology follow-up", href: "https://www.dailymotion.com/video/x9m5qxe", body: "A second dated artifact showing continued exploration of image-carried machine-readable context." },
  ];
  return (
    <section id="technology-record" className="border-y border-white/10 bg-[#071017] px-5 py-24 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Technology record</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Dated artifacts, not retroactive mythology.</h2>
          <p className="mt-5 leading-7 text-slate-300">These links document early working directions. They are evidence of development history, not claims of patent status, regulatory approval, or universal production readiness.</p>
        </div>
        <div className="space-y-4">
          {records.map((record) => (
            <a key={record.href} href={record.href} target="_blank" rel="noreferrer" className="group block rounded-2xl border border-white/10 bg-white/[.025] p-6 transition hover:border-cyan-300/50 hover:bg-cyan-300/5">
              <div className="flex items-start justify-between gap-4">
                <FileCheck2 className="h-5 w-5 text-cyan-300" />
                <ExternalLink className="h-4 w-4 text-slate-600 transition group-hover:text-cyan-300" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-white">{record.label}</h3>
              <p className="mt-3 leading-7 text-slate-400">{record.body}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MaturityLedger() {
  return (
    <section id="maturity" className="bg-[#05070b] px-5 py-24 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">Maturity ledger</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">What exists, what has operated, and what is still being proved.</h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">Status language is part of the architecture. It prevents an implemented surface, a real-world operating proof, an integration path, and an internal research direction from being presented as interchangeable.</p>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {maturityGroups.map((group) => (
            <article key={group.label} className="rounded-2xl border border-white/10 bg-white/[.025] p-6">
              <div className="h-1 w-12 rounded-full" style={{ backgroundColor: group.color }} />
              <h3 className="mt-5 text-xl font-black text-white">{group.label}</h3>
              <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-400">{group.description}</p>
              <ul className="mt-5 space-y-3">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-slate-300"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: group.color }} />{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const leadershipIcons = [Lightbulb, Gem, RadioTower];

export function Leadership() {
  return (
    <section id="leadership" className="relative overflow-hidden border-t border-white/10 bg-[#071017] px-5 py-24 sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(0,228,255,.07),transparent_34%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Leadership</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Three disciplines. Direct responsibility.</h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            GlyphLock’s leadership combines firsthand creative and venue operations, independent commerce and financial strategy,
            and multi-site surveillance and systems engineering. Each person owns a different part of moving the architecture
            from an idea into dependable operations.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {leadership.map((person, index) => {
            const Icon = leadershipIcons[index] || UserRound;
            return (
              <article key={person.name} className="relative flex flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#060b11]/95 p-6 shadow-[0_22px_70px_rgba(0,0,0,.22)] sm:p-7">
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${person.color}, transparent)` }} />
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/35" style={{ color: person.color }}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="max-w-[70%] rounded-full border border-white/10 bg-white/[.035] px-3 py-1.5 text-right text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: person.color }}>
                    {person.lens}
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-black text-white">{person.name}</h3>
                <p className="mt-2 min-h-10 text-sm font-semibold leading-5" style={{ color: person.color }}>{person.title}</p>

                <div className="mt-6 space-y-4">
                  <BioBlock label="Professional background" body={person.background} color={person.color} />
                  <BioBlock label="Contribution to GlyphLock" body={person.body} color="#8EEBFF" />
                  <BioBlock label="Current leadership focus" body={person.focus} color="#C9A7FF" />
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {person.highlights.map((highlight) => (
                    <span key={highlight} className="rounded-full border border-white/10 bg-white/[.03] px-3 py-1.5 text-[10px] font-semibold text-slate-300">
                      {highlight}
                    </span>
                  ))}
                </div>

                {person.to && (
                  <Link to={person.to} className="group mt-7 inline-flex items-center gap-2 text-sm font-bold text-white">
                    Read Carlo’s full founder story
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                )}
              </article>
            );
          })}
        </div>

        <p className="mx-auto mt-7 max-w-4xl text-center text-xs leading-5 text-slate-600">
          Leadership backgrounds are supplied by GlyphLock. External company names describe professional experience only and do not imply sponsorship, partnership, or endorsement of GlyphLock.
        </p>
      </div>
    </section>
  );
}

function BioBlock({ label, body, color }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color }}>{label}</p>
      <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
    </div>
  );
}

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[#05070b] px-5 py-24 sm:px-8 lg:px-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,228,255,.09),transparent_42%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl rounded-3xl border border-cyan-300/20 bg-[#08111a]/90 px-6 py-16 text-center sm:px-12">
        <ShieldCheck className="mx-auto h-8 w-8 text-cyan-300" />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">One architecture · six domains · one governed record</p>
        <h2 className="mx-auto mt-5 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl">Bring us the handoff your current systems cannot explain.</h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">We can map the identity, permission, operational, financial, evidence, and integration boundaries before deciding what should be built or connected.</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link to="/Consultation" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-black text-slate-950">Discuss a deployment <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/Services" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-bold text-white">Explore services</Link>
          <Link to="/Partners" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-bold text-white">Partner with GlyphLock</Link>
        </div>
      </div>
    </section>
  );
}
