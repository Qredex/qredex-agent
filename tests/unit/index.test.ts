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
 * Unit tests for public lifecycle methods.
 */

import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { getConfig, resetConfig } from '../../src/bootstrap/config.js';
import { clearAllTokens } from '../../src/storage/tokens.js';
import QredexAgent from '../../src/index.js';

describe('Public init', () => {
  beforeEach(() => {
    resetConfig();
    delete window.QredexAgentConfig;
    QredexAgent.destroy();
    const config = getConfig();
    clearAllTokens({
      influenceIntentToken: config.influenceIntentToken,
      purchaseIntentToken: config.purchaseIntentToken,
      cookieExpireDays: config.cookieExpireDays,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should apply programmatic config via init()', () => {
    QredexAgent.init({
      debug: true,
    });

    const config = getConfig();

    expect(config.debug).toBe(true);
    expect(config.influenceIntentToken).toBe('__qdx_iit');
    expect(config.purchaseIntentToken).toBe('__qdx_pit');
    expect(QredexAgent.isInitialized()).toBe(true);
  });

  it('should expose a canonical state snapshot before and after init', () => {
    const beforeInit = QredexAgent.getState();

    expect(beforeInit.initialized).toBe(false);
    expect(beforeInit.lifecycleState).toBe('destroyed');
    expect(beforeInit.lockInProgress).toBe(false);
    expect(beforeInit.lockAttempts).toBe(0);
    expect(beforeInit.cartState).toBe('unknown');

    QredexAgent.init();

    const afterInit = QredexAgent.getState();

    expect(afterInit.initialized).toBe(true);
    expect(afterInit.lifecycleState).toBe('running');
    expect(afterInit.cartState).toBe('unknown');
  });

  it('should warn when handleCartChange is called before init', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    QredexAgent.handleCartChange({
      itemCount: 1,
      previousCount: 0,
    });

    expect(warnSpy).toHaveBeenCalledWith(
      '[QredexAgent]',
      expect.stringContaining('handleCartChange called before init()')
    );
  });

  it('should warn on suspicious unchanged cart transitions', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    QredexAgent.init();
    QredexAgent.handleCartChange({
      itemCount: 1,
      previousCount: 1,
    });

    expect(warnSpy).toHaveBeenCalledWith(
      '[QredexAgent]',
      expect.stringContaining('unchanged cart count')
    );
  });

  it('should warn when payment success is reported without a PIT', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    QredexAgent.init();
    QredexAgent.handlePaymentSuccess();

    expect(warnSpy).toHaveBeenCalledWith(
      '[QredexAgent]',
      expect.stringContaining('handlePaymentSuccess called without a PIT')
    );
  });

  it('should emit stable error codes for invalid cart counts', () => {
    const handler = vi.fn();

    QredexAgent.onError(handler);
    QredexAgent.handleCartChange({
      itemCount: -1,
      previousCount: 0,
    });

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'invalid_cart_counts',
        message: 'itemCount and previousCount must be non-negative',
        error: 'itemCount and previousCount must be non-negative',
        context: 'handleCartChange',
      })
    );
  });
});
