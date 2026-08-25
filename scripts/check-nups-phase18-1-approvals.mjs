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
const userSchema = fs.readFileSync("base44/entities/NUPSUser.jsonc", "utf8");
const ui = fs.readFileSync("src/pages/AccessRequests.jsx", "utf8");
const requestForm = fs.readFileSync("src/components/nups/kiosk/AccessRequestForm.jsx", "utf8");
const owner = fs.readFileSync("src/pages/NUPSOwner.jsx", "utf8");
const auth = fs.readFileSync("src/lib/AuthContext.jsx", "utf8");
const guard = fs.readFileSync("src/components/nups/RoleClassGuard.jsx", "utf8");
const operationalGuard = fs.readFileSync("src/components/nups/NUPSRouteGuard.jsx", "utf8");
const kioskGuard = fs.readFileSync("src/components/nups/KioskSessionGuard.jsx", "utf8");
const guardAccess = fs.readFileSync("src/lib/nups/resolveGuardAccess.js", "utf8");
const client = fs.readFileSync("src/lib/nups/accessRequestClient.js", "utf8");
const roleSelector = fs.readFileSync("src/components/nups/kiosk/AccessRoleSelector.jsx", "utf8");
const clockIn = fs.readFileSync("base44/functions/nupsClockInV2/entry.ts", "utf8");
const vipWorkflow = fs.readFileSync("base44/functions/vipWorkflow/entry.ts", "utf8");
const staffOnboarding = fs.readFileSync("base44/functions/manageStaffOnboarding/entry.ts", "utf8");
const venueTerminal = fs.readFileSync("base44/functions/manageVenueTerminal/entry.ts", "utf8");
const vipBills = fs.readFileSync("base44/functions/registerVIPBills/entry.ts", "utf8");
const getEvidence = fs.readFileSync("base44/functions/getProtectedEvidence/entry.ts", "utf8");
const registerEvidence = fs.readFileSync("base44/functions/registerProtectedEvidence/entry.ts", "utf8");
const captureEvidence = fs.readFileSync("base44/functions/captureVerificationMedia/entry.ts", "utf8");
const vipContractGenerate = fs.readFileSync("base44/functions/vipContractGenerate/entry.ts", "utf8");
const quickBooksExport = fs.readFileSync("base44/functions/exportQuickBooksIIF/entry.ts", "utf8");
const closePOSBatch = fs.readFileSync("base44/functions/closePOSBatch/entry.ts", "utf8");
const serverAuditGateway = fs.readFileSync("base44/functions/serverAuditGateway/entry.ts", "utf8");
const createPaymentRecord = fs.readFileSync("base44/functions/createPaymentRecord/entry.ts", "utf8");
const createGlyphBucksSale = fs.readFileSync("base44/functions/createGlyphBucksSale/entry.ts", "utf8");
const financialResolution = fs.readFileSync("base44/functions/financialResolutionWorkflow/entry.ts", "utf8");
const vipContractFlow = fs.readFileSync("src/components/nups/VIPContractFlow.jsx", "utf8");
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

