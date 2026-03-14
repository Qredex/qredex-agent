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
 *  This file is part of the Qredex Agent SDK and is licensed under the MIT License. See LICENSE.
 *  Redistribution and use are permitted under that license.
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

import { setDebugMode, debug, info, warn, error as logError } from './utils/log.js';
import { getConfig, initConfig } from './bootstrap/config.js';
import { autoStart } from './bootstrap/auto-start.js';
import {
  getInfluenceIntentToken as getStoredInfluenceIntentToken,
  getPurchaseToken as getStoredPurchaseToken,
  hasInfluenceIntentToken as hasStoredInfluenceIntentToken,
  hasPurchaseToken as hasStoredPurchaseToken,
  clearAllTokens,
} from './storage/tokens.js';
import { lockIntent as apiLockIntent } from './api/lock.js';
import {
  getState as getRuntimeState,
  getCartState,
  markInitialized,
  setCartState,
  hasCartItems as checkHasCartItems,
  destroyState,
} from './core/state.js';

import type { AgentConfig } from './bootstrap/config.js';
import type { LockResult, LockMeta } from './api/types.js';

// ============================================
// EVENT HANDLER TYPES
// ============================================

type LockedHandler = (event: {
  purchaseToken: string;
  alreadyLocked: boolean;
  timestamp: number;
}) => void;

export type ClearReason = 'cart_empty' | 'payment_success' | 'manual_clear';

type ClearedHandler = (event: {
  reason: ClearReason;
  timestamp: number;
}) => void;

export type AgentErrorCode =
  | 'invalid_cart_counts'
  | 'lock_failed'
  | 'lock_request_failed';

type ErrorHandler = (event: {
  code: AgentErrorCode;
  message: string;
  error: string;
  context?: string;
}) => void;

type StateChangeHandler = (event: {
  hasIIT: boolean;
  hasPIT: boolean;
  locked: boolean;
  cartState: 'unknown' | 'empty' | 'non-empty';
  timestamp: number;
}) => void;

type IntentCapturedHandler = (event: {
  hasIIT: true;
  timestamp: number;
}) => void;

// ============================================
// EVENT HANDLER ARRAYS
// ============================================

const lockedHandlers: LockedHandler[] = [];
const clearedHandlers: ClearedHandler[] = [];
const errorHandlers: ErrorHandler[] = [];
const stateChangeHandlers: StateChangeHandler[] = [];
const intentCapturedHandlers: IntentCapturedHandler[] = [];

let browserBootstrapCompleted = false;

