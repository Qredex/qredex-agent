# Qredex Agent - Detection Guide

How the Qredex Agent detects add-to-cart events.

---

## Overview

The agent uses a **layered detection strategy** to identify when shoppers add products to their cart.

---

## Detection Methods

### 1. Click Detection (Primary)

Listens for clicks on add-to-cart buttons.

**Selectors:**
- `[data-add-to-cart]` - Explicit attribute
- `.add-to-cart` - Class name
- `button[name="add"]` - Button name
- `button[name="add-to-cart"]` - Button name
- Buttons containing "Add to Cart" text

**Example HTML:**
```html
<!-- Explicit attribute (recommended) -->
<button data-add-to-cart data-product-id="123">
  Add to Cart
</button>

<!-- Class name -->
<button class="add-to-cart">
  Add to Cart
</button>

<!-- Button name -->
<button name="add" value="123">
  Add to Cart
</button>
```

**Event Data:**
```javascript
{
  source: 'click',
  meta: {
    productId: '123',  // From data attribute
    timestamp: 1234567890
  }
}
```

---

### 2. Form Detection (Fallback)

Listens for form submissions that look like add-to-cart actions.

**Detection Criteria:**
- Form action contains "cart" or "add"
- Form ID contains "cart" or "add"
- Submit button has cart-related text
- Form has product/quantity inputs

**Example HTML:**
```html
<!-- Standard cart form -->
<form action="/cart/add" method="POST">
  <input type="hidden" name="id" value="123">
  <input type="number" name="quantity" value="1">
  <button type="submit">Add to Cart</button>
</form>
```

**Event Data:**
```javascript
{
  source: 'form',
  meta: {
    productId: '123',    // From form input
    quantity: 1,         // From form input
    timestamp: 1234567890
  }
}
```

---

### 3. Manual Trigger (Guaranteed)

Explicit API call for custom integrations.

**Usage:**
```javascript
QredexAgent.handleAddToCart({
  productId: 'widget-001',
  productName: 'Premium Widget',
  quantity: 2,
  price: 99.99,
});
```

**When to Use:**
- AJAX cart implementations
- Custom checkout flows
- Non-standard e-commerce platforms
- Testing and debugging

---

## Detection Pipeline

All detection methods flow through a shared pipeline:

```
┌─────────────────────────────────────────────────────────────┐
│                    Detection Trigger                        │
│         (Click / Form / Manual)                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Emit Add-to-Cart Event                                   │
│    → Call registered handlers                               │
│    → Track event metadata                                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Check Lock Conditions                                    │
│    → IIT exists?                                            │
│    → PIT doesn't exist?                                     │
│    → No lock in flight?                                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
           ┌──────────┴──────────┐
           │                     │
           ▼                     ▼
        All Yes               Any No
           │                     │
           │                     └────► Skip Lock
           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Call Lock Endpoint                                       │
│    → POST /api/v1/agent/intents/lock                        │
│    → Exchange IIT for PIT                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuration

### Enable/Disable Auto-Detection

**Disable:**
```javascript
QredexAgent.disableDetection();
```

**Enable:**
```javascript
QredexAgent.enableDetection();
```

### Register Custom Handler

```javascript
QredexAgent.onAddToCart((event) => {
  console.log('Source:', event.source);
  console.log('Product:', event.meta);
  
  // Send to analytics
  gtag('event', 'add_to_cart', {
    items: [{
      item_id: event.meta.productId,
      quantity: event.meta.quantity || 1,
    }]
  });
});
```

### Unregister Handler

```javascript
const handler = (event) => {
  // Handle event
};

QredexAgent.onAddToCart(handler);
// ... later
QredexAgent.offAddToCart(handler);
```

---

## Custom Integration

### Shopify (Custom Theme)

```javascript
// Listen for Shopify AJAX cart
document.addEventListener('cart:updated', (event) => {
  QredexAgent.handleAddToCart({
    productId: event.detail.productId,
    quantity: event.detail.quantity,
  });
});
```

### WooCommerce

```javascript
// Listen for WooCommerce cart events
$(document.body).on('added_to_cart', function(e, fragments, cart_hash, $button) {
  QredexAgent.handleAddToCart({
    productId: $button.data('product_id'),
    quantity: $button.data('quantity'),
  });
});
```

### React/Next.js

```jsx
function ProductPage({ product }) {
  const handleAddToCart = async () => {
    // Your cart logic
    await addToCart(product);
    
    // Notify Qredex
    QredexAgent.handleAddToCart({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price: product.price,
    });
  };

  return (
    <button onClick={handleAddToCart}>
      Add to Cart
    </button>
  );
}
```

### Vue/Nuxt

```vue
<script setup>
const handleAddToCart = async (product) => {
  await cartStore.add(product);
  
  QredexAgent.handleAddToCart({
    productId: product.id,
    productName: product.name,
    quantity: 1,
  });
};
</script>

<template>
  <button @click="handleAddToCart(product)">
    Add to Cart
  </button>
</template>
```

---

## Best Practices

### ✅ Do

**Use explicit data attributes:**
```html
<button 
  data-add-to-cart 
  data-product-id="123"
  data-variant-id="456">
  Add to Cart
</button>
```

**Include product metadata:**
```javascript
QredexAgent.handleAddToCart({
  productId: '123',
  productName: 'Widget',
  quantity: 2,
  price: 29.99,
});
```

**Test detection:**
```javascript
QredexAgent.onAddToCart((event) => {
  console.log('Detected:', event);
});
```

### ❌ Don't

**Don't rely solely on text matching:**
```html
<!-- Unreliable - text may change -->
<button>Add to Basket</button>  <!-- Won't match "Add to Cart" -->
```

**Don't call multiple times unnecessarily:**
```javascript
// Bad - called on every render
useEffect(() => {
  QredexAgent.handleAddToCart({...});
});

// Good - called on action
<button onClick={() => QredexAgent.handleAddToCart({...})} />
```

---

## Debugging

### Enable Debug Mode

```html
<script>
  window.QredexAgentConfig = { debug: true };
</script>
```

### Check Detection

```javascript
// Verify detection is enabled
const status = QredexAgent.getStatus();
console.log('Running:', status.running);

// Test manual trigger
QredexAgent.handleAddToCart({ productId: 'test' });
```

### Common Issues

**Detection not working:**
1. Check if auto-detect is enabled
2. Verify button matches selectors
3. Use manual trigger as fallback

**Multiple detections:**
1. Check for duplicate event listeners
2. Verify not calling manual + auto together
3. Use `offAddToCart()` to remove handlers

---

## Related Documentation

- **[Installation](./INSTALLATION.md)** - Setup guide
- **[API Reference](./API.md)** - Public API methods
- **[Lock Flow](./LOCK_FLOW.md)** - How locking works

---

## Support

For detection issues: support@qredex.com
