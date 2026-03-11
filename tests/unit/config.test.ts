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
 * Unit tests for configuration policy and defaults.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getConfigPolicy } from '../../src/bootstrap/config-policy.js';
import {
  getConfig,
  getConfigValue,
  initConfig,
  isConfigInitialized,
  resetConfig,
  resolveConfig,
} from '../../src/bootstrap/config.js';

describe('Configuration', () => {
  beforeEach(() => {
    resetConfig();
    delete window.QredexAgentConfig;
    vi.restoreAllMocks();
  });

  it('should use default values when no config provided', () => {
    const config = initConfig();

    expect(config.lockEndpoint).toBe('https://api.qredex.com/api/v1/agent/intents/lock');
    expect(config.debug).toBe(false);
    expect(config.useMockEndpoint).toBe(false);
    expect(config.influenceIntentToken).toBe('__qdx_iit');
    expect(config.purchaseIntentToken).toBe('__qdx_pit');
    expect(config.cookieExpireDays).toBe(30);
  });

  it('should merge user config with defaults in test mode', () => {
    const config = initConfig({
      debug: true,
      lockEndpoint: 'https://custom.endpoint.com/lock',
    });

    expect(config.debug).toBe(true);
    expect(config.lockEndpoint).toBe('https://custom.endpoint.com/lock');
    expect(config.influenceIntentToken).toBe('__qdx_iit');
  });

  it('should respect pre-load global config', () => {
    window.QredexAgentConfig = {
      debug: true,
      influenceIntentToken: 'custom_intent',
    };

    const config = initConfig({
      debug: false,
    });

    expect(config.debug).toBe(true);
    expect(config.influenceIntentToken).toBe('custom_intent');
  });

  it('should allow relative lockEndpoint overrides in non-production runtimes', () => {
    const config = resolveConfig(
      {
        lockEndpoint: '/api/v1/agent/intents/lock',
      },
      getConfigPolicy('staging')
    );

    expect(config.lockEndpoint).toBe('/api/v1/agent/intents/lock');
  });

  it('should ignore lockEndpoint and debug overrides in production', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const config = resolveConfig(
      {
        lockEndpoint: 'https://custom.endpoint.com/lock',
        debug: true,
      },
      getConfigPolicy('production')
    );

    expect(config.lockEndpoint).toBe('https://api.qredex.com/api/v1/agent/intents/lock');
    expect(config.debug).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('should allow lockEndpoint and debug in staging but reject mock endpoint', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const config = resolveConfig(
      {
        lockEndpoint: 'https://staging.example.com/api/v1/agent/intents/lock',
        debug: true,
        useMockEndpoint: true,
      },
      getConfigPolicy('staging')
    );

    expect(config.lockEndpoint).toBe('https://staging.example.com/api/v1/agent/intents/lock');
    expect(config.debug).toBe(true);
    expect(config.useMockEndpoint).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('should allow mock endpoint in development', () => {
    const config = resolveConfig(
      {
        useMockEndpoint: true,
      },
      getConfigPolicy('development')
    );

    expect(config.useMockEndpoint).toBe(true);
  });

  it('should fall back to default for invalid lockEndpoint', () => {
    const config = initConfig({
      lockEndpoint: 'not-a-valid-url',
    });

    expect(config.lockEndpoint).toBe('https://api.qredex.com/api/v1/agent/intents/lock');
  });

  it('should revert duplicate storage key overrides to defaults', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const config = resolveConfig({
      influenceIntentToken: '__qdx_shared',
      purchaseIntentToken: '__qdx_shared',
    });

    expect(config.influenceIntentToken).toBe('__qdx_iit');
    expect(config.purchaseIntentToken).toBe('__qdx_pit');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('should provide getConfigValue for individual values', () => {
    initConfig({ debug: true });

    expect(getConfigValue('debug')).toBe(true);
    expect(getConfigValue('influenceIntentToken')).toBe('__qdx_iit');
  });

  it('should track initialization state', () => {
    expect(isConfigInitialized()).toBe(false);

    initConfig();

    expect(isConfigInitialized()).toBe(true);
  });

  it('should reset to defaults', () => {
    initConfig({ debug: true });
    resetConfig();

    expect(isConfigInitialized()).toBe(false);

    const config = getConfig();
    expect(config.debug).toBe(false);
    expect(config.lockEndpoint).toBe('https://api.qredex.com/api/v1/agent/intents/lock');
  });
});
