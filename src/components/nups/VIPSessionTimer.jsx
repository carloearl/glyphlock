import React, { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";

export default function VIPSessionTimer({ endTime, startTime }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!endTime) return null;

  const end = new Date(endTime);
  const start = new Date(startTime);
  const totalDuration = end - start;
  const remaining = Math.max(0, end - now);
  const elapsed = Math.max(0, now - start);
  const progress = Math.min(100, (elapsed / totalDuration) * 100);
  const isOvertime = remaining <= 0;
  const overtimeMs = isOvertime ? now - end : 0;
  
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const isWarning = remaining > 0 && remaining < 300000; // 5 min warning

  return (
    <div className={`rounded-lg p-3 ${isOvertime ? 'bg-red-500/20 border border-red-500/50 animate-pulse' : isWarning ? 'bg-yellow-500/15 border border-yellow-500/40' : 'bg-gray-800/50 border border-gray-700'}`}>
      <div className="flex items-center gap-2 mb-2">
        {isOvertime ? (
          <AlertTriangle className="w-4 h-4 text-red-400" />
        ) : (
          <Clock className={`w-4 h-4 ${isWarning ? 'text-yellow-400' : 'text-cyan-400'}`} />
        )}
        <span className={`text-xs font-semibold ${isOvertime ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-gray-400'}`}>
          {isOvertime ? 'OVERTIME' : isWarning ? 'ENDING SOON' : 'SESSION ACTIVE'}
        </span>
      </div>
      
      <div className={`text-2xl font-mono font-bold ${isOvertime ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-cyan-400'}`}>
        {isOvertime ? `+${formatTime(overtimeMs)}` : formatTime(remaining)}
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${isOvertime ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-cyan-500'}`}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-gray-500">
        <span>{formatTime(elapsed)} elapsed</span>
        <span>{formatTime(totalDuration)} total</span>
      </div>
    </div>
  );
}