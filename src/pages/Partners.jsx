import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  ChevronRight,
  CircuitBoard,
  Code2,
  FileCheck2,
  Fingerprint,
  Handshake,
  Landmark,
  Network,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { createPageUrl } from "@/utils";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const AUDIENCES = [
  {
    icon: Building2,
    eyebrow: "Venue operators",
    title: "Turn operating rules into accountable workflows.",
    description:
      "Explore NUPS for venue-specific roles, approval boundaries, transaction context, and evidence records designed around real hospitality operations.",
    points: ["Venue and role scoping", "Controlled operator onboarding", "Evidence-ready operating records"],
    accent: "cyan",
  },
  {
    icon: Code2,
    eyebrow: "Platform & integration teams",
    title: "Connect systems without blurring authority.",
    description:
      "Map APIs, hospitality platforms, payment-adjacent workflows, secure image carriers, and hardware touchpoints into a documented integration boundary.",
    points: ["API and data-flow mapping", "Sandbox-first validation", "Source-to-evidence traceability"],
    accent: "blue",
  },
  {
    icon: Landmark,
    eyebrow: "Executives & strategic partners",
    title: "Evaluate the company through evidence, not spectacle.",
    description:
      "Review the product category, technical records, deployment boundaries, and commercial pathway before committing time, reputation, or resources.",
    points: ["Public technical evidence", "Explicit maturity boundaries", "Scoped diligence materials"],
    accent: "violet",
  },
  {
    icon: Handshake,
    eyebrow: "Licensing & ecosystem partners",
    title: "Build a defined route from fit to controlled launch.",
    description:
      "Structure deployment, integration, licensing, or strategic collaboration around named owners, acceptance criteria, and authorization gates.",
    points: ["Written scope and ownership", "Acceptance criteria", "Production authorization gate"],
    accent: "emerald",
  },
];

const SYSTEM_LAYERS = [
  {
    icon: Fingerprint,
    label: "Identity",
    title: "Who is acting?",
    detail: "Resolve the person, account, role, and operating context.",
  },
  {
    icon: ShieldCheck,
    label: "Permission",
    title: "What are they allowed to do?",
    detail: "Apply venue, mode, scope, and approval boundaries.",
  },
  {
    icon: CircuitBoard,
    label: "Operation",
    title: "What happened?",
    detail: "Connect the authorized workflow to the system action.",
  },
  {
    icon: FileCheck2,
    label: "Evidence",
    title: "What proves it?",
    detail: "Package source records, timestamps, and decision context.",
  },
];

const PROOF = [
  {
    label: "Company record",
    value: "Arizona LLC",
    detail: "GlyphLock LLC • formed May 24, 2025 • El Mirage, Arizona",
    icon: BadgeCheck,
  },
  {
    label: "Product system",
    value: "NUPS",
    detail: "Nexus Unified POS System for venue operations and evidence packaging",
    icon: Network,
  },
  {
    label: "Integration evidence",
    value: "OHIP sandbox",
    detail: "Controlled read-only Oracle Hospitality Partner Sandbox evidence",
    icon: ScanLine,
  },
  {
    label: "Public diligence",
    value: "Technical Evidence",
    detail: "Claims classified as verifiable records, positioning, methodology, or internal analysis",
    icon: FileCheck2,
  },
];

const PROCESS = [
  {
    number: "01",
    title: "Fit",
    text: "Identify the operating problem, users, systems, and desired outcome.",
  },
  {
    number: "02",
    title: "Boundary",
    text: "Document ownership, permissions, data movement, and non-goals.",
  },
  {
    number: "03",
    title: "Sandbox",
    text: "Validate the smallest safe workflow without implying production approval.",
  },
  {
    number: "04",
    title: "Evidence",
    text: "Review results, exceptions, acceptance criteria, and residual risk.",
  },
  {
    number: "05",
    title: "Authorize",
    text: "Advance only through written approval and a controlled launch plan.",
  },
];

const accentClasses = {
  cyan: "border-cyan-300/20 bg-cyan-300/[0.045] text-cyan-200",
  blue: "border-blue-300/20 bg-blue-300/[0.045] text-blue-200",
  violet: "border-violet-300/20 bg-violet-300/[0.045] text-violet-200",
  emerald: "border-emerald-300/20 bg-emerald-300/[0.045] text-emerald-200",
};

