import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Blocks,
  Bot,
  Braces,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Code2,
  CreditCard,
  Database,
  FileCheck2,
  FileSignature,
  Fingerprint,
  HardDrive,
  Hotel,
  Layers3,
  LockKeyhole,
  Network,
  QrCode,
  Radio,
  ReceiptText,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
  Users,
  Workflow,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import SEOHead from "../components/SEOHead";
import AboutConnectionHub from "../components/about/AboutConnectionHub";

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
};

const storyChapters = [
  {
    number: "01",
    label: "The image",
    title: "A camouflage conversation opened a larger question.",
    body: "In early 2025, Carlo Rene Earl was talking about camouflage when the conversation shifted: what if an image could do more than show something? What if it could carry identity, respond to context, connect to another experience, and preserve evidence of where it came from?",
    supporting: "The first GlyphLock experiments explored smart QR systems, interactive images, hidden information, asset identity, authorship, and provenance. The real subject was never just the code. It was the relationship between an object, its creator, its permitted use, and its history.",
    icon: QrCode,
  },
  {
    number: "02",
    label: "The discipline",
    title: "Pressure turned an idea into an operating principle.",
    body: "GlyphLock developed with limited resources, inconsistent assistance, family responsibility, and repeated revisions. That pressure forced a practical standard: build what can be tested, document what matters, and never confuse a claim with its evidence.",
    supporting: "That standard became part of the company itself. Important actions should have visible responsibility. Consequential decisions should retain human approval. A system should be able to explain what it recorded, what it did not record, and who was authorized to act.",
    icon: ShieldCheck,
  },
  {
    number: "03",
    label: "The venue floor",
    title: "Real operations exposed the same problem in physical form.",
    body: "Venue work showed Carlo a night of business divided across disconnected systems. An ID might live at the door. A contract could sit on paper. A payment terminal could show an authorization. Staff roles, approvals, shifts, payouts, and reports could all exist somewhere else.",
    supporting: "Each tool could record its own fragment while the complete event remained difficult to reconstruct. The question that began with an image returned in a harder form: how do you connect the person, permission, agreement, transaction reference, approval, and final report?",
    icon: Building2,
  },
  {
    number: "04",
    label: "The operating system",
    title: "NUPS was built for everything between the swipe and the report.",
    body: "Nexus Unified POS System grew from that gap. It connects venue-scoped identity, roles, check-in, registers, contracts, batches, payouts, reconciliation, and audit history so the pieces of an operating night can be reviewed together.",
    supporting: "NUPS has been developed and hardware-tested through real venue operations, with Dream Palace in Tempe, Arizona, serving as its first real operating environment. That work made NUPS GlyphLock's first practical operating proof—not the whole company, but the spear point.",
    icon: Workflow,
  },
  {
    number: "05",
    label: "The ecosystem",
    title: "One pattern now connects every GlyphLock product.",
    body: "Whether the subject is a guest, an employee, an independent contractor, a creative asset, or an enterprise workflow, GlyphLock follows the same sequence: identify the subject, apply permission, record the action, and preserve evidence.",
    supporting: "NUPS, GlyphLock Verification, and GlyphBot are different working experiences built on that shared foundation. External providers connect through controlled integration paths without surrendering their own responsibilities or becoming one indistinguishable system.",
    icon: Network,
  },
];

const products = [
  {
    icon: Building2,
    short: "NUPS",
    eyebrow: "Operating product",
    title: "NUPS venue operations",
    body: "The venue system that connects people, permissions, contracts, transactions, shifts, payouts, batches, and reports inside a venue-scoped record.",
    inputs: ["Guest and staff identity", "Venue roles and permissions", "Contracts and transaction references"],
    output: "A connected operating record for the night",
    color: "#00E4FF",
  },
  {
    icon: QrCode,
    short: "Verification",
    eyebrow: "Identity and authorship",
    title: "GlyphLock Verification",
    body: "QR-linked identity, interactive-image layers, asset lineage, and verification records connect digital or physical subjects to a traceable history.",
    inputs: ["Creator or asset identity", "Interactive content and hotspots", "Verification and revision events"],
    output: "A reviewable provenance trail",
    color: "#8C4BFF",
  },
  {
    icon: Bot,
    short: "GlyphBot",
    eyebrow: "Assisted construction",
    title: "GlyphBot",
    body: "Assisted tools help people plan, build, inspect, and improve media, websites, records, and operating workflows while keeping consequential decisions under human authority.",
    inputs: ["User instructions and knowledge", "Project context and constraints", "Human review and approval"],
    output: "Assisted work with visible decisions",
    color: "#F5B942",
  },
];

