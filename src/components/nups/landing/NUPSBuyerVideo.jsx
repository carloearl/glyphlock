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
    cyan: "border-cyan-300/25 bg-cyan-300/[0.07] text-cyan-100",
    green: "border-emerald-300/25 bg-emerald-300/[0.07] text-emerald-100",
    violet: "border-violet-300/25 bg-violet-300/[0.07] text-violet-100",
    amber: "border-amber-300/25 bg-amber-300/[0.07] text-amber-100",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.15em] ${tones[tone]}`}>{children}</span>;
}

function Frame({ children, className = "" }) {
  return <div className={`rounded-2xl border border-white/10 bg-slate-950/68 shadow-[0_24px_80px_rgba(2,6,23,.42)] backdrop-blur ${className}`}>{children}</div>;
}

function IdentityScene() {
  const items = [
    [Fingerprint, "Guest identity", "Government ID / verified profile"],
    [UserCheck, "Operator role", "Role-scoped venue access"],
    [Lock, "Transaction record", "One controlled operating record"],
  ];
  return (
    <div className="grid h-full gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
      {items.map(([Icon, title, text], index) => (
        <React.Fragment key={title}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .12 }}>
            <Frame className="p-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.08]"><Icon className="h-7 w-7 text-cyan-300" /></div>
              <div className="mt-4 text-sm font-black text-white">{title}</div>
              <div className="mt-2 text-xs leading-5 text-slate-400">{text}</div>
              <div className="mt-4"><Pill tone="green"><CheckCircle2 className="h-3 w-3" />Linked</Pill></div>
            </Frame>
          </motion.div>
          {index < items.length - 1 && <ArrowRight className="mx-auto hidden h-5 w-5 text-cyan-300/45 md:block" />}
        </React.Fragment>
      ))}
    </div>
  );
}

function StripeScene() {
  return (
    <div className="grid h-full gap-5 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
      <Frame className="p-6">
        <div className="flex items-center justify-between"><Pill tone="violet"><CreditCard className="h-3 w-3" />Stripe native</Pill><span className="font-mono text-[10px] text-slate-600">PAY-240812-A1</span></div>
        <div className="mt-6 rounded-2xl border border-violet-300/20 bg-gradient-to-br from-violet-500/15 to-blue-500/10 p-5">
          <div className="text-[10px] font-black uppercase tracking-[.2em] text-violet-200">Payment authorization</div>
          <div className="mt-3 text-3xl font-black text-white">$1,908.00</div>
          <div className="mt-2 text-xs text-slate-400">Stripe authorization attached to NUPS transaction</div>
          <div className="mt-4"><Pill tone="green"><BadgeCheck className="h-3 w-3" />Authorized</Pill></div>
        </div>
      </Frame>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          [FileCheck2, "Contract", "Terms + signature"],
          [ReceiptText, "Receipt", "Same transaction ID"],
          [ShieldCheck, "Audit", "Authorization + events"],
        ].map(([Icon, title, text], index) => (
          <motion.div key={title} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .18 + index * .1 }}>
            <Frame className="h-full p-4"><Icon className="h-5 w-5 text-cyan-300" /><div className="mt-4 text-sm font-black text-white">{title}</div><div className="mt-2 text-xs leading-5 text-slate-400">{text}</div></Frame>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function OverlayScene() {
  return (
    <div className="grid h-full gap-5 lg:grid-cols-[.9fr_auto_1.1fr] lg:items-center">
      <Frame className="p-6 text-center">
        <Building2 className="mx-auto h-9 w-9 text-amber-300" />
        <div className="mt-4 text-sm font-black text-white">Venue terminal</div>
        <div className="mt-2 text-xs text-slate-400">Existing merchant account / processor</div>
        <div className="mt-5 grid grid-cols-2 gap-2 text-left"><div className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><div className="text-[9px] uppercase text-slate-600">Auth code</div><div className="mt-1 font-mono text-xs text-white">A91K7P</div></div><div className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><div className="text-[9px] uppercase text-slate-600">Reference</div><div className="mt-1 font-mono text-xs text-white">PROC-88421</div></div></div>
      </Frame>
      <ArrowRight className="mx-auto h-7 w-7 rotate-90 text-cyan-300/55 lg:rotate-0" />
      <Frame className="p-6">
        <div className="flex items-center justify-between"><Pill><ShieldCheck className="h-3 w-3" />NUPS overlay</Pill><Pill tone="green">No migration</Pill></div>
        <div className="mt-5 space-y-2">
          {["Processor reference captured", "Approval evidence bound", "Receipt linked", "Contract + identity linked"].map((item, index) => <motion.div key={item} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * .08 }} className="flex items-center gap-3 rounded-xl border border-cyan-300/12 bg-cyan-300/[0.035] px-4 py-3 text-xs text-slate-300"><CheckCircle2 className="h-4 w-4 text-emerald-300" />{item}</motion.div>)}
        </div>
      </Frame>
    </div>
  );
}

function RecordScene() {
  return (
    <div className="grid h-full gap-5 lg:grid-cols-[1fr_1.2fr] lg:items-center">
      <div className="grid grid-cols-2 gap-3">
        {[
          [FileText, "Terms", "Version locked"],
          [Signature, "Initials + signatures", "Guest + operator"],
          [ReceiptText, "Services", "Items + totals"],
          [BadgeCheck, "Approvals", "Authorization trail"],
        ].map(([Icon, title, text], index) => <motion.div key={title} initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * .08 }}><Frame className="p-4"><Icon className="h-5 w-5 text-cyan-300" /><div className="mt-3 text-xs font-black text-white">{title}</div><div className="mt-1 text-[10px] text-slate-500">{text}</div></Frame></motion.div>)}
      </div>
      <Frame className="p-6">
        <div className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-300">Unified transaction record</div>
        <div className="mt-2 font-mono text-2xl font-black text-white">NUPS-TX-9F2A4C</div>
        <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl border border-violet-300/20 bg-violet-300/[.06] p-4"><div className="text-[9px] uppercase tracking-wider text-violet-300">Payment path A</div><div className="mt-2 text-sm font-black text-white">Stripe native</div></div><div className="rounded-xl border border-amber-300/20 bg-amber-300/[.06] p-4"><div className="text-[9px] uppercase tracking-wider text-amber-300">Payment path B</div><div className="mt-2 text-sm font-black text-white">External processor</div></div></div>
        <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/[.05] p-4 text-center text-xs font-bold text-emerald-100">Same NUPS evidence model either way</div>
      </Frame>
    </div>
  );
}

function DisputeScene() {
  const evidence = ["Identity", "Agreement", "Payment ref", "Receipt", "Consent", "Audit history"];
  return (
    <div className="grid h-full gap-5 lg:grid-cols-[.72fr_1.28fr] lg:items-center">
      <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}>
        <Frame className="border-amber-300/25 p-6">
          <div className="flex items-center gap-2 text-amber-300"><AlertTriangle className="h-5 w-5" /><span className="text-xs font-black uppercase tracking-[.16em]">Dispute received</span></div>
          <div className="mt-5 text-[10px] uppercase tracking-wider text-slate-600">Matched transaction</div>
          <div className="mt-1 font-mono text-xl font-black text-white">NUPS-TX-9F2A4C</div>
          <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[.05] p-3 text-xs text-amber-100/80">Operator review required</div>
        </Frame>
      </motion.div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {evidence.map((item, index) => <motion.div key={item} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .12 + index * .08 }}><Frame className="p-4 text-center"><CheckCircle2 className="mx-auto h-5 w-5 text-emerald-300" /><div className="mt-3 text-xs font-bold text-white">{item}</div><div className="mt-1 text-[9px] uppercase tracking-wider text-slate-600">Linked source</div></Frame></motion.div>)}
      </div>
    </div>
  );
}

function FinalScene() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <motion.div initial={{ scale: .8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-300/30 bg-cyan-300/[.08] shadow-[0_0_80px_rgba(34,211,238,.16)]"><Lock className="h-10 w-10 text-cyan-300" /></motion.div>
      <div className="mt-6 text-[10px] font-black uppercase tracking-[.4em] text-cyan-300">GlyphLock</div>
      <div className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">NUPS</div>
      <div className="mt-4 text-xl font-black text-slate-200 sm:text-2xl">Two payment paths. One defensible record.</div>
      <div className="mt-6 flex flex-wrap justify-center gap-2"><Pill tone="violet"><CreditCard className="h-3 w-3" />Stripe native</Pill><Pill tone="amber"><Building2 className="h-3 w-3" />Existing processor overlay</Pill><Pill tone="green"><ShieldCheck className="h-3 w-3" />Unified evidence</Pill></div>
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
      if (sceneIndex < SCENES.length - 1) {
        window.setTimeout(() => speakScene(sceneIndex + 1, sequenceId), 180);
      } else {
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
    } else {
      startFrom(sceneRef.current || 0);
    }
  }, [finished, playing, startFrom]);

  const replay = useCallback(() => startFrom(0), [startFrom]);

  const progress = useMemo(() => ((scene + sceneProgress) / SCENES.length) * 100, [scene, sceneProgress]);

  return (
    <section className="relative w-full overflow-hidden bg-[#020617]" aria-label="NUPS buyer demonstration video">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,.2),transparent_42%),radial-gradient(circle_at_80%_60%,rgba(124,58,237,.12),transparent_40%)]" />
      <div className="relative mx-auto w-full max-w-[1500px] px-3 pb-4 pt-3 sm:px-5 sm:pt-5">
        <div className="overflow-hidden rounded-3xl border border-cyan-300/20 bg-[#030816] shadow-[0_34px_120px_rgba(0,0,0,.58),0_0_80px_rgba(34,211,238,.07)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 bg-slate-950/88 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/[.07]"><Lock className="h-4 w-4 text-cyan-300" /></span><div><div className="text-xs font-black tracking-[.22em] text-white">GLYPHLOCK · NUPS</div><div className="mt-0.5 text-[9px] uppercase tracking-[.16em] text-slate-500">Buyer demonstration · scene-locked male narration</div></div></div>
            <div className="flex flex-wrap items-center gap-2"><Pill tone="green"><BadgeCheck className="h-3 w-3" />Live core</Pill><Pill tone="violet"><CreditCard className="h-3 w-3" />Stripe native</Pill><Pill tone="amber"><Building2 className="h-3 w-3" />Processor overlay</Pill></div>
          </div>

          <div className="relative aspect-[16/9] min-h-[540px] overflow-hidden bg-[linear-gradient(rgba(34,211,238,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.025)_1px,transparent_1px)] [background-size:34px_34px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,.09),transparent_45%)]" />

            <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-4 p-5 sm:p-7">
              <div><div className="text-[10px] font-black uppercase tracking-[.24em] text-cyan-300">{cue.eyebrow}</div><div className="mt-2 max-w-4xl text-2xl font-black leading-tight text-white sm:text-4xl">{cue.title}</div></div>
              <span className="shrink-0 font-mono text-[10px] text-slate-600">{String(scene + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}</span>
            </div>

            <div className="absolute inset-x-0 bottom-[148px] top-[118px] z-10 px-5 sm:px-7">
              <AnimatePresence mode="wait">
                <motion.div key={scene} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: .28 }} className="h-full">
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
                <span className="flex h-24 w-24 items-center justify-center rounded-full border border-cyan-100/30 bg-cyan-300 text-slate-950 shadow-[0_0_90px_rgba(34,211,238,.38)]"><Play className="ml-1 h-10 w-10" fill="currentColor" /></span>
                <span className="text-xs font-black uppercase tracking-[.22em] text-white">Play buyer demo with sound</span>
              </button>
            )}

            {finished && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-slate-950/86 backdrop-blur-sm">
                <div className="text-center"><div className="text-[10px] font-black uppercase tracking-[.35em] text-cyan-300">GlyphLock</div><div className="mt-3 text-5xl font-black text-white">NUPS</div><div className="mt-3 text-lg font-bold text-slate-300">Two payment paths. One defensible record.</div></div>
                <div className="flex flex-wrap justify-center gap-3"><button type="button" onClick={replay} className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/[.08] px-5 py-3 text-sm font-black text-white"><RotateCcw className="h-4 w-4" />Replay</button><button type="button" onClick={() => navigate("/NUPSKiosk")} className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-black text-white">Enter NUPS <ArrowRight className="h-4 w-4" /></button></div>
              </div>
            )}
          </div>

          <div className="border-t border-white/8 bg-slate-950/88 px-4 py-4 sm:px-5">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/7"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 transition-[width] duration-150" style={{ width: `${progress}%` }} /></div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2"><button type="button" onClick={finished ? replay : toggle} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/12 bg-white/[.04] px-4 py-2 text-sm font-black text-white">{playing ? <Pause className="h-4 w-4" /> : finished ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}{playing ? "Pause" : finished ? "Replay" : "Play"}</button><span title={voiceLabel} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-white/[.025] px-3 py-2 text-[10px] font-bold text-slate-400"><Volume2 className="h-4 w-4 text-cyan-300" />Male narration</span></div>
              <div className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-600">Each scene changes only after its narration finishes</div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
