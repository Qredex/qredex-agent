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
 * Qredex Agent - Browser library for intent capture and locking.
 *
 * A lightweight, framework-agnostic browser agent that:
 * - Captures qdx_intent tokens from URLs
 * - Persists tokens in sessionStorage and cookies
 * - Locks intent through Qredex's API
 * - Manages attribution state
 */

import { setDebugMode, debug } from './utils/log.js';
import { getConfig } from './bootstrap/config.js';
import { autoStart } from './bootstrap/auto-start.js';
import {
  getIntentToken as getStoredIntentToken,
  getPurchaseToken as getStoredPurchaseToken,
  hasIntentToken as hasStoredIntentToken,
  hasPurchaseToken as hasStoredPurchaseToken,
  clearAllTokens,
} from './storage/tokens.js';
import { lockIntent as apiLockIntent } from './api/lock.js';

import type { AgentConfig } from './bootstrap/config.js';
import type { LockResult, LockMeta } from './api/types.js';

// Auto-start: capture intent token from URL immediately
autoStart();

// ============================================
// READ / STATE (Manual)
// ============================================

/**
 * Get the current intent token (IIT).
 * Checks sessionStorage first, then falls back to cookie.
 */
export function getIntentToken(): string | null {
  const config = getConfig();
  return getStoredIntentToken({
    influenceIntentToken: config.influenceIntentToken,
    purchaseIntentToken: config.purchaseIntentToken,
    cookieExpireDays: config.cookieExpireDays,
  });
}

/**
 * Get the current purchase intent token (PIT).
 * Checks sessionStorage first, then falls back to cookie.
 */
export function getPurchaseIntentToken(): string | null {
  const config = getConfig();
  return getStoredPurchaseToken({
    influenceIntentToken: config.influenceIntentToken,
    purchaseIntentToken: config.purchaseIntentToken,
    cookieExpireDays: config.cookieExpireDays,
  });
}

/**
 * Check if an intent token (IIT) exists.
 */
export function hasIntentToken(): boolean {
  const config = getConfig();
  return hasStoredIntentToken({
    influenceIntentToken: config.influenceIntentToken,
    purchaseIntentToken: config.purchaseIntentToken,
    cookieExpireDays: config.cookieExpireDays,
  });
}

/**
 * Check if a purchase intent token (PIT) exists.
 */
export function hasPurchaseIntentToken(): boolean {
  const config = getConfig();
  return hasStoredPurchaseToken({
    influenceIntentToken: config.influenceIntentToken,
    purchaseIntentToken: config.purchaseIntentToken,
    cookieExpireDays: config.cookieExpireDays,
  });
}

// ============================================
// COMMANDS (Manual)
// ============================================

/**
 * Manually trigger a lock request.
 * This exchanges the IIT for a PIT.
 *
 * @param meta - Optional metadata to include with the lock request
 */
export async function lockIntent(meta?: LockMeta): Promise<LockResult> {
  return apiLockIntent(meta);
}

/**
 * Clear all tokens (IIT and PIT) from storage.
 * Call this after successful checkout or when cart is emptied.
 */
export function clearTokens(): void {
  const config = getConfig();
  clearAllTokens({
    influenceIntentToken: config.influenceIntentToken,
    purchaseIntentToken: config.purchaseIntentToken,
    cookieExpireDays: config.cookieExpireDays,
  });
  debug('Tokens cleared');
}

// ============================================
// EVENT HANDLERS (Merchant → Agent)
// ============================================

/**
 * Tell the agent that a cart add event happened.
 * This will automatically lock IIT → PIT if conditions are met.
 *
 * @param event - Optional cart add event data
 */
export function handleCartAdd(event?: {
  productId?: string;
  quantity?: number;
  price?: number;
}): void {
  debug('Cart add event received', event);

  // Auto-lock IIT → PIT
  lockIntent(event)
    .then((result) => {
      // Emit locked event to listeners
      if (result.success) {
        const lockedEvent = {
          purchaseToken: result.purchaseToken ?? '',
          alreadyLocked: result.alreadyLocked,
          timestamp: Date.now(),
        };

        for (const handler of lockedHandlers) {
          try {
            handler(lockedEvent);
          } catch (err) {
            console.error('[QredexAgent] onLocked handler error:', err);
          }
        }
      } else {
        // Emit error event
        const errorEvent = {
          error: result.error ?? 'Lock failed',
          context: 'handleCartAdd',
        };

        for (const handler of errorHandlers) {
          try {
            handler(errorEvent);
          } catch (err) {
            console.error('[QredexAgent] onError handler error:', err);
          }
        }
      }
    })
    .catch((err) => {
      console.error('[QredexAgent] handleCartAdd lock failed:', err);

      // Emit error event
      const errorEvent = {
        error: err instanceof Error ? err.message : 'Unknown error',
        context: 'handleCartAdd',
      };

      for (const handler of errorHandlers) {
        try {
          handler(errorEvent);
        } catch (handlerErr) {
          console.error('[QredexAgent] onError handler error:', handlerErr);
        }
      }
    });
}

