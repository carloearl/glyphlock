import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, CreditCard, FileStack, Eye, DollarSign } from 'lucide-react';

const FLAG_CONFIG = {
  BIG_SPENDER:    { label: 'Big Spender',    icon: Crown,      color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  MULTI_CONTRACT: { label: 'Multi-Contract', icon: FileStack,  color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  MULTI_CARD:     { label: 'Multi-Card',     icon: CreditCard, color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
};

export default function SpenderRow({ profile, onInspect }) {
  const hasFlags = profile.flags.length > 0;

  return (
    <Card
      className={`bg-gray-900/60 transition-all cursor-pointer ${
        hasFlags ? 'border-amber-500/40 hover:border-amber-400' : 'border-gray-700 hover:border-purple-500/30'
      }`}
      onClick={() => onInspect(profile)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white truncate">{profile.displayName || 'Unknown Customer'}</span>
              {profile.flags.map((f) => {
                const cfg = FLAG_CONFIG[f];
                if (!cfg) return null;
                const Icon = cfg.icon;
                return (
                  <Badge key={f} variant="outline" className={`text-xs ${cfg.color}`}>
                    <Icon className="w-3 h-3 mr-1" />
                    {cfg.label}
                  </Badge>
                );
              })}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-bold">${profile.totalSpend.toFixed(2)}</span>
              </div>
              <div>{profile.contractCount} contracts</div>
              <div>{profile.cardsUsed.length} cards</div>
              <div>{profile.transactionCount} POS tx</div>
            </div>
          </div>
          <Button size="sm" variant="outline" className="border-cyan-500/40 text-cyan-400">
            <Eye className="w-4 h-4 mr-1" /> Inspect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}