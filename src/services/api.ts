// API Service - Handles all API calls and data transformation
import { API_ENDPOINTS } from './endpoints';
import {
  transformHLRToVoiceProfile,
  transformHSSToBrowsingProfile,
  transformVoLTEProfile,
  transformAccountDetailToOffers,
  transformAccountDetailToBalances,
  transformCDRToCDRRecords,
  extractDiagnostics
} from './apiTransformers';
import type { VoiceProfile, BrowsingProfile, VoLTEProfile, Offer, Balances, CDRRecord } from './data_interface';
import type { 
  ApiError, 
  ApiResponse, 
  ChargingProfileResponse, 
  DataProfileResponse,
  BatchJobRequest,
  BatchJobResponse 
} from './api_definitions';
import { AUTH_CREDENTIALS } from './api_definitions';

// Re-export types for convenience
export type { ApiError, ApiResponse, BatchJobRequest, BatchJobResponse };

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
      volte: transformVoLTEProfile(rawData.volteProfile, msisdn),
      offers: transformAccountDetailToOffers(rawData.accountDetails),
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
    const balances = transformAccountDetailToBalances(rawData.accountDetails);
    
    // Transform CDR records using the new transformer
    const cdrRecords = transformCDRToCDRRecords(rawData.cdrRecords?.records || []);

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