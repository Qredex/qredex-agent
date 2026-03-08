/**
 * Qredex Agent - Basic Example Application
 *
 * This demonstrates the Qredex Agent integration with a visual testing UI.
 */

import {
  init,
  getIntentToken,
  getPurchaseIntentToken,
  hasIntentToken,
  hasPurchaseIntentToken,
  handleAddToCart,
  lockIntent,
  isInitialized,
  getStatus,
  onAddToCart,
} from '../../src/index.ts';

// ============================================
// INITIALIZATION
// ============================================

// Make available globally for console access
window.QredexAgent = {
  init,
  getIntentToken,
  getPurchaseIntentToken,
  hasIntentToken,
  hasPurchaseIntentToken,
  handleAddToCart,
  lockIntent,
  isInitialized,
  getStatus,
  onAddToCart,
};

// Initialize with debug mode
init({ debug: true });

// Log add-to-cart events
onAddToCart((event) => {
  log(`Add-to-cart detected: ${event.source}`, 'info');
  if (event.meta.productId) {
    log(`  Product: ${event.meta.productId}`, 'info');
  }
});

// ============================================
// GLOBAL FUNCTIONS (for HTML onclick handlers)
// ============================================

window.addToCart = () => {
  const quantity = parseInt(document.getElementById('quantity').value, 10) || 1;
  handleAddToCart({
    productId: 'widget-001',
    productName: 'Premium Widget',
    quantity,
    price: 99.99,
  });
  log('Add-to-cart triggered manually', 'success');
};

window.manualAddToCart = () => {
  handleAddToCart({
    productId: 'manual-trigger',
    productName: 'Manual Trigger Test',
    quantity: 1,
  });
  log('Manual add-to-cart triggered', 'success');
};

window.manualLock = async () => {
  log('Locking intent...', 'info');
  const result = await lockIntent();
  if (result.success) {
    log(`Intent locked! PIT: ${result.purchaseToken}`, 'success');
    refreshTokens();
  } else {
    log(`Lock failed: ${result.error}`, 'error');
  }
};

window.simulateIntent = () => {
  const token = document.getElementById('intent-input').value.trim();
  if (!token) {
    log('Please enter an intent token', 'error');
    return;
  }

  const newUrl = `${window.location.pathname}?qdx_intent=${encodeURIComponent(token)}`;
  window.history.pushState({}, '', newUrl);
  log(`Simulated URL with intent token. Reload to capture.`, 'info');

  // Auto-reload after a short delay
  setTimeout(() => {
    window.location.reload();
  }, 500);
};

window.refreshTokens = () => {
  updateStatus();
  log('Tokens refreshed', 'info');
};

window.clearTokens = () => {
  sessionStorage.clear();
  document.cookie.split(';').forEach((c) => {
    document.cookie = c
      .replace(/^ +/, '')
      .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
  });
  log('All tokens cleared', 'success');
  updateStatus();
};

window.clearLog = () => {
  document.getElementById('log-output').innerHTML = '';
};

// ============================================
// UI FUNCTIONS
// ============================================

function updateStatus() {
  const status = getStatus();
  const iit = getIntentToken();
  const pit = getPurchaseIntentToken();

  document.getElementById('status-initialized').textContent =
    `Initialized: ${status.initialized ? 'Yes' : 'No'}`;
  document.getElementById('status-initialized').className =
    `status-item ${status.initialized ? 'success' : 'error'}`;

  const iitEl = document.getElementById('status-iit');
  if (iit) {
    iitEl.textContent = `IIT: ${iit.substring(0, 20)}...`;
    iitEl.className = 'status-item success';
    document.getElementById('iit-display').textContent = iit;
    document.getElementById('iit-display').classList.remove('empty');
  } else {
    iitEl.textContent = 'IIT: Not found';
    iitEl.className = 'status-item';
    document.getElementById('iit-display').textContent = 'No intent token found';
    document.getElementById('iit-display').classList.add('empty');
  }

  const pitEl = document.getElementById('status-pit');
  if (pit) {
    pitEl.textContent = `PIT: ${pit.substring(0, 20)}...`;
    pitEl.className = 'status-item success';
    document.getElementById('pit-display').textContent = pit;
    document.getElementById('pit-display').classList.remove('empty');
  } else {
    pitEl.textContent = 'PIT: Not found';
    pitEl.className = 'status-item';
    document.getElementById('pit-display').textContent = 'No purchase token found';
    document.getElementById('pit-display').classList.add('empty');
  }
}

function log(message, type = 'info') {
  const logOutput = document.getElementById('log-output');
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  const time = new Date().toLocaleTimeString();
  entry.textContent = `[${time}] ${message}`;
  logOutput.appendChild(entry);
  logOutput.scrollTop = logOutput.scrollHeight;
}

// ============================================
// START
// ============================================

// Initial status update
updateStatus();
log('Qredex Agent demo initialized', 'success');
