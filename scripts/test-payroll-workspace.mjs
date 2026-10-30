import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as policy from '../base44/functions/employeePayrollCheck/payrollPolicy.js';
import * as taxes from '../base44/functions/employeePayrollCheck/taxes2026.js';
function handler(client) {
 let serve;const module={exports:{}};
 vm.runInNewContext(ts.transpileModule(readFileSync('base44/functions/employeePayrollCheck/entry.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{
 module,exports:module.exports,require:n=>n.includes('payrollPolicy')?policy:n.includes('taxes2026')?taxes:{createClientFromRequest:()=>client},
 Deno:{serve:fn=>{serve=fn;}},Request,Response,crypto,console});
 return async body=>serve(new Request('https://example.com',{method:'POST',body:JSON.stringify({venue_id:'venue',mode:'REAL',...body})}));
}
function setup(){
 const profiles=[{id:'foreign',account_key:'GLYPHLOCK_LLC:other:REAL'}];const calls=[];
 const client={auth:{me:async()=>({email:'owner@example.com',role:'admin',id:'owner'})},asServiceRole:{entities:{
 Venue:{get:async()=>({id:'venue',venue_id:'venue',status:'active'})},
 EmployeePayrollProfile:{filter:async q=>{calls.push(q);return profiles.filter(p=>p.account_key===q.account_key);},get:async id=>profiles.find(p=>p.id===id),create:async data=>{const p={id:'new',...data};profiles.push(p);return p;},update:async(id,data)=>Object.assign(profiles.find(p=>p.id===id),data)},
 MigrationAuditLog:{filter:async q=>{calls.push(q);return[];},create:async data=>data},
 EmployeePayrollCheck:{filter:async q=>{calls.push(q);return[];}},
 }}};
 return{call:handler(client),profiles,calls,client};
}
test('employee settings persist as integer cents in authenticated venue/mode',async()=>{
 const s=setup();const res=await s.call({action:'save_employee',employee:{employee_name:'Employee One',employee_ref:'EMP-1',base_salary_cents:400000,pay_type:'SALARY',pay_periods:12,pay_day:15,status:'ACTIVE',notes:''}});
 assert.equal(res.status,200);const {employee}=await res.json();
 assert.equal(employee.account_key,'GLYPHLOCK_LLC:venue:REAL');assert.equal(employee.base_salary_cents,400000);assert.equal(s.profiles.length,2);
});
test('employee edit cannot cross tenant boundary',async()=>{
 const s=setup();const res=await s.call({action:'save_employee',employee:{id:'foreign',employee_name:'Other',base_salary_cents:400000,pay_type:'SALARY',pay_periods:12,pay_day:15,status:'ACTIVE'}});
 assert.equal(res.status,403);assert.equal(s.profiles[0].employee_name,undefined);
});
test('invalid salary and schedule are rejected before storage',async()=>{
 const s=setup();const res=await s.call({action:'save_employee',employee:{employee_name:'Test',base_salary_cents:1.5,pay_type:'SALARY',pay_periods:0,pay_day:32,status:'ACTIVE'}});
 assert.equal(res.status,400);assert.equal(s.profiles.length,1);
});
test('workspace reads scope employee settings and payroll activity',async()=>{
 const s=setup();const res=await s.call({action:'workspace'});
 assert.equal(res.status,200);const body=await res.json();assert.deepEqual(body.employees,[]);assert.deepEqual(body.activity,[]);
 assert.ok(s.calls.some(q=>q.account_key==='GLYPHLOCK_LLC:venue:REAL'));
 assert.ok(s.calls.some(q=>q.entity_name?.$in?.includes('EmployeePayrollCheck')&&q.venue_id==='venue'&&q.mode==='REAL'));
});
test('staff cannot load payroll workspace',async()=>{
 const s=setup();s.client.auth.me=async()=>null;
 assert.equal((await s.call({action:'workspace'})).status,401);
});
test('Payroll route and Admin menu replace Legacy payroll entry',()=>{
 const app=readFileSync('src/App.jsx','utf8'),nav=readFileSync('src/components/nups/shell/NUPSAppShell.jsx','utf8');
 assert.match(app,/path="\/Payroll"/);assert.match(nav,/label: "Payroll"[\s\S]{0,120}to: "\/Payroll"/);
 assert.doesNotMatch(nav,/id: "lg-payroll"/);
});

test('staff role cannot read or save payroll even with a venue request',async()=>{
 const s=setup();s.client.auth.me=async()=>({email:'staff@example.com',role:'user'});
 s.client.asServiceRole.entities.NUPSUser={filter:async()=>[{role:'DOORMAN',platform_email:'staff@example.com',venue_id:'venue',status:'active',access_mode:'REAL'}]};
 assert.equal((await s.call({action:'workspace'})).status,403);
 assert.equal((await s.call({action:'save_employee',employee:{}})).status,403);
});
test('older paycheck pages preserve tenant scope and report more records',async()=>{
 const s=setup();let query,limit,skip;
 s.client.asServiceRole.entities.EmployeePayrollCheck.filter=async(q,sort,l,offset)=>{query=q;limit=l;skip=offset;return Array.from({length:201},(_,i)=>({id:String(i)}));};
 const res=await s.call({action:'list',skip:200});
 assert.equal(res.status,200);const body=await res.json();
 assert.equal(body.records.length,200);assert.equal(body.has_more,true);
 assert.equal(skip,200);assert.equal(limit,201);assert.equal(query.account_key,'GLYPHLOCK_LLC:venue:REAL');
});
test('invalid pagination is rejected',async()=>{
 const s=setup();assert.equal((await s.call({action:'list',skip:-1})).status,400);
});
test('client cannot choose employee storage scope or inject undeclared properties',async()=>{
 const s=setup();const res=await s.call({action:'save_employee',employee:{employee_name:'Test',employee_ref:'EMP1',base_salary_cents:400000,pay_type:'SALARY',pay_periods:12,pay_day:15,status:'ACTIVE',account_key:'other',mode:'DEMO',venue_id:'other',routing_number:'not-stored'}});
 const {employee}=await res.json();assert.equal(res.status,200);assert.equal(employee.mode,'REAL');assert.equal(employee.venue_id,'venue');assert.equal(employee.routing_number,undefined);
});
