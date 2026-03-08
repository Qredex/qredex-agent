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

## Project Structure

```
examples/react/
├── app/
│   ├── layout.tsx    # Root layout with Qredex Agent script
│   ├── page.tsx      # Main demo page
│   └── globals.css   # Global styles
├── next.config.js    # Next.js configuration
├── package.json      # Dependencies
└── tsconfig.json     # TypeScript configuration
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

    // Initialize
    agent.init({ debug: true });

    // Register event listeners
    agent.onLocked(({ purchaseToken, alreadyLocked }) => {
      console.log('Locked:', purchaseToken, alreadyLocked);
    });

    agent.onCleared(() => {
      console.log('Cleared');
    });

    agent.onError(({ error, context }) => {
      console.error('Error:', context, error);
    });

    // Cleanup
    return () => {
      agent.offLocked(handleLocked);
      agent.offCleared(handleCleared);
      agent.offError(handleError);
    };
  }, []);

  // ... rest of component
}
```

### 3. Handle Cart Events

```tsx
const addToCart = async (product) => {
  // Your cart API call
  await fetch('/api/cart', {
    method: 'POST',
    body: JSON.stringify(product),
  });

  // Tell Qredex agent (auto-locks IIT → PIT)
  window.QredexAgent.handleCartAdd({
    productId: product.id,
    quantity: 1,
    price: product.price,
  });
};

const clearCart = () => {
  // Your cart clear logic
  setCartItems([]);

  // Tell Qredex agent (auto-clears PIT)
  window.QredexAgent.handleCartEmpty();
};

const checkout = async (order) => {
  // Get PIT for backend
  const pit = window.QredexAgent.getPurchaseIntentToken();

  // Submit order with PIT
  await fetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      ...order,
      qredex_pit: pit,
    }),
  });

  // Tell Qredex agent (auto-clears PIT)
  window.QredexAgent.handlePaymentSuccess({
    orderId: order.id,
    amount: order.total,
    currency: 'USD',
  });
};
```

---

## Custom Hook (Optional)

Create a reusable hook for Qredex Agent:

```tsx
// hooks/useQredexAgent.ts
import { useEffect, useCallback } from 'react';

interface QredexAgentAPI {
  addToCart: (product: Product) => Promise<void>;
  clearCart: () => void;
  checkout: (order: Order) => Promise<void>;
  getPurchaseToken: () => string | null;
  hasPurchaseToken: () => boolean;
}

export function useQredexAgent(): QredexAgentAPI {
  useEffect(() => {
    const agent = window.QredexAgent;
    if (!agent) return;

    agent.init({ debug: true });

    const handleLocked = ({ purchaseToken, alreadyLocked }) => {
      console.log('Qredex locked:', { purchaseToken, alreadyLocked });
    };

    const handleCleared = () => {
      console.log('Qredex cleared');
    };

    const handleError = ({ error, context }) => {
      console.error('Qredex error:', context, error);
    };

    agent.onLocked(handleLocked);
    agent.onCleared(handleCleared);
    agent.onError(handleError);

    return () => {
      agent.offLocked(handleLocked);
      agent.offCleared(handleCleared);
      agent.offError(handleError);
    };
  }, []);

  const addToCart = useCallback(async (product: Product) => {
    await fetch('/api/cart', {
      method: 'POST',
      body: JSON.stringify(product),
    });

    window.QredexAgent.handleCartAdd({
      productId: product.id,
      quantity: product.quantity || 1,
      price: product.price,
    });
  }, []);

  const clearCart = useCallback(() => {
    window.QredexAgent.handleCartEmpty();
  }, []);

  const checkout = useCallback(async (order: Order) => {
    const pit = window.QredexAgent.getPurchaseIntentToken();

    const response = await fetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        ...order,
        qredex_pit: pit,
      }),
    });

    window.QredexAgent.handlePaymentSuccess({
      orderId: order.id,
      amount: order.total,
      currency: order.currency || 'USD',
    });

    return response;
  }, []);

  return {
    addToCart,
    clearCart,
    checkout,
    getPurchaseToken: () => window.QredexAgent?.getPurchaseIntentToken() ?? null,
    hasPurchaseToken: () => window.QredexAgent?.hasPurchaseIntentToken() ?? false,
  };
}
```

