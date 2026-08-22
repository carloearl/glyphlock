import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Banknote, FileSignature, IdCard, MonitorCheck, ReceiptText, ShieldCheck, Users } from "lucide-react";

const stages = [
  { icon: IdCard, label: "Guest check-in", detail: "Scan or enter an ID; create a scoped guest record." },
  { icon: BadgeCheck, label: "Permission", detail: "Apply age, role, venue, and DEMO/REAL/SANDBOX boundaries." },
  { icon: FileSignature, label: "Agreement", detail: "Connect terms, parties, signatures, and approval context." },
  { icon: ReceiptText, label: "Transaction", detail: "Record cash or an authorized external payment reference." },
  { icon: Banknote, label: "Close + reconcile", detail: "Review batches, liabilities, expected activity, and exceptions." },
  { icon: ShieldCheck, label: "Verify", detail: "Reconstruct who did what, under which authority, and when." },
];

export default function NUPSOperatingProof() {
  return (
    <section id="nups-proof" className="relative overflow-hidden bg-[#071017] px-5 py-24 sm:px-8 lg:px-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(52,211,153,.09),transparent_34%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[.92fr_1.08fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">Operational proof</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">NUPS connects the whole venue event.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Nexus Unified POS System is the real-world operating proof for the architecture. It connects front-door identity,
              role permissions, contractor agreements, registers, stored-value liabilities, batches, reconciliation, reports,
              and audit history without treating every record as the same thing.
            </p>

            <div className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5">
              <p className="text-sm font-bold text-amber-200">Financial rule preserved</p>
              <p className="mt-2 font-mono text-sm text-slate-200">total_sales = cash_sales + card_sales</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">GlyphBucks are tracked as a liability, not sales revenue. Entertainers are independent contractors, not payroll employees or members of a tip pool.</p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/NUPSLanding" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-100">
                Explore NUPS <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/CaseStudyNUPS" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-white transition hover:border-emerald-300/60 hover:bg-emerald-300/5">
                Read the case study
              </Link>
              <Link to="/NUPSLanding#nups-walkthrough" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-white transition hover:border-cyan-300/60 hover:bg-cyan-300/5">
                Open walkthrough
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-cyan-300/20 bg-[#071522] shadow-2xl shadow-cyan-950/30">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-300/15 bg-[#0b1b2a] px-5 py-4">
              <div className="flex items-center gap-3">
                <MonitorCheck className="h-5 w-5 text-cyan-300" />
                <div>
                  <p className="text-sm font-black text-white">Front Door · synthetic operating view</p>
                  <p className="text-xs text-slate-500">No customer data · demonstration only</p>
                </div>
              </div>
              <span className="rounded-full border border-violet-300/30 bg-violet-300/10 px-3 py-1 font-mono text-[11px] font-bold tracking-wider text-violet-200">DEMO MODE</span>
            </div>

            <div className="p-5 sm:p-7">
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Step 1 · Resolve identity</p>
                  <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-200">Synthetic match</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <DemoField label="Guest" value="DEMO GUEST" />
                  <DemoField label="Record" value="DEMO-AZ-0001" />
                  <DemoField label="Date of birth" value="01/01/1990" />
                  <DemoField label="Address" value="SYNTHETIC DATA — NOT A REAL PERSON" />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {stages.map(({ icon: Icon, label, detail }, index) => (
                  <article key={label} className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-300"><Icon className="h-4 w-4" /></span>
                      <div>
                        <p className="font-mono text-[10px] text-slate-600">0{index + 1}</p>
                        <h3 className="font-bold text-white">{label}</h3>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
                  </article>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#050b11] p-4 text-sm text-slate-400">
                <Users className="h-5 w-5 shrink-0 text-cyan-300" />
                One venue context connects guests, staff, contractors, management, agreements, transaction references, and review history.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DemoField({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#07111b] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">{label}</p>
      <p className="mt-1 font-mono text-xs text-slate-200">{value}</p>
    </div>
  );
}
