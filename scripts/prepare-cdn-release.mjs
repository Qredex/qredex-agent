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
 *  Licensed under the MIT License. See LICENSE for the full license text.
 *  Redistribution and use are permitted under that license.
 *
 *  If you need additional information or have any questions, please email: copyright@qredex.com
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf8'));
const version = packageJson.version;
const majorVersion = version.split('.')[0];
const distDir = resolve(rootDir, 'dist');
const releaseRoot = resolve(rootDir, 'release', 'agent');
const assets = ['qredex-agent.iife.min.js', 'qredex-agent.iife.min.js.map'];

function ensureAsset(file) {
  const path = resolve(distDir, file);

  if (!existsSync(path)) {
    throw new Error(`Missing CDN asset: dist/${file}`);
  }

  return path;
}

function copyAssets(targetDir) {
  mkdirSync(targetDir, { recursive: true });

  for (const file of assets) {
    copyFileSync(ensureAsset(file), resolve(targetDir, file));
  }
}

try {
  copyAssets(resolve(releaseRoot, `v${version}`));
  copyAssets(resolve(releaseRoot, `v${majorVersion}`));

  writeFileSync(
    resolve(releaseRoot, 'manifest.json'),
    JSON.stringify(
      {
        version,
        major: `v${majorVersion}`,
        files: assets,
      },
      null,
      2
    )
  );

  console.log(`✓ Prepared CDN release assets for v${version}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
