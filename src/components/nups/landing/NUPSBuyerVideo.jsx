import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  FileText,
  Fingerprint,
  Lock,
  Pause,
  Play,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  Signature,
  UserCheck,
  Volume2,
} from "lucide-react";

const MALE_VOICE_HINTS = [
  "guy", "christopher", "david", "mark", "brian", "james", "george", "ryan", "eric",
  "andrew", "daniel", "matthew", "liam", "thomas", "arthur", "oliver", "joey", "male",
];
const FEMALE_VOICE_HINTS = [
  "aria", "jenny", "samantha", "zira", "eva", "susan", "hazel", "victoria", "ava",
  "allison", "karen", "moira", "tessa", "serena", "female",
];

function pickMaleVoice(voices = []) {
  const english = voices.filter((voice) => /^en([-_]|$)/i.test(voice.lang || ""));
  const pool = english.length ? english : voices;
  if (!pool.length) return null;
  const score = (voice) => {
    const name = String(voice.name || "").toLowerCase();
    let points = /^en-US/i.test(voice.lang || "") ? 24 : /^en/i.test(voice.lang || "") ? 12 : 0;
    if (/natural|neural|premium|enhanced|online/.test(name)) points += 12;
    if (MALE_VOICE_HINTS.some((hint) => name.includes(hint))) points += 120;
    if (FEMALE_VOICE_HINTS.some((hint) => name.includes(hint))) points -= 180;
    return points;
  };
  return [...pool].sort((a, b) => score(b) - score(a))[0] || null;
}

const SCENES = [
  {
    eyebrow: "01 · VERIFY",
    title: "Identity starts the record",
    caption: "NUPS is the operating and evidence layer for high-verification venue commerce. Every transaction begins with a verified identity and a role-scoped operator.",
    visual: "identity",
  },
  {
    eyebrow: "02 · STRIPE NATIVE",
    title: "Process directly through GlyphLock / NUPS",
    caption: "When GlyphLock controls the payment path, NUPS can process natively through Stripe and bind the authorization, contract, receipt, and audit record together.",
    visual: "stripe",
  },
  {
    eyebrow: "03 · PROCESSOR OVERLAY",
    title: "Keep the venue's processor",
    caption: "When a venue keeps its existing processor and terminal, NUPS sits above that transaction, capturing the processor reference and approval evidence without forcing a processor migration.",
    visual: "overlay",
  },
  {
    eyebrow: "04 · ONE TRANSACTION",
    title: "Terms, services and approvals stay together",
    caption: "Terms, initials, signatures, services, and approvals remain attached to the same transaction record, whether the payment came through Stripe or an outside processor.",
    visual: "record",
  },
  {
    eyebrow: "05 · DISPUTE EVIDENCE",
    title: "Retrieve the transaction, not a pile of fragments",
    caption: "If a dispute arrives, NUPS retrieves the linked identity, agreement, payment reference, receipt, consent, and audit history for operator review and evidence assembly.",
    visual: "dispute",
  },
  {
    eyebrow: "06 · NUPS",
    title: "Two payment paths. One defensible record.",
    caption: "One venue operating system. Two payment paths. One defensible transaction record. This is NUPS by GlyphLock.",
    visual: "final",
  },
];

