/**
 * Configuration management for the Qredex Agent.
 * Supports both programmatic config and pre-load global config.
 */

import { debug, warn } from '../utils/log.js';
import { isObject, isNonEmptyString, isValidUrl } from '../utils/guards.js';

/**
 * Configuration options for the Qredex Agent.
 */
export interface AgentConfig {
  /**
   * The lock endpoint URL.
   * @default 'https://api.qredex.com/agent/lock'
   */
  lockEndpoint?: string;

  /**
   * Enable debug logging.
   * @default false
   */
  debug?: boolean;

  /**
   * Enable automatic add-to-cart detection.
   * @default true
   */
  autoDetect?: boolean;

  /**
   * Cookie name for intent token.
   * @default 'qdx_intent'
   */
  cookieNameIntent?: string;

  /**
   * Cookie name for purchase intent token.
   * @default 'qdx_pit'
   */
  cookieNamePurchase?: string;

  /**
   * SessionStorage key for intent token.
   * @default 'intent_token'
   */
  storageKeyIntent?: string;

  /**
   * SessionStorage key for purchase intent token.
   * @default 'purchase_token'
   */
  storageKeyPurchase?: string;

  /**
   * Cookie max age in seconds.
   * @default 86400 (24 hours)
   */
  cookieMaxAge?: number;
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
  lockEndpoint: 'https://api.qredex.com/agent/lock',
  debug: false,
  autoDetect: true,
  cookieNameIntent: 'qdx_intent',
  cookieNamePurchase: 'qdx_pit',
  storageKeyIntent: 'intent_token',
  storageKeyPurchase: 'purchase_token',
  cookieMaxAge: 86400,
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
 */
function mergeConfig(userConfig: AgentConfig = {}): Required<AgentConfig> {
  const config: Required<AgentConfig> = { ...DEFAULT_CONFIG };

  if (isObject(userConfig)) {
    // Validate and merge lockEndpoint
    if (userConfig.lockEndpoint !== undefined && isNonEmptyString(userConfig.lockEndpoint)) {
      if (isValidUrl(userConfig.lockEndpoint)) {
        config.lockEndpoint = userConfig.lockEndpoint;
      } else {
        warn('Invalid lockEndpoint URL, using default');
      }
    }

    // Validate and merge boolean options
    if (typeof userConfig.debug === 'boolean') {
      config.debug = userConfig.debug;
    }

    if (typeof userConfig.autoDetect === 'boolean') {
      config.autoDetect = userConfig.autoDetect;
    }

    // Validate and merge string options
    if (isNonEmptyString(userConfig.cookieNameIntent)) {
      config.cookieNameIntent = userConfig.cookieNameIntent;
    }

    if (isNonEmptyString(userConfig.cookieNamePurchase)) {
      config.cookieNamePurchase = userConfig.cookieNamePurchase;
    }

    if (isNonEmptyString(userConfig.storageKeyIntent)) {
      config.storageKeyIntent = userConfig.storageKeyIntent;
    }

    if (isNonEmptyString(userConfig.storageKeyPurchase)) {
      config.storageKeyPurchase = userConfig.storageKeyPurchase;
    }

    // Validate and merge numeric options
    if (typeof userConfig.cookieMaxAge === 'number' && userConfig.cookieMaxAge > 0) {
      config.cookieMaxAge = userConfig.cookieMaxAge;
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
