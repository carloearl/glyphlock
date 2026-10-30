import { useEffect, useState } from 'react';
import { fmtCents, toCents } from '@/lib/payroll/checkFormat';
import { WAGE_RULES_2026 } from '../../../base44/functions/employeePayrollCheck/hourlyEarnings.js';
const blankWeek=()=>({week_start:'',regular_hours:'',overtime_hours:'0',tips:'0',paid_tips:'0'});
const cls='mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white';
const hours=value=>/^\d+(\.\d{1,2})?$/.test(value)?Math.round(Number(value)*100):null;
export default function HourlyEarningsCalculator({onChange,result,error,initialRate=null}){
 const [location,setLocation]=useState('');
 const [minimum,setMinimum]=useState(initialRate==null);
 const [rate,setRate]=useState(initialRate ? (initialRate/100).toFixed(2) : '');
 const [weeks,setWeeks]=useState([blankWeek()]);
 const [verified,setVerified]=useState(false);
 const actualRate=minimum?WAGE_RULES_2026[location]:toCents(rate);
 useEffect(()=>{onChange({jurisdiction:location,hourly_rate_cents:actualRate,records_verified:verified,weeks:weeks.map(w=>({week_start:w.week_start,regular_hours_hundredths:hours(w.regular_hours),overtime_hours_hundredths:hours(w.overtime_hours),reported_tips_cents:toCents(w.tips),tips_paid_cents:toCents(w.paid_tips)}))});},[location,actualRate,weeks,verified,onChange]);
 const update=(i,key,value)=>setWeeks(old=>old.map((w,index)=>index===i?{...w,[key]:value}:w));
 return <section className="space-y-4 rounded-xl border border-indigo-800 bg-indigo-950/20 p-4">
  <h3 className="font-semibold">Hourly wages and reported tips</h3>
  <p className="text-xs text-slate-400">Full applicable hourly minimum plus reported tips. No tip credit is taken. Enter hours from verified workweek records; weekly overtime uses 1.5× the hourly rate. This calculator covers wages and tips only; bonuses, service charges and other regular-rate adjustments require separate payroll review.</p>
  <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs">Work location<select className={cls} value={location} onChange={e=>setLocation(e.target.value)}><option value="">Select applicable location</option><option value="AZ">Arizona state minimum — $15.15 (2026)</option><option value="TUCSON">Tucson — $15.45 (2026)</option><option value="FLAGSTAFF">Flagstaff — $18.35 (2026)</option></select></label><label className="text-xs">Hourly rate ($)<input className={cls} disabled={minimum} inputMode="decimal" value={minimum&&actualRate?(actualRate/100).toFixed(2):rate} onChange={e=>setRate(e.target.value)}/></label></div>
  <label className="flex gap-2 text-xs"><input type="checkbox" checked={minimum} onChange={e=>setMinimum(e.target.checked)}/>Use the full applicable minimum wage</label>
  {weeks.map((w,i)=><div key={i} className="space-y-3 rounded border border-slate-800 p-3"><div className="flex justify-between text-xs font-semibold"><span>Workweek {i+1}</span>{weeks.length>1&&<button type="button" onClick={()=>setWeeks(old=>old.filter((_,index)=>index!==i))} className="text-red-300">Remove workweek</button>}</div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><label className="text-xs">Employer workweek start<input type="date" className={cls} value={w.week_start} onChange={e=>update(i,'week_start',e.target.value)}/></label>{[['regular_hours','Regular hours (max 40/week)'],['overtime_hours','Overtime hours'],['tips','Payroll-reportable tips ($)'],['paid_tips','Of these tips, already paid ($)']].map(([key,label])=><label key={key} className="text-xs">{label}<input className={cls} inputMode="decimal" value={w[key]} onChange={e=>update(i,key,e.target.value)}/></label>)}</div></div>)}
  <button type="button" disabled={weeks.length>=54} className="rounded border border-slate-700 px-3 py-2 text-xs" onClick={()=>setWeeks(old=>[...old,blankWeek()])}>Add workweek</button>
  <p className="text-xs text-slate-400">Report taxable cash/card tips from employee tip reports, including tips already received. Exclude allocated tips and mandatory service charges. Already-paid tips reduce the check amount, not taxable gross or the tax deduction total.</p>
  <label className="flex gap-2 text-xs"><input type="checkbox" checked={verified} onChange={e=>setVerified(e.target.checked)}/>I verified work location, full workweek overtime records and payroll-reportable tips; entered hours belong to this earning period and have not already been paid.</label>
  {error&&<p className="text-xs text-amber-200">{error}</p>}
  {result&&<div className="grid gap-2 text-xs sm:grid-cols-3">{[['Regular wages',result.regular_cents],['Overtime wages',result.overtime_cents],['Reported tips',result.reported_tips_cents],['Taxable gross',result.gross_cents],['Tips already paid',result.tips_paid_cents]].map(([label,value])=><div key={label}>{label}: <strong>{fmtCents(value)}</strong></div>)}</div>}
  <p className="text-[11px] text-slate-500">2026 sources: <a className="underline" target="_blank" rel="noreferrer" href="https://www.azica.gov/labor-minimum-wage-main-page">Arizona ICA</a> · <a className="underline" target="_blank" rel="noreferrer" href="https://www.tucsonaz.gov/Departments/Business-Services-Department/Tucson-Minimum-Wage-Act">Tucson</a> · <a className="underline" target="_blank" rel="noreferrer" href="https://www.flagstaff.az.gov/3520/Minimum-Wage">Flagstaff</a> · <a className="underline" target="_blank" rel="noreferrer" href="https://www.irs.gov/taxtopics/tc761">IRS tips</a></p>
 </section>;
}