function canUseBrowserRuntime(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function reportInternalError(context: string, err: unknown): void {
  logError(`${context}:`, err);
}

function warnIfNotInitialized(methodName: string): void {
  if (!isInitialized()) {
    warn(
      `${methodName} called before init(). CDN/script-tag integrations auto-init by default, but ESM/framework/browser integrations should call init() first.`
    );
  }
}

function warnSuspiciousCartTransition(itemCount: number, previousCount: number): void {
  if (previousCount === itemCount) {
    warn(
      `handleCartChange received an unchanged cart count (${previousCount} -> ${itemCount}). Report only real merchant cart transitions or restored cart state.`
    );
  }

  if (previousCount === 0 && itemCount === 0) {
    warn(
      'handleCartChange received an empty -> empty transition. Prefer handleCartEmpty() only when the merchant cart actually became empty.'
    );
  }
}

function warnIfMissingPurchaseToken(methodName: string): void {
  if (!hasPurchaseIntentToken()) {
    warn(
      `${methodName} called without a PIT. Ensure the merchant reads PIT and sends order + PIT before cleanup.`
    );
  }
}

function emitIntentCaptured(): void {
  const intentCapturedEvent = {
    hasIIT: true as const,
    timestamp: Date.now(),
  };

  for (const handler of intentCapturedHandlers) {
    try {
      handler(intentCapturedEvent);
    } catch (err) {
      reportInternalError('onIntentCaptured handler error', err);
    }
  }

  emitStateChanged();
}

function bootstrapBrowserRuntime(): void {
  if (browserBootstrapCompleted || !canUseBrowserRuntime()) {
    return;
  }

  browserBootstrapCompleted = true;

  if (autoStart()) {
    emitIntentCaptured();
  }
}

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
 * ```TypeScript
 * const iit = QredexAgent.getInfluenceIntentToken();
 * if (iit) {
 *   console.log('IIT:', iit);
 * }
 * ```
 *
 * @see {@link hasInfluenceIntentToken} - Check if IIT exists
 * @see {@link getPurchaseIntentToken} - Get the PIT token
 */
export function getInfluenceIntentToken(): string | null {
  const config = getConfig();
  return getStoredInfluenceIntentToken({
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
 * ```TypeScript
 * const pit = QredexAgent.getPurchaseIntentToken();
 * if (pit) {
 *   console.log('PIT:', pit);
 *   // Send to backend with order
 * }
 * ```
 *
 * @see {@link hasPurchaseIntentToken} - Check if PIT exists
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
 * if (QredexAgent.hasInfluenceIntentToken()) {
 *   console.log('Intent token available - user came from Qredex link');
 * } else {
 *   console.log('No intent token - regular traffic');
 * }
 * ```
 *
 * @see {@link getInfluenceIntentToken} - Get the IIT token
 * @see {@link hasPurchaseIntentToken} - Check if PIT exists
 */
export const hasInfluenceIntentToken = (): boolean => {
  const config = getConfig();
  return hasStoredInfluenceIntentToken({
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
// STATE INSPECTION
// ============================================

/**
 * Get the current attribution state.
 *
 * Returns a snapshot of the agent's runtime state for debugging and inspection.
 * Useful for wrappers, sandbox/workbench, support, and merchant debugging.
 *
 * @returns Current attribution state object.
 *
 * @example
 * ```TypeScript
 * const state = QredexAgent.getState();
 * console.log('Attribution state:', state);
 *
 * // Example output:
 * // {
 * //   hasIIT: true,
 * //   hasPIT: false,
 * //   iit: 'abc123...',
 * //   pit: null,
 * //   cartState: 'empty',
 * //   locked: false,
 * //   timestamp: 1234567890
 * // }
 * ```
 */
export interface AgentStateSnapshot {
  initialized: boolean;
  lifecycleState: 'idle' | 'running' | 'locking' | 'destroyed';
  lockInProgress: boolean;
  lockAttempts: number;
  hasIIT: boolean;
  hasPIT: boolean;
  iit: string | null;
  pit: string | null;
  cartState: 'unknown' | 'empty' | 'non-empty';
  locked: boolean;
  timestamp: number;
}

export function getState(): AgentStateSnapshot {
  const config = getConfig();
  const runtimeState = getRuntimeState();
  const iit = getStoredInfluenceIntentToken({
    influenceIntentToken: config.influenceIntentToken,
    purchaseIntentToken: config.purchaseIntentToken,
    cookieExpireDays: config.cookieExpireDays,
  });
  const pit = getStoredPurchaseToken({
    influenceIntentToken: config.influenceIntentToken,
    purchaseIntentToken: config.purchaseIntentToken,
    cookieExpireDays: config.cookieExpireDays,
  });

  return {
    initialized: runtimeState.initialized,
    lifecycleState: runtimeState.state,
    lockInProgress: runtimeState.lockInProgress,
    lockAttempts: runtimeState.lockAttempts,
    hasIIT: iit !== null,
    hasPIT: pit !== null,
    iit,
    pit,
    cartState: runtimeState.cartState,
    locked: pit !== null,
    timestamp: Date.now(),
  };
}

/**
 * Emit state changed event to all registered handlers.
 * @internal
 */
function emitStateChanged(): void {
  const state = getState();
  const event = {
    hasIIT: state.hasIIT,
    hasPIT: state.hasPIT,
    locked: state.locked,
    cartState: state.cartState,
    timestamp: state.timestamp,
  };
  for (const handler of stateChangeHandlers) {
    try {
      handler(event);
    } catch (err) {
      reportInternalError('onStateChanged handler error', err);
    }
  }
}

function emitErrorEvent(event: {
  code: AgentErrorCode;
  message: string;
  error: string;
  context?: string;
}): void {
  for (const handler of errorHandlers) {
    try {
      handler(event);
    } catch (err) {
      reportInternalError('onError handler error', err);
    }
  }
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
 * @see {@link clearIntent} - Clear tokens after checkout
 */
export async function lockIntent(meta?: LockMeta): Promise<LockResult> {
  return apiLockIntent(meta);
}

/**
 * Clear intent state from storage.
 *
 * Removes both IIT and PIT from sessionStorage and cookies.
 * Call this after successful checkout or when cart is emptied.
 *
 * @example
 * ```TypeScript
 * // After successful checkout
 * QredexAgent.clearIntent();
 *
 * // When cart is emptied
 * function clearCart() {
 *   cart.clear();
 *   QredexAgent.clearIntent();
 * }
 * ```
 *
 * @see {@link handleCartChange} - Automatically clears on cart empty
 * @see {@link handlePaymentSuccess} - Automatically clears on payment success
 */
function clearAttributionState(reason: ClearReason, timestamp?: number): void {
  const config = getConfig();
  clearAllTokens({
    influenceIntentToken: config.influenceIntentToken,
    purchaseIntentToken: config.purchaseIntentToken,
    cookieExpireDays: config.cookieExpireDays,
  });
  info(`Attribution state cleared (${reason})`);
  debug('Tokens cleared');

  const clearedEvent = {
    reason,
    timestamp: timestamp ?? Date.now(),
  };

  for (const handler of clearedHandlers) {
    try {
      handler(clearedEvent);
    } catch (err) {
      reportInternalError('onCleared handler error', err);
    }
  }

  emitStateChanged();
}

export function clearIntent(): void {
  clearAttributionState('manual_clear');
}

// ============================================
// EVENT HANDLERS (Merchant → Agent)
// ============================================

/**
 * Tell the agent that the cart state changed.
 *
 * This is the **single method** for all cart state changes:
 * - **Locks IIT → PIT** when the merchant reports a non-empty cart, IIT exists, and PIT does not
 * - **Clears tokens** when `itemCount === 0` and PIT is present
 *
 * The agent does not infer merchant attribution policy. Merchants decide when to
 * report cart state and whether to report persisted/restored carts. When a reported
 * cart is non-empty and lockable, the agent attempts the canonical IIT → PIT lock.
 *
 * @param event - Cart change event data
 *
 * @example
 * ```TypeScript
 * // Merchant reports that an empty cart now has one item
 * QredexAgent.handleCartChange({
 *   itemCount: 1,
 *   previousCount: 0,
 * });
 *
 * // Report an already non-empty cart (for example, restored cart state)
 * QredexAgent.handleCartChange({
 *   itemCount: 3,
 *   previousCount: 1,
 * });
 *
 * // Merchant reports that a non-empty cart became empty
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
 * @emits `onLocked` - When IIT is locked to PIT after a reported non-empty cart state
 * @emits `onCleared` - When tokens are cleared (itemCount === 0)
 * @emits `onError` - If lock fails
 *
 * @see {@link lockIntent} - Manual lock operation
 * @see {@link clearIntent} - Manual token clearing
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

  warnIfNotInitialized('handleCartChange');

  // Validate inputs
  if (typeof itemCount !== 'number' || typeof previousCount !== 'number') {
    emitErrorEvent({
      code: 'invalid_cart_counts',
      message: 'itemCount and previousCount must be numbers',
      error: 'itemCount and previousCount must be numbers',
      context: 'handleCartChange',
    });
    return;
  }

  if (itemCount < 0 || previousCount < 0) {
    emitErrorEvent({
      code: 'invalid_cart_counts',
      message: 'itemCount and previousCount must be non-negative',
      error: 'itemCount and previousCount must be non-negative',
      context: 'handleCartChange',
    });
    return;
  }

  warnSuspiciousCartTransition(itemCount, previousCount);
  debug('Cart change event received', event);

  // Update cart state for tracking
  const nextCartState = itemCount > 0 ? 'non-empty' : 'empty';
  const previousCartState = getCartState();
  setCartState(nextCartState);

  if (previousCartState !== nextCartState) {
    emitStateChanged();
  }

  // Lock when cart has items, IIT exists, and PIT doesn't exist
  // This retries on every add-to-cart if lock previously failed (Rule 13)
  if (itemCount > 0 && hasInfluenceIntentToken() && !hasPurchaseIntentToken()) {
    info('Merchant reported a live non-empty cart; attempting IIT -> PIT lock');
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
              reportInternalError('onLocked handler error', err);
            }
          }

          // Emit state changed event
          emitStateChanged();
        } else {
          // Emit error event
          emitErrorEvent({
            code: 'lock_failed',
            message: result.error ?? 'Lock failed',
            error: result.error ?? 'Lock failed',
            context: 'handleCartChange',
          });
        }
      })
      .catch((err) => {
        reportInternalError('handleCartChange lock failed', err);

        emitErrorEvent({
          code: 'lock_request_failed',
          message: err instanceof Error ? err.message : 'Unknown error',
          error: err instanceof Error ? err.message : 'Unknown error',
          context: 'handleCartChange',
        });
      });
  }

  // Clear when the merchant reports that a non-empty cart became empty and PIT exists
  if (itemCount === 0 && previousCount > 0 && hasPurchaseIntentToken()) {
    info('Merchant reported cart empty; clearing IIT/PIT state');
    debug('Cart emptied, clearing tokens');
    clearAttributionState('cart_empty', timestamp);
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
  warnIfNotInitialized('handleCartAdd');

  if (typeof itemCount !== 'number' || itemCount < 0) {
    emitErrorEvent({
      code: 'invalid_cart_counts',
      message: 'itemCount must be a non-negative number',
      error: 'itemCount must be a non-negative number',
      context: 'handleCartAdd',
    });
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
  warnIfNotInitialized('handleCartEmpty');
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

export interface PaymentSuccessEvent {
  timestamp?: number;
  [key: string]: unknown;
}

/**
 * Tell the agent that payment succeeded.
 *
 * Optional explicit post-checkout clear.
 * Most shopping platforms can clear attribution by calling `handleCartEmpty()`
 * when the cart is emptied after checkout. Use this when checkout completes
 * without a cart-empty step that the merchant can report.
 *
 * @param event - Optional event metadata. Only `timestamp` is consumed by the agent.
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
 *   QredexAgent.handlePaymentSuccess();
 * }
 * ```
 *
 * @emits `onCleared` - After tokens are cleared
 *
 * @see {@link clearIntent} - Manual token clearing
 * @see {@link onCleared} - Listen for clear events
 * @see {@link handleCartChange} - Cart state change event
 */
export function handlePaymentSuccess(event?: PaymentSuccessEvent): void {
  warnIfNotInitialized('handlePaymentSuccess');
  warnIfMissingPurchaseToken('handlePaymentSuccess');
  info('Merchant reported payment success; clearing IIT/PIT state');
  debug('Payment success event received', event);
  clearAttributionState('payment_success', event?.timestamp);
}

// ============================================
// EVENT LISTENERS (Agent → Merchant) - Optional
// ============================================

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
 * QredexAgent.onCleared(({ reason, timestamp }) => {
 *   console.log('🗑️ Cleared because', reason);
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
 * QredexAgent.onError(({ code, message, context }) => {
 *   console.error('❌ Error in', context, code, message);
 *   showNotification('Error: ' + message, 'error');
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
// STATE CHANGE EVENTS
// ============================================

/**
 * Listen for attribution state changes.
 *
 * Register a handler that will be called when the agent's attribution state changes.
 * Fires when IIT is captured, PIT is locked, or state is cleared.
 *
 * @param handler - Callback function that receives the state change event data.
 *
 * @example
 * ```TypeScript
 * QredexAgent.onStateChanged(({ hasIIT, hasPIT, locked, cartState }) => {
 *   console.log('State changed:', { hasIIT, hasPIT, locked, cartState });
 *   // Update UI based on attribution state
 * });
 * ```
 *
 * @see {@link offStateChanged} - Unregister the handler
 * @see {@link getState} - Get current state
 */
export function onStateChanged(handler: StateChangeHandler): void {
  stateChangeHandlers.push(handler);
}

/**
 * Listen for IIT capture events.
 *
 * Register a handler that will be called when an Influence Intent Token is captured
 * from the URL or runtime context.
 *
 * @param handler - Callback function that receives the intent captured event data.
 *
 * @example
 * ```TypeScript
 * QredexAgent.onIntentCaptured(({ timestamp }) => {
 *   console.log('✅ Intent captured at:', new Date(timestamp));
 *   // Track attribution capture in analytics
 * });
 * ```
 *
 * @see {@link offIntentCaptured} - Unregister the handler
 */
export function onIntentCaptured(handler: IntentCapturedHandler): void {
  intentCapturedHandlers.push(handler);
}

/**
 * Unregister a state change handler.
 *
 * @param handler - The handler function to remove.
 *
 * @example
 * ```TypeScript
 * const handler = ({ hasPIT }) => console.log('PIT:', hasPIT);
 * QredexAgent.onStateChanged(handler);
 * // ... later
 * QredexAgent.offStateChanged(handler);
 * ```
 *
 * @see {@link onStateChanged} - Register the handler
 */
export function offStateChanged(handler: StateChangeHandler): void {
  const index = stateChangeHandlers.indexOf(handler);
  if (index !== -1) {
    stateChangeHandlers.splice(index, 1);
  }
}

/**
 * Unregister an intent captured handler.
 *
 * @param handler - The handler function to remove.
 *
 * @example
 * ```TypeScript
 * const handler = () => console.log('Intent captured!');
 * QredexAgent.onIntentCaptured(handler);
 * // ... later
 * QredexAgent.offIntentCaptured(handler);
 * ```
 *
 * @see {@link onIntentCaptured} - Register the handler
 */
export function offIntentCaptured(handler: IntentCapturedHandler): void {
  const index = intentCapturedHandlers.indexOf(handler);
  if (index !== -1) {
    intentCapturedHandlers.splice(index, 1);
  }
}

// ============================================
// LIFECYCLE
// ============================================

/**
 * Initialize the Qredex Agent with optional configuration.
 *
 * Usually not needed for the CDN/IIFE bundle, which auto-starts on script load.
 * ESM and framework consumers should call this in the browser before using the agent.
 *
 *
 * @example
 * ```TypeScript
 * QredexAgent.init({
 *   debug: true,
 *   useMockEndpoint: true,
 * });
 * ```
 *
 * @see {@link destroy} - Destroy the agent
 * @see {@link isInitialized} - Check if initialized
 * @param _config
 */
export function init(_config?: AgentConfig): void {
  const cfg = initConfig(_config);
  setDebugMode(cfg.debug);
  markInitialized();
  bootstrapBrowserRuntime();
  debug('Agent initialized');
}

/**
 * Check whether the agent lifecycle has been initialized.
 */
export function isInitialized(): boolean {
  return getRuntimeState().initialized;
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
  stateChangeHandlers.length = 0;
  intentCapturedHandlers.length = 0;
  browserBootstrapCompleted = false;
  destroyState();
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
export type { PreloadAgentConfig } from './bootstrap/config.js';
export type { LockResult, LockMeta } from './api/types.js';

/**
 * Named API surface for ESM consumers and wrapper packages.
 */
export const QredexAgent = {
  // Read/State
  getInfluenceIntentToken,
  getPurchaseIntentToken,
  hasInfluenceIntentToken,
  hasPurchaseIntentToken,
  getState,

  // Commands
  lockIntent,
  clearIntent,

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
  onStateChanged,
  offStateChanged,
  onIntentCaptured,
  offIntentCaptured,

  // Lifecycle
  init,
  isInitialized,
  destroy,
  stop,
};

export default QredexAgent;
