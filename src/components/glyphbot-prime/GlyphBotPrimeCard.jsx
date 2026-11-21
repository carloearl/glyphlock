import React, { useEffect, useRef } from "react";
import "./glyphbotPrimeCard.css";
import { GLYPHBOT_PRIME_CARD_MARKUP } from "./glyphbotPrimeCardMarkup";

// The GlyphBot Prime card is pure HTML + CSS driven by radio inputs.
// This wrapper renders it once and lets a page move it between phases
// (0 = Void ... 12 = Omega) by checking the matching radio.
// Only one card may be mounted per page because the markup uses fixed ids.
const MARKUP = { __html: GLYPHBOT_PRIME_CARD_MARKUP };

export default function GlyphBotPrimeCard({ phase = 0, scale = 10, className = "" }) {
  const host = useRef(null);

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const p = Math.max(0, Math.min(12, Math.round(Number(phase) || 0)));
    const radio = root.querySelector(`#gb-p${p}`);
    if (radio && !radio.checked) radio.checked = true;
  }, [phase]);

  useEffect(() => {
    const card = host.current && host.current.querySelector(".gb");
    if (card) card.style.fontSize = `${scale}px`;
  }, [scale]);

  return (
    <div
      ref={host}
      className={className}
      style={{ lineHeight: 1 }}
      dangerouslySetInnerHTML={MARKUP}
    />
  );
}
