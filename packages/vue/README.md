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

# `@qredex/vue`

Thin Vue bindings for `@qredex/agent`.

[![CI](https://github.com/Qredex/qredex-agent/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Qredex/qredex-agent/actions/workflows/ci.yml)
[![Release](https://github.com/Qredex/qredex-agent/actions/workflows/release.yml/badge.svg)](https://github.com/Qredex/qredex-agent/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/%40qredex%2Fvue.svg)](https://www.npmjs.com/package/@qredex/vue)
[![license](https://img.shields.io/npm/l/%40qredex%2Fvue)](LICENSE)

## Install

```bash
npm install @qredex/vue
```

## Attribution Flow

![Vue wrapper attribution flow](https://raw.githubusercontent.com/Qredex/qredex-agent/main/docs/diagrams/wrapper-attribution-sequence.svg?v=20260313-3)

Call `useQredexAgent()`, then forward merchant cart state with `agent.handleCartChange(...)`, read the PIT with `agent.getPurchaseIntentToken()`, and clear attribution with `agent.handleCartEmpty()`. Only call `agent.handlePaymentSuccess()` if your platform has no cart-empty step after checkout.

## Merchant Integration Checklist

- Register the plugin once in the browser app
- Report every real merchant cart transition with `agent.handleCartChange(...)`
- Read PIT during checkout or order assembly
- Send `order + PIT` to your backend or direct ingestion path
- Clear attribution with `agent.handleCartEmpty()` or `agent.handlePaymentSuccess()`

## Recommended Integration

Register the plugin once, then use `useQredexAgent()` inside the cart surface you already control.
The merchant still owns cart APIs, totals, checkout, and order submission.
Qredex only needs the cart transition so the core runtime can lock IIT to PIT.
After lock, the merchant reads that PIT and carries it with the normal order
payload to the merchant backend or direct Qredex ingestion path.

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
  // [Qredex] Report the cart transition after your merchant cart changes.
  agent.handleCartChange({
    itemCount: nextCount,
    previousCount: previousCount.value,
  });

  // [Merchant] Keep your local snapshot ready for the next transition.
  previousCount.value = nextCount;
}, { immediate: true });

async function clearCart() {
  // [Merchant] Clear the real cart in your own backend/storefront first.
  await fetch('/api/cart/clear', {
    method: 'POST',
  });

  // [Qredex] Clear attribution because the merchant cart is now empty.
  agent.handleCartEmpty();
}

async function submitOrder() {
  // [Qredex] Read PIT from wrapper state, with the core runtime as fallback.
  const pit = state.value.pit ?? agent.getPurchaseIntentToken();

  // [Merchant] Send the PIT as part of your normal order payload so the
  // backend can carry order + PIT into attribution ingestion.
  await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      orderId: 'order-123',
      qredex_pit: pit,
    }),
  });

  // [Merchant + Qredex] Reuse the same clear path after checkout succeeds.
  await clearCart();
}
</script>

<template>
  <div>
    <span>Qredex status: {{ state.locked ? 'locked' : 'waiting' }}</span>
    <button @click="clearCart">Clear cart</button>
    <button :disabled="!state.hasPIT" @click="submitOrder">
      Send PIT to backend
    </button>
  </div>
</template>
```

## What To Call When

| Merchant event | Call | Why |
|---|---|---|
| Cart becomes non-empty | `agent.handleCartChange({ itemCount, previousCount })` | Gives Qredex the live cart state so IIT can lock to PIT |
| Cart changes while still non-empty | `agent.handleCartChange(...)` | Safe retry path on the next merchant-reported non-empty cart event if a previous lock failed |
| Clear cart action | `clearCart() -> agent.handleCartEmpty()` | Clears IIT/PIT from the live session |
| Need PIT for order submission | `state.value.pit` or `agent.getPurchaseIntentToken()` | Attach PIT to the checkout payload |
| Checkout completes without a cart-empty step | `agent.handlePaymentSuccess()` | Optional explicit cleanup path |

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
