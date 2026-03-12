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

import { beforeEach, describe, expect, it, vi } from 'vitest';
import QredexAgent from '../../src/index.js';
import { resetConfig } from '../../src/bootstrap/config.js';

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
});
