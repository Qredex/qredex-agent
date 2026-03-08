# Qredex Agent - React/Next.js Example

Complete example of Qredex Agent integration with React and Next.js.

---

## Quick Start

### 1. Install Dependencies

```bash
cd examples/react
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

### 3. Open in Browser

Navigate to `http://localhost:3000`

---

## Files

| File | Description |
|------|-------------|
| `app/layout.tsx` | Root layout with Qredex Agent script |
| `app/page.tsx` | Main demo page component |
| `app/globals.css` | All CSS styles |
| `next.config.js` | Next.js configuration |
| `package.json` | Dependencies |

---

## Testing Scenarios

### Scenario 1: Initial State

**Steps:**
1. Open `http://localhost:3000` in a fresh browser tab
2. Check the status bar at the top

**Expected Results:**
- ✅ Initialized: Yes
- ❌ IIT: None
- ❌ PIT: None
- Cart is empty

---

### Scenario 2: Simulate Intent URL

**Steps:**
1. Add `?qdx_intent=test_token_123` to the URL
2. Press Enter to reload

**Expected Results:**
- ✅ IIT: Present (green dot)
- Console Log shows: "Qredex Agent initialized"

---

### Scenario 3: Add to Cart (Lock Intent)

**Prerequisites:** IIT must exist (complete Scenario 2)

**Steps:**
1. Click **Add to Cart** on any product
2. Watch the status bar and notifications

**Expected Results:**
- ✅ PIT: Present (green dot)
- Notification: "Attribution locked!"
- Product appears in cart
- Cart total updates

---

### Scenario 4: Clear Cart

**Prerequisites:** PIT must exist (complete Scenario 3)

**Steps:**
1. Click **Clear Cart** button

**Expected Results:**
- ❌ PIT: None (gray dot)
- Notification: "Cart cleared"
- Cart is empty

---

### Scenario 5: Full Checkout Flow

**Steps:**
1. Add `?qdx_intent=test123` to URL
2. Add items to cart (locks IIT → PIT)
3. Click **Checkout**

**Expected Results:**
- Order confirmation alert
- ❌ PIT: None (cleared after payment)
- Cart is empty

---

## Console Commands

Access the agent from the browser console:

```javascript
// Get tokens
QredexAgent.getIntentToken()
QredexAgent.getPurchaseIntentToken()

// Check token existence
QredexAgent.hasIntentToken()
QredexAgent.hasPurchaseIntentToken()

// Event handlers
QredexAgent.handleCartAdd({ productId: 'prod_1', quantity: 1, price: 29.99 })
QredexAgent.handleCartEmpty()
QredexAgent.handlePaymentSuccess({ orderId: 'order_123', amount: 99.99, currency: 'USD' })

// Event listeners
QredexAgent.onLocked(({ purchaseToken, alreadyLocked }) => {
  console.log('Locked:', purchaseToken);
});
QredexAgent.onCleared(() => {
  console.log('Cleared');
});
```

---

## Key Integration Points

### 1. Load Agent Script (layout.tsx)

```tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 2. Initialize and Listen (page.tsx)

```tsx
'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    const agent = window.QredexAgent;
    if (!agent) return;

    agent.init({ debug: true });

    agent.onLocked(({ purchaseToken, alreadyLocked }) => {
      console.log('Locked:', purchaseToken, alreadyLocked);
    });

    agent.onCleared(() => {
      console.log('Cleared');
    });

    agent.onError(({ error, context }) => {
      console.error('Error:', context, error);
    });
  }, []);

  // ... rest of component
}
```

### 3. Handle Cart Events

```tsx
const addToCart = async (product) => {
  await fetch('/api/cart', {
    method: 'POST',
    body: JSON.stringify(product),
  });

  window.QredexAgent.handleCartAdd({
    productId: product.id,
    quantity: 1,
    price: product.price,
  });
};

const clearCart = () => {
  setCartItems([]);
  window.QredexAgent.handleCartEmpty();
};

const checkout = async (order) => {
  const pit = window.QredexAgent.getPurchaseIntentToken();

  await fetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      ...order,
      qredex_pit: pit,
    }),
  });

  window.QredexAgent.handlePaymentSuccess({
    orderId: order.id,
    amount: order.total,
    currency: 'USD',
  });
};
```

---

## Debugging

### Check Storage

Open DevTools → Application → Storage:

**Session Storage:**
- `__qdx_iit` - IIT token
- `__qdx_pit` - PIT token

**Cookies:**
- `__qdx_iit` - IIT fallback
- `__qdx_pit` - PIT fallback

---

## Related Examples

| Example | Description |
|---------|-------------|
| [../basic/](../basic/) | Comprehensive demo with testing UI |
| [../vanilla/](../vanilla/) | Vanilla JS e-commerce demo |
| [../vue/](../vue/) | Vue/Nuxt integration |

---

## License

MIT
