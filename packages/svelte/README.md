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

# @qredex/svelte

Thin Svelte bindings for `@qredex/agent`.

## Install

```bash
npm install @qredex/svelte
```

## Recommended Integration

Use `useQredexAgent()` inside the existing cart surface you already own. The wrapper stays headless.

```svelte
<script lang="ts">
  import { useQredexAgent } from '@qredex/svelte';

  export let itemCount = 0;

  const { agent, state } = useQredexAgent();
  let previousCount = itemCount;

  $: if (itemCount !== previousCount) {
    agent.handleCartChange({
      itemCount,
      previousCount,
    });

    previousCount = itemCount;
  }

  function completeCheckout() {
    agent.handlePaymentSuccess({
      orderId: 'order-123',
      amount: 99.99,
      currency: 'USD',
    });
  }
</script>

<div>
  <span>Qredex status: {$state.locked ? 'locked' : 'waiting'}</span>
  <button disabled={!$state.hasPIT} on:click={completeCheckout}>
    Complete checkout
  </button>
</div>
```

## What To Call When

| Merchant event | Call | Why |
|---|---|---|
| Cart becomes non-empty | `agent.handleCartChange({ itemCount, previousCount })` | Gives Qredex the live cart state so IIT can lock to PIT |
| Cart stays non-empty and changes again | `agent.handleCartChange(...)` | Safe retry path if a previous lock failed |
| Cart becomes empty | `agent.handleCartChange({ itemCount: 0, previousCount })` | Clears IIT/PIT from the live session |
| Checkout succeeds | `agent.handlePaymentSuccess({ orderId, amount, currency })` | Clears attribution state after a completed purchase |
| Need PIT for order submission | `$state.pit` or `agent.getPurchaseIntentToken()` | Attach PIT to the checkout payload |

## API Surface

| Export | Use |
|---|---|
| `useQredexAgent()` | Primary Svelte composable. Returns `{ agent, state }` |
| `useQredex()` | Deprecated alias for `useQredexAgent()` |
| `createQredexStateStore()` | State store only, without the convenience composable |
| `getQredexAgent()` | Direct access to the singleton runtime |
| `initQredex()` | Explicit browser init when needed |
| `QredexAgent` | Re-export of the core agent |

## Attribution Flow

```text
User lands with ?qdx_intent=...
  -> Qredex captures IIT
  -> Svelte cart surface reports itemCount changes
  -> handleCartChange() sees non-empty cart + IIT
  -> Qredex locks IIT -> PIT
  -> $state.hasPIT/$state.locked become true
  -> checkout uses PIT
  -> handlePaymentSuccess() clears attribution state
```
