// Run: node --test src/components/glyphbot-prime/forgeEngine.test.js
import test from "node:test";
import assert from "node:assert/strict";
import {
  parsePrompt, generate, audit, applyFixes, sanitizeSpec, contrast,
  encodeSpec, decodeSpec, tierForScore, COMPONENT_TYPES, auditCode,
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
