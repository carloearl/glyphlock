import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDot,
  Clock3,
  CloudCog,
  FileText,
  KeyRound,
  LockKeyhole,
  Network,
  Send,
  ShieldCheck,
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const MATURITY = [
  { label: 'configured', state: 'complete' },
  { label: 'connected', state: 'complete' },
  { label: 'authenticated', state: 'complete' },
  { label: 'request succeeded', state: 'complete' },
  { label: 'response validated', state: 'current' },
  { label: 'end-to-end verified', state: 'locked' },
];

const ROADMAP = [
  {
    status: 'complete',
    stage: 'Foundation',
    glyphlock: 'Cloud account glyphlocknups and the designated integration-owner identity were established.',
    oracle: 'Oracle Hospitality Integration Cloud Service was provisioned under OHIP subscription 107857124.',
  },
  {
    status: 'complete',
    stage: 'OPN membership',
    glyphlock: 'GlyphLock completed company enrollment under Company ID 4-463913260838 and enrollment 1654123.',
    oracle: 'Oracle approved Level 0 OPN membership for the August 19, 2026–August 18, 2027 term.',
  },
  {
    status: 'complete',
    stage: 'Partner Sandbox',
    glyphlock: 'Application 17363 was connected through an owner-only, server-side, HTTPS and read-only control path.',
    oracle: 'The Partner Sandbox accepted OAuth and the August 24 room-configuration request; the sanitized response was validated.',
  },
  {
    status: 'complete',
    stage: 'Marketplace program',
    glyphlock: 'GlyphLock completed the Oracle Cloud Marketplace program enrollment under enrollment 1655445.',
    oracle: 'Oracle approved and activated the Cloud Services / Oracle Cloud Marketplace enrollment on August 25, 2026. Publisher-account activation and a NUPS listing remain separate gates.',
  },
  {
    status: 'active',
    stage: 'Simphony formal intake',
    glyphlock: 'GlyphLock submitted the formal Simphony Integration Partner Program request on August 25 using its active OPN Company ID.',
    oracle: 'Oracle’s Partner Integration Team is reviewing the request and states it will contact the submitted email within 10 business days. Onboarding and Solution Validation have not begun.',
  },
  {
    status: 'active',
    stage: 'Marketplace publisher & listing',
    glyphlock: 'A claims-safe NUPS listing package can now be prepared while publisher-account status is confirmed.',
    oracle: 'A published NUPS listing or listing OCID has not yet been established. Simphony Cloud Marketplace publication requires Oracle Solution Validation.',
  },
  {
    status: 'locked',
    stage: 'OHIP production',
    glyphlock: 'Production writes remain locked. The next authorized test must begin with controlled read-only validation.',
    oracle: 'An authorized OPERA Cloud customer environment, production application and application key are still required.',
  },
  {
    status: 'locked',
    stage: 'Future outcomes',
    glyphlock: 'GlyphLock must complete the Marketplace, OHIP production and Simphony validation tracks separately.',
    oracle: 'Marketplace acceptance, production approval, certification and go-live require future Oracle decisions.',
  },
];

const statusStyles = {
  complete: {
    badge: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
    dot: 'bg-emerald-400',
    line: 'from-emerald-400/80 to-emerald-400/20',
    label: 'Completed',
  },
  active: {
    badge: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
    dot: 'bg-amber-300',
    line: 'from-amber-300/80 to-amber-300/20',
    label: 'Active',
  },
  locked: {
    badge: 'border-slate-500/50 bg-slate-800 text-slate-300',
    dot: 'bg-slate-500',
    line: 'from-slate-600 to-slate-700/20',
    label: 'Locked',
  },
};

