import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, User, CreditCard, Hash, Calendar, Shield, Loader2, Eye } from "lucide-react";
import ContractDetailModal from "@/components/nups/ContractDetailModal";
import { useActiveVenue } from "@/hooks/useActiveVenue";

export default function ContractSearch() {
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;
  const [searchType, setSearchType] = useState("guest_name");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !venueId) return;
    setLoading(true);
    setSearched(true);

    const filter = {};
    if (searchType === "guest_name") {
      filter.guest_name = searchQuery.trim();
    } else if (searchType === "card_last_four") {
      filter.card_last_four = searchQuery.trim();
    } else if (searchType === "serial_number") {
      filter.serial_number = searchQuery.trim();
    } else if (searchType === "status") {
      filter.status = searchQuery.trim();
    }

    filter.record_type = "contract_token";
    filter.venue_id = venueId;

    const records = await base44.entities.VIPContractRecord.filter(filter, '-signed_at', 50);
    setResults(records);
    setLoading(false);
  };

  const searchTypeConfig = {
    guest_name: { label: "Guest Name", placeholder: "John Doe", icon: User },
    card_last_four: { label: "Card Last 4", placeholder: "1234", icon: CreditCard },
    serial_number: { label: "Serial / Barcode", placeholder: "VIP-XXXXXXX", icon: Hash },
    status: { label: "Status", placeholder: "signed", icon: Shield },
  };

  const config = searchTypeConfig[searchType];
  const SearchIcon = config.icon;

  return (
    <div className="min-h-screen bg-black text-white py-8 md:py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <FileText className="w-12 h-12 text-purple-400 mx-auto mb-3" />
          <h1 className="text-3xl font-bold mb-1">Contract Archive Search</h1>
          <p className="text-gray-400 text-sm">Search executed VIP contracts by name, card, serial number, or status</p>
        </div>

        {/* Search Bar */}
        <Card className="bg-gray-900/60 border-purple-500/30 mb-6">
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={searchType} onValueChange={v => { setSearchType(v); setSearchQuery(""); }}>
                <SelectTrigger className="w-full sm:w-48 bg-gray-800/50 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="guest_name">Guest Name</SelectItem>
                  <SelectItem value="card_last_four">Card Last 4</SelectItem>
                  <SelectItem value="serial_number">Serial / Barcode</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>

              {searchType === "status" ? (
                <Select value={searchQuery} onValueChange={setSearchQuery}>
                  <SelectTrigger className="flex-1 bg-gray-800/50 border-gray-700">
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="signed">Signed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="revoked">Revoked</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={config.placeholder}
                  className="flex-1 bg-gray-800/50 border-gray-700"
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                />
              )}

              <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-600 font-bold px-6">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-3" />
            <p className="text-gray-400">Searching contracts...</p>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No contracts found matching your search.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 mb-2">{results.length} contract(s) found</p>
            {results.map(contract => (
              <Card key={contract.id} className="bg-gray-900/60 border-gray-700 hover:border-purple-500/40 transition-all cursor-pointer"
                onClick={() => setSelectedContract(contract)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Guest photo thumbnail */}
                    <div className="w-16 h-16 rounded-lg bg-gray-800 flex-shrink-0 overflow-hidden border border-gray-700">
                      {contract.guest_photo_url ? (
                        <img src={contract.guest_photo_url} alt="Guest" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-white truncate">{contract.guest_name}</h3>
                        <Badge className={
                          contract.status === "signed" ? "bg-green-500/20 text-green-400 border-green-500/40" :
                          contract.status === "pending" ? "bg-amber-500/20 text-amber-400 border-amber-500/40" :
                          contract.status === "expired" ? "bg-red-500/20 text-red-400 border-red-500/40" :
                          "bg-gray-500/20 text-gray-400 border-gray-500/40"
                        }>
                          {contract.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          <span className="font-mono truncate">{contract.serial_number || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          <span>{contract.card_type || '—'} •••• {contract.card_last_four || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          <span>{contract.government_id_type || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{contract.signed_at ? new Date(contract.signed_at).toLocaleDateString() : '—'}</span>
                        </div>
                      </div>
                    </div>

                    <Button size="sm" variant="outline" className="border-purple-500/40 text-purple-400 flex-shrink-0">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedContract && (
          <ContractDetailModal contract={selectedContract} onClose={() => setSelectedContract(null)} />
        )}
      </div>
    </div>
  );
}