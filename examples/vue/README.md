# Qredex Agent - Vue/Nuxt Example

Complete example of Qredex Agent integration with Vue 3 and Nuxt.

---

## Quick Start

### 1. Install Dependencies

```bash
cd examples/vue
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
examples/vue/
├── src/
│   ├── App.vue         # Main demo component
│   └── main.ts         # App entry point
├── index.html          # HTML template with Qredex script
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Vite configuration
```

---

## Key Integration Points

### 1. Load Agent Script (index.html)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Qredex Agent - Vue Example</title>
  </head>
  <body>
    <div id="app"></div>
    <!-- Load Qredex Agent from CDN -->
    <script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### 2. Initialize and Listen (App.vue)

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  const agent = window.QredexAgent;
  if (!agent) return;

  // Initialize
  agent.init({ debug: true });

  // Register event listeners
  const handleLocked = ({ purchaseToken, alreadyLocked }) => {
    console.log('Locked:', purchaseToken, alreadyLocked);
  };

  const handleCleared = () => {
    console.log('Cleared');
  };

  const handleError = ({ error, context }) => {
    console.error('Error:', context, error);
  };

  agent.onLocked(handleLocked);
  agent.onCleared(handleCleared);
  agent.onError(handleError);

  // Cleanup
  return () => {
    agent.offLocked(handleLocked);
    agent.offCleared(handleCleared);
    agent.offError(handleError);
  };
});
</script>
```

### 3. Handle Cart Events

```vue
<script setup lang="ts">
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
  cartItems.value = [];

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
</script>
```

---

## Composable (Optional)

Create a reusable composable for Qredex Agent:

```ts
// composables/useQredexAgent.ts
import { ref, onMounted, onUnmounted } from 'vue';

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
  const isInitialized = ref(false);
  const hasIIT = ref(false);
  const hasPIT = ref(false);
  const iitToken = ref<string | null>(null);
  const pitToken = ref<string | null>(null);

  const updateStatus = () => {
    const agent = window.QredexAgent;
    if (!agent) return;

    isInitialized.value = agent.isInitialized();
    hasIIT.value = agent.hasIntentToken();
    hasPIT.value = agent.hasPurchaseIntentToken();
    iitToken.value = agent.getIntentToken();
    pitToken.value = agent.getPurchaseIntentToken();
  };

  onMounted(() => {
    const agent = window.QredexAgent;
    if (!agent) return;

    agent.init({ debug: true });

    const handleLocked = ({ purchaseToken, alreadyLocked }) => {
      console.log('Qredex locked:', { purchaseToken, alreadyLocked });
      updateStatus();
    };

    const handleCleared = () => {
      console.log('Qredex cleared');
      updateStatus();
    };

    const handleError = ({ error, context }) => {
      console.error('Qredex error:', context, error);
    };

    agent.onLocked(handleLocked);
    agent.onCleared(handleCleared);
    agent.onError(handleError);

    updateStatus();

    onUnmounted(() => {
      agent.offLocked(handleLocked);
      agent.offCleared(handleCleared);
      agent.offError(handleError);
    });
  });

  const addToCart = async (product: Product) => {
    await fetch('/api/cart', {
      method: 'POST',
      body: JSON.stringify(product),
    });

    window.QredexAgent.handleCartAdd({
      productId: product.id,
      quantity: product.quantity || 1,
      price: product.price,
    });

    updateStatus();
  };

  const clearCart = () => {
    window.QredexAgent.handleCartEmpty();
    updateStatus();
  };

  const checkout = async (order: Order) => {
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

    updateStatus();

    return response;
  };

  return {
    isInitialized,
    hasIIT,
    hasPIT,
    iitToken,
    pitToken,
    addToCart,
    clearCart,
    checkout,
    updateStatus,
  };
}
```

### Use Composable in Components

```vue
<script setup lang="ts">
import { useQredexAgent } from '@/composables/useQredexAgent';

const { addToCart, clearCart, checkout, hasPIT, pitToken } = useQredexAgent();

const handleAddToCart = async (product: Product) => {
  try {
    await addToCart(product);
    alert('Added to cart!');
  } catch (error) {
    console.error('Failed to add to cart:', error);
  }
};

const handleCheckout = async (order: Order) => {
  try {
    await checkout(order);
    alert('Order placed!');
  } catch (error) {
    console.error('Checkout failed:', error);
  }
};
</script>

<template>
  <div>
    <div v-if="hasPIT">
      <p>✅ Attribution locked: {{ pitToken }}</p>
    </div>
    <div v-else>
      <p>❌ No attribution</p>
    </div>
  </div>
</template>
```

---

## Nuxt 3 Integration

For Nuxt 3, create a plugin:

```ts
// plugins/qredex-agent.ts
export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    // Qredex Agent script should be loaded in app.vue or nuxt.config
    const agent = window.QredexAgent;

    return {
      provide: {
        qredex: agent,
      },
    };
  }
});
```

### Configure Script Loading (nuxt.config.ts)

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      script: [
        {
          src: 'https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js',
          defer: true,
        },
      ],
    },
  },
});
```

### Use in Components

```vue
<script setup lang="ts">
const { $qredex } = useNuxtApp();

onMounted(() => {
  if ($qredex) {
    $qredex.init({ debug: true });

    $qredex.onLocked(({ purchaseToken }) => {
      console.log('Locked:', purchaseToken);
    });
  }
});

const addToCart = async (product) => {
  await $fetch('/api/cart', {
    method: 'POST',
    body: product,
  });

  $qredex?.handleCartAdd({
    productId: product.id,
    quantity: 1,
    price: product.price,
  });
};
</script>
```

---

## TypeScript Support

Add type declarations:

```ts
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

**Solution:** Ensure script loaded before app mounts:

```html
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
<script type="module" src="/src/main.ts"></script>
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
| [../react/](../react/) | React/Next.js integration |

---

## License

MIT
