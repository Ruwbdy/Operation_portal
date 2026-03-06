import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface StreamingBadgeProps {
  phase: string;
}

export default function StreamingBadge({ phase }: StreamingBadgeProps) {
  if (phase === 'idle') return null;

  if (phase === 'complete') return (
    <div className="flex items-center space-x-2 text-green-600 text-[9px] font-black uppercase tracking-widest">
      <WifiOff size={12} />
      <span>Stream complete</span>
    </div>
  );

  if (phase === 'error') return (
    <div className="flex items-center space-x-2 text-red-500 text-[9px] font-black uppercase tracking-widest">
      <WifiOff size={12} />
      <span>Stream error</span>
    </div>
  );

  return (
    <div className="flex items-center space-x-2 text-[#FFCC00] text-[9px] font-black uppercase tracking-widest">
      <Wifi size={12} className="animate-pulse" />
      <span>Streaming · {phase.toUpperCase()}</span>
      <span className="flex space-x-0.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1 h-1 bg-[#FFCC00] rounded-full animate-bounce"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </span>
    </div>
  );
}