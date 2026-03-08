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
 * Get the current Influence Intent Token (IIT).
 *
 * Checks sessionStorage first, then falls back to cookie.
 * The IIT is captured from the URL parameter `?qdx_intent=xxx` on page load.
 *
 * @returns The IIT token string, or `null` if not found.
 *
 * @example
 * ```typescript
 * const iit = QredexAgent.getIntentToken();
 * if (iit) {
 *   console.log('IIT:', iit);
 * }
 * ```
 *
 * @see {@link hasIntentToken} - Check if IIT exists
 * @see {@link getPurchaseIntentToken} - Get the PIT token
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
 * Get the current Purchase Intent Token (PIT).
 *
 * Checks sessionStorage first, then falls back to cookie.
 * The PIT is created when the IIT is locked via the lock API.
 *
 * @returns The PIT token string, or `null` if not found.
 *
 * @example
 * ```typescript
 * const pit = QredexAgent.getPurchaseIntentToken();
 * if (pit) {
 *   console.log('PIT:', pit);
 *   // Send to backend with order
 * }
 * ```
 *
 * @see {@link hasPurchaseIntentToken} - Check if PIT exists
 * @see {@link getIntentToken} - Get the IIT token
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
 * Check if an Influence Intent Token (IIT) exists.
 *
 * @returns `true` if IIT is available, `false` otherwise.
 *
 * @example
 * ```typescript
 * if (QredexAgent.hasIntentToken()) {
 *   console.log('Intent token available - user came from Qredex link');
 * } else {
 *   console.log('No intent token - regular traffic');
 * }
 * ```
 *
 * @see {@link getIntentToken} - Get the IIT token
 * @see {@link hasPurchaseIntentToken} - Check if PIT exists
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
 * Check if a Purchase Intent Token (PIT) exists.
 *
 * @returns `true` if PIT is available, `false` otherwise.
 *
 * @example
 * ```typescript
 * if (QredexAgent.hasPurchaseIntentToken()) {
 *   console.log('Purchase locked - ready for attribution');
 *   // User has added to cart, attribution is locked
 * }
 * ```
 *
 * @see {@link getPurchaseIntentToken} - Get the PIT token
 * @see {@link hasIntentToken} - Check if IIT exists
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
 * Manually trigger a lock request to exchange IIT for PIT.
 *
 * This calls the Qredex lock API (`POST /api/v1/agent/intents/lock`) to exchange
 * the Influence Intent Token (IIT) for a Purchase Intent Token (PIT).
 *
 * The operation is **idempotent**:
 * - Returns cached PIT if already locked
 * - Returns same promise if lock is in-flight
 * - Safe to call multiple times
 *
 * @param meta - Optional metadata to include with the lock request (e.g., product info)
 * @returns Promise resolving to a `LockResult` object.
 *
 * @example
 * ```typescript
 * const result = await QredexAgent.lockIntent({
 *   productId: 'widget-001',
 *   quantity: 2,
 *   price: 99.99,
 * });
 *
 * if (result.success) {
 *   console.log('PIT:', result.purchaseToken);
 *   console.log('Already locked:', result.alreadyLocked);
 * } else {
 *   console.error('Lock failed:', result.error);
 * }
 * ```
 *
 * @see {@link handleCartAdd} - Automatically locks on cart add
 * @see {@link clearTokens} - Clear tokens after checkout
 */
export async function lockIntent(meta?: LockMeta): Promise<LockResult> {
  return apiLockIntent(meta);
}

