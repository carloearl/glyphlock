import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Database,
  FileText,
  Fingerprint,
  Home,
  Layers,
  ListChecks,
  Lock,
  Network,
  Pause,
  Play,
  QrCode,
  Radio,
  ReceiptText,
  RotateCcw,
  ScanLine,
  Send,
  ShieldCheck,
  User,
  Users,
  Zap,
} from "lucide-react";

const FALLBACK_DURATION = 52;
const VISUAL_LEAD_SECONDS = 0.28;

const MALE_VOICE_HINTS = [
  "guy", "christopher", "david", "mark", "brian", "james", "george", "ryan", "eric",
  "andrew", "daniel", "matthew", "liam", "thomas", "arthur", "oliver", "joey", "male",
];
const FEMALE_VOICE_HINTS = [
  "aria", "jenny", "samantha", "zira", "eva", "susan", "hazel", "victoria", "ava",
  "allison", "karen", "moira", "tessa", "serena", "female",
];

function pickNarrationVoice(voices = []) {
  const english = voices.filter((voice) => /^en([-_]|$)/i.test(voice.lang || ""));
  const pool = english.length ? english : voices;
  if (!pool.length) return null;

  const score = (voice) => {
    const name = String(voice.name || "").toLowerCase();
    let value = /^en-US/i.test(voice.lang || "") ? 20 : /^en/i.test(voice.lang || "") ? 10 : 0;
    if (/natural|neural|premium|enhanced|online/.test(name)) value += 8;
    if (MALE_VOICE_HINTS.some((hint) => name.includes(hint))) value += 80;
    if (FEMALE_VOICE_HINTS.some((hint) => name.includes(hint))) value -= 120;
    if (voice.default) value += 1;
    return value;
  };

  return [...pool].sort((a, b) => score(b) - score(a))[0] || null;
}

const CUES = [
  {
    start: 0,
    label: "Venue Operations",
    caption: "NUPS live core — venue operations tracked in one system",
    detail: "Live core modules connect identity, role, contract, processor evidence, and receipt activity on one operational timeline. The venue can keep its existing merchant processor; native integrations are optional. Expansion scenes are labeled as preview capabilities.",
    spoken: "NUPS live core connects venue operations while the venue keeps its existing processor. Native integrations are optional.",
    audit: "Venue runtime opened with role-scoped activity tracking.",
  },
  {
    start: 5.8,
    label: "Transaction Sealed",
    caption: "Guest scan → contract sealed in real time",
    detail: "The verified guest identity follows the transaction through consent, payment, contract generation, and receipt.",
    spoken: "Identity, consent, processor evidence, contract, and receipt stay linked to one transaction record.",
    audit: "Identity-bound transaction record created and sealed.",
  },
  {
    start: 11.7,
    label: "Dispute Incoming",
    caption: "A chargeback dispute lands",
    detail: "NUPS locates the original transaction and its linked consent, contract, payment, and verification records.",
    spoken: "When a dispute arrives, NUPS finds the originating transaction and its linked evidence.",
    audit: "Dispute alert matched to the originating transaction.",
  },
  {
    start: 17.1,
    label: "Evidence Assembly Preview",
    caption: "Built evidence assembly — final packaging is expanding",
    detail: "NUPS already gathers linked agreement, identity, receipt, consent, and audit references. Automated final-PDF packaging is still rolling out.",
    spoken: "Evidence source assembly is built. Final automated PDF packaging is still expanding.",
    audit: "Evidence source records gathered for package generation.",
  },
  {
    start: 23.4,
    label: "Package Review",
    caption: "Evidence package ready for operator review",
    detail: "The current build preserves source references and chain-of-custody details. Final signed-PDF automation remains an expansion item.",
    spoken: "The evidence record is prepared for operator review. Final signed PDF automation remains an expansion item.",
    audit: "Evidence package record prepared with source references intact.",
  },
  {
    start: 29.8,
    label: "External Delivery",
    caption: "Prepared for processor or banking-partner delivery",
    detail: "The venue can export a consistent, reviewable evidence record from NUPS. Direct processor dispute-API submission is still being built.",
    spoken: "The venue can deliver evidence through its existing processor workflow. Direct dispute API submission is not live yet.",
    audit: "Evidence package marked ready for external delivery.",
  },
  {
    start: 35.9,
    label: "Stakeholders Protected",
    caption: "Bank · Processor · Venue · Guest — one clearer record",
    detail: "Each party receives clearer transaction provenance, consent evidence, and an auditable explanation of what occurred.",
    spoken: "Bank, processor, venue, and guest can review clearer provenance from the same transaction record.",
    audit: "Stakeholder views linked to the same verified transaction.",
  },
  {
    start: 42.3,
    label: "High-Verification Commerce",
    caption: "This is High-Verification Commerce. This is GlyphLock.",
    detail: "NUPS turns venue operations into structured, reviewable evidence. The live core is implemented now; selected automation shown here is still expanding.",
    spoken: "NUPS is live core plus clearly labeled expansion. Keep your processor. Put NUPS above it.",
    audit: "High-verification transaction lifecycle completed.",
  },
];

