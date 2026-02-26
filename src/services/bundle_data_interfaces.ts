// Bundle Fulfilment Data Interfaces
// Covers CIS, CCN, and SDP PAM event types from the SSE stream

// ─── Raw SSE Event Types ───────────────────────────────────────────────────────

export interface CISRecord {
  tbl_dt: number;
  msisdn: number;
  beneficiary_msisdn: string;
  consumer_msisdn: string;
  transaction_date_time: number; // epoch ms
  channel_name: string;
  product_id: number;
  product_name: string;
  product_type: string;
  product_subtype: string;
  product_flag: string;
  offer_id: string;
  action: string; // "Subscription" | "Deprovision" | "Renewal" etc.
  renewal_adhoc: string;
  activation_time: string;
  expiry_time: string;
  grace_period: string;
  correlation_id: string;
  charging_amount: string;
  f3pp_chargedamount: string;
  auto_renewal_consent: string;
  provisioning_type: string;
  status: string; // "SUCCESS" | "FAILURE"
  failure_reason: string;
  notification_sent: string;
  transaction_category: string;
  loan_flag: string;
  misc_param1: string;
}

export interface CCNRecord {
  processed_timestamp: number; // epoch seconds
  servicetype: string;
  servicesessionid: string; // joins with CIS.correlation_id
  chargingcontextid: string;
  totalcharge_money: string;
  das: string; // raw DA string e.g. "1#0~630.71~30.71~600.00~M"
  da_enrich_offer_desc: string;
  ma_balancebeforeevent_enrich: string;
  ma_balanceaftertheevent_enrich: string;
  ma_balance_change_enrich: string;
  vas_transactionid: string; // joins with CIS.correlation_id
  vas_chargeamount: string;
  vas_channelname: string;
  vas_productid: string;
  vas_productname: string;
}

export interface SDPRecord {
  msisdn_key: number;
  subscriber_nr: string;
  tbl_dt: number;
  service_class_id: string;
  origin_operator_id: string;
  origin_node_type: string;
  orig_transaction_id: string; // joins with CIS.correlation_id
  pam_event_type: string; // "1" = credit/provision, "5" = debit/expiry
  pam_service_id: string;
  pam_class_id: string;
  pam_ind: string; // offer id indicator
  balance_before: string;
  balance_after: string;
  da_account_id: string; // colon-separated list of DA IDs
  account_value_before: string;
  account_value_after: string;
  adj_amount: string;
  cleared_account_value: string;
  account_value_initial: string;
  account_dt_before: string;
  account_dt_after: string;
  account_expiry_dt_before: string;
  account_expiry_dt_after: string;
  usage_counter_id: string;
  adj_offer_id: string;
  parameter_value: string;
}

// ─── Joined / Merged View ─────────────────────────────────────────────────────

export interface BundleFulfilmentRow {
  correlationId: string;         // Primary join key
  cis: CISRecord | null;
  ccn: CCNRecord | null;
  sdp: SDPRecord | null;         // pam_event_type=1 (credit) record
  sdpExpiry: SDPRecord | null;   // pam_event_type=5 (debit/expiry) record
}

// ─── Fulfilment Trace ─────────────────────────────────────────────────────────

export type FulfilmentStatus =
  | 'FULFILLED'    // CIS ✓ · CCN ✓ · SDP ✓  — fully delivered
  | 'PARTIAL'      // CIS ✓ · CCN ✓ · SDP ✗  — debited, bundle not provisioned
  | 'FAILED'       // CIS ✓ · CCN ✗ · SDP ✗  — no debit, no bundle
  | 'CIS_FAILED'   // CIS ✗ · CCN ✗ · SDP ✗  — rejected at CIS, nothing charged
  | 'GHOST_DEBIT'; // CIS ✗ · CCN ✓ · SDP ✗  — CIS failed BUT CCN still debited — subscriber lost money, got no bundle

export interface FulfilmentTrace {
  correlationId: string;
  productName: string;
  productId: number;
  offerId: string;
  action: string;
  channel: string;
  chargeAmount: string;
  cisStatus: 'ok' | 'fail';
  cisFailureReason?: string;
  ccnStatus: 'ok' | 'missing';
  ccnDebit?: string;
  ccnBalBefore?: string;
  ccnBalAfter?: string;
  sdpStatus: 'ok' | 'missing';
  sdpDaIds?: string[];
  sdpDaAmounts?: string[];
  sdpParamValue?: string;
  fulfilmentStatus: FulfilmentStatus;
  timestamp: string; // human-readable
  rawTimestamp: number;
}

// ─── SSE Stream State ─────────────────────────────────────────────────────────

export interface BundleStreamState {
  cisRecords: CISRecord[];
  ccnRecords: CCNRecord[];
  sdpRecords: SDPRecord[];
  rows: Map<string, BundleFulfilmentRow>;   // keyed by correlationId
  isStreaming: boolean;
  streamPhase: 'idle' | 'connecting' | 'cis' | 'ccn' | 'sdp' | 'complete' | 'error';
  error?: string;
}