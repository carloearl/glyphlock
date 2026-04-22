import React from "react";
import PreviewPageShell from "@/components/demo/PreviewPageShell";
import { Crown } from "lucide-react";

export default function DemoVipBoardPreview() {
  return (
    <PreviewPageShell
      title="VIP Board"
      subtitle="VIP Room Operations"
      description="The VIP Board controls every room in real time — occupancy, entertainer assignment, running tabs, and contract status at a glance. Managers see the full floor from one pane and move rooms between states in a single tap."
      icon={Crown}
      referralSource="vip-board-preview"
    />
  );
}