const MODULES = [
  { icon: Activity, label: "Operations", step: 0 },
  { icon: Fingerprint, label: "Identity", step: 1 },
  { icon: AlertTriangle, label: "Disputes", step: 2 },
  { icon: Layers, label: "Evidence", step: 3 },
  { icon: Network, label: "Routing", step: 5 },
  { icon: Users, label: "Stakeholders", step: 6 },
];

const EVIDENCE_ITEMS = [
  { icon: FileText, label: "Signed agreement" },
  { icon: Fingerprint, label: "Verified identity reference" },
  { icon: ReceiptText, label: "Payment receipt" },
  { icon: QrCode, label: "QR / transaction reference" },
  { icon: Clock, label: "Audit timestamps" },
  { icon: CheckCircle2, label: "Consent and approval log" },
];

const TRANSACTION_STAGES = [
  { icon: ScanLine, label: "Identify", sub: "Guest profile or ID" },
  { icon: FileText, label: "Consent", sub: "Terms and signatures" },
  { icon: CreditCard, label: "Transact", sub: "Payment and services" },
  { icon: ReceiptText, label: "Document", sub: "Contract and receipt" },
];

function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function resolveStep(time) {
  let resolved = 0;
  for (let index = 0; index < CUES.length; index += 1) {
    if (time >= CUES[index].start) resolved = index;
    else break;
  }
  return resolved;
}

