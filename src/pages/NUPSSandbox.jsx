import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FlaskConical, Shield, DollarSign, Users, Clock, FileText,
  CreditCard, BarChart3, CheckCircle2, ArrowLeft, Play, Banknote,
  UserCheck, Music, Crown, AlertTriangle, RefreshCw, Loader2, Printer, Wifi,
  Database, Sparkles, ScanLine, Eye
} from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ClubCurrencyReceiptEngine from "@/components/nups/pos/ClubCurrencyReceiptEngine";
import VenuePrintLayout from "@/components/nups/VenuePrintLayout";
import ContractScanBack from "@/components/nups/ContractScanBack";
import GlyphBucksContract from "@/components/nups/GlyphBucksContract";
import HardwareStatusPanel from "@/components/nups/hardware/HardwareStatusPanel";
import CardReaderPanel from "@/components/nups/hardware/CardReaderPanel";
import FingerprintPanel from "@/components/nups/hardware/FingerprintPanel";
import ThermalPrinterPanel from "@/components/nups/hardware/ThermalPrinterPanel";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_USERS = [
  { id: "sb-u1", name: "Alex Rivera", role: "Manager", email: "alex@demo.nups", status: "active" },
  { id: "sb-u2", name: "Jamie Chen", role: "Bartender", email: "jamie@demo.nups", status: "active" },
  { id: "sb-u3", name: "Casey Williams", role: "DJ", email: "casey@demo.nups", status: "active" },
];

const MOCK_ENTERTAINERS = [
  { id: "sb-e1", name: "Destiny", legal: "Tanya Moore", status: "checked_in", earnings: 840.00, vip: 3 },
  { id: "sb-e2", name: "Luna", legal: "Brianna Reyes", status: "active", earnings: 620.00, vip: 2 },
  { id: "sb-e3", name: "Scarlett", legal: "Mia Torres", status: "checked_in", earnings: 1120.00, vip: 5 },
];

const MOCK_SHIFTS = [
  { id: "sb-s1", name: "Jamie Chen", in: "7:00 PM", out: null, duration: "3h 42m", status: "active" },
  { id: "sb-s2", name: "Casey Williams", in: "6:30 PM", out: null, duration: "4h 12m", status: "active" },
  { id: "sb-s3", name: "Destiny", in: "8:00 PM", out: null, duration: "2h 55m", status: "active" },
];

const MOCK_TRANSACTIONS = [
  { id: "sb-t1", items: "VIP Package", amount: 450.00, method: "Credit Card", time: "9:42 PM" },
  { id: "sb-t2", items: "Bottle Service", amount: 320.00, method: "Cash", time: "9:15 PM" },
  { id: "sb-t3", items: "Dream Dollars × $500", amount: 650.00, method: "Credit Card", time: "8:58 PM" },
  { id: "sb-t4", items: "Cover Charge × 4", amount: 80.00, method: "Cash", time: "8:30 PM" },
];

const MOCK_CONTRACTS = [
  { id: "sb-c1", entertainer: "Destiny", event: "VIP Suite B — 3hr", status: "signed", value: 450.00 },
  { id: "sb-c2", entertainer: "Luna", event: "Main Stage Show", status: "issued", value: 200.00 },
  { id: "sb-c3", entertainer: "Scarlett", event: "VIP Suite A — 5hr", status: "draft", value: 750.00 },
];

const MOCK_PAYROLL = [
  { name: "Destiny", period: "Mar 1–15", gross: 840.00, deductions: 201.60, net: 638.40, status: "approved" },
  { name: "Luna", period: "Mar 1–15", gross: 620.00, deductions: 148.80, net: 471.20, status: "draft" },
  { name: "Scarlett", period: "Mar 1–15", gross: 1120.00, deductions: 268.80, net: 851.20, status: "paid" },
];

const STATUS_BADGE = {
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  checked_in: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  draft: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  issued: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  signed: "bg-green-500/10 text-green-400 border-green-500/20",
  approved: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const SECTIONS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "hardware", label: "Hardware Test", icon: Wifi },
  { key: "pos", label: "POS Register", icon: CreditCard },
  { key: "dreamdollar", label: "Dream Dollar Demo", icon: Banknote },
  { key: "zreport", label: "Z-Report", icon: FileText },
  { key: "staff", label: "Staff & Clock-In", icon: Clock },
  { key: "entertainers", label: "Entertainers", icon: Music },
  { key: "contracts", label: "Contracts", icon: FileText },
  { key: "payroll", label: "Payroll", icon: DollarSign },
];

