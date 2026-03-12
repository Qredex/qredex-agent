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

/* @vitest-environment node */

import { describe, expect, it } from 'vitest';

describe('Node-safe import', () => {
  it('imports and initializes without browser globals', async () => {
    const module = await import('../../src/index.js');

    expect(module.default).toBe(module.QredexAgent);
    expect(module.isInitialized()).toBe(false);

    module.init({ debug: true });

    expect(module.isInitialized()).toBe(true);

    module.destroy();
    expect(module.isInitialized()).toBe(false);
  });
});
