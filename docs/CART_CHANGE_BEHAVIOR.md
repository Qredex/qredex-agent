<!--
     ▄▄▄▄
   ▄█▀▀███▄▄              █▄
   ██    ██ ▄             ██
   ██    ██ ████▄▄█▀█▄ ▄████ ▄█▀█▄▀██ ██▀
   ██  ▄ ██ ██   ██▄█▀ ██ ██ ██▄█▀  ███
    ▀█████▄▄█▀  ▄▀█▄▄▄▄█▀███▄▀█▄▄▄▄██ ██▄
          ▀█
  
   Copyright (C) 2026 — 2026, Qredex, LTD. All Rights Reserved.
  
   DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
  
   Licensed under the Apache License, Version 2.0. See LICENSE for the full license text.
   You may not use this file except in compliance with that License.
   Unless required by applicable law or agreed to in writing, software distributed under the
   License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
   either express or implied. See the License for the specific language governing permissions
   and limitations under the License.
  
   If you need additional information or have any questions, please email: copyright@qredex.com
-->

# handleCartChange Behavior Matrix

**Complete specification of cart state transition behavior.**

---

## Overview

`handleCartChange()` is the **single method** for all cart state changes. It automatically:

- 🔒 **Locks** IIT → PIT when cart goes from empty → has items
- 🗑️ **Clears** tokens when cart goes from has items → empty
- — **No action** for other transitions

---

## Behavior Matrix

| Transition | `itemCount` | `previousCount` | Action | Description |
|------------|-------------|-----------------|--------|-------------|
| `0 → 1` | 1 | 0 | 🔒 Lock (if IIT exists, no PIT) | First item added |
| `0 → 3` | 3 | 0 | 🔒 Lock (if IIT exists, no PIT) | Multiple items added at once |
| `1 → 3` | 3 | 1 | — | Adding more items (already locked) |
| `3 → 2` | 2 | 3 | — | Removing one item |
| `1 → 0` | 0 | 1 | 🗑️ Clear (if PIT exists) | Last item removed |
| `3 → 0` | 0 | 3 | 🗑️ Clear (if PIT exists) | Cart emptied |
| `0 → 0` | 0 | 0 | — | Cart stays empty |

**Important:** Lock only occurs if IIT exists AND PIT doesn't exist. Clear only occurs if PIT exists.

---

## Implementation Logic

```typescript
export function handleCartChange(event: {
  itemCount: number;
  previousCount: number;
  meta?: {
    productId?: string;
    quantity?: number;
    price?: number;
  };
}): void {
  const { itemCount, previousCount, meta } = event;

  // Validate inputs
  if (typeof itemCount !== 'number' || typeof previousCount !== 'number') {
    emitError('itemCount and previousCount must be numbers');
    return;
  }

  if (itemCount < 0 || previousCount < 0) {
    emitError('itemCount and previousCount must be non-negative');
    return;
  }

  // Lock when cart goes from 0 → >0 (first item added)
  // IMPORTANT: Only locks if IIT exists AND PIT doesn't exist
  if (itemCount > 0 && previousCount === 0) {
    if (hasInfluenceIntentToken() && !hasPurchaseIntentToken()) {
      lockIntent(meta)
        .then((result) => {
          if (result.success) {
            emitLocked(result.purchaseToken, result.alreadyLocked);
          } else {
            emitError(result.error);
          }
        })
        .catch((err) => {
          emitError(err.message);
        });
    }
    // No IIT or PIT already exists → no lock needed
  }

  // Clear when cart goes from >0 → 0 (emptied) and PIT exists
  if (itemCount === 0 && previousCount > 0 && hasPurchaseIntentToken()) {
    clearIntent();
    emitCleared();
  }
}
```

**Key Preconditions:**
- **Lock requires:** IIT exists AND PIT doesn't exist
- **Clear requires:** PIT exists
- **No action:** If preconditions not met

---

## Detailed Transition Analysis

### 🔒 Lock Transitions (0 → >0)

#### `0 → 1` - Single Item Added

```javascript
// User adds first item
QredexAgent.handleCartChange({
  itemCount: 1,
  previousCount: 0,
});

// Result: IIT → PIT lock via API
```

**Why:** This is the primary attribution moment. User showed purchase intent.

---

#### `0 → 3` - Multiple Items Added

```javascript
// User adds 3 items at once (e.g., bulk add)
QredexAgent.handleCartChange({
  itemCount: 3,
  previousCount: 0,
});

// Result: IIT → PIT lock via API (same as 0 → 1)
```

**Why:** Still the first items. Lock once, regardless of quantity.

---

### — No-Action Transitions

#### `1 → 3` - Adding More Items

```javascript
// User already has 1 item, adds 2 more
QredexAgent.handleCartChange({
  itemCount: 3,
  previousCount: 1,
});

// Result: No action (already locked)
```

**Why:** Attribution already locked. No need to re-lock.

---

#### `3 → 2` - Removing One Item

