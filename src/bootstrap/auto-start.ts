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
 *  This is proprietary and confidential. Unauthorized copying, redistributing
 *  and/or modification of this file via any medium is inexorably prohibited.
 *
 *  If you need additional information or have any questions, please email: copyright@qredex.com
 */

/**
 * Auto-start bootstrap for the Qredex Agent.
 * Captures the qdx_intent token from URL on script load.
 */

import { debug, info, warn } from '../utils/log.js';
import { getPurchaseToken, storeInfluenceIntentToken } from '../storage/tokens.js';
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
 *
 * IIT can be replaced by a new IIT until PIT exists (lock happens).
 * Once PIT exists, no new IIT will be captured.
 */
export function captureIntentToken(): boolean {
  // Check if PIT already exists (lock has happened)
  const existingPit = getPurchaseToken({
    influenceIntentToken: getConfigValue('influenceIntentToken'),
    purchaseIntentToken: getConfigValue('purchaseIntentToken'),
    cookieExpireDays: getConfigValue('cookieExpireDays'),
  });

  if (existingPit) {
    debug('PIT already exists (lock completed), skipping IIT capture');
    return false;
  }

  const token = extractIntentFromUrl();

  if (!token) {
    debug('No qdx_intent token found in URL');
    return false;
  }

  // Store the token (replaces any existing IIT)
  storeInfluenceIntentToken(token, {
    influenceIntentToken: getConfigValue('influenceIntentToken'),
    purchaseIntentToken: getConfigValue('purchaseIntentToken'),
    cookieExpireDays: getConfigValue('cookieExpireDays'),
  });

  // Clean the URL
  cleanUrl();

  info('Intent token captured and stored');

  return true;
}

/**
 * Auto-start hook: runs immediately when the script loads.
 * This is called by the main entry point.
 * Returns true if intent was captured.
 */
export function autoStart(): boolean {
  debug('Auto-start: capturing intent token from URL');
  return captureIntentToken();
}
