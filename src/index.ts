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
import { setCartState, hasCartItems as checkHasCartItems } from './core/state.js';

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
 * ```TypeScript
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
export const hasIntentToken = (): boolean => {
  const config = getConfig();
  return hasStoredIntentToken({
    influenceIntentToken: config.influenceIntentToken,
    purchaseIntentToken: config.purchaseIntentToken,
    cookieExpireDays: config.cookieExpireDays,
  });
};

/**
 * Check if a Purchase Intent Token (PIT) exists.
 *
 * @returns `true` if PIT is available, `false` otherwise.
 *
 * @example
 * ```TypeScript
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
 * ```TypeScript
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
 *   console.error('Lock failed:', result. error);
 * }
 * ```
 *
 * @see {@link handleCartChange} - Automatically locks/clears on cart state change
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
 * ```TypeScript
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
 * @see {@link handleCartChange} - Automatically clears on cart empty
 * @see {@link handlePaymentSuccess} - Automatically clears on payment success
 */
function clearTokens(): void {
  const config = getConfig();
  clearAllTokens({
    influenceIntentToken: config.influenceIntentToken,
    purchaseIntentToken: config.purchaseIntentToken,
    cookieExpireDays: config.cookieExpireDays,
  });
  debug('Tokens cleared');
}

export default clearTokens

// ============================================
// EVENT HANDLERS (Merchant → Agent)
// ============================================

/**
 * Tell the agent that the cart state changed.
 *
 * This is the **single method** for all cart state changes:
 * - **Locks IIT → PIT** when `itemCount > 0` and `previousCount === 0`
 * - **Clears tokens** when `itemCount === 0` and PIT is present
 *
 * Only locks if IIT exists and PIT doesn't already exist.
 *
 * @param event - Cart change event data
 *
 * @example
 * ```TypeScript
 * // Add to cart (0 → 1 items) - locks IIT → PIT
 * QredexAgent.handleCartChange({
 *   itemCount: 1,
 *   previousCount: 0,
 * });
 *
 * // Add more items (1 → 3) - no action
 * QredexAgent.handleCartChange({
 *   itemCount: 3,
 *   previousCount: 1,
 * });
 *
 * // Empty cart (3 → 0) - clears tokens
 * QredexAgent.handleCartChange({
 *   itemCount: 0,
 *   previousCount: 3,
 * });
 *
 * // With optional metadata (sent to lock API)
 * QredexAgent.handleCartChange({
 *   itemCount: 1,
 *   previousCount: 0,
 *   meta: {
 *     productId: 'widget-001',
 *     quantity: 2,
 *     price: 99.99,
 *   },
 * });
 * ```
 *
 * @emits `onLocked` - When IIT is locked to PIT (itemCount > 0, previousCount === 0)
 * @emits `onCleared` - When tokens are cleared (itemCount === 0)
 * @emits `onError` - If lock fails
 *
 * @see {@link lockIntent} - Manual lock operation
 * @see {@link clearTokens} - Manual token clearing
 * @see {@link onLocked} - Listen for lock events
 * @see {@link onCleared} - Listen for clear events
 */
export function handleCartChange(event: {
  itemCount: number;
  previousCount: number;
  meta?: {
    productId?: string;
    quantity?: number;
    price?: number;
  };
  timestamp?: number;
}): void {
  const { itemCount, previousCount, meta, timestamp } = event;

  // Validate inputs
  if (typeof itemCount !== 'number' || typeof previousCount !== 'number') {
    const errorEvent = {
      error: 'itemCount and previousCount must be numbers',
      context: 'handleCartChange',
    };

    for (const handler of errorHandlers) {
      try {
        handler(errorEvent);
      } catch (err) {
        console.error('[QredexAgent] onError handler error:', err);
      }
    }
    return;
  }

  if (itemCount < 0 || previousCount < 0) {
    const errorEvent = {
      error: 'itemCount and previousCount must be non-negative',
      context: 'handleCartChange',
    };

    for (const handler of errorHandlers) {
      try {
        handler(errorEvent);
      } catch (err) {
        console.error('[QredexAgent] onError handler error:', err);
      }
    }
    return;
  }

  debug('Cart change event received', event);

  // Update cart state for tracking
  setCartState(itemCount > 0 ? 'non-empty' : 'empty');

  // Lock when cart has items, IIT exists, and PIT doesn't exist
  // This retries on every add-to-cart if lock previously failed (Rule 13)
  if (itemCount > 0 && hasIntentToken() && !hasPurchaseIntentToken()) {
    debug('Cart has items, IIT exists, no PIT - attempting lock');

    // Auto-lock IIT → PIT
    lockIntent(meta)
      .then((result) => {
        // Emit locked event to listeners
        if (result.success) {
          const lockedEvent = {
            purchaseToken: result.purchaseToken ?? '',
            alreadyLocked: result.alreadyLocked,
            timestamp: timestamp ?? Date.now(),
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
            context: 'handleCartChange',
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
        console.error('[QredexAgent] handleCartChange lock failed:', err);

        // Emit error event
        const errorEvent = {
          error: err instanceof Error ? err.message : 'Unknown error',
          context: 'handleCartChange',
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

  // Clear when cart goes from >0 → 0 (emptied) and PIT exists
  if (itemCount === 0 && previousCount > 0 && hasPurchaseIntentToken()) {
    debug('Cart emptied, clearing tokens');

    // Auto-clear tokens
    clearTokens();

    // Emit cleared event to listeners
    const clearedEvent = {
      timestamp: timestamp ?? Date.now(),
    };

    for (const handler of clearedHandlers) {
      try {
        handler(clearedEvent);
      } catch (err) {
        console.error('[QredexAgent] onCleared handler error:', err);
      }
    }
  }
}

/**
 * Tell the agent that an item was added to cart.
 *
 * Convenience wrapper for `handleCartChange()` when adding items.
 * Tracks cart state internally to determine previous count.
 *
 * @param itemCount - Current number of items in cart (after adding)
 * @param meta - Optional metadata (product info)
 *
 * @example
 * ```TypeScript
 * // After adding item to cart
 * const newCount = cart.getItems().length;
 * QredexAgent.handleCartAdd(newCount, {
 *   productId: 'widget-001',
 *   quantity: 1,
 * });
 * ```
 *
 * @see {@link handleCartChange} - Main cart state change method
 * @see {@link handleCartEmpty} - Convenience wrapper for emptying cart
 */
export function handleCartAdd(
  itemCount: number,
  meta?: {
    productId?: string;
    quantity?: number;
    price?: number;
  }
): void {
  if (typeof itemCount !== 'number' || itemCount < 0) {
    const errorEvent = {
      error: 'itemCount must be a non-negative number',
      context: 'handleCartAdd',
    };

    for (const handler of errorHandlers) {
      try {
        handler(errorEvent);
      } catch (err) {
        console.error('[QredexAgent] onError handler error:', err);
      }
    }
    return;
  }

  // Get current cart state to determine previous count
  const wasEmpty = !hasCartItems();
  const previousCount = wasEmpty ? 0 : 1;

  handleCartChange({
    itemCount,
    previousCount,
    meta,
  });
}

/**
 * Tell the agent that the cart was emptied.
 *
 * Convenience wrapper for `handleCartChange()` when cart becomes empty.
 * This will clear both IIT and PIT tokens.
 *
 * @example
 * ```TypeScript
 * // After emptying cart
 * cart.clear();
 * QredexAgent.handleCartEmpty();
 * ```
 *
 * @see {@link handleCartChange} - Main cart state change method
 * @see {@link handleCartAdd} - Convenience wrapper for adding to cart
 */
export function handleCartEmpty(): void {
  const previousCount = hasCartItems() ? 1 : 0;

  handleCartChange({
    itemCount: 0,
    previousCount,
  });
}

/**
 * Check if cart currently has items.
 * @internal
 */
function hasCartItems(): boolean {
  return checkHasCartItems();
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
 * ```TypeScript
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
 * @see {@link handleCartChange} - Cart state change event
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
 * This happens after `handleCartChange()` or `lockIntent()` succeeds.
 *
 * @param handler - Callback function that receives the lock event data.
 *
 * @example
 * ```TypeScript
 * QredexAgent.onLocked(({ purchaseToken, alreadyLocked, timestamp }) => {
 *   console.log('✅ Locked:', purchaseToken);
 *   console.log('Already locked:', alreadyLocked);
 *   showNotification('Attribution locked!');
 * });
 * ```
 *
 * @see {@link offLocked} - Unregister the handler
 * @see {@link handleCartChange} - Triggers lock/clear on cart state change
 */
