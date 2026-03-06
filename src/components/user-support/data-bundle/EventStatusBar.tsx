import React from 'react';

interface EventStatusBarProps {
  streamPhase: string;
  cisCount: number | null;
  ccnCount: number | null;
  sdpCount: number | null;
}

type EventState = 'idle' | 'waiting' | 'received' | 'missing';

export default function EventStatusBar({ streamPhase, cisCount, ccnCount, sdpCount }: EventStatusBarProps) {
  const isStreaming = streamPhase !== 'idle' && streamPhase !== 'complete' && streamPhase !== 'error';

  const getState = (count: number | null): EventState => {
    if (streamPhase === 'idle') return 'idle';
    if (count !== null)         return 'received';
    if (isStreaming)            return 'waiting';
    return 'missing'; // stream ended, never arrived
  };

  const cisState = getState(cisCount);
  const ccnState = getState(ccnCount);
  const sdpState = getState(sdpCount);

  if (streamPhase === 'idle') return null;

  const EVENT_CFG = [
    {
      key: 'CIS',
      label: 'CIS CDR',
      desc: 'Subscription / provisioning events',
      state: cisState,
      count: cisCount,
      dot: 'bg-blue-500',
      receivedCls: 'border-blue-200 bg-blue-50',
      labelCls: 'text-blue-700',
      countCls: 'bg-blue-100 text-blue-700',
    },
    {
      key: 'CCN',
      label: 'CCN CDR',
      desc: 'MA balance debit records',
      state: ccnState,
      count: ccnCount,
      dot: 'bg-emerald-500',
      receivedCls: 'border-emerald-200 bg-emerald-50',
      labelCls: 'text-emerald-700',
      countCls: 'bg-emerald-100 text-emerald-700',
    },
    {
      key: 'SDP',
      label: 'SDP PAM',
      desc: 'DA credit / expiry records',
      state: sdpState,
      count: sdpCount,
      dot: 'bg-purple-500',
      receivedCls: 'border-purple-200 bg-purple-50',
      labelCls: 'text-purple-700',
      countCls: 'bg-purple-100 text-purple-700',
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {EVENT_CFG.map(ev => {
        const isReceived = ev.state === 'received';
        const isWaiting  = ev.state === 'waiting';
        const isMissing  = ev.state === 'missing';

        return (
          <div
            key={ev.key}
            className={`flex-1 flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all ${
              isReceived ? ev.receivedCls :
              isWaiting  ? 'border-[#FFCC00]/60 bg-yellow-50' :
              isMissing  ? 'border-red-200 bg-red-50' :
                           'border-gray-100 bg-white'
            }`}
          >
            {/* Icon / indicator */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isReceived ? 'bg-white shadow-sm' :
              isWaiting  ? 'bg-[#FFCC00]/20' :
              isMissing  ? 'bg-red-100' :
                           'bg-gray-100'
            }`}>
              {isReceived && <span className={`w-3 h-3 rounded-full ${ev.dot}`} />}
              {isWaiting && (
                <span className="flex gap-0.5">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1 h-1 bg-[#FFCC00] rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 100}ms` }} />
                  ))}
                </span>
              )}
              {isMissing && <span className="text-red-400 text-sm font-black">✗</span>}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[9px] font-black uppercase tracking-widest ${
                  isReceived ? ev.labelCls :
                  isWaiting  ? 'text-amber-700' :
                  isMissing  ? 'text-red-600' :
                               'text-gray-400'
                }`}>
                  {ev.label}
                </span>
                {isReceived && ev.count !== null && (
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${ev.countCls}`}>
                    {ev.count} record{ev.count !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className={`text-[9px] font-bold truncate ${
                isReceived ? 'text-gray-500' :
                isWaiting  ? 'text-amber-600' :
                isMissing  ? 'text-red-500' :
                             'text-gray-300'
              }`}>
                {isReceived ? ev.desc :
                 isWaiting  ? 'Waiting for response…' :
                 isMissing  ? 'No data received' :
                              ev.desc}
              </p>
            </div>

            {/* Right state label */}
            <div className="shrink-0">
              {isReceived && (
                <span className="text-[8px] font-black text-green-600 bg-green-100 border border-green-200 px-2 py-1 rounded-full uppercase tracking-wider">
                  ✓ Received
                </span>
              )}
              {isWaiting && (
                <span className="text-[8px] font-black text-amber-700 bg-[#FFCC00]/30 border border-[#FFCC00]/50 px-2 py-1 rounded-full uppercase tracking-wider animate-pulse">
                  Pending
                </span>
              )}
              {isMissing && (
                <span className="text-[8px] font-black text-red-600 bg-red-100 border border-red-200 px-2 py-1 rounded-full uppercase tracking-wider">
                  No Data
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}