import React from 'react';

/**
 * DACO-ΩΩΩ-NUPS-PUBLIC-DEMO-001
 * Public-facing NUPS platform demo — no authentication required.
 * Renders full interactive HTML demo via srcDoc iframe.
 */

const demoHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GlyphLock NUPS — Full Platform Demo</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --p:#5B21B6;--pd:#3B0F8C;--pm:#7C3AED;--pl:#EDE9FE;--pul:#F8F6FF;
  --ind:#4338CA;--im:#6366F1;--il:#E0E7FF;
  --g1:rgba(255,255,255,0.85);--g2:rgba(255,255,255,0.60);
  --gb:rgba(91,33,182,0.12);--gb2:rgba(91,33,182,0.20);
  --gs:0 8px 32px rgba(91,33,182,0.12),0 2px 8px rgba(91,33,182,0.06);
  --txt:#0D0D14;--txt2:#3D3D52;--muted:#8888A0;
  --ok:#15803D;--okbg:#DCFCE7;--okb:#86EFAC;
  --warn:#92400E;--wbg:#FEF3C7;--wb:#FCD34D;
  --err:#991B1B;--ebg:#FEE2E2;--eb:#FCA5A5;
  --page:linear-gradient(160deg,#EDE9FE 0%,#F3F0FF 35%,#E8E4FA 60%,#E0E7FF 100%);
  --font:'Outfit',sans-serif;--display:'Syne',sans-serif;--mono:'DM Mono',monospace;
}
body{font-family:var(--font);background:var(--page);min-height:100vh;color:var(--txt);}
::selection{background:rgba(91,33,182,.2);}
::-webkit-scrollbar{width:3px;height:3px;}
::-webkit-scrollbar-thumb{background:rgba(91,33,182,.25);border-radius:3px;}
.nav{background:linear-gradient(90deg,#3B0F8C 0%,#5B21B6 45%,#4338CA 100%);padding:0 20px;display:flex;align-items:center;gap:2px;height:54px;position:sticky;top:0;z-index:200;box-shadow:0 4px 24px rgba(59,15,140,.30);}
.nav::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:rgba(255,255,255,.08);}
.nav-logo{display:flex;align-items:center;gap:8px;margin-right:14px;}
.nav-icon{width:28px;height:28px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:7px;display:flex;align-items:center;justify-content:center;}
.nav-brand{color:#fff;font-family:var(--display);font-size:14px;font-weight:700;letter-spacing:.08em;}
.nav-item{color:rgba(255,255,255,.55);font-size:11.5px;padding:6px 10px;border-radius:7px;cursor:pointer;transition:all .15s;font-weight:500;white-space:nowrap;}
.nav-item:hover{color:#fff;background:rgba(255,255,255,.10);}
.nav-item.active{color:#fff;background:rgba(255,255,255,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.12);}
.nav-sp{flex:1;}
.nav-venue{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:4px 12px;color:#fff;font-size:11px;font-weight:500;}
.nav-dot{width:8px;height:8px;border-radius:50%;background:#4ADE80;box-shadow:0 0 6px #4ADE80;margin-right:6px;display:inline-block;animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.5;}}
.nav-user{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#A78BFA,#818CF8);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;margin-left:8px;cursor:pointer;font-family:var(--display);}
.screen{display:none;padding:20px;animation:screenIn .22s cubic-bezier(.4,0,.2,1);}
.screen.active{display:block;}
@keyframes screenIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
.card{background:var(--g1);border:1px solid var(--gb);border-radius:18px;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:var(--gs);padding:20px;}
.card-dark{background:linear-gradient(135deg,#0D0818,#130E2B);border:1px solid rgba(167,139,250,.15);border-radius:18px;box-shadow:0 8px 32px rgba(0,0,0,.4);padding:20px;}
.card-sm{background:var(--g1);border:1px solid var(--gb);border-radius:12px;padding:14px;}
.card-accent{background:linear-gradient(135deg,rgba(91,33,182,.08),rgba(67,56,202,.05));border:1px solid rgba(91,33,182,.15);border-radius:14px;padding:16px;}
.sec{font-family:var(--display);font-size:10px;font-weight:700;color:var(--p);text-transform:uppercase;letter-spacing:.1em;margin-bottom:14px;display:flex;align-items:center;gap:6px;}
.sec::before{content:'';width:3px;height:10px;background:linear-gradient(180deg,var(--p),var(--ind));border-radius:2px;}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
.gpos{display:grid;grid-template-columns:1fr 360px;gap:16px;}
.metric{background:linear-gradient(135deg,rgba(91,33,182,.08),rgba(67,56,202,.05));border:1px solid rgba(91,33,182,.12);border-radius:14px;padding:16px;position:relative;overflow:hidden;}
.metric::before{content:'';position:absolute;top:-20px;right:-20px;width:60px;height:60px;border-radius:50%;background:rgba(91,33,182,.06);}
.m-lbl{font-size:10px;color:var(--muted);margin-bottom:6px;font-weight:500;text-transform:uppercase;letter-spacing:.05em;}
.m-val{font-size:22px;font-weight:700;color:var(--pd);font-family:var(--display);}
.m-sub{font-size:10px;color:var(--pm);margin-top:3px;font-weight:500;}
.m-up{color:#15803D;}
.m-dn{color:#991B1B;}
.btn{border-radius:11px;padding:11px 18px;font-size:12.5px;font-weight:600;cursor:pointer;border:none;display:inline-flex;align-items:center;gap:7px;transition:all .15s;font-family:var(--font);letter-spacing:.01em;}
.btn:active{transform:scale(.96);}
.btn-p{background:linear-gradient(135deg,#5B21B6,#4338CA);color:#fff;box-shadow:0 3px 14px rgba(91,33,182,.35);}
.btn-p:hover{box-shadow:0 5px 20px rgba(91,33,182,.45);transform:translateY(-1px);}
.btn-g{background:var(--g1);border:1px solid var(--gb2);color:var(--p);}
.btn-g:hover{background:var(--pl);}
.btn-ok{background:var(--okbg);border:1px solid var(--okb);color:var(--ok);}
.btn-err{background:var(--ebg);border:1px solid var(--eb);color:var(--err);}
.btn-warn{background:var(--wbg);border:1px solid var(--wb);color:var(--warn);}
.btn-ghost{background:transparent;border:1px solid var(--gb2);color:var(--muted);}
.btn-sm{padding:7px 13px;font-size:11px;border-radius:9px;}
.btn-xs{padding:5px 10px;font-size:10px;border-radius:7px;}
.btn-full{width:100%;justify-content:center;}
.tip-row{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:10px;}
.tip-btn{background:white;border:1.5px solid rgba(91,33,182,.15);border-radius:10px;padding:10px 6px;text-align:center;cursor:pointer;transition:all .15s;font-family:var(--font);}
.tip-btn .tip-pct{font-size:14px;font-weight:700;color:var(--pd);font-family:var(--display);}
.tip-btn .tip-amt{font-size:10px;color:var(--muted);margin-top:2px;}
.tip-btn.active{background:linear-gradient(135deg,#EDE9FE,#E0E7FF);border-color:var(--p);box-shadow:0 0 0 3px rgba(91,33,182,.1);}
.tip-btn.active .tip-pct{color:var(--p);}
.tip-custom{background:white;border:1.5px solid rgba(91,33,182,.15);border-radius:10px;padding:8px 12px;font-size:13px;font-family:var(--mono);color:var(--txt);width:100%;outline:none;}
.tip-custom:focus{border-color:var(--p);box-shadow:0 0 0 3px rgba(91,33,182,.1);}
.cart-item{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:.5px solid rgba(91,33,182,.07);}
.cart-name{flex:1;font-size:12.5px;font-weight:500;color:var(--txt);}
.cart-sub{font-size:10px;color:var(--muted);}
.qty-ctrl{display:flex;align-items:center;gap:6px;}
.qty-btn{width:26px;height:26px;border-radius:8px;background:var(--pl);border:none;color:var(--pd);cursor:pointer;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;transition:all .1s;}
.qty-btn:active{transform:scale(.88);}
.qty-num{font-size:13px;font-weight:600;min-width:22px;text-align:center;font-family:var(--mono);}
.cart-price{font-size:13px;font-weight:600;min-width:60px;text-align:right;font-family:var(--mono);}
.prod-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;}
.prod-btn{background:white;border:1px solid rgba(91,33,182,.1);border-radius:12px;padding:12px;cursor:pointer;transition:all .15s;text-align:left;}
.prod-btn:hover{border-color:var(--p);background:var(--pul);transform:translateY(-1px);}
.prod-btn:active{transform:scale(.97);}
.prod-cat{font-size:9px;font-weight:600;color:var(--pm);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;}
.prod-name{font-size:12px;font-weight:600;color:var(--txt);line-height:1.3;}
.prod-price{font-size:13px;font-weight:700;color:var(--p);margin-top:6px;font-family:var(--display);}
.totals-block{background:var(--pul);border:1px solid rgba(91,33,182,.1);border-radius:14px;padding:14px;margin-top:10px;}
.tot-row{display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:12px;}
.tot-label{color:var(--muted);font-weight:500;}
.tot-val{font-family:var(--mono);font-weight:500;color:var(--txt);}
.tot-divider{border-top:1px dashed rgba(91,33,182,.2);margin:8px 0;}
.tot-grand{display:flex;justify-content:space-between;align-items:center;padding:6px 0;}
.tot-grand-label{font-family:var(--display);font-size:16px;font-weight:700;color:var(--txt);}
.tot-grand-val{font-family:var(--display);font-size:18px;font-weight:700;color:var(--p);}
.receipt{background:linear-gradient(180deg,#100920,#0D0818);border-radius:16px;padding:20px;color:#fff;font-family:var(--mono);font-size:11px;border:1px solid rgba(167,139,250,.12);}
.r-hdr{text-align:center;padding-bottom:12px;margin-bottom:12px;border-bottom:1px dashed rgba(255,255,255,.1);}
.r-logo{width:32px;height:32px;background:linear-gradient(135deg,#7C3AED,#6366F1);border-radius:8px;margin:0 auto 8px;display:flex;align-items:center;justify-content:center;}
.r-vn{font-family:var(--display);font-size:15px;font-weight:700;letter-spacing:.05em;}
.r-sub{font-size:9px;color:rgba(255,255,255,.4);margin-top:2px;line-height:1.5;}
.r-kv{display:flex;justify-content:space-between;padding:2.5px 0;font-size:10px;}
.r-k{color:rgba(255,255,255,.45);}
.r-v{color:#fff;font-weight:500;}
.r-divider{border-top:1px dashed rgba(255,255,255,.1);margin:8px 0;}
.r-item-hdr{display:grid;grid-template-columns:1.8fr 28px 52px 52px;gap:4px;font-size:9px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.05em;padding:3px 0;}
.r-item{display:grid;grid-template-columns:1.8fr 28px 52px 52px;gap:4px;font-size:10.5px;padding:4px 0;border-bottom:.5px solid rgba(255,255,255,.04);}
.r-total{display:flex;justify-content:space-between;align-items:center;padding:6px 0;}
.r-total-lbl{font-family:var(--display);font-size:14px;font-weight:700;}
.r-total-val{font-family:var(--display);font-size:15px;font-weight:700;color:#A78BFA;}
.r-tip-line{background:rgba(167,139,250,.12);border:1px solid rgba(167,139,250,.2);border-radius:8px;padding:10px;margin:8px 0;}
.r-tip-lbl{font-size:9px;color:#C4B5FD;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;}
.r-gb-line{background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.2);border-radius:8px;padding:10px;margin:8px 0;}
.r-gb-lbl{font-size:9px;color:#818CF8;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;}
.r-card-line{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:10px;margin:8px 0;}
.r-card-lbl{font-size:9px;color:rgba(255,255,255,.4);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;}
.r-audit{font-size:8.5px;color:rgba(255,255,255,.25);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;margin-top:8px;}
.r-qr-row{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-top:10px;padding-top:10px;border-top:1px dashed rgba(255,255,255,.08);}
.r-qr-box{width:62px;height:62px;background:white;border-radius:6px;padding:3px;flex-shrink:0;}
.r-bc{margin-top:8px;}
.r-disc{font-size:8px;color:rgba(255,255,255,.18);text-align:center;margin-top:10px;padding-top:8px;border-top:1px dashed rgba(255,255,255,.06);line-height:1.5;}
.card-capture{background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.2);border-radius:12px;padding:14px;margin-bottom:12px;}
.cc-lbl{font-size:10px;color:#6366F1;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;display:flex;align-items:center;gap:6px;}
.cc-digits{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:8px;}
.cc-digit{background:white;border:1.5px solid rgba(99,102,241,.2);border-radius:9px;padding:9px 4px;text-align:center;font-size:17px;font-weight:600;color:var(--pd);font-family:var(--mono);}
.cc-digit.active{border-color:var(--p);box-shadow:0 0 0 3px rgba(91,33,182,.12);}
.cc-hint{font-size:9px;color:rgba(99,102,241,.7);}
.inp{background:white;border:1.5px solid rgba(91,33,182,.15);border-radius:11px;padding:10px 14px;font-size:13px;color:var(--txt);width:100%;outline:none;font-family:var(--font);}
.inp:focus{border-color:var(--p);box-shadow:0 0 0 3px rgba(91,33,182,.1);}
.inp-lbl{font-size:10px;color:var(--muted);margin-bottom:5px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;}
.inp-g{margin-bottom:12px;}
select.inp{appearance:none;cursor:pointer;}
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:10px;font-weight:600;}
.b-ok{background:var(--okbg);border:.5px solid var(--okb);color:var(--ok);}
.b-p{background:var(--pl);border:.5px solid rgba(91,33,182,.25);color:var(--pd);}
.b-w{background:var(--wbg);border:.5px solid var(--wb);color:var(--warn);}
.b-err{background:var(--ebg);border:.5px solid var(--eb);color:var(--err);}
.b-i{background:var(--il);border:.5px solid rgba(99,102,241,.25);color:#3730A3;}
.dot{width:5px;height:5px;border-radius:50%;display:inline-block;}
.tabs{display:flex;background:rgba(91,33,182,.07);border-radius:11px;padding:3px;gap:2px;margin-bottom:16px;}
.tab{flex:1;padding:7px 10px;border-radius:9px;border:none;font-size:11.5px;font-weight:600;cursor:pointer;transition:all .15s;background:transparent;color:var(--muted);font-family:var(--font);}
.tab.active{background:white;color:var(--p);box-shadow:0 2px 8px rgba(91,33,182,.12);}
.tbl{width:100%;border-collapse:collapse;font-size:12px;}
.tbl th{font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;padding:8px 12px;text-align:left;border-bottom:.5px solid rgba(91,33,182,.1);}
.tbl td{padding:10px 12px;border-bottom:.5px solid rgba(91,33,182,.06);color:var(--txt);}
.tbl tr:last-child td{border-bottom:none;}
.tbl tr:hover td{background:rgba(91,33,182,.025);}
.timeline{position:relative;padding-left:22px;}
.timeline::before{content:'';position:absolute;left:7px;top:6px;bottom:6px;width:1.5px;background:linear-gradient(180deg,var(--p),var(--ind),rgba(99,102,241,.1));}
.tl-item{position:relative;margin-bottom:16px;}
.tl-dot{position:absolute;left:-18px;top:3px;width:12px;height:12px;border-radius:50%;border:2px solid var(--p);background:white;}
.tl-dot.done{background:var(--p);border-color:var(--p);}
.tl-dot.alert{background:var(--err);border-color:var(--err);box-shadow:0 0 6px rgba(153,27,27,.4);}
.tl-lbl{font-size:12px;font-weight:500;color:var(--txt);}
.tl-time{font-size:10px;color:var(--muted);margin-top:2px;}
.prog-bar{background:rgba(91,33,182,.1);border-radius:4px;height:5px;}
.prog-fill{background:linear-gradient(90deg,var(--p),var(--ind));border-radius:4px;height:5px;transition:width .4s cubic-bezier(.4,0,.2,1);}
.clock-card{background:white;border:1px solid rgba(91,33,182,.1);border-radius:13px;padding:14px;display:flex;align-items:center;gap:12px;margin-bottom:8px;transition:all .15s;}
.clock-card:hover{border-color:rgba(91,33,182,.25);box-shadow:0 2px 12px rgba(91,33,182,.08);}
.clock-avatar{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--pl),var(--il));display:flex;align-items:center;justify-content:center;font-family:var(--display);font-size:13px;font-weight:700;color:var(--pd);flex-shrink:0;}
.clock-info{flex:1;}
.clock-name{font-size:13px;font-weight:600;color:var(--txt);}
.clock-status{font-size:10px;color:var(--muted);margin-top:2px;}
.clock-time{font-family:var(--mono);font-size:13px;font-weight:500;color:var(--p);}
.room-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;}
.room-card{background:white;border:1.5px solid rgba(91,33,182,.1);border-radius:14px;padding:16px;cursor:pointer;transition:all .15s;text-align:center;}
.room-card:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(91,33,182,.12);}
.room-num{font-family:var(--display);font-size:20px;font-weight:700;color:var(--pd);}
.room-card.busy{background:linear-gradient(135deg,#FFFBEB,#FEF3C7);border-color:var(--wb);}
.room-card.busy .room-num{color:var(--warn);}
.room-card.flagged{background:linear-gradient(135deg,#FEF2F2,#FEE2E2);border-color:var(--eb);}
.room-card.flagged .room-num{color:var(--err);}
.room-card.free{background:linear-gradient(135deg,#F0FDF4,#DCFCE7);border-color:var(--okb);}
.room-card.free .room-num{color:var(--ok);}
.scan-box{background:rgba(91,33,182,.04);border:2px dashed rgba(91,33,182,.25);border-radius:14px;padding:28px;text-align:center;cursor:pointer;transition:all .2s;}
.scan-box:hover{border-color:var(--p);background:rgba(91,33,182,.07);}
.alert-item{background:white;border-radius:12px;padding:14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;border-left:4px solid;}
.alert-item.crit{border-color:var(--err);}
.alert-item.warn{border-color:#F59E0B;}
.alert-item.info{border-color:var(--p);}
.alert-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;}
.inv-item{background:white;border:1px solid rgba(91,33,182,.08);border-radius:12px;padding:14px;display:flex;align-items:center;gap:12px;margin-bottom:6px;}
.inv-bar-wrap{flex:1;}
.inv-bar{height:4px;border-radius:2px;background:rgba(91,33,182,.08);margin-top:6px;overflow:hidden;}
.inv-fill{height:4px;border-radius:2px;}
.q-card{background:white;border:1px solid rgba(91,33,182,.1);border-radius:12px;padding:16px;margin-bottom:8px;}
.q-num{font-size:10px;font-weight:700;color:var(--pm);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;}
.q-text{font-size:13px;font-weight:500;color:var(--txt);margin-bottom:12px;}
.yn{display:flex;gap:8px;}
.yn-btn{flex:1;padding:9px;border-radius:9px;border:1.5px solid rgba(91,33,182,.15);background:white;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);transition:all .15s;}
.yn-y{color:var(--ok);}
.yn-y.sel{background:var(--okbg);border-color:var(--okb);}
.yn-n{color:var(--err);}
.yn-n.sel{background:var(--ebg);border-color:var(--eb);}
.lookup-result{background:white;border:1px solid rgba(91,33,182,.09);border-radius:12px;padding:14px;margin-bottom:6px;display:flex;align-items:center;gap:12px;}
.lr-icon{width:34px;height:34px;border-radius:9px;background:var(--pl);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;}
.contract-scroll{background:#F9F8FF;border:1px solid rgba(91,33,182,.1);border-radius:12px;padding:16px;font-size:10.5px;line-height:1.8;color:var(--txt2);max-height:240px;overflow-y:auto;margin-bottom:12px;font-family:var(--mono);}
@media(max-width:900px){.gpos,.g2{grid-template-columns:1fr;}.g4{grid-template-columns:1fr 1fr;}}
</style>
</head>
<body>
<nav class="nav">
  <div class="nav-logo">
    <div class="nav-icon">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1.5" fill="white"/><rect x="9" y="2" width="5" height="5" rx="1.5" fill="rgba(255,255,255,.5)"/><rect x="2" y="9" width="5" height="5" rx="1.5" fill="rgba(255,255,255,.5)"/><rect x="9" y="9" width="5" height="5" rx="1.5" fill="white"/></svg>
    </div>
    <span class="nav-brand">NUPS</span>
  </div>
  <span class="nav-item active" onclick="show(this,'dashboard')">Dashboard</span>
  <span class="nav-item" onclick="show(this,'pos')">POS</span>
  <span class="nav-item" onclick="show(this,'glyphbucks')">GlyphBucks</span>
  <span class="nav-item" onclick="show(this,'contracts')">Contracts</span>
  <span class="nav-item" onclick="show(this,'entertainers')">Entertainers</span>
  <span class="nav-item" onclick="show(this,'vip')">VIP Rooms</span>
  <span class="nav-item" onclick="show(this,'inventory')">Inventory</span>
  <span class="nav-item" onclick="show(this,'lookup')">Lookup</span>
  <span class="nav-item" onclick="show(this,'fraud')">Fraud</span>
  <span class="nav-item" onclick="show(this,'reports')">Reports</span>
  <span class="nav-sp"></span>
  <span class="nav-dot"></span>
  <span class="nav-venue">Dream Palace</span>
  <span class="nav-user">MR</span>
</nav>
<div id="s-dashboard" class="screen active">
  <div class="g4" style="margin-bottom:16px;">
    <div class="metric"><div class="m-lbl">Today's Revenue</div><div class="m-val">$12,480</div><div class="m-sub m-up">↑ 18% vs yesterday</div></div>
    <div class="metric"><div class="m-lbl">GlyphBucks Issued</div><div class="m-val">$8,250</div><div class="m-sub">34 transactions</div></div>
    <div class="metric"><div class="m-lbl">Entertainers Active</div><div class="m-val">12</div><div class="m-sub">3 in VIP rooms</div></div>
    <div class="metric"><div class="m-lbl">VIP Rooms Active</div><div class="m-val">3 / 5</div><div class="m-sub">2 available now</div></div>
  </div>
  <div class="g2">
    <div class="card">
      <div class="sec">Live Activity</div>
      <div class="timeline">
        <div class="tl-item"><div class="tl-dot done"></div><div class="tl-lbl">TXN-5646 — $5,646.24 processed · Group of 6</div><div class="tl-time">2 min ago · Cashier Marco Reyes · Card ●●●● 488219</div></div>
        <div class="tl-item"><div class="tl-dot done"></div><div class="tl-lbl">GB-5K redeemed — Luna · VIP Room 1 · $5,000</div><div class="tl-time">6 min ago · Audit logged</div></div>
        <div class="tl-item"><div class="tl-dot alert"></div><div class="tl-lbl">VIP Session Flagged — Room 3 · 3rd party entered</div><div class="tl-time">12 min ago · Manager alerted automatically</div></div>
        <div class="tl-item"><div class="tl-dot done"></div><div class="tl-lbl">Crystal clocked in — VIP status · Room 2</div><div class="tl-time">20 min ago · Questionnaire pending</div></div>
        <div class="tl-item"><div class="tl-dot done"></div><div class="tl-lbl">VIP Contract signed — James Mitchell · Room 3</div><div class="tl-time">26 min ago · UUID: VIP-20260322-003</div></div>
        <div class="tl-item"><div class="tl-dot done"></div><div class="tl-lbl">Luna onboarded — Contract signed · Biometrics captured</div><div class="tl-time">38 min ago · ENT-20260322-001</div></div>
      </div>
    </div>
    <div>
      <div class="card" style="margin-bottom:14px;">
        <div class="sec">Revenue Split</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span style="color:var(--muted);font-weight:500;">GlyphBucks Sales</span><span style="font-weight:700;color:var(--p);font-family:var(--mono);">$8,250</span></div><div class="prog-bar"><div class="prog-fill" style="width:66%;"></div></div></div>
          <div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span style="color:var(--muted);font-weight:500;">Door Entry</span><span style="font-weight:700;color:var(--p);font-family:var(--mono);">$2,400</span></div><div class="prog-bar"><div class="prog-fill" style="width:19%;"></div></div></div>
          <div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span style="color:var(--muted);font-weight:500;">NA Beverages</span><span style="font-weight:700;color:var(--p);font-family:var(--mono);">$960</span></div><div class="prog-bar"><div class="prog-fill" style="width:8%;"></div></div></div>
          <div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span style="color:var(--muted);font-weight:500;">VIP Room</span><span style="font-weight:700;color:var(--p);font-family:var(--mono);">$870</span></div><div class="prog-bar"><div class="prog-fill" style="width:7%;"></div></div></div>
        </div>
      </div>
      <div class="card">
        <div class="sec">Quick Actions</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button class="btn btn-p btn-full" onclick="navTo('pos')">New Transaction</button>
          <button class="btn btn-g btn-full" onclick="navTo('entertainers')">Clock In</button>
          <button class="btn btn-g btn-full" onclick="navTo('vip')">Book VIP</button>
          <button class="btn btn-g btn-full" onclick="navTo('lookup')">Lookup</button>
        </div>
      </div>
    </div>
  </div>
</div>
<div id="s-pos" class="screen">
  <div class="gpos">
    <div>
      <div class="card" style="margin-bottom:14px;">
        <div class="sec">Customer</div>
        <input class="inp" value="James Mitchell — AZ-1234567 — Group of 6" style="margin-bottom:0;">
      </div>
      <div class="card" style="margin-bottom:14px;">
        <div class="sec">Add Items</div>
        <div class="prod-grid">
          <div class="prod-btn" onclick="add('door',20)"><div class="prod-cat">Entry</div><div class="prod-name">Door Entry</div><div class="prod-price">$20</div></div>
          <div class="prod-btn" onclick="add('gb5k',5000)"><div class="prod-cat">GlyphBucks</div><div class="prod-name">Stage — $5K Bill</div><div class="prod-price">$5,000</div></div>
          <div class="prod-btn" onclick="add('coke',8)"><div class="prod-cat">Beverage</div><div class="prod-name">Coca-Cola</div><div class="prod-price">$8</div></div>
          <div class="prod-btn" onclick="add('nabeer',10)"><div class="prod-cat">Beverage</div><div class="prod-name">NA Beer</div><div class="prod-price">$10</div></div>
          <div class="prod-btn" onclick="add('bottle',250)"><div class="prod-cat">Service</div><div class="prod-name">Bottle Service</div><div class="prod-price">$250</div></div>
          <div class="prod-btn" onclick="add('viproom',300)"><div class="prod-cat">VIP</div><div class="prod-name">VIP Room 1hr</div><div class="prod-price">$300</div></div>
          <div class="prod-btn" onclick="add('hookah',75)"><div class="prod-cat">Service</div><div class="prod-name">Hookah 1hr</div><div class="prod-price">$75</div></div>
          <div class="prod-btn" onclick="add('show',150)"><div class="prod-cat">Entertainment</div><div class="prod-name">Private Show</div><div class="prod-price">$150</div></div>
          <div class="prod-btn" onclick="add('redbull',10)"><div class="prod-cat">Beverage</div><div class="prod-name">Red Bull</div><div class="prod-price">$10</div></div>
        </div>
        <div id="cart-wrap">
          <div class="sec" style="margin-bottom:10px;">Order Items</div>
          <div id="cart"></div>
        </div>
      </div>
      <div class="card" style="margin-bottom:14px;">
        <div class="sec">Gratuity / Tip</div>
        <div class="tip-row" id="tip-row">
          <div class="tip-btn" onclick="setTip(0,this)"><div class="tip-pct">0%</div><div class="tip-amt" id="t0">$0.00</div></div>
          <div class="tip-btn" onclick="setTip(15,this)"><div class="tip-pct">15%</div><div class="tip-amt" id="t15">$0.00</div></div>
          <div class="tip-btn active" onclick="setTip(18,this)"><div class="tip-pct">18%</div><div class="tip-amt" id="t18">$0.00</div></div>
          <div class="tip-btn" onclick="setTip(20,this)"><div class="tip-pct">20%</div><div class="tip-amt" id="t20">$0.00</div></div>
          <div class="tip-btn" onclick="setTip(25,this)"><div class="tip-pct">25%</div><div class="tip-amt" id="t25">$0.00</div></div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:11px;color:var(--muted);font-weight:500;">Custom:</span>
          <input class="tip-custom" style="flex:1;" placeholder="Enter custom amount..." oninput="setCustomTip(this.value)" id="custom-tip">
        </div>
      </div>
      <div class="card">
        <div class="totals-block">
          <div class="tot-row"><span class="tot-label">Subtotal</span><span class="tot-val" id="p-sub">$0.00</span></div>
          <div class="tot-row"><span class="tot-label">Tax (AZ 8%)</span><span class="tot-val" id="p-tax">$0.00</span></div>
          <div class="tot-row" style="color:var(--pm);"><span class="tot-label" style="color:var(--pm);font-weight:600;">Gratuity</span><span class="tot-val" style="color:var(--pm);font-weight:600;" id="p-tip">$0.00</span></div>
          <div class="tot-divider"></div>
          <div class="tot-grand"><span class="tot-grand-label">TOTAL DUE</span><span class="tot-grand-val" id="p-total">$0.00</span></div>
        </div>
        <div class="card-capture" style="margin-top:12px;">
          <div class="cc-lbl">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="8" rx="2" stroke="#6366F1" stroke-width="1.5"/><line x1="1" y1="6" x2="13" y2="6" stroke="#6366F1" stroke-width="1.5"/></svg>
            Card Last 6 — Chargeback Protection
          </div>
          <div class="cc-digits">
            <div class="cc-digit">4</div><div class="cc-digit">8</div><div class="cc-digit">8</div><div class="cc-digit">2</div><div class="cc-digit">1</div><div class="cc-digit active">9</div>
          </div>
          <div class="cc-hint">Cashier enters last 6 digits — stored to transaction for chargeback defense</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:4px;">
          <button class="btn btn-p btn-full" onclick="processPayment()">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="8" rx="2" stroke="white" stroke-width="1.5"/><line x1="1" y1="6" x2="13" y2="6" stroke="white" stroke-width="1.5"/><line x1="3" y1="9" x2="6" y2="9" stroke="white" stroke-width="1.5"/></svg>
            Process Payment
          </button>
          <button class="btn btn-err">Void</button>
        </div>
      </div>
    </div>
    <div>
      <div class="card-dark">
        <div class="r-hdr">
          <div class="r-logo"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1.5" fill="white"/><rect x="9" y="2" width="5" height="5" rx="1.5" fill="rgba(255,255,255,.5)"/><rect x="2" y="9" width="5" height="5" rx="1.5" fill="rgba(255,255,255,.5)"/><rect x="9" y="9" width="5" height="5" rx="1.5" fill="white"/></svg></div>
          <div class="r-vn">Dream Palace</div>
          <div class="r-sub">N.U.P.S. — Nexus Unified Point-of-Sale<br>815 N. Scottsdale Rd, Tempe AZ 85281<br>Tel: (480) 921-8870</div>
        </div>
        <div class="r-kv"><span class="r-k">Receipt:</span><span class="r-v" id="r-txn" style="font-family:var(--mono);">TXN-pending</span></div>
        <div class="r-kv"><span class="r-k">Date / Time:</span><span class="r-v">3/22/2026 · 12:30 AM</span></div>
        <div class="r-kv"><span class="r-k">Cashier:</span><span class="r-v">Marco Reyes</span></div>
        <div class="r-kv"><span class="r-k">Customer:</span><span class="r-v">James Mitchell</span></div>
        <div class="r-kv"><span class="r-k">Party:</span><span class="r-v">Group of 6</span></div>
        <div class="r-divider"></div>
        <div class="r-item-hdr"><span>Item</span><span>Qty</span><span>Price</span><span style="text-align:right;">Total</span></div>
        <div id="r-items"><div style="font-size:10px;color:rgba(255,255,255,.25);padding:8px 0;text-align:center;">Items will appear here</div></div>
        <div class="r-divider"></div>
        <div class="r-kv"><span class="r-k">Subtotal</span><span class="r-v" id="r-sub">$0.00</span></div>
        <div class="r-kv"><span class="r-k">Tax (AZ 8%)</span><span class="r-v" id="r-tax">$0.00</span></div>
        <div class="r-kv" style="color:rgba(167,139,250,1);"><span style="color:#C4B5FD;font-weight:600;">Gratuity</span><span style="color:#C4B5FD;font-weight:600;font-family:var(--mono);" id="r-tip">$0.00</span></div>
        <div class="r-divider"></div>
        <div class="r-total"><span class="r-total-lbl">TOTAL</span><span class="r-total-val" id="r-total">$0.00</span></div>
        <div class="r-kv"><span class="r-k">Payment</span><span style="color:#818CF8;font-weight:600;">Credit Card</span></div>
        <div class="r-kv"><span class="r-k">Card (last 6)</span><span style="color:#818CF8;font-family:var(--mono);">●●●● 488 219</span></div>
        <div class="r-kv"><span class="r-k">Approval</span><span class="r-v">AUTH-9X7K2M</span></div>
        <div class="r-tip-line" id="r-tip-block" style="display:none;">
          <div class="r-tip-lbl">Gratuity Line</div>
          <div class="r-kv"><span class="r-k">Tip %</span><span style="color:#C4B5FD;font-weight:600;" id="r-tip-pct">18%</span></div>
          <div class="r-kv"><span class="r-k">Tip Amount</span><span style="color:#C4B5FD;font-weight:600;font-family:var(--mono);" id="r-tip-amt2">$0.00</span></div>
          <div class="r-kv"><span class="r-k">Customer Initials</span><span class="r-v">___________</span></div>
        </div>
        <div class="r-gb-line" id="r-gb" style="display:none;">
          <div class="r-gb-lbl">GlyphBucks Issued</div>
          <div id="r-gb-items"></div>
          <div style="display:flex;justify-content:space-between;border-top:1px solid rgba(99,102,241,.18);margin-top:5px;padding-top:5px;font-size:11px;"><span style="color:rgba(255,255,255,.4);">Total GlyphBucks</span><span style="color:#818CF8;font-weight:600;font-family:var(--mono);" id="r-gb-tot">$0.00</span></div>
        </div>
        <div class="r-card-line">
          <div class="r-card-lbl">Chargeback Protection Record</div>
          <div class="r-kv"><span class="r-k">Cardholder</span><span class="r-v">James Mitchell</span></div>
          <div class="r-kv"><span class="r-k">Card digits</span><span style="color:rgba(255,255,255,.8);font-family:var(--mono);">●●●● 488 219</span></div>
          <div class="r-kv"><span class="r-k">GlyphBucks Agmt</span><span style="color:#4ADE80;font-weight:600;">Signed</span></div>
        </div>
        <div class="r-audit">Audit Trail</div>
        <div class="r-kv" style="font-size:9.5px;"><span class="r-k">UUID:</span><span style="color:rgba(255,255,255,.45);font-family:var(--mono);" id="r-uuid">TXN-pending</span></div>
        <div class="r-kv" style="font-size:9.5px;"><span class="r-k">Staff ID:</span><span style="color:rgba(255,255,255,.35);">USR-MR-0042 · dream-palace</span></div>
        <div class="r-qr-row">
          <div style="flex:1;"><div style="font-size:8px;color:rgba(255,255,255,.3);margin-bottom:3px;">Scan to verify · Ambir DB100</div><div style="font-size:8px;color:rgba(255,255,255,.35);font-family:var(--mono);word-break:break-all;" id="r-qr-val">TXN-pending</div></div>
          <div class="r-qr-box"><svg viewBox="0 0 21 21" width="56" height="56" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect width="21" height="21" fill="white"/><g fill="black"><rect x="0" y="0" width="7" height="7"/><rect x="1" y="1" width="5" height="5" fill="white"/><rect x="2" y="2" width="3" height="3"/><rect x="14" y="0" width="7" height="7"/><rect x="15" y="1" width="5" height="5" fill="white"/><rect x="16" y="2" width="3" height="3"/><rect x="0" y="14" width="7" height="7"/><rect x="1" y="15" width="5" height="5" fill="white"/><rect x="2" y="16" width="3" height="3"/><rect x="9" y="0" width="1" height="1"/><rect x="11" y="0" width="1" height="1"/><rect x="8" y="1" width="1" height="1"/><rect x="10" y="1" width="1" height="1"/><rect x="12" y="1" width="1" height="1"/><rect x="9" y="2" width="1" height="1"/><rect x="11" y="2" width="1" height="1"/><rect x="8" y="3" width="3" height="1"/><rect x="12" y="3" width="1" height="1"/><rect x="9" y="4" width="1" height="1"/><rect x="11" y="4" width="2" height="1"/><rect x="0" y="8" width="1" height="1"/><rect x="2" y="8" width="2" height="1"/><rect x="6" y="8" width="2" height="1"/><rect x="9" y="8" width="1" height="1"/><rect x="12" y="8" width="2" height="1"/><rect x="15" y="8" width="1" height="1"/><rect x="17" y="8" width="1" height="1"/><rect x="0" y="10" width="2" height="1"/><rect x="3" y="10" width="2" height="1"/><rect x="8" y="10" width="2" height="1"/><rect x="11" y="10" width="1" height="1"/><rect x="16" y="10" width="2" height="1"/><rect x="1" y="11" width="2" height="1"/><rect x="5" y="11" width="2" height="1"/><rect x="9" y="11" width="2" height="1"/><rect x="12" y="11" width="3" height="1"/><rect x="17" y="11" width="2" height="1"/><rect x="9" y="14" width="1" height="1"/><rect x="11" y="14" width="3" height="1"/><rect x="9" y="16" width="3" height="1"/><rect x="13" y="16" width="2" height="1"/><rect x="9" y="18" width="2" height="1"/><rect x="12" y="18" width="3" height="1"/><rect x="17" y="18" width="2" height="1"/><rect x="9" y="20" width="1" height="1"/><rect x="11" y="20" width="2" height="1"/><rect x="14" y="20" width="2" height="1"/><rect x="17" y="20" width="2" height="1"/></g></svg></div>
        </div>
        <div class="r-bc" style="text-align:center;">
          <svg viewBox="0 0 200 28" width="100%" height="28" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect width="200" height="28" fill="white" rx="3"/><g fill="#5B21B6"><rect x="4" y="2" width="2" height="20"/><rect x="8" y="2" width="1" height="20"/><rect x="11" y="2" width="3" height="20"/><rect x="16" y="2" width="1" height="20"/><rect x="19" y="2" width="2" height="20"/><rect x="23" y="2" width="1" height="20"/><rect x="26" y="2" width="3" height="20"/><rect x="31" y="2" width="1" height="20"/><rect x="34" y="2" width="2" height="20"/><rect x="38" y="2" width="1" height="20"/><rect x="41" y="2" width="3" height="20"/><rect x="46" y="2" width="2" height="20"/><rect x="50" y="2" width="1" height="20"/><rect x="53" y="2" width="2" height="20"/><rect x="57" y="2" width="3" height="20"/><rect x="62" y="2" width="1" height="20"/><rect x="65" y="2" width="2" height="20"/><rect x="69" y="2" width="1" height="20"/><rect x="72" y="2" width="3" height="20"/><rect x="77" y="2" width="2" height="20"/><rect x="81" y="2" width="1" height="20"/><rect x="84" y="2" width="2" height="20"/><rect x="88" y="2" width="1" height="20"/><rect x="91" y="2" width="3" height="20"/><rect x="96" y="2" width="2" height="20"/><rect x="100" y="2" width="1" height="20"/><rect x="103" y="2" width="2" height="20"/><rect x="107" y="2" width="3" height="20"/><rect x="112" y="2" width="1" height="20"/><rect x="115" y="2" width="2" height="20"/><rect x="119" y="2" width="1" height="20"/><rect x="122" y="2" width="3" height="20"/><rect x="127" y="2" width="2" height="20"/><rect x="131" y="2" width="1" height="20"/><rect x="134" y="2" width="2" height="20"/><rect x="138" y="2" width="3" height="20"/><rect x="143" y="2" width="1" height="20"/><rect x="146" y="2" width="2" height="20"/><rect x="150" y="2" width="1" height="20"/><rect x="153" y="2" width="2" height="20"/><rect x="157" y="2" width="3" height="20"/><rect x="162" y="2" width="1" height="20"/><rect x="165" y="2" width="2" height="20"/><rect x="169" y="2" width="1" height="20"/><rect x="172" y="2" width="3" height="20"/><rect x="177" y="2" width="2" height="20"/><rect x="181" y="2" width="1" height="20"/><rect x="184" y="2" width="2" height="20"/><rect x="188" y="2" width="2" height="20"/><rect x="193" y="2" width="2" height="20"/></g><text x="100" y="27" font-size="5" text-anchor="middle" fill="#5B21B6" font-family="monospace" id="r-bc-txt">TXN-pending</text></svg>
        </div>
        <div class="r-disc">GlyphLock LLC — Technology Platform Only · Not the venue operator or merchant of record · AZ Entity #23831258</div>
      </div>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button class="btn btn-p btn-sm">Print Receipt</button>
        <button class="btn btn-g btn-sm">Save PDF</button>
        <button class="btn btn-ok btn-sm">Sign Contract</button>
      </div>
    </div>
  </div>
</div>
<div id="s-glyphbucks" class="screen">
  <div class="tabs"><button class="tab active" onclick="gbT(this,'gbi')">Issue</button><button class="tab" onclick="gbT(this,'gbr')">Redeem</button><button class="tab" onclick="gbT(this,'gbh')">History</button><button class="tab" onclick="gbT(this,'gbn')">Inventory</button></div>
  <div id="gbi"><div class="g2"><div class="card"><div class="sec">Issue GlyphBucks</div><div class="inp-g"><div class="inp-lbl">Customer</div><input class="inp" value="James Mitchell — AZ-1234567"></div><div class="inp-g"><div class="inp-lbl">Amount</div><input class="inp" value="$5,000.00"></div><div class="inp-g"><div class="inp-lbl">Denomination</div><select class="inp"><option>$5,000 × 1 bill</option><option>$1,000 × 5 bills</option><option>$500 × 10 bills</option><option>$100 × 50 bills</option></select></div><button class="btn btn-p btn-full">Generate GlyphBucks</button></div><div class="card"><div class="sec">Generated Bill</div><div style="background:linear-gradient(135deg,#EDE9FE,#E0E7FF);border:1px solid rgba(91,33,182,.2);border-radius:14px;padding:18px;margin-bottom:12px;"><div style="display:flex;justify-content:space-between;align-items:flex-start;"><div><div style="font-size:9px;font-weight:700;color:var(--pm);text-transform:uppercase;letter-spacing:.07em;">GlyphBucks — Dream Palace</div><div style="font-family:var(--mono);font-size:11.5px;color:var(--pd);margin-top:6px;">GB-5K-20260322-STG001</div><div style="font-size:10px;color:var(--muted);margin-top:2px;">Issued 3/22/2026 · 12:30 AM</div></div><div style="font-family:var(--display);font-size:26px;font-weight:700;color:var(--p);">$5,000</div></div><div style="margin-top:12px;"><svg viewBox="0 0 180 24" width="100%" height="24" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect width="180" height="24" fill="white" rx="4"/><g fill="#5B21B6"><rect x="4" y="2" width="2" height="18"/><rect x="8" y="2" width="1" height="18"/><rect x="11" y="2" width="3" height="18"/><rect x="16" y="2" width="1" height="18"/><rect x="19" y="2" width="2" height="18"/><rect x="23" y="2" width="1" height="18"/><rect x="26" y="2" width="3" height="18"/><rect x="31" y="2" width="1" height="18"/><rect x="34" y="2" width="2" height="18"/><rect x="38" y="2" width="1" height="18"/><rect x="41" y="2" width="3" height="18"/><rect x="46" y="2" width="2" height="18"/><rect x="50" y="2" width="1" height="18"/><rect x="53" y="2" width="2" height="18"/><rect x="57" y="2" width="3" height="18"/><rect x="62" y="2" width="1" height="18"/><rect x="65" y="2" width="2" height="18"/><rect x="69" y="2" width="1" height="18"/><rect x="72" y="2" width="3" height="18"/><rect x="77" y="2" width="2" height="18"/><rect x="81" y="2" width="1" height="18"/><rect x="84" y="2" width="2" height="18"/><rect x="88" y="2" width="1" height="18"/><rect x="91" y="2" width="3" height="18"/><rect x="96" y="2" width="2" height="18"/><rect x="100" y="2" width="1" height="18"/><rect x="103" y="2" width="2" height="18"/><rect x="107" y="2" width="3" height="18"/><rect x="112" y="2" width="1" height="18"/><rect x="115" y="2" width="2" height="18"/><rect x="119" y="2" width="1" height="18"/><rect x="122" y="2" width="3" height="18"/><rect x="127" y="2" width="2" height="18"/><rect x="131" y="2" width="1" height="18"/><rect x="134" y="2" width="2" height="18"/><rect x="138" y="2" width="3" height="18"/><rect x="143" y="2" width="1" height="18"/><rect x="146" y="2" width="2" height="18"/><rect x="150" y="2" width="1" height="18"/><rect x="153" y="2" width="2" height="18"/><rect x="157" y="2" width="2" height="18"/><rect x="162" y="2" width="1" height="18"/><rect x="165" y="2" width="2" height="18"/><rect x="169" y="2" width="2" height="18"/><rect x="173" y="2" width="2" height="18"/></g></svg></div></div><div style="display:flex;gap:8px;"><button class="btn btn-p btn-sm btn-full">Print Bill</button><button class="btn btn-g btn-sm btn-full">View QR</button></div></div></div></div>
  <div id="gbr" style="display:none;"><div class="card"><div class="sec">Scan for Redemption</div><div class="scan-box" onclick="document.getElementById('scan-res').style.display='block'"><div style="font-size:32px;margin-bottom:8px;opacity:.4;">⬡</div><div style="font-size:13px;font-weight:600;color:var(--p);">Tap or scan — Ambir DB100</div><div style="font-size:11px;color:var(--muted);margin-top:4px;">QR code · Barcode · Manual entry</div></div><div style="display:flex;gap:8px;margin-top:12px;"><input class="inp" style="flex:1;" placeholder="Manual serial entry..."><button class="btn btn-p">Validate</button></div><div id="scan-res" style="display:none;margin-top:14px;background:var(--okbg);border:1px solid var(--okb);border-radius:12px;padding:16px;"><div style="display:flex;justify-content:space-between;align-items:center;"><div><div style="font-size:13px;font-weight:700;color:var(--ok);">Valid GlyphBucks Bill</div><div style="font-family:var(--mono);font-size:11px;color:var(--muted);margin-top:2px;">GB-5K-20260322-STG001</div></div><div style="font-family:var(--display);font-size:22px;font-weight:700;color:var(--ok);">$5,000</div></div><div style="display:flex;gap:8px;margin-top:12px;"><button class="btn btn-ok btn-full">Confirm Redemption</button><button class="btn btn-err btn-sm">Void</button></div></div></div></div>
  <div id="gbh" style="display:none;"><div class="card"><div class="sec">Transaction History</div><table class="tbl"><thead><tr><th>Serial</th><th>Amount</th><th>Customer</th><th>Time</th><th>Status</th></tr></thead><tbody><tr><td style="font-family:var(--mono);font-size:10px;">GB-5K-20260322-STG001</td><td style="font-weight:700;">$5,000</td><td>James Mitchell</td><td>12:30 AM</td><td><span class="badge b-p">Issued</span></td></tr><tr><td style="font-family:var(--mono);font-size:10px;">GB-001-20260322-JM01</td><td style="font-weight:700;">$100</td><td>James Mitchell</td><td>11:45 PM</td><td><span class="badge b-ok">Redeemed</span></td></tr><tr><td style="font-family:var(--mono);font-size:10px;">GB-002-20260322-SC01</td><td style="font-weight:700;">$200</td><td>Sarah Coleman</td><td>11:20 PM</td><td><span class="badge b-ok">Redeemed</span></td></tr><tr><td style="font-family:var(--mono);font-size:10px;">GB-003-20260322-MW01</td><td style="font-weight:700;">$500</td><td>Marcus Webb</td><td>10:55 PM</td><td><span class="badge b-err">Voided</span></td></tr></tbody></table></div></div>
  <div id="gbn" style="display:none;"><div class="g4" style="margin-bottom:16px;"><div class="metric"><div class="m-lbl">Issued Today</div><div class="m-val">$8,250</div></div><div class="metric"><div class="m-lbl">Redeemed</div><div class="m-val">$3,100</div></div><div class="metric"><div class="m-lbl">Outstanding</div><div class="m-val">$5,150</div></div><div class="metric"><div class="m-lbl">Voided</div><div class="m-val m-dn">$500</div></div></div></div>
</div>
<div id="s-contracts" class="screen">
  <div class="tabs"><button class="tab active" onclick="cT(this,'ce')">Entertainer</button><button class="tab" onclick="cT(this,'cv')">VIP Room</button><button class="tab" onclick="cT(this,'cg')">GlyphBucks</button><button class="tab" onclick="cT(this,'ca')">Archive</button></div>
  <div id="ce"><div class="g2"><div class="card"><div class="sec">Entertainer Intake</div><div class="inp-g"><div class="inp-lbl">Legal Name</div><input class="inp" placeholder="Full legal name..."></div><div class="inp-g"><div class="inp-lbl">Stage Name</div><input class="inp" placeholder="Stage name..."></div><div class="inp-g"><div class="inp-lbl">Government ID</div><input class="inp" placeholder="License or State ID..."></div><div class="inp-g"><div class="inp-lbl">Date of Birth (18+ required)</div><input class="inp" type="date"></div><div class="g2" style="margin-bottom:12px;gap:8px;"><div style="background:var(--pl);border-radius:12px;padding:14px;text-align:center;cursor:pointer;border:1px solid rgba(91,33,182,.15);"><div style="font-size:22px;margin-bottom:4px;">📷</div><div style="font-size:11px;font-weight:600;color:var(--pd);">Photo Capture</div></div><div style="background:var(--pl);border-radius:12px;padding:14px;text-align:center;cursor:pointer;border:1px solid rgba(91,33,182,.15);"><div style="font-size:22px;margin-bottom:4px;">👆</div><div style="font-size:11px;font-weight:600;color:var(--pd);">Thumbprint</div></div><div style="background:var(--pl);border-radius:12px;padding:14px;text-align:center;cursor:pointer;border:1px solid rgba(91,33,182,.15);"><div style="font-size:22px;margin-bottom:4px;">🪪</div><div style="font-size:11px;font-weight:600;color:var(--pd);">ID Front</div></div><div style="background:var(--pl);border-radius:12px;padding:14px;text-align:center;cursor:pointer;border:1px solid rgba(91,33,182,.15);"><div style="font-size:22px;margin-bottom:4px;">🪪</div><div style="font-size:11px;font-weight:600;color:var(--pd);">ID Back</div></div></div><button class="btn btn-p btn-full">Generate &amp; Sign Contract</button></div><div class="card"><div class="sec">Contract Preview</div><div class="contract-scroll"><strong>INDEPENDENT ENTERTAINER LICENSE AGREEMENT</strong><br><br>This Agreement is entered into by Dream Palace ("Club") and the undersigned Entertainer. GlyphLock LLC is a technology platform licensor only and is not a party to this Agreement.<br><br><strong>1. INDEPENDENT CONTRACTOR STATUS</strong><br>Entertainer is an independent contractor. No employer-employee relationship is created. Club exercises no control over the manner or means of Entertainer's services.<br><br><strong>2. LICENSE FEES</strong><br>Entertainer shall pay Club a License Fee per Shift as set by management and disclosed through GlyphLock NUPS prior to each Shift. All Tips are sole property of Entertainer.<br><br><strong>3. AGE REQUIREMENT</strong><br>Entertainer warrants she is at least 18 years of age and has provided valid government-issued photo identification.<br><br><strong>4. PROHIBITED CONDUCT</strong><br>Entertainer shall not engage in: illegal activity, solicitation outside Premises, substance use while working, unauthorized recording.<br><br><strong>7. MANDATORY BINDING ARBITRATION</strong><br>Any dispute shall be resolved by binding arbitration in Maricopa County, Arizona. Entertainer waives jury trial rights and class action rights.</div><div style="display:flex;gap:8px;"><button class="btn btn-p btn-sm btn-full">Print</button><button class="btn btn-g btn-sm btn-full">PDF</button></div><div style="margin-top:8px;font-size:9px;color:var(--muted);text-align:center;">UUID auto-generated · Biometrics logged · Audit trail created</div></div></div></div>
  <div id="cv" style="display:none;"><div class="g2"><div class="card"><div class="sec">VIP Room Agreement</div><div class="inp-g"><div class="inp-lbl">Guest Name</div><input class="inp" value="James Mitchell"></div><div class="inp-g"><div class="inp-lbl">Government ID</div><input class="inp" value="AZ-1234567"></div><div class="inp-g"><div class="inp-lbl">VIP Room</div><select class="inp"><option>VIP-4 (Available)</option><option>VIP-5 (Available)</option></select></div><div class="inp-g"><div class="inp-lbl">Duration &amp; Rate</div><select class="inp"><option>30 min — $150</option><option selected>60 min — $300</option><option>90 min — $400</option><option>2 hrs — $500</option></select></div><div class="inp-g"><div class="inp-lbl">Entertainer Assigned</div><select class="inp"><option>Destiny</option><option>Jade</option></select></div><button class="btn btn-p btn-full">Book Room + Generate Contract</button></div><div class="card"><div class="sec">Signed Contract</div><div style="background:white;border:1px solid rgba(91,33,182,.1);border-radius:12px;padding:16px;margin-bottom:12px;"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;"><div><div style="font-size:13px;font-weight:600;">VIP Room Service Agreement</div><div style="font-family:var(--mono);font-size:10px;color:var(--muted);margin-top:2px;">VIP-20260322-003</div></div><span class="badge b-ok">Signed</span></div><div style="font-size:11px;color:var(--txt2);line-height:1.7;">Guest: James Mitchell · Room: VIP-3 · 60 min · $300 minimum spend<br>Signed: 3/22/2026 12:10 AM · Biometrics: Yes</div><div style="margin-top:12px;background:var(--wbg);border:1px solid var(--wb);border-radius:8px;padding:10px;"><div style="font-size:10px;font-weight:700;color:var(--warn);margin-bottom:4px;">Session Notes — Auto-filled</div><div style="font-size:10px;color:var(--txt2);line-height:1.7;">Services agreed: Private performance 60min<br>GlyphBucks presented: $5,000 · Guest sober: Yes<br>Contract signed: Yes · Incident: No</div></div></div><div style="display:flex;gap:8px;"><button class="btn btn-p btn-sm">Print + Notes</button><button class="btn btn-g btn-sm">View Audit</button></div></div></div></div>
  <div id="cg" style="display:none;"><div class="card"><div class="sec">GlyphBucks Purchase Agreement</div><div class="contract-scroll"><strong>GLYPHBUCKS CLUB CURRENCY PURCHASE AGREEMENT</strong><br><br>Transaction: TXN-5646240322-GP6 · Dream Palace · 815 N. Scottsdale Rd<br>Customer: James Mitchell · Card last 6: 488 219<br><br><strong>4. NON-REFUNDABLE PURCHASE</strong><br>GlyphBucks are non-refundable once issued. No refund for used or unused GlyphBucks for any reason.<br><br><strong>5. EXCLUSIVE VENUE USE</strong><br>GlyphBucks may only be used at Dream Palace and have no cash value outside the Premises.<br><br><strong>7. ANTI-CHARGEBACK COVENANT</strong><br>Customer covenants not to initiate any chargeback. Violation = $500 liquidated damages per incident plus attorneys' fees. Venue may report fraudulent chargebacks to law enforcement.</div><div style="display:flex;gap:8px;"><button class="btn btn-p btn-sm">Print</button><button class="btn btn-ok btn-sm">Mark Signed</button></div></div></div>
  <div id="ca" style="display:none;"><div class="card"><div class="sec">Contract Archive</div><div style="display:flex;flex-direction:column;gap:8px;"><div style="background:white;border:1px solid rgba(91,33,182,.1);border-radius:12px;padding:14px;display:flex;justify-content:space-between;align-items:center;"><div><div style="font-size:12.5px;font-weight:600;">Entertainer License — Luna</div><div style="font-family:var(--mono);font-size:10px;color:var(--muted);">ENT-20260322-001</div></div><div style="display:flex;gap:6px;align-items:center;"><span class="badge b-ok">Active</span><button class="btn btn-g btn-xs">Print</button></div></div><div style="background:white;border:1px solid rgba(91,33,182,.1);border-radius:12px;padding:14px;display:flex;justify-content:space-between;align-items:center;"><div><div style="font-size:12.5px;font-weight:600;">VIP Room Agreement — James Mitchell · Room 3</div><div style="font-family:var(--mono);font-size:10px;color:var(--muted);">VIP-20260322-003</div></div><div style="display:flex;gap:6px;align-items:center;"><span class="badge b-ok">Signed</span><button class="btn btn-g btn-xs">Print</button></div></div><div style="background:white;border:1px solid rgba(91,33,182,.1);border-radius:12px;padding:14px;display:flex;justify-content:space-between;align-items:center;"><div><div style="font-size:12.5px;font-weight:600;">GlyphBucks Purchase — $5,000 — Mitchell</div><div style="font-family:var(--mono);font-size:10px;color:var(--muted);">TXN-5646240322-GP6</div></div><div style="display:flex;gap:6px;align-items:center;"><span class="badge b-p">Issued</span><button class="btn btn-g btn-xs">Print</button></div></div><div style="background:white;border:1px solid rgba(91,33,182,.1);border-radius:12px;padding:14px;display:flex;justify-content:space-between;align-items:center;"><div><div style="font-size:12.5px;font-weight:600;">Entertainer License — Crystal</div><div style="font-family:var(--mono);font-size:10px;color:var(--muted);">ENT-20260321-008</div></div><div style="display:flex;gap:6px;align-items:center;"><span class="badge b-ok">Active</span><button class="btn btn-g btn-xs">Print</button></div></div></div></div></div>
</div>
<div id="s-entertainers" class="screen">
  <div class="g2">
    <div class="card">
      <div class="sec">Time Clock — On Floor</div>
      <div class="clock-card"><div class="clock-avatar">LU</div><div class="clock-info"><div class="clock-name">Luna</div><div class="clock-status">On Floor · Checked in 11:45 PM</div></div><div style="text-align:right;"><div class="clock-time">0:45</div><span class="badge b-ok">On Floor</span></div></div>
      <div class="clock-card"><div class="clock-avatar">CR</div><div class="clock-info"><div class="clock-name">Crystal</div><div class="clock-status">In VIP · Room 2 · Questionnaire pending</div></div><div style="text-align:right;"><div class="clock-time">0:28</div><span class="badge b-w">In VIP</span></div></div>
      <div class="clock-card"><div class="clock-avatar">DE</div><div class="clock-info"><div class="clock-name">Destiny</div><div class="clock-status">On Stage</div></div><div style="text-align:right;"><div class="clock-time">1:12</div><span class="badge b-p">On Stage</span></div></div>
      <div class="clock-card" style="opacity:.65;"><div class="clock-avatar">JA</div><div class="clock-info"><div class="clock-name">Jade</div><div class="clock-status">On Break</div></div><div style="text-align:right;"><div class="clock-time">0:08</div><span class="badge b-i">Break</span></div></div>
      <button class="btn btn-p btn-full" style="margin-top:12px;">Clock In New Entertainer</button>
    </div>
    <div class="card">
      <div class="sec">VIP Questionnaire — Crystal · Room 2</div>
      <div style="margin-bottom:12px;"><div class="prog-bar"><div class="prog-fill" style="width:55%;"></div></div><div style="font-size:10px;color:var(--muted);margin-top:4px;font-weight:500;">Question 11 of 20 · 55% complete</div></div>
      <div class="q-card"><div class="q-num">Q11</div><div class="q-text">Did the guest appear sober and coherent at the start of the session?</div><div class="yn"><button class="yn-btn yn-y sel">Yes</button><button class="yn-btn yn-n">No</button></div></div>
      <div class="q-card"><div class="q-num">Q12</div><div class="q-text">Did the guest sign the VIP Room Service Agreement?</div><div class="yn"><button class="yn-btn yn-y sel">Yes</button><button class="yn-btn yn-n">No</button></div></div>
      <div class="q-card"><div class="q-num">Q13</div><div class="q-text">Did the guest consent to photo and ID verification?</div><div class="yn"><button class="yn-btn yn-y">Yes</button><button class="yn-btn yn-n">No</button></div></div>
      <button class="btn btn-g btn-full" style="margin-top:8px;">Next Question →</button>
    </div>
  </div>
</div>
<div id="s-vip" class="screen">
  <div class="card" style="margin-bottom:14px;"><div class="sec">Room Status</div><div class="room-grid"><div class="room-card busy"><div class="room-num">VIP-1</div><div style="font-size:10px;color:var(--warn);margin:4px 0;font-weight:600;">Occupied</div><div style="font-size:10px;color:var(--muted);">Luna · 0:45</div><span class="badge b-w" style="margin-top:6px;">Session</span></div><div class="room-card busy"><div class="room-num">VIP-2</div><div style="font-size:10px;color:var(--warn);margin:4px 0;font-weight:600;">Occupied</div><div style="font-size:10px;color:var(--muted);">Crystal · 0:28</div><span class="badge b-w" style="margin-top:6px;">Session</span></div><div class="room-card flagged"><div class="room-num">VIP-3</div><div style="font-size:10px;color:var(--err);margin:4px 0;font-weight:600;">Flagged</div><div style="font-size:10px;color:var(--muted);">3rd party incident</div><span class="badge b-err" style="margin-top:6px;">Review</span></div><div class="room-card free"><div class="room-num">VIP-4</div><div style="font-size:10px;color:var(--ok);margin:4px 0;font-weight:600;">Available</div><div style="font-size:10px;color:var(--muted);">Ready now</div><span class="badge b-ok" style="margin-top:6px;">Open</span></div><div class="room-card free"><div class="room-num">VIP-5</div><div style="font-size:10px;color:var(--ok);margin:4px 0;font-weight:600;">Available</div><div style="font-size:10px;color:var(--muted);">Ready now</div><span class="badge b-ok" style="margin-top:6px;">Open</span></div></div></div>
  <div class="g2"><div class="card"><div class="sec">Book VIP Room</div><div class="inp-g"><div class="inp-lbl">Guest Name</div><input class="inp" placeholder="Full name..."></div><div class="inp-g"><div class="inp-lbl">Government ID</div><input class="inp" placeholder="License number..."></div><div class="inp-g"><div class="inp-lbl">Room</div><select class="inp"><option>VIP-4 — Available</option><option>VIP-5 — Available</option></select></div><div class="inp-g"><div class="inp-lbl">Duration &amp; Rate</div><select class="inp"><option>30 min — $150</option><option>60 min — $300</option><option>90 min — $400</option><option>2 hrs — $500</option></select></div><div class="inp-g"><div class="inp-lbl">Entertainer</div><select class="inp"><option>Destiny</option><option>Jade</option></select></div><button class="btn btn-p btn-full">Book Room + Generate Contract</button></div><div class="card"><div class="sec">Session Notes Template</div><div style="display:flex;flex-direction:column;gap:6px;font-size:12px;"><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:.5px solid rgba(91,33,182,.08);"><span style="color:var(--muted);font-weight:500;">Services Agreed</span><span style="font-family:var(--mono);color:var(--txt);">_________________________</span></div><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:.5px solid rgba(91,33,182,.08);"><span style="color:var(--muted);font-weight:500;">GlyphBucks Presented</span><span style="font-family:var(--mono);color:var(--txt);">$________________________</span></div><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:.5px solid rgba(91,33,182,.08);"><span style="color:var(--muted);font-weight:500;">GlyphBucks Redeemed</span><span style="font-family:var(--mono);color:var(--txt);">$________________________</span></div><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:.5px solid rgba(91,33,182,.08);"><span style="color:var(--muted);font-weight:500;">Entertainer</span><span style="font-family:var(--mono);color:var(--txt);">_________________________</span></div><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:.5px solid rgba(91,33,182,.08);"><span style="color:var(--muted);font-weight:500;">Manager on Duty</span><span style="font-family:var(--mono);color:var(--txt);">_________________________</span></div><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:.5px solid rgba(91,33,182,.08);"><span style="color:var(--muted);font-weight:500;">Security Witness</span><span style="font-family:var(--mono);color:var(--txt);">_________________________</span></div><div style="display:flex;justify-content:space-between;padding:8px 0;"><span style="color:var(--muted);font-weight:500;">Incident Flagged</span><span>☐ Yes &nbsp; ☐ No</span></div></div><div style="display:flex;gap:8px;margin-top:12px;"><button class="btn btn-p btn-sm btn-full">Print Contract + Notes</button></div></div></div>
</div>
<div id="s-inventory" class="screen">
  <div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;"><div class="sec" style="margin-bottom:0;">Inventory — Dream Palace</div><button class="btn btn-p btn-sm">+ Add Item</button></div>
    <div class="inv-item"><div class="inv-bar-wrap" style="flex:1;"><div style="font-size:13px;font-weight:600;">Water — Still</div><div style="font-size:10px;color:var(--muted);">NA Beverage · $8.00</div><div class="inv-bar"><div class="inv-fill" style="width:90%;background:var(--ok);"></div></div></div><div style="text-align:right;margin-left:16px;"><div style="font-size:16px;font-weight:700;color:var(--txt);">45</div><div style="font-size:10px;color:var(--muted);">units</div></div><button class="btn btn-g btn-xs" style="margin-left:10px;">Edit</button></div>
    <div class="inv-item"><div class="inv-bar-wrap" style="flex:1;"><div style="font-size:13px;font-weight:600;">Coca-Cola</div><div style="font-size:10px;color:var(--muted);">NA Beverage · $8.00</div><div class="inv-bar"><div class="inv-fill" style="width:70%;background:var(--ok);"></div></div></div><div style="text-align:right;margin-left:16px;"><div style="font-size:16px;font-weight:700;color:var(--txt);">28</div><div style="font-size:10px;color:var(--muted);">units</div></div><button class="btn btn-g btn-xs" style="margin-left:10px;">Edit</button></div>
    <div class="inv-item"><div class="inv-bar-wrap" style="flex:1;"><div style="font-size:13px;font-weight:600;">Red Bull</div><div style="font-size:10px;color:var(--warn);">NA Energy · $10.00 · LOW STOCK</div><div class="inv-bar"><div class="inv-fill" style="width:28%;background:#F59E0B;"></div></div></div><div style="text-align:right;margin-left:16px;"><div style="font-size:16px;font-weight:700;color:var(--warn);">14</div><div style="font-size:10px;color:var(--warn);">low</div></div><button class="btn btn-warn btn-xs" style="margin-left:10px;">Restock</button></div>
    <div class="inv-item"><div class="inv-bar-wrap" style="flex:1;"><div style="font-size:13px;font-weight:600;">NA Beer — Heineken 0.0</div><div style="font-size:10px;color:var(--muted);">NA Beer · $10.00</div><div class="inv-bar"><div class="inv-fill" style="width:60%;background:var(--ok);"></div></div></div><div style="text-align:right;margin-left:16px;"><div style="font-size:16px;font-weight:700;color:var(--txt);">24</div><div style="font-size:10px;color:var(--muted);">units</div></div><button class="btn btn-g btn-xs" style="margin-left:10px;">Edit</button></div>
    <div class="inv-item"><div class="inv-bar-wrap" style="flex:1;"><div style="font-size:13px;font-weight:600;">Hookah (1 hr)</div><div style="font-size:10px;color:var(--muted);">Service · $75.00</div><div class="inv-bar"><div class="inv-fill" style="width:80%;background:var(--ok);"></div></div></div><div style="text-align:right;margin-left:16px;"><div style="font-size:16px;font-weight:700;color:var(--txt);">8</div><div style="font-size:10px;color:var(--muted);">slots</div></div><button class="btn btn-g btn-xs" style="margin-left:10px;">Edit</button></div>
    <div class="inv-item"><div class="inv-bar-wrap" style="flex:1;"><div style="font-size:13px;font-weight:600;">VIP Room (1 hr)</div><div style="font-size:10px;color:var(--err);">Room Service · $300.00 · CRITICAL</div><div class="inv-bar"><div class="inv-fill" style="width:20%;background:var(--err);"></div></div></div><div style="text-align:right;margin-left:16px;"><div style="font-size:16px;font-weight:700;color:var(--err);">2</div><div style="font-size:10px;color:var(--err);">left</div></div><button class="btn btn-err btn-xs" style="margin-left:10px;">Alert</button></div>
    <div class="inv-item"><div class="inv-bar-wrap" style="flex:1;"><div style="font-size:13px;font-weight:600;">Private Show (30 min)</div><div style="font-size:10px;color:var(--muted);">Entertainment · $150.00</div><div class="inv-bar"><div class="inv-fill" style="width:75%;background:var(--ok);"></div></div></div><div style="text-align:right;margin-left:16px;"><div style="font-size:16px;font-weight:700;color:var(--txt);">15</div><div style="font-size:10px;color:var(--muted);">avail</div></div><button class="btn btn-g btn-xs" style="margin-left:10px;">Edit</button></div>
  </div>
</div>
<div id="s-lookup" class="screen">
  <div class="card" style="margin-bottom:14px;"><div class="sec">Universal Contract Lookup</div><div style="display:flex;gap:8px;margin-bottom:8px;"><input class="inp" style="flex:1;" placeholder="Scan barcode · UUID · Card last 6 · License number · Entertainer ID..."><button class="btn btn-p">Search</button></div><div style="font-size:10px;color:var(--muted);font-weight:500;">Accepts: QR scan · Barcode (Ambir DB100) · Transaction UUID · Gov ID · Card digits · Entertainer ID</div></div>
  <div style="display:flex;flex-direction:column;gap:6px;">
    <div class="lookup-result"><div class="lr-icon">💳</div><div style="flex:1;"><div style="font-size:13px;font-weight:600;">James Mitchell — TXN-5646240322-GP6</div><div style="font-size:10px;color:var(--muted);">GlyphBucks Order · $5,646.24 · Dream Palace · 12:30 AM</div></div><div style="display:flex;gap:6px;align-items:center;"><span class="badge b-ok">Complete</span><button class="btn btn-g btn-xs">View</button><button class="btn btn-g btn-xs">Print</button></div></div>
    <div class="lookup-result"><div class="lr-icon">📋</div><div style="flex:1;"><div style="font-size:13px;font-weight:600;">VIP Contract — Room 3 · VIP-20260322-003</div><div style="font-size:10px;color:var(--muted);">VIP Room Service Agreement · James Mitchell · Signed</div></div><div style="display:flex;gap:6px;align-items:center;"><span class="badge b-ok">Signed</span><button class="btn btn-g btn-xs">View</button><button class="btn btn-g btn-xs">Print</button></div></div>
    <div class="lookup-result"><div class="lr-icon">⬡</div><div style="flex:1;"><div style="font-size:13px;font-weight:600;">GB-5K-20260322-STG001 — $5,000</div><div style="font-size:10px;color:var(--muted);">GlyphBucks Bill · Issued to James Mitchell · 12:30 AM</div></div><div style="display:flex;gap:6px;align-items:center;"><span class="badge b-p">Issued</span><button class="btn btn-g btn-xs">View</button><button class="btn btn-err btn-xs">Void</button></div></div>
    <div class="lookup-result"><div class="lr-icon">👤</div><div style="flex:1;"><div style="font-size:13px;font-weight:600;">Luna — ENT-20260322-001</div><div style="font-size:10px;color:var(--muted);">Independent Contractor Agreement · Active · Dream Palace</div></div><div style="display:flex;gap:6px;align-items:center;"><span class="badge b-ok">Active</span><button class="btn btn-g btn-xs">View</button><button class="btn btn-g btn-xs">Print</button></div></div>
  </div>
</div>
<div id="s-fraud" class="screen">
  <div class="g2">
    <div>
      <div class="card" style="margin-bottom:14px;"><div class="sec">Active Alerts</div>
        <div class="alert-item crit"><div class="alert-icon" style="background:var(--ebg);">⚠</div><div style="flex:1;"><div style="font-size:12.5px;font-weight:600;color:var(--err);">VIP Session Flagged — Room 3</div><div style="font-size:10px;color:var(--muted);margin-top:2px;">Third party entered room · Crystal · 12:18 AM</div></div><button class="btn btn-err btn-xs">Review</button></div>
        <div class="alert-item warn"><div class="alert-icon" style="background:var(--wbg);">!</div><div style="flex:1;"><div style="font-size:12.5px;font-weight:600;color:var(--warn);">GlyphBucks Void — Unusual Pattern</div><div style="font-size:10px;color:var(--muted);margin-top:2px;">GB-003 voided 5 min after issue · $500</div></div><button class="btn btn-warn btn-xs">Review</button></div>
        <div class="alert-item info"><div class="alert-icon" style="background:var(--pl);">✓</div><div style="flex:1;"><div style="font-size:12.5px;font-weight:600;color:var(--p);">Large Transaction $5,646 — Cleared</div><div style="font-size:10px;color:var(--muted);margin-top:2px;">Card captured · Contract signed · All docs logged</div></div><span class="badge b-ok">Cleared</span></div>
      </div>
      <div class="card"><div class="sec">Chargeback Defense — TXN-5646</div><div style="display:flex;flex-direction:column;gap:6px;font-size:12px;"><div style="display:flex;align-items:center;gap:8px;padding:4px 0;"><span style="color:var(--ok);font-size:14px;">✓</span><span>GlyphBucks Purchase Agreement signed</span></div><div style="display:flex;align-items:center;gap:8px;padding:4px 0;"><span style="color:var(--ok);font-size:14px;">✓</span><span>Customer photo captured</span></div><div style="display:flex;align-items:center;gap:8px;padding:4px 0;"><span style="color:var(--ok);font-size:14px;">✓</span><span>Government ID scan — front and back</span></div><div style="display:flex;align-items:center;gap:8px;padding:4px 0;"><span style="color:var(--ok);font-size:14px;">✓</span><span>Card last 6 recorded: <span style="font-family:var(--mono);">488 219</span></span></div><div style="display:flex;align-items:center;gap:8px;padding:4px 0;"><span style="color:var(--ok);font-size:14px;">✓</span><span>Approval code: AUTH-9X7K2M</span></div><div style="display:flex;align-items:center;gap:8px;padding:4px 0;"><span style="color:var(--ok);font-size:14px;">✓</span><span>QR + barcode on printed receipt</span></div><div style="display:flex;align-items:center;gap:8px;padding:4px 0;"><span style="color:var(--ok);font-size:14px;">✓</span><span>NUPS audit trail UUID logged</span></div></div><button class="btn btn-g btn-full" style="margin-top:12px;">Generate Chargeback Response Package</button></div>
    </div>
    <div class="card"><div class="sec">System Integrity</div><div class="g2" style="margin-bottom:14px;gap:8px;"><div class="metric"><div class="m-lbl">Bills Issued</div><div class="m-val">34</div></div><div class="metric"><div class="m-lbl">Redeemed</div><div class="m-val">18</div></div><div class="metric"><div class="m-lbl">Voided</div><div class="m-val m-dn">3</div></div><div class="metric"><div class="m-lbl">Flagged</div><div class="m-val m-dn">1</div></div></div><div class="sec">Audit Log</div><div class="timeline"><div class="tl-item"><div class="tl-dot alert"></div><div class="tl-lbl" style="font-size:11px;">VIP_SESSION_FLAGGED — Room 3</div><div class="tl-time">12:18 AM · WARNING</div></div><div class="tl-item"><div class="tl-dot done"></div><div class="tl-lbl" style="font-size:11px;">CONTRACT_SIGNED — VIP-20260322-003</div><div class="tl-time">12:10 AM · INFO</div></div><div class="tl-item"><div class="tl-dot done"></div><div class="tl-lbl" style="font-size:11px;">TRANSACTION_COMPLETED — $5,646.24</div><div class="tl-time">12:30 AM · INFO</div></div><div class="tl-item"><div class="tl-dot done"></div><div class="tl-lbl" style="font-size:11px;">GLYPHBUCKS_ISSUED — GB-5K-STG001</div><div class="tl-time">12:30 AM · INFO</div></div><div class="tl-item"><div class="tl-dot done"></div><div class="tl-lbl" style="font-size:11px;">ENTERTAINER_CLOCKED_IN — Luna</div><div class="tl-time">11:45 PM · INFO</div></div></div></div>
  </div>
</div>
<div id="s-reports" class="screen">
  <div class="g4" style="margin-bottom:16px;">
    <div class="metric"><div class="m-lbl">Gross Revenue</div><div class="m-val">$12,480</div><div class="m-sub m-up">↑ 18%</div></div>
    <div class="metric"><div class="m-lbl">Tax Collected</div><div class="m-val">$998</div></div>
    <div class="metric"><div class="m-lbl">Gratuity Total</div><div class="m-val">$2,246</div><div class="m-sub">Avg 18%</div></div>
    <div class="metric"><div class="m-lbl">GlyphBucks Net</div><div class="m-val">$5,150</div></div>
  </div>
  <div class="g2">
    <div class="card"><div class="sec">Z-Report — End of Day</div><table class="tbl"><thead><tr><th>Category</th><th>Count</th><th>Net</th><th>Tax</th><th>Gratuity</th><th>Total</th></tr></thead><tbody><tr><td>Door Entry</td><td>120</td><td>$2,400</td><td>$192</td><td style="color:var(--pm);">$432</td><td style="font-weight:700;">$3,024</td></tr><tr><td>GlyphBucks</td><td>34</td><td>$8,250</td><td>$660</td><td style="color:var(--pm);">$1,485</td><td style="font-weight:700;">$10,395</td></tr><tr><td>Beverages</td><td>88</td><td>$960</td><td>$77</td><td style="color:var(--pm);">$173</td><td style="font-weight:700;">$1,210</td></tr><tr><td>VIP Room</td><td>3</td><td>$870</td><td>$70</td><td style="color:var(--pm);">$157</td><td style="font-weight:700;">$1,097</td></tr><tr style="background:rgba(91,33,182,.04);"><td style="font-weight:700;">TOTAL</td><td style="font-weight:700;">245</td><td style="font-weight:700;">$12,480</td><td style="font-weight:700;">$999</td><td style="font-weight:700;color:var(--pm);">$2,247</td><td style="font-weight:700;color:var(--p);font-family:var(--display);font-size:13px;">$15,726</td></tr></tbody></table><div style="display:flex;gap:8px;margin-top:12px;"><button class="btn btn-p btn-sm">Print Z-Report</button><button class="btn btn-g btn-sm">Export CSV</button></div></div>
    <div class="card"><div class="sec">Entertainer Payroll</div><table class="tbl"><thead><tr><th>Entertainer</th><th>Hours</th><th>Tips</th><th>License Fee</th><th>Net</th></tr></thead><tbody><tr><td>Luna</td><td>3.5</td><td style="color:var(--ok);font-weight:600;">$1,240</td><td style="color:var(--err);">−$80</td><td style="font-weight:700;">$1,160</td></tr><tr><td>Crystal</td><td>2.8</td><td style="color:var(--ok);font-weight:600;">$980</td><td style="color:var(--err);">−$65</td><td style="font-weight:700;">$915</td></tr><tr><td>Destiny</td><td>4.1</td><td style="color:var(--ok);font-weight:600;">$1,560</td><td style="color:var(--err);">−$95</td><td style="font-weight:700;">$1,465</td></tr><tr><td>Jade</td><td>1.9</td><td style="color:var(--ok);font-weight:600;">$640</td><td style="color:var(--err);">−$45</td><td style="font-weight:700;">$595</td></tr></tbody></table><div style="display:flex;gap:8px;margin-top:12px;"><button class="btn btn-g btn-sm">Print Payroll</button><button class="btn btn-g btn-sm">Export CSV</button></div></div>
  </div>
</div>
<script>
const NAMES={door:'Door Entry',gb5k:'Stage GlyphBucks — $5K',coke:'Coca-Cola',nabeer:'NA Beer — Heineken 0.0',bottle:'Bottle Service Premium',viproom:'VIP Room (1 hr)',hookah:'Hookah (1 hr)',show:'Private Show (30 min)',redbull:'Red Bull'};
const PRICES={door:20,gb5k:5000,coke:8,nabeer:10,bottle:250,viproom:300,hookah:75,show:150,redbull:10};
let cart={},tipPct=18,tipAmt=0,customTipAmt=0,useCustom=false;
function show(el,id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));document.getElementById('s-'+id).classList.add('active');el.classList.add('active');}
function navTo(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.querySelectorAll('.nav-item').forEach(n=>{if(n.textContent.toLowerCase().includes(id.slice(0,3)))n.classList.add('active');});document.getElementById('s-'+id).classList.add('active');}
function add(key,price){cart[key]=(cart[key]||0)+1;renderCart();}
function chg(key,d){cart[key]=(cart[key]||0)+d;if(cart[key]<=0)delete cart[key];renderCart();}
function renderCart(){let sub=0,gbTotal=0,hasGb=false;let cHtml='',rHtml='',gbItems='';for(const[k,q]of Object.entries(cart)){const line=PRICES[k]*q;sub+=line;if(k==='gb5k'){hasGb=true;gbTotal+=line;}cHtml+=\`<div class="cart-item"><div><div class="cart-name">\${NAMES[k]}</div><div class="cart-sub">$\${PRICES[k].toFixed(2)} each</div></div><div class="qty-ctrl"><button class="qty-btn" onclick="chg('\${k}',-1)">−</button><span class="qty-num">\${q}</span><button class="qty-btn" onclick="chg('\${k}',1)">+</button></div><div class="cart-price">$\${line.toFixed(2)}</div></div>\`;rHtml+=\`<div class="r-item"><span style="color:#fff;">\${NAMES[k]}</span><span style="color:rgba(255,255,255,.55);">\${q}</span><span style="color:rgba(255,255,255,.55);">$\${PRICES[k].toFixed(2)}</span><span style="color:#fff;font-weight:600;text-align:right;">$\${line.toFixed(2)}</span></div>\`;if(k==='gb5k')gbItems+=\`<div style="display:flex;justify-content:space-between;font-size:10px;padding:2px 0;"><span style="color:rgba(255,255,255,.6);font-family:var(--mono);">GB-5K-20260322-STG001</span><span style="color:#818CF8;font-weight:600;">$\${line.toFixed(2)}</span></div>\`;}document.getElementById('cart').innerHTML=cHtml||'<div style="font-size:12px;color:var(--muted);padding:8px 0;text-align:center;">Tap items above to add to order</div>';document.getElementById('r-items').innerHTML=rHtml||'<div style="font-size:10px;color:rgba(255,255,255,.25);padding:8px 0;text-align:center;">Add items to build receipt</div>';const tax=sub*0.08;tipAmt=useCustom?customTipAmt:sub*(tipPct/100);const tot=sub+tax+tipAmt;[0,15,18,20,25].forEach(p=>{const el=document.getElementById('t'+p);if(el)el.textContent='$'+(sub*(p/100)).toFixed(2);});['p-sub','r-sub'].forEach(id=>document.getElementById(id).textContent='$'+sub.toFixed(2));['p-tax','r-tax'].forEach(id=>document.getElementById(id).textContent='$'+tax.toFixed(2));['p-tip','r-tip'].forEach(id=>document.getElementById(id).textContent='$'+tipAmt.toFixed(2));['p-total','r-total'].forEach(id=>document.getElementById(id).textContent='$'+tot.toFixed(2));const tipBlock=document.getElementById('r-tip-block');if(tipAmt>0){tipBlock.style.display='block';document.getElementById('r-tip-pct').textContent=useCustom?'Custom':tipPct+'%';document.getElementById('r-tip-amt2').textContent='$'+tipAmt.toFixed(2);}else{tipBlock.style.display='none';}const gbSec=document.getElementById('r-gb');if(hasGb){gbSec.style.display='block';document.getElementById('r-gb-items').innerHTML=gbItems;document.getElementById('r-gb-tot').textContent='$'+gbTotal.toFixed(2);}else{gbSec.style.display='none';}const uuid='TXN-'+Math.round(tot*100)+'0322-GP6';document.getElementById('r-txn').textContent=uuid;document.getElementById('r-uuid').textContent=uuid;document.getElementById('r-qr-val').textContent=uuid;document.getElementById('r-bc-txt').textContent=uuid;}
function setTip(pct,el){tipPct=pct;useCustom=false;document.getElementById('custom-tip').value='';document.querySelectorAll('.tip-btn').forEach(b=>b.classList.remove('active'));el.classList.add('active');renderCart();}
function setCustomTip(val){customTipAmt=parseFloat(val)||0;useCustom=customTipAmt>0;if(useCustom)document.querySelectorAll('.tip-btn').forEach(b=>b.classList.remove('active'));renderCart();}
function processPayment(){alert('✅ Payment processed!\\n\\nReceipt generated with QR code + barcode.\\nGlyphBucks Purchase Agreement ready to sign.\\nAll records logged to audit trail.');}
function gbT(btn,id){document.querySelectorAll('#s-glyphbucks .tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');['gbi','gbr','gbh','gbn'].forEach(i=>document.getElementById(i).style.display=i===id?'block':'none');}
function cT(btn,id){document.querySelectorAll('#s-contracts .tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');['ce','cv','cg','ca'].forEach(i=>document.getElementById(i).style.display=i===id?'block':'none');}
add('door',20);add('door',20);add('door',20);add('door',20);add('door',20);add('door',20);add('gb5k',5000);add('coke',8);add('coke',8);add('coke',8);add('coke',8);add('coke',8);add('coke',8);add('nabeer',10);add('nabeer',10);add('nabeer',10);add('nabeer',10);add('nabeer',10);add('nabeer',10);
</script>
</body>
</html>`;

export default function NUPSDemo() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <div style={{
        background: 'linear-gradient(90deg, #3B0F8C, #5B21B6)',
        color: '#fff',
        textAlign: 'center',
        padding: '8px 16px',
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '.05em',
        fontFamily: 'sans-serif',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        🔒 GlyphLock NUPS — Live Platform Demo · glyphlock.io · Not a real transaction environment
      </div>
      <iframe
        srcDoc={demoHtml}
        style={{ 
          width: '100%', 
          height: 'calc(100vh - 32px)', 
          border: 'none',
          display: 'block'
        }}
        title="NUPS Platform Demo"
      />
    </div>
  );
}