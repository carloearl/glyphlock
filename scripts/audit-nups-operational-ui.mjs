import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, 'artifacts', 'nups-operational-audit');
const roots = [path.join(ROOT, 'src', 'components', 'nups'), path.join(ROOT, 'src', 'pages')];
const pageFilter = /(NUPS|Register|POS|Door|VIP|Settlement|Receipt|DJHome|GlyphBotMixer)/i;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(jsx?|tsx?)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = roots.flatMap((root) => walk(root)).filter((file) => {
  if (file.includes(`${path.sep}components${path.sep}nups${path.sep}`)) return true;
  return pageFilter.test(path.basename(file));
});

const findings = [];
const counts = { files: files.length, buttons: 0, links: 0, critical_actions: 0 };

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const relative = path.relative(ROOT, file).replaceAll(path.sep, '/');

  const buttonRegex = /<button\b([\s\S]*?)>/g;
  let match;
  while ((match = buttonRegex.exec(source)) !== null) {
    counts.buttons += 1;
    const attrs = match[1];
    const line = source.slice(0, match.index).split('\n').length;
    const nearby = source.slice(match.index, Math.min(source.length, match.index + 450));
    const actionable = /\bon(?:Click|Submit|PointerDown|MouseDown|KeyDown|TouchStart)\s*=|\bonclick\s*=|\btype\s*=\s*["']submit["']|\bform\s*=|\{\.\.\./i.test(attrs);
    const inert = /onClick\s*=\s*\{\s*\(.*?\)\s*=>\s*\{?\s*\}?\s*\}/s.test(attrs) || /onClick\s*=\s*\{\s*undefined\s*\}/.test(attrs);
    const placeholder = /coming soon|todo|not implemented/i.test(nearby);
    const label = (nearby.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) || 'button').replaceAll('|', '/');

    if (!actionable && !/disabled\s*=\s*\{?true\}?/.test(attrs)) {
      findings.push({ severity: 'error', type: 'button-without-action', file: relative, line, label });
    }
    if (inert) findings.push({ severity: 'error', type: 'empty-click-handler', file: relative, line, label });
    if (placeholder) findings.push({ severity: 'warning', type: 'placeholder-control', file: relative, line, label });
    if (/\b(pay|charge|refund|settle|payout|complete|finalize|delete|void|sign|mint)\b/i.test(label)) counts.critical_actions += 1;
  }

  const linkRegex = /<a\b([\s\S]*?)>/g;
  while ((match = linkRegex.exec(source)) !== null) {
    counts.links += 1;
    const attrs = match[1];
    const line = source.slice(0, match.index).split('\n').length;
    if (/href\s*=\s*["'](?:#|javascript:void\(0\))["']/.test(attrs)) {
      findings.push({ severity: 'error', type: 'dead-anchor', file: relative, line, label: attrs.trim().slice(0, 120) });
    }
  }
}

const summary = {
  generated_at: new Date().toISOString(),
  ...counts,
  errors: findings.filter((f) => f.severity === 'error').length,
  warnings: findings.filter((f) => f.severity === 'warning').length,
};

fs.mkdirSync(OUTPUT, { recursive: true });
fs.writeFileSync(path.join(OUTPUT, 'nups-operational-ui.json'), JSON.stringify({ summary, findings }, null, 2));
const md = [
  '# NUPS Operational UI Audit',
  '',
  `Generated: ${summary.generated_at}`,
  '',
  `- Files: **${summary.files}**`,
  `- Buttons: **${summary.buttons}**`,
  `- Links: **${summary.links}**`,
  `- Critical-action controls: **${summary.critical_actions}**`,
  `- Errors: **${summary.errors}**`,
  `- Warnings: **${summary.warnings}**`,
  '',
  '| Severity | Type | File | Line | Context |',
  '|---|---|---|---:|---|',
  ...findings.map((f) => `| ${f.severity} | ${f.type} | ${f.file} | ${f.line} | ${f.label.replaceAll('|', '/')} |`),
  '',
];
fs.writeFileSync(path.join(OUTPUT, 'nups-operational-ui.md'), md.join('\n'));
console.log(JSON.stringify(summary));
if (summary.errors > 0) process.exitCode = 2;