### Use Hook in Components

```tsx
// components/AddToCartButton.tsx
import { useQredexAgent } from '@/hooks/useQredexAgent';

interface AddToCartButtonProps {
  product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart } = useQredexAgent();

  const handleClick = async () => {
    try {
      await addToCart(product);
      alert('Added to cart!');
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  return (
    <button onClick={handleClick}>
      Add to Cart - ${product.price}
    </button>
  );
}
```

```tsx
// components/CheckoutButton.tsx
import { useState } from 'react';
import { useQredexAgent } from '@/hooks/useQredexAgent';

interface CheckoutButtonProps {
  cart: Cart;
}

export function CheckoutButton({ cart }: CheckoutButtonProps) {
  const { checkout } = useQredexAgent();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const order = {
        items: cart.items,
        total: cart.total,
        currency: 'USD',
        customer: {
          email: 'customer@example.com',
        },
      };

      const response = await checkout(order);
      const result = await response.json();

      if (response.ok) {
        alert('Order placed!');
        window.location.href = `/orders/${result.orderId}`;
      } else {
        alert('Checkout failed: ' + result.error);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading || cart.items.length === 0}>
      {loading ? 'Processing...' : `Checkout - $${cart.total}`}
    </button>
  );
}
```

---

## Next.js App Router

For Next.js 13+ App Router, ensure client components:

```tsx
// app/page.tsx
'use client';  // Required for browser APIs

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Access window.QredexAgent here
  }, []);

  return <div>...</div>;
}
```

---

## TypeScript Support

The example includes TypeScript types. For better type safety:

```tsx
// types/qredex-agent.d.ts
declare global {
  interface Window {
    QredexAgent: {
      init(config?: AgentConfig): void;
      getIntentToken(): string | null;
      getPurchaseIntentToken(): string | null;
      hasIntentToken(): boolean;
      hasPurchaseIntentToken(): boolean;
      lockIntent(meta?: LockMeta): Promise<LockResult>;
      clearTokens(): void;
      handleCartAdd(event?: CartAddEvent): void;
      handleCartEmpty(event?: CartEmptyEvent): void;
      handlePaymentSuccess(event: PaymentSuccessEvent): void;
      onLocked(handler: LockedHandler): void;
      onCleared(handler: ClearedHandler): void;
      onError(handler: ErrorHandler): void;
      offLocked(handler: LockedHandler): void;
      offCleared(handler: ClearedHandler): void;
      offError(handler: ErrorHandler): void;
      isInitialized(): boolean;
      getStatus(): AgentStatus;
      destroy(): void;
      stop(): void;
    };
  }
}

export {};
```

---

## Testing

### Manual Testing

1. **Initial State**: Verify no tokens present
2. **Simulate Intent**: Navigate with `?qdx_intent=test123`
3. **Add to Cart**: Click add, verify PIT locked
4. **Checkout**: Complete order, verify PIT cleared
5. **Clear Cart**: Empty cart, verify PIT cleared

### Console Testing

Open browser console and run:

```javascript
// Check status
QredexAgent.getStatus()

// Get tokens
QredexAgent.getIntentToken()
QredexAgent.getPurchaseIntentToken()

// Manual operations
await QredexAgent.lockIntent()
QredexAgent.clearTokens()
```

---

## Common Issues

### Issue: "QredexAgent is not defined"

**Solution:** Ensure script loaded before component mounts:

```tsx
<Script
  src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"
  strategy="afterInteractive"
/>
```

### Issue: Tokens not persisting across pages

**Solution:** Agent uses sessionStorage + cookies. Ensure:
- Cookies not blocked
- sessionStorage available (not private browsing)

### Issue: Lock fails silently

**Solution:** Check:
1. IIT exists before lock: `QredexAgent.hasIntentToken()`
2. Network tab for API errors
3. CORS configuration on backend

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
