import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RotateCcw, Search, Printer, CheckCircle2, AlertTriangle } from "lucide-react";

export default function RefundManager({ user }) {
  const queryClient = useQueryClient();
  const [searchId, setSearchId] = useState("");
  const [found, setFound] = useState(null);
  const [reason, setReason] = useState("");
  const [refundDone, setRefundDone] = useState(false);

  const searchTransaction = async () => {
    const all = await base44.entities.POSTransaction.list('-created_date', 500);
    const match = all.find(t => t.transaction_id === searchId.trim());
    setFound(match || "NOT_FOUND");
    setRefundDone(false);
  };

  const processRefund = useMutation({
    mutationFn: async () => {
      await base44.entities.POSTransaction.update(found.id, {
        status: 'refunded',
        notes: `REFUND by ${user?.email} — Reason: ${reason} — ${new Date().toISOString()}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-transactions'] });
      setRefundDone(true);
    }
  });

  const printRefundSlip = () => {
    const html = `<html><head><title>Refund</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Courier New',monospace;padding:20px;font-size:12px;width:302px;}@media print{@page{margin:0;size:80mm auto;}}</style></head><body>
      <div style="text-align:center;font-weight:bold;font-size:16px;">REFUND RECEIPT</div>
      <div style="text-align:center;font-size:10px;">Dream Palace — 815 N. Scottsdale Road, Tempe, AZ 85281</div>
      <hr style="margin:8px 0;"/>
      <div>Original TXN: ${found.transaction_id}</div>
      <div>Amount Refunded: $${(found.total || 0).toFixed(2)}</div>
      <div>Method: ${found.payment_method}</div>
      <div>Reason: ${reason}</div>
      <div>Authorized By: ${user?.email}</div>
      <div>Date: ${new Date().toLocaleString()}</div>
      <hr style="margin:8px 0;border-top:2px solid #000;"/>
      <div style="text-align:center;font-size:8px;color:#666;">N.U.P.S. POS v2.0 — Secured by GlyphLock</div>
    </body></html>`;
    const w = window.open('','_blank','width=350,height=400');
    w.document.write(html); w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <Card className="bg-white/[0.02] border-white/[0.06]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-red-400 flex items-center gap-2">
          <RotateCcw className="w-4 h-4" /> Refund Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input value={searchId} onChange={e => setSearchId(e.target.value)}
            placeholder="Enter Transaction ID (TXN-...)" className="bg-black/40 border-white/10 text-white font-mono" />
          <Button onClick={searchTransaction} className="bg-red-600 hover:bg-red-700">
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {found === "NOT_FOUND" && (
          <div className="text-center py-4 text-red-400 text-sm">
            <AlertTriangle className="w-6 h-6 mx-auto mb-1" />
            Transaction not found
          </div>
        )}

        {found && found !== "NOT_FOUND" && (
          <div className="space-y-3">
            <div className="bg-black/40 border border-white/10 rounded-lg p-3 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-gray-400">TXN:</span><span className="text-white font-mono">{found.transaction_id}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Amount:</span><span className="text-green-400 font-bold">${(found.total || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Method:</span><span className="text-white">{found.payment_method}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Status:</span>
                <Badge className={found.status === 'refunded' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}>{found.status}</Badge>
              </div>
            </div>

            {found.status === 'refunded' ? (
              <div className="text-center py-2 text-red-400 text-sm font-bold">Already refunded</div>
            ) : refundDone ? (
              <div className="text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto" />
                <p className="text-green-400 font-bold">Refund Processed</p>
                <Button onClick={printRefundSlip} variant="outline" size="sm" className="border-cyan-500/30 text-cyan-400">
                  <Printer className="w-3 h-3 mr-1" /> Print Refund Slip
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <Label className="text-xs text-gray-400">Reason for Refund *</Label>
                  <Textarea value={reason} onChange={e => setReason(e.target.value)}
                    placeholder="Customer complaint, wrong item, etc..." className="bg-black/40 border-white/10 text-white" />
                </div>
                <Button onClick={() => processRefund.mutate()} disabled={!reason.trim() || processRefund.isPending}
                  className="w-full bg-gradient-to-r from-red-500 to-orange-600 font-bold">
                  <RotateCcw className="w-4 h-4 mr-2" /> Process Refund — ${(found.total || 0).toFixed(2)}
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}