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

import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { spawnSync } from 'child_process';
import { tmpdir } from 'os';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const bucket = process.env.QREDEX_CDN_BUCKET;

if (!bucket) {
  console.error('Missing QREDEX_CDN_BUCKET environment variable');
  process.exit(1);
}

function createTempDir() {
  return mkdtempSync(resolve(tmpdir(), 'qredex-cdn-'));
}

function readRemoteJson(key) {
  const tempDir = createTempDir();
  const tempPath = resolve(tempDir, key.replace(/\//g, '__'));

  try {
    const result = spawnSync(
      'npm',
      ['exec', '--', 'wrangler', 'r2', 'object', 'get', `${bucket}/${key}`, '--file', tempPath, '--remote'],
      {
        cwd: rootDir,
        encoding: 'utf8',
      }
    );

    if (result.status !== 0) {
      const combinedOutput = `${result.stdout ?? ''}${result.stderr ?? ''}`;
      if (combinedOutput.includes('NotFound') || combinedOutput.includes('No such object') || combinedOutput.includes('404')) {
        return null;
      }

      throw new Error(`Failed to fetch ${key}\n${combinedOutput}`);
    }

    return JSON.parse(readFileSync(tempPath, 'utf8'));
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

try {
  const manifest = readRemoteJson('agent/manifest.json');
  const history = readRemoteJson('agent/releases.json');

  if (!manifest) {
    console.error('Missing agent/manifest.json in the CDN bucket');
    process.exit(1);
  }

  console.log(`Current production CDN version: ${manifest.version}`);
  console.log(`Current major alias: ${manifest.major}`);

  if (!history || !Array.isArray(history.versions) || history.versions.length === 0) {
    console.log('No agent/releases.json history found yet.');
    process.exit(0);
  }

  console.log('Known pinned CDN releases:');
  for (const entry of history.versions) {
    console.log(`- v${entry.version} (${entry.releasedAt ?? 'unknown release time'})`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
