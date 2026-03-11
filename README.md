# Qredex Agent

**Lightweight browser agent for Qredex intent capture and locking.**

[![npm version](https://img.shields.io/npm/v/qredex-agent.svg)](https://npmjs.com/package/qredex-agent)
[![bundle size](https://img.shields.io/bundlephobia/minzip/qredex-agent)](https://bundlephobia.com/package/qredex-agent)
[![license](https://img.shields.io/npm/l/qredex-agent)](LICENSE)

---

## Quick Start

### 1. Install via Script Tag

```html
<!-- Add before </body> -->
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
```

### 2. Handle Cart Events

```javascript
// When cart state changes
async function addToCart(product) {
  await api.post('/cart', product);

  // Tell agent (auto-locks IIT → PIT on first item)
  QredexAgent.handleCartChange({
    itemCount: cart.itemCount,
    previousCount: cart.previousCount,
    meta: {
      productId: product.id,
      quantity: product.quantity,
      price: product.price,
    },
  });
}

// When cart is emptied
function clearCart() {
  cart.clear();

  // Tell agent (auto-clears PIT when itemCount = 0)
  QredexAgent.handleCartChange({
    itemCount: 0,
    previousCount: cart.previousCount,
  });
}

// When payment succeeds
async function checkout(order) {
  const pit = QredexAgent.getPurchaseIntentToken();

  await api.post('/orders', {
    ...order,
    qredex_pit: pit,  // Send PIT to backend
  });

  // Tell agent (auto-clears PIT)
  QredexAgent.handlePaymentSuccess({
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
- ✅ Locks IIT → PIT when cart goes from 0 → 1 items
- ✅ Clears PIT when cart goes from >0 → 0 items or checkout
- ✅ Exposes PIT for checkout

---

## What is Qredex Agent?

Qredex Agent is a **lightweight browser runtime** (~5KB minified) that:

1. **Captures** the `qdx_intent` token from URLs when users arrive via Qredex tracking links
2. **Stores** the token securely in browser storage (sessionStorage + cookie fallback)
3. **Locks** the token via Qredex API when the user adds their first item to cart
4. **Manages** attribution state throughout the shopping session
5. **Exposes** the Purchase Intent Token (PIT) for checkout

### Key Features

- **Zero dependencies** - Pure vanilla JavaScript, works everywhere
- **Idempotent operations** - Safe to call multiple times
- **Retry on failure** - Automatically retries lock if it fails
- **Storage fallback** - Uses sessionStorage first, cookies as fallback
- **Framework agnostic** - Works with React, Vue, Next.js, jQuery, or vanilla JS

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
// Single method for all cart state changes
QredexAgent.handleCartChange({
  itemCount: 1,              // Required: current cart item count
  previousCount: 0,          // Required: previous cart item count
  meta: {                    // Optional: sent to lock API
    productId: 'widget-001',
    quantity: 2,
    price: 99.99,
  },
});

// Convenience wrapper for adding items
QredexAgent.handleCartAdd(
  itemCount,                 // Current item count after adding
  {                          // Optional metadata
    productId: 'widget-001',
    quantity: 1,
    price: 99.99,
  }
);

// Convenience wrapper for emptying cart
QredexAgent.handleCartEmpty();

// Payment success (auto-clears tokens)
QredexAgent.handlePaymentSuccess({
  orderId: 'order-123',
  amount: 99.99,
  currency: 'USD',
});
```

**Behavior:**

| Method | When `itemCount > 0` and `previousCount === 0` | When `itemCount === 0` and `previousCount > 0` |
|--------|------------------------------------------------|------------------------------------------------|
| `handleCartChange()` | 🔒 Locks IIT → PIT | 🗑️ Clears tokens |
| `handleCartAdd()` | 🔒 Locks IIT → PIT | — |
| `handleCartEmpty()` | — | 🗑️ Clears tokens |
| `handlePaymentSuccess()` | — | 🗑️ Clears tokens |

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
// Initialize with custom config (usually not needed - auto-starts)
QredexAgent.init({
  debug: true,
  lockEndpoint: 'https://your-backend.com/api/lock',
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
```

---

## Configuration

Optional configuration via `window.QredexAgentConfig`. Set **before** the script loads:

```html
<script>
  window.QredexAgentConfig = {
    debug: false,                    // Enable debug logging (default: false)
    lockEndpoint: '/api/v1/...',     // Lock API endpoint
    cookieExpireDays: 30,            // Cookie expiration (default: 30)
    useMockEndpoint: false,          // ⚠️ DEV ONLY: mock PIT tokens
    influenceIntentToken: '__qdx_iit',  // IIT storage key
    purchaseIntentToken: '__qdx_pit',   // PIT storage key
  };
</script>
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `debug` | boolean | `false` | Enable debug logging in console |
| `lockEndpoint` | string | `'https://api.qredex.com/api/v1/agent/intents/lock'` | Lock API URL |
| `cookieExpireDays` | number | `30` | Cookie expiration in days |
| `useMockEndpoint` | boolean | `false` | ⚠️ **DEV ONLY** - Generate fake PIT tokens (no network calls) |
| `influenceIntentToken` | string | `'__qdx_iit'` | Storage key for IIT |
| `purchaseIntentToken` | string | `'__qdx_pit'` | Storage key for PIT |

### ⚠️ Mock Endpoint Warning

```javascript
useMockEndpoint: true  // ⚠️ DEVELOPMENT ONLY
```

- Generates fake PIT tokens locally (no network calls)
- Only use for local development/testing
- Console warning is logged when used on non-localhost domains
- **Never deploy to production with `useMockEndpoint: true`**

---

## Examples

### Quick Test

The fastest way to test Qredex Agent:

```bash
# 1. Build the project
npm run build

# 2. Open the test page
open examples/index.html

# 3. Simulate intent URL
# Add ?qdx_intent=test123 to the URL and press Enter

# 4. Add to cart
# Click "Add to Cart" button - watch PIT get locked

# 5. Clear cart
# Click "Clear Cart" - watch PIT get cleared
```

**See:** [examples/TESTING.md](examples/TESTING.md) for complete testing scenarios.

### React/Next.js

```jsx
import { useEffect } from 'react';

function useQredexAgent() {
  useEffect(() => {
    // Optional: listen for agent events
    QredexAgent.onLocked(({ purchaseToken }) => {
      console.log('Locked:', purchaseToken);
    });

    return () => {
      // Cleanup for SPA route changes
      QredexAgent.destroy();
    };
  }, []);

  const addToCart = async (product) => {
    await api.post('/cart', product);
    QredexAgent.handleCartChange({
      itemCount: cart.itemCount,
      previousCount: cart.previousCount,
      meta: {
        productId: product.id,
        quantity: product.quantity,
        price: product.price,
      },
    });
  };

  const checkout = async (order) => {
    const pit = QredexAgent.getPurchaseIntentToken();
    await api.post('/orders', { ...order, qredex_pit: pit });
    QredexAgent.handlePaymentSuccess({
      orderId: order.id,
      amount: order.total,
      currency: 'USD',
    });
  };

  return { addToCart, checkout };
}
```

### Vanilla JS

```javascript
// Add to cart button
document.querySelector('.add-to-cart').addEventListener('click', async (e) => {
  const product = {
    id: e.target.dataset.productId,
    price: parseFloat(e.target.dataset.price),
  };

  await fetch('/api/cart', {
    method: 'POST',
    body: JSON.stringify(product),
  });

  QredexAgent.handleCartChange({
    itemCount: cart.itemCount,
    previousCount: cart.previousCount,
    meta: {
      productId: product.id,
      price: product.price,
    },
  });
});
```

---

## How It Works

```
1. User lands with ?qdx_intent=xxx
   → Agent captures IIT, stores in sessionStorage + cookie

2. User adds first item to cart (itemCount: 0 → 1)
   → handleCartChange() locks IIT → PIT via API
   → PIT stored, IIT cleared

3. User continues shopping (itemCount: 1 → 2 → 3...)
   → Lock retries on every add-to-cart if previous lock failed
   → PIT persists once locked

4. User empties cart (itemCount: >0 → 0) OR completes checkout
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

Enable debug logging:

```javascript
window.QredexAgentConfig = { debug: true };
```

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

## Framework Integrations

> **Coming Soon:** Framework-specific packages for React, Vue, Next.js, and more.
>
> These will be published as separate packages:
> - `@qredex/react` - React hooks & components
> - `@qredex/vue` - Vue composables & plugin
> - `@qredex/next` - Next.js integration
>
> Each will have its own repository with dedicated examples and documentation.

---

## Examples Directory

| Example | Description | Quick Start |
|---------|-------------|-------------|
| [examples/index.html](examples/index.html) | Quick testing page | `npm run build` → open in browser |

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
