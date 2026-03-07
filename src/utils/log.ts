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
 * Simple logger utility for debug mode.
 * All logs are prefixed with [QredexAgent] for easy filtering.
 */

let debugEnabled = false;

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
  if (!debugEnabled) return;
  console.debug('[QredexAgent]', ...args);
}

/**
 * Log an info message. Always outputs.
 */
export function info(...args: unknown[]): void {
  console.info('[QredexAgent]', ...args);
}

/**
 * Log a warning message. Always outputs.
 */
export function warn(...args: unknown[]): void {
  console.warn('[QredexAgent]', ...args);
}

/**
 * Log an error message. Always outputs.
 */
export function error(...args: unknown[]): void {
  console.error('[QredexAgent]', ...args);
}
