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
    return 'missing';
  };

  const cisState = getState(cisCount);
  const pamState = getState(sdpCount);   // PAM = SDP records
  const ccnState = getState(ccnCount);

  if (streamPhase === 'idle') return null;

  // Primary events — essential for fulfilment determination
  const PRIMARY_EVENTS = [
    {
      key: 'CIS',
      label: 'CIS CDR',
      desc: 'Subscription history · primary source',
      state: cisState,
      count: cisCount,
      dot: 'bg-blue-500',
      receivedCls: 'border-blue-200 bg-blue-50',
      labelCls: 'text-blue-700',
      countCls: 'bg-blue-100 text-blue-700',
      badge: null,
    },
    {
      key: 'PAM',
      label: 'PAM CDR',
      desc: 'Bundle fulfilment · DA credit records',
      state: pamState,
      count: sdpCount,
      dot: 'bg-purple-500',
      receivedCls: 'border-purple-200 bg-purple-50',
      labelCls: 'text-purple-700',
      countCls: 'bg-purple-100 text-purple-700',
      badge: null,
    },
  ];

  // Secondary event — CCN as arbiter only
  const ccnMissing = streamPhase === 'complete' && ccnCount === null;
  const CCN_EVENT = {
    key: 'CCN',
    label: 'CCN CDR',
    desc: 'Debit arbiter · consulted only when PAM is absent',
    state: ccnState,
    count: ccnCount,
  };

  const renderStateIcon = (state: EventState, isPrimary: boolean) => {
    if (state === 'received') {
      return <span className={`w-2.5 h-2.5 rounded-full ${isPrimary ? 'bg-green-500' : 'bg-green-400'}`} />;
    }
    if (state === 'waiting') {
      return (
        <span className="flex gap-0.5">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-1 h-1 bg-[#FFCC00] rounded-full animate-bounce"
              style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </span>
      );
    }
    if (state === 'missing') return <span className="text-xs font-black text-red-400">✗</span>;
    return null;
  };

  return (
    <div className="flex flex-col gap-3 mb-6">
      {/* Primary events row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {PRIMARY_EVENTS.map(ev => {
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
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isReceived ? 'bg-white shadow-sm' :
                isWaiting  ? 'bg-[#FFCC00]/20' :
                isMissing  ? 'bg-red-100' :
                             'bg-gray-100'
              }`}>
                {renderStateIcon(ev.state, true)}
              </div>

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
                  <span className="text-[8px] font-black text-gray-300 uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100">
                    Primary
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

      {/* CCN — secondary arbiter row */}
      <div className={`flex items-center gap-4 px-5 py-3 rounded-xl border transition-all ${
        CCN_EVENT.state === 'received' ? 'border-emerald-200 bg-emerald-50/50' :
        CCN_EVENT.state === 'waiting'  ? 'border-[#FFCC00]/40 bg-yellow-50/50' :
        ccnMissing                     ? 'border-gray-100 bg-gray-50/50' :
                                         'border-gray-100 bg-gray-50/30'
      }`}>
        {/* Arbiter label */}
        <div className="flex items-center gap-2 shrink-0">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
            CCN_EVENT.state === 'received' ? 'bg-emerald-100' :
            CCN_EVENT.state === 'waiting'  ? 'bg-[#FFCC00]/20' :
                                             'bg-gray-100'
          }`}>
            {renderStateIcon(CCN_EVENT.state, false)}
          </div>
          <span className={`text-[8px] font-black uppercase tracking-widest ${
            CCN_EVENT.state === 'received' ? 'text-emerald-700' :
            CCN_EVENT.state === 'waiting'  ? 'text-amber-600' :
                                             'text-gray-400'
          }`}>
            {CCN_EVENT.label}
          </span>
          <span className="text-[7px] font-black text-gray-300 uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100/80 border border-gray-200">
            Arbiter
          </span>
          {CCN_EVENT.state === 'received' && CCN_EVENT.count !== null && (
            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              {CCN_EVENT.count} record{CCN_EVENT.count !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <span className={`text-[8px] font-bold flex-1 ${
          CCN_EVENT.state === 'received' ? 'text-gray-500' :
          CCN_EVENT.state === 'waiting'  ? 'text-amber-500' :
          ccnMissing                     ? 'text-gray-300' :
                                           'text-gray-300'
        }`}>
          {CCN_EVENT.state === 'received' ? 'Debit confirmation records received — resolving any pending ghost debit traces' :
           CCN_EVENT.state === 'waiting'  ? 'Waiting for CCN debit records…' :
           ccnMissing                     ? 'No CCN data — PENDING_CCN traces remain unresolved' :
                                            CCN_EVENT.desc}
        </span>

        {CCN_EVENT.state === 'received' && (
          <span className="text-[8px] font-black text-emerald-600 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-full uppercase tracking-wider shrink-0">
            ✓ Received
          </span>
        )}
        {ccnMissing && (
          <span className="text-[8px] font-black text-gray-400 bg-gray-100 border border-gray-200 px-2 py-1 rounded-full uppercase tracking-wider shrink-0">
            Not Available
          </span>
        )}
      </div>
    </div>
  );
}