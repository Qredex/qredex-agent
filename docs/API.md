# Qredex Agent - API Reference

Complete reference for the Qredex Agent public API.

---

## Table of Contents

- [Initialization](#initialization)
- [Token Access](#token-access)
- [Lock Operations](#lock-operations)
- [Cart Detection](#cart-detection)
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

**Example:**
```javascript
QredexAgent.init({ 
  debug: true,
  lockEndpoint: 'https://api.qredex.com/api/v1/agent/intents/lock'
});
```

**Note:** Usually not needed - agent auto-starts on script load.

---

## Token Access

### `getIntentToken()`

Get the current Influence Intent Token (IIT).

**Signature:**
```typescript
function getIntentToken(): string | null
```

**Returns:** IIT token string or `null`

**Example:**
```javascript
const iit = QredexAgent.getIntentToken();
if (iit) {
  console.log('IIT:', iit);
}
```

**Storage Priority:**
1. sessionStorage (primary)
2. Cookie (fallback)

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

### `hasIntentToken()`

Check if IIT exists.

**Signature:**
```typescript
function hasIntentToken(): boolean
```

**Returns:** `true` if IIT available

**Example:**
```javascript
if (QredexAgent.hasIntentToken()) {
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

---

## Cart Detection

### `handleAddToCart(meta?)`

Manually trigger add-to-cart event.

**Signature:**
```typescript
function handleAddToCart(meta?: AddToCartMeta): void
```

**Parameters:**
- `meta` (optional) - Cart event metadata

**Example:**
```javascript
// Custom integration
button.addEventListener('click', () => {
  QredexAgent.handleAddToCart({
    productId: 'widget-001',
    productName: 'Premium Widget',
    quantity: 2,
    price: 99.99,
  });
});
```

**Use Cases:**
- Non-standard cart implementations
- AJAX cart additions
- Custom checkout flows

---

### `onAddToCart(handler)`

Register add-to-cart event handler.

**Signature:**
```typescript
function onAddToCart(handler: AddToCartHandler): void
```

**Parameters:**
- `handler` - Callback function

**Example:**
```javascript
QredexAgent.onAddToCart((event) => {
  console.log('Cart event:', event.source);  // 'click' | 'form' | 'manual'
  console.log('Product:', event.meta);
  
  // Send to analytics
  analytics.track('Add to Cart', event.meta);
});
```

---

### `offAddToCart(handler)`

Unregister add-to-cart handler.

**Signature:**
```typescript
function offAddToCart(handler: AddToCartHandler): void
```

**Example:**
```javascript
const handler = (event) => {
  console.log('Cart:', event);
};

QredexAgent.onAddToCart(handler);
// ... later
QredexAgent.offAddToCart(handler);
```

---

### `enableDetection()`

Enable automatic add-to-cart detection.

**Signature:**
```typescript
function enableDetection(): void
```

**Example:**
```javascript
// Re-enable after disabling
QredexAgent.enableDetection();
```

---

### `disableDetection()`

Disable automatic add-to-cart detection.

**Signature:**
```typescript
function disableDetection(): void
```

**Example:**
```javascript
// Disable auto-detection, use manual only
QredexAgent.disableDetection();
```

---

## Lifecycle

### `destroy()`

Destroy agent and cleanup resources.

**Signature:**
```typescript
function destroy(): void
```

**Example:**
```javascript
// Cleanup on SPA route change
QredexAgent.destroy();
```

**What it does:**
- Removes event listeners
- Resets state
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

### `getStatus()`

Get detailed agent status.

**Signature:**
```typescript
function getStatus(): AgentStatus
```

**Returns:**
```typescript
{
  initialized: boolean;
  running: boolean;
  destroyed: boolean;
}
```

**Example:**
```javascript
const status = QredexAgent.getStatus();
console.log(status);
// { initialized: true, running: true, destroyed: false }
```

---

## Types

### AgentConfig

```typescript
interface AgentConfig {
  lockEndpoint?: string;
  debug?: boolean;
  autoDetect?: boolean;
  influenceIntentToken?: string;
  purchaseIntentToken?: string;
  cookieExpireDays?: number;
}
```

### LockMeta

```typescript
interface LockMeta {
  productId?: string;
  productName?: string;
  quantity?: number;
  price?: number;
  [key: string]: unknown;
}
```

### LockResult

```typescript
type LockResult = 
  | { 
      success: true; 
      purchaseToken: string; 
      alreadyLocked: boolean;
    }
  | { 
      success: false; 
      purchaseToken: null; 
      alreadyLocked: false;
      error: string;
    };
```

### AddToCartMeta

```typescript
interface AddToCartMeta {
  productId?: string;
  productName?: string;
  quantity?: number;
  price?: number;
  [key: string]: unknown;
}
```

### AddToCartEvent

```typescript
interface AddToCartEvent {
  source: 'click' | 'form' | 'manual';
  meta: AddToCartMeta;
  timestamp: number;
}
```

### AddToCartHandler

```typescript
type AddToCartHandler = (event: AddToCartEvent) => void;
```

### AgentStatus

```typescript
interface AgentStatus {
  initialized: boolean;
  running: boolean;
  destroyed: boolean;
}
```

---

## Quick Reference

| Method | Purpose | Returns |
|--------|---------|---------|
| `init(config?)` | Initialize with config | `void` |
| `getIntentToken()` | Get IIT | `string \| null` |
| `getPurchaseIntentToken()` | Get PIT | `string \| null` |
| `hasIntentToken()` | Check IIT exists | `boolean` |
| `hasPurchaseIntentToken()` | Check PIT exists | `boolean` |
| `lockIntent(meta?)` | Lock IIT → PIT | `Promise<LockResult>` |
| `handleAddToCart(meta?)` | Trigger cart event | `void` |
| `onAddToCart(handler)` | Register handler | `void` |
| `offAddToCart(handler)` | Unregister handler | `void` |
| `enableDetection()` | Enable auto-detect | `void` |
| `disableDetection()` | Disable auto-detect | `void` |
| `destroy()` | Cleanup | `void` |
| `stop()` | Alias for destroy | `void` |
| `isInitialized()` | Check initialized | `boolean` |
| `getStatus()` | Get status | `AgentStatus` |

---

## Related Documentation

- **[Installation](./INSTALLATION.md)** - Setup guide
- **[Lock Flow](./LOCK_FLOW.md)** - How locking works
- **[Detection](./DETECTION.md)** - Cart detection strategies

---

## Support

For API questions: support@qredex.com