const operatingFlow = [
  {
    icon: Fingerprint,
    step: "01",
    title: "Identify",
    body: "Resolve the person, asset, role, venue, permissions, and operating environment.",
    example: "Who or what is acting?",
  },
  {
    icon: Blocks,
    step: "02",
    title: "Operate",
    body: "Run the approved workflow with the correct rules and boundaries applied.",
    example: "What are they allowed to do?",
  },
  {
    icon: FileCheck2,
    step: "03",
    title: "Record",
    body: "Capture the contract, transaction reference, approval, shift, or asset event.",
    example: "What actually happened?",
  },
  {
    icon: ShieldCheck,
    step: "04",
    title: "Verify",
    body: "Preserve enough connected evidence for an authorized reviewer to reconstruct it.",
    example: "Can the record explain itself?",
  },
];

const foundationControls = [
  { icon: Fingerprint, label: "Identity & context" },
  { icon: LockKeyhole, label: "Roles & permission" },
  { icon: Building2, label: "Venue boundaries" },
  { icon: Layers3, label: "Mode separation" },
  { icon: Database, label: "Governed records" },
];

const integrations = [
  { icon: CreditCard, label: "Payments" },
  { icon: Hotel, label: "Hospitality" },
  { icon: HardDrive, label: "Storage" },
  { icon: BarChart3, label: "Analytics" },
  { icon: ScanLine, label: "Hardware" },
  { icon: Braces, label: "Enterprise APIs" },
];

const workflowSteps = [
  {
    icon: UserCheck,
    label: "Arrival",
    title: "A guest approaches the venue.",
    detail: "The front-door workspace begins with the active venue and operating mode already established.",
    evidence: "Venue context · Operator session · Mode",
    status: "Context resolved",
  },
  {
    icon: ScanLine,
    label: "Identity",
    title: "Required identity and age-gate information is captured or confirmed.",
    detail: "The record uses only the fields required for the approved workflow. Public demonstrations use synthetic information—never a real guest's ID data.",
    evidence: "Profile reference · Verification status · Timestamp",
    status: "Age gate passed",
  },
  {
    icon: LockKeyhole,
    label: "Permission",
    title: "NUPS applies role and venue rules.",
    detail: "The system distinguishes the guest, staff operator, manager authority, independent-contractor workflow, and active workspace.",
    evidence: "Role · Permission result · Venue scope",
    status: "Workflow authorized",
  },
  {
    icon: FileSignature,
    label: "Agreement",
    title: "A contract or acknowledgment is connected when required.",
    detail: "The people, terms, approvals, and signatures belong to the same reviewable workflow instead of an unrelated paper trail.",
    evidence: "Agreement ID · Parties · Signatures · Approval",
    status: "Agreement linked",
  },
  {
    icon: ReceiptText,
    label: "Transaction",
    title: "The transaction record preserves the correct reference.",
    detail: "NUPS records cash or the authorized external card reference without pretending to replace the venue's processor or merchant relationship.",
    evidence: "Tender type · Amount · Provider reference · Operator",
    status: "Reference recorded",
  },
  {
    icon: ClipboardCheck,
    label: "Review",
    title: "The activity reaches the correct batch and report.",
    detail: "Management can review connected shifts, contracts, transaction references, approvals, payouts, and exceptions before closing the operational record.",
    evidence: "Batch · Reconciliation · Exceptions · Audit events",
    status: "Ready for review",
  },
];

const leadership = [
  {
    name: "Carlo Rene Earl",
    title: "Founder & Chief Executive Officer",
    icon: Sparkles,
    body: "Carlo leads product architecture, intellectual-property strategy, integrations, and the long-term direction of GlyphLock. His work translates firsthand creative and venue problems into systems that connect identity, agreements, operational activity, and evidence.",
  },
  {
    name: "Jacub Lough",
    title: "Chief Financial Officer & Chief Strategy Officer",
    icon: CircleDollarSign,
    body: "Jacub leads financial planning, risk analysis, strategic development, and commercial coordination. He helps shape acquiring, processor, licensing, integration, and growth decisions around clear economics and accountable execution.",
  },
  {
    name: "Collin Vanderginst",
    title: "Chief Technology Officer",
    icon: Code2,
    body: "Collin leads systems engineering, infrastructure reliability, security architecture, and technical integration, turning GlyphLock concepts into maintainable software and dependable operating systems.",
  },
];

