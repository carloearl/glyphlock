import React from "react";
import PreviewPageShell from "@/components/demo/PreviewPageShell";
import { Shield } from "lucide-react";

export default function DemoCompliancePreview() {
  return (
    <PreviewPageShell
      title="Compliance"
      subtitle="Audit & Documentation"
      description="Compliance manages contracts, scan-backs, and entertainer documentation with GlyphLock audit trails. Every signed contract, ID scan, and attestation is tied to a transaction and retrievable on demand."
      icon={Shield}
      referralSource="compliance-preview"
    />
  );
}