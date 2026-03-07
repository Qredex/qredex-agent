/**
 * Centralized add-to-cart detection pipeline.
 * All detection methods flow through this pipeline, which decides whether locking should happen.
 */

import { debug, info } from '../utils/log.js';
import { getConfig } from '../bootstrap/config.js';
import { getIntentToken, hasPurchaseToken, storePurchaseToken } from '../storage/tokens.js';
import { isLockInProgress, registerCleanup } from '../core/state.js';
import { lockIntent } from '../api/lock.js';
import type { AddToCartEvent, AddToCartHandler } from './types.js';
import { enableClickDetection, disableClickDetection } from './click.js';
import { enableFormDetection, disableFormDetection } from './form.js';

const handlers: AddToCartHandler[] = [];
let detectionEnabled = false;

/**
 * Register a handler for add-to-cart events.
 */
export function onAddToCart(handler: AddToCartHandler): void {
  handlers.push(handler);
  debug('Add-to-cart handler registered');
}

/**
 * Unregister a handler for add-to-cart events.
 */
export function offAddToCart(handler: AddToCartHandler): void {
  const index = handlers.indexOf(handler);
  if (index !== -1) {
    handlers.splice(index, 1);
    debug('Add-to-cart handler unregistered');
  }
}

/**
 * Emit an add-to-cart event through the pipeline.
 * This is called by all detection methods.
 */
export async function emitAddToCart(event: AddToCartEvent): Promise<void> {
  debug('Add-to-cart event emitted:', event.source);

  // Call all registered handlers
  for (const handler of handlers) {
    try {
      await handler(event);
    } catch (err) {
      console.error('[QredexAgent] Handler error:', err);
    }
  }

  // Attempt to lock intent if conditions are met
  await tryLockIntent();
}

/**
 * Check if conditions are met for locking intent.
 */
function shouldAttemptLock(): boolean {
  // Check if lock is already in progress
  if (isLockInProgress()) {
    debug('Lock in progress, skipping');
    return false;
  }

  // Check if IIT exists
  const config = getConfig();
  const intentToken = getIntentToken({
    cookieNameIntent: config.cookieNameIntent,
    cookieNamePurchase: config.cookieNamePurchase,
    storageKeyInfluence: config.storageKeyInfluence,
    storageKeyPurchase: config.storageKeyPurchase,
    cookieMaxAge: config.cookieMaxAge,
  });

  if (!intentToken) {
    debug('No intent token, skipping lock');
    return false;
  }

  // Check if PIT already exists
  if (
    hasPurchaseToken({
      cookieNameIntent: config.cookieNameIntent,
      cookieNamePurchase: config.cookieNamePurchase,
      storageKeyInfluence: config.storageKeyInfluence,
      storageKeyPurchase: config.storageKeyPurchase,
      cookieMaxAge: config.cookieMaxAge,
    })
  ) {
    debug('Purchase token already exists, skipping lock');
    return false;
  }

  return true;
}

/**
 * Attempt to lock intent if conditions are met.
 */
async function tryLockIntent(): Promise<void> {
  if (!shouldAttemptLock()) {
    return;
  }

  const config = getConfig();

  try {
    info('Attempting to lock intent...');

    const response = await lockIntent();

    if (response.success && response.purchaseToken) {
      // Store the purchase token (also done in lockIntent, but double-check)
      storePurchaseToken(response.purchaseToken, {
        cookieNameIntent: config.cookieNameIntent,
        cookieNamePurchase: config.cookieNamePurchase,
        storageKeyInfluence: config.storageKeyInfluence,
        storageKeyPurchase: config.storageKeyPurchase,
        cookieMaxAge: config.cookieMaxAge,
      });

      if (response.alreadyLocked) {
        info('Intent was already locked');
      } else {
        info('Intent locked successfully');
      }
    } else {
      console.warn('[QredexAgent] Lock request failed:', response.error);
    }
  } catch (err) {
    console.error('[QredexAgent] Lock request error:', err);
  }
}

/**
 * Enable all detection methods.
 */
export function enableDetection(): void {
  if (detectionEnabled) {
    return;
  }

  enableClickDetection();
  enableFormDetection();

  detectionEnabled = true;
  info('Add-to-cart detection enabled');
}

/**
 * Disable all detection methods.
 */
export function disableDetection(): void {
  if (!detectionEnabled) {
    return;
  }

  disableClickDetection();
  disableFormDetection();

  detectionEnabled = false;
  debug('Add-to-cart detection disabled');
}

/**
 * Check if detection is currently enabled.
 */
export function isDetectionEnabled(): boolean {
  return detectionEnabled;
}

/**
 * Initialize the pipeline and register cleanup.
 */
export function initPipeline(): void {
  registerCleanup(() => {
    disableDetection();
    handlers.length = 0;
  });
}
