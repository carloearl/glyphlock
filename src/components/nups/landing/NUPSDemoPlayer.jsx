import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Clock3,
  FileCheck2,
  Fingerprint,
  LockKeyhole,
  QrCode,
  ReceiptText,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";

const CAPABILITIES = [
  [Fingerprint, "Identity + onboarding", "Venue-scoped staff, entertainer, guest, and operator records with role verification."],
  [WalletCards, "POS + payouts", "Transactions, receipts, settlements, tip flows, and processor-ready records in one operating layer."],
  [FileCheck2, "Contracts + consent", "Signed agreements and supporting artifacts connected to the activity that created them."],
  [Clock3, "Time + workforce", "Role-based clock-in, staffing workflows, payroll support, and venue-specific controls."],
  [QrCode, "QR + evidence chain", "Barcode and QR reference keys connect transactions, media, receipts, and audit records."],
  [ShieldCheck, "Audit + dispute defense", "A linked evidence ledger for reconciliation, reviews, disputes, and compliance requests."],
];

export default function NUPSDemoPlayer() {
  const navigate = useNavigate();

  const learnMore = () => {
    document.getElementById("nups-walkthrough")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      aria-labelledby="nups-public-title"
      className="relative mx-auto w-full max-w-[1480px] overflow-hidden rounded-3xl border border-cyan-400/20 bg-slate-950 text-slate-200 shadow-2xl shadow-cyan-950/30"
      style={{
        backgroundImage:
          "radial-gradient(circle at 12% 10%, rgba(34,211,238,.17), transparent 34%), radial-gradient(circle at 88% 12%, rgba(139,92,246,.18), transparent 38%), linear-gradient(145deg, rgba(2,6,23,.98), rgba(8,15,42,.97))",
      }}
    >
      <style>{`
        .nups-landing-shell > .container > div:first-child { display: none !important; }
        .nups-landing-shell .brand-meta .stamp { font-size: 0 !important; }
        .nups-landing-shell .brand-meta .stamp::after {
          content: 'NUPS · PREVIEW';
          font-size: 10px;
          letter-spacing: .22em;
        }
      `}</style>

      <div className="relative z-10 p-6 sm:p-9 lg:p-16">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 lg:mb-14">
          <div className="flex items-center gap-3 font-bold tracking-[0.15em] text-white">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/40 bg-cyan-300/10 text-cyan-200 shadow-lg shadow-cyan-500/10">
              <LockKeyhole size={20} aria-hidden="true" />
            </span>
            GLYPHLOCK / NUPS
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-amber-200">
            <BadgeCheck size={14} aria-hidden="true" /> Preview environment · rebuild in progress
          </div>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-200">
              <Building2 size={15} aria-hidden="true" /> Nexus Unified POS System
            </div>
            <h1 id="nups-public-title" className="m-0 font-bold leading-[.98] tracking-[-.035em] text-white text-[clamp(2.7rem,7vw,5.5rem)]">
              One operating system
              <span className="mt-2 block bg-gradient-to-r from-cyan-200 via-blue-500 to-violet-400 bg-clip-text text-transparent">
                for the whole venue.
              </span>
            </h1>
            <p className="mt-6 max-w-3xl text-[clamp(1.05rem,2vw,1.3rem)] leading-relaxed text-slate-300/80">
              NUPS is the <strong className="text-cyan-50">operating backbone of GlyphLock venue deployments</strong>, connecting identity, onboarding, POS activity, contracts, workforce flows, payouts, receipts, and evidence in one venue-scoped system.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row" aria-label="NUPS landing actions">
              <button
                type="button"
                onClick={() => navigate("/NUPSKiosk")}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-cyan-200/50 bg-gradient-to-br from-cyan-600 to-indigo-600 px-6 text-xs font-extrabold uppercase tracking-[0.12em] text-white shadow-xl shadow-blue-950/30 transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-4 focus-visible:outline-cyan-300/40"
              >
                Enter NUPS <ArrowRight size={17} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={learnMore}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-slate-300/20 bg-white/5 px-6 text-xs font-extrabold uppercase tracking-[0.12em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline focus-visible:outline-4 focus-visible:outline-cyan-300/40"
              >
                Learn about NUPS <ReceiptText size={17} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 flex max-w-3xl items-start gap-3 font-mono text-[11px] leading-relaxed text-slate-400">
              <LockKeyhole size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>Access is verified inside the NUPS gateway by venue, account, and role. Public GlyphLock access does not bypass NUPS permissions. Live venue use is not authorized during the rebuild.</span>
            </div>
          </div>

          <aside className="rounded-2xl border border-indigo-400/20 bg-slate-950/65 p-5 backdrop-blur lg:p-7" aria-label="NUPS capability overview">
            <div className="flex items-center justify-between border-b border-slate-400/15 pb-4 text-xs font-extrabold uppercase tracking-[0.1em] text-white">
              Unified operating layer <UsersRound size={18} className="text-cyan-200" aria-hidden="true" />
            </div>
            <div className="mt-4 grid gap-2.5">
              {CAPABILITIES.map(([Icon, title, copy]) => (
                <div key={title} className="grid grid-cols-[40px_1fr] gap-3 rounded-xl border border-cyan-300/10 bg-slate-900/55 p-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-300/10 text-cyan-200">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="m-0 text-sm font-bold text-white">{title}</h2>
                    <p className="m-0 mt-1 text-xs leading-relaxed text-slate-400">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-indigo-200">
              <ShieldCheck size={14} aria-hidden="true" /> Nightlife · hospitality · entertainment · service
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
