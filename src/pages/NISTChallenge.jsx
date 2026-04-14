/**
 * GlyphLock | NIST Cybersecurity Alignment
 * Active project tracking — ongoing alignment with NIST standards
 */

import React, { useState } from 'react';
import SEOHead from '@/components/SEOHead';

const NIST_PROJECTS = [
  {
    id: 1,
    status: 'active',
    date: 'April 2026',
    title: 'NIST CSF 2.0 — Govern Function Mapping',
    nistRef: 'CSF 2.0 | GV.OC, GV.RM',
    description:
      'Mapping GlyphLock\'s internal governance controls (venue policy enforcement, role-based access, audit chain) to the CSF 2.0 Govern function. Documenting how RBAC, session tokens, and audit logs satisfy GV.OC-01 through GV.RM-07.',
    involvement: [
      'Defined RBAC role matrix against CSF 2.0 organizational context outcomes',
      'Drafted internal governance policy documentation for GV.OC alignment',
      'Linked NUPS session controls to GV.RM risk management practices',
    ],
  },
  {
    id: 2,
    status: 'active',
    date: 'March 2026',
    title: 'NIST SP 800-63B — Identity Assurance Level 2',
    nistRef: 'SP 800-63B | AAL2',
    description:
      'Aligning GlyphLock\'s multi-factor authentication (MFA) system, thumbprint capture, government ID verification, and VIP contract signing flow to NIST SP 800-63B Authenticator Assurance Level 2 requirements.',
    involvement: [
      'MFA system built to AAL2 spec — TOTP + recovery code architecture',
      'Biometric thumbprint capture documented as memorized secret + possession factor',
      'ID verification flow mapped to identity proofing requirements',
    ],
  },
  {
    id: 3,
    status: 'active',
    date: 'February 2026',
    title: 'NIST AI RMF 1.0 — AI Risk in Financial Workflows',
    nistRef: 'AI RMF 1.0 | MAP, MEASURE',
    description:
      'Applying the NIST AI Risk Management Framework to GlyphLock\'s AI-powered features — GlyphBot, AI image validation, AI audit scoring, and LLM-backed contract review. Documenting risk categorization and measurement protocols.',
    involvement: [
      'Mapped GlyphBot LLM output risks under AI RMF MAP function',
      'Implemented human-review gates for AI-generated contract summaries',
      'Drafted AI audit log format aligned to MEASURE traceability guidance',
    ],
  },
  {
    id: 4,
    status: 'completed',
    date: 'January 2026',
    title: 'NIST CSWP 50 — Public Commentary Submission',
    nistRef: 'CSWP 50 | Small Business Cybersecurity',
    description:
      'Submitted formal public commentary on NIST Cybersecurity White Paper 50, addressing gaps in cybersecurity guidance for non-employer and micro-business financial systems operating in cash-and-card environments.',
    involvement: [
      'Submitted commentary advocating for transaction defensibility as a core control',
      'Proposed automated audit trail requirements for small business point-of-sale systems',
      'Recommended identity verification standards for high-risk financial interactions',
    ],
  },
  {
    id: 5,
    status: 'planned',
    date: 'Q3 2026',
    title: 'NIST SP 800-218 — Secure Software Development Framework',
    nistRef: 'SSDF | PO, PS, PW, RV',
    description:
      'Preparing GlyphLock\'s development lifecycle for alignment with NIST SSDF. Will document secure coding practices, dependency management, vulnerability disclosure, and response procedures across all production functions.',
    involvement: [
      'Drafting SSDF task checklist for Base44 backend function development',
      'Scoping automated vulnerability scan integration for CI/CD pipeline',
      'Planning formal response procedure for security disclosures',
    ],
  },
];