function Pill({ children, tone = "cyan" }) {
  const tones = {
    cyan: "border-cyan-300/25 bg-cyan-300/[0.08] text-cyan-100",
    green: "border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-100",
    violet: "border-violet-300/25 bg-violet-300/[0.08] text-violet-100",
    amber: "border-amber-300/25 bg-amber-300/[0.08] text-amber-100",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.15em] ${tones[tone]}`}>{children}</span>;
}

function Glass({ children, className = "" }) {
  return <div className={`rounded-2xl border border-white/10 bg-slate-950/60 shadow-[0_24px_80px_rgba(2,6,23,.44)] backdrop-blur-xl ${className}`}>{children}</div>;
}

function PulseDot({ delay = 0, tone = "cyan" }) {
  const cls = tone === "violet" ? "bg-violet-300 shadow-[0_0_20px_rgba(196,181,253,.85)]" : tone === "amber" ? "bg-amber-300 shadow-[0_0_20px_rgba(252,211,77,.85)]" : "bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,.85)]";
  return <motion.span className={`absolute h-2.5 w-2.5 rounded-full ${cls}`} animate={{ scale: [0.6, 1.35, 0.6], opacity: [0.35, 1, 0.35] }} transition={{ duration: 1.45, repeat: Infinity, delay }} />;
}

function FlowRail({ vertical = false, tone = "cyan", reverse = false, className = "" }) {
  const rail = tone === "violet" ? "from-violet-500/0 via-violet-300/80 to-violet-500/0" : tone === "amber" ? "from-amber-500/0 via-amber-300/80 to-amber-500/0" : "from-cyan-500/0 via-cyan-300/80 to-cyan-500/0";
  return (
    <div className={`relative overflow-hidden ${vertical ? "h-full w-px" : "h-px w-full"} bg-white/8 ${className}`}>
      <motion.div
        className={`absolute ${vertical ? "left-0 h-24 w-px" : "top-0 h-px w-28"} bg-gradient-to-${vertical ? "b" : "r"} ${rail}`}
        animate={vertical ? { y: reverse ? [220, -120] : [-120, 220] } : { x: reverse ? [260, -130] : [-130, 260] }}
        transition={{ duration: 1.65, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

function AmbientSceneFx({ accent = "cyan" }) {
  const glow = accent === "violet" ? "rgba(139,92,246,.24)" : accent === "amber" ? "rgba(245,158,11,.20)" : "rgba(34,211,238,.20)";
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div className="absolute left-[8%] top-[18%] h-56 w-56 rounded-full blur-3xl" style={{ background: glow }} animate={{ x: [0, 30, -10, 0], y: [0, -12, 18, 0], scale: [1, 1.15, .94, 1] }} transition={{ duration: 8, repeat: Infinity }} />
      <motion.div className="absolute bottom-[8%] right-[8%] h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" animate={{ x: [0, -25, 15, 0], y: [0, 20, -10, 0] }} transition={{ duration: 10, repeat: Infinity }} />
      <div className="absolute inset-0 opacity-[.11] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:42px_42px]" />
      <motion.div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-200/35 to-transparent" animate={{ top: ["6%", "92%", "6%"] }} transition={{ duration: 6.5, repeat: Infinity, ease: "linear" }} />
    </div>
  );
}

function IdentityScene() {
  return (
    <div className="relative h-full overflow-hidden rounded-[28px] border border-cyan-300/10 bg-slate-950/35 p-4 sm:p-6">
      <AmbientSceneFx />
      <div className="relative z-10 grid h-full items-center gap-6 lg:grid-cols-[.9fr_1.25fr]">
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} className="mx-auto w-full max-w-sm">
          <div className="relative mx-auto aspect-[.78] max-h-[300px] overflow-hidden rounded-[28px] border border-cyan-300/25 bg-gradient-to-b from-cyan-300/[.08] to-slate-950/90 shadow-[0_0_90px_rgba(34,211,238,.13)]">
            <div className="absolute inset-x-6 top-6 flex items-center justify-between"><Pill><Fingerprint className="h-3 w-3" />Identity scan</Pill><span className="font-mono text-[9px] text-cyan-200/60">ID-9A7F</span></div>
            <div className="absolute left-1/2 top-[54%] h-36 w-28 -translate-x-1/2 -translate-y-1/2 rounded-[42%_42%_46%_46%] border border-cyan-300/30 bg-cyan-300/[.035]">
              <div className="absolute left-1/2 top-4 h-12 w-12 -translate-x-1/2 rounded-full border border-cyan-300/25 bg-cyan-300/[.035]" />
              <div className="absolute bottom-4 left-1/2 h-14 w-20 -translate-x-1/2 rounded-t-[50%] border border-cyan-300/20 bg-cyan-300/[.025]" />
            </div>
            <motion.div className="absolute inset-x-7 h-[2px] bg-cyan-200 shadow-[0_0_20px_rgba(103,232,249,.95)]" animate={{ top: [70, 242, 70] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }} />
            {["ID MATCH", "ROLE CHECK", "CONSENT LINK"].map((label, index) => <motion.div key={label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .3 + index * .18 }} className="absolute left-5 flex items-center gap-2 text-[8px] font-black tracking-[.16em] text-emerald-200" style={{ bottom: 18 + index * 23 }}><CheckCircle2 className="h-3 w-3" />{label}</motion.div>)}
          </div>
        </motion.div>

        <div className="relative">
          <div className="absolute left-8 right-8 top-1/2 hidden h-px -translate-y-1/2 bg-cyan-300/15 md:block"><FlowRail /></div>
          <div className="relative grid gap-3 sm:grid-cols-3">
            {[
              [Fingerprint, "Guest", "Identity verified", "01"],
              [UserCheck, "Operator", "Role authorized", "02"],
              [Lock, "Record", "Transaction opened", "03"],
            ].map(([Icon, title, text, num], index) => (
              <motion.div key={title} initial={{ opacity: 0, y: 28, scale: .94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: .18 + index * .18, type: "spring", stiffness: 180 }}>
                <Glass className="relative overflow-hidden p-5">
                  <div className="absolute right-3 top-2 font-mono text-4xl font-black text-white/[.025]">{num}</div>
                  <motion.div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/[.08]" animate={{ boxShadow: ["0 0 0 rgba(34,211,238,0)", "0 0 30px rgba(34,211,238,.18)", "0 0 0 rgba(34,211,238,0)"] }} transition={{ duration: 2.2, repeat: Infinity, delay: index * .3 }}><Icon className="h-6 w-6 text-cyan-300" /></motion.div>
                  <div className="mt-5 text-sm font-black text-white">{title}</div>
                  <div className="mt-1 text-xs text-slate-400">{text}</div>
                  <div className="mt-4"><Pill tone="green"><BadgeCheck className="h-3 w-3" />Passed</Pill></div>
                </Glass>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StripeScene() {
  const proof = [
    [FileCheck2, "Contract", "Bound"],
    [ReceiptText, "Receipt", "Bound"],
    [ShieldCheck, "Audit", "Sealed"],
  ];
  return (
    <div className="relative h-full overflow-hidden rounded-[28px] border border-violet-300/10 bg-slate-950/35 p-4 sm:p-6">
      <AmbientSceneFx accent="violet" />
      <div className="relative z-10 grid h-full items-center gap-5 lg:grid-cols-[.78fr_1.22fr]">
        <motion.div initial={{ opacity: 0, rotateY: -16, x: -24 }} animate={{ opacity: 1, rotateY: 0, x: 0 }} transition={{ duration: .55 }} className="perspective-[900px]">
          <Glass className="relative overflow-hidden border-violet-300/20 p-5 sm:p-6">
            <motion.div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-500/20 blur-3xl" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 3, repeat: Infinity }} />
            <div className="relative flex items-center justify-between"><Pill tone="violet"><CreditCard className="h-3 w-3" />Stripe native</Pill><span className="font-mono text-[9px] text-slate-500">LIVE PAYMENT RAIL</span></div>
            <div className="relative mt-6 rounded-2xl border border-violet-300/18 bg-gradient-to-br from-violet-500/[.14] via-blue-500/[.08] to-cyan-400/[.05] p-5">
              <div className="text-[9px] font-black uppercase tracking-[.2em] text-violet-200/80">Authorization</div>
              <motion.div className="mt-2 text-4xl font-black text-white" initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .2, type: "spring" }}>$1,908<span className="text-xl text-slate-400">.00</span></motion.div>
              <div className="mt-4 flex items-center justify-between"><span className="font-mono text-[10px] text-slate-400">PAY-240812-A1</span><Pill tone="green"><BadgeCheck className="h-3 w-3" />Authorized</Pill></div>
              <motion.div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/8"><motion.div className="h-full bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-300" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1.1, ease: "easeOut" }} /></motion.div>
            </div>
          </Glass>
        </motion.div>

        <div className="relative flex min-h-[260px] items-center justify-center">
          <div className="absolute left-0 right-0 top-1/2 h-px bg-white/8"><FlowRail tone="violet" /></div>
          <motion.div initial={{ opacity: 0, scale: .5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .22, type: "spring" }} className="relative z-20 flex h-28 w-28 items-center justify-center rounded-full border border-violet-300/30 bg-slate-950 shadow-[0_0_80px_rgba(139,92,246,.22)]">
            <motion.div className="absolute inset-2 rounded-full border border-violet-300/20" animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}><PulseDot delay={0} tone="violet" /><PulseDot delay={.7} tone="violet" /></motion.div>
            <Lock className="h-10 w-10 text-violet-200" />
          </motion.div>
          <div className="absolute inset-x-0 bottom-0 grid grid-cols-3 gap-2">
            {proof.map(([Icon, title, status], index) => <motion.div key={title} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .48 + index * .15 }}><Glass className="p-3 text-center"><Icon className="mx-auto h-5 w-5 text-cyan-300" /><div className="mt-2 text-xs font-black text-white">{title}</div><div className="mt-1 text-[8px] font-black uppercase tracking-[.16em] text-emerald-300">{status}</div></Glass></motion.div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverlayScene() {
  const captures = ["Auth code", "Processor ref", "Receipt", "Contract + ID"];
  return (
    <div className="relative h-full overflow-hidden rounded-[28px] border border-amber-300/10 bg-slate-950/35 p-4 sm:p-6">
      <AmbientSceneFx accent="amber" />
      <div className="relative z-10 grid h-full items-center gap-4 lg:grid-cols-[.84fr_.34fr_1.12fr]">
        <motion.div initial={{ opacity: 0, x: -32 }} animate={{ opacity: 1, x: 0 }}>
          <Glass className="relative overflow-hidden border-amber-300/20 p-5">
            <div className="flex items-center justify-between"><Pill tone="amber"><Building2 className="h-3 w-3" />Venue processor</Pill><span className="text-[8px] font-black uppercase tracking-[.18em] text-amber-200/65">unchanged</span></div>
            <div className="mx-auto mt-5 max-w-[230px] rounded-[26px] border border-white/12 bg-gradient-to-b from-slate-800 to-slate-950 p-4 shadow-[0_20px_60px_rgba(0,0,0,.55)]">
              <div className="rounded-xl border border-amber-300/16 bg-amber-300/[.05] p-4 text-center"><CreditCard className="mx-auto h-7 w-7 text-amber-300" /><div className="mt-2 text-2xl font-black text-white">$1,908.00</div><div className="mt-1 text-[9px] uppercase tracking-[.16em] text-slate-500">Approved</div></div>
              <div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-lg bg-white/[.04] p-2"><div className="text-[8px] uppercase text-slate-600">Auth</div><div className="mt-1 font-mono text-[10px] text-white">A91K7P</div></div><div className="rounded-lg bg-white/[.04] p-2"><div className="text-[8px] uppercase text-slate-600">Ref</div><div className="mt-1 font-mono text-[10px] text-white">88421</div></div></div>
            </div>
          </Glass>
        </motion.div>

        <div className="relative hidden h-[280px] items-center justify-center lg:flex">
          <div className="absolute h-full w-px bg-white/8"><FlowRail vertical tone="amber" /></div>
          {[0,1,2].map((i) => <motion.div key={i} className="absolute h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_22px_rgba(252,211,77,.95)]" animate={{ y: [-110, 110], opacity: [0,1,1,0] }} transition={{ duration: 1.8, repeat: Infinity, delay: i * .48, ease: "linear" }} />)}
          <motion.div className="z-10 flex h-12 w-12 items-center justify-center rounded-full border border-cyan-300/30 bg-slate-950 shadow-[0_0_50px_rgba(34,211,238,.18)]" animate={{ scale: [1,1.08,1] }} transition={{ duration: 1.8, repeat: Infinity }}><ArrowRight className="h-5 w-5 text-cyan-300" /></motion.div>
        </div>

        <motion.div initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .18 }}>
          <Glass className="relative overflow-hidden border-cyan-300/20 p-5">
            <div className="flex items-center justify-between"><Pill><ShieldCheck className="h-3 w-3" />NUPS overlay</Pill><Pill tone="green">No migration</Pill></div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {captures.map((item, index) => <motion.div key={item} initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .35 + index * .12 }} className="relative overflow-hidden rounded-xl border border-cyan-300/12 bg-cyan-300/[.035] p-3"><motion.div className="absolute inset-y-0 left-0 w-[2px] bg-cyan-300" initial={{ height: 0 }} animate={{ height: "100%" }} transition={{ delay: .38 + index * .12, duration: .35 }} /><CheckCircle2 className="h-4 w-4 text-emerald-300" /><div className="mt-2 text-[11px] font-black text-white">{item}</div><div className="mt-1 text-[8px] uppercase tracking-[.16em] text-cyan-200/55">captured</div></motion.div>)}
            </div>
            <div className="mt-4 rounded-xl border border-emerald-300/16 bg-emerald-300/[.045] p-3 text-center text-[10px] font-black uppercase tracking-[.16em] text-emerald-200">Existing processor · NUPS evidence layer</div>
          </Glass>
        </motion.div>
      </div>
    </div>
  );
}

function RecordScene() {
  const docs = [
    [FileText, "Terms", "Version locked"],
    [Signature, "Signatures", "Guest + operator"],
    [ReceiptText, "Services", "Items + totals"],
    [BadgeCheck, "Approval", "Authorization trail"],
  ];
  return (
    <div className="relative h-full overflow-hidden rounded-[28px] border border-cyan-300/10 bg-slate-950/35 p-4 sm:p-6">
      <AmbientSceneFx />
      <div className="relative z-10 flex h-full items-center justify-center">
        <div className="relative w-full max-w-5xl">
          <div className="absolute left-1/2 top-1/2 h-px w-[68%] -translate-x-1/2 -translate-y-1/2 bg-cyan-300/10"><FlowRail /></div>
          <div className="grid items-center gap-5 lg:grid-cols-[1fr_.9fr]">
            <div className="relative h-[285px]">
              {docs.map(([Icon, title, text], index) => {
                const pos = ["left-0 top-0", "right-0 top-0", "left-0 bottom-0", "right-0 bottom-0"][index];
                return <motion.div key={title} className={`absolute ${pos} w-[46%]`} initial={{ opacity: 0, scale: .8, x: index % 2 ? 30 : -30, y: index > 1 ? 20 : -20 }} animate={{ opacity: 1, scale: 1, x: 0, y: 0 }} transition={{ delay: .1 + index * .13, type: "spring", stiffness: 180 }}><Glass className="p-4"><div className="flex items-start justify-between"><Icon className="h-5 w-5 text-cyan-300" /><Pill tone="green">Linked</Pill></div><div className="mt-3 text-xs font-black text-white">{title}</div><div className="mt-1 text-[9px] text-slate-500">{text}</div></Glass></motion.div>;
              })}
              <motion.div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-300/30 bg-slate-950 shadow-[0_0_70px_rgba(34,211,238,.22)]" animate={{ boxShadow: ["0 0 40px rgba(34,211,238,.10)", "0 0 85px rgba(34,211,238,.28)", "0 0 40px rgba(34,211,238,.10)"] }} transition={{ duration: 2.2, repeat: Infinity }}><Lock className="h-9 w-9 text-cyan-300" /></motion.div>
            </div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .35 }}>
              <Glass className="relative overflow-hidden border-emerald-300/20 p-5">
                <motion.div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-cyan-300 via-emerald-300 to-violet-300" animate={{ opacity: [.35,1,.35] }} transition={{ duration: 2, repeat: Infinity }} />
                <div className="text-[9px] font-black uppercase tracking-[.24em] text-cyan-300">Unified transaction record</div>
                <div className="mt-2 font-mono text-2xl font-black text-white">NUPS-TX-9F2A4C</div>
                <div className="mt-5 grid grid-cols-2 gap-2"><div className="rounded-xl border border-violet-300/18 bg-violet-300/[.055] p-3"><div className="text-[8px] uppercase tracking-wider text-violet-300">Path A</div><div className="mt-1 text-xs font-black text-white">Stripe native</div></div><div className="rounded-xl border border-amber-300/18 bg-amber-300/[.055] p-3"><div className="text-[8px] uppercase tracking-wider text-amber-300">Path B</div><div className="mt-1 text-xs font-black text-white">External processor</div></div></div>
                <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-300/20 bg-emerald-300/[.05] p-3"><div><div className="text-[8px] uppercase tracking-[.16em] text-emerald-300">Evidence state</div><div className="mt-1 text-xs font-black text-white">Bound to one record</div></div><motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 1.7, repeat: Infinity }}><ShieldCheck className="h-6 w-6 text-emerald-300" /></motion.div></div>
              </Glass>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DisputeScene() {
  const evidence = [
    [Fingerprint, "Identity"],
    [FileCheck2, "Agreement"],
    [CreditCard, "Payment ref"],
    [ReceiptText, "Receipt"],
    [Signature, "Consent"],
    [ShieldCheck, "Audit history"],
  ];
  return (
    <div className="relative h-full overflow-hidden rounded-[28px] border border-amber-300/10 bg-slate-950/35 p-4 sm:p-6">
      <AmbientSceneFx accent="amber" />
      <div className="relative z-10 h-full">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex max-w-xl items-center justify-between rounded-2xl border border-amber-300/22 bg-amber-300/[.055] px-4 py-3 shadow-[0_0_50px_rgba(245,158,11,.10)]"><div className="flex items-center gap-3"><motion.span animate={{ scale: [1,1.25,1] }} transition={{ duration: 1.2, repeat: Infinity }}><AlertTriangle className="h-5 w-5 text-amber-300" /></motion.span><div><div className="text-[9px] font-black uppercase tracking-[.18em] text-amber-300">Dispute received</div><div className="mt-0.5 font-mono text-xs font-bold text-white">MATCHED · NUPS-TX-9F2A4C</div></div></div><Pill tone="amber">Review</Pill></motion.div>

        <div className="relative mx-auto mt-5 h-[245px] max-w-5xl">
          <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/25 bg-slate-950 shadow-[0_0_90px_rgba(16,185,129,.18)]">
            <motion.div className="absolute inset-2 rounded-full border border-dashed border-emerald-300/25" animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} />
            <div className="absolute inset-0 flex items-center justify-center"><FileCheck2 className="h-10 w-10 text-emerald-300" /></div>
            <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-[9px] font-black uppercase tracking-[.18em] text-emerald-300">Evidence assembly</div>
          </div>

          {evidence.map(([Icon, item], index) => {
            const angle = (index / evidence.length) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * 42;
            const y = Math.sin(angle) * 36;
            return (
              <motion.div key={item} className="absolute left-1/2 top-1/2 w-28" style={{ marginLeft: "-3.5rem", marginTop: "-2.2rem" }} initial={{ opacity: 0, x: `${x * 2.4}%`, y: `${y * 2.4}%`, scale: .72 }} animate={{ opacity: 1, x: `${x * 3.6}%`, y: `${y * 3.2}%`, scale: 1 }} transition={{ delay: .16 + index * .1, type: "spring", stiffness: 140 }}>
                <Glass className="p-3 text-center"><Icon className="mx-auto h-4 w-4 text-cyan-300" /><div className="mt-2 text-[10px] font-black text-white">{item}</div><div className="mt-1 text-[8px] uppercase tracking-[.14em] text-emerald-300">Retrieved</div></Glass>
              </motion.div>
            );
          })}
          {[0,1,2,3].map((i) => <motion.div key={i} className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_20px_rgba(110,231,183,.9)]" animate={{ x: [i % 2 ? 130 : -130, 0], y: [i < 2 ? -70 : 70, 0], opacity: [0,1,0] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * .25 }} />)}
        </div>
      </div>
    </div>
  );
}

function FinalScene() {
  return (
    <div className="relative h-full overflow-hidden rounded-[28px] border border-cyan-300/12 bg-slate-950/40">
      <AmbientSceneFx />
      <div className="absolute inset-0 flex items-center justify-center">
        {[220, 340, 480].map((size, index) => <motion.div key={size} className="absolute rounded-full border border-cyan-300/10" style={{ width: size, height: size }} animate={{ rotate: index % 2 ? -360 : 360, scale: [1,1.03,1] }} transition={{ rotate: { duration: 16 + index * 6, repeat: Infinity, ease: "linear" }, scale: { duration: 3.5, repeat: Infinity } }} />)}
      </div>
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-4">
        <motion.div initial={{ scale: .45, opacity: 0, rotate: -14 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 145, damping: 13 }} className="relative flex h-24 w-24 items-center justify-center rounded-[28px] border border-cyan-300/35 bg-cyan-300/[.08] shadow-[0_0_110px_rgba(34,211,238,.28)]"><motion.div className="absolute inset-2 rounded-[22px] border border-cyan-300/18" animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} /><Lock className="h-11 w-11 text-cyan-300" /></motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 }} className="mt-5 text-[10px] font-black uppercase tracking-[.55em] text-cyan-300">GlyphLock</motion.div>
        <motion.div initial={{ opacity: 0, scale: .85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .3 }} className="mt-2 bg-gradient-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-5xl font-black tracking-[-.05em] text-transparent sm:text-7xl">NUPS</motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .45 }} className="mt-3 text-xl font-black text-slate-200 sm:text-2xl">Two payment paths. One defensible record.</motion.div>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .6 }} className="mt-5 flex flex-wrap justify-center gap-2"><Pill tone="violet"><CreditCard className="h-3 w-3" />Stripe native</Pill><Pill tone="amber"><Building2 className="h-3 w-3" />Processor overlay</Pill><Pill tone="green"><ShieldCheck className="h-3 w-3" />Unified evidence</Pill></motion.div>
      </div>
    </div>
  );
}

function SceneVisual({ type }) {
  if (type === "identity") return <IdentityScene />;
  if (type === "stripe") return <StripeScene />;
  if (type === "overlay") return <OverlayScene />;
  if (type === "record") return <RecordScene />;
  if (type === "dispute") return <DisputeScene />;
  return <FinalScene />;
}

export default function NUPSBuyerVideo() {
  const navigate = useNavigate();
  const utteranceRef = useRef(null);
  const sequenceRef = useRef(0);
  const sceneRef = useRef(0);
  const [scene, setScene] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [finished, setFinished] = useState(false);
  const [voiceError, setVoiceError] = useState(false);
  const [voiceLabel, setVoiceLabel] = useState("Loading male voice…");

  const cue = SCENES[scene];

  const resolveVoice = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
    const voice = pickMaleVoice(window.speechSynthesis.getVoices?.() || []);
    if (voice) setVoiceLabel(voice.name);
    return voice;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVoiceError(true);
      setVoiceLabel("Narration unavailable");
      return undefined;
    }
    const synth = window.speechSynthesis;
    const hydrate = () => resolveVoice();
    hydrate();
    synth.addEventListener?.("voiceschanged", hydrate);
    return () => {
      sequenceRef.current += 1;
      synth.cancel();
      synth.removeEventListener?.("voiceschanged", hydrate);
    };
  }, [resolveVoice]);

  const speakScene = useCallback((sceneIndex, sequenceId) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setVoiceError(true);
      setPlaying(false);
      return;
    }
    if (sequenceId !== sequenceRef.current) return;
    const synth = window.speechSynthesis;
    const sceneData = SCENES[sceneIndex];
    const voice = resolveVoice();
    const utterance = new SpeechSynthesisUtterance(sceneData.caption);
    utteranceRef.current = utterance;
    sceneRef.current = sceneIndex;
    setScene(sceneIndex);
    setSceneProgress(0);
    setVoiceError(false);
    if (voice) utterance.voice = voice;
    utterance.rate = 1.01;
    utterance.pitch = voice ? 0.9 : 0.78;
    utterance.volume = 1;
    utterance.onboundary = (event) => {
      if (sequenceId !== sequenceRef.current || sceneRef.current !== sceneIndex) return;
      const length = Math.max(sceneData.caption.length, 1);
      setSceneProgress(Math.min(Math.max((event.charIndex || 0) / length, 0), 0.96));
    };
    utterance.onend = () => {
      if (sequenceId !== sequenceRef.current) return;
      setSceneProgress(1);
      if (sceneIndex < SCENES.length - 1) window.setTimeout(() => speakScene(sceneIndex + 1, sequenceId), 180);
      else {
        setPlaying(false);
        setFinished(true);
      }
    };
    utterance.onerror = (event) => {
      if (sequenceId !== sequenceRef.current || event.error === "canceled" || event.error === "interrupted") return;
      console.error("[NUPSBuyerVideo] narration error", event.error);
      setVoiceError(true);
      setPlaying(false);
    };
    synth.speak(utterance);
  }, [resolveVoice]);

  const startFrom = useCallback((sceneIndex = 0) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVoiceError(true);
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    sequenceRef.current += 1;
    const id = sequenceRef.current;
    sceneRef.current = sceneIndex;
    setFinished(false);
    setPlaying(true);
    setScene(sceneIndex);
    setSceneProgress(0);
    window.setTimeout(() => speakScene(sceneIndex, id), 80);
  }, [speakScene]);

  const toggle = useCallback(() => {
    if (finished) {
      startFrom(0);
      return;
    }
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVoiceError(true);
      return;
    }
    const synth = window.speechSynthesis;
    if (playing) {
      synth.pause();
      setPlaying(false);
    } else if (synth.paused) {
      synth.resume();
      setPlaying(true);
    } else startFrom(sceneRef.current || 0);
  }, [finished, playing, startFrom]);

  const replay = useCallback(() => startFrom(0), [startFrom]);
  const progress = useMemo(() => ((scene + sceneProgress) / SCENES.length) * 100, [scene, sceneProgress]);

  return (
    <section className="relative w-full overflow-hidden bg-[#020617]" aria-label="NUPS buyer demonstration video">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,.2),transparent_42%),radial-gradient(circle_at_80%_60%,rgba(124,58,237,.12),transparent_40%)]" />
      <div className="relative mx-auto w-full max-w-[1500px] px-3 pb-4 pt-3 sm:px-5 sm:pt-5">
        <div className="overflow-hidden rounded-3xl border border-cyan-300/20 bg-[#030816] shadow-[0_34px_120px_rgba(0,0,0,.58),0_0_80px_rgba(34,211,238,.07)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 bg-slate-950/88 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/[.07]"><Lock className="h-4 w-4 text-cyan-300" /></span><div><div className="text-xs font-black tracking-[.22em] text-white">GLYPHLOCK · NUPS</div><div className="mt-0.5 text-[9px] uppercase tracking-[.16em] text-slate-500">Cinematic buyer demonstration · scene-locked male narration</div></div></div>
            <div className="flex flex-wrap items-center gap-2"><Pill tone="green"><BadgeCheck className="h-3 w-3" />Live core</Pill><Pill tone="violet"><CreditCard className="h-3 w-3" />Stripe native</Pill><Pill tone="amber"><Building2 className="h-3 w-3" />Processor overlay</Pill></div>
          </div>

          <div className="relative aspect-[16/9] min-h-[560px] overflow-hidden bg-[#020713]">
            <motion.div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" animate={{ x: [0, 100, 20, 0], y: [0, -30, 35, 0] }} transition={{ duration: 12, repeat: Infinity }} />
            <motion.div className="absolute -right-24 bottom-24 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" animate={{ x: [0, -90, -20, 0], y: [0, 35, -20, 0] }} transition={{ duration: 14, repeat: Infinity }} />

            <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-4 p-5 sm:p-7">
              <div><div className="text-[10px] font-black uppercase tracking-[.24em] text-cyan-300">{cue.eyebrow}</div><div className="mt-2 max-w-4xl text-2xl font-black leading-tight text-white sm:text-4xl">{cue.title}</div></div>
              <span className="shrink-0 font-mono text-[10px] text-slate-600">{String(scene + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}</span>
            </div>

            <div className="absolute inset-x-0 bottom-[148px] top-[116px] z-10 px-4 sm:px-6">
              <AnimatePresence mode="wait">
                <motion.div key={scene} initial={{ opacity: 0, scale: .985, filter: "blur(8px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 1.015, filter: "blur(8px)" }} transition={{ duration: .42 }} className="h-full">
                  <SceneVisual type={cue.visual} />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/8 bg-slate-950/94 p-4 backdrop-blur sm:p-5">
              <div className="mx-auto max-w-5xl text-center text-sm leading-6 text-slate-200 sm:text-base">{cue.caption}</div>
              {voiceError && <div className="mt-2 text-center text-xs font-bold text-amber-300">Narration is unavailable in this browser. The exact narration remains visible as captions.</div>}
            </div>

            {!playing && !finished && (
              <button type="button" onClick={toggle} className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/48 transition hover:bg-black/55" aria-label="Play NUPS buyer demo">
                <motion.span className="flex h-24 w-24 items-center justify-center rounded-full border border-cyan-100/30 bg-cyan-300 text-slate-950 shadow-[0_0_90px_rgba(34,211,238,.38)]" animate={{ boxShadow: ["0 0 50px rgba(34,211,238,.18)", "0 0 110px rgba(34,211,238,.48)", "0 0 50px rgba(34,211,238,.18)"] }} transition={{ duration: 2, repeat: Infinity }}><Play className="ml-1 h-10 w-10" fill="currentColor" /></motion.span>
                <span className="text-xs font-black uppercase tracking-[.22em] text-white">Play cinematic buyer demo</span>
              </button>
            )}

            {finished && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-slate-950/84 backdrop-blur-md">
                <div className="text-center"><div className="text-[10px] font-black uppercase tracking-[.35em] text-cyan-300">GlyphLock</div><div className="mt-3 text-6xl font-black tracking-[-.05em] text-white">NUPS</div><div className="mt-3 text-lg font-bold text-slate-300">Two payment paths. One defensible record.</div></div>
                <div className="flex flex-wrap justify-center gap-3"><button type="button" onClick={replay} className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/[.08] px-5 py-3 text-sm font-black text-white"><RotateCcw className="h-4 w-4" />Replay</button><button type="button" onClick={() => navigate("/NUPSKiosk")} className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-black text-white shadow-[0_0_50px_rgba(79,70,229,.22)]">Enter NUPS <ArrowRight className="h-4 w-4" /></button></div>
              </div>
            )}
          </div>

          <div className="border-t border-white/8 bg-slate-950/88 px-4 py-4 sm:px-5">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/7"><motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 shadow-[0_0_18px_rgba(34,211,238,.6)]" animate={{ width: `${progress}%` }} transition={{ duration: .15 }} /></div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2"><button type="button" onClick={finished ? replay : toggle} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/12 bg-white/[.04] px-4 py-2 text-sm font-black text-white">{playing ? <Pause className="h-4 w-4" /> : finished ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}{playing ? "Pause" : finished ? "Replay" : "Play"}</button><span title={voiceLabel} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-white/[.025] px-3 py-2 text-[10px] font-bold text-slate-400"><Volume2 className="h-4 w-4 text-cyan-300" />Male narration</span></div>
              <div className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-600">Motion and scene changes stay locked to narration</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
