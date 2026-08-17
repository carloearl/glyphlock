import React, { useEffect, useState } from 'react';
import { CloudOff } from 'lucide-react';

const CRITICAL_ACTION = /\b(pay|payment|charge|refund|settle|settlement|payout|complete sale|finalize|close batch|close shift|submit contract|sign contract|mint|post to ledger|delete|void)\b/i;
const LOCK_MS = 1400;

function lockButton(button) {
  if (!(button instanceof HTMLButtonElement) || button.dataset.nupsGuardLock === '1') return;
  const label = `${button.textContent || ''} ${button.getAttribute('aria-label') || ''}`;
  if (!CRITICAL_ACTION.test(label) && button.dataset.nupsCritical !== 'true') return;

  const wasDisabled = button.disabled;
  button.dataset.nupsGuardLock = '1';
  button.setAttribute('aria-busy', 'true');
  if (!wasDisabled) button.disabled = true;

  window.setTimeout(() => {
    if (!button.isConnected) return;
    delete button.dataset.nupsGuardLock;
    button.removeAttribute('aria-busy');
    if (!wasDisabled) button.disabled = false;
  }, LOCK_MS);
}

/**
 * Cross-cutting safety for NUPS operational pages:
 * - prevents rapid double-clicking of money/destructive actions,
 * - blocks form re-submission for a short debounce window,
 * - keeps operators aware when the browser is offline.
 *
 * Component-level loading/disabled states remain authoritative; this is a final
 * defense against accidental duplicate taps on shared terminals and kiosks.
 */
export default function NUPSActionSafety() {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onClick = (event) => {
      const button = event.target?.closest?.('button');
      if (button) queueMicrotask(() => lockButton(button));
    };
    const onSubmit = (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.dataset.nupsSubmitLock === '1') return;
      form.dataset.nupsSubmitLock = '1';
      window.setTimeout(() => {
        if (form.isConnected) delete form.dataset.nupsSubmitLock;
      }, LOCK_MS);
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.addEventListener('click', onClick, true);
    document.addEventListener('submit', onSubmit, true);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('submit', onSubmit, true);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[300] flex min-h-12 items-center justify-center gap-2 border-b border-rose-300/40 bg-rose-950/95 px-4 text-center text-xs font-black text-rose-100 shadow-[0_8px_30px_rgba(0,0,0,.4)] backdrop-blur-xl print:hidden" role="alert" data-no-print>
      <CloudOff className="h-4 w-4 flex-none" />
      NUPS IS OFFLINE · DO NOT COMPLETE MONEY OR CONTRACT ACTIONS UNTIL CONNECTION RETURNS
    </div>
  );
}
