/**
 *    ▄▄▄▄
 *  ▄█▀▀███▄▄              █▄
 *  ██    ██ ▄             ██
 *  ██    ██ ████▄▄█▀█▄ ▄████ ▄█▀█▄▀██ ██▀
 *  ██  ▄ ██ ██   ██▄█▀ ██ ██ ██▄█▀  ███
 *   ▀█████▄▄█▀  ▄▀█▄▄▄▄█▀███▄▀█▄▄▄▄██ ██▄
 *        ▀█
 *
 *  Copyright (C) 2026 — 2026, Qredex, LTD. All Rights Reserved.
 *
 *  DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 *
 *  This file is part of the Qredex Agent SDK and is licensed under the MIT License. See LICENSE.
 *  Redistribution and use are permitted under that license.
 *
 *  If you need additional information or have any questions, please email: copyright@qredex.com
 */

const CART_STORAGE_KEY = 'qredex-example-cart-v1';
const PRODUCTS = [
  {
    id: 'crewneck',
    name: 'Signal Crewneck',
    price: 89,
    description: 'Soft heavyweight layer for testing cart state.',
  },
  {
    id: 'cap',
    name: 'Intent Cap',
    price: 34,
    description: 'Low-friction low-price item for first add testing.',
  },
  {
    id: 'tote',
    name: 'Audit Tote',
    price: 42,
    description: 'Good for quantity changes and refresh persistence.',
  },
  {
    id: 'journal',
    name: 'Lock Journal',
    price: 24,
    description: 'Cheap SKU for quick IIT to PIT lock checks.',
  },
];

const EXAMPLE_LINKS = [
  { kind: 'cdn', label: 'CDN', href: '/examples/cdn/' },
  { kind: 'react', label: 'React', href: '/examples/wrappers/react/' },
  { kind: 'vue', label: 'Vue', href: '/examples/wrappers/vue/' },
  { kind: 'svelte', label: 'Svelte', href: '/examples/wrappers/svelte/' },
  { kind: 'angular', label: 'Angular', href: '/examples/wrappers/angular/' },
];

const PAGE_CONFIG = {
  cdn: {
    documentTitle: 'Qredex Agent CDN Example',
    eyebrow: 'Qredex Agent Example',
    title: 'CDN cart behavior test bench',
    heroCopy:
      'The exact script-tag path customers use, with the generated development IIFE bundle and a persistent cart harness.',
    heroNotes: ['Canonical customer path', 'Generated IIFE bundle', 'Shared live cart harness'],
    badge: 'CDN-first example',
    bridgeLabel: 'Script tag setup',
    bridgeTitle: 'Pre-load config, then use the global agent',
    bridgeCopy:
      'This is the canonical delivery path. Load config before the bundle, let the global auto-init, then report cart state from your existing storefront.',
    installCommand: '<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>',
    codeLanguage: 'html',
    codeSample: [
      '<script>',
      '  window.QredexAgentConfig = {',
      '    debug: false,',
      '  };',
      '</script>',
      '<script src="https://cdn.qredex.com/agent/v1/qredex-agent.iife.min.js"></script>',
      '<script>',
      '  const agent = window.QredexAgent;',
      '',
      '  async function addToCart(product) {',
      '    const previousCount = cart.itemCount;',
      '    await api.post(\'/cart\', product);',
      '',
      '    agent.handleCartChange({',
      '      itemCount: cart.itemCount,',
      '      previousCount,',
      '    });',
      '  }',
      '',
      '  async function clearCart() {',
      '    await api.post(\'/cart/clear\');',
      '    agent.handleCartEmpty();',
      '  }',
      '</script>',
    ].join('\n'),
    runtimeNote:
      'This page loads dist/qredex-agent.iife.dev.min.js with pre-load config, just like a merchant script-tag setup.',
  },
};

let agent = null;
let cart = loadCart();

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderPageSwitch(activeKind) {
  return EXAMPLE_LINKS.map((item) => {
    const classes = ['example-link'];
    if (item.kind === activeKind) {
      classes.push('example-link-active');
    }

    return `<a class="${classes.join(' ')}" href="${item.href}">${item.label}</a>`;
  }).join('');
}

function renderHeroNotes(notes) {
  return notes.map((note) => `<span>${escapeHtml(note)}</span>`).join('');
}

