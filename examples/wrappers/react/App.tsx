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

import { useEffect, useRef, useState } from 'react';
import { useQredexAgent } from '@qredex/react';
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

const activeKind = 'react' as const;
const config = WRAPPER_PAGE_CONFIG.react;

export function App() {
  const { agent, state } = useQredexAgent(EXAMPLE_AGENT_CONFIG);
  const harnessRef = useRef<ExampleHarness | null>(null);
  const [snapshot, setSnapshot] = useState<ExampleSnapshot>(createEmptySnapshot());

  useEffect(() => {
    const harness = createExampleHarness(agent, config);
    harnessRef.current = harness;

    const unsubscribe = harness.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    harness.start();

    return () => {
      unsubscribe();
      harness.destroy();
      harnessRef.current = null;
    };
  }, [agent]);

  return (
    <main className="shell">
      <nav className="example-nav">
        <a className="example-home-link" href="/examples/index.html">
          Examples
        </a>
        <div className="example-link-row">
          {EXAMPLE_LINKS.map((link) => (
            <a
              key={link.kind}
              className={getExampleLinkClass(link.kind, activeKind)}
              href={link.href}
            >
              {link.label}
            </a>
          ))}
        </div>
      </nav>

      <section className="hero">
        <div>
          <p className="eyebrow">{config.eyebrow}</p>
          <h1>{config.title}</h1>
          <p className="hero-copy">{config.heroCopy}</p>
          <div className="hero-notes">
            {config.heroNotes.map((note) => (
              <span key={note}>{note}</span>
            ))}
          </div>
        </div>
        <div className="hero-actions">
          <button
            className="btn btn-primary"
            id="set-intent-button"
            type="button"
            onClick={() => {
              harnessRef.current?.setRandomIntent();
            }}
          >
            Set Random IIT
          </button>
          <button
            className="btn btn-secondary"
            id="reload-button"
            type="button"
            onClick={() => {
              harnessRef.current?.reloadPage();
            }}
          >
            Refresh Page
          </button>
        </div>
      </section>

      <section className="layout">
        <div className="stack">
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="panel-label">Product Shelf</p>
                <h2>Add test products</h2>
              </div>
            </div>
            <div className="catalog">
              {PRODUCTS.map((product) => (
                <article className="product-card" key={product.id}>
                  <div>
                    <p className="product-price">{formatCurrency(product.price)}</p>
                    <h3>{product.name}</h3>
                    <p className="product-copy">{product.description}</p>
                  </div>
                  <button
                    className="btn btn-primary"
                    data-add-product={product.id}
                    type="button"
                    onClick={() => {
                      harnessRef.current?.addProduct(product.id);
                    }}
                  >
                    Add to cart
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="panel-label">Agent Runtime</p>
                <h2>Current session</h2>
              </div>
              <span className="badge">Real React app</span>
            </div>

            <div className="status-grid">
              <article className="metric">
                <span className="metric-label">IIT</span>
                <strong className="metric-value" id="status-iit">
                  {snippetToken(state.iit)}
                </strong>
              </article>
              <article className="metric">
                <span className="metric-label">PIT</span>
                <strong className="metric-value" id="status-pit">
                  {snippetToken(state.pit)}
                </strong>
              </article>
              <article className="metric">
                <span className="metric-label">Cart items</span>
                <strong className="metric-value" id="status-count">
                  {snapshot.unitCount}
                </strong>
              </article>
              <article className="metric">
                <span className="metric-label">Cart state</span>
                <strong className="metric-value" id="status-cart-state">
                  {state.cartState}
                </strong>
              </article>
            </div>

            <details className="runtime-details">
              <summary className="runtime-summary">
                <span>Session details</span>
                <span>URL + wrapper note</span>
              </summary>
              <div className="state-box">
                <p className="state-title">Visible URL</p>
                <code id="current-url">{snapshot.currentUrl}</code>
              </div>

              <div className="state-box">
                <p className="state-title">Live harness note</p>
                <p id="persistence-note">{config.runtimeNote}</p>
              </div>
            </details>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="panel-label">Event feed</p>
                <h2>Agent and cart activity</h2>
              </div>
            </div>
            <div className="log" id="log">
              {snapshot.logs.map((entry) => (
                <div className={`log-entry log-${entry.level}`} key={entry.id}>
                  [{entry.time}] {entry.message}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="side-stack">
          <section className="panel cart-panel">
            <div className="panel-header">
              <div>
                <p className="panel-label">Cart</p>
                <h2>Persistent cart</h2>
              </div>
              <button
                className="btn btn-danger"
                id="empty-cart-button"
                type="button"
                onClick={() => {
                  harnessRef.current?.emptyCart();
                }}
              >
                Empty cart
              </button>
            </div>

            <div className="cart-summary">
              <div>
                <span className="summary-label">Lines</span>
                <strong id="summary-lines">{snapshot.lineCount}</strong>
              </div>
              <div>
                <span className="summary-label">Units</span>
                <strong id="summary-units">{snapshot.unitCount}</strong>
              </div>
              <div>
                <span className="summary-label">Subtotal</span>
                <strong id="summary-subtotal">{formatCurrency(snapshot.subtotal)}</strong>
              </div>
            </div>

            <div className="cart-list" id="cart-list">
              {snapshot.lines.length === 0 ? (
                <div className="empty-state">
                  <p>Your cart is empty.</p>
                  <span>Add a product to trigger the agent against a non-empty cart.</span>
                </div>
              ) : (
                snapshot.lines.map((line) => (
                  <article className="cart-line" key={line.product.id}>
                    <div>
                      <p className="cart-line-title">{line.product.name}</p>
                      <p className="cart-line-meta">{formatCurrency(line.product.price)} each</p>
                    </div>
                    <div className="quantity-controls">
                      <button
                        className="qty-btn"
                        data-decrement-product={line.product.id}
                        type="button"
                        onClick={() => {
                          harnessRef.current?.decrementProduct(line.product.id);
                        }}
                      >
                        −
                      </button>
                      <span>{line.quantity}</span>
                      <button
                        className="qty-btn"
                        data-increment-product={line.product.id}
                        type="button"
                        onClick={() => {
                          harnessRef.current?.addProduct(line.product.id);
                        }}
                      >
                        +
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="panel panel-soft bridge-panel">
            <div className="panel-header">
              <div>
                <p className="panel-label">{config.bridgeLabel}</p>
                <h2>{config.bridgeTitle}</h2>
              </div>
              <span className="badge">{config.badge}</span>
            </div>
            <p className="bridge-copy">{config.bridgeCopy}</p>
            <div className="state-box bridge-meta">
              <p className="state-title">Install</p>
              <div className="install-command-row">
                <code className="install-command">{config.installCommand}</code>
                <button
                  aria-label="Copy install command"
                  className="copy-install-button"
                  title="Copy install command"
                  type="button"
                  onClick={() => {
                    void copyText(config.installCommand);
                  }}
                >
                  ⧉
                </button>
              </div>
            </div>
            <details className="bridge-details">
              <summary className="bridge-summary">
                <span>Bridge code example</span>
                <span>{config.codeLanguage.toUpperCase()}</span>
              </summary>
              <div className="code-card">
                <div className="code-card-header">
                  <span>{config.codeLanguage.toUpperCase()}</span>
                </div>
                <pre className="code-block">
                  <code>{config.codeSample}</code>
                </pre>
              </div>
            </details>
          </section>
        </aside>
      </section>
    </main>
  );
}
