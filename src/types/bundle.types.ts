// Bundle Fulfilment Data Interfaces
// Covers CIS, CCN, and SDP PAM event types from the SSE stream

export interface CISRecord {
  tbl_dt: number;
  msisdn: number;
  beneficiary_msisdn: string;
  consumer_msisdn: string;
  transaction_date_time: number;
  channel_name: string;
  product_id: number;
  product_name: string;
  product_type: string;
  product_subtype: string;
  product_flag: string;
  offer_id: string;
  action: string;
  renewal_adhoc: string;
  activation_time: string;
  expiry_time: string;
  grace_period: string;
  correlation_id: string;
  charging_amount: string;
  f3pp_chargedamount: string;
  auto_renewal_consent: string;
  provisioning_type: string;
  status: string;
  failure_reason: string;
  notification_sent: string;
  transaction_category: string;
  loan_flag: string;
  misc_param1: string;
}

export interface CCNRecord {
  processed_timestamp: number;
  servicetype: string;
  servicesessionid: string;
  chargingcontextid: string;
  totalcharge_money: string;
  das: string;
  da_enrich_offer_desc: string;
  ma_balancebeforeevent_enrich: string;
  ma_balanceaftertheevent_enrich: string;
  ma_balance_change_enrich: string;
  vas_transactionid: string;
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
  orig_transaction_id: string;
  pam_event_type: string;
  pam_service_id: string;
  pam_class_id: string;
  pam_ind: string;
  balance_before: string;
  balance_after: string;
  da_account_id: string;
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

export interface BundleFulfilmentRow {
  correlationId: string;
  cis: CISRecord | null;
  ccn: CCNRecord | null;
  sdp: SDPRecord | null;
  sdpExpiry: SDPRecord | null;
}

export type FulfilmentStatus =
  | 'FULFILLED'
  | 'LOAN_RECOVERY'
  | 'DATA_GIFTING'
  | 'PAM_ISSUE'
  | 'GHOST_DEBIT'
  | 'PENDING_CCN'
  | 'FAILED'
  | 'CIS_FAILED';

export interface FulfilmentTrace {
  correlationId: string;
  productName: string;
  productId: number;
  offerId: string;
  action: string;
  transactionCategory: string;
  channel: string;
  chargeAmount: string;
  cisStatus: 'ok' | 'fail';
  cisFailureReason?: string;
  downstreamErrorCode?: string;
  isLoanRecovery: boolean;
  ccnStatus: 'ok' | 'missing' | 'pending';
  ccnDebit?: string;
  ccnBalBefore?: string;
  ccnBalAfter?: string;
  pamStatus: 'ok' | 'missing' | 'issue';
  sdpDaIds?: string[];
  sdpDaAmounts?: string[];
  sdpParamValue?: string;
  fulfilmentStatus: FulfilmentStatus;
  timestamp: string;
  rawTimestamp: number;
}

export interface BundleStreamState {
  cisRecords: CISRecord[];
  ccnRecords: CCNRecord[];
  sdpRecords: SDPRecord[];
  rows: Map<string, BundleFulfilmentRow>;
  isStreaming: boolean;
  streamPhase: 'idle' | 'connecting' | 'cis' | 'ccn' | 'sdp' | 'complete' | 'error';
  error?: string;
}