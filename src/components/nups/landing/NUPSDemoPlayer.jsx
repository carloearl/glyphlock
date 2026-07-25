import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Pause, ShieldCheck, Fingerprint, FileText, QrCode, Clock, AlertTriangle, CheckCircle2, Lock, Building2, CreditCard, Home, User, Send, Zap, Radio } from "lucide-react";

const VOICEOVER = "https://media.base44.com/files/public/6a63d9f0475091afaaa1e124/de5d2b294_speech.mp3";

const STEPS = [
  { label: "Venue Operations", caption: "NUPS venue operations — every transaction tracked", ms: 6000 },
  { label: "Transaction Sealed", caption: "Guest scan → contract sealed in real time", ms: 6000 },
  { label: "Dispute Incoming", caption: "A chargeback dispute lands", ms: 5500 },
  { label: "One-Push Assembly", caption: "One push — assemble the evidence package", ms: 6500 },
  { label: "Dispute Defended", caption: "Dispute defended — sealed and routed", ms: 6500 },
  { label: "Routed", caption: "Routed to your banking partner — good standing", ms: 6000 },
  { label: "Stakeholders Protected", caption: "Bank · Processor · Venue · Guest — all protected", ms: 6500 },
  { label: "High-Verification Commerce", caption: "This is High-Verification Commerce. This is Glyphlock.", ms: 9000 }
];

const EVIDENCE_ITEMS = [
  { icon: FileText, label: "Signed contract" },
  { icon: Play, label: "30-sec video attestation" },
  { icon: Fingerprint, label: "Biometric match" },
  { icon: QrCode, label: "POS receipt + GlyphBucks QR" },
  { icon: Clock, label: "Blockchain timestamp" },
  { icon: CheckCircle2, label: "Click-wrap consent log" }
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } } };

function Card({ className = "", children }) {
  return (
    <motion.div variants={item} whileHover={{ scale: 1.015 }} className={`rounded-xl border border-cyan-400/20 bg-slate-900/70 backdrop-blur-sm shadow-lg shadow-cyan-500/5 ${className}`}>
      {children}
    </motion.div>
  );
}

function Sealed({ show }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-bold transition-all duration-500 ${show ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300 opacity-100" : "border-white/10 text-slate-600 opacity-40"}`}>
      <Lock className="h-2.5 w-2.5" /> SEALED
    </span>
  );
}

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
    </span>
  );
}

