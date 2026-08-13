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
  Database,
  FileCheck2,
  FileText,
  Fingerprint,
  Link2,
  Lock,
  Pause,
  Play,
  ReceiptText,
  RotateCcw,
  Search,
  ShieldCheck,
  Signature,
  UserCheck,
  Volume2,
  Zap,
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
  return <div className={`rounded-2xl border border-white/10 bg-slate-950/64 shadow-[0_24px_80px_rgba(2,6,23,.44)] backdrop-blur-xl ${className}`}>{children}</div>;
}

function reached(progress, at) {
  return Number(progress || 0) >= at;
}

function StepRow({ progress, at, label, detail, done = "Complete", tone = "cyan" }) {
  const active = reached(progress, at);
  const border = tone === "amber" ? "border-amber-300/25 bg-amber-300/[.07]" : tone === "violet" ? "border-violet-300/25 bg-violet-300/[.07]" : "border-cyan-300/25 bg-cyan-300/[.06]";
  return (
    <motion.div
      animate={{ opacity: active ? 1 : .42, x: active ? 0 : 10, scale: active ? 1 : .985 }}
      transition={{ duration: .28 }}
      className={`rounded-xl border px-3 py-2.5 ${active ? border : "border-white/8 bg-white/[.025]"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className={`text-[9px] font-black uppercase tracking-[.15em] ${active ? "text-white" : "text-slate-600"}`}>{label}</div>
          <div className={`mt-1 truncate text-[10px] ${active ? "text-slate-300" : "text-slate-700"}`}>{detail}</div>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[.12em] ${active ? "border-emerald-300/25 bg-emerald-300/[.08] text-emerald-200" : "border-white/8 text-slate-700"}`}>
          {active ? done : "Pending"}
        </span>
      </div>
    </motion.div>
  );
}

function AmbientSceneFx({ accent = "cyan" }) {
  const glow = accent === "violet" ? "rgba(139,92,246,.23)" : accent === "amber" ? "rgba(245,158,11,.19)" : "rgba(34,211,238,.20)";
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div className="absolute left-[8%] top-[18%] h-56 w-56 rounded-full blur-3xl" style={{ background: glow }} animate={{ x: [0, 30, -10, 0], y: [0, -12, 18, 0], scale: [1, 1.15, .94, 1] }} transition={{ duration: 8, repeat: Infinity }} />
      <motion.div className="absolute bottom-[8%] right-[8%] h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" animate={{ x: [0, -25, 15, 0], y: [0, 20, -10, 0] }} transition={{ duration: 10, repeat: Infinity }} />
      <div className="absolute inset-0 opacity-[.09] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:42px_42px]" />
      <motion.div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent" animate={{ top: ["6%", "92%", "6%"] }} transition={{ duration: 6.5, repeat: Infinity, ease: "linear" }} />
    </div>
  );
}