function formatTime(seconds) {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const minutes = Math.floor(safe / 60);
  const remainder = Math.floor(safe % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function StatusPill({ children, active = false, success = false }) {
  const className = success
    ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-200"
    : active
      ? "border-cyan-400/45 bg-cyan-400/10 text-cyan-200"
      : "border-white/10 bg-white/[0.03] text-slate-500";

  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${className}`}>{children}</span>;
}

function Panel({ children, className = "" }) {
  return <div className={`rounded-2xl border border-cyan-300/15 bg-slate-950/72 shadow-[0_20px_70px_rgba(2,6,23,0.34)] backdrop-blur ${className}`}>{children}</div>;
}

function VenueOperationsScene({ progress }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { icon: Radio, label: "Runtime", value: "TRACKING", tone: "text-emerald-300" },
          { icon: ShieldCheck, label: "Evidence", value: "LINKED", tone: "text-cyan-300" },
          { icon: Lock, label: "Role Access", value: "SCOPED", tone: "text-indigo-300" },
        ].map(({ icon: Icon, label, value, tone }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="rounded-xl border border-white/10 bg-white/[0.035] p-3"
          >
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500"><Icon className="h-3.5 w-3.5 text-cyan-300" />{label}</div>
            <div className={`mt-2 text-sm font-black tracking-wide ${tone}`}>{value}</div>
          </motion.div>
        ))}
      </div>

      <Panel className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">Nexus Unified POS System</div>
            <div className="mt-1 text-sm font-bold text-white">Venue operations timeline</div>
          </div>
          <StatusPill active><span className="relative flex h-2 w-2"><span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" /><span className="relative h-2 w-2 rounded-full bg-emerald-400" /></span>Active session</StatusPill>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {["Guest", "Staff", "Entertainer", "VIP", "Manager"].map((role, index) => (
            <motion.div
              key={role}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: progress > index * 0.12 ? 1 : 0.35 }}
              className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.04] px-3 py-2 text-center text-[10px] font-bold text-cyan-100"
            >
              {role}
            </motion.div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function TransactionScene({ progress }) {
  const activeIndex = Math.min(TRANSACTION_STAGES.length - 1, Math.floor(progress * TRANSACTION_STAGES.length));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><div className="text-[10px] uppercase tracking-[0.18em] text-cyan-300">Transaction lifecycle</div><div className="mt-1 font-mono text-sm text-white">TX-9F2A4C</div></div>
        <StatusPill success><Lock className="h-3 w-3" />Identity bound</StatusPill>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
        {TRANSACTION_STAGES.map(({ icon: Icon, label, sub }, index) => {
          const complete = index < activeIndex || progress > 0.9;
          const active = index === activeIndex && !complete;
          return (
            <motion.div key={label} animate={{ y: active ? -3 : 0 }} className={`relative rounded-xl border p-3 ${complete ? "border-emerald-400/35 bg-emerald-400/8" : active ? "border-cyan-400/50 bg-cyan-400/10" : "border-white/10 bg-white/[0.03]"}`}>
              <div className="flex items-center justify-between"><Icon className={`h-4 w-4 ${complete ? "text-emerald-300" : active ? "text-cyan-300" : "text-slate-600"}`} />{complete && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />}</div>
              <div className="mt-3 text-xs font-bold text-white">{label}</div>
              <div className="mt-1 text-[10px] leading-4 text-slate-500">{sub}</div>
              {index < TRANSACTION_STAGES.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 text-cyan-300/40 sm:block" />}
            </motion.div>
          );
        })}
      </div>
      <Panel className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div><div className="text-[10px] uppercase tracking-wider text-slate-500">Verified purchaser</div><div className="mt-1 text-sm font-bold text-white">Same identity on form, signature, contract, and receipt</div></div>
        <StatusPill success><Database className="h-3 w-3" />Single record</StatusPill>
      </Panel>
    </div>
  );
}

function DisputeScene() {
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_0.9fr]">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-amber-400/45 bg-amber-400/10 p-5 shadow-[0_20px_60px_rgba(245,158,11,0.08)]">
        <div className="flex items-center gap-2 text-amber-300"><AlertTriangle className="h-5 w-5" /><span className="text-sm font-black">CHARGEBACK ALERT</span></div>
        <div className="mt-5 text-[10px] uppercase tracking-wider text-slate-500">Matched transaction</div>
        <div className="mt-1 font-mono text-xl text-white">TX-9F2A4C</div>
        <div className="mt-4 rounded-lg border border-amber-300/20 bg-black/15 px-3 py-2 text-xs text-amber-100/80">Claim: transaction not recognized</div>
      </motion.div>
      <Panel className="p-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-300">Linked records found</div>
        <div className="mt-3 space-y-2">
          {["Verified identity", "Signed agreement", "Payment receipt", "Consent log"].map((label, index) => (
            <motion.div key={label} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.08 }} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300"><span>{label}</span><CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /></motion.div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function EvidenceScene({ progress, defended = false }) {
  const visibleCount = defended ? EVIDENCE_ITEMS.length : Math.max(1, Math.ceil(progress * EVIDENCE_ITEMS.length));
  return (
    <div className="space-y-4">
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${defended ? "border-emerald-400/40 bg-emerald-400/10" : "border-cyan-400/35 bg-cyan-400/8"}`}>
        <div className="flex items-center gap-2"><ShieldCheck className={`h-5 w-5 ${defended ? "text-emerald-300" : "text-cyan-300"}`} /><span className="text-sm font-black text-white">{defended ? "EVIDENCE PACKAGE REVIEW" : "ASSEMBLING EVIDENCE PACKAGE"}</span></div>
        <StatusPill success={defended} active={!defended}>{defended ? "Operator review" : `${visibleCount} / ${EVIDENCE_ITEMS.length} linked`}</StatusPill>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {EVIDENCE_ITEMS.map(({ icon: Icon, label }, index) => {
          const visible = index < visibleCount;
          return (
            <motion.div key={label} animate={{ opacity: visible ? 1 : 0.25, scale: visible ? 1 : 0.98 }} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] px-3 py-3">
              <span className="flex items-center gap-2 text-xs text-slate-300"><Icon className={`h-4 w-4 ${visible ? "text-cyan-300" : "text-slate-700"}`} />{label}</span>
              {visible ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <Clock className="h-4 w-4 text-slate-700" />}
            </motion.div>
          );
        })}
      </div>
      {defended && <Panel className="flex items-center justify-between gap-3 p-4"><div><div className="text-[10px] uppercase tracking-wider text-slate-500">Chain of custody</div><div className="mt-1 text-sm font-bold text-white">Source references preserved from transaction to package</div></div><StatusPill success><Lock className="h-3 w-3" />Sealed</StatusPill></Panel>}
    </div>
  );
}

