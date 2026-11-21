import React, { useEffect, useRef } from "react";
import "./glyphbotPrimeCard.css";
import { GLYPHBOT_PRIME_CARD_MARKUP } from "./glyphbotPrimeCardMarkup";

// The GlyphBot Prime card is HTML + CSS driven by radio inputs.
// This wrapper adds the JavaScript layer:
//  - phase: moves the card between phases (0 = Void ... 12 = Omega)
//  - fit: sizes the card to fill the screen and keeps it fitted on resize/rotate
//  - commands: adds an action button to the Strike, Rift, Aegis and Mirror panels.
//    The nodes keep their own behavior: open the panel, Ascend climbs, Lore flips.
//  - onPhase: tells the page when Ascend moves the card to a new phase
//  - live tilt: leans toward a touch or the pointer, and follows the phone's motion sensor
// Only one card may be mounted per page because the markup uses fixed ids.
const MARKUP = { __html: GLYPHBOT_PRIME_CARD_MARKUP };

// Each node opens its own panel (pure CSS). The JS layer adds a real action
// button inside the Strike, Rift, Aegis and Mirror panels.
const PANEL_ACTIONS = [
  [".gb-m1", "strike"],
  [".gb-m2", "rift"],
  [".gb-m3", "aegis"],
  [".gb-m4", "mirror"],
];

// The card is 24em wide and 36em tall.
const CARD_W = 24;
const CARD_H = 36;
const MAX_TILT = 10; // degrees

export function fitScale(width, height, { min = 8, max = 30, heightShare = 0.74 } = {}) {
  const w = Math.max(0, Number(width) || 0) / CARD_W;
  const h = (Math.max(0, Number(height) || 0) * heightShare) / CARD_H;
  return Math.round(Math.max(min, Math.min(max, w, h)) * 10) / 10;
}

