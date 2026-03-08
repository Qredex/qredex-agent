# Qredex Agent

A lightweight, framework-agnostic browser agent for Qredex that captures intent tokens from URLs, persists them safely, detects add-to-cart events, and automatically locks intent through Qredex's API.

---

## Quick Start

Add this single line before `</body>`:

```html
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
```

**That's it.** The agent auto-starts and begins capturing intent tokens.

---

## What It Does

1. **Captures** `qdx_intent` token from URL
2. **Stores** token in sessionStorage + cookie
3. **Detects** add-to-cart events automatically
4. **Locks** intent (IIT → PIT) when cart action occurs
5. **Exposes** global `window.QredexAgent` API

---

## Configuration (Optional)

Set config **before** the script loads:

```html
<script>
  window.QredexAgentConfig = {
    debug: false,  // Enable for troubleshooting
  };
</script>
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
```

See **[Installation Guide](docs/INSTALLATION.md)** for full configuration options.

---

## Public API

Access via `window.QredexAgent`:

```javascript
// Check token status
QredexAgent.hasIntentToken();
QredexAgent.hasPurchaseIntentToken();

// Get tokens
QredexAgent.getIntentToken();
QredexAgent.getPurchaseIntentToken();

// Manual operations
await QredexAgent.lockIntent({ productId: '123' });
QredexAgent.handleAddToCart({ productId: '123', quantity: 1 });

// Lifecycle
QredexAgent.destroy();
QredexAgent.isInitialized();
```

See **[API Reference](docs/API.md)** for complete documentation.

---

## Documentation

| Document | Description |
|----------|-------------|
| **[Installation](docs/INSTALLATION.md)** | Setup, CDN versioning, Shopify/WooCommerce integration |
| **[API Reference](docs/API.md)** | Complete public API documentation |
| **[Lock Flow](docs/LOCK_FLOW.md)** | How IIT → PIT locking works |
| **[Detection](docs/DETECTION.md)** | Add-to-cart detection strategies |
| **[AGENTS.md](AGENTS.md)** | Development guidelines |

---

## Development

### Setup

```bash
npm install  # Install development dependencies
```

### Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm run test     # Run tests
npm run lint     # Lint code
```

### Project Structure

```
qredex-agent/
├── src/
│   ├── index.ts           # Main entry, public API
│   ├── bootstrap/         # Auto-start, config
│   ├── core/              # State, lifecycle
│   ├── storage/           # sessionStorage, cookies
│   ├── detect/            # Click, form, manual detection
│   ├── api/               # Lock endpoint client
│   └── utils/             # Logging, DOM, guards
├── tests/
│   └── unit/              # Unit tests
└── dist/                  # Build output
```

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Requires ES2020+ support.

---

## Documentation

| Document | Description |
|----------|-------------|
| **[Integration Model](docs/INTEGRATION_MODEL.md)** | 2-path integration guide (Backend API + Frontend Hooks) |
| **[Cart Empty Policy](docs/CART_EMPTY_POLICY.md)** | Attribution clearing rationale and guidance |
| **[API Reference](docs/API.md)** | Complete API documentation |
| **[Installation Guide](docs/INSTALLATION.md)** | Setup instructions |
| **[AGENTS.md](AGENTS.md)** | Development guidelines |

---

## License

MIT

---

## Support

For questions: support@qredex.com
