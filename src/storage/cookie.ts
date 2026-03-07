/**
 * Cookie storage utilities with defensive error handling.
 */

import { debug, warn } from '../utils/log.js';

export interface CookieOptions {
  expires?: Date;
  maxAge?: number;
  domain?: string;
  path?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

/**
 * Set a cookie with the given name and value.
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  try {
    const { expires, maxAge, domain, path = '/', secure = false, sameSite = 'Strict' } = options;

    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (expires) {
      cookieString += `; expires=${expires.toUTCString()}`;
    }

    if (maxAge !== undefined) {
      cookieString += `; max-age=${maxAge}`;
    }

    if (domain) {
      cookieString += `; domain=${domain}`;
    }

    cookieString += `; path=${path}`;

    if (secure) {
      cookieString += '; secure';
    }

    cookieString += `; samesite=${sameSite}`;

    document.cookie = cookieString;
    debug('Cookie set:', name);
  } catch (err) {
    warn('Failed to set cookie:', name, err);
  }
}

/**
 * Get a cookie value by name.
 */
export function getCookie(name: string): string | null {
  try {
    const nameEq = `${encodeURIComponent(name)}=`;
    const cookies = document.cookie.split(';');

    for (const cookie of cookies) {
      const trimmed = cookie.trim();
      if (trimmed.indexOf(nameEq) === 0) {
        const value = trimmed.substring(nameEq.length);
        return decodeURIComponent(value);
      }
    }

    return null;
  } catch (err) {
    warn('Failed to get cookie:', name, err);
    return null;
  }
}

/**
 * Remove a cookie by name.
 */
export function removeCookie(
  name: string,
  options: Pick<CookieOptions, 'domain' | 'path'> = {}
): void {
  try {
    const { domain, path = '/' } = options;
    let cookieString = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    cookieString += `; path=${path}`;

    if (domain) {
      cookieString += `; domain=${domain}`;
    }

    document.cookie = cookieString;
    debug('Cookie removed:', name);
  } catch (err) {
    warn('Failed to remove cookie:', name, err);
  }
}

/**
 * Check if cookies are available (basic check).
 */
export function cookiesAvailable(): boolean {
  try {
    const testKey = '__qredex_cookie_test__';
    const testValue = '1';
    setCookie(testKey, testValue, { maxAge: 60 });
    const retrieved = getCookie(testKey);
    if (retrieved === testValue) {
      removeCookie(testKey);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
