import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Car, Plus, DollarSign, Users, CheckCircle, ChevronDown, ChevronUp, Banknote, AlertCircle, Zap, QrCode, ShieldCheck } from "lucide-react";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { loadVenueRates, computeDriverPayoutAmount } from "@/lib/nups/venueRateConfig";

// ─── DACO-20260603-FRONTDOOR-DRIVER · Part B ────────────────────────────────
// Driver payouts are DISBURSEMENTS, NOT negative revenue. This component:
//   1. Resolves venue dynamically (no "dream_palace" literal anywhere)
//   2. Loads all rates from VenueRateConfig (zero hardcoded dollars)
//   3. Onboards drivers once → DriverProfile + QR code
//   4. Scans QR to load a profile and start a nightly drop session
//   5. Writes ONLY to DriverPayout on settle — never to POSTransaction
//   6. Bumps DriverProfile.ytd_payout_total (1099 tracking)
//   7. Writes DRIVER_PAYOUT_FINALIZED audit log per posting
// total_sales is provably untouched.
// ───────────────────────────────────────────────────────────────────────────

function todayDate() { return new Date().toISOString().split("T")[0]; }
function thisYear() { return new Date().getFullYear(); }
function makeDriverId(venueId) {
  const short = (venueId || "VENUE").toString().slice(-4).toUpperCase();
  return `DRV-${short}-${Date.now().toString(36).toUpperCase()}`;
}
function makeQrToken() {
  return `DRVQR-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`.toUpperCase();
}

