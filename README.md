# Qredex Agent

A lightweight, framework-agnostic browser agent for Qredex that captures intent tokens from URLs, persists them safely, detects add-to-cart events, and automatically locks intent through Qredex's API.

## Overview

The Qredex Agent is designed to be embedded on any storefront website. Its primary purposes are:

1. **Capture** the `qdx_intent` token from the page URL
2. **Persist** the token in sessionStorage (with cookie fallback)
3. **Expose** safe global access to the token via `window.QredexAgent`
4. **Detect** likely add-to-cart events using multiple strategies
5. **Lock** the intent automatically by calling Qredex's public lock endpoint

## Installation

### Via Script Tag (Recommended)

```html
<!-- Add to your page before </body> -->
<script src="https://cdn.qredex.com/agent/qredex-agent.umd.cjs"></script>
```

### Via NPM

```bash
npm install qredex-agent
```

```javascript
import { init, getIntentToken, handleAddToCart } from 'qredex-agent';

// Optional: initialize with config
init({ debug: true });
```

## Auto-Start Behavior

The agent **automatically starts** when the script loads:

- Immediately captures `qdx_intent` from the URL if present
- Stores the token in sessionStorage and cookie
- Cleans the URL using `history.replaceState`
- Begins listening for add-to-cart events (unless disabled)

**No manual initialization is required** for basic functionality.

## Configuration

### Pre-Load Global Config

Set configuration before the script loads:

```html
<script>
  window.QredexAgentConfig = {
    debug: true,
    lockEndpoint: 'https://api.qredex.com/agent/lock',
    autoDetect: true,
  };
</script>
<script src="qredex-agent.umd.cjs"></script>
```

### Programmatic Config

```javascript
import { init } from 'qredex-agent';

init({
  // Lock endpoint URL
  lockEndpoint: 'https://api.qredex.com/agent/lock',

  // Enable debug logging
  debug: false,

  // Enable automatic add-to-cart detection
  autoDetect: true,

  // Token key names (used for both cookie and sessionStorage)
  influenceIntentToken: '__qdx_iit',
  purchaseIntentToken: '__qdx_pit',

  // Cookie expiration in days (default: 30 days)
  cookieExpireDays: 30,
});
```

## Public API

### `init(config?)`

Initialize the agent with optional configuration. Usually not needed due to auto-start.

```javascript
QredexAgent.init({ debug: true });
```

### `getIntentToken()`

Get the current Intent Token (IIT). Checks sessionStorage first, then cookie fallback.

```javascript
const token = QredexAgent.getIntentToken();
if (token) {
  console.log('Intent token:', token);
}
```

### `getPurchaseIntentToken()`

Get the current Purchase Intent Token (PIT). Returns `null` if not yet locked.

```javascript
const pit = QredexAgent.getPurchaseIntentToken();
if (pit) {
  console.log('Purchase token:', pit);
}
```

### `lockIntent(meta?)`

Manually trigger a lock request to exchange IIT for PIT. This function is **idempotent**:
- If PIT already exists locally, returns it immediately with `alreadyLocked: true`
- If a lock is already in flight, returns the same promise
- If backend indicates already locked, treats it as success

```javascript
const result = await QredexAgent.lockIntent({
  productId: 'widget-001',
  quantity: 2,
});

if (result.success) {
  console.log('PIT:', result.purchaseToken);
  console.log('Was already locked:', result.alreadyLocked);
} else {
  console.error('Lock failed:', result.error);
}
```

### `hasIntentToken()`

Check if an Intent Token (IIT) exists.

```javascript
if (QredexAgent.hasIntentToken()) {
  console.log('Intent token is available');
} else {
  console.log('No intent token found');
}
```

### `hasPurchaseIntentToken()`

Check if a Purchase Intent Token (PIT) exists.

```javascript
if (QredexAgent.hasPurchaseIntentToken()) {
  console.log('Purchase token is available - ready for checkout');
} else {
  console.log('No purchase token yet');
}
```

### `handleAddToCart(meta?)`

Manually trigger an add-to-cart event. This is a first-class API for explicit integration.

```javascript
QredexAgent.handleAddToCart({
  productId: 'widget-001',
  productName: 'Premium Widget',
  quantity: 2,
  price: 99.99,
});
```

### `onAddToCart(handler)`

Register a handler for add-to-cart events.

```javascript
QredexAgent.onAddToCart((event) => {
  console.log('Add-to-cart detected:', event.source);
  console.log('Product:', event.meta.productId);
});
```

