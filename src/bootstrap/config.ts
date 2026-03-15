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
 * Configuration management for the Qredex Agent.
 * Supports both programmatic config and preload global config.
 */

import { debug, warn } from '../utils/log.js';
import { isObject } from '../utils/guards.js';
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
   * Enable debug logging in non-production runtimes.
   * Production always forces this to false.
   * @default false
   */
  debug?: boolean;

  /**
   * Use mock endpoint for local development/test (no network calls).
   * When true, generates fake PIT tokens locally for testing.
   *
   * ⚠️ **DEVELOPMENT ONLY** for merchant usage - ignored outside development/test.
   *
   * @default false
   */
  useMockEndpoint?: boolean;
}

/**
 * Pre-load global config options for the CDN/IIFE bundle.
 */
export interface PreloadAgentConfig extends AgentConfig {
  /**
   * Control whether the CDN/IIFE bundle should call init() automatically on load.
   * Only applies to window.QredexAgentConfig before the script tag executes.
   * @default true
   */
  autoInit?: boolean;
}

interface InternalAgentConfig extends Required<AgentConfig> {
  lockEndpoint: string;
  influenceIntentToken: string;
  purchaseIntentToken: string;
  cookieExpireDays: number;
}

/**
 * Pre-load global config interface (window.QredexAgentConfig).
 */
declare global {
  interface Window {
    QredexAgentConfig?: PreloadAgentConfig;
  }
}

const DEFAULT_CONFIG: InternalAgentConfig = {
  lockEndpoint: DEFAULT_LOCK_ENDPOINT,
  debug: false,
  useMockEndpoint: false,
  influenceIntentToken: DEFAULT_INFLUENCE_INTENT_TOKEN_KEY,
  purchaseIntentToken: DEFAULT_PURCHASE_INTENT_TOKEN_KEY,
  cookieExpireDays: DEFAULT_COOKIE_EXPIRE_DAYS,
};

let currentConfig: InternalAgentConfig = { ...DEFAULT_CONFIG };
let isInitialized = false;

function getPreloadConfig(): PreloadAgentConfig | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window.QredexAgentConfig;
}

export function shouldAutoInitFromPreload(): boolean {
  const preloadConfig = getPreloadConfig();
  return preloadConfig?.autoInit !== false;
}

function warnUnsupportedRuntimeConfig(userConfig: Record<string, unknown>): void {
  if ('lockEndpoint' in userConfig) {
    warn('lockEndpoint is a build-time setting and is ignored at runtime');
  }

  if ('influenceIntentToken' in userConfig || 'purchaseIntentToken' in userConfig) {
    warn('Storage key overrides are not supported in the public runtime config');
  }

  if ('cookieExpireDays' in userConfig) {
    warn('cookieExpireDays is fixed by the agent and is ignored at runtime');
  }
}

export function resolveConfig(
  userConfig: AgentConfig = {},
  policy: AgentConfigPolicy = getCurrentConfigPolicy()
): InternalAgentConfig {
  const config: InternalAgentConfig = { ...DEFAULT_CONFIG };

  if (!isObject(userConfig)) {
    return config;
  }

  warnUnsupportedRuntimeConfig(userConfig as Record<string, unknown>);

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
export function initConfig(userConfig?: AgentConfig): InternalAgentConfig {
  const preloadConfig = getPreloadConfig();
  const runtimePreloadConfig = preloadConfig ? { ...preloadConfig } : undefined;
  if (runtimePreloadConfig) {
    delete runtimePreloadConfig.autoInit;
  }
  const finalInput = preloadConfig
    ? { ...(userConfig ?? {}), ...runtimePreloadConfig }
    : userConfig;
  const finalConfig = resolveConfig(finalInput);

  currentConfig = finalConfig;
  isInitialized = true;

  debug('Configuration initialized', currentConfig);

  return currentConfig;
}

/**
 * Get the current configuration.
 */
export function getConfig(): InternalAgentConfig {
  ensureConfigInitialized();
  return { ...currentConfig };
}

/**
 * Get a specific config value.
 */
export function getConfigValue<K extends keyof InternalAgentConfig>(
  key: K
): InternalAgentConfig[K] {
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
