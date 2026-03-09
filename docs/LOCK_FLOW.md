# Qredex Agent - Lock Flow

How the Qredex Agent captures IIT and locks it to PIT.

---

## Overview

The lock flow converts an **Influence Intent Token (IIT)** into a **Purchase Intent Token (PIT)** when a shopper's cart transitions from empty to non-empty.

**Key principles:**

-   **Merchant-driven**: Merchant calls `handleCartChange()` or `handleCartAdd()` when cart state changes
-   **State-based**: Lock triggers on cart transition (empty → non-empty), not just "add-to-cart" event
-   **Idempotent**: Safe to retry; no duplicate locks
-   **Fail-safe**: Lock failures preserve IIT for retry

---

## The Complete Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. Shopper clicks Qredex tracking link                          │
│    → Lands on merchant site with ?qdx_intent=<IIT>              │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 2. Agent auto-starts                                            │
│    → Captures qdx_intent from URL                               │
│    → Stores IIT in sessionStorage + cookie                      │
│    → Cleans URL (removes qdx_intent parameter)                  │
│    → Cart state: empty                                          │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 3. Shopper browses store                                        │
│    → IIT persists in storage                                    │
│    → Cart state: empty                                          │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 4. Shopper adds first item to cart                              │
│    → Merchant calls handleCartAdd() or handleCartChange()       │
│    → Cart state: empty → non-empty                              │
│    → Validates: IIT exists, PIT doesn't, no lock in flight      │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 5. Agent calls lock endpoint                                    │
│    → POST /api/v1/agent/intents/lock                            │
│    → Sends: { token: <IIT> }                                    │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 6. Qredex validates IIT                                         │
│    → Checks token signature                                     │
│    → Validates not expired                                      │
│    → Returns: { token: <PIT> }                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 7. Agent stores PIT                                             │
│    → Saves to sessionStorage + cookie                           │
│    → Clears IIT (PIT now authoritative)                         │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 8. Checkout completes                                           │
│    → PIT passed to order                                        │
│    → Qredex resolves attribution                                │
│    → Agent clears PIT (and any leftover IIT)                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Lock Decision Logic

When `handleCartChange()` is called, the agent checks:

```
┌─────────────────┐
│ Cart Change     │
│ itemCount > 0   │
└────────────────┘
         │
         ▼
┌─────────────────┐
│ Check: IIT      │──── No ──► Skip (no intent to lock)
│ Exists?         │
└────────┬────────┘
         │ Yes
         ▼
┌─────────────────┐
│ Check: PIT      │──── Yes ──► Skip (already locked)
│ Exists?         │
└────────┬────────┘
         │ No
         ▼
┌─────────────────┐
│ Check: Lock     │──── Yes ──► Return in-flight promise
│ In Progress?    │
└────────┬────────┘
         │ No
         ▼
┌─────────────────┐
│ Call Lock       │
│ Endpoint        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Success?        │──── No ──► Keep IIT, retry on next add-to-cart
└────────────────┘
         │ Yes
         ▼
┌─────────────────┐
│ Store PIT       │
│ Clear IIT       │
└─────────────────┘
```

**Key:** Lock is attempted on **every** `handleCartChange()` call where:
- `itemCount > 0` (cart has items)
- IIT exists
- PIT doesn't exist
- No lock in-flight

This ensures retry on every add-to-cart if previous lock failed (Rule 13).

---

## Cart State Transitions

| `previousCount` | `itemCount` | Transition | Action |
|-----------------|-------------|------------|--------|
| 0 | 0 | `empty` → `empty` | None |
| 0 | >0 | `empty` → `non-empty` | **Lock IIT → PIT** (if IIT exists) |
| >0 | >0 | `non-empty` → `non-empty` | **Retry lock** if IIT exists and PIT doesn't (Rule 13) |
| >0 | 0 | `non-empty` → `empty` | **Clear IIT + PIT** |

0

`non-empty` → `empty`

**Clear IIT + PIT**

---

## Idempotency

The lock operation is **idempotent** - safe to call multiple times:

### Fast Path: PIT Already Exists

```javascript
if (hasPurchaseIntentToken()) {
  return { success: true, purchaseToken: pit, alreadyLocked: true };
}
```

### In-Flight Prevention

```javascript
if (isLockInProgress()) {
  return inFlightPromise;  // Return same promise
}
```

### Backend Already Locked

```javascript
if (response.already_locked === true) {
  storePurchaseToken(response.purchase_token);
  clearIntentToken();  // Clear IIT
  return { success: true, purchaseToken: pit, alreadyLocked: true };
}
```

---

## Lock Request Format

**Request:**

```javascript
POST /api/v1/agent/intents/lock

{
  "token": "eyJhbGciOiJIUzI1NiIs..."  // IIT
}
```

