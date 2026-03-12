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
const target = process.argv[2] || 'production';

const targetFiles = {
  development: 'qredex-agent.iife.dev.min.js',
  dev: 'qredex-agent.iife.dev.min.js',
  staging: 'qredex-agent.iife.stage.min.js',
  stage: 'qredex-agent.iife.stage.min.js',
  production: 'qredex-agent.iife.min.js',
  prod: 'qredex-agent.iife.min.js',
};

const outputFile = targetFiles[target];

if (!outputFile) {
  console.error(`Unknown bundle target "${target}"`);
  process.exit(1);
}

try {
  copyFileSync(
    resolve(distDir, 'qredex-agent.iife.js'),
    resolve(distDir, outputFile)
  );
  console.log(`✓ Copied qredex-agent.iife.js to ${outputFile}`);
} catch (err) {
  console.error('Failed to copy IIFE bundle:', err);
  process.exit(1);
}
