import { useEffect, useRef } from "react";

/**
 * useHardwareScanner — captures input from USB HID "keyboard wedge" barcode
 * scanners (omnidirectional desktop scanners, handheld 2D scanners, etc.).
 *
 * These devices need no driver: they type the decoded barcode as a rapid
 * burst of keystrokes, usually terminated by Enter. This hook listens
 * globally, distinguishes scanner bursts from human typing by inter-key
 * timing, and calls onScan(text) with the full decoded payload.
 *
 * When focus is inside an input/textarea the hook stays silent — the focused
 * field receives the scan directly and its own handler takes over.
 */
export default function useHardwareScanner(onScan, { enabled = true, minLength = 5, maxGapMs = 50 } = {}) {
  const cbRef = useRef(onScan);
  cbRef.current = onScan;

  useEffect(() => {
    if (!enabled) return;

    let buffer = "";
    let lastKeyAt = 0;
    let finalizeTimer = null;

    const isEditable = (el) =>
      el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);

    const finalize = () => {
      const data = buffer.replace(/[\r\n]+$/, "").trim();
      buffer = "";
      if (data.length >= minLength) cbRef.current(data);
    };

    const handler = (e) => {
      if (isEditable(e.target)) return; // focused field handles its own scan
      const now = Date.now();
      if (now - lastKeyAt > maxGapMs) buffer = ""; // human-speed gap → reset
      lastKeyAt = now;

      if (e.key === "Enter") {
        // AAMVA license payloads contain embedded line separators the
        // scanner sends as Enter — keep buffering briefly instead of
        // terminating on the first one.
        if (buffer) {
          buffer += "\n";
          e.preventDefault();
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      } else {
        return; // modifier / navigation key — ignore
      }

      clearTimeout(finalizeTimer);
      finalizeTimer = setTimeout(finalize, 120);
    };

    window.addEventListener("keydown", handler, true);
    return () => {
      clearTimeout(finalizeTimer);
      window.removeEventListener("keydown", handler, true);
    };
  }, [enabled, minLength, maxGapMs]);
}