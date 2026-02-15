import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, Clock, Wrench } from "lucide-react";

const STATUS = {
  DONE: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10 border-green-500/30", label: "Complete" },
  PARTIAL: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", label: "Partial" },
  MISSING: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", label: "Missing" },
  NEEDS_WORK: { icon: Wrench, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", label: "Needs Work" },
  PLANNED: { icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", label: "Planned" },
};

function StatusRow({ name, status, notes }) {
  const s = STATUS[status];
  const Icon = s.icon;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${s.bg}`}>
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${s.color}`} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white text-sm">{name}</span>
          <Badge className={`text-[10px] ${s.bg} ${s.color}`}>{s.label}</Badge>
        </div>
        {notes && <p className="text-xs text-gray-400 mt-1">{notes}</p>}
      </div>
    </div>
  );
}

export default function NUPSReport() {
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            N.U.P.S. System Status Report
          </h1>
          <p className="text-gray-400 mt-2">Post-Fix Audit — {new Date().toLocaleDateString()}</p>
        </div>

        {/* LOGIN & AUTH */}
        <Card className="bg-gray-900/60 border-cyan-500/30">
          <CardHeader><CardTitle className="text-cyan-400">Login & Authentication</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <StatusRow name="NUPSLogin page" status="DONE" notes="Redirects admin → NUPSOwner, staff → NUPSStaff after Base44 auth." />
            <StatusRow name="Role-based routing" status="DONE" notes="Admin goes to owner dashboard, non-admin goes to staff dashboard." />
            <StatusRow name="Staff clickwrap before login" status="NEEDS_WORK" notes="Currently no clickwrap/agreement shown before staff can log in. Needs a pre-login agreement step for staff and entertainer terms." />
            <StatusRow name="Entertainer clickwrap contract" status="DONE" notes="EntertainerContract component exists with 10-term clickwrap, digital signature, IP logging. Available on owner dashboard." />
            <StatusRow name="Admin-only entertainer onboarding" status="DONE" notes="Entertainer contract button is on owner dashboard header only." />
          </CardContent>
        </Card>

        {/* POS SYSTEM */}
        <Card className="bg-gray-900/60 border-green-500/30">
          <CardHeader><CardTitle className="text-green-400">POS Cash Register</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <StatusRow name="POS Cash Register" status="DONE" notes="Full cart, product search, checkout flow, multiple payment methods, receipt printing." />
            <StatusRow name="Batch Management" status="DONE" notes="Open/close batches, cash reconciliation, linked to transactions." />
            <StatusRow name="Transaction History" status="DONE" notes="Shows all transactions with receipt reprint." />
            <StatusRow name="Z-Report Generator" status="DONE" notes="End-of-day summary report on owner dashboard." />
          </CardContent>
        </Card>

        {/* PRODUCTS & INVENTORY */}
        <Card className="bg-gray-900/60 border-yellow-500/30">
          <CardHeader><CardTitle className="text-yellow-400">Products & Inventory</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <StatusRow name="Product Management tab" status="DONE" notes="Full CRUD for POSProduct entity — name, SKU, price, cost, category, barcode, stock qty. Wired to owner dashboard." />
            <StatusRow name="Inventory Management tab" status="DONE" notes="Stock levels, low-stock alerts, batch intake, search/filter. Receives products prop from owner page." />
            <StatusRow name="Icon fix (Tags → Tag)" status="DONE" notes="Fixed broken lucide-react import that was crashing the tabs." />
          </CardContent>
        </Card>

        {/* DREAM PALACE CONTRACT */}
        <Card className="bg-gray-900/60 border-purple-500/30">
          <CardHeader><CardTitle className="text-purple-400">Dream Palace Sales Contract (NEW)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <StatusRow name="Digital version of physical contract" status="DONE" notes="6-step flow: Customer Info → Line Items → Terms & Agree → Sign & Biometrics → Staff Sign → Print & Archive. Exact reproduction of DD form v3." />
            <StatusRow name="Line items table (5 rows)" status="DONE" notes="RM#/ENT/Dur/ID, Room Fee + Product = Amount. Auto-calc." />
            <StatusRow name="Dream Dollar value + 30% surcharge" status="DONE" notes="Matches contract formula: face value + 30% processing surcharge = grand total." />
            <StatusRow name="Acknowledgments (6 checkboxes)" status="DONE" notes="All 6 acknowledgment bullets from the physical form, must all be checked." />
            <StatusRow name="Full contract terms (Sections 1-7)" status="DONE" notes="Orders, Payment, Liability, Club Currency Policy, Disputes, Miscellaneous, Currency Restrictions — verbatim from physical contract." />
            <StatusRow name="Customer signature + biometrics" status="DONE" notes="Type-to-sign, thumbprint scan, guest photo, ID front/back capture." />
            <StatusRow name="Manager + Hostess signatures" status="DONE" notes="Both must type-to-sign matching their names." />
            <StatusRow name="Print layout" status="DONE" notes="Opens print window with exact Dream Palace header format matching physical form." />
            <StatusRow name="Hardcopy rescan after print" status="DONE" notes="Photo of signed copy, barcode scan, staff logging. Saved to DreamPalaceOrder entity." />
            <StatusRow name="Club Currency print trigger" status="DONE" notes="After archive, if Dream Dollars ordered, triggers currency press switch." />
            <StatusRow name="Barcode system" status="PLANNED" notes="Order number used as barcode reference. Physical barcode labels need printer hardware integration." />
          </CardContent>
        </Card>

        {/* VIP CONTRACT */}
        <Card className="bg-gray-900/60 border-pink-500/30">
          <CardHeader><CardTitle className="text-pink-400">VIP Contract System</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <StatusRow name="VIP Contract page" status="DONE" notes="5-step: Identity → Biometrics → Contract Review → Guest Sign → Staff Sign. Token-based link generation." />
            <StatusRow name="Biometric capture" status="DONE" notes="Thumbprint, ID front/back, guest photo, all uploaded and SHA-256 hashed." />
            <StatusRow name="3-party signatures" status="DONE" notes="Guest + Host + Manager, all type-to-sign with match validation." />
            <StatusRow name="Backend signing function" status="DONE" notes="vipContractSign validates token, hashes all data, creates VIPGuest record." />
            <StatusRow name="Token generation" status="DONE" notes="vipContractGenerate creates 15-min expiring tokens, admin only." />
            <StatusRow name="Post-print hardcopy rescan" status="DONE" notes="HardcopyRescan component: photo + barcode + staff name → archived." />
            <StatusRow name="Contract archive search" status="DONE" notes="ContractSearch and ContractArchive pages exist." />
          </CardContent>
        </Card>

        {/* CLUB CURRENCY PRESS */}
        <Card className="bg-gray-900/60 border-emerald-500/30">
          <CardHeader><CardTitle className="text-emerald-400">Club Currency Press</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <StatusRow name="Voucher sheet press" status="DONE" notes="5 vouchers per sheet, crop marks, barcodes, serials, front/back/duplex modes." />
            <StatusRow name="Contract terminal" status="DONE" notes="DRAFT → SIGN → ISSUED → ARCHIVED flow with financial calc (30% fee, 50% dancer payout)." />
            <StatusRow name="AI assistant tab" status="DONE" notes="Press configuration suggestions via AI." />
            <StatusRow name="Archive search" status="DONE" notes="Search past contracts in archive." />
            <StatusRow name="Auto-print from contract" status="NEEDS_WORK" notes="Contract tab triggers press switch, but doesn't auto-set denomination to match Dream Dollar amount. Needs denomination pass-through." />
          </CardContent>
        </Card>

        {/* FLOOR & VIP */}
        <Card className="bg-gray-900/60 border-blue-500/30">
          <CardHeader><CardTitle className="text-blue-400">Floor Operations</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <StatusRow name="Live Floor View" status="DONE" notes="Real-time view of active entertainers and locations." />
            <StatusRow name="Entertainer Check-in" status="DONE" notes="Check in/out with location tracking." />
            <StatusRow name="VIP Room Management" status="DONE" notes="Room status, occupancy, session tracking." />
            <StatusRow name="Guest Tracking" status="DONE" notes="In-building guest list with VIP status." />
            <StatusRow name="Time Clock" status="DONE" notes="Clock in/out for staff with admin view of all shifts." />
          </CardContent>
        </Card>

        {/* WHAT NEEDS FIXING / ADDING */}
        <Card className="bg-gray-900/60 border-red-500/30">
          <CardHeader><CardTitle className="text-red-400">Outstanding Items</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <StatusRow name="Pre-login clickwrap for staff" status="MISSING" notes="Staff should see and agree to employment terms before first login. Not yet implemented." />
            <StatusRow name="Pre-login clickwrap for entertainers" status="MISSING" notes="Entertainers should agree to IC agreement before accessing system. Currently handled post-login by admin." />
            <StatusRow name="Currency denomination auto-set from contract" status="NEEDS_WORK" notes="When contract is archived with Dream Dollars, the press should auto-configure the correct denomination amount." />
            <StatusRow name="Physical barcode label printing" status="PLANNED" notes="Requires thermal printer integration (Zebra/DYMO). Currently uses on-screen barcode display only." />
            <StatusRow name="Entertainer login portal" status="PLANNED" notes="Separate login for entertainers to view their earnings, schedule, and cash-out requests." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}