import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, WifiOff, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import { OfflineQueue } from '@/utils/offlineQueue';

export default function OfflineSyncBanner() {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const checkQueue = async () => {
      try {
        const count = await OfflineQueue.getPendingCount();
        setPendingCount(count);
      } catch (err) {
        console.error('Failed to check queue:', err);
      }
    };
    
    checkQueue();
    const interval = setInterval(checkQueue, 5000);

    const handleOnline = () => {
      setOnline(true);
      autoSync();
    };
    const handleOffline = () => setOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const autoSync = async () => {
    if (syncing) return;
    const pending = await OfflineQueue.getPending();
    if (pending.length === 0) return;
    
    setSyncing(true);
    let synced = 0;
    
    for (const tx of pending) {
      try {
        const res = await base44.functions.invoke('processGlyphBucksPayment', tx);
        if (res.data?.success) {
          await OfflineQueue.markSynced(tx.id);
          synced++;
        }
      } catch (err) {
        console.error('Sync failed for tx', tx.id, err);
      }
    }
    
    setSyncing(false);
    setPendingCount(await OfflineQueue.getPendingCount());
    
    if (synced > 0) {
      toast.success(`✅ Synced ${synced} offline transaction(s)`);
    }
  };

  if (online && pendingCount === 0) return null;

  return (
    <div className={`w-full px-4 py-2 text-sm font-medium flex items-center justify-between ${!online ? 'bg-red-500 text-white' : 'bg-yellow-400 text-yellow-900'}`}>
      <div className="flex items-center gap-2">
        {!online ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
        <span>
          {!online
            ? '📴 Offline Mode — Transactions queuing locally'
            : `⚡ ${pendingCount} transaction(s) pending sync`
          }
        </span>
      </div>
      {online && pendingCount > 0 && (
        <Button
          onClick={autoSync}
          disabled={syncing}
          size="sm"
          className="ml-4 bg-white text-yellow-900 hover:bg-gray-100 h-8"
        >
          {syncing ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Syncing...</> : 'Sync Now'}
        </Button>
      )}
    </div>
  );
}