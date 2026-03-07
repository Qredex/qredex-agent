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
 * Click-based add-to-cart detection.
 * Listens for clicks on elements that look like add-to-cart buttons.
 */

import { debug } from '../utils/log.js';
import { isAddToCartElement } from '../utils/dom.js';
import { emitAddToCart } from './pipeline.js';
import type { AddToCartMeta } from './types.js';

let clickListenerAttached = false;

/**
 * Extract product information from the page context.
 */
function extractProductInfo(element: Element): Partial<AddToCartMeta> {
  const meta: Partial<AddToCartMeta> = {};

  // Try to find product ID from data attributes
  const productId =
    element.getAttribute('data-product-id') ||
    element.getAttribute('data-product') ||
    element.getAttribute('data-id') ||
    element.closest('[data-product-id]')?.getAttribute('data-product-id') ||
    element.closest('[data-product]')?.getAttribute('data-product') ||
    element.closest('[data-id]')?.getAttribute('data-id');

  if (productId) {
    meta.productId = productId;
  }

  // Try to find product name
  const productName =
    element.getAttribute('data-product-name') ||
    element.closest('[data-product-name]')?.getAttribute('data-product-name') ||
    document.querySelector('[data-product-name]')?.getAttribute('data-product-name') ||
    document.querySelector('h1')?.textContent?.trim() ||
    document.querySelector('.product-name')?.textContent?.trim() ||
    document.querySelector('.product-title')?.textContent?.trim();

  if (productName) {
    meta.productName = productName;
  }

  // Try to find quantity
  const quantityInput =
    (element.querySelector('input[name="quantity"]') as HTMLInputElement | null) ||
    (element.querySelector('input[name="qty"]') as HTMLInputElement | null) ||
    (document.querySelector('input[name="quantity"]') as HTMLInputElement | null) ||
    (document.querySelector('input[name="qty"]') as HTMLInputElement | null);

  if (quantityInput) {
    const qty = parseInt(quantityInput.value, 10);
    if (!isNaN(qty) && qty > 0) {
      meta.quantity = qty;
    }
  }

  // Try to find price
  const priceAttr =
    element.getAttribute('data-price') ||
    element.closest('[data-price]')?.getAttribute('data-price');

  if (priceAttr) {
    const price = parseFloat(priceAttr);
    if (!isNaN(price)) {
      meta.price = price;
    }
  }

  return meta;
}

/**
 * Handle click events and detect add-to-cart actions.
 */
function handleClick(event: MouseEvent): void {
  const target = event.target as Element | null;

  if (!target) return;

  // Check if the clicked element (or its ancestor) looks like an add-to-cart button
  const cartElement = isAddToCartElement(target)
    ? target
    : target.parentElement
      ? Array.from(target.parentElement.querySelectorAll('*')).find(isAddToCartElement) || null
      : null;

  if (cartElement) {
    debug('Add-to-cart click detected');

    const meta: AddToCartMeta = {
      ...extractProductInfo(cartElement),
      element: cartElement,
      event,
    };

    emitAddToCart({
      timestamp: Date.now(),
      source: 'click',
      meta,
    });
  }
}

/**
 * Enable click-based add-to-cart detection.
 */
export function enableClickDetection(): void {
  if (clickListenerAttached) {
    return;
  }

  document.addEventListener('click', handleClick, { capture: true });
  clickListenerAttached = true;

  debug('Click detection enabled');
}

/**
 * Disable click-based add-to-cart detection.
 */
export function disableClickDetection(): void {
  if (!clickListenerAttached) {
    return;
  }

  document.removeEventListener('click', handleClick, { capture: true });
  clickListenerAttached = false;

  debug('Click detection disabled');
}

/**
 * Check if click detection is currently enabled.
 */
export function isClickDetectionEnabled(): boolean {
  return clickListenerAttached;
}
