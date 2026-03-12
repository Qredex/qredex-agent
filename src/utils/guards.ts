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
 * Type guard utilities for runtime type checking.
 */

/**
 * Check if a value is a non-null object.
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if a value is a non-empty string.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Check if a value is a valid URL string.
 */
export function isValidUrl(value: unknown): boolean {
  if (!isNonEmptyString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a value is a function.
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * Check if storage is available (sessionStorage or localStorage).
 */
export function isStorageAvailable(type: 'sessionStorage' | 'localStorage'): boolean {
  try {
    const storage = window[type];
    const testKey = '__qredex_test__';
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if cookies are enabled in the browser.
 */
export function areCookiesEnabled(): boolean {
  try {
    document.cookie = '__qredex_test__=1; SameSite=Strict; path=/';
    const enabled = document.cookie.includes('__qredex_test__=1');
    if (enabled) {
      document.cookie = '__qredex_test__=1; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    }
    return enabled;
  } catch {
    return false;
  }
}

/**
 * Check if a value is a valid token (non-empty string, reasonable length).
 */
export function isValidToken(value: unknown): boolean {
  if (!isNonEmptyString(value)) return false;
  // Tokens should be at least 8 chars and not excessively long
  return value.length >= 8 && value.length <= 2048;
}

/**
 * Safe JSON parse that returns null on failure.
 */
export function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