export default function GlyphBotPrimeCard({
  phase = 0,
  scale = 10,
  fit = false,
  commands = null,
  commandLabels = null,
  onPhase = null,
  className = "",
}) {
  const host = useRef(null);
  const tiltRef = useRef(null);
  const cmdRef = useRef(commands);
  cmdRef.current = commands;
  const phaseRef = useRef(onPhase);
  phaseRef.current = onPhase;

  // Phase: check the matching radio.
  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const p = Math.max(0, Math.min(12, Math.round(Number(phase) || 0)));
    const radio = root.querySelector(`#gb-p${p}`);
    if (radio && !radio.checked) radio.checked = true;
  }, [phase]);

  // Size: a fixed scale, or fit to the screen.
  useEffect(() => {
    const root = host.current;
    const card = root && root.querySelector(".gb");
    if (!card) return undefined;
    if (!fit) {
      card.style.fontSize = `${scale}px`;
      return undefined;
    }
    const apply = () => {
      const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      card.style.fontSize = `${fitScale(root.clientWidth, vh)}px`;
    };
    apply();
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(apply) : null;
    if (ro) ro.observe(root);
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
    };
  }, [fit, scale]);

  // Report phase changes the user makes on the card (Ascend, return to Void).
  useEffect(() => {
    const root = host.current;
    if (!root) return undefined;
    const onChange = (e) => {
      const t = e.target;
      if (!t || !t.classList || !t.classList.contains("gb-ph") || !t.checked) return;
      const fn = phaseRef.current;
      if (typeof fn !== "function") return;
      const m = /^gb-p(\d+)$/.exec(t.id);
      fn(m ? Number(m[1]) : 0);
    };
    root.addEventListener("change", onChange);
    return () => root.removeEventListener("change", onChange);
  }, []);

  // Commands: an action button inside each panel. The nodes still open the panels.
  const hasCommands = Boolean(commands);
  useEffect(() => {
    const root = host.current;
    if (!root || !hasCommands) return undefined;
    const names = commandLabels || {};
    const added = [];
    for (const [sel, name] of PANEL_ACTIONS) {
      const box = root.querySelector(`.gb-modal${sel} .gb-box`);
      const dismiss = box && box.querySelector("label.gb-btn");
      if (!box || !dismiss || box.querySelector(".gbx-act")) continue;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gb-btn gbx-act";
      btn.dataset.cmd = name;
      btn.textContent = names[name] || name.toUpperCase();
      box.insertBefore(btn, dismiss);
      added.push(btn);
    }
    let pulseTimer = 0;
    const onClick = (e) => {
      const btn = e.target.closest && e.target.closest(".gbx-act");
      if (!btn || !root.contains(btn)) return;
      const fn = cmdRef.current && cmdRef.current[btn.dataset.cmd];
      const close = root.querySelector("#gb-m0");
      if (close) close.checked = true;
      root.classList.remove("gbx-pulse");
      // Restart the pulse animation.
      void root.offsetWidth;
      root.classList.add("gbx-pulse");
      clearTimeout(pulseTimer);
      pulseTimer = setTimeout(() => root.classList.remove("gbx-pulse"), 700);
      if (navigator.vibrate) {
        try {
          navigator.vibrate(12);
        } catch {
          /* vibration not allowed */
        }
      }
      if (typeof fn === "function") fn();
    };
    root.addEventListener("click", onClick);
    return () => {
      clearTimeout(pulseTimer);
      root.removeEventListener("click", onClick);
      added.forEach((b) => b.remove());
    };
  }, [hasCommands, commandLabels]);

  // Live tilt: pointer on desktop, motion sensor on phones. Off for reduced motion.
  useEffect(() => {
    const root = host.current;
    const el = tiltRef.current;
    if (!root || !el || typeof window === "undefined") return undefined;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return undefined;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let gotSensor = false;
    const clamp = (v) => Math.max(-MAX_TILT, Math.min(MAX_TILT, v));
    const paint = () => {
      raf = 0;
      el.style.transform = `perspective(1400px) rotateX(${tx.toFixed(2)}deg) rotateY(${ty.toFixed(2)}deg)`;
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const onMove = (e) => {
      if (gotSensor || e.pointerType === "touch") return;
      const r = root.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      tx = clamp(-ny * MAX_TILT);
      ty = clamp(nx * MAX_TILT);
      queue();
    };
    const onLeave = () => {
      if (gotSensor) return;
      tx = 0;
      ty = 0;
      queue();
    };
    // A finger can't hover, so lean toward where it presses and settle on release.
    const onDown = (e) => {
      if (gotSensor || e.pointerType === "mouse") return;
      const r = root.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      tx = clamp(-ny * MAX_TILT);
      ty = clamp(nx * MAX_TILT);
      queue();
    };
    const onUp = (e) => {
      if (gotSensor || e.pointerType === "mouse") return;
      tx = 0;
      ty = 0;
      queue();
    };
    const onOrient = (e) => {
      if (e.beta == null || e.gamma == null) return;
      gotSensor = true;
      tx = clamp(-(e.beta - 45) / 4);
      ty = clamp(e.gamma / 4);
      queue();
    };
    // iPhone asks for motion permission on the first tap (it must be a click); other phones just send it.
    let asked = false;
    const askMotion = () => {
      if (asked) return;
      asked = true;
      const D = window.DeviceOrientationEvent;
      if (D && typeof D.requestPermission === "function") {
        D.requestPermission()
          .then((s) => {
            if (s === "granted") window.addEventListener("deviceorientation", onOrient);
          })
          .catch(() => {});
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    root.addEventListener("click", askMotion);
    window.addEventListener("deviceorientation", onOrient);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      root.removeEventListener("click", askMotion);
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, []);

  return (
    <div ref={host} className={`gbx ${className}`} style={{ lineHeight: 1 }}>
      <div ref={tiltRef} className="gbx-tilt" dangerouslySetInnerHTML={MARKUP} />
    </div>
  );
}
