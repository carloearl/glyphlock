/**
 * VibeBadge - Color-coded vibe label with tooltip
 */
import React from "react";
import { VIBE_META } from "../types/mixerTypes";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function VibeBadge({ vibe, size = "sm" }) {
  const meta = VIBE_META[vibe] || { label: vibe, color: "#6b7280", description: "" };
  const sizeClasses = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center rounded-full font-semibold border ${sizeClasses}`}
            style={{
              color: meta.color,
              borderColor: `${meta.color}50`,
              backgroundColor: `${meta.color}15`,
            }}
          >
            {meta.label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-slate-800 border-slate-700 text-white text-xs">
          {meta.description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}