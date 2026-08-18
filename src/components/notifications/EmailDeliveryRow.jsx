import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function EmailDeliveryRow({ log }) {
  const ok = log.status === 'sent';
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-4 border-b border-slate-800 last:border-0">
      <div className="flex items-center gap-2 md:w-32 shrink-0">
        {ok ? (
          <CheckCircle2 className="h-4 w-4 text-green-400" />
        ) : (
          <XCircle className="h-4 w-4 text-red-400" />
        )}
        <span className={ok ? 'text-green-400 text-sm font-semibold' : 'text-red-400 text-sm font-semibold'}>
          {ok ? 'Delivered' : 'Failed'}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm truncate">{log.subject || '(no subject)'}</p>
        <p className="text-slate-400 text-xs truncate">
          {log.source} → {log.recipient}
          {log.contact_email ? ` · from ${log.contact_email}` : ''}
        </p>
        {log.error_message && (
          <p className="text-red-300 text-xs mt-1 break-all">{log.error_message}</p>
        )}
      </div>

      <div className="md:w-56 shrink-0 text-left md:text-right">
        <p className="text-slate-300 text-xs">
          {log.attempted_at ? new Date(log.attempted_at).toLocaleString() : ''}
        </p>
        {log.reference && (
          <p className="text-slate-500 text-xs font-mono break-all">{log.reference}</p>
        )}
      </div>
    </div>
  );
}