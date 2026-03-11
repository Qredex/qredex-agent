# Qredex Agent - Examples

**Quick testing for Qredex Agent using the Vite development server.**

> ⚠️ **IMPORTANT:** Run this page through `npm run dev`. Opening the file directly (`file://`) or serving it without Vite will not work.

---

## Quick Start

### Option 1: Using `npm run dev` (Recommended)

```bash
# 1. Start the dev server
npm run dev

# 2. Open in browser
open http://localhost:5173/examples/index.html
```

### Option 2: Build a staging bundle

```bash
# 1. Build the staging bundle
npm run build:stage

# 2. Deliver /dist with your staging site
#    Use lockEndpoint to point at the staging Qredex backend
```

---

## What This Example Does

The test page demonstrates the complete Qredex Agent flow:

1. **IIT Capture** - Simulates landing with `?qdx_intent=xxx` URL parameter
2. **Lock IIT → PIT** - Exchanges intent token for purchase token on "Add to Cart"
3. **Clear Tokens** - Clears all attribution state on "Clear Cart"

**Note:** Uses `useMockEndpoint: true` through the Vite dev server - generates fake PIT tokens locally (no network calls).

Once loaded, the agent is available globally via `window.QredexAgent`:

```javascript
// Check tokens
QredexAgent.getInfluenceIntentToken()  // Get IIT
QredexAgent.getPurchaseIntentToken()   // Get PIT

// Handle cart state changes
QredexAgent.handleCartChange({
  itemCount: 1,
  previousCount: 0,
  meta: {
    productId: 'test-product',
    quantity: 1,
    price: 99.99,
  },
});

// Listen for events
QredexAgent.onLocked(({ purchaseToken }) => {
  console.log('Locked:', purchaseToken);
});

QredexAgent.onCleared(() => {
  console.log('Cleared');
});
```

---

## Testing Scenarios

### Scenario 1: Intent Capture → Lock

1. **Add intent to URL**: `?qdx_intent=test123`
2. **Observe**: IIT appears in status panel
3. **Click "Add to Cart"**: Cart goes from 0 → 1
4. **Observe**: 
   - IIT disappears (exchanged)
   - PIT appears (locked)
   - Console shows: `✅ Locked!`

### Scenario 2: Clear on Empty

1. **Ensure PIT exists** (from Scenario 1)
2. **Click "Clear Cart"**: Cart goes from 1 → 0
3. **Observe**:
   - PIT disappears
   - Console shows: `🗑️ Cleared`

### Scenario 3: Multiple Adds (No Re-lock)

1. **Add to cart** (0 → 1): Locks IIT → PIT
2. **Add again** (1 → 2): No action (already locked)
3. **Add again** (2 → 3): No action
4. **Observe**: Only first add triggers lock

### Scenario 4: Partial Remove (No Clear)

1. **Add 3 items** (0 → 3): Locks
2. **Clear cart** (3 → 0): Clears tokens
3. **Observe**: Only full empty triggers clear

---

## Behavior Matrix

| Transition | Action | Description |
|------------|--------|-------------|
| `0 → 1` | 🔒 Lock | First item added |
| `0 → 3` | 🔒 Lock | Multiple items added at once |
| `1 → 3` | — | Adding more (already locked) |
| `3 → 2` | — | Removing item (cart not empty) |
| `1 → 0` | 🗑️ Clear | Last item removed |
| `3 → 0` | 🗑️ Clear | Cart emptied |
| `0 → 0` | — | No change |

---

## Production Usage

In production, load from CDN instead of local dist:

```html
<script src="https://cdn.qredex.com/agent/v1/@qredex/agent.iife.min.js"></script>
```

Or use a specific version:

```html
<script src="https://cdn.qredex.com/agent/v1.0.0/@qredex/agent.iife.min.js"></script>
```

---

## Configuration (Optional)

For production or staging delivery, configure before the script loads:

```html
<script>
  window.QredexAgentConfig = {
    debug: true,              // Non-production only
    lockEndpoint: '/api/v1/agent/intents/lock', // Same-origin non-production override
    cookieExpireDays: 30,     // Cookie expiration
  };
</script>
<script src="../../dist/qredex-agent.iife.min.js"></script>
```

---

## API Reference

### Read Tokens

```javascript
QredexAgent.getInfluenceIntentToken()  // string | null
QredexAgent.getPurchaseIntentToken()   // string | null
QredexAgent.hasInfluenceIntentToken()  // boolean
QredexAgent.hasPurchaseIntentToken()   // boolean
```

### Event Handlers (Merchant → Agent)

```javascript
// Single method for all cart state changes
QredexAgent.handleCartChange({
  itemCount: number,      // Required: current count
  previousCount: number,  // Required: previous count
  meta?: {                // Optional: sent to lock API
    productId?: string,
    quantity?: number,
    price?: number,
  },
});

// Payment success
QredexAgent.handlePaymentSuccess({
  orderId: string,
  amount: number,
  currency: string,
});
```

### Event Listeners (Agent → Merchant)

```javascript
QredexAgent.onLocked(({ purchaseToken, alreadyLocked, timestamp }) => { ... });
QredexAgent.onCleared(({ timestamp }) => { ... });
QredexAgent.onError(({ error, context }) => { ... });
```

### Manual Commands

```javascript
await QredexAgent.lockIntent(meta);  // Manual lock
QredexAgent.clearIntent();           // Clear all tokens
```

---

## Files

| File | Description |
|------|-------------|
| `index.html` | Self-contained test page |
| `styles.css` | Page styles |
| `../../dist/qredex-agent.iife.min.js` | Minified IIFE bundle |

---

## See Also

- [Vanilla JS Example](../vanilla/) - Full e-commerce demo
- [Vue Example](../vue/) - Vue 3 integration
- [React Example](../react/) - Next.js integration
- [README](../../README.md) - Main documentation
