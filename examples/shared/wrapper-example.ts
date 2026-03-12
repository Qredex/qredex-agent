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

export const EXAMPLE_AGENT_CONFIG = {
  debug: false,
  useMockEndpoint: true,
} as const;

export type ExampleKind = 'react' | 'vue' | 'svelte' | 'angular';
export type ExampleLogLevel = 'success' | 'info' | 'warning' | 'error';

export interface ExampleLink {
  kind: 'cdn' | ExampleKind;
  label: string;
  href: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface ExampleLogEntry {
  id: number;
  level: ExampleLogLevel;
  message: string;
  time: string;
}

export interface ExampleCartLine {
  product: Product;
  quantity: number;
  lineTotal: number;
}

export interface ExampleSnapshot {
  lines: ExampleCartLine[];
  lineCount: number;
  unitCount: number;
  subtotal: number;
  logs: ExampleLogEntry[];
  currentUrl: string;
}

export interface WrapperPageConfig {
  documentTitle: string;
  eyebrow: string;
  title: string;
  heroCopy: string;
  heroNotes: string[];
  badge: string;
  bridgeLabel: string;
  bridgeTitle: string;
  bridgeCopy: string;
  installCommand: string;
  codeLanguage: string;
  codeSample: string;
  runtimeNote: string;
  readyLabel: string;
}

interface StoredCartLine {
  productId: string;
  quantity: number;
}

interface LockedEvent {
  purchaseToken: string;
  alreadyLocked: boolean;
}

interface ErrorEvent {
  error: string;
  context?: string;
}

interface AgentLike {
  handleCartChange(event: { previousCount: number; itemCount: number }): void;
  handleCartEmpty(): void;
  hasInfluenceIntentToken(): boolean;
  hasPurchaseIntentToken(): boolean;
  onIntentCaptured(handler: () => void): void;
  offIntentCaptured(handler: () => void): void;
  onLocked(handler: (event: LockedEvent) => void): void;
  offLocked(handler: (event: LockedEvent) => void): void;
  onCleared(handler: () => void): void;
  offCleared(handler: () => void): void;
  onError(handler: (event: ErrorEvent) => void): void;
  offError(handler: (event: ErrorEvent) => void): void;
}

type ExampleListener = (snapshot: ExampleSnapshot) => void;

export interface ExampleHarness {
  getSnapshot(): ExampleSnapshot;
  subscribe(listener: ExampleListener): () => void;
  start(): void;
  destroy(): void;
  addProduct(productId: string): void;
  decrementProduct(productId: string): void;
  emptyCart(): void;
  setRandomIntent(): void;
  reloadPage(): void;
}

export const EXAMPLE_LINKS: ExampleLink[] = [
  { kind: 'cdn', label: 'CDN', href: '/examples/cdn/' },
  { kind: 'react', label: 'React', href: '/examples/wrappers/react/' },
  { kind: 'vue', label: 'Vue', href: '/examples/wrappers/vue/' },
  { kind: 'svelte', label: 'Svelte', href: '/examples/wrappers/svelte/' },
  { kind: 'angular', label: 'Angular', href: '/examples/wrappers/angular/' },
];

export const PRODUCTS: Product[] = [
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

export const WRAPPER_PAGE_CONFIG: Record<ExampleKind, WrapperPageConfig> = {
  react: {
    documentTitle: 'Qredex React Example',
    eyebrow: '@qredex/react',
    title: 'React cart bridge example',
    heroCopy:
      'A real React app using useQredexAgent() with a persistent cart, agent state panel, and live event feed.',
    heroNotes: ['Real React app', 'useQredexAgent()', 'Programmatic config'],
    badge: '@qredex/react',
    bridgeLabel: 'Recommended bridge',
    bridgeTitle: 'Use the React wrapper inside the cart surface you already own',
    bridgeCopy:
      'The hook keeps React state subscriptions tidy while the core agent still owns capture, lock, retry, and clear behavior.',
    installCommand: 'npm install @qredex/react',
    codeLanguage: 'tsx',
    codeSample: [
      "import { useEffect, useRef } from 'react';",
      "import { useQredexAgent } from '@qredex/react';",
      '',
      'export function QredexCartBridge({ itemCount }: { itemCount: number }) {',
      '  const { agent, state } = useQredexAgent({',
      '    debug: false,',
      '    useMockEndpoint: true,',
      '  });',
      '  const previousCountRef = useRef(itemCount);',
      '',
      '  useEffect(() => {',
      '    agent.handleCartChange({',
      '      itemCount,',
      '      previousCount: previousCountRef.current,',
      '    });',
      '',
      '    previousCountRef.current = itemCount;',
      '  }, [agent, itemCount]);',
      '',
      '  async function clearCart() {',
      "    await fetch('/api/cart/clear', { method: 'POST' });",
      '    agent.handleCartEmpty();',
      '  }',
      '',
      '  async function submitOrder() {',
      '    const pit = state.pit ?? agent.getPurchaseIntentToken();',
      '',
      "    await fetch('/api/orders', {",
      "      method: 'POST',",
      "      headers: { 'Content-Type': 'application/json' },",
      '      body: JSON.stringify({ pit }),',
      '    });',
      '  }',
      '}',
    ].join('\n'),
    runtimeNote:
      'This page imports @qredex/react through Vite, initializes with programmatic config, and drives the cart through React state.',
    readyLabel: 'React example',
  },
  vue: {
    documentTitle: 'Qredex Vue Example',
    eyebrow: '@qredex/vue',
    title: 'Vue cart bridge example',
    heroCopy:
      'A real Vue app using createQredexPlugin() and useQredexAgent() with the same persistent cart and attribution flow.',
    heroNotes: ['Real Vue app', 'createQredexPlugin()', 'useQredexAgent()'],
    badge: '@qredex/vue',
    bridgeLabel: 'Recommended bridge',
    bridgeTitle: 'Register once, then report cart state from your Vue cart',
    bridgeCopy:
      'The plugin handles setup once, and the composable keeps the live agent and current attribution state available inside the cart component.',
    installCommand: 'npm install @qredex/vue',
    codeLanguage: 'vue',
    codeSample: [
      "import { createApp } from 'vue';",
      "import App from './App.vue';",
      "import { createQredexPlugin } from '@qredex/vue';",
      '',
      'const app = createApp(App);',
      'app.use(createQredexPlugin({',
      '  debug: false,',
      '  useMockEndpoint: true,',
      '}));',
      "app.mount('#app');",
      '',
      '<script setup lang="ts">',
      "import { ref, watch } from 'vue';",
      "import { useQredexAgent } from '@qredex/vue';",
      '',
      'const { agent, state } = useQredexAgent();',
      'const itemCount = ref(0);',
      'const previousCount = ref(0);',
      '',
      'watch(itemCount, (nextCount) => {',
      '  agent.handleCartChange({',
      '    itemCount: nextCount,',
      '    previousCount: previousCount.value,',
      '  });',
      '',
      '  previousCount.value = nextCount;',
      '}, { immediate: true });',
      '',
      'async function clearCart() {',
      "  await fetch('/api/cart/clear', { method: 'POST' });",
      '  agent.handleCartEmpty();',
      '}',
      '</script>',
    ].join('\n'),
    runtimeNote:
      'This page imports @qredex/vue through Vite, installs the plugin once, and runs the live cart through Vue refs and watchers.',
    readyLabel: 'Vue example',
  },
  svelte: {
    documentTitle: 'Qredex Svelte Example',
    eyebrow: '@qredex/svelte',
    title: 'Svelte cart bridge example',
    heroCopy:
      'A real Svelte app using useQredexAgent() with the wrapper store and a persistent cart that survives refresh.',
    heroNotes: ['Real Svelte app', 'useQredexAgent()', 'Readable state store'],
    badge: '@qredex/svelte',
    bridgeLabel: 'Recommended bridge',
    bridgeTitle: 'Use the Svelte wrapper inside the cart component',
    bridgeCopy:
      'The wrapper exposes the agent plus a readable store, so your component can stay small while attribution stays in the shared core runtime.',
    installCommand: 'npm install @qredex/svelte',
    codeLanguage: 'svelte',
    codeSample: [
      '<script lang="ts">',
      "  import { useQredexAgent } from '@qredex/svelte';",
      '',
      '  export let itemCount = 0;',
      '',
      '  const { agent, state: agentStateStore } = useQredexAgent({',
      '    debug: false,',
      '    useMockEndpoint: true,',
      '  });',
      '  let previousCount = itemCount;',
      '',
      '  $: if (itemCount !== previousCount) {',
      '    agent.handleCartChange({',
      '      itemCount,',
      '      previousCount,',
      '    });',
      '',
      '    previousCount = itemCount;',
      '  }',
      '',
      '  async function clearCart() {',
      "    await fetch('/api/cart/clear', { method: 'POST' });",
      '    agent.handleCartEmpty();',
      '  }',
      '</script>',
    ].join('\n'),
    runtimeNote:
      'This page imports @qredex/svelte through Vite and keeps the live agent state connected through the Svelte store returned by useQredexAgent().',
    readyLabel: 'Svelte example',
  },
  angular: {
    documentTitle: 'Qredex Angular Example',
    eyebrow: '@qredex/angular',
    title: 'Angular cart bridge example',
    heroCopy:
      'A real Angular app using provideQredexAgent() at bootstrap and injectQredexAgent() inside the cart component.',
    heroNotes: ['Real Angular app', 'provideQredexAgent()', 'injectQredexAgent()'],
    badge: '@qredex/angular',
    bridgeLabel: 'Recommended bridge',
    bridgeTitle: 'Provide once, then inject inside your Angular cart surface',
    bridgeCopy:
      'Angular keeps initialization at bootstrap and uses injection inside the cart component, while the core agent still owns the attribution lifecycle.',
    installCommand: 'npm install @qredex/angular',
    codeLanguage: 'ts',
    codeSample: [
      "import '@angular/compiler';",
      "import { bootstrapApplication } from '@angular/platform-browser';",
      "import { Component, Input, OnChanges } from '@angular/core';",
      "import { injectQredexAgent, provideQredexAgent } from '@qredex/angular';",
      '',
      'bootstrapApplication(AppComponent, {',
      '  providers: [provideQredexAgent({',
      '    debug: false,',
      '    useMockEndpoint: true,',
      '  })],',
      '});',
      '',
      '@Component({',
      "  selector: 'qredex-cart-bridge',",
      '  standalone: true,',
      "  template: '<button (click)=\"clearCart()\">Clear cart</button>',",
      '})',
      'export class QredexCartBridgeComponent implements OnChanges {',
      '  @Input() itemCount = 0;',
      '',
      '  private previousCount = 0;',
      '  readonly agent = injectQredexAgent();',
      '',
      '  ngOnChanges(): void {',
      '    this.agent.handleCartChange({',
      '      itemCount: this.itemCount,',
      '      previousCount: this.previousCount,',
      '    });',
      '',
      '    this.previousCount = this.itemCount;',
      '  }',
      '',
      '  async clearCart(): Promise<void> {',
      "    await fetch('/api/cart/clear', { method: 'POST' });",
      '    this.agent.handleCartEmpty();',
      '  }',
      '}',
    ].join('\n'),
    runtimeNote:
      'This page imports @qredex/angular through Vite, bootstraps Angular directly in the browser, and drives the cart through injected agent calls.',
    readyLabel: 'Angular example',
  },
};

export function createEmptySnapshot(): ExampleSnapshot {
  return {
    lines: [],
    lineCount: 0,
    unitCount: 0,
    subtotal: 0,
    logs: [],
    currentUrl: '',
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
  }).format(value);
}

export function snippetToken(token: string | null): string {
  if (!token) {
    return 'Not present';
  }

  return `${token.slice(0, 18)}…`;
}

function getProduct(productId: string): Product | null {
  return PRODUCTS.find((product) => product.id === productId) ?? null;
}

function loadStoredCart(): StoredCartLine[] {
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
      (item): item is StoredCartLine =>
        Boolean(item) &&
        typeof item.productId === 'string' &&
        typeof item.quantity === 'number' &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
}

function saveStoredCart(cart: StoredCartLine[]): void {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function getTotalUnits(cart: StoredCartLine[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function toSnapshot(cart: StoredCartLine[], logs: ExampleLogEntry[]): ExampleSnapshot {
  const lines = cart
    .map((line) => {
      const product = getProduct(line.productId);
      if (!product) {
        return null;
      }

      return {
        product,
        quantity: line.quantity,
        lineTotal: product.price * line.quantity,
      };
    })
    .filter((line): line is ExampleCartLine => line !== null);

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const unitCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  return {
    lines,
    lineCount: lines.length,
    unitCount,
    subtotal,
    logs,
    currentUrl: window.location.href,
  };
}

function createRandomIntentToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = 'iit_';

  for (let index = 0; index < 16; index += 1) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return token;
}

export function getExampleLinkClass(linkKind: ExampleLink['kind'], activeKind: ExampleKind): string {
  return linkKind === activeKind ? 'example-link example-link-active' : 'example-link';
}

export function createExampleHarness(agent: AgentLike, config: WrapperPageConfig): ExampleHarness {
  const listeners = new Set<ExampleListener>();
  let cart = loadStoredCart();
  let logs: ExampleLogEntry[] = [];
  let started = false;
  let nextLogId = 0;

  const notify = () => {
    const snapshot = toSnapshot(cart, logs);
    for (const listener of listeners) {
      listener(snapshot);
    }
  };

  const appendLog = (message: string, level: ExampleLogLevel = 'info') => {
    logs = [
      {
        id: nextLogId,
        level,
        message,
        time: new Date().toLocaleTimeString(),
      },
      ...logs,
    ].slice(0, 24);
    nextLogId += 1;
    notify();
  };

  const syncAgentCart = (previousCount: number, itemCount: number) => {
    agent.handleCartChange({
      previousCount,
      itemCount,
    });
    notify();
  };

  const handleIntentCaptured = () => {
    appendLog('IIT captured from the URL for this session.', 'success');
  };

  const handleLocked = ({ purchaseToken, alreadyLocked }: LockedEvent) => {
    appendLog(
      `Locked PIT ${snippetToken(purchaseToken)}`,
      alreadyLocked ? 'info' : 'success',
    );
  };

  const handleCleared = () => {
    appendLog('Agent cleared attribution state.', 'warning');
  };

  const handleError = ({ error, context }: ErrorEvent) => {
    appendLog(`${context ?? 'agent'}: ${error}`, 'error');
  };

  return {
    getSnapshot() {
      return toSnapshot(cart, logs);
    },
    subscribe(listener: ExampleListener) {
      listeners.add(listener);
      listener(toSnapshot(cart, logs));

      return () => {
        listeners.delete(listener);
      };
    },
    start() {
      if (started) {
        return;
      }

      started = true;
      agent.onIntentCaptured(handleIntentCaptured);
      agent.onLocked(handleLocked);
      agent.onCleared(handleCleared);
      agent.onError(handleError);

      const restoredUnits = getTotalUnits(cart);
      if (restoredUnits > 0) {
        syncAgentCart(0, restoredUnits);
        appendLog(
          `Restored ${restoredUnits} cart unit${restoredUnits === 1 ? '' : 's'} from localStorage.`,
          'info',
        );
      }

      if (agent.hasPurchaseIntentToken()) {
        appendLog('PIT already present for this session.', 'info');
      } else if (agent.hasInfluenceIntentToken()) {
        appendLog('IIT is present. Add to cart to lock a PIT.', 'info');
      } else {
        appendLog('No IIT or PIT present. Set a random IIT before first add-to-cart.', 'warning');
      }

      appendLog(`${config.readyLabel} ready. Cart persists across refresh.`, 'success');
      notify();
    },
    destroy() {
      if (!started) {
        return;
      }

      agent.offIntentCaptured(handleIntentCaptured);
      agent.offLocked(handleLocked);
      agent.offCleared(handleCleared);
      agent.offError(handleError);
      started = false;
    },
    addProduct(productId: string) {
      const product = getProduct(productId);
      if (!product) {
        return;
      }

      const previousCount = getTotalUnits(cart);
      const existing = cart.find((item) => item.productId === productId);

      if (existing) {
        existing.quantity += 1;
      } else {
        cart = [...cart, { productId, quantity: 1 }];
      }

      saveStoredCart(cart);
      syncAgentCart(previousCount, getTotalUnits(cart));
      appendLog(`Added ${product.name}. Units: ${getTotalUnits(cart)}`, 'success');
    },
    decrementProduct(productId: string) {
      const product = getProduct(productId);
      const existing = cart.find((item) => item.productId === productId);
      if (!product || !existing) {
        return;
      }

      const previousCount = getTotalUnits(cart);
      const nextCart = cart
        .map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0);

      cart = nextCart;
      saveStoredCart(cart);
      syncAgentCart(previousCount, getTotalUnits(cart));
      appendLog(`Removed ${product.name}. Units: ${getTotalUnits(cart)}`, 'info');
    },
    emptyCart() {
      if (getTotalUnits(cart) === 0) {
        return;
      }

      cart = [];
      saveStoredCart(cart);
      agent.handleCartEmpty();
      appendLog('Cart emptied with handleCartEmpty().', 'warning');
      notify();
    },
    setRandomIntent() {
      const url = new URL(window.location.href);
      url.searchParams.set('qdx_intent', createRandomIntentToken());
      window.location.href = url.toString();
    },
    reloadPage() {
      window.location.reload();
    },
  };
}
