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

/**
 * Build-time configuration policy for the Qredex Agent.
 */

export type AgentRuntimeEnvironment = 'development' | 'staging' | 'production' | 'test';

export interface AgentConfigPolicy {
  allowLockEndpointOverride: boolean;
  allowDebug: boolean;
  allowMockEndpoint: boolean;
}

export function getConfigPolicy(environment: AgentRuntimeEnvironment): AgentConfigPolicy {
  return {
    allowLockEndpointOverride: environment !== 'production',
    allowDebug: environment !== 'production',
    allowMockEndpoint: environment === 'development' || environment === 'test',
  };
}

export function getCurrentConfigPolicy(): AgentConfigPolicy {
  return getConfigPolicy(__QDX_ENV__);
}
