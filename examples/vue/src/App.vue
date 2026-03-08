<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

// ============================================
// TYPES
// ============================================

interface Product {
  id: string;
  name: string;
  price: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface LogEntry {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  timestamp: string;
}

// ============================================
// SAMPLE DATA
// ============================================

const PRODUCTS: Product[] = [
  { id: 'prod_1', name: 'Premium Widget', price: 29.99 },
  { id: 'prod_2', name: 'Deluxe Gadget', price: 49.99 },
  { id: 'prod_3', name: 'Ultimate Tool', price: 99.99 },
  { id: 'prod_4', name: 'Super Device', price: 149.99 },
];

// ============================================
// STATE
// ============================================

const cartItems = ref<CartItem[]>([]);
const logs = ref<LogEntry[]>([]);
const notification = ref<{ message: string; type: string } | null>(null);
const isInitialized = ref(false);
const hasIIT = ref(false);
const hasPIT = ref(false);
const iitToken = ref<string | null>(null);
const pitToken = ref<string | null>(null);

// ============================================
// HELPER FUNCTIONS
// ============================================

const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
  logs.value.push({
    id: Date.now(),
    message,
    type,
    timestamp: new Date().toLocaleTimeString(),
  });
};

const showNotification = (message: string, type: string) => {
  notification.value = { message, type };
  setTimeout(() => {
    notification.value = null;
  }, 3000);
};

const updateStatus = () => {
  if (typeof window !== 'undefined' && (window as any).QredexAgent) {
    const agent = (window as any).QredexAgent;
    const initialized = agent.isInitialized();
    const iit = agent.getIntentToken();
    const pit = agent.getPurchaseIntentToken();

    isInitialized.value = initialized;
    hasIIT.value = agent.hasIntentToken();
    hasPIT.value = agent.hasPurchaseIntentToken();
    iitToken.value = iit;
    pitToken.value = pit;
  }
};

// ============================================
// QREDEX AGENT SETUP
// ============================================

let handleLocked: ((event: any) => void) | null = null;
let handleCleared: (() => void) | null = null;
let handleError: ((event: any) => void) | null = null;

onMounted(() => {
  if (typeof window === 'undefined') return;

  const agent = (window as any).QredexAgent;
  if (!agent) {
    addLog('Qredex Agent not loaded!', 'error');
    return;
  }

  // Initialize with debug mode
  agent.init({ debug: true });
  addLog('Qredex Agent initialized', 'success');

  // Register event listeners
  handleLocked = ({ purchaseToken, alreadyLocked }: { purchaseToken: string; alreadyLocked: boolean }) => {
    addLog(`✅ Intent locked! PIT: ${purchaseToken.substring(0, 20)}...`, 'success');
    addLog(`   Already locked: ${alreadyLocked}`, 'info');
    showNotification('Attribution locked!', 'success');
    updateStatus();
  };

  handleCleared = () => {
    addLog('🗑️ Attribution cleared', 'info');
    showNotification('Attribution cleared', 'info');
    updateStatus();
  };

  handleError = ({ error, context }: { error: string; context?: string }) => {
    addLog(`❌ Error in ${context || 'unknown'}: ${error}`, 'error');
    showNotification(`Error: ${error}`, 'error');
  };

  agent.onLocked(handleLocked);
  agent.onCleared(handleCleared);
  agent.onError(handleError);

  // Initial status update
  updateStatus();
  addLog('Qredex Agent demo ready', 'success');
});

onUnmounted(() => {
  if (typeof window !== 'undefined' && (window as any).QredexAgent) {
    const agent = (window as any).QredexAgent;
    if (handleLocked) agent.offLocked(handleLocked);
    if (handleCleared) agent.offCleared(handleCleared);
    if (handleError) agent.offError(handleError);
  }
});

// ============================================
// CART FUNCTIONS
// ============================================

const addToCart = async (product: Product) => {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));

    // Add to local cart
    const existing = cartItems.value.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cartItems.value.push({ ...product, quantity: 1 });
    }

    // Tell Qredex agent (auto-locks IIT → PIT)
    const agent = (window as any).QredexAgent;
    if (agent) {
      agent.handleCartAdd({
        productId: product.id,
        quantity: 1,
        price: product.price,
      });
    }

    addLog(`Added ${product.name} to cart`, 'success');
    showNotification(`Added ${product.name} to cart!`, 'success');
    updateStatus();
  } catch (error) {
    console.error('Failed to add to cart:', error);
    addLog('Failed to add to cart', 'error');
    showNotification('Failed to add to cart', 'error');
  }
};

