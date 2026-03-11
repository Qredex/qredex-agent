# Qredex Agent - API Reference

Complete reference for the Qredex Agent public API.

---

## Table of Contents

- [Initialization](#initialization)
- [Token Access](#token-access)
- [Lock Operations](#lock-operations)
- [Event Handlers (Merchant → Agent)](#event-handlers-merchant--agent)
- [Event Listeners (Agent → Merchant)](#event-listeners-agent--merchant)
- [Lifecycle](#lifecycle)
- [Types](#types)

---

## Initialization

### `init(config?)`

Initialize the agent with optional configuration.

**Signature:**
```typescript
function init(config?: AgentConfig): void
```

**Parameters:**
- `config` (optional) - Configuration options

**Configuration Options:**
```typescript
interface AgentConfig {
  lockEndpoint?: string;           // Default: 'https://api.qredex.com/api/v1/agent/intents/lock'
  debug?: boolean;                 // Default: false
  useMockEndpoint?: boolean;       // Default: false (⚠️ DEV ONLY)
  influenceIntentToken?: string;   // Default: '__qdx_iit'
  purchaseIntentToken?: string;    // Default: '__qdx_pit'
  cookieExpireDays?: number;       // Default: 30
}
```

**⚠️ Production Safety:**
- `useMockEndpoint: true` is for development only - never deploy to production
- Console warning logged when mock endpoint enabled on non-localhost domains

**Example:**
```javascript
// Development (local testing)
QredexAgentConfig = {
  debug: true,
  useMockEndpoint: true,  // Mock PIT, no network calls
};

// Production - use defaults (no config needed)
// QredexAgentConfig omitted entirely, or only set debug: true for troubleshooting
```

**Note:** Usually not needed - agent auto-starts on script load with default configuration.

---

## Token Access

### `getInfluenceIntentToken()`

Get the current Influence Intent Token (IIT).

**Signature:**
```typescript
function getInfluenceIntentToken(): string | null
```

**Returns:** IIT token string or `null`

**Example:**
```javascript
const iit = QredexAgent.getInfluenceIntentToken();
if (iit) {
  console.log('IIT:', iit);
}
```

**Storage Priority:**
1. sessionStorage (primary)
2. Cookie (fallback)

---

### `hasInfluenceIntentToken()`

Check if an Influence Intent Token (IIT) exists.

**Signature:**
```typescript
function hasInfluenceIntentToken(): boolean
```

**Returns:** `true` if IIT exists, `false` otherwise

**Example:**
```javascript
if (QredexAgent.hasInfluenceIntentToken()) {
  console.log('User came from Qredex link');
}
```

---

### `getPurchaseIntentToken()`

Get the current Purchase Intent Token (PIT).

**Signature:**
```typescript
function getPurchaseIntentToken(): string | null
```

**Returns:** PIT token string or `null`

**Example:**
```javascript
const pit = QredexAgent.getPurchaseIntentToken();
if (pit) {
  console.log('PIT:', pit);
  console.log('Ready for checkout!');
}
```

---

### `hasInfluenceIntentToken()`

Check if IIT exists.

**Signature:**
```typescript
function hasInfluenceIntentToken(): boolean
```

**Returns:** `true` if IIT available

**Example:**
```javascript
if (QredexAgent.hasInfluenceIntentToken()) {
  console.log('Intent token available');
} else {
  console.log('No intent token - shopper didn\'t come from Qredex link');
}
```

---

### `hasPurchaseIntentToken()`

Check if PIT exists.

**Signature:**
```typescript
function hasPurchaseIntentToken(): boolean
```

**Returns:** `true` if PIT available

**Example:**
```javascript
if (QredexAgent.hasPurchaseIntentToken()) {
  console.log('Purchase locked - ready for attribution');
}
```

---

## Lock Operations

### `lockIntent(meta?)`

Manually trigger lock request (IIT → PIT exchange).

**Signature:**
```typescript
function lockIntent(meta?: LockMeta): Promise<LockResult>
```

**Parameters:**
- `meta` (optional) - Metadata about the lock request

**Returns:** Promise resolving to `LockResult`

**Example:**
```javascript
const result = await QredexAgent.lockIntent({
  productId: 'widget-001',
  quantity: 2,
  price: 99.99,
});

if (result.success) {
  console.log('PIT:', result.purchaseToken);
  console.log('Already locked:', result.alreadyLocked);
} else {
  console.error('Lock failed:', result.error);
}
```

**Idempotency:**
- Returns cached PIT if already locked
- Returns same promise if lock in flight
- Safe to call multiple times

**Request Format:**
```typescript
// POST /api/v1/agent/intents/lock
{
  "token": "IIT_VALUE"
}

// Response
{
  "token": "PIT_VALUE",
  "expiresAt": "2026-04-07T12:00:00Z",
  "lockedAt": "2026-03-08T12:00:00Z"
}
```

---

### `clearIntent()`

Clear all tokens (IIT and PIT) from storage.

**Signature:**
```typescript
function clearIntent(): void
```

**Example:**
```javascript
// After successful checkout
QredexAgent.clearIntent();
```

**What it clears:**
- sessionStorage IIT
- sessionStorage PIT
- Cookie IIT
- Cookie PIT

**When to call:**
- After successful checkout
- When cart is emptied
- When user logs out

---

## Event Handlers (Merchant → Agent)

Tell the agent when important events happen.

### `handleCartAdd(event?)`

Tell the agent that a cart add event happened. Automatically locks IIT → PIT.

**Signature:**
```typescript
function handleCartAdd(event?: {
  productId?: string;
  quantity?: number;
  price?: number;
}): void
```

**Parameters:**
- `event` (optional) - Cart add event data

**Example:**
```javascript
// After adding to cart
async function addToCart(product) {
  await api.post('/cart', product);

  QredexAgent.handleCartAdd({
    productId: product.id,
    quantity: 1,
    price: product.price,
  });
}
```

**What happens:**
1. Checks if IIT exists
2. Calls lock API to exchange IIT → PIT
3. Emits `onLocked` event if successful
4. Emits `onError` event if failed

---

### `handleCartEmpty()`

Tell the agent that the cart was emptied. Automatically clears PIT.

**Signature:**
```typescript
function handleCartEmpty(event?: { timestamp?: number }): void
```

**Parameters:**
- `event` (optional) - Cart empty event data

**Example:**
```javascript
function clearCart() {
  cart.clear();
  QredexAgent.handleCartEmpty();
}
```

**What happens:**
1. Clears IIT from storage
2. Clears PIT from storage
3. Emits `onCleared` event

---

### `handleCartChange(event)`

Tell the agent that the cart state changed. Optional tracking.

**Signature:**
```typescript
function handleCartChange(event: {
  itemCount: number;
  previousCount: number;
  timestamp?: number;
}): void
```

**Parameters:**
- `event` - Cart change event data

**Example:**
```javascript
QredexAgent.handleCartChange({
  itemCount: 5,
  previousCount: 3,
});
```

**Note:** This is for optional tracking only. No automatic actions are taken.

---

### `handlePaymentSuccess(event)`

Tell the agent that payment succeeded. Automatically clears PIT.

**Signature:**
```typescript
function handlePaymentSuccess(event: {
  orderId: string;
  amount: number;
  currency: string;
  timestamp?: number;
}): void
```

**Parameters:**
- `event` - Payment success event data

**Example:**
```javascript
async function checkout(order) {
  const pit = QredexAgent.getPurchaseIntentToken();

  await api.post('/orders', {
    ...order,
    qredex_pit: pit,
  });

  QredexAgent.handlePaymentSuccess({
    orderId: order.id,
    amount: order.total,
    currency: 'USD',
  });
}
```

**What happens:**
1. Clears IIT from storage
2. Clears PIT from storage
3. Emits `onCleared` event

---

## Event Listeners (Agent → Merchant)

Listen for agent state changes.

### `onLocked(handler)`

Listen for successful lock events.

**Signature:**
```typescript
function onLocked(handler: (event: {
  purchaseToken: string;
  alreadyLocked: boolean;
  timestamp: number;
}) => void): void
```

**Example:**
```javascript
QredexAgent.onLocked(({ purchaseToken, alreadyLocked }) => {
  console.log('✅ Locked:', purchaseToken);
  console.log('Already locked:', alreadyLocked);

  // Update UI
  showNotification('Attribution locked!');
});
```

---

### `onCleared(handler)`

Listen for cleared state events.

**Signature:**
```typescript
function onCleared(handler: (event: {
  timestamp: number;
}) => void): void
```

**Example:**
```javascript
QredexAgent.onCleared(() => {
  console.log('🗑️ Cleared');
  showNotification('Attribution cleared');
});
```

---

### `onError(handler)`

Listen for agent error events.

**Signature:**
```typescript
function onError(handler: (event: {
  error: string;
  context?: string;
}) => void): void
```

**Example:**
```javascript
QredexAgent.onError(({ error, context }) => {
  console.error('❌ Error in', context, ':', error);
  showNotification('Error: ' + error, 'error');
});
```

---

### `offLocked(handler)`

Unregister a locked handler.

**Signature:**
```typescript
function offLocked(handler: (event: any) => void): void
```

**Example:**
```javascript
const handler = ({ purchaseToken }) => {
  console.log('Locked:', purchaseToken);
};

QredexAgent.onLocked(handler);
// ... later
QredexAgent.offLocked(handler);
```

---

### `offCleared(handler)`

Unregister a cleared handler.

**Signature:**
```typescript
function offCleared(handler: (event: any) => void): void
```

**Example:**
```javascript
const handler = () => console.log('Cleared');
QredexAgent.onCleared(handler);
// ... later
QredexAgent.offCleared(handler);
```

---

### `offError(handler)`

Unregister an error handler.

**Signature:**
```typescript
function offError(handler: (event: any) => void): void
```

**Example:**
```javascript
const handler = ({ error }) => console.error(error);
QredexAgent.onError(handler);
// ... later
QredexAgent.offError(handler);
```

---

## Lifecycle

### `destroy()`

Destroy the agent and clean up all resources.

**Signature:**
```typescript
function destroy(): void
```

**Example:**
```javascript
// Cleanup on SPA route change or unmount
QredexAgent.destroy();
```

**What it does:**
- Removes all event listeners
- Resets internal state
- Clears timers

---

### `stop()`

Alias for `destroy()`.

**Signature:**
```typescript
function stop(): void
```

**Example:**
```javascript
QredexAgent.stop();  // Same as destroy()
```

---

### `isInitialized()`

Check if agent is initialized.

**Signature:**
```typescript
function isInitialized(): boolean
```

**Example:**
```javascript
if (QredexAgent.isInitialized()) {
  console.log('Agent ready');
}
```

---

## Types

### AgentConfig

```typescript
interface AgentConfig {
  /** API endpoint for lock requests */
  lockEndpoint?: string;

  /** Enable debug logging */
  debug?: boolean;

  /** 
   * Use mock endpoint for local development (generates fake PIT tokens)
   * ⚠️ DEVELOPMENT ONLY - throws error in production
   */
  useMockEndpoint?: boolean;

  /** sessionStorage/cookie key for IIT */
  influenceIntentToken?: string;

  /** sessionStorage/cookie key for PIT */
  purchaseIntentToken?: string;

  /** Cookie expiration in days */
  cookieExpireDays?: number;
}
```

**Defaults:**
```typescript
{
  lockEndpoint: 'https://api.qredex.com/api/v1/agent/intents/lock',
  debug: false,
  useMockEndpoint: false,  // ⚠️ Never use in production
  influenceIntentToken: '__qdx_iit',
  purchaseIntentToken: '__qdx_pit',
  cookieExpireDays: 30,
}
```

---

### LockMeta

```typescript
interface LockMeta {
  /** Product ID if available */
  productId?: string;

  /** Product name if available */
  productName?: string;

  /** Quantity if available */
  quantity?: number;

  /** Price if available */
  price?: number;

  /** Additional custom fields */
  [key: string]: unknown;
}
```

---

### LockResult

```typescript
type LockResult =
  | {
      /** Lock was successful */
      success: true;

      /** The purchase intent token (PIT) */
      purchaseToken: string;

      /** Whether the intent was already locked (idempotent) */
      alreadyLocked: boolean;
    }
  | {
      /** Lock failed */
      success: false;

      /** No PIT available */
      purchaseToken: null;

      /** Was not already locked */
      alreadyLocked: false;

      /** Error message */
      error: string;
    };
```

---

### Event Types

```typescript
/** Cart add event (Merchant → Agent) */
interface CartAddEvent {
  productId?: string;
  quantity?: number;
  price?: number;
  timestamp?: number;
}

/** Cart empty event (Merchant → Agent) */
interface CartEmptyEvent {
  timestamp?: number;
}

/** Cart change event (Merchant → Agent) */
interface CartChangeEvent {
  itemCount: number;
  previousCount: number;
  timestamp?: number;
}

/** Payment success event (Merchant → Agent) */
interface PaymentSuccessEvent {
  orderId: string;
  amount: number;
  currency: string;
  timestamp?: number;
}

/** Locked event (Agent → Merchant) */
interface LockedEvent {
  purchaseToken: string;
  alreadyLocked: boolean;
  timestamp: number;
}

/** Cleared event (Agent → Merchant) */
interface ClearedEvent {
  timestamp: number;
}

/** Error event (Agent → Merchant) */
interface ErrorEvent {
  error: string;
  context?: string;
}
```

---

## Quick Reference

| Method | Category | Returns | Description |
|--------|----------|---------|-------------|
| `init(config?)` | Lifecycle | `void` | Initialize with config |
| `getInfluenceIntentToken()` | Token Access | `string \| null` | Get IIT |
| `getPurchaseIntentToken()` | Token Access | `string \| null` | Get PIT |
| `hasInfluenceIntentToken()` | Token Access | `boolean` | Check IIT exists |
| `hasPurchaseIntentToken()` | Token Access | `boolean` | Check PIT exists |
| `lockIntent(meta?)` | Lock | `Promise<LockResult>` | Lock IIT → PIT |
| `clearIntent()` | Lock | `void` | Clear all tokens |
| `handleCartChange(event)` | Event Handler | `void` | Cart state change |
| `handleCartAdd(count, meta?)` | Event Handler | `void` | Add to cart |
| `handleCartEmpty()` | Event Handler | `void` | Empty cart |
| `handlePaymentSuccess(event)` | Event Handler | `void` | Payment success |
| `onLocked(handler)` | Event Listener | `void` | Listen for lock |
| `onCleared(handler)` | Event Listener | `void` | Listen for clear |
| `onError(handler)` | Event Listener | `void` | Listen for errors |
| `offLocked(handler)` | Event Listener | `void` | Unregister lock listener |
| `offCleared(handler)` | Event Listener | `void` | Unregister clear listener |
| `offError(handler)` | Event Listener | `void` | Unregister error listener |
| `destroy()` | Lifecycle | `void` | Cleanup |
| `stop()` | Lifecycle | `void` | Alias for destroy |
| `isInitialized()` | Lifecycle | `boolean` | Check initialized |

---

## Related Documentation

- **[Installation](./INSTALLATION.md)** - Setup guide
- **[Integration Model](./INTEGRATION_MODEL.md)** - Complete integration guide
- **[Cart Empty Policy](./CART_EMPTY_POLICY.md)** - Attribution clearing rationale

---

## Support

For API questions: support@qredex.com
