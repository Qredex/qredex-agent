/**
 * Token storage helpers that coordinate between sessionStorage and cookies.
 * Provides a unified API for storing and retrieving intent tokens.
 */

import { setCookie, getCookie, removeCookie } from './cookie.js';
import { setSession, getSession, removeSession } from './session.js';
import { debug } from '../utils/log.js';
import { isValidToken } from '../utils/guards.js';

export interface TokenStorageConfig {
  influenceIntentToken: string;
  purchaseIntentToken: string;
  cookieMaxAge: number;
}

const DEFAULT_CONFIG: TokenStorageConfig = {
  influenceIntentToken: '__qdx_iit',
  purchaseIntentToken: '__qdx_pit',
  cookieMaxAge: 86400, // 24 hours
};

/**
 * Store the intent token (IIT) in both sessionStorage and cookie.
 */
export function storeIntentToken(token: string, config: TokenStorageConfig = DEFAULT_CONFIG): void {
  if (!isValidToken(token)) {
    return;
  }

  setSession(config.influenceIntentToken, token);
  setCookie(config.influenceIntentToken, token, {
    maxAge: config.cookieMaxAge,
    path: '/',
    sameSite: 'Strict',
  });

  debug('Intent token stored');
}

/**
 * Get the intent token (IIT) from sessionStorage first, then cookie fallback.
 */
export function getIntentToken(config: TokenStorageConfig = DEFAULT_CONFIG): string | null {
  // Try sessionStorage first
  const sessionToken = getSession(config.influenceIntentToken);
  if (isValidToken(sessionToken)) {
    debug('Intent token retrieved from sessionStorage');
    return sessionToken;
  }

  // Fallback to cookie
  const cookieToken = getCookie(config.influenceIntentToken);
  if (isValidToken(cookieToken)) {
    debug('Intent token retrieved from cookie');
    return cookieToken;
  }

  return null;
}

/**
 * Remove the intent token from both storage layers.
 */
export function removeIntentToken(config: TokenStorageConfig = DEFAULT_CONFIG): void {
  removeSession(config.influenceIntentToken);
  removeCookie(config.influenceIntentToken, { path: '/' });
  debug('Intent token removed');
}

/**
 * Store the purchase intent token (PIT) in both sessionStorage and cookie.
 */
export function storePurchaseToken(
  token: string,
  config: TokenStorageConfig = DEFAULT_CONFIG
): void {
  if (!isValidToken(token)) {
    return;
  }

  setSession(config.purchaseIntentToken, token);
  setCookie(config.purchaseIntentToken, token, {
    maxAge: config.cookieMaxAge,
    path: '/',
    sameSite: 'Strict',
  });

  debug('Purchase token stored');
}

/**
 * Get the purchase intent token (PIT) from sessionStorage first, then cookie fallback.
 */
export function getPurchaseToken(config: TokenStorageConfig = DEFAULT_CONFIG): string | null {
  // Try sessionStorage first
  const sessionToken = getSession(config.purchaseIntentToken);
  if (isValidToken(sessionToken)) {
    debug('Purchase token retrieved from sessionStorage');
    return sessionToken;
  }

  // Fallback to cookie
  const cookieToken = getCookie(config.purchaseIntentToken);
  if (isValidToken(cookieToken)) {
    debug('Purchase token retrieved from cookie');
    return cookieToken;
  }

  return null;
}

/**
 * Remove the purchase token from both storage layers.
 */
export function removePurchaseToken(config: TokenStorageConfig = DEFAULT_CONFIG): void {
  removeSession(config.purchaseIntentToken);
  removeCookie(config.purchaseIntentToken, { path: '/' });
  debug('Purchase token removed');
}

/**
 * Check if a purchase token already exists.
 */
export function hasPurchaseToken(config: TokenStorageConfig = DEFAULT_CONFIG): boolean {
  return getPurchaseToken(config) !== null;
}

/**
 * Check if an intent token already exists.
 */
export function hasIntentToken(config: TokenStorageConfig = DEFAULT_CONFIG): boolean {
  return getIntentToken(config) !== null;
}

/**
 * Clear all tokens from storage.
 */
export function clearAllTokens(config: TokenStorageConfig = DEFAULT_CONFIG): void {
  removeIntentToken(config);
  removePurchaseToken(config);
  debug('All tokens cleared');
}