### `destroy()`

Destroy the agent and clean up all resources (event listeners, state).

```javascript
QredexAgent.destroy();
```

### `isInitialized()`

Check if the agent is currently initialized and running.

```javascript
if (QredexAgent.isInitialized()) {
  // Agent is ready
}
```

### `getStatus()`

Get detailed status about the agent's state.

```javascript
const status = QredexAgent.getStatus();
// { initialized: true, running: true, destroyed: false }
```

## Detection Strategy

The agent uses a **layered detection strategy** for add-to-cart events:

### 1. Click Detection

Listens for clicks on elements that match common add-to-cart patterns:

- Elements with `data-add-to-cart` attribute
- Elements with `.add-to-cart` class
- Buttons with `name="add"` or `name="add-to-cart"`
- Buttons containing "Add to Cart" text

### 2. Form Detection

Listens for form submissions that look like add-to-cart actions:

- Forms with cart-related actions or IDs
- Forms containing add-to-cart submit buttons
- Forms with product/quantity inputs

### 3. Manual Trigger

Explicit API call for guaranteed detection:

```javascript
QredexAgent.handleAddToCart({ productId: 'xxx' });
```

### Shared Pipeline

All detection methods flow through a **shared pipeline** that:

1. Receives the add-to-cart event
2. Calls registered handlers
3. Checks if locking conditions are met:
   - IIT exists
   - PIT does not already exist
   - No lock request in flight
4. Automatically calls the lock endpoint if conditions are met

## Lock Flow

```
┌─────────────────┐
│ Add-to-Cart     │
│ Detected        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check: IIT      │──── No ──► Skip
│ Exists?         │
└────────┬────────┘
         │ Yes
         ▼
┌─────────────────┐
│ Check: PIT      │──── Yes ──► Skip
│ Exists?         │
└────────┬────────┘
         │ No
         ▼
┌─────────────────┐
│ Check: Lock     │──── Yes ──► Skip
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
│ Store PIT       │
│ in Storage      │
└─────────────────┘
```

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Setup

```bash
npm install
```

### Scripts

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Format code
npm run format

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

### Project Structure

```
qredex-agent/
├── src/
│   ├── index.ts              # Main entry point, public API
│   ├── bootstrap/
│   │   ├── auto-start.ts     # URL token capture on load
│   │   └── config.ts         # Configuration management
│   ├── core/
│   │   ├── state.ts          # Centralized runtime state
│   │   └── lifecycle.ts      # Init/destroy lifecycle
│   ├── storage/
│   │   ├── cookie.ts         # Cookie storage utilities
│   │   ├── session.ts        # SessionStorage utilities
│   │   └── tokens.ts         # Token storage coordination
│   ├── detect/
│   │   ├── types.ts          # Detection type definitions
│   │   ├── click.ts          # Click-based detection
│   │   ├── form.ts           # Form-based detection
│   │   ├── manual.ts         # Manual trigger API
│   │   └── pipeline.ts       # Shared detection pipeline
│   ├── api/
│   │   ├── types.ts          # API type definitions
│   │   └── lock.ts           # Lock endpoint client
│   └── utils/
│       ├── log.ts            # Debug logger
│       ├── dom.ts            # DOM utilities
│       └── guards.ts         # Type guards
├── examples/
│   └── basic/
│       └── index.html        # Demo page
├── tests/
│   ├── unit/                 # Unit tests
│   └── browser/              # Browser tests (scaffold)
└── dist/                     # Build output
```

## Build Output

The project produces two bundles:

| File | Format | Use Case |
|------|--------|----------|
| `qredex-agent.js` | ESM | Modern bundlers, `<script type="module">` |
| `qredex-agent.umd.cjs` | UMD/IIFE | Direct `<script>` tag, `window.QredexAgent` |

Both bundles are minified for production.

## Limitations & Caveats

1. **Add-to-cart detection is best-effort** - Not all e-commerce implementations follow standard patterns. The manual trigger API should be used for guaranteed detection.

2. **Storage access may be restricted** - In private browsing modes or with strict cookie policies, storage may be unavailable. The agent handles this gracefully.

3. **No fetch/XHR interception** - Network interception is not enabled by default to avoid compatibility issues. Detection relies on DOM events.

4. **Single intent per session** - The agent is designed for single-intent flows. Multiple intents are not supported.

5. **Browser-only** - This is a browser library. No Node.js or server-side support.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Requires ES2020+ support.

## License

MIT
