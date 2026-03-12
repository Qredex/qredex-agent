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

  This file is part of the Qredex Agent SDK and is licensed under the MIT License. See LICENSE.
  Redistribution and use are permitted under that license.

  If you need additional information or have any questions, please email: copyright@qredex.com
-->

# Release

## NPM

```bash
npm run release:check
npm run publish:npm:dry-run
npm run publish:npm
```

`publish:npm` publishes in this order:

1. `@qredex/agent`
2. `@qredex/react`
3. `@qredex/vue`
4. `@qredex/svelte`
5. `@qredex/angular`

## CDN

```bash
npm run release:cdn
```

That prepares first-party CDN assets under:

- `release/agent/v<full-version>/`
- `release/agent/v<major>/`

Current production CDN asset:

- `qredex-agent.iife.min.js`
- `qredex-agent.iife.min.js.map`

## Checks

`release:check` verifies:

- tests pass
- builds succeed
- npm tarballs contain the expected files
- built package entrypoints expose the expected public exports
