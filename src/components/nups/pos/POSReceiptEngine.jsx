import React from 'react';
import ReceiptPrinter from '@/components/nups/ReceiptPrinter';

export default function POSReceiptEngine({ transaction, batch, onPrint }) {
  if (!transaction) {
    return <div className="text-center py-8 text-gray-400">No transaction data available</div>;
  }

  const normalizedTransaction = {
    ...transaction,
    batch_id: transaction.batch_id || batch?.batch_id,
    station: transaction.station || batch?.station || 'bar',
    terminal_name: transaction.terminal_name || (batch?.station ? `${batch.station.toUpperCase()} REGISTER` : 'BAR-01'),
  };

  return <ReceiptPrinter transaction={normalizedTransaction} />;
}