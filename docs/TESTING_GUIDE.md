# Qredex Agent - Complete Testing Guide

Comprehensive guide for testing Qredex Agent across all example implementations.

---

## Table of Contents

1. [Overview](#overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Test Scenarios](#test-scenarios)
4. [Example-Specific Testing](#example-specific-testing)
5. [API Testing Reference](#api-testing-reference)
6. [Debugging Guide](#debugging-guide)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers testing for all Qredex Agent examples:

| Example | Framework | Port | URL |
|---------|-----------|------|-----|
| [basic/](../examples/basic/) | Vanilla JS | 3000 | `/basic/` |
| [vanilla/](../examples/vanilla/) | Vanilla JS | 3000 | `/vanilla/` |
| [react/](../examples/react/) | React/Next.js | 3000 | `/` |
| [vue/](../examples/vue/) | Vue 3 | 3000 | `/` |

---

## Test Environment Setup

### 1. Serve All Examples

```bash
# From project root
npx serve examples

# Or individually
cd examples/basic
npx serve ..
```

### 2. Browser Requirements

- Chrome, Firefox, Safari, or Edge (latest)
- JavaScript enabled
- Cookies enabled
- sessionStorage available

### 3. DevTools Setup

Open browser DevTools (F12) and prepare:
- **Console** - For logs and manual commands
- **Network** - Monitor API calls
- **Application** - Inspect storage (sessionStorage, cookies)

---

## Test Scenarios

### Scenario 1: Initial State (No Token)

**Purpose:** Verify agent initializes correctly with no tokens.

**Steps:**
1. Open example in fresh browser tab (no `?qdx_intent` param)
2. Open DevTools Console
3. Check status display

**Expected Results:**
- ✅ Agent initialized
- ❌ IIT not found
- ❌ PIT not found

**Console Verification:**
```javascript
QredexAgent.isInitialized()      // true
QredexAgent.hasInfluenceIntentToken()     // false
QredexAgent.hasPurchaseIntentToken() // false
QredexAgent.getIntentToken()     // null
QredexAgent.getPurchaseIntentToken() // null
```

**Storage Verification (Application tab):**
- sessionStorage: No `__qdx_iit` or `__qdx_pit`
- Cookies: No `__qdx_iit` or `__qdx_pit`

---

### Scenario 2: Capture Intent from URL

**Purpose:** Verify IIT capture from `?qdx_intent` URL parameter.

**Steps:**
1. Navigate to: `http://localhost:3000/basic/?qdx_intent=test_intent_abc123`
2. Check status display
3. Check storage

**Expected Results:**
- ✅ IIT captured and stored
- ❌ PIT not found (not locked yet)
- URL cleaned (qdx_intent param removed)

**Console Verification:**
```javascript
QredexAgent.getIntentToken()     // "test_intent_abc123"
QredexAgent.hasInfluenceIntentToken()     // true
QredexAgent.hasPurchaseIntentToken() // false
```

**Storage Verification:**
- sessionStorage: `__qdx_iit` = "test_intent_abc123"
- Cookies: `__qdx_iit` = "test_intent_abc123"

---

### Scenario 3: Lock Intent (Add to Cart)

**Purpose:** Verify IIT → PIT exchange on cart add.

**Prerequisites:** Complete Scenario 2 (IIT must exist)

**Steps:**
1. Ensure IIT present (check status)
2. Click "Add to Cart" button
3. Watch Network tab for API call
4. Check status after lock

**Expected Results:**
- ✅ PIT created and stored
- ✅ IIT cleared (exchanged for PIT)
- Network: POST to `/api/v1/agent/intents/lock`
- Console: "Intent locked" message

**Network Request:**
```
POST /api/v1/agent/intents/lock
Content-Type: application/json

{
  "token": "test_intent_abc123"
}
```

**Network Response:**
```json
{
  "token": "pit_xyz789",
  "expiresAt": "2026-04-07T12:00:00Z",
  "lockedAt": "2026-03-08T12:00:00Z"
}
```

**Console Verification:**
```javascript
QredexAgent.getIntentToken()        // null (cleared after lock)
QredexAgent.getPurchaseIntentToken() // "pit_xyz789"
QredexAgent.hasInfluenceIntentToken()        // false
QredexAgent.hasPurchaseIntentToken() // true
```

---

### Scenario 4: Idempotent Lock

**Purpose:** Verify lock is idempotent (safe to call multiple times).

**Prerequisites:** Complete Scenario 3 (PIT must exist)

**Steps:**
1. Ensure PIT present
2. Click "Add to Cart" again
3. Or call `lockIntent()` manually

**Expected Results:**
- ✅ PIT unchanged
- ✅ Returns `alreadyLocked: true`
- No duplicate API calls (or returns cached result)

**Console Verification:**
```javascript
const result = await QredexAgent.lockIntent();
console.log(result);
// { success: true, purchaseToken: "pit_xyz789", alreadyLocked: true }
```

---

### Scenario 5: Clear Tokens (Cart Empty)

**Purpose:** Verify tokens cleared on cart empty.

**Prerequisites:** Complete Scenario 3 (PIT must exist)

**Steps:**
1. Ensure PIT present
2. Click "Clear Cart" or "Clear Tokens"
3. Check status and storage

**Expected Results:**
- ❌ IIT cleared
- ❌ PIT cleared
- Console: "Attribution cleared" message

**Console Verification:**
```javascript
QredexAgent.getIntentToken()        // null
QredexAgent.getPurchaseIntentToken() // null
QredexAgent.hasInfluenceIntentToken()        // false
QredexAgent.hasPurchaseIntentToken() // false
```

**Storage Verification:**
- sessionStorage: No `__qdx_iit` or `__qdx_pit`
- Cookies: No `__qdx_iit` or `__qdx_pit`

---

### Scenario 6: Full Checkout Flow

**Purpose:** Verify complete attribution flow from capture to checkout.

**Steps:**
1. Navigate with `?qdx_intent=test123`
2. Add item to cart (locks IIT → PIT)
3. Verify PIT present
4. Click "Checkout"
5. Verify PIT cleared after payment

**Expected Results:**
- Step 1: ✅ IIT captured
- Step 2: ✅ PIT locked
- Step 3: ✅ PIT present
- Step 4: ✅ Payment processed
- Step 5: ❌ PIT cleared

**Timeline:**
```
1. Load with ?qdx_intent=test123
   → IIT: ✅ test123
   → PIT: ❌

2. Add to cart
   → IIT: ❌ (exchanged)
   → PIT: ✅ pit_xyz789

3. Checkout
   → IIT: ❌
   → PIT: ❌ (cleared after payment)
```

---

### Scenario 7: Event Listeners

**Purpose:** Verify event listeners fire correctly.

**Steps:**
1. Open Console
2. Register event listeners
3. Perform actions (add to cart, clear)
4. Verify events fire

**Console Commands:**
```javascript
// Register listeners
QredexAgent.onLocked(({ purchaseToken, alreadyLocked, timestamp }) => {
  console.log('🔒 LOCKED:', { purchaseToken, alreadyLocked, timestamp });
});

QredexAgent.onCleared(({ timestamp }) => {
  console.log('🗑️ CLEARED:', { timestamp });
});

QredexAgent.onError(({ error, context }) => {
  console.error('❌ ERROR:', { error, context });
});

// Trigger events
QredexAgent.handleCartAdd({ productId: 'test', quantity: 1, price: 99.99 });
// Should fire: 🔒 LOCKED: { ... }

QredexAgent.handleCartEmpty();
// Should fire: 🗑️ CLEARED: { ... }
```

---

### Scenario 8: Manual Lock

**Purpose:** Verify manual lock operation.

**Prerequisites:** IIT must exist (Scenario 2)

**Steps:**
1. Ensure IIT present, PIT not present
2. Call `lockIntent()` manually
3. Verify PIT created

**Console Commands:**
```javascript
const result = await QredexAgent.lockIntent({
  productId: 'manual-test',
  quantity: 1,
  price: 50.00,
});

console.log(result);
// { success: true, purchaseToken: "pit_xyz", alreadyLocked: false }
```

---

### Scenario 9: New IIT While PIT Exists

**Purpose:** Verify new IIT is ignored when PIT exists (first-touch attribution).

**Steps:**
1. Complete checkout flow (PIT exists)
2. Navigate with new `?qdx_intent=new_token`
3. Verify new IIT ignored, PIT preserved

**Expected Results:**
- ✅ Original PIT preserved
- ❌ New IIT ignored
- First-touch attribution maintained

**Console Verification:**
```javascript
// Before new IIT
QredexAgent.getPurchaseIntentToken() // "pit_original"

// After new IIT arrives
QredexAgent.getPurchaseIntentToken() // "pit_original" (unchanged)
QredexAgent.getIntentToken()        // null (ignored)
```

---

### Scenario 10: Status API

**Purpose:** Verify status API returns correct state.

**Console Commands:**
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

## Example-Specific Testing

### Basic Example

**URL:** `http://localhost:3000/basic/`

**Features:**
- Visual status display
- Token simulation
- Product demo
- Manual triggers
- In-page console log

**Testing Checklist:**
- [ ] Status shows correct IIT/PIT state
- [ ] Simulate Intent URL works
- [ ] Add to Cart locks IIT → PIT
- [ ] Clear Tokens clears storage
- [ ] Console log shows events
- [ ] Manual lock works

**See:** [examples/basic/TESTING.md](../examples/basic/TESTING.md)

---

### Vanilla Example

**URL:** `http://localhost:3000/vanilla/`

**Features:**
- Product grid
- Shopping cart
- Checkout flow
- Notification system

**Testing Checklist:**
- [ ] Products display correctly
- [ ] Add to cart works
- [ ] Cart updates
- [ ] Status dots update (IIT/PIT)
- [ ] Notifications appear
- [ ] Checkout clears PIT

---

### React Example

**URL:** `http://localhost:3000/` (run `npm run dev` in `examples/react/`)

**Features:**
- React components
- Hooks for state management
- Client-side rendering

**Testing Checklist:**
- [ ] App loads without errors
- [ ] Status updates reactively
- [ ] Cart state syncs with agent
- [ ] Event listeners fire
- [ ] No hydration errors

**Console Check:**
```javascript
// Should be available in browser console
window.QredexAgent
```

---

### Vue Example

**URL:** `http://localhost:3000/` (run `npm run dev` in `examples/vue/`)

**Features:**
- Vue 3 Composition API
- Reactive state
- Component-based UI

**Testing Checklist:**
- [ ] App mounts correctly
- [ ] Status reactive to changes
- [ ] Cart updates with agent
- [ ] Event listeners fire
- [ ] No console errors

**Console Check:**
```javascript
// Should be available in browser console
window.QredexAgent
```

---

## API Testing Reference

### Read Operations

```javascript
// Get tokens
QredexAgent.getIntentToken()           // string | null
QredexAgent.getPurchaseIntentToken()   // string | null

// Check existence
QredexAgent.hasInfluenceIntentToken()           // boolean
QredexAgent.hasPurchaseIntentToken()   // boolean

// Status
QredexAgent.isInitialized()            // boolean
QredexAgent.getStatus()                // AgentStatus
```

### Commands

```javascript
// Lock IIT → PIT
await QredexAgent.lockIntent(meta?)    // Promise<LockResult>

// Clear all tokens
QredexAgent.clearTokens()              // void

// Lifecycle
QredexAgent.init(config?)              // void
QredexAgent.destroy()                  // void
QredexAgent.stop()                     // void
```

### Event Handlers (Merchant → Agent)

```javascript
// Cart events
QredexAgent.handleCartAdd(event?)      // void
QredexAgent.handleCartEmpty(event?)    // void
QredexAgent.handleCartChange(event)    // void
QredexAgent.handlePaymentSuccess(event) // void
```

### Event Listeners (Agent → Merchant)

```javascript
// Register
QredexAgent.onLocked(handler)          // void
QredexAgent.onCleared(handler)         // void
QredexAgent.onError(handler)           // void

// Unregister
QredexAgent.offLocked(handler)         // void
QredexAgent.offCleared(handler)        // void
QredexAgent.offError(handler)          // void
```

---

## Debugging Guide

### Enable Debug Mode

```javascript
// Before agent loads
window.QredexAgentConfig = { debug: true };
location.reload();
```

### Inspect Storage

**DevTools → Application → Storage:**

**Session Storage:**
- `__qdx_iit` - IIT token value
- `__qdx_pit` - PIT token value

**Cookies:**
- `__qdx_iit` - IIT fallback
- `__qdx_pit` - PIT fallback

### Monitor Network

**DevTools → Network:**

Filter: `lock`

**Request:**
```
POST /api/v1/agent/intents/lock
{
  "token": "IIT_VALUE"
}
```

**Response:**
```json
{
  "token": "PIT_VALUE",
  "expiresAt": "...",
  "lockedAt": "..."
}
```

### Quick Status Check

```javascript
console.log({
  initialized: QredexAgent.isInitialized(),
  hasIIT: QredexAgent.hasInfluenceIntentToken(),
  hasPIT: QredexAgent.hasPurchaseIntentToken(),
  iit: QredexAgent.getIntentToken(),
  pit: QredexAgent.getPurchaseIntentToken(),
  status: QredexAgent.getStatus(),
});
```

### Clear and Restart

```javascript
// Clear all storage
sessionStorage.clear();
document.cookie.split(';').forEach(c => {
  document.cookie = c
    .replace(/^ +/, '')
    .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
});

// Reload
location.reload();
```

---

## Troubleshooting

### Issue: Agent Not Initialized

**Symptoms:** `QredexAgent is not defined`

**Solutions:**
1. Check script loaded: `<script src="...">`
2. Check script loaded before your code
3. Use `strategy="afterInteractive"` in Next.js
4. Check browser console for load errors

---

### Issue: IIT Not Captured

**Symptoms:** URL has `?qdx_intent=xxx` but IIT is null

**Solutions:**
1. Check URL param name is exactly `qdx_intent`
2. Reload the page
3. Check for typos in URL parameter
4. Verify script auto-starts (check console logs)

---

### Issue: Lock Fails Silently

**Symptoms:** Add to cart clicked but PIT not created

**Solutions:**
1. Check IIT exists: `QredexAgent.hasInfluenceIntentToken()`
2. Check Network tab for API errors
3. Verify lock endpoint is correct
4. Check CORS configuration
5. Ensure HTTPS in production

---

### Issue: PIT Not Cleared

**Symptoms:** After clear/cart empty, PIT still exists

**Solutions:**
1. Verify `handleCartEmpty()` called
2. Check `handlePaymentSuccess()` called
3. Manually call `QredexAgent.clearTokens()`
4. Check both sessionStorage and cookies cleared

---

### Issue: Event Listeners Not Firing

**Symptoms:** Handlers registered but not called

**Solutions:**
1. Verify handler registered before event occurs
2. Check handler function signature
3. Ensure handler not unregistered accidentally
4. Check console for handler errors
5. Verify agent not destroyed

---

### Issue: Tokens Not Persisting

**Symptoms:** Tokens lost on page reload

**Solutions:**
1. Check cookies not blocked
2. Check sessionStorage available (not private browsing)
3. Verify cookie expiration not too short
4. Check same-origin policy

---

### Issue: URL Not Cleaned

**Symptoms:** `?qdx_intent=xxx` still in URL after load

**Solutions:**
1. Check `history.replaceState` available
2. Verify no cross-origin restrictions
3. Check for CSP blocking script modifications
4. This is non-critical - token still captured

---

## Test Results Template

Use this template to document test results:

```markdown
## Test Session

**Date:** YYYY-MM-DD
**Browser:** Chrome 121.0
**Example:** basic/

### Results

| Scenario | Status | Notes |
|----------|--------|-------|
| 1. Initial State | ✅ Pass | - |
| 2. Capture Intent | ✅ Pass | URL cleaned correctly |
| 3. Lock Intent | ✅ Pass | API call successful |
| 4. Idempotent Lock | ✅ Pass | Returns alreadyLocked: true |
| 5. Clear Tokens | ✅ Pass | Storage cleared |
| 6. Full Checkout | ✅ Pass | Complete flow works |
| 7. Event Listeners | ✅ Pass | All events fire |
| 8. Manual Lock | ✅ Pass | Works as expected |
| 9. New IIT | ✅ Pass | First-touch preserved |
| 10. Status API | ✅ Pass | Correct state returned |

### Issues Found

None / List any issues

### Notes

Any additional observations
```

---

## Next Steps

After completing testing:

1. **Document Results** - Use template above
2. **Report Issues** - Create detailed bug reports
3. **Test Real Platform** - Integrate with actual storefront
4. **Performance Testing** - Measure bundle size, runtime performance

---

## Support

For issues or questions: support@qredex.com