const evidenceGroups = [
  {
    label: "Implemented",
    caption: "Present in the current platform",
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
    caption: "Connected paths, not endorsements",
    accent: "text-[#B78CFF]",
    items: [
      "Oracle Hospitality / OHIP interoperability work",
      "Payment-provider adapter paths",
      "Analytics, storage, and business connectors",
      "Hardware-assisted identity and register workflows",
      "Enterprise API and SDK surfaces",
    ],
  },
  {
    label: "Frameworks & research",
    caption: "GlyphLock-authored development",
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
    icon: QrCode,
    title: "Platform access",
    body: "For creators, builders, and teams using QR workflows, interactive media, verification tools, and assisted construction.",
    cta: "Explore the platform",
    to: "/",
  },
  {
    icon: Building2,
    title: "Venue deployment",
    body: "For operators implementing NUPS with workflow configuration, role mapping, hardware planning, onboarding, and launch support.",
    cta: "Discuss a venue",
    to: "/consultation",
  },
  {
    icon: Network,
    title: "Enterprise integration",
    body: "For organizations requiring custom interoperability, data boundaries, technical review, licensing terms, or service-level planning.",
    cta: "Scope an integration",
    to: "/consultation",
  },
];

function SectionHeading({ eyebrow, title, body, align = "left" }) {
  const alignment = align === "center" ? "mx-auto text-center" : "";
  return (
    <div className={"max-w-3xl " + alignment}>
      <p className="text-xs font-black uppercase tracking-[0.28em] text-[#00E4FF]">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl font-space">
        {title}
      </h2>
      {body ? (
        <p className="mt-5 text-base leading-relaxed text-slate-300 md:text-lg">
          {body}
        </p>
      ) : null}
    </div>
  );
}

