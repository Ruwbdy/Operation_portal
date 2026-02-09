import React from 'react';

interface DataRowProps {
  label: string;
  value: any;
  highlight?: boolean;
  small?: boolean;
  large?: boolean;
}

export default function DataRow({ 
  label, 
  value, 
  highlight = false, 
  small = false, 
  large = false 
}: DataRowProps) {
  return (
    <div className="flex flex-col border-b border-gray-50 pb-2.5 last:border-0 last:pb-0">
      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
        {label}
      </span>
      <span
        className={`font-black tracking-tight leading-none ${
          highlight ? 'text-[#FFCC00]' : 'text-slate-800'
        } ${
          small
            ? 'text-[10px] break-all text-slate-500 font-bold'
            : large
            ? 'text-2xl italic uppercase'
            : 'text-[13px]'
        }`}
      >
        {value === null || value === undefined || value === 'UNKNOWN' ? (
          <span className="text-gray-300 italic opacity-50">N/A</span>
        ) : (
          String(value)
        )}
      </span>
    </div>
  );
}