export default function NUPSSandbox() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");
  const [cart, setCart] = useState([]);
  const [lastTx, setLastTx] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [demoContracts, setDemoContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [contractsLoaded, setContractsLoaded] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [workflowContract, setWorkflowContract] = useState(null);
  const [workflowStep, setWorkflowStep] = useState(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [zReportPrinting, setZReportPrinting] = useState(false);
  const [zReportData, setZReportData] = useState(null);
  const [loadingZReport, setLoadingZReport] = useState(false);
  const [activeVenueId, setActiveVenueId] = useState(null);
  const [venueError, setVenueError] = useState(false);
  const [activeVenueRecord, setActiveVenueRecord] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const venues = await base44.entities.Venue.filter({ status: 'active' });
        const sandboxVenue = venues.find(v => v.mode === 'SANDBOX') || venues[0];
        if (sandboxVenue?.id) {
          setActiveVenueId(sandboxVenue.id);
          setActiveVenueRecord(sandboxVenue);
        } else {
          setVenueError(true);
        }
      } catch (e) {
        setVenueError(true);
      }
    })();
  }, []);

  if (venueError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center p-8 border border-red-500/30 rounded-xl bg-red-500/5">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 font-bold">No active venue found.</p>
          <p className="text-gray-500 text-sm mt-2">Please configure an active venue before using the sandbox.</p>
        </div>
      </div>
    );
  }

  if (!activeVenueId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
      </div>
    );
  }

  const DEMO_VENUE = activeVenueRecord || {
    id: activeVenueId,
    venue_id: activeVenueId,
    name: 'Active Venue',
    minimum_age: 21,
    glyphbucks_enabled: true
  };

  const DEMO_OPERATOR = {
    manager_name: 'Alex Rivera',
    hostess_name: 'Jamie Chen',
    email: 'manager@dreampalace.demo'
  };

  const loadDemoContracts = async () => {
    setLoadingContracts(true);
    try {
      const contracts = await base44.entities.VenueContract.filter({ venue_id: activeVenueId, is_demo: true });
      setDemoContracts(contracts || []);
      setContractsLoaded(true);
    } catch {
      setDemoContracts([]);
    }
    setLoadingContracts(false);
  };

  const seedAndLoad = async () => {
    setSeeding(true);
    try {
      await base44.functions.invoke('seedDemoContracts', { clear_existing: true });
      await loadDemoContracts();
    } catch (err) {
      toast.error('Seed failed: ' + err.message);
    }
    setSeeding(false);
  };

  const advanceWorkflow = async (contract, action) => {
    setWorkflowLoading(true);
    try {
      if (action === 'sign') {
        await base44.entities.VenueContract.update(contract.id, {
          is_signed: true,
          status: 'active',
          signed_at: new Date().toISOString(),
          customer_signature: contract.customer_name,
          ip_address: '192.168.1.' + Math.floor(Math.random() * 200 + 10)
        });
        await loadDemoContracts();
        toast.success('Contract signed!');
      } else if (action === 'print') {
        setWorkflowContract(contract);
        setWorkflowStep('print');
      } else if (action === 'scan') {
        setWorkflowContract(contract);
        setWorkflowStep('scan');
      }
    } catch (err) {
      toast.error('Action failed: ' + err.message);
    }
    setWorkflowLoading(false);
  };

  const handlePrintComplete = async () => {
    if (!workflowContract) return;
    await base44.entities.VenueContract.update(workflowContract.id, { is_printed: true });
    setWorkflowStep(null);
    setWorkflowContract(null);
    await loadDemoContracts();
    toast.success('Contract marked as printed!');
  };

  const handleScanComplete = async () => {
    setWorkflowStep(null);
    setWorkflowContract(null);
    await loadDemoContracts();
    toast.success('Scan-back complete!');
  };

  const loadZReportData = async () => {
    setLoadingZReport(true);
    try {
      const [contracts, posTransactions, vipSessions, gbOrders] = await Promise.all([
        base44.entities.VenueContract.filter({ venue_id: activeVenueId, is_demo: true }).catch(() => []),
        base44.entities.POSTransaction.list('-created_date', 500).catch(() => []),
        base44.entities.VIPRoom.list('-created_date', 500).catch(() => []),
        base44.entities.GlyphBucksOrder.list('-created_date', 500).catch(() => [])
      ]);
      setZReportData({ contracts, posTransactions, vipSessions, gbOrders });
    } catch (err) {
      toast.error('Failed to load Z-Report data');
    }
    setLoadingZReport(false);
  };

  const printDemoZReport = (data) => {
    setZReportPrinting(true);
    const reportId = `Z-DEMO-${Date.now()}`;
    const now = new Date();
    const { contracts = [], posTransactions = [], vipSessions = [], gbOrders = [] } = data || {};
    
    // Contract aggregates
    const totalContracts = contracts.length;
    const contractTotal = contracts.reduce((s, c) => s + (c.grand_total || c.contract_amount || 0), 0);
    const totalGB = contracts.reduce((s, c) => s + (c.glyphbucks_issued || 0), 0);
    const cashContracts = contracts.filter(c => c.payment_method === 'Cash');
    const cardContracts = contracts.filter(c => c.payment_method !== 'Cash');
    const contractCashTotal = cashContracts.reduce((s, c) => s + (c.grand_total || c.contract_amount || 0), 0);
    const contractCardTotal = cardContracts.reduce((s, c) => s + (c.grand_total || c.contract_amount || 0), 0);
    const contractSurcharge = contracts.reduce((s, c) => s + (c.processing_surcharge || 0), 0);
    const contractTips = contracts.reduce((s, c) => s + (c.waitress_tip || 0), 0);
    const scanned = contracts.filter(c => c.scan_status === 'SCANNED' || c.scan_status === 'VERIFIED').length;
    const printed = contracts.filter(c => c.is_printed).length;
    const signed = contracts.filter(c => c.is_signed).length;
    
    // POS aggregates
    const posCashSales = posTransactions.filter(t => t.payment_method === 'Cash').reduce((s, t) => s + (t.total || 0), 0);
    const posCardSales = posTransactions.filter(t => t.payment_method !== 'Cash').reduce((s, t) => s + (t.total || 0), 0);
    const posTotal = posCashSales + posCardSales;
    
    // VIP aggregates
    const vipTotal = vipSessions.reduce((s, v) => s + (v.total_charge || 0), 0);
    
    // GlyphBucks aggregates
    const gbTotal = gbOrders.reduce((s, o) => s + (o.grand_total || 0), 0);
    
    // Grand totals
    const cashTotal = contractCashTotal + posCashSales;
    const cardTotal = contractCardTotal + posCardSales;
    const grandTotal = contractTotal + posTotal + vipTotal;

    const pw = window.open('', '', 'width=800,height=700');
    pw.document.write(`
      <html><head><title>Z-Report Demo — ${reportId}</title>
      <style>
        body { font-family: monospace; padding: 24px; max-width: 680px; margin: 0 auto; }
        h1 { text-align: center; border-bottom: 3px double #000; padding-bottom: 8px; font-size: 18px; }
        h2 { font-size: 13px; border-bottom: 1px solid #000; padding-bottom: 4px; margin-top: 20px; }
        .row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 12px; }
        .total { font-weight: bold; font-size: 14px; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; }
        .demo { background: #fff3cd; border: 1px solid #ffc107; padding: 6px 10px; font-size: 11px; margin: 8px 0; }
        .sig { display: flex; gap: 40px; margin-top: 24px; border-top: 1px solid #000; padding-top: 12px; }
        .sig div { flex: 1; }
        .sig label { font-size: 10px; font-weight: bold; display: block; margin-bottom: 4px; }
        .sig .line { border-bottom: 1px solid #000; height: 28px; }
        .footer { text-align: center; font-size: 9px; color: #666; margin-top: 16px; }
        @media print { button { display: none; } }
      </style></head><body>
      <h1>N.U.P.S. POS — Z-REPORT<br/><span style='font-size:12px;font-weight:normal;'>DREAM PALACE — DEMO BATCH CLOSE</span></h1>
      <div class='demo'>⚠ SANDBOX DEMO — This report uses seeded demo contract data. No real transactions.</div>
      <h2>REPORT HEADER</h2>
      <div class='row'><span>Report ID:</span><span>${reportId}</span></div>
      <div class='row'><span>Date:</span><span>${now.toLocaleDateString()}</span></div>
      <div class='row'><span>Time:</span><span>${now.toLocaleTimeString()}</span></div>
      <div class='row'><span>Cashier:</span><span>Alex Rivera (Demo)</span></div>
      <div class='row'><span>Venue:</span><span>Dream Palace — Scottsdale, AZ</span></div>
      <div class='row'><span>Batch ID:</span><span>BATCH-DEMO-${now.toISOString().split('T')[0]}</span></div>
      <h2>ALL SALES SUMMARY</h2>
      <div class='row'><span>Dream Dollar Contracts:</span><span>${totalContracts} · $${contractTotal.toFixed(2)}</span></div>
      <div class='row'><span>POS Transactions:</span><span>${posTransactions.length} · $${posTotal.toFixed(2)}</span></div>
      <div class='row'><span>VIP Room Sessions:</span><span>${vipSessions.length} · $${vipTotal.toFixed(2)}</span></div>
      <div class='row'><span>GlyphBucks Orders:</span><span>${gbOrders.length} · $${gbTotal.toFixed(2)}</span></div>
      <h2>CASH DRAWER RECONCILIATION</h2>
      <div class='row'><span>Opening Cash (Demo):</span><span>$500.00</span></div>
      <div class='row'><span>Cash Sales (All Sources):</span><span>$${cashTotal.toFixed(2)}</span></div>
      <div class='row'><span>Expected Cash:</span><span>$${(500 + cashTotal).toFixed(2)}</span></div>
      <div class='row'><span>Closing Cash (Demo):</span><span>$${(500 + cashTotal).toFixed(2)}</span></div>
      <div class='row' style='color:green;font-weight:bold'><span>Cash Over/Short:</span><span>$0.00</span></div>
      <h2>SALES BREAKDOWN</h2>
      <div class='row'><span>Total Cash Sales:</span><span>$${cashTotal.toFixed(2)}</span></div>
      <div class='row'><span>Total Card Sales:</span><span>$${cardTotal.toFixed(2)}</span></div>
      <div class='row'><span>VIP Room Revenue (Operational):</span><span>$${vipTotal.toFixed(2)}</span></div>
      <div class='row'><span>Processing Surcharges:</span><span>$${contractSurcharge.toFixed(2)}</span></div>
      <div class='row'><span>Waitress Tips Collected:</span><span>$${contractTips.toFixed(2)}</span></div>
      <h2>GLYPHBUCKS LEDGER (Liability)</h2>
      <div class='row'><span>GB Issued Today:</span><span>${totalGB.toFixed(2)} GB</span></div>
      <div class='row'><span>GB Orders Placed:</span><span>${gbOrders.length}</span></div>
      <div class='row' style='font-weight:bold'><span>Net GB Liability:</span><span>${totalGB.toFixed(2)} GB</span></div>
      <div style='font-size:9px;color:#666;margin-top:4px;'>GlyphBucks™ is a stored-value liability instrument. Not counted as revenue.</div>
      <div class='total'>
        <div class='row'><span>TOTAL CONTRACTS:</span><span>${totalContracts}</span></div>
        <div class='row'><span>TOTAL POS TRANSACTIONS:</span><span>${posTransactions.length}</span></div>
        <div class='row'><span>TOTAL SALES (All Tender):</span><span>$${(cashTotal + cardTotal).toFixed(2)}</span></div>
        <div class='row'><span>TOTAL GB ISSUED:</span><span>${totalGB.toFixed(2)} GB</span></div>
      </div>
      <div class='sig'>
        <div><label>MANAGER SIGNATURE</label><div class='line'></div></div>
        <div><label>DATE / TIME</label><div class='line'></div></div>
      </div>
      <div class='footer'>N.U.P.S. POS — GlyphLock Financial LLC — ${now.toLocaleString()} — DEMO BATCH</div>
      <br/><button onclick='window.print()' style='padding:8px 20px;font-size:13px;cursor:pointer;'>🖨️ Print</button>
      </body></html>
    `);
    pw.document.close();
    pw.focus();
    setTimeout(() => pw.print(), 400);
    setZReportPrinting(false);
    toast.success('Z-Report generated!');
  };

  const handleResetDemo = async () => {
    setResetting(true);
    setResetDone(false);
    try {
      // Seed test DB with demo entertainers
      await Promise.all([
        base44.entities.Entertainer.bulkCreate([
          { stage_name: "Destiny", legal_name: "Tanya Moore", status: "active", contract_signed: true, commission_rate: 0.5, total_earnings: 840 },
          { stage_name: "Luna",    legal_name: "Brianna Reyes", status: "active", contract_signed: true, commission_rate: 0.5, total_earnings: 620 },
          { stage_name: "Scarlett",legal_name: "Mia Torres",   status: "active", contract_signed: true, commission_rate: 0.5, total_earnings: 1120 },
        ], { data_env: "dev" }).catch(() => {}),
        base44.entities.POSTransaction.bulkCreate([
          { transaction_id: `DEMO-${Date.now()}-1`, total: 450, payment_method: "Credit Card", cashier: "demo@nups.local", status: "completed" },
          { transaction_id: `DEMO-${Date.now()}-2`, total: 320, payment_method: "Cash",        cashier: "demo@nups.local", status: "completed" },
          { transaction_id: `DEMO-${Date.now()}-3`, total: 650, payment_method: "Credit Card", cashier: "demo@nups.local", status: "completed" },
        ], { data_env: "dev" }).catch(() => {}),
      ]);
      setResetDone(true);
    } catch (e) {
      setResetDone(false);
    }
    setResetting(false);
  };

  const fmt = (n) => `$${Number(n).toFixed(2)}`;
  const total = cart.reduce((s, i) => s + i.price, 0);

  const addItem = (item) => setCart(c => [...c, { ...item, id: Date.now() }]);
  const completeSale = () => {
    if (cart.length === 0) return;
    
    // Generate demo transaction and batch for receipt
    const orderNum = `DEMO-${Date.now()}`;
    const demoTx = {
      order_number: orderNum,
      customer_name: `Demo Customer ${Math.floor(Math.random() * 1000)}`,
      created_date: new Date().toISOString(),
      created_by: 'sandbox@demo.nups',
      card_last_six: '****DEMO',
      status: 'signed',
      grand_total: total
    };
    
    const demoBatch = {
      batch_id: `BATCH-${Date.now()}`,
      transaction_id: orderNum,
      order_number: orderNum,
      denominations: cart.map(i => ({
        denomination: i.price,
        quantity: 1,
        total_value: i.price
      })),
      total_face_value: total,
      surcharge_rate: 0.3,
      surcharge_amount: total * 0.3,
      total_charged: total * 1.3,
      approval_code: `DEMO-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      batch_barcode: `DEMO-${orderNum}`,
      status: 'issued'
    };
    
    setCurrentTransaction({ transaction: demoTx, batch: demoBatch });
    setShowReceipt(true);
    setLastTx({ items: cart.map(i => i.label).join(", "), total, time: new Date().toLocaleTimeString() });
    setCart([]);
  };

  const renderSection = () => {
    switch (activeSection) {
      case "hardware":
        return (
          <div className="space-y-4">
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-400/80">
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="w-4 h-4" />
                <span className="font-bold">HARDWARE INTEGRATION TEST</span>
              </div>
              <p>Test your Adesso card reader, fingerprint scanner, and thermal printer. All devices connect via USB and work with the production NUPS system.</p>
            </div>

            <HardwareStatusPanel />

            <div className="grid md:grid-cols-2 gap-4">
              <CardReaderPanel onCardRead={(card) => {
                console.log("Card captured:", card);
                toast.success(`Card captured: ${card.type} ending in ${card.last_six}`);
              }} />
              
              <FingerprintPanel 
                label="Test Fingerprint Scan"
                onCapture={(print) => {
                  console.log("Fingerprint captured:", print);
                }}
              />
            </div>

            <ThermalPrinterPanel 
              documentHtml={`
                <html>
                  <head><title>NUPS Test Print</title></head>
                  <body style="font-family: monospace; padding: 20px; max-width: 58mm;">
                    <h3 style="text-align: center; margin: 0;">DREAM PALACE</h3>
                    <p style="text-align: center; font-size: 10px; margin: 5px 0;">Test Print</p>
                    <hr/>
                    <p style="font-size: 11px; margin: 5px 0;">
                      Date: ${new Date().toLocaleString()}<br/>
                      Printer: Adesso NuPrint 210<br/>
                      Status: Connected<br/>
                      Serial: NP210-${Math.random().toString(36).substr(2, 6).toUpperCase()}
                    </p>
                    <hr/>
                    <p style="text-align: center; font-size: 9px; margin-top: 10px;">
                      Test successful · NUPS v3.1<br/>
                      GlyphLock Financial LLC
                    </p>
                  </body>
                </html>
              `}
              documentName="Hardware Test Receipt"
              onPrintComplete={(record) => {
                console.log("Print completed:", record);
              }}
            />
          </div>
        );

      case "dreamdollar":
        return (
          <div className="space-y-4">
            {/* Workflow overlays - for clarity in overlaid modal */}
            {workflowStep === 'print' && workflowContract && (
              <div className="fixed inset-0 z-[9999] bg-black/90 overflow-y-auto">
                <div className="max-w-3xl mx-auto p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-black text-white">Step 2: Print Contract</div>
                      <div className="text-xs text-gray-400">{workflowContract.customer_name}</div>
                    </div>
                    <button onClick={() => { setWorkflowStep(null); setWorkflowContract(null); }} className="text-gray-400 hover:text-white text-xs border border-white/10 rounded-lg px-3 py-1.5">✕ Cancel</button>
                  </div>
                  <VenuePrintLayout
                    venue={DEMO_VENUE}
                    contractInstance={workflowContract}
                    lineItems={[]}
                    operator={DEMO_OPERATOR}
                    onPrintComplete={handlePrintComplete}
                  />
                </div>
              </div>
            )}
            {workflowStep === 'scan' && workflowContract && (
              <div className="fixed inset-0 z-[9999] bg-black/90 overflow-y-auto">
                <div className="max-w-xl mx-auto p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-black text-white">Step 3: Scan Hardcopy Back</div>
                      <div className="text-xs text-gray-400">{workflowContract.customer_name}</div>
                    </div>
                    <button onClick={() => { setWorkflowStep(null); setWorkflowContract(null); }} className="text-gray-400 hover:text-white text-xs border border-white/10 rounded-lg px-3 py-1.5">✕ Cancel</button>
                  </div>
                  <ContractScanBack
                    contractInstance={workflowContract}
                    operator={DEMO_OPERATOR}
                    venue={DEMO_VENUE}
                    onScanComplete={handleScanComplete}
                  />
                </div>
              </div>
            )}

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300">
              <div className="flex items-center gap-2 mb-2">
                <Banknote className="w-4 h-4" />
                <span className="font-bold">DREAM PALACE — GLYPHBUCKS CONTRACT WORKFLOW</span>
              </div>
              <p>Walk through the actual GlyphBucks contract process: customer signs → staff prints hardcopy → signed copy is scanned back into the system. Each step updates the live database record.</p>
            </div>

            {/* Seed / load controls */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-300">{contractsLoaded ? `${demoContracts.length} demo contracts loaded` : 'Load Dream Palace demo contracts to begin'}</div>
              <div className="flex gap-2">
                {contractsLoaded && <button onClick={loadDemoContracts} disabled={loadingContracts} className="p-1.5 rounded-lg border border-white/10 text-gray-500 hover:text-white"><RefreshCw className={`w-3.5 h-3.5 ${loadingContracts ? 'animate-spin' : ''}`} /></button>}
                <Button onClick={seedAndLoad} disabled={seeding || loadingContracts} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-xs h-8 px-4 font-bold gap-1.5">
                  {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {seeding ? 'Seeding...' : 'Seed Demo Contracts'}
                </Button>
                {!contractsLoaded && <Button onClick={loadDemoContracts} disabled={loadingContracts} variant="outline" className="border-white/10 text-gray-400 text-xs h-8 px-4">
                  {loadingContracts ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Database className="w-3.5 h-3.5 mr-1" />}Load
                </Button>}
              </div>
            </div>

            {/* Workflow legend */}
            <div className="flex items-center gap-1 text-[10px] text-gray-600 font-mono">
              <span className="px-2 py-1 rounded bg-white/5 text-gray-300">Draft</span>
              <span>›</span>
              <span className="px-2 py-1 rounded bg-violet-900/30 text-violet-300">Signed</span>
              <span>›</span>
              <span className="px-2 py-1 rounded bg-yellow-900/30 text-yellow-300">Printed</span>
              <span>›</span>
              <span className="px-2 py-1 rounded bg-blue-900/30 text-blue-300">Scanned</span>
              <span>›</span>
              <span className="px-2 py-1 rounded bg-green-900/30 text-green-300">Fulfilled</span>
            </div>

            {!contractsLoaded && !loadingContracts && (
              <div className="text-center py-10 border border-dashed border-white/[0.06] rounded-xl">
                <Banknote className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-300 text-sm">Click "Seed Demo Contracts" to populate 4 Dream Palace records.</p>
              </div>
            )}
            {loadingContracts && <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-gray-600 animate-spin" /></div>}
            {contractsLoaded && demoContracts.length === 0 && (
              <div className="text-center py-10 border border-dashed border-white/[0.06] rounded-xl">
                <Database className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-300 text-sm">No demo contracts found. Click "Seed Demo Contracts".</p>
              </div>
            )}

            {demoContracts.map(c => (
              <div key={c.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-black text-white">{c.customer_name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{c.contract_id}</div>
                    {c.demo_label && <div className="text-[10px] text-blue-300 italic mt-0.5">{c.demo_label}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-black">${(c.grand_total || c.contract_amount || 0).toFixed(2)}</div>
                    <div className="text-[10px] text-gray-400">{c.payment_method}</div>
                  </div>
                </div>

                {/* Progress trail */}
                <div className="flex items-center gap-1 text-[9px] font-mono">
                  {['Draft','Signed','Printed','Scanned','Fulfilled'].map((step, i) => {
                    const reached =
                      step === 'Draft' ||
                      (step === 'Signed' && (c.is_signed || c.status !== 'draft')) ||
                      (step === 'Printed' && c.is_printed) ||
                      (step === 'Scanned' && (c.scan_status === 'SCANNED' || c.scan_status === 'VERIFIED')) ||
                      (step === 'Fulfilled' && c.status === 'fulfilled');
                    return (
                      <React.Fragment key={step}>
                        <span className={`px-1.5 py-0.5 rounded whitespace-nowrap ${reached ? 'bg-white/10 text-white' : 'text-gray-700'}`}>{step}</span>
                        {i < 4 && <span className="text-gray-700">›</span>}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap">
                  {!c.is_signed && c.status === 'draft' && (
                    <button onClick={() => advanceWorkflow(c, 'sign')} disabled={workflowLoading}
                      className="text-[11px] px-3 py-1.5 rounded-lg border border-violet-500/40 bg-violet-500/15 text-violet-300 font-bold hover:bg-violet-500/25 transition-colors">
                      ✍️ Step 1: Customer Signs
                    </button>
                  )}
                  {c.is_signed && !c.is_printed && (
                    <button onClick={() => advanceWorkflow(c, 'print')} disabled={workflowLoading}
                      className="text-[11px] px-3 py-1.5 rounded-lg border border-yellow-500/40 bg-yellow-500/15 text-yellow-300 font-bold hover:bg-yellow-500/25 transition-colors">
                      🖨️ Step 2: Print Contract
                    </button>
                  )}
                  {c.is_printed && c.scan_status === 'PENDING' && (
                    <button onClick={() => advanceWorkflow(c, 'scan')} disabled={workflowLoading}
                      className="text-[11px] px-3 py-1.5 rounded-lg border border-blue-500/40 bg-blue-500/15 text-blue-300 font-bold hover:bg-blue-500/25 transition-colors">
                      📷 Step 3: Scan Hardcopy Back
                    </button>
                  )}
                  {c.scan_status === 'SCANNED' && <span className="text-[11px] px-3 py-1.5 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 font-bold">✅ Complete</span>}
                  {c.status === 'fulfilled' && <span className="text-[11px] px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold">✅ Fulfilled</span>}
                </div>
              </div>
            ))}


          </div>
        );

      case "overview":
        return (
          <div className="space-y-4">
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-400/80">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Sandbox Mode — All data is mock/demo only. No real transactions, contracts, or payroll records are created.</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Active Staff", value: "3", color: "text-cyan-400", icon: Users },
                { label: "Tonight Revenue", value: "$1,500", color: "text-green-400", icon: DollarSign },
                { label: "VIP Rooms Active", value: "2/4", color: "text-pink-400", icon: Crown },
                { label: "On Clock", value: "5", color: "text-violet-400", icon: Clock },
              ].map(({ label, value, color, icon: Icon }) => (
                <Card key={label} className="bg-gray-900/50 border-white/[0.06]">
                  <CardContent className="p-4">
                    <Icon className={`w-5 h-5 ${color} mb-1`} />
                    <div className={`text-xl font-black ${color}`}>{value}</div>
                    <div className="text-[11px] text-gray-500">{label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-gray-900/50 border-white/[0.06]">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400">Sandbox Workflows Available</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { label: "Hardware Test", section: "hardware" },
                  { label: "POS Transaction", section: "pos" },
                  { label: "Dream Dollar Flow", section: "dreamdollar" },
                  { label: "Staff Clock-In", section: "staff" },
                  { label: "Entertainer Check-In", section: "entertainers" },
                  { label: "Payroll Review", section: "payroll" },
                ].map(w => (
                  <button
                    key={w.label}
                    onClick={() => setActiveSection(w.section)}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-violet-500/30 text-left transition-all"
                  >
                    <Play className="w-3 h-3 text-violet-400 flex-shrink-0" />
                    <span className="text-xs text-gray-300">{w.label}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        );

      case "pos":
        return (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">Demo POS — Tap items to add to cart, then complete the sale.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "Cover Charge", price: 20 },
                { label: "Bottle Service", price: 320 },
                { label: "VIP Package", price: 450 },
                { label: "Dream Dollars $100", price: 130 },
                { label: "Cocktail", price: 18 },
                { label: "Champagne", price: 85 },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => addItem(item)}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-cyan-500/30 active:scale-95 transition-all text-center"
                >
                  <div className="text-sm font-bold text-white">{item.label}</div>
                  <div className="text-green-400 font-black text-lg">{fmt(item.price)}</div>
                </button>
              ))}
            </div>
            <div className="bg-black/40 border border-white/[0.08] rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-2">Cart ({cart.length} items)</div>
              {cart.length === 0 ? <p className="text-gray-600 text-sm">Empty</p> : (
                <div className="space-y-1 mb-3">
                  {cart.map(i => <div key={i.id} className="flex justify-between text-sm"><span className="text-gray-300">{i.label}</span><span className="text-green-400 font-mono">{fmt(i.price)}</span></div>)}
                  <div className="border-t border-white/[0.08] pt-2 flex justify-between font-black"><span className="text-white">Total</span><span className="text-green-400 text-xl font-mono">{fmt(total)}</span></div>
                </div>
              )}
              <Button onClick={completeSale} disabled={cart.length === 0} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 font-black h-12">
                Complete Sale
              </Button>
              {lastTx && (
                <div className="mt-3 bg-green-500/5 border border-green-500/20 rounded-lg p-3 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-green-400 inline mr-1" />
                  Sale complete: <span className="text-green-400 font-bold">{fmt(lastTx.total)}</span> — {lastTx.time}
                </div>
              )}
            </div>
            {MOCK_TRANSACTIONS.map(t => (
              <div key={t.id} className="flex justify-between items-center p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] text-sm">
                <div><div className="text-white font-medium">{t.items}</div><div className="text-gray-600 text-xs">{t.time} · {t.method}</div></div>
                <div className="text-green-400 font-black font-mono">{fmt(t.amount)}</div>
              </div>
            ))}
          </div>
        );

      case "staff":
        return (
          <div className="space-y-4">
            <p className="text-xs text-gray-300">Demo staff and clock-in status. In production, staff enter a PIN to clock in/out.</p>
            {MOCK_USERS.map(u => (
              <div key={u.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center font-black text-white">{u.name[0]}</div>
                <div className="flex-1">
                   <div className="font-bold text-white">{u.name}</div>
                   <div className="text-xs text-gray-400">{u.email}</div>
                 </div>
                <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">{u.role}</Badge>
              </div>
            ))}
            <div className="mt-4">
              <p className="text-xs text-gray-300 mb-2">Active Shifts</p>
              {MOCK_SHIFTS.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 mb-2 rounded-lg bg-green-500/5 border border-green-500/20">
                   <div><div className="font-bold text-white text-sm">{s.name}</div><div className="text-xs text-gray-400">In since {s.in}</div></div>
                  <div className="text-green-400 font-mono text-sm font-bold">{s.duration}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case "entertainers":
        return (
          <div className="space-y-3">
            <p className="text-xs text-gray-300">Demo entertainer dashboard. Shows check-in status, earnings, and VIP sessions.</p>
            {MOCK_ENTERTAINERS.map(e => (
              <div key={e.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-black text-white text-base">{e.name}</div>
                    <div className="text-xs text-gray-400">{e.legal}</div>
                  </div>
                  <Badge className={STATUS_BADGE[e.status]}>{e.status.replace("_", " ")}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-black/30 rounded-lg p-2 text-center"><div className="text-green-400 font-black">{fmt(e.earnings)}</div><div className="text-[10px] text-gray-600">Earnings</div></div>
                  <div className="bg-black/30 rounded-lg p-2 text-center"><div className="text-pink-400 font-black">{e.vip}</div><div className="text-[10px] text-gray-600">VIP Sessions</div></div>
                </div>
              </div>
            ))}
          </div>
        );

      case "contracts":
        return (
          <div className="space-y-4">
            {/* Header + seed button */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-black text-white text-sm">Dream Palace — Contract Workflow</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Live demo records showing full lifecycle: Draft → Signed → Printed → Scanned → Fulfilled</div>
              </div>
              <div className="flex gap-2">
                {contractsLoaded && (
                  <button onClick={loadDemoContracts} disabled={loadingContracts} className="p-1.5 rounded-lg border border-white/10 text-gray-500 hover:text-white transition-colors">
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingContracts ? 'animate-spin' : ''}`} />
                  </button>
                )}
                <Button
                  onClick={seedAndLoad}
                  disabled={seeding || loadingContracts}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-xs h-8 px-4 font-bold gap-1.5"
                >
                  {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {seeding ? 'Seeding...' : 'Seed Demo Data'}
                </Button>
                {!contractsLoaded && (
                  <Button
                    onClick={loadDemoContracts}
                    disabled={loadingContracts}
                    variant="outline"
                    className="border-white/10 text-gray-400 text-xs h-8 px-4 gap-1.5"
                  >
                    {loadingContracts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                    Load Contracts
                  </Button>
                )}
              </div>
            </div>

            {/* Workflow legend */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Draft', color: 'text-gray-400 border-gray-700 bg-gray-800/30' },
                { label: 'Signed → Print', color: 'text-yellow-400 border-yellow-700 bg-yellow-900/20' },
                { label: 'Printed → Scan', color: 'text-blue-400 border-blue-700 bg-blue-900/20' },
                { label: 'Fulfilled', color: 'text-green-400 border-green-700 bg-green-900/20' },
              ].map(s => (
                <div key={s.label} className={`border rounded-lg p-1.5 text-center text-[9px] font-bold uppercase tracking-wide ${s.color}`}>{s.label}</div>
              ))}
            </div>

            {/* Empty state */}
            {contractsLoaded && demoContracts.length === 0 && (
              <div className="text-center py-10 border border-dashed border-white/[0.06] rounded-xl">
                <Database className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-300 text-sm">No demo contracts found.</p>
                <p className="text-gray-400 text-xs mt-1">Click "Seed Demo Data" to populate Dream Palace contracts.</p>
              </div>
            )}

            {!contractsLoaded && !loadingContracts && (
              <div className="text-center py-10 border border-dashed border-white/[0.06] rounded-xl">
                <FileText className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-300 text-sm">Click "Load Contracts" or "Seed Demo Data" to begin.</p>
              </div>
            )}

            {loadingContracts && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
              </div>
            )}

            {/* Workflow overlay — Print */}
            {workflowStep === 'print' && workflowContract && (
              <div className="fixed inset-0 z-[9999] bg-black/90 overflow-y-auto">
                <div className="max-w-3xl mx-auto p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-black text-white">Step 2: Print Contract</div>
                      <div className="text-xs text-gray-400">{workflowContract.customer_name}</div>
                    </div>
                    <button onClick={() => { setWorkflowStep(null); setWorkflowContract(null); }} className="text-gray-400 hover:text-white text-xs border border-white/10 rounded-lg px-3 py-1.5">✕ Cancel</button>
                  </div>
                  <VenuePrintLayout
                    venue={DEMO_VENUE}
                    contractInstance={workflowContract}
                    lineItems={[]}
                    operator={DEMO_OPERATOR}
                    onPrintComplete={handlePrintComplete}
                  />
                </div>
              </div>
            )}

            {/* Workflow overlay — Scan Back */}
            {workflowStep === 'scan' && workflowContract && (
              <div className="fixed inset-0 z-[9999] bg-black/90 overflow-y-auto">
                <div className="max-w-xl mx-auto p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-black text-white">Step 3: Scan Hardcopy Back</div>
                      <div className="text-xs text-gray-400">{workflowContract.customer_name}</div>
                    </div>
                    <button onClick={() => { setWorkflowStep(null); setWorkflowContract(null); }} className="text-gray-400 hover:text-white text-xs border border-white/10 rounded-lg px-3 py-1.5">✕ Cancel</button>
                  </div>
                  <ContractScanBack
                    contractInstance={workflowContract}
                    operator={DEMO_OPERATOR}
                    venue={DEMO_VENUE}
                    onScanComplete={handleScanComplete}
                  />
                </div>
              </div>
            )}

            {/* Contract cards */}
            {demoContracts.map(c => {
              const scanBadge = c.scan_status === 'SCANNED' ? 'text-green-400 border-green-700 bg-green-900/20'
                : c.scan_status === 'VERIFIED' ? 'text-emerald-400 border-emerald-600 bg-emerald-900/20'
                : 'text-yellow-400 border-yellow-700 bg-yellow-900/20';
              const statusBadge = c.status === 'fulfilled' ? STATUS_BADGE.paid
                : c.status === 'active' ? STATUS_BADGE.issued
                : c.status === 'draft' ? STATUS_BADGE.draft
                : STATUS_BADGE.signed;

              return (
                <div key={c.id} className={`rounded-xl border p-4 space-y-3 transition-all ${
                  selectedContract?.id === c.id ? 'border-violet-500/40 bg-violet-500/5' : 'border-white/[0.07] bg-white/[0.02]'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-black text-white">{c.customer_name}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{c.contract_id}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${statusBadge}`}>{c.status?.toUpperCase()}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${scanBadge}`}>{c.scan_status}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div className="bg-black/30 rounded-lg p-2">
                      <div className="text-gray-500">Amount</div>
                      <div className="text-green-400 font-black text-sm mt-0.5">{fmt(c.contract_amount || 0)}</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2">
                      <div className="text-gray-500">GB Issued</div>
                      <div className="text-cyan-400 font-black text-sm mt-0.5">{fmt(c.glyphbucks_issued || 0)}</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2">
                      <div className="text-gray-500">Payment</div>
                      <div className="text-white font-bold text-[11px] mt-0.5">{c.payment_method}</div>
                    </div>
                  </div>

                  {c.notes && (
                    <div className="text-[10px] text-blue-400/70 italic border-l-2 border-blue-700 pl-2">{c.notes}</div>
                  )}

                  {/* Workflow progress bar */}
                  <div className="flex items-center gap-1 text-[9px] font-mono overflow-x-auto pb-1">
                    {['Draft','Signed','Printed','Scanned','Fulfilled'].map((step, i) => {
                      const reached =
                        (step === 'Draft') ||
                        (step === 'Signed' && (c.is_signed || c.status !== 'draft')) ||
                        (step === 'Printed' && c.is_printed) ||
                        (step === 'Scanned' && (c.scan_status === 'SCANNED' || c.scan_status === 'VERIFIED')) ||
                        (step === 'Fulfilled' && c.status === 'fulfilled');
                      return (
                        <React.Fragment key={step}>
                          <span className={`px-1.5 py-0.5 rounded whitespace-nowrap ${reached ? 'text-white bg-white/10' : 'text-gray-700'}`}>{step}</span>
                          {i < 4 && <span className="text-gray-700">›</span>}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {!c.is_signed && c.status === 'draft' && (
                      <button onClick={() => advanceWorkflow(c, 'sign')} disabled={workflowLoading}
                        className="text-[11px] px-3 py-1.5 rounded-lg border border-violet-500/40 bg-violet-500/15 text-violet-300 font-bold hover:bg-violet-500/25 transition-colors">
                        ✍️ Step 1: Sign Contract
                      </button>
                    )}
                    {c.is_signed && !c.is_printed && (
                      <button onClick={() => advanceWorkflow(c, 'print')} disabled={workflowLoading}
                        className="text-[11px] px-3 py-1.5 rounded-lg border border-yellow-500/40 bg-yellow-500/15 text-yellow-300 font-bold hover:bg-yellow-500/25 transition-colors">
                        🖨️ Step 2: Print Contract
                      </button>
                    )}
                    {c.is_printed && c.scan_status === 'PENDING' && (
                      <button onClick={() => advanceWorkflow(c, 'scan')} disabled={workflowLoading}
                        className="text-[11px] px-3 py-1.5 rounded-lg border border-blue-500/40 bg-blue-500/15 text-blue-300 font-bold hover:bg-blue-500/25 transition-colors">
                        📷 Step 3: Scan Hardcopy Back
                      </button>
                    )}
                    {c.scan_status === 'SCANNED' && (
                      <span className="text-[11px] px-3 py-1.5 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 font-bold">✅ Workflow Complete</span>
                    )}
                    {c.status === 'fulfilled' && (
                      <span className="text-[11px] px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold">✅ Fulfilled</span>
                    )}
                    <button
                      onClick={() => setSelectedContract(selectedContract?.id === c.id ? null : c)}
                      className="text-[10px] px-2.5 py-1 rounded-lg border border-white/10 text-gray-500 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      {selectedContract?.id === c.id ? 'Hide' : 'Details'}
                    </button>
                  </div>

                  {selectedContract?.id === c.id && (
                    <div className="bg-black/40 border border-white/[0.05] rounded-lg p-3 text-[10px] space-y-1 font-mono">
                      <div className="text-gray-500 uppercase tracking-widest mb-2">Record Detail</div>
                      {[
                        ['Customer', c.customer_name],
                        ['ID #', c.customer_id_number || '—'],
                        ['Card Last 4', c.card_last_four || '—'],
                        ['Approval', c.approval_code || '—'],
                        ['Signed At', c.signed_at ? new Date(c.signed_at).toLocaleString() : '—'],
                        ['Scanned At', c.scanned_at ? new Date(c.scanned_at).toLocaleString() : '—'],
                        ['Scanned By', c.scanned_by || '—'],
                        ['IP Address', c.ip_address || '—'],
                      ].map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-gray-600 w-24 flex-shrink-0">{k}:</span>
                          <span className="text-gray-300">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      case "zreport":
        return (
          <div className="space-y-4">
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3 text-xs text-cyan-300">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" />
                <span className="font-bold">END-OF-NIGHT Z-REPORT</span>
              </div>
              <p>Comprehensive daily close summarizing all sales sources: Dream Dollar contracts, POS transactions, VIP room revenue, and GlyphBucks ledger. Ready to print.</p>
            </div>

            <button
              onClick={loadZReportData}
              disabled={loadingZReport || zReportPrinting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black hover:from-cyan-500 hover:to-blue-500 transition-colors"
            >
              {loadingZReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {loadingZReport ? 'Loading...' : 'Load Today\'s Sales Data'}
            </button>

            {zReportData && (
              <div className="grid md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.07]">
                  <div className="text-gray-500 text-xs mb-1">Dream Dollar</div>
                  <div className="text-green-400 font-black text-lg">${(zReportData.contracts || []).reduce((s, c) => s + (c.grand_total || c.contract_amount || 0), 0).toFixed(2)}</div>
                  <div className="text-[10px] text-gray-600 mt-1">{(zReportData.contracts || []).length} contracts</div>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.07]">
                  <div className="text-gray-500 text-xs mb-1">POS Sales</div>
                  <div className="text-blue-400 font-black text-lg">${(zReportData.posTransactions || []).reduce((s, t) => s + (t.total || 0), 0).toFixed(2)}</div>
                  <div className="text-[10px] text-gray-600 mt-1">{(zReportData.posTransactions || []).length} transactions</div>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.07]">
                  <div className="text-gray-500 text-xs mb-1">VIP Revenue</div>
                  <div className="text-pink-400 font-black text-lg">${(zReportData.vipSessions || []).reduce((s, v) => s + (v.total_charge || 0), 0).toFixed(2)}</div>
                  <div className="text-[10px] text-gray-600 mt-1">{(zReportData.vipSessions || []).length} sessions</div>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.07]">
                  <div className="text-gray-500 text-xs mb-1">GB Orders</div>
                  <div className="text-amber-400 font-black text-lg">${(zReportData.gbOrders || []).reduce((s, o) => s + (o.grand_total || 0), 0).toFixed(2)}</div>
                  <div className="text-[10px] text-gray-600 mt-1">{(zReportData.gbOrders || []).length} orders</div>
                </div>
              </div>
            )}

            {zReportData && (
              <button
                onClick={() => printDemoZReport(zReportData)}
                disabled={zReportPrinting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-black text-lg hover:from-green-500 hover:to-emerald-500 transition-colors"
              >
                <Printer className="w-5 h-5" />
                {zReportPrinting ? 'Generating...' : '🖨️ Print Z-Report'}
              </button>
            )}

            {!zReportData && !loadingZReport && (
              <div className="text-center py-12 border border-dashed border-white/[0.06] rounded-xl">
                <FileText className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-300 text-sm">Click above to load today's sales data from all sources.</p>
              </div>
            )}
          </div>
        );

      case "payroll":
        return (
          <div className="space-y-3">
            <p className="text-xs text-gray-300">Demo payroll records. Manager can approve and mark as paid.</p>
            {MOCK_PAYROLL.map(p => (
              <div key={p.name} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                <div className="flex items-center justify-between mb-2">
                  <div><div className="font-bold text-white">{p.name}</div><div className="text-xs text-gray-500">{p.period}</div></div>
                  <Badge className={STATUS_BADGE[p.status]}>{p.status}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center"><div className="text-cyan-400 font-black text-sm">{fmt(p.gross)}</div><div className="text-[10px] text-gray-600">Gross</div></div>
                  <div className="text-center"><div className="text-red-400 font-black text-sm">-{fmt(p.deductions)}</div><div className="text-[10px] text-gray-600">Deductions</div></div>
                  <div className="text-center"><div className="text-green-400 font-black text-sm">{fmt(p.net)}</div><div className="text-[10px] text-gray-600">Net Pay</div></div>
                </div>
                {p.status === "draft" && (
                  <Button size="sm" className="mt-3 text-xs h-7 w-full bg-blue-600/20 border border-blue-500/30 text-blue-400">Approve Payroll</Button>
                )}
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Demo Receipt Modal */}
      {showReceipt && currentTransaction && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-black border-2 border-violet-500/50 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Demo Receipt Preview</h2>
              <Button onClick={() => setShowReceipt(false)} variant="ghost" size="sm">Close</Button>
            </div>
            <ClubCurrencyReceiptEngine 
              transaction={currentTransaction.transaction}
              batch={currentTransaction.batch}
              onPrint={() => setShowReceipt(false)}
            />
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-white/[0.06] p-4 bg-black/95 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/NUPSGateway")} className="text-gray-600 hover:text-gray-400">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <FlaskConical className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="font-bold text-white text-sm">N.U.P.S. Sandbox</div>
              <div className="text-[10px] text-emerald-400">Demo Mode — No real data</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">SANDBOX</Badge>
            <button
              onClick={handleResetDemo}
              disabled={resetting}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-medium hover:bg-violet-500/20 transition-colors disabled:opacity-50"
              title="Seed test database with demo data"
            >
              {resetting ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              {resetting ? "Seeding..." : resetDone ? "✓ Seeded" : "Reset Demo"}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 flex gap-4">
        {/* Sidebar nav */}
        <div className="w-36 flex-shrink-0">
          <div className="space-y-1 sticky top-20">
            {SECTIONS.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all text-xs font-medium ${
                    activeSection === s.key
                      ? "bg-violet-500/15 text-violet-400 border border-violet-500/20"
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 py-1">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}