const clearCart = () => {
  cartItems.value = [];

  // Tell Qredex agent (auto-clears PIT)
  const agent = (window as any).QredexAgent;
  if (agent) {
    agent.handleCartEmpty();
  }

  addLog('Cart cleared', 'info');
  showNotification('Cart cleared', 'info');
  updateStatus();
};

const checkout = async () => {
  if (cartItems.value.length === 0) return;

  try {
    // Get PIT for backend
    const agent = (window as any).QredexAgent;
    const pit = agent?.getPurchaseIntentToken();

    const total = cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = {
      id: 'order_' + Date.now(),
      items: cartItems.value,
      total: total,
      currency: 'USD' as const,
    };

    addLog(`Submitting order... PIT: ${pit ? '✅' : '❌'}`, 'info');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('Order submitted with PIT:', pit);

    // Tell Qredex agent (auto-clears PIT)
    if (agent) {
      agent.handlePaymentSuccess({
        orderId: order.id,
        amount: order.total,
        currency: order.currency,
      });
    }

    addLog(`Order ${order.id} placed successfully!`, 'success');
    showNotification('Order placed! Redirecting...', 'success');

    // Clear cart after checkout
    cartItems.value = [];

    // Simulate redirect
    setTimeout(() => {
      alert(`Order ${order.id} placed successfully!\n\nIn production, redirect to: /orders/${order.id}`);
    }, 500);
  } catch (error) {
    console.error('Checkout error:', error);
    addLog('Checkout failed', 'error');
    showNotification('Checkout failed', 'error');
  }
};

const clearLog = () => {
  logs.value = [];
};

const clearTokens = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.clear();
    document.cookie.split(';').forEach(c => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    addLog('All tokens cleared manually', 'warning');
    updateStatus();
  }
};

// ============================================
// COMPUTED
// ============================================

const cartTotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

</script>

<template>
  <div class="container">
    <header>
      <h1>🛍️ Qredex Agent Demo</h1>
      <p>Vue 3 integration example</p>

      <div class="status-bar">
        <div class="status-item">
          <div class="status-dot" :class="{ active: isInitialized }" />
          <span>Initialized: {{ isInitialized ? '✅ Yes' : '❌ No' }}</span>
        </div>
        <div class="status-item">
          <div class="status-dot" :class="{ active: hasIIT }" />
          <span>IIT: {{ hasIIT ? '✅ Present' : '❌ None' }}</span>
        </div>
        <div class="status-item">
          <div class="status-dot" :class="{ active: hasPIT }" />
          <span>PIT: {{ hasPIT ? '✅ Present' : '❌ None' }}</span>
        </div>
      </div>
    </header>

    <main>
      <!-- Products -->
      <section class="card">
        <h2>📦 Products</h2>
        <div class="products-grid">
          <div v-for="product in PRODUCTS" :key="product.id" class="product-card">
            <h3>{{ product.name }}</h3>
            <div class="price">${{ product.price.toFixed(2) }}</div>
            <button class="btn" @click="addToCart(product)">Add to Cart</button>
          </div>
        </div>
      </section>

      <!-- Cart -->
      <section class="cart">
        <h2>🛒 Shopping Cart</h2>
        <p v-if="cartItems.length === 0">Cart is empty</p>
        <ul v-else class="cart-items">
          <li v-for="item in cartItems" :key="item.id" class="cart-item">
            <span>{{ item.name }} × {{ item.quantity }}</span>
            <span>${{ (item.price * item.quantity).toFixed(2) }}</span>
          </li>
        </ul>
        <div class="cart-total">Total: ${{ cartTotal.toFixed(2) }}</div>
        <div class="cart-actions">
          <button class="btn btn-danger" @click="clearCart" :disabled="cartItems.length === 0">
            Clear Cart
          </button>
          <button class="btn" @click="checkout" :disabled="cartItems.length === 0">
            Checkout
          </button>
        </div>
      </section>

      <!-- Token Display -->
      <section class="card">
        <h2>🔑 Tokens</h2>

        <h3>Influence Intent Token (IIT)</h3>
        <div v-if="iitToken" class="token-display">{{ iitToken }}</div>
        <div v-else class="token-display empty">No intent token found</div>

        <h3>Purchase Intent Token (PIT)</h3>
        <div v-if="pitToken" class="token-display">{{ pitToken }}</div>
        <div v-else class="token-display empty">No purchase token found</div>

        <div class="actions">
          <button class="btn btn-secondary" @click="updateStatus">Refresh</button>
          <button class="btn btn-danger" @click="clearTokens">Clear Tokens</button>
        </div>
      </section>

      <!-- Console Log -->
      <section class="card">
        <h2>📋 Console Log</h2>
        <div class="log-output">
          <div v-if="logs.length === 0" class="log-entry info">
            No logs yet. Add items to cart to see events.
          </div>
          <div v-else v-for="log in logs" :key="log.id" class="log-entry" :class="log.type">
            <span>[{{ log.timestamp }}]</span> {{ log.message }}
          </div>
        </div>
        <div class="actions">
          <button class="btn btn-secondary" @click="clearLog">Clear Log</button>
        </div>
      </section>

      <!-- API Reference -->
      <section class="card">
        <h2>📖 API Reference</h2>
        <p>Access the agent from browser console:</p>
        <pre><code>// Get tokens
