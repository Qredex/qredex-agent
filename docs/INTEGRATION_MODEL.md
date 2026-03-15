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

# Qredex Agent - Integration Guide

**Document Type:** Implementation Guide  
**Status:** Current  
**Version:** 1.1

---

## Overview

Qredex Agent is a deterministic browser runtime for attribution. It captures
IIT from the landing URL, locks IIT to PIT when the merchant reports a real
cart, and exposes PIT so the merchant can carry order + PIT into backend
attribution.

Qredex does **not** own cart logic, pricing, checkout, or order submission. The
merchant owns commerce actions. Qredex owns attribution state.

## Current Install Paths

| Path | Who | Setup |
|------|-----|-------|
| **CDN / core runtime** | Vanilla JS, script-tag installs, storefront-controlled integrations | Load the IIFE bundle or `@qredex/agent`, then report cart transitions |
| **Framework wrappers** | React, Vue, Svelte, Angular | Use the thin wrapper, which delegates to the same core runtime |

## Ownership Model

| Layer | Responsibility |
|-------|----------------|
| **Merchant storefront** | Cart mutations, cart counts, totals, checkout UX |
| **Qredex Agent** | Capture IIT, store tokens, lock IIT to PIT, expose PIT |
| **Merchant backend** | Submit the order payload and carry PIT with that order |
| **Qredex ingestion** | Resolve attribution from PIT + order |

## Philosophy

- Qredex is not a cart SDK.
- Qredex is not a checkout SDK.
- Wrapper packages stay headless and do not change attribution semantics.
- The merchant tells Qredex what happened; Qredex does not guess.
- PIT is created at lock time in the browser, then carried forward by the merchant order path.

## Complete User Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. USER LANDS ON SITE                                                  │
│    URL: https://store.com?qdx_intent=abc123                            │
│    → Agent captures IIT (Influence Intent Token)                       │
│    → Stores IIT in sessionStorage + cookie                             │
│    → Cleans URL (removes qdx_intent param)                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. USER ADDS FIRST ITEM TO CART                                        │
│    → Merchant calls: handleCartChange()                                │
│    → Agent locks IIT → PIT (Purchase Intent Token)                     │
│    → Stores PIT in sessionStorage + cookie                             │
│    → Clears IIT from storage (no longer needed)                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. USER CONTINUES SHOPPING                                             │
│    → Merchant keeps reporting live cart transitions                    │
│    → PIT already exists, so attribution stays attached to the cart     │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. USER CHECKS OUT                                                     │
│    → Merchant reads PIT: QredexAgent.getPurchaseIntentToken()          │
│    → Merchant backend receives order payload + PIT                     │
│    → Qredex ingestion resolves attribution from PIT + order            │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. CART IS EMPTIED OR CHECKOUT COMPLETES                               │
│    → Merchant calls handleCartEmpty() or handlePaymentSuccess()        │
│    → Agent clears attribution state                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Canonical Merchant Calls

| Merchant event | Call | Why |
|---|---|---|
| Shopper lands from Qredex link | No manual call required | Agent captures `qdx_intent` automatically |
| Cart becomes non-empty | `handleCartChange({ itemCount, previousCount })` | Gives Qredex the live cart state so IIT can lock to PIT |
| Cart changes while still non-empty | `handleCartChange(...)` | Safe retry path if a previous lock failed |
| Clear cart action | `handleCartEmpty()` | Clears IIT/PIT from the live session |
| Need PIT for order submission | `getPurchaseIntentToken()` | Read PIT and attach it to the order payload |
| Checkout completes without a cart-empty step | `handlePaymentSuccess()` | Optional explicit cleanup path |

## Example Integration Contract

```javascript
async function addToCart(product) {
  const previousCount = cart.itemCount;

  await api.post('/cart', product);

  QredexAgent.handleCartChange({
    itemCount: cart.itemCount,
    previousCount,
  });
}

async function submitOrder(order) {
  const pit = QredexAgent.getPurchaseIntentToken();

  await api.post('/orders', {
    ...order,
    qredex_pit: pit,
  });
}
```

## Recommended Path

Use the canonical cart transition flow. It is simpler, more deterministic, and
more supportable than parallel helper flows. Whether you install through the
CDN bundle, the core package, or a framework wrapper, the attribution contract
stays the same:

1. Merchant owns commerce state.
2. Qredex owns attribution state.
3. Merchant reads PIT and carries it with the order.
