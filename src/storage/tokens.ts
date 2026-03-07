/**
 * Token storage helpers that coordinate between sessionStorage and cookies.
 * Provides a unified API for storing and retrieving intent tokens.
 */

import { setCookie, getCookie, removeCookie } from './cookie.js';
import { setSession, getSession, removeSession } from './session.js';
import { debug } from '../utils/log.js';
import { isValidToken } from '../utils/guards.js';

export interface TokenStorageConfig {
  cookieNameIntent: string;
  cookieNamePurchase: string;
  storageKeyInfluence: string;
  storageKeyPurchase: string;
  cookieMaxAge: number;
}

const DEFAULT_CONFIG: TokenStorageConfig = {
  cookieNameIntent: '__qdx_iit',
  cookieNamePurchase: '__qdx_pit',
  storageKeyInfluence: '__qdx_iit',
  storageKeyPurchase: '__qdx_pit',
  cookieMaxAge: 86400, // 24 hours
};

/**
 * Store the intent token (IIT) in both sessionStorage and cookie.
 */
export function storeIntentToken(token: string, config: TokenStorageConfig = DEFAULT_CONFIG): void {
  if (!isValidToken(token)) {
    return;
  }

  setSession(config.storageKeyInfluence, token);
  setCookie(config.cookieNameIntent, token, {
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
  const sessionToken = getSession(config.storageKeyInfluence);
  if (isValidToken(sessionToken)) {
    debug('Intent token retrieved from sessionStorage');
    return sessionToken;
  }

  // Fallback to cookie
  const cookieToken = getCookie(config.cookieNameIntent);
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
  removeSession(config.storageKeyInfluence);
  removeCookie(config.cookieNameIntent, { path: '/' });
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

  setSession(config.storageKeyPurchase, token);
  setCookie(config.cookieNamePurchase, token, {
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
  const sessionToken = getSession(config.storageKeyPurchase);
  if (isValidToken(sessionToken)) {
    debug('Purchase token retrieved from sessionStorage');
    return sessionToken;
  }

  // Fallback to cookie
  const cookieToken = getCookie(config.cookieNamePurchase);
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
  removeSession(config.storageKeyPurchase);
  removeCookie(config.cookieNamePurchase, { path: '/' });
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
