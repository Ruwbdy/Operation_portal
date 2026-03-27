// Bundle Fulfilment SSE Service
// Handles the SSE stream, parsing, and joining of CIS/CCN/SDP events
import { API_ENDPOINTS } from './api_endpoints';
import { getAuthHeader } from './auth_service';
import { createLogger } from './logger';
import type {
  CISRecord,
  CCNRecord,
  SDPRecord,
  BundleFulfilmentRow,
  FulfilmentTrace,
  FulfilmentStatus,
} from './bundle_data_interfaces';

const log = createLogger('BundleService');

// ─── Response Code Classification ────────────────────────────────────────────
//
// AMBIGUOUS codes: request reached AIR/charging platform but outcome is unclear.
// Charge may or may not have been applied. CCN must arbitrate.
//
//   104  Temporary blocked
//   126  Account not active
//   140  Invalid old Service Class
//   191  PAM service id out of range / did not exist
//
// All other codes are treated as CLEAN REJECTIONS:
//   -200  External system down (never reached charge platform)
//   102   Subscriber not found
//   9001  Ineligible (business rule rejection)
//   4010  DIAMETER_END_USER_SERVICE_DENIED
//   4012  DIAMETER_CREDIT_LIMIT_REACHED
//   etc.

const AMBIGUOUS_RESPONSE_CODES = new Set(['104', '126', '140', '191']);

/**
 * Extract the numeric responseCode from a CIS failure_reason string.
 * Format: "responseCode=<code>;Desc=...;External Node=..."
 */
export function extractResponseCode(failureReason: string | undefined | null): string | undefined {
  if (!failureReason) return undefined;
  const match = failureReason.match(/responseCode=(-?\d+)/);
  return match ? match[1] : undefined;
}

/**
 * Returns true if the failure_reason contains an ambiguous AIR-level response
 * code where the charge status is unknown and CCN must confirm.
 */
function isAmbiguousError(failureReason: string | undefined | null): boolean {
  const code = extractResponseCode(failureReason);
  return code ? AMBIGUOUS_RESPONSE_CODES.has(code) : false;
}


// ─── Data Gifting ──────────────────────────────────────────
function isDataGifting(cis: CISRecord): boolean {
 if (String(cis.msisdn) !== String(cis.beneficiary_msisdn)) return true;
  return false;
}

// ─── Loan Detection ───────────────────────────────────────────────────────────

function isLoanRecovery(cis: CISRecord): boolean {
  if (cis.loan_flag === '1') return true;
  const cat = (cis.transaction_category || '').toUpperCase();
  return cat.includes('LOAN') || cat.includes('XTRATIME');
}

// ─── PAM Amount Validation ────────────────────────────────────────────────────

/**
 * Returns true if the PAM (SDP credit) record actually contains
 * non-zero DA credit amounts. A row with empty/zero adj_amount
 * indicates the provisioning event fired but nothing was credited.
 */
