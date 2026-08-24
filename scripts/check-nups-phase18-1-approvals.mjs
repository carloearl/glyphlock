import assert from "node:assert/strict";
import fs from "node:fs";
import {
  canAuthorityActOnRequest,
  canRequestRoleInMode,
  decisionMatchesRequestedRole,
  isDecisionAllowedFromStatus,
  isValidIdempotencyKey,
} from "../base44/functions/nupsAccessControl/policy.mjs";

const access = fs.readFileSync("base44/functions/nupsAccessControl/entry.ts", "utf8");
const requestSchema = fs.readFileSync("base44/entities/NUPSAccessRequest.jsonc", "utf8");
const ui = fs.readFileSync("src/pages/AccessRequests.jsx", "utf8");
const requestForm = fs.readFileSync("src/components/nups/kiosk/AccessRequestForm.jsx", "utf8");
const owner = fs.readFileSync("src/pages/NUPSOwner.jsx", "utf8");
const auth = fs.readFileSync("src/lib/AuthContext.jsx", "utf8");
const guard = fs.readFileSync("src/components/nups/RoleClassGuard.jsx", "utf8");
const operationalGuard = fs.readFileSync("src/components/nups/NUPSRouteGuard.jsx", "utf8");
const client = fs.readFileSync("src/lib/nups/accessRequestClient.js", "utf8");
const roleSelector = fs.readFileSync("src/components/nups/kiosk/AccessRoleSelector.jsx", "utf8");
const clockIn = fs.readFileSync("base44/functions/nupsClockInV2/entry.ts", "utf8");
const vipWorkflow = fs.readFileSync("base44/functions/vipWorkflow/entry.ts", "utf8");
const staffOnboarding = fs.readFileSync("base44/functions/manageStaffOnboarding/entry.ts", "utf8");
const venueTerminal = fs.readFileSync("base44/functions/manageVenueTerminal/entry.ts", "utf8");
const vipBills = fs.readFileSync("base44/functions/registerVIPBills/entry.ts", "utf8");
const manifest = JSON.parse(fs.readFileSync(".base44/ci-checks.json", "utf8"));

const scopedStaffRequest = {
  requested_role: "DJ",
  granted_role: "",
  venue_id: "dream_palace",
  mode: "DEMO",
};
const scopedAdminRequest = { ...scopedStaffRequest, requested_role: "ADMINISTRATOR" };
const sovereign = { tier: "SOVEREIGN", venue_id: null, mode: null };
const ownerAuthority = { tier: "OWNER", venue_id: "dream_palace", mode: "DEMO" };
const adminAuthority = { tier: "ADMINISTRATOR", venue_id: "dream_palace", mode: "DEMO" };

