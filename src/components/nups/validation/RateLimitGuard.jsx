/**
 * RateLimitGuard — Real-time rate limit enforcement for contract creation
 * Prevents fraud and abuse by throttling high-frequency transactions
 */
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Clock, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const LIMITS = {
  CONTRACTS_PER_HOUR: 5,
  CONTRACTS_PER_DAY: 20,
  COOLDOWN_MINUTES: 2,
};

export default function RateLimitGuard({ staffEmail, onStatusChange }) {
  const [status, setStatus] = useState({ allowed: true, remaining: LIMITS.CONTRACTS_PER_HOUR, resetIn: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkRateLimit();
  }, [staffEmail]);

  const checkRateLimit = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('checkRateLimit', {
        actor_id: staffEmail,
        action: 'contract_creation',
        limit_per_hour: LIMITS.CONTRACTS_PER_HOUR,
        limit_per_day: LIMITS.CONTRACTS_PER_DAY,
      });
      
      const { allowed, remaining, reset_in_seconds, daily_count } = response.data;
      
      const newStatus = {
        allowed,
        remaining: remaining || 0,
        dailyCount: daily_count || 0,
        resetIn: reset_in_seconds ? Math.ceil(reset_in_seconds / 60) : null,
      };
      
      setStatus(newStatus);
      if (onStatusChange) onStatusChange(newStatus);
    } catch (error) {
      // Fail open (allow transaction) if rate limit check fails
      console.error("Rate limit check failed:", error);
      setStatus({ allowed: true, remaining: LIMITS.CONTRACTS_PER_HOUR, resetIn: null });
      if (onStatusChange) onStatusChange({ allowed: true });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-900/40 border-gray-700/50">
        <CardContent className="p-3 flex items-center gap-2 text-gray-500 text-xs">
          <Clock className="w-4 h-4 animate-spin" />
          Checking rate limits...
        </CardContent>
      </Card>
    );
  }

  if (!status.allowed) {
    return (
      <Card className="bg-red-900/20 border-red-500/40">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="font-bold">Rate Limit Exceeded</span>
          </div>
          <p className="text-xs text-gray-400">
            Maximum contracts per hour reached. Please wait {status.resetIn} minute{status.resetIn !== 1 ? 's' : ''} before creating another contract.
          </p>
          <div className="text-xs text-gray-500">
            Daily contracts: {status.dailyCount} / {LIMITS.CONTRACTS_PER_DAY}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status.remaining <= 2) {
    return (
      <Card className="bg-amber-900/20 border-amber-500/40">
        <CardContent className="p-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-amber-400">
            Rate limit: {status.remaining} contracts remaining this hour
          </span>
          <Badge variant="outline" className="ml-auto border-amber-500/50 text-amber-400 text-[10px]">
            {status.dailyCount}/{LIMITS.CONTRACTS_PER_DAY} today
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return null;
}