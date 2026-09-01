import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, FileSignature, ShieldCheck, ScanLine, Receipt, Users, FileDown } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

const DCE_LOGO = 'https://media.base44.com/images/public/697a087fb354faebb72df54b/f609c57bf_09966cca-7be7-406f-9a2c-788f3a24ec5a.png';
const DCE_URL = 'https://dce.glyphlock.io';

const features = [
  {
    icon: FileSignature,
    title: 'A CONTRACT PER TRANSACTION',
    text: 'Every card transaction captures its own fresh agreement — amount, service window, terms and clickwrap assent recorded at the moment of sale.',
    accent: '#ec4899',
  },
  {
    icon: ScanLine,
    title: 'ID ASSIST, OPERATOR CONFIRMED',
    text: 'PDF417 government-ID scanning auto-fills identity fields. The operator confirms the record — the scanner never signs for anyone.',
    accent: '#f59e0b',
  },
  {
    icon: Receipt,
    title: 'RECEIPT + PROCESSOR REFERENCES',
    text: 'Receipt data and processor / terminal references are linked to the contract so the money trail and the agreement stay reconcilable.',
    accent: '#22d3ee',
  },
  {
    icon: Users,
    title: 'ROLE-SCOPED STAFF ACTIONS',
    text: 'Staff, hostess and manager actions are attributed and role-gated, with manager review on the events that require it.',
    accent: '#8b5cf6',
  },
  {
    icon: ShieldCheck,
    title: 'APPEND-ORIENTED AUDIT TRAIL',
    text: 'Contract lifecycle events are recorded as history. Corrections create traceable adjustments instead of silently rewriting the record.',
    accent: '#10b981',
  },
  {
    icon: FileDown,
    title: 'PDF + JSON EVIDENCE EXPORT',
    text: 'Each package exports as a human-readable PDF and a machine-readable JSON evidence bundle for review, disputes and retention.',
    accent: '#38bdf8',
  },
];

