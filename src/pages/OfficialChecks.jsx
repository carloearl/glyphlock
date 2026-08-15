import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function amountToWords(n) {
  if (!n || isNaN(n)) return "";
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  function b(n) { if(n===0)return "";if(n<20)return ones[n];if(n<100)return tens[Math.floor(n/10)]+(n%10?"-"+ones[n%10]:"");return ones[Math.floor(n/100)]+" Hundred"+(n%100?" "+b(n%100):""); }
  const d = Math.floor(n), c = Math.round((n - d) * 100);
  let w = "";
  if (d >= 1000) w += b(Math.floor(d / 1000)) + " Thousand ";
  if (d % 1000 >= 100) w += b(Math.floor((d % 1000) / 100)) + " Hundred ";
  if (d % 100 > 0) w += b(d % 100);
  if (d === 0) w = "Zero";
  return w.trim() + " and " + String(c).padStart(2, "0") + "/100";
}
function fmt(n) { return "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d) { return new Date(d).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }); }

// ─── GLYPHLOCK DATA ───────────────────────────────────────────────────────────
const GL = { name:"GlyphLock LLC", addr1:"12721 N 121st Dr", addr2:"El Mirage, AZ 85335", phone:"(480) 886-5588", entityNumber:"23831258" };

// ─── TAX CALC ─────────────────────────────────────────────────────────────────
function calcTaxes(gross) {
  const federal = gross * 0.22, ss = gross * 0.062, medicare = gross * 0.0145, az = gross * 0.025;
  const total = federal + ss + medicare + az;
  return { federal, ss, medicare, az, total, net: gross - total };
}

// ─── BUILD CHECK FROM PAYROLL RECORD ─────────────────────────────────────────
function buildCheck(rec, idx) {
  const checkNum = String(4471 + idx).padStart(4, "0");
  const grossBreakdown = [];

  if ((rec.gross_commissions || 0) > 0) {
    grossBreakdown.push({ l: "VIP Commissions", hr: Math.round(rec.shift_hours || 0), rate: 0, amt: rec.gross_commissions });
  }
  if ((rec.gross_tips || 0) > 0) {
    grossBreakdown.push({ l: "Tips Received", hr: 0, rate: 0, amt: rec.gross_tips });
  }
  if (grossBreakdown.length === 0) {
    grossBreakdown.push({ l: "Earnings", hr: Math.round(rec.shift_hours || 0), rate: 0, amt: rec.gross_total });
  }

  return {
    num: checkNum,
    amount: rec.gross_total || 0,
    memoDetail: `${rec.pay_period_start} – ${rec.pay_period_end}`,
    grossBreakdown,
    tips: rec.gross_tips || 0,
    ytdGross: rec.gross_total || 0,
    ytdTips: rec.gross_tips || 0,
    ytdHours: Math.round(rec.shift_hours || 0),
    payDate: fmtDate(rec.pay_period_end),
    startStr: fmtDate(rec.pay_period_start),
    endStr: fmtDate(rec.pay_period_end),
    payeeName: rec.stage_name || rec.legal_name || "Entertainer",
    legalName: rec.legal_name || "",
    status: rec.status,
    _record: rec,
  };
}

// ─── UI COLORS ────────────────────────────────────────────────────────────────
const C = { bg:"#0a0a14", card:"#0e0e1e", border:"#1a1a30", accent:"#818cf8", accentDim:"#818cf812", green:"#4ade80", greenDim:"#4ade8010", muted:"#505070", text:"#e0e0f4" };
const PC = ["#6366f1","#059669","#d97706","#dc2626","#7c3aed","#0891b2"];

// ─── SQUIGGLY / GUILLOCHE ─────────────────────────────────────────────────────
function GuillocheBg() {
  return (
    <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.045,pointerEvents:"none"}} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="gc3" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="15" cy="15" r="13" fill="none" stroke="#1a1a6a" strokeWidth="0.3"/>
          <circle cx="15" cy="15" r="9"  fill="none" stroke="#1a1a6a" strokeWidth="0.2"/>
          <circle cx="15" cy="15" r="5"  fill="none" stroke="#1a1a6a" strokeWidth="0.18"/>
          <line x1="0" y1="15" x2="30" y2="15" stroke="#1a1a6a" strokeWidth="0.18"/>
          <line x1="15" y1="0" x2="15" y2="30" stroke="#1a1a6a" strokeWidth="0.18"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#gc3)"/>
    </svg>
  );
}

