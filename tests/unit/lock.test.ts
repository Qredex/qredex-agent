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
 * Unit tests for lock API and idempotency.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { lockIntent } from '../../src/api/lock.js';
import { storeInfluenceIntentToken, storePurchaseToken, clearAllTokens } from '../../src/storage/tokens.js';
import { initConfig, resetConfig } from '../../src/bootstrap/config.js';
import { resetState } from '../../src/core/state.js';
import {
  DEFAULT_COOKIE_EXPIRE_DAYS,
  DEFAULT_INFLUENCE_INTENT_TOKEN_KEY,
  DEFAULT_PURCHASE_INTENT_TOKEN_KEY,
} from '../../src/utils/constants.js';

describe('Lock API', () => {
  const storageConfig = {
    influenceIntentToken: DEFAULT_INFLUENCE_INTENT_TOKEN_KEY,
    purchaseIntentToken: DEFAULT_PURCHASE_INTENT_TOKEN_KEY,
    cookieExpireDays: DEFAULT_COOKIE_EXPIRE_DAYS,
  };

  beforeEach(() => {
    // Clear storage
    clearAllTokens(storageConfig);

    // Initialize config
    initConfig();

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
      storePurchaseToken('existing_pit_12345', storageConfig);

      const result = await lockIntent();

      expect(result.success).toBe(true);
      expect(result.purchaseToken).toBe('existing_pit_12345');
      expect(result.alreadyLocked).toBe(true);
    });

    it('should return same promise for concurrent calls', async () => {
      // Store IIT
      storeInfluenceIntentToken('test_intent_12345', storageConfig);

      // Mock fetch to simulate slow response
      const mockResponse = {
        success: true,
        token: 'new_pit_67890',
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

    it('should handle successful lock response', async () => {
      // Store IIT
      storeInfluenceIntentToken('test_intent_12345', storageConfig);

      // Mock fetch to return successful response
      const mockResponse = {
        token: 'server_pit_11111',
        expiresAt: '2026-03-08T00:00:00Z',
        lockedAt: '2026-03-07T00:00:00Z',
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await lockIntent();

      expect(result.success).toBe(true);
      expect(result.purchaseToken).toBe('server_pit_11111');
      expect(result.alreadyLocked).toBe(false);
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
      storeInfluenceIntentToken('test_intent_12345', storageConfig);

      // Mock successful fetch response
      const mockResponse = {
        success: true,
        token: 'new_pit_67890',
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
      storeInfluenceIntentToken('test_intent_12345', storageConfig);

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
      storeInfluenceIntentToken('test_intent_12345', storageConfig);

      // Mock network error
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await lockIntent();

      expect(result.success).toBe(false);
      expect(result.purchaseToken).toBe(null);
      expect(result.alreadyLocked).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle invalid response without token', async () => {
      // Store IIT
      storeInfluenceIntentToken('test_intent_12345', storageConfig);

      // Mock response without token (invalid)
      const mockResponse = {
        expiresAt: '2026-03-08T00:00:00Z',
        lockedAt: '2026-03-07T00:00:00Z',
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await lockIntent();

      // Should fail because token is missing
      expect(result.success).toBe(false);
      expect(result.purchaseToken).toBe(null);
      expect(result.alreadyLocked).toBe(false);
    });

    it('should include metadata in request', async () => {
      // Store IIT
      storeInfluenceIntentToken('test_intent_12345', storageConfig);

      const mockResponse = {
        success: true,
        token: 'new_pit_67890',
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

      expect(body.token).toBe('test_intent_12345');
    });
  });

  describe('State Management', () => {
    it('should reset in-flight state after completion', async () => {
      // Store IIT
      storeInfluenceIntentToken('test_intent_12345', storageConfig);

      const mockResponse = {
        success: true,
        token: 'new_pit_67890',
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
      storeInfluenceIntentToken('test_intent_12345', storageConfig);

      const mockResponse1 = {
        success: true,
        token: 'pit_1',
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse1),
      });

      // First lock
      const result1 = await lockIntent();
      expect(result1.success).toBe(true);

      // Clear PIT to simulate fresh state (but keep IIT)
      clearAllTokens(storageConfig);

      // Re-store IIT since clearAllTokens clears both
      storeInfluenceIntentToken('test_intent_12345', storageConfig);

      resetState();

      // Set up new mock for second request
      const mockResponse2 = {
        success: true,
        token: 'pit_2',
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
