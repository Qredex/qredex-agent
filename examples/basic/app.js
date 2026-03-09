/**
 * Qredex Agent - Basic Example Application
 *
 * This demonstrates the Qredex Agent integration with a visual testing UI.
 */

import clearTokens, {
  getIntentToken,
  getPurchaseIntentToken,
  hasInfluenceIntentToken,
  hasPurchaseIntentToken,
  handleCartChange,
  lockIntent,
  onLocked,
  onCleared,
  onError,
} from '../../src/index.js';

// ============================================
// INITIALIZATION
// ============================================

// Make available globally for console access
window.QredexAgent = {
  getIntentToken,
  getPurchaseIntentToken,
  hasInfluenceIntentToken: hasInfluenceIntentToken,
  hasPurchaseIntentToken,
  handleCartChange,
  lockIntent,
  clearTokens,
  onLocked,
  onCleared,
  onError,
};

// Listen for agent events
onLocked((event) => {
  log(`✅ Intent locked! PIT: ${event.purchaseToken.substring(0, 20)}...`, 'success');
  if (event.alreadyLocked) {
    log('  (was already locked)', 'info');
  }
  refreshTokens();
});

onCleared(() => {
  log('🗑️ Tokens cleared', 'info');
  refreshTokens();
});

onError((event) => {
  log(`❌ Error in ${event.context || 'agent'}: ${event.error}`, 'error');
});

// ============================================
// GLOBAL FUNCTIONS (for HTML onclick handlers)
// ============================================

// Cart state tracking
let cartItemCount = 0;

window.addToCart = () => {
  const quantity = parseInt(document.getElementById('quantity').value, 10) || 1;
  const previousCount = cartItemCount;
  cartItemCount += quantity;

  // Tell agent cart state changed (with optional metadata)
  handleCartChange({
    itemCount: cartItemCount,
    previousCount,
    meta: {
      productId: 'widget-001',
      quantity,
      price: 99.99,
    },
  });

  log(`Added ${quantity} item(s) to cart. Total: ${cartItemCount}`, 'success');
};

window.manualAddToCart = () => {
  const previousCount = cartItemCount;
  cartItemCount = 1;

  handleCartChange({
    itemCount: cartItemCount,
    previousCount,
    meta: {
      productId: 'manual-trigger',
      quantity: 1,
    },
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

window.default = () => {
  sessionStorage.clear();
  document.cookie.split(';').forEach((c) => {
    document.cookie = c
      .replace(/^ +/, '')
      .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
  });
  cartItemCount = 0;
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
  const iit = getIntentToken();
  const pit = getPurchaseIntentToken();

  const initializedEl = document.getElementById('status-initialized');
  if (initializedEl) {
    initializedEl.textContent = `Initialized: Yes`;
    initializedEl.className = 'status-item success';
  }

  const iitEl = document.getElementById('status-iit');
  if (iit) {
    iitEl.textContent = `IIT: ${iit.substring(0, 20)}...`;
    iitEl.className = 'status-item success';
    document.getElementById('iit-display').textContent = iit;
    document.getElementById('iit-display').classList.remove('empty');
  } else {
    if (iitEl) {
      iitEl.textContent = 'IIT: Not found';
      iitEl.className = 'status-item';
    }
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
    if (pitEl) {
      pitEl.textContent = 'PIT: Not found';
      pitEl.className = 'status-item';
    }
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
log(`Current cart items: ${cartItemCount}`, 'info');
