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

# @qredex/angular

Thin Angular bindings for `@qredex/agent`.

[![CI](https://github.com/Qredex/qredex-agent/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Qredex/qredex-agent/actions/workflows/ci.yml)
[![Release](https://github.com/Qredex/qredex-agent/actions/workflows/release.yml/badge.svg)](https://github.com/Qredex/qredex-agent/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/%40qredex%2Fangular.svg)](https://www.npmjs.com/package/@qredex/angular)
[![license](https://img.shields.io/npm/l/%40qredex%2Fangular)](LICENSE)

## Install

```bash
npm install @qredex/angular
```

## Attribution Flow

![Angular wrapper attribution flow](https://raw.githubusercontent.com/Qredex/qredex-agent/main/docs/diagrams/angular-attribution-sequence.svg?v=20260313-3)

Call `provideQredexAgent()` once at bootstrap, get the runtime with `injectQredexAgent()`, then forward merchant cart state with `agent.handleCartChange(...)`, read the PIT with `agent.getPurchaseIntentToken()`, and clear attribution with `agent.handleCartEmpty()`. Only call `agent.handlePaymentSuccess()` if your platform has no cart-empty step after checkout.

## Merchant Integration Checklist

- Register `provideQredexAgent()` once at bootstrap
- Report every real merchant cart transition with `agent.handleCartChange(...)`
- Read PIT during checkout or order assembly
- Send `order + PIT` to your backend or direct ingestion path
- Clear attribution with `agent.handleCartEmpty()` or `agent.handlePaymentSuccess()`

## Recommended Integration

Register `provideQredexAgent()` once, then call `injectQredexAgent()` inside the existing cart surface you already control.
The merchant still owns cart APIs, totals, checkout, and order submission.
Qredex only needs the cart transition so the core runtime can lock IIT to PIT.
After lock, the merchant reads that PIT and carries it with the normal order
payload to the merchant backend or direct Qredex ingestion path.

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { Component, Input, OnChanges } from '@angular/core';
import { injectQredexAgent, provideQredexAgent } from '@qredex/angular';

bootstrapApplication(AppComponent, {
  providers: [
    provideQredexAgent(),
  ],
});

@Component({
  selector: 'qredex-cart-bridge',
  standalone: true,
  template: `
    <span>Qredex status: {{ agent.hasPurchaseIntentToken() ? 'locked' : 'waiting' }}</span>
    <button (click)="clearCart()">Clear cart</button>
    <button [disabled]="!agent.hasPurchaseIntentToken()" (click)="submitOrder()">
      Send PIT to backend
    </button>
  `,
})
export class QredexCartBridgeComponent implements OnChanges {
  @Input() itemCount = 0;

  private previousCount = 0;
  readonly agent = injectQredexAgent();

  ngOnChanges(): void {
    // [Qredex] Report the cart transition after your merchant cart changes.
    this.agent.handleCartChange({
      itemCount: this.itemCount,
      previousCount: this.previousCount,
    });

    // [Merchant] Keep your local snapshot ready for the next transition.
    this.previousCount = this.itemCount;
  }

  async clearCart(): Promise<void> {
    // [Merchant] Clear the real cart in your own backend/storefront first.
    await fetch('/api/cart/clear', {
      method: 'POST',
    });

    // [Qredex] Clear attribution because the merchant cart is now empty.
    this.agent.handleCartEmpty();
  }

  async submitOrder(): Promise<void> {
    // [Qredex] Read PIT from the core runtime before checkout.
    const pit = this.agent.getPurchaseIntentToken();

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
    await this.clearCart();
  }
}
```

## What To Call When

| Merchant event | Call | Why |
|---|---|---|
| App bootstrap | `provideQredexAgent()` | Makes the agent available to Angular surfaces |
| Cart becomes non-empty | `agent.handleCartChange({ itemCount, previousCount })` | Gives Qredex the live cart state so IIT can lock to PIT |
| Cart changes while still non-empty | `agent.handleCartChange(...)` | Safe retry path on the next merchant-reported non-empty cart event if a previous lock failed |
| Clear cart action | `clearCart() -> agent.handleCartEmpty()` | Clears IIT/PIT from the live session |
| Need PIT for order submission | `agent.getPurchaseIntentToken()` | Attach PIT to the checkout payload |
| Checkout completes without a cart-empty step | `agent.handlePaymentSuccess()` | Optional explicit cleanup path |

## API Surface

| Export | Use |
|---|---|
| `provideQredexAgent()` | Primary Angular bootstrap helper |
| `provideQredex()` | Deprecated alias for `provideQredexAgent()` |
| `injectQredexAgent()` | Primary Angular injection helper |
| `getQredexAgent()` | Direct access to the singleton runtime |
| `initQredex()` | Explicit browser init when needed |
| `QREDEX_AGENT` | Angular injection token |
| `QredexAgent` | Re-export of the core agent |
