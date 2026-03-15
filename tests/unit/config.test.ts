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
 * Unit tests for configuration policy and defaults.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getConfigPolicy } from '../../src/bootstrap/config-policy.js';
import {
  type AgentConfig,
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
    });

    expect(config.debug).toBe(true);
    expect(config.lockEndpoint).toBe('https://api.qredex.com/api/v1/agent/intents/lock');
    expect(config.influenceIntentToken).toBe('__qdx_iit');
  });

  it('should respect pre-load global config', () => {
    window.QredexAgentConfig = {
      debug: true,
    };

    const config = initConfig({
      debug: false,
    });

    expect(config.debug).toBe(true);
    expect(config.influenceIntentToken).toBe('__qdx_iit');
  });

  it('should ignore unsupported runtime config fields', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const config = resolveConfig({
      debug: true,
      lockEndpoint: 'https://custom.endpoint.com/lock',
      influenceIntentToken: '__qdx_custom_iit',
      purchaseIntentToken: '__qdx_custom_pit',
      cookieExpireDays: 7,
    } as AgentConfig & Record<string, unknown>);

    expect(config.lockEndpoint).toBe('https://api.qredex.com/api/v1/agent/intents/lock');
    expect(config.influenceIntentToken).toBe('__qdx_iit');
    expect(config.purchaseIntentToken).toBe('__qdx_pit');
    expect(config.cookieExpireDays).toBe(30);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('should ignore debug in production', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const config = resolveConfig(
      {
        debug: true,
      },
      getConfigPolicy('production')
    );

    expect(config.debug).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('should allow debug in staging but reject mock endpoint', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const config = resolveConfig(
      {
        debug: true,
        useMockEndpoint: true,
      },
      getConfigPolicy('staging')
    );

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
