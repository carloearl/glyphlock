/**
 * NIST GenAI Challenge Page
 * Federal validation of GlyphLock's AI accountability platform
 */

import React from 'react';
import SEOHead from '@/components/SEOHead';
import Hero from '@/components/nist/Hero';
import DifferenceComparison from '@/components/nist/DifferenceComparison';
import ModalityTabs from '@/components/nist/ModalityTabs';
import Timeline from '@/components/nist/Timeline';
import ComparisonTable from '@/components/nist/ComparisonTable';
import TechnicalCredentials from '@/components/nist/TechnicalCredentials';
import TechnicalFooter from '@/components/nist/TechnicalFooter';

export default function NISTChallengePage() {
  return (
    <div className="nist-challenge-page">
      <SEOHead
        title="GlyphLock NIST GenAI Challenge Participation | Federal AI Validation 2026"
        description="GlyphLock LLC competing in NIST GenAI Challenge across Text, Image, and Code modalities. First legal-technical hybrid AI governance platform validated by federal evaluation."
        keywords={[
          'NIST GenAI Challenge',
          'AI detection',
          'Master Covenant',
          'federal validation',
          'AI governance',
          'text discriminator',
          'image forensics',
          'code generation',
          'AI accountability',
          'GlyphLock'
        ]}
        image="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/d92107808_glyphlock-3d-logo.png"
        url="/nist-challenge"
      />

      {/* Hero Section */}
      <Hero />

      {/* What Makes GlyphLock Different */}
      <DifferenceComparison />

      {/* Overview Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300 shadow-sm">
              <h3 className="text-xl md:text-2xl font-bold mb-4 text-gray-900">What is NIST GenAI?</h3>
              <p className="text-gray-800 leading-relaxed text-sm md:text-base">
                The National Institute of Standards and Technology (NIST) GenAI Challenge 
                evaluates generative AI systems across five modalities: text, image, code, 
                audio, and video. As a federal standards agency, NIST provides independent, 
                rigorous evaluation of AI capabilities and limitations.
              </p>
            </div>
            <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-400 shadow-sm">
              <h3 className="text-xl md:text-2xl font-bold mb-4 text-gray-900">Our Participation</h3>
              <ul className="space-y-2 text-gray-800 text-sm md:text-base">
                <li className="flex items-center gap-2">
                  <span className="text-green-700 font-bold">✓</span> Text Discriminator (Text-D)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-700 font-bold">✓</span> Text Prompter (Text-P)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-700 font-bold">✓</span> Image Discriminator (Image-D)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-700 font-bold">✓</span> Code Generator (Code-G)
                </li>
              </ul>
              <p className="text-sm text-gray-700 mt-4 font-semibold">
                Timeline: Jan 28 - Jun 17, 2026
              </p>
            </div>
            <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-400 shadow-sm">
              <h3 className="text-xl md:text-2xl font-bold mb-4 text-gray-900">Why This Matters</h3>
              <ul className="space-y-2 text-gray-800 text-sm md:text-base font-medium">
                <li>• Third-party credibility</li>
                <li>• Benchmark vs. competitors</li>
                <li>• Technical validation</li>
                <li>• Patent methodology proof</li>
                <li>• Regulatory foundation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Modality Tabs */}
      <ModalityTabs />

      {/* Comparison Table */}
      <ComparisonTable />

      {/* Technical Credentials */}
      <TechnicalCredentials />

      {/* Timeline */}
      <Timeline />

      {/* Technical Footer */}
      <TechnicalFooter />

      {/* Disclaimer Footer */}
      <section className="py-8 bg-gray-100 border-t-2 border-gray-300">
        <div className="container mx-auto px-4">
          <p className="text-sm text-gray-800 text-center max-w-4xl mx-auto leading-relaxed">
            <strong className="text-gray-900">Disclaimer:</strong> GlyphLock LLC is a participant in the NIST GenAI Challenge. 
            Participation does not constitute endorsement by NIST or the U.S. Government. 
            NIST does not approve, recommend, or endorse any commercial products or services. 
            Performance metrics are preliminary and subject to change pending official evaluation 
            results (Summer 2026).
          </p>
        </div>
      </section>
    </div>
  );
}