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
 *  You may not use this file except in compliance with that License.
 *  Unless required by applicable law or agreed to in writing, software distributed under the
 *  License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 *  either express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 *
 *  If you need additional information or have any questions, please email: copyright@qredex.com
 */

import { existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const packages = [
  {
    name: '@qredex/agent',
    cwd: rootDir,
    distEntry: 'dist/qredex-agent.es.js',
    expectedFiles: [
      'LICENSE',
      'README.md',
      'dist/index.d.ts',
      'dist/qredex-agent.es.js',
      'dist/qredex-agent.iife.js',
      'dist/qredex-agent.iife.min.js',
      'package.json',
    ],
    expectedExports: ['default', 'QredexAgent', 'handleCartChange', 'init'],
  },
  {
    name: '@qredex/react',
    cwd: resolve(rootDir, 'packages/react'),
    distEntry: 'dist/index.js',
    expectedFiles: ['LICENSE', 'README.md', 'dist/index.d.ts', 'dist/index.js', 'package.json'],
    expectedExports: ['QredexAgent', 'getQredexAgent', 'initQredex', 'useQredexAgent', 'useQredexState'],
  },
  {
    name: '@qredex/vue',
    cwd: resolve(rootDir, 'packages/vue'),
    distEntry: 'dist/index.js',
    expectedFiles: ['LICENSE', 'README.md', 'dist/index.d.ts', 'dist/index.js', 'package.json'],
    expectedExports: ['QredexAgent', 'createQredexPlugin', 'getQredexAgent', 'initQredex', 'useQredexAgent'],
  },
  {
    name: '@qredex/svelte',
    cwd: resolve(rootDir, 'packages/svelte'),
    distEntry: 'dist/index.js',
    expectedFiles: ['LICENSE', 'README.md', 'dist/index.d.ts', 'dist/index.js', 'package.json'],
    expectedExports: ['QredexAgent', 'createQredexStateStore', 'getQredexAgent', 'initQredex', 'useQredexAgent'],
  },
  {
    name: '@qredex/angular',
    cwd: resolve(rootDir, 'packages/angular'),
    distEntry: 'dist/index.js',
    expectedFiles: ['LICENSE', 'README.md', 'dist/index.d.ts', 'dist/index.js', 'package.json'],
    expectedExports: ['QREDEX_AGENT', 'QredexAgent', 'getQredexAgent', 'injectQredexAgent', 'provideQredexAgent'],
  },
];

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed in ${cwd}\n${result.stderr || result.stdout}`);
  }

  return result.stdout.trim();
}

function verifyPackedFiles(pkg) {
  const output = run('npm', ['pack', '--json', '--dry-run'], pkg.cwd);
  const packResult = JSON.parse(output);
  const files = Array.isArray(packResult) ? packResult[0].files : packResult.files;
  const packedPaths = new Set(files.map((file) => file.path));

  for (const file of pkg.expectedFiles) {
    if (!packedPaths.has(file)) {
      throw new Error(`${pkg.name} is missing packed file: ${file}`);
    }
  }
}

async function verifyModuleExports(pkg) {
  const distEntry = resolve(pkg.cwd, pkg.distEntry);

  if (!existsSync(distEntry)) {
    throw new Error(`${pkg.name} build output not found: ${pkg.distEntry}`);
  }

  const moduleExports = await import(pathToFileURL(distEntry).href);

  for (const exportName of pkg.expectedExports) {
    if (!(exportName in moduleExports)) {
      throw new Error(`${pkg.name} is missing export: ${exportName}`);
    }
  }
}

async function main() {
  for (const pkg of packages) {
    verifyPackedFiles(pkg);
    await verifyModuleExports(pkg);
    console.log(`✓ Verified ${pkg.name}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
