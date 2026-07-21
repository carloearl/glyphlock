import React, { useEffect, useRef } from "react";

/**
 * Real Code-128 (subset B / auto C) barcode renderer → canvas.
 * Produces a genuinely scannable barcode (unlike the placeholder SVG in the
 * generateBarcodes function). Numeric-only strings use Code-C compaction so the
 * bill serial fits in a compact, reliably-scanned symbol.
 */

// 107 Code-128 patterns (widths of bars/spaces), indices 0..106.
const PATTERNS = [
  "212222","222122","222221","121223","121322","131222","122213","122312","132212","221213",
  "221312","231212","112232","122132","122231","113222","123122","123221","223211","221132",
  "221231","213212","223112","312131","311222","321122","321221","312212","322112","322211",
  "212123","212321","232121","111323","131123","131321","112313","132113","132311","211313",
  "231113","231311","112133","112331","132131","113123","113321","133121","313121","211331",
  "231131","213113","213311","213131","311123","311321","331121","312113","312311","332111",
  "314111","221411","431111","111224","111422","121124","121421","141122","141221","112214",
  "112412","122114","122411","142112","142211","241211","221114","413111","241112","134111",
  "111242","121142","121241","114212","124112","124211","411212","421112","421211","212141",
  "214121","412121","111143","111341","131141","114113","114311","411113","411311","113141",
  "114131","311141","411131","211412","211214","211232","2331112",
];

const START_C = 105, START_B = 104, CODE_B = 100, STOP = 106;

function computeCode128(text) {
  const codes = [];
  const isFullNumeric = /^\d+$/.test(text) && text.length >= 2;

  if (isFullNumeric && text.length % 2 === 0) {
    // Code C: pairs of digits.
    codes.push(START_C);
    for (let i = 0; i < text.length; i += 2) {
      codes.push(parseInt(text.substr(i, 2), 10));
    }
  } else {
    // Code B: ASCII.
    codes.push(START_B);
    for (let i = 0; i < text.length; i++) {
      codes.push(text.charCodeAt(i) - 32);
    }
  }
  // Checksum: start value + sum(value_i * position_i).
  let sum = codes[0];
  for (let i = 1; i < codes.length; i++) sum += codes[i] * i;
  codes.push(sum % 103);
  codes.push(STOP);
  return codes;
}

export default function Code128({ value, height = 46, barWidth = 1.6, displayValue = true, className, style }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    const ctx = canvas.getContext("2d");

    const codes = computeCode128(String(value));
    const widths = codes.map((c) => PATTERNS[c]).join("");
    const totalUnits = widths.split("").reduce((s, d) => s + parseInt(d, 10), 0);

    const quiet = 10; // quiet zone units each side
    const textH = displayValue ? 14 : 0;
    const dpr = window.devicePixelRatio || 1;
    const cssW = (totalUnits + quiet * 2) * barWidth;
    const cssH = height + textH;

    canvas.width = Math.ceil(cssW * dpr);
    canvas.height = Math.ceil(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cssW, cssH);

    // Draw bars: patterns alternate bar/space starting with a bar.
    ctx.fillStyle = "#000000";
    let x = quiet * barWidth;
    let isBar = true;
    for (const ch of widths) {
      const w = parseInt(ch, 10) * barWidth;
      if (isBar) ctx.fillRect(x, 0, w, height);
      x += w;
      isBar = !isBar;
    }

    if (displayValue) {
      ctx.fillStyle = "#000000";
      ctx.font = "11px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillText(String(value), cssW / 2, height + 11);
    }
  }, [value, height, barWidth, displayValue]);

  return <canvas ref={canvasRef} className={className} style={style} aria-label={`Barcode ${value}`} />;
}