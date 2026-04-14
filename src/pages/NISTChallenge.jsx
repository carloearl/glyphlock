/**
 * GlyphLock | NIST Cybersecurity Alignment Page
 * Aligned to NIST CSWP 50 public commentary & CSF 2.0
 */

import React from 'react';
import SEOHead from '@/components/SEOHead';

export default function NISTChallengePage() {
  return (
    <div className="bg-black text-white font-sans min-h-screen">
      <SEOHead
        title="GlyphLock | NIST Cybersecurity Alignment"
        description="Aligning real-world financial systems with emerging NIST cybersecurity standards. GlyphLock is actively participating in public commentary on NIST CSWP 50."
        keywords={['NIST CSWP 50', 'NIST CSF 2.0', 'cybersecurity alignment', 'small business', 'GlyphLock', 'audit trail', 'transaction defensibility']}
        url="/NISTChallenge"
      />

      {/* HERO */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center px-6">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          GlyphLock
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mb-8">
          Aligning real-world financial systems with emerging cybersecurity standards.
        </p>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-2xl">
          <p className="text-gray-400 text-lg">
            Actively participating in public commentary on NIST CSWP 50 to help shape cybersecurity guidance for small business systems.
          </p>
        </div>
      </section>

      {/* WHAT WE'RE DOING */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-semibold mb-10 text-center">
          What We're Doing
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 border border-white/10 rounded-xl bg-white/5">
            <h3 className="text-xl font-semibold mb-3">Standards Alignment</h3>
            <p className="text-gray-400">
              Mapping GlyphLock architecture to NIST Cybersecurity Framework 2.0 principles, focusing on real-world transaction systems.
            </p>
          </div>
          <div className="p-6 border border-white/10 rounded-xl bg-white/5">
            <h3 className="text-xl font-semibold mb-3">Public Contribution</h3>
            <p className="text-gray-400">
              Submitting formal commentary to help define cybersecurity guidance for non-employer firms and emerging digital systems.
            </p>
          </div>
          <div className="p-6 border border-white/10 rounded-xl bg-white/5">
            <h3 className="text-xl font-semibold mb-3">Risk Innovation</h3>
            <p className="text-gray-400">
              Introducing concepts like transaction defensibility, automated audit trails, and self-service identity verification.
            </p>
          </div>
        </div>
      </section>

      {/* WHY IT MATTERS */}
      <section className="py-20 px-6 bg-white/5">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-8">
            Why This Matters
          </h2>
          <p className="text-gray-300 text-lg mb-10">
            Small businesses represent over 80% of the U.S. market and are increasingly exposed to cybersecurity, financial, and compliance risks.
            Current standards are evolving — and real-world systems must evolve with them.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 border border-white/10 rounded-xl">
              <p className="text-xl font-semibold mb-2">34.8M</p>
              <p className="text-gray-400">Small Businesses in the U.S.</p>
            </div>
            <div className="p-6 border border-white/10 rounded-xl">
              <p className="text-xl font-semibold mb-2">81.9%</p>
              <p className="text-gray-400">Operate Without Employees</p>
            </div>
            <div className="p-6 border border-white/10 rounded-xl">
              <p className="text-xl font-semibold mb-2">0→1</p>
              <p className="text-gray-400">From Informal to Audit-Ready Systems</p>
            </div>
          </div>
        </div>
      </section>

      {/* OUR POSITION */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-semibold mb-10 text-center">
          Our Position
        </h2>
        <div className="space-y-6 max-w-3xl mx-auto text-gray-300 text-lg">
          <p>
            Cybersecurity for small businesses must move beyond theoretical controls and into real, verifiable systems.
          </p>
          <p>
            Every transaction, interaction, and identity event should be recorded, structured, and defensible.
          </p>
          <p>
            Systems must reduce reliance on human memory and manual processes, replacing them with automated, immutable records.
          </p>
          <p className="text-white font-semibold">
            GlyphLock is building infrastructure for that future.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-semibold mb-6">
          Follow the Build
        </h2>
        <p className="text-gray-400 mb-8">
          As standards evolve, so does the system.
        </p>
        <button
          onClick={() => window.location.href = '/Consultation'}
          className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition"
        >
          Request Early Access
        </button>
      </section>

      {/* FOOTER */}
      <footer className="py-10 text-center text-gray-500 text-sm border-t border-white/5">
        © 2026 GlyphLock LLC. All rights reserved.
      </footer>
    </div>
  );
}