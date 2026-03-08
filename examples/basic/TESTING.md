# Qredex Agent - Basic Example Testing Guide

This guide explains how to test all Qredex Agent functionality using the basic example.

---

## Quick Start

### 1. Serve the Example

```bash
# From project root
npx serve examples

# Or using any static file server
cd examples/basic
python -m http.server 8000
```

### 2. Open in Browser

Navigate to `http://localhost:3000/basic/` (or your server's port).

---

## Testing Scenarios

### Scenario 1: Initial State (No Token)

**Steps:**
1. Open `http://localhost:3000/basic/` in a fresh browser tab
2. Check the **Status** section

**Expected Results:**
- ✅ Initialized: Yes
- ❌ IIT: Not found
- ❌ PIT: Not found
- Console log: "Demo page loaded"

**Verify in Console:**
```javascript
window.QredexAgent.hasIntentToken()      // false
window.QredexAgent.hasPurchaseIntentToken() // false
```

---

### Scenario 2: Simulate Intent URL

**Steps:**
1. Enter a test token in the **Intent Token** input (e.g., `test_intent_abc123`)
2. Click **Simulate Intent URL**
3. Page will auto-reload

**Expected Results:**
- ✅ IIT: `test_intent_abc...` (truncated)
- ❌ PIT: Not found (not locked yet)
- Token display shows the full token
- Console log: "Token stored"

**Verify in Console:**
```javascript
window.QredexAgent.getIntentToken()      // "test_intent_abc123"
window.QredexAgent.hasIntentToken()      // true
```

**Alternative:** Manually navigate to:
```
http://localhost:3000/basic/?qdx_intent=test_intent_xyz789
```

---

### Scenario 3: Add to Cart (Lock IIT → PIT)

**Prerequisites:** Complete Scenario 2 first (IIT must exist)

**Steps:**
1. Ensure IIT is present (check Status)
2. Click **🛒 Add to Cart** button
3. Watch the **Console Log** section

**Expected Results:**
- ✅ PIT: Shows new token (different from IIT)
- ✅ IIT: Still shows (will be cleared after lock completes)
- Console log: "Add-to-cart detected: click"
- Console log: "Intent locked! PIT: xxx"
- Notification appears: "Attribution locked!"

**Verify in Console:**
```javascript
window.QredexAgent.getPurchaseIntentToken() // Returns PIT token
window.QredexAgent.hasPurchaseIntentToken() // true
```

**API Call (check Network tab):**
```
POST /api/v1/agent/intents/lock
Request: { "token": "test_intent_abc123" }
Response: { "token": "pit_xxx", "expiresAt": "...", "lockedAt": "..." }
```

---

### Scenario 4: Already Locked (Idempotency)

**Prerequisites:** Complete Scenario 3 first (PIT must exist)

**Steps:**
1. Ensure PIT is present (check Status)
2. Click **🛒 Add to Cart** again
3. Or click **Trigger Add-to-Cart** (manual trigger)

**Expected Results:**
- ✅ PIT: Same token (unchanged)
- Console log: "Already locked" or similar
- No new API call (or returns cached result)

**Verify in Console:**
```javascript
// Lock is idempotent - safe to call multiple times
await window.QredexAgent.lockIntent()
// Returns: { success: true, purchaseToken: "...", alreadyLocked: true }
```

---

### Scenario 5: Clear Tokens (Cart Empty)

**Prerequisites:** Complete Scenario 3 or 4 (PIT must exist)

**Steps:**
1. Ensure PIT is present
2. Click **Clear Tokens** button

**Expected Results:**
- ❌ IIT: Not found
- ❌ PIT: Not found
- Console log: "All tokens cleared"
- Console log: "🗑️ Qredex cleared"

**Verify in Console:**
```javascript
window.QredexAgent.hasIntentToken()      // false
window.QredexAgent.hasPurchaseIntentToken() // false
```

---

### Scenario 6: Manual Lock

**Prerequisites:** Complete Scenario 2 (IIT must exist, PIT must not exist)

**Steps:**
1. Ensure IIT is present, PIT is not
2. Click **Lock Intent** button

**Expected Results:**
- ✅ PIT: Shows new token
- Console log: "Intent locked! PIT: xxx"

**Verify in Console:**
```javascript
const result = await window.QredexAgent.lockIntent({
  productId: 'manual-test',
  quantity: 1,
  price: 50.00
});
console.log(result);
// { success: true, purchaseToken: "pit_xxx", alreadyLocked: false }
```

---

### Scenario 7: Event Listeners

**Steps:**
1. Open browser console (F12)
2. Register event listeners:

```javascript
// Listen for lock events
QredexAgent.onLocked(({ purchaseToken, alreadyLocked, timestamp }) => {
  console.log('🔒 LOCKED:', { purchaseToken, alreadyLocked, timestamp });
});

// Listen for clear events
QredexAgent.onCleared(({ timestamp }) => {
  console.log('🗑️ CLEARED:', { timestamp });
});

// Listen for errors
QredexAgent.onError(({ error, context }) => {
  console.error('❌ ERROR:', { error, context });
});
```

3. Perform actions (add to cart, clear tokens)
4. Verify events fire in console

**Expected Console Output:**
```
🔒 LOCKED: { purchaseToken: "pit_xxx", alreadyLocked: false, timestamp: 1234567890 }
🗑️ CLEARED: { timestamp: 1234567895 }
```

---

### Scenario 8: Unregister Listeners

**Steps:**
1. Register a listener (see Scenario 7)
2. Store the handler function:

```javascript
const myHandler = ({ purchaseToken }) => {
  console.log('Custom handler:', purchaseToken);
};

QredexAgent.onLocked(myHandler);
```

3. Unregister:

```javascript
QredexAgent.offLocked(myHandler);
```

4. Trigger lock - custom handler should NOT fire

---

### Scenario 9: Full Checkout Flow

**Prerequisites:** Complete Scenario 2 (IIT must exist)

**Steps:**
1. Add item to cart (locks IIT → PIT)
2. Verify PIT exists
3. Click **Checkout** button (simulates payment)
4. Verify PIT is cleared after payment

**Expected Results:**
- Before checkout: ✅ PIT present
- After checkout: ❌ PIT cleared
- Console log: "Payment succeeded"
- Console log: "🗑️ Qredex cleared"

**Verify in Console:**
```javascript
// Before checkout
QredexAgent.getPurchaseIntentToken() // "pit_xxx"

// After checkout
QredexAgent.getPurchaseIntentToken() // null
```

---

### Scenario 10: Status API

**Steps:**
1. Open console
2. Call status API at different stages:

```javascript
// Initial state
QredexAgent.getStatus()
// { initialized: true, running: true, destroyed: false }

// After destroy
QredexAgent.destroy()
QredexAgent.getStatus()
// { initialized: true, running: false, destroyed: true }
```

---

## Visual Testing Checklist

Use this checklist to verify all UI elements work correctly:

| Test | Status Section | Token Display | Console Log | Pass |
|------|----------------|---------------|-------------|------|
| Initial state (no token) | All show "Not found" | Empty | "Demo loaded" | ☐ |
| Simulate intent URL | IIT shows ✅ | Shows token | "Token stored" | ☐ |
| Add to cart | PIT shows ✅ | Shows PIT | "Intent locked" | ☐ |
| Add to cart again | PIT unchanged | Same PIT | "Already locked" | ☐ |
| Clear tokens | All show ❌ | Empty | "Tokens cleared" | ☐ |
| Manual lock | PIT shows ✅ | Shows PIT | "Intent locked" | ☐ |
| Event listeners | N/A | N/A | Events logged | ☐ |
| Full checkout flow | PIT cleared after | Empty | "Payment succeeded" | ☐ |

---

## Debugging Tips

### Enable Debug Mode

Add before script load:
```javascript
window.QredexAgentConfig = { debug: true };
```

### Check Storage Directly

Open DevTools → Application → Storage:

**Session Storage:**
- `__qdx_iit` - Should contain IIT token
- `__qdx_pit` - Should contain PIT token

**Cookies:**
- `__qdx_iit` - Fallback IIT
- `__qdx_pit` - Fallback PIT

### Network Tab

Monitor API calls:
- `POST /api/v1/agent/intents/lock` - Lock request
- Check request body: `{ "token": "IIT_VALUE" }`
- Check response: `{ "token": "PIT_VALUE", ... }`

### Console Commands

```javascript
// Quick status check
console.log({
  initialized: QredexAgent.isInitialized(),
  hasIIT: QredexAgent.hasIntentToken(),
  hasPIT: QredexAgent.hasPurchaseIntentToken(),
  iit: QredexAgent.getIntentToken(),
  pit: QredexAgent.getPurchaseIntentToken(),
});

// Clear and restart
sessionStorage.clear();
document.cookie.split(';').forEach(c => {
  document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
});
location.reload();
```

---

## Common Issues

### Issue: IIT Not Captured from URL

**Symptoms:** URL has `?qdx_intent=xxx` but IIT is null

**Solutions:**
1. Check URL parameter name is exactly `qdx_intent`
2. Reload the page
3. Check browser console for errors
4. Verify script loaded before checking token

### Issue: Lock Fails Silently

**Symptoms:** Add to cart clicked but PIT not created

**Solutions:**
1. Check IIT exists before lock: `QredexAgent.hasIntentToken()`
2. Check Network tab for API errors
3. Check CORS configuration
4. Verify lock endpoint is correct

### Issue: PIT Not Cleared

**Symptoms:** After clear/cart empty, PIT still exists

**Solutions:**
1. Verify `handleCartEmpty()` or `handlePaymentSuccess()` called
2. Check both sessionStorage and cookies cleared
3. Manually call `QredexAgent.clearTokens()`

### Issue: Event Listeners Not Firing

**Symptoms:** Handlers registered but not called

**Solutions:**
1. Verify handler is registered before event occurs
2. Check handler function signature matches expected params
3. Ensure handler not unregistered accidentally
4. Check console for handler errors

---

## API Testing Reference

All available console commands:

```javascript
// Read tokens
QredexAgent.getIntentToken()
QredexAgent.getPurchaseIntentToken()
QredexAgent.hasIntentToken()
QredexAgent.hasPurchaseIntentToken()

// Commands
await QredexAgent.lockIntent({ productId: 'test', quantity: 1 })
QredexAgent.clearTokens()

// Event handlers (Merchant → Agent)
QredexAgent.handleCartAdd({ productId: 'test', price: 99.99 })
QredexAgent.handleCartEmpty()
QredexAgent.handlePaymentSuccess({ orderId: '123', amount: 99.99, currency: 'USD' })

// Event listeners (Agent → Merchant)
QredexAgent.onLocked(({ purchaseToken, alreadyLocked }) => { ... })
QredexAgent.onCleared(() => { ... })
QredexAgent.onError(({ error, context }) => { ... })

// Unregister listeners
QredexAgent.offLocked(handler)
QredexAgent.offCleared(handler)
QredexAgent.offError(handler)

// Lifecycle
QredexAgent.init({ debug: true })
QredexAgent.destroy()
QredexAgent.stop()
QredexAgent.isInitialized()
QredexAgent.getStatus()
```

---

## Next Steps

After testing the basic example:

1. **Vanilla JS Example** - See [../vanilla/README.md](../vanilla/README.md)
2. **React Example** - See [../react/README.md](../react/README.md)
3. **Vue Example** - See [../vue/README.md](../vue/README.md)

---

## Support

For issues or questions: support@qredex.com