function RoutingScene({ progress }) {
  return (
    <div className="flex h-full flex-col justify-center">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Panel className="p-4 text-center"><Home className="mx-auto h-8 w-8 text-cyan-300" /><div className="mt-3 text-sm font-black text-white">Venue</div><div className="mt-1 text-[10px] text-slate-500">Verified source records</div></Panel>
        <div className="relative w-20 sm:w-32"><div className="h-px bg-gradient-to-r from-cyan-300/30 via-cyan-300 to-indigo-300/30" /><motion.div className="absolute -top-2 h-4 w-4 rounded-full border border-cyan-200 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]" style={{ left: `${clamp(progress) * 85}%` }} /></div>
        <Panel className="p-4 text-center"><Building2 className="mx-auto h-8 w-8 text-indigo-300" /><div className="mt-3 text-sm font-black text-white">Bank / Processor</div><div className="mt-1 text-[10px] text-slate-500">Reviewable defence package</div></Panel>
      </div>
      <div className="mx-auto mt-5 flex items-center gap-2 text-xs text-cyan-200"><Send className="h-4 w-4" />Prepared for processor delivery · direct dispute API submission expanding</div>
    </div>
  );
}

function StakeholderScene() {
  const stakeholders = [
    { icon: Building2, name: "Bank", benefit: "Structured evidence and clearer provenance" },
    { icon: CreditCard, name: "Processor", benefit: "Consistent dispute documentation" },
    { icon: Home, name: "Venue", benefit: "Operational records tied to each transaction" },
    { icon: User, name: "Guest", benefit: "Identity, consent, contract, and receipt aligned" },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {stakeholders.map(({ icon: Icon, name, benefit }, index) => (
        <motion.div key={name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className="rounded-xl border border-cyan-300/18 bg-gradient-to-br from-cyan-300/[0.07] to-indigo-300/[0.04] p-4">
          <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06]"><Icon className="h-4 w-4 text-cyan-300" /></span><span className="text-sm font-black text-white">{name}</span></div>
          <div className="mt-3 text-xs leading-5 text-slate-400">{benefit}</div>
        </motion.div>
      ))}
    </div>
  );
}

function FinalScene() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <motion.div initial={{ scale: 0, rotate: -18 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 180, damping: 14 }} className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-300/35 bg-cyan-300/10 shadow-[0_0_70px_rgba(34,211,238,0.22)]"><div className="absolute inset-0 animate-ping rounded-3xl bg-cyan-300/10" /><Lock className="relative h-10 w-10 text-cyan-300" /></motion.div>
      <div className="mt-6 text-[10px] font-black uppercase tracking-[0.42em] text-cyan-300">GlyphLock</div>
      <div className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">High-Verification Commerce</div>
      <div className="mt-4 max-w-xl text-sm leading-6 text-slate-400">One operating record connecting identity, consent, transaction activity, contracts, receipts, and dispute evidence.</div>
      <div className="mt-5 flex flex-wrap justify-center gap-2"><StatusPill success><Fingerprint className="h-3 w-3" />Identity core</StatusPill><StatusPill success><FileText className="h-3 w-3" />Contract core</StatusPill><StatusPill success><CreditCard className="h-3 w-3" />Transaction core</StatusPill><StatusPill active><ShieldCheck className="h-3 w-3" />Evidence automation expanding</StatusPill></div>
    </div>
  );
}

function Scene({ step, progress }) {
  switch (step) {
    case 0: return <VenueOperationsScene progress={progress} />;
    case 1: return <TransactionScene progress={progress} />;
    case 2: return <DisputeScene />;
    case 3: return <EvidenceScene progress={progress} />;
    case 4: return <EvidenceScene progress={1} defended />;
    case 5: return <RoutingScene progress={progress} />;
    case 6: return <StakeholderScene />;
    case 7: return <FinalScene />;
    default: return null;
  }
}

