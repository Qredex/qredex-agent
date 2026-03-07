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
 * Manual add-to-cart trigger API.
 * Provides a first-class public method for explicit add-to-cart signaling.
 */

import { debug, warn } from '../utils/log.js';
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
  })
    .then((r) => {
      debug('Add-to-cart event handled', r);
    })
    .catch((err) => {
      warn('Error handling add-to-cart event', err);
    });
}

/**
 * Alias for triggerAddToCart for convenience.
 */
export const handleAddToCart = triggerAddToCart;
