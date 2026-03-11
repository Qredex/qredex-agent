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
 * Unit tests for logger policy.
 */

import { describe, expect, it, vi } from 'vitest';
import { debug, getLogPolicy, info, setDebugMode, warn } from '../../src/utils/log.js';

describe('Logger policy', () => {
  it('should suppress debug and info until debug mode is enabled in test', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    setDebugMode(false);
    debug('debug message');
    info('info message');
    warn('warn message');

    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);

    setDebugMode(true);
    debug('debug message');
    info('info message');

    expect(debugSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledTimes(1);
  });

  it('should force agent diagnostics off in production', () => {
    expect(getLogPolicy('production', false)).toEqual({
      debug: false,
      info: false,
      warn: false,
      error: true,
    });

    expect(getLogPolicy('production', true)).toEqual({
      debug: false,
      info: false,
      warn: false,
      error: true,
    });
  });
});
