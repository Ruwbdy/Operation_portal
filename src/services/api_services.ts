// API Service - Handles all API calls using Bearer token authentication
import { API_ENDPOINTS } from './api_endpoints';
import { getAuthHeader } from './auth_service';
import {
  transformHLRToVoiceProfile,
  transformHSSToBrowsingProfile,
  transformVoLTEProfile,
  transformAccountDetailToOffers,
  transformAccountDetailToMABalance,
  transformAccountDetailToDABalances,
  transformCDRToCDRRecords,
  extractDiagnostics
} from './apiTransformers';
import type {
  ApiError,
  ApiResponse,
  ChargingProfileResponse,
  DataProfileResponse,
  BatchJobRequest,
  BatchJobResponse
} from './api_definitions';

// Re-export types for convenience
export type { ApiError, ApiResponse, BatchJobRequest, BatchJobResponse };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildUrl(baseUrl: string, params: Record<string, string>): string {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
}

/** Standard headers for all authenticated requests */
function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Authorization': getAuthHeader(),
  };
}

// ─── Charging Profile ─────────────────────────────────────────────────────────

export async function fetchChargingProfile(
  msisdn: string
): Promise<ApiResponse<ChargingProfileResponse>> {
  try {
    const url = buildUrl(API_ENDPOINTS.GET_CHARGING_PROFILE, { msisdn });

    const response = await fetch(url, {
      method: 'GET',
      headers: authHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const rawData = await response.json();

    const transformedData: ChargingProfileResponse = {
      voice: transformHLRToVoiceProfile(rawData.hlrProfile, rawData.accountDetails),
      browsing: transformHSSToBrowsingProfile(rawData.hssProfile, rawData.hlrProfile),
      volte: transformVoLTEProfile(rawData.volteProfile, msisdn),
      offers: transformAccountDetailToOffers(rawData.accountDetails),
      diagnostics: extractDiagnostics(rawData.diagnostics),
    };

    return { success: true, data: transformedData };
  } catch (error) {
    console.error('Error fetching charging profile:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch charging profile',
        code: 500,
      },
    };
  }
}

// ─── Data Profile (Balance + CDR) ─────────────────────────────────────────────

export async function fetchDataProfile(
  msisdn: string,
  startDate: string,
  endDate: string
): Promise<ApiResponse<DataProfileResponse>> {
  try {
    const url = buildUrl(API_ENDPOINTS.GET_DATA_PROFILE, { msisdn, startDate, endDate });

    const response = await fetch(url, {
      method: 'GET',
      headers: authHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const rawData = await response.json();

    const balance = transformAccountDetailToMABalance(rawData.accountDetails);
    const dabalances = transformAccountDetailToDABalances(rawData.accountDetails);
    const cdrRecords = transformCDRToCDRRecords(rawData.cdrRecords?.records || []);

    return {
      success: true,
      data: {
        balance: balance || undefined,
        dabalances: dabalances || undefined,
        cdrRecords,
      },
    };
  } catch (error) {
    console.error('Error fetching data profile:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch data profile',
        code: 500,
      },
    };
  }
}

// ─── Reset Call Profile ───────────────────────────────────────────────────────

export async function resetCallProfile(msisdn: string): Promise<ApiResponse<any>> {
  try {
    const url = buildUrl(API_ENDPOINTS.RESET_CALL_PROFILE, { msisdn });

    const response = await fetch(url, {
      method: 'GET',
      headers: authHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    const actionsTaken = Object.entries(data)
      .filter(([, value]: [string, any]) => value['action-taken'] === true)
      .map(([key, value]: [string, any]) => ({ check: key, action: value.action }));

    return {
      success: true,
      data: {
        rawResponse: data,
        actionsTaken,
        message:
          actionsTaken.length > 0
            ? `Actions completed: ${actionsTaken.map((a) => a.action).join('; ')}`
            : 'Profile check completed - no issues found',
      },
    };
  } catch (error) {
    console.error('Error resetting call profile:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to reset call profile',
        code: 500,
      },
    };
  }
}

// ─── Reset APN ────────────────────────────────────────────────────────────────

export async function resetAPN(msisdn: string, isIOT: boolean): Promise<ApiResponse<any>> {
  try {
    const url = buildUrl(API_ENDPOINTS.RESET_APN, { msisdn, isIOT: isIOT.toString() });

    const response = await fetch(url, {
      method: 'GET',
      headers: authHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.responseCode !== 0) {
      throw new Error(data.description || 'APN reset failed');
    }

    return {
      success: true,
      data: {
        message: data.description || 'APN Reset Completed',
        responseCode: data.responseCode,
      },
    };
  } catch (error) {
    console.error('Error resetting APN:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to reset APN',
        code: 500,
      },
    };
  }
}

// ─── Activate VoLTE ───────────────────────────────────────────────────────────

export async function activateVoLTE(msisdn: string): Promise<ApiResponse<any>> {
  try {
    const url = buildUrl(API_ENDPOINTS.ACTIVATE_VOLTE, { msisdn });

    const response = await fetch(url, {
      method: 'GET',
      headers: authHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.responseCode !== '0' && data.responseCode !== 0) {
      throw new Error(data.description || 'VoLTE activation failed');
    }

    return {
      success: true,
      data: {
        message: data.description || 'VoLTE activated successfully',
        responseCode: data.responseCode,
      },
    };
  } catch (error) {
    console.error('Error activating VoLTE:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to activate VoLTE',
        code: 500,
      },
    };
  }
}

// ─── Deactivate VoLTE ─────────────────────────────────────────────────────────

export async function deactivateVoLTE(msisdn: string): Promise<ApiResponse<any>> {
  try {
    const url = buildUrl(API_ENDPOINTS.DEACTIVATE_VOLTE, { msisdn });

    const response = await fetch(url, {
      method: 'GET',
      headers: authHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.responseCode !== 0) {
      throw new Error(data.description || 'VoLTE deactivation failed');
    }

    return {
      success: true,
      data: {
        message: data.description || 'VoLTE deactivated successfully',
        responseCode: data.responseCode,
      },
    };
  } catch (error) {
    console.error('Error deactivating VoLTE:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to deactivate VoLTE',
        code: 500,
      },
    };
  }
}

// ─── Delete VoLTE ─────────────────────────────────────────────────────────────

export async function deleteVoLTE(msisdn: string): Promise<ApiResponse<any>> {
  try {
    const url = buildUrl(API_ENDPOINTS.DELETE_VOLTE, { msisdn });

    const response = await fetch(url, {
      method: 'GET',
      headers: authHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.responseCode !== undefined && data.responseCode !== 0) {
      throw new Error(data.description || 'VoLTE deletion failed');
    }

    return {
      success: true,
      data: {
        message: data.description || 'VoLTE profile deleted successfully',
        responseCode: data.responseCode,
      },
    };
  } catch (error) {
    console.error('Error deleting VoLTE:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to delete VoLTE profile',
        code: 500,
      },
    };
  }
}