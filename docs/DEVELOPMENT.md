<!--
    ▄▄▄▄
  ▄█▀▀███▄▄              █▄
  ██    ██ ▄             ██
  ██    ██ ████▄▄█▀█▄ ▄████ ▄█▀█▄▀██ ██▀
  ██  ▄ ██ ██   ██▄█▀ ██ ██ ██▄█▀  ███
   ▀█████▄▄█▀  ▄▀█▄▄▄▄█▀███▄▀█▄▄▄▄██ ██▄
        ▀█

  Copyright (C) 2026 — 2026, Qredex, LTD. All Rights Reserved.

  DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.

  Licensed under the Apache License, Version 2.0. See LICENSE for the full license text.
  You may not use this file except in compliance with that License.
  Unless required by applicable law or agreed to in writing, software distributed under the
  License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
  either express or implied. See the License for the specific language governing permissions
  and limitations under the License.

  If you need additional information or have any questions, please email: copyright@qredex.com
-->

# Development

Engineer-only guidance for local Core E2E, dev CDN usage, and sandbox work.

## Dev CDN Script

The dev CDN artifact is:

```html
<script src="https://cdn.qredex.com/agent/dev/qredex-agent.iife.min.js"></script>
```

It always calls this fixed lock endpoint:

```text
http://127.0.0.1:8080/api/v1/agent/intents/lock
```

That means it is only correct when:

1. the page is running on the same machine as the local Core service
2. the local Core service is listening on `127.0.0.1:8080`

## Same-Machine Local Core E2E

Use the dev CDN script when you want a browser/cart demo to exercise the real
local Core flow without rebuilding the agent bundle locally.

The canonical local engineer path is:

1. run the local Core service on `127.0.0.1:8080`
2. load the `/dev/` CDN script in the sandbox page
3. let the agent auto-init and auto-capture IIT
4. report merchant cart transitions normally with `handleCartChange(...)`
5. read PIT and send `order + PIT`

## Non-Production Alternatives

- Use `useMockEndpoint` only for local merchant-side UI work where no real Core
  lock request is needed.
- Use `staging` when you want a hosted non-production endpoint instead of local
  Core.

## Reminder

`localhost` and `127.0.0.1` are browser-machine local only. They are not a
shared cross-machine development contract.