export default function DriverDropOffTracker({ user }) {
  const qc = useQueryClient();
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || null;

  // ─── Role split — Doorman onboards & logs drops; Door Girl pays out ─────
  const role = (user?.role || "").toUpperCase();
  const isDoorGirl = ["FLOOR_HOST", "VENUE_MANAGER", "VENUE_OWNER", "PLATFORM_ADMIN", "SOVEREIGN"].includes(role);
  const isDoorman = role === "SECURITY";

  const [rates, setRates] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [showNewDriver, setShowNewDriver] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [newDriver, setNewDriver] = useState({ name: "", phone: "", affiliated: true });
  const [guestCounter, setGuestCounter] = useState({}); // record_id -> input value

  const today = todayDate();

  // Load rates once per venue
  useEffect(() => {
    if (!venueId) return;
    loadVenueRates(venueId).then(setRates);
  }, [venueId]);

  // Tonight's open driver payout sessions for this venue
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["driver-sessions", today, venueId],
    queryFn: () => venueId
      ? base44.entities.DriverPayout.filter({ payout_date: today, venue_id: venueId })
      : Promise.resolve([]),
    enabled: !!venueId,
    refetchInterval: 30000,
  });

  // Active driver profiles for this venue (quick-pick + QR resolve)
  const { data: profiles = [] } = useQuery({
    queryKey: ["driver-profiles", venueId],
    queryFn: () => venueId
      ? base44.entities.DriverProfile.filter({ venue_id: venueId, status: "active" }, "-last_active_at", 200)
      : Promise.resolve([]),
    enabled: !!venueId,
    staleTime: 60000,
  });

  // Drivers already registered tonight (hide from quick-pick)
  const activeContractorIds = new Set(sessions.map(s => s.contractor_id).filter(Boolean));

  // ─── Onboard a brand-new driver → DriverProfile + QR ──────────────────────
  const onboardDriver = useMutation({
    mutationFn: async (data) => {
      if (!venueId) throw new Error("No active venue resolved — cannot onboard.");
      const driver_id = makeDriverId(venueId);
      const qr_code = makeQrToken();
      const profile = await base44.entities.DriverProfile.create({
        driver_id,
        venue_id: venueId,
        name: data.name,
        phone: data.phone || "",
        affiliated: !!data.affiliated,
        qr_code,
        ytd_payout_total: 0,
        ytd_year: thisYear(),
        ten99_flag: false,
        ten99_threshold: 600,
        status: "active",
        onboarded_by: user?.email || "unknown",
        last_active_at: new Date().toISOString(),
      });
      // Immediately open a session for tonight
      await openSession.mutateAsync(profile);
      return profile;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["driver-profiles"] });
      setShowNewDriver(false);
      setNewDriver({ name: "", phone: "", affiliated: true });
    },
  });

  // ─── Open a nightly session for an existing DriverProfile ─────────────────
  const openSession = useMutation({
    mutationFn: async (profile) => {
      if (!venueId) throw new Error("No active venue.");
      return base44.entities.DriverPayout.create({
        payout_id: `DPO-${profile.driver_id}-${Date.now().toString(36).toUpperCase()}`,
        contractor_id: profile.driver_id,
        contractor_name: profile.name,
        venue_id: venueId,
        payout_date: today,
        payout_type: "shift_earnings",
        bills_redeemed: [],
        total_face_value: 0,
        redemption_rate: 0,
        total_payout: 0,
        payment_method: "cash",
        status: "pending",
        tax_year: thisYear(),
        notes: JSON.stringify({
          source: "driver_drop_session",
          affiliated: !!profile.affiliated,
          guests: 0,
          rates_snapshot: rates ? {
            cover: rates.cover_charge,
            card_discount: rates.card_discount,
            per_guest_affiliated: rates.driver_payout_affiliated,
            per_guest_outside: rates.driver_payout_outside,
            mode: rates.mode,
          } : null,
          drops: [],
        }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["driver-sessions"] }),
  });

  // ─── Scan QR → resolve DriverProfile → open or focus session ──────────────
  const handleScan = async () => {
    const token = scanInput.trim();
    if (!token) return;
    const matches = profiles.filter(p => p.qr_code === token);
    const profile = matches[0];
    if (!profile) {
      alert("QR not recognized for this venue.");
      return;
    }
    const existing = sessions.find(s => s.contractor_id === profile.driver_id);
    if (existing) {
      setExpanded(existing.id);
    } else {
      await openSession.mutateAsync(profile);
    }
    setShowScanner(false);
    setScanInput("");
  };

  // ─── Log guest count on an open session ──────────────────────────────────
  const logGuests = useMutation({
    mutationFn: async ({ session, guests }) => {
      const N = Math.max(0, Number(guests) || 0);
      if (N === 0) return session;
      const meta = safeJSON(session.notes);
      const drops = Array.isArray(meta.drops) ? [...meta.drops] : [];
      drops.push({ guests: N, at: new Date().toISOString() });
      const totalGuests = drops.reduce((s, d) => s + (d.guests || 0), 0);
      const affiliated = !!meta.affiliated;
      const driverPayout = computeDriverPayoutAmount(rates, { guests: totalGuests, affiliated });
      const newMeta = { ...meta, drops, guests: totalGuests };
      return base44.entities.DriverPayout.update(session.id, {
        notes: JSON.stringify(newMeta),
        total_payout: driverPayout,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["driver-sessions"] }),
  });

  // ─── Settle a session → mark DriverPayout PAID, bump DriverProfile YTD,
  //     write SystemAuditLog. NEVER touches POSTransaction. NEVER mutates
  //     total_sales. The drawer math is reported, not enforced via mutation.
  const settle = useMutation({
    mutationFn: async (session) => {
      const meta = safeJSON(session.notes);
      const affiliated = !!meta.affiliated;
      const totalGuests = Number(meta.guests) || 0;
      const driverPayout = Number(session.total_payout) || computeDriverPayoutAmount(rates, { guests: totalGuests, affiliated });
      const coverPerGuest = Number(rates?.cover_charge) - (affiliated ? Number(rates?.card_discount) || 0 : 0);
      const expectedCoverCollected = coverPerGuest * totalGuests;

      // 1. Mark DriverPayout PAID — disbursement ledger entry (cash out)
      await base44.entities.DriverPayout.update(session.id, {
        status: "paid",
        notes: JSON.stringify({ ...meta, settled_at: new Date().toISOString() }),
        payment_reference: `DRAWER-${today}`,
      });

      // 2. Bump DriverProfile YTD (1099 tracking)
      try {
        const matches = await base44.entities.DriverProfile.filter({ driver_id: session.contractor_id, venue_id: venueId }, null, 1);
        const profile = matches[0];
        if (profile) {
          const year = thisYear();
          const sameYear = profile.ytd_year === year;
          const newYtd = (sameYear ? Number(profile.ytd_payout_total) || 0 : 0) + driverPayout;
          const threshold = Number(profile.ten99_threshold) || 600;
          await base44.entities.DriverProfile.update(profile.id, {
            ytd_payout_total: newYtd,
            ytd_year: year,
            ten99_flag: newYtd >= threshold,
            lifetime_drops: (Number(profile.lifetime_drops) || 0) + 1,
            lifetime_guests: (Number(profile.lifetime_guests) || 0) + totalGuests,
            last_active_at: new Date().toISOString(),
          });
        }
      } catch (_) { /* non-fatal */ }

      // 3. Audit log — DRIVER_PAYOUT_FINALIZED with venue_id
      try {
        await base44.entities.SystemAuditLog.create({
          event_type: "DRIVER_PAYOUT_FINALIZED",
          description: `Driver payout ${session.payout_id} settled — ${session.contractor_name} · ${totalGuests} guests · $${driverPayout.toFixed(2)} disbursed from drawer`,
          actor_email: user?.email || "unknown",
          status: "success",
          severity: "low",
          metadata: {
            venue_id: venueId,
            driver_id: session.contractor_id,
            driver_name: session.contractor_name,
            payout_id: session.payout_id,
            guests: totalGuests,
            affiliated,
            driver_payout_amount: driverPayout,
            expected_cover_collected: expectedCoverCollected,
            drawer_math: `cover_collected (${expectedCoverCollected.toFixed(2)}) - driver_payout (${driverPayout.toFixed(2)}) = ${(expectedCoverCollected - driverPayout).toFixed(2)}`,
            rates_snapshot: meta.rates_snapshot || null,
            mode: rates?.mode || "REAL",
            directive: "DACO-20260603-FRONTDOOR-DRIVER",
            part: "B",
            note: "total_sales UNCHANGED — payout is disbursement, not negative revenue.",
          },
        });
      } catch (_) { /* non-fatal */ }

      return session;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["driver-sessions"] }),
  });

  if (!venueId) {
    return (
      <div className="text-amber-400 text-sm p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        ⚠ No active venue resolved. Driver payouts require venue context (login → choose venue).
      </div>
    );
  }

  const openSessions = sessions.filter(s => s.status === "pending");
  const paidSessions = sessions.filter(s => s.status === "paid");
  const tillOwes = openSessions.reduce((s, r) => s + (Number(r.total_payout) || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Car className="w-5 h-5 text-yellow-400" />
          <h2 className="text-lg font-bold text-white">Driver Payouts</h2>
          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40 text-xs">{today}</Badge>
          {isDoorman && (
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-xs">DOORMAN · Onboard + Log</Badge>
          )}
          {isDoorGirl && (
            <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/40 text-xs">DOOR GIRL · Payouts</Badge>
          )}
          {rates?.mode && rates.mode !== "REAL" && (
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs">{rates.mode}</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowScanner(v => !v)} className="bg-cyan-600 hover:bg-cyan-700 text-white text-sm min-h-[40px]">
            <QrCode className="w-4 h-4 mr-1" /> Scan QR
          </Button>
          <Button onClick={() => setShowNewDriver(v => !v)} className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold text-sm min-h-[40px]">
            <Plus className="w-4 h-4 mr-1" /> Onboard Driver
          </Button>
        </div>
      </div>

      {/* Rate snapshot — proves no hardcoded dollars */}
      {rates && (
        <div className="text-[10px] text-gray-500 bg-gray-900/40 border border-gray-800 rounded-lg p-2 flex flex-wrap gap-x-4 gap-y-1">
          <span><ShieldCheck className="w-3 h-3 inline mr-1 text-green-400" />Rates from <strong className="text-gray-300">VenueRateConfig</strong> ({rates._source}):</span>
          <span>Cover ${rates.cover_charge}</span>
          <span>Card Disc ${rates.card_discount}</span>
          <span>Affiliated ${rates.driver_payout_affiliated}/guest</span>
          <span>Outside ${rates.driver_payout_outside}/guest</span>
        </div>
      )}

      {/* QR Scanner */}
      {showScanner && (
        <Card className="bg-cyan-950/30 border-cyan-500/40">
          <CardContent className="p-4 space-y-3">
            <p className="text-cyan-300 font-semibold text-sm">Scan or paste driver QR token</p>
            <div className="flex gap-2">
              <Input
                autoFocus
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleScan()}
                placeholder="DRVQR-..."
                className="bg-black/40 border-gray-700 text-white font-mono"
              />
              <Button onClick={handleScan} className="bg-cyan-600 hover:bg-cyan-700 text-white">Resolve</Button>
              <Button variant="outline" onClick={() => { setShowScanner(false); setScanInput(""); }} className="border-gray-700 text-gray-300">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onboarding form */}
      {showNewDriver && (
        <Card className="bg-yellow-950/30 border-yellow-500/40">
          <CardContent className="p-4 space-y-3">
            <p className="text-yellow-300 font-semibold text-sm">Onboard Driver — issues durable QR (one-time)</p>

            {/* Quick re-open from existing profiles */}
            {profiles.filter(p => !activeContractorIds.has(p.driver_id)).length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] text-gray-400 uppercase tracking-wide flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-400" /> Existing drivers — tap to open tonight's session
                </p>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {profiles
                    .filter(p => !activeContractorIds.has(p.driver_id))
                    .slice(0, 12)
                    .map(p => (
                      <button
                        key={p.id}
                        onClick={() => openSession.mutate(p)}
                        disabled={openSession.isPending}
                        className="text-left bg-black/40 hover:bg-yellow-500/10 border border-gray-700 hover:border-yellow-500/60 rounded-lg px-3 py-2 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-semibold">{p.name}</span>
                          <Badge className={`text-[9px] ${p.affiliated ? "bg-green-500/20 text-green-300 border-green-500/40" : "bg-orange-500/20 text-orange-300 border-orange-500/40"}`}>
                            {p.affiliated ? "Affiliated" : "Outside"}
                          </Badge>
                          {p.ten99_flag && <Badge className="text-[9px] bg-red-500/20 text-red-300 border-red-500/40">1099</Badge>}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          YTD ${(p.ytd_payout_total || 0).toFixed(0)} · {p.lifetime_drops || 0} drops
                        </div>
                      </button>
                    ))}
                </div>
                <div className="border-t border-gray-800 my-2" />
                <p className="text-[11px] text-gray-500">Or register a new driver:</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Driver Name"
                value={newDriver.name}
                onChange={e => setNewDriver(v => ({ ...v, name: e.target.value }))}
                className="bg-black/40 border-gray-700 text-white"
              />
              <Input
                placeholder="Phone (optional)"
                value={newDriver.phone}
                onChange={e => setNewDriver(v => ({ ...v, phone: e.target.value }))}
                className="bg-black/40 border-gray-700 text-white"
              />
              <select
                value={newDriver.affiliated ? "affiliated" : "outside"}
                onChange={e => setNewDriver(v => ({ ...v, affiliated: e.target.value === "affiliated" }))}
                className="col-span-2 h-10 rounded-lg text-white font-medium px-2 bg-black/40 border border-gray-700"
              >
                <option value="affiliated">Affiliated (NUPS driver) · ${rates?.driver_payout_affiliated ?? "—"}/guest</option>
                <option value="outside">Outside driver · ${rates?.driver_payout_outside ?? "—"}/guest</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => onboardDriver.mutate(newDriver)}
                disabled={!newDriver.name || onboardDriver.isPending}
                className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold"
              >Issue QR & Open Session</Button>
              <Button variant="outline" onClick={() => setShowNewDriver(false)} className="border-gray-700 text-gray-300">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && <p className="text-gray-500 text-sm">Loading...</p>}

      {/* Till owes display — drawer math only, never mutates total_sales */}
      {openSessions.length > 0 && (
        <div className="flex items-center justify-between bg-yellow-950/40 border border-yellow-500/50 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-yellow-300 font-bold text-sm">Drawer disbursements pending</p>
              <p className="text-yellow-500 text-xs">Cash OUT from drawer. total_sales unaffected.</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-yellow-400">${tillOwes.toFixed(2)}</div>
        </div>
      )}

      {/* Open sessions */}
      {openSessions.length === 0 && !isLoading && (
        <p className="text-gray-600 text-sm text-center py-8">No driver sessions open tonight. Scan a QR or onboard.</p>
      )}

      {openSessions.map(session => {
        const isOpen = expanded === session.id;
        const meta = safeJSON(session.notes);
        const affiliated = !!meta.affiliated;
        const totalGuests = Number(meta.guests) || 0;
        const payoutAmount = Number(session.total_payout) || 0;
        const counter = guestCounter[session.id] ?? "";

        return (
          <Card key={session.id} className="bg-gray-900/60 border-gray-700/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-yellow-400" />
                    <span className="font-bold text-white">{session.contractor_name}</span>
                    <Badge className={`text-xs border ${affiliated ? "bg-green-500/20 text-green-300 border-green-500/40" : "bg-orange-500/20 text-orange-300 border-orange-500/40"}`}>
                      {affiliated ? "Affiliated" : "Outside"}
                    </Badge>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-gray-400">
                    <span><Users className="w-3 h-3 inline mr-1" />{totalGuests} guests</span>
                    <span className="text-gray-600">{(meta.drops || []).length} drops</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-green-400 font-bold text-lg">${payoutAmount.toFixed(2)}</div>
                    <div className="text-[10px] text-gray-500">payout</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setExpanded(isOpen ? null : session.id)} className="text-gray-400">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-gray-800 pt-3 space-y-3">
                  <div className="rounded p-3 bg-gray-800/40 text-xs">
                    <div className="text-white font-bold text-lg text-center">${payoutAmount.toFixed(2)}</div>
                    <div className="text-gray-400 mt-1 text-center">
                      {totalGuests} guests × ${affiliated ? rates?.driver_payout_affiliated : rates?.driver_payout_outside}/guest
                    </div>
                  </div>

                  {/* Log guest count */}
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Guests this drop"
                      value={counter}
                      onChange={e => setGuestCounter(c => ({ ...c, [session.id]: e.target.value }))}
                      className="bg-black/40 border-gray-700 text-white"
                    />
                    <Button
                      onClick={() => {
                        const N = parseInt(counter, 10);
                        if (!N || N <= 0) return;
                        logGuests.mutate({ session, guests: N });
                        setGuestCounter(c => ({ ...c, [session.id]: "" }));
                      }}
                      className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold"
                    >Log Drop</Button>
                  </div>

                  {(meta.drops || []).length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Drop log</p>
                      {meta.drops.map((d, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-800/40 rounded px-3 py-1.5 text-xs">
                          <span className="text-gray-300">Drop #{i + 1} · {d.guests} guests</span>
                          <span className="text-gray-600">{new Date(d.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-gray-800/40 rounded p-2 flex items-start gap-2 text-xs text-gray-400">
                    <AlertCircle className="w-3 h-3 text-yellow-400 mt-0.5 shrink-0" />
                    <span>
                      Settling writes to <strong className="text-yellow-300">DriverPayout</strong> ledger only.
                      <strong className="text-green-300"> total_sales is NEVER modified.</strong> Drawer math: cover collected − this payout.
                    </span>
                  </div>

                  {isDoorGirl ? (
                    <Button
                      onClick={() => settle.mutate(session)}
                      className="w-full bg-green-700 hover:bg-green-600 text-white font-bold"
                      disabled={settle.isPending || payoutAmount <= 0}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Pay ${payoutAmount.toFixed(2)} to {session.contractor_name}
                    </Button>
                  ) : (
                    <div className="w-full bg-pink-950/30 border border-pink-500/40 rounded-lg px-3 py-3 flex items-center gap-2 text-pink-300 text-sm font-semibold">
                      <Banknote className="w-4 h-4" />
                      Headcount confirmed — hand off to Door Girl for ${payoutAmount.toFixed(2)} payout
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Paid sessions */}
      {paidSessions.length > 0 && (
        <div className="border-t border-gray-800 pt-4 space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Settled tonight</p>
          {paidSessions.map(s => (
            <div key={s.id} className="flex items-center justify-between bg-gray-900/30 rounded px-3 py-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-300 text-sm">{s.contractor_name}</span>
                <span className="text-gray-500 text-xs">{Number(safeJSON(s.notes).guests) || 0} guests</span>
              </div>
              <span className="text-green-400 font-bold">${(Number(s.total_payout) || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function safeJSON(s) {
  try { return typeof s === "string" ? JSON.parse(s) : (s || {}); } catch { return {}; }
}