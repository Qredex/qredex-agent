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
const channel = process.argv[2] || 'production';
const updatedAt = new Date().toISOString();

const channelConfig = {
  dev: {
    assetMap: {
      'qredex-agent.iife.dev.min.js': 'qredex-agent.iife.min.js',
      'qredex-agent.iife.dev.min.js.map': 'qredex-agent.iife.min.js.map',
    },
    targetDirs: [resolve(releaseRoot, 'dev')],
    manifestPath: resolve(releaseRoot, 'dev', 'manifest.json'),
    manifest: {
      channel: 'dev',
      version,
      updatedAt,
      files: ['qredex-agent.iife.min.js', 'qredex-agent.iife.min.js.map'],
      lockEndpoint: 'http://127.0.0.1:8080/api/v1/agent/intents/lock',
    },
  },
  production: {
    assetMap: {
      'qredex-agent.iife.min.js': 'qredex-agent.iife.min.js',
      'qredex-agent.iife.min.js.map': 'qredex-agent.iife.min.js.map',
    },
    targetDirs: [resolve(releaseRoot, `v${version}`), resolve(releaseRoot, `v${majorVersion}`)],
    manifestPath: resolve(releaseRoot, 'manifest.json'),
    manifest: {
      channel: 'production',
      version,
      updatedAt,
      major: `v${majorVersion}`,
      files: ['qredex-agent.iife.min.js', 'qredex-agent.iife.min.js.map'],
    },
  },
  staging: {
    assetMap: {
      'qredex-agent.iife.stage.min.js': 'qredex-agent.iife.min.js',
      'qredex-agent.iife.stage.min.js.map': 'qredex-agent.iife.min.js.map',
    },
    targetDirs: [resolve(releaseRoot, 'staging')],
    manifestPath: resolve(releaseRoot, 'staging', 'manifest.json'),
    manifest: {
      channel: 'staging',
      version,
      updatedAt,
      files: ['qredex-agent.iife.min.js', 'qredex-agent.iife.min.js.map'],
    },
  },
}[channel];

if (!channelConfig) {
  console.error(`Unknown CDN release channel "${channel}"`);
  process.exit(1);
}

function ensureAsset(file) {
  const path = resolve(distDir, file);

  if (!existsSync(path)) {
    throw new Error(`Missing CDN asset: dist/${file}`);
  }

  return path;
}

function copyAssets(targetDir) {
  mkdirSync(targetDir, { recursive: true });

  for (const [sourceFile, outputFile] of Object.entries(channelConfig.assetMap)) {
    copyFileSync(ensureAsset(sourceFile), resolve(targetDir, outputFile));
  }
}

try {
  for (const targetDir of channelConfig.targetDirs) {
    copyAssets(targetDir);
  }

  writeFileSync(
    channelConfig.manifestPath,
    JSON.stringify(channelConfig.manifest, null, 2)
  );

  console.log(`✓ Prepared ${channel} CDN release assets for v${version}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
