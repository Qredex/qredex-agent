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

  This file is part of the Qredex Agent SDK and is licensed under the MIT License. See LICENSE.
  Redistribution and use are permitted under that license.

  If you need additional information or have any questions, please email: copyright@qredex.com
-->

# Qredex Agent - Examples

**Quick testing for Qredex Agent using the generated development IIFE bundle.**

> ⚠️ **IMPORTANT:** Build the bundle first, then serve the repo over HTTP. Opening the file directly (`file://`) will not work.

---

## Quick Start

### Option 1: Start the local example (Recommended)

```bash
# Build the generated development bundle, start the local server, and open the page
npm run example
```

If your browser does not open automatically, use:

```bash
open http://localhost:3000/examples/index.html
```

The hub opens first. Start with the featured CDN card, then open the framework-specific example apps as needed.

### Browser smoke test

```bash
npm run test:browser
```

This builds the development IIFE bundle, serves the repo root, opens the example in a real browser, and verifies:
- preload config + generated bundle load
- `window.QredexAgent` global attachment
- IIT capture and URL cleanup
- add to cart -> PIT lock
- refresh persistence
- remove from cart -> PIT clear

### Option 2: Build a staging bundle

```bash
# 1. Build the staging bundle
npm run build:stage

# 2. Deliver /dist with your staging site
#    Use lockEndpoint to point at the staging Qredex backend
```

---

## Pages

- `examples/index.html` = example hub
- `examples/cdn/index.html` = canonical CDN/script-tag path
- `examples/wrappers/react/index.html` = real React app using `@qredex/react`
- `examples/wrappers/vue/index.html` = real Vue app using `@qredex/vue`
- `examples/wrappers/svelte/index.html` = real Svelte app using `@qredex/svelte`
- `examples/wrappers/angular/index.html` = real Angular app using `@qredex/angular`

## What These Examples Do

The examples demonstrate the complete Qredex Agent flow:

1. **IIT Capture** - Simulates landing with `?qdx_intent=xxx` URL parameter
2. **Lock IIT → PIT** - Exchanges intent token for purchase token on "Add to Cart"
3. **Clear Tokens** - Clears all attribution state on "Clear Cart"

**Note:** The CDN page uses `dist/qredex-agent.iife.dev.min.js` with `useMockEndpoint: true`. The wrapper pages use their wrapper packages directly with the same mock setting, so they generate fake PIT tokens locally without network calls.

Wrapper pages stay honest:
- each page is a real mounted framework app
- the code panel shows the exact wrapper bridge used by that page
- the cart scenario stays aligned across frameworks so IIT capture, PIT lock, and clear behavior are easy to compare

On the CDN page, the agent is available globally via `window.QredexAgent`:

```javascript
// Check tokens
QredexAgent.getInfluenceIntentToken()  // Get IIT
QredexAgent.getPurchaseIntentToken()   // Get PIT

// Handle cart state changes
QredexAgent.handleCartChange({
  itemCount: 1,
  previousCount: 0,
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
3. **Click "Add to Cart"**: Empty cart becomes non-empty
4. **Observe**: 
   - IIT disappears (exchanged)
   - PIT appears (locked)
   - Console shows: `✅ Locked!`

### Scenario 2: Clear on Empty

1. **Ensure PIT exists** (from Scenario 1)
2. **Click "Clear Cart"**: Non-empty cart becomes empty
3. **Observe**:
   - PIT disappears
   - Console shows: `🗑️ Cleared`

### Scenario 3: Multiple Adds (No Re-lock)

1. **Add to cart**: Empty cart becomes non-empty and locks IIT → PIT
2. **Add again**: Cart stays non-empty, so there is no second lock once PIT exists
3. **Add again**: Cart stays non-empty, still no second lock
4. **Observe**: Once PIT exists, later add-to-cart events do not re-lock

### Scenario 4: Partial Remove (No Clear)

1. **Add 3 items**: Empty cart becomes non-empty and locks
2. **Clear cart**: Non-empty cart becomes empty and clears tokens
3. **Observe**: Only full empty triggers clear

---

## Behavior Matrix

| Transition | Action | Description |
|------------|--------|-------------|
| Empty cart becomes non-empty | 🔒 Lock | Agent can lock when IIT exists and PIT does not |
| Empty cart becomes non-empty with multiple items | 🔒 Lock | Multiple items at once still produce one lock attempt |
| Non-empty cart stays non-empty | — | Adding more does not re-lock once PIT exists |
| Non-empty cart stays non-empty with fewer items | — | Partial remove does not clear attribution |
| Non-empty cart becomes empty | 🗑️ Clear | Agent clears IIT and PIT |
| Empty cart stays empty | — | No change |

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

For local bundle validation, configure before the script loads:

```html
<script>
  window.QredexAgentConfig = {
    debug: true,              // Non-production only
    lockEndpoint: '/api/v1/agent/intents/lock', // Same-origin non-production override
    cookieExpireDays: 30,     // Cookie expiration
  };
</script>
<script src="../../dist/qredex-agent.iife.dev.min.js"></script>
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
});

// Payment success
QredexAgent.handlePaymentSuccess();
```

### Event Listeners (Agent → Merchant)

```javascript
QredexAgent.onLocked(({ purchaseToken, alreadyLocked, timestamp }) => { ... });
QredexAgent.onCleared(({ timestamp }) => { ... });
QredexAgent.onError(({ error, context }) => { ... });
```

### Manual Commands

```javascript
await QredexAgent.lockIntent();      // Manual lock
QredexAgent.clearIntent();           // Clear all tokens
```

---

## Files

| File | Description |
|------|-------------|
| `index.html` | Example hub |
| `shared/styles.css` | Shared page styles |
| `shared/runtime-example.js` | Shared live cart harness |
| `cdn/index.html` | Canonical CDN example |
| `wrappers/*/index.html` | Framework bridge examples |
| `../dist/qredex-agent.iife.dev.min.js` | Development minified IIFE bundle |

---

## See Also

- [Vanilla JS Example](../vanilla/) - Full e-commerce demo
- [Vue Example](../vue/) - Vue 3 integration
- [React Example](../react/) - Next.js integration
- [README](../../README.md) - Main documentation
