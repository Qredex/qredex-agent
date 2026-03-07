/**
 * Unit tests for config pre-load and token helpers.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  initConfig,
  getConfig,
  getConfigValue,
  resetConfig,
  isConfigInitialized,
} from '../../src/bootstrap/config.js';
import {
  hasIntentToken,
  hasPurchaseToken,
  storeIntentToken,
  storePurchaseToken,
  clearAllTokens,
} from '../../src/storage/tokens.js';

describe('Config Pre-load', () => {
  beforeEach(() => {
    // Clear pre-load config
    delete (window as Record<string, unknown>).QredexAgentConfig;
    resetConfig();
  });

  afterEach(() => {
    delete (window as Record<string, unknown>).QredexAgentConfig;
    resetConfig();
  });

  it('should use default config when no pre-load config', () => {
    const config = getConfig();

    expect(config.lockEndpoint).toBe('https://api.qredex.com/api/v1/agent/intents/lock');
    expect(config.debug).toBe(false);
    expect(config.autoDetect).toBe(true);
  });

  it('should respect pre-load global config', () => {
    // Set pre-load config
    (window as Record<string, unknown>).QredexAgentConfig = {
      debug: true,
      lockEndpoint: 'https://custom.api.com/lock',
      autoDetect: false,
    };

    // Access config (should auto-initialize from pre-load)
    const config = getConfig();

    expect(config.debug).toBe(true);
    expect(config.lockEndpoint).toBe('https://custom.api.com/lock');
    expect(config.autoDetect).toBe(false);
  });

  it('should merge pre-load config with programmatic config', () => {
    // Set pre-load config
    (window as Record<string, unknown>).QredexAgentConfig = {
      debug: true,
    };

    // Initialize with additional config
    initConfig({
      lockEndpoint: 'https://programmatic.api.com/lock',
    });

    const config = getConfig();

    // Pre-load takes precedence for debug
    expect(config.debug).toBe(true);
    // Programmatic config is applied
    expect(config.lockEndpoint).toBe('https://programmatic.api.com/lock');
  });

  it('should validate pre-load config values', () => {
    // Set invalid pre-load config
    (window as Record<string, unknown>).QredexAgentConfig = {
      lockEndpoint: 'not-a-valid-url',
      debug: true,
    };

    const config = getConfig();

    // Invalid URL should fall back to default
    expect(config.lockEndpoint).toBe('https://api.qredex.com/api/v1/agent/intents/lock');
    // Valid values should be applied
    expect(config.debug).toBe(true);
  });

  it('should track initialization state', () => {
    expect(isConfigInitialized()).toBe(false);

    // Access config to trigger auto-initialization from pre-load
    (window as Record<string, unknown>).QredexAgentConfig = { debug: true };
    getConfig();

    expect(isConfigInitialized()).toBe(true);
  });
});

describe('Token Helpers', () => {
  const testConfig = {
    influenceIntentToken: 'test_intent',
    purchaseIntentToken: 'test_pit',
    cookieExpireDays: 30,
  };

  beforeEach(() => {
    clearAllTokens(testConfig);
  });

  describe('hasIntentToken', () => {
    it('should return false when no token exists', () => {
      expect(hasIntentToken(testConfig)).toBe(false);
    });

    it('should return true when token exists in sessionStorage', () => {
      storeIntentToken('test_iit_12345', testConfig);
      expect(hasIntentToken(testConfig)).toBe(true);
    });

    it('should return true when token exists in cookie', () => {
      // Clear sessionStorage to force cookie fallback
      sessionStorage.clear();

      // Directly set cookie (storeIntentToken sets both)
      document.cookie = `${testConfig.influenceIntentToken}=test_iit_cookie; path=/; max-age=86400`;

      expect(hasIntentToken(testConfig)).toBe(true);
    });

    it('should return false for invalid tokens', () => {
      // Too short
      storeIntentToken('short', testConfig);
      expect(hasIntentToken(testConfig)).toBe(false);
    });
  });

  describe('hasPurchaseToken', () => {
    it('should return false when no token exists', () => {
      expect(hasPurchaseToken(testConfig)).toBe(false);
    });

    it('should return true when token exists in sessionStorage', () => {
      storePurchaseToken('test_pit_12345', testConfig);
      expect(hasPurchaseToken(testConfig)).toBe(true);
    });

    it('should return true when token exists in cookie', () => {
      // Clear sessionStorage to force cookie fallback
      sessionStorage.clear();

      // Directly set cookie
      document.cookie = `${testConfig.purchaseIntentToken}=test_pit_cookie; path=/; max-age=86400`;

      expect(hasPurchaseToken(testConfig)).toBe(true);
    });

    it('should return false for invalid tokens', () => {
      storePurchaseToken('short', testConfig);
      expect(hasPurchaseToken(testConfig)).toBe(false);
    });
  });
});
