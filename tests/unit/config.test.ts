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
 * Unit tests for configuration.
 */

import {beforeEach, describe, expect, it} from 'vitest';
import {getConfig, getConfigValue, initConfig, isConfigInitialized, resetConfig} from '../../src/bootstrap/config.js';

describe('Configuration', () => {
  beforeEach(() => {
    resetConfig();
    delete window.QredexAgentConfig;
  });

  it('should use default values when no config provided', () => {
    const config = initConfig();

    expect(config.lockEndpoint).toBe('https://api.qredex.com/api/v1/agent/intents/lock');
    expect(config.debug).toBe(false);
    expect(config.autoDetect).toBe(true);
    expect(config.influenceIntentToken).toBe('__qdx_iit');
    expect(config.purchaseIntentToken).toBe('__qdx_pit');
  });

  it('should merge user config with defaults', () => {
    const config = initConfig({
      debug: true,
      lockEndpoint: 'https://custom.endpoint.com/lock',
    });

    expect(config.debug).toBe(true);
    expect(config.lockEndpoint).toBe('https://custom.endpoint.com/lock');
    expect(config.autoDetect).toBe(true); // default
  });

  it('should respect pre-load global config', () => {
    window.QredexAgentConfig = {
      debug: true,
      influenceIntentToken: 'custom_intent',
    };

    const config = initConfig({
      debug: false, // should be overridden by pre-load config
    });

    expect(config.debug).toBe(true);
    expect(config.influenceIntentToken).toBe('custom_intent');
  });

  it('should validate URL config values', () => {
    const config = initConfig({
      lockEndpoint: 'not-a-valid-url',
    });

    // Should fall back to default for invalid URL
    expect(config.lockEndpoint).toBe('https://api.qredex.com/api/v1/agent/intents/lock');
  });

  it('should provide getConfigValue for individual values', () => {
    initConfig({ debug: true });

    expect(getConfigValue('debug')).toBe(true);
    expect(getConfigValue('autoDetect')).toBe(true);
  });

  it('should track initialization state', () => {
    expect(isConfigInitialized()).toBe(false);

    initConfig();

    expect(isConfigInitialized()).toBe(true);
  });

  it('should reset to defaults', () => {
    initConfig({ debug: true, autoDetect: false });
    resetConfig();

    expect(isConfigInitialized()).toBe(false);

    const config = getConfig();
    expect(config.debug).toBe(false);
    expect(config.autoDetect).toBe(true);
  });
});
