import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Database, Fingerprint, Layers3, Network, ShieldCheck } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const COMPARISON_ROWS = [
  {
    capability: 'Audit trail',
    paymentPlatforms: 'Modern platforms commonly provide transaction logs, event histories, exports, and processor audit records.',
    nups: 'Connects venue workflow events, permissions, agreements, transaction references, and review status into one evidence package.',
  },
  {
    capability: 'Authentication and risk',
    paymentPlatforms: 'Many platforms support 3-D Secure, device signals, account controls, and configurable fraud tooling.',
    nups: 'Adds venue-scoped identity, role, consent, and operational context around the payment or external-terminal reference.',
  },
  {
    capability: 'KYC and identity',
    paymentPlatforms: 'KYC and identity verification are available in many processor or connected-account products, subject to product and region.',
    nups: 'Coordinates identity evidence with venue roles, contracts, shift records, and authorized operating mode.',
  },
  {
    capability: 'Dispute evidence',
    paymentPlatforms: 'Major platforms can assemble receipts, transaction data, and dispute-evidence submissions.',
    nups: 'Packages processor references together with consent, contract, venue, staff, and workflow records for human review.',
  },
  {
    capability: 'Integration boundary',
    paymentPlatforms: 'Optimized around payment acceptance, accounts, settlement, and processor-managed risk controls.',
    nups: 'Integrates venue operations across front door, contracts, shifts, payouts, registers, reconciliation, reporting, and supported providers.',
  },
  {
    capability: 'Evidence status',
    paymentPlatforms: 'Provider records remain authoritative for provider-managed events and payment outcomes.',
    nups: 'Records each artifact with source, scope, operating mode, verification status, and explicit limits; it does not replace provider records.',
  },
];

const CAPABILITIES = [
  'Venue-scoped identity and role controls',
  'Clickwrap and electronic-signature records',
  'Contract, shift, register, payout, and reconciliation workflows',
  'External-terminal and supported provider reference capture',
  'Receipt and dispute-package generation',
  'Hashing and evidence-chain status where implemented',
  'Owner and delegated-operator authorization boundaries',
  'Mode separation for demo, sandbox, parallel, and real workflows',
];

