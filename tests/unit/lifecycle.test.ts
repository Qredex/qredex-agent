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
