/** Regular taxable salary, domestic employees, 2020+ W-4, Arizona, 2026 only.
 * Primary sources verified 2026-10-30:
 * https://www.irs.gov/publications/p15t Worksheet 1A, annual automated tables
 * https://www.irs.gov/publications/p15 2026 employee FICA
 * https://azdor.gov/sites/default/files/document/FORMS_WITHHOLDING_2026_A-4_f.pdf
 * Inputs are transcribed employer payroll settings, not an electronic W-4.
 * Pre-tax benefits, supplemental wages and nonresident-alien adjustments require manual payroll review.
 */
export const TAX_VERSION='IRS15T-AZ-A4-2026-v1';
const STANDARD={
 MARRIED:[[0,0,0],[19300,0,1000],[44100,2480,1200],[120100,11600,2200],[230700,35932,2400],[422850,82048,3200],[531750,116896,3500],[788000,206583.50,3700]],
 SINGLE:[[0,0,0],[7500,0,1000],[19900,1240,1200],[57900,5800,2200],[113200,17966,2400],[209275,41024,3200],[263725,58448,3500],[648100,192979.25,3700]],
 HEAD:[[0,0,0],[15550,0,1000],[33250,1770,1200],[83000,7740,2200],[121250,16155,2400],[217300,39207,3200],[271750,56631,3500],[656150,191171,3700]],
};
const MULTIPLE={
 MARRIED:[[0,0,0],[16100,0,1000],[28500,1240,1200],[66500,5800,2200],[121800,17966,2400],[217875,41024,3200],[272325,58448,3500],[400450,103291.75,3700]],
 SINGLE:[[0,0,0],[8050,0,1000],[14250,620,1200],[33250,2900,2200],[60900,8983,2400],[108938,20512,3200],[136163,29224,3500],[328350,96489.63,3700]],
 HEAD:[[0,0,0],[12075,0,1000],[20925,885,1200],[45800,3870,2200],[64925,8077.50,2400],[112950,19603.50,3200],[140175,28315.50,3500],[332375,95585.50,3700]],
};
const money=v=>Number.isSafeInteger(v)&&v>=0&&v<=10000000000;
const rate=(cents,bps)=>Math.round(cents*bps/10000);
export function calculatePayrollTaxes(gross,p={}){
 if(!money(gross)||gross<=0)throw new Error('Enter valid gross wages.');
 if(p.tax_year!==2026)throw new Error('Calculator supports the 2026 tax year only.');
 if(p.elections_verified!==true)throw new Error('Confirm payroll settings match the employee records.');
 if(!STANDARD[p.filing_status]||![2,4,12,24,26,52,260].includes(p.pay_periods))throw new Error('Select filing status and pay frequency.');
 if(typeof p.step2_checked!=='boolean')throw new Error('Confirm the W-4 multiple-jobs setting.');
 for(const key of ['step3_cents','step4a_cents','step4b_cents','step4c_cents','az_extra_cents','ytd_ss_wages_cents','ytd_medicare_wages_cents'])if(!money(p[key]))throw new Error(`Enter ${key.replaceAll('_',' ')}.`);
 if(![0,50,100,150,200,250,300,350].includes(p.az_rate_bps))throw new Error('Select an Arizona A-4 withholding election.');
 if(p.az_rate_bps===0&&p.az_exempt_confirmed!==true)throw new Error('Zero Arizona withholding requires a current exemption election.');
 if(p.federal_exempt!==undefined&&typeof p.federal_exempt!=='boolean')throw new Error('Federal exemption must be true or false.');
 if(p.federal_exempt===true&&p.federal_exempt_confirmed!==true)throw new Error('Confirm a current federal exemption election.');
 const periods=p.pay_periods;
 const adjustment=p.step2_checked?0:(p.filing_status==='MARRIED'?1290000:860000);
 const annual=Math.max(0,gross*periods+p.step4a_cents-p.step4b_cents-adjustment);
 const table=(p.step2_checked?MULTIPLE:STANDARD)[p.filing_status];
 const row=table.filter(r=>annual>=r[0]*100).at(-1);
 const annualTax=row[1]*100+(annual-row[0]*100)*row[2]/10000;
 const federal=p.federal_exempt===true?0:Math.round(Math.max(0,(annualTax-p.step3_cents)/periods)+p.step4c_cents);
 const ss=rate(Math.min(gross,Math.max(0,18450000-p.ytd_ss_wages_cents)),620);
 const medicare=rate(gross,145);
 const additional=rate(Math.max(0,p.ytd_medicare_wages_cents+gross-20000000)-Math.max(0,p.ytd_medicare_wages_cents-20000000),90);
 const az=rate(gross,p.az_rate_bps)+p.az_extra_cents;
 const deductions=[['FEDERAL','Federal income tax',federal],['SOCIAL_SECURITY','Social Security',ss],['MEDICARE','Medicare',medicare],['ADDITIONAL_MEDICARE','Additional Medicare',additional],['ARIZONA','Arizona income tax',az]].filter(r=>r[2]>0).map(([code,label,amount_cents])=>({code,label,amount_cents}));
 const total=deductions.reduce((s,r)=>s+r.amount_cents,0);
 if(total>gross)throw new Error('Withholding exceeds gross wages; review the payroll settings.');
 return {version:TAX_VERSION,tax_year:2026,federal_cents:federal,ss_cents:ss,medicare_cents:medicare,additional_medicare_cents:additional,az_cents:az,deductions,total_deductions_cents:total,net_cents:gross-total};
}
