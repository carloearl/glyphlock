import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REGISTRY_PATH = path.join(ROOT, "config", "base44-entities.json");
const OUTPUT_DIR = path.join(ROOT, "artifacts", "entity-audit");
const SOURCE_ROOTS = ["src", "functions", "backend", "api"].map((p) => path.join(ROOT, p));

const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
const entities = registry.entities;

const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);
const WRITE_OPS = new Set(["create", "update", "delete", "bulkCreate"]);
const READ_OPS = new Set(["list", "filter", "get", "search"]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", "build", ".git", "artifacts"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function normalizeEntityName(name) {
  return String(name).replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function classifyDomain(name) {
  const tests = [
    ["financial", /(Payment|Payout|Payroll|Settlement|Ledger|Journal|POS|GlyphBucks|ChartOfAccounts|Reconciliation|TaxForm|RateConfig|SafetyLimit|Chargeback)/i],
    ["identity-access", /(User|Person|Identity|GuestProfile|Entertainer|DriverProfile|Authenticator|Credential|VerificationToken|AccessRequest|PlatformRole|RoleAssignment|AssentEvidence)/i],
    ["contracts-compliance", /(Contract|Assent|SealRecord|VerificationMedia|Evidence|ResolutionRequest|AuditReport|Consultation)/i],
    ["security-audit", /(APIKey|Security|RateLimit|Blockchain|Proof|Audit|SystemConfig|SystemSnapshot|ThreatLog|SecureQRCode)/i],
    ["qr-barcode", /(QR|Qr|Barcode|ScanRun|ScanConfig)/],
    ["agent-ai", /(Agent|AIDJ|AnalyticsPrediction|GlyphBot|LLM|PromptSpec|VoiceProfile|ImageGen)/i],
    ["content-media", /(Asset|FileStorage|Image|Hotspot|MarketingAsset|ReferenceImage|InteractiveImage|Playlist|Track|Jukebox)/i],
    ["venue-operations", /(Venue|FrontDoor|StaffShift|DailyChecklist|CrowdMetrics|VIP|POS|Driver|Entertainer)/i],
    ["platform-governance", /(ArchitecturalDecision|PlatformDecisions|FeatureRegistry|ComponentRegistry|SIE|Sie|BuilderAction|SiteAudit|Sitemap|Seo|Ux|Accessibility|RouteAudit|NavAudit|DomainAudit|BackendAudit|ContentAudit|PerformanceAudit|IntegrationTestAudit)/i],
  ];
  for (const [domain, regex] of tests) if (regex.test(name)) return domain;
  return "general";
}

function classifyRisk(name, domain) {
  if (/(APIKey|AuthenticatorCredential|VerificationToken|Payment|Payout|Payroll|Settlement|Ledger|JournalEntry|POSTransaction|POSZReport|GlyphBucks|UserRoleAssignment|NUPSUser|CustomerIdentity|AssentEvidence|Contract|SecurityAlert|SystemConfig)/i.test(name)) return "critical";
  if (["financial", "identity-access", "contracts-compliance", "security-audit"].includes(domain)) return "high";
  if (/(Audit|Registry|Config|Snapshot|Verification|Evidence|ScanEvent)/i.test(name)) return "medium";
  return "standard";
}

const files = SOURCE_ROOTS.flatMap((root) => walk(root));
const source = files.map((file) => ({
  file,
  relative: path.relative(ROOT, file).replaceAll(path.sep, "/"),
  text: fs.readFileSync(file, "utf8"),
}));

const normalizedGroups = new Map();
for (const entity of entities) {
  const key = normalizeEntityName(entity);
  if (!normalizedGroups.has(key)) normalizedGroups.set(key, []);
  normalizedGroups.get(key).push(entity);
}

const duplicateGroups = [...normalizedGroups.values()].filter((group) => group.length > 1);

const results = entities.map((entity) => {
  const escaped = escapeRegex(entity);
  const dotCall = new RegExp(`base44\\.entities\\.${escaped}\\.(list|filter|get|search|create|update|delete|bulkCreate)\\s*\\(`, "g");
  const bracketCall = new RegExp(`base44\\.entities\\[['\"]${escaped}['\"]\\]\\.(list|filter|get|search|create|update|delete|bulkCreate)\\s*\\(`, "g");
  const gateway = new RegExp(`entity\\s*:\\s*['\"]${escaped}['\"]`, "g");
  const plain = new RegExp(`\\b${escaped}\\b`, "g");

  const references = [];
  const operations = new Map();
  let gatewayMentions = 0;
  let plainMentions = 0;

  for (const file of source) {
    const fileOps = new Set();
    for (const regex of [dotCall, bracketCall]) {
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(file.text)) !== null) {
        fileOps.add(match[1]);
        operations.set(match[1], (operations.get(match[1]) || 0) + 1);
      }
    }

    gateway.lastIndex = 0;
    const gatewayMatches = [...file.text.matchAll(gateway)].length;
    gatewayMentions += gatewayMatches;

    plain.lastIndex = 0;
    const totalPlain = [...file.text.matchAll(plain)].length;
    plainMentions += totalPlain;

    if (fileOps.size || gatewayMatches || totalPlain) {
      references.push({
        file: file.relative,
        operations: [...fileOps].sort(),
        gateway_mentions: gatewayMatches,
        mentions: totalPlain,
      });
    }
  }

  const domain = classifyDomain(entity);
  const risk = classifyRisk(entity, domain);
  const opObject = Object.fromEntries([...operations.entries()].sort());
  const directWrites = [...operations.entries()]
    .filter(([op]) => WRITE_OPS.has(op))
    .reduce((sum, [, count]) => sum + count, 0);
  const directReads = [...operations.entries()]
    .filter(([op]) => READ_OPS.has(op))
    .reduce((sum, [, count]) => sum + count, 0);
  const duplicateNames = normalizedGroups.get(normalizeEntityName(entity)) || [];

  let status = "unreferenced";
  if (references.length) status = "referenced";
  if (directWrites) status = "direct-write";
  if (duplicateNames.length > 1) status = "duplicate-name";

  return {
    entity,
    domain,
    risk,
    status,
    duplicate_group: duplicateNames.length > 1 ? duplicateNames : [],
    source_files: references.length,
    direct_reads: directReads,
    direct_writes: directWrites,
    gateway_mentions: gatewayMentions,
    total_mentions: plainMentions,
    operations: opObject,
    references,
  };
});