const checks = [
  ["server blocks self approval", () => {
    assert.match(access, /cannot approve, reject, suspend, or revoke your own access request/);
    assert.match(access, /normalizeEmail\(r\.email\) === email/);
  }],
  ["administrator cannot grant administrator or owner", () => {
    assert.equal(canAuthorityActOnRequest(adminAuthority, scopedAdminRequest, "APPROVE_ADMIN"), false);
    assert.equal(canAuthorityActOnRequest(adminAuthority, { ...scopedAdminRequest, requested_role: "OWNER" }, "APPROVE_OWNER"), false);
  }],
  ["delegated owner cannot create another owner", () => {
    assert.equal(canAuthorityActOnRequest(ownerAuthority, { ...scopedAdminRequest, requested_role: "OWNER" }, "APPROVE_OWNER"), false);
    assert.equal(canAuthorityActOnRequest(sovereign, { ...scopedAdminRequest, requested_role: "OWNER" }, "APPROVE_OWNER"), true);
  }],
  ["venue and mode isolation is enforced", () => {
    assert.equal(canAuthorityActOnRequest(adminAuthority, scopedStaffRequest, "APPROVE_STAFF"), true);
    assert.equal(canAuthorityActOnRequest(adminAuthority, { ...scopedStaffRequest, venue_id: "other" }, "APPROVE_STAFF"), false);
    assert.equal(canAuthorityActOnRequest(adminAuthority, { ...scopedStaffRequest, mode: "REAL" }, "APPROVE_STAFF"), false);
    assert.match(access, /decisionAuthorities\.some\(\(authority\) =>\s*r\.venue_id === authority\.venue_id && r\.mode === authority\.mode/);
    assert.match(access, /decisionAuthorities\.some\(\(authority\) => canAuthorityActOnRequest\(authority, r, decision\)\)/);
  }],
  ["approval must match the requested role", () => {
    assert.equal(decisionMatchesRequestedRole("DJ", "APPROVE_STAFF"), true);
    assert.equal(decisionMatchesRequestedRole("DJ", "APPROVE_ADMIN"), false);
    assert.equal(decisionMatchesRequestedRole("ADMINISTRATOR", "APPROVE_ADMIN"), true);
  }],
  ["non-live requests cannot provision privileged authority", () => {
    assert.equal(canRequestRoleInMode("ADMINISTRATOR", "DEMO"), false);
    assert.equal(canRequestRoleInMode("OWNER", "SANDBOX"), false);
    assert.equal(canRequestRoleInMode("DJ", "DEMO"), true);
    assert.match(access, /accountMode\(account\) === grant\.mode/);
    assert.match(access, /if \(grant\.mode !== 'REAL'\) continue/);
    assert.match(roleSelector, /allowPrivileged = false/);
  }],
  ["decision state transitions are bounded", () => {
    assert.equal(isDecisionAllowedFromStatus("PENDING_OWNER_APPROVAL", "APPROVE_STAFF"), true);
    assert.equal(isDecisionAllowedFromStatus("APPROVED", "APPROVE_STAFF"), false);
    assert.equal(isDecisionAllowedFromStatus("APPROVED", "SUSPEND"), true);
    assert.equal(isDecisionAllowedFromStatus("REVOKED", "REVOKE"), false);
  }],
  ["idempotency keys are validated and persisted", () => {
    assert.equal(isValidIdempotencyKey("approval:1234567890abcdef"), true);
    assert.equal(isValidIdempotencyKey("short"), false);
    assert.match(access, /entry\.idempotency_key === idempotencyKey/);
    assert.match(access, /idempotent_replay: true/);
    assert.match(ui, /crypto\.randomUUID\(\)/);
    assert.match(ui, /decisionKeys\.current\.get\(operation\)/);
  }],
  ["decision side effects require an atomic compare-and-set claim", () => {
    assert.match(access, /NUPSAccessRequest\.updateMany\(\{[\s\S]*?decision_claim_active:\s*\{\s*\$exists:\s*false\s*\}/);
    assert.match(access, /result\?\.updated !== 1/);
    assert.match(access, /r = await claimDecision\(base44, r, idempotency_key, email\)/);
    assert.match(access, /Another decision is already processing/);
    assert.match(access, /decision_claim_active:\s*false/);
    assert.match(requestSchema, /"decision_claim_active"[\s\S]*?"default": false/);
  }],
  ["approval activates an account only after its grant commits", () => {
    const suspendedCreate = access.indexOf("status: 'suspended'");
    const approvedWrite = access.indexOf("...patch, status: 'APPROVED'");
    const activeWrite = access.indexOf("NUPSUser.update(nupsUserId, { status: 'active' }");
    assert.ok(suspendedCreate > -1 && approvedWrite > suspendedCreate && activeWrite > approvedWrite);
    assert.match(access, /prior approval did not finish activating its bound account/);
  }],
  ["sign-in no longer bootstraps privileged access", () => {
    assert.doesNotMatch(auth, /ensurePrivilegedAccess/);
    assert.equal(fs.existsSync("src/lib/nups/privilegedAccess.js"), false);
  }],
  ["route guard requires server-verified NUPS access", () => {
    assert.match(guard, /functions\.invoke\("nupsAccessControl", \{ action: "checkAccess" \}\)/);
    assert.doesNotMatch(guard, /entities\.NUPSUser\.filter/);
    assert.doesNotMatch(guard, /resolveRoleClass\(\{ user: u/);
    assert.match(guard, /Authorization infrastructure failures fail closed/);
    assert.match(operationalGuard, /functions\.invoke\("nupsAccessControl", \{ action: "checkAccess" \}\)/);
    assert.match(operationalGuard, /access\.mode !== "REAL"/);
    assert.doesNotMatch(operationalGuard, /hasOwnerPreview|user\.role === "admin"|entities\.NUPSUser\.filter/);
  }],
  ["mobile submission includes the active venue", () => {
    assert.match(client, /venue_id: venueId/);
    assert.match(ui, /min-h-\[44px\]/);
  }],
  ["mobile request blockers are scoped by venue and mode", () => {
    assert.match(requestForm, /r\.mode === requestedMode/);
    assert.match(requestForm, /activeVenueRefs\.has\(r\.venue_id\)/);
    assert.match(requestForm, /scopedRequests\.some/);
  }],
  ["revocation fails closed when account deactivation fails", () => {
    assert.doesNotMatch(access, /NUPSUser\.update\(r\.nups_user_id,[\s\S]{0,180}\.catch\(\(\) => null\)/);
  }],
  ["downstream privileged grant consumers require real scoped identities", () => {
    for (const source of [clockIn, vipWorkflow]) {
      assert.match(source, /\['OWNER', 'ADMINISTRATOR'\]\.includes\(candidate\.granted_role\)/);
      assert.match(source, /candidate\.mode === 'REAL'/);
      assert.match(source, /accountMode === 'REAL'/);
    }
    assert.match(clockIn, /Cross-venue PIN provisioning denied/);
    assert.match(vipWorkflow, /Back-office grant is bound to another venue/);
    for (const source of [staffOnboarding, venueTerminal, vipBills]) {
      assert.match(source, /grant\.mode === 'REAL'/);
      assert.match(source, /grant\.nups_user_id === (?:manager|account)\.id/);
      assert.match(source, /accountMode.*'REAL'/s);
    }
    assert.doesNotMatch(staffOnboarding, /caller\.role === 'admin'/);
    assert.doesNotMatch(venueTerminal, /user\.role === 'admin'/);
  }],
  ["approval status filters and owner route exist", () => {
    for (const label of ["PENDING", "APPROVED", "HISTORY", "ALL"]) assert.match(ui, new RegExp(label));
    assert.match(owner, /route: '\/AccessRequests'/);
  }],
  ["the Phase 18.1 gate is part of Base44-managed CI", () => {
    assert.ok(manifest.scripts.includes("check:nups-phase18-1-approvals"));
  }],
];

let failures = 0;
for (const [name, check] of checks) {
  try {
    check();
    console.log(`PASS — ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL — ${name}`);
    console.error(error.message);
  }
}

if (failures) process.exit(1);
console.log("\nNUPS Phase 18.1 approval security checks passed.");