function IdentityScene({ progress }) {
  const scanning = !reached(progress, .28);
  const verified = reached(progress, .58);
  const operator = reached(progress, .78);
  const opened = reached(progress, .9);
  return (
    <div className="relative h-full overflow-hidden rounded-[28px] border border-cyan-300/10 bg-slate-950/35 p-4 sm:p-5">
      <AmbientSceneFx />
      <div className="relative z-10 grid h-full items-center gap-4 lg:grid-cols-[1.05fr_.95fr]">
        <Glass className="relative overflow-hidden p-4">
          <div className="flex items-center justify-between"><Pill><Fingerprint className="h-3 w-3" />Live identity intake</Pill><span className="font-mono text-[9px] text-slate-500">NEW TX · 9F2A4C</span></div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[.72fr_1.28fr]">
            <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-cyan-300/18 bg-gradient-to-b from-cyan-300/[.06] to-slate-950/90 p-3">
              <div className="text-[8px] font-black uppercase tracking-[.18em] text-cyan-300">Government ID</div>
              <div className="mx-auto mt-3 h-32 w-24 rounded-xl border border-white/10 bg-slate-900/90 p-2">
                <div className="h-10 w-10 rounded-lg border border-cyan-300/20 bg-cyan-300/[.04]" />
                <div className="mt-2 space-y-1.5"><div className="h-1.5 w-full rounded bg-white/12" /><div className="h-1.5 w-4/5 rounded bg-white/8" /><div className="h-1.5 w-3/5 rounded bg-white/8" /></div>
              </div>
              {scanning && <motion.div className="absolute inset-x-3 h-[2px] bg-cyan-200 shadow-[0_0_18px_rgba(103,232,249,.9)]" animate={{ top: [42, 190, 42] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />}
              <div className="mt-3 text-center"><Pill tone={verified ? "green" : "cyan"}>{verified ? <BadgeCheck className="h-3 w-3" /> : <Zap className="h-3 w-3" />}{verified ? "Identity verified" : "Scanning"}</Pill></div>
            </div>

            <div className="grid content-start gap-2">
              {[
                ["Guest name", reached(progress, .24) ? "Jordan Carter" : "Reading…"],
                ["Date of birth", reached(progress, .34) ? "08 / 14 / 1991" : "Reading…"],
                ["ID number", reached(progress, .44) ? "AZ D•••••218" : "Reading…"],
                ["Identity status", verified ? "VERIFIED" : "VALIDATING"],
                ["Operator role", operator ? "HOSTESS · AUTHORIZED" : "WAITING"],
              ].map(([label, value], index) => {
                const at = [.2, .3, .4, .56, .76][index];
                const active = reached(progress, at);
                return <motion.div key={label} animate={{ opacity: active ? 1 : .38, x: active ? 0 : 8 }} className={`rounded-xl border px-3 py-2 ${active ? "border-cyan-300/18 bg-cyan-300/[.04]" : "border-white/8 bg-white/[.02]"}`}><div className="text-[8px] uppercase tracking-[.15em] text-slate-600">{label}</div><div className={`mt-1 font-mono text-[10px] font-bold ${active ? "text-white" : "text-slate-700"}`}>{value}</div></motion.div>;
              })}
            </div>
          </div>
          <motion.div animate={{ opacity: opened ? 1 : .2, scale: opened ? 1 : .98 }} className={`mt-3 flex items-center justify-between rounded-xl border px-4 py-3 ${opened ? "border-emerald-300/25 bg-emerald-300/[.07]" : "border-white/8 bg-white/[.02]"}`}><div><div className="text-[8px] uppercase tracking-[.16em] text-slate-500">Transaction state</div><div className="mt-1 text-xs font-black text-white">{opened ? "Verified guest + authorized operator + record opened" : "Building verified transaction shell"}</div></div>{opened ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <Database className="h-5 w-5 text-slate-600" />}</motion.div>
        </Glass>

        <div className="space-y-2">
          <StepRow progress={progress} at={.12} label="Open transaction" detail="Create a new guest transaction shell" />
          <StepRow progress={progress} at={.28} label="Scan identity" detail="Read government-issued identification" />
          <StepRow progress={progress} at={.5} label="Validate guest" detail="Resolve identity into the guest record" />
          <StepRow progress={progress} at={.74} label="Authorize operator" detail="Apply role-scoped venue permissions" />
          <StepRow progress={progress} at={.9} label="Start verified record" detail="Bind guest and operator to transaction" done="Open" />
        </div>
      </div>
    </div>
  );
}

function StripeScene({ progress }) {
  const paymentState = progress < .34 ? "BUILDING ORDER" : progress < .58 ? "CREATING PAYMENT" : progress < .76 ? "AWAITING APPROVAL" : "AUTHORIZED";
  return (
    <div className="relative h-full overflow-hidden rounded-[28px] border border-violet-300/10 bg-slate-950/35 p-4 sm:p-5">
      <AmbientSceneFx accent="violet" />
      <div className="relative z-10 grid h-full items-center gap-4 lg:grid-cols-[.9fr_1.1fr]">
        <Glass className="p-4">
          <div className="flex items-center justify-between"><Pill tone="violet"><CreditCard className="h-3 w-3" />Stripe native</Pill><span className="font-mono text-[9px] text-slate-500">PAY-240812-A1</span></div>
          <div className="mt-3 rounded-2xl border border-white/9 bg-white/[.025] p-3">
            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[.14em] text-slate-500"><span>VIP Service</span><span className={reached(progress, .16) ? "text-white" : "text-slate-700"}>{reached(progress, .16) ? "$1,800.00" : "$0.00"}</span></div>
            <div className="mt-2 flex items-center justify-between text-[9px] font-black uppercase tracking-[.14em] text-slate-500"><span>Processing</span><span className={reached(progress, .28) ? "text-white" : "text-slate-700"}>{reached(progress, .28) ? "$108.00" : "$0.00"}</span></div>
            <div className="my-3 h-px bg-white/8" />
            <div className="flex items-center justify-between"><span className="text-[9px] font-black uppercase tracking-[.16em] text-violet-300">Total</span><motion.span animate={{ scale: reached(progress, .3) ? 1 : .9, opacity: reached(progress, .3) ? 1 : .4 }} className="text-2xl font-black text-white">{reached(progress, .3) ? "$1,908.00" : "$0.00"}</motion.span></div>
          </div>
          <div className="mt-3 rounded-2xl border border-violet-300/20 bg-gradient-to-br from-violet-500/[.12] to-blue-500/[.06] p-4">
            <div className="flex items-center justify-between"><div><div className="text-[8px] uppercase tracking-[.16em] text-slate-500">Stripe status</div><div className={`mt-1 text-sm font-black ${reached(progress, .76) ? "text-emerald-300" : "text-white"}`}>{paymentState}</div></div>{reached(progress, .76) ? <BadgeCheck className="h-7 w-7 text-emerald-300" /> : <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} className="h-7 w-7 rounded-full border-2 border-violet-300/20 border-t-violet-300" />}</div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8"><motion.div className="h-full bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-300" animate={{ width: `${Math.max(7, Math.min(100, progress * 100))}%` }} transition={{ duration: .18 }} /></div>
          </div>
        </Glass>

        <div className="grid gap-2">
          <StepRow progress={progress} at={.12} label="Add service" detail="VIP service enters the NUPS transaction" tone="violet" />
          <StepRow progress={progress} at={.28} label="Calculate total" detail="Items and configured fee resolve to $1,908" tone="violet" />
          <StepRow progress={progress} at={.48} label="Create Stripe payment" detail="Native payment path initializes" tone="violet" />
          <StepRow progress={progress} at={.76} label="Receive authorization" detail="Stripe approval returns to NUPS" tone="violet" done="Approved" />
          <div className="grid grid-cols-3 gap-2">
            {[
              [FileCheck2, "Contract", .82],
              [ReceiptText, "Receipt", .87],
              [ShieldCheck, "Audit", .92],
            ].map(([Icon, label, at]) => {
              const active = reached(progress, at);
              return <motion.div key={label} animate={{ opacity: active ? 1 : .3, y: active ? 0 : 10 }} className={`rounded-xl border p-3 text-center ${active ? "border-emerald-300/20 bg-emerald-300/[.055]" : "border-white/8 bg-white/[.02]"}`}><Icon className={`mx-auto h-4 w-4 ${active ? "text-emerald-300" : "text-slate-700"}`} /><div className={`mt-2 text-[9px] font-black uppercase tracking-[.12em] ${active ? "text-white" : "text-slate-700"}`}>{label}</div><div className={`mt-1 text-[8px] ${active ? "text-emerald-300" : "text-slate-800"}`}>{active ? "BOUND" : "WAITING"}</div></motion.div>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverlayScene({ progress }) {
  const approved = reached(progress, .3);
  const refCaptured = reached(progress, .48);
  const amountMatched = reached(progress, .66);
  const bound = reached(progress, .88);
  return (
    <div className="relative h-full overflow-hidden rounded-[28px] border border-amber-300/10 bg-slate-950/35 p-4 sm:p-5">
      <AmbientSceneFx accent="amber" />
      <div className="relative z-10 grid h-full items-center gap-4 lg:grid-cols-[.82fr_.2fr_.98fr]">
        <Glass className="p-4">
          <div className="flex items-center justify-between"><Pill tone="amber"><Building2 className="h-3 w-3" />Existing processor</Pill><span className="text-[8px] font-black uppercase tracking-[.15em] text-amber-200/65">Venue keeps merchant account</span></div>
          <div className="mx-auto mt-3 max-w-[250px] rounded-[24px] border border-white/12 bg-gradient-to-b from-slate-800 to-slate-950 p-3 shadow-[0_18px_50px_rgba(0,0,0,.55)]">
            <div className="rounded-xl border border-amber-300/15 bg-amber-300/[.045] p-3 text-center"><CreditCard className="mx-auto h-6 w-6 text-amber-300" /><div className="mt-2 text-2xl font-black text-white">$1,908.00</div><div className={`mt-1 text-[8px] font-black uppercase tracking-[.16em] ${approved ? "text-emerald-300" : "text-slate-500"}`}>{approved ? "APPROVED" : "PROCESSING"}</div></div>
            <div className="mt-2 grid grid-cols-2 gap-2"><div className="rounded-lg bg-white/[.04] p-2"><div className="text-[8px] uppercase text-slate-600">Auth</div><div className={`mt-1 font-mono text-[10px] ${approved ? "text-white" : "text-slate-700"}`}>{approved ? "A91K7P" : "••••••"}</div></div><div className="rounded-lg bg-white/[.04] p-2"><div className="text-[8px] uppercase text-slate-600">Ref</div><div className={`mt-1 font-mono text-[10px] ${refCaptured ? "text-white" : "text-slate-700"}`}>{refCaptured ? "PROC-88421" : "••••••••"}</div></div></div>
          </div>
          <motion.div animate={{ opacity: approved ? 1 : .28 }} className="mt-3 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-amber-200"><CheckCircle2 className="h-4 w-4" />{approved ? "Terminal approval complete" : "Waiting on terminal"}</motion.div>
        </Glass>

        <div className="relative hidden h-[230px] items-center justify-center lg:flex">
          <div className="absolute h-full w-px bg-white/8" />
          {[0, 1, 2].map((i) => <motion.div key={i} className={`absolute h-2.5 w-2.5 rounded-full ${approved ? "bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,.9)]" : "bg-slate-700"}`} animate={approved ? { y: [-95, 95], opacity: [0, 1, 1, 0] } : { opacity: .2 }} transition={{ duration: 1.5, repeat: Infinity, delay: i * .4, ease: "linear" }} />)}
          <div className="z-10 flex h-11 w-11 items-center justify-center rounded-full border border-cyan-300/25 bg-slate-950"><ArrowRight className="h-5 w-5 text-cyan-300" /></div>
        </div>

        <Glass className="p-4">
          <div className="flex items-center justify-between"><Pill><ShieldCheck className="h-3 w-3" />NUPS overlay</Pill><Pill tone="green">No migration</Pill></div>
          <div className="mt-3 space-y-2">
            <StepRow progress={progress} at={.12} label="Select overlay path" detail="Use venue-owned processor" tone="amber" />
            <StepRow progress={progress} at={.3} label="Capture approval" detail="Auth A91K7P enters NUPS" tone="amber" />
            <StepRow progress={progress} at={.48} label="Capture processor ref" detail="PROC-88421 links transaction" tone="amber" />
            <StepRow progress={progress} at={.66} label="Match amount" detail="$1,908 external total matches NUPS" tone="amber" />
            <StepRow progress={progress} at={.88} label="Bind evidence" detail="Receipt, contract and identity linked" tone="amber" done="Bound" />
          </div>
          <motion.div animate={{ opacity: bound ? 1 : .25 }} className={`mt-3 rounded-xl border p-3 text-center text-[9px] font-black uppercase tracking-[.14em] ${bound ? "border-emerald-300/20 bg-emerald-300/[.055] text-emerald-200" : "border-white/8 text-slate-700"}`}>{bound ? "External processor proof bound to NUPS" : amountMatched ? "Matching transaction evidence" : "Awaiting processor evidence"}</motion.div>
        </Glass>
      </div>
    </div>
  );
}

function RecordScene({ progress }) {
  const initials = reached(progress, .52);
  const signed = reached(progress, .68);
  const receipt = reached(progress, .82);
  const unified = reached(progress, .92);
  return (
    <div className="relative h-full overflow-hidden rounded-[28px] border border-cyan-300/10 bg-slate-950/35 p-4 sm:p-5">
      <AmbientSceneFx />
      <div className="relative z-10 grid h-full items-center gap-4 lg:grid-cols-[1.05fr_.95fr]">
        <Glass className="relative overflow-hidden p-4">
          <div className="flex items-center justify-between"><Pill><FileText className="h-3 w-3" />Live agreement</Pill><span className="font-mono text-[9px] text-slate-500">GL-VIP-2026 · v14</span></div>
          <div className="mt-3 rounded-2xl border border-white/9 bg-white/[.025] p-4">
            <div className="h-2.5 w-2/3 rounded bg-white/14" />
            <div className="mt-3 space-y-2"><div className="h-1.5 w-full rounded bg-white/7" /><div className="h-1.5 w-[92%] rounded bg-white/7" /><div className="h-1.5 w-[78%] rounded bg-white/7" /></div>
            <div className="mt-4 grid grid-cols-2 gap-2"><div className={`rounded-lg border p-2.5 ${initials ? "border-emerald-300/20 bg-emerald-300/[.055]" : "border-white/8"}`}><div className="text-[8px] uppercase tracking-[.14em] text-slate-600">Required initials</div><div className={`mt-2 text-sm font-black ${initials ? "text-white" : "text-slate-700"}`}>{initials ? "CE ✓" : "_____"}</div></div><div className={`rounded-lg border p-2.5 ${signed ? "border-emerald-300/20 bg-emerald-300/[.055]" : "border-white/8"}`}><div className="text-[8px] uppercase tracking-[.14em] text-slate-600">Guest signature</div>{signed ? <motion.div initial={{ pathLength: 0, opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-lg font-black italic text-cyan-100">Jordan C.</motion.div> : <div className="mt-2 h-5 border-b border-slate-700" />}</div></div>
            <div className={`mt-3 flex items-center justify-between rounded-xl border p-3 ${receipt ? "border-cyan-300/18 bg-cyan-300/[.045]" : "border-white/8"}`}><div className="flex items-center gap-2"><ReceiptText className={`h-4 w-4 ${receipt ? "text-cyan-300" : "text-slate-700"}`} /><div><div className="text-[8px] uppercase tracking-[.14em] text-slate-600">Receipt</div><div className={`mt-1 font-mono text-[10px] ${receipt ? "text-white" : "text-slate-700"}`}>{receipt ? "RCPT-9F2A4C · $1,908" : "Waiting"}</div></div></div>{receipt && <Pill tone="green">Linked</Pill>}</div>
          </div>
        </Glass>

        <div className="space-y-2">
          <StepRow progress={progress} at={.12} label="Load terms" detail="Correct contract version opens" />
          <StepRow progress={progress} at={.32} label="Attach services" detail="Items and totals bind to agreement" />
          <StepRow progress={progress} at={.52} label="Capture initials" detail="Required acknowledgments complete" />
          <StepRow progress={progress} at={.68} label="Apply signature" detail="Guest signature binds to agreement" />
          <StepRow progress={progress} at={.82} label="Link receipt" detail="Payment output joins the same record" />
          <motion.div animate={{ opacity: unified ? 1 : .22, scale: unified ? 1 : .97 }} className={`rounded-2xl border p-4 ${unified ? "border-emerald-300/25 bg-emerald-300/[.065]" : "border-white/8 bg-white/[.02]"}`}><div className="flex items-center gap-3"><div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${unified ? "border-emerald-300/25 bg-emerald-300/[.08]" : "border-white/8"}`}><Lock className={`h-5 w-5 ${unified ? "text-emerald-300" : "text-slate-700"}`} /></div><div><div className="text-[8px] uppercase tracking-[.16em] text-slate-600">Unified transaction</div><div className="mt-1 font-mono text-xs font-black text-white">NUPS-TX-9F2A4C</div><div className={`mt-1 text-[9px] font-bold ${unified ? "text-emerald-300" : "text-slate-700"}`}>{unified ? "IDENTITY · CONTRACT · PAYMENT · RECEIPT · AUDIT LINKED" : "ASSEMBLING RECORD"}</div></div></div></motion.div>
        </div>
      </div>
    </div>
  );
}

function DisputeScene({ progress }) {
  const found = reached(progress, .24);
  const evidence = [
    [Fingerprint, "Identity", .38],
    [FileCheck2, "Agreement", .48],
    [CreditCard, "Payment ref", .58],
    [ReceiptText, "Receipt", .68],
    [Signature, "Consent", .76],
    [ShieldCheck, "Audit history", .84],
  ];
  const ready = reached(progress, .92);
  return (
    <div className="relative h-full overflow-hidden rounded-[28px] border border-amber-300/10 bg-slate-950/35 p-4 sm:p-5">
      <AmbientSceneFx accent="amber" />
      <div className="relative z-10 grid h-full items-center gap-4 lg:grid-cols-[.8fr_1.2fr]">
        <Glass className="p-4">
          <div className="flex items-center gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[.055] p-3"><motion.div animate={{ scale: [1, 1.18, 1] }} transition={{ duration: 1.2, repeat: Infinity }}><AlertTriangle className="h-5 w-5 text-amber-300" /></motion.div><div><div className="text-[8px] font-black uppercase tracking-[.16em] text-amber-300">Dispute received</div><div className="mt-1 text-[10px] text-slate-300">Operator opens evidence search</div></div></div>
          <div className="mt-3 rounded-xl border border-white/9 bg-white/[.025] p-3"><div className="flex items-center gap-2"><Search className="h-4 w-4 text-cyan-300" /><span className="font-mono text-[10px] text-white">NUPS-TX-9F2A4C</span><motion.span animate={{ opacity: found ? 1 : .25 }} className={`ml-auto text-[8px] font-black uppercase tracking-[.14em] ${found ? "text-emerald-300" : "text-slate-700"}`}>{found ? "MATCH FOUND" : "SEARCHING"}</motion.span></div></div>
          <div className="mt-3 space-y-2">
            <StepRow progress={progress} at={.12} label="Search transaction" detail="Locate transaction by NUPS ID" tone="amber" />
            <StepRow progress={progress} at={.24} label="Open matched record" detail="Load verified transaction context" tone="amber" />
            <StepRow progress={progress} at={.38} label="Retrieve evidence" detail="Pull linked source records" tone="amber" />
            <StepRow progress={progress} at={.92} label="Prepare review packet" detail="Assemble sources for operator review" tone="amber" done="Ready" />
          </div>
        </Glass>

        <Glass className="p-4">
          <div className="flex items-center justify-between"><Pill tone="green"><FileCheck2 className="h-3 w-3" />Evidence assembly</Pill><span className="font-mono text-[9px] text-slate-500">CASE · DSP-88421</span></div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {evidence.map(([Icon, label, at]) => {
              const active = reached(progress, at);
              return <motion.div key={label} animate={{ opacity: active ? 1 : .26, scale: active ? 1 : .95, y: active ? 0 : 8 }} className={`rounded-xl border p-3 text-center ${active ? "border-emerald-300/22 bg-emerald-300/[.055]" : "border-white/8 bg-white/[.02]"}`}><Icon className={`mx-auto h-5 w-5 ${active ? "text-cyan-300" : "text-slate-700"}`} /><div className={`mt-2 text-[9px] font-black ${active ? "text-white" : "text-slate-700"}`}>{label}</div><div className={`mt-1 text-[8px] font-black uppercase tracking-[.12em] ${active ? "text-emerald-300" : "text-slate-800"}`}>{active ? "RETRIEVED" : "WAITING"}</div></motion.div>;
            })}
          </div>
          <motion.div animate={{ opacity: ready ? 1 : .2, scale: ready ? 1 : .98 }} className={`mt-3 rounded-2xl border p-4 ${ready ? "border-emerald-300/25 bg-emerald-300/[.07]" : "border-white/8 bg-white/[.02]"}`}><div className="flex items-center justify-between gap-3"><div><div className="text-[8px] uppercase tracking-[.16em] text-slate-600">Review state</div><div className="mt-1 text-sm font-black text-white">{ready ? "Evidence assembly ready for operator review" : "Retrieving linked evidence sources"}</div></div>{ready ? <ShieldCheck className="h-7 w-7 text-emerald-300" /> : <Database className="h-7 w-7 text-slate-700" />}</div></motion.div>
        </Glass>
      </div>
    </div>
  );
}

function FinalScene({ progress }) {
  const stripe = reached(progress, .18);
  const overlay = reached(progress, .34);
  const merge = reached(progress, .56);
  const final = reached(progress, .76);
  return (
    <div className="relative h-full overflow-hidden rounded-[28px] border border-cyan-300/12 bg-slate-950/40 p-4 sm:p-5">
      <AmbientSceneFx />
      <div className="relative z-10 flex h-full flex-col items-center justify-center">
        <div className="grid w-full max-w-5xl items-center gap-4 md:grid-cols-[1fr_.34fr_1fr]">
          <motion.div animate={{ opacity: stripe ? 1 : .2, x: stripe ? 0 : -18 }}><Glass className={`p-4 ${stripe ? "border-violet-300/20" : ""}`}><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-300/[.07]"><CreditCard className="h-5 w-5 text-violet-300" /></div><div><div className="text-[8px] font-black uppercase tracking-[.16em] text-violet-300">Payment path A</div><div className="mt-1 text-sm font-black text-white">Stripe native</div><div className="mt-1 text-[9px] text-slate-500">GlyphLock / NUPS controls payment</div></div></div></Glass></motion.div>

          <div className="relative hidden h-24 md:block"><motion.div animate={{ opacity: merge ? 1 : .15 }} className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-violet-300 via-cyan-300 to-amber-300" /><motion.div animate={{ scale: merge ? 1 : .5, opacity: merge ? 1 : .2 }} className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-300/30 bg-slate-950 shadow-[0_0_40px_rgba(34,211,238,.22)]"><Link2 className="h-5 w-5 text-cyan-300" /></motion.div></div>

          <motion.div animate={{ opacity: overlay ? 1 : .2, x: overlay ? 0 : 18 }}><Glass className={`p-4 ${overlay ? "border-amber-300/20" : ""}`}><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-300/20 bg-amber-300/[.07]"><Building2 className="h-5 w-5 text-amber-300" /></div><div><div className="text-[8px] font-black uppercase tracking-[.16em] text-amber-300">Payment path B</div><div className="mt-1 text-sm font-black text-white">Existing processor</div><div className="mt-1 text-[9px] text-slate-500">Venue keeps merchant relationship</div></div></div></Glass></motion.div>
        </div>

        <motion.div animate={{ opacity: merge ? 1 : .18, scale: merge ? 1 : .88 }} className="my-4 flex items-center gap-3"><div className="h-px w-20 bg-gradient-to-r from-transparent to-cyan-300/55" /><ArrowRight className="h-5 w-5 rotate-90 text-cyan-300" /><div className="h-px w-20 bg-gradient-to-l from-transparent to-cyan-300/55" /></motion.div>

        <motion.div animate={{ opacity: final ? 1 : .22, y: final ? 0 : 15, scale: final ? 1 : .94 }} className="text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-cyan-300/35 bg-cyan-300/[.08] shadow-[0_0_85px_rgba(34,211,238,.25)]"><Lock className="h-9 w-9 text-cyan-300" /></div><div className="mt-3 text-[9px] font-black uppercase tracking-[.5em] text-cyan-300">GlyphLock</div><div className="mt-1 bg-gradient-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-5xl font-black tracking-[-.05em] text-transparent">NUPS</div><div className="mt-2 text-lg font-black text-slate-200">Two payment paths. One defensible record.</div><div className="mt-3 flex flex-wrap justify-center gap-2"><Pill tone="violet">Stripe native</Pill><Pill tone="amber">Processor overlay</Pill><Pill tone="green">Unified evidence</Pill></div></motion.div>
      </div>
    </div>
  );
}

function SceneVisual({ type, progress }) {
  if (type === "identity") return <IdentityScene progress={progress} />;
  if (type === "stripe") return <StripeScene progress={progress} />;
  if (type === "overlay") return <OverlayScene progress={progress} />;
  if (type === "record") return <RecordScene progress={progress} />;
  if (type === "dispute") return <DisputeScene progress={progress} />;
  return <FinalScene progress={progress} />;
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
      if (sceneIndex < SCENES.length - 1) window.setTimeout(() => speakScene(sceneIndex + 1, sequenceId), 220);
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
    window.setTimeout(() => speakScene(sceneIndex, id), 90);
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
            <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/[.07]"><Lock className="h-4 w-4 text-cyan-300" /></span><div><div className="text-xs font-black tracking-[.22em] text-white">GLYPHLOCK · NUPS</div><div className="mt-0.5 text-[9px] uppercase tracking-[.16em] text-slate-500">Workflow buyer demonstration · scene-locked male narration</div></div></div>
            <div className="flex flex-wrap items-center gap-2"><Pill tone="green"><BadgeCheck className="h-3 w-3" />Operating platform</Pill><Pill tone="violet"><CreditCard className="h-3 w-3" />Stripe native</Pill><Pill tone="amber"><Building2 className="h-3 w-3" />Processor overlay</Pill></div>
          </div>

          <div className="relative aspect-[16/9] min-h-[580px] overflow-hidden bg-[#020713]">
            <motion.div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" animate={{ x: [0, 100, 20, 0], y: [0, -30, 35, 0] }} transition={{ duration: 12, repeat: Infinity }} />
            <motion.div className="absolute -right-24 bottom-24 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" animate={{ x: [0, -90, -20, 0], y: [0, 35, -20, 0] }} transition={{ duration: 14, repeat: Infinity }} />

            <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-4 p-5 sm:p-7">
              <div><div className="text-[10px] font-black uppercase tracking-[.24em] text-cyan-300">{cue.eyebrow}</div><div className="mt-2 max-w-4xl text-2xl font-black leading-tight text-white sm:text-4xl">{cue.title}</div></div>
              <div className="text-right"><span className="font-mono text-[10px] text-slate-600">{String(scene + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}</span><div className="mt-2 text-[8px] font-black uppercase tracking-[.14em] text-emerald-300">Live workflow simulation</div></div>
            </div>

            <div className="absolute inset-x-0 bottom-[148px] top-[116px] z-10 px-4 sm:px-6">
              <AnimatePresence mode="wait">
                <motion.div key={scene} initial={{ opacity: 0, scale: .985, filter: "blur(8px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 1.015, filter: "blur(8px)" }} transition={{ duration: .38 }} className="h-full">
                  <SceneVisual type={cue.visual} progress={sceneProgress} />
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
                <span className="text-xs font-black uppercase tracking-[.22em] text-white">Play NUPS workflow demo</span>
                <span className="max-w-md text-center text-[10px] leading-5 text-slate-400">Watch identity, payment, contract and evidence states change as the narration explains the workflow.</span>
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
              <div className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-600">Narration now drives visible product-state changes</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
