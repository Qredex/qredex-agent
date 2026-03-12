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
 * Centralized runtime state management for the Qredex Agent.
 * Maintains explicit state for lock operations and lifecycle.
 */

import { debug } from '../utils/log.js';

/**
 * Agent lifecycle states.
 */
export type AgentState = 'idle' | 'running' | 'locking' | 'destroyed';

/**
 * Cart state for tracking empty/non-empty transitions.
 */
export type CartState = 'unknown' | 'empty' | 'non-empty';

/**
 * Internal runtime state object.
 */
export interface RuntimeState {
  /** Current lifecycle state */
  state: AgentState;

  /** Whether a lock request is currently in flight */
  lockInProgress: boolean;

  /** Timestamp of last lock attempt (for rate limiting) */
  lastLockAttempt: number | null;

  /** Number of lock attempts */
  lockAttempts: number;

  /** Whether the agent has been initialized */
  initialized: boolean;

  /** Current cart state (for transition detection) */
  cartState: CartState;

  /** Event listener cleanup functions */
  cleanupFns: Array<() => void>;
}

const initialState: RuntimeState = {
  state: 'idle',
  lockInProgress: false,
  lastLockAttempt: null,
  lockAttempts: 0,
  initialized: false,
  cartState: 'unknown',
  cleanupFns: [],
};

let state: RuntimeState = { ...initialState };

/**
 * Get the current runtime state (read-only copy).
 */
export function getState(): Readonly<RuntimeState> {
  return { ...state };
}

/**
 * Get the current lifecycle state.
 */
export function getAgentState(): AgentState {
  return state.state;
}

/**
 * Check if the agent is in a runnable state.
 */
export function isRunning(): boolean {
  return state.state === 'running';
}

/**
 * Check if the agent has been destroyed.
 */
export function isDestroyed(): boolean {
  return state.state === 'destroyed';
}

/**
 * Set the lifecycle state.
 */
export function setAgentState(newState: AgentState): void {
  state.state = newState;
  debug(`State changed: ${newState}`);
}

/**
 * Mark that a lock request has started.
 */
export function startLock(): boolean {
  if (state.lockInProgress) {
    debug('Lock already in progress, skipping');
    return false;
  }

  state.lockInProgress = true;
  state.lastLockAttempt = Date.now();
  state.lockAttempts++;
  state.state = 'locking';

  debug('Lock started');
  return true;
}

/**
 * Mark that a lock request has completed.
 */
export function endLock(): void {
  state.lockInProgress = false;
  if (state.state === 'locking') {
    state.state = 'running';
  }
  debug('Lock completed');
}

/**
 * Check if a lock is currently in progress.
 */
export function isLockInProgress(): boolean {
  return state.lockInProgress;
}

/**
 * Get the number of lock attempts.
 */
export function getLockAttempts(): number {
  return state.lockAttempts;
}

/**
 * Register a cleanup function to be called on destroy.
 */
export function registerCleanup(fn: () => void): void {
  state.cleanupFns.push(fn);
}

/**
 * Mark the agent as initialized.
 */
export function markInitialized(): void {
  state.initialized = true;
  state.state = 'running';
  debug('Agent initialized');
}

/**
 * Reset state to initial values (for testing or re-initialization).
 */
export function resetState(): void {
  // Call cleanup functions first
  for (const fn of state.cleanupFns) {
    try {
      fn();
    } catch {
      // Ignore cleanup errors
    }
  }

  state = { ...initialState };
  debug('State reset');
}

/**
 * Destroy the agent state and run cleanup.
 */
export function destroyState(): void {
  for (const fn of state.cleanupFns) {
    try {
      fn();
    } catch {
      // Ignore cleanup errors
    }
  }

  state = { ...initialState, state: 'destroyed', initialized: true };
  debug('Agent destroyed');
}

/**
 * Get the current cart state.
 */
export function getCartState(): CartState {
  return state.cartState;
}

/**
 * Update the cart state.
 */
export function setCartState(cartState: CartState): void {
  state.cartState = cartState;
  debug(`Cart state updated: ${cartState}`);
}

/**
 * Check if cart is currently empty.
 */
export function isCartEmpty(): boolean {
  return state.cartState === 'empty';
}

/**
 * Check if cart currently has items.
 */
export function hasCartItems(): boolean {
  return state.cartState === 'non-empty';
}