```javascript
// User removes 1 item from cart with 3 items
QredexAgent.handleCartChange({
  itemCount: 2,
  previousCount: 3,
});

// Result: No action (cart still has items)
```

**Why:** User still has items in cart. Attribution remains valid.

---

### 🗑️ Clear Transitions (>0 → 0)

#### `1 → 0` - Last Item Removed

```javascript
// User removes the last item
QredexAgent.handleCartChange({
  itemCount: 0,
  previousCount: 1,
});

// Result: PIT cleared from storage
```

**Why:** No cart = no purchase intent. Clear attribution.

---

#### `3 → 0` - Cart Emptied

```javascript
// User empties cart with 3 items
QredexAgent.handleCartChange({
  itemCount: 0,
  previousCount: 3,
});

// Result: PIT cleared from storage
```

**Why:** Same as 1 → 0. No cart = no purchase intent.

---

### — Edge Cases

#### `0 → 0` - Cart Stays Empty

```javascript
// Cart was empty, still empty (e.g., failed add)
QredexAgent.handleCartChange({
  itemCount: 0,
  previousCount: 0,
});

// Result: No action
```

**Why:** Nothing changed. No tokens to lock or clear.

---

#### Invalid Inputs

```javascript
// Missing required fields
QredexAgent.handleCartChange({
  itemCount: 1,
  // previousCount missing
});

// Result: Error emitted, no action
```

**Error emitted:**
```javascript
QredexAgent.onError(({ code, message, context }) => {
  // code: "invalid_cart_counts"
  // message: "itemCount and previousCount must be numbers"
  // context: "handleCartChange"
});
```

---

## State Machine Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    ┌─────────┐         🔒 Lock         ┌─────────┐         │
│    │  Empty  │ ──────────────────────> │  Has    │         │
│    │  (0)    │    itemCount > 0        │  (>0)   │         │
│    │         │    previousCount = 0    │         │         │
│    └────┬────┘                         └────┬────┘         │
│         │                                   │               │
│         │                                   │               │
│         │  🗑️ Clear                         │  —            │
│         │  itemCount = 0                    │  itemCount > 0│
│         │  previousCount > 0                │  previousCount│
│         │  hasPIT = true                    │               │
│         │                                   │               │
│         └───────────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Usage Examples

### E-commerce Cart

```javascript
// Add to cart
async function addToCart(product, quantity = 1) {
  const previousCount = cart.length;
  
  await api.post('/cart', { productId: product.id, quantity });
  
  cart.push({ ...product, quantity });
  
  QredexAgent.handleCartChange({
    itemCount: cart.length,
    previousCount,
  });
}

// Remove from cart
async function removeFromCart(productId) {
  const previousCount = cart.length;
  
  await api.delete('/cart', { productId });
  
  cart = cart.filter(item => item.id !== productId);
  
  QredexAgent.handleCartChange({
    itemCount: cart.length,
    previousCount,
  });
}

// Clear cart
async function clearCart() {
  const previousCount = cart.length;
  
  await api.delete('/cart');
  
  cart = [];
  
  QredexAgent.handleCartChange({
    itemCount: 0,
    previousCount,
  });
}
```

### React/Next.js

```tsx
function useCart() {
  const [items, setItems] = useState([]);

  const addItem = async (product) => {
    const previousCount = items.length;
    
    await api.post('/cart', product);
    setItems(prev => [...prev, product]);
    
    QredexAgent.handleCartChange({
      itemCount: items.length + 1,
      previousCount,
    });
  };

  const clearCart = async () => {
    const previousCount = items.length;
    
    await api.delete('/cart');
    setItems([]);
    
    QredexAgent.handleCartChange({
      itemCount: 0,
      previousCount,
    });
  };

  return { items, addItem, clearCart };
}
```

### Vue/Nuxt

```vue
<script setup>
const cart = ref([]);

const addToCart = async (product) => {
  const previousCount = cart.value.length;
  
  await $api.post('/cart', product);
  cart.value.push(product);
  
  QredexAgent.handleCartChange({
    itemCount: cart.value.length,
    previousCount,
  });
};

const clearCart = async () => {
  const previousCount = cart.value.length;
  
  await $api.delete('/cart');
  cart.value = [];
  
  QredexAgent.handleCartChange({
    itemCount: 0,
    previousCount,
  });
};
</script>
```

---

## Testing Checklist

- [ ] **0 → 1**: Add first item, verify IIT → PIT lock
- [ ] **0 → 3**: Add multiple items at once, verify lock
- [ ] **1 → 3**: Add more items, verify no re-lock
- [ ] **3 → 2**: Remove one item, verify no clear
- [ ] **1 → 0**: Remove last item, verify PIT clear
- [ ] **3 → 0**: Empty cart, verify PIT clear
- [ ] **0 → 0**: No-op transition, verify no action
- [ ] **Invalid inputs**: Verify error emission

---

## See Also

- [API Reference](./API.md) - Full API documentation
- [Integration Model](./INTEGRATION_MODEL.md) - How to integrate
- [Testing Guide](./TESTING_GUIDE.md) - How to test
