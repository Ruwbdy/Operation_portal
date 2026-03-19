// Auth Service - Handles login and token management
import { API_ENDPOINTS } from './api_endpoints';
import { createLogger } from './logger';

const log = createLogger('AuthService');

const TOKEN_KEY = 'mtn_in_token';
const TOKEN_EXPIRY_KEY = 'mtn_in_token_expiry';
const USER_KEY = 'mtn_in_user';
const ROLE_KEY = 'mtn_in_role';

export const ROLES = {
  IN_SUPPORT: 'ROLE_IN_SUPPORT',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES] | null;

export interface LoginResponse {
  token: string;
  expireInMins: number;
  role?: string; // upcoming API field — optional for now
}

export interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
}

/**
 * Derives the user role:
 * 1. Uses the `role` field from the API response if present.
 * 2. Falls back to username-based assignment until the API ships the field.
 *    - username "INSupport" → ROLE_IN_SUPPORT
 */
function deriveRole(username: string, apiRole?: string): string {
  if (apiRole) return apiRole;
  if (username === 'INSupport') return ROLES.IN_SUPPORT;
  return '';
}

/**
 * Perform login against the real API.
 * POST /login  { username, password }  →  { token, expireInMins, role? }
 */
export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  log.info(`Login attempt for user: ${username}`);
  try {
    const response = await fetch(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log.error(`Login failed — HTTP ${response.status}`, errorText);
      throw new Error(errorText || `Login failed with status ${response.status}`);
    }

    const data: LoginResponse = await response.json();

    if (!data.token) {
      log.error('Login response missing token', data);
      throw new Error('No token received from server');
    }

    const role = deriveRole(username, data.role);
    const expiryTime = Date.now() + data.expireInMins * 60 * 1000;

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    localStorage.setItem(USER_KEY, username);
    localStorage.setItem(ROLE_KEY, role);

    log.info(`Login successful — user: ${username}, role: ${role}, expires in ${data.expireInMins}m`);
    return { success: true };
  } catch (error) {
    log.error('Login exception', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed. Please try again.',
    };
  }
}

/**
 * Returns the stored token if it exists and hasn't expired.
 */
export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!token || !expiry) {
    log.debug('getToken — no token or expiry found in storage');
    return null;
  }

  if (Date.now() > parseInt(expiry, 10)) {
    log.warn('getToken — token expired, clearing auth state');
    clearAuth();
    return null;
  }

  const remainingMs = parseInt(expiry, 10) - Date.now();
  const remainingMins = Math.round(remainingMs / 60000);
  log.debug(`getToken — valid token found, expires in ~${remainingMins}m`);
  return token;
}

/**
 * Returns true if a valid, non-expired token exists.
 */
export function isAuthenticated(): boolean {
  return getToken() !== null;
}

/**
 * Returns the stored role for the current session.
 */
export function getRole(): UserRole {
  if (!isAuthenticated()) return null;
  return (localStorage.getItem(ROLE_KEY) as UserRole) || null;
}

/**
 * Returns true if the current user has the given role.
 */
export function hasRole(role: string): boolean {
  return getRole() === role;
}

/**
 * Returns the logged-in username.
 */
export function getUsername(): string | null {
  return localStorage.getItem(USER_KEY);
}

/**
 * Clears all auth state (logout).
 */
export function clearAuth(): void {
  log.info('clearAuth — session cleared');
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ROLE_KEY);
}

/**
 * Returns Authorization header value for API calls.
 */
export function getAuthHeader(): string {
  const token = getToken();
  if (!token) {
    log.error('getAuthHeader — no valid token, user must re-authenticate');
    throw new Error('Not authenticated. Please log in again.');
  }
  return `Bearer ${token}`;
}