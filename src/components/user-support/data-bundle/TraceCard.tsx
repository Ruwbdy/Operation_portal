
import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Package,
  Clock,
  Loader2,
} from 'lucide-react';
import { getDADescription, formatDAAmount } from '../../../services/da/da.mapping';
import type { FulfilmentTrace, FulfilmentStatus } from '../../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function fmtMoney(v: string | number | undefined): string {
  if (v === undefined || v === null || v === '' || v === 'NA') return '—';
  const n = parseFloat(String(v));
  if (isNaN(n)) return String(v);
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

type BadgeConfig = { label: string; cls: string };

const STATUS_BADGE_MAP: Record<FulfilmentStatus, BadgeConfig> = {
  FULFILLED:     { label: 'Fulfilled',      cls: 'bg-green-100 text-green-700 border-green-200' },
  LOAN_RECOVERY: { label: 'Loan Recovery',  cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  DATA_GIFTING:  { label: 'Data Gifting',   cls: 'bg-purple-100 text-purple-700 border-purple-200' },
  PAM_ISSUE:     { label: 'PAM Issue',      cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  GHOST_DEBIT:   { label: 'Ghost Debit ⚠',  cls: 'bg-rose-100 text-rose-700 border-rose-300' },
  PENDING_CCN:   { label: 'Pending CCN…',   cls: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  FAILED:        { label: 'Failed',          cls: 'bg-red-100 text-red-600 border-red-200' },
  CIS_FAILED:    { label: 'CIS Failed',      cls: 'bg-gray-100 text-gray-500 border-gray-200' },
};

export function statusBadge(status: FulfilmentStatus) {
  const { label, cls } = STATUS_BADGE_MAP[status];
  const isPending = status === 'PENDING_CCN';
  return (
    <span className={`inline-flex items-center gap-1.5 text-[8px] font-black px-2 py-1 rounded-full border uppercase tracking-wider ${cls}`}>
      {isPending && <Loader2 size={9} className="animate-spin" />}
      {label}
    </span>
  );
}

// ─── Card border colour by status ─────────────────────────────────────────────

const BORDER_CLS: Record<FulfilmentStatus, string> = {
  FULFILLED:     'border-green-200',
  LOAN_RECOVERY: 'border-blue-200',
  DATA_GIFTING:  'border-purple-200',
  PAM_ISSUE:     'border-amber-300',
  GHOST_DEBIT:   'border-rose-400',
  PENDING_CCN:   'border-yellow-400',
  FAILED:        'border-red-200',
  CIS_FAILED:    'border-gray-200',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function DataPair({ label, value, err }: { label: string; value: string; err?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      <span className={`text-[10px] font-bold break-all leading-snug ${err ? 'text-red-600' : 'text-gray-800'}`}>
        {value || '—'}
      </span>
    </div>
  );
}

function StepIcon({ ok, missing }: { ok?: boolean; missing?: boolean }) {
  if (ok)      return <CheckCircle2 size={16} className="text-green-500 shrink-0" />;
  if (missing) return <AlertCircle  size={16} className="text-amber-500 shrink-0" />;
  return       <XCircle size={16} className="text-red-500 shrink-0" />;
}

// ─── Panel components ─────────────────────────────────────────────────────────

function CISPanel({ trace }: { trace: FulfilmentTrace }) {
  const ok = trace.cisStatus === 'ok';
  return (
    <div className={`p-4 rounded-xl border-2 ${ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-center space-x-2 mb-3">
        <StepIcon ok={ok} />
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-700">
          CIS · Subscription
        </span>
      </div>
      <dl className="space-y-1.5">
        <DataPair label="Status"   value={ok ? 'SUCCESS' : 'FAILURE'} />
        <DataPair label="Product"  value={trace.productName} />
        <DataPair label="Offer ID" value={trace.offerId} />
        <DataPair label="Amount"   value={fmtMoney(trace.chargeAmount)} />
        <DataPair label="Channel"  value={trace.channel} />
        {trace.cisFailureReason && (
          <DataPair label="Failure Reason" value={trace.cisFailureReason} err />
        )}
      </dl>
    </div>
  );
}

function PAMPanel({ trace }: { trace: FulfilmentTrace }) {
  const { pamStatus, sdpDaIds, sdpDaAmounts, sdpParamValue } = trace;

  const panelCls =
    pamStatus === 'ok'      ? 'border-green-200 bg-green-50'  :
    pamStatus === 'issue'   ? 'border-amber-200 bg-amber-50'  :
                              'border-gray-200 bg-gray-50';

  const headerLabel =
    pamStatus === 'ok'    ? 'PAM · DA Credited' :
    pamStatus === 'issue' ? 'PAM · No DA Amounts' :
                            'PAM · No Record';

  return (
    <div className={`p-4 rounded-xl border-2 ${panelCls}`}>
      <div className="flex items-center space-x-2 mb-3">
        {pamStatus === 'ok'    && <StepIcon ok />}
        {pamStatus === 'issue' && <StepIcon missing />}
        {pamStatus === 'missing' && <StepIcon />}
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-700">
          {headerLabel}
        </span>
      </div>

      {pamStatus === 'ok' && (
        <dl className="space-y-1.5">
          {(sdpDaIds || []).map((daId, i) => (
            <DataPair
              key={daId}
              label={`DA ${daId} · ${getDADescription(daId)}`}
              // sdpDaAmounts now contains adj_amount parts (the credited amount)
              value={sdpDaAmounts?.[i]
                ? formatDAAmount(daId, parseFloat(sdpDaAmounts[i]))
                : '—'}
            />
          ))}
          {sdpParamValue && <DataPair label="Param Value" value={sdpParamValue} />}
        </dl>
      )}

      {pamStatus === 'issue' && (
        <div className="space-y-1.5">
          <p className="text-[9px] font-bold text-amber-700 leading-snug">
            PAM event received but adj_amount contains zero or empty values. DA accounts were targeted but no credit was applied.
          </p>
          {(sdpDaIds || []).length > 0 && (
            <dl className="space-y-1">
              {(sdpDaIds || []).map(daId => (
                <DataPair key={daId} label={`DA ${daId}`} value={`${getDADescription(daId)} — 0 credited`} err />
              ))}
            </dl>
          )}
        </div>
      )}

      {pamStatus === 'missing' && (
        <p className="text-[9px] font-bold text-gray-500">
          No PAM provisioning record found for this transaction.
        </p>
      )}
    </div>
  );
}

function CCNPanel({ trace }: { trace: FulfilmentTrace }) {
  const { ccnStatus, ccnDebit, ccnBalBefore, ccnBalAfter, fulfilmentStatus } = trace;
  const isPending = ccnStatus === 'pending';
  const isGhost   = fulfilmentStatus === 'GHOST_DEBIT';
  // CCN received but no debit amount — subscriber was NOT charged
  const isNoDebit = ccnStatus === 'ok' && (!ccnDebit || ccnDebit === 'NA' || parseFloat(String(ccnDebit)) === 0);

  const panelCls =
    isGhost    ? 'border-rose-300 bg-rose-50'       :
    isPending  ? 'border-yellow-300 bg-yellow-50/70' :
    isNoDebit  ? 'border-gray-200 bg-gray-50'        :
    ccnStatus === 'ok' ? 'border-emerald-200 bg-emerald-50' :
                         'border-gray-200 bg-gray-50';

  return (
    <div className={`p-4 rounded-xl border-2 ${panelCls}`}>
      <div className="flex items-center space-x-2 mb-3">
        {ccnStatus === 'ok' && !isNoDebit && <StepIcon ok />}
        {ccnStatus === 'ok' && isNoDebit  && <StepIcon missing />}
        {ccnStatus === 'missing' && <StepIcon missing />}
        {isPending && <Loader2 size={16} className="text-yellow-500 animate-spin shrink-0" />}
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-700">
          CCN · Debit {isPending ? 'Awaiting' : 'Confirmation'}
          {isGhost && (
            <span className="ml-2 text-[8px] font-black text-rose-600 bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded-full">
              Anomalous
            </span>
          )}
          {isNoDebit && (
            <span className="ml-2 text-[8px] font-black text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-full">
              No Charge
            </span>
          )}
        </span>
      </div>

      {ccnStatus === 'ok' && !isNoDebit && (
        <dl className="space-y-1.5">
          {/* totalcharge_money is the authoritative debit amount */}
          <DataPair label="Total Charge (CCN)"  value={fmtMoney(ccnDebit)} />
          <DataPair label="MA Balance Before"   value={fmtMoney(ccnBalBefore)} />
          <DataPair label="MA Balance After"    value={fmtMoney(ccnBalAfter)} />
        </dl>
      )}

      {ccnStatus === 'ok' && isNoDebit && (
        <p className="text-[9px] font-bold text-gray-500">
          CCN record received but <span className="font-black">totalcharge_money</span> is zero — no debit was applied to this subscriber's account.
        </p>
      )}

      {isPending && (
        <p className="text-[9px] font-bold text-yellow-700 leading-snug">
          Waiting for CCN event to confirm whether a debit was applied. This trace will update automatically when CCN data arrives.
        </p>
      )}

      {ccnStatus === 'missing' && !isPending && (
        <p className="text-[9px] font-bold text-gray-500">
          No CCN debit record found. Charge was not applied.
        </p>
      )}
    </div>
  );
}

// ─── Alert Banners ────────────────────────────────────────────────────────────

function GhostDebitBanner({ trace }: { trace: FulfilmentTrace }) {
  const isEVD = trace.channel?.toUpperCase() === 'EVD';
  return (
    <div className="flex items-start gap-3 bg-rose-50 border-2 border-rose-300 rounded-xl p-4">
      <span className="text-rose-500 text-lg shrink-0">⚠</span>
      <div>
        <p className="text-[10px] font-black text-rose-700 uppercase tracking-wider mb-1">Ghost Debit Detected</p>
        <p className="text-[10px] font-bold text-rose-600 leading-relaxed">
          CIS returned an error but CCN confirms a charge of{' '}
          {trace.ccnDebit ? fmtMoney(trace.ccnDebit) : 'an unknown amount'} was applied — subscriber
          was charged with no bundle delivered.{' '}
          {isEVD
            ? 'This transaction was via EVD — the subscriber should engage their dealer/agent channel for a refund.'
            : 'This likely indicates an AIR-level timeout during provisioning. A manual balance reversal may be required.'}
        </p>
      </div>
    </div>
  );
}

function PendingCCNBanner({ trace }: { trace: FulfilmentTrace }) {
  return (
    <div className="flex items-start gap-3 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
      <Loader2 size={18} className="text-yellow-500 animate-spin shrink-0 mt-0.5" />
      <div>
        <p className="text-[10px] font-black text-yellow-700 uppercase tracking-wider mb-1">
          Awaiting CCN Debit Confirmation
        </p>
        <p className="text-[10px] font-bold text-yellow-700 leading-relaxed">
          CIS returned error code <span className="font-black">{trace.downstreamErrorCode}</span>{' '}
          — charge status is ambiguous (request may have reached AIR). No PAM provisioning record found.
          This trace will automatically resolve to Ghost Debit or Failed once CCN data is received.
        </p>
      </div>
    </div>
  );
}

function PAMIssueBanner() {
  return (
    <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
      <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-1">PAM Provisioning Anomaly</p>
        <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
          CIS successfully processed the charge and a PAM event was received, but the DA credit amounts
          are zero or empty. The bundle may not have been provisioned correctly. Investigate SDP/AIR for
          the corresponding PAM service ID.
        </p>
      </div>
    </div>
  );
}

function LoanRecoveryBanner({ trace }: { trace: FulfilmentTrace }) {
  return (
    <div className="flex items-start gap-3 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
      <span className="text-blue-500 text-lg shrink-0">ℹ</span>
      <div>
        <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider mb-1">
          Xtratime Loan Recovery
        </p>
        <p className="text-[10px] font-bold text-blue-600 leading-relaxed">
          This debit is an Xtratime loan repayment — the subscriber's outstanding loan balance of{' '}
          {fmtMoney(trace.chargeAmount)} was recovered from their account.
          No bundle provisioning was expected for this transaction.
        </p>
      </div>
    </div>
  );
}

// ─── Mini Pipeline (header) ───────────────────────────────────────────────────

function MiniPipeline({ trace }: { trace: FulfilmentTrace }) {
  const showCCN =
    trace.fulfilmentStatus === 'GHOST_DEBIT' ||
    trace.fulfilmentStatus === 'PENDING_CCN' ||
    trace.ccnStatus === 'ok';

  return (
    <div className="hidden md:flex items-center space-x-1">
      {/* CIS */}
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[8px] font-black uppercase ${
        trace.cisStatus === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
      }`}>
        {trace.cisStatus === 'ok'
          ? <CheckCircle2 size={10} />
          : <XCircle size={10} />}
        <span>CIS</span>
      </div>

      <span className="text-gray-300 text-xs">→</span>

      {/* PAM */}
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[8px] font-black uppercase ${
        trace.pamStatus === 'ok'    ? 'bg-green-50 text-green-700'   :
        trace.pamStatus === 'issue' ? 'bg-amber-50 text-amber-600'   :
                                      'bg-gray-100 text-gray-500'
      }`}>
        {trace.pamStatus === 'ok'    && <CheckCircle2 size={10} />}
        {trace.pamStatus === 'issue' && <AlertCircle size={10} />}
        {trace.pamStatus === 'missing' && <XCircle size={10} />}
        <span>PAM</span>
      </div>

      {/* CCN (secondary — only when relevant) */}
      {showCCN && (
        <>
          <span className="text-gray-300 text-xs">→</span>
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[8px] font-black uppercase ${
            trace.ccnStatus === 'ok'      ? 'bg-emerald-50 text-emerald-700' :
            trace.ccnStatus === 'pending' ? 'bg-yellow-50 text-yellow-700'   :
                                            'bg-gray-100 text-gray-500'
          }`}>
            {trace.ccnStatus === 'ok'      && <CheckCircle2 size={10} />}
            {trace.ccnStatus === 'pending' && <Loader2 size={10} className="animate-spin" />}
            {trace.ccnStatus === 'missing' && <AlertCircle size={10} />}
            <span>CCN</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── TraceCard ────────────────────────────────────────────────────────────────

interface TraceCardProps {
  trace: FulfilmentTrace;
}

export default function TraceCard({ trace }: TraceCardProps) {
  const [expanded, setExpanded] = useState(false);

  const showCCNPanel =
    trace.fulfilmentStatus === 'GHOST_DEBIT' ||
    trace.fulfilmentStatus === 'PENDING_CCN' ||
    trace.ccnStatus === 'ok';

  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${BORDER_CLS[trace.fulfilmentStatus]}`}>

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
              {trace.isLoanRecovery && (
                <span className="ml-2 text-[8px] font-black text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                  Loan
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0 ml-4">
          <MiniPipeline trace={trace} />
          {statusBadge(trace.fulfilmentStatus)}
          {expanded
            ? <ChevronUp size={14} className="text-gray-400" />
            : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t border-gray-100 p-5 bg-gray-50/50 space-y-4">

          {/* Alert banners */}
          {trace.fulfilmentStatus === 'GHOST_DEBIT'    && <GhostDebitBanner trace={trace} />}
          {trace.fulfilmentStatus === 'PENDING_CCN'    && <PendingCCNBanner trace={trace} />}
          {trace.fulfilmentStatus === 'PAM_ISSUE'      && <PAMIssueBanner />}
          {trace.fulfilmentStatus === 'LOAN_RECOVERY'  && <LoanRecoveryBanner trace={trace} />}

          {/* Detail panels */}
          <div className={`grid gap-4 ${showCCNPanel ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
            <CISPanel trace={trace} />
            <PAMPanel trace={trace} />
            {showCCNPanel && <CCNPanel trace={trace} />}
          </div>

        </div>
      )}
    </div>
  );
}