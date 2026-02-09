// CDR Record Type Definitions

export interface DADetail {
  account_id: string;
  amount_before: number;
  amount_after: number;
  amount_charged: number;
}

export interface CDRRecord {
  record_type: string;
  number_called: string;
  event_dt: number; // YYYYMMDDHHMMSS
  call_duration_qty: string;
  charged_amount: string;
  balance_after_amt: string;
  balance_before_amt: string;
  discount_amt: string;
  da_amount: string;
  da_details: DADetail[];
  country: string;
  operator: string;
  bytes_received_qty: number;
  bytes_sent_qty: number;
}

export interface CDRSummary {
  totalTransactions: number;
  startingBalance: number;
  endingBalance: number;
  totalCharged: number;
  totalDuration?: number; // For voice
  totalData?: number; // For data (in bytes)
  avgCallLength?: number; // For voice
  totalRecharges?: number; // For credit
  netChange?: number; // For DA adjustments
}

export interface CategorizedCDR {
  all: CDRRecord[];
  voice: CDRRecord[];
  data: CDRRecord[];
  sms: CDRRecord[];
  credit: CDRRecord[];
  daAdjustment: CDRRecord[];
  other: CDRRecord[];
}

export type CDRTabType = 'balance' | 'voice' | 'data' | 'sms' | 'credit' | 'daAdjustment' | 'other';

export interface CDRApiResponse {
  APIStatus: {
    msisdn: string;
    requestId: string;
    dateRange: string[];
    maxRecs: number;
    numRecs: number;
    statusCode: number;
    statusMsg: string;
  };
  APIData: CDRRecord[];
}