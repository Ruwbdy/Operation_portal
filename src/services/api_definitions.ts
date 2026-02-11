// API Request/Response Type Definitions
export interface ApiError {
  message: string;
  code?: number;
  details?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export const AUTH_CREDENTIALS = {
  username: 'Osazuwa',
  password: 'Osazuwa@123456'
};

export interface BatchJobRequest {
  jobType: string;
  files: File[];
}

export interface BatchJobResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  resultUrl?: string;
  summary?: {
    total: number;
    successful: number;
    failed: number;
  };
}

// Import types from data_interface for response structures
import type { VoiceProfile, BrowsingProfile, VoLTEProfile, Offer, Diagnostics, Balances, CDRRecord } from './data_interface';

// Charging Profile API Response
export interface ChargingProfileResponse {
  voice?: VoiceProfile;
  browsing?: BrowsingProfile;
  volte?: VoLTEProfile;
  offers?: Offer[];
  diagnostics?: Diagnostics[];
}

// Data Profile API Response
export interface DataProfileResponse {
  balances?: Balances;
  cdrRecords?: CDRRecord[];
}

// CDR Record Type Definitions
export interface DADetail {
  account_id: string;
  amount_before: number;
  amount_after: number;
  amount_charged: number;
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