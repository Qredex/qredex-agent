# Qredex Agent - Installation & Integration Guide

Complete guide for installing and integrating the Qredex Agent into your storefront.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Installation Methods](#installation-methods)
- [CDN Versioning](#cdn-versioning)
- [Configuration](#configuration)
- [Storage Keys](#storage-keys)
- [Environment Setup](#environment-setup)

---

## Quick Start

Add this single line before `</body>` in your HTML:

```html
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
```

**That's it.** The agent auto-starts and begins capturing intent tokens.

---

## Installation Methods

### Method 1: Script Tag (Recommended)

For Shopify, WooCommerce, or any storefront:

```html
<!-- Add before </body> -->
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
```

**Best for:**
- Shopify theme.liquid
- Custom storefronts
- No build process required

### Method 2: CDN with Pre-Load Config

For custom configuration:

```html
<script>
  window.QredexAgentConfig = {
    debug: false,
  };
</script>
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
```

---

## CDN Versioning

The agent uses semantic versioning for CDN delivery.

### Version Formats

| Format | Example | Behavior | Use Case |
|--------|---------|----------|----------|
| **Major** | `/v1/` | Auto-updates within v1.x.x | Production (recommended) |
| **Pinned** | `/v1.0.0/` | Immutable | Critical production, testing |
| **Latest** | `/latest/` | Always newest | Development only |

### Examples

**Production (auto-updates within v1):**
```html
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
```

**Pinned version (immutable):**
```html
<script src="https://cdn.qredex.com/agent/v1.0.0/qredex-agent.iife.min.js"></script>
```

**Development (always latest):**
```html
<script src="https://cdn.qredex.com/agent/latest/qredex-agent.iife.min.js"></script>
```

### Caching Headers

**Pinned versions:**
```
Cache-Control: public, max-age=31536000, immutable
```

**Major alias:**
```
Cache-Control: public, max-age=3600, must-revalidate
```

---

## Configuration

Set `window.QredexAgentConfig` **before** the script loads:

```html
<script>
  window.QredexAgentConfig = {
    // Debug logging (silent by default, safe for production)
    debug: false,

    // Storage keys (usually not needed)
    influenceIntentToken: '__qdx_iit',
    purchaseIntentToken: '__qdx_pit',

    // Cookie expiration in days
    cookieExpireDays: 30,
  };
</script>
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
```

### Configuration Options

| Option | Type | Default | Production | Description |
|--------|------|---------|------------|-------------|
| `lockEndpoint` | `string` | Production URL | ❌ Ignored | ⚠️ **DEV/STAGING ONLY** - Override ignored in production |
| `debug` | `boolean` | `false` | ✅ Safe | Enable debug logging |
| `useMockEndpoint` | `boolean` | `false` | ❌ Never | ⚠️ **DEV ONLY** - Generate fake PIT tokens (no network calls) |
| `influenceIntentToken` | `string` | `'__qdx_iit'` | ✅ Default | Storage key for IIT |
| `purchaseIntentToken` | `string` | `'__qdx_pit'` | ✅ Default | Storage key for PIT |
| `cookieExpireDays` | `number` | `30` | ✅ Default | Cookie expiration in days |

---

## Environment Setup

### Development

```html
<script>
  window.QredexAgentConfig = {
    debug: true,  // Enable logs
    useMockEndpoint: true,  // Mock PIT tokens (no network calls)
  };
</script>
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
```

### Staging

```html
<script>
  window.QredexAgentConfig = {
    debug: true,
    lockEndpoint: 'https://staging-api.your-backend.com/api/v1/agent/intents/lock',
  };
</script>
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
```

### Production

```html
<!-- Defaults to production endpoint -->
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
```

> **Note:** In production builds, `lockEndpoint` overrides are **ignored**. The agent always uses the default Qredex AGENT endpoint (`https://api.qredex.com/api/v1/agent/intents/lock`). This ensures consistent runtime behavior and prevents accidental misconfiguration.

---

## Storage Keys

The agent uses standardized keys for browser storage:

| Storage | Key | Purpose |
|---------|-----|---------|
| Cookie + sessionStorage | `__qdx_iit` | Influence Intent Token (IIT) |
| Cookie + sessionStorage | `__qdx_pit` | Purchase Intent Token (PIT) |

**Note for merchants:** Your backend may need to read `__qdx_pit` from cookies to associate orders with attributed intent.

---

## Debug Logging

Debug logging is **safe for production** - silent by default:

```html
<script>
  window.QredexAgentConfig = { debug: true };
</script>
```

**Example output:**
```
[QredexAgent] Configuration initialized from pre-load global config
[QredexAgent] Auto-start: capturing intent token from URL
[QredexAgent] Found qdx_intent in URL
[QredexAgent] Intent token captured and stored
[QredexAgent] Add-to-cart detection enabled
[QredexAgent] QredexAgent initialized
```

---

## Shopify Integration

### Online Store 2.0

1. Go to **Online Store → Themes**
2. Click **Actions → Edit code**
3. Open `layout/theme.liquid`
4. Add before `</body>`:

```liquid
<!-- Qredex Agent -->
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
```

### With Configuration

```liquid
<!-- Qredex Agent with config -->
<script>
  window.QredexAgentConfig = {
    debug: {{ settings.debug_mode | default: false }},
  };
</script>
<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
```

---

## WooCommerce Integration

Add to your theme's `footer.php` or use a plugin:

```php
<!-- Add to functions.php or footer template -->
add_action('wp_footer', function() {
    ?>
    <script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>
    <?php
});
```

---

## Custom Storefront

For React, Vue, or other frameworks:

```javascript
// In your main entry point (App.jsx, main.js, etc.)
useEffect(() => {
  // Load agent dynamically
  const script = document.createElement('script');
  script.src = 'https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js';
  script.async = true;
  document.body.appendChild(script);
  
  return () => {
    document.body.removeChild(script);
  };
}, []);
```

---

## Troubleshooting

### Agent Not Loading

1. Check script tag is before `</body>`
2. Verify CDN URL is correct
3. Check browser console for errors

### Token Not Capturing

1. Verify URL has `?qdx_intent=xxx` parameter
2. Check sessionStorage for `__qdx_iit`
3. Enable debug mode to see logs

### Lock Not Working

1. Check `lockEndpoint` is correct for your environment
2. Verify IIT exists: `QredexAgent.hasInfluenceIntentToken()`
3. Check network tab for API errors

---

## Related Documentation

- **[API Reference](./API.md)** - Complete public API documentation
- **[Lock Flow](./LOCK_FLOW.md)** - How IIT → PIT locking works
- **[Detection Guide](./DETECTION.md)** - Add-to-cart detection strategies

---

## Support

For integration help: support@qredex.com