**Response (Success):**

```javascript
{
  "token": "eyJhbGciOiJIUzI1NiIs..."  // PIT
}
```

**Response (Error):**

```javascript
// HTTP 4xx/5xx with error body
{
  "error": "Invalid or expired intent token"
}
```

---

## Storage Behavior

### IIT Storage (Capture)

```javascript
// Stored when URL has ?qdx_intent=xxx
sessionStorage.setItem('__qdx_iit', 'eyJhbGci...');
document.cookie = '__qdx_iit=eyJhbGci...; path=/; SameSite=Strict';
```

### PIT Storage (Lock)

```javascript
// Stored after successful lock
sessionStorage.setItem('__qdx_pit', 'eyJhbGci...');
document.cookie = '__qdx_pit=eyJhbGci...; path=/; SameSite=Strict';
```

### IIT Clear (After Lock)

```javascript
// Removed after successful lock
sessionStorage.removeItem('__qdx_iit');
document.cookie = '__qdx_iit=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
```

### Priority

1.  **sessionStorage** (primary)
2.  **Cookie** (fallback)

---

## Error Handling

### No IIT Available

```javascript
if (!hasIntentToken()) {
  return {
    success: false,
    error: 'No intent token available'
  };
}
```

### Network Error

```javascript
try {
  const response = await fetch(lockEndpoint, {...});
} catch (err) {
  // Keep IIT for retry
  return {
    success: false,
    error: err.message
  };
}
```

### HTTP Error

```javascript
if (!response.ok) {
  const errorText = await response.text();
  // Keep IIT for retry
  return {
    success: false,
    error: `HTTP ${response.status}: ${errorText}`
  };
}
```

### Lock Failure Behavior

Error Type

IIT

PIT

Retry

Network error

**Kept**

Not created

Yes, on next cart event

HTTP 4xx (invalid)

**Kept**

Not created

Yes, on next cart event

HTTP 5xx (server)

**Kept**

Not created

Yes, on next cart event

Cart emptied

**Cleared**

**Cleared**

No (state reset)

---

## Manual Lock

You can manually trigger lock (usually not needed):

```javascript
const result = await QredexAgent.lockIntent({
  productId: 'widget-001',
  quantity: 2,
});

if (result.success) {
  console.log('PIT:', result.purchaseToken);
  console.log('Already locked:', result.alreadyLocked);
} else {
  console.error('Lock failed:', result.error);
}
```

---

## Cart State API

### Primary Method: `handleCartChange()`

```javascript
// Merchant tells agent about cart state change
QredexAgent.handleCartChange({
  itemCount: 1,        // Current cart item count
  previousCount: 0,    // Previous cart item count
  meta: {              // Optional: sent to lock API
    productId: 'widget-001',
    quantity: 2,
    price: 99.99,
  },
});
```

### Convenience Wrappers

```javascript
// Add to cart
QredexAgent.handleCartAdd(itemCount, {
  productId: 'widget-001',
  quantity: 1,
});

// Empty cart (clears tokens)
QredexAgent.handleCartEmpty();
```

---

## Debug Mode

Enable debug to see lock flow in console:

```html
<script>
  window.QredexAgentConfig = { debug: true };
</script>
```

**Example output:**

```
[QredexAgent] Intent token captured from URL
[QredexAgent] Cart change event received { itemCount: 1, previousCount: 0 }
[QredexAgent] Cart state updated: non-empty
[QredexAgent] Lock conditions met
[QredexAgent] IIT exists: true
[QredexAgent] PIT exists: false
[QredexAgent] Lock in progress: false
[QredexAgent] Sending lock request to: https://api.qredex.com/api/v1/agent/intents/lock
[QredexAgent] Intent locked successfully
[QredexAgent] Purchase token stored
[QredexAgent] Intent token removed
```

---

## State Machine Summary

```
┌─────────────────┐
│ URL has IIT     │
│ Cart: empty     │
└────────┬────────┘
         │
         │ Cart: 0 → >0
         ▼
┌─────────────────┐
│ Lock IIT → PIT  │
└────────┬────────┘
         │
         │ Success
         ▼
┌─────────────────┐
│ Store PIT       │
│ Clear IIT       │
│ Cart: non-empty │
└────────┬────────┘
         │
         │ Cart: >0 → 0
         ▼
┌─────────────────┐
│ Clear IIT + PIT │
│ Cart: empty     │
└─────────────────┘
```

---

## Related Documentation

-   **[Qredex Agent Flow](./QREDEX_AGENT_FLOW.md)** - High-level flow and state machine
-   **[Installation](./INSTALLATION.md)** - Setup and integration
-   **[API Reference](./API.md)** - Public API methods

---

## Support

For questions: [support@qredex.com](mailto:support@qredex.com)
