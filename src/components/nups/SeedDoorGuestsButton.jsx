import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { UserPlus, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

/**
 * SeedDoorGuestsButton
 * ────────────────────
 * One-tap demo seeder for door-checked-in guests so the VIP contract
 * flow has guests ready to attach (no need to manually run the check-in
 * form during a walkthrough).
 *
 * Creates 3 fully-populated VIPGuest records:
 *   • Robert Spender    — gold-tier regular   (high_roller pricing)
 *   • Anthony Platinum  — whale-tier VIP      ($1k+ minimum spend)
 *   • James Walker      — standard new guest  (entry-level VIP)
 *
 * All marked status='in_building' with verified IDs so they appear in
 * the GuestCheckIn roster and are selectable when generating a VIP
 * contract.
 *
 * Safe to click multiple times — checks for existing by name+phone and
 * only inserts what's missing. No production-data risk: the records are
 * tagged with notes='DEMO_DOOR_SEED' for easy cleanup.
 */
const DEMO_GUESTS = [
  {
    guest_name: "Robert Spender",
    date_of_birth: "1985-06-15",
    phone: "555-2001",
    government_id_type: "Drivers License",
    government_id_number: "AZ-DL-1234567",
    government_id_state: "AZ",
    tier_hint: "high_roller",
  },
  {
    guest_name: "Anthony Platinum",
    date_of_birth: "1980-09-30",
    phone: "555-2004",
    government_id_type: "Drivers License",
    government_id_number: "AZ-DL-7654321",
    government_id_state: "AZ",
    tier_hint: "whale",
  },
  {
    guest_name: "James Walker",
    date_of_birth: "1990-11-22",
    phone: "555-2099",
    government_id_type: "State ID",
    government_id_number: "AZ-ID-9988776",
    government_id_state: "AZ",
    tier_hint: "standard",
  },
];

export default function SeedDoorGuestsButton({ variant = "default", className = "" }) {
  const [busy, setBusy] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const qc = useQueryClient();

  const handleSeed = async () => {
    if (busy) return;
    setBusy(true);
    setDoneCount(0);
    try {
      // Pull all in-building guests once so we don't dupe by name
      const existing = await base44.entities.VIPGuest.list("-created_date", 200);
      const have = new Set(
        existing
          .filter((g) => g.status === "in_building")
          .map((g) => `${(g.guest_name || "").toLowerCase()}|${g.phone || ""}`)
      );

      let created = 0;
      for (const g of DEMO_GUESTS) {
        const key = `${g.guest_name.toLowerCase()}|${g.phone}`;
        if (have.has(key)) continue;
        await base44.entities.VIPGuest.create({
          guest_name: g.guest_name,
          date_of_birth: g.date_of_birth,
          phone: g.phone,
          government_id_type: g.government_id_type,
          government_id_number: g.government_id_number,
          government_id_state: g.government_id_state,
          status: "in_building",
          check_in_time: new Date().toISOString(),
          verification_status: "verified",
          id_verified: true,
          id_verified_at: new Date().toISOString(),
          current_location: "Main Floor",
          notes: `DEMO_DOOR_SEED · tier:${g.tier_hint}`,
        });
        created += 1;
      }
      setDoneCount(created);

      // Refresh every panel that lists in-building guests
      qc.invalidateQueries({ queryKey: ["vip-guests-active"] });
      qc.invalidateQueries({ queryKey: ["vip-guests"] });
      qc.invalidateQueries({ queryKey: ["readiness-batch"] });

      if (created === 0) {
        toast.info("All 3 demo guests are already checked in.");
      } else {
        toast.success(`✓ ${created} demo guest${created === 1 ? "" : "s"} checked in at the door`);
      }
    } catch (e) {
      toast.error(`Seed failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
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
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Seeding door guests…
        </>
      ) : doneCount > 0 ? (
        <>
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-300" /> Seeded · re-run to top up
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-2" /> Seed Door Guests (Demo)
        </>
      )}
    </Button>
  );
}