const statusConfig = {
  active: { label: 'Active', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  completed: { label: 'Completed', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  planned: { label: 'Planned', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
};

export default function NISTAlignmentPage() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="bg-black text-white font-sans min-h-screen">
      <SEOHead
        title="GlyphLock | NIST Cybersecurity Alignment"
        description="GlyphLock's active alignment with NIST cybersecurity standards — CSF 2.0, SP 800-63B, AI RMF, and more. Ongoing projects with dates and documented involvement."
        keywords={['NIST CSF 2.0', 'NIST SP 800-63B', 'NIST AI RMF', 'cybersecurity alignment', 'GlyphLock', 'SSDF', 'CSWP 50']}
        url="/NISTChallenge"
      />

      {/* HERO */}
      <section className="pt-24 pb-16 px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block"></span>
          Active Alignment Program
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
          NIST Cybersecurity<br />
          <span className="text-blue-400">Alignment</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
          GlyphLock actively tracks and implements current NIST projects across our platform —
          documenting every standard we align to, when we started, and exactly what we built.
        </p>
      </section>

      {/* STATS BAR */}
      <section className="py-8 px-6 border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-3xl font-bold text-blue-400">
              {NIST_PROJECTS.filter(p => p.status === 'active').length}
            </p>
            <p className="text-gray-500 text-sm mt-1">Active Projects</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-400">
              {NIST_PROJECTS.filter(p => p.status === 'completed').length}
            </p>
            <p className="text-gray-500 text-sm mt-1">Completed</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-yellow-400">
              {NIST_PROJECTS.filter(p => p.status === 'planned').length}
            </p>
            <p className="text-gray-500 text-sm mt-1">In Pipeline</p>
          </div>
        </div>
      </section>

      {/* PROJECT TIMELINE */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-12 text-gray-200">Project Timeline</h2>
        <div className="space-y-4">
          {NIST_PROJECTS.map((project) => {
            const isOpen = expanded === project.id;
            const sc = statusConfig[project.status];
            return (
              <div
                key={project.id}
                className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                {/* Header Row */}
                <button
                  className="w-full text-left px-6 py-5 flex items-start md:items-center justify-between gap-4"
                  onClick={() => setExpanded(isOpen ? null : project.id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-3 flex-1 min-w-0">
                    <span className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full border ${sc.color}`}>
                      {sc.label}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-base leading-snug">{project.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{project.nistRef} · {project.date}</p>
                    </div>
                  </div>
                  <span className="text-gray-500 text-lg shrink-0 mt-0.5 md:mt-0">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                {/* Expanded Detail */}
                {isOpen && (
                  <div className="px-6 pb-6 border-t border-white/5 pt-5">
                    <p className="text-gray-400 text-sm leading-relaxed mb-5">
                      {project.description}
                    </p>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        GlyphLock Involvement
                      </p>
                      <ul className="space-y-2">
                        {project.involvement.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* OUR POSITION */}
      <section className="py-16 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-gray-200">Our Position</h2>
          <div className="space-y-4 text-gray-400 text-base leading-relaxed">
            <p>
              GlyphLock doesn't wait for standards to finalize before building. We map our architecture
              to NIST guidance in real time — as publications are drafted, reviewed, and released.
            </p>
            <p>
              Every system we ship — from MFA and audit trails to AI-backed contract review — is
              documented against the specific NIST controls it satisfies. That documentation is part
              of the product, not an afterthought.
            </p>
            <p className="text-white font-medium">
              Standards alignment is a continuous build, not a checkbox.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-2xl font-semibold mb-3">Follow the Build</h2>
        <p className="text-gray-500 mb-8 text-sm">
          New projects are added as NIST publishes and we align.
        </p>
        <button
          onClick={() => window.location.href = '/Consultation'}
          className="px-8 py-3.5 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition text-sm"
        >
          Talk to the Team
        </button>
      </section>

      <footer className="py-10 text-center text-gray-600 text-xs border-t border-white/5">
        © 2026 GlyphLock LLC. All rights reserved.
      </footer>
    </div>
  );
}