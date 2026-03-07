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
 * SessionStorage utilities with defensive error handling.
 */

import { debug, warn } from '../utils/log.js';
import { isStorageAvailable } from '../utils/guards.js';

/**
 * Check if sessionStorage is available.
 */
export function sessionAvailable(): boolean {
  return isStorageAvailable('sessionStorage');
}

/**
 * Set a value in sessionStorage with the given key.
 */
export function setSession(key: string, value: string): void {
  if (!sessionAvailable()) {
    warn('sessionStorage not available');
    return;
  }

  try {
    sessionStorage.setItem(key, value);
    debug('SessionStorage set:', key);
  } catch (err) {
    warn('Failed to set sessionStorage:', key, err);
  }
}

/**
 * Get a value from sessionStorage by key.
 */
export function getSession(key: string): string | null {
  if (!sessionAvailable()) {
    return null;
  }

  try {
    const value = sessionStorage.getItem(key);
    return value;
  } catch (err) {
    warn('Failed to get sessionStorage:', key, err);
    return null;
  }
}

/**
 * Remove a value from sessionStorage by key.
 */
export function removeSession(key: string): void {
  if (!sessionAvailable()) {
    return;
  }

  try {
    sessionStorage.removeItem(key);
    debug('SessionStorage removed:', key);
  } catch (err) {
    warn('Failed to remove sessionStorage:', key, err);
  }
}

/**
 * Get all qredex-prefixed keys from sessionStorage.
 */
export function getAllSessionKeys(): string[] {
  if (!sessionAvailable()) {
    return [];
  }

  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('__qdx_')) {
        keys.push(key);
      }
    }
    return keys;
  } catch (err) {
    warn('Failed to get sessionStorage keys', err);
    return [];
  }
}

/**
 * Clear all qredex-prefixed values from sessionStorage.
 */
export function clearQredexSession(): void {
  if (!sessionAvailable()) {
    return;
  }

  try {
    const keys = getAllSessionKeys();
    for (const key of keys) {
      sessionStorage.removeItem(key);
    }
    debug('Cleared all qredex sessionStorage');
  } catch (err) {
    warn('Failed to clear sessionStorage', err);
  }
}