/**
 * Tell the agent that the cart was emptied.
 * This will automatically clear PIT from storage.
 *
 * @param event - Optional cart empty event data
 */
export function handleCartEmpty(event?: { timestamp?: number }): void {
  debug('Cart empty event received', event);

  // Auto-clear tokens
  clearTokens();

  // Emit cleared event to listeners
  const clearedEvent = {
    timestamp: event?.timestamp ?? Date.now(),
  };

  for (const handler of clearedHandlers) {
    try {
      handler(clearedEvent);
    } catch (err) {
      console.error('[QredexAgent] onCleared handler error:', err);
    }
  }
}

/**
 * Tell the agent that the cart state changed.
 * This is optional and used for tracking.
 *
 * @param event - Cart change event data
 */
export function handleCartChange(event: {
  itemCount: number;
  previousCount: number;
  timestamp?: number;
}): void {
  debug('Cart change event received', event);
  // Optional tracking - no automatic action
}

/**
 * Tell the agent that payment succeeded.
 * This will automatically clear PIT from storage.
 *
 * @param event - Payment success event data
 */
export function handlePaymentSuccess(event: {
  orderId: string;
  amount: number;
  currency: string;
  timestamp?: number;
}): void {
  debug('Payment success event received', event);

  // Auto-clear tokens
  clearTokens();

  // Emit cleared event to listeners
  const clearedEvent = {
    timestamp: event?.timestamp ?? Date.now(),
  };

  for (const handler of clearedHandlers) {
    try {
      handler(clearedEvent);
    } catch (err) {
      console.error('[QredexAgent] onCleared handler error:', err);
    }
  }
}

// ============================================
// EVENT LISTENERS (Agent → Merchant) - Optional
// ============================================

type LockedHandler = (event: {
  purchaseToken: string;
  alreadyLocked: boolean;
  timestamp: number;
}) => void;

type ClearedHandler = (event: {
  timestamp: number;
}) => void;

type ErrorHandler = (event: {
  error: string;
  context?: string;
}) => void;

const lockedHandlers: LockedHandler[] = [];
const clearedHandlers: ClearedHandler[] = [];
const errorHandlers: ErrorHandler[] = [];

/**
 * Listen for successful lock events.
 */
export function onLocked(handler: LockedHandler): void {
  lockedHandlers.push(handler);
}

/**
 * Listen for cleared state events.
 */
export function onCleared(handler: ClearedHandler): void {
  clearedHandlers.push(handler);
}

/**
 * Listen for agent error events.
 */
export function onError(handler: ErrorHandler): void {
  errorHandlers.push(handler);
}

/**
 * Unregister a locked handler.
 */
export function offLocked(handler: LockedHandler): void {
  const index = lockedHandlers.indexOf(handler);
  if (index !== -1) {
    lockedHandlers.splice(index, 1);
  }
}

/**
 * Unregister a cleared handler.
 */
export function offCleared(handler: ClearedHandler): void {
  const index = clearedHandlers.indexOf(handler);
  if (index !== -1) {
    clearedHandlers.splice(index, 1);
  }
}

/**
 * Unregister an error handler.
 */
export function offError(handler: ErrorHandler): void {
  const index = errorHandlers.indexOf(handler);
  if (index !== -1) {
    errorHandlers.splice(index, 1);
  }
}

// ============================================
// LIFECYCLE
// ============================================

/**
 * Initialize the Qredex Agent with optional configuration.
 * Usually not needed - agent auto-starts on script load.
 */
export function init(_config?: AgentConfig): void {
  const cfg = getConfig();
  setDebugMode(cfg.debug);
  debug('Agent initialized');
}

/**
 * Destroy the agent and clean up all resources.
 */
export function destroy(): void {
  lockedHandlers.length = 0;
  clearedHandlers.length = 0;
  errorHandlers.length = 0;
  debug('Agent destroyed');
}

/**
 * Alias for destroy().
 */
export function stop(): void {
  destroy();
}

// ============================================
// TYPES
// ============================================

export type { AgentConfig } from './bootstrap/config.js';
export type { LockResult, LockMeta } from './api/types.js';

// ============================================
// WINDOW GLOBAL (IIFE usage)
// ============================================

if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).QredexAgent = {
    // Read/State
    getIntentToken,
    getPurchaseIntentToken,
    hasIntentToken,
    hasPurchaseIntentToken,

    // Commands
    lockIntent,
    clearTokens,

    // Event Handlers (Merchant → Agent)
    handleCartAdd,
    handleCartEmpty,
    handleCartChange,
    handlePaymentSuccess,

    // Event Listeners (Agent → Merchant)
    onLocked,
    onCleared,
    onError,
    offLocked,
    offCleared,
    offError,

    // Lifecycle
    init,
    destroy,
    stop,
  };
}