export default function DCE() {
  return (
    <>
      <SEOHead
        title="DCE Evidence — Digital Contract & Evidence App | Powered by GlyphLock"
        description="DCE Evidence is the GlyphLock digital-contract and evidence application: one agreement per card transaction, clickwrap assent, receipt and processor references, role-scoped staff actions, and linked PDF/JSON evidence exports."
        url="/DCE"
      />

      <main className="relative min-h-screen overflow-hidden bg-transparent text-white">
        {/* HERO */}
        <section className="relative flex min-h-[78vh] items-center justify-center px-5 py-20 md:py-28">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_14%,rgba(236,72,153,.22),transparent_58%)]" />
          <div className="absolute inset-0 -z-10 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(236,72,153,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,.12) 1px,transparent 1px)', backgroundSize: '44px 44px' }} />
          <motion.div
            animate={{ x: ['-25%', '125%'] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: 'linear' }}
            className="pointer-events-none absolute top-[14%] h-px w-[28%] bg-gradient-to-r from-transparent via-pink-300 to-transparent shadow-[0_0_22px_#f472b6]"
          />

          <div className="relative mx-auto max-w-5xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-pink-300/50 bg-black/40 px-4 py-2 font-mono text-[10px] tracking-[.22em] text-pink-100 shadow-[0_0_30px_rgba(236,72,153,.3)] backdrop-blur-xl md:text-xs"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-pink-300 shadow-[0_0_14px_#f9a8d4]" />
              DCE // SUPPORTED BY NUPS // POWERED BY GLYPHLOCK
            </motion.div>

            <motion.img
              src={DCE_LOGO}
              alt="DCE Evidence — supported by NUPS, powered by GlyphLock"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto w-full max-w-[560px] object-contain drop-shadow-[0_0_45px_rgba(236,72,153,.55)] md:max-w-[720px]"
              loading="eager"
            />

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.8 }}
              className="mt-10 text-[clamp(2.1rem,6vw,4.4rem)] font-black leading-[.92] tracking-[-.045em] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,.9)]"
            >
              ONE SWIPE. ONE CONTRACT.
              <br />
              <span className="bg-gradient-to-r from-pink-200 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">
                ONE REVIEWABLE EVIDENCE CHAIN.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.8 }}
              className="mx-auto mt-7 max-w-3xl text-base leading-relaxed text-white/95 drop-shadow-[0_3px_12px_rgba(0,0,0,.92)] md:text-xl"
            >
              DCE Evidence is the digital contract and evidence application in the GlyphLock ecosystem. It turns a card
              transaction into a complete, reviewable record: the agreement the customer actually accepted, who handled it,
              what was charged, and the exportable evidence that backs all three.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.7 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-3"
            >
              <a
                href={DCE_URL}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 rounded-xl border border-pink-100/80 bg-pink-200 px-7 py-4 font-black text-slate-950 shadow-[0_0_36px_rgba(236,72,153,.6),0_0_110px_rgba(236,72,153,.25)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] hover:bg-white hover:shadow-[0_0_65px_rgba(255,255,255,.8)]"
              >
                OPEN DCE.GLYPHLOCK.IO
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border border-amber-200/45 bg-amber-400/10 px-6 py-4 font-black text-amber-100 shadow-[0_0_26px_rgba(245,158,11,.25)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-200/75 hover:bg-amber-400/20"
              >
                HOW IT WORKS
              </a>
            </motion.div>
          </div>
        </section>

        {/* WHAT IT DOES */}
        <section id="how-it-works" className="relative mx-auto max-w-7xl px-5 py-16 md:py-24">
          <div className="mb-12 max-w-4xl">
            <div className="mb-4 font-mono text-[10px] tracking-[.28em] text-pink-300 md:text-xs">// WHAT DCE DOES</div>
            <h2 className="text-3xl font-black leading-[.95] tracking-[-.04em] text-white drop-shadow-[0_4px_16px_rgba(0,0,0,.9)] md:text-5xl lg:text-6xl">
              THE AGREEMENT, THE IDENTITY, THE MONEY,
              <br />
              <span className="bg-gradient-to-r from-pink-300 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">AND THE PROOF — IN ONE RECORD.</span>
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: index * 0.07, duration: 0.6 }}
                  whileHover={{ y: -6 }}
                  className="relative overflow-hidden rounded-[24px] border border-white/15 bg-[#0a0512]/85 p-7"
                  style={{ boxShadow: `0 0 30px ${item.accent}22, inset 0 0 60px ${item.accent}0d` }}
                >
                  <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full blur-[70px] opacity-25" style={{ background: item.accent }} />
                  <div className="relative">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border bg-black/40" style={{ borderColor: `${item.accent}55`, boxShadow: `0 0 24px ${item.accent}25` }}>
                      <Icon className="h-6 w-6" style={{ color: item.accent, filter: `drop-shadow(0 0 9px ${item.accent})` }} />
                    </span>
                    <h3 className="mt-6 text-lg font-black tracking-wide text-white md:text-xl">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-100">{item.text}</p>
                  </div>
                </motion.article>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-white/15 bg-black/60 px-5 py-4 font-mono text-[9px] leading-relaxed tracking-[.14em] text-slate-200 md:text-[10px]">
            BOUNDARY: A MODEL MAY HELP SUMMARIZE A PACKAGE. IT CANNOT CREATE ASSENT, SIGN FOR ANYONE, CHANGE AN AMOUNT,
            SHORTEN A PURCHASED SERVICE WINDOW, OR REWRITE AUDIT HISTORY. DCE IS OPERATED UNDER CONTROLLED VENUE USE.
          </div>
        </section>

        {/* CTA */}
        <section className="relative mx-auto max-w-7xl px-5 pb-24">
          <div className="relative overflow-hidden rounded-[30px] border border-pink-200/40 bg-[#0a0512]/85 px-6 py-12 text-center shadow-[0_0_50px_rgba(236,72,153,.18)] md:px-12 md:py-16">
            <div className="absolute -top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-fuchsia-600/20 blur-[110px]" />
            <div className="relative">
              <h2 className="text-3xl font-black leading-[.95] tracking-[-.04em] text-white md:text-5xl">
                SEE THE LIVE DCE APPLICATION.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-100 md:text-lg">
                DCE runs as its own application at dce.glyphlock.io, supported by NUPS and powered by GlyphLock.
              </p>
              <a
                href={DCE_URL}
                target="_blank"
                rel="noreferrer"
                className="group mt-8 inline-flex items-center gap-2 rounded-xl border border-pink-100/80 bg-pink-200 px-8 py-4 font-black text-slate-950 shadow-[0_0_36px_rgba(236,72,153,.55)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] hover:bg-white"
              >
                LAUNCH DCE EVIDENCE
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}