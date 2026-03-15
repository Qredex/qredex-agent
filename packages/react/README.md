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

# `@qredex/react`

Thin React bindings for `@qredex/agent`.

[![CI](https://github.com/Qredex/qredex-agent/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Qredex/qredex-agent/actions/workflows/ci.yml)
[![Release](https://github.com/Qredex/qredex-agent/actions/workflows/release.yml/badge.svg)](https://github.com/Qredex/qredex-agent/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/%40qredex%2Freact.svg)](https://www.npmjs.com/package/@qredex/react)
[![license](https://img.shields.io/npm/l/%40qredex%2Freact)](LICENSE)

## Install

```bash
npm install @qredex/react
```

## Attribution Flow

![React wrapper attribution flow](https://raw.githubusercontent.com/Qredex/qredex-agent/main/docs/diagrams/wrapper-attribution-sequence.svg?v=20260313-3)

Call `useQredexAgent()`, then forward merchant cart state with `agent.handleCartChange(...)`, read the PIT with `agent.getPurchaseIntentToken()`, and clear attribution with `agent.handleCartEmpty()`. Only call `agent.handlePaymentSuccess()` if your platform has no cart-empty step after checkout.

## Merchant Integration Checklist

- Initialize the wrapper in the cart surface you already own
- Report every real merchant cart transition with `agent.handleCartChange(...)`
- Read PIT during checkout or order assembly
- Send `order + PIT` to your backend or direct ingestion path
- Clear attribution with `agent.handleCartEmpty()` or `agent.handlePaymentSuccess()`

## Recommended Integration

Use `useQredexAgent()` inside the cart surface you already own. The wrapper stays headless.
The merchant still owns cart APIs, totals, checkout, and order submission.
Qredex only needs the cart transition so the core runtime can lock IIT to PIT.
After lock, the merchant reads that PIT and carries it with the normal order
payload to the merchant backend or direct Qredex ingestion path.

```tsx
import { useEffect, useRef } from 'react';
import { useQredexAgent } from '@qredex/react';

type QredexCartBridgeProps = {
  itemCount: number;
};

export function QredexCartBridge({ itemCount }: QredexCartBridgeProps) {
  const { agent, state } = useQredexAgent();
  const previousCountRef = useRef(itemCount);

  useEffect(() => {
    // [Qredex] Report the cart transition after your merchant cart changes.
    agent.handleCartChange({
      itemCount,
      previousCount: previousCountRef.current,
    });

    // [Merchant] Keep your local snapshot ready for the next transition.
    previousCountRef.current = itemCount;
  }, [agent, itemCount]);

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
    const pit = state.pit ?? agent.getPurchaseIntentToken();

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

  return (
    <div>
      <span>Qredex status: {state.locked ? 'locked' : 'waiting'}</span>
      <button onClick={() => void clearCart()}>Clear cart</button>
      <button disabled={!state.hasPIT} onClick={() => void submitOrder()}>
        Send PIT to backend
      </button>
    </div>
  );
}
```

## What To Call When


| Merchant event                               | Call                                                   | Why                                                                                          |
| -------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Cart becomes non-empty                       | `agent.handleCartChange({ itemCount, previousCount })` | Gives Qredex the live cart state so IIT can lock to PIT                                      |
| Cart changes while still non-empty           | `agent.handleCartChange(...)`                          | Safe retry path on the next merchant-reported non-empty cart event if a previous lock failed |
| Clear cart action                            | `clearCart() -> agent.handleCartEmpty()`               | Clears IIT/PIT from the live session                                                         |
| Need PIT for order submission                | `state.pit` or `agent.getPurchaseIntentToken()`        | Attach PIT to the checkout payload                                                           |
| Checkout completes without a cart-empty step | `agent.handlePaymentSuccess()`                         | Optional explicit cleanup path                                                               |

## API Surface


| Export             | Use                                                        |
| ------------------ | ---------------------------------------------------------- |
| `useQredexAgent()` | Primary React hook. Returns`{ agent, state }`              |
| `useQredexState()` | State-only hook if you already have agent access elsewhere |
| `getQredexAgent()` | Direct access to the singleton runtime                     |
| `initQredex()`     | Explicit browser init when needed                          |
| `QredexAgent`      | Re-export of the core agent                                |
