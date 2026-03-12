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

# @qredex/react

Thin React bindings for `@qredex/agent`.

## Install

```bash
npm install @qredex/react
```

## Usage

```tsx
import { useQredexAgent, useQredexState } from '@qredex/react';

function CartBridge() {
  const agent = useQredexAgent();
  const state = useQredexState();

  return (
    <button
      onClick={() => {
        agent.handleCartChange({ itemCount: 1, previousCount: 0 });
      }}
    >
      {state.locked ? 'Locked' : 'Lock on first non-empty cart report'}
    </button>
  );
}
```
