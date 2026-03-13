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
 *  Licensed under the MIT License. See LICENSE for the full license text.
 *  Redistribution and use are permitted under that license.
 *
 *  If you need additional information or have any questions, please email: copyright@qredex.com
 */

import { describe, expect, it } from 'vitest';
import { isMissingR2ObjectError } from '../../scripts/cdn-r2-utils.mjs';

describe('CDN R2 helpers', () => {
  it('treats the wrangler missing-key message as a missing object', () => {
    const output = `
Downloading "agent/releases.json" from "qredex-cdn".

✘ [ERROR] The specified key does not exist.
`;

    expect(isMissingR2ObjectError(output)).toBe(true);
  });

  it('does not treat unrelated wrangler failures as missing objects', () => {
    const output = '✘ [ERROR] Authentication failed.';

    expect(isMissingR2ObjectError(output)).toBe(false);
  });
});
