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

import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const dryRun = process.argv.includes('--dry-run');
const useProvenance = process.env.QREDEX_NPM_PROVENANCE === 'true';

const publishTargets = [
  rootDir,
  resolve(rootDir, 'packages/react'),
  resolve(rootDir, 'packages/vue'),
  resolve(rootDir, 'packages/svelte'),
  resolve(rootDir, 'packages/angular'),
];

function run(command, args, cwd, encoding = 'utf8') {
  return spawnSync(command, args, {
    cwd,
    encoding,
    stdio: encoding ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
}

function getPackageMeta(cwd) {
  const packageJson = JSON.parse(readFileSync(resolve(cwd, 'package.json'), 'utf8'));

  return {
    name: packageJson.name,
    version: packageJson.version,
  };
}

function isAlreadyPublished(name, version) {
  const result = run('npm', ['view', `${name}@${version}`, 'version', '--json'], rootDir);
  const combinedOutput = `${result.stdout ?? ''}${result.stderr ?? ''}`;

  if (result.status === 0) {
    return true;
  }

  if (combinedOutput.includes('E404') || combinedOutput.includes('404')) {
    return false;
  }

  throw new Error(`Unable to check npm version for ${name}@${version}\n${combinedOutput}`);
}

for (const cwd of publishTargets) {
  const { name, version } = getPackageMeta(cwd);

  if (!dryRun && isAlreadyPublished(name, version)) {
    console.log(`↷ Skipping ${name}@${version}; already published`);
    continue;
  }

  const args = ['publish', '--access', 'public'];

  if (dryRun) {
    args.push('--dry-run');
  }

  if (useProvenance && !dryRun) {
    args.push('--provenance');
  }

  const result = run('npm', args, cwd, null);

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
