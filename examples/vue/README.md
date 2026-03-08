# Qredex Agent - Vue/Nuxt Example

Complete example of Qredex Agent integration with Vue 3 and Vite.

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

Navigate to `http://localhost:5173`

---

## Files

| File | Description |
|------|-------------|
| `index.html` | HTML template with Qredex script |
| `src/App.vue` | Main demo component with all logic |
| `src/main.ts` | App entry point |
| `vite.config.ts` | Vite configuration |
| `package.json` | Dependencies |

---

## Testing Scenarios

### Scenario 1: Initial State

**Steps:**
1. Open `http://localhost:5173` in a fresh browser tab
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

  agent.init({ debug: true });

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

  onUnmounted(() => {
    agent.offLocked(handleLocked);
    agent.offCleared(handleCleared);
    agent.offError(handleError);
  });
});
</script>
```

### 3. Handle Cart Events

```vue
<script setup lang="ts">
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
  cartItems.value = [];
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
</script>
```

---

## Nuxt 3 Integration

For Nuxt 3, create a plugin:

```ts
// plugins/qredex-agent.ts
export default defineNuxtPlugin(() => {
  if (import.meta.client) {
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
| [../react/](../react/) | React/Next.js integration |

---

## License

MIT