function AuditTrail({ step }) {
  return (
    <div className="space-y-2">
      {CUES.map((cue, index) => {
        const completed = index < step;
        const active = index === step;
        return (
          <motion.div key={cue.label} animate={{ opacity: index <= step ? 1 : 0.28 }} className={`relative rounded-xl border px-3 py-2.5 ${active ? "border-cyan-400/40 bg-cyan-400/10" : completed ? "border-emerald-400/18 bg-emerald-400/[0.035]" : "border-white/8 bg-white/[0.02]"}`}>
            <div className="flex items-start gap-2">
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${completed ? "border-emerald-400/40 bg-emerald-400/10" : active ? "border-cyan-400/50 bg-cyan-400/10" : "border-white/10"}`}>{completed ? <CheckCircle2 className="h-3 w-3 text-emerald-300" /> : active ? <Activity className="h-3 w-3 text-cyan-300" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />}</span>
              <div className="min-w-0"><div className={`text-[10px] font-bold ${active ? "text-cyan-200" : completed ? "text-slate-300" : "text-slate-600"}`}>{cue.label}</div>{active && <div className="mt-1 text-[9px] leading-4 text-slate-400">{cue.audit}</div>}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function NUPSDemoPlayer() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const duration = FALLBACK_DURATION;
  const rafRef = useRef(null);
  const clockStartRef = useRef(0);
  const playingRef = useRef(false);
  const spokenStepRef = useRef(-1);
  const [voiceLabel, setVoiceLabel] = useState("male-preferred");

  const stopNarration = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    spokenStepRef.current = -1;
  }, []);

  const speakCue = useCallback((cueIndex) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") return;
    const cueToSpeak = CUES[cueIndex];
    if (!cueToSpeak) return;

    const synth = window.speechSynthesis;
    const voices = synth.getVoices?.() || [];
    const preferred = pickNarrationVoice(voices);
    const utterance = new SpeechSynthesisUtterance(cueToSpeak.spoken || cueToSpeak.caption);
    utterance.rate = 1.12;
    utterance.pitch = 0.88;
    utterance.volume = 1;
    if (preferred) {
      utterance.voice = preferred;
      setVoiceLabel(preferred.name);
    }

    synth.cancel();
    synth.speak(utterance);
    spokenStepRef.current = cueIndex;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return undefined;
    const synth = window.speechSynthesis;
    const hydrateVoice = () => {
      const preferred = pickNarrationVoice(synth.getVoices?.() || []);
      if (preferred) setVoiceLabel(preferred.name);
    };
    hydrateVoice();
    synth.addEventListener?.("voiceschanged", hydrateVoice);
    return () => synth.removeEventListener?.("voiceschanged", hydrateVoice);
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const syncFrame = useCallback(() => {
    if (!playingRef.current) return;
    const elapsed = Math.min(Math.max((performance.now() - clockStartRef.current) / 1000, 0), FALLBACK_DURATION);
    const visualTime = Math.min(elapsed + VISUAL_LEAD_SECONDS, FALLBACK_DURATION);
    setCurrentTime(elapsed);
    setStep(resolveStep(visualTime));

    if (elapsed >= FALLBACK_DURATION) {
      playingRef.current = false;
      setPlaying(false);
      setFinished(true);
      setCurrentTime(FALLBACK_DURATION);
      setStep(CUES.length - 1);
      stopLoop();
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
      return;
    }

    rafRef.current = requestAnimationFrame(syncFrame);
  }, [stopLoop]);

  const startLoop = useCallback((fromTime = 0) => {
    stopLoop();
    clockStartRef.current = performance.now() - fromTime * 1000;
    playingRef.current = true;
    rafRef.current = requestAnimationFrame(syncFrame);
  }, [stopLoop, syncFrame]);

  useEffect(() => () => {
    playingRef.current = false;
    stopLoop();
    stopNarration();
  }, [stopLoop, stopNarration]);

  useEffect(() => {
    if (!playing) return;
    if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis.paused && spokenStepRef.current === step) {
      window.speechSynthesis.resume();
      return;
    }
    if (spokenStepRef.current !== step) speakCue(step);
  }, [playing, step, speakCue]);

  const togglePlayback = useCallback(() => {
    if (playingRef.current) {
      const elapsed = Math.min(Math.max((performance.now() - clockStartRef.current) / 1000, 0), FALLBACK_DURATION);
      playingRef.current = false;
      setCurrentTime(elapsed);
      setPlaying(false);
      stopLoop();
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.pause();
      return;
    }

    const restart = finished || currentTime >= FALLBACK_DURATION;
    const fromTime = restart ? 0 : currentTime;
    if (restart) {
      setCurrentTime(0);
      setStep(0);
      setFinished(false);
      spokenStepRef.current = -1;
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    }
    setPlaying(true);
    startLoop(fromTime);
  }, [currentTime, finished, startLoop, stopLoop]);

  const replay = useCallback(() => {
    playingRef.current = false;
    stopLoop();
    stopNarration();
    setCurrentTime(0);
    setStep(0);
    setFinished(false);
    setPlaying(true);
    startLoop(0);
  }, [startLoop, stopLoop, stopNarration]);

  const cueEnd = step + 1 < CUES.length ? CUES[step + 1].start : duration;
  const visualTime = Math.min(currentTime + VISUAL_LEAD_SECONDS, duration);
  const stepProgress = clamp((visualTime - CUES[step].start) / Math.max(cueEnd - CUES[step].start, 0.1));
  const globalProgress = clamp(currentTime / Math.max(duration, 0.1));
  const activeModule = MODULES.reduce((resolved, module) => (module.step <= step ? module.label : resolved), MODULES[0].label);
  const cue = CUES[step];

  const timelineMarkers = useMemo(() => CUES.map((item) => ({ ...item, percent: clamp(item.start / duration) * 100 })), [duration]);

  return (
    <section className="w-full" aria-label="NUPS live-core and expansion capability preview">
      <div className="overflow-hidden rounded-3xl border border-cyan-300/22 bg-[#030816] shadow-[0_30px_100px_rgba(2,6,23,0.7),0_0_60px_rgba(34,211,238,0.08)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-300/12 bg-slate-950/80 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/28 bg-cyan-300/8"><Lock className="h-4 w-4 text-cyan-300" /></span>
            <div><div className="text-xs font-black tracking-[0.22em] text-white">GLYPHLOCK · NUPS</div><div className="mt-0.5 text-[9px] uppercase tracking-[0.16em] text-slate-500">Live core + expansion preview</div></div>
          </div>
          <div className="flex flex-wrap items-center gap-2"><StatusPill success><CheckCircle2 className="h-3 w-3" />Live core</StatusPill><StatusPill success><CreditCard className="h-3 w-3" />BYO processor overlay</StatusPill><StatusPill active><Layers className="h-3 w-3" />Expansion preview</StatusPill><StatusPill active={playing}><Radio className="h-3 w-3" />{playing ? "Corrected narration" : "Ready"}</StatusPill><span className="font-mono text-[10px] text-slate-500">{formatTime(currentTime)} / {formatTime(duration)}</span></div>
        </header>

        <div className="border-b border-amber-300/20 bg-amber-300/[0.06] px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-amber-100 sm:px-5">Payment model: keep the venue's existing processor by default · NUPS binds approval/reference evidence · native API/webhook integrations are optional · direct dispute-API submission is not yet live</div>

        <div className="grid min-h-[560px] grid-cols-1 lg:grid-cols-[190px_minmax(0,1fr)_270px]">
          <aside className="border-b border-cyan-300/10 bg-slate-950/55 p-3 lg:border-b-0 lg:border-r">
            <div className="mb-3 px-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">System modules</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {MODULES.map(({ icon: Icon, label, step: moduleStep }) => {
                const active = activeModule === label;
                const complete = step > moduleStep;
                return (
                  <div key={label} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${active ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100" : complete ? "border-emerald-400/15 bg-emerald-400/[0.035] text-slate-300" : "border-white/7 bg-white/[0.02] text-slate-600"}`}>
                    <Icon className={`h-4 w-4 ${active ? "text-cyan-300" : complete ? "text-emerald-300" : "text-slate-700"}`} />
                    <span className="text-[10px] font-bold">{label}</span>
                    {complete && <CheckCircle2 className="ml-auto h-3 w-3 text-emerald-300" />}
                  </div>
                );
              })}
            </div>
            <Panel className="mt-3 hidden p-3 lg:block"><div className="text-[9px] uppercase tracking-wider text-slate-600">Current section</div><div className="mt-2 font-mono text-xs text-cyan-200">§ 0{step + 1} / 0{CUES.length}</div><div className="mt-1 text-xs font-bold text-white">{cue.label}</div></Panel>
          </aside>

          <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.11),transparent_48%)] p-4 pb-44 sm:p-6 sm:pb-44">
            <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "linear-gradient(rgba(34,211,238,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.45) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
            <motion.div className="pointer-events-none absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-cyan-300/[0.04] to-transparent" animate={{ y: ["-20%", "720%"] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} />

            <div className="relative z-10 mx-auto flex h-full max-w-4xl flex-col">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div><div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">{cue.label}</div><div className="mt-1 text-xl font-black text-white sm:text-2xl">{cue.caption}</div></div>
                <StatusPill active><Zap className="h-3 w-3" />Visual cue {Math.round(stepProgress * 100)}%</StatusPill>
              </div>
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  <motion.div key={step} initial={{ opacity: 0, y: 10, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.24 }} className="h-full">
                    <Scene step={step} progress={stepProgress} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-20 border-t border-cyan-300/12 bg-slate-950/92 p-4 backdrop-blur sm:p-5">
              <div className="mx-auto max-w-4xl">
                <div className="flex items-start gap-3"><span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-cyan-300/25 bg-cyan-300/8"><ListChecks className="h-4 w-4 text-cyan-300" /></span><div><div className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300">What NUPS is showing</div><p className="mt-1 text-sm leading-5 text-slate-300">{cue.detail}</p></div></div>
              </div>
            </div>

            {!playing && !finished && (
              <button type="button" onClick={togglePlayback} className="absolute inset-0 z-30 flex items-center justify-center bg-black/42 transition hover:bg-black/50" aria-label="Play NUPS capability preview">
                <span className="flex h-20 w-20 items-center justify-center rounded-full border border-cyan-100/30 bg-cyan-300 text-slate-950 shadow-[0_0_70px_rgba(34,211,238,0.42)]"><Play className="ml-1 h-9 w-9" fill="currentColor" /></span>
              </button>
            )}
            {finished && (
              <button type="button" onClick={replay} className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/55 transition hover:bg-black/62" aria-label="Replay narrated NUPS demonstration">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-slate-950 shadow-xl"><RotateCcw className="h-8 w-8" /></span><span className="text-xs font-black uppercase tracking-[0.18em] text-white">Replay walkthrough</span>
              </button>
            )}
          </main>

          <aside className="border-t border-cyan-300/10 bg-slate-950/62 p-3 lg:border-l lg:border-t-0">
            <div className="mb-3 flex items-center justify-between px-1"><div><div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Audit trail</div><div className="mt-1 text-xs font-bold text-white">Narration-linked events</div></div><Activity className="h-4 w-4 text-cyan-300" /></div>
            <AuditTrail step={step} />
          </aside>
        </div>

        <div className="border-t border-cyan-300/12 bg-slate-950/82 px-4 py-4 sm:px-5">
          <div className="relative h-2 rounded-full bg-white/8">
            <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 shadow-[0_0_16px_rgba(34,211,238,0.5)]" style={{ width: `${globalProgress * 100}%` }} />
            {timelineMarkers.map((marker, index) => <span key={marker.label} title={marker.label} className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border ${index <= step ? "border-cyan-200 bg-cyan-400" : "border-white/20 bg-slate-800"}`} style={{ left: `${marker.percent}%` }} />)}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2"><button type="button" onClick={finished ? replay : togglePlayback} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-cyan-300/28 bg-cyan-300/8 px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-300/14">{finished ? <RotateCcw className="h-4 w-4" /> : playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{finished ? "Replay" : playing ? "Pause" : "Play"}</button><span className="hidden text-[10px] text-slate-500 sm:inline">Corrected narration follows the capability timeline. The legacy audio remains muted and is used only as the timing track.</span></div>
            <button type="button" onClick={() => navigate("/NUPSKiosk")} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-black text-white shadow-[0_0_28px_rgba(59,130,246,0.24)] transition hover:scale-[1.015]">Enter NUPS <ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={VOICEOVER}
        preload="auto"
        muted
        onLoadedMetadata={() => {
          const audio = audioRef.current;
          if (audio && Number.isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration);
          syncFrame();
        }}
        onPlay={() => { setPlaying(true); setFinished(false); startLoop(); }}
        onPause={() => { setPlaying(false); stopLoop(); syncFrame(); }}
        onSeeked={syncFrame}
        onEnded={() => {
          stopLoop();
          setPlaying(false);
          setFinished(true);
          setCurrentTime(duration);
          setStep(CUES.length - 1);
        }}
      />
    </section>
  );
}
