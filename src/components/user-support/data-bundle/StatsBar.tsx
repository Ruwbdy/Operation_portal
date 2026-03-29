import React from 'react';
import type { FulfilmentTrace } from '../../../types';

interface StatsBarProps {
  traces: FulfilmentTrace[];
}

export default function StatsBar({ traces }: StatsBarProps) {
  const total       = traces.length;
  const fulfilled   = traces.filter(t => t.fulfilmentStatus === 'FULFILLED').length;
  const loanRec     = traces.filter(t => t.fulfilmentStatus === 'LOAN_RECOVERY').length;
  const dataGifting  = traces.filter(t => t.fulfilmentStatus === 'DATA_GIFTING').length;
  const pamIssue    = traces.filter(t => t.fulfilmentStatus === 'PAM_ISSUE').length;
  const ghostDebit  = traces.filter(t => t.fulfilmentStatus === 'GHOST_DEBIT').length;
  const pendingCCN  = traces.filter(t => t.fulfilmentStatus === 'PENDING_CCN').length;
  const failed      = traces.filter(t => t.fulfilmentStatus === 'FAILED').length;
  const cisFailed   = traces.filter(t => t.fulfilmentStatus === 'CIS_FAILED').length;

  if (total === 0) return null;

  const items = [
    { label: 'Subscriptions',  value: total,       cls: 'text-black',        border: 'border-gray-200' },
    { label: 'Fulfilled',      value: fulfilled,    cls: 'text-green-600',    border: 'border-green-200' },
    { label: 'Loan Recovery',  value: loanRec,      cls: 'text-blue-600',     border: 'border-blue-200' },
    { label: 'Data Gifting',   value: dataGifting,  cls: 'text-purple-600',   border: 'border-purple-200' },
    { label: 'PAM Issue',      value: pamIssue,     cls: 'text-amber-600',    border: 'border-amber-200' },
    { label: 'Ghost Debit ⚠',  value: ghostDebit,   cls: 'text-rose-600',     border: 'border-rose-300' },
    { label: 'Pending CCN',    value: pendingCCN,   cls: 'text-yellow-600',   border: 'border-yellow-300' },
    { label: 'Failed',         value: failed,       cls: 'text-red-500',      border: 'border-red-200' },
    { label: 'CIS Failed',     value: cisFailed,    cls: 'text-gray-400',     border: 'border-gray-200' },
  ];

  return (
    <div className="flex flex-wrap gap-3 bg-white px-8 py-5 rounded-2xl shadow border border-gray-100 mb-6">
      {items.map(({ label, value, cls, border }) => (
        <div
          key={label}
          className={`flex flex-col items-center min-w-[80px] px-4 py-2 rounded-xl border ${border} ${
            value > 0 ? 'bg-white' : 'bg-gray-50 opacity-50'
          }`}
        >
          <span className={`text-2xl font-black ${cls}`}>{value}</span>
          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5 text-center leading-tight">
            {label}
          </span>
        </div>
      ))}

      {/* Pending CCN pulse indicator */}
      {pendingCCN > 0 && (
        <div className="flex items-center gap-2 ml-2">
          <span className="flex gap-0.5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </span>
          <span className="text-[8px] font-black text-yellow-600 uppercase tracking-widest">
            Awaiting CCN
          </span>
        </div>
      )}
    </div>
  );
}