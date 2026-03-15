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

/**
 * Canonical runtime defaults shared across configuration and storage helpers.
 */

export const PRODUCTION_LOCK_ENDPOINT = 'https://api.qredex.com/api/v1/agent/intents/lock';
export const DEFAULT_LOCK_ENDPOINT =
  __QDX_ENV__ !== 'production' && __QDX_LOCK_ENDPOINT__.trim().length > 0
    ? __QDX_LOCK_ENDPOINT__
    : PRODUCTION_LOCK_ENDPOINT;
export const DEFAULT_INFLUENCE_INTENT_TOKEN_KEY = '__qdx_iit';
export const DEFAULT_PURCHASE_INTENT_TOKEN_KEY = '__qdx_pit';
export const DEFAULT_COOKIE_EXPIRE_DAYS = 30;
