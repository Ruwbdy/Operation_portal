// Bundle Fulfilment SSE Service
// Handles the SSE stream, parsing, and joining of CIS/CCN/SDP events
import { API_ENDPOINTS } from './api_endpoints';
import type {
  CISRecord,
  CCNRecord,
  SDPRecord,
  BundleFulfilmentRow,
  FulfilmentTrace,
  FulfilmentStatus,
} from './bundle_data_interfaces';

// ─── Join Helpers ─────────────────────────────────────────────────────────────

/**
 * Build or update a BundleFulfilmentRow from incoming records.
 * Keyed by correlationId. Merges in-place.
 */
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
    // CCN arrived before CIS — store with partial row
    rows.set(key, { correlationId: key, cis: null, ccn: record, sdp: null, sdpExpiry: null });
  }
}

export function mergeSDPIntoRows(
  rows: Map<string, BundleFulfilmentRow>,
  record: SDPRecord
): void {
  const key = record.orig_transaction_id;
  if (!key) return; // SDP records without a transaction ID can't be joined
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

  // Only trace Subscription actions from CIS
  if (!cis || cis.action !== 'Subscription') return null;

  const cisOk = cis.status === 'SUCCESS';
  const ccnOk = !!ccn;
  const sdpOk = !!sdp;

  let fulfilmentStatus: FulfilmentStatus;
  if (cisOk && ccnOk && sdpOk) {
    fulfilmentStatus = 'FULFILLED';
  } else if (cisOk && ccnOk && !sdpOk) {
    fulfilmentStatus = 'PARTIAL';
  } else if (cisOk && !ccnOk && !sdpOk) {
    fulfilmentStatus = 'FAILED';
  } else if (!cisOk && ccnOk) {
    // CCN debited the subscriber even though CIS returned failure —
    // subscriber lost money but received no bundle. Requires manual reversal.
    fulfilmentStatus = 'GHOST_DEBIT';
  } else {
    // CIS failed, no CCN, no SDP — clean rejection, nothing charged
    fulfilmentStatus = 'CIS_FAILED';
  }

  // Parse SDP DA details
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
    channel: cis.channel_name,
    chargeAmount: cis.charging_amount,
    cisStatus: cisOk ? 'ok' : 'fail',
    cisFailureReason: !cisOk ? cis.failure_reason : undefined,
    ccnStatus: ccnOk ? 'ok' : 'missing',
    ccnDebit: ccn?.ma_balance_change_enrich,
    ccnBalBefore: ccn?.ma_balancebeforeevent_enrich,
    ccnBalAfter: ccn?.ma_balanceaftertheevent_enrich,
    sdpStatus: sdpOk ? 'ok' : 'missing',
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
    const d = new Date(epochMs);
    return d.toLocaleString('en-GB', {
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

  (async () => {
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'text/event-stream' },
      });

      if (!response.ok) {
        callbacks.onError(`HTTP ${response.status}: ${response.statusText}`);
        callbacks.onPhaseChange('error');
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages (double newline delimited)
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // keep incomplete tail

        for (const msg of messages) {
          if (!msg.trim()) continue;
          const lines = msg.split('\n');
          let eventName = '';
          let dataLine = '';

          for (const line of lines) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim();
            if (line.startsWith('data:')) dataLine = line.slice(5).trim();
          }

          if (!eventName || !dataLine) continue;

          try {
            const parsed = JSON.parse(dataLine);
            if (eventName === 'CIS') {
              callbacks.onPhaseChange('cis');
              callbacks.onCIS(parsed as CISRecord[]);
            } else if (eventName === 'CCN') {
              callbacks.onPhaseChange('ccn');
              callbacks.onCCN(parsed as CCNRecord[]);
            } else if (eventName === 'SDP') {
              callbacks.onPhaseChange('sdp');
              callbacks.onSDP(parsed as SDPRecord[]);
            }
          } catch (parseErr) {
            console.warn('SSE parse error:', parseErr);
          }
        }
      }

      callbacks.onPhaseChange('complete');
      callbacks.onComplete();
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      callbacks.onError(err.message || 'Stream failed');
      callbacks.onPhaseChange('error');
    }
  })();

  return () => controller.abort();
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
    const daId = hashIdx >= 0 ? segment.substring(0, hashIdx) : '?';
    const rest = hashIdx >= 0 ? segment.substring(hashIdx + 1) : segment;
    const parts = rest.split('~');
    return {
      daId,
      balBefore: parts[1] || '0',
      balAfter: parts[2] || '0',
      charged: parts[3] || '0',
      currency: parts[4] || 'M',
    };
  });
}