import React, { useEffect } from "react";
import SEOHead from "@/components/SEOHead";
import { injectServiceSchema } from "@/components/utils/seoHelpers";

import VerificationIntro from "@/components/verification/VerificationIntro";
import EngagementOptions from "@/components/verification/EngagementOptions";
import VerificationFramework from "@/components/verification/VerificationFramework";
import VerificationDeliverables from "@/components/verification/VerificationDeliverables";
import AlignmentTiers from "@/components/verification/AlignmentTiers";
import ImportantNotice from "@/components/verification/ImportantNotice";
import VerificationIntakeForm from "@/components/verification/VerificationIntakeForm";

export default function Consultation() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('cancelled') === 'true') {
      // User returned from cancelled payment — stay on page
    }
  }, []);

  useEffect(() => {
    const cleanup = injectServiceSchema(
      'Independent Protocol Verification',
      'Structured governance and security alignment review under the Deterministic Risk Profile and Master Covenant framework. Evaluates system architecture, documentation discipline, threat exposure posture, and enforceability positioning.',
      '/consultation'
    );
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen text-white pt-14 md:pt-20 pb-12 md:pb-16" style={{ background: 'transparent' }}>
      <SEOHead
        title="Independent Protocol Verification | GlyphLock Security"
        description="Structured governance and security alignment review under the Deterministic Risk Profile and Master Covenant framework. Enterprise security platform verification for AI governance framework alignment, post-quantum readiness, and zero-trust architecture."
        keywords="AI governance framework, enterprise security platform, post-quantum readiness, zero-trust architecture, SOC 2 aligned, NIST post-quantum standards, protocol verification, security alignment review"
        url="/consultation"
      />

      <div className="container mx-auto px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">

          {/* Hero Header — Preserved */}
          <div className="text-center mb-16 md:mb-24">
            <p className="text-[10px] uppercase tracking-[5px] text-amber-500/70 mb-6 font-medium">
              GlyphLock Security LLC
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight leading-tight px-2">
              Independent Protocol Verification
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto px-2 leading-relaxed">
              Structured governance alignment review under the Master Covenant framework.
            </p>
          </div>

          {/* Body Sections */}
          <VerificationIntro />
          <EngagementOptions />
          <VerificationFramework />
          <VerificationDeliverables />
          <AlignmentTiers />
          <ImportantNotice />
          <VerificationIntakeForm />

          {/* Final CTA */}
          <div className="text-center pb-8">
            <p className="text-xs text-slate-400 mb-2">Questions about the verification process?</p>
            <a href="mailto:support@glyphlock.io" className="text-slate-300 hover:text-white font-medium transition-colors text-sm">
              support@glyphlock.io
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}