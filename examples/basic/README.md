# Qredex Agent - Basic Example

Comprehensive demo page for testing Qredex Agent functionality with visual feedback and console logging.

---

## Quick Start

### Option 1: Using Vite Dev Server (Recommended)

This example uses the local source code via Vite HMR for development.

```bash
# From project root
npm run dev

# Or from examples/basic directory
cd examples/basic
npx vite ../..
```

Then open `http://localhost:5173/examples/basic/`

### Option 2: Using Static File Server

```bash
# From project root
npx serve examples

# Or using Python
cd examples/basic
python -m http.server 8000
```

Then open `http://localhost:3000/basic/` or `http://localhost:8000/`

---

## Files

| File | Description |
|------|-------------|
| `index.html` | Demo page HTML structure |
| `styles.css` | All CSS styles |
| `app.js` | Application logic and Qredex Agent integration |

---

## Testing Scenarios

### Scenario 1: Initial State (No Token)

**Steps:**
1. Open the demo page in a fresh browser tab
2. Check the **Status** section

**Expected Results:**
- ✅ Initialized: Yes
- ❌ IIT: Not found
- ❌ PIT: Not found

---

### Scenario 2: Simulate Intent URL

**Steps:**
1. Enter a test token in the **Intent Token** input (e.g., `test_intent_abc123`)
2. Click **Simulate Intent URL**
3. Page will auto-reload

**Expected Results:**
- ✅ IIT: Shows truncated token
- ❌ PIT: Not found (not locked yet)

---

### Scenario 3: Add to Cart (Lock IIT → PIT)

**Prerequisites:** Complete Scenario 2 first (IIT must exist)

**Steps:**
1. Ensure IIT is present (check Status)
2. Click **🛒 Add to Cart** button
3. Watch the **Console Log** section

**Expected Results:**
- ✅ PIT: Shows new token
- Console log: "Intent locked! PIT: xxx"

---

### Scenario 4: Clear Tokens (Cart Empty)

**Prerequisites:** Complete Scenario 3 (PIT must exist)

**Steps:**
1. Ensure PIT is present
2. Click **Clear Tokens** button

**Expected Results:**
- ❌ IIT: Not found
- ❌ PIT: Not found

---

### Scenario 5: Full Checkout Flow

**Steps:**
1. Capture IIT (Scenario 2)
2. Lock IIT → PIT (Scenario 3)
3. Click **Clear Tokens** (simulates cart empty/checkout)
4. Verify PIT cleared

---

## Console Commands

Access the agent from the browser console:

```javascript
// Get tokens
QredexAgent.getInfluenceIntentToken()
QredexAgent.getPurchaseIntentToken()

// Check token existence
QredexAgent.hasInfluenceIntentToken()
QredexAgent.hasPurchaseIntentToken()

// Manual operations
await QredexAgent.lockIntent()
QredexAgent.clearTokens()

// Event handlers
QredexAgent.handleCartAdd({ productId: 'test', quantity: 1 })
QredexAgent.handleCartEmpty()
```

---

## Debugging

### Enable Debug Mode

Debug mode is enabled by default in this example. Check browser console for detailed logs.

### Check Storage

Open DevTools → Application → Storage:

**Session Storage:**
- `__qdx_iit` - IIT token
- `__qdx_pit` - PIT token

**Cookies:**
- `__qdx_iit` - IIT fallback
- `__qdx_pit` - PIT fallback

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
