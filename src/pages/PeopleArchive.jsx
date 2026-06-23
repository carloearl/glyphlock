/**
 * PeopleArchive — durable, never-disappears roster of every person who has
 * ever existed in the system (entertainers, staff, guests, drivers).
 *
 * Sourced from the PersonRecord append-only archive — even if the source
 * entity is wiped, the history survives here. This is the record of truth
 * for reports, analytics, payroll audits, and legal defense.
 */
import React, { useState, useMemo, useEffect } from "react";
import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Users, Mic2, ShieldCheck, Truck, Search, Archive, History,
  Clock, AlertTriangle, RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { getDurableRoster, getPersonHistory } from "@/lib/nups/personArchive";
import PersonHistoryDrawer from "@/components/people/PersonHistoryDrawer";

const TYPE_META = {
  entertainer: { label: "Entertainers", icon: Mic2,        color: "text-pink-400",   tint: "bg-pink-500/10 border-pink-500/30" },
  staff:       { label: "Staff",        icon: ShieldCheck, color: "text-cyan-400",   tint: "bg-cyan-500/10 border-cyan-500/30" },
  guest:       { label: "Guests",       icon: Users,       color: "text-purple-400", tint: "bg-purple-500/10 border-purple-500/30" },
  driver:      { label: "Drivers",      icon: Truck,       color: "text-amber-400",  tint: "bg-amber-500/10 border-amber-500/30" },
};

function PersonRow({ row, onOpen }) {
  const meta = TYPE_META[row.person_type] || TYPE_META.staff;
  const Icon = meta.icon;
  return (
    <button
      onClick={() => onOpen(row)}
      className="w-full text-left flex items-center justify-between p-3 rounded-lg bg-gray-900/60 hover:bg-gray-900 border border-gray-800 hover:border-purple-500/40 transition"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`p-2 rounded-md ${meta.tint}`}>
          <Icon className={`w-4 h-4 ${meta.color}`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white truncate">{row.display_name}</span>
            {row.is_demo && (
              <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px]">DEMO</Badge>
            )}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
            <span className="capitalize">{row.person_type}</span>
            <span>·</span>
            <span>{row.event_count} event{row.event_count === 1 ? "" : "s"}</span>
            <span>·</span>
            <span className="capitalize text-gray-400">Last: {(row.last_event || "").replace(/_/g, " ")}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className="text-[11px] text-gray-500 flex items-center gap-1 justify-end">
            <Clock className="w-3 h-3" />
            {row.last_event_at ? format(new Date(row.last_event_at), "MMM d, h:mm a") : "—"}
          </p>
          <p className="text-[10px] text-gray-600 mt-0.5">
            First seen {row.first_seen ? format(new Date(row.first_seen), "MMM d, yyyy") : "—"}
          </p>
        </div>
        <History className="w-4 h-4 text-purple-400" />
      </div>
    </button>
  );
}

export default function PeopleArchive() {
  const [tab, setTab] = useState("entertainer");
  const [search, setSearch] = useState("");
  const [showDemo, setShowDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState({ entertainer: [], staff: [], guest: [], driver: [] });
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedHistory, setSelectedHistory] = useState([]);

  const loadAll = async () => {
    setLoading(true);
    const [ent, stf, gst, drv] = await Promise.all([
      getDurableRoster("entertainer", 2000),
      getDurableRoster("staff",       2000),
      getDurableRoster("guest",       2000),
      getDurableRoster("driver",      2000),
    ]);
    setRows({ entertainer: ent, staff: stf, guest: gst, driver: drv });
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const filtered = useMemo(() => {
    const base = rows[tab] || [];
    const s = search.trim().toLowerCase();
    return base
      .filter((r) => showDemo || !r.is_demo)
      .filter((r) => !s || (r.display_name || "").toLowerCase().includes(s) || (r.person_id || "").toLowerCase().includes(s))
      .sort((a, b) => new Date(b.last_event_at || 0) - new Date(a.last_event_at || 0));
  }, [rows, tab, search, showDemo]);

  const openPerson = async (row) => {
    setSelectedPerson(row);
    const history = await getPersonHistory(row.person_id, 200);
    setSelectedHistory(history);
  };

  const totals = {
    entertainer: rows.entertainer.filter((r) => showDemo || !r.is_demo).length,
    staff:       rows.staff.filter((r) => showDemo || !r.is_demo).length,
    guest:       rows.guest.filter((r) => showDemo || !r.is_demo).length,
    driver:      rows.driver.filter((r) => showDemo || !r.is_demo).length,
  };

  return (
    <NUPSAppShell
      title="People Archive"
      subtitle="Permanent record of every entertainer, staff member, guest, and driver"
    >
      <div className="space-y-4 p-4 md:p-6">
        {/* Header banner */}
        <Card className="bg-gradient-to-r from-purple-950/40 to-cyan-950/40 border-purple-500/30">
          <CardContent className="py-4 flex items-start gap-3">
            <Archive className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-white font-bold text-sm">Append-Only Record of Truth</h2>
              <p className="text-xs text-gray-400 mt-1">
                Every person who has ever been entered into the system stays here permanently — even if their live
                record is later deleted. Demo data wipes will NEVER touch this archive. Use this for payroll
                audits, dispute resolution, reports, and analytics.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={loadAll}
              disabled={loading}
              className="border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search name or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-gray-900 border-gray-800 text-white"
            />
          </div>
          <Button
            size="sm"
            variant={showDemo ? "default" : "outline"}
            onClick={() => setShowDemo((v) => !v)}
            className={showDemo
              ? "bg-amber-600 hover:bg-amber-500 text-black"
              : "border-gray-700 text-gray-300"}
          >
            {showDemo ? "Hiding nothing" : "Hide demo"}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-gray-900 border border-gray-800">
            {Object.entries(TYPE_META).map(([key, meta]) => {
              const Icon = meta.icon;
              return (
                <TabsTrigger key={key} value={key} className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">
                  <Icon className={`w-3.5 h-3.5 mr-1.5 ${meta.color}`} />
                  {meta.label}
                  <Badge className="ml-2 bg-gray-800 text-gray-300 border-gray-700 text-[10px]">
                    {totals[key]}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.keys(TYPE_META).map((key) => (
            <TabsContent key={key} value={key} className="mt-4">
              <Card className="bg-gray-950/60 border-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm flex items-center justify-between">
                    <span>{TYPE_META[key].label} on record</span>
                    <span className="text-xs font-normal text-gray-500">{filtered.length} shown</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-gray-500 text-sm text-center py-8">Loading archive…</p>
                  ) : filtered.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No archive entries yet.</p>
                      <p className="text-gray-600 text-xs mt-1">
                        New records are written here as soon as someone is onboarded, checked in, or updated.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filtered.map((row) => (
                        <PersonRow key={row.person_id} row={row} onOpen={openPerson} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <PersonHistoryDrawer
        open={!!selectedPerson}
        onClose={() => { setSelectedPerson(null); setSelectedHistory([]); }}
        person={selectedPerson}
        history={selectedHistory}
      />
    </NUPSAppShell>
  );
}