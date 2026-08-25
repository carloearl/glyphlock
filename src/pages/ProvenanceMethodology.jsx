import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, FileArchive, Fingerprint, Hash, Link2, ShieldCheck } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';

const STEPS = [
  {
    number: '01',
    title: 'Capture the original output',
    icon: FileArchive,
    text: 'Export or preserve the output in a stable file format together with the visible prompt, response, capture time, account or workspace context, and the tool version when available.',
  },
  {
    number: '02',
    title: 'Normalize without changing substance',
    icon: Fingerprint,
    text: 'Keep the original artifact. If a normalized copy is needed for comparison, record the transformation rules, file name, byte length, and relationship to the original.',
  },
  {
    number: '03',
    title: 'Compute a content hash',
    icon: Hash,
    text: 'Calculate a modern cryptographic digest over the exact preserved bytes. Record the algorithm and digest so another party can recompute it from the same artifact.',
  },
  {
    number: '04',
    title: 'Record an independently checkable time',
    icon: Clock3,
    text: 'Attach a timestamp source and its status. A local clock is context only; a provider receipt, signed service record, or completed public anchoring receipt provides stronger independent corroboration.',
  },
  {
    number: '05',
    title: 'Cross-reference related artifacts',
    icon: Link2,
    text: 'Link prompts, outputs, exports, receipts, review notes, and later versions by identifiers and hashes. Cross-references show provenance relationships; they do not prove that a tool provider accepted contractual terms.',
  },
];

const PACKAGE_FIELDS = [
  'Artifact identifier and human-readable description',
  'Original file name, media type, byte length, and storage location',
  'Hash algorithm and digest',
  'Capture time, timestamp source, and verification status',
  'Source-system context without credentials or private tokens',
  'Transformation history for any normalized or redacted copy',
  'Cross-reference identifiers for related records',
  'Reviewer, review date, open limitations, and retention status',
];

export default function ProvenanceMethodology() {
  return (
    <main className="min-h-screen bg-[#050b14] px-5 py-24 text-white">
      <SEOHead
        title="Provenance and Evidence-Preservation Methodology | GlyphLock"
        description="A reproducible, provider-neutral method for capturing outputs, hashing artifacts, recording timestamps, and cross-referencing evidence."
        keywords={['provenance methodology', 'evidence preservation', 'content hashing', 'timestamp verification', 'technical evidence']}
        url="/ProvenanceMethodology"
      />

      <section className="mx-auto max-w-5xl">
        <Link to={createPageUrl('TechnicalEvidence')} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Technical Evidence
        </Link>

        <div className="mt-10 max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Reproducible technical method</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
            Provenance and Evidence-Preservation Methodology
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            This method preserves what a system produced, when it was captured, and how later reviewers can verify
            the artifact. It does not treat a model output as a signature, commitment, agreement, or statement by the provider.
          </p>
        </div>

        <Card className="mt-10 border-cyan-400/25 bg-cyan-400/[0.05]">
          <CardContent className="flex gap-4 p-6">
            <ShieldCheck className="mt-1 h-6 w-6 flex-none text-cyan-300" />
            <div>
              <h2 className="font-bold text-white">Scope boundary</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                A hash can demonstrate that two files are byte-for-byte identical. A timestamp can corroborate when a
                record existed. Neither, by itself, proves authorship, truth, legal assent, or the evidentiary weight a court will assign.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 space-y-4">
          {STEPS.map(({ number, title, icon: Icon, text }) => (
            <Card key={number} className="border-slate-800 bg-slate-900/55">
              <CardContent className="grid gap-4 p-6 sm:grid-cols-[64px_1fr]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 font-mono text-cyan-300">{number}</div>
                <div>
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-cyan-300" />
                    <h2 className="text-xl font-bold">{title}</h2>
                  </div>
                  <p className="mt-3 leading-7 text-slate-400">{text}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="mt-14 rounded-3xl border border-blue-400/20 bg-blue-400/[0.05] p-7 sm:p-9">
          <h2 className="text-2xl font-black">Minimum verification package</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {PACKAGE_FIELDS.map((field) => (
              <div key={field} className="flex gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-300" />
                <span className="text-sm leading-6 text-slate-300">{field}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 border-t border-slate-800 pt-8">
          <h2 className="text-xl font-bold">Verification rule</h2>
          <p className="mt-3 leading-7 text-slate-400">
            Publish only the verification status supported by the retained record. If an anchor, receipt, signature,
            or external reference cannot be independently checked, label it pending or internal rather than verified.
          </p>
        </section>
      </section>
    </main>
  );
}
