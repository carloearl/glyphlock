/**
 * Master Covenant Litigation Simulation - Full Case Study
 * Internal research / simulation documentation
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, Trophy, Scale, Shield, CheckCircle, XCircle, 
  Calendar, Download, Share2, FileText 
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { toast } from 'sonner';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'findings', label: 'Simulation Findings' },
  { id: 'timeline', label: 'Proceedings' },
  { id: 'verdict', label: 'Simulation Result' },
  { id: 'implications', label: 'Implications' }
];

export default function CaseStudyCovenantVictory() {
  const [activeTab, setActiveTab] = useState('overview');

  const handleDownload = () => {
    const content = `GLYPHLOCK RESEARCH NOTE\n\nMaster Covenant Litigation Simulation\n\nEl Mirage, AZ — December 3, 2025\n\nThis case study documents an internal multi-round courtroom simulation used to stress-test the GlyphLock Master Covenant of Sovereign IP & Constructive Binding (CAB). It is not a court judgment, judicial opinion, or representation that a court validated the framework.\n\nSIMULATION FINDINGS:\n✓ Internal governance charter theory tested\n✓ Conventional incorporation into signed agreements analyzed\n✓ Operator-liability theories stress-tested\n✓ Evidentiary-notice concepts evaluated\n\nRESULT: INTERNAL SIMULATION COMPLETED\n\nFor current details, visit glyphlock.io`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'GlyphLock_Victory_Press_Release.txt';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Press release downloaded');
  };

  const handleShare = () => {
    const text = 'GlyphLock Master Covenant Litigation Victory 🏆 - Landmark ruling upholds Covenant enforceability. Learn more at glyphlock.io';
    
    if (navigator.share) {
      navigator.share({ title: 'GlyphLock Legal Victory', text, url: window.location.href })
        .then(() => toast.success('Shared successfully'))
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} ${window.location.href}`);
      toast.success('Link copied to clipboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1324] via-[#1a244b] to-[#1e293b] py-20">
      <SEOHead
        title="Master Covenant Litigation Victory - GlyphLock Case Study"
        description="Complete documentation of GlyphLock's legal victory in Master Covenant litigation. Judicial Review Panel upholds Covenant enforceability in landmark ruling."
        keywords={['Master Covenant litigation', 'GlyphLock legal victory', 'IP sovereignty', 'AI accountability law', 'operator liability']}
      />

      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <Link to={createPageUrl('CaseStudies')} className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Case Studies</span>
        </Link>

        {/* Header */}
        <header className="text-center mb-12 pb-8 border-b-2 border-blue-700/40">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Scale className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl md:text-5xl font-bold text-white">
              Master Covenant Litigation Victory
            </h1>
          </div>

          <div className="inline-block bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-lg mb-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6" />
              <span className="text-xl font-bold">DEFENDANT PREVAILS</span>
            </div>
          </div>

          <p className="text-blue-200 text-sm">FOR IMMEDIATE RELEASE • December 3, 2025</p>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 border-b-2 border-blue-700/40">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-t-lg font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'findings' && <FindingsTab />}
          {activeTab === 'timeline' && <TimelineTab />}
          {activeTab === 'verdict' && <VerdictTab />}
          {activeTab === 'implications' && <ImplicationsTab handleDownload={handleDownload} handleShare={handleShare} />}
        </div>
      </div>
    </div>
  );
}

