#!/usr/bin/env node
import fs from 'node:fs';

const TARGETS = {
  'src/components/devengine/DeployPanel.jsx': [['AgentChangeSet', 'delete', 1]],
  'src/components/glyphlock/bot/logic/useGlyphBotAudit.jsx': [
    ['GlyphBotAudit', 'create', 1],
    ['GlyphBotAudit', 'update', 3],
    ['GlyphBotAudit', 'delete', 1],
  ],
  'src/lib/registry/reconcileRegistry.js': [
    ['FeatureRegistry', 'create', 2],
    ['FeatureRegistry', 'update', 1],
  ],
  'src/pages/ArchitecturalDecisionRegister.jsx': [
    ['ArchitecturalDecisionRecord', 'create', 1],
    ['ArchitecturalDecisionRecord', 'update', 2],
  ],
  'src/components/admin/AdminConsultations.jsx': [['Consultation', 'update', 1]],
  'src/components/verification/VerificationIntakeForm.jsx': [['Consultation', 'create', 1]],
  'src/pages/Contact.jsx': [
    ['ContactEvent', 'create', 1],
    ['ContactEvent', 'update', 1],
  ],
  'src/components/Chat.jsx': [
    ['UserPreferences', 'create', 1],
    ['UserPreferences', 'update', 1],
    ['Conversation', 'create', 1],
    ['Conversation', 'update', 1],
  ],
  'src/components/glyphlock/HotspotPayloadConfig.jsx': [['HotspotPayload', 'delete', 1]],
  'src/components/imageLab/tabs/GalleryTab.jsx': [['InteractiveImage', 'delete', 2]],
  'src/components/imageLab/tabs/InteractiveTab.jsx': [
    ['InteractiveImage', 'create', 1],
    ['InteractiveImage', 'update', 2],
  ],
  'src/components/studio/EditorTab.jsx': [['InteractiveImage', 'create', 1]],
  'src/components/qr/QrBatchUploader.jsx': [['QRGenHistory', 'create', 1]],
  'src/components/qr/QrPreviewPanel.jsx': [['QrPreview', 'create', 1]],
  'src/components/qr/QrPreviewStorage.jsx': [
    ['QrPreview', 'create', 1],
    ['QrPreview', 'update', 1],
    ['QrPreview', 'delete', 2],
  ],
  'src/components/qr/QrStudio.jsx': [
    ['QRGenHistory', 'create', 1],
    ['QRAIScore', 'create', 1],
    ['QrPreview', 'delete', 1],
  ],
  'src/components/FreeTrialGuard.jsx': [['ServiceUsage', 'create', 2]],
  'src/components/glyphbot/FeedbackWidget.jsx': [['LLMFeedback', 'create', 1]],
  'src/components/partners/DocumentCenter.jsx': [['PartnerDocument', 'update', 1]],
  'src/components/partners/MarketingCollateral.jsx': [['MarketingAsset', 'update', 1]],
};

const IMPORT = "import { glyphlockWrite } from '@/lib/glyphlock/glyphlockWrite';\n";
let total = 0;
const summary = [];

for (const [file, targets] of Object.entries(TARGETS)) {
  if (!fs.existsSync(file)) throw new Error(`Missing Batch 18 target file: ${file}`);
  let source = fs.readFileSync(file, 'utf8');
  let changed = 0;
  for (const [entity, operation, expected] of targets) {
    const escaped = entity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`base44\\.entities\\.${escaped}\\.${operation}\\s*\\(`, 'g');
    const matches = source.match(pattern) || [];
    if (matches.length !== expected) {
      throw new Error(`${file}: expected ${expected} ${entity}.${operation} call(s), found ${matches.length}`);
    }
    const method = operation === 'delete' ? 'remove' : operation;
    source = source.replace(pattern, `glyphlockWrite.${method}('${entity}', `);
    changed += matches.length;
  }
  if (changed && !source.includes("@/lib/glyphlock/glyphlockWrite")) source = IMPORT + source;
  fs.writeFileSync(file, source);
  total += changed;
  summary.push({ file, changed });
}

if (total !== 41) throw new Error(`Expected 41 migrated calls, migrated ${total}`);
fs.mkdirSync('artifacts/batch18', { recursive: true });
fs.writeFileSync('artifacts/batch18/migration-summary.json', `${JSON.stringify({ total, files: summary }, null, 2)}\n`);
console.log(`[batch18-migrate] migrated ${total} live GlyphLock business writes across ${summary.length} files.`);
