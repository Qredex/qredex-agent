# Cart Empty & Attribution Clearing

**Document Type:** Attribution Policy  
**Status:** Production Standard  
**Applies To:** All Qredex Agent Integrations

---

## Overview

Qredex clears stored attribution state (PIT) when the shopping cart becomes empty. This document explains why, when, and how this clearing occurs.

---

## The Rule

> **Empty cart = broken purchase continuity**

When a cart is emptied, the Qredex Agent clears the Purchase Intent Token (PIT) from storage. This ends the current attribution session.

---

## Why We Clear Attribution

We clear stored attribution state when the cart becomes empty because the original purchase intent can no longer be trusted as active.

An empty cart breaks reliable purchase continuity. Once all items are removed, we cannot safely assume that:

- The same purchase journey is still in progress
- The next added item belongs to the same intent
- The same user is continuing the same session in a meaningful attribution sense
- The original influence should still receive credit

Keeping attribution data after cart empty creates a risk of stale intent being reused for a later, unrelated purchase.

This is especially important because cart behavior differs across merchants and implementations. Some flows rebuild carts, merge states, or allow long gaps between actions. Clearing on empty is therefore the safest default.

### Attribution Integrity Over Persistence

This rule favors **attribution integrity over attribution persistence**:

- Better to drop questionable attribution than keep incorrect attribution
- Better to avoid false payout confidence than preserve a weak link
- Better to require a fresh lock than carry forward stale state

---

## Merchant Control (Event Hooks)

Because Qredex Agent uses **event hooks** (not auto-detection), **merchants control when `handleCartEmpty()` is called**. This is critical for correct attribution.

### ✅ When TO Signal `handleCartEmpty()`

| Scenario | Why |
|----------|-----|
| User manually clears entire cart | Purchase journey definitively ended |
| Cart expires after session timeout | Session no longer valid |
| User logs out (cart cleared) | User session ended |
| Checkout abandoned + cart cleared | Journey abandoned, not returning |

### ❌ When NOT to Signal `handleCartEmpty()`

| Scenario | Why |
|----------|-----|
| User removes one item but cart still has items | Purchase journey continues |
| Temporary cart reorganization (same session) | Same intent, same journey |
| Cart cleared during checkout flow (order in progress) | Journey in progress, not ended |
| Accidental clear with immediate re-add (same session) | Same intent continues |

### Key Principle

> **Signal `handleCartEmpty()` when the purchase journey definitively ends, not just when cart item count hits zero.**

---

## Implementation Examples

### Example 1: Conservative Approach

```javascript
// ✅ GOOD: Signal on definitive cart end
function clearCart() {
  cart.clear();

  // Signal to Qredex (attribution cleared)
  QredexAgent.handleCartEmpty();
}

// ✅ GOOD: Don't signal on partial removal
function removeItem(itemId) {
  cart.remove(itemId);

  // Cart still has items, don't signal
  // Attribution preserved
}
```

### Example 2: Checkout Flow

```javascript
// ⚠️ During checkout, cart might be "empty"
// but order is in progress - DON'T clear yet
function startCheckout() {
  const cartItems = cart.getItems();
  cart.clear();  // Move to order

  // DON'T call handleCartEmpty() - order in progress
  // Attribution preserved until payment complete
}

// ✅ NOW signal - journey complete
function onPaymentSuccess(order) {
  QredexAgent.handlePaymentSuccess();
  // Agent clears PIT automatically
}
```

### Example 3: Session-Based Clearing

```javascript
// ✅ Clear on session end (logout, timeout)
function logout() {
  cart.clear();
  session.destroy();

  // Signal - user session ended
  QredexAgent.handleCartEmpty();
}

// ✅ Clear on timeout
function onSessionTimeout() {
  if (cart.isEmpty()) {
    // Session expired + cart empty = journey ended
    QredexAgent.handleCartEmpty();
  }
}
```

---

## Token Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ATTRIBUTION LIFECYCLE                                                  │
└─────────────────────────────────────────────────────────────────────────┘

Click Link A          Add to Cart         Browse More       Checkout
    │                     │                    │               │
    ▼                     ▼                    ▼               ▼
┌─────────┐          ┌─────────┐         ┌─────────┐     ┌─────────┐
│ IIT-A   │─────────▶│ PIT-A   │────────▶│ PIT-A   │────▶│ PIT-A   │
│ stored  │  lock    │ created │         │ persists│     │ sent to │
└─────────┘          └─────────┘         └─────────┘     │ backend │
                                                         └────┬────┘
                                                              │
                                                              ▼
Cart Emptied OR                                         ┌─────────┐
Checkout Complete                                       │ Clear   │
    │                                                   │ PIT-A   │
    │                                                   └─────────┘
    │                                                        │
    └────────────────────────────────────────────────────────┘
                             │
                             ▼
                      ┌─────────────┐
                      │ (no token)  │
                      │ Ready for   │
                      │ new IIT     │
                      └─────────────┘
```

---

## Related Documentation

- [Integration Model](./BRAINSTEM_TIER_MODEL.md) - 2-path integration guide
- [API Reference](./API.md) - Event hooks documentation

---

## Support

For questions about attribution clearing: support@qredex.com
