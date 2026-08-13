import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  CloudCog,
  Database,
  ExternalLink,
  FileCheck2,
  KeyRound,
  LockKeyhole,
  Network,
  ServerCog,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const TEST_EVIDENCE = [
  { label: 'Server settings', value: '7 / 7 present', icon: LockKeyhole },
  { label: 'Authentication', value: 'OCIM accepted', icon: KeyRound },
  { label: 'OHIP API', value: 'Read-only call passed', icon: CheckCircle2 },
  { label: 'End-to-end latency', value: '921 ms', icon: Clock3 },
];

const ARCHITECTURE = [
  {
    title: 'GlyphLock NUPS',
    detail: 'Owner/admin-only integration control inside the Base44 application.',
    icon: Building2,
  },
  {
    title: 'Secure Base44 Function',
    detail: 'Validates configuration, creates request IDs, enforces HTTPS and keeps credentials server-side.',
    icon: ServerCog,
  },
  {
    title: 'Oracle OAuth',
    detail: 'OCIM client-credentials exchange against the OHIP Partner Sandbox.',
    icon: KeyRound,
  },
  {
    title: 'OHIP Property API',
    detail: 'One authorized, read-only List of Values request proved the API path.',
    icon: CloudCog,
  },
];

const CONTROLS = [
  'Owner/admin role enforcement before status or test execution',
  'Seven required server settings checked without returning their values',
  'HTTPS-only OHIP gateway validation',
  'Unique request ID for OAuth and Property API traceability',
  '15-second timeout on each outbound request',
  'No access token, guest data, credential value or Oracle payload returned to the browser',
  'Read-only verification call; no reservation, payment or profile record was changed',
];

const TIMELINE = [
  {
    step: '01',
    title: 'Oracle environment established',
    text: 'GlyphLock received OHIP onboarding access and prepared its Partner Sandbox application and property configuration.',
  },
  {
    step: '02',
    title: 'Secrets isolated server-side',
    text: 'Gateway, authentication, application and property values were stored as Base44 server secrets rather than frontend variables.',
  },
  {
    step: '03',
    title: 'Readiness control built',
    text: 'A protected OHIP readiness page and backend function were added to verify configuration without displaying credentials.',
  },
  {
    step: '04',
    title: 'Deployment mismatch resolved',
    text: 'The readiness route initially returned 404 because the source existed ahead of the production frontend release. The correct Glyphlock app was published and the route verified live.',
  },
  {
    step: '05',
    title: 'OCIM configuration normalized',
    text: 'A legacy onboarding value stored the Oracle OAuth scope where the scheme label was expected. The backend normalized it to the implemented OCIM flow without exposing or rewriting credentials.',
  },
  {
    step: '06',
    title: 'Connection verified',
    text: 'Oracle accepted the OAuth exchange and the subsequent read-only OHIP request completed successfully in 921 milliseconds.',
  },
];

const NEXT_PHASE = [
  {
    title: 'Reusable token broker',
    text: 'Cache short-lived OAuth tokens server-side and refresh them safely before expiration.',
  },
  {
    title: 'Property mapping',
    text: 'Bind the Oracle sandbox hotel/property identity to the matching NUPS venue configuration.',
  },
  {
    title: 'Read-only operational adapters',
    text: 'Add scoped reservation, profile and property reads with explicit field mapping and audit events.',
  },
  {
    title: 'Reconciliation telemetry',
    text: 'Persist request IDs, latency, status and correlation metadata without retaining protected Oracle payloads.',
  },
  {
    title: 'Simphony workstream',
    text: 'Treat Simphony POS integration as a separate credential, scope, API and certification track.',
  },
];

