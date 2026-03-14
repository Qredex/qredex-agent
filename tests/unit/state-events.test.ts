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

import { beforeEach, describe, expect, it, vi } from 'vitest';
import QredexAgent from '../../src/index.js';
import { getConfig, resetConfig } from '../../src/bootstrap/config.js';

describe('State change events', () => {
  beforeEach(() => {
    resetConfig();
    delete window.QredexAgentConfig;
    QredexAgent.destroy();
    QredexAgent.clearIntent();
  });

  it('emits state changes when merchant reports a non-empty cart before lock', () => {
    QredexAgent.init();

    const handler = vi.fn();
    QredexAgent.onStateChanged(handler);

    QredexAgent.handleCartChange({
      itemCount: 1,
      previousCount: 0,
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toMatchObject({
      cartState: 'non-empty',
      hasIIT: false,
      hasPIT: false,
      locked: false,
    });
  });

  it('clears attribution state when payment success is reported without payload', () => {
    QredexAgent.init();

    const config = getConfig();
    const cleared = vi.fn();

    sessionStorage.setItem(config.influenceIntentToken, 'iit_12345678');
    sessionStorage.setItem(config.purchaseIntentToken, 'pit_12345678');

    QredexAgent.onCleared(cleared);
    QredexAgent.handlePaymentSuccess();

    expect(QredexAgent.getInfluenceIntentToken()).toBeNull();
    expect(QredexAgent.getPurchaseIntentToken()).toBeNull();
    expect(cleared).toHaveBeenCalledTimes(1);
    expect(cleared.mock.calls[0][0]).toMatchObject({
      reason: 'payment_success',
      timestamp: expect.any(Number),
    });
  });

  it('emits manual_clear when clearIntent is called directly', () => {
    QredexAgent.init();

    const cleared = vi.fn();
    QredexAgent.onCleared(cleared);

    QredexAgent.clearIntent();

    expect(cleared).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'manual_clear',
        timestamp: expect.any(Number),
      })
    );
  });
});
