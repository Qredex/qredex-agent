# Qredex Agent - React Example

This example shows how to integrate Qredex Agent with React/Next.js.

## Quick Start

```bash
npm install
npm run dev
```

## Usage

### 1. Create Custom Hook

```jsx
// hooks/useQredexAgent.js
import { useEffect } from 'react';

export function useQredexAgent() {
  useEffect(() => {
    // Optional: listen for agent events
    const handleLocked = ({ purchaseToken, alreadyLocked }) => {
      console.log('Qredex locked:', { purchaseToken, alreadyLocked });
    };

    const handleCleared = () => {
      console.log('Qredex cleared');
    };

    const handleError = ({ error, context }) => {
      console.error('Qredex error:', context, error);
    };

    QredexAgent.onLocked(handleLocked);
    QredexAgent.onCleared(handleCleared);
    QredexAgent.onError(handleError);

    return () => {
      QredexAgent.offLocked(handleLocked);
      QredexAgent.offCleared(handleCleared);
      QredexAgent.offError(handleError);
    };
  }, []);

  const addToCart = async (product) => {
    // Your cart API call
    await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });

    // Tell Qredex agent (auto-locks IIT → PIT)
    QredexAgent.handleCartAdd({
      productId: product.id,
      quantity: product.quantity || 1,
      price: product.price,
    });
  };

  const clearCart = () => {
    // Your cart clear logic
    // ...

    // Tell Qredex agent (auto-clears PIT)
    QredexAgent.handleCartEmpty();
  };

  const checkout = async (order) => {
    // Get PIT for backend
    const pit = QredexAgent.getPurchaseIntentToken();

    // Submit order with PIT
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...order,
        qredex_pit: pit,
      }),
    });

    // Tell Qredex agent (auto-clears PIT)
    QredexAgent.handlePaymentSuccess({
      orderId: order.id,
      amount: order.total,
      currency: order.currency || 'USD',
    });

    return response;
  };

  return { addToCart, clearCart, checkout };
}
```

### 2. Use in Components

```jsx
// components/AddToCartButton.jsx
import { useQredexAgent } from '../hooks/useQredexAgent';

export function AddToCartButton({ product }) {
  const { addToCart } = useQredexAgent();

  const handleClick = async () => {
    try {
      await addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
      });
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

```jsx
// components/CheckoutButton.jsx
import { useState } from 'react';
import { useQredexAgent } from '../hooks/useQredexAgent';

export function CheckoutButton({ cart }) {
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
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Processing...' : `Checkout - $${cart.total}`}
    </button>
  );
}
```

## Next.js App Router

```jsx
// app/layout.js
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

## TypeScript Support

```tsx
// hooks/useQredexAgent.ts
import { useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  quantity?: number;
}

interface Order {
  id: string;
  total: number;
  currency: string;
  items: Product[];
}

export function useQredexAgent() {
  useEffect(() => {
    // ... same as above
  }, []);

  const addToCart = async (product: Product): Promise<void> => {
    // ... implementation
  };

  const checkout = async (order: Order): Promise<Response> => {
    // ... implementation
  };

  return { addToCart, clearCart, checkout };
}
```

## License

MIT
