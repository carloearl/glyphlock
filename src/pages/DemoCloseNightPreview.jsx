import React from "react";
import PreviewPageShell from "@/components/demo/PreviewPageShell";
import { Lock } from "lucide-react";

export default function DemoCloseNightPreview() {
  return (
    <PreviewPageShell
      title="Close Night"
      subtitle="End-of-Shift Reconciliation"
      description="Close Night walks the manager through cash count, sales review, VIP revenue review, and generates the Z Report for closeout. Every number reconciles back to the opening state — no drift, no guesswork."
      icon={Lock}
      referralSource="close-night-preview"
    />
  );
}