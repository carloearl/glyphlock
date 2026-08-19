import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC_ROOT = path.join(ROOT, "src");
const MANIFEST_PATH = path.join(ROOT, "config", "nups-direct-write-legacy-manifest.json");
const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);
const WRITE_PATTERN = /\bbase44\.entities\.([A-Za-z_$][\w$]*)\.(create|update|delete|bulkCreate)\s*\(/g;

function walk(dir, output = []) {
  if (!fs.existsSync(dir)) return output;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", "build", "artifacts"].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath, output);
    else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) output.push(fullPath);
  }
  return output;
}

function inventory() {
  const findings = {};
  for (const filePath of walk(SRC_ROOT)) {
    const source = fs.readFileSync(filePath, "utf8");
    const calls = {};
    WRITE_PATTERN.lastIndex = 0;
    let match;
    while ((match = WRITE_PATTERN.exec(source)) !== null) {
      const signature = `${match[1]}.${match[2]}`;
      calls[signature] = (calls[signature] || 0) + 1;
    }
    const total = Object.values(calls).reduce((sum, count) => sum + count, 0);
    if (!total) continue;
    const relative = path.relative(ROOT, filePath).replaceAll(path.sep, "/");
    findings[relative] = { total, calls };
  }
  return Object.fromEntries(Object.entries(findings).sort(([a], [b]) => a.localeCompare(b)));
}

const current = inventory();

if (process.argv.includes("--snapshot")) {
  const snapshot = {
    version: 1,
    policy: "TIER_2_LOCKED: direct frontend Base44 entity writes may only decrease from this checkpoint. New files, new call signatures, or increased counts fail CI.",
    generated_at: new Date().toISOString(),
    source_root: "src",
    files: current,
  };
  process.stdout.write(JSON.stringify(snapshot, null, 2) + "\n");
  process.exit(0);
}

if (!fs.existsSync(MANIFEST_PATH)) {
  console.error("Missing config/nups-direct-write-legacy-manifest.json. Refusing to run without an explicit cutoff.");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const allowed = manifest.files || {};
const violations = [];

for (const [file, finding] of Object.entries(current)) {
  const baseline = allowed[file];
  if (!baseline) {
    violations.push(`${file}: ${finding.total} direct write(s) in an unapproved file`);
    continue;
  }
  for (const [signature, count] of Object.entries(finding.calls)) {
    const allowedCount = Number(baseline.calls?.[signature] || 0);
    if (count > allowedCount) {
      violations.push(`${file}: ${signature} increased from ${allowedCount} to ${count}`);
    }
  }
}

if (violations.length) {
  console.error("NUPS Tier 2 write-gateway guard FAILED.");
  for (const violation of violations) console.error(`- ${violation}`);
  console.error("Route new protected writes through writeEntity() or an authenticated backend function.");
  process.exit(1);
}

const baselineWrites = Object.values(allowed).reduce((sum, item) => sum + Number(item.total || 0), 0);
const currentWrites = Object.values(current).reduce((sum, item) => sum + Number(item.total || 0), 0);
console.log(`NUPS Tier 2 write-gateway guard passed: ${currentWrites}/${baselineWrites} grandfathered frontend writes remain; no new bypasses.`);
