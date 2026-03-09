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
 * Lifecycle management for the Qredex Agent.
 * Handles initialization, destruction, and state transitions.
 */

import { debug, info, warn } from '../utils/log.js';
import { initConfig, type AgentConfig } from '../bootstrap/config.js';
import { captureIntentToken } from '../bootstrap/auto-start.js';
import { markInitialized, resetState, destroyState, isRunning, isDestroyed } from './state.js';

let lifecycleInitialized = false;

/**
 * Initialize the Qredex Agent.
 * This is the main entry point for manual initialization.
 */
export function init(config?: AgentConfig): void {
  if (lifecycleInitialized) {
    warn('Agent already initialized, ignoring duplicate init call');
    return;
  }

  try {
    // Initialize configuration
    initConfig(config);

    // Capture intent token from URL (if present)
    captureIntentToken();

    // Mark as initialized
    markInitialized();

    lifecycleInitialized = true;
    info('QredexAgent initialized');
  } catch (err) {
    warn('Failed to initialize agent', err);
    throw err;
  }
}

/**
 * Check if the agent is currently running.
 */
export function isInitialized(): boolean {
  return lifecycleInitialized && isRunning();
}

/**
 * Destroy the agent and clean up all resources.
 * This removes event listeners and resets state.
 */
export function destroy(): void {
  if (!lifecycleInitialized) {
    debug('Agent not initialized, nothing to destroy');
    return;
  }

  try {
    // Destroy state (runs cleanup functions)
    destroyState();

    lifecycleInitialized = false;
    info('QredexAgent destroyed');
  } catch (err) {
    warn('Error during destroy', err);
  }
}

/**
 * Stop the agent and clean up all resources.
 * Alias for destroy() - provided for API clarity.
 */
export function stop(): void {
  destroy();
}

/**
 * Reset the agent to initial state.
 * Useful for testing or re-initialization scenarios.
 */
export function reset(): void {
  resetState();
  lifecycleInitialized = false;
  debug('Agent reset');
}

/**
 * Get the current lifecycle status.
 */
export function getStatus(): {
  initialized: boolean;
  running: boolean;
  destroyed: boolean;
} {
  return {
    initialized: lifecycleInitialized,
    running: isRunning(),
    destroyed: isDestroyed(),
  };
}
