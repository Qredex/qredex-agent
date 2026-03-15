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
 *  Licensed under the Apache License, Version 2.0. See LICENSE for the full license text.
 *  You may not use this file except in compliance with that License.
 *  Unless required by applicable law or agreed to in writing, software distributed under the
 *  License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 *  either express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 *
 *  If you need additional information or have any questions, please email: copyright@qredex.com
 */

import '@angular/compiler';
import 'zone.js';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { injectQredexAgent, provideQredexAgent } from '@qredex/angular';
import {
  EXAMPLE_AGENT_CONFIG,
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
  type ExampleSnapshot,
} from '../../shared/wrapper-example';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="shell">
      <nav class="example-nav">
        <a class="example-home-link" href="/examples/index.html">Examples</a>
        <div class="example-link-row">
          <a
            *ngFor="let link of exampleLinks; trackBy: trackByKind"
            [class]="linkClass(link.kind, activeKind)"
            [href]="link.href"
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
            <span *ngFor="let note of config.heroNotes; trackBy: trackByValue">{{ note }}</span>
          </div>
        </div>
        <div class="hero-actions">
          <button class="btn btn-primary" id="set-intent-button" type="button" (click)="setRandomIntent()">
            Set Random IIT
          </button>
          <button class="btn btn-secondary" id="reload-button" type="button" (click)="reloadPage()">
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
              <article *ngFor="let product of products; trackBy: trackByProductId" class="product-card">
                <div>
                  <p class="product-price">{{ formatMoney(product.price) }}</p>
                  <h3>{{ product.name }}</h3>
                  <p class="product-copy">{{ product.description }}</p>
                </div>
                <button
                  class="btn btn-primary"
                  [attr.data-add-product]="product.id"
                  type="button"
                  (click)="addProduct(product.id)"
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
              <span class="badge">Real Angular app</span>
            </div>

            <div class="status-grid">
              <article class="metric">
                <span class="metric-label">IIT</span>
                <strong class="metric-value" id="status-iit">{{ tokenSnippet(state().iit) }}</strong>
              </article>
              <article class="metric">
                <span class="metric-label">PIT</span>
                <strong class="metric-value" id="status-pit">{{ tokenSnippet(state().pit) }}</strong>
              </article>
              <article class="metric">
                <span class="metric-label">Cart items</span>
                <strong class="metric-value" id="status-count">{{ snapshot().unitCount }}</strong>
              </article>
              <article class="metric">
                <span class="metric-label">Cart state</span>
                <strong class="metric-value" id="status-cart-state">{{ state().cartState }}</strong>
              </article>
            </div>

            <details class="runtime-details">
              <summary class="runtime-summary">
                <span>Session details</span>
                <span>URL + wrapper note</span>
              </summary>
              <div class="state-box">
                <p class="state-title">Visible URL</p>
                <code id="current-url">{{ snapshot().currentUrl }}</code>
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
              <div
                *ngFor="let entry of snapshot().logs; trackBy: trackByLogId"
                [class]="'log-entry log-' + entry.level"
              >
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
              <button class="btn btn-danger" id="empty-cart-button" type="button" (click)="emptyCart()">
                Empty cart
              </button>
            </div>

            <div class="cart-summary">
              <div>
                <span class="summary-label">Lines</span>
                <strong id="summary-lines">{{ snapshot().lineCount }}</strong>
              </div>
              <div>
                <span class="summary-label">Units</span>
                <strong id="summary-units">{{ snapshot().unitCount }}</strong>
              </div>
              <div>
                <span class="summary-label">Subtotal</span>
                <strong id="summary-subtotal">{{ formatMoney(snapshot().subtotal) }}</strong>
              </div>
            </div>

            <div class="cart-list" id="cart-list">
              <div *ngIf="snapshot().lines.length === 0; else cartLines" class="empty-state">
                <p>Your cart is empty.</p>
                <span>Add a product to trigger the agent against a non-empty cart.</span>
              </div>

              <ng-template #cartLines>
                <article *ngFor="let line of snapshot().lines; trackBy: trackByLineId" class="cart-line">
                  <div>
                    <p class="cart-line-title">{{ line.product.name }}</p>
                    <p class="cart-line-meta">{{ formatMoney(line.product.price) }} each</p>
                  </div>
                  <div class="quantity-controls">
                    <button
                      class="qty-btn"
                      [attr.data-decrement-product]="line.product.id"
                      type="button"
                      (click)="decrementProduct(line.product.id)"
                    >
                      −
                    </button>
                    <span>{{ line.quantity }}</span>
                    <button
                      class="qty-btn"
                      [attr.data-increment-product]="line.product.id"
                      type="button"
                      (click)="addProduct(line.product.id)"
                    >
                      +
                    </button>
                  </div>
                </article>
              </ng-template>
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
                  (click)="copyInstallCommand()"
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
  `,
})
class AppComponent implements OnInit, OnDestroy {
  readonly activeKind = 'angular' as const;
  readonly config = WRAPPER_PAGE_CONFIG.angular;
  readonly exampleLinks = EXAMPLE_LINKS;
  readonly products = PRODUCTS;
  private readonly agent = injectQredexAgent();
  readonly state = signal(this.agent.getState());
  readonly snapshot = signal<ExampleSnapshot>(createEmptySnapshot());
  readonly linkClass = getExampleLinkClass;
  readonly formatMoney = formatCurrency;
  readonly tokenSnippet = snippetToken;

  private harness: ExampleHarness | null = null;
  private unsubscribe: (() => void) | null = null;
  private readonly handleStateChanged = () => {
    this.state.set(this.agent.getState());
  };

  ngOnInit(): void {
    this.agent.onStateChanged(this.handleStateChanged);
    this.handleStateChanged();

    this.harness = createExampleHarness(this.agent, this.config);
    this.unsubscribe = this.harness.subscribe((nextSnapshot) => {
      this.snapshot.set(nextSnapshot);
    });
    this.harness.start();
  }

  ngOnDestroy(): void {
    this.agent.offStateChanged(this.handleStateChanged);
    this.unsubscribe?.();
    this.harness?.destroy();
    this.unsubscribe = null;
    this.harness = null;
  }

  addProduct(productId: string): void {
    this.harness?.addProduct(productId);
  }

  decrementProduct(productId: string): void {
    this.harness?.decrementProduct(productId);
  }

  emptyCart(): void {
    this.harness?.emptyCart();
  }

  setRandomIntent(): void {
    this.harness?.setRandomIntent();
  }

  reloadPage(): void {
    this.harness?.reloadPage();
  }

  copyInstallCommand(): void {
    void copyText(this.config.installCommand);
  }

  trackByKind(_: number, item: { kind: string }): string {
    return item.kind;
  }

  trackByValue(_: number, value: string): string {
    return value;
  }

  trackByProductId(_: number, item: { id: string }): string {
    return item.id;
  }

  trackByLineId(_: number, item: { product: { id: string } }): string {
    return item.product.id;
  }

  trackByLogId(_: number, item: { id: number }): number {
    return item.id;
  }
}

bootstrapApplication(AppComponent, {
  providers: [provideQredexAgent(EXAMPLE_AGENT_CONFIG)],
}).catch((error) => {
  console.error(error);
});
