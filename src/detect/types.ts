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
