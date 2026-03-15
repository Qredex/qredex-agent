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
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useQredexAgent } from '@qredex/vue';
import {
  EXAMPLE_LINKS,
  PRODUCTS,
  WRAPPER_PAGE_CONFIG,
  copyText,
  createEmptySnapshot,
  createExampleHarness,
  formatCurrency,
  getExampleLinkClass,
  snippetToken,
  type ExampleHarness,
} from '../../shared/wrapper-example';

const activeKind = 'vue' as const;
const config = WRAPPER_PAGE_CONFIG.vue;
const { agent, state } = useQredexAgent();
const snapshot = ref(createEmptySnapshot());

let harness: ExampleHarness | null = null;
let unsubscribe: (() => void) | null = null;

onMounted(() => {
  harness = createExampleHarness(agent, config);
  unsubscribe = harness.subscribe((nextSnapshot) => {
    snapshot.value = nextSnapshot;
  });
  harness.start();
});

onUnmounted(() => {
  unsubscribe?.();
  harness?.destroy();
  unsubscribe = null;
  harness = null;
});

function addProduct(productId: string) {
  harness?.addProduct(productId);
}

function decrementProduct(productId: string) {
  harness?.decrementProduct(productId);
}

function emptyCart() {
  harness?.emptyCart();
}

function setRandomIntent() {
  harness?.setRandomIntent();
}

function reloadPage() {
  harness?.reloadPage();
}

function copyInstallCommand() {
  void copyText(config.installCommand);
}
</script>

