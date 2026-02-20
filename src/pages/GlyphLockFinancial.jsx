import React from "react";
import SEOHead from "@/components/SEOHead";
import FinancialHero from "@/components/financial/FinancialHero";
import FrameworkAuthority from "@/components/financial/FrameworkAuthority";
import DeterministicRiskProfile from "@/components/financial/DeterministicRiskProfile";
import VerifiedOperationsStandard from "@/components/financial/VerifiedOperationsStandard";
import QualificationAssessment from "@/components/financial/QualificationAssessment";
import UnderwritingDossier from "@/components/financial/UnderwritingDossier";
import ProceduralAlignment from "@/components/financial/ProceduralAlignment";
import SubmissionPreparedness from "@/components/financial/SubmissionPreparedness";
import InstitutionalFooter from "@/components/financial/InstitutionalFooter";

export default function GlyphLockFinancial() {
  return (
    <>
      <SEOHead
        title="GlyphLock Financial LLC | Operational Qualification Architecture"
        description="GlyphLock Financial establishes a structured operational qualification architecture for nightlife and entertainment venues operating within high-scrutiny underwriting environments."
        keywords="GlyphLock Financial, operational qualification, underwriting, deterministic risk profile, verified operations standard, compliance framework"
        url="/glyphlock-financial"
      />

      <div className="text-white min-h-screen" style={{ background: 'transparent' }}>
        {/* HERO — FROZEN / IMMUTABLE */}
        <FinancialHero />

        {/* SOVEREIGN FRAMEWORK SECTIONS */}
        <FrameworkAuthority />
        <DeterministicRiskProfile />
        <VerifiedOperationsStandard />
        <QualificationAssessment />
        <UnderwritingDossier />
        <ProceduralAlignment />
        <SubmissionPreparedness />
        <InstitutionalFooter />
      </div>
    </>
  );
}