import React, { useState, useEffect } from 'react';
import { AlertTriangle, WifiOff, Wifi } from 'lucide-react';
import { OfflineQueue } from '@/utils/offlineQueue';

/**
 * Offline queue visibility only.
 *
 * Payment authorization, capture, refunds, payouts, and settlement are never
 * replayed automatically from browser storage. A reconnect is not consent to
 * move money. Queued operational records remain available for manager review.
 */
export default function OfflineSyncBanner() {
  const [pendingCount, setPendingCount] = useState(0);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    let disposed = false;

    const checkQueue = async () => {
      try {
        const count = await OfflineQueue.getPendingCount();
        if (!disposed) setPendingCount(count);
      } catch (error) {
        console.error('Failed to check offline queue:', error);
      }
    };

    checkQueue();
    const interval = window.setInterval(checkQueue, 5000);
    const handleOnline = () => {
      setOnline(true);
      checkQueue();
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      disposed = true;
      window.clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online && pendingCount === 0) return null;

  return (
    <div
      className={`w-full px-4 py-2 text-sm font-medium flex items-center gap-3 ${
        !online ? 'bg-red-500 text-white' : 'bg-amber-400 text-amber-950'
      }`}
      role="status"
      aria-live="polite"
    >
      {!online ? <WifiOff className="w-4 h-4 shrink-0" /> : <Wifi className="w-4 h-4 shrink-0" />}
      <span className="flex-1">
        {!online
          ? 'Offline mode: payment actions are blocked. Operational records may be held for review.'
          : `${pendingCount} offline record${pendingCount === 1 ? '' : 's'} require manager review. Payments are never submitted automatically.`}
      </span>
      {online && pendingCount > 0 && <AlertTriangle className="w-4 h-4 shrink-0" />}
    </div>
  );
}
