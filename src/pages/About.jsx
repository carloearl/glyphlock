import React from "react";
import { MotionConfig } from "framer-motion";
import SEOHead from "../components/SEOHead";
import AboutHero from "../components/about/AboutHero";
import AboutSectionNav from "../components/about/AboutSectionNav";
import AboutOrigin, { ProofStrip } from "../components/about/AboutOrigin";
import AboutArchitecture from "../components/about/AboutArchitecture";
import TechnicalProofSystems from "../components/about/TechnicalProofSystems";
import ScenarioFlowExplorer from "../components/about/ScenarioFlowExplorer";
import NUPSOperatingProof from "../components/about/NUPSOperatingProof";
import {
  FinancialAccountability,
  TechnologyRecord,
  MaturityLedger,
  Leadership,
  FinalCTA,
} from "../components/about/AboutClosingSections";

export default function About() {
  return (
    <>
      <SEOHead />
      <MotionConfig reducedMotion="user">
        <main id="about-top" className="min-h-screen overflow-x-clip bg-[#020407] text-white">
          <AboutHero />
          <AboutSectionNav />
          <ProofStrip />
          <AboutOrigin />
          <AboutArchitecture />
          <TechnicalProofSystems />
          <ScenarioFlowExplorer />
          <NUPSOperatingProof />
          <FinancialAccountability />
          <TechnologyRecord />
          <MaturityLedger />
          <Leadership />
          <FinalCTA />
        </main>
      </MotionConfig>
    </>
  );
}
