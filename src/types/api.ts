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