<template>
  <main class="shell">
    <nav class="example-nav">
      <a class="example-home-link" href="/examples/index.html">Examples</a>
      <div class="example-link-row">
        <a
          v-for="link in EXAMPLE_LINKS"
          :key="link.kind"
          :class="getExampleLinkClass(link.kind, activeKind)"
          :href="link.href"
        >
          {{ link.label }}
        </a>
      </div>
    </nav>

    <section class="hero">
      <div>
        <p class="eyebrow">{{ config.eyebrow }}</p>
        <h1>{{ config.title }}</h1>
        <p class="hero-copy">{{ config.heroCopy }}</p>
        <div class="hero-notes">
          <span v-for="note in config.heroNotes" :key="note">{{ note }}</span>
        </div>
      </div>
      <div class="hero-actions">
        <button class="btn btn-primary" id="set-intent-button" type="button" @click="setRandomIntent">
          Set Random IIT
        </button>
        <button class="btn btn-secondary" id="reload-button" type="button" @click="reloadPage">
          Refresh Page
        </button>
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
          <div class="catalog">
            <article v-for="product in PRODUCTS" :key="product.id" class="product-card">
              <div>
                <p class="product-price">{{ formatCurrency(product.price) }}</p>
                <h3>{{ product.name }}</h3>
                <p class="product-copy">{{ product.description }}</p>
              </div>
              <button
                class="btn btn-primary"
                :data-add-product="product.id"
                type="button"
                @click="addProduct(product.id)"
              >
                Add to cart
              </button>
            </article>
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <p class="panel-label">Agent Runtime</p>
              <h2>Current session</h2>
            </div>
            <span class="badge">Real Vue app</span>
          </div>

          <div class="status-grid">
            <article class="metric">
              <span class="metric-label">IIT</span>
              <strong class="metric-value" id="status-iit">{{ snippetToken(state.iit) }}</strong>
            </article>
            <article class="metric">
              <span class="metric-label">PIT</span>
              <strong class="metric-value" id="status-pit">{{ snippetToken(state.pit) }}</strong>
            </article>
            <article class="metric">
              <span class="metric-label">Cart items</span>
              <strong class="metric-value" id="status-count">{{ snapshot.unitCount }}</strong>
            </article>
            <article class="metric">
              <span class="metric-label">Cart state</span>
              <strong class="metric-value" id="status-cart-state">{{ state.cartState }}</strong>
            </article>
          </div>

          <details class="runtime-details">
            <summary class="runtime-summary">
              <span>Session details</span>
              <span>URL + wrapper note</span>
            </summary>
            <div class="state-box">
              <p class="state-title">Visible URL</p>
              <code id="current-url">{{ snapshot.currentUrl }}</code>
            </div>

            <div class="state-box">
              <p class="state-title">Live harness note</p>
              <p id="persistence-note">{{ config.runtimeNote }}</p>
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
          <div class="log" id="log">
            <div v-for="entry in snapshot.logs" :key="entry.id" :class="`log-entry log-${entry.level}`">
              [{{ entry.time }}] {{ entry.message }}
            </div>
          </div>
        </section>
      </div>

      <aside class="side-stack">
        <section class="panel cart-panel">
          <div class="panel-header">
            <div>
              <p class="panel-label">Cart</p>
              <h2>Persistent cart</h2>
            </div>
            <button class="btn btn-danger" id="empty-cart-button" type="button" @click="emptyCart">
              Empty cart
            </button>
          </div>

          <div class="cart-summary">
            <div>
              <span class="summary-label">Lines</span>
              <strong id="summary-lines">{{ snapshot.lineCount }}</strong>
            </div>
            <div>
              <span class="summary-label">Units</span>
              <strong id="summary-units">{{ snapshot.unitCount }}</strong>
            </div>
            <div>
              <span class="summary-label">Subtotal</span>
              <strong id="summary-subtotal">{{ formatCurrency(snapshot.subtotal) }}</strong>
            </div>
          </div>

          <div class="cart-list" id="cart-list">
            <div v-if="snapshot.lines.length === 0" class="empty-state">
              <p>Your cart is empty.</p>
              <span>Add a product to trigger the agent against a non-empty cart.</span>
            </div>
            <template v-else>
              <article v-for="line in snapshot.lines" :key="line.product.id" class="cart-line">
                <div>
                  <p class="cart-line-title">{{ line.product.name }}</p>
                  <p class="cart-line-meta">{{ formatCurrency(line.product.price) }} each</p>
                </div>
                <div class="quantity-controls">
                  <button
                    class="qty-btn"
                    :data-decrement-product="line.product.id"
                    type="button"
                    @click="decrementProduct(line.product.id)"
                  >
                    −
                  </button>
                  <span>{{ line.quantity }}</span>
                  <button
                    class="qty-btn"
                    :data-increment-product="line.product.id"
                    type="button"
                    @click="addProduct(line.product.id)"
                  >
                    +
                  </button>
                </div>
              </article>
            </template>
          </div>
        </section>

        <section class="panel panel-soft bridge-panel">
          <div class="panel-header">
            <div>
              <p class="panel-label">{{ config.bridgeLabel }}</p>
              <h2>{{ config.bridgeTitle }}</h2>
            </div>
            <span class="badge">{{ config.badge }}</span>
          </div>
          <p class="bridge-copy">{{ config.bridgeCopy }}</p>
          <div class="state-box bridge-meta">
            <p class="state-title">Install</p>
            <div class="install-command-row">
              <code class="install-command">{{ config.installCommand }}</code>
              <button
                aria-label="Copy install command"
                class="copy-install-button"
                title="Copy install command"
                type="button"
                @click="copyInstallCommand"
              >
                ⧉
              </button>
            </div>
          </div>
          <details class="bridge-details">
            <summary class="bridge-summary">
              <span>Bridge code example</span>
              <span>{{ config.codeLanguage.toUpperCase() }}</span>
            </summary>
            <div class="code-card">
              <div class="code-card-header">
                <span>{{ config.codeLanguage.toUpperCase() }}</span>
              </div>
              <pre class="code-block"><code>{{ config.codeSample }}</code></pre>
            </div>
          </details>
        </section>
      </aside>
    </section>
  </main>
</template>
