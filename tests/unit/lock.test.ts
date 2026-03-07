/**
 * Unit tests for lock API and idempotency.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { lockIntent } from '../../src/api/lock.js';
import { storeIntentToken, storePurchaseToken, clearAllTokens } from '../../src/storage/tokens.js';
import { initConfig, resetConfig } from '../../src/bootstrap/config.js';
import { resetState } from '../../src/core/state.js';

describe('Lock API', () => {
  const testConfig = {
    lockEndpoint: 'https://api.qredex.com/agent/lock',
    debug: false,
    autoDetect: false,
    influenceIntentToken: 'test_intent',
    purchaseIntentToken: 'test_pit',
    influenceIntentToken: 'test_intent_key',
    purchaseIntentToken: 'test_pit_key',
    cookieMaxAge: 86400,
  };

  beforeEach(() => {
    // Clear storage
    clearAllTokens({
      influenceIntentToken: testConfig.influenceIntentToken,
      purchaseIntentToken: testConfig.purchaseIntentToken,
      influenceIntentToken: testConfig.influenceIntentToken,
      purchaseIntentToken: testConfig.purchaseIntentToken,
      cookieMaxAge: testConfig.cookieMaxAge,
    });

    // Initialize config
    initConfig(testConfig);

    // Reset state
    resetState();

    // Clear any in-flight promise by resetting the module
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetConfig();
    vi.restoreAllMocks();
  });

  describe('Idempotency', () => {
    it('should return cached PIT if already exists locally', async () => {
      // Store a PIT first
      storePurchaseToken('existing_pit_12345', {
        influenceIntentToken: testConfig.influenceIntentToken,
        purchaseIntentToken: testConfig.purchaseIntentToken,
        influenceIntentToken: testConfig.influenceIntentToken,
        purchaseIntentToken: testConfig.purchaseIntentToken,
        cookieMaxAge: testConfig.cookieMaxAge,
      });

      const result = await lockIntent();

      expect(result.success).toBe(true);
      expect(result.purchaseToken).toBe('existing_pit_12345');
      expect(result.alreadyLocked).toBe(true);
    });

    it('should return same promise for concurrent calls', async () => {
      // Store IIT
      storeIntentToken('test_intent_12345', {
        influenceIntentToken: testConfig.influenceIntentToken,
        purchaseIntentToken: testConfig.purchaseIntentToken,
        influenceIntentToken: testConfig.influenceIntentToken,
        purchaseIntentToken: testConfig.purchaseIntentToken,
        cookieMaxAge: testConfig.cookieMaxAge,
      });

      // Mock fetch to simulate slow response
      const mockResponse = {
        success: true,
        purchase_token: 'new_pit_67890',
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // Make multiple concurrent calls
      const [result1, result2, result3] = await Promise.all([
        lockIntent(),
        lockIntent(),
        lockIntent(),
      ]);

      // All should return the same result
      expect(result1.purchaseToken).toBe('new_pit_67890');
      expect(result2.purchaseToken).toBe('new_pit_67890');
      expect(result3.purchaseToken).toBe('new_pit_67890');

      // Fetch should only be called once
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle already_locked response from server', async () => {
      // Store IIT
      storeIntentToken('test_intent_12345', {
        influenceIntentToken: testConfig.influenceIntentToken,
        purchaseIntentToken: testConfig.purchaseIntentToken,
        influenceIntentToken: testConfig.influenceIntentToken,
        purchaseIntentToken: testConfig.purchaseIntentToken,
        cookieMaxAge: testConfig.cookieMaxAge,
      });

      // Mock fetch to return already_locked
      const mockResponse = {
        success: true,
        purchase_token: 'server_pit_11111',
        already_locked: true,
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await lockIntent();

      expect(result.success).toBe(true);
      expect(result.purchaseToken).toBe('server_pit_11111');
      expect(result.alreadyLocked).toBe(true);
    });
  });

  describe('Lock Flow', () => {
    it('should fail without intent token', async () => {
      const result = await lockIntent();

      expect(result.success).toBe(false);
      expect(result.purchaseToken).toBe(null);
      expect(result.alreadyLocked).toBe(false);
      expect(result.error).toBe('No intent token available');
    });

    it('should successfully lock intent', async () => {
      // Store IIT
      storeIntentToken('test_intent_12345', {
        influenceIntentToken: testConfig.influenceIntentToken,
        purchaseIntentToken: testConfig.purchaseIntentToken,
        influenceIntentToken: testConfig.influenceIntentToken,
        purchaseIntentToken: testConfig.purchaseIntentToken,
        cookieMaxAge: testConfig.cookieMaxAge,
      });

      // Mock successful fetch response
      const mockResponse = {
        success: true,
        purchase_token: 'new_pit_67890',
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await lockIntent();

      expect(result.success).toBe(true);
      expect(result.purchaseToken).toBe('new_pit_67890');
      expect(result.alreadyLocked).toBe(false);

      // Verify PIT was stored
      const storedPit = await lockIntent(); // Call again to verify storage
      expect(storedPit.purchaseToken).toBe('new_pit_67890');
      expect(storedPit.alreadyLocked).toBe(true);
    });

    it('should handle HTTP errors', async () => {
      // Store IIT
      storeIntentToken('test_intent_12345', {
        influenceIntentToken: testConfig.influenceIntentToken,
        purchaseIntentToken: testConfig.purchaseIntentToken,
        influenceIntentToken: testConfig.influenceIntentToken,
        purchaseIntentToken: testConfig.purchaseIntentToken,
        cookieMaxAge: testConfig.cookieMaxAge,
      });

      // Mock HTTP error
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      const result = await lockIntent();

      expect(result.success).toBe(false);
      expect(result.purchaseToken).toBe(null);
      expect(result.alreadyLocked).toBe(false);
      expect(result.error).toContain('HTTP 500');
    });

    it('should handle network errors', async () => {
      // Store IIT
      storeIntentToken('test_intent_12345', {
        influenceIntentToken: testConfig.influenceIntentToken,
        purchaseIntentToken: testConfig.purchaseIntentToken,
        influenceIntentToken: testConfig.influenceIntentToken,
        purchaseIntentToken: testConfig.purchaseIntentToken,
        cookieMaxAge: testConfig.cookieMaxAge,
      });

      // Mock network error
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await lockIntent();

      expect(result.success).toBe(false);
      expect(result.purchaseToken).toBe(null);
      expect(result.alreadyLocked).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle invalid response without purchase_token', async () => {
      // Store IIT
      storeIntentToken('test_intent_12345', {
        influenceIntentToken: testConfig.influenceIntentToken,
        purchaseIntentToken: testConfig.purchaseIntentToken,
        influenceIntentToken: testConfig.influenceIntentToken,
        purchaseIntentToken: testConfig.purchaseIntentToken,
        cookieMaxAge: testConfig.cookieMaxAge,
      });

      // Mock response without purchase_token
      const mockResponse = {
        success: true,
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await lockIntent();

      expect(result.success).toBe(false);
      expect(result.purchaseToken).toBe(null);
      expect(result.alreadyLocked).toBe(false);
    });

    it('should include metadata in request', async () => {
      // Store IIT
      storeIntentToken('test_intent_12345', {
        influenceIntentToken: testConfig.influenceIntentToken,
        purchaseIntentToken: testConfig.purchaseIntentToken,
        influenceIntentToken: testConfig.influenceIntentToken,
        purchaseIntentToken: testConfig.purchaseIntentToken,
        cookieMaxAge: testConfig.cookieMaxAge,
      });

      const mockResponse = {
        success: true,
        purchase_token: 'new_pit_67890',
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const meta = {
        product_id: 'widget-001',
        quantity: 2,
        price: 99.99,
      };

      await lockIntent(meta);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const callArgs = (global.fetch as vi.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);

      expect(body.intent_token).toBe('test_intent_12345');
      expect(body.meta?.product_id).toBe('widget-001');
      expect(body.meta?.quantity).toBe(2);
      expect(body.meta?.price).toBe(99.99);
      expect(body.meta?.user_agent).toBeDefined();
      expect(body.meta?.url).toBeDefined();
    });
  });

  describe('State Management', () => {
    it('should reset in-flight state after completion', async () => {
      // Store IIT
      storeIntentToken('test_intent_12345', {
        influenceIntentToken: testConfig.influenceIntentToken,
        purchaseIntentToken: testConfig.purchaseIntentToken,
        influenceIntentToken: testConfig.influenceIntentToken,
        purchaseIntentToken: testConfig.purchaseIntentToken,
        cookieMaxAge: testConfig.cookieMaxAge,
      });

      const mockResponse = {
        success: true,
        purchase_token: 'new_pit_67890',
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // First call
      await lockIntent();

      // Second call should make a new request (not return cached since we cleared state)
      // Actually, since PIT is now stored, it should return cached
      const result2 = await lockIntent();

      expect(result2.success).toBe(true);
      expect(result2.alreadyLocked).toBe(true);
    });

    it('should allow new lock after state reset', async () => {
      // Store IIT
      storeIntentToken('test_intent_12345', {
        influenceIntentToken: testConfig.influenceIntentToken,
        purchaseIntentToken: testConfig.purchaseIntentToken,
        influenceIntentToken: testConfig.influenceIntentToken,
        purchaseIntentToken: testConfig.purchaseIntentToken,
        cookieMaxAge: testConfig.cookieMaxAge,
      });

      const mockResponse1 = {
        success: true,
        purchase_token: 'pit_1',
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse1),
      });

      // First lock
      const result1 = await lockIntent();
      expect(result1.success).toBe(true);

      // Clear PIT to simulate fresh state (but keep IIT)
      clearAllTokens({
        influenceIntentToken: testConfig.influenceIntentToken,
        purchaseIntentToken: testConfig.purchaseIntentToken,
        influenceIntentToken: testConfig.influenceIntentToken,
        purchaseIntentToken: testConfig.purchaseIntentToken,
        cookieMaxAge: testConfig.cookieMaxAge,
      });

      // Re-store IIT since clearAllTokens clears both
      storeIntentToken('test_intent_12345', {
        influenceIntentToken: testConfig.influenceIntentToken,
        purchaseIntentToken: testConfig.purchaseIntentToken,
        influenceIntentToken: testConfig.influenceIntentToken,
        purchaseIntentToken: testConfig.purchaseIntentToken,
        cookieMaxAge: testConfig.cookieMaxAge,
      });

      resetState();

      // Set up new mock for second request
      const mockResponse2 = {
        success: true,
        purchase_token: 'pit_2',
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse2),
      });

      // Should be able to lock again
      const result = await lockIntent();

      expect(result.success).toBe(true);
      expect(result.purchaseToken).toBe('pit_2');
    });
  });
});
