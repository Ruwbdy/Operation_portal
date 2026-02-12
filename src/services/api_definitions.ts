// Import types from data_interface for response structures
import type { VoiceProfile, BrowsingProfile, VoLTEProfile, Offer, Diagnostics, Balance, DedicatedAccount, CDRRecord } from './data_interface';


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