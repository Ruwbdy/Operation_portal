import React, { useState, useMemo } from 'react';
import type {
  BundleFulfilmentRow,
  CISRecord,
  CCNRecord,
  SDPRecord,
} from '../../../services/bundle_data_interfaces';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  { key: 'tbl_dt',                 label: 'tbl_dt' },
  { key: 'msisdn',                 label: 'msisdn' },
  { key: 'beneficiary_msisdn',     label: 'beneficiary_msisdn' },
  { key: 'consumer_msisdn',        label: 'consumer_msisdn' },
  { key: 'transaction_date_time',  label: 'transaction_date_time' },
  { key: 'channel_name',           label: 'channel_name' },
  { key: 'product_id',             label: 'product_id' },
  { key: 'product_name',           label: 'product_name' },
  { key: 'product_type',           label: 'product_type' },
  { key: 'product_subtype',        label: 'product_subtype' },
  { key: 'product_flag',           label: 'product_flag' },
  { key: 'offer_id',               label: 'offer_id' },
  { key: 'action',                 label: 'action' },
  { key: 'renewal_adhoc',          label: 'renewal_adhoc' },
  { key: 'activation_time',        label: 'activation_time' },
  { key: 'expiry_time',            label: 'expiry_time' },
  { key: 'grace_period',           label: 'grace_period' },
  { key: 'correlation_id',         label: 'correlation_id' },
  { key: 'charging_amount',        label: 'charging_amount' },
  { key: 'f3pp_chargedamount',     label: 'f3pp_chargedamount' },
  { key: 'auto_renewal_consent',   label: 'auto_renewal_consent' },
  { key: 'provisioning_type',      label: 'provisioning_type' },
  { key: 'status',                 label: 'status' },
  { key: 'failure_reason',         label: 'failure_reason' },
  { key: 'notification_sent',      label: 'notification_sent' },
  { key: 'transaction_category',   label: 'transaction_category' },
  { key: 'loan_flag',              label: 'loan_flag' },
  { key: 'misc_param1',            label: 'misc_param1' },
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

// ─── Value pill badges ────────────────────────────────────────────────────────

function valuePill(colKey: string, raw: string): React.ReactNode {
  if (colKey === 'status') {
    return raw === 'SUCCESS'
      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-green-100 text-green-700 border border-green-200">✓ {raw}</span>
      : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-red-100 text-red-600 border border-red-200">✗ {raw}</span>;
  }
  if (colKey === 'action') {
    const cls =
      raw === 'Subscription' ? 'bg-blue-100 text-blue-700 border-blue-200' :
      raw === 'Deprovision'  ? 'bg-orange-100 text-orange-700 border-orange-200' :
                               'bg-gray-100 text-gray-600 border-gray-200';
    return <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black border ${cls}`}>{raw}</span>;
  }
  if (colKey === 'pam_event_type') {
    return raw === '1'
      ? <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200">1 · Credit</span>
      : raw === '5'
        ? <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-100 text-orange-700 border border-orange-200">5 · Expiry</span>
        : <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-gray-100 text-gray-600 border border-gray-200">{raw}</span>;
  }
  return null;
}

// ─── Cell ─────────────────────────────────────────────────────────────────────

function Cell({
  value,
  colKey,
  section,
  splitParts,
}: {
  value: any;
  colKey: string;
  section: Section;
  splitParts?: string[];
}) {
  const isEmpty = value === undefined || value === null || value === '' || value === 'NA';

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
      className={`px-3 py-2.5 text-[8px] font-black uppercase tracking-wider whitespace-nowrap border-r ${borderCls} cursor-pointer select-none hover:bg-black/5 transition-colors ${textCls}`}
    >
      <span className="flex items-center gap-0.5">
        {label}
        <SortIcon active={active} dir={sort?.dir ?? 'asc'} />
      </span>
    </th>
  );
}

// ─── RawDataTable ─────────────────────────────────────────────────────────────

interface RawDataTableProps {
  rows: BundleFulfilmentRow[];
}

export default function RawDataTable({ rows }: RawDataTableProps) {
  const [sort, setSort] = useState<SortState | null>(null);

  const handleSort = (section: Section, key: string) => {
    setSort(prev => {
      if (prev?.section === section && prev?.key === key) {
        return prev.dir === 'asc' ? { section, key, dir: 'desc' } : null;
      }
      return { section, key, dir: 'asc' };
    });
  };

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
      if (av === null || av === undefined || av === '') return 1;
      if (bv === null || bv === undefined || bv === '') return -1;
      const na = parseFloat(String(av)), nb = parseFloat(String(bv));
      const cmp = (!isNaN(na) && !isNaN(nb)) ? na - nb : String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sort]);

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
                  className={`border-b border-gray-100 hover:bg-yellow-50/50 transition-colors ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                  }`}
                >
                  {CIS_COLS.map(c => (
                    <Cell key={`cis-${c.key}`} colKey={String(c.key)} section="cis"
                      value={row.cis ? row.cis[c.key] : undefined} />
                  ))}
                  {CCN_COLS.map(c => (
                    <Cell key={`ccn-${c.key}`} colKey={String(c.key)} section="ccn"
                      value={row.ccn ? row.ccn[c.key] : undefined} />
                  ))}
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
          {sort && (
            <span className="ml-3 text-[#FFCC00] bg-black px-2 py-0.5 rounded">
              Sorted by {sort.section.toUpperCase()} · {sort.key} {sort.dir === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </span>
        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
          {totalCols} columns
        </span>
      </div>
    </div>
  );
}