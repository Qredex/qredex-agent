# Qredex Agent - Basic Example

Comprehensive demo page for testing Qredex Agent functionality with visual feedback and console logging.

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

## Features

This demo page provides:

- **Visual Status Display** - Real-time token status (IIT/PIT)
- **Token Simulation** - Simulate URL with intent token
- **Product Demo** - Add-to-cart button with metadata
- **Manual Triggers** - Manually trigger lock and add-to-cart
- **Console Log** - In-page log output
- **API Reference** - Quick reference for console commands

---

## Testing Guide

See **[TESTING.md](./TESTING.md)** for comprehensive testing scenarios and step-by-step instructions.

---

## Files

| File | Description |
|------|-------------|
| `index.html` | Demo page with Qredex Agent integration |

---

## Usage

### 1. Include Agent Script

```html
<!-- Add before </body> -->
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
```

### 2. Initialize Agent

```javascript
// In browser console or script
QredexAgent.init({ debug: true });
```

### 3. Access Agent API

The agent is available globally as `window.QredexAgent`:

```javascript
// Get tokens
window.QredexAgent.getIntentToken()
window.QredexAgent.getPurchaseIntentToken()

// Check token existence
window.QredexAgent.hasIntentToken()
window.QredexAgent.hasPurchaseIntentToken()

// Manual trigger
window.QredexAgent.handleAddToCart({ productId: 'xxx', quantity: 2 })

// Lock intent (idempotent)
window.QredexAgent.lockIntent()

// Status
window.QredexAgent.isInitialized()
window.QredexAgent.getStatus()
```

---

## Demo Sections

### Status

Shows real-time agent and token status:
- **Initialized** - Agent initialization state
- **IIT** - Influence Intent Token presence
- **PIT** - Purchase Intent Token presence

### Intent Token (IIT)

Displays current IIT and provides actions:
- **Refresh** - Reload token status
- **Clear Tokens** - Remove all tokens from storage

### Purchase Intent Token (PIT)

Displays current PIT after locking.

### Simulate URL with Intent

Simulate landing on a page with `?qdx_intent=xxx`:
1. Enter token in input field
2. Click "Simulate Intent URL"
3. Page auto-reloads with token captured

### Product Demo

Simulates e-commerce product page:
- Product card with metadata
- Quantity selector
- Add-to-cart button with `data-add-to-cart` attribute

### Manual Trigger

Manually trigger agent actions:
- **Trigger Add-to-Cart** - Fire cart add event
- **Lock Intent** - Manually lock IIT → PIT

### Console Log

In-page log output showing:
- Agent events
- Token operations
- Errors and warnings

### API Reference

Quick reference for all available console commands.

---

## Testing Scenarios

### Scenario 1: Capture Intent from URL

1. Enter token: `test_intent_123`
2. Click "Simulate Intent URL"
3. Verify IIT appears in status

### Scenario 2: Lock Intent (Add to Cart)

1. Ensure IIT exists
2. Click "Add to Cart"
3. Verify PIT appears
4. Check console for lock confirmation

### Scenario 3: Clear Tokens (Cart Empty)

1. Ensure PIT exists
2. Click "Clear Tokens"
3. Verify both IIT and PIT cleared

### Scenario 4: Full Checkout Flow

1. Capture IIT (Scenario 1)
2. Lock IIT → PIT (Scenario 2)
3. Simulate checkout (clears PIT)
4. Verify PIT cleared

---

## Debugging

### Enable Debug Mode

```javascript
window.QredexAgentConfig = { debug: true };
location.reload();
```

### Check Storage

Open DevTools → Application → Storage:

**Session Storage:**
- `__qdx_iit` - IIT token
- `__qdx_pit` - PIT token

**Cookies:**
- `__qdx_iit` - IIT fallback
- `__qdx_pit` - PIT fallback

### Console Commands

```javascript
// Quick status
console.log({
  initialized: QredexAgent.isInitialized(),
  hasIIT: QredexAgent.hasIntentToken(),
  hasPIT: QredexAgent.hasPurchaseIntentToken(),
});

// Manual operations
await QredexAgent.lockIntent()
QredexAgent.clearTokens()
```

---

## Related Examples

| Example | Description |
|---------|-------------|
| [../vanilla/](../vanilla/) | Vanilla JS e-commerce demo |
| [../react/](../react/) | React/Next.js integration |
| [../vue/](../vue/) | Vue/Nuxt integration |

---

## License

MIT
