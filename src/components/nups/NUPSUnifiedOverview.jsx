import React, { useMemo, useState } from "react";
import { BadgeCheck, Building2, CircleDollarSign, FileText, LayoutGrid, ShieldCheck, Workflow, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const moduleRows = [
  ["Contractor Onboarding", "Biometric Identity Verify", "Digital Contracts", "VIP Contracts", "Internal Currency System"],
  ["POS System", "Shift Check-In / Check-Out", "DJ & Event Management", "Reporting & Analytics", "Financial Reconciliation"],
  ["Chargeback Documentation", "Archive & Audit Trail", "Multi-Station Deployment", "Role-Based Permissions", "Owner Dashboard"],
];

const flowSteps = [
  { id: "1", title: "Onboarding", text: "Contractor intake, profile setup, and policy-aware registration." },
  { id: "2", title: "Contracts", text: "Digital agreement routing, acceptance, and storage." },
  { id: "3", title: "Shift Check-In", text: "Start-of-shift flow with venue-aware access controls." },
  { id: "4", title: "Currency", text: "Internal currency issuance, redemption, and audit linkage." },
  { id: "5", title: "POS", text: "Sales execution across stations with controlled reconciliation." },
  { id: "6", title: "Reporting", text: "Operational analytics, summaries, and compliance snapshots." },
  { id: "7", title: "Reconcile", text: "Settlement validation and financial closeout workflows." },
  { id: "8", title: "Archive", text: "Permanent audit trail retention and historical retrieval." },
];

const financialSections = [
  {
    key: "qualification",
    title: "Operational Qualification Architecture",
    text: "Structured for high-scrutiny underwriting, institutional review, and deployment credibility.",
    icon: ShieldCheck,
  },
  {
    key: "risk",
    title: "Deterministic Risk Profile",
    text: "Process visibility, auditability, and controlled operational flow reduce uncertainty.",
    icon: BadgeCheck,
  },
  {
    key: "framework",
    title: "Verified Operations Standard",
    text: "A documented and repeatable operating standard designed for multi-venue execution.",
    icon: Building2,
  },
  {
    key: "submission",
    title: "Submission Preparedness",
    text: "Documentation, controls, and reporting organized for underwriter-facing review.",
    icon: FileText,
  },
];

function SectionPill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? "border-cyan-400 bg-cyan-400/15 text-white"
          : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

export default function NUPSUnifiedOverview() {
  const [activeFinancial, setActiveFinancial] = useState(financialSections[0].key);

  const currentFinancial = useMemo(
    () => financialSections.find((section) => section.key === activeFinancial) ?? financialSections[0],
    [activeFinancial]
  );

  const ActiveIcon = currentFinancial.icon;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(14,25,40,0.95),rgba(10,18,29,0.95))] shadow-[0_0_40px_rgba(59,130,246,0.12)]">
        <div className="border-b border-white/10 px-5 py-5 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">GlyphLock Ecosystem</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-5xl">NUPS — Nexus Unified Portal System</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
                Venue Operating System & Infrastructure Platform — multi-station, multi-venue, compliance-ready, and institutional-grade.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 self-start rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3">
              <LayoutGrid className="h-5 w-5 text-cyan-300" />
              <span className="text-sm font-semibold text-white">Built by GlyphLock Financial LLC · GlyphLock.io</span>
            </div>
          </div>
        </div>
        <div className="grid gap-4 px-5 py-5 md:grid-cols-3 md:px-8">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="text-lg">Venue Operations</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-slate-300">
              NUPS integrates contractor onboarding, digital contracts, internal currency systems, POS operations, event & DJ management, reporting, compliance infrastructure, and financial reconciliation.
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="text-lg">System Statement</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-slate-300">
              NUPS is the operating system that runs the venue.
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="text-lg">Institutional Readiness</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-slate-300">
              Structured to support documented controls, reviewable workflows, and financial reporting continuity across deployments.
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-8">
        <div className="mb-5 flex items-center gap-3">
          <Workflow className="h-5 w-5 text-cyan-300" />
          <h2 className="text-2xl font-bold text-white">Core System Modules</h2>
        </div>
        <div className="space-y-3">
          {moduleRows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid gap-3 md:grid-cols-5">
              {row.map((item) => (
                <div
                  key={item}
                  className="flex min-h-[56px] items-center justify-center rounded-xl border border-white/10 bg-[rgba(255,255,255,0.06)] px-4 text-center text-sm font-semibold text-slate-100"
                >
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-8">
        <div className="mb-5 flex items-center gap-3">
          <ChevronRight className="h-5 w-5 text-cyan-300" />
          <div>
            <h2 className="text-2xl font-bold text-white">System Architecture Flow</h2>
            <p className="text-sm text-slate-400">Structured, intentional, end-to-end venue operations.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {flowSteps.map((step) => (
            <Card key={step.id} className="border-white/10 bg-[#0e1c2c] text-white">
              <CardHeader className="pb-3">
                <div className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">{step.id}</div>
                <CardTitle className="text-xl">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-slate-300">{step.text}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(11,21,33,0.96),rgba(7,14,24,0.96))] p-5 md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <CircleDollarSign className="h-5 w-5 text-cyan-300" />
          <div>
            <h2 className="text-2xl font-bold text-white">GlyphLock Financial Overview</h2>
            <p className="text-sm text-slate-400">Interactive operational qualification and financial positioning summary.</p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          {financialSections.map((section) => (
            <SectionPill
              key={section.key}
              active={section.key === activeFinancial}
              onClick={() => setActiveFinancial(section.key)}
            >
              {section.title}
            </SectionPill>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-cyan-400/20 bg-white/5 text-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3">
                  <ActiveIcon className="h-6 w-6 text-cyan-300" />
                </div>
                <CardTitle className="text-2xl">{currentFinancial.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-slate-300 md:text-base">
              <p>{currentFinancial.text}</p>
              <p>
                GlyphLock Financial LLC presents NUPS as a documented venue operating framework with visible controls, structured workflows, and review-ready reporting designed to support operational credibility.
              </p>
              <p>
                The combined environment connects venue execution with financial reconciliation, audit retention, internal currency control, and administrative oversight in a single system narrative.
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0f1c2d] text-white">
            <CardHeader>
              <CardTitle className="text-xl">Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm leading-6 text-slate-300">
                <li>• Multi-station and multi-venue deployment readiness</li>
                <li>• Integrated contracts, POS, currency, and reconciliation</li>
                <li>• Audit trail and archival support for historical review</li>
                <li>• Role-based permissions and owner-facing dashboard controls</li>
                <li>• Operational reporting aligned to compliance infrastructure</li>
              </ul>
              <div className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                <p className="text-sm font-semibold text-white">Unified Positioning</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  This page combines the infrastructure and financial narrative into one cleaner, readable experience without relying on blurry source images.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="flex justify-center">
        <Button asChild className="min-h-[44px] rounded-full bg-cyan-600 px-6 text-white hover:bg-cyan-500">
          <a href="#top">Back to Top</a>
        </Button>
      </section>
    </div>
  );
}