function StepContent({ step }) {
  switch (step) {
    case 0:
      return (
        <motion.div variants={container} initial="hidden" animate="show" className="grid h-full grid-cols-3 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-cyan-400"><CreditCard className="h-4 w-4" /><span className="text-[10px] uppercase tracking-wider text-slate-400">Transactions</span></div>
            <div className="mt-2 text-2xl font-bold text-white">1,284</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-cyan-400"><AlertTriangle className="h-4 w-4" /><span className="text-[10px] uppercase tracking-wider text-slate-400">Chargeback Rate</span></div>
            <div className="mt-2 text-2xl font-bold text-emerald-400">0.4%</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-cyan-400"><ShieldCheck className="h-4 w-4" /><span className="text-[10px] uppercase tracking-wider text-slate-400">Dispute Shield</span></div>
            <div className="mt-2 flex items-center gap-2 text-2xl font-bold text-cyan-400">ACTIVE <LiveDot /></div>
          </Card>
          <Card className="col-span-3 p-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Venue Runtime</div>
              <span className="flex items-center gap-1 text-[9px] text-emerald-400"><Radio className="h-3 w-3" /> LIVE</span>
            </div>
            <div className="mt-1 text-sm text-white">NEXUS UNIFIED PORTAL · venue_id → tenant</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Guest", "Driver", "Staff", "Entertainer", "VIP"].map((r) => (
                <motion.span variants={item} key={r} className="rounded-md border border-cyan-400/20 bg-cyan-400/5 px-2 py-1 text-[10px] text-cyan-200">{r}</motion.span>
              ))}
            </div>
          </Card>
        </motion.div>
      );
    case 1:
      return (
        <motion.div variants={container} initial="hidden" animate="show" className="flex h-full flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-cyan-400">New Transaction · TX-9F2A4C</span>
            <span className="flex items-center gap-1 text-[9px] text-emerald-400"><LiveDot /> ACCRUING</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <div className="flex items-center gap-2"><Fingerprint className="h-4 w-4 text-cyan-400" /><span className="text-xs text-slate-300">Guest scan</span></div>
              <div className="mt-1 text-sm text-white">Mag-swipe → Account</div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-cyan-400" /><span className="text-xs text-slate-300">Contract</span></div>
              <div className="mt-1 flex items-center justify-between"><span className="text-sm text-white">Signed</span><Sealed show /></div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2"><Fingerprint className="h-4 w-4 text-cyan-400" /><span className="text-xs text-slate-300">Biometric</span></div>
              <div className="mt-1 flex items-center justify-between"><span className="text-sm text-white">Match</span><Sealed show /></div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2"><QrCode className="h-4 w-4 text-cyan-400" /><span className="text-xs text-slate-300">GlyphBucks QR</span></div>
              <div className="mt-1 flex items-center justify-between"><span className="text-sm text-white">Issued</span><Sealed show /></div>
            </Card>
          </div>
        </motion.div>
      );
    case 2:
      return (
        <div className="flex h-full items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 220, damping: 18 }} className="w-full max-w-sm rounded-xl border border-amber-500/50 bg-amber-500/10 p-5 shadow-xl shadow-amber-500/10">
            <div className="flex items-center gap-2 text-amber-400">
              <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.2, repeat: Infinity }}><AlertTriangle className="h-5 w-5" /></motion.span>
              <span className="text-sm font-bold">CHARGEBACK ALERT</span>
            </div>
            <div className="mt-3 text-xs text-slate-300">Dispute filed for transaction</div>
            <div className="mt-1 font-mono text-lg text-white">TX-9F2A4C</div>
            <div className="mt-3 text-[11px] text-amber-300/80">Cardholder claims: transaction not recognized</div>
          </motion.div>
        </div>
      );
    case 3:
      return (
        <motion.div variants={container} initial="hidden" animate="show" className="flex h-full flex-col items-center justify-center gap-4">
          <motion.div variants={item} className="text-[10px] uppercase tracking-wider text-slate-400">Evidence Package · PKG-TX_9F2A4C</motion.div>
          <motion.button variants={item} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-300 px-6 py-3 font-bold text-slate-900 shadow-lg shadow-cyan-500/40">
            <ShieldCheck className="h-5 w-5" /> Assemble Evidence Package
          </motion.button>
          <motion.div variants={item} className="flex items-center gap-2 text-cyan-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
            <span className="text-xs">Sealing chain of custody…</span>
          </motion.div>
          <div className="mt-1 grid w-full max-w-md grid-cols-1 gap-1.5">
            {EVIDENCE_ITEMS.slice(0, 3).map((it) => (
              <Card key={it.label} className="flex items-center justify-between px-3 py-1.5">
                <span className="flex items-center gap-2 text-[11px] text-slate-300"><it.icon className="h-3.5 w-3.5 text-cyan-400" />{it.label}</span>
                <Sealed show />
              </Card>
            ))}
          </div>
        </motion.div>
      );
    case 4:
      return (
        <motion.div variants={container} initial="hidden" animate="show" className="flex h-full flex-col gap-3">
          <motion.div variants={item} className="flex items-center justify-between rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2.5 shadow-lg shadow-cyan-500/15">
            <span className="flex items-center gap-2 text-sm font-bold text-cyan-300"><CheckCircle2 className="h-5 w-5" /> DISPUTE DEFENDED</span>
            <span className="text-[10px] text-cyan-400">1-PUSH COMPLETE</span>
          </motion.div>
          <div className="grid grid-cols-2 gap-1.5">
            {EVIDENCE_ITEMS.map((it) => (
              <Card key={it.label} className="flex items-center justify-between px-2.5 py-1.5">
                <span className="flex items-center gap-1.5 text-[10px] text-slate-300"><it.icon className="h-3 w-3 text-cyan-400" />{it.label}</span>
                <Sealed show />
              </Card>
            ))}
          </div>
        </motion.div>
      );
    case 5:
      return (
        <motion.div variants={container} initial="hidden" animate="show" className="flex h-full flex-col items-center justify-center gap-4">
          <motion.div variants={item} whileHover={{ scale: 1.05 }}><Building2 className="h-10 w-10 text-cyan-400" /></motion.div>
          <motion.div variants={item} className="text-sm font-bold text-white">Routed to Banking Partner</motion.div>
          <motion.div variants={item} className="flex items-center gap-2 text-[11px] text-cyan-300"><Send className="h-4 w-4" /> Package delivered to processor API</motion.div>
          <motion.div variants={item} className="mt-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-400 shadow-lg shadow-emerald-500/15">
            MERCHANT STANDING: GOOD
          </motion.div>
        </motion.div>
      );
    case 6:
      return (
        <motion.div variants={container} initial="hidden" animate="show" className="grid h-full grid-cols-2 gap-3">
          {[
            { icon: Building2, name: "The Bank", benefit: "Pre-sealed evidence · lower reserves" },
            { icon: CreditCard, name: "The Processor", benefit: "Disputes pre-empted · fee ratio drops" },
            { icon: Home, name: "The Venue", benefit: "Closed-loop ledger · every dollar attributed" },
            { icon: User, name: "The Guest", benefit: "Signed contract + receipt · consent documented" }
          ].map((p) => (
            <Card key={p.name} className="p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-bold text-white">{p.name}</span>
              </div>
              <div className="mt-1.5 text-[10px] text-slate-400">{p.benefit}</div>
            </Card>
          ))}
          <motion.div variants={item} className="col-span-2 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-center text-sm font-bold tracking-wider text-cyan-300 shadow-lg shadow-cyan-500/15">
            HIGH-VERIFICATION COMMERCE
          </motion.div>
        </motion.div>
      );
    case 7:
      return (
        <motion.div initial="hidden" animate="show" className="flex h-full flex-col items-center justify-center gap-3">
          <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.1 }} className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-cyan-400/20" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-400/10">
              <Lock className="h-8 w-8 text-cyan-400" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="text-center">
            <div className="text-[10px] uppercase tracking-[0.35em] text-cyan-400">GLYPHLOCK</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-white">High-Verification Commerce</div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] text-cyan-300">
            <Zap className="h-3 w-3" /> 1-PUSH DISPUTE SHIELD
          </motion.div>
        </motion.div>
      );
    default:
      return null;
  }
}

