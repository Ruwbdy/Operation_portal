/// <reference types="vite/client" />
// Balance API — data profile fetch (balance + CDR)
import { API_ENDPOINTS } from '../endpoints';
import { getAuthHeader } from '../auth.service';
import { createLogger } from '../logger';
import {
  transformAccountDetailToMABalance,
  transformAccountDetailToDABalances,
  transformCDRToCDRRecords,
} from './balance.transformer';
import type { ApiResponse, DataProfileResponse } from '../../types';

const log = createLogger('BalanceApi');

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

export async function fetchDataProfile(
  msisdn: string,
  startDate: string,
  endDate: string
): Promise<ApiResponse<DataProfileResponse>> {
  const url = buildUrl(API_ENDPOINTS.GET_DATA_PROFILE, { msisdn, startDate, endDate });
  log.info(`fetchDataProfile — msisdn: ${msisdn}, range: ${startDate}→${endDate}`);
  try {
    const response = await fetch(url, { method: 'GET', headers: authHeaders() });
    log.info(`fetchDataProfile — HTTP ${response.status}`);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      log.error(`fetchDataProfile — HTTP ${response.status}`, body);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const rawData = await response.json();
    log.debug('fetchDataProfile — raw response', rawData);

    const balance = transformAccountDetailToMABalance(rawData.accountDetails);
    const dabalances = transformAccountDetailToDABalances(rawData.accountDetails);
    const cdrRecords = transformCDRToCDRRecords(rawData.cdrRecords?.records || []);

    log.info(`fetchDataProfile — transform complete, CDR records: ${cdrRecords.length}`);
    return {
      success: true,
      data: {
        balance: balance || undefined,
        dabalances: dabalances || undefined,
        cdrRecords,
      },
    };
  } catch (error) {
    log.error('fetchDataProfile — exception', error);
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : 'Failed to fetch data profile',
        code: 500,
      },
    };
  }
}