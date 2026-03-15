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

import {
  ENVIRONMENT_INITIALIZER,
  InjectionToken,
  inject,
  makeEnvironmentProviders,
  type EnvironmentProviders,
} from '@angular/core';
import CoreQredexAgent, { type AgentConfig } from '@qredex/agent';

function canUseBrowser(): boolean {
  return typeof window !== 'undefined';
}

export const QREDEX_AGENT = new InjectionToken<typeof CoreQredexAgent>('QREDEX_AGENT', {
  factory: () => CoreQredexAgent,
});

export function getQredexAgent(): typeof CoreQredexAgent {
  return CoreQredexAgent;
}

export function initQredex(config?: AgentConfig): typeof CoreQredexAgent {
  if (canUseBrowser() && (config !== undefined || !CoreQredexAgent.isInitialized())) {
    CoreQredexAgent.init(config);
  }

  return CoreQredexAgent;
}

export function provideQredexAgent(config?: AgentConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: QREDEX_AGENT,
      useValue: CoreQredexAgent,
    },
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        initQredex(config);
      },
    },
  ]);
}

/**
 * @deprecated Use provideQredexAgent() instead.
 */
export function provideQredex(config?: AgentConfig): EnvironmentProviders {
  return provideQredexAgent(config);
}

export function injectQredexAgent(): typeof CoreQredexAgent {
  return inject(QREDEX_AGENT);
}

export { CoreQredexAgent as QredexAgent };
export * from '@qredex/agent';
