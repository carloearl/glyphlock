import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * BATCH PRINT QUEUE
 * Manage multiple bill batch print jobs
 */

export default function BatchPrintQueue({ batches }) {
  const [printQueue, setPrintQueue] = useState([]);

  const addToQueue = (batch) => {
    if (printQueue.find(b => b.id === batch.id)) {
      toast.info('Already in queue');
      return;
    }
    setPrintQueue([...printQueue, batch]);
    toast.success('Added to print queue');
  };

  const printAll = async () => {
    for (const batch of printQueue) {
      // Trigger print for each batch
      window.open(`/print-batch/${batch.batch_id}`, '_blank');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    setPrintQueue([]);
    toast.success(`Printed ${printQueue.length} batches`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Queue ({printQueue.length})
          </span>
          {printQueue.length > 0 && (
            <Button onClick={printAll} size="sm">
              Print All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {printQueue.length === 0 ? (
          <p className="text-sm text-slate-500">No batches queued</p>
        ) : (
          <div className="space-y-2">
            {printQueue.map((batch) => (
              <div
                key={batch.id}
                className="flex items-center justify-between p-2 bg-slate-50 rounded"
              >
                <div>
                  <p className="text-sm font-medium">{batch.batch_id}</p>
                  <p className="text-xs text-slate-600">
                    ${batch.total_face_value} Face Value
                  </p>
                </div>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}