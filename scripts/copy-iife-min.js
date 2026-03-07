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
 *  This is proprietary and confidential. Unauthorized copying, redistributing
 *  and/or modification of this file via any medium is inexorably prohibited.
 *
 *  If you need additional information or have any questions, please email: copyright@qredex.com
 */

/**
 * Post-build script: Copy IIFE bundle to .min.js variant.
 * The IIFE build is already minified by terser, so this is just
 * to provide the expected .min.js filename for CDN versioning.
 */

import { copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '..', 'dist');

try {
  copyFileSync(
    resolve(distDir, 'qredex-agent.iife.js'),
    resolve(distDir, 'qredex-agent.iife.min.js')
  );
  console.log('✓ Copied qredex-agent.iife.js to qredex-agent.iife.min.js');
} catch (err) {
  console.error('Failed to copy IIFE bundle:', err);
  process.exit(1);
}
