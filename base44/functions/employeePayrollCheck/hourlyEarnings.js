// Versioned, full minimum-wage payroll. Tips do not reduce employer wages.
// Sources: AZ ICA 2026 notice; Tucson Minimum Wage Act; Flagstaff Minimum Wage.
export const WAGE_RULES_2026 = Object.freeze({ AZ:1515, TUCSON:1545, FLAGSTAFF:1835 });
const DAY=86400000;
function date(value) {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) throw new Error('workweek_date_required');
 const timestamp=Date.parse(value+'T00:00:00Z');
 if(!Number.isFinite(timestamp)||new Date(timestamp).toISOString().slice(0,10)!==value) throw new Error('workweek_date_required');
 return timestamp;
}
function amount(n) { return Number.isSafeInteger(n)&&n>=0&&n<=10000000000; }
export function calculateHourlyEarnings(input = {}) {
 if(input.records_verified!==true) throw new Error('earnings_records_required');
 if(typeof input.jurisdiction!=='string'||!Object.hasOwn(WAGE_RULES_2026,input.jurisdiction)) throw new Error('work_location_required');
 const minimum=WAGE_RULES_2026[input.jurisdiction];
 if(!Number.isSafeInteger(minimum)||minimum<=0) throw new Error('work_location_required');
 const start=date(input.period_start),end=date(input.period_end);
 if(!String(input.period_start).startsWith('2026-')||!String(input.period_end).startsWith('2026-')) throw new Error('wage_year_unsupported');
 if(end<start) throw new Error('period_end_before_start');
 const rate=input.hourly_rate_cents;
 if(!amount(rate)||rate<minimum) throw new Error('hourly_rate_below_minimum');
 if(!Array.isArray(input.weeks)||!input.weeks.length||input.weeks.length>54) throw new Error('workweeks_required');
 let regular=0,overtime=0,tips=0,paid=0,hours=0,otHours=0;
 const normalized=[];
 for(const w of input.weeks){
  const begin=date(w.week_start);
  if(begin>end||begin+6*DAY<start) throw new Error('workweek_outside_period');
  const rh=w.regular_hours_hundredths,oh=w.overtime_hours_hundredths;
  if(!Number.isInteger(rh)||!Number.isInteger(oh)||rh<0||oh<0||rh+oh>16800) throw new Error('hours_invalid');
  if(rh>4000) throw new Error('regular_hours_over_40');
  if(!amount(w.reported_tips_cents)||!amount(w.tips_paid_cents)||w.tips_paid_cents>w.reported_tips_cents) throw new Error('tips_paid_exceed_reported');
  regular+=Math.round(rate*rh/100);overtime+=Math.round(rate*oh*3/200);
  tips+=w.reported_tips_cents;paid+=w.tips_paid_cents;hours+=rh;otHours+=oh;
  normalized.push({week_start:w.week_start,regular_hours_hundredths:rh,overtime_hours_hundredths:oh,reported_tips_cents:w.reported_tips_cents,tips_paid_cents:w.tips_paid_cents});
 }
 const dates=normalized.map(w=>date(w.week_start)).sort((a,b)=>a-b);
 for(let i=1;i<dates.length;i++)if(dates[i]-dates[i-1]<7*DAY||(dates[i]-dates[0])%(7*DAY)!==0) throw new Error('workweek_overlap');
 const gross=regular+overtime+tips;
 if(!amount(gross)||gross<=0)throw new Error('gross_amount_required');
 return {version:'AZ-FULL-WAGE-TIPS-2026-v1',jurisdiction:input.jurisdiction,minimum_rate_cents:minimum,hourly_rate_cents:rate,regular_cents:regular,overtime_cents:overtime,wage_cents:regular+overtime,reported_tips_cents:tips,tips_paid_cents:paid,gross_cents:gross,regular_hours_hundredths:hours,overtime_hours_hundredths:otHours,weeks:normalized,records_verified:true};
}