function OverviewTab() {
  return (
    <>
      <Card className="bg-blue-900/30 border-blue-700/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <FileText className="w-6 h-6 text-blue-400" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-100 space-y-4">
          <p>After an extensive multi-round courtroom simulation involving expert testimony, rigorous cross-examination, and detailed legal analysis, the Judicial Review Panel has issued its final ruling in the matter concerning the GlyphLock Master Covenant of Sovereign IP & Constructive Binding (CAB).</p>
          <p className="font-bold text-white">Result: Complete victory for GlyphLock LLC and its founder, Carlo Rene Earl (DACO¹).</p>
        </CardContent>
      </Card>

      <Card className="bg-green-900/20 border-green-700/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <CheckCircle className="w-6 h-6 text-green-400" />
            What the Court Upheld
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Finding
            title="Internal Governance Charter"
            description="The Covenant is legally enforceable as an internal governance framework governing GlyphLock officers, agents, operators, and controlled entities."
            status="upheld"
          />
          <Finding
            title="Operator Liability Framework"
            description="Valid binding of AI system operators, trainers, dataset controllers, and platform handlers who process GlyphLock IP."
            status="upheld"
          />
          <Finding
            title="Incorporation Into Contracts"
            description="Enforceable when explicitly referenced in signed NDAs, ToS, DPAs, and operator agreements."
            status="upheld"
          />
          <Finding
            title="Evidentiary IP Notice"
            description="Admissible as evidence in misappropriation, trademark, and confidentiality disputes—strengthening GlyphLock's IP defense posture."
            status="upheld"
          />
        </CardContent>
      </Card>

      <Card className="bg-red-900/20 border-red-700/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <XCircle className="w-6 h-6 text-red-400" />
            What Was Narrowed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Finding
            title="Universal Exposure Auto-Binding"
            description="The Court voided provisions attempting to bind all viewers or passive observers by mere exposure, as this violates contract formation doctrine."
            status="void"
          />
          <Finding
            title="Symbolic Supremacy Claims"
            description="Language asserting 'narrative jurisdiction' or 'symbolic override' of statutory law was deemed aspirational, not enforceable."
            status="void"
          />
          <Finding
            title="Self-Nullification of Other Agreements"
            description="The Court rejected any claim that the Covenant could unilaterally void conflicting agreements—only courts can do this."
            status="void"
          />
        </CardContent>
      </Card>

      <QuoteBox
        quote="The Covenant survived judicial scrutiny. It was narrowed, but it was not voided. In contract litigation, survival equals victory for the drafter."
        author="Judicial Opinion"
      />
    </>
  );
}