function HoloSquare() {
  return (
    <div style={{width:68,height:56,flexShrink:0,background:"linear-gradient(135deg,#e2e2e2 0%,#f6f6f6 20%,#cad2e2 40%,#e4e4ee 60%,#c2cad6 80%,#eeeeF6 100%)",border:"1.5px dashed #999",position:"relative",overflow:"hidden",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:`repeating-linear-gradient(45deg,#aaa 0,#aaa .5px,transparent 0,transparent 5px),repeating-linear-gradient(-45deg,#aaa 0,#aaa .5px,transparent 0,transparent 5px)`,opacity:.13}}/>
      <div style={{position:"absolute",inset:5,border:"0.75px solid #bbb",opacity:.5}}/>
      <div style={{fontSize:6.5,fontWeight:800,color:"#888",letterSpacing:"0.12em",textTransform:"uppercase",zIndex:1,textAlign:"center",lineHeight:1.5}}>HOLO<br/>BADGE</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CHECK FACE
// ══════════════════════════════════════════════════════════════════════════════
function CheckFace({ ck }) {
  const taxes = calcTaxes(ck.amount);
  const net = taxes.net;
  const words = amountToWords(net);
  const pLabel = `${ck.startStr} – ${ck.endStr}`;
  const micr = "BANK DETAILS ARE NOT STORED IN THE CLIENT APPLICATION";

  return (
    <div style={{position:"relative",background:"#dce8f5",overflow:"hidden",fontFamily:"Arial,Helvetica,sans-serif"}}>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(160deg, #ccdded 0%, #d8eaf8 30%, #e8f2fc 55%, #f0f6fe 80%, #dde9f5 100%)",opacity:1}}/>
      <GuillocheBg/>
      <div style={{position:"absolute",top:7,left:7,right:7,bottom:28,border:"0.7px solid #7090b0",pointerEvents:"none",zIndex:2}}/>
      <div style={{position:"absolute",top:11,left:11,right:11,bottom:32,border:"0.35px solid #90a8c8",pointerEvents:"none",zIndex:2}}/>

      <div style={{position:"relative",zIndex:3,background:"#1a2a4a",height:16,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontSize:6.5,color:"#8ab0d0",letterSpacing:"0.2em",fontWeight:700,textTransform:"uppercase",fontFamily:"Arial,sans-serif"}}>
          VOID · NOT VALID WITHOUT AUTHORIZED SIGNATURE · GLYPHLOCK LLC PAYROLL · AZ ENTITY #{GL.entityNumber}
        </div>
      </div>

      <div style={{position:"relative",zIndex:3,padding:"10px 18px 6px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
          <div style={{display:"flex",gap:10,alignItems:"flex-start",flex:1}}>
            <div style={{width:44,height:44,background:"linear-gradient(135deg,#0d0d60,#1a1a9a)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 6px rgba(0,0,0,0.3)"}}>
              <span style={{fontFamily:"Georgia,serif",fontWeight:700,fontSize:22,color:"#fff"}}>G</span>
            </div>
            <div>
              <div style={{fontFamily:"Arial,sans-serif",fontWeight:700,fontSize:11,color:"#0d0d60"}}>{GL.name}</div>
              <div style={{fontSize:8.5,color:"#334",lineHeight:1.65}}>{GL.phone}</div>
              <div style={{fontSize:8.5,color:"#334",lineHeight:1.65}}>{GL.addr1}</div>
              <div style={{fontSize:8.5,color:"#334"}}>{GL.addr2}</div>
            </div>
          </div>

          <div style={{flex:1,display:"flex",justifyContent:"center",alignItems:"flex-start",paddingTop:2}}>
            <div style={{background:"#fff",border:"1px solid #b0b8cc",padding:"6px 16px 5px",textAlign:"center"}}>
              <div style={{fontFamily:"Arial,sans-serif",fontWeight:700,fontSize:13,color:"#0d1a3a",letterSpacing:"0.01em",lineHeight:1}}>BANK DETAILS WITHHELD</div>
              <div style={{fontSize:7.5,color:"#334455",marginTop:3,fontFamily:"Arial,sans-serif"}}>Supply securely at authorized print time</div>
            </div>
          </div>

          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"Arial,sans-serif",fontWeight:700,fontSize:10,color:"#556"}}>AZ Entity #: {GL.entityNumber}</div>
            </div>
            <div style={{border:"1.5px solid #334466",background:"#fff",padding:"3px 10px",textAlign:"center",minWidth:52}}>
              <div style={{fontSize:7,color:"#556",fontWeight:700,letterSpacing:"0.08em"}}>CHECK NO.</div>
              <div style={{fontFamily:"'Courier New',monospace",fontWeight:700,fontSize:18,color:"#0d0d60",letterSpacing:3}}>{ck.num}</div>
            </div>
          </div>
        </div>

        <div style={{display:"flex",justifyContent:"flex-end",gap:0,marginBottom:4}}>
          <div style={{background:"#1a2a4a",color:"#fff",padding:"2px 14px",fontSize:8,fontWeight:700,letterSpacing:"0.08em",marginRight:2}}>DATE</div>
          <div style={{background:"#1a2a4a",color:"#fff",padding:"2px 14px",fontSize:8,fontWeight:700,letterSpacing:"0.08em",marginRight:4}}>AMOUNT</div>
        </div>

        <div style={{display:"flex",alignItems:"flex-end",gap:8,marginBottom:8}}>
          <div style={{fontSize:9,color:"#556",fontWeight:700,flexShrink:0,fontFamily:"Arial,sans-serif"}}>PAY</div>
          <div style={{flex:1,borderBottom:"1.5px solid #334466",padding:"0 6px 2px",fontFamily:"'Courier New',monospace",fontSize:11,color:"#111",fontWeight:700}}>{words}</div>
          <div style={{borderBottom:"1.5px solid #334466",minWidth:90,padding:"0 6px 2px",fontFamily:"'Courier New',monospace",fontSize:11,color:"#111",textAlign:"center"}}>{ck.payDate}</div>
          <div style={{border:"2px solid #334466",background:"#fffef8",padding:"3px 12px",display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
            <span style={{fontFamily:"Arial",fontSize:11,color:"#556",fontWeight:700}}>$</span>
            <span style={{fontFamily:"'Courier New',monospace",fontWeight:900,fontSize:15,color:"#111",minWidth:90,textAlign:"right"}}>{fmt(net).replace("$","")}</span>
          </div>
        </div>

        <div style={{display:"flex",alignItems:"flex-start",gap:0,marginBottom:10}}>
          <div style={{display:"flex",flexDirection:"column",gap:1,flexShrink:0,marginRight:6}}>
            <span style={{fontFamily:"Arial",fontSize:8.5,color:"#556"}}>TO THE</span>
            <span style={{fontFamily:"Arial",fontSize:8.5,color:"#556"}}>ORDER</span>
            <span style={{fontFamily:"Arial",fontSize:8.5,color:"#556"}}>OF</span>
          </div>
          <div style={{flex:1}}>
            <div style={{borderBottom:"1.5px solid #334466",padding:"0 6px 2px",fontFamily:"'Courier New',monospace",fontWeight:700,fontSize:14,color:"#0d0d60",marginBottom:4}}>{ck.payeeName}</div>
            <div style={{fontSize:9,color:"#334",lineHeight:1.7,paddingLeft:6}}>{GL.addr1}</div>
            <div style={{fontSize:9,color:"#334",lineHeight:1.7,paddingLeft:6}}>{GL.addr2}</div>
          </div>
          <div style={{position:"absolute",top:"46%",left:"50%",transform:"translate(-50%,-50%) rotate(-28deg)",fontSize:80,fontWeight:900,color:"#880000",opacity:.06,letterSpacing:14,userSelect:"none",pointerEvents:"none",whiteSpace:"nowrap",fontFamily:"Arial Black,sans-serif",zIndex:1}}>VOID</div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,marginLeft:12}}>
            <HoloSquare/>
          </div>
        </div>

        <div style={{display:"flex",alignItems:"flex-end",gap:14}}>
          <div style={{flexShrink:0,minWidth:90}}>
            <div style={{fontFamily:"Arial,sans-serif",fontSize:8,color:"#778",marginBottom:2}}>Financial Institution</div>
            <div style={{fontFamily:"Arial,sans-serif",fontWeight:700,fontSize:11,color:"#0d1a3a",lineHeight:1}}>Configured securely at print time</div>
          </div>
          <div style={{flex:1.6}}>
            <div style={{display:"flex",alignItems:"flex-end",gap:6}}>
              <span style={{fontFamily:"Arial",fontSize:8.5,color:"#556",flexShrink:0,marginBottom:2}}>FOR</span>
              <div style={{flex:1,borderBottom:"1.5px solid #334466",padding:"0 6px 2px",fontFamily:"'Courier New',monospace",fontSize:10,color:"#111"}}>Venus · {pLabel}</div>
            </div>
          </div>
          <div style={{flex:1.4,textAlign:"center"}}>
            <div style={{borderBottom:"2px solid #222",marginBottom:3,height:26,backgroundImage:"repeating-linear-gradient(90deg,transparent,transparent 4px,#dde8f0 4px,#dde8f0 5px)"}}/>
            <div style={{fontFamily:"Arial",fontSize:8.5,color:"#778",fontStyle:"italic"}}>AUTHORIZED SIGNATURE</div>
          </div>
        </div>
      </div>

      <div style={{position:"relative",zIndex:3,padding:"14px 18px 10px",textAlign:"left"}}>
        <div style={{fontFamily:"'Courier New',monospace",fontSize:14,letterSpacing:3,color:"#0d0d40",userSelect:"none"}}>{micr}</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAY STUB
// ══════════════════════════════════════════════════════════════════════════════
function PayStub({ ck }) {
  const taxes = calcTaxes(ck.amount);
  const ytdTaxes = calcTaxes(ck.ytdGross);
  const pLabel = `${ck.startStr} – ${ck.endStr}`;
  const totalHrs = ck.grossBreakdown.reduce((a, r) => a + (r.hr || 0), 0);

  return (
    <div style={{background:"#fff",fontFamily:"Arial,Helvetica,sans-serif",fontSize:9,borderTop:"1.5px solid #334466"}}>
      <div style={{background:"#f4f4f8",borderBottom:"1.5px solid #9090b0",padding:"5px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontFamily:"Arial,sans-serif",fontWeight:700,fontSize:11,color:"#0d0d60"}}>{GL.name}</div>
        <div style={{display:"flex",gap:0}}>
          {[
            {l:"EMPLOYEE",v:ck.payeeName},
            {l:"SOCIAL SECURITY NO.",v:"XXX-XX-XXXX"},
            {l:"PAY RATE",v:ck.grossBreakdown[0]?.rate ? `$${ck.grossBreakdown[0].rate}/hr` : "Contract"},
            {l:"PERIOD END",v:ck.endStr},
            {l:"CHECK NO.",v:ck.num},
          ].map((f, i) => (
            <div key={i} style={{padding:"2px 10px",borderLeft:"1px solid #9090b0",textAlign:"center"}}>
              <div style={{fontSize:7,fontWeight:700,color:"#666",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:1}}>{f.l}</div>
              <div style={{fontSize:9,fontWeight:700,color:"#0d0d60",fontFamily:"'Courier New',monospace"}}>{f.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderBottom:"1.5px solid #9090b0"}}>
        <div style={{borderRight:"1.5px solid #9090b0"}}>
          <div style={{display:"grid",gridTemplateColumns:"2fr 0.6fr 0.6fr 0.8fr",background:"#dde0f0",borderBottom:"1px solid #9090b0"}}>
            {["EARNINGS","HOURS","AMOUNT","YTD"].map(h => (
              <div key={h} style={{padding:"3px 8px",fontWeight:700,fontSize:8,color:"#0d0d60",borderRight:"1px solid #9090b0",textAlign:h==="EARNINGS"?"left":"right"}}>{h}</div>
            ))}
          </div>
          {ck.grossBreakdown.map((r, i) => (
            <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 0.6fr 0.6fr 0.8fr",borderBottom:"1px solid #e0e0ec",background:i%2===0?"#fafafa":"#fff"}}>
              <div style={{padding:"3px 8px",fontSize:8.5,color:"#222"}}>{r.l}</div>
              <div style={{padding:"3px 8px",fontSize:8.5,textAlign:"right",fontFamily:"'Courier New',monospace",color:"#333"}}>{r.hr > 0 ? r.hr : ""}</div>
              <div style={{padding:"3px 8px",fontSize:8.5,textAlign:"right",fontFamily:"'Courier New',monospace",color:"#333"}}>{fmt(r.amt)}</div>
              <div style={{padding:"3px 8px",fontSize:8.5,textAlign:"right",fontFamily:"'Courier New',monospace",color:"#555"}}>{fmt(r.amt * (ck.ytdGross / (ck.amount || 1)))}</div>
            </div>
          ))}
          {Array.from({length: Math.max(0, 3 - ck.grossBreakdown.length)}).map((_, i) => (
            <div key={i} style={{height:22,borderBottom:"1px solid #e8e8f0",background:i%2===0?"#fafafa":"#fff"}}/>
          ))}
          <div style={{borderTop:"1.5px solid #334466",background:"#eeeef8",display:"grid",gridTemplateColumns:"2fr 0.6fr 0.6fr 0.8fr"}}>
            <div style={{padding:"4px 8px",fontWeight:700,fontSize:9,color:"#0d0d60"}}>GROSS EARNINGS:</div>
            <div style={{padding:"4px 8px",fontWeight:700,fontSize:9,textAlign:"right",fontFamily:"'Courier New',monospace",color:"#333"}}>{totalHrs > 0 ? totalHrs : ""}</div>
            <div style={{padding:"4px 8px",fontWeight:700,fontSize:9,textAlign:"right",fontFamily:"'Courier New',monospace",color:"#0d0d60"}}>{fmt(ck.amount)}</div>
            <div style={{padding:"4px 8px",fontWeight:700,fontSize:9,textAlign:"right",fontFamily:"'Courier New',monospace",color:"#555"}}>{fmt(ck.ytdGross)}</div>
          </div>
          <div style={{background:"#e4e6ff",display:"grid",gridTemplateColumns:"2fr 0.6fr 0.6fr 0.8fr",borderTop:"1px solid #9090b0"}}>
            <div style={{padding:"4px 8px",fontWeight:700,fontSize:9,color:"#006600"}}>NET EARNINGS:</div>
            <div/>
            <div style={{padding:"4px 8px",fontWeight:700,fontSize:9,textAlign:"right",fontFamily:"'Courier New',monospace",color:"#006600"}}>{fmt(taxes.net)}</div>
            <div style={{padding:"4px 8px",fontWeight:700,fontSize:9,textAlign:"right",fontFamily:"'Courier New',monospace",color:"#555"}}>{fmt(ytdTaxes.net)}</div>
          </div>
        </div>

        <div>
          <div style={{display:"grid",gridTemplateColumns:"2fr 0.8fr 0.8fr",background:"#dde0f0",borderBottom:"1px solid #9090b0"}}>
            {["DEDUCTION","AMOUNT","YTD"].map(h => (
              <div key={h} style={{padding:"3px 8px",fontWeight:700,fontSize:8,color:"#0d0d60",borderRight:"1px solid #9090b0",textAlign:h==="DEDUCTION"?"left":"right"}}>{h}</div>
            ))}
          </div>
          {[
            {l:"Federal Income Tax",curr:taxes.federal,ytd:ytdTaxes.federal},
            {l:"Social Security (OASDI)",curr:taxes.ss,ytd:ytdTaxes.ss},
            {l:"Medicare (FICA)",curr:taxes.medicare,ytd:ytdTaxes.medicare},
            {l:"AZ State Income Tax",curr:taxes.az,ytd:ytdTaxes.az},
          ].map((r, i) => (
            <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 0.8fr 0.8fr",borderBottom:"1px solid #e0e0ec",background:i%2===0?"#fafafa":"#fff"}}>
              <div style={{padding:"3px 8px",fontSize:8.5,color:"#222"}}>{r.l}</div>
              <div style={{padding:"3px 8px",fontSize:8.5,textAlign:"right",fontFamily:"'Courier New',monospace",color:"#880000"}}>({fmt(r.curr)})</div>
              <div style={{padding:"3px 8px",fontSize:8.5,textAlign:"right",fontFamily:"'Courier New',monospace",color:"#555"}}>({fmt(r.ytd)})</div>
            </div>
          ))}
          {Array.from({length: 2}).map((_, i) => (
            <div key={i} style={{height:22,borderBottom:"1px solid #e8e8f0",background:i%2===0?"#fafafa":"#fff"}}/>
          ))}
          <div style={{borderTop:"1.5px solid #334466",background:"#fff0f0",display:"grid",gridTemplateColumns:"2fr 0.8fr 0.8fr"}}>
            <div style={{padding:"4px 8px",fontWeight:700,fontSize:9,color:"#880000"}}>TOTAL DEDUCT:</div>
            <div style={{padding:"4px 8px",fontWeight:700,fontSize:9,textAlign:"right",fontFamily:"'Courier New',monospace",color:"#880000"}}>({fmt(taxes.total)})</div>
            <div style={{padding:"4px 8px",fontWeight:700,fontSize:9,textAlign:"right",fontFamily:"'Courier New',monospace",color:"#555"}}>({fmt(ytdTaxes.total)})</div>
          </div>
          <div style={{background:"#eeeef8",padding:"4px 8px",borderTop:"1px solid #9090b0",display:"flex",justifyContent:"space-between"}}>
            <div style={{fontSize:8,color:"#556"}}>Period: <strong>{pLabel}</strong></div>
            <div style={{fontSize:8,color:"#556"}}>Status: <strong>{(ck.status || "draft").toUpperCase()}</strong></div>
          </div>
        </div>
      </div>

      <div style={{padding:"4px 16px",display:"flex",justifyContent:"space-between",background:"#f4f4f8",borderTop:"1px solid #ccc"}}>
        <div style={{fontSize:7.5,color:"#aaa",fontFamily:"Arial,sans-serif"}}>RETAIN THIS PORTION FOR YOUR RECORDS · NOT NEGOTIABLE · {GL.name} · AZ ENTITY #{GL.entityNumber}</div>
        <div style={{fontSize:7.5,color:"#aaa"}}>CHECK #{ck.num} · PAY DATE: {ck.payDate}</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FULL CHECK DOC
// ══════════════════════════════════════════════════════════════════════════════
function CheckDoc({ ck, printId }) {
  return (
    <div id={printId} style={{width:816,background:"#fff",border:"1.5px solid #7090b0",boxShadow:"0 6px 32px rgba(0,0,0,0.2)"}}>
      <CheckFace ck={ck}/>
      <div style={{position:"relative",height:20,background:"#f2f2f8",borderTop:"1px solid #ccd",borderBottom:"1px solid #ccd",display:"flex",alignItems:"center"}}>
        {Array.from({length:54}).map((_,i)=>(
          <div key={i} style={{position:"absolute",left:`${1+(i/53)*98}%`,top:"50%",transform:"translateY(-50%)",width:i%5===0?6:3.5,height:i%5===0?6:3.5,background:i%5===0?"#aaaacc":"#d0d0e0",borderRadius:i%5===0?"50%":"0"}}/>
        ))}
        <div style={{position:"absolute",left:"50%",transform:"translateX(-50%)",background:"#f2f2f8",padding:"0 14px",fontSize:8,color:"#c0c0cc",letterSpacing:"0.14em",whiteSpace:"nowrap",fontFamily:"Arial,sans-serif",fontStyle:"italic"}}>
          ✦  DETACH AND RETAIN UPPER PORTION FOR YOUR RECORDS  ✦
        </div>
      </div>
      <PayStub ck={ck}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
export default function OfficialChecks() {
  const [printed, setPrinted] = useState({});
  const [filterName, setFilterName] = useState("ALL");

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["payroll-records-checks"],
    queryFn: () => base44.entities.PayrollRecord.list("-created_date", 100),
    staleTime: 0,
    refetchOnMount: "always",
  });

  // Only show approved or paid records
  const eligibleRecords = records.filter(r => r.status === "approved" || r.status === "paid");

  // Build checks from records
  const checks = useMemo(() =>
    eligibleRecords.map((rec, idx) => buildCheck(rec, idx)),
    [eligibleRecords]
  );

  // Unique payee names for filter
  const payeeNames = useMemo(() => [...new Set(checks.map(c => c.payeeName))].sort(), [checks]);

  const visibleChecks = filterName === "ALL" ? checks : checks.filter(c => c.payeeName === filterName);

  function printCheck(ck) {
    const el = document.getElementById(`chk-${ck.num}`);
    if (!el) return;
    setPrinted(p => ({ ...p, [ck.num]: true }));
    const win = window.open("", "_blank", "width=960,height=840");
    win.document.write(`<!DOCTYPE html><html><head>
<title>Check #${ck.num} · GlyphLock LLC</title>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{background:#fff;display:flex;justify-content:center;padding:.3in;}@media print{body{padding:.1in;}@page{size:8.5in 9in;margin:0;}}</style>
</head><body>${el.outerHTML}<script>window.onload=()=>{setTimeout(()=>window.print(),450);}</script></body></html>`);
    win.document.close();
  }

  function printAll() {
    const html = visibleChecks.map(ck => {
      const el = document.getElementById(`chk-${ck.num}`);
      return el ? el.outerHTML : "";
    }).join('<div style="page-break-after:always;height:.3in"></div>');
    setPrinted(visibleChecks.reduce((a, c) => ({ ...a, [c.num]: true }), {}));
    const win = window.open("", "_blank", "width=960,height=900");
    win.document.write(`<!DOCTYPE html><html><head>
<title>All Checks · GlyphLock LLC</title>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{background:#fff;padding:.2in;display:flex;flex-direction:column;gap:.3in;}@media print{body{padding:.1in;gap:0;}@page{size:8.5in 11in;margin:0;}}</style>
</head><body>${html}<script>window.onload=()=>{setTimeout(()=>window.print(),500);}</script></body></html>`);
    win.document.close();
  }

  const totalNet = visibleChecks.reduce((a, c) => a + calcTaxes(c.amount).net, 0);

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"16px 40px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:40,backdropFilter:"blur(20px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:38,height:38,background:"linear-gradient(135deg,#818cf8,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:20,color:"#fff",fontFamily:"Georgia,serif"}}>G</div>
          <div>
            <div style={{fontWeight:800,fontSize:18,letterSpacing:"-0.02em"}}>GlyphLock <span style={{color:C.accent}}>Payroll</span></div>
            <div style={{fontSize:11,color:C.muted}}>
              {isLoading ? "Loading records..." : `${visibleChecks.length} check${visibleChecks.length!==1?"s":""} · Approved & Paid records only`}
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:16,alignItems:"center"}}>
          {/* Payee filter */}
          {payeeNames.length > 1 && (
            <select
              value={filterName}
              onChange={e => setFilterName(e.target.value)}
              style={{background:C.card,border:`1px solid ${C.border}`,color:C.text,padding:"8px 12px",fontSize:12,borderRadius:6,cursor:"pointer"}}
            >
              <option value="ALL">All Entertainers</option>
              {payeeNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:10,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase"}}>Total Net</div>
            <div style={{fontFamily:"'Courier New',monospace",fontSize:20,fontWeight:900,color:C.accent}}>{fmt(totalNet)}</div>
          </div>
          {visibleChecks.length > 0 && (
            <button onClick={printAll} style={{background:"linear-gradient(135deg,#818cf8,#6366f1)",border:"none",padding:"12px 28px",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",letterSpacing:"0.02em",boxShadow:"0 4px 20px #818cf840"}}>
              🖨 PRINT ALL ({visibleChecks.length})
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{padding:"36px 40px",display:"flex",flexDirection:"column",gap:52}}>
        {isLoading && (
          <div style={{textAlign:"center",padding:"80px 0",color:C.muted,fontSize:16}}>Loading payroll records…</div>
        )}

        {!isLoading && visibleChecks.length === 0 && (
          <div style={{textAlign:"center",padding:"80px 0"}}>
            <div style={{fontSize:48,marginBottom:16}}>🧾</div>
            <div style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:8}}>No checks to display</div>
            <div style={{fontSize:13,color:C.muted,maxWidth:420,margin:"0 auto",lineHeight:1.6}}>
              Checks are generated from <strong style={{color:C.accent}}>approved</strong> or <strong style={{color:C.green}}>paid</strong> payroll records.<br/>
              Go to <strong>Payroll → Payroll Engine</strong>, generate records for the pay period, then approve them.
            </div>
          </div>
        )}

        {visibleChecks.map((ck, idx) => {
          const net = calcTaxes(ck.amount).net;
          const color = PC[idx % PC.length];
          return (
            <div key={ck.num}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:16}}>
                  <div style={{background:`${color}18`,border:`2px solid ${color}50`,padding:"6px 14px"}}>
                    <div style={{fontFamily:"'Courier New',monospace",fontWeight:700,fontSize:16,color,letterSpacing:2}}>#{ck.num}</div>
                  </div>
                  <div>
                    <div style={{fontWeight:800,fontSize:20,letterSpacing:"-0.01em"}}>{ck.payeeName}</div>
                    <div style={{fontSize:12,color:C.muted,marginTop:1}}>Venus · {ck.memoDetail}</div>
                  </div>
                  <div style={{background:C.greenDim,border:`1px solid ${C.green}30`,padding:"4px 12px"}}>
                    <div style={{fontSize:10,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase"}}>Net Pay</div>
                    <div style={{fontFamily:"'Courier New',monospace",fontSize:15,fontWeight:700,color:C.green}}>{fmt(net)}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:9,fontWeight:700,color,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:1}}>Pay Period</div>
                    <div style={{fontSize:13,fontWeight:600,color:C.text}}>{ck.startStr} – {ck.endStr}</div>
                    <div style={{fontSize:10,color:C.muted}}>Pay date: {ck.payDate}</div>
                  </div>
                  <button onClick={() => printCheck(ck)} style={{background:printed[ck.num]?C.greenDim:"linear-gradient(135deg,#818cf8,#6366f1)",border:printed[ck.num]?`1px solid ${C.green}44`:"none",padding:"11px 24px",color:printed[ck.num]?C.green:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",whiteSpace:"nowrap",letterSpacing:"0.03em"}}>
                    {printed[ck.num] ? "✓ PRINTED" : "🖨 PRINT"}
                  </button>
                </div>
              </div>

              <CheckDoc ck={ck} printId={`chk-${ck.num}`}/>
              {idx < visibleChecks.length - 1 && (
                <div style={{height:1,background:`linear-gradient(90deg,transparent,${C.border},transparent)`,marginTop:52}}/>
              )}
            </div>
          );
        })}
      </div>

      <style>{`*{box-sizing:border-box;}body{margin:0;}::-webkit-scrollbar{width:6px;}::-webkit-scrollbar-track{background:${C.bg};}::-webkit-scrollbar-thumb{background:${C.border};}*{-webkit-tap-highlight-color:transparent;}`}</style>
    </div>
  );
}