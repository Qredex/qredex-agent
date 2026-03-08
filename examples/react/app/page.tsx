'use client';

import { useEffect, useState, useCallback } from 'react';

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
// MAIN COMPONENT
// ============================================

export default function Home() {
  // State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasIIT, setHasIIT] = useState(false);
  const [hasPIT, setHasPIT] = useState(false);
  const [iitToken, setIitToken] = useState<string | null>(null);
  const [pitToken, setPitToken] = useState<string | null>(null);

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setLogs(prev => [
      ...prev,
      {
        id: Date.now(),
        message,
        type,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, []);

  const showNotification = useCallback((message: string, type: string) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const updateStatus = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).QredexAgent) {
      const agent = (window as any).QredexAgent;
      const initialized = agent.isInitialized();
      const iit = agent.getIntentToken();
      const pit = agent.getPurchaseIntentToken();

      setIsInitialized(initialized);
      setHasIIT(agent.hasIntentToken());
      setHasPIT(agent.hasPurchaseIntentToken());
      setIitToken(iit);
      setPitToken(pit);
    }
  }, []);

  // ============================================
  // QREDEX AGENT SETUP
  // ============================================

  useEffect(() => {
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
    const handleLocked = ({ purchaseToken, alreadyLocked }: { purchaseToken: string; alreadyLocked: boolean }) => {
      addLog(`✅ Intent locked! PIT: ${purchaseToken.substring(0, 20)}...`, 'success');
      addLog(`   Already locked: ${alreadyLocked}`, 'info');
      showNotification('Attribution locked!', 'success');
      updateStatus();
    };

    const handleCleared = () => {
      addLog('🗑️ Attribution cleared', 'info');
      showNotification('Attribution cleared', 'info');
      updateStatus();
    };

    const handleError = ({ error, context }: { error: string; context?: string }) => {
      addLog(`❌ Error in ${context || 'unknown'}: ${error}`, 'error');
      showNotification(`Error: ${error}`, 'error');
    };

    agent.onLocked(handleLocked);
    agent.onCleared(handleCleared);
    agent.onError(handleError);

    // Initial status update
    updateStatus();
    addLog('Qredex Agent demo ready', 'success');

    // Cleanup
    return () => {
      agent.offLocked(handleLocked);
      agent.offCleared(handleCleared);
      agent.offError(handleError);
    };
  }, [addLog, showNotification, updateStatus]);

  // ============================================
  // CART FUNCTIONS
  // ============================================

  const addToCart = async (product: Product) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      // Add to local cart
      setCartItems(prev => {
        const existing = prev.find(item => item.id === product.id);
        if (existing) {
          return prev.map(item =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [...prev, { ...product, quantity: 1 }];
      });

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
    setCartItems([]);

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
    if (cartItems.length === 0) return;

    try {
      // Get PIT for backend
      const agent = (window as any).QredexAgent;
      const pit = agent?.getPurchaseIntentToken();

      const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const order = {
        id: 'order_' + Date.now(),
        items: cartItems,
        total: total,
        currency: 'USD',
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
      setCartItems([]);

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
    setLogs([]);
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
  // RENDER
  // ============================================

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="container">
      <header>
        <h1>🛍️ Qredex Agent Demo</h1>
        <p>React/Next.js integration example</p>

        <div className="status-bar">
          <div className="status-item">
            <div className={`status-dot ${isInitialized ? 'active' : ''}`} />
            <span>Initialized: {isInitialized ? '✅ Yes' : '❌ No'}</span>
          </div>
          <div className="status-item">
            <div className={`status-dot ${hasIIT ? 'active' : ''}`} />
            <span>IIT: {hasIIT ? '✅ Present' : '❌ None'}</span>
          </div>
          <div className="status-item">
            <div className={`status-dot ${hasPIT ? 'active' : ''}`} />
            <span>PIT: {hasPIT ? '✅ Present' : '❌ None'}</span>
          </div>
        </div>
      </header>

      <main>
        {/* Products */}
        <section className="card">
          <h2>📦 Products</h2>
          <div className="products-grid">
            {PRODUCTS.map(product => (
              <div key={product.id} className="product-card">
                <h3>{product.name}</h3>
                <div className="price">${product.price.toFixed(2)}</div>
                <button className="btn" onClick={() => addToCart(product)}>
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Cart */}
        <section className="cart">
          <h2>🛒 Shopping Cart</h2>
          {cartItems.length === 0 ? (
            <p>Cart is empty</p>
          ) : (
            <ul className="cart-items">
              {cartItems.map(item => (
                <li key={item.id} className="cart-item">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="cart-total">
            Total: ${cartTotal.toFixed(2)}
          </div>
          <div className="cart-actions">
            <button className="btn btn-danger" onClick={clearCart} disabled={cartItems.length === 0}>
              Clear Cart
            </button>
            <button className="btn" onClick={checkout} disabled={cartItems.length === 0}>
              Checkout
            </button>
          </div>
        </section>

        {/* Token Display */}
        <section className="card">
          <h2>🔑 Tokens</h2>

          <h3>Influence Intent Token (IIT)</h3>
          {iitToken ? (
            <div className="token-display">{iitToken}</div>
          ) : (
            <div className="token-display empty">No intent token found</div>
          )}

          <h3>Purchase Intent Token (PIT)</h3>
          {pitToken ? (
            <div className="token-display">{pitToken}</div>
          ) : (
            <div className="token-display empty">No purchase token found</div>
          )}

          <div className="actions">
            <button className="btn btn-secondary" onClick={updateStatus}>
              Refresh
            </button>
            <button className="btn btn-danger" onClick={clearTokens}>
              Clear Tokens
            </button>
          </div>
        </section>

        {/* Console Log */}
        <section className="card">
          <h2>📋 Console Log</h2>
          <div className="log-output">
            {logs.length === 0 ? (
              <div className="log-entry info">No logs yet. Add items to cart to see events.</div>
            ) : (
              logs.map(log => (
                <div key={log.id} className={`log-entry ${log.type}`}>
                  <span>[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
          </div>
          <div className="actions">
            <button className="btn btn-secondary" onClick={clearLog}>
              Clear Log
            </button>
          </div>
        </section>

        {/* API Reference */}
        <section className="card">
          <h2>📖 API Reference</h2>
          <p>Access the agent from browser console:</p>
          <pre>
            <code>{`// Get tokens
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
QredexAgent.getStatus()`}</code>
          </pre>
        </section>
      </main>

      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}
