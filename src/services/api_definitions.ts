// API Request/Response Type Definitions
import type { VoiceProfile, BrowsingProfile, VoLTEProfile, Offer, Diagnostics, Balance, DedicatedAccount, CDRRecord } from './data_interface';

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
  balance?: Balance;
  dabalances?: DedicatedAccount[];
  cdrRecords?: CDRRecord[];
}