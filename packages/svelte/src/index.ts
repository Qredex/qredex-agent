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

import { onMount } from 'svelte';
import { readable, type Readable } from 'svelte/store';
import CoreQredexAgent, { type AgentConfig } from '@qredex/agent';

export type QredexState = ReturnType<typeof CoreQredexAgent.getState>;
export interface QredexComposable {
  agent: typeof CoreQredexAgent;
  state: Readable<QredexState>;
}

const SERVER_STATE: QredexState = {
  hasIIT: false,
  hasPIT: false,
  iit: null,
  pit: null,
  cartState: 'unknown',
  locked: false,
  timestamp: 0,
};

function canUseBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getQredexAgent(): typeof CoreQredexAgent {
  return CoreQredexAgent;
}

export function initQredex(config?: AgentConfig): typeof CoreQredexAgent {
  if (canUseBrowser()) {
    CoreQredexAgent.init(config);
  }

  return CoreQredexAgent;
}

export function useQredexAgent(config?: AgentConfig): typeof CoreQredexAgent {
  onMount(() => {
    initQredex(config);
  });

  return CoreQredexAgent;
}

export function createQredexStateStore(config?: AgentConfig): Readable<QredexState> {
  return readable<QredexState>(SERVER_STATE, (set) => {
    if (!canUseBrowser()) {
      return () => undefined;
    }

    initQredex(config);
    set(CoreQredexAgent.getState());

    const handler = () => {
      set(CoreQredexAgent.getState());
    };

    CoreQredexAgent.onStateChanged(handler);

    return () => {
      CoreQredexAgent.offStateChanged(handler);
    };
  });
}

export function useQredex(config?: AgentConfig): QredexComposable {
  return {
    agent: useQredexAgent(config),
    state: createQredexStateStore(config),
  };
}

export { CoreQredexAgent as QredexAgent };
export * from '@qredex/agent';
