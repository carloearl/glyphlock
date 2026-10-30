import test from 'node:test';
import assert from 'node:assert/strict';
const m=await import('../src/lib/payroll/stockPrint.js').catch(()=>({buildStockHtml:()=>{throw new Error('not implemented');},DEFAULT_STOCK_PROFILE:{}}));
const record={status:'REVIEWED',mode:'REAL',employee_name:'Example Employee',check_number:'26-395',issue_date:'2026-10-30',period_start:'2026-08-01',period_end:'2026-08-31',gross_cents:400000,total_deductions_cents:68433,net_cents:331567,deductions:[],ytd_status:'UNAVAILABLE'};
test('actual stock printing requires confirmed alignment',()=>{assert.throws(()=>m.buildStockHtml(record,m.DEFAULT_STOCK_PROFILE));});
test('stock overlay uses letter paper and leaves MICR to preprinted stock',()=>{
 const html=m.buildStockHtml(record,{...m.DEFAULT_STOCK_PROFILE,alignment_confirmed:true});
 assert.match(html,/size:8.5in 11in/);assert.match(html,/3,315.67/);assert.doesNotMatch(html,/routing_number|account_number|background:#dce8f5/);
});
test('calibration uses a nonnegotiable sample, not a real check',()=>{const html=m.buildStockHtml(record,m.DEFAULT_STOCK_PROFILE,{test:true});assert.match(html,/NON-NEGOTIABLE/);assert.match(html,/SAMPLE PAYEE/);assert.doesNotMatch(html,/Example Employee/);});
test('stock field content is escaped and cannot create markup',()=>{const html=m.buildStockHtml({...record,employee_name:'<img src=x onerror=alert(1)>'},{...m.DEFAULT_STOCK_PROFILE,alignment_confirmed:true});assert.doesNotMatch(html,/<img/);assert.match(html,/&lt;img/);});
test('unreviewed and demo records cannot print as payment checks',()=>{assert.throws(()=>m.buildStockHtml({...record,status:'DRAFT'},{...m.DEFAULT_STOCK_PROFILE,alignment_confirmed:true}));assert.throws(()=>m.buildStockHtml({...record,mode:'DEMO'},{...m.DEFAULT_STOCK_PROFILE,alignment_confirmed:true}));});
