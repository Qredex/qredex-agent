# Qredex Agent - Vanilla JS Example

Complete e-commerce demo showing Qredex Agent integration with vanilla JavaScript.

---

## Quick Start

### Option 1: Using Simple HTTP Server

```bash
# From project root
npx serve examples

# Or using Python
cd examples/vanilla
python -m http.server 8000
```

Then open `http://localhost:3000/vanilla/` or `http://localhost:8000/`

### Option 2: Open Directly

```bash
# Open directly in browser (some features may be limited)
open index.html
```

---

## Files

| File | Description |
|------|-------------|
| `index.html` | Demo page HTML structure |
| `styles.css` | All CSS styles |
| `app.js` | Application logic and Qredex Agent integration |

---

## Testing Scenarios

### Scenario 1: Initial State

**Steps:**
1. Open the demo page in a fresh browser tab
2. Check the status bar at the top

**Expected Results:**
- ❌ IIT: Gray dot (no token)
- ❌ PIT: Gray dot (no token)
- Cart is empty

---

### Scenario 2: Simulate Intent URL

**Steps:**
1. Add `?qdx_intent=test_token_123` to the URL
2. Press Enter to reload

**Expected Results:**
- ✅ IIT: Green dot (token captured)
- Console shows: "Token stored"

---

### Scenario 3: Add to Cart (Lock Intent)

**Prerequisites:** IIT must exist (complete Scenario 2)

**Steps:**
1. Click **Add to Cart** on any product
2. Watch the status bar and notifications

**Expected Results:**
- ✅ PIT: Green dot (locked)
- Notification: "Attribution locked!"
- Product appears in cart
- Cart total updates

---

### Scenario 4: Clear Cart

**Prerequisites:** PIT must exist (complete Scenario 3)

**Steps:**
1. Click **Clear Cart** button

**Expected Results:**
- ❌ PIT: Gray dot (cleared)
- Notification: "Attribution cleared"
- Cart is empty

---

### Scenario 5: Full Checkout Flow

**Steps:**
1. Add `?qdx_intent=test123` to URL
2. Add items to cart (locks IIT → PIT)
3. Click **Checkout**

**Expected Results:**
- Order confirmation alert
- ❌ PIT: Gray dot (cleared after payment)
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

## How It Works

### 1. Agent Initialization

```javascript
// app.js
window.QredexAgentConfig = {
  debug: true,  // Enable debug logging
};

QredexAgent.onLocked(({ purchaseToken, alreadyLocked }) => {
  console.log('✅ Qredex locked:', purchaseToken);
  showNotification('Attribution locked!', 'success');
});

QredexAgent.onCleared(() => {
  console.log('🗑️ Qredex cleared');
  showNotification('Attribution cleared', 'info');
});
```

### 2. Add to Cart

```javascript
async function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  
  // Add to local cart
  cartItems.push({ ...product, quantity: 1 });
  
  // Tell Qredex agent (auto-locks IIT → PIT)
  QredexAgent.handleCartAdd({
    productId: product.id,
    quantity: 1,
    price: product.price,
  });
  
  renderCart();
}
```

### 3. Clear Cart

```javascript
function clearCart() {
  cartItems = [];
  renderCart();
  
  // Tell Qredex agent (auto-clears PIT)
  QredexAgent.handleCartEmpty();
}
```

### 4. Checkout

```javascript
async function checkout() {
  // Get PIT for backend
  const pit = QredexAgent.getPurchaseIntentToken();
  
  // Submit order with PIT
  await fetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      ...order,
      qredex_pit: pit,
    }),
  });
  
  // Tell Qredex agent (auto-clears PIT)
  QredexAgent.handlePaymentSuccess({
    orderId: order.id,
    amount: order.total,
    currency: 'USD',
  });
}
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

### Network Tab

Monitor API calls:
- `POST /api/v1/agent/intents/lock` - Lock request

---

## Related Examples

| Example | Description |
|---------|-------------|
| [../basic/](../basic/) | Comprehensive demo with testing UI |
| [../react/](../react/) | React/Next.js integration |
| [../vue/](../vue/) | Vue/Nuxt integration |

---

## License

MIT
