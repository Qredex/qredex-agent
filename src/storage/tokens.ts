/**
 *    ▄▄▄▄
 *  ▄█▀▀███▄▄              █▄
 *  ██    ██ ▄             ██
 *  ██    ██ ████▄▄█▀█▄ ▄████ ▄█▀█▄▀██ ██▀
 *  ██  ▄ ██ ██   ██▄█▀ ██ ██ ██▄█▀  ███
 *   ▀█████▄▄█▀  ▄▀█▄▄▄▄█▀███▄▀█▄▄▄▄██ ██▄
 *        ▀█
 *
 *  Copyright (C) 2026 — 2026, Qredex, LTD. All Rights Reserved.
 *
 *  DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 *
 *  Licensed under the Apache License, Version 2.0. See LICENSE for the full license text.
 *  You may not use this file except in compliance with that License.
 *  Unless required by applicable law or agreed to in writing, software distributed under the
 *  License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 *  either express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 *
 *  If you need additional information or have any questions, please email: copyright@qredex.com
 */

/**
 * Token storage helpers that coordinate between sessionStorage and cookies.
 * Provides a unified API for storing and retrieving intent tokens.
 */

import { setCookie, getCookie, removeCookie } from './cookie.js';
import { setSession, getSession, removeSession } from './session.js';
import { debug } from '../utils/log.js';
import { isValidToken } from '../utils/guards.js';
import {
  DEFAULT_COOKIE_EXPIRE_DAYS,
  DEFAULT_INFLUENCE_INTENT_TOKEN_KEY,
  DEFAULT_PURCHASE_INTENT_TOKEN_KEY,
} from '../utils/constants.js';

export interface TokenStorageConfig {
  influenceIntentToken: string;
  purchaseIntentToken: string;
  cookieExpireDays: number;
}

const DEFAULT_CONFIG: TokenStorageConfig = {
  influenceIntentToken: DEFAULT_INFLUENCE_INTENT_TOKEN_KEY,
  purchaseIntentToken: DEFAULT_PURCHASE_INTENT_TOKEN_KEY,
  cookieExpireDays: DEFAULT_COOKIE_EXPIRE_DAYS,
};

/**
 * Store the influence intent token (IIT) in both sessionStorage and cookie.
 */
export function storeInfluenceIntentToken(token: string, config: TokenStorageConfig = DEFAULT_CONFIG): void {
  if (!isValidToken(token)) {
    debug('Invalid influence intent token (must be 8-2048 chars):', token?.length ?? 0, 'chars');
    return;
  }

  setSession(config.influenceIntentToken, token);
  setCookie(config.influenceIntentToken, token, {
    maxAge: config.cookieExpireDays * 86400, // Convert days to seconds
    path: '/',
    sameSite: 'Strict',
  });

  debug('Influence intent token stored');
}

/**
 * Get the influence intent token (IIT) from sessionStorage first, then cookie fallback.
 */
export function getInfluenceIntentToken(config: TokenStorageConfig = DEFAULT_CONFIG): string | null {
  // Try sessionStorage first
  const sessionToken = getSession(config.influenceIntentToken);
  if (isValidToken(sessionToken)) {
    debug('Influence intent token retrieved from sessionStorage');
    return sessionToken;
  }

  // Log if we found an invalid token in sessionStorage
  if (sessionToken) {
    debug('Invalid influence intent token in sessionStorage (must be 8-2048 chars):', sessionToken.length, 'chars');
  }

  // Fallback to cookie
  const cookieToken = getCookie(config.influenceIntentToken);
  if (isValidToken(cookieToken)) {
    debug('Influence intent token retrieved from cookie');
    return cookieToken;
  }

  // Log if we found an invalid token in cookie
  if (cookieToken) {
    debug('Invalid influence intent token in cookie (must be 8-2048 chars):', cookieToken.length, 'chars');
  }

  return null;
}

/**
 * Remove the influence intent token from both storage layers.
 */
export function removeInfluenceIntentToken(config: TokenStorageConfig = DEFAULT_CONFIG): void {
  removeSession(config.influenceIntentToken);
  removeCookie(config.influenceIntentToken, { path: '/' });
  debug('Influence intent token removed');
}

/**
 * Get the purchase intent token (PIT) in both sessionStorage and cookie.
 */
export function storePurchaseToken(
  token: string,
  config: TokenStorageConfig = DEFAULT_CONFIG
): void {
  if (!isValidToken(token)) {
    debug('Invalid purchase token (must be 8-2048 chars):', token?.length ?? 0, 'chars');
    return;
  }

  setSession(config.purchaseIntentToken, token);
  setCookie(config.purchaseIntentToken, token, {
    maxAge: config.cookieExpireDays * 86400, // Convert days to seconds
    path: '/',
    sameSite: 'Strict',
  });

  debug('Purchase token stored');
}

/**
 * Get the purchase intent token (PIT) from sessionStorage first, then cookie fallback.
 */
export const getPurchaseToken = (config: TokenStorageConfig = DEFAULT_CONFIG): string | null => {
  // Try sessionStorage first
  const sessionToken = getSession(config.purchaseIntentToken);
  if (isValidToken(sessionToken)) {
    debug('Purchase token retrieved from sessionStorage');
    return sessionToken;
  }

  // Log if we found an invalid token in sessionStorage
  if (sessionToken) {
    debug('Invalid purchase token in sessionStorage (must be 8-2048 chars):', sessionToken.length, 'chars');
  }

  // Fallback to cookie
  const cookieToken = getCookie(config.purchaseIntentToken);
  if (isValidToken(cookieToken)) {
    debug('Purchase token retrieved from cookie');
    return cookieToken;
  }

  // Log if we found an invalid token in cookie
  if (cookieToken) {
    debug('Invalid purchase token in cookie (must be 8-2048 chars):', cookieToken.length, 'chars');
  }

  return null;
};

/**
 * Remove the purchase token from both storage layers.
 */
export const removePurchaseToken = (config: TokenStorageConfig = DEFAULT_CONFIG): void => {
  removeSession(config.purchaseIntentToken);
  removeCookie(config.purchaseIntentToken, { path: '/' });
  debug('Purchase token removed');
};

/**
 * Check if a purchase token already exists.
 */
export function hasPurchaseToken(config: TokenStorageConfig = DEFAULT_CONFIG): boolean {
  return getPurchaseToken(config) !== null;
}

/**
 * Check if an influence intent token (IIT) already exists.
 */
export function hasInfluenceIntentToken(config: TokenStorageConfig = DEFAULT_CONFIG): boolean {
  return getInfluenceIntentToken(config) !== null;
}

/**
 * Clear all tokens from storage.
 */
export function clearAllTokens(config: TokenStorageConfig = DEFAULT_CONFIG): void {
  removeInfluenceIntentToken(config);
  removePurchaseToken(config);
  debug('All tokens cleared');
}
