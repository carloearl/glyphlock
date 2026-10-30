import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as policy from '../base44/functions/employeePayrollCheck/payrollPolicy.js';
import { stampFor } from '../src/lib/payroll/checkFormat.js';
const source=readFileSync('base44/functions/employeePayrollCheck/entry.ts','utf8');
function handlerFor(client){
 let handler;
 const module={exports:{}};
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{
  module,exports:module.exports, require:name=>name.includes('payrollPolicy')?policy:{createClientFromRequest:()=>client},
  Deno:{serve:fn=>{handler=fn;}},Response,Request,crypto,console,
 });
 return handler;
}
function clientFor({user={email:'owner@example.com',role:'user'},nups=[]}={}){
 let usernameLookups=0;
 const client={auth:{me:async()=>user},asServiceRole:{entities:{NUPSUser:{filter:async query=>{if(query.username){usernameLookups++;return nups;}return [];}}}}};
 return {client,get usernameLookups(){return usernameLookups;}};
}
test('unauthenticated payroll request is rejected',async()=>{
 const {client}=clientFor({user:null});
 const res=await handlerFor(client)(new Request('https://example.com',{method:'POST',body:'{}'}));
 assert.equal(res.status,401);
});
test('same email local-part cannot borrow another account owner role',async()=>{
 const state=clientFor({nups:[{role:'VENUE_OWNER',venue_id:'other-venue',platform_email:'owner@different.example',status:'active'}]});
 const res=await handlerFor(state.client)(new Request('https://example.com',{method:'POST',body:JSON.stringify({action:'list',venue_id:'other-venue',mode:'REAL'})}));
 assert.equal(res.status,403);assert.equal(state.usernameLookups,0);
});
test('platform admin is not locked to an old staff demo profile',async()=>{
 const client={auth:{me:async()=>({email:'admin@example.com',role:'admin',id:'admin'})},asServiceRole:{entities:{
  NUPSUser:{filter:async()=>[{role:'DOORMAN',venue_id:'dream_palace',is_demo:true}]},
  Venue:{get:async()=>({id:'venue-document',venue_id:'dream_palace',status:'active'})},
  EmployeePayrollCheck:{filter:async()=>[]},
 }}};
 const res=await handlerFor(client)(new Request('https://example.com',{method:'POST',body:JSON.stringify({action:'list',venue_id:'venue-document',mode:'REAL'})}));
 assert.equal(res.status,200);assert.deepEqual((await res.json()).records,[]);
});
test('invalid calendar dates cannot appear on payroll',()=>{
 const result=policy.validateDraftInput({employee_name:'Test Employee',period_start:'2026-02-30',period_end:'2026-03-01',issue_date:'2026-02-30',gross_cents:400000,deductions:[],no_deductions_confirmed:true,ytd_status:'UNAVAILABLE'});
 assert.ok(result.errors.includes('period_start_required'));assert.ok(result.errors.includes('issue_date_required'));
});
test('check prefix cannot silently change to 26-',()=>{
 assert.equal(policy.parseStockCheckNumber('wrong-395'),null);
 assert.equal(policy.parseStockCheckNumber('27-395'),null);
 assert.equal(policy.parseStockCheckNumber('26-395'),395);
});
test('unrecognized statuses never produce a negotiable check face',()=>{
 assert.equal(policy.documentStamp({status:'BROKEN'}).negotiable,false);
 assert.equal(stampFor({status:'BROKEN'}).negotiable,false);
});
