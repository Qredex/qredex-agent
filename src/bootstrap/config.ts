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
 * Configuration management for the Qredex Agent.
 * Supports both programmatic config and preload global config.
 */

import { debug, warn } from '../utils/log.js';
import { isObject, isNonEmptyString } from '../utils/guards.js';
import { getCurrentConfigPolicy, type AgentConfigPolicy } from './config-policy.js';
import {
  DEFAULT_COOKIE_EXPIRE_DAYS,
  DEFAULT_INFLUENCE_INTENT_TOKEN_KEY,
  DEFAULT_LOCK_ENDPOINT,
  DEFAULT_PURCHASE_INTENT_TOKEN_KEY,
} from '../utils/constants.js';

/**
 * Configuration options for the Qredex Agent.
 */
export interface AgentConfig {
  /**
   * The lock endpoint URL.
   *
   * ⚠️ **Development/Staging/Test Only** - Override is ignored in production.
   *
   * In production builds, the default Qredex AGENT endpoint is always used
   * regardless of this setting. This keeps the browser agent aligned to the
   * canonical Qredex lock flow instead of becoming a generic transport client.
   *
   * Root-relative paths are allowed for same-origin non-production testing.
   *
   * @default 'https://api.qredex.com/api/v1/agent/intents/lock'
   */
  lockEndpoint?: string;

  /**
   * Enable debug logging in non-production runtimes.
   * Production always forces this to false.
   * @default false
   */
  debug?: boolean;

  /**
   * Use mock endpoint for local development/test (no network calls).
   * When true, generates fake PIT tokens locally for testing.
   *
   * ⚠️ **DEVELOPMENT/TEST ONLY** - Ignored elsewhere.
   *
   * @default false
   */
  useMockEndpoint?: boolean;

  /**
   * Key name for influence intent token (used for both cookie and sessionStorage).
   * @default '__qdx_iit'
   */
  influenceIntentToken?: string;

  /**
   * Key name for purchase intent token (used for both cookie and sessionStorage).
   * @default '__qdx_pit'
   */
  purchaseIntentToken?: string;

  /**
   * Cookie expiration in days.
   * @default 30
   */
  cookieExpireDays?: number;
}

/**
 * Pre-load global config interface (window.QredexAgentConfig).
 */
declare global {
  interface Window {
    QredexAgentConfig?: AgentConfig;
  }
}

const DEFAULT_CONFIG: Required<AgentConfig> = {
  lockEndpoint: DEFAULT_LOCK_ENDPOINT,
  debug: false,
  useMockEndpoint: false,
  influenceIntentToken: DEFAULT_INFLUENCE_INTENT_TOKEN_KEY,
  purchaseIntentToken: DEFAULT_PURCHASE_INTENT_TOKEN_KEY,
  cookieExpireDays: DEFAULT_COOKIE_EXPIRE_DAYS,
};

let currentConfig: Required<AgentConfig> = { ...DEFAULT_CONFIG };
let isInitialized = false;

function getPreloadConfig(): AgentConfig | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window.QredexAgentConfig;
}

function isValidLockEndpoint(value: string): boolean {
  const isRelativePath = value.startsWith('/');
  const isAbsoluteHttpUrl = /^https?:\/\//.test(value);

  if (!isRelativePath && !isAbsoluteHttpUrl) {
    return false;
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://qredex.invalid';

  try {
    const url = new URL(value, baseUrl);
    if (isRelativePath) {
      return url.pathname.length > 0;
    }
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function resolveConfig(
  userConfig: AgentConfig = {},
  policy: AgentConfigPolicy = getCurrentConfigPolicy()
): Required<AgentConfig> {
  const config: Required<AgentConfig> = { ...DEFAULT_CONFIG };

  if (!isObject(userConfig)) {
    return config;
  }

  if (userConfig.lockEndpoint !== undefined && isNonEmptyString(userConfig.lockEndpoint)) {
    if (policy.allowLockEndpointOverride) {
      if (isValidLockEndpoint(userConfig.lockEndpoint)) {
        config.lockEndpoint = userConfig.lockEndpoint;
        debug('lockEndpoint overridden for non-production runtime');
      } else {
        warn('Invalid lockEndpoint URL, using default');
      }
    } else {
      warn('lockEndpoint override ignored in production');
    }
  }

  if (typeof userConfig.debug === 'boolean') {
    if (policy.allowDebug) {
      config.debug = userConfig.debug;
    } else if (userConfig.debug) {
      warn('debug=true ignored in production');
    }
  }

  if (typeof userConfig.useMockEndpoint === 'boolean') {
    if (policy.allowMockEndpoint) {
      config.useMockEndpoint = userConfig.useMockEndpoint;
    } else if (userConfig.useMockEndpoint) {
      warn('useMockEndpoint ignored outside development/test');
    }
  }

  if (isNonEmptyString(userConfig.influenceIntentToken)) {
    config.influenceIntentToken = userConfig.influenceIntentToken;
  }

  if (isNonEmptyString(userConfig.purchaseIntentToken)) {
    config.purchaseIntentToken = userConfig.purchaseIntentToken;
  }

  if (typeof userConfig.cookieExpireDays === 'number' && userConfig.cookieExpireDays > 0) {
    config.cookieExpireDays = userConfig.cookieExpireDays;
  }

  if (config.influenceIntentToken === config.purchaseIntentToken) {
    warn('Storage key overrides must use distinct IIT and PIT keys, reverting to defaults');
    config.influenceIntentToken = DEFAULT_INFLUENCE_INTENT_TOKEN_KEY;
    config.purchaseIntentToken = DEFAULT_PURCHASE_INTENT_TOKEN_KEY;
  }

  return config;
}

/**
 * Ensure configuration is initialized from pre-load global config if available.
 * This is called automatically on first access to ensure pre-load config is respected.
 */
function ensureConfigInitialized(): void {
  if (isInitialized) {
    return;
  }

  const preloadConfig = getPreloadConfig();
  if (preloadConfig) {
    currentConfig = resolveConfig(preloadConfig);
    isInitialized = true;
    debug('Configuration initialized from pre-load global config');
  }
}

/**
 * Initialize configuration from user config and/or pre-load global config.
 * Pre-load config takes precedence over programmatic config.
 */
export function initConfig(userConfig?: AgentConfig): Required<AgentConfig> {
  const preloadConfig = getPreloadConfig();
  const merged = resolveConfig(userConfig);
  const finalConfig = preloadConfig ? resolveConfig({ ...merged, ...preloadConfig }) : merged;

  currentConfig = finalConfig;
  isInitialized = true;

  debug('Configuration initialized', currentConfig);

  return currentConfig;
}

/**
 * Get the current configuration.
 */
export function getConfig(): Required<AgentConfig> {
  ensureConfigInitialized();
  return { ...currentConfig };
}

/**
 * Get a specific config value.
 */
export function getConfigValue<K extends keyof Required<AgentConfig>>(
  key: K
): Required<AgentConfig>[K] {
  ensureConfigInitialized();
  return currentConfig[key] ?? DEFAULT_CONFIG[key];
}

/**
 * Reset configuration to defaults.
 */
export function resetConfig(): void {
  currentConfig = { ...DEFAULT_CONFIG };
  isInitialized = false;
  debug('Configuration reset to defaults');
}

/**
 * Check if configuration has been initialized.
 */
export function isConfigInitialized(): boolean {
  return isInitialized;
}