export default function CaseStudyOracleOHIP() {
  return (
    <div className="min-h-screen bg-[#050b14] text-white">
      <SEOHead
        title="NUPS × Oracle OHIP Integration Case Study | GlyphLock"
        description="How GlyphLock NUPS established a secure, owner-controlled connection to the Oracle Hospitality Integration Platform Partner Sandbox."
        keywords={[
          'GlyphLock NUPS',
          'Oracle OHIP integration',
          'hospitality technology',
          'Base44 integration',
          'OCIM OAuth',
          'hotel operations',
        ]}
        url="/CaseStudyOracleOHIP"
      />

      <header className="relative overflow-hidden border-b border-cyan-400/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.2),transparent_38%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.16),transparent_32%)]" />
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-28">
          <Link
            to={createPageUrl('CaseStudies')}
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Case Studies
          </Link>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Badge className="border border-emerald-400/40 bg-emerald-400/10 text-emerald-200">
              Verified August 12, 2026
            </Badge>
            <Badge className="border border-cyan-400/40 bg-cyan-400/10 text-cyan-200">
              Partner Sandbox
            </Badge>
            <Badge className="border border-slate-500/40 bg-slate-800 text-slate-200">
              Read-only validation
            </Badge>
          </div>

          <div className="grid items-end gap-10 lg:grid-cols-[1fr_360px]">
            <div>
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-cyan-300">
                Integration Case Study
              </p>
              <h1 className="max-w-4xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                NUPS connected to
                <span className="block bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
                  Oracle Hospitality
                </span>
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">
                GlyphLock built a controlled server-to-server bridge between NUPS and the Oracle
                Hospitality Integration Platform, then proved the complete Partner Sandbox path:
                protected configuration, OCIM authentication and an authorized read-only API call.
              </p>
            </div>

            <Card className="border-emerald-400/30 bg-emerald-400/[0.07] shadow-[0_0_70px_rgba(16,185,129,0.1)]">
              <CardContent className="p-6">
                <ShieldCheck className="mb-5 h-10 w-10 text-emerald-300" />
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                  Verified outcome
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">Sandbox connection passed</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  OAuth was accepted and one read-only OHIP Property API request completed successfully.
                </p>
                <div className="mt-5 border-t border-emerald-300/20 pt-4 font-mono text-xs text-emerald-100/80">
                  Request 277b1985-6965-4b4e-a309-2f9ab736de42
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-24 px-5 py-16">
        <section>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEST_EVIDENCE.map(({ label, value, icon: Icon }) => (
              <Card key={label} className="border-slate-700/80 bg-slate-900/70">
                <CardContent className="p-5">
                  <Icon className="mb-4 h-6 w-6 text-cyan-300" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
                  <p className="mt-2 text-lg font-bold text-white">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">The challenge</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Connect hospitality infrastructure without moving trust into the browser
            </h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-slate-300">
            <p>
              NUPS needed to prove that it could authenticate with Oracle while keeping application
              credentials outside client code. A simple “configured” badge was not enough: the
              integration needed a controlled live test with bounded calls and usable evidence.
            </p>
            <p>
              The implementation separated presence checks from outbound testing, restricted both
              operations to privileged roles and returned only operational metadata. The browser
              never received an OAuth token or Oracle response payload.
            </p>
          </div>
        </section>

        <section>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Architecture</p>
              <h2 className="mt-3 text-3xl font-black">Four controlled boundaries</h2>
            </div>
            <Network className="hidden h-10 w-10 text-cyan-400 sm:block" />
          </div>
          <div className="grid gap-4 lg:grid-cols-4">
            {ARCHITECTURE.map(({ title, detail, icon: Icon }, index) => (
              <div key={title} className="relative">
                <Card className="h-full border-cyan-400/20 bg-gradient-to-b from-cyan-400/[0.08] to-slate-950">
                  <CardContent className="p-6">
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10">
                        <Icon className="h-6 w-6 text-cyan-300" />
                      </div>
                      <span className="font-mono text-xs text-slate-600">0{index + 1}</span>
                    </div>
                    <h3 className="text-lg font-bold">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
                  </CardContent>
                </Card>
                {index < ARCHITECTURE.length - 1 && (
                  <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 rounded-full bg-[#050b14] text-cyan-400 lg:block" />
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <Card className="border-slate-700 bg-slate-900/60">
            <CardContent className="p-7">
              <div className="mb-6 flex items-center gap-3">
                <FileCheck2 className="h-7 w-7 text-emerald-300" />
                <h2 className="text-2xl font-bold">Security controls implemented</h2>
              </div>
              <div className="space-y-4">
                {CONTROLS.map((control) => (
                  <div key={control} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-400" />
                    <p className="text-sm leading-6 text-slate-300">{control}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-400/25 bg-amber-400/[0.06]">
            <CardContent className="p-7">
              <div className="mb-6 flex items-center gap-3">
                <Database className="h-7 w-7 text-amber-300" />
                <h2 className="text-2xl font-bold">Scope boundary</h2>
              </div>
              <p className="leading-7 text-slate-300">
                This milestone verifies transport and authorization in Oracle’s Partner Sandbox. It
                does not claim a production hotel rollout, reservation synchronization, payment
                processing, guest-profile migration or Simphony POS certification.
              </p>
              <div className="mt-6 rounded-xl border border-amber-300/20 bg-black/20 p-5">
                <p className="text-sm font-semibold text-amber-200">What changed during the test</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  No business record changed. The validation requested one OAuth token and read one
                  non-sensitive List of Values resource.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Execution record</p>
          <h2 className="mt-3 text-3xl font-black">From onboarding to verified connection</h2>
          <div className="mt-10 space-y-4">
            {TIMELINE.map(({ step, title, text }) => (
              <div key={step} className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:grid-cols-[64px_1fr] sm:p-6">
                <div className="font-mono text-2xl font-black text-cyan-400">{step}</div>
                <div>
                  <h3 className="text-lg font-bold">{title}</h3>
                  <p className="mt-2 leading-7 text-slate-400">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="rounded-3xl border border-blue-400/20 bg-gradient-to-br from-blue-500/10 via-cyan-500/[0.06] to-transparent p-7 sm:p-10">
            <div className="flex items-center gap-3">
              <Workflow className="h-7 w-7 text-blue-300" />
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">Next phase</p>
            </div>
            <h2 className="mt-4 max-w-3xl text-3xl font-black">
              Convert verified connectivity into governed NUPS workflows
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {NEXT_PHASE.map(({ title, text }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <h3 className="font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-col items-start justify-between gap-6 border-t border-slate-800 pt-10 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-cyan-300">GlyphLock NUPS × Oracle OHIP</p>
            <p className="mt-1 text-sm text-slate-500">Evidence-backed Partner Sandbox integration milestone.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={createPageUrl('CaseStudies')}>
              <Button variant="outline" className="border-slate-600 bg-transparent text-white hover:bg-slate-800">
                All case studies
              </Button>
            </Link>
            <Link to="/NUPSLanding#nups-integrations">
              <Button className="bg-cyan-600 text-white hover:bg-cyan-500">
                View public integration overview
                <ShieldCheck className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