function renderBridgePanel(config) {
  return `
    <section class="panel panel-soft bridge-panel">
      <div class="panel-header">
        <div>
          <p class="panel-label">${escapeHtml(config.bridgeLabel)}</p>
          <h2>${escapeHtml(config.bridgeTitle)}</h2>
        </div>
        <span class="badge">${escapeHtml(config.badge)}</span>
      </div>
      <p class="bridge-copy">${escapeHtml(config.bridgeCopy)}</p>
      <div class="state-box bridge-meta">
        <p class="state-title">Install</p>
        <div class="install-command-row">
          <code class="install-command">${escapeHtml(config.installCommand)}</code>
          <button
            aria-label="Copy install command"
            class="copy-install-button"
            data-copy-install
            title="Copy install command"
            type="button"
          >
            ⧉
          </button>
        </div>
      </div>
      <details class="bridge-details">
        <summary class="bridge-summary">
          <span>Bridge code example</span>
          <span>${escapeHtml(config.codeLanguage.toUpperCase())}</span>
        </summary>
        <div class="code-card">
          <div class="code-card-header">
            <span>${escapeHtml(config.codeLanguage.toUpperCase())}</span>
          </div>
          <pre class="code-block"><code>${escapeHtml(config.codeSample)}</code></pre>
        </div>
      </details>
    </section>
  `;
}

function renderShell(config, activeKind) {
  return `
    <main class="shell">
      <nav class="example-nav">
        <a class="example-home-link" href="./index.html">Examples</a>
        <div class="example-link-row">
          ${renderPageSwitch(activeKind)}
        </div>
      </nav>

      <section class="hero">
        <div>
          <p class="eyebrow">${escapeHtml(config.eyebrow)}</p>
          <h1>${escapeHtml(config.title)}</h1>
          <p class="hero-copy">${escapeHtml(config.heroCopy)}</p>
          <div class="hero-notes">
            ${renderHeroNotes(config.heroNotes)}
          </div>
        </div>
        <div class="hero-actions">
          <button class="btn btn-primary" id="set-intent-button" type="button">Set Random IIT</button>
          <button class="btn btn-secondary" id="reload-button" type="button">Refresh Page</button>
        </div>
      </section>

      <section class="layout">
        <div class="stack">
          <section class="panel">
            <div class="panel-header">
              <div>
                <p class="panel-label">Product Shelf</p>
                <h2>Add test products</h2>
              </div>
            </div>
            <div class="catalog" id="catalog"></div>
          </section>

          <section class="panel">
            <div class="panel-header">
              <div>
                <p class="panel-label">Agent Runtime</p>
                <h2>Current session</h2>
              </div>
              <span class="badge">Live harness</span>
            </div>

            <div class="status-grid">
              <article class="metric">
                <span class="metric-label">IIT</span>
                <strong class="metric-value" id="status-iit">Checking…</strong>
              </article>
              <article class="metric">
                <span class="metric-label">PIT</span>
                <strong class="metric-value" id="status-pit">Checking…</strong>
              </article>
              <article class="metric">
                <span class="metric-label">Cart items</span>
                <strong class="metric-value" id="status-count">0</strong>
              </article>
              <article class="metric">
                <span class="metric-label">Cart state</span>
                <strong class="metric-value" id="status-cart-state">unknown</strong>
              </article>
            </div>

            <details class="runtime-details">
              <summary class="runtime-summary">
                <span>Session details</span>
                <span>URL + harness note</span>
              </summary>
              <div class="state-box">
                <p class="state-title">Visible URL</p>
                <code id="current-url"></code>
              </div>

              <div class="state-box">
                <p class="state-title">Live harness note</p>
                <p id="persistence-note">${escapeHtml(config.runtimeNote)}</p>
              </div>
            </details>
          </section>

          <section class="panel">
            <div class="panel-header">
              <div>
                <p class="panel-label">Event feed</p>
                <h2>Agent and cart activity</h2>
              </div>
            </div>
            <div class="log" id="log"></div>
          </section>
        </div>

        <aside class="side-stack">
          <section class="panel cart-panel">
            <div class="panel-header">
              <div>
                <p class="panel-label">Cart</p>
                <h2>Persistent cart</h2>
              </div>
              <button class="btn btn-danger" id="empty-cart-button" type="button">Empty cart</button>
            </div>

            <div class="cart-summary">
              <div>
                <span class="summary-label">Lines</span>
                <strong id="summary-lines">0</strong>
              </div>
              <div>
                <span class="summary-label">Units</span>
                <strong id="summary-units">0</strong>
              </div>
              <div>
                <span class="summary-label">Subtotal</span>
                <strong id="summary-subtotal">£0.00</strong>
              </div>
            </div>

            <div class="cart-list" id="cart-list"></div>
          </section>

          ${renderBridgePanel(config)}
        </aside>
      </section>
    </main>
  `;
}