/**
 * Clear all tokens (IIT and PIT) from storage.
 *
 * Removes both sessionStorage and cookie storage for IIT and PIT.
 * Call this after successful checkout or when cart is emptied.
 *
 * @example
 * ```typescript
 * // After successful checkout
 * QredexAgent.clearTokens();
 *
 * // When cart is emptied
 * function clearCart() {
 *   cart.clear();
 *   QredexAgent.clearTokens();
 * }
 * ```
 *
 * @see {@link handleCartEmpty} - Automatically clears on cart empty
 * @see {@link handlePaymentSuccess} - Automatically clears on payment success
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
 *
 * This will automatically trigger the lock flow to exchange IIT → PIT by calling
 * the lock API. Only locks if IIT exists and PIT doesn't already exist.
 *
 * @param event - Optional cart add event data (product info, quantity, price)
 *
 * @example
 * ```typescript
 * // After adding to cart
 * async function addToCart(product) {
 *   await api.post('/cart', product);
 *
 *   QredexAgent.handleCartAdd({
 *     productId: product.id,
 *     quantity: 1,
 *     price: product.price,
 *   });
 * }
 * ```
 *
 * @emits `onLocked` - If lock is successful
 * @emits `onError` - If lock fails
 *
 * @see {@link lockIntent} - Manual lock operation
 * @see {@link onLocked} - Listen for lock events
 * @see {@link handleCartEmpty} - Clear cart event
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
 *
 * This will automatically clear both IIT and PIT from storage.
 * Call this when the user empties their shopping cart.
 *
 * @param event - Optional cart empty event data (timestamp)
 *
 * @example
 * ```typescript
 * function clearCart() {
 *   cart.clear();
 *   QredexAgent.handleCartEmpty();
 * }
 * ```
 *
 * @emits `onCleared` - After tokens are cleared
 *
 * @see {@link clearTokens} - Manual token clearing
 * @see {@link onCleared} - Listen for clear events
 * @see {@link handlePaymentSuccess} - Payment success event
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
 *
 * This is optional and used for tracking cart state changes.
 * No automatic actions are taken (unlike `handleCartAdd` or `handleCartEmpty`).
 *
 * @param event - Cart change event data (item count, previous count)
 *
 * @example
 * ```typescript
 * QredexAgent.handleCartChange({
 *   itemCount: 5,
 *   previousCount: 3,
 * });
 * ```
 *
 * @see {@link handleCartAdd} - Cart add event (auto-locks)
 * @see {@link handleCartEmpty} - Cart empty event (auto-clears)
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
 *
 * This will automatically clear both IIT and PIT from storage.
 * Call this after successful order completion.
 *
 * @param event - Payment success event data (order ID, amount, currency)
 *
 * @example
 * ```typescript
 * async function checkout(order) {
 *   const pit = QredexAgent.getPurchaseIntentToken();
 *
 *   await api.post('/orders', {
 *     ...order,
 *     qredex_pit: pit,
 *   });
 *
 *   QredexAgent.handlePaymentSuccess({
 *     orderId: order.id,
 *     amount: order.total,
 *     currency: 'USD',
 *   });
 * }
 * ```
 *
 * @emits `onCleared` - After tokens are cleared
 *
 * @see {@link clearTokens} - Manual token clearing
 * @see {@link onCleared} - Listen for clear events
 * @see {@link handleCartEmpty} - Cart empty event
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
 *
 * Register a handler that will be called when the IIT is successfully locked to PIT.
 * This happens after `handleCartAdd()` or `lockIntent()` succeeds.
 *
 * @param handler - Callback function that receives the lock event data.
 *
 * @example
 * ```typescript
 * QredexAgent.onLocked(({ purchaseToken, alreadyLocked, timestamp }) => {
 *   console.log('✅ Locked:', purchaseToken);
 *   console.log('Already locked:', alreadyLocked);
 *   showNotification('Attribution locked!');
 * });
 * ```
 *
 * @see {@link offLocked} - Unregister the handler
 * @see {@link handleCartAdd} - Triggers lock on cart add
 */
export function onLocked(handler: LockedHandler): void {
  lockedHandlers.push(handler);
}

/**
 * Listen for cleared state events.
 *
 * Register a handler that will be called when tokens are cleared.
 * This happens after `handleCartEmpty()` or `handlePaymentSuccess()`.
 *
 * @param handler - Callback function that receives the clear event data.
 *
 * @example
 * ```typescript
 * QredexAgent.onCleared(({ timestamp }) => {
 *   console.log('🗑️ Cleared');
 *   showNotification('Attribution cleared');
 * });
 * ```
 *
 * @see {@link offCleared} - Unregister the handler
 * @see {@link handleCartEmpty} - Triggers clear on cart empty
 * @see {@link handlePaymentSuccess} - Triggers clear on payment success
 */
