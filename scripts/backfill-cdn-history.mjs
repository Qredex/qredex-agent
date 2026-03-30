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
import { spawnSync } from 'child_process';
import { tmpdir } from 'os';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { isMissingR2ObjectError } from './cdn-r2-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const bucket = process.env.QREDEX_CDN_BUCKET;
const rawVersions = (
  process.env.OTA_INPUT_VERSIONS?.split(',') ?? process.argv.slice(2)
)
  .flatMap((value) => value.split(','))
  .map((value) => value.trim())
  .filter(Boolean);
const assetFiles = ['qredex-agent.iife.min.js', 'qredex-agent.iife.min.js.map'];

if (!bucket) {
  console.error('Missing QREDEX_CDN_BUCKET environment variable');
  process.exit(1);
}

if (rawVersions.length === 0) {
  console.error('Provide one or more versions to backfill, for example: ota run release:cdn:backfill --versions 1.0.0,1.0.1');
  console.error('Or: node scripts/backfill-cdn-history.mjs 1.0.0 1.0.1');
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

function fetchRemoteObject(key) {
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

    const combinedOutput = `${result.stdout ?? ''}${result.stderr ?? ''}`;
    if (result.status !== 0) {
      if (isMissingR2ObjectError(combinedOutput)) {
        return false;
      }

      throw new Error(`Failed to fetch ${key}\n${combinedOutput}`);
    }

    return existsSync(tempPath);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function uploadFile(localPath, key) {
  const result = spawnSync(
    'npm',
    ['exec', '--', 'wrangler', 'r2', 'object', 'put', `${bucket}/${key}`, '--file', localPath, '--remote', '--content-type', 'application/json', '--cache-control', 'public, max-age=300, must-revalidate'],
    {
      cwd: rootDir,
      stdio: 'inherit',
    }
  );

  if (result.status !== 0) {
    throw new Error(`Failed to upload ${key}`);
  }
}

function compareVersions(left, right) {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);

  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const difference = (rightParts[index] ?? 0) - (leftParts[index] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}

const invalidVersions = rawVersions.filter((version) => !/^\d+\.\d+\.\d+$/.test(version));
if (invalidVersions.length > 0) {
  console.error(`Invalid versions: ${invalidVersions.join(', ')}`);
  process.exit(1);
}

try {
  const manifest = readRemoteJson('agent/manifest.json');
  const existingHistory = readRemoteJson('agent/releases.json');

  if (!manifest) {
    console.error('Missing agent/manifest.json in the CDN bucket');
    process.exit(1);
  }

  for (const version of rawVersions) {
    for (const file of assetFiles) {
      const key = `agent/v${version}/${file}`;
      const exists = fetchRemoteObject(key);
      if (!exists) {
        console.error(`Missing pinned CDN object: ${key}`);
        process.exit(1);
      }
    }
  }

  const releasedAt = new Date().toISOString();
  const existingEntries = Array.isArray(existingHistory?.versions) ? existingHistory.versions : [];
  const nextEntriesByVersion = new Map(existingEntries.map((entry) => [entry.version, entry]));

  for (const version of rawVersions) {
    if (!nextEntriesByVersion.has(version)) {
      nextEntriesByVersion.set(version, {
        version,
        major: `v${version.split('.')[0]}`,
        releasedAt: null,
        backfilledAt: releasedAt,
        files: [...assetFiles],
      });
    }
  }

  const nextHistory = {
    channel: 'production',
    current: existingHistory?.current ?? manifest.version,
    major: existingHistory?.major ?? manifest.major,
    updatedAt: releasedAt,
    versions: [...nextEntriesByVersion.values()].sort((left, right) => compareVersions(left.version, right.version)),
  };

  const tempDir = createTempDir();
  const tempPath = resolve(tempDir, 'releases.json');

  try {
    writeFileSync(tempPath, `${JSON.stringify(nextHistory, null, 2)}\n`);
    uploadFile(tempPath, 'agent/releases.json');
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }

  console.log(`Backfilled CDN history for: ${rawVersions.join(', ')}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
