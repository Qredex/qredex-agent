# Qredex Agent - Testing Guide

Unified testing guide for all Qredex Agent examples.

---

## Quick Start

### Step 1: Choose an Example

| Example | Best For | How to Run |
|---------|----------|------------|
| [basic/](basic/) | First-time testing, visual feedback | `npx serve ..` → `http://localhost:3000/basic/` |
| [cdn-test/](cdn-test/) | Quick CDN testing | `npx serve ..` → `http://localhost:3000/cdn-test/` |

### Step 2: Run Testing Scenarios

All examples support the same core testing scenarios below.

---

## Testing Scenarios

### Scenario 1: Initial State (No Token)

**Purpose:** Verify agent initializes correctly without tokens.

**Steps:**
1. Open the example in a fresh browser tab (no query params)
2. Open browser console (F12)
3. Check the status display

**Expected Results:**
- ✅ Agent initialized successfully
- ❌ IIT: Not found / None
- ❌ PIT: Not found / None
- Console shows: "Qredex Agent initialized" or similar

**Verify in Console:**
```javascript
QredexAgent.isInitialized()      // true
QredexAgent.hasInfluenceIntentToken()     // false
QredexAgent.hasPurchaseIntentToken() // false
```

---

### Scenario 2: Capture Intent from URL

**Purpose:** Verify IIT capture from `?qdx_intent=xxx` URL parameter.

**Steps:**
1. Add `?qdx_intent=test_token_abc123` to the URL
2. Press Enter to reload
3. Check status display and console

**Expected Results:**
- ✅ IIT: Present (shows token or "Present")
- ❌ PIT: Not found (not locked yet)
- Console shows: "Token stored" or "Token captured"

**Verify in Console:**
```javascript
QredexAgent.getInfluenceIntentToken()  // "test_token_abc123"
QredexAgent.hasInfluenceIntentToken()  // true
QredexAgent.hasPurchaseIntentToken()   // false
```

**Alternative:** Manually navigate to:
```
http://localhost:3000/basic/?qdx_intent=test_token_xyz789
```

---

### Scenario 3: Add to Cart (Lock IIT → PIT)

**Purpose:** Verify automatic lock when cart add event fires.

**Prerequisites:** Complete Scenario 2 (IIT must exist)

**Steps:**
1. Ensure IIT is present (check status)
2. Click **Add to Cart** button
3. Watch status display and notifications
4. Check browser Network tab for API call

**Expected Results:**
- ✅ PIT: Present (new token different from IIT)
- Notification: "Attribution locked!" or similar
- Console shows: "Intent locked! PIT: xxx"
- Network tab shows: `POST /api/v1/agent/intents/lock`

**API Request:**
```
POST /api/v1/agent/intents/lock
Content-Type: application/json

{ "token": "test_token_abc123" }
```

**API Response:**
```json
{
  "token": "pit_xxx",
  "expiresAt": "2024-01-01T00:00:00Z",
  "lockedAt": "2024-01-01T00:00:00Z"
}
```

**Verify in Console:**
```javascript
QredexAgent.getPurchaseIntentToken() // Returns PIT token
QredexAgent.hasPurchaseIntentToken() // true
```

---

### Scenario 4: Idempotency (Already Locked)

**Purpose:** Verify lock is idempotent - safe to call multiple times.

**Prerequisites:** Complete Scenario 3 (PIT must exist)

**Steps:**
1. Ensure PIT is present
2. Click **Add to Cart** again
3. Or click any manual trigger button

**Expected Results:**
- ✅ PIT: Same token (unchanged)
- Console shows: "Already locked" or similar
- No new API call (or returns cached result)

**Verify in Console:**
```javascript
// Lock is idempotent - safe to call multiple times
const result = await QredexAgent.lockIntent();
console.log(result);
// { success: true, purchaseToken: "pit_xxx", alreadyLocked: true }
```

---

### Scenario 5: Clear Tokens (Cart Empty)

**Purpose:** Verify PIT clears when cart is emptied.

**Prerequisites:** Complete Scenario 3 or 4 (PIT must exist)

**Steps:**
1. Ensure PIT is present
2. Click **Clear Cart** or **Clear Tokens** button

**Expected Results:**
- ❌ IIT: Not found
- ❌ PIT: Not found
- Console shows: "All tokens cleared" or "Attribution cleared"

**Verify in Console:**
```javascript
QredexAgent.hasInfluenceIntentToken()      // false
QredexAgent.hasPurchaseIntentToken() // false
```

---

### Scenario 6: Full Checkout Flow

**Purpose:** Verify complete attribution flow from intent to purchase.

**Prerequisites:** Complete Scenario 2 (IIT must exist)

**Steps:**
1. Capture IIT: Add `?qdx_intent=test123` to URL
2. Add item to cart (locks IIT → PIT)
3. Verify PIT exists
4. Click **Checkout** button
5. Verify PIT cleared after "payment"

**Expected Results:**
- Before checkout: ✅ PIT present
- After checkout: ❌ PIT cleared
- Console shows: "Payment succeeded" then "Attribution cleared"

**Verify in Console:**
```javascript
// Before checkout
QredexAgent.getPurchaseIntentToken() // "pit_xxx"

// After checkout
QredexAgent.getPurchaseIntentToken() // null
```

---

### Scenario 7: Event Listeners

**Purpose:** Verify event listeners fire correctly.

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

**Purpose:** Verify listeners can be unregistered.

**Steps:**
1. Register a listener:

```javascript
const myHandler = ({ purchaseToken }) => {
  console.log('Custom handler:', purchaseToken);
};

QredexAgent.onLocked(myHandler);
```

