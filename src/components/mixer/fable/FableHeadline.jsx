/**
 * FableHeadline — the big centered two-line stage headline (e.g. Dream Palace).
 * Independent font, size and text effect; purely presentational.
 */
import React from "react";
import { getFont } from "./fableThemes";
import { headlineStyle, headlineClass } from "./fableTextFx";

export default function FableHeadline({ settings, theme }) {
  const line1 = settings.headline1 ?? "";
  const line2 = settings.headline2 ?? "";
  if (!line1.trim() && !line2.trim()) return null;

  const size = Math.max(20, Number(settings.headlineSize) || 96);
  const fx = settings.headlineFx || "neon";
  const style = headlineStyle(fx, theme.colors);
  const anim = headlineClass(fx);
  const family = getFont(settings.headlineFont || settings.font);

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
      {!!line1.trim() && (
        <div
          className={`font-black uppercase leading-[0.92] ${anim}`}
          style={{ ...style, fontFamily: family, fontSize: `${size}px`, letterSpacing: "0.04em" }}
        >
          {line1}
        </div>
      )}
      {!!line2.trim() && (
        <div
          className={`font-black uppercase leading-[0.95] ${anim}`}
          style={{ ...style, fontFamily: family, fontSize: `${size * 0.55}px`, letterSpacing: "0.22em" }}
        >
          {line2}
        </div>
      )}
    </div>
  );
}