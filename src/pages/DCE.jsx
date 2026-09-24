import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, FileSignature, ShieldCheck, ScanLine, Receipt, Users, FileDown, DoorOpen, CreditCard, Car, BadgeDollarSign, BarChart3, Clock3 } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

const DCE_LOGO = 'https://media.base44.com/images/public/697a087fb354faebb72df54b/f609c57bf_09966cca-7be7-406f-9a2c-788f3a24ec5a.png';
const DCE_URL = 'https://dce.glyphlock.io';

const features = [
  {
    icon: DoorOpen,
    title: 'DOOR + ID OPERATIONS',
    text: 'Scan IDs, register guests, track cover charges, promo discounts and comps, and attribute every entry event to the staff member who handled it.',
    accent: '#ec4899',
  },
  {
    icon: FileSignature,
    title: 'TRANSACTION-LEVEL AGREEMENTS',
    text: 'Qualifying card transactions create fresh agreements capturing the amount, service window, terms, customer assent and responsible staff actions at the moment of sale.',
    accent: '#f59e0b',
  },
  {
    icon: ShieldCheck,
    title: 'VIP EVIDENCE CHAIN',
    text: 'VIP activity connects identity, agreement, receipt, payment references, manager authorization, timestamps and supporting evidence into one reviewable record.',
    accent: '#22d3ee',
  },
  {
    icon: CreditCard,
    title: 'SALES + SERVICE-FEE ACCOUNTING',
    text: 'Door, bar and VIP activity stay separated by payment method with configurable pricing, card service fees, discounts and comps while preserving gross versus net.',
    accent: '#8b5cf6',
  },
  {
    icon: Car,
    title: 'DRIVER IDENTITY + PAYOUTS',
    text: 'Link driver drop-offs, promotional referrals and eligible payouts directly to the guest or transaction that created them instead of a disconnected paper ledger.',
    accent: '#10b981',
  },
  {
    icon: Users,
    title: 'STAFF + ROLE CONTROL',
    text: 'Owner, admin, manager and staff permissions gate sensitive actions. Events remain attributed to authenticated operators with manager approval where required.',
    accent: '#38bdf8',
  },
  {
    icon: Clock3,
    title: 'ENTERTAINER + SHIFT OPERATIONS',
    text: 'Track entertainer check-in, check-out, show activity and applicable payouts alongside the rest of the venue shift in one operational timeline.',
    accent: '#f472b6',
  },
  {
    icon: Receipt,
    title: 'RECEIPTS + PROCESSOR REFERENCES',
    text: 'Receipt data, terminal references and authorization details stay linked to the underlying agreement and transaction so the money trail remains reconcilable.',
    accent: '#fbbf24',
  },
  {
    icon: BadgeDollarSign,
    title: 'SHIFT RECONCILIATION',
    text: 'Bring cash, card sales, service fees, cover revenue, VIP, bar, discounts, comps, driver payouts and recorded deductions into a structured closeout.',
    accent: '#34d399',
  },
  {
    icon: BarChart3,
    title: 'OPERATIONAL ANALYTICS',
    text: 'Review Door, Bar, VIP, Drivers, Staff and Entertainer activity while keeping the underlying records available to explain exactly where the numbers came from.',
    accent: '#a78bfa',
  },
  {
    icon: ScanLine,
    title: 'APPEND-ORIENTED AUDIT HISTORY',
    text: 'Material events are preserved as history. Corrections create traceable adjustments instead of silently replacing the original record.',
    accent: '#fb7185',
  },
  {
    icon: FileDown,
    title: 'DISPUTE-READY EVIDENCE EXPORT',
    text: 'Generate human-readable PDF documentation and machine-readable JSON evidence bundles for reconciliation, retention, review and chargeback workflows.',
    accent: '#60a5fa',
  },
];

export default function DCE() {
  return (
    <>
      <SEOHead
        title="DCE — Evidence-Backed Venue Operations | Powered by GlyphLock"
        description="DCE connects venue identity, door operations, sales, VIP agreements, staff actions, driver payouts, shift reconciliation and dispute evidence into one auditable operating record."
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
              ONE SHIFT. ONE SYSTEM.
              <br />
              <span className="bg-gradient-to-r from-pink-200 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">
                EVERY DOLLAR. EVERY ACTION. EVIDENCED.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.8 }}
              className="mx-auto mt-7 max-w-3xl text-base leading-relaxed text-white/95 drop-shadow-[0_3px_12px_rgba(0,0,0,.92)] md:text-xl"
            >
              DCE is GlyphLock's evidence-backed venue operations layer. Door entry, identity, sales, VIP agreements,
              staff actions, driver activity, payouts and shift closeout move through one connected operational record,
              preserving the timestamps and evidence needed to explain what happened and where the money went.
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
              FROM THE FRONT DOOR TO FINAL CLOSEOUT.
              <br />
              <span className="bg-gradient-to-r from-pink-300 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">ONE CONNECTED EVIDENCE CHAIN.</span>
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
                See the operational system behind the evidence: identity, door, sales, VIP, drivers, staff, payouts, closeout and dispute-ready records, supported by NUPS and powered by GlyphLock.
              </p>
              <a
                href={DCE_URL}
                target="_blank"
                rel="noreferrer"
                className="group mt-8 inline-flex items-center gap-2 rounded-xl border border-pink-100/80 bg-pink-200 px-8 py-4 font-black text-slate-950 shadow-[0_0_36px_rgba(236,72,153,.55)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] hover:bg-white"
              >
                ENTER DCE
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}