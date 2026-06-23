import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { UserPlus, Loader2, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";

/**
 * SeedDoorGuestsButton
 * ────────────────────
 * Full demo seeder: creates 3 VIPGuest profiles with complete credentials
 * (card info, signatures, visit history, tier) and assigns them to VIP rooms
 * with entertainers so the contract board shows a live demo.
 *
 * Also has a WIPE mode to clear all demo guests for a clean state.
 */

const now = new Date().toISOString();

const DEMO_GUESTS = [
  {
    guest_id: "demo-robert-spender-7a8b3c",
    full_name: "Robert Spender",
    date_of_birth: "1985-06-15T00:00:00.000Z",
    id_type: "Drivers License",
    id_number: "AZ-DL-1234567",
    id_state: "AZ",
    phone: "602-555-2001",
    email: "r.spender@email.com",
    card_name: "Robert J Spender",
    card_last4: "4242",
    card_exp: "09/27",
    card_type: "Visa",
    approval_code: "AUTH-992341",
    signature_data: "SIGNED-demo-robert-spender-1750000000000",
    signature_timestamp: now,
    tier: "high_roller",
    status: "in_building",
    visit_count: 14,
    total_spend_lifetime: 8400,
    vip_sessions_count: 9,
    id_verified: true,
    id_verified_at: now,
    first_visit: "2025-01-10T22:00:00.000Z",
    last_visit: now,
    notes: "DEMO_SEED · Prefers Room 2 · Usually orders bottle service",
    is_demo: true,
  },
  {
    guest_id: "demo-anthony-platinum-9c2d4e",
    full_name: "Anthony Platinum",
    date_of_birth: "1980-09-30T00:00:00.000Z",
    id_type: "Drivers License",
    id_number: "AZ-DL-7654321",
    id_state: "AZ",
    phone: "480-555-2004",
    email: "aplatinum@vmail.com",
    card_name: "Anthony M Platinum",
    card_last4: "9999",
    card_exp: "03/28",
    card_type: "Amex",
    approval_code: "AUTH-887623",
    signature_data: "SIGNED-demo-anthony-platinum-1750000000001",
    signature_timestamp: now,
    tier: "whale",
    status: "in_building",
    visit_count: 32,
    total_spend_lifetime: 54000,
    vip_sessions_count: 28,
    id_verified: true,
    id_verified_at: now,
    first_visit: "2024-08-05T23:00:00.000Z",
    last_visit: now,
    current_room_id: null, // set after room seed
    current_entertainer: "Crystal",
    notes: "DEMO_SEED · VIP whale · Always requests the Suite",
    is_demo: true,
  },
  {
    guest_id: "demo-james-walker-5e6f1a",
    full_name: "James Walker",
    date_of_birth: "1990-11-22T00:00:00.000Z",
    id_type: "State ID",
    id_number: "AZ-ID-9988776",
    id_state: "AZ",
    phone: "602-555-2099",
    email: "",
    card_name: "James Walker",
    card_last4: "1234",
    card_exp: "11/26",
    card_type: "Mastercard",
    approval_code: "AUTH-441209",
    signature_data: "SIGNED-demo-james-walker-1750000000002",
    signature_timestamp: now,
    tier: "standard",
    status: "in_building",
    visit_count: 3,
    total_spend_lifetime: 900,
    vip_sessions_count: 2,
    id_verified: true,
    id_verified_at: now,
    first_visit: "2026-04-12T21:30:00.000Z",
    last_visit: now,
    notes: "DEMO_SEED · New regular",
    is_demo: true,
  },
];

async function seedRooms(queryClient) {
  // Only create rooms if none exist
  const existing = await base44.entities.VIPRoom.list();
  if (existing.length === 0) {
    await base44.entities.VIPRoom.bulkCreate([
      { room_number: "1", room_name: "Room 1", status: "available", rate_per_hour: 300 },
      { room_number: "2", room_name: "Room 2", status: "available", rate_per_hour: 300 },
      { room_number: "3", room_name: "Room 3", status: "available", rate_per_hour: 400 },
      { room_number: "VIP", room_name: "The VIP Suite", status: "available", rate_per_hour: 600 },
    ]);
    queryClient.invalidateQueries(["vip-rooms"]);
  }
}

export default function SeedDoorGuestsButton({ variant = "default", className = "" }) {
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("idle"); // idle | done | wiped
  const qc = useQueryClient();

  const handleSeed = async () => {
    if (busy) return;
    setBusy(true);
    setMode("idle");
    try {
      // Ensure rooms exist
      await seedRooms(qc);

      // Upsert guests by guest_id
      const existing = await base44.entities.VIPGuest.list("-created_date", 300);
      const existingIds = new Set(existing.map((g) => g.guest_id));

      let created = 0;
      const createdGuests = [];

      for (const g of DEMO_GUESTS) {
        if (existingIds.has(g.guest_id)) {
          // Update existing to put them back in-building
          const found = existing.find((e) => e.guest_id === g.guest_id);
          if (found) {
            await base44.entities.VIPGuest.update(found.id, {
              status: "in_building",
              last_visit: now,
              card_last4: g.card_last4,
              card_name: g.card_name,
              card_exp: g.card_exp,
              card_type: g.card_type,
              approval_code: g.approval_code,
              signature_data: g.signature_data,
              signature_timestamp: g.signature_timestamp,
            });
            createdGuests.push({ ...g, id: found.id });
          }
        } else {
          const created_rec = await base44.entities.VIPGuest.create(g);
          createdGuests.push({ ...g, id: created_rec.id });
          created++;
        }
      }

      // Assign Anthony (whale) to VIP Suite room as a live demo session
      const rooms = await base44.entities.VIPRoom.list();
      const suite = rooms.find((r) => r.room_number === "VIP");
      const anthonyGuest = createdGuests.find((g) => g.guest_id === "demo-anthony-platinum-9c2d4e");
      if (suite && anthonyGuest) {
        await base44.entities.VIPRoom.update(suite.id, {
          status: "occupied",
          guest_name: "Anthony Platinum",
          entertainer_name: "Crystal",
          start_time: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 min ago
          rate_per_hour: 600,
          notes: "DEMO_SEED — Whale VIP session in progress",
        });
        // Link guest to room
        await base44.entities.VIPGuest.update(anthonyGuest.id, {
          current_room_id: suite.id,
          current_entertainer: "Crystal",
        });
      }

      qc.invalidateQueries(["vip-guests-active"]);
      qc.invalidateQueries(["vip-guests"]);
      qc.invalidateQueries(["vip-rooms"]);
      qc.invalidateQueries(["readiness-batch"]);

      setMode("done");
      toast.success(`Demo ready: ${DEMO_GUESTS.length} guests checked in · VIP Suite active`);
    } catch (e) {
      toast.error(`Seed failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  const handleWipe = async () => {
    if (busy) return;
    if (!window.confirm("Wipe all demo guest records?")) return;
    setBusy(true);
    try {
      const all = await base44.entities.VIPGuest.list("-created_date", 300);
      const demos = all.filter((g) => g.is_demo || (g.notes || "").includes("DEMO"));
      for (const g of demos) {
        await base44.entities.VIPGuest.delete(g.id);
      }
      // Reset any demo-seeded rooms
      const rooms = await base44.entities.VIPRoom.list();
      for (const r of rooms) {
        if ((r.notes || "").includes("DEMO_SEED")) {
          await base44.entities.VIPRoom.update(r.id, {
            status: "available",
            guest_name: null,
            entertainer_name: null,
            start_time: null,
            end_time: null,
            notes: null,
          });
        }
      }
      qc.invalidateQueries(["vip-guests-active"]);
      qc.invalidateQueries(["vip-guests"]);
      qc.invalidateQueries(["vip-rooms"]);
      setMode("wiped");
      toast.success("Demo data cleared");
    } catch (e) {
      toast.error(`Wipe failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button
        onClick={handleSeed}
        disabled={busy}
        variant={variant}
        className={`${className} ${
          variant === "default"
            ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
            : ""
        }`}
      >
        {busy ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Seeding…</>
        ) : mode === "done" ? (
          <><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-300" /> Demo Ready</>
        ) : (
          <><UserPlus className="w-4 h-4 mr-2" /> Seed Demo Guests</>
        )}
      </Button>
      {mode === "done" && (
        <Button
          onClick={handleWipe}
          disabled={busy}
          variant="outline"
          size="sm"
          className="border-red-500/40 text-red-400 hover:bg-red-500/10 h-8 px-2"
          title="Clear demo data"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}