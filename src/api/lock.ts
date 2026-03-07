/**
 * Lock API for communicating with Qredex's public lock endpoint.
 */

import { debug, warn } from '../utils/log.js';
import { getConfig } from '../bootstrap/config.js';
import { getIntentToken } from '../storage/tokens.js';
import { startLock, endLock } from '../core/state.js';
import type { LockRequest, LockResponse, LockResult } from './types.js';

/**
 * Call the lock endpoint to exchange IIT for PIT.
 */
export async function lockIntent(meta?: Record<string, unknown>): Promise<LockResult> {
  const config = getConfig();

  // Check if lock is already in progress
  if (!startLock()) {
    return {
      success: false,
      error: 'Lock request already in progress',
    };
  }

  try {
    // Get the intent token
    const intentToken = getIntentToken({
      cookieNameIntent: config.cookieNameIntent,
      cookieNamePurchase: config.cookieNamePurchase,
      storageKeyIntent: config.storageKeyIntent,
      storageKeyPurchase: config.storageKeyPurchase,
      cookieMaxAge: config.cookieMaxAge,
    });

    if (!intentToken) {
      endLock();
      return {
        success: false,
        error: 'No intent token available',
      };
    }

    // Build the request payload
    const payload: LockRequest = {
      intent_token: intentToken,
      meta: {
        ...meta,
        user_agent: navigator.userAgent,
        referrer: document.referrer || undefined,
        url: window.location.href,
      },
    };

    debug('Sending lock request to:', config.lockEndpoint);

    // Make the request
    const response = await fetch(config.lockEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      endLock();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data: LockResponse = await response.json();

    endLock();

    if (data.success && data.purchase_token) {
      return {
        success: true,
        purchaseToken: data.purchase_token,
      };
    }

    return {
      success: false,
      error: data.error || 'Lock request failed',
    };
  } catch (err) {
    endLock();
    warn('Lock request failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
