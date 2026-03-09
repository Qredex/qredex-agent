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
QredexAgent.getIntentToken()           // Get IIT
QredexAgent.getPurchaseIntentToken()   // Get PIT
QredexAgent.hasIntentToken()           // Check IIT exists
QredexAgent.hasPurchaseIntentToken()   // Check PIT exists
```

### Commands
```javascript
await QredexAgent.lockIntent(meta)     // Manual lock
QredexAgent.clearTokens()              // Clear all tokens
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
| [examples/basic/](examples/basic/) | Comprehensive demo with visual testing UI | `npx serve examples` → `http://localhost:3000/basic/` |
| [examples/vanilla/](examples/vanilla/) | Vanilla JS e-commerce demo | `npx serve examples` → `http://localhost:3000/vanilla/` |
| [examples/react/](examples/react/) | React/Next.js integration | `cd examples/react && npm install && npm run dev` |
| [examples/vue/](examples/vue/) | Vue 3 + Vite integration | `cd examples/vue && npm install && npm run dev` |

### Quick Test (Basic Example)

The fastest way to test Qredex Agent:

```bash
# 1. Serve the examples
npx serve examples

# 2. Open in browser
# Navigate to: http://localhost:3000/basic/

# 3. Simulate intent URL
# Add ?qdx_intent=test123 to the URL and press Enter

# 4. Add to cart
# Click "Add to Cart" button - watch PIT get locked

# 5. Clear cart
# Click "Clear Tokens" - watch PIT get cleared
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

**See:** [examples/react/](examples/react/) for complete React/Next.js example with testing scenarios.

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

**See:** [examples/vanilla/](examples/vanilla/) for complete vanilla JS e-commerce demo.

### Vue/Nuxt

```vue
<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  // Optional: listen for agent events
  QredexAgent.onLocked(({ purchaseToken }) => {
    console.log('Locked:', purchaseToken);
  });
});

const addToCart = async (product) => {
  await $api.post('/cart', product);
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
  await $api.post('/orders', { ...order, qredex_pit: pit });
  QredexAgent.handlePaymentSuccess(order);
};
</script>
```

**See:** [examples/vue/](examples/vue/) for complete Vue 3 + Vite example.

---

## How It Works

```
1. User lands with ?qdx_intent=xxx
   → Agent captures IIT, stores in sessionStorage + cookie

2. User adds first item to cart (itemCount: 0 → 1)
   → handleCartChange() locks IIT → PIT via API
   → PIT stored, IIT cleared

3. User continues shopping
   → PIT persists through additional cart adds

4. User empties cart (itemCount: >0 → 0) OR completes checkout
   → handleCartChange() or handlePaymentSuccess() clears PIT

5. Next purchase requires new Qredex link (new IIT)
```

**See:** [docs/INTEGRATION_MODEL.md](docs/INTEGRATION_MODEL.md) for complete flow diagram.

---

## Configuration

Optional configuration via `window.QredexAgentConfig`:

```javascript
window.QredexAgentConfig = {
  debug: true,                    // Enable debug logging
  lockEndpoint: '/api/v1/...',   // Lock API endpoint
  cookieExpireDays: 30,           // Cookie expiration
};
```

**Defaults:**
```typescript
{
  debug: false,
  lockEndpoint: '/api/v1/agent/intents/lock',
  influenceIntentToken: '__qdx_iit',
  purchaseIntentToken: '__qdx_pit',
  cookieExpireDays: 30,
}
```

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
| [examples/basic/](examples/basic/) | Comprehensive demo with testing UI | `npx serve examples` |
| [examples/vanilla/](examples/vanilla/) | Vanilla JS e-commerce demo | `npx serve examples` |
| [examples/react/](examples/react/) | React/Next.js integration | `cd examples/react && npm run dev` |
| [examples/vue/](examples/vue/) | Vue 3 + Vite integration | `cd examples/vue && npm run dev` |

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
