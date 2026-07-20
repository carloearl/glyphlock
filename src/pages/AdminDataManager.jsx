/**
 * Admin Data Manager — full in-app admin control over NUPS records.
 *
 * Owner directive 2026-07-20: admins must never need the Base44 dashboard
 * for routine record actions. Browse, search, delete (with confirm), and
 * one-click demo purge across every operational entity, right here.
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";
import RoleClassGuard from "@/components/nups/RoleClassGuard";
import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";
import DataManagerTable from "@/components/admin/DataManagerTable";

const ENTITY_REGISTRY = [
  {
    group: "People",
    entities: [
      { name: "VIPGuest", label: "Guests", fields: [
        { key: "full_name", label: "Name" }, { key: "tier", label: "Tier" },
        { key: "status", label: "Status" }, { key: "id_number", label: "ID #" },
        { key: "visit_count", label: "Visits" }, { key: "total_spend_lifetime", label: "Lifetime $" },
        { key: "created_date", label: "Created" },
      ]},
      { name: "Entertainer", label: "Entertainers", fields: [
        { key: "stage_name", label: "Stage Name" }, { key: "legal_name", label: "Legal Name" },
        { key: "status", label: "Status" }, { key: "contract_status", label: "Contract" },
        { key: "venue_id", label: "Venue" }, { key: "created_date", label: "Created" },
      ]},
      { name: "NUPSUser", label: "Staff Accounts", fields: [
        { key: "full_name", label: "Name" }, { key: "username", label: "Username" },
        { key: "role", label: "Role" }, { key: "status", label: "Status" },
        { key: "venue_id", label: "Venue" }, { key: "created_date", label: "Created" },
      ]},
      { name: "DriverProfile", label: "Drivers", fields: [
        { key: "driver_name", label: "Name" }, { key: "phone", label: "Phone" },
        { key: "status", label: "Status" }, { key: "created_date", label: "Created" },
      ]},
    ],
  },
  {
    group: "Shifts & Attendance",
    entities: [
      { name: "EntertainerShift", label: "Entertainer Shifts", fields: [
        { key: "entertainer_id", label: "Entertainer" }, { key: "status", label: "Status" },
        { key: "check_in_time", label: "Check In" }, { key: "check_out_time", label: "Check Out" },
        { key: "shift_earnings", label: "Earnings" }, { key: "venue_id", label: "Venue" },
      ]},
      { name: "StaffShift", label: "Staff Shifts", fields: [
        { key: "staff_name", label: "Staff" }, { key: "status", label: "Status" },
        { key: "clock_in_time", label: "Clock In" }, { key: "clock_out_time", label: "Clock Out" },
        { key: "venue_id", label: "Venue" },
      ]},
    ],
  },
  {
    group: "Financial",
    entities: [
      { name: "POSTransaction", label: "Transactions", fields: [
        { key: "transaction_id", label: "Txn ID" }, { key: "total", label: "Total" },
        { key: "payment_method", label: "Method" }, { key: "cashier", label: "Cashier" },
        { key: "mode", label: "Mode" }, { key: "created_date", label: "Date" },
      ]},
      { name: "POSBatch", label: "Batches", fields: [
        { key: "batch_id", label: "Batch" }, { key: "status", label: "Status" },
        { key: "cashier", label: "Cashier" }, { key: "opening_cash", label: "Opening" },
        { key: "total_sales", label: "Sales" }, { key: "created_date", label: "Opened" },
      ]},
      { name: "DriverPayout", label: "Driver Payouts", fields: [
        { key: "driver_name", label: "Driver" }, { key: "status", label: "Status" },
        { key: "payout_amount", label: "Amount" }, { key: "mode", label: "Mode" },
        { key: "created_date", label: "Date" },
      ]},
    ],
  },
  {
    group: "VIP",
    entities: [
      { name: "VIPContract", label: "VIP Contracts", fields: [
        { key: "contract_id", label: "Contract" }, { key: "guest_name", label: "Guest" },
        { key: "entertainer_stage_name", label: "Entertainer" }, { key: "status", label: "Status" },
        { key: "final_amount", label: "Amount" }, { key: "mode", label: "Mode" },
      ]},
      { name: "VIPRoom", label: "VIP Rooms", fields: [
        { key: "room_name", label: "Room" }, { key: "status", label: "Status" },
        { key: "guest_name", label: "Guest" }, { key: "rate_per_hour", label: "Rate/hr" },
      ]},
      { name: "VIPSession", label: "VIP Sessions", fields: [
        { key: "session_ref", label: "Session" }, { key: "status", label: "Status" },
        { key: "room_id", label: "Room" }, { key: "actual_start", label: "Start" },
        { key: "mode", label: "Mode" },
      ]},
    ],
  },
];

const ALL_ENTITIES = ENTITY_REGISTRY.flatMap((g) => g.entities);

function AdminDataManagerContent() {
  const [selected, setSelected] = useState(ALL_ENTITIES[0].name);
  const entity = ALL_ENTITIES.find((e) => e.name === selected);

  return (
    <NUPSAppShell
      title="Data Manager"
      subtitle="Full admin record control — browse, search, delete. No dashboard required."
      role="ADMIN"
    >
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
          {/* Entity picker */}
          <aside className="space-y-4">
            {ENTITY_REGISTRY.map((group) => (
              <div key={group.group}>
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-600 mb-1.5 px-1">
                  {group.group}
                </div>
                <div className="space-y-1">
                  {group.entities.map((e) => (
                    <button
                      key={e.name}
                      onClick={() => setSelected(e.name)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors min-h-[40px] ${
                        selected === e.name
                          ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold"
                          : "text-slate-400 hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </aside>

          {/* Records */}
          <Card className="bg-slate-900/40 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                {entity.label}
                <span className="text-xs font-mono text-slate-600 font-normal">({entity.name})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataManagerTable key={entity.name} entityName={entity.name} fields={entity.fields} />
            </CardContent>
          </Card>
        </div>
      </main>
    </NUPSAppShell>
  );
}

export default function AdminDataManager() {
  return (
    <RoleClassGuard allow={["ADMIN"]}>
      <AdminDataManagerContent />
    </RoleClassGuard>
  );
}