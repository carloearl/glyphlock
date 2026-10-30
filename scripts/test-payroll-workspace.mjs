import * as hourly from '../base44/functions/employeePayrollCheck/hourlyEarnings.js';
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
 module,exports:module.exports,require:n=>n.includes('hourlyEarnings')?hourly:n.includes('payrollPolicy')?policy:n.includes('taxes2026')?taxes:{createClientFromRequest:()=>client},
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

test('deferred save from REAL cannot start an old load or navigate after switching to DEMO',async()=>{
 let cursor=0;const state=[];const effects=[];const requests=[];const navigations=[];
 const hooks={
  useState:init=>{const i=cursor++;if(!(i in state))state[i]=typeof init==='function'?init():init;return[state[i],value=>{state[i]=typeof value==='function'?value(state[i]):value;}];},
  useRef:init=>{const i=cursor++;if(!(i in state))state[i]={current:init};return state[i];},
  useCallback:fn=>fn,useEffect:fn=>effects.push(fn),
 };
 const pending=[];
 const api={listChecks:scope=>{requests.push(scope.mode);return new Promise(resolve=>pending.push(()=>resolve({records:[],has_more:false})));},loadPayrollWorkspace:async()=>({employees:[],activity:[]})};
 const jsx=(type,props)=>({type,props});
 const module={exports:{}};
 const source=readFileSync('src/pages/Payroll.jsx','utf8');
 vm.runInNewContext(ts.transpileModule(source,{fileName:'Payroll.jsx',compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,allowJs:true}}).outputText,{
  module,exports:module.exports,require:name=>name==='react'?hooks:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:name==='react-router-dom'?{useSearchParams:()=>[new URLSearchParams('tab=new'),p=>navigations.push(p)]}:name.includes('useActiveVenue')?{useActiveVenue:()=>({id:'venue',name:'Venue'})}:name.includes('payrollApi')?api:name.includes('checkFormat')?{fmtCents:n=>String(n)}:{default:name},
 });
 function render(){cursor=0;effects.length=0;return module.exports.default();}
 function nodes(node){return !node||typeof node!=='object'?[]:[node,...[node.props?.children].flat(Infinity).flatMap(nodes)];}
 let tree=render();effects.shift()();pending.shift()();await new Promise(resolve=>setTimeout(resolve,0));
 tree=render();const form=nodes(tree).find(n=>String(n.type).includes('EmployeePayrollForm'));assert.ok(form);
 const deferredCompletion=form.props.onCreated;
 nodes(tree).find(n=>n.props?.['aria-label']==='Payroll ledger').props.onChange({target:{value:'DEMO'}});
 render();effects.shift()();
 deferredCompletion();
 assert.deepEqual(requests,['REAL','DEMO']);assert.equal(navigations.length,0);
 pending.splice(0).forEach(resolve=>resolve());
});

test('authenticated canonical owner retains payroll access despite old staff profiles',async()=>{
 const s=setup();s.client.auth.me=async()=>({email:'carloearl@glyphlock.com',role:'user',id:'owner'});
 s.client.asServiceRole.entities.NUPSUser={filter:async()=>{throw new Error('stale staff lookup must not override owner identity');}};
 assert.equal((await s.call({action:'workspace'})).status,200);
});
test('hourly draft recomputes wages and blocks tampered gross or paid-tip offsets',async()=>{
 const s=setup();const earnings={jurisdiction:'AZ',hourly_rate_cents:1515,records_verified:true,weeks:[{week_start:'2026-10-05',regular_hours_hundredths:4000,overtime_hours_hundredths:0,reported_tips_cents:20000,tips_paid_cents:20000}]};
 const body={action:'create_draft',pay_type:'hourly',period_start:'2026-10-01',period_end:'2026-10-31',tax_profile:{},hourly_earnings:earnings,gross_cents:1,tips_paid_cents:0};
 const res=await s.call(body);assert.equal(res.status,400);assert.equal((await res.json()).error,'earnings_mismatch');
});
test('hourly employee rate persists separately from default salary',async()=>{
 const s=setup();const res=await s.call({action:'save_employee',employee:{employee_name:'Hourly Employee',employee_ref:'EMP2',pay_type:'HOURLY',base_salary_cents:0,hourly_rate_cents:1515,pay_periods:26,pay_day:15,status:'ACTIVE'}});
 assert.equal(res.status,200);const {employee}=await res.json();assert.equal(employee.hourly_rate_cents,1515);assert.equal(employee.base_salary_cents,0);
});
test('hourly saved check stores wage/tip snapshot and taxes gross before the paid-tip offset',async()=>{
 const s=setup();const E=s.client.asServiceRole.entities;
 const seq={id:'sequence',next_number:395};let saved;
 E.PayrollCheckSequence={filter:async()=>[seq],get:async()=>seq,updateMany:async(q,op)=>{Object.assign(seq,op.$set||{});for(const k of Object.keys(op.$unset||{}))delete seq[k];}};
 E.EmployeePayrollCheck={filter:async()=>[],create:async data=>{saved={id:'check',...data};return saved;}};
 const profile={tax_year:2026,filing_status:'SINGLE',pay_periods:52,step2_checked:false,step3_cents:0,step4a_cents:0,step4b_cents:0,step4c_cents:0,az_rate_bps:200,az_extra_cents:0,ytd_ss_wages_cents:0,ytd_medicare_wages_cents:0,elections_verified:true};
 const calc=taxes.calculatePayrollTaxes(80600,profile);
 const res=await s.call({action:'create_draft',pay_type:'HOURLY',employee_name:'Hourly Employee',period_start:'2026-10-01',period_end:'2026-10-31',issue_date:'2026-10-30',tax_profile:profile,hourly_earnings:{jurisdiction:'AZ',hourly_rate_cents:1515,records_verified:true,weeks:[{week_start:'2026-10-05',regular_hours_hundredths:4000,overtime_hours_hundredths:0,reported_tips_cents:20000,tips_paid_cents:20000}]},gross_cents:80600,tips_paid_cents:20000,deductions:calc.deductions,total_deductions_cents:calc.total_deductions_cents,net_cents:calc.net_cents-20000,ytd_status:'UNAVAILABLE',idempotency_key:'hourly-test-request-1',stock_start_number:'26-395'});
 assert.equal(res.status,200,JSON.stringify(await res.clone().json()));assert.equal(saved.gross_cents,80600);assert.equal(saved.hourly_earnings.wage_cents,60600);assert.equal(saved.net_cents,calc.net_cents-20000);assert.equal(saved.tips_paid_cents,20000);assert.equal(saved.total_deductions_cents,calc.total_deductions_cents);
 assert.equal(saved.status,'DRAFT');assert.equal(saved.check_number,'26-395');
});
