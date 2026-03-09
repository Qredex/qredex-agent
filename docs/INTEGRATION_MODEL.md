# Qredex Agent - Integration Guide

**Document Type:** Implementation Guide  
**Status:** Complete  
**Version:** 1.0 (Final)

---

## Overview

The Qredex Agent is a browser library that captures intent tokens and manages attribution state. It supports **2 integration paths** for merchants.

### The 2 Paths

| Path | Who | Setup |
|------|-----|-------|
| **1. Frontend Hooks** (Recommended) | React, Next.js, Vue, vanilla JS SPAs | Add listeners to cart events |
| **2. Minimal Helper** | Any platform | Just capture IIT, backend handles rest |

### Not Supported

- ❌ Auto-detect (non-technical merchants use Shopify)
- ❌ WooCommerce (plugin needed)
- ❌ Magento (extension needed)
- ❌ Shopify (separate app, already solved)

---

## Future: Framework SDKs

**@qredex/client** is a separate project (React, Next.js, Vue SDKs) with framework-specific APIs:

```jsx
// React SDK (@qredex/client/react)
import { useQredex } from '@qredex/client/react';

function Cart() {
  const { lockIntent, purchaseToken } = useQredex();
  // ...
}
```

**@qredex/agent** (this project) is the vanilla JS browser library that works everywhere.

Use **@qredex/agent** directly for vanilla JS, jQuery, or when you don't need framework-specific APIs.

---

## Complete User Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. USER LANDS ON SITE                                                  │
│    URL: https://store.com?qdx_intent=abc123                            │
│    → Agent captures IIT (Influence Intent Token)                       │
│    → Stores IIT in sessionStorage + cookie                             │
│    → Cleans URL (removes qdx_intent param)                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. USER ADDS FIRST ITEM TO CART                                        │
│    → Merchant calls: handleCartAdd()                                   │
│    → Agent locks IIT → PIT (Purchase Intent Token)                     │
│    → Stores PIT in sessionStorage + cookie                             │
│    → Clears IIT from storage (no longer needed)                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 3a. USER CONTINUES SHOPPING (adds more items)                          │
│    → PIT already exists, no new lock needed                            │
│    → PIT persists in storage                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 3b. USER EMPTIES CART                                                  │
│    → Merchant calls: handleCartEmpty()                                 │
│    → Agent clears PIT from sessionStorage + cookie                     │
│    → User must start flow over (new IIT from new Qredex link)          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 3c. USER CLICKS ANOTHER QREDEX LINK (new IIT)                          │
│    → New IIT captured from URL                                         │
│    → BUT PIT already exists → IGNORE new IIT                           │
│    → Original PIT preserved (first-touch attribution)                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. USER CHECKS OUT                                                     │
│    → Merchant reads PIT: QredexAgent.getPurchaseIntentToken()          │
│    → Merchant sends PIT to backend with order details                  │
│    → Qredex backend resolves attribution from PIT                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Token Lifecycle Rules

### IIT (Influence Intent Token)
- **Captured:** From URL `?qdx_intent=xxx` on page load
- **Stored:** sessionStorage + cookie (fallback)
- **Cleared:** When PIT is successfully locked
- **NEW IIT arrives:** **IGNORED if PIT exists** (attribution already locked)
- **Expires:** Based on cookie expiry (default 30 days)

### PIT (Purchase Intent Token)
- **Created:** When IIT is locked (first item added to cart)
- **Stored:** sessionStorage + cookie (fallback)
- **Cleared:** When cart becomes empty **OR** after successful checkout
- **Persists:** Through multiple cart additions, through new IIT captures, until cart emptied or checkout completed
- **Irrecoverable:** Once cleared, user needs new IIT (new Qredex link)

### Key Rules

> **Rule 1: One PIT per shopping session.** Once cart is emptied, attribution flow must restart with new IIT from new Qredex tracking link.

> **Rule 2: PIT takes precedence over IIT.** If PIT exists and new IIT is captured, ignore the new IIT. First touch attribution is preserved until cart is emptied.

> **Rule 3: Clear PIT after successful checkout.** Merchant must clear PIT after order completion to allow new attribution flow.

**See also:** [Cart Empty Policy](./CART_EMPTY_POLICY.md) - Complete rationale and implementation guidance.

---

## Path 1: Frontend Hooks (Recommended)

### Who Should Use This

- React, Next.js, Vue storefronts
- SPAs with frontend-managed cart
- Merchants who want reliable integration
- **Primary target for Qredex Agent**

### Integration Steps

**1. Install Agent**

```html
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
```

**2. Handle Cart Events (Merchant → Agent)**

