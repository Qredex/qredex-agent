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
import CoreQredexAgent from '../../src/index.js';
import { resetConfig } from '../../src/bootstrap/config.js';
import {
  getQredexAgent as getReactAgent,
  initQredex as initReactQredex,
  useQredexAgent as useReactQredexAgent,
  useQredexState,
} from '../../packages/react/src/index.ts';
import {
  QredexAgentKey,
  createQredexPlugin,
  getQredexAgent as getVueAgent,
  initQredex as initVueQredex,
  useQredex as useVueQredex,
  useQredexAgent as useVueQredexAgent,
} from '../../packages/vue/src/index.ts';
import {
  createQredexStateStore,
  getQredexAgent as getSvelteAgent,
  initQredex as initSvelteQredex,
  useQredex as useSvelteQredex,
  useQredexAgent as useSvelteQredexAgent,
} from '../../packages/svelte/src/index.ts';
import {
  QREDEX_AGENT,
  getQredexAgent as getAngularAgent,
  initQredex as initAngularQredex,
  provideQredex,
  provideQredexAgent,
} from '../../packages/angular/src/index.ts';

describe('Framework wrappers', () => {
  beforeEach(() => {
    resetConfig();
    delete window.QredexAgentConfig;
    CoreQredexAgent.destroy();
    CoreQredexAgent.clearIntent();
  });

  it('react wrapper initializes the core agent', () => {
    const agent = initReactQredex({ debug: true });

    expect(agent.isInitialized()).toBe(true);
    expect(getReactAgent().handleCartChange).toBe(agent.handleCartChange);
    expect(useReactQredexAgent).toEqual(expect.any(Function));
    expect(useQredexState).toEqual(expect.any(Function));
  });

  it('vue wrapper installs a plugin around the core agent', () => {
    const provide = vi.fn();
    const plugin = createQredexPlugin({ debug: true });

    plugin.install({ provide } as never);

    expect(initVueQredex().isInitialized()).toBe(true);
    expect(getVueAgent().handleCartChange).toBe(initVueQredex().handleCartChange);
    expect(provide.mock.calls[0][0]).toBe(QredexAgentKey);
    expect(provide.mock.calls[0][1]).toMatchObject({
      handleCartChange: expect.any(Function),
      init: expect.any(Function),
    });
    expect(useVueQredexAgent).toEqual(expect.any(Function));
    expect(useVueQredex).toEqual(expect.any(Function));
  });

  it('svelte wrapper creates a readable state store around the core agent', () => {
    const states: Array<ReturnType<typeof CoreQredexAgent.getState>> = [];
    const unsubscribe = createQredexStateStore({ debug: true }).subscribe((state) => {
      states.push(state);
    });

    expect(initSvelteQredex().isInitialized()).toBe(true);
    expect(getSvelteAgent().handleCartChange).toBe(initSvelteQredex().handleCartChange);
    expect(states.at(-1)).toMatchObject({
      locked: false,
      cartState: 'empty',
    });

    unsubscribe();
  });

  it('svelte wrapper exposes useQredexAgent as the primary composable', () => {
    const qredex = useSvelteQredexAgent({ debug: true });

    expect(qredex.agent.handleCartChange).toBe(useSvelteQredex({ debug: true }).agent.handleCartChange);
    expect(qredex.state.subscribe).toEqual(expect.any(Function));
  });

  it('angular wrapper exposes provider helpers around the core agent', () => {
    expect(initAngularQredex({ debug: true }).isInitialized()).toBe(true);
    expect(getAngularAgent().handleCartChange).toBe(initAngularQredex().handleCartChange);
    expect(provideQredexAgent()).toBeDefined();
    expect(provideQredex()).toBeDefined();
    expect(QREDEX_AGENT).toBeDefined();
  });
});
