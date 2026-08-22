#!/usr/bin/env node
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const failures = [];
const requireMatch = (label, source, pattern) => {
  if (!pattern.test(source)) failures.push(label);
};
const forbidMatch = (label, source, pattern) => {
  if (pattern.test(source)) failures.push(label);
};

const tipBreakdown = read("src/components/nups/TipBreakdown.jsx");
const owner = read("src/pages/NUPSOwner.jsx");
const unifiedMusic = read("src/components/mixer/UnifiedMusicConsole.jsx");
const register = read("src/pages/RegisterConsole.jsx");
const contractV1 = read("src/components/nups/contracts/UnifiedContractFlow.jsx");
const contractV2 = read("src/components/nups/contracts/UnifiedContractFlowV2.jsx");
const glyphbucksSeal = read("base44/functions/glyphbucksSeal/entry.ts");
const robots = read("public/robots.txt");
const sitemap = read("public/sitemap.xml");

requireMatch(
  "TipBreakdown must explicitly exclude performer and entertainer contractor roles",
  tipBreakdown,
  /INDEPENDENT_CONTRACTOR_ROLES\s*=\s*new Set\(\[["']PERFORMER["'],\s*["']ENTERTAINER["']\]\)/,
);
requireMatch(
  "TipBreakdown must skip independent contractors before assigning an employee pool",
  tipBreakdown,
  /INDEPENDENT_CONTRACTOR_ROLES\.has\(role\)\) return;/,
);
requireMatch(
  "Saved tip records must attest that contractors were excluded",
  tipBreakdown,
  /contractors_excluded:\s*true/,
);
requireMatch(
  "Tip payouts must fail closed when requested allocations exceed the available pool",
  tipBreakdown,
  /overAllocated[\s\S]*allocationInvalid[\s\S]*Saving is blocked/,
);
forbidMatch(
  "Performer role must not map to an entertainer tip pool",
  tipBreakdown,
  /PERFORMER\s*:\s*["']entertainer["']/,
);
forbidMatch(
  "Entertainer tip-pool configuration is prohibited",
  tipBreakdown,
  /key:\s*["']entertainer["']|entertainerPct|37pct-entertainer/,
);
forbidMatch(
  "The active owner dashboard must not mount the legacy entertainer payroll engine",
  owner,
  /EntertainerPayrollEngine/,
);
requireMatch(
  "The owner dashboard must label contractor payouts as isolated from employee payroll and tips",
  owner,
  /Contractor payouts are isolated from employee payroll and tip pools/,
);

requireMatch(
  "The mixer must stay mounted while utility/visualizer tabs are active",
  unifiedMusic,
  /<ResizablePanelGroup[\s\S]*<MixerModuleView/,
);
forbidMatch(
  "The mixer must not be conditionally unmounted when leaving its tab",
  unifiedMusic,
  /active === ["']mixer["']\s*&&\s*<MixerModuleView/,
);
requireMatch(
  "The register must keep the DJ console mounted after first use",
  register,
  /if \(activeTab === ["']dj["']\) setDjMounted\(true\)/,
);
requireMatch(
  "The register must render the persistent DJ instance from djMounted",
  register,
  /\{djMounted && \([\s\S]*<UnifiedMusicConsole/,
);

for (const [label, source] of [["UnifiedContractFlow", contractV1], ["UnifiedContractFlowV2", contractV2]]) {
  requireMatch(
    `${label} must build a deterministic GlyphBucks idempotency key`,
    source,
    /buildGlyphBucksIdempotencyKey/,
  );
  requireMatch(
    `${label} must send idempotency_key to glyphbucksSeal`,
    source,
    /glyphbucksSeal[\s\S]*idempotency_key:\s*idempotencyKey/,
  );
}
requireMatch(
  "glyphbucksSeal must persist the caller key on SealRecord",
  glyphbucksSeal,
  /SealRecord\.create\(\{[\s\S]*?idempotency_key:\s*idempotencyKey/,
);
requireMatch(
  "glyphbucksSeal must persist the caller key on GlyphBucksSale",
  glyphbucksSeal,
  /GlyphBucksSale\.create\(\{[\s\S]*?idempotency_key:\s*idempotencyKey/,
);

requireMatch("robots.txt must advertise the canonical sitemap", robots, /Sitemap:\s*https:\/\/glyphlock\.io\/sitemap\.xml/);
requireMatch("robots.txt must keep owner operations out of crawl", robots, /Disallow:\s*\/NUPSOwner/);
requireMatch("sitemap.xml must use the canonical glyphlock.io origin", sitemap, /<loc>https:\/\/glyphlock\.io\//);

if (failures.length) {
  console.error("[check:nups-frozen-rules] FAILED");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("[check:nups-frozen-rules] passed");
console.log(" - entertainers excluded from employee payroll/tip-pool surfaces");
console.log(" - tip over-allocation fails closed");
console.log(" - DJ mixer persists across visualizer/station tab changes");
console.log(" - GlyphBucks seal idempotency is wired");
console.log(" - canonical robots.txt and sitemap.xml are present");
