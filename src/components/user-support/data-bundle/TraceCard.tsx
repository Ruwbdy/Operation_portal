import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Package,
} from 'lucide-react';
import { getDADescription, formatDAAmount } from '../../../services/daMapping';
import type { FulfilmentTrace, FulfilmentStatus } from '../../../services/bundle_data_interfaces';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function fmtMoney(v: string | number | undefined): string {
  if (v === undefined || v === null || v === '' || v === 'NA') return '—';
  const n = parseFloat(String(v));
  if (isNaN(n)) return String(v);
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function statusBadge(status: FulfilmentStatus) {
  const map: Record<FulfilmentStatus, { label: string; cls: string }> = {
    FULFILLED:   { label: 'Fulfilled',     cls: 'bg-green-100 text-green-700 border-green-200' },
    PARTIAL:     { label: 'Partial',       cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    FAILED:      { label: 'Failed',        cls: 'bg-red-100 text-red-700 border-red-200' },
    CIS_FAILED:  { label: 'CIS Failed',    cls: 'bg-gray-100 text-gray-600 border-gray-200' },
    GHOST_DEBIT: { label: 'Ghost Debit ⚠', cls: 'bg-rose-100 text-rose-700 border-rose-300' },
  };
  const { label, cls } = map[status];
  return (
    <span className={`text-[8px] font-black px-2 py-1 rounded-full border uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
}

// ─── DataPair ─────────────────────────────────────────────────────────────────

function DataPair({ label, value, err }: { label: string; value: string; err?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      <span className={`text-[10px] font-bold break-all ${err ? 'text-red-600' : 'text-gray-800'}`}>{value || '—'}</span>
    </div>
  );
}

// ─── TraceCard ────────────────────────────────────────────────────────────────

interface TraceCardProps {
  trace: FulfilmentTrace;
}

export default function TraceCard({ trace }: TraceCardProps) {
  const [expanded, setExpanded] = useState(false);

  const stepOk = (ok: boolean) =>
    ok
      ? <CheckCircle2 size={16} className="text-green-500 shrink-0" />
      : <XCircle size={16} className="text-red-500 shrink-0" />;

  const stepMissing = () => <AlertCircle size={16} className="text-amber-500 shrink-0" />;

  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
      trace.fulfilmentStatus === 'FULFILLED'   ? 'border-green-200' :
      trace.fulfilmentStatus === 'PARTIAL'     ? 'border-amber-300' :
      trace.fulfilmentStatus === 'FAILED'      ? 'border-red-300' :
      trace.fulfilmentStatus === 'GHOST_DEBIT' ? 'border-rose-400' :
                                                 'border-gray-200'
    }`}>
      {/* Header */}
      <button
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center space-x-4 min-w-0">
          <div className="bg-black p-2 rounded-xl shrink-0">
            <Package size={16} className="text-[#FFCC00]" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
              {trace.channel} · {trace.timestamp}
            </p>
            <p className="text-sm font-black text-black leading-none truncate">{trace.productName}</p>
            <p className="text-[9px] font-bold text-gray-400 mt-1">
              Offer {trace.offerId} · {fmtMoney(trace.chargeAmount)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3 shrink-0 ml-4">
          {/* Mini pipeline */}
          <div className="hidden md:flex items-center space-x-1">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[8px] font-black uppercase ${
              trace.cisStatus === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            }`}>
              {stepOk(trace.cisStatus === 'ok')}
              <span>CIS</span>
            </div>
            <span className="text-gray-300">→</span>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[8px] font-black uppercase ${
              trace.ccnStatus === 'ok' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-600'
            }`}>
              {trace.ccnStatus === 'ok' ? stepOk(true) : stepMissing()}
              <span>CCN</span>
            </div>
            <span className="text-gray-300">→</span>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[8px] font-black uppercase ${
              trace.sdpStatus === 'ok' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-600'
            }`}>
              {trace.sdpStatus === 'ok' ? stepOk(true) : stepMissing()}
              <span>SDP</span>
            </div>
          </div>
          {statusBadge(trace.fulfilmentStatus)}
          {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t border-gray-100 p-5 bg-gray-50/50 space-y-4">

          {/* Ghost Debit alert banner */}
          {trace.fulfilmentStatus === 'GHOST_DEBIT' && (
            <div className="flex items-start gap-3 bg-rose-50 border-2 border-rose-300 rounded-xl p-4">
              <span className="text-rose-500 text-lg shrink-0">⚠</span>
              <div>
                <p className="text-[10px] font-black text-rose-700 uppercase tracking-wider mb-1">Ghost Debit Detected</p>
                <p className="text-[10px] font-bold text-rose-600 leading-relaxed">
                  CIS returned a failure response, but CCN has a confirmed debit record — the subscriber was charged
                  {trace.ccnDebit ? ` ₦${parseFloat(trace.ccnDebit).toLocaleString('en-NG', { minimumFractionDigits: 2 })}` : ''} with no bundle delivered.
                  {trace.channel?.toUpperCase() === 'EVD'
                    ? ' This transaction was initiated via EVD — the subscriber should engage their source channel (EVD dealer/agent) for a refund.'
                    : ' This likely indicates an SDP system timeout during provisioning. A manual balance reversal may be required.'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Partial fulfilment alert banner */}
          {trace.fulfilmentStatus === 'PARTIAL' &&
            (trace.action?.toLowerCase().includes('optasia') ||
            trace.transactionCategory?.toUpperCase().includes('STV LOAN RECOVERY')) && (
            <div className="flex items-start gap-3 bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
              <span className="text-blue-500 text-lg shrink-0">ℹ</span>
              <div>
                <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider mb-1">Xtratime Loan Recovery</p>
                <p className="text-[10px] font-bold text-blue-600 leading-relaxed">
                  This debit represents an Xtratime loan repayment — the subscriber's outstanding loan balance was recovered from their account. No bundle provisioning was expected for this transaction.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* CIS */}
            <div className={`p-4 rounded-xl border-2 ${trace.cisStatus === 'ok' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <div className="flex items-center space-x-2 mb-3">
                {stepOk(trace.cisStatus === 'ok')}
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-700">CIS · Subscription</span>
              </div>
              <dl className="space-y-1.5">
                <DataPair label="Status"  value={trace.cisStatus === 'ok' ? 'SUCCESS' : 'FAILURE'} />
                <DataPair label="Product" value={trace.productName} />
                <DataPair label="Amount"  value={fmtMoney(trace.chargeAmount)} />
                <DataPair label="Channel" value={trace.channel} />
                {trace.cisFailureReason && (
                  <DataPair label="Failure" value={trace.cisFailureReason} err />
                )}
              </dl>
            </div>

            {/* CCN */}
            <div className={`p-4 rounded-xl border-2 ${
              trace.fulfilmentStatus === 'GHOST_DEBIT'
                ? 'border-rose-300 bg-rose-50'
                : trace.ccnStatus === 'ok'
                  ? 'border-green-200 bg-green-50'
                  : 'border-amber-200 bg-amber-50'
            }`}>
              <div className="flex items-center space-x-2 mb-3">
                {trace.ccnStatus === 'ok' ? stepOk(true) : stepMissing()}
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-700">
                  CCN · MA Debit
                  {trace.fulfilmentStatus === 'GHOST_DEBIT' && (
                    <span className="ml-2 text-[8px] font-black text-rose-600 bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Anomalous</span>
                  )}
                </span>
              </div>
              {trace.ccnStatus === 'ok' ? (
                <dl className="space-y-1.5">
                  <DataPair label="Debit"      value={fmtMoney(trace.ccnDebit)} />
                  <DataPair label="Bal Before" value={fmtMoney(trace.ccnBalBefore)} />
                  <DataPair label="Bal After"  value={fmtMoney(trace.ccnBalAfter)} />
                </dl>
              ) : (
                <p className="text-[9px] font-bold text-amber-600">No CCN debit record found</p>
              )}
            </div>

            {/* SDP */}
            <div className={`p-4 rounded-xl border-2 ${trace.sdpStatus === 'ok' ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
              <div className="flex items-center space-x-2 mb-3">
                {trace.sdpStatus === 'ok' ? stepOk(true) : stepMissing()}
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-700">SDP · DA Credit</span>
              </div>
              {trace.sdpStatus === 'ok' ? (
                <dl className="space-y-1.5">
                  {(trace.sdpDaIds || []).map((daId, i) => (
                    <DataPair
                      key={daId}
                      label={`DA ${daId} · ${getDADescription(daId)}`}
                      value={trace.sdpDaAmounts?.[i]
                        ? formatDAAmount(daId, parseFloat(trace.sdpDaAmounts[i]))
                        : '—'}
                    />
                  ))}
                  {trace.sdpParamValue && (
                    <DataPair label="Param" value={trace.sdpParamValue} />
                  )}
                </dl>
              ) : (
                <p className="text-[9px] font-bold text-amber-600">No SDP credit record found</p>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}