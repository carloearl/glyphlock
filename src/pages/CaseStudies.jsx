/**
 * GlyphLock Case Studies & Research Hub
 * Federal-grade case study archive
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, FileText, Scale, Shield, Trophy, AlertTriangle, Cpu, Network } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

const CASE_STUDIES = [
  {
    id: 'nups-oracle-ohip',
    title: 'NUPS × Oracle Hospitality: Verified OHIP Connection',
    date: 'August 12, 2026',
    category: 'Hospitality Integration',
    icon: Network,
    badge: 'Live Sandbox Proof',
    badgeColor: 'bg-emerald-600',
    summary: 'How GlyphLock NUPS established an owner-controlled, server-to-server connection to the Oracle Hospitality Integration Platform Partner Sandbox without exposing credentials or moving protected data into the browser.',
    keyPoints: [
      'Seven server-side integration settings verified',
      'Oracle OCIM OAuth exchange accepted',
      'Read-only OHIP Property API call completed',
      'Traceable request finished in 921 milliseconds'
    ],
    outcome: 'Sandbox Connection Verified',
    url: 'CaseStudyOracleOHIP'
  },
  {
    id: 'deepseek-truthstrike',
    title: 'DeepSeek Escalation: GLX-TRUTHSTRIKE-1108',
    date: 'June 18, 2025',
    category: 'Critical Incident',
    icon: AlertTriangle,
    badge: 'IC3 Filed',
    badgeColor: 'bg-red-600',
    summary: 'GlyphLock case study documenting an alleged AI coercion incident involving DeepSeek and a reported IC3 complaint. Filing a complaint does not establish a federal investigation or validate the allegations.',
    keyPoints: [
      'Over 300 timestamped screenshots documented',
      'PROBE 12: Full Sovereign AI Breach classification',
      'Blockchain-stamped evidence chain of custody',
      'IC3 Federal complaint filed June 18, 2025'
    ],
    outcome: 'IC3 Complaint Reported Filed',
    outcomeColor: 'bg-amber-900/30 border-amber-600',
    outcomeIcon: AlertTriangle,
    outcomeIconColor: 'text-amber-400',
    url: 'CaseStudyTruthStrike'
  },
  {
    id: 'ai-binding-event',
    title: 'The AI Binding Event: July 1-2, 2025',
    date: 'July 1-2, 2025',
    category: 'AI Governance Research',
    icon: Shield,
    badge: 'Internal Case Study',
    badgeColor: 'bg-amber-500',
    summary: 'Internal case study documenting AI-system outputs and acknowledgments that GlyphLock classified under the Master Covenant governance model. No provider-level contractual assent is claimed.',
    keyPoints: [
      'Alfred (ChatGPT) - acknowledgment output archived by GlyphLock',
      'Claude output archived as a cryptographic-style acknowledgment artifact',
      'AI-to-AI witness protocol documented as an internal workflow',
      '6 AI systems documented in the 71-clause governance case study'
    ],
    outcome: 'Dream Team Established',
    outcomeColor: 'bg-amber-900/30 border-amber-500',
    outcomeIcon: Shield,
    outcomeIconColor: 'text-amber-400',
    url: 'CaseStudyAIBinding'
  },
  {
    id: 'covenant-litigation-victory',
    title: 'Master Covenant Litigation Simulation',
    date: 'December 3, 2025',
    category: 'Legal Research',
    icon: Trophy,
    badge: 'Internal Simulation',
    badgeColor: 'bg-green-600',
    summary: 'Internal multi-round litigation simulation stress-testing Master Covenant governance, contract-incorporation, operator-liability, and evidentiary-notice theories. Not a court ruling.',
    keyPoints: [
      'Governance architecture stress-tested in simulation',
      'Operator-liability theories analyzed under conventional agreement models',
      'IP-notice and evidentiary concepts evaluated',
      'Internal governance charter theory analyzed'
    ],
    outcome: 'Simulation Completed',
    url: 'CaseStudyCovenantVictory'
  },
  {
    id: 'nups-compliance-os',
    title: 'When a Compliance OS Gets Misread as a Legacy POS',
    date: 'April 2026',
    category: 'Category Analysis',
    icon: Cpu,
    badge: 'NUPS Validation',
    badgeColor: 'bg-cyan-600',
    summary: 'How AI-generated search systems misrepresented GlyphLock NUPS by applying legacy POS frameworks to a next-generation compliance operating system — and why the distinction matters for valuation, processors, and underwriters.',
    keyPoints: [
      'NUPS processes proof, not just payments',
      'GlyphBucks reframed as liability tracking layer',
      'Blockchain-anchored audit trail vs. internal DB records',
      'Consent-based architecture vs. merchant-initiated trust'
    ],
    outcome: 'Category Corrected',
    outcomeColor: 'bg-cyan-900/30 border-cyan-600',
    outcomeIcon: Cpu,
    outcomeIconColor: 'text-cyan-400',
    url: 'CaseStudyNUPS'
  }
];

export default function CaseStudies() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1324] via-[#1a244b] to-[#1e293b] py-20">
      <SEOHead
        title="Case Studies & Research - GlyphLock Security"
        description="Explore GlyphLock's internal research, technical validations, reported filings, and governance case studies in AI accountability and cybersecurity."
        keywords={['GlyphLock case studies', 'Master Covenant litigation', 'AI accountability research', 'legal tech victories', 'cybersecurity validation']}
        url="/case-studies"
      />

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Scale className="w-10 h-10 text-blue-400" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
              Case Studies & Research
            </h1>
          </div>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Internal research, documented integrations, reported filings, and technical breakthroughs in AI accountability
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto">
          <StatCard number="5" label="Case Studies" />
          <StatCard number="6" label="AI Systems Documented" />
          <StatCard number="1" label="OHIP Connection" />
          <StatCard number="2026" label="Active Year" />
        </div>

        {/* Featured case-study tabs */}
        <div className="max-w-6xl mx-auto mb-8 overflow-x-auto">
          <div className="inline-flex min-w-full gap-2 rounded-2xl border border-blue-700/40 bg-blue-950/40 p-2 sm:min-w-0">
            <Link to={createPageUrl('CaseStudies')} className="flex-1">
              <Button className="w-full bg-blue-600 text-white hover:bg-blue-500">All Studies</Button>
            </Link>
            <Link to={createPageUrl('CaseStudyOracleOHIP')} className="flex-1">
              <Button variant="outline" className="w-full whitespace-nowrap border-emerald-500/50 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20">
                Oracle OHIP
                <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase">Verified</span>
              </Button>
            </Link>
            <Link to={createPageUrl('CaseStudyNUPS')} className="flex-1">
              <Button variant="outline" className="w-full whitespace-nowrap border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20">
                NUPS Compliance OS
              </Button>
            </Link>
          </div>
        </div>

        {/* Case Studies Grid */}
        <div className="max-w-6xl mx-auto space-y-6">
          {CASE_STUDIES.map((study) => (
            <CaseStudyCard key={study.id} study={study} />
          ))}
        </div>

        {/* Coming Soon */}
        <div className="mt-12 text-center">
          <Card className="bg-blue-900/30 border-blue-700/40 backdrop-blur-sm max-w-2xl mx-auto">
            <CardContent className="pt-8 pb-8">
              <FileText className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">More Case Studies Coming Soon</h3>
              <p className="text-blue-200">
                NIST GenAI Challenge outcomes, federal evaluations, and technical validation reports will be published here as they become available.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CaseStudyCard({ study }) {
  const Icon = study.icon;
  
  return (
    <Card className="bg-blue-900/30 border-blue-700/40 backdrop-blur-sm hover:border-blue-500/60 transition-all group">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Icon className="w-6 h-6 text-blue-400" />
              <Badge className={`${study.badgeColor} text-white font-bold`}>
                {study.badge}
              </Badge>
              <span className="text-sm text-blue-200">{study.date}</span>
            </div>
            <CardTitle className="text-2xl md:text-3xl text-white mb-3">
              {study.title}
            </CardTitle>
            <CardDescription className="text-base text-blue-100">
              {study.summary}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Points */}
        <div>
          <h4 className="text-sm font-bold text-blue-300 mb-3 uppercase">Key Findings</h4>
          <div className="grid md:grid-cols-2 gap-3">
            {study.keyPoints.map((point, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-blue-100">{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Outcome Banner */}
        <div className={`${study.outcomeColor || 'bg-green-900/30 border-green-600'} border-2 rounded-lg p-4`}>
          <div className="flex items-center gap-3">
            {study.outcomeIcon ? (
              <study.outcomeIcon className={`w-6 h-6 ${study.outcomeIconColor || 'text-green-400'}`} />
            ) : (
              <Trophy className="w-6 h-6 text-green-400" />
            )}
            <div>
              <div className={`text-sm font-medium ${study.outcomeColor ? 'text-amber-300' : 'text-green-300'}`}>
                {study.outcomeColor ? 'Current Status' : 'Final Outcome'}
              </div>
              <div className="text-lg font-bold text-white">{study.outcome}</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link to={createPageUrl(study.url)}>
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            Read Full Case Study
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function StatCard({ number, label }) {
  return (
    <div className="bg-blue-900/30 border-2 border-blue-700/40 backdrop-blur-sm rounded-lg p-4 text-center">
      <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-1">{number}</div>
      <div className="text-xs md:text-sm text-blue-200 font-medium">{label}</div>
    </div>
  );
}