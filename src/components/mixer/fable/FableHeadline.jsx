/**
 * FableHeadline — the big centered two-line stage headline (e.g. Dream Palace).
 * Independent font, size, text effect and motion effect; purely presentational.
 */
import React from "react";
import { getFont } from "./fableThemes";
import { headlineStyle, headlineClass } from "./fableTextFx";
import { motionWrapperClass, motionCharClass, PER_CHAR_MOTIONS } from "./fableHeadlineMotion";

function Line({ text, style, family, size, tracking, motion }) {
  if (!text.trim()) return null;
  const charClass = motionCharClass(motion);
  const base = "font-black uppercase leading-[0.95]";
  const common = { ...style, fontFamily: family, fontSize: `${size}px`, letterSpacing: tracking };

  if (PER_CHAR_MOTIONS.has(motion)) {
    const chars = [...text];
    return (
      <div className={base} style={common}>
        {chars.map((ch, i) => (
          <span
            key={`${ch}-${i}`}
            className={`inline-block ${charClass}`}
            style={{ animationDelay: `${(i * 0.07).toFixed(2)}s` }}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </div>
    );
  }

  return <div className={base} style={common}>{text}</div>;
}

export default function FableHeadline({ settings, theme }) {
  const line1 = settings.headline1 ?? "";
  const line2 = settings.headline2 ?? "";
  if (!line1.trim() && !line2.trim()) return null;

  const size = Math.max(20, Number(settings.headlineSize) || 96);
  const fx = settings.headlineFx || "neon";
  const motion = settings.headlineMotion || "none";
  const style = headlineStyle(fx, theme.colors);
  const family = getFont(settings.headlineFont || settings.font);
  const wrapper = `${motionWrapperClass(motion)} ${headlineClass(fx)}`.trim();

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
      {motion === "lightning" && (
        <div className="absolute inset-0 animate-fable-bolt" style={{ background: `radial-gradient(circle at 50% 45%, ${theme.colors[2]}55, transparent 60%)` }} />
      )}
      <div className={wrapper}>
        <Line text={line1} style={style} family={family} size={size} tracking="0.04em" motion={motion} />
        <Line text={line2} style={style} family={family} size={size * 0.55} tracking="0.22em" motion={motion} />
      </div>
    </div>
  );
}