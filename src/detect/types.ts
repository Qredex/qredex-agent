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
 * Type definitions for add-to-cart detection.
 */

/**
 * Metadata that can be passed with add-to-cart events.
 */
export interface AddToCartMeta {
  /** Product ID if available */
  productId?: string;

  /** Product name if available */
  productName?: string;

  /** Quantity being added */
  quantity?: number;

  /** Price if available */
  price?: number;

  /** The element that triggered the event */
  element?: Element;

  /** The event that triggered the event */
  event?: Event;

  /** Additional custom data */
  [key: string]: unknown;
}

/**
 * Add-to-cart event payload.
 */
export interface AddToCartEvent {
  /** Timestamp of the event */
  timestamp: number;

  /** Source of the detection (click, form, manual) */
  source: 'click' | 'form' | 'manual';

  /** Metadata about the event */
  meta: AddToCartMeta;
}

/**
 * Handler function for add-to-cart events.
 */
export type AddToCartHandler = (event: AddToCartEvent) => void | Promise<void>;
