/**
 * Unit tests for state management.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getState,
  getAgentState,
  setAgentState,
  startLock,
  endLock,
  isLockInProgress,
  getLockAttempts,
  registerCleanup,
  markInitialized,
  resetState,
  destroyState,
  isRunning,
  isDestroyed,
} from '../../src/core/state.js';

describe('State Management', () => {
  beforeEach(() => {
    resetState();
  });

  it('should start with initial state', () => {
    const state = getState();

    expect(state.state).toBe('idle');
    expect(state.lockInProgress).toBe(false);
    expect(state.initialized).toBe(false);
    expect(state.lockAttempts).toBe(0);
  });

  it('should change agent state', () => {
    setAgentState('running');
    expect(getAgentState()).toBe('running');

    setAgentState('locking');
    expect(getAgentState()).toBe('locking');
  });

  it('should track lock in progress', () => {
    expect(startLock()).toBe(true);
    expect(isLockInProgress()).toBe(true);
    expect(getAgentState()).toBe('locking');

    // Second start should fail
    expect(startLock()).toBe(false);

    endLock();
    expect(isLockInProgress()).toBe(false);
  });

  it('should track lock attempts', () => {
    startLock();
    endLock();
    expect(getLockAttempts()).toBe(1);

    startLock();
    endLock();
    expect(getLockAttempts()).toBe(2);
  });

  it('should register and run cleanup functions', () => {
    let cleanupCalled = false;
    registerCleanup(() => {
      cleanupCalled = true;
    });

    destroyState();
    expect(cleanupCalled).toBe(true);
  });

  it('should mark as initialized', () => {
    expect(getState().initialized).toBe(false);

    markInitialized();

    expect(getState().initialized).toBe(true);
    expect(isRunning()).toBe(true);
  });

  it('should reset state', () => {
    markInitialized();
    startLock();
    endLock();

    resetState();

    expect(getAgentState()).toBe('idle');
    expect(getState().initialized).toBe(false);
    expect(getLockAttempts()).toBe(0);
  });

  it('should destroy state', () => {
    markInitialized();
    destroyState();

    expect(isDestroyed()).toBe(true);
    expect(getAgentState()).toBe('destroyed');
  });
});
