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
 * Form-based add-to-cart detection.
 * Listens for form submissions that look like add-to-cart actions.
 */

import { debug } from '../utils/log.js';
import { getFormFromTarget, isAddToCartElement } from '../utils/dom.js';
import { emitAddToCart } from './pipeline.js';
import type { AddToCartMeta } from './types.js';

let formListenerAttached = false;

/**
 * Check if a form looks like an add-to-cart form.
 */
function isAddToCartForm(form: HTMLFormElement): boolean {
  // Check form action
  const action = (form.action || '').toLowerCase();
  if (action.includes('cart') || action.includes('add')) {
    return true;
  }

  // Check form ID or class
  const formId = form.id.toLowerCase();
  const formClass = form.className.toLowerCase();
  if (
    formId.includes('cart') ||
    formId.includes('add') ||
    formClass.includes('cart') ||
    formClass.includes('add')
  ) {
    return true;
  }

  // Check for add-to-cart submit button
  const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
  if (submitButton && isAddToCartElement(submitButton)) {
    return true;
  }

  // Check for add-to-cart hidden input
  const actionInput = form.querySelector(
    'input[name="action"], input[name="type"]'
  ) as HTMLInputElement | null;
  if (actionInput) {
    const value = actionInput.value.toLowerCase();
    if (value.includes('add') || value.includes('cart')) {
      return true;
    }
  }

  return false;
}

/**
 * Extract product information from a form.
 */
function extractFormInfo(form: HTMLFormElement): Partial<AddToCartMeta> {
  const meta: Partial<AddToCartMeta> = {};

  // Try to find product ID
  const productIdInput =
    form.querySelector('input[name="product_id"]') ||
    form.querySelector('input[name="productId"]') ||
    form.querySelector('input[name="product"]') ||
    form.querySelector('input[name="id"]') ||
    form.querySelector('input[name="variant_id"]') ||
    form.querySelector('input[name="variantId"]');

  if (productIdInput && productIdInput instanceof HTMLInputElement) {
    meta.productId = productIdInput.value;
  }

  // Try to find quantity
  const quantityInput =
    form.querySelector('input[name="quantity"]') ||
    form.querySelector('input[name="qty"]') ||
    form.querySelector('select[name="quantity"]') ||
    form.querySelector('select[name="qty"]');

  if (quantityInput && quantityInput instanceof HTMLInputElement) {
    const qty = parseInt(quantityInput.value, 10);
    if (!isNaN(qty) && qty > 0) {
      meta.quantity = qty;
    }
  } else if (quantityInput && quantityInput instanceof HTMLSelectElement) {
    const qty = parseInt(quantityInput.value, 10);
    if (!isNaN(qty) && qty > 0) {
      meta.quantity = qty;
    }
  }

  // Try to find price
  const priceInput = form.querySelector('input[name="price"]') as HTMLInputElement | null;
  if (priceInput) {
    const price = parseFloat(priceInput.value);
    if (!isNaN(price)) {
      meta.price = price;
    }
  }

  return meta;
}

/**
 * Handle form submit events and detect add-to-cart actions.
 */
function handleSubmit(event: SubmitEvent): void {
  const form = getFormFromTarget(event.target);

  if (!form) return;

  // Check if this form looks like an add-to-cart form
  if (isAddToCartForm(form)) {
    debug('Add-to-cart form submission detected');

    const meta: AddToCartMeta = {
      ...extractFormInfo(form),
      element: form,
      event,
    };

    emitAddToCart({
      timestamp: Date.now(),
      source: 'form',
      meta,
    });
  }
}

/**
 * Enable form-based add-to-cart detection.
 */
export function enableFormDetection(): void {
  if (formListenerAttached) {
    return;
  }

  document.addEventListener('submit', handleSubmit, { capture: true });
  formListenerAttached = true;

  debug('Form detection enabled');
}

/**
 * Disable form-based add-to-cart detection.
 */
export function disableFormDetection(): void {
  if (!formListenerAttached) {
    return;
  }

  document.removeEventListener('submit', handleSubmit, { capture: true });
  formListenerAttached = false;

  debug('Form detection disabled');
}

/**
 * Check if form detection is currently enabled.
 */
export function isFormDetectionEnabled(): boolean {
  return formListenerAttached;
}
