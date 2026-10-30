import React from 'react';
import {openStockPrint} from '@/lib/payroll/stockPrint';
export default function StockPrintSettings({profile,onChange,onError}){
 const update=patch=>onChange({...profile,...patch,alignment_confirmed:false});
 const numeric=(key,label,min,max)=><label className="text-xs" key={key}>{label}<input type="number" min={min} max={max} step="0.01" value={profile[key]} onChange={e=>update({[key]:Number(e.target.value)})} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"/></label>;
 return <details className="rounded-lg border border-slate-700 bg-slate-900/40 p-4" open>
  <summary className="cursor-pointer font-semibold">Chase stock alignment and type</summary>
  <p className="mt-2 text-xs text-slate-400">Top-check, Letter sheet. Coordinates are inches from the top-left sheet corner; fonts are points. Starting positions are a calibration template, not verified against your stock. The stock supplies bank details and MICR.</p>
  <div className="mt-3 grid gap-3 sm:grid-cols-3">{numeric('check_height','Check panel height',3,4)}{numeric('offset_x','Horizontal offset',-.5,.5)}{numeric('offset_y','Vertical offset',-.5,.5)}</div>
  <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr><th>Field</th><th>X (in)</th><th>Y (in)</th><th>Font (pt)</th></tr></thead><tbody>{Object.entries(profile.fields).map(([name,field])=><tr key={name}><td className="capitalize">{name}</td>{['x','y','font'].map(key=><td key={key} className="p-1"><input aria-label={name+' '+key} type="number" step={key==='font'?'.5':'.01'} min={key==='font'?6:0} max={key==='font'?18:8.5} value={field[key]} onChange={e=>update({fields:{...profile.fields,[name]:{...field,[key]:Number(e.target.value)}}})} className="w-24 rounded border border-slate-700 bg-slate-950 p-1"/></td>)}</tr>)}</tbody></table></div>
  <label className="mt-3 flex gap-2 text-xs"><input type="checkbox" checked={profile.print_number} onChange={e=>update({print_number:e.target.checked})}/>Print the check number on the face (leave off if stock already has it)</label>
  <button type="button" onClick={()=>{try{openStockPrint(null,profile,{test:true});}catch(e){onError?.(e.message);}}} className="mt-3 rounded border border-indigo-400 px-3 py-2 text-xs text-indigo-100">Print nonnegotiable alignment test</button>
  <label className="mt-3 flex gap-2 text-xs text-emerald-200"><input type="checkbox" checked={profile.alignment_confirmed} onChange={e=>onChange({...profile,alignment_confirmed:e.target.checked})}/>I matched the plain-paper test to my Chase stock, checked font sizes and MICR clearance, and selected 100% scale with browser headers off.</label>
 </details>;
}
