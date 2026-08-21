import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Blocks,
  Bot,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Code2,
  FileCheck2,
  Fingerprint,
  Network,
  QrCode,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import SEOHead from "../components/SEOHead";

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
};

const productPillars = [
  {
    icon: Building2,
    eyebrow: "Live operating product",
    title: "NUPS venue operations",
    body: "Nexus Unified POS System brings identity, staff roles, check-in, registers, contracts, payouts, batches, reconciliation, and audit evidence into one venue-scoped operating system.",
    points: [
      "Role-based workspaces for front door, register, management, back office, and ownership",
      "Guest, staff, driver, and independent-contractor workflows",
      "Transaction, contract, shift, and settlement records designed for review",
    ],
  },
  {
    icon: QrCode,
    eyebrow: "Verification layer",
    title: "GlyphLock identity and authorship",
    body: "QR-linked asset identity, interactive image layers, tamper-aware verification, and provenance records make digital work easier to trace, share, and defend.",
    points: [
      "QR identity and verification workflows",
      "Interactive images and hotspot layers",
      "Authorship, lineage, and exportable proof records",
    ],
  },
  {
    icon: Bot,
    eyebrow: "Assisted construction",
    title: "GlyphBot and creative tooling",
    body: "AI-assisted tools help users plan, generate, inspect, and improve websites, media, and operational workflows while keeping decisions and evidence visible.",
    points: [
      "Site-building and image workflows",
      "Knowledge-guided assistance and audit support",
      "Human approval for consequential actions",
    ],
  },
  {
    icon: Network,
    eyebrow: "Interoperability",
    title: "Integration infrastructure",
    body: "GlyphLock is built to connect with authorized payment providers, hospitality systems, storage, analytics, and enterprise services without collapsing their responsibilities into one vendor.",
    points: [
      "Provider-adapter architecture for payment references",
      "Oracle Hospitality integration work through OHIP environments",
      "Production access remains subject to provider and customer approval",
    ],
  },
];

const operatingFlow = [
  {
    icon: Fingerprint,
    step: "01",
    title: "Identify",
    body: "Resolve the person, role, venue, asset, and operating mode.",
  },
  {
    icon: Blocks,
    step: "02",
    title: "Operate",
    body: "Run the approved workflow with permissions and venue rules applied.",
  },
  {
    icon: FileCheck2,
    step: "03",
    title: "Record",
    body: "Capture the contract, transaction, approval, or activity as structured evidence.",
  },
  {
    icon: ShieldCheck,
    step: "04",
    title: "Verify",
    body: "Preserve the audit trail so authorized reviewers can reconstruct what happened.",
  },
];

const leadership = [
  {
    name: "Carlo Rene Earl",
    title: "Founder & Chief Executive Officer",
    icon: Sparkles,
    body: "Carlo founded GlyphLock and leads its product architecture, intellectual-property strategy, and long-term direction. He translates real operating problems into systems that connect identity, contracts, money movement records, creative work, and verifiable evidence.",
  },
  {
    name: "Jacub Lough",
    title: "Chief Financial Officer & Chief Strategy Officer",
    icon: CircleDollarSign,
    body: "Jacub leads financial planning, strategic development, risk analysis, and external commercial coordination. He helps shape processor, acquiring, integration, licensing, and growth decisions around clear economics and accountable execution.",
  },
  {
    name: "Collin Vanderginst",
    title: "Chief Technology Officer",
    icon: Code2,
    body: "Collin leads systems engineering, infrastructure reliability, security architecture, and technical integration. His role is to turn GlyphLock concepts into maintainable software and dependable operating systems.",
  },
];

const evidenceGroups = [
  {
    label: "Implemented in the current platform",
    accent: "text-[#00E4FF]",
    items: [
      "NUPS role-based venue workflows",
      "QR and interactive-image tooling",
      "Contract and verification records",
      "Audit, reconciliation, and reporting surfaces",
      "GlyphBot-assisted product workflows",
    ],
  },
  {
    label: "Integration work",
    accent: "text-[#8C4BFF]",
    items: [
      "Oracle Hospitality / OHIP interoperability",
      "Payment-provider adapter paths",
      "Analytics, storage, and business connectors",
      "Hardware-assisted identity and register workflows",
      "Enterprise API and SDK surfaces",
    ],
  },
  {
    label: "GlyphLock frameworks and research",
    accent: "text-amber-300",
    items: [
      "Master Covenant governance architecture",
      "Creative-sovereignty methods",
      "Quantum-resistant design research",
      "Multi-agent audit and control patterns",
      "Cross-platform provenance models",
    ],
  },
];

