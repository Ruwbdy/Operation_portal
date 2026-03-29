// Bundle Fulfilment Logic — row merging, trace building, CCN DA parsing
import { createLogger } from '../logger';
import type {
  CISRecord,
  CCNRecord,
  SDPRecord,
  BundleFulfilmentRow,
  FulfilmentTrace,
  FulfilmentStatus,
} from '../../types';

const log = createLogger('BundleLogic');

// ─── Response Code Classification ────────────────────────────────────────────

const AMBIGUOUS_RESPONSE_CODES = new Set(['-200','104', '126', '140', '191']);

export function extractResponseCode(
  failureReason: string | undefined | null
): string | undefined {
  if (!failureReason) return undefined;
  const match = failureReason.match(/responseCode=(-?\d+)/);
  return match ? match[1] : undefined;
}

function isAmbiguousError(failureReason: string | undefined | null): boolean {
  const code = extractResponseCode(failureReason);
  return code ? AMBIGUOUS_RESPONSE_CODES.has(code) : false;
}

function isDataGifting(cis: CISRecord): boolean {
  if (!cis.beneficiary_msisdn || cis.beneficiary_msisdn === "NA") return false; 
  return String(cis.msisdn) !== String(cis.beneficiary_msisdn);
}

function isLoanRecovery(cis: CISRecord): boolean {
  if (cis.loan_flag === '1') return true;
  const cat = (cis.transaction_category || '').toUpperCase();
  return cat.includes('LOAN') || cat.includes('XTRATIME');
}

function pamHasRealAmounts(sdp: SDPRecord): boolean {
  if (!sdp.da_account_id) return false;
  const daIds = sdp.da_account_id.split(':').filter(Boolean);
  if (daIds.length === 0) return false;
  if (!sdp.adj_amount) return false;
  const amounts = sdp.adj_amount.split(':').filter(Boolean);
  return amounts.some((a) => {
    const n = parseFloat(a);
    return !isNaN(n) && n !== 0;
  });
}

// ─── Join Helpers ─────────────────────────────────────────────────────────────

export function mergeCISIntoRows(
  rows: Map<string, BundleFulfilmentRow>,
  record: CISRecord
): void {
  const key = record.correlation_id;
  const existing = rows.get(key);
  if (existing) {
    existing.cis = record;
  } else {
    rows.set(key, { correlationId: key, cis: record, ccn: null, sdp: null, sdpExpiry: null });
  }
}

export function mergeCCNIntoRows(
  rows: Map<string, BundleFulfilmentRow>,
  record: CCNRecord
): void {
  const key = record.vas_transactionid || record.servicesessionid;
  const existing = rows.get(key);
  if (existing) {
    existing.ccn = record;
  } else {
    rows.set(key, { correlationId: key, cis: null, ccn: record, sdp: null, sdpExpiry: null });
  }
}

export function mergeSDPIntoRows(
  rows: Map<string, BundleFulfilmentRow>,
  record: SDPRecord
): void {
  const key = record.orig_transaction_id;
  if (!key) {
    log.warn('mergeSDPIntoRows — record missing orig_transaction_id, skipping', record);
    return;
  }
  const isExpiry = record.pam_event_type === '5';
  const existing = rows.get(key);
  if (existing) {
    if (isExpiry) existing.sdpExpiry = record;
    else existing.sdp = record;
  } else {
    rows.set(key, {
      correlationId: key,
      cis: null,
      ccn: null,
      sdp: isExpiry ? null : record,
      sdpExpiry: isExpiry ? record : null,
    });
  }
}

// ─── Fulfilment Trace Builder ─────────────────────────────────────────────────

