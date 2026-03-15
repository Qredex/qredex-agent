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
 * Unit tests for URL capture bootstrap behavior.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { captureIntentToken } from '../../src/bootstrap/auto-start.js';
import { initConfig, resetConfig } from '../../src/bootstrap/config.js';
import {
  DEFAULT_COOKIE_EXPIRE_DAYS,
  DEFAULT_INFLUENCE_INTENT_TOKEN_KEY,
  DEFAULT_PURCHASE_INTENT_TOKEN_KEY,
} from '../../src/utils/constants.js';
import {
  clearAllTokens,
  getInfluenceIntentToken,
  getPurchaseToken,
  storePurchaseToken,
} from '../../src/storage/tokens.js';

const storageConfig = {
  influenceIntentToken: DEFAULT_INFLUENCE_INTENT_TOKEN_KEY,
  purchaseIntentToken: DEFAULT_PURCHASE_INTENT_TOKEN_KEY,
  cookieExpireDays: DEFAULT_COOKIE_EXPIRE_DAYS,
};

describe('Auto-start bootstrap', () => {
  beforeEach(() => {
    resetConfig();
    initConfig();
    clearAllTokens(storageConfig);
    window.location.href = 'http://localhost:5173/examples/index.html';
  });

  it('should capture IIT and clean qdx_intent from the URL when PIT is absent', () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
    window.location.href = 'http://localhost:5173/examples/index.html?qdx_intent=iit_12345678';

    const captured = captureIntentToken();

    expect(captured).toBe(true);
    expect(getInfluenceIntentToken(storageConfig)).toBe('iit_12345678');
    expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/examples/index.html');
  });

  it('should clean qdx_intent from the URL when PIT already exists', () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
    storePurchaseToken('pit_12345678', storageConfig);
    window.location.href = 'http://localhost:5173/examples/index.html?qdx_intent=iit_12345678';

    const captured = captureIntentToken();

    expect(captured).toBe(false);
    expect(getPurchaseToken(storageConfig)).toBe('pit_12345678');
    expect(getInfluenceIntentToken(storageConfig)).toBe(null);
    expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/examples/index.html');
  });
});
