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
 * Type definitions for API requests and responses.
 */

/**
 * Request payload for the lock endpoint.
 */
export interface LockRequest {
  /** The intent token (IIT) to lock */
  intent_token: string;

  /** Optional metadata about the lock request */
  meta?: {
    /** Product ID if available */
    product_id?: string;

    /** Product name if available */
    product_name?: string;

    /** Quantity if available */
    quantity?: number;

    /** Price if available */
    price?: number;

    /** User agent */
    user_agent?: string;

    /** Referrer URL */
    referrer?: string;

    /** Current page URL */
    url?: string;

    /** Additional custom fields */
    [key: string]: unknown;
  };
}

/**
 * Response from the lock endpoint.
 */
export interface LockResponse {
  /** Whether the lock was successful */
  success: boolean;

  /** The purchase intent token (PIT) if successful */
  purchase_token?: string;

  /** Whether the intent was already locked (idempotent response) */
  already_locked?: boolean;

  /** Error message if failed */
  error?: string;

  /** Additional response data */
  [key: string]: unknown;
}

/**
 * Result of a lock operation.
 */
export interface LockResult {
  /** Whether the lock was successful */
  success: boolean;

  /** The purchase intent token if successful */
  purchaseToken: string | null;

  /** Whether the intent was already locked (idempotent response) */
  alreadyLocked: boolean;

  /** Error message if failed */
  error?: string;
}
