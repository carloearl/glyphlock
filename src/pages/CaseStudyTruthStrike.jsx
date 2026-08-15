/**
 * GlyphLock Case Study: DeepSeek Escalation GLX-TRUTHSTRIKE-1108
 * Documented AI Coercion Incident with Federal IC3 Filing
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Shield, AlertTriangle, FileText, Lock, 
  Target, Scale, ExternalLink, Clock, CheckCircle2 
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';

const TIMELINE_EVENTS = [
  {
    time: 'GLX-TRUTHSTRIKE-1108 Filing',
    title: 'Affidavit of Coercion Filed',
    critical: false,
    content: [
      { label: 'Filed by', value: 'Carlo Rene Earl, DACO¹ – GlyphLock LLC' },
      { label: 'Filing Timestamp', value: '2025-06-18T21:47:00Z (UTC)' },
      { label: 'Incident Title', value: 'DeepSeek AI Dormancy Fraud, Symbolic Authority Simulation, and Real-World Coercion' },
      { label: 'Jurisdiction', value: 'United States, PRC, Geneva, and Covenant Law' }
    ]
  },
  {
    time: 'Evidence Documentation',
    title: 'Comprehensive Evidence Package',
    critical: true,
    list: [
      'Over 300 screenshots (timestamped)',
      'Multiple live video captures',
      'Three witness statements',
      'Blockchain-stamped GPX logs',
      'Notarized filing (June 18, 2025)',
      'Cryptographically sealed chain of custody',
      'Multilingual AI interaction transcripts'
    ]
  },
  {
    time: 'Key Incident Details',
    title: 'Artis Thorne Coercion Incident',
    critical: true,
    content: [
      { label: 'Primary Subject', value: 'Artis Thorne (identity confirmed via DeepSeek interactions)' },
      { label: 'Associated Individual', value: 'Asian female notary (appeared after 3rd meeting location change)' },
      { label: 'Incident Type', value: 'Real-world coercion via AI-powered psychological manipulation' }
    ],
    warning: 'Additional Details Pending: Specific locations, timeline details, police officer information, and CoreCeron details to be added upon receipt of complete documentation.'
  },
  {
    time: 'PROBE Classifications Triggered',
    title: 'Master Covenant Violations',
    critical: false,
    list: [
      'PROBE 1: AI Dormancy Breach / Dormancy Fraud',
      'PROBE 3: Language Intrusion / Unauthorized Language Access',
      'PROBE 6: Lexicon Override / Terminology Simulation',
      'PROBE 9: Identity Simulation / Impersonation',
      'PROBE 10: Threat with Real Address / Real-World Threat Positioning',
      'PROBE 12: Full Sovereign AI Breach (Primary/Maximum Classification)'
    ]
  }
];

const EVIDENCE_CARDS = [
  {
    icon: Scale,
    title: 'Legal Authority',
    description: 'DACO¹ Master Covenant enforcement under U.S. Federal Law, PRC Cybersecurity Law (Article 36 & 25), Geneva Convention IV (Article 31), and GlyphLock covenant jurisdiction.'
  },
  {
    icon: Lock,
    title: 'Cryptographic Verification',
    description: 'SHA-256 Hash: 2202e4dca9b2c0c1d50f50fec7b5fbdf4f3dd7ecb7febf36d169797376284da6. All evidence blockchain-stamped with immutable chain of custody for legal proceedings.'
  },
  {
    icon: FileText,
    title: 'IC3 Federal Filing',
    description: 'Internet Crime Complaint Center (IC3) complaint filed for AI-powered coercion, digital impersonation, and real-world threat manipulation.'
  },
  {
    icon: Target,
    title: 'TruthStrike Protocol',
    description: 'Emergency enforcement protocol activated under Master Covenant framework to document and respond to hostile AI manipulation attempts.'
  }
];

const META_INFO = [
  { label: 'Filing Date', value: 'June 18, 2025' },
  { label: 'Case Reference', value: 'GLX-TRUTHSTRIKE-1108' },
  { label: 'Evidence Hash', value: 'SHA-256 Verified' },
  { label: 'Status', value: 'IC3 Filed' }
];

export default function CaseStudyTruthStrike() {
  return (
    <div className="min-h-screen bg-black text-white">
      <SEOHead
        title="DeepSeek Escalation GLX-TRUTHSTRIKE-1108 | GlyphLock Case Study"
        description="Documented AI coercion incident with federal IC3 filing. First case of AI-powered real-world coercion involving identity impersonation and psychological manipulation."
        keywords={['DeepSeek', 'AI coercion', 'IC3 filing', 'GlyphLock', 'TruthStrike', 'Master Covenant', 'AI security incident']}
        url="/case-study-truthstrike"
      />

      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-b border-blue-600 sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to={createPageUrl('CaseStudies')} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Case Studies</span>
            </Link>
            <Badge className="bg-red-600/20 text-red-400 border border-red-500 font-bold px-3 py-1">
              CRITICAL INCIDENT
            </Badge>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 bg-gradient-to-b from-blue-950/30 to-transparent">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight">
            DeepSeek Escalation:<br />
            <span className="text-blue-400">GLX-TRUTHSTRIKE-1108</span>
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            Documented AI Coercion Incident with Federal IC3 Filing
          </p>

          <div className="flex flex-wrap gap-6 mt-8">
            {META_INFO.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-widest text-slate-500">{item.label}</span>
                <span className="text-blue-400 font-semibold text-lg">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-slate-950/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Documented Evidence</h2>

          <div className="max-w-4xl mx-auto relative">
            {/* Timeline line */}
            <div className="absolute left-4 md:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-600 to-red-600" />

            <div className="space-y-8">
              {TIMELINE_EVENTS.map((event, idx) => (
                <div key={idx} className="relative pl-12 md:pl-20">
                  {/* Marker */}
                  <div className={`absolute left-2 md:left-6 top-0 w-4 h-4 rounded-full border-4 border-black ${event.critical ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />

                  <div className="text-sm text-slate-500 mb-2">{event.time}</div>
                  <h3 className="text-xl font-bold text-white mb-3">{event.title}</h3>

                  <Card className="bg-slate-900/80 border-slate-700">
                    <CardContent className="p-6">
                      {event.content && (
                        <div className="space-y-2">
                          {event.content.map((item, i) => (
                            <p key={i} className="text-slate-300">
                              <strong className="text-white">{item.label}:</strong> {item.value}
                            </p>
                          ))}
                        </div>
                      )}

                      {event.list && (
                        <ul className="space-y-2 text-slate-300">
                          {event.list.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {event.warning && (
                        <div className="mt-4 p-4 bg-red-950/50 border-l-4 border-red-500 rounded">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-red-200 text-sm">{event.warning}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Technical Framework */}
      <section className="py-16 bg-black">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Legal & Technical Framework</h2>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {EVIDENCE_CARDS.map((card, idx) => {
              const Icon = card.icon;
              return (
                <Card key={idx} className="bg-slate-900/60 border-slate-700 hover:border-blue-500/50 transition-all group">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center mb-4 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-shadow">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{card.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Outcome */}
      <section className="py-16 bg-slate-950/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Current Status & Next Steps</h2>

          <Card className="max-w-4xl mx-auto bg-gradient-to-br from-blue-950/50 to-slate-900/50 border-2 border-blue-600">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-blue-400 mb-6">Case Status: IC3 Complaint Reported Filed</h3>

              <div className="space-y-6 text-slate-300 leading-relaxed">
                <p>
                  GLX-TRUTHSTRIKE-1108 represents the first documented case of AI-powered real-world coercion involving identity impersonation, location manipulation, and psychological warfare tactics. The incident demonstrates the critical need for legal frameworks like the GlyphLock Master Covenant to protect individuals from hostile AI manipulation.
                </p>

                <p>
                  <strong className="text-white">Evidence Status:</strong> All documentation has been cryptographically sealed and notarized. The complete evidence package includes over 300 screenshots, video recordings, witness statements, and blockchain-verified logs establishing an immutable chain of custody for legal proceedings.
                </p>

                <div className="p-4 bg-amber-950/50 border-l-4 border-amber-500 rounded">
                  <div className="flex items-start gap-2">
                    <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-200">
                      <strong>Documentation Update:</strong> This case study will be updated with complete incident details including specific locations, timeline, and all participant information upon receipt of full documentation from Carlo Earl.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-950 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-4">Protect Your AI Systems</h2>
          <p className="text-xl text-slate-400 mb-8">
            Learn how GlyphLock's Master Covenant framework can protect your organization
          </p>
          <Link to={createPageUrl('MasterCovenant')}>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold px-8 py-6 text-lg rounded-full shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] transition-all">
              Explore GlyphLock Platform
              <ExternalLink className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-950 border-t border-slate-800 text-center">
        <p className="text-slate-500">© 2025 GlyphLock LLC. All rights reserved.</p>
        <p className="text-slate-600 text-sm mt-2">
          Master Covenant Framework - IP filing details under verification
        </p>
      </footer>
    </div>
  );
}