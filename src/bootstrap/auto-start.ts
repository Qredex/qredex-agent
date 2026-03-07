/**
 * Auto-start bootstrap for the Qredex Agent.
 * Captures the qdx_intent token from URL on script load.
 */

import { debug, info, warn } from '../utils/log.js';
import { getIntentToken, storeIntentToken } from '../storage/tokens.js';
import { getConfigValue } from './config.js';

const INFLUENCE_INTENT_TOKEN_PARAM = 'qdx_intent';

/**
 * Extract the qdx_intent token from the current URL.
 */
const extractIntentFromUrl = (): string | null => {
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get(INFLUENCE_INTENT_TOKEN_PARAM);

    if (token) {
      debug('Found qdx_intent in URL');
      return token;
    }

    return null;
  } catch (err) {
    warn('Failed to parse URL query string', err);
    return null;
  }
};

export default extractIntentFromUrl;

/**
 * Remove the qdx_intent parameter from the URL without reloading.
 * Uses history.replaceState to maintain the current page state.
 */
export const cleanUrl = (): void => {
  try {
    const params = new URLSearchParams(window.location.search);

    if (params.has(INFLUENCE_INTENT_TOKEN_PARAM)) {
      params.delete(INFLUENCE_INTENT_TOKEN_PARAM);

      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash}`;

      window.history.replaceState({}, '', newUrl);
      debug('Cleaned qdx_intent from URL');
    }
  } catch (err) {
    warn('Failed to clean URL', err);
  }
};

/**
 * Capture and store the intent token from URL.
 * Returns true if a token was found and stored.
 */
export function captureIntentToken(): boolean {
  // Check if we already have a token stored
  const existingToken = getIntentToken({
    influenceIntentToken: getConfigValue('influenceIntentToken'),
    purchaseIntentToken: getConfigValue('purchaseIntentToken'),
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
    influenceIntentToken: getConfigValue('influenceIntentToken'),
    purchaseIntentToken: getConfigValue('purchaseIntentToken'),
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
