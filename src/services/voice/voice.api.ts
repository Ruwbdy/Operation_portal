/// <reference types="vite/client" />
// Voice API — charging profile fetch + all voice/VoLTE actions
import { API_ENDPOINTS } from '../endpoints';
import { getAuthHeader } from '../auth.service';
import { createLogger } from '../logger';
import { transformHLRToVoiceProfile, transformVoLTEProfile, extractDiagnostics } from './voice.transformer';
import { transformHSSToBrowsingProfile } from '../balance/balance.transformer';
import { transformAccountDetailToOffers } from '../balance/balance.transformer';
import type { ApiResponse, ChargingProfileResponse } from '../../types';

const log = createLogger('VoiceApi');

function buildUrl(baseUrl: string, params: Record<string, string>): string {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  return url.toString();
}

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: getAuthHeader(),
  };
}

// ─── Charging Profile ─────────────────────────────────────────────────────────

export async function fetchChargingProfile(
  msisdn: string
): Promise<ApiResponse<ChargingProfileResponse>> {
  const url = buildUrl(API_ENDPOINTS.GET_CHARGING_PROFILE, { msisdn });
  log.info(`fetchChargingProfile — msisdn: ${msisdn}`);
  try {
    const response = await fetch(url, { method: 'GET', headers: authHeaders() });
    log.info(`fetchChargingProfile — HTTP ${response.status}`);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      log.error(`fetchChargingProfile — HTTP ${response.status}`, body);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const rawData = await response.json();
    log.debug('fetchChargingProfile — raw response', rawData);

    const transformedData: ChargingProfileResponse = {
      voice: transformHLRToVoiceProfile(rawData.hlrProfile, rawData.accountDetails) ?? undefined,
      browsing: transformHSSToBrowsingProfile(rawData.hssProfile, rawData.hlrProfile) ?? undefined,
      volte: transformVoLTEProfile(rawData.volteProfile, msisdn) ?? undefined,
      offers: transformAccountDetailToOffers(rawData.accountDetails),
      diagnostics: extractDiagnostics(rawData.diagnostics),
    };

    log.info('fetchChargingProfile — transform complete');
    return { success: true, data: transformedData };
  } catch (error) {
    log.error('fetchChargingProfile — exception', error);
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : 'Failed to fetch charging profile',
        code: 500,
      },
    };
  }
}

// ─── Reset Call Profile ───────────────────────────────────────────────────────

export async function resetCallProfile(msisdn: string): Promise<ApiResponse<any>> {
  const url = buildUrl(API_ENDPOINTS.RESET_CALL_PROFILE, { msisdn });
  log.info(`resetCallProfile — msisdn: ${msisdn}`);
  try {
    const response = await fetch(url, { method: 'GET', headers: authHeaders() });
    log.info(`resetCallProfile — HTTP ${response.status}`);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      log.error(`resetCallProfile — HTTP ${response.status}`, body);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    log.debug('resetCallProfile — raw response', data);

    const actionsTaken = Object.entries(data)
      .filter(([, value]: [string, any]) => value['action-taken'] === true)
      .map(([key, value]: [string, any]) => ({ check: key, action: value.action }));

    log.info(`resetCallProfile — actions taken: ${actionsTaken.length}`);
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
    log.error('resetCallProfile — exception', error);
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : 'Failed to reset call profile',
        code: 500,
      },
    };
  }
}

// ─── Reset APN ────────────────────────────────────────────────────────────────

export async function resetAPN(msisdn: string, isIOT: boolean): Promise<ApiResponse<any>> {
  const url = buildUrl(API_ENDPOINTS.RESET_APN, { msisdn, isIOT: isIOT.toString() });
  log.info(`resetAPN — msisdn: ${msisdn}, isIOT: ${isIOT}`);
  try {
    const response = await fetch(url, { method: 'GET', headers: authHeaders() });
    log.info(`resetAPN — HTTP ${response.status}`);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      log.error(`resetAPN — HTTP ${response.status}`, body);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    log.debug('resetAPN — raw response', data);

    if (data.responseCode !== 0) {
      log.warn(`resetAPN — non-zero responseCode: ${data.responseCode}`, data.description);
      throw new Error(data.description || 'APN reset failed');
    }

    log.info(`resetAPN — success: ${data.description}`);
    return {
      success: true,
      data: {
        message: data.description || 'APN Reset Completed',
        responseCode: data.responseCode,
      },
    };
  } catch (error) {
    log.error('resetAPN — exception', error);
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
  const url = buildUrl(API_ENDPOINTS.ACTIVATE_VOLTE, { msisdn });
  log.info(`activateVoLTE — msisdn: ${msisdn}`);
  try {
    const response = await fetch(url, { method: 'GET', headers: authHeaders() });
    log.info(`activateVoLTE — HTTP ${response.status}`);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      log.error(`activateVoLTE — HTTP ${response.status}`, body);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    log.debug('activateVoLTE — raw response', data);

    if (data.responseCode !== '0' && data.responseCode !== 0) {
      log.warn(`activateVoLTE — non-zero responseCode: ${data.responseCode}`, data.description);
      throw new Error(data.description || 'VoLTE activation failed');
    }

    log.info(`activateVoLTE — success: ${data.description}`);
    return {
      success: true,
      data: {
        message: data.description || 'VoLTE activated successfully',
        responseCode: data.responseCode,
      },
    };
  } catch (error) {
    log.error('activateVoLTE — exception', error);
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
  const url = buildUrl(API_ENDPOINTS.DEACTIVATE_VOLTE, { msisdn });
  log.info(`deactivateVoLTE — msisdn: ${msisdn}`);
  try {
    const response = await fetch(url, { method: 'GET', headers: authHeaders() });
    log.info(`deactivateVoLTE — HTTP ${response.status}`);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      log.error(`deactivateVoLTE — HTTP ${response.status}`, body);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    log.debug('deactivateVoLTE — raw response', data);

    if (data.responseCode !== 0) {
      log.warn(`deactivateVoLTE — non-zero responseCode: ${data.responseCode}`, data.description);
      throw new Error(data.description || 'VoLTE deactivation failed');
    }

    log.info(`deactivateVoLTE — success: ${data.description}`);
    return {
      success: true,
      data: {
        message: data.description || 'VoLTE deactivated successfully',
        responseCode: data.responseCode,
      },
    };
  } catch (error) {
    log.error('deactivateVoLTE — exception', error);
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
  const url = buildUrl(API_ENDPOINTS.DELETE_VOLTE, { msisdn });
  log.info(`deleteVoLTE — msisdn: ${msisdn}`);
  try {
    const response = await fetch(url, { method: 'GET', headers: authHeaders() });
    log.info(`deleteVoLTE — HTTP ${response.status}`);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      log.error(`deleteVoLTE — HTTP ${response.status}`, body);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    log.debug('deleteVoLTE — raw response', data);

    if (data.responseCode !== undefined && data.responseCode !== 0) {
      log.warn(`deleteVoLTE — non-zero responseCode: ${data.responseCode}`, data.description);
      throw new Error(data.description || 'VoLTE deletion failed');
    }

    log.info(`deleteVoLTE — success: ${data.description}`);
    return {
      success: true,
      data: {
        message: data.description || 'VoLTE profile deleted successfully',
        responseCode: data.responseCode,
      },
    };
  } catch (error) {
    log.error('deleteVoLTE — exception', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to delete VoLTE profile',
        code: 500,
      },
    };
  }
}