```javascript
// Merchant tells agent when cart add happens
QredexAgent.handleCartAdd({
  productId: '123',
  quantity: 1,
  price: 99.99,
});
// → Agent auto-locks IIT → PIT by calling POST /api/v1/agent/intents/lock
// Request: { "token": "IIT" }
// Response: { "token": "PIT", "expiresAt": "...", "lockedAt": "..." }

// Merchant tells agent when cart is emptied
QredexAgent.handleCartEmpty();
// → Agent auto-clears PIT from storage

// Merchant tells agent when payment succeeds
QredexAgent.handlePaymentSuccess({
  orderId: 'order_789',
  amount: 99.99,
  currency: 'USD',
});
// → Agent auto-clears PIT from storage
```

**3. Listen for Agent Events (Agent → Merchant) - Optional**

```javascript
// Listen for successful lock
QredexAgent.onLocked(({ purchaseToken }) => {
  console.log('PIT locked:', purchaseToken);
});

// Listen for cleared state
QredexAgent.onCleared(() => {
  console.log('PIT cleared');
});

// Listen for errors
QredexAgent.onError(({ error }) => {
  console.error('Agent error:', error);
});
```

**4. Read PIT at Checkout**

```javascript
const pit = QredexAgent.getPurchaseIntentToken();
// Send to backend with order
```

### Example: React/Next.js

```jsx
function useQredexAgent() {
  useEffect(() => {
    // Listen for agent events (optional)
    QredexAgent.onLocked(({ purchaseToken }) => {
      console.log('PIT locked:', purchaseToken);
    });
  }, []);

  const addToCart = async (product) => {
    await api.post('/cart', { productId: product.id });

    // Tell agent cart add happened (auto-locks)
    QredexAgent.handleCartAdd({
      productId: product.id,
      quantity: 1,
      price: product.price,
    });
  };

  const completeCheckout = async (orderData) => {
    const pit = QredexAgent.getPurchaseIntentToken();

    const result = await api.post('/orders', {
      ...orderData,
      qredex_pit: pit,
    });

    // Tell agent payment succeeded (auto-clears)
    QredexAgent.handlePaymentSuccess({
      orderId: result.orderId,
      amount: orderData.total,
    });

    return result;
  };

  return { addToCart, completeCheckout };
}
```

---

## Path 2: Minimal Helper

### Who Should Use This

- Platforms where backend handles everything
- jQuery/traditional sites
- Merchants who prefer backend integration
- **Fallback option**

### Integration Steps

**1. Install Agent**

```html
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
```

**2. Backend Reads IIT**

```javascript
// Backend reads IIT from browser
const iit = QredexAgent.getIntentToken();

// Backend calls its own capture API
await fetch('/api/capture-iit', {
    method: 'POST',
    body: JSON.stringify({ iit })
});
```

**3. Backend Handles Everything**

- Backend calls lock API on cart add
- Backend clears PIT on cart empty
- Backend sends PIT with order

**Agent does NOT handle locking - just IIT capture.**

### Example: jQuery/Traditional

```javascript
// Backend handles everything (PHP, Python, Ruby, etc.)
// Frontend just uses jQuery for cart operations

// Cart add (jQuery)
$('.add-to-cart').on('click', function() {
    $.post('/cart/add', {
        product_id: $(this).data('product-id')
    }, function(response) {
        // Backend already called lock API
        // No frontend Qredex code needed
    });
});

// At checkout, backend sends PIT with order
// No frontend Qredex code needed
```

---

## API Reference

### Always Available (All Paths)

```typescript
// Get PIT for checkout
getPurchaseIntentToken(): string | null

// Get IIT (before locked)
getIntentToken(): string | null

// Check if IIT exists
hasInfluenceIntentToken(): boolean

// Check if PIT exists
hasPurchaseIntentToken(): boolean

// Clear IIT/PIT tokens (after checkout or cart empty)
clearTokens(): void

// Manual lock (if not using handleCartAdd)
lockIntent(meta?: LockMeta): Promise<LockResult>
```

### Manual Methods (Direct Control)

Use these if you prefer explicit control over auto-lock:

```typescript
// Lock IIT → PIT manually
const result = await QredexAgent.lockIntent({
  productId: '123',
  quantity: 1,
});

// Clear IIT/PIT tokens manually
QredexAgent.clearTokens();

// Read PIT
const pit = QredexAgent.getPurchaseIntentToken();
```

### Event Handlers (Merchant → Agent)

Merchant tells agent when events happen:

```typescript
handleCartAdd(event?: CartAddEvent): void
handleCartEmpty(event?: CartEmptyEvent): void
handleCartChange(event?: CartChangeEvent): void
handlePaymentSuccess(event?: PaymentSuccessEvent): void
```

### Event Listeners (Agent → Merchant) - Optional

Listen for agent state changes:

