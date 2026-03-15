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
 * Bun build script for qredex-agent.
 * Produces minified ESM and UMD bundles with type definitions.
 *
 * Usage:
 *   bun run build:bun         # Production build
 *   bun run build:bun:dev     # Development build (keeps console)
 */

import { build } from 'bun';
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { gzipSync } from 'zlib';

const __dirname = import.meta.dir;
const distDir = join(__dirname, 'dist');
const srcDir = join(__dirname, 'src');
const entryPoint = join(srcDir, 'index.ts');

// Clean dist directory
if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true });
}
mkdirSync(distDir);

const mode = process.env.BUN_MODE || 'production';
const isProduction = mode === 'production';

console.log(`Building qredex-agent in ${mode} mode...\n`);

// Build ESM bundle
console.log('Building ESM bundle...');
const esmBuild = await build({
  entrypoints: [entryPoint],
  outdir: distDir,
  target: 'browser',
  format: 'esm',
  minify: true,
  sourcemap: true,
  naming: 'qredex-agent.js',
  define: {
    __DEV__: JSON.stringify(!isProduction),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
});
console.log('ESM build:', esmBuild.outputs.length > 0 ? '✓' : '✗');

// Build UMD bundle (IIFE format)
console.log('Building UMD bundle...');
const umdBuild = await build({
  entrypoints: [entryPoint],
  outdir: distDir,
  target: 'browser',
  format: 'iife',
  minify: true,
  sourcemap: true,
  naming: 'qredex-agent.umd.cjs',
  globalName: 'QredexAgent',
  define: {
    __DEV__: JSON.stringify(!isProduction),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
});
console.log('UMD build:', umdBuild.outputs.length > 0 ? '✓' : '✗');

// Post-process: Remove console statements in production
if (isProduction) {
  console.log('Stripping console statements for production...');
  const umdPath = join(distDir, 'qredex-agent.umd.cjs');
  const esmPath = join(distDir, 'qredex-agent.js');

  // Simple regex to remove console.* calls
  const stripConsole = (code: string) => {
    return code.replace(/console\.(log|info|warn|error|debug)\([^)]*\)/g, '');
  };

  const umdContent = readFileSync(umdPath, 'utf-8');
  const esmContent = readFileSync(esmPath, 'utf-8');

  writeFileSync(umdPath, stripConsole(umdContent), 'utf-8');
  writeFileSync(esmPath, stripConsole(esmContent), 'utf-8');

  console.log('Console stripped: ✓');
}

// Generate type definitions using tsc
console.log('Generating type definitions...');
const { $ } = await import('bun');
await $`bun run tsc --project tsconfig.build.json`.quiet();
console.log('Types generated: ✓');

// Get file sizes
function getFileStats(file: string) {
  const content = readFileSync(file);
  const gzipped = gzipSync(content);
  return {
    size: (content.length / 1024).toFixed(2),
    gzip: (gzipped.length / 1024).toFixed(2),
  };
}

const esmFile = join(distDir, 'qredex-agent.js');
const umdFile = join(distDir, 'qredex-agent.umd.cjs');

const esmStats = getFileStats(esmFile);
const umdStats = getFileStats(umdFile);

console.log('\nBuild complete!\n');
console.log(`  qredex-agent.js       ${esmStats.size} KB │ gzip: ${esmStats.gzip} KB`);
console.log(`  qredex-agent.umd.cjs  ${umdStats.size} KB │ gzip: ${umdStats.gzip} KB`);
console.log('');
