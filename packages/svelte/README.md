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

  This is proprietary and confidential. Unauthorized copying, redistributing
  and/or modification of this file via any medium is inexorably prohibited.

  If you need additional information or have any questions, please email: copyright@qredex.com
-->

# @qredex/svelte

Thin Svelte bindings for `@qredex/agent`.

## Install

```bash
npm install @qredex/svelte @qredex/agent svelte
```

## Usage

```ts
import { createQredexStateStore, useQredex } from '@qredex/svelte';

const agent = useQredex();
const qredexState = createQredexStateStore();

agent.handleCartChange({ itemCount: 1, previousCount: 0 });
```
