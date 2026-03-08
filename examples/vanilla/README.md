# Qredex Agent - Vanilla JS Example

This example shows how to integrate Qredex Agent with vanilla JavaScript.

## Quick Start

Open `index.html` in your browser (or serve with a local server).

## Files

- `index.html` - Demo page with Qredex Agent integration
- `app.js` - Application logic

## Usage

### 1. Include Agent Script

```html
<!-- Add before </body> -->
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
<script src="app.js"></script>
```

### 2. Initialize Agent (Optional)

```javascript
// app.js

// Optional: configure agent
window.QredexAgentConfig = {
  debug: true,  // Enable debug logging
};

// Optional: listen for agent events
QredexAgent.onLocked(({ purchaseToken, alreadyLocked }) => {
  console.log('Locked:', purchaseToken, alreadyLocked);
  showNotification('Intent locked!');
});

QredexAgent.onCleared(() => {
  console.log('Cleared');
  showNotification('Attribution cleared');
});

QredexAgent.onError(({ error, context }) => {
  console.error('Error:', context, error);
  showNotification('Error: ' + error, 'error');
});
```

### 3. Handle Cart Events

```javascript
// Add to cart
async function addToCart(productId, quantity = 1) {
  try {
    const response = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity }),
    });

    const product = await response.json();

    // Tell Qredex agent (auto-locks IIT → PIT)
    QredexAgent.handleCartAdd({
      productId: product.id,
      quantity: product.quantity,
      price: product.price,
    });

    updateCartUI(product);
    showNotification('Added to cart!');
  } catch (error) {
    console.error('Failed to add to cart:', error);
    showNotification('Failed to add to cart', 'error');
  }
}

// Clear cart
function clearCart() {
  // Your cart clear logic
  cartItems = [];
  updateCartUI();

  // Tell Qredex agent (auto-clears PIT)
  QredexAgent.handleCartEmpty();
  showNotification('Cart cleared');
}

// Checkout
async function checkout() {
  try {
    // Get PIT for backend
    const pit = QredexAgent.getPurchaseIntentToken();

    if (!pit) {
      showNotification('No attribution found', 'warning');
    }

    const order = {
      items: cartItems,
      total: calculateTotal(),
      currency: 'USD',
      customer: getCustomerInfo(),
    };

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...order,
        qredex_pit: pit,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      // Tell Qredex agent (auto-clears PIT)
      QredexAgent.handlePaymentSuccess({
        orderId: result.orderId,
        amount: order.total,
        currency: order.currency,
      });

      showNotification('Order placed!');
      window.location.href = `/orders/${result.orderId}`;
    } else {
      showNotification('Checkout failed: ' + result.error, 'error');
    }
  } catch (error) {
    console.error('Checkout error:', error);
    showNotification('Checkout failed', 'error');
  }
}
```

### 4. UI Helpers

```javascript
// Simple notification system
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Update cart UI
function updateCartUI(product) {
  const cartCount = document.getElementById('cart-count');
  if (cartCount) {
    cartCount.textContent = cartItems.length;
  }
}

// Calculate total
function calculateTotal() {
  return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
}

// Get customer info
function getCustomerInfo() {
  return {
    email: localStorage.getItem('customer_email') || '',
  };
}
```

## Complete Example

See `index.html` and `app.js` for a complete working example.

## License

MIT
