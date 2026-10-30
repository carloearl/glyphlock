import React,{useEffect,useState} from 'react';
import {toCents,fmtCents} from '@/lib/payroll/checkFormat';
export default function PayrollTaxCalculator({onChange,result,error}){
 const [p,setP]=useState({tax_year:2026,filing_status:'',pay_periods:12,step2_checked:false,step3_cents:0,step4a_cents:0,step4b_cents:0,step4c_cents:0,az_rate_bps:200,az_extra_cents:0,ytd_ss_wages_cents:null,ytd_medicare_wages_cents:null,elections_verified:false});
 const update=(key,value)=>setP(old=>({...old,[key]:value}));
 useEffect(()=>{onChange(p);},[p,onChange]);
 const cls='mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white';
 return <section className="space-y-3 rounded-lg border border-indigo-500/40 bg-indigo-950/20 p-4">
  <h4 className="font-semibold text-indigo-100">2026 payroll tax calculator</h4>
  <p className="text-xs text-slate-400">Regular taxable salary · Arizona · W-4 from 2020 or later. Enter settings from employee records. Pre-tax benefits, supplemental wages and nonresident adjustments use manual payroll review.</p>
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
   <label className="text-xs">Federal filing status<select className={cls} value={p.filing_status} onChange={e=>update('filing_status',e.target.value)}><option value="">Select from W-4</option><option value="SINGLE">Single / married filing separately</option><option value="MARRIED">Married filing jointly</option><option value="HEAD">Head of household</option></select></label>
   <label className="text-xs">Pay frequency<select className={cls} value={p.pay_periods} onChange={e=>update('pay_periods',Number(e.target.value))}>{[[12,'Monthly'],[24,'Twice monthly'],[26,'Every two weeks'],[52,'Weekly'],[4,'Quarterly'],[2,'Twice yearly']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
   <label className="text-xs">Arizona A-4 rate<select className={cls} value={p.az_rate_bps} onChange={e=>update('az_rate_bps',Number(e.target.value))}>{[50,100,150,200,250,300,350,0].map(v=><option key={v} value={v}>{v/100}%{v===200?' (A-4 default if no election)':''}{v===0?' (current exemption required)':''}</option>)}</select></label>
   {[[ 'step3_cents','W-4 Step 3 annual credits'],['step4a_cents','Step 4(a) annual other income'],['step4b_cents','Step 4(b) annual deductions'],['step4c_cents','Step 4(c) extra federal per check'],['az_extra_cents','Extra Arizona per check'],['ytd_ss_wages_cents','Prior 2026 Social Security wages'],['ytd_medicare_wages_cents','Prior 2026 Medicare wages']].map(([key,label])=><label key={key} className="text-xs">{label}<input className={cls} inputMode="decimal" placeholder={key.startsWith('ytd')?'Enter 0 only if verified':'0.00'} defaultValue={key.startsWith('ytd')?'':'0.00'} onChange={e=>update(key,e.target.value.trim()===''?null:toCents(e.target.value))}/></label>)}
  </div>
  <label className="flex gap-2 text-xs"><input type="checkbox" checked={p.step2_checked} onChange={e=>update('step2_checked',e.target.checked)}/>W-4 Step 2 multiple-jobs box is checked</label>
  {p.az_rate_bps===0&&<label className="flex gap-2 text-xs"><input type="checkbox" checked={!!p.az_exempt_confirmed} onChange={e=>update('az_exempt_confirmed',e.target.checked)}/>Current Arizona zero-withholding election is on file</label>}
  <label className="flex gap-2 text-xs"><input type="checkbox" checked={p.elections_verified} onChange={e=>update('elections_verified',e.target.checked)}/>I verified these settings and prior taxable wages against employee records.</label>
  {error&&<p className="text-xs text-amber-200">{error}</p>}
  {result&&<div className="grid gap-2 text-xs sm:grid-cols-3">{result.deductions.map(d=><div key={d.code}>{d.label}: <strong>{fmtCents(d.amount_cents)}</strong></div>)}<div className="font-semibold text-emerald-200">Net before other deductions: {fmtCents(result.net_cents)}</div></div>}
  <p className="text-[11px] text-slate-400">Sources: <a className="underline" href="https://www.irs.gov/publications/p15t" target="_blank" rel="noreferrer">IRS 15-T</a> · <a className="underline" href="https://www.irs.gov/publications/p15" target="_blank" rel="noreferrer">IRS 15</a> · <a className="underline" href="https://azdor.gov/forms/withholding-forms/arizona-withholding-percentage-election" target="_blank" rel="noreferrer">Arizona A-4</a>. Employer calculation settings, not a submitted W-4 or A-4.</p>
 </section>;
}
