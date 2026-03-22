import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Download, Eye, Calendar, User, MapPin, DollarSign, Shield, Loader2 } from 'lucide-react';
import { GLYPHLOCK_DISCLAIMER } from '@/constants/legalDisclaimer';

export default function ContractLookup() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContract, setSelectedContract] = useState(null);

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['vip-contracts'],
    queryFn: () => base44.entities.VIPContractRecord.list('-created_date', 100),
    initialData: []
  });

  const { data: orders } = useQuery({
    queryKey: ['glyphbucks-orders'],
    queryFn: () => base44.entities.GlyphBucksOrder.list('-created_date', 100),
    initialData: []
  });

  const allRecords = [
    ...contracts.map(c => ({ ...c, source: 'vip', type: 'VIP Room Service' })),
    ...orders.map(o => ({ ...o, source: 'glyphbucks', type: 'GlyphBucks Purchase' }))
  ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const filteredRecords = allRecords.filter(r => {
    const term = searchTerm.toLowerCase();
    return (
      r.order_number?.toLowerCase().includes(term) ||
      r.customer_name?.toLowerCase().includes(term) ||
      r.guest_name?.toLowerCase().includes(term) ||
      r.approval_code?.toLowerCase().includes(term)
    );
  });

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-500/20 text-gray-400 border-gray-500/40',
      signed: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
      executed: 'bg-green-500/20 text-green-400 border-green-500/40',
      printed: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
      archived: 'bg-amber-500/20 text-amber-400 border-amber-500/40'
    };
    return colors[status] || colors.draft;
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Contract Lookup & Archive</h1>
          <p className="text-gray-400 text-sm">Search all VIP and GlyphBucks contracts</p>
        </div>

        <Card className="bg-gray-900/60 border-gray-700">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by order number, guest name, or approval code..."
                className="pl-10 bg-gray-800 border-gray-700 h-12 text-base"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((record) => (
              <Card key={record.id} className="bg-gray-900/60 border-gray-700 hover:border-purple-500/30 transition-all cursor-pointer" onClick={() => setSelectedContract(record)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge className="font-mono text-xs bg-purple-500/20 text-purple-400 border-purple-500/40">
                          {record.order_number}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                          {record.type}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-300">
                          <User className="w-4 h-4 text-gray-500" />
                          {record.guest_name || record.customer_name}
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          {new Date(record.created_date).toLocaleDateString()}
                        </div>
                        {record.grand_total && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            ${record.grand_total.toFixed(2)}
                          </div>
                        )}
                        {record.approval_code && (
                          <div className="flex items-center gap-2 text-gray-300 font-mono text-xs">
                            <Shield className="w-4 h-4 text-gray-500" />
                            {record.approval_code}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button size="sm" variant="outline" className="border-cyan-500/40 text-cyan-400">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredRecords.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No contracts found</p>
              </div>
            )}
          </div>
        )}

        <div className="text-center text-xs text-gray-600 pt-6 border-t border-gray-800">
          {GLYPHLOCK_DISCLAIMER}
        </div>
      </div>
    </div>
  );
}