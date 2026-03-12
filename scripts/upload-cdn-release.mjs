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

import { existsSync, readFileSync } from 'fs';
import { dirname, extname, resolve } from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const releaseRoot = resolve(rootDir, 'release', 'agent');
const manifestPath = resolve(releaseRoot, 'manifest.json');
const bucket = process.env.QREDEX_CDN_BUCKET;

if (!bucket) {
  console.error('Missing QREDEX_CDN_BUCKET environment variable');
  process.exit(1);
}

if (!existsSync(manifestPath)) {
  console.error('Missing release/agent/manifest.json. Run npm run release:cdn first.');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const pinnedVersion = `v${manifest.version}`;
const aliasVersion = manifest.major;
const assetFiles = manifest.files;

function getContentType(filePath) {
  switch (extname(filePath)) {
    case '.js':
      return 'application/javascript';
    case '.map':
    case '.json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}

function getCacheControl(key) {
  if (key.startsWith(`agent/${pinnedVersion}/`)) {
    return 'public, max-age=31536000, immutable';
  }

  return 'public, max-age=300, must-revalidate';
}

function uploadFile(localPath, key) {
  if (!existsSync(localPath)) {
    throw new Error(`Missing release asset: ${localPath}`);
  }

  const args = [
    'exec',
    '--',
    'wrangler',
    'r2',
    'object',
    'put',
    `${bucket}/${key}`,
    '--file',
    localPath,
    '--remote',
    '--content-type',
    getContentType(localPath),
    '--cache-control',
    getCacheControl(key),
  ];

  const result = spawnSync('npm', args, {
    cwd: rootDir,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`Failed to upload ${key}`);
  }
}

try {
  for (const file of assetFiles) {
    uploadFile(resolve(releaseRoot, pinnedVersion, file), `agent/${pinnedVersion}/${file}`);
    uploadFile(resolve(releaseRoot, aliasVersion, file), `agent/${aliasVersion}/${file}`);
  }

  uploadFile(manifestPath, 'agent/manifest.json');
  console.log(`✓ Uploaded CDN release assets to ${bucket}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
