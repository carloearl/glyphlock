import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Plus, Minus, CreditCard } from 'lucide-react';

const DENOMINATIONS = [1, 5, 10, 20, 50, 100];

export default function DreamDollarPOS({ venue_id, onSaleComplete }) {
  const [selections, setSelections] = useState(
    DENOMINATIONS.reduce((acc, denom) => ({ ...acc, [denom]: 0 }), {})
  );
  const [surchargeRate] = useState(0.30);
  const [approvalCode, setApprovalCode] = useState('');
  const [processorRef, setProcessorRef] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);

  const updateQuantity = (denom, change) => {
    setSelections(prev => ({
      ...prev,
      [denom]: Math.max(0, prev[denom] + change)
    }));
  };

  const totalFaceValue = DENOMINATIONS.reduce(
    (sum, denom) => sum + (denom * selections[denom]),
    0
  );
  const surchargeAmount = totalFaceValue * surchargeRate;
  const totalCharged = totalFaceValue + surchargeAmount;

  const handleCreateSale = async () => {
    if (totalFaceValue === 0) {
      alert('Please select Dream Dollar denominations');
      return;
    }
    if (!customerName.trim()) {
      alert('Please enter customer name');
      return;
    }

    setLoading(true);
    try {
      const denominations = DENOMINATIONS
        .filter(denom => selections[denom] > 0)
        .map(denom => ({
          denomination: denom,
          quantity: selections[denom]
        }));

      const result = await base44.functions.invoke('createDreamDollarSale', {
        venue_id,
        customer_name: customerName,
        denominations,
        surcharge_rate: surchargeRate,
        approval_code: approvalCode,
        processor_reference: processorRef,
        payment_method: 'credit_card'
      });

      if (result.data.success) {
        alert(`Sale complete! ${result.data.total_bills} Dream Dollar bills issued.`);
        onSaleComplete?.(result.data);
        
        // Reset form
        setSelections(DENOMINATIONS.reduce((acc, denom) => ({ ...acc, [denom]: 0 }), {}));
        setApprovalCode('');
        setProcessorRef('');
        setCustomerName('');
      }
    } catch (err) {
      console.error('Sale error:', err);
      alert('Failed to create sale: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glyph-glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-cyan-400" />
            Dream Dollar Sales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Customer Info */}
          <div>
            <label className="block text-sm font-medium mb-2">Customer Name</label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              className="input-glow-blue"
            />
          </div>

          {/* Denomination Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">Select Denominations</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {DENOMINATIONS.map(denom => (
                <div key={denom} className="p-3 rounded-lg glyph-glass border border-white/10">
                  <div className="text-center mb-2 font-bold text-cyan-400">
                    ${denom}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(denom, -1)}
                      disabled={selections[denom] === 0}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-12 text-center font-semibold">
                      {selections[denom]}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(denom, 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Dream Dollar Face Value:</span>
              <span className="font-semibold">${totalFaceValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-cyan-400">
              <span>Surcharge (30%):</span>
              <span className="font-semibold">${surchargeAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-white/10 pt-2">
              <span>Total Charged:</span>
              <span className="text-cyan-400">${totalCharged.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Approval Code</label>
              <Input
                value={approvalCode}
                onChange={(e) => setApprovalCode(e.target.value)}
                placeholder="Enter approval code"
                className="input-glow-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Processor Reference</label>
              <Input
                value={processorRef}
                onChange={(e) => setProcessorRef(e.target.value)}
                placeholder="Enter reference"
                className="input-glow-blue"
              />
            </div>
          </div>

          {/* Create Sale Button */}
          <Button
            onClick={handleCreateSale}
            disabled={loading || totalFaceValue === 0}
            className="w-full btn-glow-blue"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            {loading ? 'Processing...' : `Complete Sale - $${totalCharged.toFixed(2)}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}