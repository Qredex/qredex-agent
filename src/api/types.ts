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
 * Type definitions for API requests and responses.
 */

/**
 * Request payload for the lock endpoint.
 */
export interface LockRequest {
  /** The intent token (IIT) to lock */
  token: string;

  /** Optional metadata to include with the lock request */
  meta?: Record<string, unknown>;
}

/**
 * Response from the lock endpoint.
 */
export interface LockResponse {
  /** The purchase intent token (PIT) */
  token: string;

  /** Token expiration timestamp (ISO 8601) */
  expires_at: string;

  /** Token lock timestamp (ISO 8601) */
  locked_at: string;
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

/**
 * Metadata for lock request.
 */
export type LockMeta = Record<string, unknown>;
