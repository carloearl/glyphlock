import test from 'node:test';
import assert from 'node:assert/strict';
const {calculatePayrollTaxes}=await import('../base44/functions/employeePayrollCheck/taxes2026.js').catch(()=>({calculatePayrollTaxes:()=>{throw new Error('calculator not implemented');}}));
const profile={tax_year:2026,filing_status:'SINGLE',pay_periods:12,step2_checked:false,step3_cents:0,step4a_cents:0,step4b_cents:0,step4c_cents:0,az_rate_bps:200,az_extra_cents:0,ytd_ss_wages_cents:0,ytd_medicare_wages_cents:0,elections_verified:true};
test('2026 monthly $4000 salary reconciles IRS Worksheet1A and Arizona withholding',()=>{
 const r=calculatePayrollTaxes(400000,profile);assert.equal(r.federal_cents,29833);assert.equal(r.ss_cents,24800);assert.equal(r.medicare_cents,5800);assert.equal(r.az_cents,8000);assert.equal(r.net_cents,331567);
});
test('W4 credits, extra withholding and multiple-jobs table are applied',()=>{
 assert.equal(calculatePayrollTaxes(400000,{...profile,step3_cents:358000,step4c_cents:1000}).federal_cents,1000);
 assert.equal(calculatePayrollTaxes(400000,{...profile,step2_checked:true}).federal_cents,51208);
 assert.equal(calculatePayrollTaxes(400000,{...profile,filing_status:'MARRIED'}).federal_cents,13167);
 assert.equal(calculatePayrollTaxes(400000,{...profile,filing_status:'HEAD'}).federal_cents,20900);
});
test('social security cap and additional Medicare use prior taxable wages',()=>{
 const r=calculatePayrollTaxes(400000,{...profile,ytd_ss_wages_cents:18400000,ytd_medicare_wages_cents:19900000});
 assert.equal(r.ss_cents,3100);assert.equal(r.additional_medicare_cents,2700);
});
test('federal exemption cannot be activated by truthy strings or numbers',()=>{
 for(const value of ['false','true',1])assert.throws(()=>calculatePayrollTaxes(400000,{...profile,federal_exempt:value}));
 assert.equal(calculatePayrollTaxes(400000,{...profile,federal_exempt:false}).federal_cents,29833);
 assert.equal(calculatePayrollTaxes(400000,{...profile,federal_exempt:true,federal_exempt_confirmed:true}).federal_cents,0);
});
test('missing elections, wrong tax year and unsafe money fail validation',()=>{
 assert.throws(()=>calculatePayrollTaxes(400000,{...profile,elections_verified:false}));
 assert.throws(()=>calculatePayrollTaxes(400000,{...profile,tax_year:2027}));
 assert.throws(()=>calculatePayrollTaxes(NaN,profile));
 assert.throws(()=>calculatePayrollTaxes(400000,{...profile,ytd_ss_wages_cents:null}));
 assert.throws(()=>calculatePayrollTaxes(400000,{...profile,az_rate_bps:0}));
});
