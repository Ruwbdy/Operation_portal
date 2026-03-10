// Auth Service - Handles login and token management
import { API_ENDPOINTS } from './api_endpoints';

const TOKEN_KEY = 'mtn_in_token';
const TOKEN_EXPIRY_KEY = 'mtn_in_token_expiry';
const USER_KEY = 'mtn_in_user';

export interface LoginResponse {
  token: string;
  expireInMins: number;
}

export interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
}

/**
 * Perform login against the real API.
 * POST /login  { username, password }  →  { token, expireInMins }
 */
export async function login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
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
      throw new Error(errorText || `Login failed with status ${response.status}`);
    }

    const data: LoginResponse = await response.json();

    if (!data.token) {
      throw new Error('No token received from server');
    }

    // Store token and calculate expiry timestamp
    const expiryTime = Date.now() + data.expireInMins * 60 * 1000;
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    localStorage.setItem(USER_KEY, username);

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
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

  if (!token || !expiry) return null;

  // Check if token is expired
  if (Date.now() > parseInt(expiry, 10)) {
    clearAuth();
    return null;
  }

  return token;
}

/**
 * Returns true if a valid, non-expired token exists.
 */
export function isAuthenticated(): boolean {
  return getToken() !== null;
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
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Returns Authorization header value for API calls.
 */
export function getAuthHeader(): string {
  const token = getToken();
  if (!token) throw new Error('Not authenticated. Please log in again.');
  return `Bearer ${token}`;
}