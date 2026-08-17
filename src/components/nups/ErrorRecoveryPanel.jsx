import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Mail, Phone } from "lucide-react";

/**
 * STANDARDIZED ERROR RECOVERY UI
 * 
 * Used across all NUPS modules for consistent failure handling
 * 
 * Props:
 * - title: Error title (e.g., "Payment Failed")
 * - message: User-facing error description
 * - errorId: Technical error ID for support reference
 * - retryable: Whether retry action is available
 * - onRetry: Callback for retry button
 * - severity: 'warning' | 'critical' (affects UI color)
 */

export default function ErrorRecoveryPanel({
  title = "Transaction Failed",
  message,
  errorId,
  retryable = true,
  onRetry,
  severity = 'critical'
}) {
  const colorScheme = severity === 'critical' 
    ? 'red' 
    : 'yellow';

  return (
    <Card className={`bg-${colorScheme}-900/20 border-${colorScheme}-500/40`}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full bg-${colorScheme}-500 flex items-center justify-center flex-shrink-0`}>
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <div className={`text-base font-bold text-${colorScheme}-400`}>{title}</div>
              <div className={`text-sm text-${colorScheme}-300 mt-1`}>{message}</div>
              {errorId && (
                <div className="text-xs text-gray-500 mt-2 font-mono">
                  Error ID: {errorId}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {retryable && onRetry && (
                <Button
                  size="sm"
                  onClick={onRetry}
                  className={`bg-${colorScheme}-600 hover:bg-${colorScheme}-500 text-white`}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Transaction
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.href = 'mailto:carloearl@glyphlock.com?subject=NUPS Error ' + errorId}
                className={`border-${colorScheme}-500/40 text-${colorScheme}-400`}
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </div>

            <div className={`text-xs text-${colorScheme}-300 bg-${colorScheme}-500/10 p-2 rounded border border-${colorScheme}-500/20`}>
              <strong>What happened:</strong> {message}
              {retryable && <div className="mt-1"><strong>Next step:</strong> Click "Retry" or contact manager if issue persists.</div>}
              {!retryable && <div className="mt-1"><strong>Next step:</strong> Contact management immediately at (602) 536-0372.</div>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}