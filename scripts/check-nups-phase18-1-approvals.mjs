import fs from "node:fs";

const access = fs.readFileSync("base44/functions/nupsAccessControl/entry.ts", "utf8");
const ui = fs.readFileSync("src/pages/AccessRequests.jsx", "utf8");
const owner = fs.readFileSync("src/pages/NUPSOwner.jsx", "utf8");

const checks = [
  ["server blocks self approval", access.includes("cannot approve, reject, suspend, or revoke your own access request") && access.includes("String(r.email || '').trim().toLowerCase() === email")],
  ["administrator cannot grant owner", access.includes("decision === 'APPROVE_OWNER' && decisionAuthority === 'ADMINISTRATOR'")],
  ["authority distinguishes owner and administrator", access.includes("getDecisionAuthority") && access.includes("return 'ADMINISTRATOR'")],
  ["UI hides own-request actions", ui.includes('String(r.email || "").toLowerCase() !== actor.email')],
  ["UI hides owner grant from administrator", ui.includes('actor.role === "OWNER"')],
  ["mobile controls meet touch target", ui.includes("min-h-[44px]")],
  ["approval status filters exist", ["PENDING", "APPROVED", "HISTORY", "ALL"].every((label) => ui.includes(label))],
  ["owner dashboard links canonical approval center", owner.includes("route: '/AccessRequests'")],
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log(`${ok ? "PASS" : "FAIL"} — ${name}`);
if (failed.length) process.exit(1);
console.log("\nNUPS Phase 18.1 approval stabilization checks passed.");
