import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, Image, AlertCircle } from 'lucide-react';

export default function TransactionSearch({ venue_id }) {
  const [searchType, setSearchType] = useState('transaction_id');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      alert('Please enter a search value');
      return;
    }

    setLoading(true);
    try {
      const result = await base44.functions.invoke('transactionLookup', {
        type: searchType,
        value: searchValue.trim(),
        venue_id
      });

      if (result.data.success) {
        setResults(result.data);
      }
    } catch (err) {
      console.error('Search error:', err);
      alert('Search failed: ' + err.message);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="glyph-glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-cyan-400" />
            Transaction Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Search By</label>
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="input-glow-blue">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transaction_id">Transaction ID</SelectItem>
                  <SelectItem value="order_number">Order Number</SelectItem>
                  <SelectItem value="barcode">Barcode</SelectItem>
                  <SelectItem value="serial">Bill Serial Number</SelectItem>
                  <SelectItem value="approval_code">Approval Code</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Search Value</label>
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter search value"
                className="input-glow-blue"
              />
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={loading || !searchValue.trim()}
            className="w-full btn-glow-blue"
          >
            <Search className="w-5 h-5 mr-2" />
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card className="glyph-glass-card">
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Transaction ID:</span>
                <span className="font-mono text-cyan-400">{results.transaction_id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Bills Issued:</span>
                <span className="font-semibold">{results.summary.bills_issued}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Bills Redeemed:</span>
                <span className="font-semibold">{results.summary.bills_redeemed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Verification Media:</span>
                <span className="font-semibold">{results.summary.verification_media_count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>ID Scan:</span>
                <span className={results.summary.has_id_scan ? 'text-green-400' : 'text-red-400'}>
                  {results.summary.has_id_scan ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {results.records.order && (
              <div className="space-y-2">
                <div className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Order Information
                </div>
                <div className="p-3 rounded-lg glyph-glass border border-white/10 text-sm space-y-1">
                  <div>Customer: {results.records.order.customer_name}</div>
                  <div>Order #: {results.records.order.order_number}</div>
                  <div>Status: {results.records.order.status}</div>
                  {results.records.order.signed_at && (
                    <div>Signed: {new Date(results.records.order.signed_at).toLocaleString()}</div>
                  )}
                </div>
              </div>
            )}

            {results.records.batch && (
              <div className="space-y-2">
                <div className="font-semibold">Batch Information</div>
                <div className="p-3 rounded-lg glyph-glass border border-white/10 text-sm space-y-1">
                  <div>Batch ID: {results.records.batch.batch_id}</div>
                  <div>Face Value: ${results.records.batch.total_face_value}</div>
                  <div>Total Charged: ${results.records.batch.total_charged}</div>
                  <div>Approval Code: {results.records.batch.approval_code}</div>
                  <div>Status: {results.records.batch.status}</div>
                </div>
              </div>
            )}

            {results.records.verification_media.length > 0 && (
              <div className="space-y-2">
                <div className="font-semibold flex items-center gap-2">
                  <Image className="w-4 h-4 text-cyan-400" />
                  Verification Media ({results.records.verification_media.length})
                </div>
                <div className="space-y-2">
                  {results.records.verification_media.map(media => (
                    <div key={media.id} className="p-3 rounded-lg glyph-glass border border-white/10 text-sm">
                      <div className="flex justify-between items-center gap-3">
                        <span>{media.verification_type}</span>
                        <span className="text-[11px] text-amber-300 text-right">
                          {media.protected_evidence_id
                            ? "Protected evidence on file"
                            : media.media_url
                              ? "Legacy evidence on file — direct viewing disabled"
                              : "No media reference"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(media.capture_timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.summary.bills_issued === 0 && (
              <div className="text-center py-8 text-gray-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No transaction details found</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}