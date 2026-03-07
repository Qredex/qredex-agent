/**
 * Manual add-to-cart trigger API.
 * Provides a first-class public method for explicit add-to-cart signaling.
 */

import { debug } from '../utils/log.js';
import { emitAddToCart } from './pipeline.js';
import type { AddToCartMeta } from './types.js';

/**
 * Manually trigger an add-to-cart event.
 * This is a first-class public API for explicit integration.
 *
 * @param meta - Optional metadata about the add-to-cart action
 */
export function triggerAddToCart(meta: AddToCartMeta = {}): void {
  debug('Manual add-to-cart triggered');

  emitAddToCart({
    timestamp: Date.now(),
    source: 'manual',
    meta,
  });
}

/**
 * Alias for triggerAddToCart for convenience.
 */
export const handleAddToCart = triggerAddToCart;