export default function Partners() {
  return (
    <>
      <SEOHead />
      <main className="min-h-screen overflow-hidden bg-[#030712] text-white">
        <section className="relative isolate border-b border-white/10 px-5 pb-20 pt-28 sm:pb-28 sm:pt-36">
          <div
            className="pointer-events-none absolute inset-0 -z-20"
            style={{
              backgroundImage:
                "linear-gradient(rgba(148,163,184,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.055) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage: "linear-gradient(to bottom, black, transparent 86%)",
            }}
          />
          <div className="pointer-events-none absolute left-[-12rem] top-[-10rem] -z-10 h-[34rem] w-[34rem] rounded-full bg-cyan-500/15 blur-[130px]" />
          <div className="pointer-events-none absolute right-[-12rem] top-24 -z-10 h-[38rem] w-[38rem] rounded-full bg-violet-600/15 blur-[150px]" />

          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-emerald-200">
                <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                Evidence-led partnerships
              </Badge>
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                GlyphLock LLC • El Mirage, Arizona
              </span>
            </div>

            <div className="mt-10 grid items-end gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-300">
                  Partnership infrastructure
                </p>
                <h1 className="mt-5 max-w-5xl font-space text-5xl font-black leading-[0.94] tracking-[-0.055em] text-white sm:text-7xl lg:text-[5.4rem]">
                  Prove the right action happened—
                  <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
                    under the right authority.
                  </span>
                </h1>
                <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
                  GlyphLock connects identity, permission, operations, and evidence into one architecture.
                  Partners get a controlled path from technical fit to verified deployment readiness.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link to={createPageUrl("Consultation")}>
                    <Button className="h-12 w-full bg-cyan-300 px-6 font-bold text-slate-950 shadow-[0_0_30px_rgba(103,232,249,0.18)] hover:bg-white sm:w-auto">
                      Explore a deployment
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to={createPageUrl("TechnicalEvidence")}>
                    <Button
                      variant="outline"
                      className="h-12 w-full border-white/15 bg-white/[0.03] px-6 font-bold text-white hover:bg-white/10 sm:w-auto"
                    >
                      Review Technical Evidence
                    </Button>
                  </Link>
                </div>

                <p className="mt-5 max-w-2xl text-xs leading-5 text-slate-500">
                  Public materials are informational. Production access, Oracle Marketplace listing, and
                  Oracle Simphony certification are not represented as approved.
                </p>
              </div>

              <div className="relative rounded-[2rem] border border-white/12 bg-slate-950/70 p-5 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl sm:p-7">
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">System view</p>
                    <h2 className="mt-2 font-space text-xl font-black text-white">One evidence architecture</h2>
                  </div>
                  <Sparkles className="h-5 w-5 text-violet-300" />
                </div>

                <div className="mt-5 space-y-3">
                  {SYSTEM_LAYERS.map(({ icon: Icon, label, title }, index) => (
                    <div key={label} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition-colors hover:border-cyan-300/25 hover:bg-cyan-300/[0.045]">
                      <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-200">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
                        <p className="mt-1 font-semibold text-slate-100">{title}</p>
                      </div>
                      {index < SYSTEM_LAYERS.length - 1 && <ChevronRight className="h-4 w-4 text-slate-600" />}
                      {index === SYSTEM_LAYERS.length - 1 && <Check className="h-4 w-4 text-emerald-300" />}
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.055] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Partnership standard</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Named owners. Defined boundaries. Reproducible evidence. Explicit authorization.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 px-5 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-violet-300">Built for the decision room</p>
              <h2 className="mt-4 font-space text-3xl font-black tracking-tight sm:text-5xl">
                A different entry point for every serious partner.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-400">
                Start with the outcome that matters to your organization. The technical boundary and evidence standard remain consistent.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {AUDIENCES.map(({ icon: Icon, eyebrow, title, description, points, accent }) => (
                <article
                  key={eyebrow}
                  className={`group rounded-[1.75rem] border p-6 transition duration-300 hover:-translate-y-1 hover:border-white/25 sm:p-8 ${accentClasses[accent]}`}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-current/20 bg-black/25">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] opacity-80">{eyebrow}</span>
                  </div>
                  <h3 className="mt-7 max-w-xl font-space text-2xl font-black leading-tight text-white sm:text-3xl">{title}</h3>
                  <p className="mt-4 max-w-2xl leading-7 text-slate-300">{description}</p>
                  <ul className="mt-6 space-y-3">
                    {points.map((point) => (
                      <li key={point} className="flex gap-3 text-sm text-slate-300">
                        <Check className="mt-0.5 h-4 w-4 flex-none text-emerald-300" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative px-5 py-20 sm:py-28">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-500/[0.06] to-transparent" />
          <div className="relative mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
              <div className="lg:sticky lg:top-28">
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-300">Public proof ledger</p>
                <h2 className="mt-4 font-space text-3xl font-black tracking-tight sm:text-5xl">
                  The ambition is large. The claims stay precise.
                </h2>
                <p className="mt-5 text-lg leading-8 text-slate-400">
                  These are the public facts a partner can inspect today. Deeper commercial materials are shared only when current, relevant, and supported.
                </p>
                <Link to={createPageUrl("TechnicalEvidence")} className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-cyan-200 hover:text-white">
                  Open the full evidence library
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {PROOF.map(({ label, value, detail, icon: Icon }) => (
                  <article key={label} className="min-h-56 rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-6">
                    <Icon className="h-6 w-6 text-cyan-300" />
                    <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">{label}</p>
                    <h3 className="mt-2 font-space text-2xl font-black text-white">{value}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
                  </article>
                ))}

                <article className="rounded-[1.6rem] border border-cyan-300/20 bg-gradient-to-br from-cyan-300/[0.09] to-violet-300/[0.05] p-6 sm:col-span-2">
                  <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200">Flagship integration record</p>
                      <h3 className="mt-2 font-space text-2xl font-black text-white">NUPS × Oracle Hospitality</h3>
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                        Review the controlled, read-only OHIP Partner Sandbox evidence, its identifiers, test result, and explicit production boundary.
                      </p>
                    </div>
                    <Link to={createPageUrl("CaseStudyOracleOHIP")}>
                      <Button className="w-full bg-white text-slate-950 hover:bg-cyan-100 sm:w-auto">
                        Inspect record
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-slate-950/60 px-5 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div className="max-w-3xl">
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-cyan-300">From conversation to authorization</p>
                <h2 className="mt-4 font-space text-3xl font-black tracking-tight sm:text-5xl">
                  No mystery between the first meeting and the launch gate.
                </h2>
              </div>
              <p className="max-w-xl text-base leading-7 text-slate-400">
                Every engagement is scoped to the actual systems, users, data, hardware, controls, and approvals involved.
              </p>
            </div>

            <ol className="mt-12 grid gap-px overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/10 md:grid-cols-5">
              {PROCESS.map(({ number, title, text }) => (
                <li key={number} className="bg-[#07101e] p-6 sm:p-7">
                  <span className="font-space text-3xl font-black text-cyan-300/40">{number}</span>
                  <h3 className="mt-8 font-space text-xl font-black text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-5 py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[2rem] border border-violet-300/20 bg-gradient-to-br from-violet-300/[0.08] via-blue-300/[0.04] to-transparent p-7 sm:p-10">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-violet-200">Commercial diligence</p>
              <h2 className="mt-4 max-w-3xl font-space text-3xl font-black tracking-tight sm:text-4xl">
                The public page is a starting point—not a valuation pitch.
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300">
                Valuation scenarios, revenue projections, insurance discussions, and strategic scale models are not presented as public traction. When appropriate, current materials can be reviewed in a scoped diligence process with their sources, assumptions, and limitations attached.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  "Current source material",
                  "Assumptions stated in plain language",
                  "Maturity and approval boundaries",
                  "Named follow-up owners",
                ].map((item) => (
                  <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                    <Check className="h-4 w-4 flex-none text-emerald-300" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-[2rem] border border-amber-300/20 bg-amber-300/[0.045] p-7 sm:p-10">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-amber-200">Clear boundary</p>
              <h2 className="mt-4 font-space text-2xl font-black text-white">What this page does not claim</h2>
              <ul className="mt-7 space-y-4">
                {[
                  "No public offer to sell securities",
                  "No unsupported company valuation",
                  "No claim of Oracle production approval",
                  "No implied certification or endorsement",
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-slate-300">
                    <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-amber-200" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-7 border-t border-amber-200/15 pt-6 text-xs leading-5 text-slate-500">
                Engagements may include deployment, integration, licensing, or strategic diligence and are governed by the applicable written agreement.
              </p>
            </aside>
          </div>
        </section>

        <section className="px-5 pb-28">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.25rem] border border-cyan-200/20 bg-gradient-to-br from-[#0a2030] via-[#111934] to-[#1b1230] px-7 py-12 sm:px-12 sm:py-16">
            <div className="pointer-events-none absolute right-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-cyan-300/15 blur-[90px]" />
            <div className="relative flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
              <div className="max-w-4xl">
                <div className="flex items-center gap-3 text-cyan-200">
                  <Users className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-[0.24em]">Start with the real operating question</span>
                </div>
                <h2 className="mt-5 font-space text-4xl font-black tracking-tight sm:text-6xl">
                  What must your organization be able to prove?
                </h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                  Bring the workflow, the systems, and the risk. GlyphLock will help define the smallest credible path to evidence-backed deployment.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Link to={createPageUrl("Consultation")}>
                  <Button className="h-12 w-full bg-cyan-300 px-6 font-bold text-slate-950 hover:bg-white sm:w-auto">
                    Scope a partnership
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to={createPageUrl("Contact")}>
                  <Button variant="outline" className="h-12 w-full border-white/20 bg-black/10 px-6 font-bold text-white hover:bg-white/10 sm:w-auto">
                    Contact GlyphLock
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-2 border-t border-white/10 pt-6 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p>© GlyphLock LLC • El Mirage, Arizona</p>
            <p>Evidence before scale. Authorization before production.</p>
          </div>
        </section>
      </main>
    </>
  );
}
