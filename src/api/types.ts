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
 *  Licensed under the Apache License, Version 2.0. See LICENSE for the full license text.
 *  You may not use this file except in compliance with that License.
 *  Unless required by applicable law or agreed to in writing, software distributed under the
 *  License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 *  either express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
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
