/**
 * Unit tests for lifecycle.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { init, destroy, isInitialized, getStatus, reset } from '../../src/core/lifecycle.js';

describe('Lifecycle', () => {
  beforeEach(() => {
    destroy();
    reset();
    vi.clearAllMocks();
  });

  it('should initialize the agent', () => {
    init({ debug: true });
    expect(isInitialized()).toBe(true);
  });

  it('should get status', () => {
    const statusBefore = getStatus();
    expect(statusBefore.initialized).toBe(false);

    init();

    const statusAfter = getStatus();
    expect(statusAfter.initialized).toBe(true);
    expect(statusAfter.running).toBe(true);
  });

  it('should destroy the agent', () => {
    init();
    expect(isInitialized()).toBe(true);

    destroy();

    expect(isInitialized()).toBe(false);
  });

  it('should prevent duplicate initialization', () => {
    init();
    // Should not throw
    init();
  });

  it('should reset the agent', () => {
    init();
    reset();

    expect(isInitialized()).toBe(false);
  });
});
