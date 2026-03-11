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
 * Lock API for communicating with Qredex's public lock endpoint.
 */

import { debug, info, warn } from '../utils/log.js';
import { getConfig } from '../bootstrap/config.js';
import { getInfluenceIntentToken, getPurchaseToken, storePurchaseToken, removeInfluenceIntentToken } from '../storage/tokens.js';
import { endLock, isLockInProgress, startLock } from '../core/state.js';
import type { LockRequest, LockResponse, LockResult, LockMeta } from './types.js';

// Track the in-flight lock promise for idempotency
let inFlightPromise: Promise<LockResult> | null = null;

/**
 * Call the lock endpoint to exchange IIT for PIT.
 * This function is idempotent:
 * - If PIT already exists locally, return it immediately
 * - If a lock is already in flight, return the same promise
 * - If backend indicates already locked, treat it as success
 */
export const lockIntent = async (_meta?: LockMeta): Promise<LockResult> => {
  const config = getConfig();

  // Check if PIT already exists locally - idempotent fast path
  const existingPit = getPurchaseToken({
    influenceIntentToken: config.influenceIntentToken,
    purchaseIntentToken: config.purchaseIntentToken,
    cookieExpireDays: config.cookieExpireDays,
  });

  if (existingPit) {
    debug('PIT already exists locally, returning cached value');
    return {
      success: true,
      purchaseToken: existingPit,
      alreadyLocked: true,
    };
  }

  // Check if lock is already in flight - return the same promise
  if (isLockInProgress() && inFlightPromise) {
    debug('Lock already in flight, returning existing promise');
    return inFlightPromise;
  }

  // Start a new lock request
  if (!startLock()) {
    // Fallback: another thread started a lock between our checks
    if (inFlightPromise) {
      return inFlightPromise;
    }
    return {
      success: false,
      purchaseToken: null,
      alreadyLocked: false,
      error: 'Lock request already in progress',
    };
  }

  // Create the lock promise and track it
  inFlightPromise = (async (): Promise<LockResult> => {
    try {
      // Get the intent token
      const intentToken = getInfluenceIntentToken({
        influenceIntentToken: config.influenceIntentToken,
        purchaseIntentToken: config.purchaseIntentToken,
        cookieExpireDays: config.cookieExpireDays,
      });

      if (!intentToken) {
        endLock();
        inFlightPromise = null;
        return {
          success: false,
          purchaseToken: null,
          alreadyLocked: false,
          error: 'No intent token available',
        };
      }

      // Use mock endpoint for local development
      if (config.useMockEndpoint) {
        // Only warn in development (check for localhost or file protocol)
        const isLocalhost = typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1' ||
           window.location.protocol === 'file:');

        if (!isLocalhost) {
          // eslint-disable-next-line no-console
          console.warn(
            '[QredexAgent] ⚠️ MOCK ENDPOINT ENABLED - Development mode only! ' +
            'Do not deploy to production with useMockEndpoint: true'
          );
        }
        debug('Using mock endpoint (development mode)');
        const mockPit = generateMockPIT();

        // Store the mock PIT
        storePurchaseToken(mockPit, {
          influenceIntentToken: config.influenceIntentToken,
          purchaseIntentToken: config.purchaseIntentToken,
          cookieExpireDays: config.cookieExpireDays,
        });

        // Remove the IIT
        removeInfluenceIntentToken({
          influenceIntentToken: config.influenceIntentToken,
          purchaseIntentToken: config.purchaseIntentToken,
          cookieExpireDays: config.cookieExpireDays,
        });

        endLock();
        inFlightPromise = null;
        info('Intent locked successfully (mock)');
        return {
          success: true,
          purchaseToken: mockPit,
          alreadyLocked: false,
        };
      }

      // Build the request payload (meta is optional)
      const payload: LockRequest = {
        token: intentToken,
      };

      // Include meta if provided
      if (_meta && Object.keys(_meta).length > 0) {
        payload.meta = _meta;
      }

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
        inFlightPromise = null;
        return {
          success: false,
          purchaseToken: null,
          alreadyLocked: false,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      const data: LockResponse = await response.json();

      endLock();
      inFlightPromise = null;

      // Validate response has token
      if (!data.token) {
        return {
          success: false,
          purchaseToken: null,
          alreadyLocked: false,
          error: 'Invalid response from server: missing token',
        };
      }

      // Store the PIT for future use
      storePurchaseToken(data.token, {
        influenceIntentToken: config.influenceIntentToken,
        purchaseIntentToken: config.purchaseIntentToken,
        cookieExpireDays: config.cookieExpireDays,
      });

      // Remove the IIT since it's been successfully locked
      removeInfluenceIntentToken({
        influenceIntentToken: config.influenceIntentToken,
        purchaseIntentToken: config.purchaseIntentToken,
        cookieExpireDays: config.cookieExpireDays,
      });

      info('Intent locked successfully');
      return {
        success: true,
        purchaseToken: data.token,
        alreadyLocked: false,
      };
    } catch (err) {
      endLock();
      inFlightPromise = null;
      warn('Lock request failed:', err);
      return {
        success: false,
        purchaseToken: null,
        alreadyLocked: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  })();

  return inFlightPromise;
};

/**
 * Generate a mock PIT token for local development.
 * ⚠️ DEVELOPMENT ONLY - Must only be called when config.useMockEndpoint is true.
 */
function generateMockPIT(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `mock_pit_${timestamp}_${random}`;
}
