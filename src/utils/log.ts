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
 * Simple logger utility for debug mode.
 * All logs are prefixed with [QredexAgent] for easy filtering.
 */

let debugEnabled = false;

export interface LogPolicy {
  debug: boolean;
  info: boolean;
  warn: boolean;
  error: boolean;
}

export function getLogPolicy(environment: 'development' | 'staging' | 'production' | 'test', enabled: boolean): LogPolicy {
  return {
    debug: environment !== 'production' && enabled,
    info: environment !== 'production' && enabled,
    warn: environment !== 'production',
    error: true,
  };
}

function getCurrentLogPolicy(): LogPolicy {
  return getLogPolicy(__QDX_ENV__, debugEnabled);
}

/**
 * Enable or disable debug logging.
 */
export function setDebugMode(enabled: boolean): void {
  debugEnabled = enabled;
}

/**
 * Log a debug message. Only outputs if debug mode is enabled.
 */
export function debug(...args: unknown[]): void {
  if (!getCurrentLogPolicy().debug) return;
  if (typeof console === 'undefined') return;
  console.debug('[QredexAgent]', ...args);
}

/**
 * Log an info message. Always outputs if console exists.
 */
export function info(...args: unknown[]): void {
  if (!getCurrentLogPolicy().info) return;
  if (typeof console === 'undefined') return;
  console.info('[QredexAgent]', ...args);
}

/**
 * Log a warning message. Always outputs if console exists.
 */
export function warn(...args: unknown[]): void {
  if (!getCurrentLogPolicy().warn) return;
  if (typeof console === 'undefined') return;
  console.warn('[QredexAgent]', ...args);
}

/**
 * Log an error message. Always outputs if console exists.
 */
export function error(...args: unknown[]): void {
  if (!getCurrentLogPolicy().error) return;
  if (typeof console === 'undefined') return;
  console.error('[QredexAgent]', ...args);
}
