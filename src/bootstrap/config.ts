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
 * Configuration management for the Qredex Agent.
 * Supports both programmatic config and preload global config.
 */

import { debug, warn } from '../utils/log.js';
import { isObject, isNonEmptyString, isValidUrl } from '../utils/guards.js';

/**
 * Configuration options for the Qredex Agent.
 */
export interface AgentConfig {
  /**
   * The lock endpoint URL.
   *
   * ⚠️ **Development/Staging Only** - Override is ignored in production.
   *
   * In production builds, the default Qredex AGENT endpoint is always used
   * regardless of this setting. This ensures consistent runtime behavior
   * and prevents merchants from accidentally pointing to non-standard backends.
   *
   * For local development, staging, or testing environments, you may override
   * this to point to your own backend or test endpoint.
   *
   * @default 'https://api.qredex.com/api/v1/agent/intents/lock'
   */
  lockEndpoint?: string;

  /**
   * Enable debug logging.
   * @default false
   */
  debug?: boolean;

  /**
   * Use mock endpoint for local development (no network calls).
   * When true, generates fake PIT tokens locally for testing.
   *
   * ⚠️ **DEVELOPMENT ONLY - Never use in production.**
   * - Throws runtime error if used in production build
   * - Logs console warning when enabled
   * - Always set to `false` or remove before deploying
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
  lockEndpoint: 'https://api.qredex.com/api/v1/agent/intents/lock',
  debug: false,
  useMockEndpoint: false,
  influenceIntentToken: '__qdx_iit',
  purchaseIntentToken: '__qdx_pit',
  cookieExpireDays: 30,
};

let currentConfig: Required<AgentConfig> = { ...DEFAULT_CONFIG };
let isInitialized = false;

/**
 * Ensure configuration is initialized from pre-load global config if available.
 * This is called automatically on first access to ensure pre-load config is respected.
 */
function ensureConfigInitialized(): void {
  if (isInitialized) {
    return;
  }

  // Check for pre-load global config
  const preloadConfig = window.QredexAgentConfig;
  if (preloadConfig) {
    currentConfig = mergeConfig(preloadConfig);
    isInitialized = true;
    debug('Configuration initialized from pre-load global config');
  }
}

/**
 * Merge user config with defaults, validating known fields.
 *
 * Note: lockEndpoint override is only allowed in development mode.
 * In production, the default Qredex AGENT endpoint is always used.
 */
function mergeConfig(userConfig: AgentConfig = {}): Required<AgentConfig> {
  const config: Required<AgentConfig> = { ...DEFAULT_CONFIG };

  if (isObject(userConfig)) {
    // Validate and merge lockEndpoint (DEV ONLY - production always uses default)
    if (userConfig.lockEndpoint !== undefined && isNonEmptyString(userConfig.lockEndpoint)) {
      if (__DEV__) {
        // Allow override in development/staging/test environments
        if (isValidUrl(userConfig.lockEndpoint)) {
          config.lockEndpoint = userConfig.lockEndpoint;
          debug('lockEndpoint overridden (development mode):', userConfig.lockEndpoint);
        } else {
          warn('Invalid lockEndpoint URL, using default');
        }
      } else {
        // Ignore override in production - always use default Qredex AGENT endpoint
        debug('lockEndpoint override ignored in production, using default');
      }
    }

    // Validate and merge boolean options
    if (typeof userConfig.debug === 'boolean') {
      config.debug = userConfig.debug;
    }

    if (typeof userConfig.useMockEndpoint === 'boolean') {
      config.useMockEndpoint = userConfig.useMockEndpoint;
    }

    // Validate and merge token key options
    if (isNonEmptyString(userConfig.influenceIntentToken)) {
      config.influenceIntentToken = userConfig.influenceIntentToken;
    }

    if (isNonEmptyString(userConfig.purchaseIntentToken)) {
      config.purchaseIntentToken = userConfig.purchaseIntentToken;
    }

    // Validate and merge numeric options
    if (typeof userConfig.cookieExpireDays === 'number' && userConfig.cookieExpireDays > 0) {
      config.cookieExpireDays = userConfig.cookieExpireDays;
    }
  }

  return config;
}

/**
 * Initialize configuration from user config and/or pre-load global config.
 * Pre-load config takes precedence over programmatic config.
 */
export function initConfig(userConfig?: AgentConfig): Required<AgentConfig> {
  // Check for pre-load global config first
  const preloadConfig = window.QredexAgentConfig;

  // Merge: defaults <- userConfig <- preloadConfig
  const merged = mergeConfig(userConfig);
  const finalConfig = preloadConfig ? mergeConfig({ ...merged, ...preloadConfig }) : merged;

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
