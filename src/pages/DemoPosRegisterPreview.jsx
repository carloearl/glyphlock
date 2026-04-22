import React from "react";
import PreviewPageShell from "@/components/demo/PreviewPageShell";
import { CreditCard } from "lucide-react";

export default function DemoPosRegisterPreview() {
  return (
    <PreviewPageShell
      title="POS Register"
      subtitle="Live Sales Operations"
      description="The POS Register handles bar and front-of-house sales with live batch reconciliation and automatic GlyphBucks tracking in notes. Cash + card are the only inputs into total sales — GlyphBucks are tracked as liability, not revenue."
      icon={CreditCard}
      referralSource="pos-register-preview"
    />
  );
}