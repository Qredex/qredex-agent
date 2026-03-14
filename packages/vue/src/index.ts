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

import {
  inject,
  onMounted,
  onUnmounted,
  readonly,
  shallowRef,
  type App,
  type InjectionKey,
  type ShallowRef,
} from 'vue';
import CoreQredexAgent, { type AgentConfig } from '@qredex/agent';

export type QredexState = ReturnType<typeof CoreQredexAgent.getState>;
export interface QredexComposable {
  agent: typeof CoreQredexAgent;
  state: Readonly<ShallowRef<QredexState>>;
}

const SERVER_STATE: QredexState = {
  initialized: false,
  lifecycleState: 'idle',
  lockInProgress: false,
  lockAttempts: 0,
  hasIIT: false,
  hasPIT: false,
  iit: null,
  pit: null,
  cartState: 'unknown',
  locked: false,
  timestamp: 0,
};

export const QredexAgentKey: InjectionKey<typeof CoreQredexAgent> = Symbol('QredexAgent');

function canUseBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getQredexAgent(): typeof CoreQredexAgent {
  return CoreQredexAgent;
}

export function initQredex(config?: AgentConfig): typeof CoreQredexAgent {
  if (canUseBrowser() && (config !== undefined || !CoreQredexAgent.isInitialized())) {
    CoreQredexAgent.init(config);
  }

  return CoreQredexAgent;
}

export function createQredexPlugin(config?: AgentConfig): { install(app: App): void } {
  return {
    install(app: App) {
      initQredex(config);
      app.provide(QredexAgentKey, CoreQredexAgent);
    },
  };
}

export function useInjectedQredexAgent(): typeof CoreQredexAgent {
  return inject(QredexAgentKey, CoreQredexAgent);
}

export function useQredexAgent(config?: AgentConfig): QredexComposable {
  const state = shallowRef<QredexState>(SERVER_STATE);
  let unsubscribe = () => undefined;

  onMounted(() => {
    initQredex(config);
    state.value = CoreQredexAgent.getState();

    const handler = () => {
      state.value = CoreQredexAgent.getState();
    };

    CoreQredexAgent.onStateChanged(handler);
    unsubscribe = () => {
      CoreQredexAgent.offStateChanged(handler);
    };
  });

  onUnmounted(() => {
    unsubscribe();
  });

  return {
    agent: CoreQredexAgent,
    state: readonly(state),
  };
}

/**
 * @deprecated Use useQredexAgent() instead.
 */
export function useQredex(config?: AgentConfig): QredexComposable {
  return useQredexAgent(config);
}

export { CoreQredexAgent as QredexAgent };
export * from '@qredex/agent';
