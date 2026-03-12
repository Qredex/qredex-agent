# Qredex Agent

**Lightweight browser agent for Qredex intent capture and locking.**

[![npm version](https://img.shields.io/npm/v/%40qredex%2Fagent.svg)](https://www.npmjs.com/package/@qredex/agent)
[![bundle size](https://img.shields.io/bundlephobia/minzip/%40qredex%2Fagent)](https://bundlephobia.com/package/@qredex/agent)
[![license](https://img.shields.io/npm/l/%40qredex%2Fagent)](LICENSE)

---

## Quick Start

### 1. Install via Script Tag

```html
<!-- Add before </body> -->
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
```

### 2. Handle Cart Events

```javascript
const agent = window.QredexAgent;

async function addToCart(product) {
  const previousCount = cart.itemCount;
  await api.post('/cart', product);

  agent.handleCartChange({
    itemCount: cart.itemCount,
    previousCount,
    meta: {
      productId: product.id,
      quantity: product.quantity,
      price: product.price,
    },
  });
}

async function removeFromCart(line) {
  const previousCount = cart.itemCount;
  await api.delete(`/cart/${line.id}`);

  agent.handleCartChange({
    itemCount: cart.itemCount,
    previousCount,
    meta: {
      productId: line.productId,
      quantity: -1,
      price: line.price,
    },
  });
}

async function clearCart() {
  const previousCount = cart.itemCount;
  await api.post('/cart/clear');

  agent.handleCartChange({
    itemCount: 0,
    previousCount,
  });
}

async function checkout(order) {
  const pit = agent.getPurchaseIntentToken();

  await api.post('/orders', {
    ...order,
    qredex_pit: pit,
  });

  agent.handlePaymentSuccess({
    orderId: order.id,
    amount: order.total,
    currency: 'USD',
  });
}
```

### 3. Done!

The agent automatically:
- ✅ Captures `qdx_intent` from URL
- ✅ Stores IIT in browser storage (sessionStorage + cookie fallback)
- ✅ Locks IIT → PIT when the merchant reports a non-empty cart and the state is lockable
- ✅ Clears PIT when the merchant reports that the cart became empty or checkout succeeds
- ✅ Exposes PIT for checkout

---

## What is Qredex Agent?

Qredex Agent is a **lightweight browser runtime** (~5KB minified) that:

1. **Captures** the `qdx_intent` token from URLs when users arrive via Qredex tracking links
2. **Stores** the token securely in browser storage (sessionStorage + cookie fallback)
3. **Locks** the token via Qredex API when the merchant reports a non-empty cart
4. **Manages** attribution state throughout the shopping session
5. **Exposes** the Purchase Intent Token (PIT) for checkout

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
  meta: {
    productId: 'widget-001',
    quantity: 1,
    price: 99.99,
  },
});

// Add one more item later
QredexAgent.handleCartChange({
  itemCount: 2,
  previousCount: 1,
  meta: {
    productId: 'widget-001',
    quantity: 1,
    price: 99.99,
  },
});

// Remove one item but keep cart non-empty
QredexAgent.handleCartChange({
  itemCount: 1,
  previousCount: 2,
  meta: {
    productId: 'widget-001',
    quantity: -1,
    price: 99.99,
  },
});

// Clear cart completely
QredexAgent.handleCartChange({
  itemCount: 0,
  previousCount: 1,
});

// Optional convenience wrappers
QredexAgent.handleCartAdd(1, {
  productId: 'widget-001',
  quantity: 1,
  price: 99.99,
});

QredexAgent.handleCartEmpty();

QredexAgent.handlePaymentSuccess({
  orderId: 'order-123',
  amount: 99.99,
  currency: 'USD',
});
```

**Behavior:**

| Event | Example | Agent behavior |
|-------|---------|----------------|
| Empty cart becomes non-empty | empty cart -> 1 item | Attempts IIT -> PIT lock |
| Merchant reports a live non-empty cart again | 1 item -> 2 items | Attempts or retries IIT -> PIT lock if IIT exists and PIT is still absent |
| Partial remove | 2 items -> 1 item | No clear; attribution stays attached to the live cart |
| Full clear | non-empty cart -> empty cart | Clears IIT and PIT |
| Checkout success | payment completed | Clears IIT and PIT |

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
const result = await QredexAgent.lockIntent({
  productId: 'widget-001',
  quantity: 2,
  price: 99.99,
  // ... any other key-value pairs
});

// Result type:
// { success: true, purchaseToken: 'pit_xxx', alreadyLocked: false }
// { success: false, purchaseToken: null, alreadyLocked: false, error: '...' }

// Clear intent state (after checkout or cart empty)
QredexAgent.clearIntent();
```

### Lifecycle Methods

```javascript
// Initialize with custom config
// CDN/IIFE auto-starts on script load; ESM/framework usage should call init() in the browser.
QredexAgent.init({
  debug: true,
  lockEndpoint: 'https://staging.your-backend.com/api/v1/agent/intents/lock',
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

---

## Configuration

Optional configuration via `window.QredexAgentConfig`. Set **before** the script loads:

```html
<script>
  window.QredexAgentConfig = {
    debug: true,                     // Non-production only
    lockEndpoint: '/api/v1/agent/intents/lock', // Same-origin staging/dev only
    useMockEndpoint: true,           // ⚠️ DEV/TEST ONLY: mock PIT tokens
    influenceIntentToken: '__qdx_iit',  // IIT storage key
    purchaseIntentToken: '__qdx_pit',   // PIT storage key
    cookieExpireDays: 30,            // Cookie expiration in days
  };
</script>
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `debug` | boolean | `false` | Non-production logging. Forced to `false` in production |
| `lockEndpoint` | string | `'https://api.qredex.com/api/v1/agent/intents/lock'` | Controlled non-production override. Ignored in production |
| `useMockEndpoint` | boolean | `false` | ⚠️ **DEV/TEST ONLY** - Generate fake PIT tokens locally |
| `influenceIntentToken` | string | `'__qdx_iit'` | Stable IIT storage key. Override only for advanced integrations |
| `purchaseIntentToken` | string | `'__qdx_pit'` | Stable PIT storage key. Override only for advanced integrations |
| `cookieExpireDays` | number | `30` | Cookie expiration in days |

### ⚠️ Mock Endpoint Warning

```javascript
useMockEndpoint: true  // ⚠️ DEVELOPMENT ONLY
```

- Generates fake PIT tokens locally (no network calls)
- Only use for local development/testing
- Ignored outside development/test builds
- **Never rely on `useMockEndpoint` in staging or production**

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
- Simulate intent URL by adding `?qdx_intent=test123` to the URL and pressing Enter
- Add to cart and watch PIT get locked
- Clear cart and watch PIT get cleared

**See:** [examples/TESTING.md](examples/TESTING.md) for complete testing scenarios.

### Vanilla JS

```javascript
const agent = window.QredexAgent;

async function reportCart(previousCount, itemCount, meta) {
  agent.handleCartChange({
    previousCount,
    itemCount,
    meta,
  });
}

document.querySelector('.add-to-cart').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  const product = {
    id: button.dataset.productId,
    price: parseFloat(button.dataset.price),
  };
  const previousCount = cart.itemCount;

  await fetch('/api/cart', {
    method: 'POST',
    body: JSON.stringify(product),
  });

  reportCart(previousCount, cart.itemCount, {
    productId: product.id,
    quantity: 1,
    price: product.price,
  });
});

document.querySelector('.remove-from-cart').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  const line = {
    id: button.dataset.lineId,
    productId: button.dataset.productId,
    price: parseFloat(button.dataset.price),
  };
  const previousCount = cart.itemCount;

  await fetch(`/api/cart/${line.id}`, {
    method: 'DELETE',
  });

  reportCart(previousCount, cart.itemCount, {
    productId: line.productId,
    quantity: -1,
    price: line.price,
  });
});

document.querySelector('.clear-cart').addEventListener('click', async () => {
  const previousCount = cart.itemCount;

  await fetch('/api/cart/clear', {
    method: 'POST',
  });

  reportCart(previousCount, 0);
});
```

---

## How It Works

```
1. User lands with ?qdx_intent=xxx
   → Agent inspects qdx_intent, removes it from the visible URL, and stores IIT in sessionStorage + cookie when no PIT already exists

2. Merchant reports a non-empty cart state
   → handleCartChange() locks IIT → PIT via API
   → PIT stored, IIT cleared

3. User continues shopping and the cart stays non-empty
   → Lock can retry on later non-empty cart reports if previous lock failed
   → PIT persists once locked

4. User empties cart (cart goes from non-empty to empty) OR completes checkout
   → handleCartChange() or handlePaymentSuccess() clears PIT

5. Next purchase requires new Qredex link (new IIT)
```

### Key Behaviors

| Behavior | Description |
|----------|-------------|
| **Retry on failure** | If lock fails, retries on every subsequent add-to-cart while cart has items |
| **Idempotent** | Safe to call `handleCartChange()` multiple times; no duplicate locks |
| **Cart-driven** | Lock only happens when: cart has items AND IIT exists AND PIT doesn't exist |
| **First-touch attribution** | Once PIT exists, new IIT captures are ignored until cart is emptied |

**See:** [docs/INTEGRATION_MODEL.md](docs/INTEGRATION_MODEL.md) for complete flow diagram.

---

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
| **[Testing Guide](examples/TESTING.md)** | Complete testing scenarios |
| **[AGENTS.md](AGENTS.md)** | Development guidelines |

---

## Examples Directory

| Example | Description | Quick Start |
|---------|-------------|-------------|
| [examples/index.html](examples/index.html) | Quick testing page | `npm run example` |

Each example includes:
- Complete working demo
- Step-by-step testing scenarios
- Console commands reference
- Debugging guide

**See:** [examples/TESTING.md](examples/TESTING.md) for detailed testing instructions.

---

## License

MIT

---

## Support

For questions: [support@qredex.com](mailto:support@qredex.com)