const summary = {
  audited_at: new Date().toISOString(),
  registry_count: entities.length,
  source_file_count: source.length,
  referenced_entities: results.filter((r) => r.source_files > 0).length,
  unreferenced_entities: results.filter((r) => r.source_files === 0).length,
  entities_with_direct_writes: results.filter((r) => r.direct_writes > 0).length,
  critical_entities_with_direct_writes: results.filter((r) => r.risk === "critical" && r.direct_writes > 0).length,
  normalized_duplicate_groups: duplicateGroups,
};

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUTPUT_DIR, "entity-audit.json"), JSON.stringify({ summary, results }, null, 2));

const md = [];
md.push("# Base44 Entity Model Audit");
md.push("");
md.push(`Generated: ${summary.audited_at}`);
md.push("");
md.push("## Summary");
md.push("");
md.push(`- Registry entities: **${summary.registry_count}**`);
md.push(`- Source files scanned: **${summary.source_file_count}**`);
md.push(`- Referenced entities: **${summary.referenced_entities}**`);
md.push(`- Unreferenced entities: **${summary.unreferenced_entities}**`);
md.push(`- Entities with direct SDK writes: **${summary.entities_with_direct_writes}**`);
md.push(`- Critical entities with direct SDK writes: **${summary.critical_entities_with_direct_writes}**`);
md.push("");

md.push("## Normalized duplicate names");
md.push("");
if (!duplicateGroups.length) md.push("None found.");
else for (const group of duplicateGroups) md.push(`- ${group.join(" / ")}`);
md.push("");

const directCritical = results
  .filter((r) => r.risk === "critical" && r.direct_writes > 0)
  .sort((a, b) => b.direct_writes - a.direct_writes || a.entity.localeCompare(b.entity));
md.push("## Critical entities with direct frontend writes");
md.push("");
if (!directCritical.length) md.push("None detected.");
else {
  md.push("| Entity | Domain | Writes | Gateway mentions | Source files |");
  md.push("|---|---|---:|---:|---:|");
  for (const r of directCritical) {
    md.push(`| ${r.entity} | ${r.domain} | ${r.direct_writes} | ${r.gateway_mentions} | ${r.source_files} |`);
  }
}
md.push("");

const unreferenced = results.filter((r) => r.source_files === 0);
md.push("## Unreferenced registry entities");
md.push("");
md.push(unreferenced.length ? unreferenced.map((r) => `- ${r.entity} (${r.domain}, ${r.risk})`).join("\n") : "None.");
md.push("");

md.push("## Full inventory");
md.push("");
md.push("| Entity | Domain | Risk | Status | Reads | Writes | Gateway | Files |");
md.push("|---|---|---|---|---:|---:|---:|---:|");
for (const r of results.sort((a, b) => a.domain.localeCompare(b.domain) || a.entity.localeCompare(b.entity))) {
  md.push(`| ${r.entity} | ${r.domain} | ${r.risk} | ${r.status} | ${r.direct_reads} | ${r.direct_writes} | ${r.gateway_mentions} | ${r.source_files} |`);
}

fs.writeFileSync(path.join(OUTPUT_DIR, "entity-audit.md"), md.join("\n") + "\n");

console.log(JSON.stringify(summary, null, 2));
console.log(`Entity audit written to ${path.relative(ROOT, OUTPUT_DIR)}`);
