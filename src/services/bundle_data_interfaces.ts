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

// ─── Fulfilment Status ────────────────────────────────────────────────────────

export type FulfilmentStatus =
  | 'FULFILLED'      // CIS ✓  · PAM ✓ with real DA amounts  — fully delivered
  | 'LOAN_RECOVERY'  // CIS loan_flag=1 or loan category     — expected debit, no bundle
  | 'DATA_GIFTING'   // CIS succeeded but beneficiary MSISDN differs, so no PAM record expected
  | 'PAM_ISSUE'      // CIS ✓  · PAM row exists but zero/empty DA amounts — provisioning anomaly
  | 'GHOST_DEBIT'    // Ambiguous CIS error · CCN confirms debit · no PAM  — subscriber charged, nothing delivered
  | 'PENDING_CCN'    // Ambiguous CIS error · no PAM · CCN not yet received — awaiting debit confirmation
  | 'FAILED'         // Clean CIS rejection (no charge reached AIR) · no PAM
  | 'CIS_FAILED';    // CIS status=FAILURE with no other category matching

// ─── Fulfilment Trace ─────────────────────────────────────────────────────────

export interface FulfilmentTrace {
  correlationId: string;
  productName: string;
  productId: number;
  offerId: string;
  action: string;
  transactionCategory: string;
  channel: string;
  chargeAmount: string;

  // CIS
  cisStatus: 'ok' | 'fail';
  cisFailureReason?: string;
  downstreamErrorCode?: string;  // extracted responseCode from failure_reason
  isLoanRecovery: boolean;

  // CCN — secondary arbiter, only consulted when PAM is absent and error is ambiguous
  ccnStatus: 'ok' | 'missing' | 'pending'; // pending = PENDING_CCN state, waiting for CCN
  ccnDebit?: string;
  ccnBalBefore?: string;
  ccnBalAfter?: string;

  // PAM (SDP pam_event_type=1)
  pamStatus: 'ok' | 'missing' | 'issue'; // issue = row exists but no real DA credit amounts
  sdpDaIds?: string[];
  sdpDaAmounts?: string[];
  sdpParamValue?: string;

  fulfilmentStatus: FulfilmentStatus;
  timestamp: string;
  rawTimestamp: number;
}

// ─── SSE Stream State ─────────────────────────────────────────────────────────

export interface BundleStreamState {
  cisRecords: CISRecord[];
  ccnRecords: CCNRecord[];
  sdpRecords: SDPRecord[];
  rows: Map<string, BundleFulfilmentRow>;
  isStreaming: boolean;
  streamPhase: 'idle' | 'connecting' | 'cis' | 'ccn' | 'sdp' | 'complete' | 'error';
  error?: string;
}