export function buildFulfilmentTrace(row: BundleFulfilmentRow): FulfilmentTrace | null {
  const { cis, ccn, sdp } = row;
  if (!cis || cis.action !== 'Subscription') return null;

  const cisSuccess = cis.status === 'SUCCESS';
  const pamExists = !!sdp;
  const pamOk = pamExists && pamHasRealAmounts(sdp!);
  const pamIssue = pamExists && !pamOk;
  const ccnPresent = !!ccn;
  const loanRecovery = isLoanRecovery(cis);
  const dataGifting = isDataGifting(cis);
  const ambiguous = !cisSuccess && isAmbiguousError(cis.failure_reason);
  const errorCode = extractResponseCode(cis.failure_reason);

  let fulfilmentStatus: FulfilmentStatus;

  if (loanRecovery) {
    fulfilmentStatus = 'LOAN_RECOVERY';
  } else if (cisSuccess && dataGifting) {
    fulfilmentStatus = 'DATA_GIFTING';
  } else if (cisSuccess && pamOk) {
    fulfilmentStatus = 'FULFILLED';
  } else if (cisSuccess && pamIssue) {
    fulfilmentStatus = 'PAM_ISSUE';
  } else if (!cisSuccess && !pamExists) {
    fulfilmentStatus = ccnPresent ? 'GHOST_DEBIT' : 'PENDING_CCN';
  } else if (!cisSuccess) {
    fulfilmentStatus = 'FAILED';
  } else {
    fulfilmentStatus = 'CIS_FAILED';
  }

  let pamStatus: 'ok' | 'missing' | 'issue';
  if (!pamExists) pamStatus = 'missing';
  else if (pamOk) pamStatus = 'ok';
  else pamStatus = 'issue';

  let ccnStatus: 'ok' | 'missing' | 'pending';
  if (ccnPresent) ccnStatus = 'ok';
  else if (fulfilmentStatus === 'PENDING_CCN') ccnStatus = 'pending';
  else ccnStatus = 'missing';

  const sdpDaIds = sdp?.da_account_id
    ? sdp.da_account_id.split(':').filter(Boolean)
    : [];
  const sdpDaAmounts = sdp?.account_value_after
    ? sdp.account_value_after.split(':').filter(Boolean)
    : [];

  return {
    correlationId: row.correlationId,
    productName: cis.product_name,
    productId: cis.product_id,
    offerId: cis.offer_id,
    action: cis.action,
    transactionCategory: cis.transaction_category || '',
    channel: cis.channel_name,
    chargeAmount: cis.charging_amount,
    cisStatus: cisSuccess ? 'ok' : 'fail',
    cisFailureReason: !cisSuccess ? cis.failure_reason : undefined,
    downstreamErrorCode: errorCode,
    isLoanRecovery: loanRecovery,
    ccnStatus,
    ccnDebit: ccn?.ma_balance_change_enrich,
    ccnBalBefore: ccn?.ma_balancebeforeevent_enrich,
    ccnBalAfter: ccn?.ma_balanceaftertheevent_enrich,
    pamStatus,
    sdpDaIds,
    sdpDaAmounts,
    sdpParamValue: sdp?.parameter_value || undefined,
    fulfilmentStatus,
    timestamp: formatCISTimestamp(cis.transaction_date_time),
    rawTimestamp: cis.transaction_date_time,
  };
}

function formatCISTimestamp(epochMs: number): string {
  try {
    return new Date(epochMs).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(epochMs);
  }
}

// ─── CCN DA Parser ────────────────────────────────────────────────────────────

export interface CCNDASummary {
  daId: string;
  balBefore: string;
  balAfter: string;
  charged: string;
  currency: string;
}

export function parseCCNDas(das: string): CCNDASummary[] {
  if (!das) return [];
  return das.split(';').map((segment) => {
    const hashIdx = segment.indexOf('#');
    const daId = hashIdx >= 0 ? segment.slice(0, hashIdx) : '';
    const rest = hashIdx >= 0 ? segment.slice(hashIdx + 1) : segment;
    const parts = rest.split('~');
    return {
      daId,
      balBefore: parts[1] ?? '',
      balAfter: parts[2] ?? '',
      charged: parts[3] ?? '',
      currency: parts[4] ?? '',
    };
  });
}