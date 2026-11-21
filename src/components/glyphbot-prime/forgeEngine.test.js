// Run: node --test src/components/glyphbot-prime/forgeEngine.test.js
import test from "node:test";
import assert from "node:assert/strict";
import {
  parsePrompt, generate, audit, applyFixes, sanitizeSpec, contrast,
  encodeSpec, decodeSpec, tierForScore, COMPONENT_TYPES, auditCode, paletteFromPixels,
} from "./forgeEngine.js";

test("parses type, colors, shape, effect and label from plain words", () => {
  const s = parsePrompt('glowing red pill button that says "Join Now"');
  assert.equal(s.type, "button");
  assert.equal(s.accent, "#ef4444");
  assert.equal(s.radius, 999);
  assert.equal(s.effect, "glow");
  assert.equal(s.label, "Join Now");
});

test("two colors make a gradient", () => {
  const s = parsePrompt("purple and gold toggle");
  assert.equal(s.type, "toggle");
  assert.equal(s.effect, "gradient");
  assert.equal(s.accent2, "#facc15");
});

test("every component type builds without undefined values", () => {
  for (const { id } of COMPONENT_TYPES) {
    const out = generate(sanitizeSpec({ type: id }));
    for (const key of ["html", "css", "js", "react", "document"]) {
      assert.ok(out[key].length > 20, `${id} ${key} empty`);
      assert.ok(!out[key].includes("undefined"), `${id} ${key} has undefined`);
    }
  }
});

test("labels are escaped so user text cannot inject markup", () => {
  const out = generate(sanitizeSpec({ label: '</script><img src=x onerror="alert(1)">' }));
  assert.ok(!out.html.includes("<img"));
  assert.ok(!out.document.includes("<img"));
});

test("auto label color always meets AA on solid fills", () => {
  for (const accent of ["#fde047", "#22d3ee", "#1e3a8a", "#ef4444", "#f8fafc"]) {
    const r = audit(sanitizeSpec({ accent, textMode: "auto", effect: "none" }));
    const c = r.checks.find((x) => x.id === "text-contrast");
    assert.equal(c.status, "pass", accent);
  }
});

test("auto-fix repairs low contrast and small tap targets", () => {
  const bad = sanitizeSpec({ accent: "#fde047", textMode: "white", size: "sm" });
  const before = audit(bad);
  assert.ok(before.score < 80);
  const after = audit(applyFixes(bad, before));
  assert.equal(after.score, 100);
  assert.equal(after.tier.name, "Omega");
});

test("contrast math matches WCAG reference values", () => {
  assert.equal(Number(contrast("#000000", "#ffffff").toFixed(1)), 21);
  assert.equal(Number(contrast("#777777", "#ffffff").toFixed(2)), 4.48);
});

test("share tokens round-trip and reject garbage", () => {
  const s = parsePrompt('cyan glass card "héllo"');
  assert.deepEqual(decodeSpec(encodeSpec(s)), s);
  assert.equal(decodeSpec("not-a-token"), null);
});

test("score maps to the card's 13 phases", () => {
  assert.equal(tierForScore(100).name, "Omega");
  assert.equal(tierForScore(0).phase, 1);
  assert.equal(tierForScore(50).phase, 6);
});

test("code audit flags external scripts and missing focus styles", () => {
  const r = auditCode({ html: '<script src="https://x.test/a.js"></script><div onclick="x()">Hi</div>', css: ".a{transition:all 1s}", js: "" });
  assert.ok(r.score < 50);
});

function pixels(colors) {
  // colors: [[r,g,b,count], ...] -> RGBA bytes
  const out = [];
  for (const [r, g, b, n] of colors) for (let i = 0; i < n; i += 1) out.push(r, g, b, 255);
  return Uint8ClampedArray.from(out);
}

test("photo palette finds the two main colors and keeps them readable", () => {
  const p = paletteFromPixels(pixels([[255, 0, 200, 600], [0, 220, 255, 300], [20, 20, 20, 900]]));
  assert.ok(p, "palette found");
  assert.ok(p.duo);
  const [r, , b] = [parseInt(p.accent.slice(1, 3), 16), 0, parseInt(p.accent.slice(5, 7), 16)];
  assert.ok(r > 200 && b > 150, `accent should be magenta, got ${p.accent}`);
  assert.ok(contrast(p.accent, "#070910") >= 3 && contrast(p.accent2, "#070910") >= 3);
});

test("dark photo colors get lifted to pass 3:1 on the page", () => {
  const p = paletteFromPixels(pixels([[90, 10, 10, 500]]));
  assert.ok(p);
  assert.ok(contrast(p.accent, "#070910") >= 3, p.accent);
  assert.ok(contrast(p.accent2, "#070910") >= 3, p.accent2);
});

test("grey or empty photos return no palette", () => {
  assert.equal(paletteFromPixels(pixels([[128, 128, 128, 400], [10, 10, 10, 400]])), null);
  assert.equal(paletteFromPixels(new Uint8ClampedArray(0)), null);
});

test("photo palette builds a full-score component after auto-fix", () => {
  const p = paletteFromPixels(pixels([[255, 214, 10, 500], [106, 92, 255, 400]]));
  const spec = sanitizeSpec({ accent: p.accent, accent2: p.accent2, effect: "gradient" });
  const r = audit(spec);
  assert.equal(audit(applyFixes(spec, r)).score, 100);
});