function claimGenerationMatches(activeClaim, workerClaim) {
  return activeClaim.key === workerClaim.key
    && activeClaim.actor === workerClaim.actor
    && activeClaim.claimedAt === workerClaim.claimedAt;
}

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
    assert.match(access, /completedAfterClaim/);
    assert.match(access, /releaseDecisionClaim\([\s\S]*?base44, request_id, idempotency_key, email, claimTimestamp/);
    assert.match(access, /decision_claim_active:\s*false/);
    assert.match(access, /async function updateClaimedRequest[\s\S]*?decision_claim_key:\s*idempotencyKey[\s\S]*?decision_claimed_by:\s*actorEmail[\s\S]*?decision_claimed_at:\s*claimedAt/);
    assert.match(access, /async function releaseDecisionClaim[\s\S]*?decision_claimed_at:\s*claimedAt/);
    assert.match(access, /const claimTimestamp = r\.decision_claimed_at/);
    assert.match(access, /const claimTimestamp = claimed\.decision_claimed_at/);
    assert.doesNotMatch(access, /releaseDecisionClaim\([^)]*actorEmail\s*\)/);
    assert.doesNotMatch(access, /updateClaimedRequest\([^)]*actorEmail,\s*\{/);
    assert.match(access, /request\.decision_claim_active[\s\S]*?releaseDecisionClaim\([\s\S]*?request\.decision_claimed_at/);
    assert.match(access, /const committedGrant = await updateClaimedRequest/);
    assert.match(access, /const updated = await updateClaimedRequest\([\s\S]*?decision_claim_active:\s*false/);
    assert.doesNotMatch(access, /NUPSAccessRequest\.update\(request_id,\s*\{[\s\S]{0,240}?decision_claim_active:\s*false/);
    assert.match(requestSchema, /"decision_claim_active"[\s\S]*?"default": false/);
    const expiredWorker = { key: "approval:1234567890abcdef", actor: "owner@example.com", claimedAt: "2026-08-25T00:00:00.000Z" };
    const replacement = { ...expiredWorker, claimedAt: "2026-08-25T00:05:01.000Z" };
    assert.equal(claimGenerationMatches(replacement, expiredWorker), false);
    assert.equal(claimGenerationMatches(replacement, replacement), true);
    assert.match(access, /async function updateAccountForClaim[\s\S]*?access_claimed_at:\s*\{\s*\$lte:\s*claimedAt\s*\}/);
    assert.match(access, /\$set:\s*\{\s*\.\.\.patch, access_claimed_at:\s*claimedAt\s*\}/);
    assert.doesNotMatch(access, /NUPSUser\.update\(nupsUserId,\s*\{\s*status:\s*'active'/);
    assert.match(userSchema, /"access_claimed_at"[\s\S]*?"format":\s*"date-time"/);
  }],
  ["approval activates an account only after its grant commits", () => {
    const suspendedCreate = access.indexOf("const nu = await base44.asServiceRole.entities.NUPSUser.create");
    const approvedWrite = access.indexOf("...patch, status: 'APPROVED'");
    const activeWrite = access.indexOf("const activated = await updateAccountForClaim", approvedWrite);
    assert.ok(suspendedCreate > -1 && approvedWrite > suspendedCreate && activeWrite > approvedWrite);
    assert.match(access, /prior approval did not finish activating its bound account/);
    assert.match(access, /reconciled: true/);
    assert.match(access, /request\.decision_claim_key === idempotencyKey/);
    assert.match(access, /request = await base44\.asServiceRole\.entities\.NUPSAccessRequest\.get\(request\.id\)/);
    assert.match(access, /account\?\.status === 'suspended'/);
    assert.match(access, /Approved via NUPSAccessRequest \$\{r\.id\}/);
    assert.match(access, /startsWith\(requestMarker\)/);
  }],
  ["sign-in no longer bootstraps privileged access", () => {
    assert.doesNotMatch(auth, /ensurePrivilegedAccess/);
    assert.equal(fs.existsSync("src/lib/nups/privilegedAccess.js"), false);
  }],
  ["route guard requires server-verified NUPS access", () => {
    assert.match(guard, /resolveGuardAccess\(\{ requiredRoles, allowAdmin: true \}\)/);
    assert.doesNotMatch(guard, /entities\.NUPSUser\.filter/);
    assert.doesNotMatch(guard, /resolveRoleClass\(\{ user: u/);
    assert.match(guard, /Authorization infrastructure failures fail closed/);
    assert.match(guard, /GRANT_TO_NUPS_ROLE\[grantedRole\]/);
    assert.match(operationalGuard, /resolveGuardAccess\(\{ requiredRoles, allowAdmin \}\)/);
    assert.match(operationalGuard, /access\.mode !== "REAL"/);
    assert.doesNotMatch(operationalGuard, /hasOwnerPreview|user\.role === "admin"|entities\.NUPSUser\.filter/);
    assert.match(access, /if \(requestedVenueId && candidate\.venue_id !== requestedVenueId\) continue/);
    assert.match(access, /if \(requestedMode && candidate\.mode !== requestedMode\) continue/);
    assert.match(access, /requiredRoles\.includes\(candidateRole\)/);
    assert.doesNotMatch(kioskGuard, /hasOwnerPreview/);
    assert.match(kioskGuard, /resolveGuardAccess\(\{ requiredRoles: roles, allowAdmin: true \}\)/);
    assert.match(kioskGuard, /access\.mode === "REAL" && roleAllowed/);
    assert.match(kioskGuard, /roles\.includes\(resolvedRole\)/);
    assert.match(guardAccess, /caller's own approved/);
    assert.match(guardAccess, /required_roles: requiredRoles/);
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
      assert.match(source, /\['OWNER', 'ADMINISTRATOR'(?:, 'MANAGER')?\]\.includes\(candidate\.granted_role\)/);
      assert.match(source, /candidate\.mode === 'REAL'/);
      assert.match(source, /accountMode === 'REAL'/);
    }
    assert.match(clockIn, /Cross-venue PIN provisioning denied/);
    assert.match(clockIn, /candidate\.venue_id === targetUser\.venue_id/);
    assert.match(vipWorkflow, /Back-office grant is bound to another venue/);
    assert.match(vipWorkflow, /candidate\.venue_id === AUTH_VENUE/);
    assert.match(vipWorkflow, /venueRecord\.venue_id \|\| venueRecord\.id/);
    for (const source of [staffOnboarding, venueTerminal, vipBills]) {
      assert.match(source, /grant\.mode\s*(?:===|!==)\s*'REAL'/);
      assert.match(source, /grant\.nups_user_id === (?:manager|account)\.id/);
      assert.match(source, /accountMode.*'REAL'/s);
    }
    for (const source of [venueTerminal, vipBills]) {
      assert.match(source, /NUPSAccessRequest\.filter\(grantQuery, '-created_date', 500\)/);
      assert.match(source, /NUPSUser\.get\(grant\.nups_user_id\)/);
      assert.match(source, /\.\.\.\(requested(?:Venue)? \? \{ venue_id: requested(?:Venue)? \} : \{\}\)/);
      assert.doesNotMatch(source, /NUPSUser\.filter\(\{ platform_email:[\s\S]{0,180}, 20\)/);
    }
    assert.doesNotMatch(staffOnboarding, /caller\.role === 'admin'/);
    assert.doesNotMatch(venueTerminal, /user\.role === 'admin'/);
  }],
  ["protected evidence requires an exact active account and approved grant tuple", () => {
    for (const source of [getEvidence, registerEvidence, captureEvidence]) {
      assert.match(source, /NUPSAccessRequest\.filter\(\{ email, status: 'APPROVED', venue_id: venueId, mode \}/);
      assert.match(source, /grant\.venue_id !== venueId \|\| grant\.mode !== mode \|\| !grant\.nups_user_id/);
      assert.match(source, /NUPSUser\.get\(grant\.nups_user_id\)/);
      assert.match(source, /account\?\.status === 'active'/);
      assert.match(source, /accountMode\(account\) === mode/);
      assert.doesNotMatch(source, /email\.split\('@'\)/);
    }
    assert.match(registerEvidence, /if \(!EVIDENCE_MODES\.has\(mode\)\)/);
    assert.doesNotMatch(registerEvidence, /body\.mode[\s\S]{0,120}: 'REAL'/);
    assert.match(captureEvidence, /barcode_id: contract_barcode,[\s\S]*transaction_id/);
    assert.match(captureEvidence, /allowedVenueRefs\.has/);
  }],
  ["contract, accounting export, and batch close require exact REAL grants", () => {
    for (const source of [vipContractGenerate, quickBooksExport, closePOSBatch]) {
      assert.match(source, /NUPSAccessRequest\.filter\(\{ email, status: 'APPROVED', venue_id: venueId, mode: 'REAL' \}/);
      assert.match(source, /grant\.venue_id !== venueId \|\| grant\.mode !== 'REAL' \|\| !grant\.nups_user_id/);
      assert.match(source, /NUPSUser\.get\(grant\.nups_user_id\)/);
      assert.match(source, /account\?\.status === 'active'/);
      assert.match(source, /accountMode\(account\) === 'REAL'/);
      assert.doesNotMatch(source, /user\.role === 'admin'|new Set\(\['admin'/);
    }
    assert.match(vipContractGenerate, /CONTRACT_ROLES\.has\(account\.role\)/);
    assert.match(vipContractFlow, /venue_id: venueId/);
    assert.match(quickBooksExport, /venueEntertainerIds\.has\(p\.entertainer_id\)/);
    assert.match(quickBooksExport, /Entertainer\.filter\(venueFilter/);
  }],
  ["remaining production write consumers require exact REAL authority", () => {
    assert.match(serverAuditGateway, /const GATEWAY_POLICIES =/);
    assert.doesNotMatch(serverAuditGateway, /entities\[entity\]/);
    assert.match(serverAuditGateway, /NUPSAccessRequest\.filter\(\{ email, status: 'APPROVED', venue_id: venueId, mode: 'REAL' \}/);
    assert.match(serverAuditGateway, /NUPSUser\.get\(grant\.nups_user_id\)/);
    assert.match(serverAuditGateway, /recordVenue !== venueId/);

    for (const source of [createPaymentRecord, createGlyphBucksSale]) {
      assert.match(source, /NUPSAccessRequest\.filter\(\{ email, status: 'APPROVED', venue_id, mode: 'REAL' \}/);
      assert.match(source, /NUPSUser\.get\(grant\.nups_user_id\)/);
      assert.match(source, /account\?\.status !== 'active'/);
      assert.match(source, /accountMode !== 'REAL'/);
      assert.doesNotMatch(source, /ALLOWED_ROLES\s*=\s*\['admin'/);
    }
    assert.match(createPaymentRecord, /String\(mode\)\.toUpperCase\(\) !== 'REAL'/);
    assert.match(createPaymentRecord, /PaymentRecord\.filter\([\s\S]*?mode: 'REAL'/);
    assert.match(createPaymentRecord, /GlyphBucksOrder\.filter\([\s\S]*?mode: 'REAL'/);
    assert.match(createGlyphBucksSale, /PaymentRecord\.filter\([\s\S]*?mode: 'REAL'/);
    assert.match(createGlyphBucksSale, /GlyphBucksOrder\.filter\([\s\S]*?mode: 'REAL'/);
    assert.doesNotMatch(createGlyphBucksSale, /let resolvedMode = 'REAL'/);

    assert.match(financialResolution, /async function requireRealFinancialAuthority/);
    assert.match(financialResolution, /NUPSAccessRequest\.filter\(\{ email, status: 'APPROVED', venue_id: venueId, mode: 'REAL' \}/);
    assert.match(financialResolution, /if \(action === "create_request"\)[\s\S]*?requireRealFinancialAuthority\(base44, user, venue_id, CREATE_REQUEST_ROLES\)/);
    assert.match(financialResolution, /exception\.venue_id !== venue_id/);
    for (const action of ['approve', 'reject', 'request_changes']) {
      assert.match(financialResolution, new RegExp(`if \\(action === "${action}"\\)[\\s\\S]*?requireRealFinancialAuthority\\(base44, user, resolution\\.venue_id, APPROVAL_ROLES\\)`));
    }
    assert.match(financialResolution, /resolution\.mode !== "REAL"/);
    assert.match(financialResolution, /if \(action === "execute"\)[\s\S]*?requireRealFinancialAuthority\(base44, user, resolution\.venue_id, EXECUTE_ROLES\)/);
    assert.match(financialResolution, /if \(action === "rollback"\)[\s\S]*?requireRealFinancialAuthority\(base44, user, resolution\.venue_id, ROLLBACK_ROLES\)/);
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
