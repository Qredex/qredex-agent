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

/**
 * Post-build script: Copy IIFE bundle and sourcemap to .min.js variants.
 * The IIFE build is already minified by terser, so this is just to provide
 * the expected filenames for CDN versioning.
 */

import { copyFileSync, existsSync } from 'fs';
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
  const sourceFile = resolve(distDir, 'qredex-agent.iife.js');
  const sourceMapFile = resolve(distDir, 'qredex-agent.iife.js.map');
  const outputPath = resolve(distDir, outputFile);
  const outputMapPath = resolve(distDir, `${outputFile}.map`);

  copyFileSync(sourceFile, outputPath);

  if (existsSync(sourceMapFile)) {
    copyFileSync(sourceMapFile, outputMapPath);
  }

  console.log(`✓ Copied qredex-agent.iife.js to ${outputFile}`);
} catch (err) {
  console.error('Failed to copy IIFE bundle:', err);
  process.exit(1);
}