export default function NUPSDemoPlayer() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  const rafRef = useRef(null);
  const stepStartRef = useRef(0);
  const stepMsRef = useRef(STEPS[0].ms);

  const tick = useCallback(() => {
    const elapsed = Date.now() - stepStartRef.current;
    const p = Math.min(elapsed / stepMsRef.current, 1);
    setProgress(p);
    if (p >= 1) {
      setStep((prev) => {
        if (prev + 1 >= STEPS.length) {
          setPlaying(false);
          setFinished(true);
          if (audioRef.current) audioRef.current.pause();
          return prev;
        }
        const next = prev + 1;
        stepMsRef.current = STEPS[next].ms;
        return next;
      });
      stepStartRef.current = Date.now();
      setProgress(0);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (playing) {
      stepStartRef.current = Date.now();
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
  }, [playing, tick]);

  const start = useCallback(() => {
    if (finished) {
      setStep(0);
      setProgress(0);
      setFinished(false);
      stepMsRef.current = STEPS[0].ms;
      const a = audioRef.current;
      if (a) { a.currentTime = 0; a.play().catch(() => {}); }
      setPlaying(true);
      return;
    }
    setPlaying((p) => {
      const np = !p;
      const a = audioRef.current;
      if (a) { np ? a.play().catch(() => {}) : a.pause(); }
      return np;
    });
  }, [finished]);

  return (
    <div className="w-full">
      <div className="relative w-full overflow-hidden rounded-2xl border border-cyan-400/25 bg-slate-950 shadow-2xl shadow-cyan-500/10">
        <div className="flex items-center justify-between border-b border-cyan-400/15 bg-slate-900/40 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold tracking-[0.2em] text-white">GLYPHLOCK</span>
            <span className="rounded border border-cyan-400/40 px-1 py-0.5 text-[9px] text-cyan-300">NUPS</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">§ 0{step + 1} · {STEPS[step].label.toUpperCase()}</span>
        </div>

        <div className="relative aspect-video overflow-hidden bg-slate-950 font-mono">
          <motion.div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 50% 0%, rgba(34,211,238,0.12), transparent 55%)" }} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 4, repeat: Infinity }} />
          <div className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: "linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
          <motion.div className="pointer-events-none absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent" animate={{ y: ["-20%", "440%"] }} transition={{ duration: 6.5, repeat: Infinity, ease: "linear" }} />

          <div className="relative h-full p-5">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28 }} className="h-full">
                <StepContent step={step} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent p-5 sm:p-7">
          <p className="text-base sm:text-xl font-bold text-white tracking-tight">
            {STEPS[step].caption}
          </p>
        </div>

        <div className="absolute top-2.5 left-4 flex gap-1.5">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-cyan-400" : i < step ? "w-1.5 bg-cyan-400/50" : "w-1.5 bg-white/30"}`} />
          ))}
        </div>
        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-teal-300" style={{ width: `${progress * 100}%` }} />

        {!playing && !finished && (
          <button onClick={start} className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 transition hover:bg-black/50" aria-label="Play demo">
            <span className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-cyan-400 text-black shadow-xl shadow-cyan-500/30">
              <Play className="h-7 w-7 sm:h-9 sm:w-9 ml-1" fill="currentColor" />
            </span>
          </button>
        )}
        {finished && (
          <button onClick={start} className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 transition hover:bg-black/60" aria-label="Replay demo">
            <span className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-xl">
              <RotateCcw className="h-7 w-7 sm:h-9 sm:w-9" />
            </span>
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between font-mono">
        <span className="text-xs text-slate-400 uppercase tracking-wider">§ 0{step + 1} / 0{STEPS.length}</span>
        <button onClick={start} className="inline-flex items-center gap-2 rounded-md border border-cyan-400/30 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10">
          {finished ? <RotateCcw className="h-4 w-4" /> : playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {finished ? "Replay" : playing ? "Pause" : "Play"}
        </button>
      </div>

      <audio ref={audioRef} src={VOICEOVER} preload="auto" />
    </div>
  );
}