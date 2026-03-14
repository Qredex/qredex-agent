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
});
