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
// When user adds to cart
async function addToCart(product) {
  await api.post('/cart', product);
  
  // Tell agent (auto-locks IIT → PIT)
  QredexAgent.handleCartAdd({
    productId: product.id,
    quantity: 1,
    price: product.price,
  });
}

// When cart is emptied
function clearCart() {
  cart.clear();
  
  // Tell agent (auto-clears PIT)
  QredexAgent.handleCartEmpty();
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
- ✅ Locks IIT → PIT on cart add
- ✅ Clears PIT on cart empty or checkout
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
QredexAgent.handleCartAdd(event)       // Cart add
QredexAgent.handleCartEmpty()          // Cart empty
QredexAgent.handleCartChange(event)    // Cart change
QredexAgent.handlePaymentSuccess(event) // Payment success
```

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
| **[Integration Model](docs/INTEGRATION_MODEL.md)** | Complete integration guide |
| **[Cart Empty Policy](docs/CART_EMPTY_POLICY.md)** | Attribution clearing rationale |
| **[API Reference](docs/API.md)** | Full API documentation |
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
  handleCartAdd, 
  handleCartEmpty, 
  getPurchaseIntentToken 
} from 'qredex-agent';
```

---

## Examples

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
    QredexAgent.handleCartAdd(product);
  };
  
  const checkout = async (order) => {
    const pit = QredexAgent.getPurchaseIntentToken();
    await api.post('/orders', { ...order, qredex_pit: pit });
    QredexAgent.handlePaymentSuccess(order);
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
  
  QredexAgent.handleCartAdd(product);
});
```

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Requires ES2020+ support.

---

## License

MIT

---

## Support

For questions: support@qredex.com
