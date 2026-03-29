// API Request/Response Type Definitions
import type { VoiceProfile, VoLTEProfile } from './voice.types';
import type { BrowsingProfile } from './browsing.types';
import type { Balance, DedicatedAccount } from './balance.types';
import type { CDRRecord } from './cdr.types';
import type { Offer, Diagnostics } from './offer.types';

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

export interface ChargingProfileResponse {
  voice?: VoiceProfile;
  browsing?: BrowsingProfile;
  volte?: VoLTEProfile;
  offers?: Offer[];
  diagnostics?: Diagnostics[];
}

export interface DataProfileResponse {
  balance?: Balance;
  dabalances?: DedicatedAccount[];
  cdrRecords?: CDRRecord[];
}