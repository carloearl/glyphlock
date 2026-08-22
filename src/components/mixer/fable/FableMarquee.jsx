/**
 * FableMarquee — the bottom scrolling ticker bar.
 * Scrolls left → right by default (operator-switchable), with its own
 * independent font family and text size.
 */
import React from "react";
import { getFont } from "./fableThemes";
import { useActiveVenue } from "@/hooks/useActiveVenue";

export default function FableMarquee({ settings, track, accent }) {
  const venue = useActiveVenue();
  const venueName = venue?.name || "Dream Palace";
  const dayOfWeek = new Date().toLocaleDateString(undefined, { weekday: "long" });
  const copy =
    settings.marqueeText?.trim() ||
    `${venueName} · ${dayOfWeek}`;

  const rightToLeft = settings.marqueeDirection === "rtl";

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden border-t border-white/10 bg-black/55 py-2">
      <div
        className={`${rightToLeft ? "animate-ticker" : "animate-ticker-rev"} whitespace-nowrap font-black uppercase tracking-[0.5em]`}
        style={{
          color: `${accent}cc`,
          fontFamily: getFont(settings.marqueeFont || settings.font),
          fontSize: `${Math.max(10, Number(settings.marqueeSize) || 13)}px`,
          animationDuration: `${Math.max(4, Number(settings.marqueeSpeed) || 14)}s`,
        }}
      >
        {`${copy} · `.repeat(8)}
      </div>
    </div>
  );
}