function RelationshipMap() {
  return (
    <section aria-labelledby="relationship-map-title" className="space-y-8">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Verified growth map</p>
        <h2 id="relationship-map-title" className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
          The relationship is advancing through separate Oracle-controlled tracks
        </h2>
        <p className="mt-4 leading-7 text-slate-300">
          Technical progress, OPN membership, Marketplace program enrollment, publisher/listing work and Simphony validation are related,
          but none substitutes for the approval required in another track.
        </p>
      </div>

      <div className="flex flex-wrap gap-3" aria-label="Status legend">
        {Object.entries(statusStyles).map(([key, style]) => (
          <Badge key={key} className={style.badge}>
            <span className={`mr-2 h-2 w-2 rounded-full ${style.dot}`} />
            {style.label}
          </Badge>
        ))}
      </div>

      <div className="rounded-3xl border border-cyan-400/20 bg-slate-950/70 p-5 sm:p-7">
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
          OHIP maturity
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {MATURITY.map((item, index) => {
            const style = item.state === 'current'
              ? 'border-cyan-300/60 bg-cyan-300/15 text-cyan-100'
              : item.state === 'complete'
                ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100'
                : 'border-slate-600 bg-slate-900 text-slate-500';
            return (
              <React.Fragment key={item.label}>
                <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${style}`}>
                  {item.label}
                </span>
                {index < MATURITY.length - 1 && <ArrowRight className="h-4 w-4 text-slate-600" aria-hidden="true" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="hidden grid-cols-[1fr_190px_1fr] gap-6 px-4 text-center text-xs font-bold uppercase tracking-[0.18em] text-slate-500 lg:grid">
        <span>GlyphLock progress</span>
        <span>Relationship stage</span>
        <span>Oracle-controlled gate</span>
      </div>

      <ol className="space-y-3">
        {ROADMAP.map((item, index) => {
          const style = statusStyles[item.status];
          return (
            <li
              key={item.stage}
              className="grid gap-5 rounded-2xl border border-slate-800 bg-slate-900/45 p-5 lg:grid-cols-[1fr_190px_1fr] lg:items-center"
            >
              <div className="order-2 text-left lg:order-1 lg:text-right">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 lg:hidden">
                  GlyphLock progress
                </p>
                <p className="text-sm leading-6 text-slate-300">{item.glyphlock}</p>
              </div>

              <div className="order-1 flex items-center gap-3 lg:order-2 lg:flex-col lg:text-center">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.dot} text-slate-950`}>
                  {item.status === 'complete' ? (
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  ) : item.status === 'active' ? (
                    <Clock3 className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                  )}
                </span>
                <div>
                  <p className="font-bold text-white">{item.stage}</p>
                  <p className="text-xs text-slate-500">{style.label} · {String(index + 1).padStart(2, '0')}</p>
                </div>
              </div>

              <div className="order-3 text-left">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 lg:hidden">
                  Oracle-controlled gate
                </p>
                <p className="text-sm leading-6 text-slate-300">{item.oracle}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default function OracleOHIPMilestone() {
  return (
    <div className="min-h-screen bg-[#050b14] text-white">
      <SEOHead
        title="GlyphLock Advances Oracle OHIP, Marketplace & Simphony Integration | News"
        description="GlyphLock NUPS reached response validated in Oracle’s OHIP Partner Sandbox, activated its Oracle Cloud Marketplace program enrollment, and submitted a formal Simphony integration request while production and listing gates remain pending."
        keywords={[
          'GlyphLock',
          'NUPS',
          'Oracle OHIP',
          'Oracle Hospitality',
          'Partner Sandbox',
          'OPN member',
          'hospitality technology',
          'read-only validation',
        ]}
        url="/OracleOHIPMilestone"
      />

      <header className="relative overflow-hidden border-b border-cyan-400/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(34,211,238,0.2),transparent_36%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.14),transparent_34%)]" />
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-28">
          <Link
            to={createPageUrl('CaseStudyOracleOHIP')}
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Technical evidence
          </Link>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Badge className="border border-cyan-400/40 bg-cyan-400/10 text-cyan-100">Company news</Badge>
            <Badge className="border border-emerald-400/40 bg-emerald-400/10 text-emerald-100">Response validated</Badge>
            <Badge className="border border-slate-500/50 bg-slate-800 text-slate-300">August 25, 2026</Badge>
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">
            GlyphLock LLC · El Mirage, Arizona
          </p>
          <h1 className="mt-5 max-w-5xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            GlyphLock advances NUPS through a controlled Oracle OHIP Partner Sandbox milestone
          </h1>
          <p className="mt-7 max-w-4xl text-xl leading-8 text-slate-300">
            The owner-controlled integration path progressed through authenticated request success and
            sanitized response validation without exposing credentials, access tokens or raw Oracle payloads
            to the browser.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-20 px-5 py-16">
        <article className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-7 text-base leading-8 text-slate-300">
            <p className="text-lg leading-8 text-slate-200">
              <strong className="text-white">EL MIRAGE, Ariz., Aug. 25, 2026 —</strong> GlyphLock LLC
              announced that the Oracle Hospitality Integration Platform pathway for its Nexus Unified POS
              System, or NUPS, reached <strong className="text-emerald-300">response validated</strong> in
              the Oracle OHIP Partner Sandbox on August 24.
            </p>

            <p>
              The controlled test was executed through the designated integration-owner account and a
              server-side Base44 function. Oracle accepted the OAuth exchange and a read-only room-configuration
              request. The application validated a sanitized response containing 250 candidate records, placed
              all 250 into review, and made zero writes to Oracle or Base44.
            </p>

            <p>
              The implementation keeps the OHIP gateway, OAuth client configuration, application key,
              enterprise identifier and hotel identifier in server-side settings. Status checks report whether
              required configuration is present but never display secret values. No guest, reservation, payment,
              access-token or raw Oracle payload is delivered to the browser.
            </p>

            <blockquote className="border-l-4 border-cyan-400 pl-6 text-xl font-medium leading-8 text-white">
              “NUPS is being built to complement hospitality systems of record, not replace them. The milestone
              matters because it proves a controlled technical path while keeping the production boundary honest
              and locked.”
              <footer className="mt-3 text-sm font-normal text-slate-400">
                — Carlo Earl, Founder, CEO &amp; DACO, GlyphLock LLC
              </footer>
            </blockquote>

            <p>
              GlyphLock’s Oracle Hospitality Integration Cloud Service is provisioned, OHIP Application 17363 is
              registered, and GlyphLock LLC’s Level 0 Oracle PartnerNetwork membership is active through August
              18, 2027. These facts establish access and program standing; they do not constitute certification,
              product endorsement, Marketplace acceptance or production authorization.
            </p>

            <p>
              A historical August 12 record also documented successful OCIM OAuth and a read-only Partner Sandbox
              request with 921-millisecond latency. The August 24 result is a separate, fresh validation and does
              not reuse that historical latency figure.
            </p>

            <h2 className="pt-4 text-3xl font-black text-white">Three workstreams now move independently</h2>

            <p>
              The OHIP technical workstream can continue safely in the Partner Sandbox with authenticated,
              read-only development. Production remains locked until GlyphLock obtains an authorized OPERA Cloud
              customer environment, a production application and application key, and first completes controlled
              read-only production validation.
            </p>

            <p>
              The Oracle Marketplace workstream also advanced. Oracle approved and activated GlyphLock’s
              Cloud Services / Oracle Cloud Marketplace program enrollment 1655445 on August 25, 2026. That
              approval is a real program milestone, but it is not a published NUPS listing. Publisher-account
              status, listing submission, listing acceptance and any listing OCID remain separate Oracle-controlled gates.
            </p>

            <p>
              The Simphony workstream is separate. After Oracle confirmed the formal request path, GlyphLock
              submitted its Simphony Integration Partner Program request on August 25, 2026. Oracle’s Partner
              Integration Team states that it will verify active OPN standing, review the submission, and contact
              the submitted email within 10 business days. Approval, onboarding, Solution Validation, Marketplace
              publication, certification and go-live have not yet been completed.
            </p>

            <h2 className="pt-4 text-3xl font-black text-white">About GlyphLock NUPS</h2>

            <p>
              NUPS is a high-verification venue-operations platform designed to connect identity and age
              verification, role-based workflows, agreements, service activity, transaction evidence and
              auditable reporting. Its Oracle direction keeps Oracle as the hospitality system of record while
              NUPS operates as an identity, agreement and evidence layer around approved workflows.
            </p>

            <p>
              Additional technical evidence, current boundaries and future gates are available in GlyphLock’s
              public Oracle OHIP case study.
            </p>
          </div>

          <aside className="space-y-4">
            <Card className="border-emerald-400/30 bg-emerald-400/[0.07]">
              <CardContent className="p-6">
                <ShieldCheck className="mb-4 h-8 w-8 text-emerald-300" />
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Current maturity</p>
                <p className="mt-2 text-2xl font-black text-white">Response validated</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">Authenticated read-only Partner Sandbox request; sanitized response validated.</p>
              </CardContent>
            </Card>

            <Card className="border-cyan-400/25 bg-cyan-400/[0.06]">
              <CardContent className="p-6">
                <Network className="mb-4 h-8 w-8 text-cyan-300" />
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Test result</p>
                <p className="mt-2 text-2xl font-black text-white">250 reviewed</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">250 candidate records scanned · 250 held for review · 0 writes.</p>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-900/75">
              <CardContent className="p-6">
                <LockKeyhole className="mb-4 h-8 w-8 text-slate-300" />
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Production</p>
                <p className="mt-2 text-2xl font-black text-white">Locked</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">No production deployment or write authorization is claimed.</p>
              </CardContent>
            </Card>
          </aside>
        </article>

        <RelationshipMap />

        <section className="rounded-3xl border border-slate-800 bg-slate-900/55 p-7 sm:p-10">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Evidence and contact</p>
              <h2 className="mt-3 text-3xl font-black">Review the technical case study</h2>
              <p className="mt-4 max-w-3xl leading-7 text-slate-300">
                The public case study separates the historical August 12 record, fresh August 24 validation,
                security controls and remaining Oracle-controlled gates.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              <Link to={createPageUrl('CaseStudyOracleOHIP')}>
                <Button className="w-full bg-cyan-600 text-white hover:bg-cyan-500">
                  Technical evidence
                  <FileText className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to={createPageUrl('Contact')}>
                <Button variant="outline" className="w-full border-slate-600 bg-transparent text-white hover:bg-slate-800">
                  Press contact
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-800 pt-8 text-sm leading-6 text-slate-500">
          <p>
            Oracle, OPERA Cloud, OHIP and Simphony are trademarks or product names of Oracle and/or its
            affiliates. GlyphLock is an active Oracle PartnerNetwork member and its Oracle Cloud Marketplace
            program enrollment is approved and active. This company announcement does not state or imply a
            published NUPS Marketplace listing, Oracle certification or endorsement, production approval,
            completed Simphony Solution Validation, completed integration, or a separate commercial or strategic partnership.
          </p>
        </section>
      </main>
    </div>
  );
}