export function onCleared(handler: ClearedHandler): void {
  clearedHandlers.push(handler);
}

/**
 * Listen for agent error events.
 *
 * Register a handler that will be called when an error occurs.
 * Errors can happen during lock requests or other operations.
 *
 * @param handler - Callback function that receives the error event data.
 *
 * @example
 * ```typescript
 * QredexAgent.onError(({ error, context }) => {
 *   console.error('❌ Error in', context, ':', error);
 *   showNotification('Error: ' + error, 'error');
 * });
 * ```
 *
 * @see {@link offError} - Unregister the handler
 */
export function onError(handler: ErrorHandler): void {
  errorHandlers.push(handler);
}

/**
 * Unregister a locked handler.
 *
 * @param handler - The handler function to remove.
 *
 * @example
 * ```typescript
 * const handler = ({ purchaseToken }) => {
 *   console.log('Locked:', purchaseToken);
 * };
 *
 * QredexAgent.onLocked(handler);
 * // ... later
 * QredexAgent.offLocked(handler);
 * ```
 *
 * @see {@link onLocked} - Register the handler
 */
export function offLocked(handler: LockedHandler): void {
  const index = lockedHandlers.indexOf(handler);
  if (index !== -1) {
    lockedHandlers.splice(index, 1);
  }
}

/**
 * Unregister a cleared handler.
 *
 * @param handler - The handler function to remove.
 *
 * @example
 * ```typescript
 * const handler = () => console.log('Cleared');
 * QredexAgent.onCleared(handler);
 * // ... later
 * QredexAgent.offCleared(handler);
 * ```
 *
 * @see {@link onCleared} - Register the handler
 */
export function offCleared(handler: ClearedHandler): void {
  const index = clearedHandlers.indexOf(handler);
  if (index !== -1) {
    clearedHandlers.splice(index, 1);
  }
}

/**
 * Unregister an error handler.
 *
 * @param handler - The handler function to remove.
 *
 * @example
 * ```typescript
 * const handler = ({ error }) => console.error(error);
 * QredexAgent.onError(handler);
 * // ... later
 * QredexAgent.offError(handler);
 * ```
 *
 * @see {@link onError} - Register the handler
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
 *
 * Usually not needed - the agent auto-starts on script load with default configuration.
 * Use this if you need to customize configuration or re-initialize.
 *
 * @param config - Optional configuration options.
 *
 * @example
 * ```typescript
 * QredexAgent.init({
 *   debug: true,  // Enable debug logging
 *   lockEndpoint: 'https://api.qredex.com/api/v1/agent/intents/lock',
 *   cookieExpireDays: 30,
 * });
 * ```
 *
 * @see {@link destroy} - Destroy the agent
 * @see {@link isInitialized} - Check if initialized
 */
export function init(_config?: AgentConfig): void {
  const cfg = getConfig();
  setDebugMode(cfg.debug);
  debug('Agent initialized');
}

/**
 * Destroy the agent and clean up all resources.
 *
 * This removes all event listeners and resets internal state.
 * Use this in SPA frameworks when unmounting components or changing routes.
 *
 * @example
 * ```typescript
 * // React useEffect cleanup
 * useEffect(() => {
 *   return () => {
 *     QredexAgent.destroy();
 *   };
 * }, []);
 *
 * // Vue onUnmounted
 * onUnmounted(() => {
 *   QredexAgent.destroy();
 * });
 * ```
 *
 * @see {@link init} - Initialize the agent
 * @see {@link stop} - Alias for destroy
 */
export function destroy(): void {
  lockedHandlers.length = 0;
  clearedHandlers.length = 0;
  errorHandlers.length = 0;
  debug('Agent destroyed');
}

/**
 * Alias for {@link destroy}.
 *
 * @example
 * ```typescript
 * QredexAgent.stop();  // Same as destroy()
 * ```
 *
 * @see {@link destroy} - Destroy the agent
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
