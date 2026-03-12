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
 * Unit tests for public lifecycle methods.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { getConfig, resetConfig } from '../../src/bootstrap/config.js';
import QredexAgent from '../../src/index.js';

describe('Public init', () => {
  beforeEach(() => {
    resetConfig();
    delete window.QredexAgentConfig;
    QredexAgent.destroy();
  });

  it('should apply programmatic config via init()', () => {
    QredexAgent.init({
      debug: true,
    });

    const config = getConfig();

    expect(config.debug).toBe(true);
    expect(config.influenceIntentToken).toBe('__qdx_iit');
    expect(config.purchaseIntentToken).toBe('__qdx_pit');
    expect(QredexAgent.isInitialized()).toBe(true);
  });
});
