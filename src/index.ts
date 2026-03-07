/**
 * Qredex Agent - Browser library for intent capture and locking.
 *
 * A lightweight, framework-agnostic browser agent that:
 * - Captures qdx_intent tokens from URLs
 * - Persists tokens in sessionStorage and cookies
 * - Detects add-to-cart actions
 * - Automatically locks intent through Qredex's API
 */

import { setDebugMode } from './utils/log.js';
import { getConfig } from './bootstrap/config.js';
import { autoStart } from './bootstrap/auto-start.js';
import {
  init as initLifecycle,
  destroy as destroyLifecycle,
  isInitialized as isLifecycleInitialized,
  getStatus as getLifecycleStatus,
} from './core/lifecycle.js';
import {
  getIntentToken as getStoredIntentToken,
  getPurchaseToken as getStoredPurchaseToken,
  hasIntentToken as hasStoredIntentToken,
  hasPurchaseToken as hasStoredPurchaseToken,
} from './storage/tokens.js';
import { lockIntent as apiLockIntent } from './api/lock.js';
import { triggerAddToCart } from './detect/manual.js';
import {
  onAddToCart as registerAddToCart,
  offAddToCart as unregisterAddToCart,
  enableDetection as enableAutoDetection,
  disableDetection as disableAutoDetection,
} from './detect/pipeline.js';
import { initPipeline } from './detect/pipeline.js';

import type { AgentConfig } from './bootstrap/config.js';
import type { AddToCartMeta, AddToCartHandler } from './detect/types.js';
import type { LockResult } from './api/types.js';

// Initialize the pipeline on module load
initPipeline();

// Auto-start: capture intent token from URL immediately
autoStart();

/**
 * Initialize the Qredex Agent with optional configuration.
 * This can be called manually, but auto-start handles basic initialization.
 *
 * @param config - Optional configuration overrides
 */
export function init(config?: AgentConfig): void {
  initLifecycle(config);

  // Apply debug mode if enabled
  const cfg = getConfig();
  setDebugMode(cfg.debug);
}

/**
 * Get the current intent token (IIT).
 * Checks sessionStorage first, then falls back to cookie.
 *
 * @returns The intent token or null if not found
 */
export function getIntentToken(): string | null {
  const config = getConfig();
  return getStoredIntentToken({
    cookieNameIntent: config.cookieNameIntent,
    cookieNamePurchase: config.cookieNamePurchase,
    storageKeyIntent: config.storageKeyIntent,
    storageKeyPurchase: config.storageKeyPurchase,
    cookieMaxAge: config.cookieMaxAge,
  });
}

/**
 * Get the current purchase intent token (PIT).
 * Checks sessionStorage first, then falls back to cookie.
 *
 * @returns The purchase token or null if not found
 */
export function getPurchaseIntentToken(): string | null {
  const config = getConfig();
  return getStoredPurchaseToken({
    cookieNameIntent: config.cookieNameIntent,
    cookieNamePurchase: config.cookieNamePurchase,
    storageKeyIntent: config.storageKeyIntent,
    storageKeyPurchase: config.storageKeyPurchase,
    cookieMaxAge: config.cookieMaxAge,
  });
}

/**
 * Check if an intent token (IIT) exists.
 *
 * @returns true if an intent token is available, false otherwise
 */
export function hasIntentToken(): boolean {
  const config = getConfig();
  return hasStoredIntentToken({
    cookieNameIntent: config.cookieNameIntent,
    cookieNamePurchase: config.cookieNamePurchase,
    storageKeyIntent: config.storageKeyIntent,
    storageKeyPurchase: config.storageKeyPurchase,
    cookieMaxAge: config.cookieMaxAge,
  });
}

/**
 * Check if a purchase intent token (PIT) exists.
 *
 * @returns true if a purchase token is available, false otherwise
 */
export function hasPurchaseIntentToken(): boolean {
  const config = getConfig();
  return hasStoredPurchaseToken({
    cookieNameIntent: config.cookieNameIntent,
    cookieNamePurchase: config.cookieNamePurchase,
    storageKeyIntent: config.storageKeyIntent,
    storageKeyPurchase: config.storageKeyPurchase,
    cookieMaxAge: config.cookieMaxAge,
  });
}

/**
 * Manually trigger a lock request.
 * This exchanges the IIT for a PIT.
 *
 * @param meta - Optional metadata to include with the lock request
 * @returns Promise resolving to the lock result
 */
export async function lockIntent(meta?: Record<string, unknown>): Promise<LockResult> {
  return apiLockIntent(meta);
}

/**
 * Manually trigger an add-to-cart event.
 * This is a first-class public API for explicit integration.
 *
 * @param meta - Optional metadata about the add-to-cart action
 */
export function handleAddToCart(meta?: AddToCartMeta): void {
  triggerAddToCart(meta);
}

/**
 * Register a handler for add-to-cart events.
 *
 * @param handler - The handler function to call when add-to-cart is detected
 */
export function onAddToCart(handler: AddToCartHandler): void {
  registerAddToCart(handler);
}

/**
 * Unregister an add-to-cart event handler.
 *
 * @param handler - The handler function to remove
 */
export function offAddToCart(handler: AddToCartHandler): void {
  unregisterAddToCart(handler);
}

/**
 * Enable automatic add-to-cart detection.
 */
export function enableDetection(): void {
  enableAutoDetection();
}

/**
 * Disable automatic add-to-cart detection.
 */
export function disableDetection(): void {
  disableAutoDetection();
}

/**
 * Destroy the agent and clean up all resources.
 * This removes event listeners and resets state.
 */
export function destroy(): void {
  destroyLifecycle();
}

/**
 * Check if the agent is currently initialized and running.
 */
export function isInitialized(): boolean {
  return isLifecycleInitialized();
}

/**
 * Get the current status of the agent.
 */
export function getStatus(): {
  initialized: boolean;
  running: boolean;
  destroyed: boolean;
} {
  return getLifecycleStatus();
}

/**
 * Export types for TypeScript consumers.
 */
export type { AgentConfig } from './bootstrap/config.js';
export type { AddToCartMeta, AddToCartHandler, AddToCartEvent } from './detect/types.js';
export type { LockResult, LockRequest, LockResponse } from './api/types.js';

// Attach to window for IIFE/browser usage
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).QredexAgent = {
    init,
    getIntentToken,
    getPurchaseIntentToken,
    hasIntentToken,
    hasPurchaseIntentToken,
    lockIntent,
    handleAddToCart,
    onAddToCart,
    offAddToCart,
    enableDetection,
    disableDetection,
    destroy,
    isInitialized,
    getStatus,
  };
}
