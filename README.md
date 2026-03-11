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
  });
}
```

### 3. Done!

The agent automatically:
- ✅ Captures `qdx_intent` from URL
- ✅ Stores IIT in browser storage
- ✅ Locks IIT → PIT when cart goes from 0 → 1 items
- ✅ Clears PIT when cart goes from >0 → 0 items or checkout
- ✅ Exposes PIT for checkout

---

## API Overview

### Read Tokens
```javascript
QredexAgent.getInfluenceIntentToken()     // Get IIT (new name)
QredexAgent.getIntentToken()              // Get IIT (deprecated, use above)
QredexAgent.getPurchaseIntentToken()      // Get PIT
QredexAgent.hasInfluenceIntentToken()     // Check IIT exists (new name)
QredexAgent.hasIntentToken()              // Check IIT exists (deprecated, use above)
QredexAgent.hasPurchaseIntentToken()      // Check PIT exists
```

### Commands
```javascript
// Manual lock (meta is optional)
await QredexAgent.lockIntent(meta)

// Example with metadata
await QredexAgent.lockIntent({
  productId: 'widget-001',
  productName: 'Premium Widget',
  quantity: 2,
  price: 99.99,
})

QredexAgent.clearTokens()  // Clear all tokens
```

### Event Handlers (Merchant → Agent)
```javascript
// Single method for all cart state changes
QredexAgent.handleCartChange(event)    // Locks on 0→1, clears on >0→0
QredexAgent.handlePaymentSuccess(event) // Payment success
```

#### handleCartChange Event
```javascript
QredexAgent.handleCartChange({
  itemCount: 1,              // Required: current cart item count
  previousCount: 0,          // Required: previous cart item count
  meta: {                    // Optional: sent to lock API
    productId: 'widget-001',
    quantity: 2,
    price: 99.99,
  },
});
```

**Behavior:**
- `itemCount > 0` and `previousCount === 0` → **Locks IIT → PIT**
- `itemCount === 0` and `previousCount > 0` → **Clears tokens**
- Other transitions → No action (e.g., 1 → 3, 3 → 2)

### Event Listeners (Agent → Merchant)
```javascript
QredexAgent.onLocked(handler)          // Listen for lock
QredexAgent.onCleared(handler)         // Listen for clear
QredexAgent.onError(handler)           // Listen for errors
```

---

## Documentation

| Document | Description |
|----------|-------------|
| **[Integration Model](docs/INTEGRATION_MODEL.md)** | Complete integration guide with 2 paths |
| **[API Reference](docs/API.md)** | Full API documentation |
| **[Cart Change Behavior](docs/CART_CHANGE_BEHAVIOR.md)** | handleCartChange() state transitions |
| **[Cart Empty Policy](docs/CART_EMPTY_POLICY.md)** | Attribution clearing rationale |
| **[AGENTS.md](AGENTS.md)** | Development guidelines |

---

## Installation

### CDN (Recommended)

```html
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
```

### NPM

```bash
npm install qredex-agent
```

```javascript
import {
  handleCartChange,
  getPurchaseIntentToken
} from 'qredex-agent';
```

---

## Examples

Each example includes a complete working demo with testing instructions.

| Example | Description | How to Run |
|---------|-------------|------------|
| [examples/cdn-test/](examples/cdn-test/) | Quick CDN testing page | `npm run build` → open in browser |

> **Note:** React, Vue, and other framework integrations will be available as separate packages (`@qredex/react`, `@qredex/vue`, etc.) in their own repositories.

### Quick Test

The fastest way to test Qredex Agent:

```bash
# 1. Build the project
npm run build

# 2. Open the test page
open examples/cdn-test/index.html

# 3. Simulate intent URL
# Add ?qdx_intent=test123 to the URL and press Enter

# 4. Add to cart
# Click "Add to Cart" button - watch PIT get locked

# 5. Clear cart
# Click "Clear Cart" - watch PIT get cleared
```

### React/Next.js

```jsx
import { useEffect } from 'react';

function useQredexAgent() {
  useEffect(() => {
    // Optional: listen for agent events
    QredexAgent.onLocked(({ purchaseToken }) => {
      console.log('Locked:', purchaseToken);
    });
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
    QredexAgent.handlePaymentSuccess(order);
  };

  return { addToCart, checkout };
}
```

**See:** [examples/cdn-test/](examples/cdn-test/) for complete testing page with all scenarios.

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

**See:** [examples/cdn-test/](examples/cdn-test/) for complete testing page.

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

**Key Behaviors:**
- **Retry on failure:** If lock fails, it retries on every subsequent add-to-cart while cart has items
- **Idempotent:** Safe to call `handleCartChange()` multiple times; no duplicate locks
- **Cart-driven:** Lock only happens when cart has items AND IIT exists AND PIT doesn't exist

**See:** [docs/INTEGRATION_MODEL.md](docs/INTEGRATION_MODEL.md) for complete flow diagram.

---

## Configuration

Optional configuration via `window.QredexAgentConfig`:

```javascript
window.QredexAgentConfig = {
  debug: true,                    // Enable debug logging (default: false)
  lockEndpoint: '/api/v1/...',    // Lock API endpoint (default: Qredex CDN)
  autoDetect: true,               // Auto-detect add-to-cart (default: true)
  cookieExpireDays: 30,           // Cookie expiration (default: 30)
  useMockEndpoint: true,          // ⚠️ DEV ONLY: mock PIT tokens (default: false)
};
```

**Defaults:**
```typescript
{
  debug: false,
  lockEndpoint: 'https://api.qredex.com/api/v1/agent/intents/lock',
  autoDetect: true,
  influenceIntentToken: '__qdx_iit',
  purchaseIntentToken: '__qdx_pit',
  cookieExpireDays: 30,
  useMockEndpoint: false,
}
```

**Production Usage:**
```javascript
// No config needed - uses defaults
// Or customize as needed:
window.QredexAgentConfig = {
  debug: false,  // Disable debug logging
  lockEndpoint: 'https://your-backend.com/api/lock',  // Custom backend
};
```

**⚠️ Mock Endpoint Warning:**
- `useMockEndpoint: true` generates fake PIT tokens (no network calls)
- Only use for local development/testing
- Console warning is logged when used on non-localhost domains
- **Never deploy to production with `useMockEndpoint: true`**

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Requires ES2020+ support.

---

## Examples Directory

| Example | Description | Quick Start |
|---------|-------------|-------------|
| [examples/cdn-test/](examples/cdn-test/) | Quick CDN testing | `npm run build` → open in browser |

Each example includes:
- Complete working demo
- Step-by-step testing scenarios
- Console commands reference
- Debugging guide

See individual example READMEs for detailed instructions.

---

## License

MIT

---

## Support

For questions: support@qredex.com
