import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeAuditLogs } from '../src/lib/audit/auditAnalytics.js';

const gateway = fs.readFileSync('src/lib/nups/writeEntity.js', 'utf8');
const logger = fs.readFileSync('src/lib/nups/activityLog.js', 'utf8');
const manager = fs.readFileSync('src/components/admin/DataManagerTable.jsx', 'utf8');

assert.match(gateway, /delete_requires_complete_before_snapshot/);
assert.match(gateway, /before_value: deleteBeforeSnapshot/);
assert.match(gateway, /\n\s+mode,\n\s+actor:/);
assert.match(logger, /opts\.mode/);
assert.match(manager, /data: \{ \.\.\.record,/);

const base = {
  timestamp: new Date().toISOString(),
  user_email: 'owner@example.com',
  user_role: 'admin',
  action_type: 'DELETE',
  entity_affected: 'POSTransaction:demo-1',
  venue_id: 'DEMO_VENUE_001',
};

const healthyDemoDelete = {
  ...base,
  mode: 'DEMO',
  notes: 'ADMIN_DATA_MANAGER_PURGE_DEMO:POSTransaction',
  before_value: { id: 'demo-1', mode: 'DEMO', venue_id: 'DEMO_VENUE_001' },
  after_value: null,
};

const healthy = analyzeAuditLogs([healthyDemoDelete], { systemMode: 'REAL' });
assert.equal(healthy.findings.some((f) => f.code === 'A2'), false);
assert.equal(healthy.findings.some((f) => f.code === 'A5'), false);
assert.equal(healthy.totals.highImpactActions, 1);
assert.equal(Object.hasOwn(healthy.totals, 'critical'), false);

const unsafe = analyzeAuditLogs([{ ...healthyDemoDelete, mode: 'REAL', before_value: null }], { systemMode: 'REAL' });
assert.equal(unsafe.findings.find((f) => f.code === 'A2')?.count, 1);
assert.equal(unsafe.findings.find((f) => f.code === 'A5')?.count, 1);

console.log('NUPS audit-integrity regression checks passed.');
