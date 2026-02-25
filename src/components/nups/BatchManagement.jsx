import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Clock, XCircle, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function BatchManagement({ user }) {
  const queryClient = useQueryClient();
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [openingCash, setOpeningCash] = useState(0);
  const [closingCash, setClosingCash] = useState(0);
  const [notes, setNotes] = useState("");

  const { data: activeBatch } = useQuery({
    queryKey: ['active-batch'],
    queryFn: async () => {
      const batches = await base44.entities.POSBatch.filter({ status: 'open', cashier: user?.email });
      return batches[0];
    }
  });

  const { data: batchTransactions = [] } = useQuery({
    queryKey: ['batch-transactions', activeBatch?.id],
    queryFn: async () => {
      if (!activeBatch) return [];
      const start = new Date(activeBatch.start_time);
      const allTransactions = await base44.entities.POSTransaction.list('-created_date', 1000);
      return allTransactions.filter(t => 
        t.cashier === user?.email && 
        new Date(t.created_date) >= start
      );
    },
    enabled: !!activeBatch
  });

  const openBatch = useMutation({
    mutationFn: (data) => base44.entities.POSBatch.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['active-batch']);
      setShowOpenDialog(false);
      setOpeningCash(0);
      setNotes("");
    }
  });

  const closeBatch = useMutation({
    mutationFn: ({ id, data }) => base44.entities.POSBatch.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['active-batch']);
      queryClient.invalidateQueries(['batch-transactions']);
      setShowCloseDialog(false);
      setClosingCash(0);
      setNotes("");
    }
  });

  const handleOpenBatch = () => {
    openBatch.mutate({
      batch_id: `BATCH-${Date.now()}`,
      start_time: new Date().toISOString(),
      opening_cash: openingCash,
      cashier: user?.email,
      status: 'open',
      total_sales: 0,
      transaction_count: 0
    });
  };

  const handleCloseBatch = () => {
    const totalSales = batchTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const expectedCash = openingCash + totalSales;
    const discrepancy = closingCash - expectedCash;

    closeBatch.mutate({
      id: activeBatch.id,
      data: {
        end_time: new Date().toISOString(),
        closing_cash: closingCash,
        total_sales: totalSales,
        transaction_count: batchTransactions.length,
        status: 'closed',
        discrepancy,
        notes
      }
    });
  };

  const batchTotal = batchTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
  const cashTotal = batchTransactions.filter(t => t.payment_method === 'Cash').reduce((sum, t) => sum + (t.total || 0), 0);
  const cardTotal = batchTransactions.filter(t => ['Credit Card', 'Debit Card'].includes(t.payment_method)).reduce((sum, t) => sum + (t.total || 0), 0);

  return (
    <div className="space-y-4">
      {activeBatch ? (
        <>
          <Card className="glass-card-dark border-green-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    Active Batch
                  </CardTitle>
                  <p className="text-sm text-gray-400 mt-1">Started {new Date(activeBatch.start_time).toLocaleString()}</p>
                </div>
                <Button
                  onClick={() => setShowCloseDialog(true)}
                  className="bg-gradient-to-r from-orange-500 to-red-600"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Close Batch
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="glass-card p-4">
                  <div className="text-sm text-gray-400 mb-1">Opening Cash</div>
                  <div className="text-2xl font-bold text-cyan-400">${activeBatch.opening_cash?.toFixed(2)}</div>
                </div>
                <div className="glass-card p-4">
                  <div className="text-sm text-gray-400 mb-1">Transactions</div>
                  <div className="text-2xl font-bold text-blue-400">{batchTransactions.length}</div>
                </div>
                <div className="glass-card p-4">
                  <div className="text-sm text-gray-400 mb-1">Cash Sales</div>
                  <div className="text-2xl font-bold text-green-400">${cashTotal.toFixed(2)}</div>
                </div>
                <div className="glass-card p-4">
                  <div className="text-sm text-gray-400 mb-1">Card Sales</div>
                  <div className="text-2xl font-bold text-purple-400">${cardTotal.toFixed(2)}</div>
                </div>
              </div>
              <div className="glass-card p-4 mt-4 border-green-500/30">
                <div className="text-sm text-gray-400 mb-1">Total Batch Sales</div>
                <div className="text-3xl font-bold text-green-400">${batchTotal.toFixed(2)}</div>
                <div className="text-sm text-gray-400 mt-2">Expected Cash: ${(activeBatch.opening_cash + cashTotal).toFixed(2)}</div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="glass-card-dark border-orange-500/30">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Active Batch</h3>
            <p className="text-gray-400 mb-6">You must open a batch before processing transactions</p>
            <Button
              onClick={() => setShowOpenDialog(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600"
            >
              <Clock className="w-4 h-4 mr-2" />
              Open New Batch
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Open Batch Dialog */}
      <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
        <DialogContent className="glass-card-dark border-cyan-500/30 text-white">
          <DialogHeader>
            <DialogTitle>Open New Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Opening Cash Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={openingCash}
                onChange={(e) => setOpeningCash(parseFloat(e.target.value) || 0)}
                className="glass-input text-white text-2xl text-center"
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="glass-input text-white"
                placeholder="Any notes about this batch..."
              />
            </div>
            <Button
              onClick={handleOpenBatch}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
            >
              <Clock className="w-4 h-4 mr-2" />
              Open Batch
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Batch Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="glass-card-dark border-orange-500/30 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Close Batch - Cash Reconciliation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4">
                <div className="text-sm text-gray-400 mb-1">Opening Cash</div>
                <div className="text-xl font-bold text-cyan-400">${activeBatch?.opening_cash?.toFixed(2)}</div>
              </div>
              <div className="glass-card p-4">
                <div className="text-sm text-gray-400 mb-1">Cash Sales</div>
                <div className="text-xl font-bold text-green-400">${cashTotal.toFixed(2)}</div>
              </div>
            </div>

            <div className="glass-card p-4 border-green-500/30">
              <div className="text-sm text-gray-400 mb-1">Expected Cash in Drawer</div>
              <div className="text-2xl font-bold text-green-400">
                ${((activeBatch?.opening_cash || 0) + cashTotal).toFixed(2)}
              </div>
            </div>

            <div>
              <Label>Actual Closing Cash Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={closingCash}
                onChange={(e) => setClosingCash(parseFloat(e.target.value) || 0)}
                className="glass-input text-white text-2xl text-center"
                placeholder="0.00"
              />
            </div>

            {closingCash > 0 && (
              <div className={`glass-card p-4 ${Math.abs(closingCash - ((activeBatch?.opening_cash || 0) + cashTotal)) > 0.01 ? 'border-red-500/30' : 'border-green-500/30'}`}>
                <div className="text-sm text-gray-400 mb-1">Discrepancy</div>
                <div className={`text-2xl font-bold ${closingCash - ((activeBatch?.opening_cash || 0) + cashTotal) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  ${(closingCash - ((activeBatch?.opening_cash || 0) + cashTotal)).toFixed(2)}
                </div>
              </div>
            )}

            <div>
              <Label>Closing Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="glass-input text-white"
                placeholder="Any notes about discrepancies or issues..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCloseDialog(false)}
                className="border-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCloseBatch}
                disabled={closingCash <= 0}
                className="bg-gradient-to-r from-orange-500 to-red-600"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Close Batch
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}