import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const access=await import('../src/lib/nups/ownerDashboardIdentity.js').catch(()=>({}));
test('fresh platform admin outranks stale staff permissions',()=>{
 assert.equal(typeof access.ownerDashboardRole,'function');
 assert.equal(access.ownerDashboardRole({email:'admin@example.com',role:'admin'},{highest_role:'DOORMAN'}),'PLATFORM_ADMIN');
});
test('canonical authenticated owner identities resolve consistently with NUPS access control',()=>{
 assert.equal(access.ownerDashboardRole({email:' CarloEarl@GlyphLock.com ',role:'user'},{highest_role:'DOORMAN'}),'SOVEREIGN');
 assert.notEqual(access.ownerDashboardRole({email:'carloearl@unrelated.example',role:'user'},{highest_role:'DOORMAN'}),'SOVEREIGN');
 assert.equal(access.ownerDashboardRole(null,{highest_role:'PLATFORM_ADMIN'}),null);
});
test('legacy dashboard revalidates authenticated identity instead of trusting cached role',()=>{
 const s=readFileSync('src/pages/NUPSOwner.jsx','utf8');
 assert.ok(!s.includes('const sessionUser = readNUPSSession()'));
 assert.ok(s.includes('ownerDashboardRole(currentUser, permissionsData)'));
});
test('payroll has only one Admin menu entry',()=>{
 const s=readFileSync('src/components/nups/shell/NUPSAppShell.jsx','utf8');
 assert.equal((s.match(/id: "payroll"/g)||[]).length,1);
 assert.ok(!s.includes('label: "Payroll Checks"'));
});
