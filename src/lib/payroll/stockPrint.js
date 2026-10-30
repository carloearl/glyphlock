import {amountInWords,fmtCents,fmtDate,periodLabel} from './checkFormat.js';
export const DEFAULT_STOCK_PROFILE={
 name:'Chase top-check Letter — calibrate to your stock',check_height:3.5,offset_x:0,offset_y:0,alignment_confirmed:false,print_number:false,
 fields:{payee:{x:1,y:1.15,width:5.2,font:11},date:{x:6.25,y:0.7,width:1.5,font:10},amount:{x:6.35,y:1.15,width:1.5,font:11},words:{x:0.65,y:1.55,width:7.15,font:10},memo:{x:0.7,y:2.4,width:5.5,font:9},number:{x:7,y:0.3,width:1,font:10}},
};
export const escapePrintText=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function buildStockHtml(input,profile=DEFAULT_STOCK_PROFILE,options={}){
 const sample=options.test===true;
 if(!sample&&(!profile.alignment_confirmed||input.status!=='REVIEWED'||input.mode!=='REAL'))throw new Error('Review the check and confirm stock alignment first.');
 const r=sample?{employee_name:'SAMPLE PAYEE — NON-NEGOTIABLE',check_number:'SAMPLE',issue_date:'2026-10-30',period_start:'2026-10-01',period_end:'2026-10-31',gross_cents:100000,total_deductions_cents:0,net_cents:100000,deductions:[],memo:'ALIGNMENT TEST — PLAIN PAPER ONLY'}:input;
 if(!Number.isSafeInteger(r.net_cents)||r.net_cents<0)throw new Error('Invalid net pay.');
 const checkHeight=Number(profile.check_height),ox=Number(profile.offset_x),oy=Number(profile.offset_y);
 if(!Number.isFinite(checkHeight)||checkHeight<3||checkHeight>4||!Number.isFinite(ox)||!Number.isFinite(oy)||Math.abs(ox)>.5||Math.abs(oy)>.5)throw new Error('Invalid stock dimensions or offsets.');
 const values={payee:r.employee_name,date:fmtDate(r.issue_date),amount:fmtCents(r.net_cents),words:amountInWords(r.net_cents)+' Dollars',memo:r.memo||('Payroll '+periodLabel(r)),number:r.check_number};
 const fields=Object.entries(values).filter(([key])=>key!=='number'||profile.print_number).map(([key,value])=>{
  const f=profile.fields?.[key];if(!f)throw new Error('Missing field coordinates.');
  const {x,y,width,font}=f;
  if(![x,y,width,font].every(Number.isFinite)||x+ox<0||y+oy<0||x+ox+width>8.5||y+oy+.25>checkHeight-.625||font<6||font>18)throw new Error('Field overlaps sheet edge or MICR clear area.');
  return '<div class="field" style="left:'+(x+ox)+'in;top:'+(y+oy)+'in;width:'+width+'in;font-size:'+font+'pt">'+escapePrintText(value)+'</div>';
 }).join('');
 const deductions=(r.deductions||[]).map(d=>'<tr><td>'+escapePrintText(d.label)+'</td><td>'+escapePrintText(fmtCents(d.amount_cents))+'</td></tr>').join('');
 const earnings=r.hourly_earnings?'<p>Regular wages '+escapePrintText(fmtCents(r.hourly_earnings.regular_cents))+' · Overtime '+escapePrintText(fmtCents(r.hourly_earnings.overtime_cents))+' · Reported tips '+escapePrintText(fmtCents(r.hourly_earnings.reported_tips_cents))+' · Hourly rate '+escapePrintText(fmtCents(r.hourly_earnings.hourly_rate_cents))+' · Hours '+escapePrintText(r.hourly_earnings.regular_hours_hundredths/100)+' regular / '+escapePrintText(r.hourly_earnings.overtime_hours_hundredths/100)+' overtime</p>':'';
 const stub='<h2>GlyphLock LLC — Employee pay stub</h2><p>'+escapePrintText(r.employee_name)+' · Check '+escapePrintText(r.check_number)+' · '+escapePrintText(fmtDate(r.issue_date))+'</p><p>Earning period: '+escapePrintText(periodLabel(r))+'</p>'+earnings+'<table><tr><td>Taxable gross</td><td>'+escapePrintText(fmtCents(r.gross_cents))+'</td></tr>'+deductions+'<tr><th>Total deductions</th><th>'+escapePrintText(fmtCents(r.total_deductions_cents))+'</th></tr><tr><td>Reported tips already paid (not withholding)</td><td>'+escapePrintText(fmtCents(r.tips_paid_cents||0))+'</td></tr><tr><th>Net check</th><th>'+escapePrintText(fmtCents(r.net_cents))+'</th></tr></table><p>Opening YTD before this check: '+(r.ytd_status==='VERIFIED_OPENING'?'Gross '+escapePrintText(fmtCents(r.ytd_gross_cents))+' · Deductions '+escapePrintText(fmtCents(r.ytd_deductions_cents))+' · Net '+escapePrintText(fmtCents(r.ytd_net_cents)):'Unavailable')+'</p>';
 return '<!doctype html><html><head><meta charset="utf-8"><title>'+escapePrintText(sample?'Payroll alignment test':'Check '+r.check_number)+'</title><style>@page{size:8.5in 11in;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;width:8.5in;height:11in;background:white;color:black;font-family:Arial,sans-serif}.sheet{position:relative;width:8.5in;height:11in;overflow:hidden}.field{position:absolute;line-height:1.15;overflow-wrap:anywhere}.stub{position:absolute;left:.5in;right:.5in;top:'+(checkHeight+.2)+'in;font-size:9pt}.stub h2{font-size:11pt}table{width:100%;border-collapse:collapse}td,th{padding:4pt;border-bottom:.5pt solid #aaa;text-align:left}td:last-child,th:last-child{text-align:right}.test{position:absolute;left:.5in;top:2.7in;font-size:9pt}.guides{position:absolute;inset:0 0 auto;height:'+checkHeight+'in;border:1px dashed #888;pointer-events:none}</style></head><body><main class="sheet">'+(sample?'<div class="guides"></div>':'')+fields+(sample?'<div class="test">NON-NEGOTIABLE · Print at 100%, Letter, no margins or browser headers. Compare against stock.</div>':'')+'<section class="stub">'+stub+'</section></main></body></html>';
}
export function openStockPrint(record,profile,options){
 const html=buildStockHtml(record,profile,options);
 const win=window.open('','_blank','width=900,height=950');
 if(!win)throw new Error('Allow pop-ups for this site to open the print sheet.');
 win.onload=()=>{win.focus();win.print();};
 win.document.write(html);win.document.close();
 return win;
}
