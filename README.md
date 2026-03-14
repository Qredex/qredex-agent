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

# Qredex Agent

**Deterministic browser runtime for Qredex intent capture, locking, and PIT handoff.**

[![CI](https://github.com/Qredex/qredex-agent/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Qredex/qredex-agent/actions/workflows/ci.yml)
[![Release](https://github.com/Qredex/qredex-agent/actions/workflows/release.yml/badge.svg)](https://github.com/Qredex/qredex-agent/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/%40qredex%2Fagent.svg)](https://www.npmjs.com/package/@qredex/agent)
[![bundle size](https://img.shields.io/bundlephobia/minzip/%40qredex%2Fagent)](https://bundlephobia.com/package/@qredex/agent)
[![license](https://img.shields.io/npm/l/%40qredex%2Fagent)](LICENSE)

---

## Quick Start

### 1. Choose an Install Path

**CDN / script tag**

```html
<!-- Add before </body> -->
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
```

**Dev CDN / local Core E2E**

```html
<script src="https://cdn.qredex.com/agent/dev/qredex-agent.iife.min.js"></script>
```

The `/dev/` script is engineer-only and always calls:

```text
http://127.0.0.1:8080/api/v1/agent/intents/lock
```

So it only makes sense when the page and the local Core service are running on
the same machine.

**Core package**

```bash
npm install @qredex/agent
```

**Framework wrappers**

```bash
npm install @qredex/react
npm install @qredex/vue
npm install @qredex/svelte
npm install @qredex/angular
```

The wrapper packages include `@qredex/agent`, so framework consumers only need the wrapper package.

### 2. Attribution Sequence

![Qredex attribution sequence](https://raw.githubusercontent.com/Qredex/qredex-agent/main/docs/diagrams/agent-attribution-sequence.svg?v=20260313-3)

The agent never adds to cart, removes items, or clears the merchant cart. The storefront owns cart state, checkout, and order submission; the agent only captures intent, locks IIT to PIT, and exposes PIT for backend attribution.

### 3. Connect Cart And Checkout

Your storefront owns cart mutations and order creation. Qredex only needs the
merchant-reported cart transition so it can lock IIT to PIT. After lock, the
merchant reads that PIT and carries it with the normal order payload to the
merchant backend or direct Qredex order ingestion path, where attribution is
resolved.

```javascript
const agent = window.QredexAgent;

async function addToCart(product) {
  // [Merchant] Snapshot the current cart before your platform changes it.
  const previousCount = cart.itemCount;

  // [Merchant] Perform the real cart mutation in your own backend/storefront.
  await api.post('/cart', product);

  // [Qredex] Report the cart transition after the merchant cart is updated.
  agent.handleCartChange({
    itemCount: cart.itemCount,
    previousCount,
  });
}

async function removeFromCart(line) {
  // [Merchant] Snapshot the current cart before your platform changes it.
  const previousCount = cart.itemCount;

  // [Merchant] Perform the real cart mutation in your own backend/storefront.
  await api.delete(`/cart/${line.id}`);

  // [Qredex] Report the new live cart state so attribution can stay in sync.
  agent.handleCartChange({
    itemCount: cart.itemCount,
    previousCount,
  });
}

async function clearCart() {
  // [Merchant] Clear the real cart in your own system first.
  await api.post('/cart/clear');

  // [Qredex] Clear IIT/PIT because the merchant cart is now empty.
  agent.handleCartEmpty();
}

async function checkout(order) {
  // [Qredex] Read the locked PIT that must travel with this order.
  const pit = agent.getPurchaseIntentToken();

  // [Merchant] Submit your normal order payload and include the PIT so the
  // backend can forward order + PIT into Qredex attribution ingestion.
  await api.post('/orders', {
    ...order,
    qredex_pit: pit,
  });

  // [Merchant + Qredex] Reuse the same clear path after checkout succeeds.
  await clearCart();
}
```

### 4. Done!

The agent automatically:
- ✅ Captures `qdx_intent` from URL
- ✅ Stores IIT in browser storage (sessionStorage + cookie fallback)
- ✅ Locks IIT → PIT when the merchant reports a non-empty cart and the state is lockable
- ✅ Clears PIT when the merchant reports that the cart became empty or checkout succeeds
- ✅ Exposes PIT so the merchant/backend can carry it into order attribution

### What Merchants Actually Call

| Merchant event | Call | Why |
|---|---|---|
| User lands from Qredex link | No manual call required | The agent captures `qdx_intent` automatically |
| Cart becomes non-empty | `handleCartChange({ itemCount, previousCount })` | Gives Qredex the live cart state so IIT can lock to PIT |
| Cart changes while still non-empty | `handleCartChange(...)` | Safe retry path on the next merchant-reported non-empty cart event if a previous lock failed |
| Clear cart action | `clearCart() -> handleCartEmpty()` | Clears IIT/PIT from the live session |
| Need PIT for order submission | `getPurchaseIntentToken()` | Attach PIT to the order or checkout payload |
| Checkout completes without a cart-empty step | `handlePaymentSuccess()` | Optional explicit cleanup path |

---

## What is Qredex Agent?

Qredex Agent is a **lightweight browser runtime** (~5KB minified) that:

1. **Captures** the `qdx_intent` token from URLs when users arrive via Qredex tracking links
2. **Stores** the token securely in browser storage (sessionStorage + cookie fallback)
3. **Locks** the token via Qredex API when the merchant reports a non-empty cart
4. **Owns** attribution state throughout the shopping session
5. **Exposes** the Purchase Intent Token (PIT) so the merchant/backend can carry it into order ingestion

Qredex is not a cart SDK or checkout SDK. The merchant owns commerce actions.
Qredex owns deterministic attribution state: capture IIT, lock IIT to PIT when
the merchant reports a real cart, then make PIT available for the order path.

### Key Features

- **Zero dependencies** - Pure vanilla JavaScript, works everywhere
- **Idempotent operations** - Safe to call multiple times
- **Retry on failure** - Automatically retries lock if it fails
- **Storage fallback** - Uses sessionStorage first, cookies as fallback

---

## API Reference

### Read Tokens

```javascript
// Get Influence Intent Token (IIT) - captured from URL
QredexAgent.getInfluenceIntentToken()     // string | null

// Get Purchase Intent Token (PIT) - locked via API
QredexAgent.getPurchaseIntentToken()      // string | null

// Check if IIT exists
QredexAgent.hasInfluenceIntentToken()     // boolean

// Check if PIT exists
QredexAgent.hasPurchaseIntentToken()      // boolean
```

### State Inspection

```javascript
// Get current attribution state (for debugging/inspection)
const state = QredexAgent.getState();
// Returns:
// {
//   hasIIT: boolean,
//   hasPIT: boolean,
//   iit: string | null,
//   pit: string | null,
//   cartState: 'empty' | 'non-empty',
//   locked: boolean,
//   timestamp: number
// }
```

### Event Handlers (Merchant → Agent)

Tell the agent when events happen:

```javascript
// Canonical path: report every cart count transition
QredexAgent.handleCartChange({
  itemCount: 1,
  previousCount: 0,
});

// Add one more item later
QredexAgent.handleCartChange({
  itemCount: 2,
  previousCount: 1,
});

// Remove one item but keep cart non-empty
QredexAgent.handleCartChange({
  itemCount: 1,
  previousCount: 2,
});

// Clear cart completely
QredexAgent.handleCartEmpty();

// Optional explicit cleanup if your platform does not emit a cart-empty step
QredexAgent.handlePaymentSuccess();
```

**Behavior:**

| Event | Example | Agent behavior |
|-------|---------|----------------|
| Empty cart becomes non-empty | empty cart -> 1 item | Attempts IIT -> PIT lock |
| Merchant reports a live non-empty cart again | 1 item -> 2 items | Attempts or retries IIT -> PIT lock if IIT exists and PIT is still absent |
| Partial remove | 2 items -> 1 item | No clear; attribution stays attached to the live cart |
| Full clear | non-empty cart -> empty cart | Clears IIT and PIT |
| Optional explicit post-payment clear | payment completed | Clears IIT and PIT |

### Event Listeners (Agent → Merchant)

Listen for agent events:

```javascript
// Listen for successful lock
QredexAgent.onLocked(({ purchaseToken, alreadyLocked, timestamp }) => {
  console.log('🔒 Locked:', purchaseToken);
  console.log('Already locked:', alreadyLocked);
});

// Listen for cleared state
QredexAgent.onCleared(({ timestamp }) => {
  console.log('🗑️ Cleared');
});

// Listen for errors
QredexAgent.onError(({ error, context }) => {
  console.error('❌ Error in', context, ':', error);
});

// Listen for attribution state changes (NEW)
QredexAgent.onStateChanged(({ hasIIT, hasPIT, locked, cartState }) => {
  console.log('State changed:', { hasIIT, hasPIT, locked, cartState });
});

// Listen for IIT capture (NEW)
QredexAgent.onIntentCaptured(({ timestamp }) => {
  console.log('✅ Intent captured at:', new Date(timestamp));
});
```

### Unregister Listeners

```javascript
const handler = ({ purchaseToken }) => {
  console.log('Locked:', purchaseToken);
};

QredexAgent.onLocked(handler);
// ... later
QredexAgent.offLocked(handler);

// Similarly for other listeners
QredexAgent.offCleared(handler);
QredexAgent.offError(handler);
QredexAgent.offStateChanged(handler);
QredexAgent.offIntentCaptured(handler);
```

### Manual Commands

```javascript
// Manual lock (idempotent - safe to call multiple times)
const result = await QredexAgent.lockIntent();

// Result type:
// { success: true, purchaseToken: 'pit_xxx', alreadyLocked: false }
// { success: false, purchaseToken: null, alreadyLocked: false, error: '...' }

// Clear intent state (after checkout or cart empty)
QredexAgent.clearIntent();
```

Pass `meta` only if you intentionally want to attach extra merchant context to the lock request.

### Lifecycle Methods

```javascript
// Initialize with custom config
// CDN/IIFE auto-starts on script load; ESM/framework usage should call init() in the browser.
QredexAgent.init({
  debug: true,
  useMockEndpoint: true,
});

// Check if initialized
QredexAgent.isInitialized();  // boolean

// Destroy agent and clean up listeners (for SPA route changes)
QredexAgent.destroy();

// Alias for destroy()
QredexAgent.stop();
```

---

## Installation

### CDN (Recommended)

```html
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
```

**Versioned URLs:**

```html
<!-- Auto-updates to latest v1.x.x -->
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>

<!-- Pinned version (immutable) -->
<script src="https://cdn.qredex.com/agent/v1.0.0/qredex-agent.iife.min.js"></script>
```

### NPM

```bash
npm install @qredex/agent
```

```javascript
// ESM import
import {
  handleCartChange,
  getPurchaseIntentToken,
  onLocked,
} from '@qredex/agent';

// Or default import
import QredexAgent from '@qredex/agent';

QredexAgent.init();
```

### Framework Wrappers

Thin framework adapters are available as separate packages:

```bash
npm install @qredex/react
npm install @qredex/vue
npm install @qredex/svelte
npm install @qredex/angular
```

Each wrapper stays thin, delegates runtime behavior to `@qredex/agent`, and brings the core agent with it. Install the wrapper inside its matching framework app.

---

## Configuration

Optional configuration via `window.QredexAgentConfig`. Set **before** the script loads:

```html
<script>
  window.QredexAgentConfig = {
    debug: true,
    useMockEndpoint: true,
  };
</script>
<script src="http://localhost:3000/dist/qredex-agent.iife.dev.min.js"></script>
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `debug` | boolean | `false` | Non-production logging. Forced to `false` in production |
| `useMockEndpoint` | boolean | `false` | ⚠️ **DEVELOPMENT ONLY** for merchant usage. Generates fake PIT tokens locally |

Production does not support runtime endpoint overrides, storage-key overrides, or mock mode. The production bundle always uses the built-in Qredex production lock endpoint and stable storage keys.

For real non-production network testing, build the bundle with `QREDEX_AGENT_LOCK_ENDPOINT` so the endpoint is baked into the staging/dev artifact instead of passed at runtime.

### ⚠️ Development-Only Mock Mode

```javascript
useMockEndpoint: true  // ⚠️ DEVELOPMENT ONLY
```

- Generates fake PIT tokens locally (no network calls)
- Only use for local development/testing
- Ignored in staging and production
- **Never rely on `useMockEndpoint` outside local development**

---

## Examples

### Quick Test

The fastest way to test Qredex Agent:

```bash
# Build the development IIFE bundle, start the local server, and open the test page
npm run example
```

If the browser does not open automatically:

```bash
open http://localhost:3000/examples/index.html
```

Then:
- Start with the featured CDN card
- Simulate intent URL by adding `?qdx_intent=test123` to the CDN page URL and pressing Enter
- Add to cart and watch PIT get locked
- Empty cart and watch PIT get cleared

**See:** [examples/README.md](examples/README.md) for complete example and testing scenarios.

### Vanilla JS

```javascript
const agent = window.QredexAgent;

async function reportCart(previousCount, itemCount) {
  // [Qredex] This is the one call that keeps attribution aligned with your cart.
  agent.handleCartChange({
    previousCount,
    itemCount,
  });
}

document.querySelector('.add-to-cart').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  const product = {
    id: button.dataset.productId,
    price: parseFloat(button.dataset.price),
  };
  // [Merchant] Capture the cart count before your mutation runs.
  const previousCount = cart.itemCount;

  // [Merchant] Add the item using your existing cart endpoint.
  await fetch('/api/cart', {
    method: 'POST',
    body: JSON.stringify(product),
  });

  // [Qredex] Tell Qredex what the cart count changed from and to.
  reportCart(previousCount, cart.itemCount);
});

document.querySelector('.remove-from-cart').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  const line = {
    id: button.dataset.lineId,
    productId: button.dataset.productId,
    price: parseFloat(button.dataset.price),
  };
  // [Merchant] Capture the cart count before your mutation runs.
  const previousCount = cart.itemCount;

  // [Merchant] Remove the item using your existing cart endpoint.
  await fetch(`/api/cart/${line.id}`, {
    method: 'DELETE',
  });

  // [Qredex] Report the resulting cart state back to the agent.
  reportCart(previousCount, cart.itemCount);
});

document.querySelector('.clear-cart').addEventListener('click', async () => {
  const previousCount = cart.itemCount;

  // [Merchant] Clear the real cart in your own system first.
  await fetch('/api/cart/clear', {
    method: 'POST',
  });

  // [Qredex] Report the empty-cart transition so attribution is cleared.
  reportCart(previousCount, 0);
});
```

## Error Handling

### Common Issues

#### Token Not Found

**Symptoms:** `getInfluenceIntentToken()` returns `null`

**Solutions:**
1. Check URL parameter is exactly `?qdx_intent=xxx`
2. Reload the page
3. Verify sessionStorage is available (not private browsing)
4. Check cookie fallback is working

#### Lock Fails Silently

**Symptoms:** Add to cart clicked but PIT not created

**Solutions:**
1. Check IIT exists: `QredexAgent.hasInfluenceIntentToken()`
2. Check Network tab for API errors
3. Verify CORS is configured on backend
4. Check error listener: `QredexAgent.onError(handler)`

#### Event Listeners Not Firing

**Symptoms:** Handlers registered but not called

**Solutions:**
1. Verify handler is registered before event occurs
2. Check handler function signature matches expected params
3. Ensure handler not unregistered accidentally

### Debug Mode

Enable debug logging in development, staging, or test:

```javascript
window.QredexAgentConfig = { debug: true };
```

Production always forces `debug` back to `false` and suppresses agent `debug`/`info`/`warn` console output.

**Example output:**
```
[QredexAgent] Intent token captured from URL
[QredexAgent] Cart change event received { itemCount: 1, previousCount: 0 }
[QredexAgent] Cart has items, IIT exists, no PIT - attempting lock
[QredexAgent] Sending lock request to: https://api.qredex.com/...
[QredexAgent] Intent locked successfully
[QredexAgent] Purchase token stored
```

### Check Storage

Open DevTools → Application → Storage:

**Session Storage:**
- `__qdx_iit` - IIT token
- `__qdx_pit` - PIT token

**Cookies:**
- `__qdx_iit` - IIT fallback
- `__qdx_pit` - PIT fallback

---

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | Latest |
| Firefox | Latest |
| Safari | Latest |
| Edge | Latest |

**Requirements:** ES2020+, sessionStorage, cookies enabled

---

## Documentation

| Document | Description |
|----------|-------------|
| **[Integration Model](docs/INTEGRATION_MODEL.md)** | Complete integration guide with 2 paths |
| **[API Reference](docs/API.md)** | Full API documentation |
| **[Cart Change Behavior](docs/CART_CHANGE_BEHAVIOR.md)** | handleCartChange() state transitions |
| **[Cart Empty Policy](docs/CART_EMPTY_POLICY.md)** | Attribution clearing rationale |
| **[Examples Guide](examples/README.md)** | Examples, local run flow, and testing scenarios |
| **[AGENTS.md](AGENTS.md)** | Development guidelines |

---

## Examples Directory

| Example | Description | Quick Start |
|---------|-------------|-------------|
| [examples/index.html](examples/index.html) | Example hub for CDN and wrapper pages | `npm run example` |
| [examples/cdn/index.html](examples/cdn/index.html) | Canonical script-tag customer path | Open from the hub |
| [examples/wrappers/react/index.html](examples/wrappers/react/index.html) | Real React app using `@qredex/react` | Open from the hub |
| [examples/wrappers/vue/index.html](examples/wrappers/vue/index.html) | Real Vue app using `@qredex/vue` | Open from the hub |
| [examples/wrappers/svelte/index.html](examples/wrappers/svelte/index.html) | Real Svelte app using `@qredex/svelte` | Open from the hub |
| [examples/wrappers/angular/index.html](examples/wrappers/angular/index.html) | Real Angular app using `@qredex/angular` | Open from the hub |

Each example includes:
- A focused integration path
- The same IIT/PIT cart scenario for behavior checks
- Real framework apps for React, Vue, Svelte, and Angular
- Debugging guide

**See:** [examples/README.md](examples/README.md) for detailed example and testing instructions.

---

## License

MIT

---

## Support

For questions: [support@qredex.com](mailto:support@qredex.com)
