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
        title="GlyphLock Financial | Operational Qualification Architecture | GlyphLock Security LLC"
        description="Structured operational qualification architecture for entertainment and hospitality venues operating within high-scrutiny underwriting environments. Deterministic risk profiling and verified operations standards."
        keywords="GlyphLock Financial, operational qualification, underwriting architecture, deterministic risk profile, verified operations standard"
        url="/glyphlock-financial"
      />

      <div className="text-white min-h-screen" style={{ background: 'transparent' }}>
        <FinancialHero />
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