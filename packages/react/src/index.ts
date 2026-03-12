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

import { useEffect, useSyncExternalStore } from 'react';
import CoreQredexAgent, { type AgentConfig } from '@qredex/agent';

export type QredexState = ReturnType<typeof CoreQredexAgent.getState>;
export interface QredexComposable {
  agent: typeof CoreQredexAgent;
  state: QredexState;
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

function subscribe(onStoreChange: () => void): () => void {
  const handler = () => {
    onStoreChange();
  };

  CoreQredexAgent.onStateChanged(handler);

  return () => {
    CoreQredexAgent.offStateChanged(handler);
  };
}

function getSnapshot(): QredexState {
  return CoreQredexAgent.getState();
}

function getServerSnapshot(): QredexState {
  return SERVER_STATE;
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

export function useQredexState(config?: AgentConfig): QredexState {
  useEffect(() => {
    initQredex(config);
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useQredexAgent(config?: AgentConfig): QredexComposable {
  return {
    agent: CoreQredexAgent,
    state: useQredexState(config),
  };
}

export { CoreQredexAgent as QredexAgent };
export * from '@qredex/agent';
