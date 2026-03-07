/**
 * Auto-start bootstrap for the Qredex Agent.
 * Captures the qdx_intent token from URL on script load.
 */

import { debug, info, warn } from '../utils/log.js';
import { storeIntentToken, getIntentToken } from '../storage/tokens.js';
import { getConfigValue } from './config.js';

const INTENT_PARAM = 'qdx_intent';

/**
 * Extract the qdx_intent token from the current URL.
 */
export function extractIntentFromUrl(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get(INTENT_PARAM);

    if (token) {
      debug('Found qdx_intent in URL');
      return token;
    }

    return null;
  } catch (err) {
    warn('Failed to parse URL query string', err);
    return null;
  }
}

/**
 * Remove the qdx_intent parameter from the URL without reloading.
 * Uses history.replaceState to maintain the current page state.
 */
export function cleanUrl(): void {
  try {
    const params = new URLSearchParams(window.location.search);

    if (params.has(INTENT_PARAM)) {
      params.delete(INTENT_PARAM);

      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash}`;

      window.history.replaceState({}, '', newUrl);
      debug('Cleaned qdx_intent from URL');
    }
  } catch (err) {
    warn('Failed to clean URL', err);
  }
}

/**
 * Capture and store the intent token from URL.
 * Returns true if a token was found and stored.
 */
export function captureIntentToken(): boolean {
  // Check if we already have a token stored
  const existingToken = getIntentToken({
    cookieNameIntent: getConfigValue('cookieNameIntent'),
    cookieNamePurchase: getConfigValue('cookieNamePurchase'),
    storageKeyIntent: getConfigValue('storageKeyIntent'),
    storageKeyPurchase: getConfigValue('storageKeyPurchase'),
    cookieMaxAge: getConfigValue('cookieMaxAge'),
  });

  if (existingToken) {
    debug('Intent token already stored, skipping URL capture');
    return true;
  }

  const token = extractIntentFromUrl();

  if (!token) {
    debug('No qdx_intent token found in URL');
    return false;
  }

  // Store the token
  storeIntentToken(token, {
    cookieNameIntent: getConfigValue('cookieNameIntent'),
    cookieNamePurchase: getConfigValue('cookieNamePurchase'),
    storageKeyIntent: getConfigValue('storageKeyIntent'),
    storageKeyPurchase: getConfigValue('storageKeyPurchase'),
    cookieMaxAge: getConfigValue('cookieMaxAge'),
  });

  // Clean the URL
  cleanUrl();

  info('Intent token captured and stored');

  return true;
}

/**
 * Auto-start hook: runs immediately when the script loads.
 * This is called by the main entry point.
 */
export function autoStart(): void {
  debug('Auto-start: capturing intent token from URL');
  captureIntentToken();
}