function currency(value) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
  }).format(value);
}

function getProduct(productId) {
  return PRODUCTS.find((product) => product.id === productId) ?? null;
}

function loadCart() {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item) =>
        item &&
        typeof item.productId === 'string' &&
        typeof item.quantity === 'number' &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
}

function saveCart() {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function totalUnits() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function subtotal() {
  return cart.reduce((sum, item) => {
    const product = getProduct(item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
}

function snippet(token) {
  if (!token) {
    return 'Not present';
  }

  return `${token.slice(0, 18)}…`;
}

function log(message, type = 'info') {
  const logEl = document.getElementById('log');
  if (!logEl) {
    return;
  }

  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logEl.prepend(entry);
}

function updateStatus() {
  const state = agent ? agent.getState() : null;
  const iit = agent ? agent.getInfluenceIntentToken() : null;
  const pit = agent ? agent.getPurchaseIntentToken() : null;

  document.getElementById('status-iit').textContent = snippet(iit);
  document.getElementById('status-pit').textContent = snippet(pit);
  document.getElementById('status-count').textContent = String(totalUnits());
  document.getElementById('status-cart-state').textContent = state ? state.cartState : 'unknown';
  document.getElementById('current-url').textContent = window.location.href;
  document.getElementById('summary-lines').textContent = String(cart.length);
  document.getElementById('summary-units').textContent = String(totalUnits());
  document.getElementById('summary-subtotal').textContent = currency(subtotal());
}

function renderCatalog() {
  const catalog = document.getElementById('catalog');
  if (!catalog) {
    return;
  }

  catalog.innerHTML = PRODUCTS.map(
    (product) => `
      <article class="product-card">
        <div>
          <p class="product-price">${currency(product.price)}</p>
          <h3>${escapeHtml(product.name)}</h3>
          <p class="product-copy">${escapeHtml(product.description)}</p>
        </div>
        <button class="btn btn-primary" type="button" data-add-product="${product.id}">
          Add to cart
        </button>
      </article>
    `,
  ).join('');
}

function renderCart() {
  const list = document.getElementById('cart-list');
  if (!list) {
    return;
  }

  if (cart.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <p>Your cart is empty.</p>
        <span>Add a product to trigger the agent against a non-empty cart.</span>
      </div>
    `;
    updateStatus();
    return;
  }

  list.innerHTML = cart
    .map((line) => {
      const product = getProduct(line.productId);
      if (!product) {
        return '';
      }

      return `
        <article class="cart-line">
          <div>
            <p class="cart-line-title">${escapeHtml(product.name)}</p>
            <p class="cart-line-meta">${currency(product.price)} each</p>
          </div>
          <div class="quantity-controls">
            <button class="qty-btn" type="button" data-decrement-product="${product.id}">−</button>
            <span>${line.quantity}</span>
            <button class="qty-btn" type="button" data-increment-product="${product.id}">+</button>
          </div>
        </article>
      `;
    })
    .join('');

  updateStatus();
}

function generateRandomToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = 'iit_';

  for (let index = 0; index < 16; index += 1) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return token;
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();

    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}

function syncAgentCart(previousCount, itemCount) {
  if (!agent) {
    return;
  }

  agent.handleCartChange({
    previousCount,
    itemCount,
  });
}

function addProduct(productId) {
  if (!agent) {
    log('Agent not loaded', 'error');
    return;
  }

  const product = getProduct(productId);
  if (!product) {
    return;
  }

  const previousCount = totalUnits();
  const existing = cart.find((item) => item.productId === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ productId, quantity: 1 });
  }

  saveCart();
  renderCart();
  syncAgentCart(previousCount, totalUnits());
  log(`Added ${product.name}. Units: ${totalUnits()}`, 'success');
}

function decrementProduct(productId) {
  if (!agent) {
    log('Agent not loaded', 'error');
    return;
  }

  const product = getProduct(productId);
  const previousCount = totalUnits();
  const existing = cart.find((item) => item.productId === productId);

  if (!product || !existing) {
    return;
  }

  existing.quantity -= 1;
  if (existing.quantity <= 0) {
    cart = cart.filter((item) => item.productId !== productId);
  }

  saveCart();
  renderCart();
  syncAgentCart(previousCount, totalUnits());
  log(`Removed ${product.name}. Units: ${totalUnits()}`, 'info');
}

function emptyCart() {
  if (!agent) {
    log('Agent not loaded', 'error');
    return;
  }

  if (totalUnits() === 0) {
    return;
  }

  cart = [];
  saveCart();
  renderCart();
  agent.handleCartEmpty();
  log('Cart emptied with handleCartEmpty()', 'warning');
}

function restoreCartState() {
  if (!agent) {
    return;
  }

  const units = totalUnits();
  if (units === 0) {
    return;
  }

  syncAgentCart(0, units);
  log(`Restored ${units} cart unit${units === 1 ? '' : 's'} from localStorage`, 'info');
}

function bindUi() {
  document.getElementById('set-intent-button')?.addEventListener('click', () => {
    const url = new URL(window.location.href);
    url.searchParams.set('qdx_intent', generateRandomToken());
    window.location.href = url.toString();
  });

  document.getElementById('reload-button')?.addEventListener('click', () => {
    window.location.reload();
  });

  document.getElementById('empty-cart-button')?.addEventListener('click', () => {
    emptyCart();
  });

  document.querySelector('[data-copy-install]')?.addEventListener('click', () => {
    void copyText(PAGE_CONFIG.cdn.installCommand);
  });

  document.body.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const addProductId =
      target.getAttribute('data-add-product') || target.getAttribute('data-increment-product');
    if (addProductId) {
      addProduct(addProductId);
      return;
    }

    const decrementProductId = target.getAttribute('data-decrement-product');
    if (decrementProductId) {
      decrementProduct(decrementProductId);
    }
  });
}

function renderFailure(error) {
  document.body.innerHTML = `
    <main class="shell">
      <section class="panel">
        <div class="panel-header">
          <div>
            <p class="panel-label">Example error</p>
            <h2>Example failed to load</h2>
          </div>
        </div>
        <p class="bridge-copy">This page expects the generated development IIFE bundle.</p>
        <div class="state-box">
          <p class="state-title">Run this</p>
          <code>npm run example</code>
        </div>
        <div class="state-box">
          <p class="state-title">Open this URL</p>
          <code>${escapeHtml(window.location.href)}</code>
        </div>
        <div class="state-box">
          <p class="state-title">Error</p>
          <code>${escapeHtml(String(error))}</code>
        </div>
      </section>
    </main>
  `;
}

async function main() {
  const config = PAGE_CONFIG.cdn;
  document.title = config.documentTitle;
  document.body.innerHTML = renderShell(config, 'cdn');

  try {
    agent = window.QredexAgent;
    if (!agent) {
      throw new Error('Generated IIFE bundle not loaded');
    }

    agent.onLocked(({ purchaseToken, alreadyLocked }) => {
      log(`Locked PIT ${purchaseToken.substring(0, 18)}…`, alreadyLocked ? 'info' : 'success');
      updateStatus();
    });

    agent.onCleared(() => {
      log('Agent cleared attribution state', 'warning');
      updateStatus();
    });

    agent.onError(({ error, context }) => {
      log(`${context ?? 'agent'}: ${error}`, 'error');
    });

    renderCatalog();
    renderCart();
    bindUi();
    restoreCartState();
    updateStatus();

    if (!agent.hasInfluenceIntentToken() && !agent.hasPurchaseIntentToken()) {
      log('No IIT or PIT present. Set a random IIT before first add-to-cart.', 'warning');
    }

    log('Example ready. Cart persists across refresh.', 'success');
  } catch (error) {
    renderFailure(error);
  }
}

main().catch((error) => {
  renderFailure(error);
});