const engagementModels = [
  {
    title: "Platform access",
    body: "For creators, builders, and teams using GlyphLock tools, QR workflows, interactive media, and verification features.",
  },
  {
    title: "Venue deployment",
    body: "For operators implementing NUPS, including workflow configuration, role mapping, hardware planning, onboarding, and launch support.",
  },
  {
    title: "Enterprise integration",
    body: "For organizations that need custom interoperability, security review, data boundaries, service levels, or licensing terms.",
  },
];

function SectionHeading({ eyebrow, title, body }) {
  return (
    <div className="max-w-3xl mb-10">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-[#00E4FF] mb-3">
        {eyebrow}
      </p>
      <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white font-space">
        {title}
      </h2>
      {body ? (
        <p className="mt-4 text-base md:text-lg leading-relaxed text-slate-300">
          {body}
        </p>
      ) : null}
    </div>
  );
}

function ProductCard({ item }) {
  const Icon = item.icon;

  return (
    <motion.article
      {...reveal}
      className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 md:p-8"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#00E4FF]/25 bg-[#00E4FF]/10">
          <Icon className="h-6 w-6 text-[#00E4FF]" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8C4BFF]">
            {item.eyebrow}
          </p>
          <h3 className="mt-2 text-2xl font-bold text-white">{item.title}</h3>
        </div>
      </div>
      <p className="mt-5 leading-relaxed text-slate-300">{item.body}</p>
      <ul className="mt-5 space-y-3">
        {item.points.map((point) => (
          <li key={point} className="flex gap-3 text-sm leading-relaxed text-slate-400">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00E4FF]" aria-hidden="true" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </motion.article>
  );
}

export default function About() {
  return (
    <>
      <SEOHead
        title="About GlyphLock | Verifiable Infrastructure for Creative and Venue Operations"
        description="GlyphLock builds verifiable infrastructure for digital creation and real-world operations. Learn about NUPS, GlyphLock verification tools, the Master Covenant, and the team building the platform."
        keywords="GlyphLock, NUPS, Nexus Unified POS System, venue operations, QR verification, digital authorship, audit evidence, Carlo Earl, GlyphBot, Oracle Hospitality integration"
        url="/about"
      />

      <main className="relative min-h-screen overflow-hidden bg-black pb-24 pt-24 text-white">
        <div className="pointer-events-none absolute right-[-15rem] top-[-12rem] h-[38rem] w-[38rem] rounded-full bg-[#00E4FF]/10 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-[15%] left-[-18rem] h-[42rem] w-[42rem] rounded-full bg-[#8C4BFF]/10 blur-[150px]" />

        <div className="container relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <section className="py-12 text-center md:py-20">
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-5 text-xs font-black uppercase tracking-[0.32em] text-[#00E4FF]"
            >
              GlyphLock LLC · El Mirage, Arizona
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto max-w-5xl text-4xl font-black tracking-tight sm:text-6xl md:text-7xl lg:text-8xl font-space"
            >
              Infrastructure that makes activity{" "}
              <span className="bg-gradient-to-r from-[#00E4FF] to-[#8C4BFF] bg-clip-text text-transparent">
                provable.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mt-7 max-w-3xl text-lg leading-relaxed text-slate-300 md:text-xl"
            >
              GlyphLock connects identity, authorship, operations, contracts, and audit evidence
              so creators and real-world businesses can act with a record they can verify.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.28 }}
              className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Link
                to="/consultation"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00E4FF] to-[#8C4BFF] px-6 py-3 font-bold text-white transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#00E4FF]"
              >
                Discuss a deployment
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/NUPSLanding"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-bold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
              >
                Explore NUPS
              </Link>
            </motion.div>
          </section>

          <motion.section
            {...reveal}
            className="mb-20 rounded-3xl border border-[#00E4FF]/20 bg-gradient-to-br from-[#07101d] via-black to-[#10091e] p-7 md:p-12"
          >
            <SectionHeading
              eyebrow="Our origin"
              title="The idea started with an image."
              body="In early 2025, a conversation about camouflage raised a different question: what if an image could do more than display information? What if it could carry identity, respond to context, and preserve proof about where it came from?"
            />
            <div className="grid gap-8 text-base leading-relaxed text-slate-300 md:grid-cols-2 md:text-lg">
              <div className="space-y-5">
                <p>
                  That question became GlyphLock. The first experiments centered on smart QR
                  codes, interactive images, hidden data, and authorship. The work quickly
                  outgrew a single feature and became a broader architecture for verifiable
                  creation.
                </p>
                <p>
                  The build was shaped by pressure: limited resources, inconsistent help,
                  family responsibility, and repeated restarts. The practical response was to
                  strip the system to what could be built, tested, documented, and defended.
                </p>
              </div>
              <div className="space-y-5">
                <p>
                  Real venue work then exposed the same problem in a different form. Identity,
                  contracts, transactions, roles, and approvals existed across disconnected
                  tools. NUPS grew from the need to make those operations visible and
                  reconstructable.
                </p>
                <p className="font-semibold text-white">
                  The company still follows that discipline: expect pressure, separate claims
                  from evidence, preserve the record, and build systems that can explain what
                  happened.
                </p>
              </div>
            </div>
          </motion.section>

          <section className="mb-24">
            <SectionHeading
              eyebrow="What we build"
              title="One ecosystem, four working layers"
              body="GlyphLock is broader than a security product and more concrete than a concept. It is a growing platform with an operating venue system, verification tools, assisted construction, and integration infrastructure."
            />
            <div className="grid gap-6 md:grid-cols-2">
              {productPillars.map((item) => (
                <ProductCard key={item.title} item={item} />
              ))}
            </div>
          </section>

          <motion.section
            {...reveal}
            className="mb-24 rounded-3xl border border-[#8C4BFF]/25 bg-white/[0.025] p-7 md:p-12"
          >
            <SectionHeading
              eyebrow="System model"
              title="From identity to evidence"
              body="The same operating pattern connects GlyphLock's creative tools and NUPS workflows."
            />
            <div className="grid gap-4 md:grid-cols-4">
              {operatingFlow.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="relative rounded-2xl border border-white/10 bg-black/40 p-5">
                    <div className="mb-5 flex items-center justify-between">
                      <Icon className="h-6 w-6 text-[#00E4FF]" aria-hidden="true" />
                      <span className="font-mono text-xs font-bold text-slate-500">{item.step}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
                    {index < operatingFlow.length - 1 ? (
                      <ArrowRight
                        className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 text-[#8C4BFF] md:block"
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </motion.section>

          <section className="mb-24 grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
            <motion.div {...reveal} className="rounded-3xl border border-white/10 bg-white/[0.035] p-7 md:p-10">
              <SectionHeading
                eyebrow="NUPS"
                title="Built for the work between the swipe and the report"
                body="NUPS is GlyphLock's venue-operations subsystem. It does not pretend that a POS screen alone can explain a night of business."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  "Credential-aware profiles and check-in",
                  "Role-based staff workspaces and timekeeping",
                  "VIP and entertainer contract evidence",
                  "Cash and card transaction records",
                  "Register batches, Z reports, and reconciliation",
                  "Driver and contractor payout records",
                  "Audit trails for governed changes",
                  "Venue- and environment-scoped operations",
                ].map((item) => (
                  <div key={item} className="flex gap-3 text-sm leading-relaxed text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00E4FF]" aria-hidden="true" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.aside
              {...reveal}
              className="rounded-3xl border border-amber-400/25 bg-amber-400/[0.06] p-7 md:p-10"
            >
              <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-300">
                Accounting discipline
              </p>
              <h3 className="mt-3 text-2xl font-black text-white">The record must mean what it says.</h3>
              <div className="mt-6 space-y-5 text-sm leading-relaxed text-slate-300">
                <p>
                  <strong className="text-white">Sales:</strong> total sales are cash sales plus card sales.
                </p>
                <p>
                  <strong className="text-white">GlyphBucks:</strong> closed-loop stored value is tracked as a liability, not ordinary sales revenue.
                </p>
                <p>
                  <strong className="text-white">Entertainers:</strong> independent-contractor workflows remain separate from employee payroll and tip pools.
                </p>
                <p>
                  <strong className="text-white">Modes:</strong> live, demo, and sandbox activity remain separated.
                </p>
              </div>
            </motion.aside>
          </section>

          <motion.section
            {...reveal}
            className="mb-24 overflow-hidden rounded-3xl border border-[#00E4FF]/25 bg-gradient-to-r from-[#021824] to-[#160a29] p-8 md:p-12"
          >
            <Target className="h-8 w-8 text-[#00E4FF]" aria-hidden="true" />
            <p className="mt-7 text-sm font-black uppercase tracking-[0.26em] text-[#00E4FF]">Our mission</p>
            <h2 className="mt-4 max-w-5xl text-3xl font-black leading-tight text-white md:text-5xl font-space">
              Build infrastructure for creative sovereignty and accountable operations.
              Make ownership verifiable. Make activity reconstructable. Make digital and
              real-world systems trustworthy by design.
            </h2>
          </motion.section>

          <section className="mb-24">
            <SectionHeading
              eyebrow="Leadership"
              title="A small team with direct responsibility"
              body="GlyphLock's executive team is organized around product direction, financial strategy, and engineering delivery."
            />
            <div className="grid gap-6 lg:grid-cols-3">
              {leadership.map((leader) => {
                const Icon = leader.icon;
                return (
                  <motion.article
                    key={leader.name}
                    {...reveal}
                    className="rounded-2xl border border-white/10 bg-white/[0.035] p-7"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#00E4FF] to-[#8C4BFF]">
                      <Icon className="h-6 w-6 text-black" aria-hidden="true" />
                    </div>
                    <h3 className="mt-6 text-2xl font-bold text-white">{leader.name}</h3>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-[#00E4FF]">
                      {leader.title}
                    </p>
                    <p className="mt-5 leading-relaxed text-slate-400">{leader.body}</p>
                  </motion.article>
                );
              })}
            </div>
          </section>

          <section className="mb-24">
            <SectionHeading
              eyebrow="Evidence before claims"
              title="Clear about what is built, integrated, and researched"
              body="GlyphLock separates implemented product capabilities from third-party integration work and internal frameworks. An integration is not presented as an endorsement, certification, or production approval."
            />
            <div className="grid gap-6 lg:grid-cols-3">
              {evidenceGroups.map((group) => (
                <motion.article
                  key={group.label}
                  {...reveal}
                  className="rounded-2xl border border-white/10 bg-black/50 p-7"
                >
                  <h3 className={"text-lg font-bold " + group.accent}>{group.label}</h3>
                  <ul className="mt-5 space-y-3">
                    {group.items.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-400">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.article>
              ))}
            </div>
          </section>

          <section className="mb-24">
            <SectionHeading
              eyebrow="Work with GlyphLock"
              title="Engagements are scoped to the actual job"
              body="The old one-size-fits-all subscription table did not reflect the cost or responsibility of venue deployments and enterprise integration. Access and pricing are now matched to scope."
            />
            <div className="grid gap-6 lg:grid-cols-3">
              {engagementModels.map((model) => (
                <motion.article
                  key={model.title}
                  {...reveal}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-7"
                >
                  <Users className="h-6 w-6 text-[#8C4BFF]" aria-hidden="true" />
                  <h3 className="mt-5 text-2xl font-bold text-white">{model.title}</h3>
                  <p className="mt-3 leading-relaxed text-slate-400">{model.body}</p>
                </motion.article>
              ))}
            </div>
            <p className="mt-6 text-sm leading-relaxed text-slate-500">
              Quotes may account for venue count, active modules, hardware, onboarding, integrations,
              support, compliance review, and service-level requirements. Payment processing and
              hospitality production access remain subject to the relevant provider's underwriting,
              contracts, approvals, and technical requirements.
            </p>
          </section>

          <motion.section
            {...reveal}
            className="relative overflow-hidden rounded-3xl border border-[#00E4FF]/30 bg-gradient-to-b from-[#001F54] to-black p-8 text-center md:p-14"
          >
            <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(0,228,255,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(140,75,255,0.3)_1px,transparent_1px)] [background-size:32px_32px]" />
            <div className="relative z-10">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#00E4FF]">
                Build with evidence
              </p>
              <h2 className="mx-auto mt-4 max-w-4xl text-3xl font-black text-white md:text-5xl font-space">
                Bring us the workflow that needs to be trusted.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
                We will map the people, permissions, money, records, and integrations required
                to make it operational.
              </p>
              <Link
                to="/consultation"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00E4FF] to-[#8C4BFF] px-7 py-3.5 font-bold text-white transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#00E4FF]"
              >
                Request a consultation
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </motion.section>
        </div>
      </main>
    </>
  );
}