2. Unregister:

```javascript
QredexAgent.offLocked(myHandler);
```

3. Trigger lock (add to cart)
4. Verify custom handler does NOT fire

---

### Scenario 9: Manual Lock

**Purpose:** Verify manual lock API works.

**Prerequisites:** IIT must exist, PIT must not exist

**Steps:**
1. Ensure IIT is present, PIT is not
2. Click **Lock Intent** button (if available)
3. Or call manually in console:

```javascript
const result = await QredexAgent.lockIntent({
  productId: 'manual-test',
  quantity: 1,
  price: 50.00
});
console.log(result);
```

**Expected Results:**
- ✅ PIT: Shows new token
- Console shows: "Intent locked! PIT: xxx"

---

### Scenario 10: Status API

**Purpose:** Verify status reporting API.

**Steps:**
1. Open console
2. Call status API at different stages:

```javascript
// Initial state
QredexAgent.getStatus()
// { initialized: true, running: true, destroyed: false }

// After destroy (if supported)
QredexAgent.destroy()
QredexAgent.getStatus()
// { initialized: true, running: false, destroyed: true }
```

---

## Visual Testing Checklist

Use this checklist to verify all UI elements work correctly:

| Test | Status Display | Token Display | Console/Notifications | Pass |
|------|----------------|---------------|----------------------|------|
| Initial state (no token) | All show "Not found" | Empty | "Demo loaded" | ☐ |
| Capture intent from URL | IIT shows ✅ | Shows token | "Token stored" | ☐ |
| Add to cart (lock) | PIT shows ✅ | Shows PIT | "Intent locked" | ☐ |
| Add to cart again | PIT unchanged | Same PIT | "Already locked" | ☐ |
| Clear tokens | All show ❌ | Empty | "Tokens cleared" | ☐ |
| Manual lock | PIT shows ✅ | Shows PIT | "Intent locked" | ☐ |
| Event listeners | N/A | N/A | Events logged | ☐ |
| Full checkout flow | PIT cleared after | Empty | "Payment succeeded" | ☐ |

---

## Debugging

### Enable Debug Mode

Add before script load or in console:

```javascript
window.QredexAgentConfig = { debug: true };
location.reload();
```

### Check Storage

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

### Common Console Commands

```javascript
// Quick status check
console.log({
  initialized: QredexAgent.isInitialized(),
  hasIIT: QredexAgent.hasInfluenceIntentToken(),
  hasPIT: QredexAgent.hasPurchaseIntentToken(),
  iit: QredexAgent.getInfluenceIntentToken(),
  pit: QredexAgent.getPurchaseIntentToken(),
});

// Clear and restart (manual reset)
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

---

### Issue: Lock Fails Silently

**Symptoms:** Add to cart clicked but PIT not created

**Solutions:**
1. Check IIT exists before lock: `QredexAgent.hasInfluenceIntentToken()`
2. Check Network tab for API errors
3. Check CORS configuration
4. Verify lock endpoint is correct

---

### Issue: PIT Not Cleared

**Symptoms:** After clear/cart empty, PIT still exists

**Solutions:**
1. Verify `handleCartEmpty()` or `handlePaymentSuccess()` called
2. Check both sessionStorage and cookies cleared
3. Manually call `QredexAgent.clearTokens()`

---

### Issue: Event Listeners Not Firing

**Symptoms:** Handlers registered but not called

**Solutions:**
1. Verify handler is registered before event occurs
2. Check handler function signature matches expected params
3. Ensure handler not unregistered accidentally
4. Check console for handler errors

---

### Issue: "QredexAgent is not defined"

**Symptoms:** Console error when accessing QredexAgent

**Solutions:**
1. Ensure CDN script loaded: `<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>`
2. Check Network tab for script load errors
3. Wait for script to load before accessing:

```javascript
if (window.QredexAgent) {
  // Safe to use
} else {
  console.error('Qredex Agent not loaded');
}
```

---

## API Reference

All available console commands:

```javascript
// Read tokens
QredexAgent.getInfluenceIntentToken()  // Get IIT
QredexAgent.getPurchaseIntentToken()   // Get PIT
QredexAgent.hasInfluenceIntentToken()  // Check IIT exists
QredexAgent.hasPurchaseIntentToken()   // Check PIT exists

// Commands
await QredexAgent.lockIntent(meta)        // Manual lock (idempotent)
QredexAgent.clearTokens()                 // Clear all tokens

// Event handlers (Merchant → Agent)
QredexAgent.handleCartAdd(event)          // Cart add
QredexAgent.handleCartEmpty()             // Cart empty
QredexAgent.handlePaymentSuccess(event)   // Payment success

// Event listeners (Agent → Merchant)
QredexAgent.onLocked(handler)             // Listen for lock
QredexAgent.onCleared(handler)            // Listen for clear
QredexAgent.onError(handler)              // Listen for errors

// Unregister listeners
QredexAgent.offLocked(handler)
QredexAgent.offCleared(handler)
QredexAgent.offError(handler)

// Lifecycle
QredexAgent.init(config)                  // Initialize
QredexAgent.destroy()                     // Destroy
QredexAgent.stop()                        // Stop
QredexAgent.isInitialized()               // Check initialized
QredexAgent.getStatus()                   // Get status
```

---

## Next Steps

After testing:

1. **Review Integration Guide:** See [INTEGRATION_MODEL.md](../docs/INTEGRATION_MODEL.md)
2. **Check API Reference:** See [API.md](../docs/API.md)
3. **Implement in Your Project:** Follow the example closest to your stack

---

## Support

For issues or questions: support@qredex.com
