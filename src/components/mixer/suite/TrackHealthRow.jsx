import React from 'react';
import { CheckCircle2, XCircle, HelpCircle, Loader2, Youtube, AudioLines, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const STATUS = {
  ready: { icon: CheckCircle2, cls: 'text-emerald-400', label: 'Ready' },
  failing: { icon: XCircle, cls: 'text-red-400', label: 'Failing' },
  unverified: { icon: HelpCircle, cls: 'text-amber-300', label: 'Unverified' },
  testing: { icon: Loader2, cls: 'text-cyan-300 animate-spin', label: 'Testing…' },
};

/** One diagnostic row: source type, health status, failure reason, retest action. */
export default function TrackHealthRow({ row, onTest }) {
  const meta = STATUS[row.status] || STATUS.unverified;
  const Icon = meta.icon;

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
      <Icon className={`w-4 h-4 flex-shrink-0 ${meta.cls}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white truncate">{row.title}</div>
        <div className="text-xs text-slate-500 truncate">
          {row.artist} {row.reason ? <span className="text-red-300">· {row.reason}</span> : null}
        </div>
      </div>
      <Badge variant="outline" className="text-[10px] gap-1 hidden sm:inline-flex">
        {row.sourceType === 'youtube'
          ? <><Youtube className="w-3 h-3" /> YouTube</>
          : row.sourceType === 'file'
            ? <><AudioLines className="w-3 h-3" /> Direct audio</>
            : 'No source'}
      </Badge>
      <span className={`text-[10px] font-mono uppercase w-20 text-right ${meta.cls}`}>{meta.label}</span>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-[10px] text-slate-400"
        disabled={row.status === 'testing' || row.sourceType === 'none'}
        onClick={() => onTest(row)}
      >
        <Play className="w-3 h-3 mr-1 pointer-events-none" /> Test
      </Button>
    </div>
  );
}