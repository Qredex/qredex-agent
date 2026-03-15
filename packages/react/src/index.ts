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
 *  Licensed under the Apache License, Version 2.0. See LICENSE for the full license text.
 *  You may not use this file except in compliance with that License.
 *  Unless required by applicable law or agreed to in writing, software distributed under the
 *  License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 *  either express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 *
 *  If you need additional information or have any questions, please email: copyright@qredex.com
 */

import { useEffect, useState } from 'react';
import CoreQredexAgent, { type AgentConfig } from '@qredex/agent';

export type QredexState = ReturnType<typeof CoreQredexAgent.getState>;
export interface QredexComposable {
  agent: typeof CoreQredexAgent;
  state: QredexState;
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

export function useQredexState(config?: AgentConfig): QredexState {
  const [state, setState] = useState<QredexState>(() => {
    if (!canUseBrowser()) {
      return SERVER_STATE;
    }

    return CoreQredexAgent.getState();
  });

  useEffect(() => {
    if (!canUseBrowser()) {
      return;
    }

    initQredex(config);
    setState(CoreQredexAgent.getState());

    const handler = () => {
      setState(CoreQredexAgent.getState());
    };

    CoreQredexAgent.onStateChanged(handler);

    return () => {
      CoreQredexAgent.offStateChanged(handler);
    };
  }, []);

  return state;
}

export function useQredexAgent(config?: AgentConfig): QredexComposable {
  return {
    agent: CoreQredexAgent,
    state: useQredexState(config),
  };
}

export { CoreQredexAgent as QredexAgent };
export * from '@qredex/agent';
