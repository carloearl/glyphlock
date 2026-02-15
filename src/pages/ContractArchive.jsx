import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Shield, User, CreditCard, Calendar, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ContractDetailCard from "@/components/nups/ContractDetailCard";

export default function ContractArchive() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContract, setSelectedContract] = useState(null);

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["signed-contracts"],
    queryFn: () => base44.entities.VIPContractRecord.filter({ status: "signed" }, "-signed_at", 200),
  });

  const filtered = contracts.filter(c => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (c.guest_name || "").toLowerCase().includes(q) ||
      (c.card_last_four || "").includes(q) ||
      (c.serial_number || "").toLowerCase().includes(q) ||
      (c.government_id_type || "").toLowerCase().includes(q) ||
      (c.government_id_state || "").toLowerCase().includes(q)
    );
  });

  const statusColor = (s) => {
    if (s === "signed") return "bg-green-500/20 text-green-400 border-green-500/40";
    if (s === "expired") return "bg-red-500/20 text-red-400 border-red-500/40";
    if (s === "revoked") return "bg-orange-500/20 text-orange-400 border-orange-500/40";
    return "bg-gray-500/20 text-gray-400 border-gray-500/40";
  };

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold">Contract Archive</h1>
            <p className="text-sm text-gray-400">Search signed VIP contracts by name, last 4 of card, serial number, or ID type</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by guest name, last 4 digits of card, serial number, ID type..."
            className="pl-10 h-12 text-lg bg-gray-900/60 border-gray-700"
          />
        </div>

        <div className="text-xs text-gray-500 mb-4">
          {filtered.length} contract{filtered.length !== 1 ? "s" : ""} found
          {searchTerm.trim() ? ` matching "${searchTerm}"` : ""}
        </div>

        {isLoading ? (
          <div className="text-center text-gray-500 py-16">Loading contracts...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-600 py-16">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No contracts found{searchTerm.trim() ? ` for "${searchTerm}"` : ""}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(c => (
              <Card key={c.id} className="bg-gray-900/60 border-gray-800 hover:border-purple-500/40 transition-all cursor-pointer"
                onClick={() => setSelectedContract(c)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Guest Photo Thumbnail */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-gray-700 flex-shrink-0 bg-gray-800">
                      {c.guest_photo_url ? (
                        <img src={c.guest_photo_url} alt={c.guest_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">{c.guest_name}</span>
                        <Badge className={statusColor(c.status)}>{c.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span className="font-mono text-purple-400">{c.serial_number}</span>
                        </span>
                        {c.card_last_four && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            {c.card_type} •••• {c.card_last_four}
                          </span>
                        )}
                        {c.signed_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(c.signed_at).toLocaleDateString()}
                          </span>
                        )}
                        {c.government_id_type && (
                          <span>{c.government_id_type} {c.government_id_state ? `(${c.government_id_state})` : ""}</span>
                        )}
                      </div>
                    </div>

                    <Button size="sm" variant="outline" className="border-gray-700 text-gray-400 flex-shrink-0">
                      <Eye className="w-4 h-4 mr-1" /> View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
          <DialogContent className="bg-gray-950 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-purple-400">
                <Shield className="w-5 h-5" />
                Contract Detail
              </DialogTitle>
            </DialogHeader>
            {selectedContract && <ContractDetailCard contract={selectedContract} />}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}