function pamHasRealAmounts(sdp: SDPRecord): boolean {
  if (!sdp.da_account_id) return false;
  const daIds = sdp.da_account_id.split(':').filter(Boolean);
  if (daIds.length === 0) return false;
  if (!sdp.adj_amount) return false;
  const amounts = sdp.adj_amount.split(':').filter(Boolean);
  return amounts.some(a => {
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
  const existing = rows.get(key);
  const isExpiry = record.pam_event_type === '5';
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

  // Only build traces for Subscription actions
  if (!cis || cis.action !== 'Subscription') return null;

  const cisSuccess   = cis.status === 'SUCCESS';
  const pamExists    = !!sdp;
  const pamOk        = pamExists && pamHasRealAmounts(sdp!);
  const pamIssue     = pamExists && !pamOk;
  const ccnPresent   = !!ccn;
  const loanRecovery = isLoanRecovery(cis);
  const dataGifting  = isDataGifting(cis);
  const ambiguous    = !cisSuccess && isAmbiguousError(cis.failure_reason);
  const errorCode    = extractResponseCode(cis.failure_reason);

  // ── Determine fulfilment status ─────────────────────────────────────────────
  let fulfilmentStatus: FulfilmentStatus;

  if (loanRecovery) {
    // Loan recovery takes priority — expected debit, no bundle delivery
    fulfilmentStatus = 'LOAN_RECOVERY';

  } else if (cisSuccess && pamOk) {
    // Happy path: CIS charged, PAM credited DA accounts with real amounts
    fulfilmentStatus = 'FULFILLED';

  } else if (cisSuccess && pamIssue) {
    // CIS succeeded but PAM event has no DA amounts — provisioning anomaly
    fulfilmentStatus = 'PAM_ISSUE';

  } else if (cisSuccess && dataGifting) {
    // Data gifting — CIS succeeded but beneficiary MSISDN differs, so no PAM record expected
    fulfilmentStatus = 'DATA_GIFTING';

  } else if ((cisSuccess || ambiguous) && !pamExists && !dataGifting) {
    // Charge may have gone through (CIS success or ambiguous AIR error) but no PAM record.
    // CCN is the arbiter: if it confirms a debit → GHOST_DEBIT, else → PENDING_CCN
    fulfilmentStatus = ccnPresent ? 'GHOST_DEBIT' : 'PENDING_CCN';

  } else if (!cisSuccess && !ambiguous && !pamExists) {
    // Clean rejection — charge never reached AIR or was cleanly refused
    fulfilmentStatus = 'FAILED';

  } else {
    fulfilmentStatus = 'CIS_FAILED';
  }

  // ── Derive PAM status ───────────────────────────────────────────────────────
  let pamStatus: 'ok' | 'missing' | 'issue';
  if (!pamExists)    pamStatus = 'missing';
  else if (pamOk)    pamStatus = 'ok';
  else               pamStatus = 'issue';

  // ── Derive CCN status ───────────────────────────────────────────────────────
  let ccnStatus: 'ok' | 'missing' | 'pending';
  if (ccnPresent)                             ccnStatus = 'ok';
  else if (fulfilmentStatus === 'PENDING_CCN') ccnStatus = 'pending';
  else                                        ccnStatus = 'missing';

  // ── DA IDs and amounts from PAM record ─────────────────────────────────────
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
    ccnDebit:     ccn?.ma_balance_change_enrich,
    ccnBalBefore: ccn?.ma_balancebeforeevent_enrich,
    ccnBalAfter:  ccn?.ma_balanceaftertheevent_enrich,

    pamStatus,
    sdpDaIds,
    sdpDaAmounts,
    sdpParamValue: sdp?.parameter_value || undefined,

    fulfilmentStatus,
    timestamp:    formatCISTimestamp(cis.transaction_date_time),
    rawTimestamp: cis.transaction_date_time,
  };
}

function formatCISTimestamp(epochMs: number): string {
  try {
    return new Date(epochMs).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return String(epochMs);
  }
}

// ─── SSE Fetch ────────────────────────────────────────────────────────────────

export interface SSECallbacks {
  onCIS: (records: CISRecord[]) => void;
  onCCN: (records: CCNRecord[]) => void;
  onSDP: (records: SDPRecord[]) => void;
  onPhaseChange: (phase: 'cis' | 'ccn' | 'sdp' | 'complete' | 'error') => void;
  onError: (msg: string) => void;
  onComplete: () => void;
}

/**
 * Opens an SSE connection to the bundle endpoint and calls back as named events arrive.
 * Returns an abort function to cancel the stream.
 */
export function streamBundleData(
  msisdn: string,
  startDate: string,
  endDate: string,
  callbacks: SSECallbacks
): () => void {
  const url = `${API_ENDPOINTS.FETCH_SUBSCRIBER_DATA}?msisdn=${msisdn}&startDate=${startDate}&endDate=${endDate}`;
  const controller = new AbortController();

  log.info(`Opening SSE stream — msisdn: ${msisdn}, range: ${startDate}→${endDate}`);

  (async () => {
    let authHeader: string;
    try {
      authHeader = getAuthHeader();
    } catch (authErr) {
      const msg = authErr instanceof Error ? authErr.message : 'Authentication error';
      log.error(`SSE request blocked — ${msg}`);
      callbacks.onError(msg);
      callbacks.onPhaseChange('error');
      return;
    }

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'text/event-stream', 'Authorization': authHeader },
      });

      log.info(`SSE response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        log.error(`SSE request failed — HTTP ${response.status}`, body || '(no body)');
        callbacks.onError(`HTTP ${response.status}: ${response.statusText}`);
        callbacks.onPhaseChange('error');
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) { log.debug('SSE reader done'); break; }
        buffer += decoder.decode(value, { stream: true });

        const messages = buffer.split('\n\n');
        buffer = messages.pop() || '';

        for (const msg of messages) {
          if (!msg.trim()) continue;
          const lines = msg.split('\n');
          let eventName = '';
          let dataLine  = '';

          for (const line of lines) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim();
            if (line.startsWith('data:'))  dataLine  = line.slice(5).trim();
          }

          if (!eventName || !dataLine) continue;

          try {
            const parsed = JSON.parse(dataLine);
            if (eventName === 'CIS') {
              log.info(`SSE event: CIS — ${parsed.length} record(s)`);
              callbacks.onPhaseChange('cis');
              callbacks.onCIS(parsed as CISRecord[]);
            } else if (eventName === 'CCN') {
              log.info(`SSE event: CCN — ${parsed.length} record(s)`);
              callbacks.onPhaseChange('ccn');
              callbacks.onCCN(parsed as CCNRecord[]);
            } else if (eventName === 'SDP') {
              log.info(`SSE event: SDP — ${parsed.length} record(s)`);
              callbacks.onPhaseChange('sdp');
              callbacks.onSDP(parsed as SDPRecord[]);
            } else {
              log.warn(`SSE event: unknown type "${eventName}" — ignoring`);
            }
          } catch (parseErr) {
            log.warn(`SSE parse error on event "${eventName}"`, parseErr);
          }
        }
      }

      log.info('SSE stream complete');
      callbacks.onPhaseChange('complete');
      callbacks.onComplete();
    } catch (err: any) {
      if (err.name === 'AbortError') { log.debug('SSE stream aborted'); return; }
      log.error('SSE stream exception', err);
      callbacks.onError(err.message || 'Stream failed');
      callbacks.onPhaseChange('error');
    }
  })();

  return () => { log.debug('SSE stream abort requested'); controller.abort(); };
}

// ─── CCN DA Parser ────────────────────────────────────────────────────────────

export interface CCNDASummary {
  daId: string;
  balBefore: string;
  balAfter: string;
  charged: string;
  currency: string;
}

/**
 * Parse CCN das field: "1#0~630.71~30.71~600.00~M"
 * Format: daId#unknown~balBefore~balAfter~charged~currency
 */
export function parseCCNDas(das: string): CCNDASummary[] {
  if (!das) return [];
  return das.split(';').map(segment => {
    const hashIdx = segment.indexOf('#');
    const daId = hashIdx >= 0 ? segment.slice(0, hashIdx) : '';
    const rest = hashIdx >= 0 ? segment.slice(hashIdx + 1) : segment;
    const parts = rest.split('~');
    return {
      daId,
      balBefore: parts[1] ?? '',
      balAfter:  parts[2] ?? '',
      charged:   parts[3] ?? '',
      currency:  parts[4] ?? '',
    };
  });
}