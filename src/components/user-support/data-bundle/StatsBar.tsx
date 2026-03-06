import React from 'react';
import type { FulfilmentTrace } from '../../../services/bundle_data_interfaces';

interface StatsBarProps {
  traces: FulfilmentTrace[];
}

export default function StatsBar({ traces }: StatsBarProps) {
  const fulfilled  = traces.filter(t => t.fulfilmentStatus === 'FULFILLED').length;
  const partial    = traces.filter(t => t.fulfilmentStatus === 'PARTIAL').length;
  const failed     = traces.filter(t => t.fulfilmentStatus === 'FAILED').length;
  const cisFailed  = traces.filter(t => t.fulfilmentStatus === 'CIS_FAILED').length;
  const ghostDebit = traces.filter(t => t.fulfilmentStatus === 'GHOST_DEBIT').length;
  const total      = traces.length;

  if (total === 0) return null;

  return (
    <div className="flex flex-wrap gap-4 bg-white px-8 py-5 rounded-2xl shadow border border-gray-100 mb-6">
      {[
        { label: 'Subscriptions',    value: total,      cls: 'text-black' },
        { label: 'Fulfilled',        value: fulfilled,  cls: 'text-green-600' },
        { label: 'Partial',          value: partial,    cls: 'text-amber-600' },
        { label: 'Ghost Debit ⚠',   value: ghostDebit, cls: 'text-rose-600' },
        { label: 'Failed @ CCN/SDP', value: failed,     cls: 'text-red-500' },
        { label: 'CIS Failed',       value: cisFailed,  cls: 'text-gray-400' },
      ].map(({ label, value, cls }) => (
        <div key={label} className="flex flex-col items-center min-w-[80px]">
          <span className={`text-2xl font-black ${cls}`}>{value}</span>
          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{label}</span>
        </div>
      ))}
    </div>
  );
}