import React from "react";
import PreviewPageShell from "@/components/demo/PreviewPageShell";
import { Play } from "lucide-react";

export default function DemoOpenNightPreview() {
  return (
    <PreviewPageShell
      title="Open Night"
      subtitle="Shift Initialization"
      description="Open Night initializes the shift, unlocks the cash drawer, and prepares all downstream modules for the evening's operations — POS, VIP Board, Compliance, and Close Night all inherit from a single opening state."
      icon={Play}
      referralSource="open-night-preview"
    />
  );
}