export function onLocked(handler: LockedHandler): void {
  lockedHandlers.push(handler);
}

/**
 * Listen for cleared state events.
 *
 * Register a handler that will be called when tokens are cleared.
 * This happens after `handleCartChange()` or `handlePaymentSuccess()`.
 *
 * @param handler - Callback function that receives the clear event data.
 *
 * @example
 * ```TypeScript
 * QredexAgent.onCleared(({ timestamp }) => {
 *   console.log('🗑️ Cleared');
 *   showNotification('Attribution cleared');
 * });
 * ```
 *
 * @see {@link offCleared} - Unregister the handler
 * @see {@link handleCartChange} - Triggers clear on cart empty
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
 * ```TypeScript
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
 * ```TypeScript
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
 * ```TypeScript
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
 *
 * @example
 * ```TypeScript
 * QredexAgent.init({
 *   debug: true,  // Enable debug logging
 *   lockEndpoint: 'https://api.qredex.com/api/v1/agent/intents/lock',
 *   cookieExpireDays: 30,
 * });
 * ```
 *
 * @see {@link destroy} - Destroy the agent
 * @see {@link isInitialized} - Check if initialized
 * @param _config
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
 * ```TypeScript
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
    handleCartChange,
    handleCartAdd,
    handleCartEmpty,
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