export default function CaseStudyNUPS() {
  return (
    <main className="min-h-screen bg-[#050b14] px-5 py-24 text-white">
      <SEOHead
        title="NUPS Product Category and Positioning | GlyphLock"
        description="A factual comparison of the Nexus Unified Portal System with modern payment platforms, focused on venue integration and evidence packaging."
        keywords={['Nexus Unified Portal System', 'NUPS positioning', 'venue operations', 'payment integration', 'evidence packaging', 'biometric data handling']}
        url="/CaseStudyNUPS"
      />

      <section className="mx-auto max-w-6xl">
        <Link to={createPageUrl('TechnicalEvidence')} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Technical Evidence
        </Link>

        <div className="mt-10 max-w-4xl">
          <Badge className="border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">Technical positioning</Badge>
          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">NUPS Product Category and Positioning</h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            NUPS means <strong className="text-white">Nexus Unified Portal System</strong>. It is a venue-operations
            platform that connects register activity with identity, permissions, contracts, shifts, payouts,
            reconciliation, and evidence records. Its differentiator is integration and evidentiary packaging—not a
            claim that payment platforms lack modern security, audit, or dispute tooling.
          </p>
        </div>

        <Card className="mt-10 border-blue-400/25 bg-blue-400/[0.05]">
          <CardContent className="flex gap-4 p-6">
            <Layers3 className="mt-1 h-6 w-6 flex-none text-blue-300" />
            <div>
              <h2 className="font-bold">Category boundary</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                NUPS can coordinate payment-related evidence and external processor references, but it is not represented
                here as a payment processor, acquirer, bank, identity authority, or substitute for provider-controlled records.
              </p>
            </div>
          </CardContent>
        </Card>

        <section className="mt-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Comparison</p>
          <h2 className="mt-3 text-3xl font-black">Modern payment platforms and NUPS</h2>
          <p className="mt-4 max-w-3xl leading-7 text-slate-400">
            The comparison acknowledges current platform capabilities and identifies the narrower integration layer NUPS is designed to provide.
          </p>

          <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-800">
            <table className="min-w-[760px] w-full border-collapse text-left">
              <caption className="sr-only">
                Comparison of modern payment-platform capabilities with the integration and evidence-packaging focus of NUPS.
              </caption>
              <thead className="border-b border-slate-800 bg-slate-900/80 text-xs font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th scope="col" className="w-[180px] p-4">Capability</th>
                  <th scope="col" className="border-l border-slate-800 p-4">Modern payment platforms</th>
                  <th scope="col" className="border-l border-slate-800 p-4 text-cyan-300">NUPS focus</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.capability} className="border-b border-slate-800 bg-slate-950/50 last:border-b-0">
                    <th scope="row" className="p-5 align-top font-bold text-white">{row.capability}</th>
                    <td className="border-l border-slate-800 p-5 align-top text-sm leading-6 text-slate-400">
                      {row.paymentPlatforms}
                    </td>
                    <td className="border-l border-slate-800 p-5 align-top text-sm leading-6 text-cyan-100">
                      {row.nups}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Network className="h-8 w-8 text-cyan-300" />
            <h2 className="mt-4 text-3xl font-black">Integration and evidence packaging</h2>
            <p className="mt-4 leading-7 text-slate-400">
              NUPS is positioned around the connection between operational context and source-system evidence.
              Each provider remains authoritative for the records it controls.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {CAPABILITIES.map((capability) => (
              <div key={capability} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-300" />
                <span className="text-sm leading-6 text-slate-300">{capability}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-violet-400/20 bg-violet-400/[0.05] p-7 sm:p-10">
          <div className="flex items-center gap-3">
            <Fingerprint className="h-7 w-7 text-violet-300" />
            <h2 className="text-2xl font-black">Biometric data handling</h2>
          </div>
          <div className="mt-6 space-y-5 leading-7 text-slate-300">
            <p>
              In the newer supported GlyphBucks and identity flows, raw fingerprint images and face templates are not
              retained. The application stores match scores and masked references off-chain; where an evidence record is
              sealed, only the record hash and explicit anchoring status are eligible for an external timestamp or chain anchor.
            </p>
            <p>
              This separation is intended to keep deletable biometric references and related records off-chain while using
              hashes only for integrity checks. It supports erasure workflows because the off-chain record can be deleted or
              de-linked without placing a reusable biometric template on an immutable ledger.
            </p>
            <p>
              This design does not by itself establish compliance with Illinois BIPA, Texas CUBI, or GDPR. Each deployment
              still needs appropriate notice and consent, a written retention and destruction schedule, access and deletion
              handling, vendor controls, and a legal basis appropriate to the jurisdiction. A hash can remain personal data
              when it is linkable to a person.
            </p>
          </div>

          <div className="mt-7 flex gap-4 rounded-2xl border border-amber-300/20 bg-amber-300/[0.05] p-5">
            <Database className="mt-1 h-5 w-5 flex-none text-amber-300" />
            <p className="text-sm leading-6 text-amber-100/80">
              Legacy media fields and older upload-based workflows still require migration, deletion-policy review, and
              venue-by-venue validation before GlyphLock can make a blanket no-raw-biometric-storage claim.
            </p>
          </div>
        </section>

        <section className="mt-16 border-t border-slate-800 pt-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-cyan-300" />
            <h2 className="text-xl font-bold">Positioning summary</h2>
          </div>
          <p className="mt-4 max-w-4xl leading-7 text-slate-400">
            NUPS is best evaluated as venue-operations software that connects operational workflows and assembles evidence
            around transactions. Claims about a specific processor, biometric device, blockchain anchor, or compliance
            outcome must be tied to the deployed configuration and retained verification record.
          </p>
        </section>
      </section>
    </main>
  );
}
