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
import { getIntentToken, getPurchaseToken, storePurchaseToken } from '../storage/tokens.js';
import { endLock, isLockInProgress, startLock } from '../core/state.js';
import type { LockRequest, LockResponse, LockResult } from './types.js';

// Track the in-flight lock promise for idempotency
let inFlightPromise: Promise<LockResult> | null = null;

/**
 * Call the lock endpoint to exchange IIT for PIT.
 * This function is idempotent:
 * - If PIT already exists locally, return it immediately
 * - If a lock is already in flight, return the same promise
 * - If backend indicates already locked, treat it as success
 */
export const lockIntent = async (meta?: Record<string, unknown>): Promise<LockResult> => {
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
      const intentToken = getIntentToken({
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

      // Handle already-locked response from backend
      if (data.already_locked === true) {
        info('Intent was already locked on server');
        if (data.purchase_token) {
          // Store the returned PIT for future use
          storePurchaseToken(data.purchase_token, {
            influenceIntentToken: config.influenceIntentToken,
            purchaseIntentToken: config.purchaseIntentToken,
            cookieExpireDays: config.cookieExpireDays,
          });
        }
        return {
          success: true,
          purchaseToken: data.purchase_token ?? null,
          alreadyLocked: true,
        };
      }

      // Handle successful lock
      if (data.success && data.purchase_token) {
        // Store the PIT for future use
        storePurchaseToken(data.purchase_token, {
          influenceIntentToken: config.influenceIntentToken,
          purchaseIntentToken: config.purchaseIntentToken,
          cookieExpireDays: config.cookieExpireDays,
        });

        info('Intent locked successfully');
        return {
          success: true,
          purchaseToken: data.purchase_token,
          alreadyLocked: false,
        };
      }

      return {
        success: false,
        purchaseToken: null,
        alreadyLocked: false,
        error: data.error || 'Lock request failed',
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