function HeroEvidenceGraphic() {
  const reduceMotion = useReducedMotion();
  const nodes = [
    { icon: QrCode, label: "Image", position: "left-4 top-1/2 -translate-y-1/2", color: "text-[#8C4BFF]" },
    { icon: Fingerprint, label: "Identity", position: "left-1/2 top-4 -translate-x-1/2", color: "text-[#00E4FF]" },
    { icon: Workflow, label: "Action", position: "right-4 top-1/2 -translate-y-1/2", color: "text-amber-300" },
    { icon: ShieldCheck, label: "Evidence", position: "bottom-4 left-1/2 -translate-x-1/2", color: "text-emerald-300" },
  ];

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[31rem] overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#071827] via-[#03070d] to-[#150a22] shadow-[0_35px_100px_rgba(0,0,0,0.55)]"
      role="img"
      aria-label="GlyphLock connects an image to identity, action, and evidence."
    >
      <div className="absolute inset-[13%] rounded-full border border-[#00E4FF]/20" />
      <div className="absolute inset-[25%] rounded-full border border-[#8C4BFF]/25" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(0,228,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(140,75,255,0.16)_1px,transparent_1px)] [background-size:28px_28px]" />
      <motion.div
        className="absolute inset-[13%] rounded-full border-t border-r border-[#00E4FF]/60"
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={reduceMotion ? undefined : { duration: 26, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-[25%] rounded-full border-b border-l border-[#8C4BFF]/70"
        animate={reduceMotion ? undefined : { rotate: -360 }}
        transition={reduceMotion ? undefined : { duration: 18, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-3xl border border-white/15 bg-black/80 shadow-[0_0_65px_rgba(0,228,255,0.18)]">
        <span className="bg-gradient-to-br from-[#00E4FF] via-white to-[#8C4BFF] bg-clip-text text-4xl font-black text-transparent font-space">
          GL
        </span>
        <span className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
          Connect
        </span>
      </div>
      {nodes.map((node, index) => {
        const Icon = node.icon;
        return (
          <motion.div
            key={node.label}
            className={"absolute flex min-w-[6.5rem] items-center gap-2 rounded-xl border border-white/10 bg-black/80 px-3 py-2.5 backdrop-blur " + node.position}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, y: reduceMotion ? 0 : [0, -5, 0] }}
            transition={{
              opacity: { duration: 0.5, delay: 0.25 + index * 0.08 },
              scale: { duration: 0.5, delay: 0.25 + index * 0.08 },
              y: reduceMotion ? undefined : { duration: 3.6 + index * 0.25, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <Icon className={"h-4 w-4 " + node.color} aria-hidden="true" />
            <span className="text-xs font-bold text-white">{node.label}</span>
          </motion.div>
        );
      })}
      <div className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        One connected record
      </div>
    </div>
  );
}

function EcosystemMap() {
  const [activeProduct, setActiveProduct] = useState(0);
  const current = products[activeProduct];
  const CurrentIcon = current.icon;

  return (
    <div className="mt-12 rounded-[2rem] border border-white/10 bg-[#03070d]/90 p-4 shadow-[0_30px_100px_rgba(0,0,0,0.45)] sm:p-6 lg:p-8">
      <div className="grid gap-3 md:grid-cols-3" role="group" aria-label="Choose a GlyphLock product">
        {products.map((product, index) => {
          const Icon = product.icon;
          const active = index === activeProduct;
          return (
            <button
              key={product.short}
              type="button"
              onClick={() => setActiveProduct(index)}
              aria-pressed={active}
              className={
                "group flex items-center gap-3 rounded-2xl border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#00E4FF] " +
                (active
                  ? "border-[#00E4FF]/55 bg-[#00E4FF]/10 shadow-[0_0_30px_rgba(0,228,255,0.08)]"
                  : "border-white/10 bg-white/[0.025] hover:border-white/25 hover:bg-white/[0.05]")
              }
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/60"
                style={{ color: product.color }}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Working experience
                </span>
                <span className="mt-1 block font-bold text-white">{product.short}</span>
              </span>
              <ChevronRight
                className={"ml-auto h-4 w-4 transition-transform " + (active ? "rotate-90 text-[#00E4FF]" : "text-slate-600")}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      <motion.div
        key={current.title}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 grid gap-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.055] to-transparent p-5 md:grid-cols-[0.9fr_1.1fr] md:p-7"
      >
        <div>
          <div className="flex items-center gap-3">
            <CurrentIcon className="h-6 w-6" style={{ color: current.color }} aria-hidden="true" />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{current.eyebrow}</p>
          </div>
          <h3 className="mt-4 text-2xl font-black text-white md:text-3xl">{current.title}</h3>
          <p className="mt-4 leading-relaxed text-slate-300">{current.body}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/45 p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00E4FF]">What enters</p>
          <ul className="mt-4 space-y-3">
            {current.inputs.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="my-5 flex items-center gap-3 text-slate-600">
            <div className="h-px flex-1 bg-white/10" />
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">What comes out</p>
          <p className="mt-3 font-bold text-white">{current.output}</p>
        </div>
      </motion.div>

      <div className="relative mt-6">
        <p className="mb-3 text-center text-[10px] font-black uppercase tracking-[0.26em] text-slate-500">
          Every product uses the same operating pattern
        </p>
        <div className="grid gap-3 md:grid-cols-4">
          {operatingFlow.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="relative rounded-2xl border border-white/10 bg-black/50 p-4">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-[#00E4FF]" aria-hidden="true" />
                  <span className="font-mono text-[10px] font-bold text-slate-600">{item.step}</span>
                </div>
                <h4 className="mt-4 font-bold text-white">{item.title}</h4>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{item.body}</p>
                <p className="mt-3 text-[11px] font-semibold text-[#B78CFF]">{item.example}</p>
                {index < operatingFlow.length - 1 ? (
                  <ArrowRight className="absolute -right-2.5 top-1/2 z-10 hidden h-5 w-5 text-slate-600 md:block" aria-hidden="true" />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[#00E4FF]/20 bg-[#00E4FF]/[0.035] p-5">
        <div className="flex items-center gap-3">
          <Layers3 className="h-5 w-5 text-[#00E4FF]" aria-hidden="true" />
          <h4 className="font-bold text-white">Shared foundation</h4>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {foundationControls.map((control) => {
            const Icon = control.icon;
            return (
              <div key={control.label} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-xs font-semibold text-slate-300">
                <Icon className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                <span>{control.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#8C4BFF]/20 bg-[#8C4BFF]/[0.035] p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Network className="h-5 w-5 text-[#B78CFF]" aria-hidden="true" />
            <h4 className="font-bold text-white">Authorized integration rail</h4>
          </div>
          <p className="text-xs text-slate-500">External providers keep their own responsibilities.</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {integrations.map((integration) => {
            const Icon = integration.icon;
            return (
              <span key={integration.label} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-xs font-semibold text-slate-300">
                <Icon className="h-3.5 w-3.5 text-[#B78CFF]" aria-hidden="true" />
                {integration.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WorkflowExplorer() {
  const [activeStep, setActiveStep] = useState(0);
  const current = workflowSteps[activeStep];
  const CurrentIcon = current.icon;

  return (
    <div className="mt-10 overflow-hidden rounded-[2rem] border border-white/10 bg-[#05080d]">
      <div className="border-b border-white/10 bg-black/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#00E4FF]">Privacy-safe product walkthrough</p>
            <p className="mt-1 text-sm text-slate-400">Representative DEMO data · No real identity information</p>
          </div>
          <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">
            DEMO
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
        <div className="border-b border-white/10 p-3 lg:border-b-0 lg:border-r lg:p-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1" role="group" aria-label="NUPS evidence workflow steps">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              const active = activeStep === index;
              return (
                <button
                  key={step.label}
                  type="button"
                  onClick={() => setActiveStep(index)}
                  aria-current={active ? "step" : undefined}
                  className={
                    "flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#00E4FF] " +
                    (active
                      ? "border-[#00E4FF]/40 bg-[#00E4FF]/10 text-white"
                      : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white")
                  }
                >
                  <span className="font-mono text-[10px] font-bold text-slate-600">0{index + 1}</span>
                  <Icon className={"h-4 w-4 shrink-0 " + (active ? "text-[#00E4FF]" : "text-slate-600")} aria-hidden="true" />
                  <span className="text-xs font-bold">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <motion.div
          key={current.label}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-6 sm:p-8 lg:p-10"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#00E4FF]/25 bg-[#00E4FF]/10">
            <CurrentIcon className="h-6 w-6 text-[#00E4FF]" aria-hidden="true" />
          </div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-[#B78CFF]">Step {activeStep + 1} of {workflowSteps.length}</p>
          <h3 className="mt-3 max-w-2xl text-2xl font-black text-white md:text-3xl">{current.title}</h3>
          <p className="mt-4 max-w-2xl leading-relaxed text-slate-300">{current.detail}</p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Evidence connected</p>
              <p className="mt-2 text-sm font-semibold text-white">{current.evidence}</p>
            </div>
            <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.04] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Workflow state</p>
              <p className="mt-2 text-sm font-semibold text-white">{current.status}</p>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
              disabled={activeStep === 0}
              className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setActiveStep(Math.min(workflowSteps.length - 1, activeStep + 1))}
              disabled={activeStep === workflowSteps.length - 1}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-black text-black transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-35"
            >
              Next step
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function About() {
  return (
    <>
      <SEOHead
        title="About GlyphLock | From an Image to Verifiable Operations"
        description="GlyphLock began with a question about what an image could prove. Today it connects identity, permission, venue operations, contracts, transaction references, and audit evidence through NUPS, verification tools, and GlyphBot."
        keywords="GlyphLock, NUPS, Nexus Unified POS System, venue operations, QR verification, digital authorship, audit evidence, Carlo Rene Earl, GlyphBot, El Mirage Arizona"
        url="/about"
      />

      <main className="relative min-h-screen overflow-hidden bg-[#010204] pb-24 pt-20 text-white">
        <div className="pointer-events-none absolute right-[-16rem] top-[-8rem] h-[42rem] w-[42rem] rounded-full bg-[#00E4FF]/10 blur-[150px]" />
        <div className="pointer-events-none absolute left-[-20rem] top-[34rem] h-[42rem] w-[42rem] rounded-full bg-[#8C4BFF]/10 blur-[160px]" />
        <div className="pointer-events-none absolute bottom-[8%] right-[-18rem] h-[38rem] w-[38rem] rounded-full bg-amber-400/[0.06] blur-[150px]" />

        <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
          <section className="grid min-h-[78vh] items-center gap-12 py-14 lg:grid-cols-[1.08fr_0.92fr] lg:py-20">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="inline-flex items-center gap-2 rounded-full border border-[#00E4FF]/20 bg-[#00E4FF]/[0.06] px-4 py-2"
              >
                <Radio className="h-3.5 w-3.5 text-[#00E4FF]" aria-hidden="true" />
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9AF4FF]">
                  GlyphLock LLC · El Mirage, Arizona
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="mt-7 max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl xl:text-[5.25rem] font-space"
              >
                It started with an image.{" "}
                <span className="bg-gradient-to-r from-[#00E4FF] via-white to-[#B78CFF] bg-clip-text text-transparent">
                  It became a way to prove what happened.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.18 }}
                className="mt-7 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl"
              >
                GlyphLock connects identity, permission, activity, contracts, transaction references,
                and audit evidence so a creative work or a night of business can carry a record that
                authorized people can reconstruct.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.26 }}
                className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-500"
              >
                NUPS is the first operating proof of that idea: a venue system built for the work
                between the swipe and the report.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.34 }}
                className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
              >
                <Link
                  to="/consultation"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00E4FF] to-[#8C4BFF] px-6 py-3.5 font-black text-white shadow-[0_14px_45px_rgba(0,228,255,0.14)] transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#00E4FF] focus:ring-offset-2 focus:ring-offset-black"
                >
                  Discuss a deployment
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
                <Link
                  to="/NUPSLanding"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3.5 font-bold text-white transition-colors hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                >
                  Explore NUPS
                </Link>
                <a
                  href="#ecosystem"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-400 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-[#00E4FF]"
                >
                  See how the layers connect
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </a>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              <AboutConnectionHub />
            </motion.div>
          </section>

          <section className="border-y border-white/10 py-8">
            <div className="grid gap-5 text-center sm:grid-cols-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00E4FF]">Origin</p>
                <p className="mt-2 text-sm text-slate-400">An image, identity, and authorship</p>
              </div>
              <div className="border-white/10 sm:border-x">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#B78CFF]">Operating proof</p>
                <p className="mt-2 text-sm text-slate-400">NUPS in real venue workflows</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Purpose</p>
                <p className="mt-2 text-sm text-slate-400">Activity that can explain itself</p>
              </div>
            </div>
          </section>

          <section className="grid gap-12 py-24 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
            <div>
              <div className="lg:sticky lg:top-28">
                <SectionHeading
                  eyebrow="The origin"
                  title="The question changed. The principle did not."
                  body="GlyphLock did not begin as venue software. It began by asking how a digital object could retain identity and history. Real operations revealed that people, agreements, and transactions needed the same thing."
                />
                <div className="mt-8 rounded-2xl border border-[#00E4FF]/20 bg-[#00E4FF]/[0.045] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00E4FF]">The through line</p>
                  <p className="mt-3 text-lg font-bold leading-relaxed text-white">
                    Identify the subject. Apply permission. Record the action. Preserve the evidence.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative space-y-5">
              <div className="absolute bottom-8 left-6 top-8 hidden w-px bg-gradient-to-b from-[#00E4FF]/50 via-[#8C4BFF]/40 to-amber-300/40 sm:block" />
              {storyChapters.map((chapter) => {
                const Icon = chapter.icon;
                return (
                  <motion.article
                    key={chapter.number}
                    {...reveal}
                    className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:pl-20 md:p-8 md:pl-24"
                  >
                    <div className="mb-5 flex items-center gap-4 sm:absolute sm:left-4 sm:top-8 sm:mb-0 sm:flex-col sm:gap-2">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-black">
                        <Icon className="h-5 w-5 text-[#00E4FF]" aria-hidden="true" />
                      </span>
                      <span className="font-mono text-[10px] font-black text-slate-600">{chapter.number}</span>
                    </div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#B78CFF]">{chapter.label}</p>
                    <h3 className="mt-3 text-2xl font-black leading-tight text-white md:text-3xl">{chapter.title}</h3>
                    <p className="mt-5 leading-relaxed text-slate-300">{chapter.body}</p>
                    <p className="mt-4 leading-relaxed text-slate-400">{chapter.supporting}</p>
                  </motion.article>
                );
              })}
            </div>
          </section>

          <motion.section
            {...reveal}
            className="mb-24 overflow-hidden rounded-[2rem] border border-[#00E4FF]/20 bg-gradient-to-br from-[#071827] via-[#03070d] to-[#150a22] p-7 md:p-12"
          >
            <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#00E4FF]">The problem</p>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-white md:text-5xl font-space">
                  A record is strongest when its pieces still know each other.
                </h2>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
                  A terminal can show a payment reference. A scanner can read an ID. A contract can
                  hold signatures. A schedule can show who worked. None of those fragments alone
                  explains the complete event.
                </p>
                <p className="mt-5 max-w-2xl leading-relaxed text-slate-400">
                  GlyphLock preserves the relationships among those fragments so authorized reviewers
                  can follow the event from context to outcome.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/45 p-5 sm:p-6">
                {["Person or asset", "Role and permission", "Action or agreement", "Transaction reference", "Audit and report"].map((item, index) => (
                  <div key={item}>
                    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00E4FF]/10 font-mono text-[10px] font-black text-[#00E4FF]">
                        0{index + 1}
                      </span>
                      <span className="text-sm font-bold text-white">{item}</span>
                      <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-300" aria-hidden="true" />
                    </div>
                    {index < 4 ? <div className="mx-auto h-3 w-px bg-[#8C4BFF]/50" /> : null}
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <section id="ecosystem" className="scroll-mt-24 py-8">
            <SectionHeading
              eyebrow="The ecosystem"
              title="Three working products. One shared evidence architecture."
              body="The products are what people use. The operating pattern is how activity moves. The foundation supplies boundaries and controls. External services connect through a separate integration rail."
              align="center"
            />
            <EcosystemMap />
          </section>

          <section className="py-24">
            <SectionHeading
              eyebrow="NUPS in practice"
              title="Follow one event from the door to the report."
              body="This simplified walkthrough shows how NUPS connects context, identity, permission, agreements, transaction references, and management review without exposing genuine personal information."
            />
            <WorkflowExplorer />
          </section>

          <section className="mb-24 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <motion.div {...reveal} className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-7 md:p-10">
              <SectionHeading
                eyebrow="NUPS"
                title="Traditional POS systems process payments. NUPS processes proof."
                body="NUPS does not replace the venue's acquiring relationship or claim responsibility that belongs to an external provider. It connects the operational evidence surrounding the transaction."
              />
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  "Credential-aware profiles and check-in",
                  "Role-based staff workspaces and timekeeping",
                  "VIP and entertainer agreement evidence",
                  "Cash and authorized card-reference records",
                  "Register batches, Z reports, and reconciliation",
                  "Driver and contractor payout records",
                  "Audit trails for governed changes",
                  "Venue- and environment-scoped operations",
                ].map((item) => (
                  <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-black/25 p-4 text-sm leading-relaxed text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00E4FF]" aria-hidden="true" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/NUPSLanding"
                className="group mt-8 inline-flex items-center gap-2 font-black text-[#00E4FF] focus:outline-none focus:ring-2 focus:ring-[#00E4FF]"
              >
                Explore the NUPS operating system
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </motion.div>

            <motion.aside
              {...reveal}
              className="rounded-[2rem] border border-amber-300/20 bg-gradient-to-b from-amber-300/[0.07] to-transparent p-7 md:p-10"
            >
              <BadgeCheck className="h-8 w-8 text-amber-300" aria-hidden="true" />
              <p className="mt-7 text-xs font-black uppercase tracking-[0.22em] text-amber-300">Operational discipline</p>
              <h3 className="mt-3 text-2xl font-black text-white">The record must mean what it says.</h3>
              <div className="mt-7 space-y-5 text-sm leading-relaxed text-slate-300">
                <div>
                  <strong className="text-white">Sales</strong>
                  <code className="mt-2 block rounded-lg border border-white/10 bg-black/35 px-3 py-2 font-mono text-xs text-amber-100">
                    total_sales = cash_sales + card_sales
                  </code>
                </div>
                <p><strong className="text-white">GlyphBucks:</strong> closed-loop stored value is tracked as a liability, not ordinary sales revenue.</p>
                <p><strong className="text-white">Entertainers:</strong> independent-contractor workflows remain separate from employee payroll and tip pools.</p>
                <p><strong className="text-white">Modes:</strong> REAL, DEMO, and SANDBOX records remain separated.</p>
              </div>
            </motion.aside>
          </section>

          <motion.section
            {...reveal}
            className="mb-24 overflow-hidden rounded-[2rem] border border-[#8C4BFF]/25 bg-gradient-to-r from-[#031522] via-[#10091d] to-[#1b0e1d] p-8 md:p-12"
          >
            <Target className="h-8 w-8 text-[#00E4FF]" aria-hidden="true" />
            <p className="mt-7 text-sm font-black uppercase tracking-[0.26em] text-[#00E4FF]">Our mission</p>
            <h2 className="mt-4 max-w-5xl text-3xl font-black leading-tight text-white md:text-5xl font-space">
              Build infrastructure for creative sovereignty and accountable operations.
            </h2>
            <p className="mt-6 max-w-4xl text-lg leading-relaxed text-slate-300">
              Make ownership verifiable. Make permission visible. Make activity reconstructable.
              Build digital and real-world systems that can explain what happened.
            </p>
          </motion.section>

          <section className="mb-24">
            <SectionHeading
              eyebrow="Evidence before claims"
              title="Clear about what is built, connected, and still being developed"
              body="An implemented capability is not the same as a production deployment. Integration work is not an endorsement. Internal frameworks and research are identified for what they are."
            />
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {evidenceGroups.map((group) => (
                <motion.article key={group.label} {...reveal} className="rounded-2xl border border-white/10 bg-black/50 p-7">
                  <p className={"text-xs font-black uppercase tracking-[0.2em] " + group.accent}>{group.label}</p>
                  <h3 className="mt-3 text-lg font-bold text-white">{group.caption}</h3>
                  <ul className="mt-6 space-y-3">
                    {group.items.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-400">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.article>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-sm leading-relaxed text-slate-400">
              Payment providers, hospitality systems, and other external services retain their own
              underwriting, contracts, permissions, certification requirements, and production
              approval. GlyphLock is the technology and evidence provider—not the venue's bank,
              processor, merchant of record, or fund custodian.
            </div>
          </section>

          <section className="mb-24">
            <SectionHeading
              eyebrow="Leadership"
              title="A small team with direct responsibility"
              body="Product direction, financial strategy, and engineering delivery each have a named owner."
            />
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {leadership.map((leader) => {
                const Icon = leader.icon;
                return (
                  <motion.article key={leader.name} {...reveal} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-colors hover:border-[#00E4FF]/25">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#00E4FF] to-[#8C4BFF] shadow-[0_12px_35px_rgba(0,228,255,0.12)]">
                      <Icon className="h-6 w-6 text-black" aria-hidden="true" />
                    </div>
                    <h3 className="mt-6 text-2xl font-black text-white">{leader.name}</h3>
                    <p className="mt-2 text-xs font-black uppercase tracking-[0.17em] text-[#00E4FF]">{leader.title}</p>
                    <p className="mt-5 leading-relaxed text-slate-400">{leader.body}</p>
                  </motion.article>
                );
              })}
            </div>
          </section>

          <section className="mb-24">
            <SectionHeading
              eyebrow="Work with GlyphLock"
              title="Start with the workflow, then scope the system"
              body="Engagements are matched to the real people, permissions, hardware, records, integrations, and support requirements involved."
            />
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {engagementModels.map((model) => {
                const Icon = model.icon;
                return (
                  <motion.article key={model.title} {...reveal} className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-all hover:-translate-y-1 hover:border-[#8C4BFF]/35">
                    <Icon className="h-7 w-7 text-[#B78CFF]" aria-hidden="true" />
                    <h3 className="mt-6 text-2xl font-black text-white">{model.title}</h3>
                    <p className="mt-4 flex-1 leading-relaxed text-slate-400">{model.body}</p>
                    <Link to={model.to} className="mt-7 inline-flex items-center gap-2 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-[#00E4FF]">
                      {model.cta}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </Link>
                  </motion.article>
                );
              })}
            </div>
          </section>

          <motion.section
            {...reveal}
            className="relative overflow-hidden rounded-[2.25rem] border border-[#00E4FF]/30 bg-gradient-to-b from-[#05263b] via-[#091125] to-black p-8 text-center shadow-[0_35px_100px_rgba(0,0,0,0.5)] md:p-16"
          >
            <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(0,228,255,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(140,75,255,0.3)_1px,transparent_1px)] [background-size:32px_32px]" />
            <div className="relative z-10">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#00E4FF]">Build with evidence</p>
              <h2 className="mx-auto mt-5 max-w-4xl text-3xl font-black leading-tight text-white md:text-6xl font-space">
                Bring us the workflow that needs to be trusted.
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
                We will map the people, permissions, money, records, and authorized integrations
                required to make it operational.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/consultation"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 font-black text-black transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#00E4FF] focus:ring-offset-2 focus:ring-offset-black"
                >
                  Request a consultation
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
                <Link
                  to="/NUPSLanding"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-7 py-3.5 font-bold text-white transition-colors hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-white"
                >
                  See NUPS
                </Link>
              </div>
            </div>
          </motion.section>
        </div>
      </main>
    </>
  );
}