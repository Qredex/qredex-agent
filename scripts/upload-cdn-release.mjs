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

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { dirname, extname, resolve } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { isMissingR2ObjectError } from './cdn-r2-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const releaseRoot = resolve(rootDir, 'release', 'agent');
const channel = process.argv[2] || 'production';
const manifestPath =
  channel === 'production'
    ? resolve(releaseRoot, 'manifest.json')
    : resolve(releaseRoot, channel, 'manifest.json');
const bucket = process.env.QREDEX_CDN_BUCKET;

if (!bucket) {
  console.error('Missing QREDEX_CDN_BUCKET environment variable');
  process.exit(1);
}

if (!existsSync(manifestPath)) {
  console.error(`Missing ${manifestPath.replace(`${rootDir}/`, '')}. Run the matching CDN prepare command first.`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const assetFiles = manifest.files;

if (channel !== 'production' && channel !== 'staging' && channel !== 'dev') {
  console.error(`Unknown CDN upload channel "${channel}"`);
  process.exit(1);
}

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
  if (channel === 'production' && key.startsWith(`agent/v${manifest.version}/`)) {
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
      if (isMissingR2ObjectError(combinedOutput)) {
        return null;
      }

      throw new Error(`Failed to fetch ${key}\n${combinedOutput}`);
    }

    return JSON.parse(readFileSync(tempPath, 'utf8'));
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function updateReleaseHistory() {
  if (channel !== 'production') {
    return;
  }

  const historyKey = 'agent/releases.json';
  const existingHistory = readRemoteJson(historyKey);
  const releasedAt = new Date().toISOString();
  const nextEntry = {
    version: manifest.version,
    major: manifest.major,
    releasedAt,
    files: [...assetFiles],
  };

  const priorEntries = Array.isArray(existingHistory?.versions)
    ? existingHistory.versions.filter((entry) => entry?.version !== manifest.version)
    : [];

  const nextHistory = {
    channel: 'production',
    current: manifest.version,
    major: manifest.major,
    updatedAt: releasedAt,
    versions: [nextEntry, ...priorEntries],
  };

  const tempDir = createTempDir();
  const tempPath = resolve(tempDir, 'releases.json');

  try {
    const content = JSON.stringify(nextHistory, null, 2);
    writeFileSync(tempPath, `${content}\n`);
    uploadFile(tempPath, historyKey);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

try {
  for (const file of assetFiles) {
    if (channel === 'production') {
      const pinnedVersion = `v${manifest.version}`;
      uploadFile(resolve(releaseRoot, pinnedVersion, file), `agent/${pinnedVersion}/${file}`);
      uploadFile(resolve(releaseRoot, manifest.major, file), `agent/${manifest.major}/${file}`);
    } else if (channel === 'dev') {
      uploadFile(resolve(releaseRoot, 'dev', file), `agent/dev/${file}`);
    } else {
      uploadFile(resolve(releaseRoot, 'staging', file), `agent/staging/${file}`);
    }
  }

  uploadFile(
    manifestPath,
    channel === 'production' ? 'agent/manifest.json' : `agent/${channel}/manifest.json`
  );
  updateReleaseHistory();
  console.log(`✓ Uploaded CDN release assets to ${bucket}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
