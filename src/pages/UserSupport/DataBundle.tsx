import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Wifi,
  WifiOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Package,
  Database,
  Zap,
  Clock,
} from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';
import Toast from '../../components/common/Toast';
import { validateMSISDN, validateDateRange } from '../../utils/validators';
import { getDADescription, formatDAAmount } from '../../services/daMapping';
import type {
  CISRecord,
  CCNRecord,
  SDPRecord,
  BundleFulfilmentRow,
  FulfilmentTrace,
  FulfilmentStatus,
} from '../../services/bundle_data_interfaces';
import {
  streamBundleData,
  mergeCISIntoRows,
  mergeCCNIntoRows,
  mergeSDPIntoRows,
  buildFulfilmentTrace,
  parseCCNDas,
} from '../../services/bundleService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function todayLocal() { return fmtDate(new Date()); }

function fmtEpoch(ms: number): string {
  try {
    return new Date(ms).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return String(ms); }
}

function fmtMoney(v: string | number | undefined): string {
  if (v === undefined || v === null || v === '' || v === 'NA') return '—';
  const n = parseFloat(String(v));
  if (isNaN(n)) return String(v);
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusBadge(status: FulfilmentStatus) {
  const map: Record<FulfilmentStatus, { label: string; cls: string }> = {
    FULFILLED:    { label: 'Fulfilled',     cls: 'bg-green-100 text-green-700 border-green-200' },
    PARTIAL:      { label: 'Partial',       cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    FAILED:       { label: 'Failed',        cls: 'bg-red-100 text-red-700 border-red-200' },
    CIS_FAILED:   { label: 'CIS Failed',    cls: 'bg-gray-100 text-gray-600 border-gray-200' },
    GHOST_DEBIT:  { label: 'Ghost Debit ⚠', cls: 'bg-rose-100 text-rose-700 border-rose-300' },
  };
  const { label, cls } = map[status];
  return (
    <span className={`text-[8px] font-black px-2 py-1 rounded-full border uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
}

// ─── Streaming Indicator ──────────────────────────────────────────────────────

function StreamingBadge({ phase }: { phase: string }) {
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
        {[0,1,2].map(i => (
          <span key={i} className="w-1 h-1 bg-[#FFCC00] rounded-full animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </span>
    </div>
  );
}

// ─── Fulfilment Trace Card ────────────────────────────────────────────────────

function TraceCard({ trace }: { trace: FulfilmentTrace }) {
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
                  This likely indicates an SDP system timeout during provisioning. A manual balance reversal may be required.
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
              <DataPair label="Status" value={trace.cisStatus === 'ok' ? 'SUCCESS' : 'FAILURE'} />
              <DataPair label="Product" value={trace.productName} />
              <DataPair label="Amount" value={fmtMoney(trace.chargeAmount)} />
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
                <DataPair label="Debit" value={fmtMoney(trace.ccnDebit)} />
                <DataPair label="Bal Before" value={fmtMoney(trace.ccnBalBefore)} />
                <DataPair label="Bal After" value={fmtMoney(trace.ccnBalAfter)} />
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

function DataPair({ label, value, err }: { label: string; value: string; err?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      <span className={`text-[10px] font-bold break-all ${err ? 'text-red-600' : 'text-gray-800'}`}>{value || '—'}</span>
    </div>
  );
}

// ─── Table types ──────────────────────────────────────────────────────────────

type Section = 'cis' | 'ccn' | 'sdp';
type SortDir = 'asc' | 'desc';
interface SortState { section: Section; key: string; dir: SortDir }

// SDP fields that contain colon-separated lists aligned with da_account_id
const SDP_SPLIT_FIELDS = new Set([
  'da_account_id',
  'account_value_before',
  'account_value_after',
  'adj_amount',
]);

// ─── Column definitions ───────────────────────────────────────────────────────

const CIS_COLS: { key: keyof CISRecord; label: string }[] = [
  { key: 'tbl_dt',                label: 'tbl_dt' },
  { key: 'msisdn',                label: 'msisdn' },
  { key: 'beneficiary_msisdn',    label: 'beneficiary_msisdn' },
  { key: 'consumer_msisdn',       label: 'consumer_msisdn' },
  { key: 'transaction_date_time', label: 'transaction_date_time' },
  { key: 'channel_name',          label: 'channel_name' },
  { key: 'product_id',            label: 'product_id' },
  { key: 'product_name',          label: 'product_name' },
  { key: 'product_type',          label: 'product_type' },
  { key: 'product_subtype',       label: 'product_subtype' },
  { key: 'product_flag',          label: 'product_flag' },
  { key: 'offer_id',              label: 'offer_id' },
  { key: 'action',                label: 'action' },
  { key: 'renewal_adhoc',         label: 'renewal_adhoc' },
  { key: 'activation_time',       label: 'activation_time' },
  { key: 'expiry_time',           label: 'expiry_time' },
  { key: 'grace_period',          label: 'grace_period' },
  { key: 'correlation_id',        label: 'correlation_id' },
  { key: 'charging_amount',       label: 'charging_amount' },
  { key: 'f3pp_chargedamount',    label: 'f3pp_chargedamount' },
  { key: 'auto_renewal_consent',  label: 'auto_renewal_consent' },
  { key: 'provisioning_type',     label: 'provisioning_type' },
  { key: 'status',                label: 'status' },
  { key: 'failure_reason',        label: 'failure_reason' },
  { key: 'notification_sent',     label: 'notification_sent' },
  { key: 'transaction_category',  label: 'transaction_category' },
  { key: 'loan_flag',             label: 'loan_flag' },
  { key: 'misc_param1',           label: 'misc_param1' },
];

const CCN_COLS: { key: keyof CCNRecord; label: string }[] = [
  { key: 'processed_timestamp',            label: 'processed_timestamp' },
  { key: 'servicetype',                    label: 'servicetype' },
  { key: 'servicesessionid',               label: 'servicesessionid' },
  { key: 'chargingcontextid',              label: 'chargingcontextid' },
  { key: 'totalcharge_money',              label: 'totalcharge_money' },
  { key: 'das',                            label: 'das' },
  { key: 'da_enrich_offer_desc',           label: 'da_enrich_offer_desc' },
  { key: 'ma_balancebeforeevent_enrich',   label: 'ma_balancebeforeevent_enrich' },
  { key: 'ma_balanceaftertheevent_enrich', label: 'ma_balanceaftertheevent_enrich' },
  { key: 'ma_balance_change_enrich',       label: 'ma_balance_change_enrich' },
  { key: 'vas_transactionid',              label: 'vas_transactionid' },
  { key: 'vas_chargeamount',               label: 'vas_chargeamount' },
  { key: 'vas_channelname',                label: 'vas_channelname' },
  { key: 'vas_productid',                  label: 'vas_productid' },
  { key: 'vas_productname',                label: 'vas_productname' },
];

const SDP_COLS: { key: keyof SDPRecord; label: string }[] = [
  { key: 'msisdn_key',               label: 'msisdn_key' },
  { key: 'subscriber_nr',            label: 'subscriber_nr' },
  { key: 'tbl_dt',                   label: 'tbl_dt' },
  { key: 'service_class_id',         label: 'service_class_id' },
  { key: 'origin_operator_id',       label: 'origin_operator_id' },
  { key: 'origin_node_type',         label: 'origin_node_type' },
  { key: 'orig_transaction_id',      label: 'orig_transaction_id' },
  { key: 'pam_event_type',           label: 'pam_event_type' },
  { key: 'pam_service_id',           label: 'pam_service_id' },
  { key: 'pam_class_id',             label: 'pam_class_id' },
  { key: 'pam_ind',                  label: 'pam_ind' },
  { key: 'balance_before',           label: 'balance_before' },
  { key: 'balance_after',            label: 'balance_after' },
  { key: 'da_account_id',            label: 'da_account_id' },
  { key: 'account_value_before',     label: 'account_value_before' },
  { key: 'account_value_after',      label: 'account_value_after' },
  { key: 'adj_amount',               label: 'adj_amount' },
  { key: 'cleared_account_value',    label: 'cleared_account_value' },
  { key: 'account_value_initial',    label: 'account_value_initial' },
  { key: 'account_dt_before',        label: 'account_dt_before' },
  { key: 'account_dt_after',         label: 'account_dt_after' },
  { key: 'account_expiry_dt_before', label: 'account_expiry_dt_before' },
  { key: 'account_expiry_dt_after',  label: 'account_expiry_dt_after' },
  { key: 'usage_counter_id',         label: 'usage_counter_id' },
  { key: 'adj_offer_id',             label: 'adj_offer_id' },
  { key: 'parameter_value',          label: 'parameter_value' },
];

// ─── Style helpers ────────────────────────────────────────────────────────────

// Pill badges for specific field values
function valuePill(colKey: string, raw: string): React.ReactNode {
  // CIS status
  if (colKey === 'status') {
    return raw === 'SUCCESS'
      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-green-100 text-green-700 border border-green-200">✓ {raw}</span>
      : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-red-100 text-red-600 border border-red-200">✗ {raw}</span>;
  }
  // CIS action
  if (colKey === 'action') {
    const cls =
      raw === 'Subscription' ? 'bg-blue-100 text-blue-700 border-blue-200' :
      raw === 'Deprovision'  ? 'bg-orange-100 text-orange-700 border-orange-200' :
                               'bg-gray-100 text-gray-600 border-gray-200';
    return <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black border ${cls}`}>{raw}</span>;
  }
  // SDP pam_event_type
  if (colKey === 'pam_event_type') {
    return raw === '1'
      ? <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200">1 · Credit</span>
      : raw === '5'
        ? <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-100 text-orange-700 border border-orange-200">5 · Expiry</span>
        : <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-gray-100 text-gray-600 border border-gray-200">{raw}</span>;
  }
  return null;
}

// ─── Cell renderer ────────────────────────────────────────────────────────────

function Cell({
  value,
  colKey,
  section,
  splitParts,
}: {
  value: any;
  colKey: string;
  section: Section;
  splitParts?: string[]; // pre-split tokens for SDP split fields
}) {
  const isEmpty = value === undefined || value === null || value === '' || value === 'NA';

  // Border colour per section
  const borderCls =
    section === 'cis' ? 'border-blue-50' :
    section === 'ccn' ? 'border-emerald-50' :
                        'border-purple-50';

  if (isEmpty && !splitParts) {
    return (
      <td className={`px-3 py-2.5 border-r ${borderCls} last:border-r-0 whitespace-nowrap`}>
        <span className="text-gray-200 select-none text-[10px]">—</span>
      </td>
    );
  }

  const raw = String(value ?? '');
  const pill = valuePill(colKey, raw);

  // Split field: render stacked chips
  if (splitParts) {
    const hasParts = splitParts.some(p => p !== '');
    return (
      <td className={`px-3 py-2.5 border-r ${borderCls} last:border-r-0`}>
        {hasParts ? (
          <div className="flex flex-col gap-1">
            {splitParts.map((part, i) => (
              part === '' || part === 'NA'
                ? <span key={i} className="text-gray-200 text-[9px]">—</span>
                : <span
                    key={i}
                    className="inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-50 text-purple-800 border border-purple-100 whitespace-nowrap"
                  >
                    {part}
                  </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-200 select-none text-[10px]">—</span>
        )}
      </td>
    );
  }

  return (
    <td className={`px-3 py-2.5 border-r ${borderCls} last:border-r-0 whitespace-nowrap`}>
      {pill ?? <span className="text-[10px] font-mono text-gray-700">{raw}</span>}
    </td>
  );
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-1 text-gray-300 text-[8px]">↕</span>;
  return <span className="ml-1 text-[8px]">{dir === 'asc' ? '↑' : '↓'}</span>;
}

// ─── Sortable column header ───────────────────────────────────────────────────

function SortableTh({
  colKey,
  label,
  section,
  sort,
  onSort,
  textCls,
  borderCls,
}: {
  colKey: string;
  label: string;
  section: Section;
  sort: SortState | null;
  onSort: (section: Section, key: string) => void;
  textCls: string;
  borderCls: string;
}) {
  const active = sort?.section === section && sort?.key === colKey;
  return (
    <th
      onClick={() => onSort(section, colKey)}
      className={`px-3 py-2.5 text-[8px] font-black uppercase tracking-wider whitespace-nowrap border-r ${borderCls} cursor-pointer select-none hover:bg-black/5 transition-colors group ${textCls}`}
    >
      <span className="flex items-center gap-0.5">
        {label}
        <SortIcon active={active} dir={sort?.dir ?? 'asc'} />
      </span>
    </th>
  );
}

// ─── Raw Data Table ───────────────────────────────────────────────────────────

function RawDataTable({ rows }: { rows: BundleFulfilmentRow[] }) {
  const [sort, setSort] = useState<SortState | null>(null);

  const handleSort = (section: Section, key: string) => {
    setSort(prev => {
      if (prev?.section === section && prev?.key === key) {
        return prev.dir === 'asc' ? { section, key, dir: 'desc' } : null;
      }
      return { section, key, dir: 'asc' };
    });
  };

  // Sort rows
  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    return [...rows].sort((a, b) => {
      let av: any, bv: any;
      if (sort.section === 'cis') {
        av = a.cis ? (a.cis as any)[sort.key] : null;
        bv = b.cis ? (b.cis as any)[sort.key] : null;
      } else if (sort.section === 'ccn') {
        av = a.ccn ? (a.ccn as any)[sort.key] : null;
        bv = b.ccn ? (b.ccn as any)[sort.key] : null;
      } else {
        const sa = a.sdp ?? a.sdpExpiry;
        const sb = b.sdp ?? b.sdpExpiry;
        av = sa ? (sa as any)[sort.key] : null;
        bv = sb ? (sb as any)[sort.key] : null;
      }
      // Nulls last
      if (av === null || av === undefined || av === '') return 1;
      if (bv === null || bv === undefined || bv === '') return -1;
      // Numeric sort if both look numeric
      const na = parseFloat(String(av)), nb = parseFloat(String(bv));
      const cmp = (!isNaN(na) && !isNaN(nb)) ? na - nb : String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sort]);

  // Pre-compute split parts for SDP split fields per row (keyed by correlationId+field)
  const getSplitParts = (sdpRec: SDPRecord | null, key: string): string[] | undefined => {
    if (!sdpRec || !SDP_SPLIT_FIELDS.has(key)) return undefined;
    const raw = String((sdpRec as any)[key] ?? '');
    return raw.split(':');
  };

  const totalCols = CIS_COLS.length + CCN_COLS.length + SDP_COLS.length;

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
        <table className="border-collapse text-left" style={{ minWidth: 'max-content' }}>
          <thead className="sticky top-0 z-10">
            {/* Section band */}
            <tr>
              <th colSpan={CIS_COLS.length} className="px-3 py-2 text-[8px] font-black uppercase tracking-[0.2em] text-center bg-blue-600 text-white border-r border-blue-500">
                CIS CDR
              </th>
              <th colSpan={CCN_COLS.length} className="px-3 py-2 text-[8px] font-black uppercase tracking-[0.2em] text-center bg-emerald-600 text-white border-r border-emerald-500">
                CCN CDR
              </th>
              <th colSpan={SDP_COLS.length} className="px-3 py-2 text-[8px] font-black uppercase tracking-[0.2em] text-center bg-purple-600 text-white">
                SDP CDR
              </th>
            </tr>
            {/* Column headers */}
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              {CIS_COLS.map(c => (
                <SortableTh key={`cis-h-${c.key}`} colKey={String(c.key)} label={c.label} section="cis"
                  sort={sort} onSort={handleSort} textCls="text-blue-700" borderCls="border-blue-100" />
              ))}
              {CCN_COLS.map(c => (
                <SortableTh key={`ccn-h-${c.key}`} colKey={String(c.key)} label={c.label} section="ccn"
                  sort={sort} onSort={handleSort} textCls="text-emerald-700" borderCls="border-emerald-100" />
              ))}
              {SDP_COLS.map(c => (
                <SortableTh key={`sdp-h-${c.key}`} colKey={String(c.key)} label={c.label} section="sdp"
                  sort={sort} onSort={handleSort} textCls="text-purple-700" borderCls="border-purple-100" />
              ))}
            </tr>
          </thead>

          <tbody>
            {sortedRows.map((row, idx) => {
              const sdpRec = row.sdp ?? row.sdpExpiry;
              return (
                <tr
                  key={row.correlationId}
                  className={`border-b border-gray-100 hover:bg-yellow-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                >
                  {/* CIS */}
                  {CIS_COLS.map(c => (
                    <Cell key={`cis-${c.key}`} colKey={String(c.key)} section="cis"
                      value={row.cis ? row.cis[c.key] : undefined} />
                  ))}
                  {/* CCN */}
                  {CCN_COLS.map(c => (
                    <Cell key={`ccn-${c.key}`} colKey={String(c.key)} section="ccn"
                      value={row.ccn ? row.ccn[c.key] : undefined} />
                  ))}
                  {/* SDP */}
                  {SDP_COLS.map(c => (
                    <Cell key={`sdp-${c.key}`} colKey={String(c.key)} section="sdp"
                      value={sdpRec ? sdpRec[c.key] : undefined}
                      splitParts={getSplitParts(sdpRec, String(c.key))} />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
          {sortedRows.length} row{sortedRows.length !== 1 ? 's' : ''}
          {sort && <span className="ml-3 text-[#FFCC00] bg-black px-2 py-0.5 rounded">
            Sorted by {sort.section.toUpperCase()} · {sort.key} {sort.dir === 'asc' ? '↑' : '↓'}
          </span>}
        </span>
        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
          {totalCols} columns
        </span>
      </div>
    </div>
  );
}

// ─── Event Status Bar ─────────────────────────────────────────────────────────

interface EventStatusBarProps {
  streamPhase: string;
  cisCount: number | null;
  ccnCount: number | null;
  sdpCount: number | null;
}

function EventStatusBar({ streamPhase, cisCount, ccnCount, sdpCount }: EventStatusBarProps) {
  const isStreaming = streamPhase !== 'idle' && streamPhase !== 'complete' && streamPhase !== 'error';
  const isComplete  = streamPhase === 'complete' || streamPhase === 'error';

  type EventState = 'idle' | 'waiting' | 'received' | 'missing';

  // Derive per-event state
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
              {isWaiting  && (
                <span className="flex gap-0.5">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1 h-1 bg-[#FFCC00] rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 100}ms` }} />
                  ))}
                </span>
              )}
              {isMissing  && <span className="text-red-400 text-sm font-black">✗</span>}
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

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ traces }: { traces: FulfilmentTrace[] }) {
  const fulfilled  = traces.filter(t => t.fulfilmentStatus === 'FULFILLED').length;
  const partial    = traces.filter(t => t.fulfilmentStatus === 'PARTIAL').length;
  const failed     = traces.filter(t => t.fulfilmentStatus === 'FAILED').length;
  const cisFailed  = traces.filter(t => t.fulfilmentStatus === 'CIS_FAILED').length;
  const ghostDebit = traces.filter(t => t.fulfilmentStatus === 'GHOST_DEBIT').length;
  const total = traces.length;

  if (total === 0) return null;

  return (
    <div className="flex flex-wrap gap-4 bg-white px-8 py-5 rounded-2xl shadow border border-gray-100 mb-6">
      {[
        { label: 'Subscriptions', value: total, cls: 'text-black' },
        { label: 'Fulfilled', value: fulfilled, cls: 'text-green-600' },
        { label: 'Partial', value: partial, cls: 'text-amber-600' },
        { label: 'Ghost Debit ⚠', value: ghostDebit, cls: 'text-rose-600' },
        { label: 'Failed @ CCN/SDP', value: failed, cls: 'text-red-500' },
        { label: 'CIS Failed', value: cisFailed, cls: 'text-gray-400' },
      ].map(({ label, value, cls }) => (
        <div key={label} className="flex flex-col items-center min-w-[80px]">
          <span className={`text-2xl font-black ${cls}`}>{value}</span>
          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DataBundle() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [msisdn, setMsisdn] = useState('');
  const [startDate, setStartDate] = useState(todayLocal());
  const [endDate, setEndDate] = useState(todayLocal());
  const [activeView, setActiveView] = useState<'trace' | 'table'>('trace');

  const [streamPhase, setStreamPhase] = useState<string>('idle');
  const [rows, setRows] = useState<Map<string, BundleFulfilmentRow>>(new Map());
  const [traces, setTraces] = useState<FulfilmentTrace[]>([]);
  const rowsRef = useRef<Map<string, BundleFulfilmentRow>>(new Map());

  // Per-event receipt tracking
  const [cisCount,  setCisCount]  = useState<number | null>(null); // null = not yet received
  const [ccnCount,  setCcnCount]  = useState<number | null>(null);
  const [sdpCount,  setSdpCount]  = useState<number | null>(null);

  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const abortRef = useRef<(() => void) | null>(null);

  const rebuildState = useCallback(() => {
    const newMap = new Map(rowsRef.current);
    setRows(newMap);
    const newTraces = Array.from(newMap.values())
      .map(buildFulfilmentTrace)
      .filter((t): t is FulfilmentTrace => t !== null)
      .sort((a, b) => b.rawTimestamp - a.rawTimestamp);
    setTraces(newTraces);
  }, []);

  const handleSearch = () => {
    const msisdnValidation = validateMSISDN(msisdn);
    if (!msisdnValidation.valid) { setErrorToast(msisdnValidation.error || 'Invalid MSISDN'); return; }
    const dateValidation = validateDateRange(startDate, endDate);
    if (!dateValidation.valid) { setErrorToast(dateValidation.error || 'Invalid date range'); return; }

    // Reset state
    if (abortRef.current) abortRef.current();
    rowsRef.current = new Map();
    setRows(new Map());
    setTraces([]);
    setStreamPhase('connecting');
    setCisCount(null);
    setCcnCount(null);
    setSdpCount(null);

    const norm = msisdnValidation.normalized!;
    const sd = startDate.replace(/-/g, '');
    const ed = endDate.replace(/-/g, '');

    abortRef.current = streamBundleData(norm, sd, ed, {
      onCIS: (records) => {
        records.forEach(r => mergeCISIntoRows(rowsRef.current, r));
        setCisCount(records.length);
        rebuildState();
      },
      onCCN: (records) => {
        records.forEach(r => mergeCCNIntoRows(rowsRef.current, r));
        setCcnCount(records.length);
        rebuildState();
      },
      onSDP: (records) => {
        records.forEach(r => mergeSDPIntoRows(rowsRef.current, r));
        setSdpCount(records.length);
        rebuildState();
      },
      onPhaseChange: (phase) => setStreamPhase(phase),
      onError: (msg) => { setErrorToast(msg); setStreamPhase('error'); },
      onComplete: () => {
        setStreamPhase('complete');
        setSuccessToast('Stream complete');
      },
    });
  };

  const hasData = rows.size > 0;
  const sortedRows = Array.from(rows.values()).sort((a, b) => {
    const ta = a.cis?.transaction_date_time ?? 0;
    const tb = b.cis?.transaction_date_time ?? 0;
    return tb - ta;
  });

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] selection:bg-[#FFCC00] selection:text-black font-sans">
      {/* Toasts */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center space-y-4 pointer-events-none">
        {errorToast && <Toast type="error" message={errorToast} onClose={() => setErrorToast(null)} />}
        {successToast && <Toast type="success" message={successToast} onClose={() => setSuccessToast(null)} />}
      </div>

      <Sidebar isOpen={isSidebarOpen} />

      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed bottom-8 left-8 z-[60] bg-black text-[#FFCC00] p-4 rounded-xl shadow-2xl hover:scale-110 active:scale-95 transition-all border border-white/10"
        >
          <PanelLeftOpen size={24} />
        </button>
      )}

      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto transition-all duration-500">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12">
          <div className="space-y-3 min-w-0">
            <div className="flex items-center space-x-4 mb-1">
              {isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-[#FFCC00] transition-colors shrink-0"
                >
                  <PanelLeftClose size={20} />
                </button>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-gray-400 text-[8px] font-black uppercase tracking-[0.2em]">User Support Module</span>
                <div className="flex items-center space-x-2">
                  <span className="bg-black text-[#FFCC00] text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Active</span>
                  <StreamingBadge phase={streamPhase} />
                </div>
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-black tracking-tighter uppercase leading-none italic">
              Bundle Fulfilment
            </h1>
            <p className="text-sm font-bold text-gray-400 max-w-xl">
              Real-time trace of CIS → CCN → SDP for each subscription event. Diagnose where in the fulfilment chain an issue occurred.
            </p>
          </div>
        </header>

        {/* Search */}
        <div className="max-w-4xl mb-10">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">MSISDN</label>
                <input
                  type="text"
                  value={msisdn}
                  onChange={e => setMsisdn(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="234XXXXXXXXXX or 09XXXXXXXXX"
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-black font-bold text-sm focus:outline-none focus:border-[#FFCC00] transition-colors placeholder:text-gray-300"
                />
              </div>
              <div>
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-black font-bold text-sm focus:outline-none focus:border-[#FFCC00] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-black font-bold text-sm focus:outline-none focus:border-[#FFCC00] transition-colors"
                />
              </div>
            </div>
            <button
              onClick={handleSearch}
              disabled={streamPhase === 'connecting' || streamPhase === 'cis' || streamPhase === 'ccn' || streamPhase === 'sdp'}
              className="w-full mt-6 px-8 py-4 bg-black text-[#FFCC00] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-900 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
            >
              {streamPhase !== 'idle' && streamPhase !== 'complete' && streamPhase !== 'error' ? (
                <>
                  <Wifi size={16} className="animate-pulse" />
                  <span>Streaming…</span>
                </>
              ) : (
                <>
                  <Search size={16} />
                  <span>Fetch Fulfilment Data</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Event receipt status — visible from first search until session reset */}
        {streamPhase !== 'idle' && (
          <EventStatusBar
            streamPhase={streamPhase}
            cisCount={cisCount}
            ccnCount={ccnCount}
            sdpCount={sdpCount}
          />
        )}

        {/* Stats */}
        {hasData && <StatsBar traces={traces} />}

        {/* View Toggle */}
        {hasData && (
          <div className="flex space-x-3 bg-white p-2.5 rounded-[1.5rem] shadow border border-gray-100 max-w-fit mb-8">
            {[
              { id: 'trace', label: 'Fulfilment Trace', icon: <Zap size={13} /> },
              { id: 'table', label: 'Raw Data Table',   icon: <Database size={13} /> },
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id as any)}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${
                  activeView === v.id ? 'bg-black text-[#FFCC00] shadow' : 'text-gray-400 hover:text-black hover:bg-gray-50'
                }`}
              >
                <span className={activeView === v.id ? 'text-[#FFCC00]' : 'text-gray-400'}>{v.icon}</span>
                <span>{v.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {hasData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeView === 'trace' && (
              <div className="space-y-3 max-w-5xl">
                {traces.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center">
                    <Clock size={40} className="text-gray-200 mx-auto mb-4" />
                    <p className="text-sm font-bold text-gray-400">No subscription events found — only non-subscription actions loaded</p>
                  </div>
                ) : (
                  traces.map(t => <TraceCard key={t.correlationId} trace={t} />)
                )}
              </div>
            )}

            {activeView === 'table' && (
              <RawDataTable rows={sortedRows} />
            )}
          </div>
        )}

        {/* Empty state */}
        {!hasData && streamPhase === 'idle' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white p-16 rounded-[2.5rem] shadow-xl border border-gray-100 text-center">
              <div className="bg-gray-50 w-24 h-24 rounded-2xl mx-auto mb-8 flex items-center justify-center">
                <Package size={48} className="text-gray-200" />
              </div>
              <h2 className="text-2xl font-black text-black uppercase tracking-tight mb-4 italic">Enter Subscriber Details</h2>
              <p className="text-gray-400 text-sm font-bold leading-relaxed">
                Enter an MSISDN and date range to stream real-time CIS, CCN, and SDP bundle fulfilment records.
              </p>
            </div>
          </div>
        )}

        {!hasData && streamPhase !== 'idle' && streamPhase !== 'complete' && streamPhase !== 'error' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white p-16 rounded-[2.5rem] shadow-xl border border-[#FFCC00] text-center">
              <Wifi size={48} className="text-[#FFCC00] mx-auto mb-6 animate-pulse" />
              <h2 className="text-xl font-black text-black uppercase tracking-tight mb-2 italic">Streaming Data…</h2>
              <p className="text-gray-400 text-sm font-bold">Waiting for CIS · CCN · SDP events</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}