/**
 * Qredex Agent - Vanilla JS Example Application
 *
 * This demonstrates a complete e-commerce integration with Qredex Agent.
 */

// ============================================
// STATE
// ============================================

let cartItems = [];

const products = [
  { id: 'prod_1', name: 'Premium Widget', price: 29.99 },
  { id: 'prod_2', name: 'Deluxe Gadget', price: 49.99 },
  { id: 'prod_3', name: 'Ultimate Tool', price: 99.99 },
  { id: 'prod_4', name: 'Super Device', price: 149.99 },
];

// ============================================
// QREDEX AGENT SETUP
// ============================================

// Configure agent (optional)
window.QredexAgentConfig = {
  debug: true,  // Enable debug logging
};

// Listen for agent events (optional but recommended)
QredexAgent.onLocked(({ purchaseToken, alreadyLocked }) => {
  console.log('✅ Qredex locked:', { purchaseToken, alreadyLocked });
  showNotification('Attribution locked!', 'success');
  updateStatus();
});

QredexAgent.onCleared(() => {
  console.log('🗑️ Qredex cleared');
  showNotification('Attribution cleared', 'info');
  updateStatus();
});

QredexAgent.onError(({ error, context }) => {
  console.error('❌ Qredex error:', context, error);
  showNotification('Error: ' + error, 'error');
});

// ============================================
// UI FUNCTIONS
// ============================================

function renderProducts() {
  const container = document.getElementById('products');
  container.innerHTML = products.map(product => `
    <div class="product-card">
      <h3>${product.name}</h3>
      <div class="price">$${product.price.toFixed(2)}</div>
      <button class="btn" onclick="addToCart('${product.id}')">
        Add to Cart
      </button>
    </div>
  `).join('');
}

function renderCart() {
  const container = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');

  if (cartItems.length === 0) {
    container.innerHTML = '<li>Cart is empty</li>';
    totalEl.textContent = '0.00';
    checkoutBtn.disabled = true;
  } else {
    container.innerHTML = cartItems.map(item => `
      <li class="cart-item">
        <span>${item.name} × ${item.quantity}</span>
        <span>$${(item.price * item.quantity).toFixed(2)}</span>
      </li>
    `).join('');

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    totalEl.textContent = total.toFixed(2);
    checkoutBtn.disabled = false;
  }

  updateStatus();
}

function updateStatus() {
  const hasIIT = QredexAgent.hasIntentToken();
  const hasPIT = QredexAgent.hasPurchaseIntentToken();

  document.getElementById('iit-status').classList.toggle('active', hasIIT);
  document.getElementById('pit-status').classList.toggle('active', hasPIT);
  document.getElementById('iit-value').textContent = hasIIT ? '✅ Present' : '❌ None';
  document.getElementById('pit-value').textContent = hasPIT ? '✅ Present' : '❌ None';
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// ============================================
// CART FUNCTIONS
// ============================================

async function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));

    // Add to local cart
    const previousCount = cartItems.length;
    const existingItem = cartItems.find(item => item.id === productId);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cartItems.push({ ...product, quantity: 1 });
    }

    // Tell Qredex agent (auto-locks IIT → PIT on first item)
    QredexAgent.handleCartChange({
      itemCount: cartItems.length,
      previousCount,
      meta: {
        productId: product.id,
        quantity: existingItem ? existingItem.quantity : 1,
        price: product.price,
      },
    });

    renderCart();
    showNotification(`Added ${product.name} to cart!`, 'success');
  } catch (error) {
    console.error('Failed to add to cart:', error);
    showNotification('Failed to add to cart', 'error');
  }
}

function clearCart() {
  const previousCount = cartItems.length;
  cartItems = [];
  renderCart();

  // Tell Qredex agent (auto-clears PIT when cart emptied)
  QredexAgent.handleCartChange({
    itemCount: 0,
    previousCount,
  });

  showNotification('Cart cleared', 'info');
}

async function checkout() {
  if (cartItems.length === 0) return;

  try {
    // Get PIT for backend
    const pit = QredexAgent.getPurchaseIntentToken();

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = {
      id: 'order_' + Date.now(),
      items: cartItems,
      total: total,
      currency: 'USD',
      customer: {
        email: 'customer@example.com',
      },
    };

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('Submitting order with PIT:', pit ? '✅' : '❌');

    // Tell Qredex agent (auto-clears PIT)
    QredexAgent.handlePaymentSuccess({
      orderId: order.id,
      amount: order.total,
      currency: order.currency,
    });

    showNotification('Order placed! Redirecting...', 'success');

    // Simulate redirect
    setTimeout(() => {
      alert(`Order ${order.id} placed successfully!\n\nIn production, you would redirect to: /orders/${order.id}`);
      cartItems = [];
      renderCart();
    }, 1000);
  } catch (error) {
    console.error('Checkout error:', error);
    showNotification('Checkout failed', 'error');
  }
}

// ============================================
// INITIALIZE
// ============================================

function init() {
  renderProducts();
  renderCart();
  updateStatus();

  console.log('🚀 Qredex Agent Demo initialized');
  console.log('📦 Products:', products.length);
  console.log('🛒 Cart items:', cartItems.length);
}

// Start the app
init();