```typescript
onLocked(handler: LockedHandler): void
onCleared(handler: ClearedHandler): void
onError(handler: ErrorHandler): void

// Unregister listeners
offLocked(handler: LockedHandler): void
offCleared(handler: ClearedHandler): void
offError(handler: ErrorHandler): void
```

**Event Types:**
```typescript
interface CartAddEvent {
  productId?: string;
  quantity?: number;
  price?: number;
  timestamp?: number;
}

interface CartEmptyEvent {
  timestamp?: number;
}

interface CartChangeEvent {
  itemCount: number;
  previousCount: number;
  timestamp?: number;
}

interface PaymentSuccessEvent {
  orderId: string;
  amount: number;
  currency: string;
  timestamp?: number;
}

interface LockedEvent {
  purchaseToken: string;
  alreadyLocked: boolean;
  timestamp: number;
}

interface ClearedEvent {
  timestamp: number;
}

interface ErrorEvent {
  error: string;
  context?: string;
}

interface LockMeta {
  productId?: string;
  quantity?: number;
  price?: number;
  [key: string]: unknown;
}

interface LockResult {
  success: boolean;
  purchaseToken: string | null;
  alreadyLocked: boolean;
  error?: string;
}

type LockedHandler = (event: LockedEvent) => void;
type ClearedHandler = (event: ClearedEvent) => void;
type ErrorHandler = (event: ErrorEvent) => void;
```

### API Summary

| Method | Type | Purpose |
|--------|------|---------|
| `getIntentToken()` | Manual | Read IIT |
| `getPurchaseIntentToken()` | Manual | Read PIT |
| `hasInfluenceIntentToken()` | Manual | Check IIT exists |
| `hasPurchaseIntentToken()` | Manual | Check PIT exists |
| `lockIntent(meta?)` | Manual | Lock IIT → PIT |
| `clearTokens()` | Manual | Clear local IIT/PIT state |
| `handleCartAdd(event?)` | Event Input | Merchant tells agent cart got item(s) |
| `handleCartEmpty(event?)` | Event Input | Merchant tells agent cart is empty |
| `handleCartChange(event?)` | Event Input | Merchant sends cart state change |
| `handlePaymentSuccess(event?)` | Event Input | Merchant tells agent checkout/payment succeeded |
| `onLocked(handler)` | Hook | Listen for successful lock |
| `onCleared(handler)` | Hook | Listen for cleared state |
| `onError(handler)` | Hook | Listen for agent errors |
| `offLocked(handler)` | Hook | Unregister lock listener |
| `offCleared(handler)` | Hook | Unregister clear listener |
| `offError(handler)` | Hook | Unregister error listener |

**Both approaches work!** Choose what fits your codebase:
- **Event handlers** (`handleCartAdd`) for auto-lock convenience
- **Manual methods** (`lockIntent`) for explicit control

---

## Implementation Plan

### Phase 1: Core Agent (~150 lines)
- [x] IIT capture from URL (auto-start)
- [x] PIT storage (sessionStorage + cookie)
- [x] Lock logic (IIT → PIT via `/api/v1/agent/intents/lock`)
- [x] Clear logic (IIT/PIT cleanup)
- [x] Basic APIs: `getIntentToken()`, `getPurchaseIntentToken()`, `lockIntent({ token })`, `clearTokens()`

### Phase 2: Event Handlers
- [x] `handleCartAdd()` implementation + auto-lock
- [x] `handleCartEmpty()` implementation + auto-clear
- [x] `handleCartChange()` implementation (optional tracking)
- [x] `handlePaymentSuccess()` implementation + auto-clear
- [x] `onLocked()` listener registration
- [x] `onCleared()` listener registration
- [x] `onError()` listener registration
- [x] Listener unregistration (`off*` functions)

### Phase 3: Documentation
- [x] React/Next.js examples
- [x] Vanilla JS examples
- [x] Vue/Nuxt examples
- [x] Troubleshooting guide
- [x] Migration guide (from Shopify tracker)

### Phase 4: Testing
- [ ] React/Next.js storefront (Path 1)
- [ ] jQuery/traditional platform (Path 2)

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Agent code size | <200 lines |
| Documentation | <30 pages |
| Path 1 coverage | React/Next.js/Vue SPAs |
| Path 2 coverage | jQuery/traditional fallback |
| Time to integrate | <1 hour for developers |
| Support burden | Minimal (clear paths, no detection issues) |

---

## Related Documentation

- [Cart Empty Policy](./CART_EMPTY_POLICY.md) - Why and when to clear attribution
- [API Reference](./API.md) - Complete API documentation
- [Installation Guide](./INSTALLATION.md) - Setup instructions

---

## Support

For questions: support@qredex.com