QredexAgent.getIntentToken()
QredexAgent.getPurchaseIntentToken()

// Check token existence
QredexAgent.hasIntentToken()
QredexAgent.hasPurchaseIntentToken()

// Event handlers
QredexAgent.handleCartAdd({ productId, quantity, price })
QredexAgent.handleCartEmpty()
QredexAgent.handlePaymentSuccess({ orderId, amount, currency })

// Event listeners
QredexAgent.onLocked(({ purchaseToken, alreadyLocked }) => { ... })
QredexAgent.onCleared(() => { ... })
QredexAgent.onError(({ error, context }) => { ... })

// Manual lock
await QredexAgent.lockIntent({ productId, quantity })

// Status
QredexAgent.isInitialized()
QredexAgent.getStatus()</code></pre>
      </section>
    </main>

    <!-- Notification -->
    <div v-if="notification" class="notification" :class="`notification-${notification.type}`">
      {{ notification.message }}
    </div>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --primary: #3498db;
  --primary-hover: #2980b9;
  --success: #2ecc71;
  --danger: #e74c3c;
  --warning: #f39c12;
  --dark: #2c3e50;
  --light: #ecf0f1;
  --gray: #95a5a6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background: var(--light);
  min-height: 100vh;
}

header {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
  color: var(--dark);
  margin-bottom: 10px;
}

h2 {
  color: var(--dark);
  margin-bottom: 15px;
  font-size: 1.25rem;
}

h3 {
  color: var(--dark);
  margin: 15px 0 10px;
  font-size: 1rem;
}

.status-bar {
  display: flex;
  gap: 20px;
  margin-top: 15px;
  padding: 15px;
  background: var(--light);
  border-radius: 4px;
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border-radius: 4px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--gray);
}

.status-dot.active {
  background: var(--success);
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.product-card {
  border: 1px solid var(--light);
  border-radius: 8px;
  padding: 20px;
  background: white;
  transition: box-shadow 0.2s;
}

.product-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.product-card .price {
  font-size: 24px;
  font-weight: bold;
  color: var(--success);
  margin: 10px 0 15px;
}

.btn {
  background: var(--primary);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;
  width: 100%;
}

.btn:hover {
  background: var(--primary-hover);
}

.btn:disabled {
  background: var(--gray);
  cursor: not-allowed;
}

.btn-danger {
  background: var(--danger);
}

.btn-danger:hover {
  background: #c0392b;
}

.btn-secondary {
  background: var(--gray);
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.cart {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.cart-items {
  list-style: none;
  margin: 15px 0;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--light);
}

.cart-item:last-child {
  border-bottom: none;
}

.cart-total {
  text-align: right;
  font-size: 1.25rem;
  font-weight: bold;
  margin-top: 15px;
}

.cart-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.token-display {
  background: var(--dark);
  color: var(--success);
  padding: 15px;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 14px;
  word-break: break-all;
  margin: 10px 0;
}

.token-display.empty {
  color: var(--gray);
  font-style: italic;
}

.log-output {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 15px;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 13px;
  max-height: 300px;
  overflow-y: auto;
}

.log-entry {
  margin: 5px 0;
  padding: 5px;
  border-left: 3px solid var(--primary);
  padding-left: 10px;
}

.log-entry.error {
  border-left-color: var(--danger);
  color: #f48771;
}

.log-entry.success {
  border-left-color: var(--success);
  color: #89d185;
}

.log-entry.info {
  border-left-color: var(--primary);
}

.notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 15px 25px;
  border-radius: 4px;
  color: white;
  font-weight: 500;
  animation: slideIn 0.3s ease;
  z-index: 1000;
}

.notification-info {
  background: var(--primary);
}

.notification-success {
  background: var(--success);
}

.notification-error {
  background: var(--danger);
}

.notification-warning {
  background: var(--warning);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

pre {
  background: var(--light);
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 13px;
}

code {
  font-family: 'Monaco', 'Consolas', monospace;
}
</style>
