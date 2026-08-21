import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollText, Search, Eye, CheckCircle2, Clock, FileText, User, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useActiveVenue } from "@/hooks/useActiveVenue";

export default function ContractViewer() {
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["vip-contract-records", venueId],
    queryFn: () => venueId ? base44.entities.VIPContractRecord.filter({ venue_id: venueId }, "-created_date", 100) : Promise.resolve([]),
    enabled: !!venueId,
  });

  const filtered = contracts.filter(c =>
    !search ||
    c.guest_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.room_number?.toLowerCase().includes(search.toLowerCase()) ||
    c.serial_number?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (s) => ({
    signed: "bg-green-500/15 text-green-400 border-green-500/30",
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    expired: "bg-gray-500/15 text-gray-400 border-gray-500/30",
    revoked: "bg-red-500/15 text-red-400 border-red-500/30",
  }[s] || "bg-gray-500/15 text-gray-400 border-gray-500/30");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-bold text-white">Contract Archive</h2>
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
            View Only
          </Badge>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <Input
            placeholder="Search guest, room, serial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-white/[0.04] border-white/[0.08] text-white text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading contracts...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No contracts found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className="text-left p-4 rounded-2xl border transition-all duration-200 active:scale-[0.98] hover:border-purple-400/40"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-sm font-semibold text-white truncate max-w-[140px]">{c.guest_name}</span>
                </div>
                <Badge className={`text-[10px] border ${statusColor(c.status)}`}>{c.status}</Badge>
              </div>

              {c.room_number && (
                <div className="text-xs text-gray-400 mb-1">Room {c.room_number}</div>
              )}
              {c.serial_number && (
                <div className="text-[10px] text-gray-600 font-mono truncate mb-2">{c.serial_number}</div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                  <Calendar className="w-3 h-3" />
                  {new Date(c.created_date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-purple-400">
                  <Eye className="w-3 h-3" />
                  View
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-gray-950 border-purple-500/30 max-w-lg text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <ScrollText className="w-5 h-5 text-purple-400" />
              Contract Detail
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Guest Name", value: selected.guest_name },
                  { label: "Room", value: selected.room_number || "—" },
                  { label: "Status", value: selected.status },
                  { label: "Type", value: selected.record_type },
                  { label: "Serial #", value: selected.serial_number || "—" },
                  { label: "Issued By", value: selected.issued_by || "—" },
                  { label: "Signed At", value: selected.signed_at ? new Date(selected.signed_at).toLocaleString() : "—" },
                  { label: "Created", value: new Date(selected.created_date).toLocaleString() },
                  { label: "Card (last 4)", value: selected.card_last_four || "—" },
                  { label: "Card Type", value: selected.card_type || "—" },
                  { label: "Gov ID Type", value: selected.government_id_type || "—" },
                  { label: "Gov ID State", value: selected.government_id_state || "—" },
                  { label: "IP Address", value: selected.ip_address || "—" },
                  { label: "Contract Version", value: selected.metadata?.contract_version || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/[0.03] rounded-lg p-2.5">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">{label}</div>
                    <div className="text-xs text-white font-medium truncate">{value}</div>
                  </div>
                ))}
              </div>

              {/* Hashes */}
              {(selected.signature_hash || selected.contract_hash) && (
                <div className="bg-black/40 rounded-xl p-3 space-y-2 border border-white/[0.06]">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">Integrity Hashes</div>
                  {selected.signature_hash && (
                    <div>
                      <div className="text-[10px] text-gray-500 mb-0.5">Signature SHA-256</div>
                      <div className="text-[10px] font-mono text-cyan-400 break-all">{selected.signature_hash}</div>
                    </div>
                  )}
                  {selected.contract_hash && (
                    <div>
                      <div className="text-[10px] text-gray-500 mb-0.5">Contract SHA-256</div>
                      <div className="text-[10px] font-mono text-green-400 break-all">{selected.contract_hash}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Protected media is intentionally not emitted as raw URLs here.
                  A server-authorized retrieval path must be verified before archive viewing is re-enabled. */}
              {(selected.guest_photo_url || selected.id_photo_url || selected.id_photo_back_url || selected.thumbprint_url || selected.signed_hardcopy_photo_url) && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                  Protected identity media is on file. Direct-link viewing is disabled until authorized private retrieval is verified.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}