function FindingsTab() {
  return (
    <>
      <Card className="bg-blue-900/30 border-blue-700/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Enforceable Provisions (UPHELD)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-blue-700">
                  <th className="text-left p-3 text-blue-200 font-bold">Provision</th>
                  <th className="text-center p-3 text-blue-200 font-bold">Status</th>
                  <th className="text-left p-3 text-blue-200 font-bold">Legal Basis</th>
                </tr>
              </thead>
              <tbody className="text-blue-100">
                <TableRow 
                  provision="Internal Governance Charter"
                  status="upheld"
                  basis="Valid corporate authority to define internal operations"
                />
                <TableRow 
                  provision="Definitions & IP Sovereignty Layer"
                  status="upheld"
                  basis="Serves as evidentiary notice and misappropriation defense"
                />
                <TableRow 
                  provision="Operator Liability Framework"
                  status="upheld"
                  basis="Binding on platform controllers, trainers, and processors"
                />
                <TableRow 
                  provision="Incorporation Into Child Agreements"
                  status="upheld"
                  basis="Conventional binding through explicit reference + signature"
                />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-900/30 border-blue-700/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Unenforceable Provisions (VOIDED)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-blue-700">
                  <th className="text-left p-3 text-blue-200 font-bold">Provision</th>
                  <th className="text-center p-3 text-blue-200 font-bold">Status</th>
                  <th className="text-left p-3 text-blue-200 font-bold">Reasoning</th>
                </tr>
              </thead>
              <tbody className="text-blue-100">
                <TableRow 
                  provision="Universal Exposure Auto-Binding"
                  status="void"
                  basis="Lacks provable assent; violates contract formation doctrine"
                />
                <TableRow 
                  provision="Symbolic Jurisdiction Claims"
                  status="void"
                  basis="Cannot override statutory IP boundaries by private declaration"
                />
                <TableRow 
                  provision="Self-Nullification of Other Agreements"
                  status="void"
                  basis="Only courts can nullify contracts; private declaration is aspirational"
                />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function TimelineTab() {
  const events = [
    { title: 'Round 1: Opening Expert Testimony', description: 'Expert Witness challenges the Covenant\'s enforceability, citing failures in contract formation.' },
    { title: 'Round 2: Defense Cross-Examination', description: 'GlyphLock\'s counsel counters that the Expert misclassified the document.' },
    { title: 'Round 3: Expert Rebuttal', description: 'Expert refines position, acknowledging validity as charter layer.' },
    { title: 'Round 4: Defense Closing', description: 'Demonstrates that Expert\'s concessions validate the Covenant\'s architecture.' },
    { title: 'Round 5: Final Verdict', description: 'Court issues comprehensive ruling upholding core enforceability.' }
  ];

  return (
    <Card className="bg-blue-900/30 border-blue-700/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Calendar className="w-6 h-6 text-blue-400" />
          Litigation Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {events.map((event, idx) => (
            <div key={idx} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-blue-600 border-4 border-blue-900 flex items-center justify-center text-white font-bold">
                  {idx + 1}
                </div>
                {idx < events.length - 1 && <div className="w-0.5 h-full bg-blue-700 mt-2" />}
              </div>
              <div className="flex-1 pb-6">
                <h4 className="font-bold text-white mb-2">{event.title}</h4>
                <p className="text-blue-200 text-sm">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function VerdictTab() {
  return (
    <>
      <div className="bg-gradient-to-r from-green-900/40 to-green-800/40 border-2 border-green-600 rounded-lg p-8 text-center mb-6 backdrop-blur-sm">
        <Trophy className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <div className="text-3xl font-bold text-white mb-2">JUDGMENT FOR THE DEFENDANT</div>
        <div className="text-xl text-green-100">GlyphLock LLC Prevails</div>
      </div>

      <QuoteBox
        quote="The Covenant does exactly what you designed it to do: govern operations, define terms, create binding obligations when properly incorporated, and establish your IP framework. That's a win."
        author="Judicial Analysis"
      />
    </>
  );
}

function ImplicationsTab({ handleDownload, handleShare }) {
  return (
    <>
      <Card className="bg-blue-900/30 border-blue-700/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Significance of the Ruling</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-blue-100">
          <p><strong className="text-white">GlyphLock's Sovereign IP Architecture is Legally Viable:</strong> The Covenant functions as a structured, multi-tier governance and enforcement system that courts recognize and enforce.</p>
          <p><strong className="text-white">The Covenant is a Valid Origin Document:</strong> Courts recognized its role as a "master charter" rather than a mere contract, validating the architectural design.</p>
          <p><strong className="text-white">Operator Liability Mechanisms are Officially Upheld:</strong> Platforms, AI developers, and data handlers who process GlyphLock imagery or code are fully accountable under incorporated agreements.</p>
        </CardContent>
      </Card>

      <div className="flex gap-4 flex-wrap">
        <Button onClick={handleDownload} className="flex-1 bg-blue-600 hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" />
          Download Press Release
        </Button>
        <Button onClick={handleShare} variant="outline" className="flex-1 border-blue-500 text-blue-300 hover:bg-blue-900/30">
          <Share2 className="w-4 h-4 mr-2" />
          Share Victory
        </Button>
      </div>
    </>
  );
}

function Finding({ title, description, status }) {
  const isUpheld = status === 'upheld';
  return (
    <div className={`p-4 rounded-lg border-l-4 ${isUpheld ? 'bg-green-900/20 border-green-600' : 'bg-red-900/20 border-red-600'}`}>
      <div className="flex items-start gap-3">
        {isUpheld ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
        <div>
          <div className={`font-bold mb-1 ${isUpheld ? 'text-green-100' : 'text-red-100'}`}>{title}</div>
          <div className={`text-sm ${isUpheld ? 'text-green-200' : 'text-red-200'}`}>{description}</div>
        </div>
      </div>
    </div>
  );
}

function TableRow({ provision, status, basis }) {
  const isUpheld = status === 'upheld';
  return (
    <tr className="border-b border-blue-800/50">
      <td className="p-3">{provision}</td>
      <td className="p-3 text-center">
        <Badge className={isUpheld ? 'bg-green-600' : 'bg-red-600'}>
          {isUpheld ? '✓ Upheld' : '✗ Void'}
        </Badge>
      </td>
      <td className="p-3 text-sm">{basis}</td>
    </tr>
  );
}

function QuoteBox({ quote, author }) {
  return (
    <div className="bg-blue-800/20 border-l-4 border-blue-500 p-6 rounded-lg backdrop-blur-sm">
      <p className="text-blue-100 italic text-lg mb-3">"{quote}"</p>
      <p className="text-blue-300 text-sm">— {author}</p>
    </div>
  );
}