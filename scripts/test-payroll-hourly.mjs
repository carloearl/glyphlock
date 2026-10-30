import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateDraftInput, validateReview } from '../base44/functions/employeePayrollCheck/payrollPolicy.js';
const earnings = await import('../base44/functions/employeePayrollCheck/hourlyEarnings.js').catch(() => ({}));
const input = { jurisdiction:'AZ',hourly_rate_cents:1515,period_start:'2026-10-01',period_end:'2026-10-31',records_verified:true,weeks:[{week_start:'2026-10-05',regular_hours_hundredths:4000,overtime_hours_hundredths:0,reported_tips_cents:20000,tips_paid_cents:20000}] };
test('minimum wages plus reported tips are taxable, already paid tips reduce check only',()=>{
 assert.equal(typeof earnings.calculateHourlyEarnings,'function','hourly calculator is required');
 const r=earnings.calculateHourlyEarnings(input);
 assert.equal(r.wage_cents,60600);assert.equal(r.gross_cents,80600);assert.equal(r.tips_paid_cents,20000);
});
test('weekly overtime is paid at 1.5 times the full hourly wage',()=>{
 const r=earnings.calculateHourlyEarnings({...input,weeks:[{...input.weeks[0],overtime_hours_hundredths:500}]});
 assert.equal(r.overtime_cents,11363);assert.equal(r.wage_cents,71963);
});
test('local Arizona minimums are enforced and no tip credit is silently taken',()=>{
 for(const [jurisdiction,minimum] of [['AZ',1515],['TUCSON',1545],['FLAGSTAFF',1835]]){
  assert.throws(()=>earnings.calculateHourlyEarnings({...input,jurisdiction,hourly_rate_cents:minimum-1}),/hourly_rate_below_minimum/);
  assert.equal(earnings.calculateHourlyEarnings({...input,jurisdiction,hourly_rate_cents:minimum}).minimum_rate_cents,minimum);
 }
});
test('invalid weekly hours, overlapping weeks and unsupported years fail closed',()=>{
 assert.throws(()=>earnings.calculateHourlyEarnings({...input,weeks:[{...input.weeks[0],regular_hours_hundredths:4100}]}),/regular_hours_over_40/);
 assert.throws(()=>earnings.calculateHourlyEarnings({...input,weeks:[input.weeks[0],input.weeks[0]]}),/workweek_overlap/);
 assert.throws(()=>earnings.calculateHourlyEarnings({...input,period_start:'2027-10-01',period_end:'2027-10-31'}),/wage_year_unsupported/);
 assert.throws(()=>earnings.calculateHourlyEarnings({...input,records_verified:false}),/earnings_records_required/);
 assert.throws(()=>earnings.calculateHourlyEarnings({...input,weeks:[{...input.weeks[0],tips_paid_cents:20001}]}),/tips_paid_exceed_reported/);
});
test('tips already paid are separate from deductions in draft and review reconciliation',()=>{
 const r=validateDraftInput({employee_name:'Test',pay_type:'HOURLY',period_start:'2026-10-01',period_end:'2026-10-31',issue_date:'2026-10-30',gross_cents:80600,deductions:[{code:'TAX',label:'Tax',amount_cents:10000}],tips_paid_cents:20000,net_cents:50600,ytd_status:'UNAVAILABLE'});
 assert.equal(r.ok,true, r.errors.join(','));assert.equal(r.normalized.tips_paid_cents,20000);
 assert.equal(validateReview({...r.normalized,status:'DRAFT',check_number:'26-395'},{confirm_totals:true}).ok,true);
});
test('negative check caused by taxes on paid tips is blocked',()=>{
 const r=validateDraftInput({employee_name:'Test',period_start:'2026-10-01',period_end:'2026-10-31',issue_date:'2026-10-30',gross_cents:10000,tips_paid_cents:9000,deductions:[{code:'TAX',label:'Tax',amount_cents:2000}],ytd_status:'UNAVAILABLE'});
 assert.equal(r.ok,false);assert.ok(r.errors.includes('net_negative'));
});
test('employee form contains no named employee, salary or month presets',()=>{
 const source=readFileSync('src/components/payroll/EmployeePayrollForm.jsx','utf8');
 assert.ok(!source.includes('const PRESETS'));assert.ok(!source.includes('Carlo Rene Earl'));assert.ok(!source.includes('4000.00'));
});

test('inherited jurisdiction names cannot bypass the minimum wage floor',()=>{
 for(const jurisdiction of ['toString','constructor','__proto__']){
  assert.throws(()=>earnings.calculateHourlyEarnings({...input,jurisdiction,hourly_rate_cents:1}),/work_location_required/);
 }
});
