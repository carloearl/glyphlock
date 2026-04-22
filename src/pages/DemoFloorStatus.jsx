/**
 * DemoFloorStatus — /demo/floor-status
 * Seeded read-only demo view. Stub acceptable per spec.
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import DemoShell from "@/components/demo/DemoShell";
import { ArrowLeft, Users } from "lucide-react";

const SEED_ZONES = [
  { zone: "Main Floor", guests: 68, staff: 4, status: "Peak" },
  { zone: "VIP Lounge", guests: 22, staff: 3, status: "Active" },
  { zone: "Bar Front", guests: 19, staff: 2, status: "Active" },
  { zone: "Patio", guests: 11, staff: 1, status: "Light" },
];

export default function DemoFloorStatus() {
  const navigate = useNavigate();
  return (
    <DemoShell>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 24px 48px" }}>
        <button
          onClick={() => navigate("/demo/command-center")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            minHeight: 44,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            color: "#d4d4d4",
            fontSize: 13,
            cursor: "pointer",
            marginBottom: 20,
            touchAction: "manipulation",
          }}
        >
          <ArrowLeft style={{ width: 14, height: 14, pointerEvents: "none" }} />
          <span style={{ pointerEvents: "none" }}>Back to Command Center</span>
        </button>

        <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#eab308", fontWeight: 600 }}>
          Floor Status · Live
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: "6px 0 24px", color: "#fafafa" }}>
          Zone Occupancy
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {SEED_ZONES.map((z) => (
            <div
              key={z.zone}
              style={{
                padding: 20,
                background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
              }}
            >
              <div style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "#22d3ee", fontWeight: 600, marginBottom: 10 }}>
                {z.zone}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <Users style={{ width: 18, height: 18, color: "#d4d4d4" }} />
                <span style={{ fontSize: 28, fontWeight: 700, color: "#fafafa" }}>{z.guests}</span>
                <span style={{ fontSize: 13, color: "#a3a3a3" }}>guests</span>
              </div>
              <div style={{ fontSize: 13, color: "#a3a3a3" }}>
                Staff on zone: <strong style={{ color: "#fafafa" }}>{z.staff}</strong> · {z.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DemoShell>
  );
}