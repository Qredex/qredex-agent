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
 * Unit tests for public lifecycle methods.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { getConfig, resetConfig } from '../../src/bootstrap/config.js';
import QredexAgent from '../../src/index.js';

describe('Public init', () => {
  beforeEach(() => {
    resetConfig();
    delete window.QredexAgentConfig;
  });

  it('should apply programmatic config via init()', () => {
    QredexAgent.init({
      debug: true,
      influenceIntentToken: '__qdx_custom_iit',
      purchaseIntentToken: '__qdx_custom_pit',
    });

    const config = getConfig();

    expect(config.debug).toBe(true);
    expect(config.influenceIntentToken).toBe('__qdx_custom_iit');
    expect(config.purchaseIntentToken).toBe('__qdx_custom_pit');
  });
});
