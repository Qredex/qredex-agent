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

# @qredex/vue

Thin Vue bindings for `@qredex/agent`.

## Install

```bash
npm install @qredex/vue
```

## Recommended Integration

Register the plugin once, then use `useQredexAgent()` inside the cart surface you already control.

```ts
// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { createQredexPlugin } from '@qredex/vue';

const app = createApp(App);
app.use(createQredexPlugin());
app.mount('#app');
```

```vue
<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQredexAgent } from '@qredex/vue';

const { agent, state } = useQredexAgent();
const itemCount = ref(0);
const previousCount = ref(0);

watch(itemCount, (nextCount) => {
  agent.handleCartChange({
    itemCount: nextCount,
    previousCount: previousCount.value,
  });

  previousCount.value = nextCount;
}, { immediate: true });
</script>

<template>
  <div>
    <span>Qredex status: {{ state.locked ? 'locked' : 'waiting' }}</span>
    <button
      :disabled="!state.hasPIT"
      @click="agent.handlePaymentSuccess({
        orderId: 'order-123',
        amount: 99.99,
        currency: 'USD',
      })"
    >
      Complete checkout
    </button>
  </div>
</template>
```

## What To Call When

| Merchant event | Call | Why |
|---|---|---|
| Cart becomes non-empty | `agent.handleCartChange({ itemCount, previousCount })` | Gives Qredex the live cart state so IIT can lock to PIT |
| Cart stays non-empty and changes again | `agent.handleCartChange(...)` | Safe retry path if a previous lock failed |
| Cart becomes empty | `agent.handleCartChange({ itemCount: 0, previousCount })` | Clears IIT/PIT from the live session |
| Checkout succeeds | `agent.handlePaymentSuccess({ orderId, amount, currency })` | Clears attribution state after a completed purchase |
| Need PIT for order submission | `state.value.pit` or `agent.getPurchaseIntentToken()` | Attach PIT to the checkout payload |

## API Surface

| Export | Use |
|---|---|
| `createQredexPlugin()` | Registers the core agent in the Vue app |
| `useQredexAgent()` | Primary Vue composable. Returns `{ agent, state }` |
| `useQredex()` | Deprecated alias for `useQredexAgent()` |
| `useInjectedQredexAgent()` | Direct access to the injected agent |
| `getQredexAgent()` | Direct access to the singleton runtime |
| `initQredex()` | Explicit browser init when needed |
| `QredexAgent` | Re-export of the core agent |

## Attribution Flow

```text
User lands with ?qdx_intent=...
  -> Qredex captures IIT
  -> Vue cart surface reports itemCount changes
  -> handleCartChange() sees non-empty cart + IIT
  -> Qredex locks IIT -> PIT
  -> state.value.hasPIT/state.value.locked become true
  -> checkout uses PIT
  -> handlePaymentSuccess() clears attribution state
```
