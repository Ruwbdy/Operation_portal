// API Request/Response Type Definitions
import { API_ENDPOINTS } from './endpoints';
import {
  transformHLRToVoiceProfile,
  transformHSSToBrowsingProfile,
  transformToVoLTEProfile,
  transformOffers,
  transformBalances,
  extractDiagnostics
} from './apiTransformers';
import type { VoiceProfile, BrowsingProfile, VoLTEProfile, Offer, Balances } from '../types/subscriber';
import type { CDRRecord } from '../types/cdr';

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
  diagnostics?: any[];
}

// Data Profile API Response
export interface DataProfileResponse {
  balances?: Balances;
  cdrRecords?: CDRRecord[];
}

// Helper function to build URL with query parameters
function buildUrl(baseUrl: string, params: Record<string, string>): string {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
}

// Fetch Charging Profile
export async function fetchChargingProfile(
  msisdn: string,
  username: string = AUTH_CREDENTIALS.username,
  password: string = AUTH_CREDENTIALS.password
): Promise<ApiResponse<ChargingProfileResponse>> {
  try {
    const url = buildUrl(API_ENDPOINTS.GET_CHARGING_PROFILE, {
      username,
      password,
      msisdn
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const rawData = await response.json();

    // Transform the raw API response to our frontend interfaces
    const transformedData: ChargingProfileResponse = {
      voice: transformHLRToVoiceProfile(rawData.hlrProfile),
      browsing: transformHSSToBrowsingProfile(rawData.hssProfile, rawData.hlrProfile),
      volte: transformToVoLTEProfile(rawData.volteProfile, msisdn),
      offers: transformOffers(rawData.accountDetails),
      diagnostics: extractDiagnostics(rawData.diagnostics)
    };

    return {
      success: true,
      data: transformedData
    };
  } catch (error) {
    console.error('Error fetching charging profile:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch charging profile',
        code: 500
      }
    };
  }
}

// Fetch Data Profile (Balances + CDR)
export async function fetchDataProfile(
  msisdn: string,
  startDate: string,
  endDate: string,
  username: string = AUTH_CREDENTIALS.username,
  password: string = AUTH_CREDENTIALS.password
): Promise<ApiResponse<DataProfileResponse>> {
  try {
    const url = buildUrl(API_ENDPOINTS.GET_DATA_PROFILE, {
      username,
      password,
      msisdn,
      startDate,
      endDate
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const rawData = await response.json();

    // Transform balances if present
    const balances = transformBalances(rawData.accountDetails);

    // Extract CDR records
    const cdrRecords = rawData.cdrRecords?.records || [];

    return {
      success: true,
      data: {
        balances: balances || undefined,
        cdrRecords: cdrRecords
      }
    };
  } catch (error) {
    console.error('Error fetching data profile:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch data profile',
        code: 500
      }
    };
  }
}

// Reset Call Profile
export async function resetCallProfile(
  msisdn: string,
  username: string = AUTH_CREDENTIALS.username,
  password: string = AUTH_CREDENTIALS.password
): Promise<ApiResponse<any>> {
  try {
    const url = buildUrl(API_ENDPOINTS.RESET_CALL_PROFILE, {
      username,
      password,
      msisdn
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Check if any actions failed
    const failedActions = Object.entries(data).filter(([key, value]: [string, any]) => value.passed === false);
    
    if (failedActions.length > 0) {
      const failedList = failedActions.map(([key, value]: [string, any]) => `${key}: ${value.action}`).join(', ');
      throw new Error(`Some actions failed: ${failedList}`);
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error resetting call profile:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to reset call profile',
        code: 500
      }
    };
  }
}

// Reset APN (Browsing Profile)
export async function resetAPN(
  msisdn: string,
  isIOT: boolean,
  username: string = AUTH_CREDENTIALS.username,
  password: string = AUTH_CREDENTIALS.password
): Promise<ApiResponse<any>> {
  try {
    const url = buildUrl(API_ENDPOINTS.RESET_APN, {
      username,
      password,
      msisdn,
      isIOT: isIOT.toString()
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error resetting APN:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to reset APN',
        code: 500
      }
    };
  }
}

// Activate VoLTE
export async function activateVoLTE(
  msisdn: string,
  username: string = AUTH_CREDENTIALS.username,
  password: string = AUTH_CREDENTIALS.password
): Promise<ApiResponse<any>> {
  try {
    const url = buildUrl(API_ENDPOINTS.ACTIVATE_VOLTE, {
      username,
      password,
      msisdn
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error activating VoLTE:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to activate VoLTE',
        code: 500
      }
    };
  }
}

// Deactivate VoLTE
export async function deactivateVoLTE(
  msisdn: string,
  username: string = AUTH_CREDENTIALS.username,
  password: string = AUTH_CREDENTIALS.password
): Promise<ApiResponse<any>> {
  try {
    const url = buildUrl(API_ENDPOINTS.DEACTIVATE_VOLTE, {
      username,
      password,
      msisdn
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error deactivating VoLTE:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to deactivate VoLTE',
        code: 500
      }
    };
  }
}

// Delete VoLTE
export async function deleteVoLTE(
  msisdn: string,
  username: string = AUTH_CREDENTIALS.username,
  password: string = AUTH_CREDENTIALS.password
): Promise<ApiResponse<any>> {
  try {
    const url = buildUrl(API_ENDPOINTS.DELETE_VOLTE, {
      username,
      password,
      msisdn
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error deleting VoLTE:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to delete VoLTE profile',
        code: 500
      }
    };
  }
}