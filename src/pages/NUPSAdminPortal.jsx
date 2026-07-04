/**
 * DACO Directive 003 §6 — Admin / Back Office Portal.
 *
 * "Back office never touches live floor operations. It reads,
 *  reconciles, configures, and audits — a weekly/daily rhythm."
 *
 * §6 order of operations:
 *   1. Review last night's signed reports
 *   2. Reconcile the ledger — fix with journal entries, never edits
 *   3. Roll GlyphBucks liability
 *   4. Run payroll (employees only — ICs invisible here by design)
 *   5. Adjust rates/features (effective next business day)
 *   6. Run the audit engine. Review defects.
 *
 * Hard rules:
 *   - REAL/DEMO/SANDBOX modes visually unmistakable (persistent banner)
 *   - Rate changes never apply mid-shift
 *   - ICs structurally excluded from payroll
 *
 * Phase 4 — separate portal entry behind RoleClassGuard(ADMIN).
 */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, BookOpen, Coins, DollarSign, Settings, ShieldCheck,
  AlertTriangle, ArrowRight, LogOut, Loader2, Building2, CalendarClock,
} from "lucide-react";
import RoleClassGuard from "@/components/nups/RoleClassGuard";
import { useActiveVenue } from "@/hooks/useActiveVenue";

const MODE_STYLES = {
  REAL:    { bg: "bg-red-950/80",    border: "border-red-500/50",    text: "text-red-300",    label: "LIVE · REAL" },
  DEMO:    { bg: "bg-amber-950/80",  border: "border-amber-500/50",  text: "text-amber-300",  label: "DEMO" },
  SANDBOX: { bg: "bg-blue-950/80",   border: "border-blue-500/50",   text: "text-blue-300",   label: "SANDBOX" },
};

function ModeBanner({ mode }) {
  const s = MODE_STYLES[mode] || MODE_STYLES.REAL;
  return (
    <div className={`sticky top-0 z-50 ${s.bg} ${s.border} border-b backdrop-blur`}>
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-center gap-3">
        <AlertTriangle className={`w-4 h-4 ${s.text}`} />
        <span className={`font-mono font-black text-sm tracking-[0.2em] ${s.text}`}>
          {s.label}
        </span>
        <span className="text-xs text-slate-300">
          Back Office · §6 — changes effective next business day
        </span>
      </div>
    </div>
  );
}

function PortalCard({ step, title, desc, icon: Icon, route, tone = "slate" }) {
  const navigate = useNavigate();
  const tones = {
    slate:   "border-slate-700 hover:border-slate-500",
    emerald: "border-emerald-500/30 hover:border-emerald-400/60",
    cyan:    "border-cyan-500/30 hover:border-cyan-400/60",
    violet:  "border-violet-500/30 hover:border-violet-400/60",
    amber:   "border-amber-500/30 hover:border-amber-400/60",
  };
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => route && navigate(route)}
      onKeyDown={(e) => { if (e.key === "Enter" && route) navigate(route); }}
      className={`cursor-pointer bg-slate-900/60 ${tones[tone]} transition-colors`}
    >
      <CardContent className="p-5 flex items-start gap-4">
        <div className="w-11 h-11 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-slate-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-slate-600">
            Step {step}
          </div>
          <div className="font-bold text-white text-sm mt-0.5">{title}</div>
          <div className="text-xs text-slate-400 mt-1">{desc}</div>
        </div>
        {route && <ArrowRight className="w-4 h-4 text-slate-600 mt-1 shrink-0" />}
      </CardContent>
    </Card>
  );
}

