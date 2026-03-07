/**
 * Unit tests for storage utilities.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setCookie, getCookie, removeCookie } from '../../src/storage/cookie.js';
import { setSession, getSession, removeSession, sessionAvailable } from '../../src/storage/session.js';
import {
  storeIntentToken,
  getIntentToken,
  storePurchaseToken,
  getPurchaseToken,
  clearAllTokens,
} from '../../src/storage/tokens.js';

describe('Cookie Storage', () => {
  beforeEach(() => {
    // Clear test cookies
    document.cookie.split(';').forEach((c) => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/');
    });
  });

  it('should set and get a cookie', () => {
    setCookie('test_key', 'test_value', { path: '/' });
    const value = getCookie('test_key');
    expect(value).toBe('test_value');
  });

  it('should return null for non-existent cookie', () => {
    const value = getCookie('nonexistent');
    expect(value).toBeNull();
  });

  it('should remove a cookie', () => {
    setCookie('test_remove', 'value', { path: '/' });
    expect(getCookie('test_remove')).toBe('value');
    removeCookie('test_remove', { path: '/' });
    expect(getCookie('test_remove')).toBeNull();
  });

  it('should handle special characters in values', () => {
    const specialValue = 'hello=world&foo=bar';
    setCookie('special', specialValue, { path: '/' });
    const value = getCookie('special');
    expect(value).toBe(specialValue);
  });
});

describe('Session Storage', () => {
  beforeEach(() => {
    if (sessionAvailable()) {
      sessionStorage.clear();
    }
  });

  it('should detect session storage availability', () => {
    expect(sessionAvailable()).toBe(true);
  });

  it('should set and get a session value', () => {
    setSession('test_key', 'test_value');
    const value = getSession('test_key');
    expect(value).toBe('test_value');
  });

  it('should return null for non-existent session key', () => {
    const value = getSession('nonexistent');
    expect(value).toBeNull();
  });

  it('should remove a session value', () => {
    setSession('test_remove', 'value');
    expect(getSession('test_remove')).toBe('value');
    removeSession('test_remove');
    expect(getSession('test_remove')).toBeNull();
  });
});

describe('Token Storage', () => {
  const testConfig = {
    cookieNameIntent: 'test_intent',
    cookieNamePurchase: 'test_pit',
    storageKeyIntent: 'test_intent_key',
    storageKeyPurchase: 'test_pit_key',
    cookieMaxAge: 86400,
  };

  beforeEach(() => {
    if (sessionAvailable()) {
      sessionStorage.clear();
    }
    document.cookie.split(';').forEach((c) => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/');
    });
  });

  it('should store and retrieve intent token', () => {
    const token = 'test_intent_token_12345';
    storeIntentToken(token, testConfig);

    const retrieved = getIntentToken(testConfig);
    expect(retrieved).toBe(token);
  });

  it('should store and retrieve purchase token', () => {
    const token = 'test_purchase_token_67890';
    storePurchaseToken(token, testConfig);

    const retrieved = getPurchaseToken(testConfig);
    expect(retrieved).toBe(token);
  });

  it('should prefer sessionStorage over cookie for intent token', () => {
    const sessionToken = 'session_token';
    const cookieToken = 'cookie_token';

    setSession(testConfig.influenceIntentToken, sessionToken);
    setCookie(testConfig.influenceIntentToken, cookieToken, { path: '/', maxAge: 86400 });

    const retrieved = getIntentToken(testConfig);
    expect(retrieved).toBe(sessionToken);
  });

  it('should fall back to cookie when sessionStorage is empty', () => {
    const cookieToken = 'cookie_fallback_token';
    setCookie(testConfig.influenceIntentToken, cookieToken, { path: '/', maxAge: 86400 });

    const retrieved = getIntentToken(testConfig);
    expect(retrieved).toBe(cookieToken);
  });

  it('should clear all tokens', () => {
    storeIntentToken('intent_token', testConfig);
    storePurchaseToken('purchase_token', testConfig);

    clearAllTokens(testConfig);

    expect(getIntentToken(testConfig)).toBeNull();
    expect(getPurchaseToken(testConfig)).toBeNull();
  });

  it('should reject invalid tokens', () => {
    storeIntentToken('', testConfig);
    storeIntentToken('short', testConfig);

    expect(getIntentToken(testConfig)).toBeNull();
  });
});
