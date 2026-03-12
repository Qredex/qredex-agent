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
 * Unit tests for URL capture bootstrap behavior.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { captureIntentToken } from '../../src/bootstrap/auto-start.js';
import { initConfig, resetConfig } from '../../src/bootstrap/config.js';
import {
  clearAllTokens,
  getInfluenceIntentToken,
  getPurchaseToken,
  storePurchaseToken,
} from '../../src/storage/tokens.js';

const testConfig = {
  influenceIntentToken: '__qdx_test_iit',
  purchaseIntentToken: '__qdx_test_pit',
  cookieExpireDays: 30,
};

describe('Auto-start bootstrap', () => {
  beforeEach(() => {
    resetConfig();
    initConfig(testConfig);
    clearAllTokens(testConfig);
    window.location.href = 'http://localhost:5173/examples/index.html';
  });

  it('should capture IIT and clean qdx_intent from the URL when PIT is absent', () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
    window.location.href = 'http://localhost:5173/examples/index.html?qdx_intent=iit_12345678';

    const captured = captureIntentToken();

    expect(captured).toBe(true);
    expect(getInfluenceIntentToken(testConfig)).toBe('iit_12345678');
    expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/examples/index.html');
  });

  it('should clean qdx_intent from the URL when PIT already exists', () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
    storePurchaseToken('pit_12345678', testConfig);
    window.location.href = 'http://localhost:5173/examples/index.html?qdx_intent=iit_12345678';

    const captured = captureIntentToken();

    expect(captured).toBe(false);
    expect(getPurchaseToken(testConfig)).toBe('pit_12345678');
    expect(getInfluenceIntentToken(testConfig)).toBe(null);
    expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/examples/index.html');
  });
});