function AdminPortalContent() {
  const navigate = useNavigate();
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id;

  const [user, setUser] = useState(null);
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Mode from VenueRateConfig — §6 hard rule: visually unmistakable
  const { data: rateConfigs = [] } = useQuery({
    queryKey: ["admin-portal-rate-config", venueId],
    queryFn: () => base44.entities.VenueRateConfig.filter({ venue_id: venueId }, "-created_date", 1),
    enabled: !!venueId,
  });
  const rateConfig = rateConfigs[0] || {};
  const mode = rateConfig.mode || "REAL";

  // Last night's signed settlements — §6 step 1
  const { data: settlements = [], isLoading } = useQuery({
    queryKey: ["admin-portal-settlements", venueId],
    queryFn: () => base44.entities.DailySettlement.filter({ venue_id: venueId }, "-created_date", 10),
    enabled: !!venueId,
  });

  const firstName = (user?.full_name || user?.email || "").split(/[ @]/)[0];

  return (
    <div className="min-h-screen bg-[#05070d] text-white">
      <ModeBanner mode={mode} />

      <header className="border-b border-white/5 bg-black/40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
              NUPS · Back Office
            </div>
            <h1 className="text-xl font-black text-white">
              {firstName ? `Welcome, ${firstName}` : "Admin Portal"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
              <Building2 className="w-3.5 h-3.5" />
              {activeVenue?.name || activeVenue?.venue_name || "—"}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => base44.auth.logout("/NUPSLanding")}
              className="text-slate-400 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-1.5" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* §6 Step 1 — Last night's signed reports */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
              §6 · Step 1
            </span>
            <h2 className="font-bold text-white text-sm">Last Night's Signed Reports</h2>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-slate-500 animate-spin" /></div>
          ) : settlements.length === 0 ? (
            <Card className="bg-slate-900/60 border-slate-800">
              <CardContent className="p-4 text-center text-sm text-slate-500">
                No signed reports yet. Settlements appear here after the manager closes the night.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {settlements.slice(0, 5).map(s => (
                <Card key={s.id} className="bg-slate-900/60 border-slate-800">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-mono text-xs text-slate-400">
                        {s.business_date || s.created_date?.slice(0, 10)}
                      </div>
                      <div className="text-sm font-bold text-white">
                        ${(Number(s.total_sales || 0)).toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={s.signed ? "border-emerald-500/40 text-emerald-300" : "border-amber-500/40 text-amber-300"}
                      >
                        {s.signed ? "SIGNED" : "UNSIGNED"}
                      </Badge>
                      <span className="text-[10px] text-slate-500 font-mono">
                        cash ${Number(s.cash_sales || 0).toFixed(0)} · card ${Number(s.card_sales || 0).toFixed(0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* §6 Steps 2–6 — back-office workflow cards in order */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
              §6 · Back Office Workflow
            </span>
          </div>

          <PortalCard
            step={2}
            title="Reconcile the Ledger"
            desc="Double-entry review. Fix with journal entries — never edits."
            icon={BookOpen}
            route="/admin/ledger"
            tone="cyan"
          />

          <PortalCard
            step={3}
            title="GlyphBucks Liability Roll-Forward"
            desc="Deferred revenue reconciliation. Liability ledger, outside total_sales."
            icon={Coins}
            route="/GlyphBucksHub"
            tone="violet"
          />

          <PortalCard
            step={4}
            title="Payroll Prep — W-2 Staff Only"
            desc="Independent contractors are structurally excluded. ICs are invisible here by design."
            icon={DollarSign}
            route="/NUPSOwner?tab=payroll"
            tone="emerald"
          />

          <PortalCard
            step={5}
            title="Feature Registry & Rate Config"
            desc="Rate changes take effect next business day — never mid-shift."
            icon={Settings}
            route="/admin/venue-settings"
            tone="amber"
          />

          <PortalCard
            step={6}
            title="Compliance Audit Engine"
            desc="Run BPAA-NUPS-AUDIT-001. Review Master Defect Ledger."
            icon={ShieldCheck}
            route="/admin/audit-integrity"
            tone="slate"
          />
        </section>

        {/* §6 hard rule reminders */}
        <Card className="bg-amber-950/20 border-amber-500/20">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Hard Rules
              </span>
            </div>
            <ul className="text-xs text-amber-200/70 space-y-1 list-disc pl-5">
              <li>Mode is <span className="font-mono font-bold">{mode}</span> — changes apply to this mode only.</li>
              <li>Rate changes never apply mid-shift (effective next business day).</li>
              <li>Corrections go through journal entries — original records are never edited.</li>
              <li>ICs never appear in payroll, tip pools, or W-2 reports.</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function NUPSAdminPortal() {
  return (
    <RoleClassGuard allow={["ADMIN"]}>
      <AdminPortalContent />
    </RoleClassGuard>
  );
}